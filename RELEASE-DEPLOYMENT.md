# A.T.L.A.S. — secure firmware publishing (Cloudflare R2)

The website is hosted on GitHub Pages. **Actual HEX files are stored only in private Cloudflare R2 on the current branch.** The gateway checks a shared release PIN or individual Early Tester keys on the server before returning file bytes. Never put a PIN, its SHA-256 digest from the encrypted secret, individual keys, or private R2 credentials into the public site.

## Verified production settings

- Cloudflare Worker: https://atlas-firmware-gateway.gamingchanel57.workers.dev/
- Private R2 bucket: atlas-firmware-private; public access and r2.dev disabled.
- Worker bindings: FIRMWARE (bucket), ACCESS_LIMITER (10 attempts / 60s, approximately per IP), ACCESS_CODES_JSON (encrypted Cloudflare Secret).
- Private R2 paths: release/matek-h743-v3-release-1.hex and _internal/firmware-index.json.
- Release secure_id: matek-h743-v3-release-1, channel: release.
- Verified release file: 4,654,592 bytes, SHA-256 db18bb8cda5805508a4834ee40388c8f493ceaa4498a3c778d37c600b24bcda9.
- User tested: wrong PIN -> HTTP 401; correct PIN -> HTTP 200 and matching length/header/content SHA-256.
- This proves correct **downloads and integrity**, not correct behavior or hardware verification when flashing.

## Safe release procedure

1. Build and validate the target-specific Intel HEX offline. Verify checksums, target Flash addresses and SHA-256. Never flash a Cube Orange with the Matek build.
2. Upload the HEX under a **new unique filename** to the private R2 bucket, either in release/ (shared PIN) or early/ (individual tester keys). The bucket must remain private, without public R2 URL or custom domain.
3. Update R2's private object _internal/firmware-index.json to map its public build ID to the private object_key, safe filename, channel, and actual SHA-256. Existing index metadata is available as firmware-gateway/firmware-index.json.
4. Update public catalog data/releases.json and the board's metadata-only manifest.json with the matching secure_id, channel, filename, sha256, bytes, timestamp and label. **Do not include public HEX URL/path or a download fallback.**
5. A shared release PIN is stored only as a hash inside the encrypted ACCESS_CODES_JSON Worker secret. Early Tester keys must be individually generated, long, scoped to build_ids, manually approved and revocable. These are bearer secrets, not individually authenticated identities.
6. Provide Corresponding Source for ArduPlane-derived binaries under GNU GPLv3 to recipients. **A PIN cannot restrict their GPL redistribution rights.** The 1.0 catalog's source_url is empty and source_verified is false; that outstanding requirement must be resolved before broad distribution.
7. Confirm a wrong PIN fails, a valid PIN fetch returns a verified SHA-256, the website's download button opens the PIN modal, and the DFU *Load Latest/Selected* button opens the same modal before reading HEX. Hardware ERASE/WRITE always requires separate user confirmation, selected board and safeguards.

## Legacy automation is disabled

The previous .github/workflows/firmware-manifest.yml pipeline archived incoming HEX in the public website folder and created public GitHub Release attachments. That would bypass the Worker PIN. The workflow is now manually triggered and checks only that the current repository does not include any raw HEX; it **does not publish binaries or email subscribers**.

tools/release_manager.py, tools/update_firmware_manifest.py, and tools/publish_github_releases.py now refuse to execute their old public publishing logic when data/firmware-access.json has enabled=true. Don't bypass those safety checks. Use private R2 storage and metadata-only release records.

**Historical exposure:** The original 1.0 HEX was in the public repository before the switch. Removing it from the main branch and UI cannot erase past Git history, caches or any downloaded copy. Similarly, people receiving the PIN can redistribute a downloaded binary; revoking the key only prevents future authenticated API requests.

## Related systems

The monobank Jar remains an independent, voluntary donation link. Tally + private Google Sheets track Early Tester applications; the project owner manually reviews candidates. Donations never provide automatic access to private test firmware. Avoid adding applicant records, secrets or payments to this public repository.
