# Private email service installation

This repository is static and cannot securely accept registrations or send email by itself. The backend is distributed **separately** as `ATLAS-Subscriber-Service-v0.7.0.zip`, **never** as a subfolder in public GitHub Pages. Do not place personal data, SQLite DB, SMTP passwords, access tokens or signing keys in the public repository.

1. Provision your own server, SMTP account and HTTPS domain such as `api.<your-domain>` (example only). Set up SPF/DKIM/DMARC with your email provider for deliverability.
2. Extract the private server package under `/opt/atlas-mail`; create `/srv/atlas-private` with permissions available only to the service account.
3. Copy `.env.example` to `/etc/atlas-mail.env`, restrict permissions (e.g. `chmod 600`) and set the **real** values. Generate the signing secret with `python3 -c "import secrets; print(secrets.token_hex(32))"`. Do not commit the resulting file.
4. Configure the sample systemd and Nginx reverse proxy; set HTTPS certificates and an exact `ATLAS_ALLOWED_ORIGIN` matching the public site origin. Bind the Python HTTP server only to `127.0.0.1`.
5. Set `data/subscriptions.json` to your live HTTPS endpoint, for example `https://api.yourdomain.example/v1/subscribe`. This public URL is not secret.
6. Test email verification, unsubscribe and consent before accepting real registrations.

## Firmware emails

Each user selects a flight controller. An admin selects a matching HEX file, version and release notes. Only emails confirmed through a 48-hour link are eligible.

Preview recipients (no email sent):

```bash
python3 atlas_mail_service.py send-release --board matek-h743-wing-v3 --version 1.01 --stage public --release-id matek-v101 --notes-file ./release-notes.txt --firmware /srv/atlas-firmware-archive/matek-v101.hex
```

Send after verifying the matching binary and notes by adding `--send`. The service attaches the HEX, includes an unsubscribe URL and records deliveries to prevent duplicate campaigns.

For early access, users must express interest and the developer must **manually** verify / approve them. After approval:

```bash
python3 atlas_mail_service.py approve-tester --email confirmed@example.com
```

Then send using `--stage early` and a unique release id. Public releases go to all confirmed subscribers of that specific board. `cube-orange` and `other` will not receive a Matek firmware attachment.

**This is not an automatic bank transaction verification.** IBAN transfers must be reviewed outside the site. The service also does not monitor GitHub releases automatically: you explicitly authorize sending each campaign using `--send`.

## Privacy and security

Subscriber emails and controller models are stored only in the private SQLite database; add encryption/backups and restricted filesystem access on your server. Users must confirm consent and can unsubscribe. There is no public web admin panel. Never expose the private service directory from a static web server.

Before opening registration, configure an actual contact channel for deletion requests and complete the privacy notice with your controller/operator contact details and local legal requirements.
