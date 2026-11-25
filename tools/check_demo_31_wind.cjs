/* AI-assisted. The 3.1 wind page (sitl-demo-31-wind.html): its wiring, the three languages of its script, the recorded data of every NOAID_WIND value and the numbers that the texts of the page rely on. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const page=read('sitl-demo-31-wind.html'),js=read('js/site/control31w.js'),log=read('js/site/changelog.js'),css=read('css/control31w.css'),changelogPage=read('changelog.html');
// wiring: the banner and the 3.1 section link the page; external scripts only; the data, the styles, the way back, the satellite map host in the CSP
assert.ok(log.includes("wind.href='sitl-demo-31-wind.html'"),'the 3.1 section of the changelog links the page');
assert.ok(changelogPage.includes('id="chSitl31Wind" class="ch-sitl-demo" href="sitl-demo-31-wind.html"'),'the 3.1 banner links the page');
for(const f of ['js/site/control31w.js','css/control31w.css','css/control31.css','css/control30.css','css/control21.css'])assert.ok(page.includes(f),f);
assert.ok(page.includes('href="changelog.html#release-3-1"'),'the way back');
assert.ok(!/<script(?![^>]*\ssrc=)[^>]*>/.test(page),'the page has external scripts only');
assert.ok(js.includes("fetch('data/sitl/atlas-31-wind.json'")&&css.includes('.c31w-chips'),'data and style files');
assert.ok(page.includes('https://server.arcgisonline.com')&&js.includes('World_Imagery/MapServer/tile/')&&js.includes('Esri, Maxar, Earthstar Geographics')&&js.includes('HOME=[48.357222,35.100556]'),'the Dnipro satellite map with its credit');
for(const id of new Set([...js.matchAll(/\$\('([A-Za-z0-9]+)'\)/g)].map(m=>m[1])))assert.ok(page.includes('id="'+id+'"'),'the page has #'+id);
// the texts: three languages with the same keys, lists of the same length, no placeholder left, the limits stated
const m=js.match(/const T=(\{[^]*?\n\});\nlet lang=/);assert.ok(m,'the texts');
const T=vm.runInNewContext('('+m[1]+')');
const keys=lang=>Object.keys(T[lang]).sort();
assert.deepEqual(keys('uk'),keys('ru'));assert.deepEqual(keys('en'),keys('ru'));
for(const lang of ['ru','uk','en']){
 for(const [k,v] of Object.entries(T[lang])){if(Array.isArray(v))assert.equal(v.length,T.ru[k].length,k+' ('+lang+')');else if(typeof v==='string')assert.ok(v.length>0,k+' ('+lang+')');}
 for(const k of ['what','method','limits'])assert.ok(T[lang][k].length>=3&&T[lang][k].every(s=>s.length>30),k+' written ('+lang+')');
 assert.equal(T[lang].mh.length,9,'the table of values');assert.equal(T[lang].bits.length,5,'five bits');
 assert.equal(T[lang].bits.map(r=>r[1]).join(' '),'1 2 4 8 16','bit values');
 assert.ok(/(экспериментальн|експериментальн|experimental)/i.test(T[lang].scope),'says experimental ('+lang+')');
 const lim=T[lang].limits.join(' ');
 assert.ok(/(не заменяет GPS|не замінює GPS|does not replace GPS)/.test(lim),'does not replace GPS ('+lang+')');
 assert.ok(/(стендовая|стендова|bench)/.test(lim),'bench and flight validation pending ('+lang+')');
 assert.ok(/(ложный ветер|хибний вітер|false wind)/.test(lim),'a false source is carried too ('+lang+')');
 assert.ok(T[lang].checks({flights:123}).join(' ').includes('123'),'the number of flights comes from the data ('+lang+')');
}
// the data: the sixteen meaningful values of NOAID_WIND, the same time grid, finite numbers, the GPS windows and the schedule
const data=JSON.parse(read('data/sitl/atlas-31-wind.json'));
assert.equal(data.schema,1);assert.deepEqual(data.runs.map(r=>r.value),[0,1,2,3,6,7,8,9,10,11,14,15,26,27,30,31]);
assert.ok(data.facts.flights>=80,'the number of flights of the final version');assert.ok(data.n*data.step>=1800,'half an hour');
// the numbers that the page text states
const v=x=>data.runs.find(r=>r.value===x).m;
assert.ok(v(15).phase.changing.median<v(7).phase.changing.median&&v(31).phase.changing.median<v(7).phase.changing.median,'changing wind: smaller error with the carry-over');
assert.ok(v(8).phase.changing.median<v(0).phase.changing.median&&v(9).phase.changing.median<v(1).phase.changing.median,'without learning too');
const after=(x,k)=>v(x).after.find(a=>a.t>=data.gps[k][1]&&a.t<data.gps[k][1]+20).drift;
assert.ok(after(0,1)>5&&after(8,1)<1.5&&after(9,1)<1.5&&after(31,1)<0.6,'drift after the window in the steady wind');
assert.ok(after(15,3)>after(7,3)&&v(15).final<v(7).final,'after the last window the wind changes again; the end is still better');
assert.ok(v(0).phase.steady.median>200&&[7,15,30,31].every(x=>v(x).phase.steady.median<90),'steady wind medians');
for(const r of data.runs)for(const d of r.m.decisions)assert.ok(!(d.t>=data.gps[2][1]&&d.t<data.gps[2][1]+20)||!/wind from GPS/.test(d.text),'the short window carries nothing over: '+r.value);
assert.deepEqual(data.phases.map(p=>p.id),['calm','steady','changing']);assert.ok(data.gps.length===4&&data.cmd.length>=2&&data.fix.length>=10&&data.rect.length===4);
for(const k of ['n','e'])assert.equal(data.wind[k].length,data.n);
for(const r of data.runs){
 for(const k of ['tn','te','en','ee','err','wn','we','aided'])assert.equal(r[k].length,data.n,r.value+' '+k);
 assert.ok(r.err.every(Number.isFinite)&&r.wn.every(Number.isFinite),'finite');assert.ok(r.aided.some(x=>x===1),'the GPS windows were used');
 for(const id of ['calm','steady','changing'])assert.ok(Number.isFinite(r.m.phase[id].median),r.value+' '+id);
 assert.ok(r.m.after.length>=3,'drift after the windows '+r.value);
 // the carry-over: only with bit 3 does the filter say anything about the wind of a GPS window (taken, kept or none to take)
 assert.equal(r.m.decisions.length>0,(r.value&8)!==0,'decisions about the GPS wind only with bit 3: '+r.value);
}
console.log('PASS: 3.1 wind page: wiring, three languages, '+data.runs.length+' values of NOAID_WIND, '+Math.round(data.n*data.step/60)+' minutes, '+data.facts.flights+' flights behind it.');
