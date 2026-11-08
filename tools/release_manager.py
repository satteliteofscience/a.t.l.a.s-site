#!/usr/bin/env python3
"""A.T.L.A.S. release ingest + immutable firmware archive + static catalog.

Usage:
  python tools/release_manager.py --once
  python tools/release_manager.py --watch --interval 5

Drop a verified, stable Intel HEX into Firmware/incoming/matek-h743-wing-v3/.
The archive is immutable/content-addressed: a repeated filename with different
bytes always produces a new release, and old releases remain available.
This script belongs on the site's *trusted server/deployment job*, not the web browser.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import time
from datetime import datetime, timezone
from urllib.parse import quote

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from update_firmware_manifest import check_hex

BOARD_ID = 'matek-h743-wing-v3'
BOARD_PATH = 'Firmware/Matek Wing H743-V3'
BASE_DIR = HERE / BOARD_PATH
RELEASES = BASE_DIR / 'releases'
INCOMING = HERE / 'Firmware' / 'incoming' / BOARD_ID
HISTORY_PATH = HERE / 'data' / 'firmware-history.json'
CATALOG = HERE / 'data' / 'releases.json'
MANIFEST = BASE_DIR / 'manifest.json'
MAX_FILE = 20 * 1024 * 1024


def safe_write(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + '.tmp')
    with tmp.open('w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
        fh.write('\n')
        fh.flush()
        os.fsync(fh.fileno())
    tmp.replace(path)


def read_json(path, default):
    if not path.is_file():
        return default
    return json.loads(path.read_text(encoding='utf-8'))


def filehash(path: Path):
    result = hashlib.sha256()
    with path.open('rb') as fh:
        for block in iter(lambda: fh.read(1 << 20), b''):
            result.update(block)
    return result.hexdigest()


def checked(path):
    if path.is_symlink() or not path.is_file() or path.suffix.lower() != '.hex':
        raise ValueError(f'not a regular Intel HEX file: {path}')
    if not (200_000 < path.stat().st_size <= MAX_FILE):
        raise ValueError(f'invalid size: {path}')
    return check_hex(path)


def safe_relative_path(item):
    relative = item.get('path')
    if not isinstance(relative, str):
        raise ValueError('release has no path')
    candidate = Path(relative)
    if candidate.is_absolute() or '..' in candidate.parts or not relative.startswith(BOARD_PATH + '/'):
        raise ValueError('invalid release path')
    target = (HERE / candidate).resolve()
    if not target.is_relative_to(BASE_DIR.resolve()):
        raise ValueError('release is outside public board folder')
    return target


def record(path, *, version, title, published, source_path=''):
    mn, mx, total = checked(path)
    sha = filehash(path)
    relative = path.relative_to(HERE).as_posix()
    return {
        'id': sha[:16], 'board_id': BOARD_ID, 'version': str(version),
        'label': str(title), 'filename': path.name, 'path': relative,
        'bytes': path.stat().st_size, 'image_bytes': total,
        'address_start': f'0x{mn:08X}', 'address_end_exclusive': f'0x{mx:08X}',
        'sha256': sha, 'timestamp': int(published), 'source_url': source_path,
    }


def ingest_once(min_age=0):
    history = read_json(HISTORY_PATH, {'schema': 1, 'board_id': BOARD_ID, 'releases': []})
    entries = history.get('releases', [])
    if not isinstance(entries, list):
        raise ValueError('invalid firmware history')
    by_hash = {r['sha256']: r for r in entries}
    # Migrate the original 1.0 build without modifying the actual shipped HEX.
    orig = BASE_DIR / 'REALESE ArduPlane 4.7.2 - A.T.L.A.S EKF3 - MATEK WING H743 V3 (480 Mhz Clock).hex'
    if orig.exists():
        h = filehash(orig)
        if h not in by_hash:
            r = record(orig, version='1.0', title='A.T.L.A.S. Pre-Release 1.0 · ArduPlane 4.7.2', published=1794072475)
            entries.append(r)
            by_hash[h] = r
    RELEASES.mkdir(parents=True, exist_ok=True)
    INCOMING.mkdir(parents=True, exist_ok=True)
    incoming = sorted(INCOMING.glob('*.hex'))
    # Optional metadata for the next drop: version and public source archive URL.
    settings = read_json(INCOMING / 'release.json', {})
    if settings and (not isinstance(settings, dict) or not isinstance(settings.get('version', ''), str)):
        raise ValueError('release.json must be an object with a string version')
    source_path = settings.get('source_url', '')
    if source_path and (not isinstance(source_path, str) or not source_path.startswith('Firmware/Sources/')):
        raise ValueError('source_url must be a local Firmware/Sources/ path')
    if source_path:
        relative=Path(source_path)
        if '..' in relative.parts or relative.is_absolute() or not (HERE/relative).is_file():
            raise ValueError('source_url points to missing or non-local source archive')
    updated = 0
    for path in incoming:
        before = path.stat()
        # During server watch, avoid accepting a file that has only just started copying.
        if time.time() - before.st_mtime < min_age:
            continue
        checked(path)
        if path.stat().st_size != before.st_size or path.stat().st_mtime_ns != before.st_mtime_ns:
            continue
        digest = filehash(path)
        if digest in by_hash:
            # Repeated content: no new release. Remove copied duplicate only.
            path.unlink()
            print(f'Duplicate (already archived): {path.name}')
            continue
        now = datetime.now(timezone.utc)
        created = int(now.timestamp())
        archive_name = f"ATLAS-{now.strftime('%Y%m%d-%H%M%S')}-{digest[:12]}.hex"
        target = RELEASES / archive_name
        if target.exists():
            raise FileExistsError(target)
        staging = target.with_suffix('.hex.tmp')
        try:
            shutil.copyfile(path, staging)
            if filehash(staging) != digest or staging.stat().st_size != before.st_size:
                raise ValueError('copy changed during upload: ' + path.name)
            staging.rename(target)
        finally:
            if staging.exists():
                staging.unlink()
        version = settings.get('version') or now.strftime('%Y.%m.%d-%H%M')
        title = settings.get('label') or f'A.T.L.A.S. {version} · {now.strftime("%Y-%m-%d %H:%M")} UTC'
        entry = record(target, version=version, title=title, published=created, source_path=source_path)
        entries.append(entry)
        by_hash[digest] = entry
        path.unlink()
        updated += 1
        print(f'Published {path.name} -> {target.name} (SHA-256 {digest[:16]})')
    if updated and not any(INCOMING.glob('*.hex')):
        (INCOMING / 'release.json').unlink(missing_ok=True)

    # The ledger drives sorting; never infer "latest" from a reused name.
    entries.sort(key=lambda e: (int(e.get('timestamp', 0)), e.get('sha256', '')), reverse=True)
    for item in entries:
        path = safe_relative_path(item)
        if not path.exists() or filehash(path) != item['sha256']:
            raise ValueError(f'archived release missing or changed: {item.get("path")}')
    safe_write(HISTORY_PATH, {'schema': 1, 'board_id': BOARD_ID, 'releases': entries})
    files = []
    for item in entries:
        files.append({k: item.get(k) for k in ('filename', 'path', 'bytes', 'image_bytes', 'address_start', 'address_end_exclusive', 'sha256', 'timestamp', 'version', 'label', 'source_url')})
    safe_write(MANIFEST, {
        'schema': 2, 'board_id': BOARD_ID, 'board_name': 'Matek H743-WING V3',
        'flash_type': 'STM32H743 internal 2 MiB', 'format': 'intel-hex',
        'latest': files[0]['filename'] if files else None,
        'latest_path': files[0]['path'] if files else None, 'files': files,
    })
    catalog = read_json(CATALOG, {'project': {}, 'boards': []})
    catalog['project']['repository_url'] = ''
    catalog['project']['issues_url'] = ''
    catalog['project']['downloads_base'] = 'Firmware/'
    for board in catalog.get('boards', []):
        if board.get('id') != BOARD_ID:
            continue
        board['status'] = 'available' if entries else 'planned'
        board['version'] = entries[0]['version'] if entries else '—'
        board['downloads'] = []
        for item in entries:
            # Site-local URLs only, encoded safely for spaces and Cyrillic names.
            url = '/'.join(quote(p, safe='') for p in item['path'].split('/'))
            board['downloads'].append({
                'filename': item['filename'], 'label': item['label'],
                'version': item['version'], 'sha256': item['sha256'],
                'timestamp': item['timestamp'], 'release_id': item['id'],
                'source_url': item.get('source_url', ''), 'url': url,
            })
    safe_write(CATALOG, catalog)
    return updated


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--once', action='store_true', help='process uploads and exit')
    p.add_argument('--watch', action='store_true', help='continuously scan the inbox')
    p.add_argument('--interval', type=float, default=5)
    args = p.parse_args()
    if not args.watch:
        ingest_once()
        return
    print(f'Watching {INCOMING}, interval {args.interval}s (Ctrl+C to stop)', flush=True)
    try:
        while True:
            try:
                ingest_once(min_age=3)
            except (OSError, ValueError) as e:
                print(f'Publish failed: {e}', file=sys.stderr, flush=True)
            time.sleep(max(args.interval, 2))
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
