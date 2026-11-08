'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

const calibration=read('calibration.js');
const toggleAt=calibration.indexOf("$('servoLiveApply').addEventListener('change'");
const toggleEnd=calibration.indexOf("$('servoBenchConsent')",toggleAt);
assert.ok(toggleAt>=0&&toggleEnd>toggleAt,'Apply Immediately change handler must exist');
const toggle=calibration.slice(toggleAt,toggleEnd);
assert.ok(toggle.includes("if($('servoLiveApply').checked)queueRealtime('ALL')"),'turning Apply Immediately on must flush all pending edits');
assert.match(calibration,/servoCore\.selectLiveChanges\(validation,field\)/,'full-draft flush must use the shared live field selector');
assert.match(calibration,/for\(const key of Object\.keys\(servoLiveDebounce\)\)/,'flush must cancel pending debounce callbacks');

const core=read('servo-config-core.js');
assert.match(core,/const LIVE_FIELDS=Object\.freeze\(\['MIN','TRIM','MAX','REVERSED'\]\)/,'live mode must exclude FUNCTION');
assert.match(core,/function selectLiveChanges\(validation,field='ALL'\)/,'live draft selector missing');

const styles=read('styles.css');
assert.match(styles,/\.support-section\{padding-top:34px;padding-bottom:38px;scroll-margin-top:84px\}/,'desktop support anchor offset must be aligned');
assert.match(styles,/@media\(max-width:560px\)\{\.support-section\{padding-top:26px;padding-bottom:10px;scroll-margin-top:58px\}/,'mobile support anchor offset must be aligned');

const html=read('configurator.html');
assert.match(html,/<p class="dfu-postflash-note" data-dfu-t="postflash" role="note">/,'post-flash note must appear in the firmware UI');
const dfu=read('dfu-ui.js');
for(const language of [
 'После успешной записи дождись полной загрузки контроллера',
 'Після успішного запису дочекайся повного завантаження контролера',
 'After a successful flash, wait for the flight controller to finish booting'
])assert.ok(dfu.includes(language),'missing localized post-flash guidance: '+language);
assert.match(dfu,/Matek H743-WING V3[^']*third connection/,'English note must qualify the behavior as board-specific');
console.log('PASS: Apply Immediately flushes pending draft; support anchor offsets; RU/UA/EN post-flash USB guidance.');
