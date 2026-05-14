#!/usr/bin/env bash
#
# Pull the latest `docs-site/` from each upstream OvenMedia Labs repo
# into `docs/<source>/` here. Replaces the GitBook-conversion pipeline
# that scripts/migrate-docs.py used to run on every build — now the
# upstream repos already store MDX, so a plain content import is all
# we need.
#
# Usage:
#   scripts/sync-docs.sh             # sync all three
#   scripts/sync-docs.sh ovenplayer  # one source only
#
# Why not `git subtree pull`?
#   `git subtree split --prefix=docs-site` walks every commit in the
#   upstream history in a shell loop, which is unusably slow on the
#   Enterprise repo (~20 min). `git read-tree --prefix=` ports only the
#   current `docs-site/` tree as a flat snapshot — same end result,
#   seconds instead of minutes. We give up subtree's merge-history
#   tracking, but that history isn't useful to anyone reviewing
#   downstream changes here anyway.

set -euo pipefail

SOURCES="ome ome-enterprise ovenplayer"

source_url() {
    case "$1" in
        ome)            echo "https://github.com/OvenMediaLabs/OvenMediaEngine.git" ;;
        ome-enterprise) echo "https://github.com/OvenMediaLabs/OvenMediaEngineEnterprise.git" ;;
        ovenplayer)     echo "https://github.com/OvenMediaLabs/OvenPlayer.git" ;;
        *)              return 1 ;;
    esac
}

# Per-product docs folder name in the upstream repo. Enterprise moved
# its docs to `docs-site-enterprise/` so the OvenMediaEngine merge into
# Enterprise wouldn't overwrite it.
source_docs_folder() {
    case "$1" in
        ome-enterprise) echo "docs-site-enterprise" ;;
        *)              echo "docs-site" ;;
    esac
}

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

sync_one() {
    local source="$1"
    local url
    if ! url=$(source_url "$source"); then
        echo "unknown source: $source (valid: $SOURCES)" >&2
        exit 1
    fi
    local remote="upstream-$source"
    local prefix="docs/$source"

    echo "▶ $source ($url)"

    if ! git remote get-url "$remote" >/dev/null 2>&1; then
        git remote add "$remote" "$url"
    fi
    git fetch "$remote" master --quiet

    # Drop the existing prefix from the working tree + index, then
    # read-tree the upstream's docs folder in its place. `-u` updates
    # the working tree to match.
    local docs_folder
    docs_folder=$(source_docs_folder "$source")
    if [ -e "$prefix" ]; then
        git rm -rq "$prefix"
    fi
    git read-tree --prefix="$prefix/" -u "$remote/master^{tree}:$docs_folder"

    local upstream_sha
    upstream_sha=$(git rev-parse --short "$remote/master")

    if git diff --cached --quiet; then
        echo "  no changes (already at $upstream_sha)"
        return
    fi

    git commit -m "chore: sync $prefix from $remote @ $upstream_sha" >/dev/null
    echo "  synced @ $upstream_sha"
}

if [ $# -eq 0 ]; then
    for source in $SOURCES; do
        sync_one "$source"
    done
else
    for source in "$@"; do
        sync_one "$source"
    done
fi
