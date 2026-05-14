#!/usr/bin/env python3
"""
Replay the legacy-docs link rewrites against an upstream docs-site/
tree, using the JSON map produced by
`scripts/rewrite-legacy-docs-links.py --write`.

Use this on the three upstream repos (OvenMediaEngine,
OvenMediaEngineEnterprise, OvenPlayer) so the same rewrite that
landed in our downstream copy lives at the source. After upstream
merges, `scripts/sync-docs.sh` will keep downstream and upstream
aligned without us having to re-apply this on every sync.

Usage:
    python3 scripts/apply-legacy-redirects-upstream.py <docs-site-dir>

  The script:
    - reads scripts/legacy-docs-redirects.json
    - rewrites every `from` URL to its `to` path inside *.md / *.mdx
      files under <docs-site-dir>
    - prints a per-file summary; pass --write to actually apply
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
RULES = REPO / "scripts" / "legacy-docs-redirects.json"

TEXT_EXTS = {".md", ".mdx"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("docs_site", help="path to upstream docs-site/ directory")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    docs_site = Path(args.docs_site).resolve()
    if not docs_site.is_dir():
        print(f"!! not a directory: {docs_site}", file=sys.stderr)
        return 2

    rules = json.loads(RULES.read_text(encoding="utf-8"))
    # Sort by len(from) desc so longer URLs (with anchors/paths) match
    # before shorter ones that would steal their prefix.
    rules.sort(key=lambda r: len(r["from"]), reverse=True)
    print(f"Loaded {len(rules)} legacy-docs rewrite rules.")

    total_replacements = 0
    touched: list[Path] = []

    for path in sorted(docs_site.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTS:
            continue
        # Read as bytes to preserve the file's existing line endings
        # (some upstream files are CRLF). Python's text-mode write
        # would normalize them and make the diff look like every line
        # changed.
        raw = path.read_bytes()
        new = raw
        local = 0
        for rule in rules:
            old_url = rule["from"].encode("utf-8")
            new_url = rule["to"].encode("utf-8")
            if old_url in new:
                count = new.count(old_url)
                new = new.replace(old_url, new_url)
                local += count
        if local:
            touched.append(path)
            total_replacements += local
            print(f"  {path.relative_to(docs_site)}: {local}")
            if args.write:
                path.write_bytes(new)

    print()
    print(f"Files touched:    {len(touched)}")
    print(f"Total rewrites:   {total_replacements}")
    if not args.write:
        print()
        print("[dry-run] No files modified. Re-run with --write to apply.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
