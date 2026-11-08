# A.T.L.A.S. — no-server provider setup (GitHub Pages)

The website stays on **GitHub Pages**. Signup is delegated to **Brevo hosted pages**, voluntary card/Google Pay donations to a **provider-hosted LiqPay payment link**, public firmware files and immutable tags to **GitHub Releases**, and publication/newsletters to **GitHub Actions**. No self-hosted HTTP/SMTP server is required for these features, but external accounts must be configured by the owner.

> Current status: Brevo hosted URLs and the LiqPay hosted payment URL are intentionally blank. Nothing can register an email or accept LiqPay card payments until the owner supplies their actual public links. The existing IBAN fallback is independent.

## 1. Brevo double opt-in signup

1. Log in to Brevo (account registration, verified sender domain, data-operator/contact information).
2. Create separate opt-in subscriber **lists**, e.g. `ATLAS / Matek H743-WING V3`, `ATLAS / Orange Cube`, `ATLAS / Other`. Do not add unconfirmed contacts to the lists used by automated releases.
3. Under **Marketing → Forms**, create three **Full page/embedded** sign-up forms, each assigned to its corresponding list. Add a required email field, explicit newsletter consent/GDPR explanation, CAPTCHA where available, and optional *early testing interest* (custom Boolean attribute).
4. Choose **Double confirmation email** for each form. Configure the correct confirmation template and unsubscribes. Run a test on a real address; confirm the contact only appears in the intended notification list after clicking the email confirmation link. Verify the opt-out link.
5. Copy the **hosted, public HTTPS URL**, not an API key. Update `data/subscriptions.json` → `hosted_forms` for each board, for example:
   `"matek-h743-wing-v3": "https://...sibforms.com/..."`
   URLs must be official Brevo/Sendinblue/Sibforms hostnames; the site checks them before opening. Nothing is submitted directly from GitHub Pages to Brevo.
6. The website's board selection simply routes to the corresponding Brevo form. The actual email, consent and early-testing checkbox must be entered **again on Brevo** to make verification trustworthy. Payment is optional and does not grant access.
7. Publish a **real project contact**, data-controller/operator details and privacy-request process on `privacy.html` before opening registration.

Official guide: https://help.brevo.com/hc/en-us/articles/208771869-Create-a-sign-up-form-in-Brevo

## 2. LiqPay / Google Pay / manual bank transfer

1. In your own LiqPay merchant/charity account, create a **hosted payment/donation link** supported by the provider and ensure the beneficiary and page are correct. Test the payment journey with a small amount.
2. Set `data/support.json` → `donation_url` to that **real public HTTPS URL**. The site will show a payment link plus the existing IBAN transfer option. Payment data is never sent to your website.
3. Google Pay is shown only if **LiqPay offers it** for the payer's device, wallet, currency and payment settings. The website does not claim to execute or verify Google Pay itself.
4. Never paste LiqPay `private_key`, merchant passwords, card numbers or signed checkout payload secrets in public HTML/JS/JSON. Do not infer donation status from a browser redirect.

A hosted checkout link can be used without a custom server. If you later want signed payments and automatic order/payment reconciliation, that separate feature requires a trustworthy signing/backend service.

## 3. GitHub Releases + firmware source obligation

The existing `.github/workflows/firmware-manifest.yml` publishes firmware index files from `Firmware/incoming/matek-h743-wing-v3/`. It also creates **GitHub Releases** only for manually verified **HEX + corresponding-source archive** pairs:

- Put the complete matching source archive into `Firmware/Sources/atlas-vX.Y-source.zip`. Verify it really matches the binary and meets applicable GNU GPL Corresponding Source terms.
- Put your build into `Firmware/incoming/matek-h743-wing-v3/`. Include `release.json` with `version`, `label`, `source_url` and `source_verified:true` as shown in [RELEASE-DEPLOYMENT.md](RELEASE-DEPLOYMENT.md).
- Commit; GitHub Actions runs the HEX validator and immutable archiver, commits the catalog changes, then creates a pre-release GitHub tag **with the HEX and source archive**. The tag uses a SHA-256-derived identifier; it will not create duplicates.
- Older builds missing corresponding source are **not** automatically promoted to GitHub Releases. The site catalog may still list them; before wider distribution, fix any remaining source-availability problem.

The public archive: https://github.com/satteliteofscience/a.t.l.a.s-site/releases

## 4. Brevo automatic public-release campaigns

After testing the forms and sender, configure GitHub repo **Settings → Secrets and variables → Actions**:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `BREVO_API_KEY` | A limited-key API credential from your Brevo account |
| Variable | `BREVO_SENDER_EMAIL` | Your verified Brevo sender email |
| Variable | `BREVO_LIST_ID_MATEK` | Numerical ID of the **confirmed** Matek update list |
| Variable | `ATLAS_BREVO_SEND_ENABLED` | `true` **only after end-to-end testing** |

When a **new verified public Release** is created, GitHub Actions creates a Brevo email campaign with the matching controller list only, a link to the public release and source package, and Brevo's unsubscribe placeholder. No API key or subscriber data is checked into GitHub or exposed in browser code. No campaigns are sent while disabled. For subsequent board support, add a board-specific validated release pipeline **and** its own Brevo list mapping. Do not send Mat​ek HEX to Cube users.

Test a live confirmed address and unsubscribed address before enabling. A failed send may leave a Brevo campaign draft; inspect Brevo campaigns manually rather than blindly resending workflow runs. A public Release created by GitHub's built-in token does not reliably trigger a *second* workflow; the notification is intentionally in the **same** publish workflow.

API docs: https://developers.brevo.com/reference/create-email-campaign and https://developers.brevo.com/reference/send-email-campaign-now

## 5. Early Tester Program — genuine access control

**Do not upload early binaries to GitHub Pages or public GitHub Releases.** Hidden buttons, obfuscated URLs and client-side passwords offer no protection.

1. Create a **separate private GitHub repository** such as `atlas-private-testing` under your own account. It is not created by this website workflow.
2. In Brevo's signup form include a separate opt-in for early testing and an optional GitHub username (make clear that approval is manual, not a purchase benefit).
3. After verifying the email and candidate, invite that GitHub username to the private repo as a collaborator with minimum suitable permissions (read-only if available); give access only to approved testers.
4. Upload private test binaries and release notes to the **private** repository; remove access whenever approval is revoked. Never expose private tokens in the static website.
5. Public download buttons remain for public releases only. No public code can assert a user is an approved early tester; GitHub enforces authorization.

Note: A GitHub private repo is separate from an owner's source archive obligations to recipients of GPL-covered firmware. Provide Corresponding Source to recipients of private test builds as required by the license.

## Acceptance checklist

- All three language variants (RU/UA/ENG) show the subscription/payment options.
- Blank Brevo URL: no email transmitted and an accurate unavailable notice.
- Valid configured Brevo URL: opens hosted form for the selected board, address and consent entered only on Brevo, double-confirmation email received.
- LiqPay URL blank: IBAN remains usable. Valid real LiqPay URL: external provider page handles payment; website never reports a transaction as paid.
- Public GitHub Release appears only for explicitly source-verified matching files.
- After the secret and vars are configured, a **new** public release triggers a campaign to the **confirmed** list for that board; other boards and unconfirmed recipients are excluded.
- Private early HEX stays in private GitHub only; approvals/revocations are tested.

## Security and privacy

Do not place SMTP credentials, Brevo API keys, LiqPay signing keys, GitHub PATs or subscriber emails in public GitHub files. Keep account owner contact and legal disclosures current. If you change a provider, update privacy and consent wording before collecting new contacts.
