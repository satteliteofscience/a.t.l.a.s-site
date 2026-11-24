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
for(const k of ['title','scope','mh','mh2','what','checks','limits','method','gt_test45','gt_pitot','gt_w3','gt_w11','gt_turn','gt_calm','gt_drop','nt_calm','nt_drop','g_w3','g_w11','g_turn','g_calm','g_drop','r_onbad','r_cmd','r_stale','m_wind0','m_cmd','m_turn','m_mistake','m_stopbad','homeName','metricsTitle2','metricsScope2','legend'])assert.ok(ru.has(k)&&uk.has(k)&&en.has(k),'demo text '+k+' in ru, uk and en');
// the map is the satellite photo of the Dnipro airport (Esri World Imagery, credit shown) with the grid kept as the fallback; the calm note is on the page and in the changelog
assert.ok(js.includes('World_Imagery/MapServer/tile/')&&js.includes('Esri, Maxar, Earthstar Geographics')&&js.includes('HOME=[48.357222,35.100556]'),'the Dnipro satellite map is missing');
assert.ok(demo.includes('id="groupNote"')&&demo.includes('https://server.arcgisonline.com'),'the note element and the tile host in the CSP');
for(const [lang,re] of [['ru',/в штиль обучение не нужно/],['uk',/у штиль навчання не потрібне/],['en',/calm air needs no learning/]])assert.ok(re.test(js),'the calm note on the page ('+lang+')');
for(const [lang,re] of [['ru',/В штиль обучение не нужно[^.]*NOAID_WIND равным 1 или 0/],['uk',/У штиль навчання не потрібне[^.]*NOAID_WIND рівним 1 або 0/],['en',/In calm air the learning is not needed[^.]*NOAID_WIND at 1 or 0/]])assert.ok(re.test(r.changes[0][lang].join(' ')),'the calm note in the wind item of the changelog ('+lang+')');
const data=JSON.parse(read('data/sitl/atlas-30-demo.json'));
assert.equal(data.schema,1);assert.deepEqual(data.groups.map(g=>g.id),['test45','w3','w11','turn','calm','drop','pitot']);
{const by=Object.fromEntries(data.groups.map(g=>[g.id,g])),ids=g=>g.runs.map(x=>x.id);
 assert.deepEqual(ids(by.w3),['off','on']);assert.deepEqual(ids(by.w11),['off','on']);assert.deepEqual(ids(by.turn),['off','on']);assert.deepEqual(ids(by.calm),['off','on','onbad']);assert.deepEqual(ids(by.drop),['on','cmd','stale']);
 assert.equal(by.calm.truth_ep,0);assert.equal(by.calm.truth_dl,0);
 for(const g of data.groups)for(const m of g.marks||[])if(m.key)for(const lang of [ru,uk,en])assert.ok(lang.has('m_'+m.key),'mark label m_'+m.key);
 // the numbers behind the texts: learning on beats learning off in every wind; in calm air the mistaken click makes the third run drift; the wind command zeroes the estimate at once; without fixes and without the command the stale wind drifts on
 const rmsOf=r=>Math.sqrt(r.d.err.reduce((s,x)=>s+x*x,0)/r.d.err.length),at=(r,k,t)=>r.d[k][Math.round(t/r.d.step)],w=(r,t)=>Math.hypot(at(r,'wen',t),at(r,'wee',t));
 for(const id of ['w3','w11','turn'])assert.ok(rmsOf(by[id].runs[1])*3<rmsOf(by[id].runs[0]),id+': learning on is at least three times better');
 assert.ok(rmsOf(by.calm.runs[2])>10*rmsOf(by.calm.runs[1]),'calm: the mistaken click drifts away');assert.ok(w(by.calm.runs[2],1400)>2,'calm: the false wind stays');assert.ok(w(by.calm.runs[1],1400)<1,'calm: the wind stays near zero without the mistake');
 assert.ok(w(by.drop.runs[1],640)<0.2&&w(by.drop.runs[0],640)>5&&w(by.drop.runs[2],1400)>5,'sudden calm: the command zeroes the wind at once, the other runs keep the old wind');
 assert.ok(Math.max(...by.drop.runs[2].d.err)>5*Math.max(...by.drop.runs[0].d.err),'sudden calm: stopping the fixes without the command is far worse');}
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
