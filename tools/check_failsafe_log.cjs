/* Radio-failsafe and log presets of the main screen (CIRCLE/LOG OFF, RTL/LOG ON, RTL/LOG OFF): the three parameter sets, what the 4.7.3 firmware has (no FS_SHORT_TIMEOUT),
 * the write order, the writer in configurator.js against a fake link, the card against a fake DOM in three languages, and the layout of the main screen
 * (O.R.D.E.R. and G.L.O.B.A.L. under the horizon, melody, vehicle state and these presets in the right column). */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(require.resolve('../'+p),'utf8').replace(/\r\n/g,'\n');
const core=require('../js/configurator/failsafe-log-core.js');
const P=o=>new Map(Object.entries(o).map(([k,v])=>[k,{value:v,type:9}]));

// ---- the three sets are exactly the owner's lists (4.6.3), without the parameter that 4.7.3 removed
const expected={
 'circle-off':['CIRCLE/LOG OFF',{ARSPD_USE:1,FS_EKF_THRESH:0.8,FS_GCS_ENABL:0,FS_LONG_ACTN:2,FS_LONG_TIMEOUT:240,FS_SHORT_ACTN:0,LOG_BACKEND_TYPE:0,LOG_BITMASK:0}],
 'rtl-on':['RTL/LOG ON',{FS_EKF_THRESH:0.8,FS_GCS_ENABL:0,FS_LONG_ACTN:1,FS_LONG_TIMEOUT:0,FS_SHORT_ACTN:0,LOG_BACKEND_TYPE:1,LOG_BITMASK:65535}],
 'rtl-off':['RTL/LOG OFF',{FS_EKF_THRESH:0.8,FS_GCS_ENABL:0,FS_LONG_ACTN:1,FS_LONG_TIMEOUT:0,FS_SHORT_ACTN:0,LOG_BACKEND_TYPE:0,LOG_BITMASK:0}]
};
assert.deepEqual(core.PRESETS.map(p=>p.id),['circle-off','rtl-on','rtl-off'],'three presets, in the order of the buttons');
for(const p of core.PRESETS){assert.equal(p.label,expected[p.id][0]);assert.deepEqual(Object.fromEntries(p.params),expected[p.id][1],p.id);assert.ok(p.params.every(([n,v])=>core.valid(n,v)),p.id+': every value passes the whitelist');}
assert.ok(!core.NAMES.includes('FS_SHORT_TIMEOUT')&&!core.NAMES.includes('RC_FS_TIMEOUT'),'FS_SHORT_TIMEOUT is gone in 4.7.3 and RC_FS_TIMEOUT is not written by the presets');
assert.ok(core.INFO.includes('RC_FS_TIMEOUT')&&!core.INFO.includes('FS_SHORT_TIMEOUT'),'RC_FS_TIMEOUT is only shown');
assert.ok(core.PRESETS.every(p=>!p.params.some(([n])=>n==='FS_SHORT_TIMEOUT')));
assert.ok(Object.isFrozen(core.PRESETS)&&Object.isFrozen(core.PRESETS[0])&&Object.isFrozen(core.PRESETS[0].params[0]),'the sets cannot be edited at run time');

// ---- the names and values exist in the firmware the site documents (the 4.7 parameter metadata)
const meta=JSON.parse(read('data/param-metadata.json')).parameters;
for(const n of ['FS_EKF_THRESH','FS_GCS_ENABL','FS_LONG_ACTN','FS_LONG_TIMEOUT','FS_SHORT_ACTN','LOG_BITMASK'])assert.ok(meta[n],'metadata: '+n);
assert.equal(meta.FS_SHORT_TIMEOUT,undefined,'the 4.7 metadata has no FS_SHORT_TIMEOUT');
assert.equal(meta.FS_LONG_ACTN.Values['2'],'Glide');assert.equal(meta.FS_LONG_ACTN.Values['1'],'ReturnToLaunch');assert.match(meta.FS_SHORT_ACTN.Values['0'],/^CIRCLE/);assert.equal(meta.FS_GCS_ENABL.Values['0'],'Disabled');

// ---- the whitelist
for(const [n,v] of [['FS_SHORT_TIMEOUT',2],['RC_FS_TIMEOUT',1],['SERVO1_FUNCTION',0],['FS_LONG_ACTN',6],['FS_LONG_ACTN',1.5],['FS_LONG_ACTN','1'],['FS_LONG_TIMEOUT',-1],['FS_LONG_TIMEOUT',301],['FS_LONG_TIMEOUT',NaN],['FS_EKF_THRESH',1.2],['ARSPD_USE',2],['LOG_BACKEND_TYPE',8],['LOG_BITMASK',-1],['LOG_BITMASK',65535.5],['FS_SHORT_ACTN',5],['FS_GCS_ENABL',4]])assert.equal(core.valid(n,v),false,`${n}=${v} is refused`);
for(const [n,v] of [['FS_LONG_TIMEOUT',0],['FS_LONG_TIMEOUT',240],['FS_LONG_TIMEOUT',2.5],['FS_EKF_THRESH',0.6],['LOG_BITMASK',176127],['LOG_BACKEND_TYPE',3]])assert.equal(core.valid(n,v),true,`${n}=${v} is accepted`);

// ---- state of the board against the sets
const golden={ARSPD_USE:1,FS_EKF_THRESH:0.8,FS_GCS_ENABL:0,FS_LONG_ACTN:1,FS_LONG_TIMEOUT:1,FS_SHORT_ACTN:0,LOG_BACKEND_TYPE:1,LOG_BITMASK:65535,RC_FS_TIMEOUT:1};
assert.equal(core.status(P(golden)).state,'custom');assert.equal(core.status(P(golden)).active,null);
for(const [id,[,values]] of Object.entries(expected)){const s=core.status(P({...golden,...values}));assert.equal(s.state,'active',id);assert.equal(s.active,id);assert.deepEqual(s.diffs[id],[]);}
assert.equal(core.status(P({...golden,FS_EKF_THRESH:0.800000011920929,FS_LONG_TIMEOUT:0})).active,'rtl-on','a float echo of 0.8 still matches');
assert.equal(core.status(P({FS_SHORT_ACTN:0,FS_LONG_ACTN:1,LOG_BITMASK:65535})).state,'unsupported','no long timeout on the board: not this firmware');
assert.equal(core.status(P({...expected['rtl-on'][1],ARSPD_USE:0})).active,'rtl-on','ARSPD_USE belongs only to the CIRCLE set');
assert.notEqual(core.status(P({...expected['circle-off'][1],ARSPD_USE:0})).active,'circle-off','CIRCLE/LOG OFF wants ARSPD_USE 1');
assert.equal(core.status(P({...golden,...expected['rtl-on'][1],LOG_BITMASK:0})).active,null,'RTL with half of the log switch is not a preset');

// ---- the order of the writes
const names=u=>u.map(x=>x[0]);
let u=core.plan(P(golden),'circle-off');
assert.deepEqual(u,[['FS_LONG_TIMEOUT',240],['FS_LONG_ACTN',2],['LOG_BITMASK',0],['LOG_BACKEND_TYPE',0]],'a longer wait goes in before the new long action, the log last');
u=core.plan(P({...golden,...expected['circle-off'][1]}),'rtl-on');
assert.deepEqual(u,[['FS_LONG_ACTN',1],['FS_LONG_TIMEOUT',0],['LOG_BITMASK',65535],['LOG_BACKEND_TYPE',1]],'the action first when the wait gets shorter');
assert.deepEqual(core.plan(P(golden),'rtl-on'),[['FS_LONG_TIMEOUT',0]],'only what differs');
assert.deepEqual(core.plan(P({...golden,...expected['rtl-on'][1]}),'rtl-on'),[],'nothing to write when the preset is in place');
assert.deepEqual(core.plan(P({...golden,...expected['rtl-on'][1]}),'rtl-off'),[['LOG_BITMASK',0],['LOG_BACKEND_TYPE',0]],'RTL/LOG ON to RTL/LOG OFF only touches the log');
assert.deepEqual(names(core.plan(P({FS_SHORT_ACTN:3,FS_LONG_ACTN:0,FS_LONG_TIMEOUT:5,FS_GCS_ENABL:1,FS_EKF_THRESH:1,ARSPD_USE:0,LOG_BACKEND_TYPE:1,LOG_BITMASK:176127}),'circle-off')),['FS_GCS_ENABL','FS_EKF_THRESH','FS_SHORT_ACTN','ARSPD_USE','FS_LONG_TIMEOUT','FS_LONG_ACTN','LOG_BITMASK','LOG_BACKEND_TYPE'],'full order');
// no intermediate pair of the long action and the long wait is worse than the old or the new one: never "glide" with a short wait while changing sets
for(const from of Object.keys(expected))for(const to of Object.keys(expected)){
 const board=P({...golden,...expected[from][1]});
 for(const [n,v] of core.plan(board,to)){
  board.set(n,{value:v,type:9});
  const act=board.get('FS_LONG_ACTN').value,wait=board.get('FS_LONG_TIMEOUT').value;
  assert.ok(!(act===2&&wait<240),`${from} -> ${to}: glide with a short wait after ${n}`);
 }
 assert.equal(core.status(board).active,to,`${from} -> ${to} ends in the preset`);
}
assert.equal(core.rebootNeeded(core.plan(P(golden),'circle-off')),true);assert.equal(core.rebootNeeded(core.plan(P(golden),'rtl-on')),false,'RTL/LOG ON on a board with the log on needs no reboot');
assert.throws(()=>core.plan(P(golden),'unknown'),/Unknown preset/);

// ---- wiring: scripts, styles, layout of the main screen
const html=read('configurator.html'),cfg=read('js/configurator/configurator.js'),ui=read('js/configurator/failsafe-log-ui.js');
const scripts=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]),at=n=>scripts.indexOf('js/configurator/'+n);
assert.ok(at('failsafe-log-core.js')>=0&&at('failsafe-log-core.js')<at('configurator.js'),'the core loads before configurator.js');
assert.ok(at('failsafe-log-ui.js')>at('configurator.js')&&at('failsafe-log-ui.js')>at('buzzer-song-ui.js')&&at('buzzer-song-ui.js')>at('global-profile-ui.js')&&at('global-profile-ui.js')>at('capri-ui.js'),'the card loads after the others');
const dash=html.slice(html.indexOf('data-panel="dashboard"'),html.indexOf('<!-- QUICK SETUP -->'));
const left=dash.slice(dash.indexOf('cc-dashboard-left'),dash.indexOf('cc-dashboard-right'));
assert.ok(left.includes('cc-attitude-card')&&left.includes('id="dashBelow"'),'the horizon and the space under it share the left column');
assert.ok(left.indexOf('cc-attitude-card')<left.indexOf('id="dashBelow"'),'the space for the cards is under the horizon');
const right=dash.slice(dash.indexOf('cc-dashboard-right'));
assert.ok(right.includes('cc-status-panel')&&right.includes('cc-messages-panel')&&!right.includes('orderPanel')&&!right.includes('globalPanel'),'the right column keeps the vehicle state and the messages');
const capri=read('js/configurator/capri-ui.js'),glob=read('js/configurator/global-profile-ui.js'),song=read('js/configurator/buzzer-song-ui.js');
assert.match(capri,/getElementById\('dashBelow'\)/);assert.ok(!/prepend\(card\)/.test(capri),'the O.R.D.E.R. card is not put into the right column any more');
assert.match(glob,/order\.after\(card\)/);assert.match(glob,/getElementById\('dashBelow'\)/);
assert.match(song,/querySelector\('\.cc-status-panel'\)/);assert.match(song,/statusPanel\.after\(card\)/);assert.match(ui,/querySelector\('\.cc-status-panel'\)/);assert.match(ui,/statusPanel\.after\(card\)/);
const css=read('css/configurator.css'),capriCss=read('css/capri.css');
for(const sel of ['.cc-dashboard-left','.cc-dashboard-below','.cc-dashboard-below:empty'])assert.ok(css.includes(sel),'style '+sel);
assert.ok(!/grid-template-rows:auto minmax\(180px,1fr\)/.test(css),'the right column no longer assumes two cards');
for(const sel of ['.fslog-buttons','.fslog-card'])assert.ok(capriCss.includes(sel),'style '+sel);
assert.ok(html.includes('css/capri.css?v=2-2-fslog')&&html.includes('css/configurator.css?v=2-2-servo-menu'),'new cache tags of the changed styles');
assert.ok(/configurator\.js\?v=3-0-dronecan/.test(html)&&/capri-ui\.js\?v=2-2-layout/.test(html)&&/global-profile-ui\.js\?v=2-2-layout/.test(html)&&/buzzer-song-ui\.js\?v=2-2-layout/.test(html)&&/failsafe-log-ui\.js\?v=2-2-fslog2"/.test(html),'new cache tags of the changed scripts');

// ---- the writer in configurator.js
assert.match(cfg,/writeFailsafeLogPreset:async/);
const writer=cfg.slice(cfg.indexOf('writeFailsafeLogPreset:async'),cfg.indexOf('// DO_SET_SERVO is supported only on Disabled'));
assert.match(writer,/core\.valid\(name,value\)/);assert.match(writer,/!canWrite\(\)/);assert.match(writer,/writeParameterWithAck\(change\.name,change\.value,change\.type\)/);assert.match(writer,/state\.armed!==false/);assert.ok(!/FS_SHORT_TIMEOUT/.test(writer));
function runWriter({armed=false,canWrite=true,params,echo=(n,v)=>v}={}){
 const state={params:params||P(golden),connected:true,armed,lastHeartbeat:Date.now(),servoConfigBusy:false},writes=[],progress=[];
 const ctx={window:{AtlasFailsafeLog:core},state,txGeneration:1,Date,Error,Array,Number,Set,JSON,Promise,canWrite:()=>canWrite,renderParams(){},renderBasic(){},
  writeParameterWithAck:async(name,value,type)=>{writes.push([name,value,type]);const v=echo(name,value);state.params.set(name,{value:v,type});return v;}};
 const api=vm.runInNewContext('({'+writer.replace(/,\s*$/,'')+'})',ctx);
 return {api,state,writes,progress,run:x=>api.writeFailsafeLogPreset(x,p=>progress.push(p))};
}
(async()=>{
 const plan=core.plan(P(golden),'circle-off'),ok=runWriter();
 assert.equal(JSON.stringify(await ok.run(plan)),'{"done":4,"total":4}');assert.deepEqual(ok.writes.map(x=>x.slice(0,2)),plan,'written in the order of the plan');assert.ok(ok.writes.every(x=>x[2]===9),'with the type the board reports');
 assert.equal(core.status(ok.state.params).active,'circle-off');assert.equal(ok.state.servoConfigBusy,false);assert.equal(ok.progress.at(-1).done,4);
 await assert.rejects(runWriter({canWrite:false}).run(plan),/Live USB/);
 for(const bad of [[['FS_SHORT_TIMEOUT',2]],[['RC_FS_TIMEOUT',2]],[['SERVO1_FUNCTION',1]],[['FS_LONG_ACTN',7]],[['FS_LONG_ACTN',1],['FS_LONG_ACTN',2]],[],'FS_LONG_ACTN',[['FS_LONG_ACTN','1']],[['LOG_BITMASK',1],['LOG_BACKEND_TYPE',1],['FS_LONG_ACTN',1],['FS_LONG_TIMEOUT',1],['FS_SHORT_ACTN',0],['FS_GCS_ENABL',0],['FS_EKF_THRESH',0.8],['ARSPD_USE',1],['LOG_BITMASK',2]]]){const w=runWriter();await assert.rejects(w.run(bad),/Invalid failsafe and log/);assert.equal(w.writes.length,0,'nothing is written for '+JSON.stringify(bad));}
 await assert.rejects(runWriter({params:P({FS_LONG_ACTN:1})}).run([['FS_LONG_TIMEOUT',0]]),/not present on FC/);
 const mid=runWriter({echo:(n,v)=>{if(n==='FS_LONG_TIMEOUT')mid.state.armed=true;return v;}});await assert.rejects(mid.run(plan),/Recorded 1\/4: Disconnected or ARM state changed/);assert.equal(mid.writes.length,1,'ARM in the middle stops the write before the next parameter');
 const refused=runWriter({echo:()=>{throw Error('no acknowledgement');}});await assert.rejects(refused.run(plan),/Recorded 0\/4: no acknowledgement/);assert.equal(refused.state.servoConfigBusy,false);

 // ---- the card against a fake DOM
 function make(){const el={children:[],dataset:{},hidden:false,disabled:false,textContent:'',className:'',title:'',attrs:{},classes:new Set(),onclick:null,
  append(...k){this.children.push(...k);},prepend(...k){this.children.unshift(...k);},after(){},replaceChildren(...k){this.children=k;},setAttribute(n,v){this.attrs[n]=v;}};
  el.classList={toggle:(c,on)=>{if(on)el.classes.add(c);else el.classes.delete(c);}};return el;}
 function runCard(language,initial,{confirm=true,canWrite=true,write}={}){
  const els=new Map(),mounted=[],byId=id=>{if(!els.has(id))els.set(id,make());return els.get(id);};
  const statusPanel=make();statusPanel.after=card=>mounted.push(card);
  const params=initial instanceof Map?initial:P(initial),calls=[],confirms=[],handlers={};
  const api={getState:()=>({connected:true,demo:false,sysid:1,compid:1,armed:false,lastHeartbeat:Date.now(),params,paramLoading:false,connectionId:1}),canWrite:()=>canWrite,
   writeFailsafeLogPreset:write||(async(updates,cb)=>{calls.push(updates);let n=0;for(const [k,v] of updates){cb({done:n,total:updates.length,name:k});params.set(k,{value:v,type:9});n++;}cb({done:n,total:n,name:''});return {done:n,total:n};})};
  const window={AtlasCC:api,AtlasFailsafeLog:core,AtlasLanguage:()=>language,addEventListener:(e,f)=>{handlers[e]=f;},confirm:t=>{confirms.push(t);return confirm;}};
  const document={createElement:()=>make(),getElementById:byId,querySelector:s=>s==='.cc-status-panel'?statusPanel:null,hidden:false};
  vm.runInNewContext(read('js/configurator/failsafe-log-ui.js'),{window,document,setInterval:()=>1,clearInterval(){},Date,Math,JSON,Number,Object,String,Error,Promise,Array});
  return {byId,calls,confirms,params,handlers,mounted,buttons:()=>byId('fslogButtons').children,refresh:()=>handlers['atlas:parameters']()};
 }
 const text={ru:{title:'Отказ радио и лог',active:'АКТИВЕН',custom:'СВОИ ЗНАЧЕНИЯ',noparams:'Подключи контроллер',written:'Записано и подтверждено',reboot:'перезагрузи контроллер',already:'уже в этом состоянии',confirm:'Записать набор «RTL/LOG ON»'},
  uk:{title:'Відмова радіо та лог',active:'АКТИВНИЙ',custom:'ВЛАСНІ ЗНАЧЕННЯ',noparams:'Підключи контролер',written:'Записано й підтверджено',reboot:'перезавантаж контролер',already:'уже в цьому стані',confirm:'Записати набір «RTL/LOG ON»'},
  en:{title:'Radio failsafe and log',active:'ACTIVE',custom:'CUSTOM VALUES',noparams:'Connect the controller',written:'Written and confirmed',reboot:'reboot the controller',already:'already in this state',confirm:'Write the “RTL/LOG ON” preset'}};
 for(const lang of ['ru','uk','en']){
  const t=text[lang];
  // no parameters yet
  let c=runCard(lang,new Map());assert.equal(c.mounted.length,1,'the card is mounted right after the vehicle state');assert.equal(c.byId('fslogTitle').textContent,t.title);assert.ok(c.byId('fslogStatus').textContent.includes(t.noparams));
  assert.deepEqual(c.buttons().map(b=>b.textContent),['CIRCLE/LOG OFF','RTL/LOG ON','RTL/LOG OFF'],'three buttons with the owner\'s names');assert.ok(c.buttons().every(b=>b.disabled),'nothing can be written before the parameters are read');
  // the board as shipped: custom values; the note quotes RC_FS_TIMEOUT
  c=runCard(lang,golden);assert.ok(c.byId('fslogStatus').textContent.includes(t.custom));assert.ok(c.byId('fslogNote').textContent.includes('FS_SHORT_TIMEOUT')&&c.byId('fslogNote').textContent.includes('RC_FS_TIMEOUT'));assert.match(c.byId('fslogNote').textContent,/RC_FS_TIMEOUT \(1 ?[сs]\)/);
  assert.ok(c.buttons().every(b=>!b.disabled),'all three can be written');assert.ok(c.buttons().every(b=>b.title.length>10),'each button explains itself');
  assert.ok(c.byId('fslogValues').children.some(r=>r.children[0].textContent==='RC_FS_TIMEOUT'&&r.children[1].textContent==='1'),'RC_FS_TIMEOUT is shown');
  const details=c.byId('fslogDetails').children.map(x=>x.textContent);assert.equal(details.length,3);assert.ok(details[0].startsWith('CIRCLE/LOG OFF:')&&details[0].includes('FS_LONG_TIMEOUT 240')&&!details.join(' ').includes('FS_SHORT_TIMEOUT'));
  // RTL/LOG ON: the shipped board only needs the wait set to 0; no reboot note
  await c.buttons()[1].onclick();assert.equal(c.confirms.length,1);assert.ok(c.confirms[0].includes(t.confirm)&&c.confirms[0].includes('FS_LONG_TIMEOUT: 1 → 0'));assert.ok(!c.confirms[0].includes(t.reboot));
  assert.deepEqual(c.calls,[[['FS_LONG_TIMEOUT',0]]]);assert.ok(c.byId('fslogResult').textContent.includes(t.written));assert.ok(c.byId('fslogStatus').textContent.includes(t.active)&&c.byId('fslogStatus').textContent.includes('RTL/LOG ON'));
  assert.equal(c.buttons()[1].disabled,true,'the active preset cannot be written again');assert.equal(c.buttons()[1].attrs['aria-pressed'],'true');assert.ok(c.buttons()[1].classes.has('primary'));
  await c.buttons()[1].onclick();assert.equal(c.confirms.length,1,'nothing to confirm for a preset that is in place');
  // CIRCLE/LOG OFF: the log backend changes, so the confirmation and the result remind about the reboot
  await c.buttons()[0].onclick();assert.equal(c.confirms.length,2);assert.ok(c.confirms[1].includes('CIRCLE/LOG OFF')&&c.confirms[1].includes('LOG_BACKEND_TYPE: 1 → 0')&&c.confirms[1].includes(t.reboot));assert.ok(c.byId('fslogResult').textContent.includes(t.reboot));
  assert.ok(c.byId('fslogStatus').textContent.includes('CIRCLE/LOG OFF'));
  // declined, no link
  c=runCard(lang,golden,{confirm:false});await c.buttons()[2].onclick();assert.equal(c.confirms.length,1);assert.equal(c.calls.length,0,'nothing is written when the owner declines');
  c=runCard(lang,golden,{canWrite:false});assert.ok(c.buttons().every(b=>b.disabled),'no writing without a DISARMED live link');await c.buttons()[1].onclick();assert.equal(c.confirms.length,0);
  // a failed write is reported, the card is usable again
  c=runCard(lang,golden,{write:async()=>{throw Error('Recorded 0/1: no acknowledgement');}});await c.buttons()[1].onclick();assert.match(c.byId('fslogResult').textContent,/Recorded 0\/1/);assert.ok(c.buttons().every(b=>!b.disabled));
 }
 // every text exists in three languages
 const keys=['title','noparams','unsupported','active','custom','values','details','tips','help','note','confirm','reboot','written','already','progress','blocked','unit'];
 const wordsBlock=ui.slice(ui.indexOf('const words={'),ui.indexOf('\n};'));
 for(const k of keys)assert.equal((wordsBlock.match(new RegExp(`(?:[{,\\n])\\s*${k}:`,'g'))||[]).length,3,k+' in ru, uk and en');
 for(const lang of ['ru','uk','en'])assert.ok(new RegExp(`\\n ${lang}:\\{title:`).test(ui),'card words in '+lang);
 assert.ok(!/generated|сгенерир|згенерова/i.test(ui+read('js/configurator/failsafe-log-core.js')),'no "generated" wording');
 console.log('PASS: failsafe and log presets — three sets, 4.7.3 names, write order, writer, card in three languages and the layout of the main screen.');
})().catch(e=>{console.error(e);process.exit(1);});
