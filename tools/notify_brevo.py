#!/usr/bin/env python3
"""Send opted-in public firmware newsletters using Brevo. Called only after new public Releases.
No email list is fetched or stored in GitHub; Brevo applies its unsubscribes and list membership.
"""
import argparse
from html import escape
import json
import os
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

URL = "https://api.brevo.com/v3/emailCampaigns"

def api(method, uri, api_key, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {"api-key": api_key, "Content-Type": "application/json", "Accept": "application/json"}
    request = Request(uri, data=data, headers=headers, method=method)
    try:
        with urlopen(request, timeout=20) as response:
            body = response.read(50000)
            return json.loads(body) if body else {}
    except HTTPError as exc:
        raise RuntimeError(f"Brevo API HTTP {exc.code}: {exc.read(800).decode(errors='replace')}") from exc
    except URLError as exc:
        raise RuntimeError("Brevo API unreachable: " + str(exc.reason)) from exc

def send_for_new_releases(records):
    if os.getenv("ATLAS_BREVO_SEND_ENABLED", "").lower() != "true":
        print("Brevo auto-send disabled (ATLAS_BREVO_SEND_ENABLED != true)")
        return
    key = os.environ.get("BREVO_API_KEY")
    sender = os.environ.get("BREVO_SENDER_EMAIL")
    if not key or not sender or "@" not in sender:
        raise RuntimeError("Missing BREVO_API_KEY secret / verified BREVO_SENDER_EMAIL variable")
    lists = {"matek-h743-wing-v3": os.getenv("BREVO_LIST_ID_MATEK")}
    for entry in records:
        board = entry.get("board_id")
        list_id = lists.get(board)
        if not list_id or not list_id.isdecimal() or int(list_id) <= 0:
            raise RuntimeError("Missing confirmed subscriber list ID for " + str(board))
        url = entry.get("url", "")
        if not url.startswith("https://github.com/satteliteofscience/a.t.l.a.s-site/releases/tag/"):
            raise ValueError("Unsafe public GitHub Release URL")
        label = escape(str(entry.get("label", "A.T.L.A.S. firmware")), quote=True)
        version = escape(str(entry.get("version", "")), quote=True)
        body = (
            "<html><body style='font:16px/1.6 Arial,sans-serif;color:#172119'>"
            "<h1>A.T.L.A.S. — Public Firmware Release</h1>"
            f"<h2>{label}</h2><p>Board: Matek H743-WING V3; version: {version}.</p>"
            "<p>Review the changelog and verify the checksum and compatible hardware before flashing.</p>"
            f"<p><a href='{escape(url, quote=True)}'>Open GitHub release and source package</a></p>"
            "<p>Experimental flight-control software. Always back up parameters and bench-test.</p>"
            '<p><a href="{{ unsubscribe }}">Unsubscribe / Відписатися / Отписаться</a></p>'
            "</body></html>"
        )
        campaign = api("POST", URL, key, {
            "name": "ATLAS auto public release " + str(entry["tag"]),
            "sender": {"name": "A.T.L.A.S. Control Center", "email": sender},
            "recipients": {"listIds": [int(list_id)]},
            "subject": "A.T.L.A.S. — " + str(entry["label"])[:125],
            "htmlContent": body,
            "tag": "atlas-" + str(board),
        })
        campaign_id = campaign.get("id")
        if not isinstance(campaign_id, int):
            raise RuntimeError("Brevo campaign ID missing; cannot send")
        api("POST", f"{URL}/{campaign_id}/sendNow", key)
        print(f"Brevo campaign {campaign_id} scheduled for opted-in board list: {board}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Private GitHub Actions temporary JSON of new releases")
    args = parser.parse_args()
    entries = json.loads(Path(args.input).read_text(encoding="utf-8"))
    if not isinstance(entries, list):
        raise ValueError("New release manifest must be a list")
    if entries:
        send_for_new_releases(entries)
    else:
        print("No new public releases; no newsletters sent")

if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, KeyError) as error:
        print("Brevo notification failed: " + str(error), file=sys.stderr)
        sys.exit(1)
