<div align="center">

![A.T.L.A.S. Control Center — EKF3 • NOAID](assets/github-social-preview.jpg)

# A.T.L.A.S. — Control Center

**Independent ArduPlane 4.7.2 Release 1.0 · Browser-based configurator · Flight-controller tooling**

![Status](https://img.shields.io/badge/CHANNEL-RELEASE%201.0-86ac64?style=flat-square&labelColor=152010)
![Base](https://img.shields.io/badge/ARDUPLANE-4.7.2-b7c56b?style=flat-square&labelColor=152010)
![Languages](https://img.shields.io/badge/LANG-RU%20%7C%20UA%20%7C%20EN-dbc980?style=flat-square&labelColor=152010)
![License](https://img.shields.io/badge/FIRMWARE-GPLv3--or--later-90ac64?style=flat-square&labelColor=152010)

**[Website](index.html) · [Configurator](configurator.html) · [FAQ](faq.html) · [Changelog](changelog.html) · [Support](index.html#support)**

</div>

> [!IMPORTANT]
> **A.T.L.A.S. Release 1.0 is tested and ready to install on Matek H743-WING V3.** Select the exact hardware revision, back up existing parameters and remove the propeller for bench configuration. GPS-denied navigation can accumulate position drift; verify sensor health, failsafes and aircraft-specific settings before flight.

## What is A.T.L.A.S.?

A.T.L.A.S. is an independently developed and tested modification of **ArduPlane 4.7.2**, accompanied by the **Control Center** website. Release 1.0 includes GPS-denied EKF3/NOAID estimation, adapted TAKEOFF and CRUISE logic, navigation features, telemetry, calibration tools and a web-based firmware catalog.

The public repository is for the **website and published artifacts**. The developer's private working repository is not linked. Recipients of GPL-covered firmware must nonetheless have access to the corresponding firmware source for each distributed binary.

### Key areas

| System | Included capability |
| :--- | :--- |
| Flight data | Attitude readout, MAVLink telemetry, simulated aircraft |
| Settings | Full parameter list, Basic Tuning, Flight Modes, Servo Output |
| Calibration | Accelerometer, compass, INS temperature compensation, radio, analog battery monitor |
| Video | Onboard OSD layout editor, gimbal configuration |
| Firmware | PIN-protected Intel HEX catalog, SHA-256 verification and web-DFU loading |
| Documentation | FAQ and release-by-release changelog, translated to RU / UA / EN |
| Community | Voluntary monobank Jar donations and Tally Early Tester applications |

### Website languages

**Русский · Українська · English.** Technical parameter names follow ArduPilot naming.

## Hardware-tested configurator

The project maintainer has **bench-tested A.T.L.A.S. Control Center on a real flight controller**, including the core USB/MAVLink connection, guided Quick Setup, parameter loading and the successful compass-calibration and completion workflow. These are real-device observations, not only synthetic tests. Automated GitHub Actions regression suites also cover parameter validation, MAVLink framing and the UI.

**Scope matters:** this hardware verification does not mean every supported controller, DFU firmware/erase path, local UDP/TCP bridge, analog multimeter voltage adjustment or the complete INS temperature-learning warmup cycle was individually verified. Those workflows remain subject to independent board-specific bench testing with the propeller removed. A successful wizard is not flight clearance.

## Deploying the public site

1. Upload the **contents** of this repository to your public GitHub Pages repository.
2. GitHub → **Settings → Pages → Deploy from a branch**, select `main`, `/(root)`.
3. Open the HTTPS site and review its flight-control disclaimers and firmware links.
4. For another build, upload the HEX privately to Cloudflare R2, update its private firmware index and the site's public *metadata-only* catalogs. See [RELEASE-DEPLOYMENT.md](RELEASE-DEPLOYMENT.md).

The static GitHub Pages site prompts for a PIN, but **server-side Cloudflare Worker** verifies the code and streams the encrypted-at-rest private R2 object. Do not commit raw HEX files into this public repository. Legacy GitHub Actions public firmware publishing is disabled.

## Receive updates and donate

Visitors can support A.T.L.A.S. using the public **[monobank Jar](https://send.monobank.ua/jar/7jkKfdWREX)** named `A.T.L.A.S. — Підтримка розробки`. The link is configured in `data/support.json`; the earlier IBAN is intentionally hidden. Donations are **voluntary**, independent from newsletter registration and do not buy early-test access. The website never handles card details or verifies transfer settlement: visitors choose the amount and supported methods directly on monobank.

Early Tester applications now use the public [Tally form](https://tally.so/r/ArKQJl) linked from the Support section. Submissions are stored in the owner's **private Google Sheets**; the public site never stores email addresses or subscriber data. Applicants give explicit consent, and the maintainer manually reviews requests, verifies email and optionally checks donations before granting private test access. Donation is not a requirement and does not imply approval. This integration does **not** automatically send newsletters or verify email ownership. See [PROVIDER-SETUP.md](PROVIDER-SETUP.md) for operational steps; the legacy private SMTP backend is optional.

## Firmware releases and source compliance

Firmware binaries are now downloaded through a private Cloudflare R2 bucket and server-side PIN-checking Worker. GitHub Pages contains catalog metadata only. The ordinary release uses a shared PIN; Early Tester firmware uses individual revocable keys. **Already-public Git history and redistributed binaries cannot be made private retroactively.**

**Corresponding Source warning:** A.T.L.A.S. is derived from ArduPlane under GNU GPLv3-or-later, so recipients must have access to the Corresponding Source and retain their GPL redistribution rights. The current 1.0 build does not have a verified source URL in the public catalog. Supply the exact corresponding source and required notices before broad distribution.

The repository cover under `assets/github-social-preview.jpg` may be uploaded in **Settings → Social preview**. The public repository should not contain private API credentials, bank API tokens, subscriber databases, SMTP credentials or server passwords.

## Repository resources

- [FAQ](faq.html) — modified flight modes and minimum NOAID sensor requirements.
- [Changelog](changelog.html) — Release 1.0 and future updates.
- [Release process](RELEASE-DEPLOYMENT.md) — private R2 uploads, version catalog, keys and matching GPL source.
- [No-server provider setup](PROVIDER-SETUP.md) — Brevo hosted forms, LiqPay, release notifications and private early testing.
- [Legacy mail service setup](MAIL-SERVICE-SETUP.md) — optional self-hosted SMTP/SQLite alternative.
- [Suggested commits](GITHUB-COMMITS.md) — ready-to-use commit titles and short descriptions.
- [History](docs/LEGACY-README.md) — archived development documentation.

## Acknowledgements and licensing

**A.T.L.A.S.** is an independent project developed by Oleksandr with AI-assisted tooling, built on top of the ArduPilot ecosystem. This is **not an official ArduPilot release**. Keep the upstream copyright notices and license conditions. Firmware modifications derived from ArduPilot remain subject to applicable **GNU GPLv3-or-later** obligations.

<div align="center"><sub>A.T.L.A.S. Control Center • Release 1.0 • Tested build</sub></div>
