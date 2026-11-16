'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const window={};vm.runInNewContext(read('data/changelog/2.1.js'),{window});
const r=window.AtlasRelease21;
assert.equal(r.version,'2.1');assert.equal(r.id,'release-2-1');assert.equal(r.channel,'UPDATE');
assert.equal(r.changes.length,13,'preserve the three prepared fixes and the ten verified additions');
for(const lang of ['ru','uk','en']){
 for(const label of ['hint','baseLabel','modLabel','sourceLabel']) assert.ok(r[label][lang].length>10);
 for(const c of r.changes){assert.equal(c[lang].length,3);assert.ok(c[lang].every(t=>t.trim().length>20));}
 assert.match(r.hint[lang],/SITL/);
}
assert.equal(new Set(r.sources).size,r.sources.length);
for(const p of ['ArduPlane/Plane.cpp','libraries/AP_NavEKF3/AP_NavEKF3_Control.cpp','libraries/AP_NavEKF3/AP_NavEKF3_PosVelFusion.cpp','libraries/AP_AHRS/AP_AHRS.cpp','libraries/AP_DAL/AP_DAL.cpp','libraries/AP_Notify/ToneAlarm.cpp'])assert.ok(r.sources.includes(p));
const page=read('changelog.html'),log=read('js/site/changelog.js');
const scripts=[...page.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
assert.ok(scripts.indexOf('data/changelog/2.1.js')>scripts.indexOf('data/changelog/2.0.js'));
assert.ok(scripts.indexOf('data/changelog/2.1.js')<scripts.indexOf('js/site/changelog.js'));
assert.match(log,/const releases=\[window\.AtlasRelease21,window\.AtlasRelease20,window\.AtlasRelease12,window\.AtlasRelease11,/);
assert.match(log,/group.open=openReleases.get\(release.id\) \?\? release===releases\[0\]/,'only newest release initially expanded');
const config=read('configurator.html'),code=read('js/configurator/configurator.js');
assert.match(config,/CONFIGURATOR 2\.1/);
assert.ok(!/CONFIGURATOR 2\.0|КОНФИГУРАТОР 2\.0/.test(config+code));
const meta=read('js/site/page-meta.js');
for(const t of ['Конфигуратор A.T.L.A.S. 2.1','Конфігуратор A.T.L.A.S. 2.1','Configurator A.T.L.A.S. 2.1'])assert.ok(meta.includes(t));
for(const html of ['index.html','configurator.html','changelog.html'])assert.ok(read(html).includes('js/site/page-meta.js?v=release-2.1'),'metadata cache refreshed: '+html);
assert.match(read('.gitignore'),/^\*\.hex$/m,'private HEX must be ignored');
const catalog=JSON.parse(read('data/releases.json'));
assert.ok(['2.0','2.1'].includes(catalog.project.latest_release),'publication stage must be explicit');
console.log('PASS: 2.1 changelog in RU/UK/EN, complete source list, collapsible history, configurator version, localized titles and private-file guard.');
