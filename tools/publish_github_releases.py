#!/usr/bin/env python3
"""Publish validated firmware+corresponding-source pairs to public GitHub Releases.

Invoked by GitHub Actions AFTER the immutable archive commit is pushed.
Never publish test builds from the private tester repository here.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
HISTORY = ROOT / "data" / "firmware-history.json"
BOARD_ROOT = (ROOT / "Firmware" / "Matek Wing H743-V3").resolve()
SOURCE_ROOT = (ROOT / "Firmware" / "Sources").resolve()

def checked_file(relative, directory):
    if not isinstance(relative, str) or not relative or "\\" in relative:
        raise ValueError("Invalid relative firmware/source path")
    path = Path(relative)
    if path.is_absolute() or ".." in path.parts:
        raise ValueError("Path traversal in release record")
    target = (ROOT / path).resolve()
    if not target.is_relative_to(directory) or not target.is_file() or target.is_symlink():
        raise ValueError("Release file missing or outside approved public directory: " + relative)
    return target

def digest(path):
    h = hashlib.sha256()
    with open(path, "rb") as file:
        for part in iter(lambda: file.read(1024 * 1024), b""):
            h.update(part)
    return h.hexdigest()

def gh(*args, check=True):
    result = subprocess.run(["gh", *args], text=True, capture_output=True, check=False)
    if check and result.returncode:
        raise RuntimeError("GitHub CLI failed: " + result.stderr.strip()[:1000])
    return result

def publish(dry_run=False):
    # GitHub Release binary attachments would bypass PIN protection entirely.
    config_path = ROOT / "data" / "firmware-access.json"
    if config_path.is_file() and json.loads(config_path.read_text(encoding="utf-8")).get("enabled") is True:
        raise RuntimeError("Legacy public GitHub Releases are disabled while secure R2 distribution is active")
    repo = os.getenv("GITHUB_REPOSITORY", "satteliteofscience/a.t.l.a.s-site")
    if repo != "satteliteofscience/a.t.l.a.s-site":
        raise RuntimeError("This release automation is locked to the public A.T.L.A.S. site repository")
    entries = json.loads(HISTORY.read_text(encoding="utf-8")).get("releases", [])
    created = []
    for item in entries:
        board = item.get("board_id")
        if board != "matek-h743-wing-v3":
            continue
        if item.get("source_verified") is not True or not item.get("source_url"):
            print("Skipping unsigned source approval:", item.get("id", "?"))
            continue
        release_id, sha = item.get("id"), item.get("sha256")
        if (not isinstance(sha, str) or not re.fullmatch(r"[0-9a-f]{64}", sha)
                or release_id != sha[:16]):
            raise ValueError("Invalid immutable release identifier/checksum")
        firmware = checked_file(item.get("path"), BOARD_ROOT)
        source = checked_file(item["source_url"], SOURCE_ROOT)
        if not source.name.lower().endswith((".zip", ".tar.gz", ".tgz")):
            raise ValueError("Source package must be an archive (.zip, .tar.gz, .tgz)")
        if digest(firmware) != sha:
            raise ValueError("Firmware SHA-256 mismatch: " + str(release_id))
        if source.stat().st_size < 1000:
            raise ValueError("Corresponding source archive appears empty")
        tag = f"atlas-matek-h743-wing-v3-{release_id}"
        url = f"https://github.com/{repo}/releases/tag/{tag}"
        if dry_run:
            print("Validated release:", tag, firmware.name, source.name)
            continue
        exists = gh("release", "view", tag, "--repo", repo, check=False)
        if exists.returncode == 0:
            print("Already published:", tag)
            continue
        title = str(item.get("label") or "A.T.L.A.S. firmware")[:180]
        notes = (
            f"{title}\n\n"
            "Target: Matek H743-WING V3 only. Experimental flight firmware; "
            "check board revision, take a parameter backup and bench test without a propeller.\n\n"
            f"Intel HEX SHA-256: {sha}\n"
            "The matching source archive is attached. This release is PUBLIC; "
            "private early-test builds are never distributed by this workflow.\n"
        )
        with tempfile.TemporaryDirectory() as tmp:
            notes_path = Path(tmp) / "release-notes.md"
            notes_path.write_text(notes, encoding="utf-8")
            gh("release", "create", tag, str(firmware), str(source),
               "--repo", repo, "--title", title, "--notes-file", str(notes_path),
               "--prerelease", "--target", subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip())
        created.append({"board_id": board, "version": str(item.get("version", "")),
                        "label": title, "tag": tag, "url": url, "release_id": release_id})
        print("Created public GitHub Release:", url)
    return created

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", help="Write JSON file of newly created GitHub Releases")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    result = publish(dry_run=args.dry_run)
    if args.output:
        Path(args.output).write_text(json.dumps(result, indent=2), encoding="utf-8")

if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, ValueError, KeyError) as error:
        print("Firmware publishing failed: " + str(error), file=sys.stderr)
        sys.exit(1)
