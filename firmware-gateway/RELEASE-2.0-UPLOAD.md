# A.T.L.A.S. 2.0 (A.T.L.A.S-G.L.O.B.A.L) — private R2 firmware publication

The site shows **Release 2.0 · A.T.L.A.S-G.L.O.B.A.L** as the newest version. A board's 2.0 entry is **downloadable** only after its HEX is compiled, verified and published; until then the card lists it as "soon" and the configurator lists it as "coming soon". Version 1.0 stays selectable for rollback. Any version published later (2.1, 3.0 …) appears in the cards automatically: the version list is built from the catalogue, newest first, and scrolls when it is long.

## What is already in place

- The Worker's **GET /api/catalog** returns public metadata only for builds marked `"published": true` in the private R2 index whose object exists with the matching size. No PIN, object key or byte of firmware goes through it. PIN checks on **POST /api/firmware/<secure_id>** are unchanged.
- The homepage and the configurator read that catalogue (homepage about every minute), so a newly published build appears for the matching board **without changing any static JSON of the site**.
- Uploading a commit to GitHub Pages does not redeploy the Worker. The Worker needs no change for 2.0 (versions are generic `N.N`).

## Publishing, step by step

Bucket: `atlas-firmware-private` — keep public access and r2.dev **disabled**.

| Board | R2 object key | secure_id |
| --- | --- | --- |
| Matek H743-WING V3 | `release/matek-h743-v3-release-2-0.hex` | `matek-h743-v3-release-2-0` |
| Cube Orange Plus | `release/cube-orange-plus-release-2-0.hex` | `cube-orange-plus-release-2-0` |
| Uni-IC743 Mini | `release/uni-ic743-mini-release-2-0.hex` | `uni-ic743-mini-release-2-0` |

1. **Prepare** (offline, nothing is uploaded). Pass the compiled HEX of every board you publish:

   ```powershell
   node tools/r2_publish_release.cjs prepare --version 2.0 --matek <Matek.hex> --cube <CubeOrangePlus.hex> --uni <UniIC743Mini.hex>
   ```

   The tool parses each file with the configurator's own Intel HEX parser (contiguous image from `0x08000000`, bootloader included, checksums), refuses a file whose board marker does not match the board you named (a Cube or Uni build is refused under any other board; a Matek build may have no marker, as in 1.0), and writes `firmware-gateway/release-2.0/release-2.0-index-additions.json` (SHA-256, bytes, timestamp, labels, `"published": false`) and `r2-upload-2.0.ps1`. The HEX itself is never copied into the repository.
2. **Upload** — either run the generated `r2-upload-2.0.ps1` after `npx wrangler login` into your own Cloudflare account, or upload the three HEX files and `_internal/firmware-index.json` by hand in the R2 dashboard. The script puts each HEX, downloads the **currently deployed** index (`current-index.json` = your rollback copy), merges the additions with `node tools/r2_publish_release.cjs merge` (existing 1.0 records are never changed; an id or object key clash is an error) and puts the merged index back.
3. **Publish**: the new entries are `"published": false` first. Check the file on R2 (size equals `bytes`), then run the merge again with `--publish` (or flip `published` to `true` yourself) for the boards you have verified. You can publish one board at a time; never mark an unavailable board as published.
4. **Verify in the browser**: the board card shows `2.0 · A.T.L.A.S-G.L.O.B.A.L` with its date; the download asks for the shared PIN, the SHA-256 shown on the card matches the downloaded file, a wrong PIN returns 401, version 1.0 still downloads. In the configurator pick the board in the DFU panel and use "Load latest/selected": the same PIN dialog opens before any HEX is read. Hardware ERASE/WRITE always needs the separate confirmations.

**Do not swap board builds.** Check the exact hwdef, Intel HEX checksums, flash range and the file SHA-256 before publication. The Cube full-DFU path remains experimental and has not been verified on physical hardware.

## Template

`release-2.0-index-additions.example.json` shows the shape of the additions with placeholders. It is a template only; `prepare` writes the real file.
