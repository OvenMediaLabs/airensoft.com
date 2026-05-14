#!/usr/bin/env python3
"""
Migrate GitBook-flavored docs from a product repo into the local
`docs/<id>/` directory used by airensoft.com's multi-instance Docusaurus
setup.

Supported sources (selected via `--source <id>`):
  ome              OvenMediaLabs/OvenMediaEngine             docs/ (public)
  ome-enterprise   OvenMediaLabs/OvenMediaEngineEnterprise   docs-enterprise/ (private)
  ovenplayer       OvenMediaLabs/OvenPlayer                  docs/ (public)

Private repos need a GitHub PAT via the GITHUB_TOKEN environment variable
(or repo-specific overrides — see the SOURCES table below). A token loaded
from `.env.local` works too if you `set -a; source .env.local; set +a`
before running.

What it does:
  1. Fetches SUMMARY.md to learn the doc tree (titles + paths + order).
  2. Fetches every referenced .md file via raw.githubusercontent.com.
  3. Rewrites GitBook-flavored markdown to Docusaurus-flavored MDX:
       {% hint style="info" %}...{% endhint %}  ->  :::info ... :::
       {% tabs %}{% tab title="X" %}...{% endtab %}...{% endtabs %}
                                                ->  <Tabs><TabItem>...</TabItem></Tabs>
       {% code title="..." %}...{% endcode %}   ->  ```... (with title)
       {% page-ref page="..." %}                ->  plain markdown link
       Image refs to .gitbook/assets/...        ->  relative ../images/<asset>
  4. Hoists the first H1 into frontmatter `title:` and assigns
     `sidebar_position:` from SUMMARY order so the sidebar reflects the
     GitBook ordering.
  5. Downloads referenced assets into docs/<id>/images/.
  6. Writes per-directory `_category_.json` for category labels.
  7. Generates sidebars-<id>.ts that autogenerates from frontmatter.

Run:
  python3 scripts/migrate-docs.py --source ome
  python3 scripts/migrate-docs.py --source ome-enterprise   # needs PAT
  python3 scripts/migrate-docs.py --source ovenplayer
"""

from __future__ import annotations
import argparse
import json
import os
import re
import sys
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Per-source configuration: where to fetch from, where to write, and the
# label used as the top-level sidebar category in airensoft.com.
SOURCES: dict[str, dict] = {
    "ome": {
        "repo": "OvenMediaLabs/OvenMediaEngine",
        "branch": "master",
        "docs_path": "docs",
        "out_dir": ROOT / "docs" / "ome",
        "sidebar_file": ROOT / "sidebars-ome.ts",
        "sidebar_var": "omeSidebar",
        "category_label": "OvenMediaEngine",
        "needs_auth": False,
    },
    "ome-enterprise": {
        "repo": "OvenMediaLabs/OvenMediaEngineEnterprise",
        "branch": "master",
        "docs_path": "docs-enterprise",
        "out_dir": ROOT / "docs" / "ome-enterprise",
        "sidebar_file": ROOT / "sidebars-ome-enterprise.ts",
        "sidebar_var": "omeEnterpriseSidebar",
        "category_label": "OvenMediaEngine Enterprise",
        "needs_auth": True,
    },
    "ovenplayer": {
        "repo": "OvenMediaLabs/OvenPlayer",
        "branch": "master",
        "docs_path": "docs",
        "out_dir": ROOT / "docs" / "ovenplayer",
        "sidebar_file": ROOT / "sidebars-ovenplayer.ts",
        "sidebar_var": "ovenplayerSidebar",
        "category_label": "OvenPlayer",
        "needs_auth": False,
    },
}

# Set by main() once the source is chosen, so module-level helpers can
# resolve image paths and asset URLs without threading state through every
# function signature.
_REPO_RAW = ""  # raw.githubusercontent.com base for the current run
_PAT = ""       # GitHub PAT, empty for public repos

# Aliases for the existing helpers; main() rebinds them.
DOCS_OUT: Path = SOURCES["ome"]["out_dir"]
ASSETS_OUT: Path = DOCS_OUT / "images"
SIDEBAR_OUT: Path = SOURCES["ome"]["sidebar_file"]


def fetch(url: str) -> bytes | None:
    req = urllib.request.Request(url)
    if _PAT:
        req.add_header("Authorization", f"Bearer {_PAT}")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def fetch_text(url: str) -> str | None:
    data = fetch(url)
    return data.decode("utf-8") if data is not None else None


# ---------- SUMMARY.md parsing ----------

SUMMARY_LINE = re.compile(r"^(\s*)\*\s+\[(.+?)\]\((.+?)\)\s*$")
# GitBook group headings inside SUMMARY.md (e.g., `## ABOUT`, `## FEATURES`).
SUMMARY_GROUP_RE = re.compile(r"^##\s+(.+?)\s*$")


def _clean_group_name(raw: str) -> str:
    """Strip HTML entities and anchor tags from a SUMMARY group heading.
    GitBook decorates some groups with `<a href="#anchor" ...></a>` to set
    custom URL fragments — we just want the plain text label."""
    import html as _h
    s = re.sub(r"<[^>]+>", "", raw)        # drop tags
    s = _h.unescape(s)                     # decode `&#x20;` etc.
    return s.strip()


def parse_summary(text: str) -> list[dict]:
    """Flat list of {title, path, depth, order, group} preserving SUMMARY order.

    `group` is the most recently seen `##` heading, or `None` for entries that
    appear before any group heading."""
    out = []
    order = 0
    current_group = None
    for line in text.splitlines():
        g = SUMMARY_GROUP_RE.match(line)
        if g:
            current_group = _clean_group_name(g.group(1))
            continue
        m = SUMMARY_LINE.match(line)
        if not m:
            continue
        indent, title, path = m.groups()
        depth = len(indent) // 2  # GitBook uses 2-space indent per level
        order += 1
        out.append({
            "title": title.strip(),
            "path": path.strip(),
            "depth": depth,
            "order": order,
            "group": current_group,
        })
    return out


# ---------- GitBook -> Docusaurus conversion ----------

HINT_RE = re.compile(
    r"\{%\s*hint\s+style=\"(info|warning|danger|success|note|tip)\"\s*%\}"
    r"(.*?)\{%\s*endhint\s*%\}",
    re.DOTALL,
)

HINT_MAP = {
    "info": "info",
    "warning": "warning",
    "danger": "danger",
    "success": "tip",
    "note": "note",
    "tip": "tip",
}

CODE_BLOCK_RE = re.compile(
    r"\{%\s*code\s+title=\"([^\"]+)\"\s*%\}\s*\n(.*?)\n\{%\s*endcode\s*%\}",
    re.DOTALL,
)

# {% tabs %} ... {% endtabs %}, with inner {% tab title="..." %}...{% endtab %}
TABS_BLOCK_RE = re.compile(
    r"\{%\s*tabs\s*%\}(.*?)\{%\s*endtabs\s*%\}",
    re.DOTALL,
)
TAB_INNER_RE = re.compile(
    r"\{%\s*tab\s+title=\"([^\"]+)\"\s*%\}(.*?)\{%\s*endtab\s*%\}",
    re.DOTALL,
)

PAGE_REF_RE = re.compile(r"\{%\s*page-ref\s+page=\"([^\"]+)\"\s*%\}")
EMBED_RE = re.compile(r"\{%\s*embed\s+url=\"([^\"]+)\"\s*%\}")
FILE_RE = re.compile(r"\{%\s*file\s+src=\"([^\"]+)\"\s*%\}")

# Generic catch-all for any remaining {% ... %} tags
GENERIC_GITBOOK_RE = re.compile(r"\{%\s*[a-zA-Z_-]+(?:\s+[^%]*)?\s*%\}")

# Image / link refs to .gitbook/assets/...  (with optional ../, %20-encoded
# names). Stop at `)` (markdown), whitespace, quotes, or `>` (in case the
# original markdown wrapped the URL in <>).
# GitBook asset paths can include spaces and parens in the filename
# (e.g., `image (31).png`) AND chained extensions (`foo.drawio.png`,
# `foo.tar.gz`). Capture lazily up to the LAST `.ext` followed by a
# URL-boundary character via lookahead, so multi-extension names land
# whole instead of being chopped after the first matching extension.
ASSET_REF_RE = re.compile(
    r"(?:\.\./)*\.gitbook/assets/"
    r"([^\"\'>\n]+?\.[a-zA-Z0-9]+)"
    r"(?=[\"\')>\s]|$)",
    re.IGNORECASE,
)


_ASSET_NAME_BAD_RE = re.compile(r"[^\w.\-/]+")


def _normalize_asset_name(name: str) -> str:
    """Map any GitBook asset filename to a webpack-friendly form.

    Docusaurus's image resolver looks up files by the raw URL string —
    it does NOT URL-decode before checking the filesystem. So a markdown
    ref like `image%20%2831%29.png` is searched as that literal name and
    misses the real file (`image (31).png`). Collapsing spaces/parens
    into `-` removes the ambiguity entirely: both the on-disk filename
    and the markdown URL use the same plain-ASCII form, so no encoding
    layer can drift them apart. Extension is preserved untouched. """
    base, dot, ext = name.rpartition(".")
    if not dot:
        base, ext = name, ""
    # Collapse runs of disallowed chars (spaces, parens, etc.) to a
    # single `-`, then trim leading/trailing dashes.
    base = _ASSET_NAME_BAD_RE.sub("-", base).strip("-")
    return f"{base}.{ext}" if dot else base

# First leading H1 to lift into frontmatter
FIRST_H1_RE = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)

# GitBook stores its own YAML frontmatter (layout/visibility/title flags)
# at the top of every file. Strip it before we prepend our Docusaurus
# frontmatter — otherwise the original block leaks into the body.
EXISTING_FRONTMATTER_RE = re.compile(r"\A---\s*\n.*?\n---\s*\n", re.DOTALL)


def strip_existing_frontmatter(md: str) -> str:
    return EXISTING_FRONTMATTER_RE.sub("", md, count=1)


def convert_hints(md: str) -> str:
    def repl(m: re.Match) -> str:
        style = m.group(1)
        body = m.group(2).strip()
        kind = HINT_MAP.get(style, "info")
        return f"\n:::{kind}\n\n{body}\n\n:::\n"
    return HINT_RE.sub(repl, md)


def convert_code_blocks(md: str) -> str:
    def repl(m: re.Match) -> str:
        title = m.group(1)
        body = m.group(2)
        # Detect leading ```lang fence inside; if so, inject title via the
        # info string.  If body starts with ``` already, splice the title in.
        body_stripped = body.lstrip("\n")
        fence_m = re.match(r"^```([a-zA-Z0-9_+.-]*)\s*\n", body_stripped)
        if fence_m:
            lang = fence_m.group(1) or ""
            rest = body_stripped[fence_m.end():]
            return f"```{lang} title=\"{title}\"\n{rest}"
        # No inner fence: wrap as plain code block.
        return f"```text title=\"{title}\"\n{body.strip()}\n```"
    return CODE_BLOCK_RE.sub(repl, md)


def convert_tabs(md: str) -> str:
    used = {"flag": False}

    def repl(m: re.Match) -> str:
        used["flag"] = True
        inner = m.group(1)
        items = []
        for tm in TAB_INNER_RE.finditer(inner):
            label = tm.group(1).replace("\"", "&quot;")
            value = re.sub(r"[^a-zA-Z0-9-]+", "-", label).strip("-").lower() or "tab"
            body = tm.group(2).strip()
            items.append(
                f"<TabItem value=\"{value}\" label=\"{label}\">\n\n{body}\n\n</TabItem>"
            )
        return "\n<Tabs>\n" + "\n".join(items) + "\n</Tabs>\n"
    new_md = TABS_BLOCK_RE.sub(repl, md)
    # The caller will add the Tabs imports when this returns True
    return new_md, used["flag"]


def convert_page_refs(md: str, current_path: str) -> str:
    """Turn `{% page-ref page="other.md" %}` into a Docusaurus link."""
    def repl(m: re.Match) -> str:
        target = m.group(1).strip()
        # Drop .md, normalize to absolute docs path under /docs/ome/.
        path = target.replace(".md", "").replace("README", "")
        if path.startswith("/"):
            link = f"/docs/ome{path}"
        else:
            link = path  # relative; Docusaurus resolves
        label = path.rsplit("/", 1)[-1].replace("-", " ").title() or "Reference"
        return f"\n[{label}]({link})\n"
    return PAGE_REF_RE.sub(repl, md)


def convert_embed_and_file(md: str) -> str:
    md = EMBED_RE.sub(lambda m: f"<{m.group(1)}>", md)
    md = FILE_RE.sub(lambda m: f"[Download]({m.group(1)})", md)
    return md


# CommonMark allows wrapping URLs in `<>` inside image/link syntax:
#   ![alt](<../path with spaces.png>)
# That's valid markdown but MDX parses the leading `<` as a JSX tag and
# bails. Strip the wrappers — we URL-encode the asset path elsewhere.
WRAPPED_IMG_URL_RE = re.compile(r"!\[([^\]]*)\]\(<([^>]+)>\)")
WRAPPED_LINK_URL_RE = re.compile(r"(?<!!)\[([^\]]+)\]\(<([^>]+)>\)")

# Bare autolinks `<https://example.com>` — also confuse MDX. Expand them
# to explicit `[url](url)` markdown links.
AUTOLINK_RE = re.compile(r"<(https?://[^>\s]+)>")


def normalize_markdown_urls(md: str) -> str:
    md = WRAPPED_IMG_URL_RE.sub(r"![\1](\2)", md)
    md = WRAPPED_LINK_URL_RE.sub(r"[\1](\2)", md)
    md = AUTOLINK_RE.sub(r"[\1](\1)", md)
    return md


def strip_remaining_gitbook(md: str) -> str:
    return GENERIC_GITBOOK_RE.sub("", md)


# GitBook embeds raw HTML <img>/<br>/<hr>/<source> without self-closing,
# which MDX rejects. Force-close them.
_SELF_CLOSE_TAGS = ("img", "br", "hr", "input", "meta", "link", "source")
_SELF_CLOSE_RE = {
    t: re.compile(rf"<{t}\b([^>]*?)(?<!/)>", re.IGNORECASE) for t in _SELF_CLOSE_TAGS
}

# Strip GitBook's `data-...` attributes that MDX can't always parse cleanly
# (e.g., unquoted values, hyphenated names that confuse the JSX-style parser).
_NAKED_ATTR_RE = re.compile(r"\s(data-[a-z-]+)(?=[\s>])")


def self_close_void_tags(md: str) -> str:
    for tag, pat in _SELF_CLOSE_RE.items():
        md = pat.sub(rf"<{tag}\1 />", md)
    # Naked HTML boolean attrs need a value in JSX/MDX.
    md = _NAKED_ATTR_RE.sub(r' \1=""', md)
    return md


import html as _html_module

# GitBook frequently emits code blocks as `<pre class="language-X"><code class="lang-X">...HTML-entity-encoded...</code></pre>`
# (instead of a markdown fence). MDX won't reliably parse the `<code>` contents
# because they contain entities and `{` characters. Convert the whole thing
# back to a fenced block.
PRE_CODE_BLOCK_RE = re.compile(
    r"<pre[^>]*>\s*<code(?:\s+class=\"(?:lang|language)-([a-zA-Z0-9_+.-]+)\")?[^>]*>"
    r"(.*?)</code>\s*</pre>",
    re.DOTALL,
)

def convert_pre_code_blocks(md: str) -> str:
    def repl(m: re.Match) -> str:
        lang = m.group(1) or ""
        body = _html_module.unescape(m.group(2))
        return f"\n```{lang}\n{body.rstrip()}\n```\n"
    return PRE_CODE_BLOCK_RE.sub(repl, md)


# Simple `<code>plain</code>` (no inner tags) — convert to backtick so MDX
# treats the contents as raw text. Otherwise markdown emphasis chars like
# `*` inside `<code>...</code>` can break the surrounding parser by
# interleaving emphasis spans with the `</code>` closing tag.
_SIMPLE_INLINE_CODE_RE = re.compile(r"<code>([^<>]+?)</code>")


def simplify_inline_code_to_backticks(md: str) -> str:
    def repl(m: re.Match) -> str:
        text = m.group(1).replace("`", "")
        return f"`{text}`"
    return _SIMPLE_INLINE_CODE_RE.sub(repl, md)


# MDX treats every `{...}` outside a code block as a JSX expression and
# tries to parse it with acorn. GitBook's raw `<table>` cells contain
# placeholders like `${TransactionId}` or `{StartTime:YYYYMMDDhhmmss}` —
# both legal text in HTML, both unparseable as JS. Escape every `{`/`}`
# in the document EXCEPT inside fenced code blocks and inline backticks,
# where MDX leaves contents untouched.

_FENCE_RE = re.compile(r"```.*?```", re.DOTALL)
_INLINE_CODE_RE = re.compile(r"`[^`\n]*`")
_PLACEHOLDER_SENTINEL = "\x00OMEDOCS_PROTECTED_{}\x00"


# GitBook idioms that confuse MDX in addition to the brace problem:
#
#   <mark style="...">text</mark>   — highlight; sometimes typo'd as
#                                     `<mark>text<mark>` (second open
#                                     should be `</mark>`).
#   [<XmlTag>](url)                 — link text containing what MDX
#                                     parses as a JSX tag. Wrap the
#                                     XML-looking text in backticks so
#                                     it renders as inline code instead.

_MARK_OPEN = r"<mark\b[^>]*>"
_TYPO_DOUBLE_MARK_RE = re.compile(rf"({_MARK_OPEN})([^<]*?)({_MARK_OPEN})", re.DOTALL)
_MARK_PAIR_RE = re.compile(rf"{_MARK_OPEN}(.*?)</mark>", re.DOTALL)
_STRAY_MARK_RE = re.compile(rf"{_MARK_OPEN}")

_LINK_XML_RE = re.compile(r"\[<([A-Z][A-Za-z0-9_-]*)>\]\(([^)]+)\)")


_CARDS_TABLE_RE = re.compile(
    r'<table[^>]*data-view="cards"[^>]*>(.*?)</table>',
    re.DOTALL | re.IGNORECASE,
)
_CARDS_ROW_RE = re.compile(r"<tr[^>]*>\s*<td[^>]*>(.*?)</td>", re.DOTALL | re.IGNORECASE)
_BROKEN_LINK_RE = re.compile(
    r'<a[^>]+href="/broken/[^"]*"[^>]*>.*?</a>|\[Broken link\]\(/broken/[^)]+\)',
    re.DOTALL | re.IGNORECASE,
)
_DATA_MENTION_RE = re.compile(r'<a[^>]*\bdata-mention\b[^>]*>(.*?)</a>', re.DOTALL | re.IGNORECASE)


def convert_cards_table(md: str) -> str:
    """GitBook uses `<table data-view="cards">` as a cards grid. We extract
    the title cell (first column) of each row and emit a small CSS grid;
    sibling columns are usually link mentions to other docs which we drop.
    """
    def repl(m: re.Match) -> str:
        body = m.group(1)
        rows = _CARDS_ROW_RE.findall(body)
        if not rows:
            return m.group(0)
        cards = []
        for row in rows:
            text = row.strip()
            if not text:
                continue
            cards.append(f'  <div className="gitbook-card">{text}</div>')
        if not cards:
            return ""
        return (
            '\n<div className="gitbook-cards-grid">\n'
            + "\n".join(cards)
            + "\n</div>\n"
        )
    return _CARDS_TABLE_RE.sub(repl, md)


def strip_broken_links(md: str) -> str:
    """GitBook leaves dead `/broken/pages/...` anchors when content moves.
    Drop them so the page doesn't look like it's full of broken links."""
    md = _BROKEN_LINK_RE.sub("", md)
    # `<a data-mention href="...">Display</a>` — strip the link wrapper but
    # keep the inner text (often a doc title).
    md = _DATA_MENTION_RE.sub(r"\1", md)
    return md


def normalize_gitbook_tags(md: str) -> str:
    # Fix the `<mark>...<mark>...</sub>` typo first: turn the second
    # opening `<mark>` into a closing tag so the pair is balanced.
    md = _TYPO_DOUBLE_MARK_RE.sub(r"\1\2</mark>", md)
    # Now strip every well-formed `<mark>...</mark>` (highlight has no
    # natural Docusaurus equivalent; keep the inner text).
    md = _MARK_PAIR_RE.sub(r"\1", md)
    # Sweep any remaining stray opening `<mark>` (degenerate input).
    md = _STRAY_MARK_RE.sub("", md)
    # Wrap link text that looks like an XML tag in backticks so MDX
    # treats it as inline code, not a JSX element.
    md = _LINK_XML_RE.sub(r"[`<\1>`](\2)", md)
    # Wrap REST-API summary prefixes in a `<span>` so the stylesheet
    # can render HTTP methods (GET/POST/...) and status codes (200/201/4xx)
    # as colored badges. Only fires when summary text starts with one of
    # those tokens — e.g., `<summary>GET /v1/foo</summary>`.
    md = _SUMMARY_BADGE_RE.sub(_summary_badge_repl, md)
    return md


_SUMMARY_BADGE_RE = re.compile(
    r"(<summary>)(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|\d{3})\b(\s*)",
    re.IGNORECASE,
)


def _summary_badge_repl(m: re.Match) -> str:
    token = m.group(2)
    css_class = f"http-method http-method-{token.lower()}"
    return f'{m.group(1)}<span class="{css_class}">{token}</span>{m.group(3)}'


_SINGLE_TILDE_RE = re.compile(r"(?<!~)~(?!~)")
_BARE_LT_RE = re.compile(r"<(?![a-zA-Z!/])")


def escape_jsx_braces(md: str) -> str:
    saved: list[str] = []

    def stash(m: re.Match) -> str:
        idx = len(saved)
        saved.append(m.group(0))
        return _PLACEHOLDER_SENTINEL.format(idx)

    md = _FENCE_RE.sub(stash, md)
    md = _INLINE_CODE_RE.sub(stash, md)
    md = md.replace("{", "&#x7B;").replace("}", "&#x7D;")
    # Escape lone `~` chars (e.g., "(00~23)") which GFM otherwise treats as
    # the start/end of a strikethrough. Double `~~` is left alone so genuine
    # strikethrough still works.
    md = _SINGLE_TILDE_RE.sub("&#126;", md)
    # Escape bare `<` that aren't a tag-open. MDX treats every `<` as a
    # potential JSX start, so plain-text fragments like `large(<992)` or
    # `<= 10` blow up the parser ("Unexpected character `9` before name").
    # Valid tag starts continue with a letter, `/`, or `!`; anything else
    # is plain text and must be entity-escaped.
    md = _BARE_LT_RE.sub("&lt;", md)
    for i, original in enumerate(saved):
        md = md.replace(_PLACEHOLDER_SENTINEL.format(i), original)
    return md


# GitBook wraps images in `<figure><img src="..." alt="..." /><figcaption>...
# </figcaption></figure>` HTML. Docusaurus's webpack image loader only
# processes markdown `![](path)` syntax — a JSX `<img>` tag with a relative
# path is left as-is and 404s at runtime (browser resolves it against the
# page URL, where the file doesn't sit). Convert figures to markdown images
# so webpack picks them up. Captions are dropped: GitBook leaves them empty
# the vast majority of the time, and the alt text already conveys the same.
_FIGURE_IMG_RE = re.compile(
    r'<figure>\s*<img\s+([^>]*?)\s*/?>'
    r'\s*(?:<figcaption[^>]*>.*?</figcaption>)?\s*</figure>',
    re.DOTALL | re.IGNORECASE,
)
_IMG_SRC_ATTR_RE = re.compile(r'src="([^"]+)"')
_IMG_ALT_ATTR_RE = re.compile(r'alt="([^"]*)"')


def convert_figure_images(md: str) -> str:
    def repl(m: re.Match) -> str:
        attrs = m.group(1)
        src_m = _IMG_SRC_ATTR_RE.search(attrs)
        if not src_m:
            return m.group(0)
        src = src_m.group(1)
        alt_m = _IMG_ALT_ATTR_RE.search(attrs)
        alt = alt_m.group(1) if alt_m else ""
        return f"![{alt}]({src})"
    return _FIGURE_IMG_RE.sub(repl, md)


def rewrite_asset_paths(md: str, current_path: str) -> tuple[str, set[str]]:
    """Rewrite `.gitbook/assets/foo.png` references to a path relative to the
    current markdown file pointing at `docs-site/images/`. Returns rewritten
    markdown and the set of asset filenames it referenced."""
    assets: set[str] = set()

    # How many `../` to climb from this markdown to the docs-site root?
    depth = current_path.count("/")  # README.md=0, foo/bar.md=1, etc.
    # MDX treats `![](images/x.png)` (no `./` or `../` prefix) as a public
    # URL lookup, not a webpack import. Without a leading dot the image
    # 404s and the dev server falls back to the SPA shell. Always emit
    # `./images/...` for depth=0 and `../images/...` for nested files.
    rel_prefix = "../" * depth + "images/" if depth > 0 else "./images/"

    def repl(m: re.Match) -> str:
        raw = m.group(1)
        # Strip markdown backslash escapes (e.g., `BBR\_CUBIC.png`).
        raw = re.sub(r"\\([_*\[\]()])", r"\1", raw)
        fname = urllib.parse.unquote(raw)
        # Remember the original name so `download_one` can fetch via the
        # real upstream URL.
        assets.add(fname)
        # Use the normalized name (no spaces, no parens) in the markdown
        # URL so the on-disk filename and the markdown ref stay byte-for-
        # byte identical — Docusaurus's resolver does string equality
        # against the URL, not a URL-decoded lookup.
        return f"{rel_prefix}{_normalize_asset_name(fname)}"

    return ASSET_REF_RE.sub(repl, md), assets


def extract_title(md: str) -> tuple[str | None, str]:
    """Pop the first leading H1 into a title, returning (title, remainder)."""
    m = FIRST_H1_RE.search(md)
    if not m:
        return None, md
    title = m.group(1).strip()
    # Only consume the H1 if it's near the top (in the first 200 chars).
    if m.start() > 200:
        return None, md
    new_md = md[:m.start()] + md[m.end():]
    # Trim leading blank lines we may have created.
    new_md = new_md.lstrip("\n")
    return title, new_md


def convert_markdown(md: str, current_path: str, fallback_title: str, sidebar_position: int | None = None) -> tuple[str, set[str], bool]:
    # Drop the upstream GitBook frontmatter before any other conversion.
    md = strip_existing_frontmatter(md)
    md = convert_hints(md)
    md = convert_code_blocks(md)
    md, used_tabs = convert_tabs(md)
    md = convert_page_refs(md, current_path)
    md = convert_embed_and_file(md)
    md = strip_remaining_gitbook(md)
    # Convert `<pre><code>` HTML code blocks to fenced code BEFORE the
    # brace escape — fences are protected from escaping below.
    md = convert_pre_code_blocks(md)
    # GitBook cards-table -> CSS grid (only first column kept).
    md = convert_cards_table(md)
    # Remove dead `/broken/pages/...` anchors and unwrap `<a data-mention>`.
    md = strip_broken_links(md)
    # Convert simple inline `<code>x</code>` to backtick BEFORE the brace
    # escape so backtick-protected content can include `{` `}` legally.
    md = simplify_inline_code_to_backticks(md)
    md = normalize_markdown_urls(md)
    md = normalize_gitbook_tags(md)
    # Convert `<figure><img>` blocks BEFORE self-closing void tags so we don't
    # have to deal with both `<img>` and `<img />` forms in the regex.
    md = convert_figure_images(md)
    md = self_close_void_tags(md)
    md, assets = rewrite_asset_paths(md, current_path)
    # Brace escape last: protects everything outside fenced/inline code
    # from MDX's `{ ... }` -> JSX expression interpretation.
    md = escape_jsx_braces(md)
    title, md = extract_title(md)
    title = title or fallback_title

    # Build frontmatter — title plus a sidebar_position so an autogenerated
    # sidebar in airensoft.com preserves SUMMARY.md's order.
    lines = ["---", f"title: {json.dumps(title, ensure_ascii=False)[1:-1]}"]
    if sidebar_position is not None:
        lines.append(f"sidebar_position: {sidebar_position}")
    lines.append("---")
    front = "\n".join(lines) + "\n\n"
    if used_tabs:
        front += "import Tabs from '@theme/Tabs';\nimport TabItem from '@theme/TabItem';\n\n"
    return front + md.lstrip(), assets, used_tabs


# ---------- Category metadata generator ----------

def write_category_files(entries: list[dict], docs_root: Path) -> int:
    """For each SUMMARY entry that owns children, write a `_category_.json`
    next to its README so Docusaurus's autogenerated sidebar gets the right
    label and ordering.

    Returns count of files written.
    """
    # Identify "category" entries: those that have at least one entry with
    # `depth > current.depth` immediately following them.
    written = 0
    for i, e in enumerate(entries):
        has_child = (i + 1 < len(entries)) and entries[i + 1]["depth"] > e["depth"]
        if not has_child:
            continue
        path = e["path"]
        # The category dir is the parent directory of this README.
        if not path.endswith("/README.md"):
            continue  # only directory-style entries become categories
        dir_path = docs_root / path[: -len("/README.md")]
        dir_path.mkdir(parents=True, exist_ok=True)
        meta = {
            "label": e["title"],
            "position": e["order"],
            "link": {"type": "doc", "id": "README"},
        }
        (dir_path / "_category_.json").write_text(
            json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        written += 1
    return written


def build_sidebar_tree(entries: list[dict]) -> list[dict]:
    """Convert flat SUMMARY entries (with group + depth) into a Docusaurus
    sidebar tree:

      - Top level: one category per SUMMARY `##` group heading.
      - Inside each group: nested categories follow SUMMARY indentation.
      - A directory's README becomes the category's `link.doc`; pure
        leaves become `{type: 'doc'}` entries.
    """
    def to_doc_id(path: str) -> str:
        p = path
        if p.endswith(".md"):
            p = p[:-3]
        if p == "README":
            p = "intro"
        return p

    # First pass: bucket entries by group (preserving SUMMARY order).
    groups: dict[str, list[dict]] = {}
    group_order: list[str] = []
    UNGROUPED = "_ungrouped"
    for e in entries:
        g = e["group"] or UNGROUPED
        if g not in groups:
            groups[g] = []
            group_order.append(g)
        groups[g].append(e)

    # Second pass: build nested tree inside each group using depth stack.
    def build_nested(items: list[dict]) -> list:
        root: list = []
        stack: list[tuple[int, list]] = [(-1, root)]
        for e in items:
            d = e["depth"]
            while stack and stack[-1][0] >= d:
                stack.pop()
            parent = stack[-1][1]
            node = {
                "title": e["title"],
                "path": e["path"],
                "doc_id": to_doc_id(e["path"]),
                "children": [],
            }
            parent.append(node)
            stack.append((d, node["children"]))
        return root

    def emit(nodes: list) -> list:
        out = []
        for n in nodes:
            if n["children"]:
                out.append({
                    "type": "category",
                    "label": n["title"],
                    "link": {"type": "doc", "id": n["doc_id"]},
                    "items": emit(n["children"]),
                })
            else:
                out.append({"type": "doc", "id": n["doc_id"], "label": n["title"]})
        return out

    # Emit SUMMARY group headings (ABOUT / FEATURES / etc.) as `type: 'html'`
    # visual labels between groups. `html` items have no category mechanics,
    # so they don't drag Docusaurus's active-scroll math the way `category`
    # items would. CSS in `src/css/custom.css` targets `.sidebar-group-label`.
    sidebar: list[dict] = []
    for g in group_order:
        if g != UNGROUPED:
            sidebar.append({
                "type": "html",
                "value": f'<span class="sidebar-group-label">{g}</span>',
            })
        sidebar.extend(emit(build_nested(groups[g])))
    return sidebar


def _render_sidebar_node(node: dict, indent: int) -> str:
    pad = "  " * indent
    if node.get("type") == "html":
        value = json.dumps(node["value"], ensure_ascii=False)
        return f"{pad}{{type: 'html', value: {value}, defaultStyle: true}}"
    if node.get("type") == "doc":
        return (
            f"{pad}{{type: 'doc', id: {json.dumps(node['id'])}, "
            f"label: {json.dumps(node['label'], ensure_ascii=False)}}}"
        )
    # category
    label = json.dumps(node["label"], ensure_ascii=False)
    parts = [
        f"{pad}{{",
        f"{pad}  type: 'category',",
        f"{pad}  label: {label},",
    ]
    if "link" in node:
        parts.append(f"{pad}  link: {{type: 'doc', id: {json.dumps(node['link']['id'])}}},")
    if node.get("collapsible") is False:
        parts.append(f"{pad}  collapsible: false,")
    if node.get("collapsed") is False:
        parts.append(f"{pad}  collapsed: false,")
    else:
        parts.append(f"{pad}  collapsed: true,")
    children = ",\n".join(_render_sidebar_node(c, indent + 2) for c in node["items"])
    parts.append(f"{pad}  items: [\n{children}\n{pad}  ],")
    parts.append(f"{pad}}}")
    return "\n".join(parts)


def render_summary_sidebar(sidebar: list[dict], sidebar_var: str) -> str:
    """Emit an explicit sidebars file that mirrors SUMMARY.md group headings."""
    body = ",\n".join(_render_sidebar_node(n, 2) for n in sidebar)
    return (
        "import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';\n"
        "\n"
        "// Generated from upstream SUMMARY.md by scripts/migrate-docs.py.\n"
        "// Top-level categories mirror the `##` group headings; nested\n"
        "// categories mirror the bulleted indentation.\n"
        "const sidebars: SidebarsConfig = {\n"
        f"  {sidebar_var}: [\n"
        f"{body}\n"
        "  ],\n"
        "};\n"
        "\n"
        "export default sidebars;\n"
    )


# ---------- Main migration pipeline ----------

def _load_env_local() -> None:
    """Best-effort .env.local loader (we keep it tiny rather than pull in
    python-dotenv as a dependency). Only KEY=VALUE lines are honored."""
    env_file = ROOT / ".env.local"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def main() -> int:
    import urllib.parse  # used inside helpers
    globals()["urllib"].parse = urllib.parse

    parser = argparse.ArgumentParser(description="Migrate GitBook docs to Docusaurus")
    parser.add_argument(
        "--source",
        choices=sorted(SOURCES.keys()),
        default="ome",
        help="Which product's docs to migrate (default: ome).",
    )
    args = parser.parse_args()

    src = SOURCES[args.source]
    print(f"Migrating source: {args.source}  ({src['repo']} :: {src['docs_path']}/)")

    # Bind module-level globals so the existing helpers (fetch, rewrite_asset_paths,
    # write_category_files, etc.) pick up the right per-source paths without a
    # larger refactor.
    global _REPO_RAW, _PAT, DOCS_OUT, ASSETS_OUT, SIDEBAR_OUT
    _REPO_RAW = f"https://raw.githubusercontent.com/{src['repo']}/{src['branch']}/{src['docs_path']}/"
    DOCS_OUT = src["out_dir"]
    ASSETS_OUT = DOCS_OUT / "images"
    SIDEBAR_OUT = src["sidebar_file"]

    _load_env_local()
    _PAT = os.environ.get("GITHUB_TOKEN", "")
    if src["needs_auth"] and not _PAT:
        print(
            "FATAL: source needs GITHUB_TOKEN env var (private repo). "
            "Add it to .env.local at the project root.",
            file=sys.stderr,
        )
        return 2

    print("Fetching SUMMARY.md...")
    summary = fetch_text(_REPO_RAW + "SUMMARY.md")
    if summary is None:
        print("FATAL: SUMMARY.md not found", file=sys.stderr)
        return 1

    entries = parse_summary(summary)
    print(f"Parsed {len(entries)} entries from SUMMARY.md")

    DOCS_OUT.mkdir(parents=True, exist_ok=True)

    # Wipe any previously generated content.
    for p in DOCS_OUT.rglob("*"):
        if p.is_file():
            p.unlink()
    for p in sorted(DOCS_OUT.rglob("*"), reverse=True):
        if p.is_dir() and not any(p.iterdir()):
            p.rmdir()

    # (Re)create assets dir after the wipe — ASSETS_OUT lives inside
    # DOCS_OUT (docs-ome/images/) and would have been removed above.
    ASSETS_OUT.mkdir(parents=True, exist_ok=True)

    all_assets: set[str] = set()
    failures: list[str] = []

    def process_one(entry: dict) -> dict:
        path = entry["path"]
        url = _REPO_RAW + path
        text = fetch_text(url)
        if text is None:
            return {"entry": entry, "ok": False, "reason": "404"}
        try:
            md, assets, _ = convert_markdown(
                text,
                path,
                fallback_title=entry["title"],
                sidebar_position=entry["order"],
            )
        except Exception as e:
            return {"entry": entry, "ok": False, "reason": str(e)}
        return {"entry": entry, "ok": True, "md": md, "assets": assets}

    print(f"Fetching {len(entries)} docs (parallel)...")
    with ThreadPoolExecutor(max_workers=12) as ex:
        futures = {ex.submit(process_one, e): e for e in entries}
        results = []
        for f in as_completed(futures):
            results.append(f.result())

    # Write files (and rename README.md -> intro.md at root)
    for r in results:
        e = r["entry"]
        if not r["ok"]:
            failures.append(f"{e['path']}: {r['reason']}")
            continue
        rel_path = e["path"]
        # Root README.md becomes intro.md so the multi-instance plugin's
        # `slug: /` rule still serves it at /docs/ome.
        if rel_path == "README.md":
            out_path = DOCS_OUT / "intro.md"
        else:
            out_path = DOCS_OUT / rel_path
        out_path.parent.mkdir(parents=True, exist_ok=True)

        md = r["md"]
        # The root intro gets the `slug: /` frontmatter so it serves at
        # /docs/ome (the multi-instance routeBasePath).
        if rel_path == "README.md":
            md = md.replace("---\ntitle:", "---\nslug: /\ntitle:", 1)

        out_path.write_text(md, encoding="utf-8")
        all_assets.update(r["assets"])

    print(f"Wrote {sum(1 for r in results if r['ok'])} markdown files.")
    if failures:
        print(f"Failed to fetch {len(failures)}:")
        for f in failures:
            print(f"  - {f}")

    # Download assets
    print(f"Downloading {len(all_assets)} assets...")
    def download_one(name: str) -> bool:
        # Fetch with the original GitBook name (URL-encoded), but save to
        # disk under the normalized form so it matches the markdown ref
        # exactly — see `_normalize_asset_name` for why we collapse spaces
        # and parens.
        url = _REPO_RAW + ".gitbook/assets/" + urllib.parse.quote(name)
        data = fetch(url)
        if data is None:
            return False
        (ASSETS_OUT / _normalize_asset_name(name)).write_bytes(data)
        return True

    with ThreadPoolExecutor(max_workers=12) as ex:
        asset_futures = {ex.submit(download_one, a): a for a in all_assets}
        missing_assets = []
        for f in as_completed(asset_futures):
            ok = f.result()
            if not ok:
                missing_assets.append(asset_futures[f])
    if missing_assets:
        print(f"  Missing {len(missing_assets)} assets (404):")
        for a in missing_assets[:10]:
            print(f"  - {a}")

    # Write per-directory `_category_.json` so the autogenerated sidebar
    # picks up correct labels + ordering from SUMMARY.md.
    print("Writing _category_.json files...")
    cat_count = write_category_files(entries, DOCS_OUT)
    print(f"  Wrote {cat_count} _category_.json files.")

    # Generate the airensoft.com sidebars-<id>.ts — explicit tree built
    # from SUMMARY.md group headings + indentation.
    print(f"Generating {SIDEBAR_OUT.name} from SUMMARY groups...")
    sidebar_tree = build_sidebar_tree(entries)
    # Prepend the product name as a styled `type: 'html'` header instead
    # of wrapping everything in a non-collapsible top category. The wrapper
    # category pushed all real menu items to depth 2, making them look
    # nested under a manual-name "section". With an html header the real
    # items sit at depth 1 — same visual hierarchy as GitBook.
    top = [
        {
            "type": "html",
            "value": (
                f'<span class="sidebar-manual-title">'
                f'{src["category_label"]}'
                f'</span>'
            ),
        },
        *sidebar_tree,
    ]
    SIDEBAR_OUT.write_text(
        render_summary_sidebar(top, src["sidebar_var"]),
        encoding="utf-8",
    )

    print("Done.")
    print(f"  Markdown out: {DOCS_OUT}")
    print(f"  Assets out:   {ASSETS_OUT}")
    print(f"  Sidebar:      {SIDEBAR_OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
