#!/usr/bin/env python3
"""
Rewrite Medium article URLs inside blog post bodies to their local /blog/<slug>
equivalents using scripts/medium-redirects.json as the mapping table.

- Skips frontmatter (text between the first pair of `---` lines), so
  `canonical_url:` and other Medium metadata stay intact for SEO.
- Matches URLs from both `medium.com/@OvenMediaEngine/...` and
  `medium.com/@AirenSoft/...` against the redirect table by suffix
  (the last URL segment includes the Medium slug + post id).
- URLs that have no match in the table are left alone and reported.

Usage:
    python3 scripts/rewrite-medium-links.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

REPO = Path(__file__).resolve().parent.parent
BLOG_DIR = REPO / "blog"
REDIRECTS = REPO / "scripts" / "medium-redirects.json"

# Matches Medium article URLs under either of the two known author handles.
# Captures the trailing slug (`...-1d60223e04a1`) so we can look it up in
# the redirect table.
MEDIUM_URL_RE = re.compile(
    r"https?://medium\.com/@(?:OvenMediaEngine|AirenSoft)/([A-Za-z0-9._-]+)"
)


def load_redirects() -> dict[str, str]:
    """Return {medium_slug: new_path} keyed by the last URL segment."""
    entries = json.loads(REDIRECTS.read_text(encoding="utf-8"))
    table: dict[str, str] = {}
    for entry in entries:
        medium_url = entry["medium_url"]
        slug = urlsplit(medium_url).path.rstrip("/").rsplit("/", 1)[-1]
        table[slug] = entry["new_path"]
    return table


def split_frontmatter(text: str) -> tuple[str, str]:
    """Return (frontmatter_with_fences, body). Frontmatter is preserved verbatim."""
    if not text.startswith("---\n"):
        return "", text
    end = text.find("\n---\n", 4)
    if end == -1:
        return "", text
    return text[: end + len("\n---\n")], text[end + len("\n---\n") :]


def rewrite_body(body: str, table: dict[str, str]) -> tuple[str, list[str]]:
    """Return (new_body, list_of_unmatched_urls)."""
    unmatched: list[str] = []

    def repl(match: re.Match[str]) -> str:
        slug = match.group(1)
        new_path = table.get(slug)
        if new_path is None:
            unmatched.append(match.group(0))
            return match.group(0)
        return new_path

    return MEDIUM_URL_RE.sub(repl, body), unmatched


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    table = load_redirects()
    print(f"Loaded {len(table)} redirect entries.")

    changed_files: list[Path] = []
    total_replacements = 0
    all_unmatched: dict[str, list[Path]] = {}

    for mdx in sorted(BLOG_DIR.rglob("index.mdx")):
        text = mdx.read_text(encoding="utf-8")
        front, body = split_frontmatter(text)
        new_body, unmatched = rewrite_body(body, table)

        for url in unmatched:
            all_unmatched.setdefault(url, []).append(mdx)

        if new_body == body:
            continue

        # Count how many actual replacements happened.
        replacements = len(MEDIUM_URL_RE.findall(body)) - len(unmatched)
        total_replacements += replacements
        changed_files.append(mdx)

        print(f"  {mdx.relative_to(REPO)}: {replacements} link(s) rewritten")

        if not args.dry_run:
            mdx.write_text(front + new_body, encoding="utf-8")

    print()
    print(f"Files changed: {len(changed_files)}")
    print(f"Total links rewritten: {total_replacements}")

    if all_unmatched:
        print()
        print(f"Unmatched Medium URLs ({len(all_unmatched)} unique):")
        for url, files in sorted(all_unmatched.items()):
            print(f"  {url}")
            for f in files:
                print(f"      -> {f.relative_to(REPO)}")

    if args.dry_run:
        print()
        print("[dry-run] No files were modified.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
