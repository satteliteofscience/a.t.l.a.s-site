# A.T.L.A.S. 0.4 — Calibration status

- Visual layout & navigation: implemented; static checked.
- JS syntax: checked with `node --check` for all scripts.
- Synthetic MAVLink parser packets: tested for calibration commands, `COMMAND_ACK`, servo output, battery status, compass report.
- Hardware USB calibration: **NOT TESTED** (real flight controller needed).
- Servo readout: READ ONLY; no actuator test/override.
- DFU flashing code retained from v0.3.1, not altered here; it remains experimental.
- Browser automation screenshot: not possible in this environment (browser navigation blocked by administrator); validate on GitHub Pages in Chrome/Edge.
- Reboot may be needed for individual battery/compass parameters. Calibration must be performed with propeller removed.


## Version 0.4.1 updates
- Start/accept/cancel calibration buttons no longer open native browser confirmation pop-ups. Inline safety notes remain visible; actions still require live DISARMED heartbeat.
- Six-position MAVLink sequence follows firmware-provided `COMMAND_LONG` 42429 positions; confirms only the requested pose. It waits for the explicit success/failure marker and never interprets initial accepted ACK as completion. Extended 4-minute per-position timeout.
- Parameter list uses `PARAM_REQUEST_LIST` followed by `PARAM_REQUEST_READ` for missing indices, with rate limiting and bounded retries. Progress is based on unique `param_index` values and incomplete transfers are reported as such.
- Byte-level/logic tests are synthetic; actual Matek H743 V3 calibration must still be validated.

## Release 1.0 field-testing update — 2026-11-09

The v0.4 statements above are historical. Since then, the maintainer reports successfully running the Control Center on a **real flight controller**, including the guided USB/MAVLink setup and compass calibration flow. Specific release features, especially complete INS temperature learning, all DFU erase/recovery cases, and analog battery voltage adjustment still require their own hardware checks. See [POST-HARDWARE-AUDIT-2026-11-09.md](POST-HARDWARE-AUDIT-2026-11-09.md).
