<div align="center">

![A.T.L.A.S. Control Center — EKF3 • NOAID](assets/github-social-preview.jpg)

# A.T.L.A.S. — Control Center

**Independent ArduPlane research build · Browser-based configurator · Flight-controller tooling**

![Status](https://img.shields.io/badge/CHANNEL-PRE--RELEASE-c6bd68?style=flat-square&labelColor=152010)
![Base](https://img.shields.io/badge/ARDUPLANE-4.7.2-b7c56b?style=flat-square&labelColor=152010)
![Languages](https://img.shields.io/badge/LANG-RU%20%7C%20UA%20%7C%20EN-dbc980?style=flat-square&labelColor=152010)
![License](https://img.shields.io/badge/FIRMWARE-GPLv3--or--later-90ac64?style=flat-square&labelColor=152010)

**[Website](index.html) · [Configurator](configurator.html) · [FAQ](faq.html) · [Changelog](changelog.html) · [Support](index.html#support)**

</div>

> [!WARNING]
> **Experimental aircraft control software.** Use ground testing, correct airframe configuration and independent validation. Browser DFU, GPS-denied navigation and automated modes are not universally verified on physical hardware. Remove the propeller for bench work.

## What is A.T.L.A.S.?

A.T.L.A.S. is an independent experimental modification of **ArduPlane 4.7.2**, with an accompanying **Control Center** website. The project explores GPS-denied EKF3/NOAID estimation, additional TAKEOFF and CRUISE logic, navigation experiments, telemetry, calibration tools and a web-based firmware catalog.

The public repository is for the **website and published artifacts**. The developer's private working repository is not linked. Recipients of GPL-covered firmware must nonetheless have access to the corresponding firmware source for each distributed binary.

### Key areas

| System | Included capability |
| :--- | :--- |
| Flight data | Attitude readout, MAVLink telemetry, simulated aircraft |
| Settings | Full parameter list, Basic Tuning, Flight Modes, Servo Output |
| Calibration | Accelerometer, compass, radio, battery monitoring |
| Video | Onboard OSD layout editor, gimbal configuration |
| Firmware | Intel HEX catalog, SHA-256 verification, version archive / rollback selection |
| Documentation | FAQ and release-by-release changelog, translated to RU / UA / EN |
| Community | Donations via manual IBAN transfer, optional verified email subscription |

### Website languages

**Русский · Українська · English.** Technical parameter names follow ArduPilot naming.

## Deploying the public site

1. Upload the **contents** of this repository to your public GitHub Pages repository.
2. GitHub → **Settings → Pages → Deploy from a branch**, select `main`, `/(root)`.
3. Open the HTTPS site and review its flight-control disclaimers and firmware links.
4. To release a new HEX without replacing an older build, use the release indexer documented in **[RELEASE-DEPLOYMENT.md](RELEASE-DEPLOYMENT.md)**.

The site is static, but release indexing requires a GitHub Actions workflow or a private watcher on your own server. Simply dropping a file into a published GitHub Pages folder is not enough to trigger reindexing until a build/commit occurs.

## Receive updates and donate

The public site supports a **manual IBAN transfer**. The IBAN is public account information intentionally provided by the developer; **there is no card-payment processing and no automatic payment confirmation**.

The newsletter form requests an email address, chosen flight-controller model and optional early-testing interest. Subscription requires an independently deployed **private backend with SMTP and email confirmation**. This site never stores subscriber emails in public repository files.

**[Private subscriber server package](MAIL-SERVICE-SETUP.md)** documents setup. Until that service is deployed and `data/subscriptions.json` has its real HTTPS API URL, the site cannot receive registrations or send firmware by email. Donation by IBAN remains available without subscription.

Early-test access is opt-in and requires explicit developer approval. Donating alone does not prove an email address belongs to a donor.

## Firmware releases and source compliance

Firmware binaries are distributed through `Firmware/`, with immutable archived versions and checksums. The original development repository is not publicly linked; **that does not replace the obligation to provide Corresponding Source to recipients** for GPL-covered distributions. Publish a source archive matching the released firmware under `Firmware/Sources/` or another accessible, documented location.

The repository cover under `assets/github-social-preview.jpg` may be uploaded in **Settings → Social preview**. The public repository should not contain private API credentials, bank API tokens, subscriber databases, SMTP credentials or server passwords.

## Repository resources

- [FAQ](faq.html) — modified flight modes and minimum NOAID sensor requirements.
- [Changelog](changelog.html) — pre-release 1.0 and future releases.
- [Release process](RELEASE-DEPLOYMENT.md) — incoming HEX, archive, rollback and manifests.
- [Mail service setup](MAIL-SERVICE-SETUP.md) — double opt-in and release email workflow.
- [Suggested commits](GITHUB-COMMITS.md) — ready-to-use commit titles and short descriptions.
- [History](docs/LEGACY-README.md) — archived development documentation.

## Acknowledgements and licensing

**A.T.L.A.S.** is an independent project developed by Oleksandr with AI-assisted tooling, built on top of the ArduPilot ecosystem. This is **not an official ArduPilot release**. Keep the upstream copyright notices and license conditions. Firmware modifications derived from ArduPilot remain subject to applicable **GNU GPLv3-or-later** obligations.

<div align="center"><sub>A.T.L.A.S. Control Center • Community research • Pre-release</sub></div>
