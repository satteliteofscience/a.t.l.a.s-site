/* AI-assisted. The 3.1 demonstration page (sitl-demo-31.html): its wiring, the three languages of its script, the recorded data and the numbers that the texts of the page and the changelog rely on. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const page=read('sitl-demo-31.html'),js=read('js/site/control31.js'),log=read('js/site/changelog.js'),css=read('css/control31.css');
// wiring: the changelog links the page, the page has external scripts only, loads its data and styles, links back to the 3.1 section
assert.ok(log.includes("release.version==='3.1'")&&log.includes("demo.href='sitl-demo-31.html'"),'the 3.1 section of the changelog links the page');
assert.ok(page.includes('js/site/control31.js')&&page.includes('css/control31.css')&&page.includes('css/control30.css')&&page.includes('href="changelog.html#release-3-1"'),'scripts, styles and the way back');
assert.ok(!/<script(?![^>]*\ssrc=)[^>]*>/.test(page.replace(/<script src="js\/site\/frame-guard\.js"><\/script>/,'')),'the page has external scripts only');
assert.ok(js.includes("fetch('data/sitl/atlas-31-demo.json'")&&css.includes('.c31-table'),'data and style files');
assert.ok(page.includes('https://server.arcgisonline.com')&&js.includes('World_Imagery/MapServer/tile/')&&js.includes('Esri, Maxar, Earthstar Geographics')&&js.includes('HOME=[48.357222,35.100556]'),'the Dnipro satellite map with its credit and the host in the CSP');
for(const id of new Set([...js.matchAll(/\$\('([A-Za-z0-9]+)'\)/g)].map(m=>m[1])))if(id!=='m2')assert.ok(page.includes('id="'+id+'"'),'the page has #'+id);
// the script: three languages with the same keys, lists of the same length, the experimental notice and the honest limits in each
const m=js.match(/const T=(\{[^]*?\n\});\nlet lang=/);assert.ok(m,'the texts');
const T=vm.runInNewContext('('+m[1]+')');
const keys=lang=>Object.keys(T[lang]).sort();
assert.deepEqual(keys('uk'),keys('ru'));assert.deepEqual(keys('en'),keys('ru'));
for(const lang of ['ru','uk','en']){
 for(const [k,v] of Object.entries(T[lang])){if(Array.isArray(v))assert.equal(v.length,T.ru[k].length,k+' ('+lang+')');else if(typeof v==='string')assert.ok(v.length>1,k+' ('+lang+')');}
 for(const id of ['all','auto','loiter','rtl','guided','land'])assert.ok(T[lang]['g_'+id]&&T[lang]['gt_'+id],'group '+id+' ('+lang+')');
 for(const k of ['r_v30','r_v31','r_path','c_xe','c_err','c_roll','c_wspd','c_wdir','m_loiter','m_rtl','m_guided','m_land','mh','mh2','what','checks','limits','method','legend'])assert.ok(T[lang][k],k+' ('+lang+')');
 assert.equal(T[lang].mh.length,7);assert.equal(T[lang].mh2.length,6);
 assert.ok(/(экспериментальн|експериментальн|experimental)/i.test(T[lang].scope+T[lang].what[0]),'says experimental ('+lang+')');
 assert.ok(/(не заменяет GPS|не замінює GPS|does not replace GPS)/.test(T[lang].limits.join(' ')),'says that it does not replace GPS ('+lang+')');
 assert.ok(/(стендовая|стендова|bench)/.test(T[lang].limits.join(' ')),'says that bench and flight validation is pending ('+lang+')');
 const facts={flights:393,hours:114,demo_minutes:42};const c=T[lang].checks(facts).join(' ');assert.ok(c.includes('393')&&c.includes('114')&&c.includes('42'),'the numbers of the validation ('+lang+')');
 assert.ok(T[lang].scope.includes('{min}'),'the duration comes from the data ('+lang+')');
}
// the data
const data=JSON.parse(read('data/sitl/atlas-31-demo.json'));
assert.equal(data.schema,1);assert.deepEqual(data.groups.map(g=>g.id),['all','auto','loiter','rtl','guided','land']);
assert.deepEqual(data.facts,{flights:393,hours:114,demo_minutes:data.facts.demo_minutes});assert.ok(data.facts.demo_minutes>=40&&data.facts.demo_minutes<=46);
for(const g of data.groups){
 assert.deepEqual(g.runs.map(r=>r.id),['v30','v31'],g.id);
 for(const mk of g.marks||[])for(const lang of ['ru','uk','en'])assert.ok(T[lang]['m_'+mk.key],'mark label '+mk.key);
 for(const r of g.runs){const d=r.d;assert.ok(d.step>0&&d.n>20,g.id+' '+r.id);
  for(const k of ['tn','te','en','ee','err','roll','xe','wtn','wte','wen','wee'])assert.equal(d[k].length,d.n,g.id+' '+r.id+' '+k);
  assert.ok(d.err.every(Number.isFinite)&&d.tn.every(Number.isFinite)&&d.en.every(Number.isFinite),'finite positions');
  assert.ok(d.xe.every(v=>v===null||Number.isFinite(v)),'xe');assert.ok(d.shapes.length>0&&d.shapes.every(s=>(s.kind==='line'&&s.a&&s.b)||(s.kind==='circle'&&s.c&&s.r>0)),'shapes');
  assert.ok(d.fixes.every(f=>Number.isFinite(f.t)&&Number.isFinite(f.tn)),'fixes');}
}
// the numbers behind the texts (the first group carries the numbers of the whole flight)
const [v30,v31]=data.groups[0].runs.map(r=>r.m);
assert.ok(v31.auto.mean_abs*3<v30.auto.mean_abs,'AUTO: the offset from the line is at least three times smaller in 3.1');
assert.ok(v31.land.final_mean_abs*10<v30.land.final_mean_abs,'the final approach: the offset from the line is at least ten times smaller in 3.1');
assert.ok(v30.rtl.angle_med>4&&v31.rtl.angle_med<2&&v30.guided.angle_med>8&&v31.guided.angle_med<2,'RTL and GUIDED: the ground track points beside the target by the drift angle in 3.0 and at the target in 3.1');
assert.ok(v31.loiter.sd<v30.loiter.sd,'LOITER: the circle is closer to the asked one in 3.1');
assert.ok(v31.flight.rms/v30.flight.rms>0.7&&v31.flight.rms/v30.flight.rms<1.4,'the position error is of the same order in both versions: the navigation only follows the estimate');
assert.ok(v30.flight.wind_est_err_1200<1&&v31.flight.wind_est_err_1200<1,'the learned wind is close to the real one in both');
assert.ok(v30.flight.fixes>=20&&v31.flight.fixes>=20,'the operator marked the position all along');
for(const m of [v30,v31])for(const k of ['td_truth_cross','td_truth_along','td_truth_dist','td_err','final_mean_abs'])assert.ok(Number.isFinite(m.land[k]),'touchdown number '+k);
console.log('PASS: 3.1 demonstration page: wiring, three languages, '+data.groups.length+' recordings of two flights of '+data.facts.demo_minutes+' minutes and the numbers behind the texts.');
