#!/usr/bin/env python3
"""
Generate `src/data/blog-index.json` by scanning all blog/<slug>/index.mdx
frontmatter. This index powers the "Related posts" widget rendered at
the bottom of every blog post.

We collect a minimal set of fields:
  - slug (or auto-derived from directory name)
  - permalink (`/blog/<slug>`)
  - title
  - description
  - tags
  - date (YYYY-MM-DD from directory prefix; preferred over frontmatter
    because the frontmatter date includes a time component that's noisy)
  - image (path resolved against the post directory so the bundler can
    consume it at runtime; we keep the original literal here and let
    BlogPostItem resolve it via the blog plugin's assets)

Run after editing frontmatter:
    python3 scripts/build-blog-index.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
BLOG_DIR = REPO / "blog"
OUT = REPO / "src" / "data" / "blog-index.json"

DIR_DATE_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})-(.+)$")


def parse_frontmatter(text: str) -> dict[str, object]:
    """Very small YAML-like parser. The migration script writes flat
    frontmatter (no nested maps), so we don't need a full YAML lib here.
    Supports: scalars, quoted strings, simple inline lists `[a, b, c]`.
    """
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}
    block = text[4:end]

    out: dict[str, object] = {}
    for raw in block.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        if not value:
            out[key] = ""
            continue
        # Strip surrounding quotes.
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            value = value[1:-1]
        # Inline list `[a, b]`.
        if value.startswith("[") and value.endswith("]"):
            inner = value[1:-1]
            out[key] = [
                item.strip().strip('"').strip("'")
                for item in inner.split(",")
                if item.strip()
            ]
            continue
        out[key] = value
    return out


def main() -> int:
    posts: list[dict[str, object]] = []

    for post_dir in sorted(BLOG_DIR.iterdir()):
        if not post_dir.is_dir():
            continue
        mdx = post_dir / "index.mdx"
        if not mdx.exists():
            continue

        fm = parse_frontmatter(mdx.read_text(encoding="utf-8"))

        # Derive date + dir slug from directory name.
        m = DIR_DATE_RE.match(post_dir.name)
        if m:
            date = m.group(1)
            dir_slug = m.group(2)
        else:
            date = str(fm.get("date", ""))[:10]
            dir_slug = post_dir.name

        slug = fm.get("slug") or dir_slug
        title = fm.get("title", "")
        description = fm.get("description", "")
        tags = fm.get("tags", [])
        image = fm.get("image", "")

        # Image: keep the literal frontmatter value. The related-posts
        # component currently renders text-only cards (no thumbnails),
        # so we don't need to resolve `./foo.png` to a hashed bundler
        # URL here. If we add thumbnails later we'll either (a) copy
        # first images to /static/blog-thumbs/<dir>/ in this script,
        # or (b) generate a per-post `_thumb.tsx` re-export so MDX
        # imports give us a stable URL.
        posts.append(
            {
                "slug": slug,
                "permalink": f"/blog/{slug}",
                "title": title,
                "description": description,
                "tags": tags if isinstance(tags, list) else [tags],
                "date": date,
                "dir": post_dir.name,
            }
        )

    # Newest first.
    posts.sort(key=lambda p: p["date"], reverse=True)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(posts, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Wrote {OUT.relative_to(REPO)} with {len(posts)} entries.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
