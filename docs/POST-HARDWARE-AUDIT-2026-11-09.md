# A.T.L.A.S. Control Center — post-hardware audit (2026-11-09)

## Verification scope

The project maintainer reports **successful bench verification on a real flight controller** for the main USB/MAVLink configurator and guided Quick Setup flow, including parameters, compass calibration, finishing the wizard and the flight-dashboard display. This is **field evidence**, distinct from automated CI tests. It is not a blanket safety, compatibility or airworthiness certification.

Independent physical bench tests remain necessary for other controller revisions, full DFU flash/erase recovery, the WebSocket↔UDP/TCP bridge with a real radio link, analog voltage calibration against a multimeter, and completion of every INS thermal-learning cycle.

## Code review and changes

| Finding | Risk | Change |
| --- | --- | --- |
| A second `HEARTBEAT` with another `sysid` could silently switch the active controller on an aggregated MAVLink connection. | Critical for parameter editing on multiple vehicles | Pin the first eligible autopilot `sysid` until disconnect, ignore other-system telemetry, calibration events and PARAM_VALUE acknowledgments. Ignore ground-station heartbeats. |
| USB/WebSocket transport can remain open when FC heartbeats stop; last attitude and ARMED status appeared current. | Stale operational state | Track heartbeat freshness, show link loss, withhold stale flight data and restore live status on the first recovered heartbeat. All write commands still require a recent DISARMED heartbeat. |
| A WebSocket bridge can open but never return a ready message. | Stuck "connecting" state | Add a 12-second handshake deadline; close failed sessions and allow reconnection. Guard concurrent USB connect attempts. |
| Hidden Quick Setup rebuilt its DOM while full MAVLink PARAM_VALUE lists were streaming. | Unnecessary allocations; loss of temperature field focus | Update only when wizard is open. INS editor updates independently, and the wizard only rebuilds on transition to/from a complete parameter list. |
| Repeated Quick Setup visits retained detached INS UI root references. | Memory / detached DOM retention | Reuse mounted INS panels and prune detached roots. |
| Site description covered firmware testing but not real FC checks of the browser configurator. | Incomplete release information | Update homepage, localized page metadata, README and GitHub About copy to reflect observed hardware checks with explicit limits. |

## Tests

CI runs the existing Quick Setup, full parameter editor, servo, MAVLink, firmware-distribution and website checks **plus** `tools/check_post_hardware_audit.cjs`. The new suite verifies FC `sysid` isolation with two vehicles and a GCS, UI link-state / timeout guards, hidden wizard behavior, INS root cleanup and release copy.

Hardware safety: remove the propeller during configuration, independently verify the intended FC and battery, inspect parameter readback, sensor health and failsafe settings before actual flight.

**Operational note:** to switch to another vehicle (or after deliberately changing `SYSID_THISMAV`), disconnect and reconnect the configurator so it pins the new autopilot explicitly.
