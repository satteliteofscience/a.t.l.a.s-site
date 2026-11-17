# A.T.L.A.S. 2.2 — private R2 publication

The site, the changelog and the configurator are already version 2.2. Firmware availability is independent: a board appears as published only after its real HEX has been validated, uploaded and enabled in the private index; until then the 2.2 card and the DFU list show "coming soon". Keep all earlier versions for rollback. Do not publish a release by changing a card alone.

## Inputs and offline validation

Save each HEX immediately after compiling its board: a later build may remove earlier build output. Keep the files outside the website, for example `D:\A.T.L.A.S\.private\release-2.2\hex`. Never commit binaries or credentials.

```powershell
node tools/r2_publish_release.cjs prepare --version 2.2 --matek D:\A.T.L.A.S\.private\release-2.2\hex\matek-h743-v3-release-2-2.hex --cube D:\A.T.L.A.S\.private\release-2.2\hex\cube-orange-plus-release-2-2.hex --uni D:\A.T.L.A.S\.private\release-2.2\hex\uni-ic743-mini-release-2-2.hex --out D:\A.T.L.A.S\.private\release-2.2\prepared
```

The parser verifies Intel HEX checksums, flash layout and target markers, and calculates actual bytes and SHA-256. Review the exact board/hardware revision and compilation source too: a marker is not proof of hardware compatibility. New metadata is unpublished by default. Preparation uploads nothing.

| Board | secure_id / R2 filename stem |
| --- | --- |
| Matek H743-WING V3 | `matek-h743-v3-release-2-2` |
| Cube Orange Plus | `cube-orange-plus-release-2-2` |
| Uni-IC743 Mini | `uni-ic743-mini-release-2-2` |

## Publication order

1. Use the existing authorized Cloudflare connection. Leave the current release PIN and Worker Secrets untouched. Do not put PINs, their hashes, API tokens or authentication bodies in source, command arguments, screenshots or reports.
2. Fetch the current R2 `_internal/firmware-index.json` into the private output directory; retain it for rollback. Never replace it with the older repository example.
3. Upload each verified HEX to a new `release/<stem>.hex` key in `atlas-firmware-private`. Keep public R2 access disabled. Stop on every upload failure.
4. Read each object back and verify byte count and SHA-256 against the local HEX. Merge only verified additions into the current index using the publishing tool and `--publish`. Existing records (1.0, 1.2, 2.0, 2.1) must remain unchanged. Upload the merged index only after this check.
5. Verify `GET /api/catalog`, the homepage board cards and the configurator/DFU version picker. All three should show the available 2.2 boards and no "coming soon" entry. Check that no firmware bytes are served without authentication. An authenticated download test requires an existing authorized session or private input; never request the PIN in a public chat.
6. The static metadata (`latest_release` and the release name 2.2 in `data/releases.json`, the page labels) is already 2.2 in the repository. Real bench and flight testing remain separate from file integrity and catalogue checks.

No Worker deployment or change to access credentials is required just to publish version 2.2. The public changelog describes the changes and their SITL limits; it does not certify flight safety.
