#!/usr/bin/env python3
"""
Rewrite legacy GitBook / docs.* URLs scattered through the site to the
new in-site /docs/<source>/<slug> paths.

Strategy:
  1. Read the production sitemap (build/sitemap.xml) to learn every
     valid `/docs/...` path the site actually ships.
  2. Scan source files (src/, docs/, blog/, docusaurus.config.ts) for
     legacy URLs in a known set of hosts.
  3. For each match, derive the candidate slug and look it up against
     the sitemap. Three buckets:
       - exact match  -> rewrite to local path
       - fuzzy match  -> rewrite, report low confidence
       - no match     -> leave alone, report for manual review
  4. Output a summary report. With --write, apply the rewrites.

Hosts treated as legacy aliases of in-site sources:
    docs.ovenmediaengine.com               -> /docs/ome/
    airensoft.gitbook.io/ovenmediaengine   -> /docs/ome/
    docs.enterprise.ovenmediaengine.com    -> /docs/ome-enterprise/
    ovenmediaengine-enterprise.gitbook.io  -> /docs/ome-enterprise/
    docs.ovenplayer.com                    -> /docs/ovenplayer/
    airensoft.gitbook.io/ovenplayer        -> /docs/ovenplayer/

Hosts that are NOT rewritten (external products / unrelated SaaS):
    ovenstudio.gitbook.io   (separate OvenStudio LLHLS SaaS site)

Usage:
    python3 scripts/rewrite-legacy-docs-links.py             # dry-run
    python3 scripts/rewrite-legacy-docs-links.py --write     # apply
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlsplit

REPO = Path(__file__).resolve().parent.parent
BUILD_SITEMAP = REPO / "build" / "sitemap.xml"
SCAN_ROOTS = [REPO / "src", REPO / "docs", REPO / "blog"]
EXTRA_FILES = [REPO / "docusaurus.config.ts"]

# Maps a legacy host (and optional path prefix to strip) to the
# in-site docs source directory.
LEGACY_HOSTS = [
    ("docs.ovenmediaengine.com", "", "ome"),
    ("airensoft.gitbook.io", "ovenmediaengine", "ome"),
    ("docs.enterprise.ovenmediaengine.com", "", "ome-enterprise"),
    ("ovenmediaengine-enterprise.gitbook.io", "", "ome-enterprise"),
    ("docs.ovenplayer.com", "", "ovenplayer"),
    ("airensoft.gitbook.io", "ovenplayer", "ovenplayer"),
]

# Hosts we explicitly leave alone.
SKIP_HOSTS = {"ovenstudio.gitbook.io"}

# Explicit overrides for slug renames the heuristic can't figure out
# (pages were renamed or merged upstream). Keys are (source,
# normalized_slug); values are the destination /docs/<source>/... path.
SLUG_OVERRIDES: dict = {
    ("ome", "recording-experiment"): "/docs/ome/recording",
    ("ome", "live-source/srt-beta"): "/docs/ome/live-source/srt",
    ("ome", "v/0.16.4/live-source/srt-beta"): "/docs/ome/live-source/srt",
    ("ome-enterprise", "getting-started/getting-started-with-ubuntu"):
        "/docs/ome-enterprise/pre-built-package-installation/getting-started/getting-started-with-linux",
}

# File extensions to consider.
TEXT_EXTS = {".md", ".mdx", ".ts", ".tsx", ".js", ".jsx", ".yml", ".yaml", ".json"}


def load_sitemap() -> set[str]:
    """Return the set of `/docs/...` paths the build ships, normalized
    to leading-slash form with no trailing slash."""
    if not BUILD_SITEMAP.exists():
        print(
            f"!! {BUILD_SITEMAP.relative_to(REPO)} missing. Run `npm run build` first.",
            file=sys.stderr,
        )
        sys.exit(2)
    tree = ET.parse(BUILD_SITEMAP)
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    paths: set[str] = set()
    for url in tree.getroot().findall("s:url", ns):
        loc = url.find("s:loc", ns).text or ""
        parsed = urlsplit(loc)
        path = parsed.path.rstrip("/")
        if path.startswith("/docs/"):
            paths.add(path)
    return paths


def normalize_slug(slug: str) -> str:
    """Drop common GitBook noise: `v/<version>/...`, `<source>/` prefix,
    and case differences. Return a lower-cased path segment string."""
    parts = [p for p in slug.split("/") if p]
    # Strip leading `v/<version>` (versioned GitBook URLs).
    if len(parts) >= 2 and parts[0] == "v":
        parts = parts[2:]
    # Strip leading product-name prefix (e.g. `ovenmediaengine`).
    if parts and parts[0] in {
        "ovenmediaengine", "ovenmediaengine-enterprise", "ovenplayer",
        "doc", "docs", "guide",
    }:
        parts = parts[1:]
    return "/".join(parts).lower()


def candidate_paths(slug: str, source: str) -> list[str]:
    """Generate likely `/docs/<source>/<slug>` variants to probe."""
    base = f"/docs/{source}"
    norm = normalize_slug(slug)
    out = [f"{base}/{norm}", f"{base}/{norm.lstrip('/')}"]
    if not norm:
        out.append(base)
    return [p.rstrip("/") for p in out if p]


def fuzzy_lookup(slug: str, source: str, sitemap: set[str]) -> str | None:
    """Try to find a matching path with simple slug variants. Returns
    the matched path or None."""
    norm_full = normalize_slug(slug)

    # Explicit overrides win.
    override = SLUG_OVERRIDES.get((source, norm_full))
    if override and override in sitemap:
        return override

    # Exact candidates first.
    for cand in candidate_paths(slug, source):
        if cand in sitemap:
            return cand

    # Variant: tail-segment match (the last slug part should be unique
    # enough for short links like `/configuration` or `/p2p-delivery`).
    norm = normalize_slug(slug)
    if not norm:
        return None
    tail = norm.split("/")[-1]
    matches = [p for p in sitemap if p.split("/")[-1] == tail and p.startswith(f"/docs/{source}/")]
    if len(matches) == 1:
        return matches[0]
    return None


# Capture full URL up to anchor/quote/whitespace. Group 1=host, 2=path, 3=anchor.
URL_RE = re.compile(
    r"https?://([A-Za-z0-9.-]+)(/[^\s\"\')\]>]*)?",
)


def host_to_source(host: str, path: str) -> tuple[str, str] | None:
    """Map (host, path) to (source, remaining_slug). Returns None if
    the host is not a legacy alias we rewrite."""
    if host in SKIP_HOSTS:
        return None
    for h, prefix, source in LEGACY_HOSTS:
        if host != h:
            continue
        rest = path.lstrip("/")
        if prefix:
            if not rest.startswith(prefix + "/") and rest != prefix:
                continue
            rest = rest[len(prefix):].lstrip("/")
        return source, rest
    return None


def scan() -> list[Path]:
    files: list[Path] = []
    for root in SCAN_ROOTS:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix.lower() not in TEXT_EXTS:
                continue
            files.append(path)
    for extra in EXTRA_FILES:
        if extra.exists():
            files.append(extra)
    return files


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    sitemap = load_sitemap()
    print(f"Loaded {len(sitemap)} /docs/* paths from sitemap.")

    rewrites_by_file: dict[Path, list[tuple[str, str, str]]] = {}
    unmatched: list[tuple[Path, str]] = []
    skipped_external = 0

    for path in scan():
        text = path.read_text(encoding="utf-8", errors="replace")
        new_text = text
        local_rewrites: list[tuple[str, str, str]] = []

        for m in URL_RE.finditer(text):
            host = m.group(1)
            url_path = m.group(2) or ""
            full = m.group(0)
            # Split fragment.
            fragment = ""
            if "#" in url_path:
                url_path, fragment = url_path.split("#", 1)
                fragment = "#" + fragment

            mapping = host_to_source(host, url_path)
            if mapping is None:
                if host in SKIP_HOSTS:
                    skipped_external += 1
                continue

            source, rest = mapping
            target = fuzzy_lookup(rest, source, sitemap)
            if target:
                new_url = target + fragment
                if full in new_text:
                    new_text = new_text.replace(full, new_url)
                    local_rewrites.append((full, new_url, "exact"))
            else:
                unmatched.append((path, full))

        if local_rewrites:
            rewrites_by_file[path] = local_rewrites
            if args.write:
                path.write_text(new_text, encoding="utf-8")

    # ---- Report ----
    total = sum(len(v) for v in rewrites_by_file.values())
    print()
    print(f"Files touched:     {len(rewrites_by_file)}")
    print(f"Links rewritten:   {total}")
    print(f"Unmatched links:   {len(unmatched)}")
    print(f"Skipped external:  {skipped_external} (e.g. ovenstudio.gitbook.io)")

    if unmatched:
        print()
        print("Unmatched URLs (need manual review):")
        seen: set[str] = set()
        for path, url in unmatched:
            if url in seen:
                continue
            seen.add(url)
            print(f"  {path.relative_to(REPO)}: {url}")

    if not args.write:
        print()
        print("[dry-run] No files written. Re-run with --write to apply.")

    # Write a JSON of all rewrites for cutover-time redirect rules.
    if args.write:
        out = REPO / "scripts" / "legacy-docs-redirects.json"
        rules = []
        for f, rws in rewrites_by_file.items():
            for old, new, kind in rws:
                rules.append({"from": old, "to": new, "kind": kind})
        # Dedupe while preserving order.
        seen_keys: set[str] = set()
        unique = []
        for r in rules:
            k = r["from"]
            if k in seen_keys:
                continue
            seen_keys.add(k)
            unique.append(r)
        out.write_text(json.dumps(unique, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print()
        print(f"Wrote {out.relative_to(REPO)} with {len(unique)} unique rules.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
