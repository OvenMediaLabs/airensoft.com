#!/usr/bin/env python3
"""
Migrate a Medium "Download your information" export into Docusaurus blog
posts under blog/<YYYY-MM-DD>-<slug>/.

Usage:
  scripts/migrate-medium.py <export-dir>

What it does:
  1. Walks <export-dir>/posts/*.html.
  2. Extracts title, subtitle, publish date, canonical URL, and body.
  3. Converts the body HTML to MDX (lists, code fences, figures, YouTube
     embeds, link previews, etc.) while escaping MDX hazards ({ } < that
     aren't tag starts).
  4. Downloads every referenced Medium CDN image into the post's
     directory and rewrites src= to a relative path.
  5. Writes blog/<YYYY-MM-DD>-<slug>/index.mdx with frontmatter
     (slug, title, description, authors, date, tags, canonical_url, image).
  6. Auto-assigns tags from the title (webrtc / llhls / srt / sub-second-
     latency / ome / fundamentals).
  7. Writes scripts/medium-redirects.json so a redirect layer can map
     each Medium canonical URL back to the new blog path.

Reads only stdlib. Safe to re-run — overwrites the post directory.
"""

from __future__ import annotations

import argparse
import html as htmllib
import html.parser
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent
BLOG_DIR = ROOT / "blog"


# ---------------- Post metadata extraction ----------------

_TITLE_RE = re.compile(
    r'<h1[^>]*class="[^"]*p-name[^"]*"[^>]*>(.*?)</h1>',
    re.DOTALL,
)
_SUBTITLE_RE = re.compile(
    r'<section[^>]+data-field="subtitle"[^>]*>(.*?)</section>',
    re.DOTALL,
)
_BODY_RE = re.compile(
    r'<section[^>]+data-field="body"[^>]*>(.*)</section>\s*<footer',
    re.DOTALL,
)
_TIME_RE = re.compile(
    r'<time[^>]+datetime="([^"]+)"',
)
_CANONICAL_RE = re.compile(
    r'<a[^>]+href="([^"]+)"[^>]*class="[^"]*p-canonical[^"]*"',
)
_FILENAME_RE = re.compile(
    r"^(\d{4}-\d{2}-\d{2})_(.+?)-([0-9a-f]{12})\.html$"
)


def strip_tags(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s)


def decode_entities(s: str) -> str:
    return htmllib.unescape(s)


def normalize_text(s: str) -> str:
    return decode_entities(strip_tags(s)).strip()


def slugify(name: str, max_len: int = 80) -> str:
    s = name.lower()
    s = re.sub(r"&[a-z]+;", " ", s)  # leftover entities
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    if len(s) <= max_len:
        return s
    # Trim to last word boundary that fits.
    cut = s.rfind("-", 0, max_len + 1)
    return s[:cut] if cut > 0 else s[:max_len]


# ---------------- HTML → Markdown converter ----------------

@dataclass
class ListFrame:
    kind: str  # "ul" or "ol"
    index: int = 0


@dataclass
class ConvState:
    out: list[str] = field(default_factory=list)
    pre_lines: list[str] = field(default_factory=list)
    in_pre: bool = False
    pre_lang: str = ""
    lists: list[ListFrame] = field(default_factory=list)
    in_li: bool = False
    in_blockquote: bool = False
    in_figure: bool = False
    figure_iframe_src: str = ""
    figure_img_src: str = ""
    figure_caption: list[str] = field(default_factory=list)
    figure_in_caption: bool = False
    in_mixtape: bool = False
    mixtape_href: str = ""
    mixtape_title: list[str] = field(default_factory=list)
    mixtape_in_strong: bool = False
    skip_first_title: bool = True  # the first <h3 class="graf--title"> repeats the H1
    a_stack: list[str] = field(default_factory=list)  # hrefs of open <a>
    a_text_stack: list[list[str]] = field(default_factory=list)  # collected text per <a>
    inline_buf: list[str] = field(default_factory=list)
    block_stack: list[str] = field(default_factory=list)  # h1..h4 / p / li / blockquote

    def write(self, s: str) -> None:
        if self.a_text_stack:
            self.a_text_stack[-1].append(s)
        elif self.in_pre:
            self.pre_lines.append(s)
        elif self.in_mixtape:
            self.mixtape_title.append(s)
        elif self.in_figure and self.figure_in_caption:
            self.figure_caption.append(s)
        elif self.in_figure:
            pass  # ignore stray text inside figure
        else:
            self.inline_buf.append(s)

    def flush_block(self, prefix: str = "", suffix: str = "\n\n") -> None:
        text = "".join(self.inline_buf).strip()
        self.inline_buf.clear()
        if not text:
            return
        self.out.append(f"{prefix}{text}{suffix}")

    def list_prefix(self) -> str:
        if not self.lists:
            return ""
        indent = "  " * (len(self.lists) - 1)
        top = self.lists[-1]
        if top.kind == "ol":
            top.index += 1
            return f"{indent}{top.index}. "
        return f"{indent}- "


# Escape MDX hazards in inline text. Code fences and code spans are
# handled separately so this only runs for prose text. Data reaching
# `handle_data` is always character data (not tags), so any `<` we see
# here is content and must be escaped — otherwise MDX tries to parse
# things like `<Instance_IP>` as a JSX component.
def escape_mdx_inline(text: str) -> str:
    text = text.replace("{", "&#123;").replace("}", "&#125;")
    text = text.replace("<", "&lt;")
    return text


class MediumConverter(html.parser.HTMLParser):
    """Walks Medium's exported body HTML and emits Markdown/MDX."""

    HEADING = {"h1": "#", "h2": "##", "h3": "##", "h4": "###", "h5": "####"}

    def __init__(self, image_resolver):
        super().__init__(convert_charrefs=True)
        self.s = ConvState()
        self.image_resolver = image_resolver  # callable(src) -> local relative path

    # ----- entry points -----
    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        a = dict(attrs)
        cls = a.get("class", "") or ""

        if tag == "pre":
            self.s.in_pre = True
            self.s.pre_lang = a.get("data-code-block-lang", "") or ""
            self.s.pre_lines = []
            return

        if self.s.in_pre:
            # Inside <pre>, preserve <br> as newline; ignore other tags.
            if tag == "br":
                self.s.pre_lines.append("\n")
            return

        if tag == "figure":
            self._flush_paragraph()
            self.s.in_figure = True
            self.s.figure_iframe_src = ""
            self.s.figure_img_src = ""
            self.s.figure_caption = []
            self.s.figure_in_caption = False
            return

        if self.s.in_figure:
            if tag == "img":
                self.s.figure_img_src = a.get("src", "") or ""
            elif tag == "iframe":
                self.s.figure_iframe_src = a.get("src", "") or ""
            elif tag == "figcaption":
                self.s.figure_in_caption = True
            return

        if tag == "div" and "graf--mixtapeEmbed" in cls:
            self._flush_paragraph()
            self.s.in_mixtape = True
            self.s.mixtape_href = ""
            self.s.mixtape_title = []
            return

        if self.s.in_mixtape:
            if tag == "a" and not self.s.mixtape_href:
                self.s.mixtape_href = a.get("href", "") or ""
            elif tag in ("strong", "b"):
                self.s.mixtape_in_strong = True
            return

        if tag in self.HEADING:
            self._flush_paragraph()
            if (
                tag == "h3"
                and self.s.skip_first_title
                and "graf--title" in cls
            ):
                self.s.skip_first_title = False
                self.s.block_stack.append("__skip__")
                return
            self.s.skip_first_title = False
            self.s.block_stack.append(tag)
            return

        if tag == "p":
            self._flush_paragraph()
            self.s.block_stack.append("p")
            return

        if tag in ("ul", "ol"):
            self._flush_paragraph()
            self.s.lists.append(ListFrame(kind=tag))
            return

        if tag == "li":
            self._flush_paragraph()
            self.s.in_li = True
            self.s.block_stack.append("li")
            self.s.inline_buf.append(self.s.list_prefix())
            return

        if tag == "blockquote":
            self._flush_paragraph()
            self.s.in_blockquote = True
            self.s.block_stack.append("blockquote")
            return

        if tag == "hr":
            # Medium emits <hr class="section-divider"> between body
            # sections — those are layout noise, drop them.
            if "section-divider" in cls:
                return
            self._flush_paragraph()
            self.s.out.append("---\n\n")
            return

        if tag == "br":
            # Inside paragraphs Medium uses <br> for soft breaks.
            self.s.inline_buf.append("  \n")
            return

        if tag in ("strong", "b"):
            self.s.write("**")
            return
        if tag in ("em", "i"):
            self.s.write("*")
            return
        if tag == "code":
            self.s.write("`")
            return

        if tag == "a":
            href = a.get("href", "") or ""
            self.s.a_stack.append(href)
            self.s.a_text_stack.append([])
            return

        if tag == "img":
            # Inline image outside a <figure>: rare in Medium exports.
            src = a.get("src", "") or ""
            local = self.image_resolver(src)
            if local:
                self.s.inline_buf.append(f"![]({local})")
            return

    def handle_endtag(self, tag: str) -> None:
        if tag == "pre":
            self._emit_codeblock()
            self.s.in_pre = False
            return

        if self.s.in_pre:
            return

        if tag == "figure" and self.s.in_figure:
            self._emit_figure()
            self.s.in_figure = False
            return

        if self.s.in_figure:
            if tag == "figcaption":
                self.s.figure_in_caption = False
            return

        if self.s.in_mixtape:
            if tag in ("strong", "b"):
                self.s.mixtape_in_strong = False
                return
            if tag == "div":
                self._emit_mixtape()
                self.s.in_mixtape = False
                return
            return

        if tag in self.HEADING:
            top = self.s.block_stack.pop() if self.s.block_stack else ""
            if top == "__skip__":
                self.s.inline_buf.clear()
                return
            level = self.HEADING[tag]
            self._flush_paragraph(prefix=f"{level} ")
            return

        if tag == "p":
            if self.s.block_stack and self.s.block_stack[-1] == "p":
                self.s.block_stack.pop()
            if self.s.in_li:
                # paragraph inside li → soft break
                self.s.inline_buf.append("\n")
                return
            if self.s.in_blockquote:
                self._flush_paragraph(prefix="> ")
                return
            self._flush_paragraph()
            return

        if tag in ("ul", "ol"):
            if self.s.lists:
                self.s.lists.pop()
            if not self.s.lists:
                # End of outermost list — guarantee a blank line so the
                # next heading/paragraph isn't fused onto the last item.
                self._flush_paragraph()
                if self.s.out and not self.s.out[-1].endswith("\n\n"):
                    self.s.out.append("\n")
            return

        if tag == "li":
            if self.s.block_stack and self.s.block_stack[-1] == "li":
                self.s.block_stack.pop()
            text = "".join(self.s.inline_buf).rstrip()
            self.s.inline_buf.clear()
            if text:
                self.s.out.append(text + "\n")
            self.s.in_li = False
            return

        if tag == "blockquote":
            self.s.in_blockquote = False
            if self.s.block_stack and self.s.block_stack[-1] == "blockquote":
                self.s.block_stack.pop()
            return

        if tag in ("strong", "b"):
            self.s.write("**")
            return
        if tag in ("em", "i"):
            self.s.write("*")
            return
        if tag == "code":
            self.s.write("`")
            return

        if tag == "a":
            if not self.s.a_stack:
                return
            href = self.s.a_stack.pop()
            text_parts = self.s.a_text_stack.pop()
            text = "".join(text_parts).strip()
            if not text:
                text = href
            if href:
                rendered = f"[{text}]({href})"
            else:
                rendered = text
            self.s.inline_buf.append(rendered)
            return

    def handle_data(self, data: str) -> None:
        if not data:
            return
        if self.s.in_pre:
            self.s.pre_lines.append(data)
            return
        if self.s.in_mixtape:
            if self.s.mixtape_in_strong:
                self.s.mixtape_title.append(data)
            return
        if self.s.in_figure and self.s.figure_in_caption:
            self.s.figure_caption.append(data)
            return
        if self.s.in_figure:
            return
        if self.s.a_text_stack:
            self.s.a_text_stack[-1].append(data)
            return
        self.s.inline_buf.append(escape_mdx_inline(data))

    # ----- block emitters -----
    def _flush_paragraph(self, prefix: str = "") -> None:
        text = "".join(self.s.inline_buf)
        self.s.inline_buf.clear()
        # Trim trailing whitespace but keep internal soft breaks.
        stripped = text.strip()
        if not stripped:
            return
        if prefix:
            self.s.out.append(f"{prefix}{stripped}\n\n")
        else:
            self.s.out.append(f"{stripped}\n\n")

    def _emit_codeblock(self) -> None:
        raw = "".join(self.s.pre_lines)
        # Medium adds zero-width chars and trailing newlines from <br>.
        raw = raw.replace(" ", " ").rstrip("\n")
        lang = self.s.pre_lang or ""
        self.s.out.append(f"```{lang}\n{raw}\n```\n\n")

    def _emit_figure(self) -> None:
        if self.s.figure_iframe_src:
            src = self.s.figure_iframe_src
            yt = re.match(r"https?://www\.youtube\.com/embed/([\w-]+)", src)
            if yt:
                video_id = yt.group(1).split("?")[0]
                self.s.out.append(
                    f'<iframe width="560" height="315" '
                    f'src="https://www.youtube.com/embed/{video_id}" '
                    f'title="YouTube video" frameborder="0" '
                    f'allow="accelerometer; autoplay; clipboard-write; '
                    f'encrypted-media; gyroscope; picture-in-picture" '
                    f'allowfullscreen></iframe>\n\n'
                )
            else:
                self.s.out.append(f'<iframe src="{src}" frameborder="0"></iframe>\n\n')
            return
        if self.s.figure_img_src:
            local = self.image_resolver(self.s.figure_img_src)
            if local:
                caption = decode_entities("".join(self.s.figure_caption)).strip()
                alt = caption.replace("]", "")
                if caption:
                    self.s.out.append(f"![{alt}]({local})\n\n*{caption}*\n\n")
                else:
                    self.s.out.append(f"![]({local})\n\n")

    def _emit_mixtape(self) -> None:
        title = "".join(self.s.mixtape_title).strip()
        href = self.s.mixtape_href
        if href and title:
            self.s.out.append(f"[{title}]({href})\n\n")

    def render(self) -> str:
        self._flush_paragraph()
        text = "".join(self.s.out)
        # Collapse any runs of 3+ blank lines.
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip() + "\n"


# ---------------- Image download ----------------

_IMG_NAME_RE = re.compile(r"([01]\*[A-Za-z0-9_\-]+\.\w+)$")


def medium_image_filename(url: str) -> str:
    """Extract a stable filename from a Medium CDN URL.

    Medium asset paths look like `1*<hash>.png`. The `*` is legal on
    POSIX filesystems but breaks Docusaurus's webpack import (which
    interprets `*` as a glob), so we replace it with `-`.
    """
    path = urllib.parse.urlparse(url).path
    m = _IMG_NAME_RE.search(path)
    name = m.group(1) if m else (os.path.basename(path) or "image.png")
    return name.replace("*", "-")


def upgrade_image_url(url: str) -> str:
    """Medium thumbnails come at /max/800/...; bump to a larger size."""
    return re.sub(r"/max/\d+/", "/max/1600/", url)


def download_image(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return True
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (medium-migration)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"  ! failed to download {url}: {exc}", file=sys.stderr)
        return False


# ---------------- Tag auto-assignment ----------------

def auto_tags(title: str) -> list[str]:
    t = title.lower()
    tags: list[str] = []
    if "webrtc" in t:
        tags.append("webrtc")
    if "llhls" in t or "ll-hls" in t or "low-latency hls" in t or "low latency hls" in t:
        tags.append("llhls")
    elif "hls" in t:
        tags.append("llhls")
    if "srt" in t:
        tags.append("srt")
    if "sub-second" in t or "sub second" in t or "low latency" in t or "low-latency" in t:
        tags.append("sub-second-latency")
    if t.startswith("what is") or t.startswith("what are"):
        tags.append("fundamentals")
    if "ovenmediaengine" in t or "ome " in t or "ovenstudio" in t:
        tags.append("ome")
    if not tags:
        tags.append("ome")
    # de-dupe, preserve order
    seen: set[str] = set()
    out: list[str] = []
    for tag in tags:
        if tag not in seen:
            seen.add(tag)
            out.append(tag)
    return out


# ---------------- Post processing ----------------

@dataclass
class Post:
    src_path: Path
    title: str
    subtitle: str
    body_html: str
    iso_date: str
    canonical_url: str
    slug: str

    @property
    def date(self) -> str:
        return self.iso_date[:10]

    @property
    def dir_name(self) -> str:
        return f"{self.date}-{self.slug}"


def parse_post(src: Path) -> Optional[Post]:
    raw = src.read_text(encoding="utf-8")

    m = _TITLE_RE.search(raw)
    if not m:
        print(f"skip (no title): {src.name}", file=sys.stderr)
        return None
    title = normalize_text(m.group(1)).replace(" ", " ")
    title = title.replace("—", "—")  # noop; placeholder if we ever normalize

    m = _SUBTITLE_RE.search(raw)
    subtitle = normalize_text(m.group(1)) if m else ""

    m = _BODY_RE.search(raw)
    if not m:
        print(f"skip (no body): {src.name}", file=sys.stderr)
        return None
    body_html = m.group(1)

    m = _TIME_RE.search(raw)
    iso = m.group(1) if m else ""

    m = _CANONICAL_RE.search(raw)
    canonical = m.group(1) if m else ""

    fn_match = _FILENAME_RE.match(src.name)
    if fn_match:
        date_part = fn_match.group(1)
        title_part = fn_match.group(2)
        slug = slugify(title_part)
        if not iso:
            iso = f"{date_part}T00:00:00.000Z"
    else:
        slug = slugify(title)

    return Post(
        src_path=src,
        title=title,
        subtitle=subtitle,
        body_html=body_html,
        iso_date=iso,
        canonical_url=canonical,
        slug=slug,
    )


def yaml_str(value: str) -> str:
    # Single-line YAML string. Use double quotes; escape backslashes/quotes.
    safe = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{safe}"'


def convert_post(post: Post, out_root: Path) -> None:
    post_dir = out_root / post.dir_name
    post_dir.mkdir(parents=True, exist_ok=True)

    used_names: dict[str, str] = {}
    featured: str = ""

    def resolve_image(src: str) -> str:
        nonlocal featured
        if not src:
            return ""
        upgraded = upgrade_image_url(src)
        name = medium_image_filename(upgraded)
        # Avoid name collisions across distinct URLs.
        if name in used_names and used_names[name] != upgraded:
            stem, dot, ext = name.partition(".")
            i = 2
            while True:
                candidate = f"{stem}-{i}{('.' + ext) if dot else ''}"
                if candidate not in used_names or used_names[candidate] == upgraded:
                    name = candidate
                    break
                i += 1
        used_names[name] = upgraded
        dest = post_dir / name
        ok = download_image(upgraded, dest)
        if not ok:
            return ""
        if not featured:
            featured = f"./{name}"
        return f"./{name}"

    converter = MediumConverter(image_resolver=resolve_image)
    converter.feed(post.body_html)
    body_md = converter.render()

    tags = auto_tags(post.title)

    fm_lines = [
        "---",
        f"slug: {post.slug}",
        f"title: {yaml_str(post.title)}",
    ]
    if post.subtitle:
        fm_lines.append(f"description: {yaml_str(post.subtitle)}")
    fm_lines.append("authors: [ovenmedialabs]")
    if post.iso_date:
        fm_lines.append(f"date: {post.iso_date}")
    fm_lines.append("tags: [" + ", ".join(tags) + "]")
    if featured:
        fm_lines.append(f"image: {featured}")
    if post.canonical_url:
        fm_lines.append(f"canonical_url: {yaml_str(post.canonical_url)}")
    fm_lines.append("---")
    fm = "\n".join(fm_lines) + "\n\n"

    # Add a {/* truncate */} marker after the first paragraph so the blog
    # index shows a clean preview.
    body_md = insert_truncate_marker(body_md)

    (post_dir / "index.mdx").write_text(fm + body_md, encoding="utf-8")
    print(f"✔ {post.dir_name}  ({len(used_names)} images)")


def insert_truncate_marker(body: str) -> str:
    # Insert after the first non-heading paragraph.
    paragraphs = body.split("\n\n")
    for i, para in enumerate(paragraphs):
        stripped = para.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            continue
        if stripped.startswith("!["):
            continue
        if stripped.startswith("<iframe"):
            continue
        paragraphs.insert(i + 1, "{/* truncate */}")
        return "\n\n".join(paragraphs)
    return body


# ---------------- Main ----------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("export_dir", help="Path to the Medium export directory")
    ap.add_argument(
        "--limit", type=int, default=0, help="Process only N posts (for testing)"
    )
    ap.add_argument(
        "--only", default="", help="Only the post whose filename contains this string"
    )
    args = ap.parse_args()

    export = Path(args.export_dir).expanduser().resolve()
    posts_dir = export / "posts"
    if not posts_dir.is_dir():
        print(f"no posts/ under {export}", file=sys.stderr)
        return 1

    files = sorted(posts_dir.glob("*.html"))
    if args.only:
        files = [f for f in files if args.only in f.name]
    if args.limit:
        files = files[: args.limit]

    BLOG_DIR.mkdir(parents=True, exist_ok=True)

    converted: list[Post] = []
    for src in files:
        post = parse_post(src)
        if post is None:
            continue
        convert_post(post, BLOG_DIR)
        converted.append(post)

    write_redirects_json(converted)

    print(f"\nDone. Wrote {len(converted)} posts under {BLOG_DIR.relative_to(ROOT)}/")
    return 0


def write_redirects_json(posts: list[Post]) -> None:
    entries = [
        {
            "medium_url": p.canonical_url,
            "new_path": f"/blog/{p.slug}",
            "date": p.date,
            "title": p.title,
        }
        for p in posts
        if p.canonical_url
    ]
    if not entries:
        return
    dest = ROOT / "scripts" / "medium-redirects.json"
    dest.write_text(
        json.dumps(entries, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"✔ wrote {dest.relative_to(ROOT)} ({len(entries)} entries)")


if __name__ == "__main__":
    sys.exit(main())
