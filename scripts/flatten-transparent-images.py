#!/usr/bin/env python3
"""
Flatten images with transparent backgrounds so they read correctly on
our dark site surface, then drop the CSS-side white wrapper.

Problem we're solving:
- Many diagrams in docs/ are transparent PNGs authored against a white
  canvas. On our dark theme the diagram text/lines become unreadable.
- The previous fix was a global `.markdown img { background: white;
  padding: 0.75rem; border-radius: 8px; }` wrapper. That works, but it
  also frames every screenshot and product shot in a white card, which
  looks like a bug.
- This script bakes the white background + padding directly into
  affected images so we can remove the CSS wrapper and let opaque
  images (screenshots, photos, banners) sit naturally on the dark page.

Detection:
- Only PNG/WEBP/GIF can have alpha. JPEG is always opaque -> skipped.
- We probe alpha extent with `magick identify -format "%[opaque]"`.
- `True` means fully opaque (no transparent pixels) -> skip.
- `False` means at least one pixel has alpha < 255 -> rewrite.

Rewrite:
- magick "$src" -background white -alpha remove -alpha off
       -bordercolor white -border 24x24 "$dst"
- Border adds breathing room similar to the previous CSS padding.

Safety:
- Original is backed up to a sibling .alpha-backup/<basename> on first
  pass so a re-run on already-flattened files is a no-op.
- Re-runs detect the .alpha-backup sibling and skip.

Usage:
    python3 scripts/flatten-transparent-images.py --dry-run
    python3 scripts/flatten-transparent-images.py
    python3 scripts/flatten-transparent-images.py --restore  # undo
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# Directories to scan. Order matters only for reporting.
#
# `static/images` is intentionally excluded: it holds CI assets (logos,
# product symbols, icons) that depend on transparency to composite
# correctly against any background. Baking a white rectangle into
# `OML_Symbol_White.svg.png` would defeat the purpose.
SCAN_DIRS = [
    REPO / "docs",
    REPO / "blog",
]

# File extensions that can carry transparency. JPEG is excluded.
ALPHA_EXTS = {".png", ".webp", ".gif"}

# Backup directory name used as a sibling next to each image so the
# rewrite stays alongside the original tree.
BACKUP_DIRNAME = ".alpha-backup"


def has_transparency(path: Path) -> bool | None:
    """Return True if the image has any non-opaque pixel.

    Returns None if `magick identify` fails (corrupt or unsupported file).
    """
    try:
        result = subprocess.run(
            ["magick", "identify", "-format", "%[opaque]", str(path)],
            capture_output=True,
            text=True,
            timeout=15,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        print(f"  ! identify failed for {path}: {exc}", file=sys.stderr)
        return None

    if result.returncode != 0:
        print(f"  ! identify rc={result.returncode} for {path}: {result.stderr.strip()}", file=sys.stderr)
        return None

    answer = result.stdout.strip().lower()
    # `%[opaque]` returns "True" / "False"; multi-frame images may return
    # one value per frame separated by spaces, e.g. for animated GIF.
    return any(v == "false" for v in answer.split())


def backup_path_for(src: Path) -> Path:
    return src.parent / BACKUP_DIRNAME / src.name


def flatten(src: Path) -> bool:
    """Return True if the image was rewritten."""
    backup = backup_path_for(src)
    if backup.exists():
        # Already processed in a previous run.
        return False

    backup.parent.mkdir(parents=True, exist_ok=True)

    # Copy original to backup first so the rewrite is atomic-ish.
    backup.write_bytes(src.read_bytes())

    cmd = [
        "magick",
        str(src),
        "-background", "white",
        "-alpha", "remove",
        "-alpha", "off",
        "-bordercolor", "white",
        "-border", "24x24",
        str(src),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        # Roll back: restore from backup and remove it so the file is
        # back to its pre-run state.
        src.write_bytes(backup.read_bytes())
        backup.unlink()
        try:
            backup.parent.rmdir()
        except OSError:
            pass
        print(f"  ! flatten failed for {src}: {result.stderr.strip()}", file=sys.stderr)
        return False

    return True


def restore_all() -> int:
    """Restore every image from its .alpha-backup sibling, then remove
    the backup directories. Returns count of restored files."""
    restored = 0
    for backup_dir in REPO.rglob(BACKUP_DIRNAME):
        if not backup_dir.is_dir():
            continue
        for backup_file in backup_dir.iterdir():
            target = backup_dir.parent / backup_file.name
            target.write_bytes(backup_file.read_bytes())
            backup_file.unlink()
            restored += 1
        try:
            backup_dir.rmdir()
        except OSError:
            pass
    return restored


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--restore", action="store_true",
                        help="restore originals from .alpha-backup siblings")
    args = parser.parse_args()

    if args.restore:
        n = restore_all()
        print(f"Restored {n} file(s) from .alpha-backup siblings.")
        return 0

    candidates: list[Path] = []
    for root in SCAN_DIRS:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix.lower() not in ALPHA_EXTS:
                continue
            # Skip anything already inside a backup dir.
            if BACKUP_DIRNAME in path.parts:
                continue
            candidates.append(path)

    print(f"Scanning {len(candidates)} candidate image(s) for transparency...")

    transparent: list[Path] = []
    opaque = 0
    failed = 0
    for i, path in enumerate(candidates):
        if i and i % 50 == 0:
            print(f"  ... probed {i}")
        verdict = has_transparency(path)
        if verdict is None:
            failed += 1
            continue
        if verdict:
            transparent.append(path)
        else:
            opaque += 1

    print()
    print(f"Transparent: {len(transparent)}")
    print(f"Opaque:      {opaque}")
    print(f"Failed:      {failed}")

    if not transparent:
        return 0

    # Bucket by top-level dir for readable output.
    by_root: dict[str, int] = {}
    for path in transparent:
        rel = path.relative_to(REPO)
        bucket = "/".join(rel.parts[:2])
        by_root[bucket] = by_root.get(bucket, 0) + 1

    print()
    print("By bucket:")
    for bucket, count in sorted(by_root.items(), key=lambda kv: -kv[1]):
        print(f"  {bucket:40s} {count}")

    if args.dry_run:
        print()
        print("[dry-run] No files modified.")
        return 0

    print()
    print("Flattening...")
    rewritten = 0
    for path in transparent:
        if flatten(path):
            rewritten += 1
    print(f"Rewritten: {rewritten}")
    print(f"Backups stored in .alpha-backup/ siblings.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
