# A.T.L.A.S. PUBLIC SITE — RELEASE DEPLOYMENT

The original ArduPlane/modification repository is NEVER required for this website. Keep it on a separate protected server, not in the public website directory.

## Static GitHub Pages mode

1. Upload the contents of the site ZIP into your PUBLIC WEBSITE repository, not the private firmware source repository.
2. `.github/workflows/firmware-manifest.yml` can process new HEX files on push if GitHub Actions is enabled and `contents: write` is permitted. Use a separate PUBLIC SITE repository; never give its workflow access to your private firmware sources or secrets.
3. To publish a new version, put the new HEX into `Firmware/incoming/matek-h743-wing-v3/`. You CAN use the same filename as last time because this is an inbox, not the archive. Commit/push the HEX into the public site repository. The workflow copies it to a unique immutable archive filename and refreshes `data/releases.json` and `manifest.json`. It removes the incoming upload in its generated commit.
4. Older releases remain in `Firmware/Matek Wing H743-V3/releases/`; the original 1.0 HEX stays at the old path too.
5. Upload a complete corresponding source package for each distributed GPL binary to `Firmware/Sources/`. Add its relative path as `source_url` in the optional `release.json`, or set the reference in the catalog. WITHOUT the matching source, distribution does not comply with GNU GPLv3.

NOTE: GitHub Pages cannot run Python on each HTTP request or scan an FTP directory. The workflow runs during deployment. It will not notice an uncommitted file copied to your local PC; you must push it.

## Own Linux server / truly automatic mode

1. Deploy the PUBLIC site to `/srv/atlas-public`. Do not place private code or private files under that webroot.
2. Create a low-privilege `atlas-public` service user with write access ONLY to `Firmware/` and `data/`.
3. Serve the public pages over HTTPS with Nginx or another static server, disabling directory listing. `deploy/nginx-static.example.conf` is a starting example only, not a configured production HTTPS site.
4. Run `python3 tools/release_manager.py --watch --interval 5`, or install the sample systemd unit after adjusting the paths and service user. It waits 3 seconds after the last modified time before ingesting a file to avoid reading an incomplete copy.
5. Build a new HEX and copy it to `/srv/atlas-public/Firmware/incoming/matek-h743-wing-v3/`, using the SAME name if desired. The watcher moves a validated copy into the immutable `releases/` directory, updates both manifests atomically, and deletes the inbox copy. Do not copy directly over an archived HEX.
6. You may optionally add `release.json` in that same inbox with the version, display label, and public path to a corresponding source archive. Example `data/release-example.json`. If absent, a UTC build timestamp is used instead.
7. The homepage catalog refreshes automatically every 60 seconds while visible. Hard reload if necessary. DFU lists archived versions separately for selection and checksum verification.

## Donation setup (no payment gateway credentials inside the site)

Edit `data/support.json` in the PUBLIC webroot. You may set:
- `donation_url`: HTTPS donation page created by your bank/payment provider (e.g. monobank Banka). This opens outside the website; no payment data is handled by this site.
- `iban`: your OWN Ukrainian IBAN `UA` plus 27 digits, checksum-validated by site JS.
- `recipient`: legal name of the account holder; `bank`: name of bank; `purpose`: optional transfer note.

Never place API tokens, personal login credentials, authentication cookies, seed phrases, or card details in support.json. The entire JSON file is public. The donation button will display a configuration notice until a valid payment URL or IBAN is provided. Donations cannot be processed until real details have been supplied. Check Ukrainian tax and payment-provider requirements before accepting transfers.

## Private source code and access control

Private work-in-progress source repositories should be stored on a separate domain/server or private VCS with MFA, user accounts, access logs, off-site backup, firewall and least-privilege access. Daily rotating shared passwords do not automatically offer strong protection; use unique per-user access and TOTP/SSO/SSH keys. Nothing on a STATIC public website can securely enforce server-side permissions. Publicly distributed GPL firmware still requires corresponding source access to the binary recipient. This project contains no server-side password rotation implementation.

## Supported board / safeguards

Only target `Matek H743-WING V3` is configured for automatic publishing. ArduPilot .HEX is validated for contiguous STM32H743 2MiB full-flash boundaries, Intel HEX checksums and SHA-256 before it is published. Other hardware needs a separate board-specific pipeline and validation; do NOT reuse the Matek firmware on another board. The WebUSB DFU path still requires hardware testing; rollback can always be performed using a compatible external flasher.
