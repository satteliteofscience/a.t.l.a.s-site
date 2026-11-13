/* FAQ 2.0: the data file, the categories, the search/category wiring on faq.html, facts that must match the firmware and the SITL recording, and no "generated" wording on public pages. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');

// --- the data file
const win={};vm.runInNewContext(read('data/faq-20.js'),{window:win});
const items=win.AtlasFaq20,ui=win.AtlasFaqUi;
assert.ok(Array.isArray(items)&&items.length>=25,'the 2.0 FAQ needs its full set of questions');
const ids=new Set();
for(const it of items){
 assert.ok(/^[a-z0-9-]+$/.test(it.id)&&!ids.has(it.id),'unique id: '+it.id);ids.add(it.id);
 assert.ok(ui.order.includes(it.cat),'known category for '+it.id);
 for(const lang of ['ru','uk','en']){assert.equal(it[lang].length,2,it.id+' '+lang);assert.ok(it[lang][0].length>10&&it[lang][1].length>60,'question and answer text in '+lang+': '+it.id);assert.ok(!/undefined|\[object/.test(it[lang].join(' ')));}
}
for(const lang of ['ru','uk','en']){assert.deepEqual(Object.keys(ui[lang].cats).sort(),[...ui.order].sort(),'category names in '+lang);for(const k of ['search','all','none','shown','of'])assert.ok(ui[lang][k],'ui text '+k+' in '+lang);}
// the older items keep their ids and get a category in faq.js
const faqJs=read('js/site/faq.js'),page=read('faq.html');
const oldIds=[...faqJs.matchAll(/id:\s*'([a-z0-9-]+)'/g)].map(m=>m[1]).concat([...faqJs.matchAll(/"id":"([a-z0-9-]+)"/g)].map(m=>m[1]));
assert.ok(oldIds.length>=19,'the older FAQ items are still there');
const catMap=faqJs.match(/const OLD_CAT=\{([^}]*)\}/)[1];
for(const id of oldIds)assert.ok(catMap.includes(id.includes('-')?`'${id}'`:id+':'),'category for the older item '+id);
for(const id of oldIds)assert.ok(!ids.has(id),'a 2.0 id repeats an older id: '+id);
// wiring: the data loads before faq.js, the toolbar exists, and faq.js merges and renders it
const scripts=[...page.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
assert.ok(scripts.indexOf('data/faq-20.js')>=0&&scripts.indexOf('data/faq-20.js')<scripts.indexOf('js/site/faq.js'));
for(const id of ['faqSearch','faqCats','faqCount','faqList'])assert.ok(page.includes(`id="${id}"`),'#'+id);
assert.match(faqJs,/FAQ\.push\(\.\.\.\(window\.AtlasFaq20\|\|\[\]\)\)/);assert.match(faqJs,/faqSearch/);assert.match(faqJs,/location\.hash/);

// --- facts: parameter names that belong to this firmware exist in the configurator's metadata
const meta=JSON.parse(read('data/param-metadata.json')).parameters;
const text=items.map(i=>i.ru.join(' ')).join(' ');
for(const name of new Set(text.match(/\b(ORDER_[A-Z_]+|RUD_[A-Z_]+|EK3_NOAID_[A-Z_]+)\b/g)))assert.ok(meta[name]||['ORDER_ON','ORDER_PWM','RUD_LIMIT_DEG'].includes(name),'parameter not in the metadata: '+name);
// the activation rules quoted in the FAQ equal the firmware's parameter text
assert.ok(meta.ORDER_RC_MIN.Description.includes('1750 us')&&/HIGH on|ON \/ LOW or centre OFF/i.test(meta.ORDER_RC_MIN.Description)&&/1750 мкс/.test(text),'the RC switch threshold must agree with the parameter text');
assert.ok(/200 мс/.test(text)&&/ORDER_MODE=2/.test(text)&&/1050 мкс/.test(text));
// the retired RUD_RLL_ADD must not be described as an active limiter anywhere
assert.ok(/inactive/i.test(meta.RUD_RLL_ADD.Description+meta.RUD_RLL_ADD.DisplayName),'RUD_RLL_ADD is inactive in the 2.0 firmware');
assert.ok(/85°/.test(text));
assert.deepEqual(Object.keys(meta.EK3_NOAID_AUTO.Values),['0','1']);

// --- numbers: the FAQ, the home page and the recording agree
const d=JSON.parse(read('data/sitl/atlas-global-hour.json')),m=d.metrics;
const f1=x=>x.toFixed(1).replace('.',','),f0=x=>String(Math.round(x));
const med=a=>{const v=a.filter(x=>x!=null);return v.reduce((x,y)=>x+y,0)/v.length;};
const sitl=items.find(i=>i.id==='sitl-hour').ru[1],drift=items.find(i=>i.id==='global-drift').ru[1],auto=items.find(i=>i.id==='global-auto').ru[1];
assert.ok(sitl.includes(f1(m.ekf3.tilt_rms)+'° RMS')&&sitl.includes(f1(m.ekf3.tilt_rms_aero)+'°')&&sitl.includes(f1(m.dcm.tilt_rms)+'°')&&sitl.includes(f1(m.dcm.tilt_rms_aero)+'°'),'horizon numbers of the SITL answer');
assert.ok(sitl.includes(f0(m.ekf3.pos_med_nogps)+' м')&&sitl.includes(f0(m.dcm.pos_med_nogps))&&sitl.includes(f1(m.ekf3.pos_max_nogps/1000)+' км')&&sitl.includes(f1(m.dcm.pos_max_nogps/1000)+' км'),'position numbers of the SITL answer');
assert.ok(drift.includes(f0(m.ekf3.pos_med_nogps)+' м')&&drift.includes(f1(m.ekf3.pos_max_nogps/1000)+' км')&&drift.includes(f0(m.dcm.pos_med_nogps)+' м'));
assert.ok(auto.includes(f1(med(d.snap.ekf3))+' с'),'the switch-over time');
const home=read('index.html');
assert.ok(home.includes(`${f1(m.ekf3.tilt_rms)}° RMS`)&&home.includes(`${f1(m.ekf3.tilt_rms_aero)}°`)&&home.includes(`${f1(m.dcm.tilt_rms)}°`)&&home.includes(`${f1(m.dcm.tilt_rms_aero)}°`)&&home.includes(`${f1(med(d.snap.ekf3))} с`),'the home-page card must quote the recording');

// --- public pages do not announce that something was "generated"
const pages=[...fs.readdirSync('.').filter(n=>/\.html$/.test(n)),...fs.readdirSync('data/changelog').map(n=>'data/changelog/'+n),'data/faq-20.js','data/releases.json',...fs.readdirSync('js/site').map(n=>'js/site/'+n)];
for(const p of pages)assert.ok(!/сгенерир|згенерова|\bgenerated\b/i.test(read(p)),'"generated" wording on a public page: '+p);
console.log(`PASS: FAQ 2.0 — ${items.length} new items, categories and search, parameter names, numbers and public wording.`);
