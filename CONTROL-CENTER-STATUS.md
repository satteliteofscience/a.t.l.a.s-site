# A.T.L.A.S. Control Center 0.3 — WebUSB DFU public release candidate

- Public Intel HEX included. Firmware folder, SHA-256 manifest, board catalog, all three languages and the UI preserved.
- `dfu-flasher.js`: USB descriptor parser now associates a DFU functional descriptor with its **interface number across all alternate settings**, instead of requiring it immediately after selected alt 0. If `USBAlternateInterface.interfaceName` is empty, it parses `iInterface` and tries indexed USB string descriptors.
- DFU writes remain blocked if the H743 Flash map OR the actual reported `wTransferSize` cannot be verified.
- `dfu-ui.js`: helpful explicit warning for `file://` preview. `new URL(..., document.baseURI)` for GitHub Pages subdirectories.
- `app.js` and `configurator.js`: same-origin relative release links now supported and public Matek HEX shown in the catalog.
- Software simulation: full-chain DFU multiple alternate settings, missing browser interfaceName, USB string retrieval, erase, write and complete readback passed. Real physical H743 still NOT tested.
- Production deployment: direct upload to **public GitHub Pages repo root**, use HTTPS, no console or local server for site visitors. USB permissions and compatible Windows driver may still be needed.
- Full erase touches ArduPilot bootloader because HEX starts at 0x08000000; keep recovery via STM32 ROM DFU/STM32CubeProgrammer available.
- Publishing binary firmware derived from ArduPilot imposes GPL corresponding-source obligations.

## Release 1.0 field-testing update — 2026-11-09

This document describes an old v0.3 public candidate and is not the current release certification. The maintainer has since bench-tested the core **Release 1.0 configurator** with a real flight controller (USB/MAVLink, Quick Setup and related calibration workflow). Board-specific DFU, network bridge, voltage adjustment and complete INS thermal learn-cycle require separate verification. See [POST-HARDWARE-AUDIT-2026-11-09.md](POST-HARDWARE-AUDIT-2026-11-09.md).
