'use strict';
// AI-assisted. The 3.0 state of the site: the changelog entry in RU/UK/EN with effect-only public wording, the banner and the page of the 45-minute SITL test, the current-release labels, the DroneCAN tab wiring.
const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const window={};vm.runInNewContext(read('data/changelog/3.0.js'),{window});
const r=window.AtlasRelease30;
assert.equal(r.version,'3.0');assert.equal(r.id,'release-3-0');assert.equal(r.channel,'UPDATE');
assert.equal(r.changes.length,10,'wind, R3, soft fix, pad hold, wind expiry, Pitot watch, parameter group, DroneCAN tab, base 4.7.3, validation');
const texts=[];
for(const lang of ['ru','uk','en']){
 for(const label of ['hint','baseLabel','modLabel','sourceLabel'])assert.ok(r[label][lang].length>10,label+' '+lang);
 for(const c of r.changes){assert.equal(c[lang].length,3);assert.ok(c[lang].every(t=>t.trim().length>20));texts.push(...c[lang]);}
 texts.push(r.hint[lang]);
 assert.match(r.hint[lang],/SITL/,lang+': the hint states how the version was tested');
 for(const name of ['NOAID_WIND','NOAID_HOLD','NOAID_SLEW','NOAID_WAGE','NOAID_PWATCH','DroneCAN'])assert.ok(r.hint[lang].includes(name)||r.changes.map(c=>c[lang].join(' ')).join(' ').includes(name),lang+': '+name);
 const all=r.changes.map(c=>c[lang].join(' ')).join(' ');
 assert.ok(({ru:/ещё не проверялось|ещё предстоит/,uk:/ще не перевіряли|ще попереду/,en:/not been tried|still pending/})[lang].test(all),lang+': the hardware limits are stated');
 assert.ok(/{{FLIGHTS}}|\d+ (полётов|польотів|flights)/.test(all),lang+': the validation item gives the number of flights');
 assert.ok(!/{{[A-Z]+}}/.test(all),lang+': no placeholder is left in the public text');
 const base=r.changes.find(c=>c[lang][0].includes('ArduPlane 4.7.3'));assert.ok(base,lang+': base item');
}
assert.equal(new Set(r.sources).size,r.sources.length);
for(const p of r.sources){assert.match(p,/^(ArduPlane|libraries)\/[\w/]+\.(cpp|h)$/);}
for(const p of ['ArduPlane/atlas_pitot_watch.cpp','libraries/AP_NavEKF3/AP_NavEKF3_PosVelFusion.cpp','libraries/AP_NavEKF3/AP_NavEKF3_NoAIDParams.cpp'])assert.ok(r.sources.includes(p),p);
// public wording: what changes for the user, never how (no thresholds, time windows, counts or formulas), and nothing marked as generated
for(const t of texts){
 assert.ok(!/generated|сгенерир|згенерова/i.test(t),'no "generated" wording: '+t.slice(0,60));
 assert.ok(!/\b\d+(?:[.,]\d+)?\s*(?:с|сек|секунд\w*|s|sec|seconds?|ms|мс|м|m|метр\w*|metres?|meters?)(?![\p{L}\d])/iu.test(t),'no threshold or time window: '+t.slice(0,80));
 assert.ok(!/порог|threshold|Joseph|Jacobian|ковариац|covariance|Калман|Kalman/i.test(t),'no filter internals: '+t.slice(0,80));
 assert.ok(!/[×]/.test(t),'no formulas: '+t.slice(0,60));
}
// wiring: the data file loads after 2.2 and before the renderer, the newest release is the first, the banner sits above the earlier demonstrations
const page=read('changelog.html'),log=read('js/site/changelog.js');
const scripts=[...page.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
assert.ok(scripts.indexOf('data/changelog/3.0.js')>scripts.indexOf('data/changelog/2.2.js'));assert.ok(scripts.indexOf('data/changelog/3.0.js')<scripts.indexOf('js/site/changelog.js'));
assert.match(log,/const releases=\[window\.AtlasRelease30,window\.AtlasRelease22,/);
assert.match(log,/release-\(1-\[012\]\|2-\[012\]\|3-0\)/,'#release-3-0 opens its section');
assert.ok(page.indexOf('ch30-banner')>0&&page.indexOf('ch30-banner')<page.indexOf('ch-legacy-intro')&&page.indexOf('ch-legacy-intro')<page.indexOf('ch22-banner'),'the 3.0 banner is the newest, 2.2 sits in the earlier demonstrations');
assert.ok(page.includes('href="sitl-demo-30.html"')&&page.includes('css/release30.css'),'the banner links the 45-minute test');
assert.ok(log.includes("release.version==='3.0'")&&log.includes("demo.href='sitl-demo-30.html'"),'the 3.0 section carries the link to the test');
for(const t of ['изменения 3.0 относительно 2.2','зміни 3.0 відносно 2.2','changes 3.0 compared with 2.2','Release 3.0 · Разработка','Release 3.0 · Розробка','Release 3.0 · Developed'])assert.ok(log.includes(t),t);
// the page of the test: its own script, data and styles, no inline script, three languages with the same keys
const demo=read('sitl-demo-30.html'),js=read('js/site/control30.js');
assert.ok(demo.includes('js/site/control30.js')&&demo.includes('css/control30.css')&&!/<script(?![^>]*\ssrc=)[^>]*>/.test(demo.replace(/<script src="js\/site\/frame-guard\.js"><\/script>/,'')),'the demo page has external scripts only');
assert.ok(js.includes("fetch('data/sitl/atlas-30-demo.json'"));
const keys=lang=>{const m=js.match(new RegExp('\\n'+lang+':\\{([^]*?)\\n(?:uk|en|\\};)'));return m?[...m[1].matchAll(/(?:^|[,{ ]|\n)([a-z_]+[A-Za-z0-9_]*):/g)].map(x=>x[1]):[];};
const ru=new Set(keys('ru')),uk=new Set(keys('uk')),en=new Set(keys('en'));
for(const k of ['title','scope','mh','what','checks','limits','method','gt_test45','gt_pitot','legend'])assert.ok(ru.has(k)&&uk.has(k)&&en.has(k),'demo text '+k+' in ru, uk and en');
const data=JSON.parse(read('data/sitl/atlas-30-demo.json'));
assert.equal(data.schema,1);assert.deepEqual(data.groups.map(g=>g.id),['test45','pitot']);
for(const g of data.groups)for(const run of g.runs){const d=run.d;assert.ok(d.step>0&&d.n===d.err.length,run.id+': one error per grid point');for(const k of ['tn','te','en','ee','tilt'])assert.equal(d[k].length,d.n,run.id+' '+k);assert.ok(d.err.every(Number.isFinite),run.id+': finite errors');}
const t45=data.groups[0];assert.deepEqual(t45.runs.map(x=>x.id),['base','off','on']);assert.equal(t45.stop,1200);
assert.ok(t45.runs[2].d.ep&&t45.runs[2].d.wen,'the 3.0 run with the functions on carries the calibration and the wind estimate');
// the current-release labels
const config=read('configurator.html'),code=read('js/configurator/configurator.js'),meta=read('js/site/page-meta.js'),home=read('index.html'),i18n=read('js/site/i18n.js');
assert.match(config,/CONFIGURATOR 3\.0/);assert.ok(!/CONFIGURATOR 2\.[012]|КОНФИГУРАТОР 2\.[012]|КОНФІГУРАТОР 2\.[012]/.test(config+code),'no older configurator label');
assert.ok(code.includes("experimental:'КОНФІГУРАТОР 3.0'")&&code.includes("experimental:'КОНФИГУРАТОР 3.0'")&&code.includes("experimental:'CONFIGURATOR 3.0'"));
for(const t of ['Конфигуратор A.T.L.A.S. 3.0','Конфігуратор A.T.L.A.S. 3.0','Configurator A.T.L.A.S. 3.0','Release 3.0 A.T.L.A.S-G.L.O.B.A.L'])assert.ok(meta.includes(t),t);
assert.ok(!/Release 2\.[012]|конфигуратор 2\.[012]|Configurator 2\.[012]|Конфигуратор A\.T\.L\.A\.S\. 2\.[012]/.test(meta),'no older label in the page metadata');
for(const html of ['index.html','configurator.html','changelog.html','faq.html'])assert.ok(read(html).includes('js/site/page-meta.js?v=release-3.0'),'metadata cache refreshed: '+html);
for(const t of ['RELEASE 3.0 · A.T.L.A.S-G.L.O.B.A.L','Release <span>3.0</span>','Актуальная версия A.T.L.A.S. — 3.0','Release 3.0 A.T.L.A.S-G.L.O.B.A.L by Oleksandr'])assert.ok(home.includes(t),t);
assert.ok(!/Release 2\.[012]|RELEASE 2\.[012]/.test(home),'home page has no older label');
assert.ok(i18n.includes('Актуальная версия A.T.L.A.S. — 3.0')&&i18n.includes('Core A.T.L.A.S. 3.0 features.')&&!/Release 2\.[012] A\.T\.L\.A\.S-G/.test(i18n),'translations follow the home page');
const catalog=JSON.parse(read('data/releases.json'));
assert.equal(catalog.project.latest_release,'3.0','the newest release is announced; a card stays "coming soon" until its HEX is published');
assert.equal(catalog.project.release_names['3.0'],'A.T.L.A.S-G.L.O.B.A.L');
// the DroneCAN tab is wired into the configurator: navigation, scripts, MAVLink messages
assert.match(config,/data-tab="dronecan"/);assert.match(config,/data-panel="dronecan"/);assert.match(config,/id="dcRoot"/);
assert.ok(config.indexOf('js/configurator/dronecan-core.js')>config.indexOf('js/configurator/configurator.js')&&config.indexOf('js/configurator/dronecan-ui.js')>config.indexOf('js/configurator/dronecan-core.js'),'core after the configurator, UI after the core');
assert.match(code,/'mavftp','dronecan','modes'/);assert.match(code,/canForward:\(bus\)=>/);assert.match(code,/sendCanFrame:\(bus,canId,data\)=>/);
const mav=read('js/configurator/mavlink.js');assert.match(mav,/386:132,387:4/);assert.match(mav,/type:'can_frame'/);assert.match(mav,/function canFrame\(/);
console.log('PASS: 3.0 changelog in RU/UK/EN with effect-only wording, the banner and the 45-minute test page ('+data.groups.length+' recordings), current-release labels, DroneCAN tab wiring.');
