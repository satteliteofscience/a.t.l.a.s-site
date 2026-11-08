# A.T.L.A.S. Control Center 0.6.0

**Release instructions:** read [RELEASE-DEPLOYMENT.md](RELEASE-DEPLOYMENT.md) before publishing.

This ZIP includes the PUBLIC WEBSITE, immutable archived firmware releases, an automatic upload indexer, and donation-button UI. It does **not** include nor connect to your PRIVATE SOURCE REPOSITORY, any passwords, or real banking details.

**GPL blocker:** for each distributed modified ArduPilot HEX, provide the matching Corresponding Source via a public site download (e.g. `Firmware/Sources/`). A closed original repository is fine for ongoing private work but does not satisfy GPL for recipients of released binaries.

---

# A.T.L.A.S. Control Center 0.5.0 — GitHub Pages / Pre-Release


> **Версия 0.5.0:** README включает исторические заметки о предыдущих версиях, некоторые из которых были заменены более поздними реализациями. Актуальные возможности и ограничения описаны в `V0.5.0-RELEASE-NOTES.md`.

## Новый раздел «Список изменений»

- `changelog.html` — отдельная трёхъязычная страница с 16 направлениями модификаций A.T.L.A.S., поиском и фильтрами.
- `data/changelog.json` — структурированная история, разделяющая код, историю разработки и экспериментальные изменения.
- `FIRMWARE-CHANGELOG-DRAFT.md` — предварительная карта firmware-патчей. **Это не подтверждённый полный diff**: исходное дерево текущей 4.7.2 не было предоставлено в этой сессии.
- `config-ui-i18n.js` — дополнительные переводы конфигуратора RU / UK / EN.

Опубликованный HEX остаётся в каталоге сайта. **При распространении модифицированного ArduPilot следует обеспечить получателям соответствующие исходники согласно условиям GPL.**

Этот архив предназначен для публикации **в корне публичного GitHub Pages репозитория**. Отдельный сервер, Node.js, Python и командная строка посетителям не нужны.

## Публикация без консоли

1. Распакуйте архив на компьютере.
2. В браузере откройте свой публичный GitHub-репозиторий с сайтом → **Add file → Upload files**.
3. Загрузите **содержимое** архива, сохраняя структуру `Firmware/`, `assets/`, `data/`, `tools/`, `.github/` и файлы в корне. ZIP целиком загрузить недостаточно.
4. Откройте **Settings → Pages → Build and deployment → Deploy from a branch**. Выберите `main` и `/(root)`, сохраните.
5. После публикации откройте `https://ВАШ_ЛОГИН.github.io/ВАШ_РЕПОЗИТОРИЙ/configurator.html#firmware` в Chrome или Edge на ПК.

### Как пользоваться

1. Выберите **Matek H743-WING V3**.
2. Нажмите **«Загрузить последний .hex»**. Сайт получает `Firmware/Matek Wing H743-V3/manifest.json` и указанный в нём файл `.hex` по HTTPS, проверяет SHA-256 и Intel HEX. **Само скачивание не стирает и не прошивает плату.**
3. Подключите контроллер в режиме STM32 DFU. Нажмите **«Подключить DFU»** и разрешите доступ к USB-устройству в браузере.
4. Убедитесь, что правильно определяются карта Flash и `wTransferSize`. До их проверки запись заблокирована.
5. Функция полного стирания и записи **не проверена на реальном Matek**. Для проверки на плате подготовьте резервную копию и возможность восстановления через ST STM32CubeProgrammer, снимите пропеллер, обеспечьте стабильное питание. Не используйте текущую экспериментальную функцию на единственном рабочем полётном контроллере.

## Состав

- `index.html`: главная страница A.T.L.A.S., каталог сборок.
- `configurator.html`: Mission Planner-подобный конфигуратор MAVLink и STM32 DFU.
- `Firmware/Matek Wing H743-V3/*.hex`: предоставленный автором общедоступный образ прошивки.
- `Firmware/Matek Wing H743-V3/manifest.json`: данные о последней сборке, контрольная сумма SHA-256, размер и карта загрузки.
- `data/releases.json`: карточки плат и ссылка скачивания.
- `dfu-flasher.js`: STM32 DFU через WebUSB. Теперь учитывает функциональный дескриптор после последнего alternate-interface и пробует прочитать строковое описание памяти напрямую.
- `dfu-ui.js`: интерфейс прошивки, подтверждения, журнал операций.
- `tools/update_firmware_manifest.py` + `.github/workflows/firmware-manifest.yml`: опциональное обновление `manifest.json` при добавлении нового HEX через GitHub.

При необходимости обновите и кнопку загрузки на главной странице в `data/releases.json`, когда имя сборки изменится; прошивальщик всегда ориентируется на `manifest.json`.

## Ограничения

- `file:///.../configurator.html` не является опубликованным сайтом: браузер может блокировать `fetch()` к соседним файлам. Используйте опубликованный HTTPS-сайт. Локальный выбор `.hex` без fetch доступен в интерфейсе.
- WebUSB работает в поддерживаемых настольных браузерах через HTTPS; Windows может потребовать совместимый USB-драйвер. Запрос системного разрешения USB нельзя обойти.
- **STM32 DFU VID:PID 0483:DF11 не идентифицирует плату Matek.** На чужих H743 такой же VID:PID. Прошивка применима только к подтверждённой аппаратной ревизии.
- В HEX данные начинаются с `0x08000000`, поэтому полное стирание затрагивает флеш-загрузчик ArduPilot и требует иметь план восстановления.
- Реальная USB-запись не проходила аппаратной проверки. Код проверен только статически и через программную модель DFU.

**Лицензия ArduPilot:** при публичном распространении модифицированной прошивки нужно обеспечить получателей соответствующим исходным кодом и выполнить условия применимой GPL. Не загружайте образ для публичного распространения, пока не подготовите исходники конкретной сборки.


### v0.3.1: DFU button readiness
The DFU panel now displays the precise unmet safety condition above the Flash button. The board selector defaults to Orange Cube; select **Matek H743-WING V3** explicitly before flashing. The dangerous operation is not enabled automatically. Hardware flashing remains unverified.


## A.T.L.A.S. Control Center 0.4 — Flight Controller Calibration

The configurator now has a dedicated sidebar group **Flight Controller Calibration**:

- **Accelerometer:** single-position (`MAV_CMD_PREFLIGHT_CALIBRATION` / param5=4), six-position (param5=1; firmware-driven position prompts via `MAV_CMD_ACCELCAL_VEHICLE_POS` 42429), and level trim (param5=2). The UI waits for FC messages; it does not fake calibration success.
- **Servo Output:** 16-channel read-only PWM monitor via `SERVO_OUTPUT_RAW` (36). Servo settings are accessible through the existing parameter editor with individual confirmation; *no* `DO_SET_SERVO` or motor test commands are sent.
- **Battery Monitor:** battery voltage, current, remaining capacity and consumed charge; relevant BATT_* calibration parameters. Current/remaining require compatible `BATTERY_STATUS` (147) telemetry.
- **Compass:** calibration via commands 42424/42425/42426, with progress (191), reports (192) and explicit save. The module avoids changing `COMPASS_USE` on its own.

Calibration commands are blocked unless an active USB/MAVLink session supplies a **fresh, explicitly DISARMED** heartbeat. All hardware-calibration buttons remain disabled in DEMO. Remove props before bench calibration. This is an experimental client; commands and UI have not been verified against a physical Matek or Orange Cube.

### Protocol sources

- https://ardupilot.org/dev/docs/mavlink-calibration.html
- https://docs.ardupilot.org/planner/docs/common-accelerometer-calibration.html
- https://mavlink.io/en/messages/common.html

The public ZIP still contains the approved Matek H743-WING V3 HEX uploaded earlier. Publishing the site also publishes that HEX; comply with ArduPilot GPL source availability obligations before distributing modified binaries.


## A.T.L.A.S. Control Center 0.4.1 — Parameter transfer & calibration fixes

- Full PARAM_REQUEST_LIST handling now counts by unique `param_index` and recovers missing indices via rate-limited `PARAM_REQUEST_READ`. It retries unanswered list requests and reports a partial result explicitly after bounded retries rather than claiming success.
- Full results appear in the Parameter List after completion (live rendering is deliberately throttled during streaming to preserve serial RX throughput).
- Accelerometer: the 6-position wizard honours FC positions 1–6 and success/failure markers; an initial accepted/in-progress ACK never counts as finished. Each pose has an extended timeout.
- Calibration start, confirm, save and cancel buttons no longer use JavaScript `confirm()`. Inline instructions and the DISARMED gating remain.
- No change to the DFU writer. The public repository bundle still includes the user-provided Matek H743 V3 HEX. Do not publish it without fulfilling corresponding-source obligations under ArduPilot GPL.

**Testing:** JavaScript syntax, MAVLink CRC and request packing, retry selection, a simulated six-position response sequence, and no-native-popup behavior checked with software tests. Real H743 hardware still requires controlled bench validation with propeller removed; website publishing via GitHub Pages requires HTTPS.


## v0.4.3 — MAVLink calibration and Parameter Tree

- Fixed MAVLink 2 zero-truncated COMMAND_LONG (30-byte position prompts, 42429) and STATUSTEXT. Previous parser required 33 and 51 bytes, dropping valid frames.
- Added read-only MAVLink RX diagnostic and copy/export diagnostic button in 6-position accelerometer wizard.
- Replaced parameter category chips with a Mission Planner-inspired expandable prefix tree and Name / Value / Default / Units / Options / Desc / Fav table.
- Bundled **partial** parameter descriptions derived from A.T.L.A.S. Parameters.cpp. Missing metadata fields are `—`. Import official Plane apm.pdef.xml/json for full labels/options. Official metadata from a different ArduPlane revision may differ from A.T.L.A.S.
- Browser fetch of ArduPilot Plane pdef is optional, can fail due CORS. Import metadata file locally if that occurs.
- Reading the actual parameter list still requires MAVLink; no metadata file substitutes for real controller values.
- WARNING: The calibration fix was validated with a mock MAVLink-2 autopilot, **not yet on the physical Matek H743-WING V3**. Always remove propeller for testing.


## v0.4.3 — MAVLink calibration and Parameter Tree

- Fixed MAVLink 2 zero-truncated COMMAND_LONG (30-byte position prompts, 42429) and STATUSTEXT. Previous parser required 33 and 51 bytes, dropping valid frames.
- Added read-only MAVLink RX diagnostic and copy/export diagnostic button in 6-position accelerometer wizard.
- Replaced parameter category chips with a Mission Planner-inspired expandable prefix tree and Name / Value / Default / Units / Options / Desc / Fav table.
- Bundled **partial** parameter descriptions derived from A.T.L.A.S. Parameters.cpp. Missing metadata fields are `—`. Import official Plane apm.pdef.xml/json for full labels/options. Official metadata from a different ArduPlane revision may differ from A.T.L.A.S.
- Browser fetch of ArduPilot Plane pdef is optional, can fail due CORS. Import metadata file locally if that occurs.
- Reading the actual parameter list still requires MAVLink; no metadata file substitutes for real controller values.
- WARNING: The calibration fix was validated with a mock MAVLink-2 autopilot, **not yet on the physical Matek H743-WING V3**. Always remove propeller for testing.


## v0.4.3 — MAVLink calibration and Parameter Tree

- Fixed MAVLink 2 zero-truncated COMMAND_LONG (30-byte position prompts, 42429) and STATUSTEXT. Previous parser required 33 and 51 bytes, dropping valid frames.
- Added read-only MAVLink RX diagnostic and copy/export diagnostic button in 6-position accelerometer wizard.
- Replaced parameter category chips with a Mission Planner-inspired expandable prefix tree and Name / Value / Default / Units / Options / Desc / Fav table.
- Bundled **partial** parameter descriptions derived from A.T.L.A.S. Parameters.cpp. Missing metadata fields are `—`. Import official Plane apm.pdef.xml/json for full labels/options. Official metadata from a different ArduPlane revision may differ from A.T.L.A.S.
- Browser fetch of ArduPilot Plane pdef is optional, can fail due CORS. Import metadata file locally if that occurs.
- Reading the actual parameter list still requires MAVLink; no metadata file substitutes for real controller values.
- WARNING: The calibration fix was validated with a mock MAVLink-2 autopilot, **not yet on the physical Matek H743-WING V3**. Always remove propeller for testing.


## v0.4.4 — Servo Output + automatic Parameter List
- Opening Parameter List on a connected FC automatically starts `PARAM_REQUEST_LIST`, using existing missing-index recovery.
- Servo Output now supports per-channel `FUNCTION`, `MIN`, `TRIM`, `MAX`, `REVERSED` editing via a responsive dialog.
- Only changed parameters are sent as `PARAM_SET`, one at a time, with `PARAM_VALUE` echo confirmation and immediate status reporting. No `MAV_CMD_DO_SET_SERVO` or motor test exists.
- Editing requires current USB heartbeat and DISARMED state; never adjust outputs with propeller fitted. Verify hardware/RC mapping on bench after write.


## v0.4.5 Servo Output

See [V0.4.5-RELEASE-NOTES.md](V0.4.5-RELEASE-NOTES.md) for realtime servo settings and the bench-only PWM output scope/safety limitations.


## A.T.L.A.S. 0.4.6 — OSD editor and Servo Output clarity

- Sidebar: Video / OSD, with OSD screen 1–4 selector, NTSC/PAL/HD approximate layout preview, drag-to-position, enable toggles and numeric X/Y. Shows only `OSDn_*_EN`, `_X`, `_Y` keys actually present in the flight controller. Global OSD settings link to existing parameter editor.
- Changes are staged in browser, then written one by one with MAVLink PARAM_SET / verified PARAM_VALUE. No writes in demo mode and no writes while armed. OSD_TYPE may require FC reboot.
- If an OSD parameter is not reported, the editor cannot manufacture or write it. Displayport/HD preview is approximate rather than video/OSD renderer; position coordinates must be checked on the actual video setup.
- SERVO editor now highlights that **Apply immediately** must be enabled to write SERVOx_REVERSED and PWM limits; `DO_SET_SERVO` remains unavailable on FUNCTION=70 (Throttle) and other flight-control functions. Do not change SERVOx_FUNCTION automatically to force direct motor output.
- Hardware OSD/Servo parameter writes have **not been tested on a real H743**. First check without propeller.
- The included firmware HEX is public and requires GPL-compliant source availability when distributed.


## A.T.L.A.S. 0.4.6 — OSD editor and Servo Output clarity

- Sidebar: Video / OSD, with OSD screen 1–4 selector, NTSC/PAL/HD approximate layout preview, drag-to-position, enable toggles and numeric X/Y. Shows only `OSDn_*_EN`, `_X`, `_Y` keys actually present in the flight controller. Global OSD settings link to existing parameter editor.
- Changes are staged in browser, then written one by one with MAVLink PARAM_SET / verified PARAM_VALUE. No writes in demo mode and no writes while armed. OSD_TYPE may require FC reboot.
- If an OSD parameter is not reported, the editor cannot manufacture or write it. Displayport/HD preview is approximate rather than video/OSD renderer; position coordinates must be checked on the actual video setup.
- SERVO editor now highlights that **Apply immediately** must be enabled to write SERVOx_REVERSED and PWM limits; `DO_SET_SERVO` remains unavailable on FUNCTION=70 (Throttle) and other flight-control functions. Do not change SERVOx_FUNCTION automatically to force direct motor output.
- Hardware OSD/Servo parameter writes have **not been tested on a real H743**. First check without propeller.
- The included firmware HEX is public and requires GPL-compliant source availability when distributed.

## Control Center 0.4.7 — new setup panels

New integrated sections: **Basic Tuning**, **MAVFTP** (read/download only), **Flight Modes**, **Radio Calibration**, **Joystick** (local preview only), **Camera Gimbal** and **Parachute** (settings only). These are implemented in `advanced.js` / `advanced.css` and extend the original `configurator.js` and `mavlink.js`. Existing DFU, 6-position calibration, OSD and Servo Output remain present.

For details, supported MAVLink functions and safety limits, see [`V0.4.7-RELEASE-NOTES.md`](V0.4.7-RELEASE-NOTES.md).


## FAQ and firmware release history (v0.5.2)

`faq.html` provides the three-language A.T.L.A.S. EKF3 NOAID and flight modes FAQ. `changelog.html` now displays one section per firmware release version; edit the `releases` array in `changelog.js` to append release 1.01, 1.02, and later. The initial section is firmware Pre-Release 1.0.
