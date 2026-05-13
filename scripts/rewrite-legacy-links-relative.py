#!/usr/bin/env python3
"""
Rewrite legacy GitBook URLs to repo-relative .md links.

A second pass over the work `rewrite-legacy-docs-links.py` started.
That first pass rewrote every legacy URL to an absolute `/docs/<source>/...`
path. Absolute paths render correctly on the deployed site, but on
GitHub.com (and any other repo-relative Markdown viewer) `/docs/...`
resolves against the host root and 404s.

This script converts those absolute targets to repo-relative links
(`../live-source/srt.md#encoders-and-streamid` style) so the manual
reads correctly in three places:

  1. GitHub.com when viewing a docs file in the repo
  2. Local Markdown viewers (VS Code, MacDown, etc.)
  3. The deployed site (Docusaurus normalizes relative .md links)

Targets are filename-with-`.md` (or `README.md` for index pages),
so the docs plugin can resolve them at build time.

Modes:
  - Downstream (this repo): rewrite absolute /docs/<source>/... inside
    docs/<source>/ files into relative links.
  - Upstream (`--upstream <docs-site>`): same rewrite, but the rewrite
    targets are computed relative to the file's position inside the
    upstream `docs-site/` tree.

Usage:
    python3 scripts/rewrite-legacy-links-relative.py                  # downstream dry-run
    python3 scripts/rewrite-legacy-links-relative.py --write
    python3 scripts/rewrite-legacy-links-relative.py --upstream <path>          # dry-run
    python3 scripts/rewrite-legacy-links-relative.py --upstream <path> --write
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
BUILD_DOCS = REPO / "build" / "docs"


# Match an absolute /docs/<source>/<path> URL, optionally with #anchor.
# We only rewrite ones that point at one of the three docs sources.
#
# Order matters: regex alternation is leftmost, so list the longer
# source names first or `ome` will steal `ome-enterprise` matches.
DOCS_URL_RE = re.compile(
    r"/docs/(ome-enterprise|ovenplayer|ome)([A-Za-z0-9._/-]*)(#[A-Za-z0-9._-]+)?"
)

TEXT_EXTS = {".md", ".mdx"}


def docs_paths_for(source: str) -> dict[str, str]:
    """Return {url_path: filesystem_path_inside_docs_site} for one source.

    Looks at build/docs/<source>/**/*.html to learn every valid URL, then
    maps each URL back to the markdown file we expect upstream to ship:
       /docs/ome                -> README.md
       /docs/ome/foo            -> foo.md  or  foo/README.md
       /docs/ome/foo/bar        -> foo/bar.md  or  foo/bar/README.md
    """
    base = BUILD_DOCS / source
    if not base.is_dir():
        return {}

    mapping: dict[str, str] = {}
    for html in base.rglob("*.html"):
        rel = html.relative_to(base).with_suffix("")
        # /docs/<source>/foo
        url_path = "/docs/" + source + "/" + str(rel)
        url_path = url_path.rstrip("/")
        if str(rel) == ".":  # base index
            url_path = f"/docs/{source}"
        mapping[url_path] = str(rel)
    return mapping


def find_md_target(rel_url_path: str, docs_site_root: Path | None,
                   source: str) -> str | None:
    """Given a /docs/<source>/<rest> URL, return the path of the
    actual .md/.mdx file inside the docs-site/ tree, if any.

    docs_site_root is either:
      - the upstream `docs-site/` (when fixing upstream)
      - the downstream `docs/<source>/`  (when fixing downstream)

    `rel_url_path` is the part after `/docs/<source>/`, e.g. `live-source/srt`.
    """
    if docs_site_root is None or not docs_site_root.is_dir():
        return None

    rel = rel_url_path.strip("/")
    candidates = []
    if not rel:
        candidates = ["README.md", "README.mdx"]
    else:
        candidates = [
            f"{rel}.md",
            f"{rel}.mdx",
            f"{rel}/README.md",
            f"{rel}/README.mdx",
        ]
    for cand in candidates:
        target = docs_site_root / cand
        if target.exists():
            return cand
    return None


def rewrite_text(text: str, source_file: Path, docs_site_root: Path,
                 source: str | None = None) -> tuple[str, int, list[str]]:
    """Rewrite absolute /docs/<source>/... URLs in `text` into repo-relative
    `.md` links computed relative to `source_file` inside `docs_site_root`.

    Returns (new_text, count_rewritten, list_unresolved_urls).
    """
    unresolved: list[str] = []

    def replace(m: re.Match) -> str:
        url_source = m.group(1)
        rest = m.group(2) or ""
        anchor = m.group(3) or ""
        url = m.group(0)

        # If we were told a single source, only rewrite within it.
        # (Used when fixing upstream OvenMediaEngine, which should not
        # rewrite a cross-link to /docs/ome-enterprise/... since that
        # target lives in a different repo.)
        if source and url_source != source:
            return url

        # /docs/<source>/foo  -> rel = "foo"
        rel_url_path = rest.lstrip("/")
        target_md = find_md_target(rel_url_path, docs_site_root, url_source)
        if target_md is None:
            unresolved.append(url)
            return url

        # Compute relative path from source_file to docs_site_root/target_md.
        target_abs = docs_site_root / target_md
        try:
            rel_link = os.path.relpath(target_abs, start=source_file.parent)
        except ValueError:
            unresolved.append(url)
            return url

        # On Windows os.path.relpath may use backslashes; normalize.
        rel_link = rel_link.replace(os.sep, "/")
        return rel_link + anchor

    new_text, n = DOCS_URL_RE.subn(replace, text)
    return new_text, n, unresolved


def scan_files(root: Path) -> list[Path]:
    out: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTS:
            continue
        out.append(path)
    return out


def run_downstream(write: bool) -> int:
    print("Mode: downstream (this repo)")
    print(f"Reading sitemap-equivalents from {BUILD_DOCS.relative_to(REPO)}/")
    if not BUILD_DOCS.is_dir():
        print(f"!! Run `npm run build` first; {BUILD_DOCS} missing.", file=sys.stderr)
        return 2

    total = 0
    touched = 0
    unresolved_all: list[str] = []

    for source in ["ome", "ome-enterprise", "ovenplayer"]:
        src_root = REPO / "docs" / source
        if not src_root.is_dir():
            continue
        for path in scan_files(src_root):
            raw = path.read_bytes()
            text = raw.decode("utf-8", errors="replace")
            new, n, unresolved = rewrite_text(text, path, src_root, source=source)
            if n:
                touched += 1
                total += n
                rel_file = path.relative_to(REPO)
                print(f"  {rel_file}: {n}")
                if write:
                    # Encode the new text using the same line endings as the
                    # original by writing bytes (utf-8 only changes ascii bytes
                    # we matched against).
                    path.write_bytes(new.encode("utf-8"))
            unresolved_all.extend(unresolved)

    print()
    print(f"Files touched:   {touched}")
    print(f"Rewrites:        {total}")
    if unresolved_all:
        print(f"Unresolved:      {len(unresolved_all)}")
        for u in sorted(set(unresolved_all)):
            print(f"  {u}")
    if not write:
        print()
        print("[dry-run] No files modified. Re-run with --write to apply.")
    return 0


def detect_upstream_source(docs_site: Path) -> str | None:
    """Guess which docs source this upstream tree maps to."""
    name = docs_site.resolve().parent.name.lower()
    if "enterprise" in name:
        return "ome-enterprise"
    if "ovenplayer" in name or "oven-player" in name:
        return "ovenplayer"
    if "ovenmediaengine" in name:
        return "ome"
    return None


def run_upstream(docs_site: Path, write: bool) -> int:
    source = detect_upstream_source(docs_site)
    if not source:
        print(f"!! Could not infer source for {docs_site}", file=sys.stderr)
        return 2

    print(f"Mode: upstream ({docs_site})")
    print(f"Inferred source: {source}")

    total = 0
    touched = 0
    unresolved_all: list[str] = []

    for path in scan_files(docs_site):
        raw = path.read_bytes()
        text = raw.decode("utf-8", errors="replace")
        new, n, unresolved = rewrite_text(text, path, docs_site, source=source)
        if n:
            touched += 1
            total += n
            rel_file = path.relative_to(docs_site)
            print(f"  {rel_file}: {n}")
            if write:
                # Preserve original line endings: only the matched ASCII
                # substrings change, so bytes-level write keeps CRLF intact.
                start = 0
                out_bytes = bytearray()
                # We can't apply the regex on bytes when text was re-encoded;
                # fall back to a careful re-encoding that preserves \r positions
                # by re-deriving from the original raw bytes.
                # Simplest correct approach: re-run on bytes directly.
                rewrote_bytes = _rewrite_bytes(raw, path, docs_site, source)
                path.write_bytes(rewrote_bytes)
        unresolved_all.extend(unresolved)

    print()
    print(f"Files touched:   {touched}")
    print(f"Rewrites:        {total}")
    if unresolved_all:
        print(f"Unresolved:      {len(unresolved_all)}")
        for u in sorted(set(unresolved_all)):
            print(f"  {u}")
    if not write:
        print()
        print("[dry-run] No files modified. Re-run with --write to apply.")
    return 0


# Bytes-level variant so CRLF / lone CR upstream files survive unchanged.
# Same leftmost-alternation ordering caveat as DOCS_URL_RE above.
DOCS_URL_BRE = re.compile(
    rb"/docs/(ome-enterprise|ovenplayer|ome)([A-Za-z0-9._/-]*)(#[A-Za-z0-9._-]+)?"
)


def _rewrite_bytes(raw: bytes, source_file: Path, docs_site_root: Path, source: str) -> bytes:
    def replace(m: re.Match) -> bytes:
        url_source = m.group(1).decode("ascii")
        rest = m.group(2).decode("ascii") if m.group(2) else ""
        anchor = m.group(3).decode("ascii") if m.group(3) else ""
        if url_source != source:
            return m.group(0)
        rel_url_path = rest.lstrip("/")
        target_md = find_md_target(rel_url_path, docs_site_root, url_source)
        if target_md is None:
            return m.group(0)
        target_abs = docs_site_root / target_md
        try:
            rel_link = os.path.relpath(target_abs, start=source_file.parent)
        except ValueError:
            return m.group(0)
        rel_link = rel_link.replace(os.sep, "/")
        return (rel_link + anchor).encode("ascii")

    return DOCS_URL_BRE.sub(replace, raw)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--upstream", type=Path, default=None,
                        help="path to upstream docs-site/ tree")
    args = parser.parse_args()

    if args.upstream:
        return run_upstream(args.upstream.resolve(), args.write)
    return run_downstream(args.write)


if __name__ == "__main__":
    sys.exit(main())
