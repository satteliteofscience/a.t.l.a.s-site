'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const window={};vm.runInNewContext(read('data/changelog/2.2.js'),{window});
const r=window.AtlasRelease22;
assert.equal(r.version,'2.2');assert.equal(r.id,'release-2-2');assert.equal(r.channel,'UPDATE');
assert.equal(r.changes.length,10,'station correction, height tie, GPS on the ground, restart, HOME, one solution, profile, startup melody, base 4.7.3, validation');
const texts=[];
for(const lang of ['ru','uk','en']){
 for(const label of ['hint','baseLabel','modLabel','sourceLabel']) assert.ok(r[label][lang].length>10);
 for(const c of r.changes){assert.equal(c[lang].length,3);assert.ok(c[lang].every(t=>t.trim().length>20));texts.push(...c[lang]);}
 assert.match(r.hint[lang],/SITL/,'the hint states how the version was tested');
 assert.match(r.hint[lang],/EK3_MAV_POS/);assert.match(r.hint[lang],/EK3_MAV_HGT/);assert.match(r.hint[lang],/BUZ_CSTM_SONG/);
 texts.push(r.hint[lang]);
 // the two station-correction parameters, the profile and the startup melody are described in every language
 const all=r.changes.map(c=>c[lang].join(' ')).join(' ');
 for(const name of ['EK3_MAV_POS','EK3_MAV_HGT','EK3_NOAID_POS','G.L.O.B.A.L.','BUZ_CSTM_SONG'])assert.ok(all.includes(name),lang+': '+name);
 // the melody item says where to set it (the configurator card) and states that a real board has not been tried yet
 const melody=r.changes.find(c=>c[lang].join(' ').includes('BUZ_CSTM_SONG'))[lang].join(' ');
 assert.ok(/MML/.test(melody)&&({ru:/ARM/,uk:/ARM/,en:/disarmed/})[lang].test(melody),lang+': melody item names the format and the disarmed-only write');
 assert.ok(({ru:/«Мелодия запуска»/,uk:/«Мелодія запуску»/,en:/“Startup melody”/})[lang].test(melody),lang+': melody item names the configurator card');
 assert.ok(({ru:/на реальной плате ещё не проверялось/,uk:/на реальній платі ще не перевірялося/,en:/real board has not been checked/})[lang].test(melody),lang+': melody item states the hardware limit');
 // the base of the firmware: the item names both ArduPlane versions and the version the station reports, the hint repeats the new base
 const base=r.changes.find(c=>c[lang][0].includes('ArduPlane 4.7.3'));assert.ok(base,lang+': base item');
 const baseText=base[lang].join(' ');assert.ok(baseText.includes('ArduPlane 4.7.2')&&baseText.includes('V4.7.3')&&/SITL/.test(baseText),lang+': base item names 4.7.2, 4.7.3, the station message and the repeated SITL run');
 assert.ok(/4\.7\.2/.test(r.hint[lang])&&/4\.7\.3/.test(r.hint[lang]),lang+': the hint names the new base');
}
assert.equal(new Set(r.sources).size,r.sources.length);
for(const p of ['ArduPlane/Plane.cpp','libraries/AP_AHRS/AP_AHRS.cpp','libraries/AP_AHRS/AP_AHRS.h','libraries/GCS_MAVLink/GCS_Common.cpp','libraries/AP_NavEKF3/AP_NavEKF3.cpp','libraries/AP_NavEKF3/AP_NavEKF3_PosVelFusion.cpp'])assert.ok(r.sources.includes(p),p);
for(const p of ['libraries/AP_Notify/AP_BuzzerSong.cpp','libraries/AP_Notify/AP_BuzzerSong.h','libraries/AP_Notify/ToneAlarm.cpp','ArduPlane/Parameters.cpp'])assert.ok(r.sources.includes(p),p);
for(const p of r.sources)assert.match(p,/^(ArduPlane|libraries)\/[\w/]+\.(cpp|h)$/);
// wiring: the data file loads after 2.1 and before the renderer, the newest release is the first, the page descriptions name 2.2
const page=read('changelog.html'),log=read('js/site/changelog.js');
const scripts=[...page.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
assert.ok(scripts.indexOf('data/changelog/2.2.js')>scripts.indexOf('data/changelog/2.1.js'));
assert.ok(scripts.indexOf('data/changelog/2.2.js')<scripts.indexOf('js/site/changelog.js'));
assert.match(log,/const releases=\[window\.AtlasRelease22,window\.AtlasRelease21,/);
assert.match(log,/release-\(1-\[012\]\|2-\[012\]\)/,'#release-2-2 opens its section');
assert.ok(log.includes('изменения 2.2 относительно 2.1')&&log.includes('зміни 2.2 відносно 2.1')&&log.includes('changes 2.2 compared with 2.1'),'intro line names 2.2 in ru, uk and en');
assert.ok(/og:description" content="[^"]*2\.2/.test(page)&&/twitter:description" content="[^"]*2\.2/.test(page),'social descriptions name 2.2');
assert.ok(log.includes('2.2 на базе ArduPlane 4.7.3')&&log.includes('2.2 на базі ArduPlane 4.7.3')&&log.includes('2.2 on the ArduPlane 4.7.3 base'),'the SITL banner names the 4.7.3 base in ru, uk and en');
assert.ok(page.includes('data/changelog/2.2.js?v=2.2-base473-1')&&page.includes('js/site/changelog.js?v=release-2.2-base473'),'cache queries follow the base change');
// the profile of the configurator carries the two parameters (boards without them are skipped, see check_global_profile.cjs)
assert.match(read('js/configurator/global-profile-core.js'),/\['EK3_MAV_POS',1\],\['EK3_MAV_HGT',1\]/);
// release labels: configurator, page titles and metadata, home page, catalogue and the announced DFU release are all 2.2
const config=read('configurator.html'),code=read('js/configurator/configurator.js');
assert.match(config,/CONFIGURATOR 2\.2/);
assert.ok(!/CONFIGURATOR 2\.[01]|КОНФИГУРАТОР 2\.[01]|КОНФІГУРАТОР 2\.[01]/.test(config+code),'no older configurator label');
assert.ok(code.includes("experimental:'КОНФІГУРАТОР 2.2'")&&code.includes("experimental:'КОНФИГУРАТОР 2.2'")&&code.includes("experimental:'CONFIGURATOR 2.2'"));
const meta=read('js/site/page-meta.js');
for(const t of ['Конфигуратор A.T.L.A.S. 2.2','Конфігуратор A.T.L.A.S. 2.2','Configurator A.T.L.A.S. 2.2','Release 2.2 A.T.L.A.S-G.L.O.B.A.L'])assert.ok(meta.includes(t),t);
assert.ok(!/Release 2\.1|конфигуратор 2\.1|Configurator 2\.1|Конфигуратор A\.T\.L\.A\.S\. 2\.1/.test(meta),'no 2.1 label left in the page metadata');
for(const html of ['index.html','configurator.html','changelog.html','faq.html'])assert.ok(read(html).includes('js/site/page-meta.js?v=release-2.2'),'metadata cache refreshed: '+html);
const home=read('index.html');
for(const t of ['RELEASE 2.2 · A.T.L.A.S-G.L.O.B.A.L','Release <span>2.2</span>','Актуальная версия A.T.L.A.S. — 2.2','Release 2.2 A.T.L.A.S-G.L.O.B.A.L by Oleksandr'])assert.ok(home.includes(t),t);
assert.ok(!/Release 2\.1|RELEASE 2\.1/.test(home),'home page has no 2.1 label');
const i18n=read('js/site/i18n.js');
assert.ok(i18n.includes('Актуальная версия A.T.L.A.S. — 2.2')&&i18n.includes('Core A.T.L.A.S. 2.2 features.')&&!/Release 2\.1 A\.T\.L\.A\.S-G/.test(i18n),'translations follow the home page');
assert.match(read('js/configurator/dfu-ui.js'),/ANNOUNCED_RELEASE='2\.2'/,'DFU lists 2.2 as coming soon until it is published');
assert.ok((read('js/site/changelog.js').match(/Release 2\.2 ·/g)||[]).length===3,'changelog footer in ru, uk and en');
assert.match(config,/global-profile-core\.js\?v=release-2-2-global/);assert.match(config,/global-profile-ui\.js\?v=2-2-global-ui/);
const catalog=JSON.parse(read('data/releases.json'));
assert.equal(catalog.project.latest_release,'2.2','the newest release is announced; a card stays "coming soon" until its HEX is published');
assert.equal(catalog.project.release_names['2.2'],'A.T.L.A.S-G.L.O.B.A.L');assert.ok(catalog.project.release_names['2.1']&&catalog.project.release_names['2.0']);
assert.match(read('.gitignore'),/^\*\.hex$/m,'private HEX must be ignored');
assert.ok(fs.existsSync('firmware-gateway/RELEASE-2.2-UPLOAD.md'),'upload instructions for 2.2');
const upload=read('firmware-gateway/RELEASE-2.2-UPLOAD.md');
for(const s of ['matek-h743-v3-release-2-2','cube-orange-plus-release-2-2','uni-ic743-mini-release-2-2','--version 2.2'])assert.ok(upload.includes(s),s);
assert.ok(!/--publish\s*\n/.test(upload.split('## Inputs')[1].split('## Publication order')[0]),'preparation does not publish');
// public wording: what changes for the user, never how (no thresholds, time windows, counts or formulas), and nothing marked as generated
for(const t of texts){
 assert.ok(!/generated|сгенерир|згенерова/i.test(t),'no "generated" wording: '+t.slice(0,60));
 assert.ok(!/\b\d+(?:[.,]\d+)?\s*(?:с|сек|секунд\w*|s|sec|seconds?|ms|мс|м|m|метр\w*|metres?|meters?)(?![\p{L}\d])/iu.test(t),'no threshold or time window: '+t.slice(0,80));
 assert.ok(!/порог|threshold|Joseph|Jacobian|ковариац|covariance/i.test(t),'no filter internals: '+t.slice(0,80));
}
console.log('PASS: 2.2 changelog in RU/UK/EN, source list, history order, profile parameters and effect-only public wording.');
