# A.T.L.A.S. 1.2 — private R2 firmware publication

The site displays **A.T.L.A.S. 1.2** as the newest project version. A firmware entry becomes **downloadable** only after the corresponding HEX is compiled, verified and published. Firmware 1.0 remains selectable for rollback.

## One-time setup

Deploy the updated `firmware-gateway/src/index.js` to Cloudflare Workers (`cd firmware-gateway && npx wrangler deploy`, after authenticating to your own Cloudflare account). The new **GET /api/catalog** endpoint returns *public metadata only* for releases explicitly marked `published: true` in the private R2 index **and** whose HEX objects exist with matching sizes. No PIN, R2 object key or firmware byte content is sent through this GET endpoint. PIN verification for **POST /api/firmware/<secure_id>** is unchanged.

**Important:** uploading a commit to GitHub Pages does not automatically deploy the Cloudflare Worker. Before the updated Worker is deployed, the site keeps using its existing 1.0 manifests and gracefully shows 1.2 as pending.

## Target paths to upload into private R2

Bucket: `atlas-firmware-private` — leave public bucket URLs and r2.dev **disabled**.

| Target | R2 object key | secure_id |
| --- | --- | --- |
| Matek H743-WING V3 | `release/matek-h743-v3-release-1-2.hex` | `matek-h743-v3-release-1-2` |
| Cube Orange Plus | `release/cube-orange-plus-release-1-2.hex` | `cube-orange-plus-release-1-2` |
| Uni-IC743 Mini | `release/uni-ic743-mini-release-1-2.hex` | `uni-ic743-mini-release-1-2` |

**Do not swap board builds.** Check the exact hwdef, Intel HEX checksums, target flash range, flash size, and the file SHA-256 before publication. The Cube full-DFU path remains experimental and has not been verified on physical hardware.

### Publishing each compiled HEX

1. Upload the correct HEX to its **exact** `release/...` R2 object path using the Cloudflare R2 dashboard. Upload a separate binary for each supported board.
2. On Windows PowerShell run `(Get-FileHash .\firmware.hex -Algorithm SHA256).Hash.ToLower()` for SHA-256 and `(Get-Item .\firmware.hex).Length` for **file bytes**. Record the build timestamp in Unix seconds, e.g. `[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()`.
3. From Cloudflare R2, **download the currently deployed** `_internal/firmware-index.json`. Keep ALL existing 1.0 records intact. The repository's `firmware-gateway/firmware-index.json` is only a reference copy and may be stale.
4. For each uploaded build, copy its entry from `release-1.2-index-additions.example.json` into the existing index's `builds` object. Replace `sha256`, `bytes` and `timestamp` with the **actual** values. Change `published` from `false` to `true` **only after validating the uploaded file**. You can publish one board at a time; do not add unavailable boards as published.
5. Upload the new JSON back to private R2 as `_internal/firmware-index.json` and keep it private. Do not place the real HEX in the GitHub Pages repository.
6. The homepage fetches the verified public catalog on load and approximately every minute, so the newly published 1.2 entry appears for the matching board **without updating the site's static JSON**. The configurator reads the same metadata when its DFU board is selected and when “Load latest/selected” is clicked.

The public metadata contains the exact SHA-256. During the authenticated download, the browser independently checks the downloaded HEX against that SHA-256 and its size **before** enabling DFU flashing. The actual programming action still requires explicit user confirmation.

## Test before telling pilots to install

- Before publication, the 1.2 option is visibly **pending** and cannot be loaded remotely. Version 1.0 remains selectable.
- After publication, the 1.2 option is available **only** for the target uploaded to R2; its download succeeds with the existing shared PIN.
- Wrong PIN returns 401; incomplete or mismatched firmware is rejected; version 1.0 remains available for rollback.
- In DFU, double-check board ID/flash map, controller revision, saved parameters and recovery path. No automatic ERASE/WRITE should occur.
- Provide corresponding source under the applicable ArduPilot GNU GPL license for each distributed firmware release. A PIN does not remove source or redistribution rights.

This document and example prepare the release flow; they do **not** upload binaries or modify the actual Cloudflare account. Cloudflare login and the compiled 1.2 files are required for those steps.
