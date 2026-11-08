#!/usr/bin/env python3
"""Build verified static manifest from local .hex files. Never uploads files."""
from pathlib import Path
import argparse, hashlib, json, re, subprocess, time

ROOT = Path(__file__).resolve().parent.parent
DIR = ROOT / 'Firmware' / 'Matek Wing H743-V3'
FLASH_START, FLASH_END = 0x08000000, 0x08200000

def check_hex(path):
    base, last, total = 0, None, 0
    minimum, maximum = None, None
    eof = False
    with path.open('rt', encoding='ascii') as f:
        for row, text in enumerate(f,1):
            line = text.strip()
            if not line:
                continue
            if eof:
                raise ValueError(f'{path.name}: text after EOF at line {row}')
            if not line.startswith(':'):
                raise ValueError(f'{path.name}: invalid line {row}')
            packet = bytes.fromhex(line[1:])
            if len(packet) < 5 or len(packet) != packet[0] + 5 or sum(packet)%256:
                raise ValueError(f'{path.name}: bad length/checksum at line {row}')
            length = packet[0]
            offs = int.from_bytes(packet[1:3], 'big')
            mode = packet[3]
            if mode == 0:
                if not length: continue
                absolute = base + offs
                if last is not None and absolute != last:
                    raise ValueError(f'{path.name}: noncontiguous or overlapping data at line {row}')
                last = absolute + length
                if minimum is None: minimum = absolute
                maximum = last
                total += length
            elif mode == 4 and length == 2:
                base = int.from_bytes(packet[4:6], 'big') << 16
            elif mode == 1 and length == 0:
                eof = True
            elif mode == 5 and length == 4:
                pass
            else:
                raise ValueError(f'{path.name}: unsupported Intel HEX record {mode} at line {row}')
    if not eof or minimum != FLASH_START or maximum is None or maximum > FLASH_END or total < 65536:
        raise ValueError(f'{path.name}: requires complete contiguous full image at 0x08000000, within 2MB')
    return minimum, maximum, total

def commit_time(path):
    try:
        r = subprocess.run(['git','-C',str(ROOT),'log','-1','--format=%ct','--',str(path.relative_to(ROOT))],capture_output=True,text=True,timeout=3)
        if r.returncode==0 and r.stdout.strip().isdigit():return int(r.stdout.strip())
    except (OSError, subprocess.TimeoutExpired):pass
    return int(path.stat().st_mtime)

def main():
    DIR.mkdir(parents=True,exist_ok=True)
    files=[]
    for path in DIR.glob('*.hex'):
        mn,mx,total=check_hex(path)
        files.append({'filename':path.name,'bytes':path.stat().st_size,'image_bytes':total,'address_start':f'0x{mn:08X}','address_end_exclusive':f'0x{mx:08X}','sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'timestamp':commit_time(path)})
    files.sort(key=lambda item:(item['timestamp'],item['filename']),reverse=True)
    manifest={'schema':1,'board_id':'matek-h743-wing-v3','board_name':'Matek H743-WING V3','flash_type':'STM32H743 internal 2 MiB','format':'intel-hex','latest':files[0]['filename'] if files else None,'files':files}
    out=DIR/'manifest.json'
    out.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'{out}\nLatest: {manifest["latest"]} ({len(files)} HEX files)')

if __name__=='__main__':main()
