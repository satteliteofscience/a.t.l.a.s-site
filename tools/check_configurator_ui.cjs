'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

const calibration=read('js/configurator/calibration.js');
const toggleAt=calibration.indexOf("$('servoLiveApply').addEventListener('change'");
const toggleEnd=calibration.indexOf("$('servoBenchConsent')",toggleAt);
assert.ok(toggleAt>=0&&toggleEnd>toggleAt,'Apply Immediately change handler must exist');
const toggle=calibration.slice(toggleAt,toggleEnd);
assert.ok(toggle.includes("if($('servoLiveApply').checked)queueRealtime('ALL')"),'turning Apply Immediately on must flush all pending edits');
assert.match(calibration,/servoCore\.selectLiveChanges\(validation,field\)/,'full-draft flush must use the shared live field selector');
assert.match(calibration,/for\(const key of Object\.keys\(servoLiveDebounce\)\)/,'flush must cancel pending debounce callbacks');

const core=read('js/configurator/servo-config-core.js');
assert.match(core,/const LIVE_FIELDS=Object\.freeze\(\['MIN','TRIM','MAX','REVERSED'\]\)/,'live mode must exclude FUNCTION');
assert.match(core,/function selectLiveChanges\(validation,field='ALL'\)/,'live draft selector missing');

const styles=read('css/styles.css');
assert.match(styles,/\.support-section\{--section-pt:34px;padding-bottom:38px\}/,'desktop support section padding feeds its anchor offset (see tools/check_anchor_links.cjs)');
assert.match(styles,/@media\(max-width:560px\)\{\.support-section\{--section-pt:26px;padding-bottom:10px\}/,'mobile support section padding feeds its anchor offset (see tools/check_anchor_links.cjs)');

const html=read('configurator.html');
assert.ok(html.includes('href="https://ardupilot.org/planner/docs/common-loading-firmware-onto-pixhawk.html"'),'Mission Planner must point to verified ArduPilot firmware instructions');
assert.ok(html.includes('href="https://arduconfigurator.com/"'),'ArduConfigurator link must remain unchanged');
assert.ok(!html.includes('common-install-firmware.html'),'obsolete Mission Planner URL must not return');
assert.match(html,/<p class="dfu-postflash-note" data-dfu-t="postflash" role="note">/,'post-flash note must appear in the firmware UI');
const dfu=read('js/configurator/dfu-ui.js');
for(const language of [
 'После успешной записи дождись полной загрузки контроллера',
 'Після успішного запису дочекайся повного завантаження контролера',
 'After a successful flash, wait for the flight controller to finish booting'
])assert.ok(dfu.includes(language),'missing localized post-flash guidance: '+language);
assert.match(dfu,/Matek H743-WING V3[^']*third connection/,'English note must qualify the behavior as board-specific');
const firmwareUi=read('js/configurator/configurator.js')+read('js/configurator/release-picker.js');   // the cards live in release-picker.js (tools/check_release_picker.cjs)
const firmwareCss=read('css/configurator.css');
assert.match(firmwareUi,/'cc-release-download-title'/,'firmware download must have a readable release title');
assert.match(firmwareUi,/'cc-release-download-action'/,'firmware download must display a separate PIN action');
assert.match(firmwareUi,/ACTION=\{ru:'СКАЧАТЬ',uk:'ЗАВАНТАЖИТИ',en:'DOWNLOAD'\}/,'PIN action must be translated into RU, UA and EN');
assert.match(firmwareUi,/access\.download\(item\)/,'protected firmware download must still use the PIN gateway');
assert.match(firmwareUi,/access:window\.AtlasFirmwareAccess/,'the configurator hands the PIN gateway to the cards');
for(const selector of [
 '.cc-release-item .cc-release-download{',
 '.cc-release-item .cc-release-download:hover:not(:disabled){',
 '.cc-release-item .cc-release-download:focus-visible{',
 '.cc-release-item .cc-release-download:disabled{'
])assert.ok(firmwareCss.includes(selector),'firmware download styling missing: '+selector);
console.log('PASS: Apply Immediately flushes pending draft; support anchor offsets; RU/UA/EN post-flash USB guidance.');
