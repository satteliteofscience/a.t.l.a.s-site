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

Visitors can support A.T.L.A.S. using the public **[monobank Jar](https://send.monobank.ua/jar/7jkKfdWREX)** named `A.T.L.A.S. — Підтримка розробки`. The link is configured in `data/support.json`; the earlier IBAN is intentionally hidden. Donations are **voluntary**, independent from newsletter registration and do not buy early-test access. The website never handles card details or verifies transfer settlement: visitors choose the amount and supported methods directly on monobank.

For email newsletters, the site supports separate **Brevo-hosted double opt-in forms** for Matek H743, Orange Cube and other boards. Until the project owner supplies the public hosted URLs in `data/subscriptions.json`, the site correctly reports that subscription is not configured. No subscriber addresses are stored in this public repository. See **[PROVIDER-SETUP.md](PROVIDER-SETUP.md)** for the no-server workflow. The optional private SMTP backend is documented separately in [MAIL-SERVICE-SETUP.md](MAIL-SERVICE-SETUP.md).

## Firmware releases and source compliance

Firmware binaries are distributed through `Firmware/`, with immutable archived versions and checksums. The original development repository is not publicly linked; **that does not replace the obligation to provide Corresponding Source to recipients** for GPL-covered distributions. Publish a source archive matching the released firmware under `Firmware/Sources/` or another accessible, documented location.

The repository cover under `assets/github-social-preview.jpg` may be uploaded in **Settings → Social preview**. The public repository should not contain private API credentials, bank API tokens, subscriber databases, SMTP credentials or server passwords.

## Repository resources

- [FAQ](faq.html) — modified flight modes and minimum NOAID sensor requirements.
- [Changelog](changelog.html) — pre-release 1.0 and future releases.
- [Release process](RELEASE-DEPLOYMENT.md) — incoming HEX, archive, rollback and manifests.
- [No-server provider setup](PROVIDER-SETUP.md) — Brevo hosted forms, LiqPay, release notifications and private early testing.
- [Legacy mail service setup](MAIL-SERVICE-SETUP.md) — optional self-hosted SMTP/SQLite alternative.
- [Suggested commits](GITHUB-COMMITS.md) — ready-to-use commit titles and short descriptions.
- [History](docs/LEGACY-README.md) — archived development documentation.

## Acknowledgements and licensing

**A.T.L.A.S.** is an independent project developed by Oleksandr with AI-assisted tooling, built on top of the ArduPilot ecosystem. This is **not an official ArduPilot release**. Keep the upstream copyright notices and license conditions. Firmware modifications derived from ArduPilot remain subject to applicable **GNU GPLv3-or-later** obligations.

<div align="center"><sub>A.T.L.A.S. Control Center • Community research • Pre-release</sub></div>
