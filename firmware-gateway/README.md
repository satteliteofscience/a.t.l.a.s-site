# A.T.L.A.S. firmware access gateway (DEPLOYED)

This is the server-side component for PIN/key-controlled downloads and site-initiated firmware loads. Static GitHub Pages cannot keep PINs or private binaries secret. The Cloudflare Worker requires a private R2 bucket, a rate limiter, and a server-side secret (no user-facing API keys).

## Access modes
- **release**: one project-wide long PIN, controlled by `release.pin_sha256` in secret `ACCESS_CODES_JSON`.
- **early**: an individual long key for each approved Tally Early Tester. They are issued and disabled manually by editing the same secret. A key may be limited to specific build IDs and have an expiry.
- Donation and tester approval are separate. An applicant is never automatically approved for paying.
- This project does not enforce login; the **individual key is a bearer secret** that its holder can share. Use long random codes, not four digits.
- Validating a code permits getting the relevant private R2 object. The exact file is only mapped server-side in R2 at `_internal/firmware-index.json`. A public UI never receives the R2 object key.

## Owner setup

1. Create/sign in to [Cloudflare](https://dash.cloudflare.com/) using your own account.
2. Create an **R2 Standard** bucket `atlas-firmware-private`. **Do not enable public access, r2.dev or a custom public bucket hostname.**
3. Create a Worker with this `wrangler.toml` and `src/index.js`, or deploy using Wrangler (`npx wrangler deploy` from this folder). Create the rate-limiter binding if using the Cloudflare dashboard.
4. Upload the firmware binaries to the private bucket as `release/<build>.hex` and `early/<build>.hex`. The corresponding files may also be backed up in the private Google Drive folders already created.
5. Create `_internal/firmware-index.json` based on `firmware-index.example.json`, with real `object_key`, safe `filename` and file SHA-256 digests. Upload it privately to R2. Do not use an entry before the file and digest have been checked.
6. Generate a **random release PIN at least 12 characters long** and a **different random key of at least 20 characters** for each tester. Hash UTF-8 values with SHA-256. Populate `access-codes.example.json`, then save the **whole JSON as a secret** named `ACCESS_CODES_JSON` using `npx wrangler secret put ACCESS_CODES_JSON` or Cloudflare's Secret UI. Never commit the real JSON, codes or hashes, even to a private copy that is then published.
7. Test `POST https://<worker-name>.<account>.workers.dev/api/firmware/<build-id>` using `Origin: https://satteliteofscience.github.io`, `Content-Type: application/json` and JSON `{"pin":"<test-pin>"}` with a real and a deliberately wrong code. The valid response must contain the expected bytes; invalid keys must return 401 and repeated attempts must be rate-limited.
8. Verified: the Worker is deployed and the gateway API returns the real 4,654,592-byte firmware image on a correct PIN and HTTP 401 on an invalid PIN. The website catalog and DFU loader have secure_id/channel metadata; no direct public HEX fallback remains on the current branch. Test the UX in-browser as well; real hardware flashing remains unverified.
9. Verify the matching GNU GPL corresponding source accompanies all distributed binaries; a PIN gate is not a way to deny code recipients GPL freedoms. Existing public HEX files and Git history are NOT made private retroactively.

## API
- `GET /health`: non-sensitive health response.
- `POST /api/firmware/<build-id>`: JSON `{"pin":"your-code"}`; successful response is an attachment body with `X-ATLAS-SHA256` and `Cache-Control: no-store`.
- `OPTIONS /api/firmware/<build-id>`: CORS preflight for the published GitHub Pages origin.
- There are **no public asset GET** or upload endpoints.

## Security limitations

Cloudflare rate limiter is **approximate**, not a strict global per-code throttle; long unguessable individual codes remain necessary. Worker Secrets and R2 private bucket access must stay out of the public repo. A recipient can save and redistribute a fetched firmware file; no PIN can revoke an already downloaded copy. Key revocation controls future API access only.

The gateway has been deployed and successfully tested from the live website. The website now sets `data/firmware-access.json.enabled=true` and uses secure_id/channel in both metadata-only catalogs. A direct public HEX path is no longer linked or present in the current main branch; historical public copies remain accessible through Git history. Old public firmware publishing automation has been disabled. See docs/RELEASE-DEPLOYMENT.md for the new procedure.
