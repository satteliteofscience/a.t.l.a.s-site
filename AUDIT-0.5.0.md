# A.T.L.A.S. Control Center v0.5.0 — technical review

## Scope

Static revision of the website/configurator source, including JavaScript modules, mobile CSS, translations, navigation, offline website assets and the firmware catalog. Existing flight-controller hardware was not accessible. This review is **not** a certification, hardware test or full proof of algorithm correctness.

## Concrete improvements

- Paused heavy aircraft canvas drawing outside the viewport and when the page is hidden, with an approximately 30 FPS cap.
- Avoided rebuilding the full Parameter Tree and Basic Setup cards during MAVLink parameter streams unless the matching page is active.
- Reduced background joystick polling and stopped polling updates in hidden tabs.
- Reduced dashboard attitude-canvas rendering when the user is on another page.
- Added explicit USB/WebSerial cleanup before navigation to the main site or changelog and restored the HUD on browser back-forward cache return without pretending USB is reconnected.
- Added narrow-screen improvements to the sidebar, horizontal scrolling, sticky navigation, touch targets and servo editor.
- Added multilingual changelog, updated site navigation, supplementary translation layer and tuning labels.

## Existing protections retained

- DFU does not proceed without verified Flash geometry / wTransferSize and user confirmation.
- Six-position calibration remains driven by MAV_CMD_ACCELCAL_VEHICLE_POS from the flight controller, with no fake success state.
- Parameter writes require a live, confirmed DISARMED state and PARAM_VALUE acknowledgement.
- Direct PWM bench test does not automatically change throttle or flight-control channel functions.
- Joystick remains input preview only; MAVFTP remains read-only; parachute deployment commands are not added.

## Remaining verification tasks

1. **Complete upstream firmware diff:** need the exact A.T.L.A.S. 4.7.2 Git source tree and the matching stock ArduPlane 4.7.2 tag to verify each history item against shipped HEX.
2. **Real hardware:** WebSerial disconnection while the flight controller is connected; background browser visibility; DFU read/write and interruption recovery; ESC output and failed PARAM_SET responses.
3. **Browser runtime:** the available automated browser environment blocked local file/localhost navigation. JavaScript syntax and static dependency checks passed; full end-to-end UI/browser performance testing was unavailable.
4. **License:** public distribution of modified ArduPilot HEX requires provision of corresponding source code as required by its GPL terms.
5. **Safety:** aircraft/ESC/gimbal/parachute output behavior must be tested on a propeller-free bench before use.

## Evidence quality

The retained 4.7.1 changelog and development conversation establish the history, but are not a complete source diff for 4.7.2. The saved `mode_fbwa.cpp` snippet supports the current RUD_LIMIT_DEG target-roll logic. Distinctions are reflected per item in `data/changelog.json`.
