/* SITL replay pages (6.3 kg, 7.2 kg and the 7.2 kg stress test): wiring, recorded-data shape, three-language coverage and changelog buttons. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const pages={
 'sitl-demo.html':{variant:'63',src:'data/sitl/order-demo.json'},
 'sitl-demo-72.html':{variant:'72',src:'data/sitl/atlas-72kg-showcase.json'},
 'sitl-demo-stress.html':{variant:'stress',src:'data/sitl/atlas-72kg-stress.json'}
};
const js=read('js/site/sitl-demo.js');
const ids=['title','scope','status','dataset','play','rate','phase','scrub','time','truth','ekf','dcm','truthValues','ekfValues','dcmValues','speeds','speedPlot','errorSource','errorPlot','sampling','metrics','metricsTitle','runLabel','limits','tiltHead'];
const archives={};
for(const [page,cfg] of Object.entries(pages)){
 const html=read(page);
 assert.ok(html.includes(`data-variant="${cfg.variant}"`)&&html.includes(`data-src="${cfg.src}"`),page+' must declare its model variant and recorded data file');
 assert.match(html,/<script src="js\/site\/sitl-demo\.js(\?[^"]*)?" defer>/,page+' must load the shared replay script');
 assert.match(html,/href="css\/sitl-demo\.css(\?[^"]*)?"/,page+' must load the replay stylesheet');
 for(const id of ids)assert.ok(html.includes(`id="${id}"`),page+' lacks #'+id);
 for(const lang of ['ru','uk','en'])assert.ok(html.includes(`data-language="${lang}"`),page+' lacks language button '+lang);
 assert.ok(fs.existsSync(cfg.src),cfg.src+' is missing');
 archives[page]=JSON.parse(read(cfg.src));
}
// recorded data shape: every row has all columns, time grows monotonically, phases are inside the recording
for(const [page,archive] of Object.entries(archives)){
 assert.ok(Array.isArray(archive.datasets)&&archive.datasets.length,page+': no datasets');
 for(const d of archive.datasets){
  assert.equal(d.columns.length,19,page+' '+d.id+': 19 columns expected');
  const hz=d.hz||2;
  let last=-1;
  for(const r of d.rows){
   assert.equal(r.length,19,page+' '+d.id+': malformed row');
   assert.ok(r.every(Number.isFinite),page+' '+d.id+': non-finite value');
   assert.ok(r[0]>last,page+' '+d.id+': time must increase');
   last=r[0];
  }
  assert.ok(Math.abs(d.rows[1][0]-d.rows[0][0]-1/hz)<0.02,page+' '+d.id+': rows must be uniformly sampled at hz');
  assert.ok(d.phases.length&&d.phases.every(p=>p.start<p.end&&p.start>=0&&p.start<=last),page+' '+d.id+': every phase must start inside the recording');
 }
}
// the 7.2 kg recording: metrics table and three-language labels for every dataset, metric row and phase
const a72=archives['sitl-demo-72.html'];
assert.ok(Array.isArray(a72.table)&&a72.table.length>=8,'7.2 kg metrics table missing');
const extra=js.slice(js.indexOf('const extra72='),js.indexOf('const words={}'));
const kinds=js.slice(js.indexOf('const kinds72='),js.indexOf('function phaseName'));
const count=(text,re)=>(text.match(re)||[]).length;
for(const d of a72.datasets)assert.equal(count(extra,new RegExp('\\b'+d.id+":'",'g')),3,'dataset label must exist in ru, uk and en: '+d.id);
for(const r of a72.table){
 assert.equal(count(extra,new RegExp('\\bm_'+r.id+":'",'g')),3,'metric row label must exist in ru, uk and en: '+r.id);
 assert.ok(r.ekf_rms.length===3&&r.dcm_rms.length===3&&Number.isFinite(r.ekf_tilt)&&Number.isFinite(r.dcm_tilt),'metric row incomplete: '+r.id);
}
const phaseNames=new Set(a72.datasets.flatMap(d=>d.phases.map(p=>p.name)));
const shared=js.slice(js.indexOf('const phases={'),js.indexOf("if(variant==='72'"));
for(const name of phaseNames)assert.match(kinds+shared,new RegExp('\\b'+name+':\\[\'[^\']+\',\'[^\']+\',\'[^\']+\'\\]'),'phase needs ru, uk and en names: '+name);
// the stress-test recording: same shape plus fault and wind lines; three-language labels for datasets, metric rows, fault kinds, phases and page texts
const as=archives['sitl-demo-stress.html'];
const extraS=js.slice(js.indexOf('const extraStress='),js.indexOf('const extra72='));
const kindsS=js.slice(js.indexOf('const kindsStress='),js.indexOf('const kinds72='));
const textsS=js.slice(js.indexOf('special.stress='),js.indexOf('const extraStress='));
assert.ok(Array.isArray(as.table)&&as.table.length>=8,'stress metrics table missing');
for(const key of ['title','scope','sampling','limits','metricsTitle','controls','background','faultsLabel','none','windLabel','ms'])assert.equal(count(textsS,new RegExp('\\b'+key+":'",'g')),3,'stress page text must exist in ru, uk and en: '+key);
assert.match(read('sitl-demo-stress.html'),/id="ekfLabel"/);assert.match(read('sitl-demo-stress.html'),/id="faults"/);
for(const d of as.datasets){
 assert.equal(count(extraS,new RegExp('\\b'+d.id+":'",'g')),3,'stress dataset label must exist in ru, uk and en: '+d.id);
 assert.ok(['ekf3','dcm'].includes(d.active),'stress dataset must say which estimator flew: '+d.id);
 assert.ok(Array.isArray(d.faults)&&Array.isArray(d.wind)&&d.wind.length,'stress dataset needs fault and wind lines: '+d.id);
 for(const f of d.faults){assert.ok(f.start<f.end&&[1,2,3].includes(f.sev),'bad fault window in '+d.id);assert.equal(count(extraS,new RegExp('\\bf_'+f.kind+":'",'g')),3,'fault kind label must exist in ru, uk and en: '+f.kind);}
 for(const p of d.phases)assert.match(kindsS,new RegExp('\\b'+p.name+':\\[\'[^\']+\',\'[^\']+\',\'[^\']+\'\\]'),'stress phase needs ru, uk and en names: '+p.name);
}
for(const r of as.table){
 assert.equal(count(extraS,new RegExp('\\bm_'+r.id+":'",'g')),3,'stress metric row label must exist in ru, uk and en: '+r.id);
 assert.ok(r.ekf_rms.length===3&&r.dcm_rms.length===3&&Number.isFinite(r.ekf_tilt)&&Number.isFinite(r.dcm_tilt),'stress metric row incomplete: '+r.id);
}
// page title carries the protocol rename and the model in all three languages
for(const [lang,protocol] of [['ru','с протоколом П.Р.И.К.А.З'],['uk','з протоколом Н.А.К.А.З'],['en','with the O.R.D.E.R protocol']]){
 const block=js.slice(js.indexOf(' '+lang+":{title:'A.T.L.A.S "));
 assert.ok(block.startsWith(' '+lang+":{title:'A.T.L.A.S "+protocol),'title must read A.T.L.A.S '+protocol+' ('+lang+')');
}
assert.match(js,/6,3 кг/);assert.match(js,/7,2 кг/);assert.match(js,/6\.3 kg/);assert.match(js,/7\.2 kg/);
for(const text of ['scope','limits'])assert.ok(count(js,new RegExp('\\b'+text+':\'','g'))>=6,'both models need '+text+' in three languages');
// changelog: three buttons (6.3 kg, 7.2 kg, 7.2 kg stress test) with three-language captions
const html=read('changelog.html'),log=read('js/site/changelog.js');
assert.match(html,/id="chSitlDemo"[^>]*href="sitl-demo\.html"/,'6.3 kg button missing');
assert.match(html,/id="chSitlDemo72"[^>]*href="sitl-demo-72\.html"/,'7.2 kg button missing');
assert.match(html,/id="chSitlDemoStress"[^>]*href="sitl-demo-stress\.html"/,'stress test button missing');
for(const text of ['Стресс-тест SITL на модели 7,2 кг: EKF3 и DCM','Стрес-тест SITL на моделі 7,2 кг: EKF3 і DCM','SITL stress test on the 7.2 kg model: EKF3 and DCM'])assert.ok(log.includes(text),'changelog caption missing: '+text);
for(const text of ['SITL на модели 6,3 кг','SITL на моделі 6,3 кг','SITL demonstration on the 6.3 kg model','SITL на модели 7,2 кг','SITL на моделі 7,2 кг','SITL demonstration on the 7.2 kg model'])assert.ok(log.includes(text),'changelog caption missing: '+text);
for(const text of ['A.T.L.A.S с протоколом П.Р.И.К.А.З','A.T.L.A.S з протоколом Н.А.К.А.З','A.T.L.A.S with the O.R.D.E.R protocol'])assert.ok(log.includes(text),'protocol heading missing: '+text);
console.log('PASS: SITL replay pages for 6.3 kg, 7.2 kg and the 7.2 kg stress test, recorded data shape, three-language labels and changelog buttons.');
