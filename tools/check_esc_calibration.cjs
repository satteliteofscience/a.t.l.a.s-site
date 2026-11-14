/* ESC calibration of a plain PWM regulator, laid out like a servo-output table (Position, Reverse, Function, Min, Trim, Max): the pure helpers, the live parameter
 * writes, the manual signal with its safety order, the standalone sidebar tab, and the MAVLink 2 parsing of the output telemetry that feeds the Position bar. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('../js/configurator/quick-setup-core.js');
const read=p=>fs.readFileSync(require.resolve(p),'utf8').replace(/\r\n/g,'\n');
const wizard=read('../js/configurator/quick-setup.js'),cfg=read('../js/configurator/configurator.js');
const plain=value=>JSON.parse(JSON.stringify(value));   // objects made inside a vm context have another prototype

// ---- pure helpers
assert.deepEqual(core.ESC_PWM_LIMITS,{min:1000,max:2200});
const P=entries=>new Map(Object.entries(entries).map(([k,v])=>[k,{value:v,type:9}]));
const base={SERVO3_FUNCTION:70,SERVO3_MIN:1000,SERVO3_TRIM:1500,SERVO3_MAX:2000,SERVO3_REVERSED:0,SERVO_BLH_MASK:0,SERVO_BLH_OTYPE:0};
assert.deepEqual(core.escThrottleChannels(P({...base,SERVO1_FUNCTION:4,SERVO5_FUNCTION:73,SERVO6_FUNCTION:74})),[3,5,6],'the throttle outputs, whatever the protocol parameters say');
assert.deepEqual(core.escThrottleChannels(P({SERVO3_FUNCTION:70})),[3],'no SERVO_BLH_* parameters needed');
assert.deepEqual(core.escThrottleChannels(P({SERVO3_FUNCTION:0})),[]);
let plan=core.escCalibrationPlan(P(base),[3]);
assert.deepEqual(plan.outputs,[{channel:3,func:70,min:1000,trim:1500,max:2000,reversed:0}]);
assert.equal(core.escCalibrationPlan(P({...base,SERVO3_FUNCTION:4}),[3]).error,'function','only throttle outputs are taken over');
assert.equal(core.escCalibrationPlan(P({...base,SERVO3_FUNCTION:0}),[3]).error,'function','an output that is already Disabled is not taken over');
assert.equal(core.escCalibrationPlan(P({SERVO3_FUNCTION:70}),[3]).error,'missing');assert.equal(core.escCalibrationPlan(P(base),[]).error,'none');
// the cells of the table: values 1000-2200, MIN <= TRIM <= MAX, 100 us span; TRIM follows MIN / MAX when they would cross it
const out={min:1000,trim:1000,max:1900,reversed:1};   // the aircraft of the screenshot: throttle, reversed, 1000 / 1000 / 1900
assert.deepEqual(core.escFieldWrites('MAX',2000,out),{updates:{MAX:2000}});
assert.deepEqual(core.escFieldWrites('MIN',1100,out),{updates:{MIN:1100,TRIM:1100}},'TRIM is pulled up with MIN');
assert.deepEqual(core.escFieldWrites('MAX',1050,{...out,trim:1500,min:1000,max:2000}),{error:'span'});
assert.deepEqual(core.escFieldWrites('MAX',1500,{min:1000,trim:1800,max:2000}),{updates:{MAX:1500,TRIM:1500}},'TRIM is pulled down with MAX');
assert.deepEqual(core.escFieldWrites('TRIM',1500,out),{updates:{TRIM:1500}});
assert.equal(core.escFieldWrites('TRIM',950,out).error,'limits');assert.equal(core.escFieldWrites('TRIM',1950,out).error,'order','TRIM above MAX');
assert.equal(core.escFieldWrites('MAX',2201,out).error,'limits');assert.equal(core.escFieldWrites('MIN',999,out).error,'limits');assert.equal(core.escFieldWrites('MAX',1500.5,out).error,'limits');assert.equal(core.escFieldWrites('MAX',NaN,out).error,'limits');
assert.deepEqual(core.escFieldWrites('REVERSED',1,out),{updates:{REVERSED:1}});assert.equal(core.escFieldWrites('REVERSED',2,out).error,'reversed');assert.equal(core.escFieldWrites('FUNCTION',0,out).error,'field','the function is never edited from a cell');
// zero throttle is the level the controller output before the take-over; without a measurement the low end (the high end when reversed)
assert.equal(core.escZeroSide({min:1000,max:1900,reversed:1},1900),'max','measured 1900: that is the zero-throttle end whatever Reverse says');
assert.equal(core.escZeroSide({min:1000,max:1900,reversed:1},1000),'min');assert.equal(core.escZeroSide({min:1000,max:1900,reversed:0},null),'min');assert.equal(core.escZeroSide({min:1000,max:1900,reversed:1},null),'max');
assert.deepEqual(core.escEnds({min:1000,max:1900},'min'),{zero:1000,full:1900});assert.deepEqual(core.escEnds({min:1000,max:1900},'max'),{zero:1900,full:1000});
const record={v:1,outputs:[{channel:3,func:70},{channel:4,func:73}],at:1};
assert.deepEqual(core.escPendingChannels(record,P({SERVO3_FUNCTION:0,SERVO4_FUNCTION:73})),[{channel:3,func:70}]);
assert.deepEqual(core.escPendingChannels(record,P({SERVO3_FUNCTION:70,SERVO4_FUNCTION:73})),[]);
assert.deepEqual(core.escPendingChannels({v:2,outputs:record.outputs},P({SERVO3_FUNCTION:0})),[]);assert.deepEqual(core.escPendingChannels(null,P({})),[]);
assert.deepEqual(core.escPendingChannels({v:1,outputs:[{channel:3,func:4}]},P({SERVO3_FUNCTION:0})),[],'only a throttle function may be restored');
for(const kind of ['pwm','unknown'])assert.equal(core.escManualAllowed(kind),true,kind);for(const kind of ['dshot','mixed','other-pulse','dshot-board-limit','no-throttle'])assert.equal(core.escManualAllowed(kind),false,kind);

// ---- the output telemetry that feeds the Position bar: MAVLink 2 drops trailing zero bytes, so the first output group (port 0) arrives without its port byte
{
 const context={window:{},TextEncoder,TextDecoder,Uint8Array,DataView};vm.runInNewContext(fs.readFileSync(require.resolve('../js/configurator/mavlink.js'),'utf8'),context);
 const M=context.window.AtlasMAV,parse=payload=>{const got=[];new M.Parser(x=>got.push(M.parseMessage(x))).push(M.createFrame(36,payload));return got[0];};
 const full=new Uint8Array(37);const view=new DataView(full.buffer);view.setUint32(0,5000,true);[1900,1500,1100,0,0,0,0,0].forEach((v,i)=>view.setUint16(4+i*2,v,true));
 const exact=parse(full.slice(0,21));assert.equal(exact.type,'servo_output');assert.equal(exact.port,0);assert.deepEqual(plain(exact.pwm.slice(0,4)),[1900,1500,1100,0]);
 const trimmed=parse(full.slice(0,10));   // MAVLink 2: only servo1..3 carry data, the rest was zeros and was cut
 assert.equal(trimmed.type,'servo_output','a truncated payload is still a servo output message');assert.equal(trimmed.port,0);assert.equal(trimmed.pwm[0],1900);assert.equal(trimmed.pwm[1],1500);assert.equal(trimmed.pwm.length,8);
 full[20]=1;view.setUint16(21,1234,true);const second=parse(full);assert.equal(second.port,1);assert.equal(second.pwm.length,16);assert.equal(second.pwm[8],1234);
}

// ---- the controller API: only outputs that are Disabled right now, 1000-2200 us, DISARMED link, never the generic bench
const api=cfg.slice(cfg.indexOf('sendEscCalibrationPwm:async'),cfg.indexOf('writeAdvancedParams:async'));
assert.match(api,/pwm<1000\|\|pwm>2200/);assert.match(api,/canCalibrate\(\)/);assert.match(api,/_FUNCTION`\)\?\.value!==0\)throw/);assert.match(api,/commandLong\(state\.sysid,state\.compid,183,\[channel,pwm/);
assert.match(cfg,/sendServoPwm:async\(channel,pwm\)=>\{[^]*?pwm<1000\|\|pwm>2000/,'the generic bench keeps its 1000-2000 limit and its function guard');
assert.doesNotMatch(wizard,/api\.sendServoPwm\(|api\.command\(/);

// ---- order of the safety-relevant steps in the wizard source
const fn=name=>{const from=wizard.indexOf(`function ${name}(`);assert.ok(from>0,name);return wizard.slice(wizard.lastIndexOf('\n',from)+1,wizard.indexOf('\n}\n',from)+3);};
const start=fn('escStart');
assert.ok(start.indexOf('window.confirm')<start.indexOf('{FUNCTION:0}'),'the user confirms before the first write');
assert.ok(start.indexOf('escSavePending(')<start.indexOf('{FUNCTION:0}'),'the restore record is saved before the first write');
assert.ok(start.indexOf('escRestore(plan.outputs)')>start.indexOf('{FUNCTION:0}'),'a failed start restores the outputs');
assert.ok(start.indexOf('escManualReasons()')<start.indexOf('window.confirm'),'every precondition is checked before the confirmation');
assert.ok(start.indexOf('escMeasured(')<start.indexOf('{FUNCTION:0}'),'the zero level is measured before the output is taken over');
const finish=fn('escFinish');
assert.ok(finish.indexOf('sendEscCalibrationPwm')<finish.indexOf('escRestore(e.outputs)'),'the ESC is parked at zero before the throttle function comes back');
assert.doesNotMatch(finish,/MIN|TRIM|MAX/,'finishing writes no range: the cells were written live');
const sendCalls=[...wizard.matchAll(/api\.sendEscCalibrationPwm\(/g)].map(m=>wizard.lastIndexOf('async function ',m.index));
assert.ok(sendCalls.length>=2&&sendCalls.every(i=>/async function esc(Send|Finish)\(/.test(wizard.slice(i,i+40))),'PWM is only sent from the send loop and when finishing');
assert.match(wizard,/if\(qs\.esc\.phase==='active'&&index!==7\)/,'the step cannot be left while the outputs are taken over');
assert.match(wizard,/qs\.esc\.phase==='active'\|\|qs\.esc\.writing\|\|qs\.esc\.pending\.length>0\)\)return false/,'Next stays disabled while manual mode runs or an output is not restored');
assert.match(wizard,/qs\.esc\.node&&qs\.esc\.lang===lang\(\)&&\$\('qsContent'\)\?\.contains\(qs\.esc\.node\)/,'the running panel survives re-renders');
assert.match(wizard,/core\.escManualAllowed\(result\.kind\)\|\|qs\.esc\.phase==='done'\)renderEscCalibration/,'the panel is shown for plain PWM and for an undetermined protocol');
for(const key of ['escCalTitle','escCalNav','escCalTabTitle','escCalTabIntro','escCalIntro','escCalSteps','escCalColPos','escCalColRev','escCalColFn','escCalColMin','escCalColTrim','escCalColMax','escCalRowHint','escCalSaved','escCalNoOutputs','escCalProtocolUnknown','escCalProtocolDigital','escCalManualTitle','escCalManualIntro','escCalAck1','escCalAck2','escCalAckNeeded','escCalStart','escCalConfirm','escCalActive','escCalZero','escCalFull','escCalFullAck','escCalSignal','escCalFinish','escCalFinished','escCalMixed','escCalPending','escCalRestore','escCalNoLink','escCalLeave','escCalRangeBad','escCalFail'])assert.equal((wizard.match(new RegExp(`\\b${key}:`,'g'))||[]).length,3,key+' in ru, uk and en');

// ---- the whole flow on a fake controller
function makeEl(tag){return {tag,children:[],listeners:{},style:{},dataset:{},className:'',textContent:'',hidden:false,disabled:false,checked:false,value:'',type:'',
 append(...k){this.children.push(...k);},replaceChildren(...k){this.children=k;},contains(node){return this.children.includes(node);},addEventListener(n,f){(this.listeners[n]||(this.listeners[n]=[])).push(f);},fire(n){for(const f of this.listeners[n]||[])f({target:this});}};}
const wait=(ms=25)=>new Promise(resolve=>setTimeout(resolve,ms));
const tick=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
function harness({language='ru',params=P(base),failWrite=null,kind=null}={}){
 const sent=[],writes=[],timers=[],store={},winHandlers={},navigations=[],confirms=[];let replaced=0,exposedRef=null;
 const live={connected:true,demo:false,armed:false,lastHeartbeat:Date.now(),params,paramLoading:false,paramComplete:true,selectedBoard:'matek-h743-wing-v3'};
 const host=makeEl('div'),badge=makeEl('span');{const original=host.replaceChildren;host.replaceChildren=function(...k){replaced++;return original.apply(this,k);};}
 const fake={getState:()=>live,canWrite:()=>true,navigate:tab=>navigations.push(tab),
  writeServoConfig:async(channel,updates)=>{
   if(failWrite&&failWrite(channel,updates))throw Error('PARAM_SET timeout');
   writes.push(plain([channel,updates]));for(const [field,value] of Object.entries(updates))params.set(`SERVO${channel}_${field}`,{value,type:9});},
  sendEscCalibrationPwm:async(channels,pwm)=>{for(const c of channels)if(params.get(`SERVO${c}_FUNCTION`).value!==0)throw Error('not Disabled');sent.push(plain([channels,pwm]));}};
 const context={qs:{esc:null},api:fake,core,copy:{ru:{},uk:{},en:{}},lang:()=>language,render:()=>{if(exposedRef)exposedRef.updateEscPanel();},wizardActive:true,
  window:{confirm:text=>{confirms.push(text);return true;},addEventListener(name,fn){winHandlers[name]=fn;}},
  document:{createElement:makeEl,activeElement:null,querySelector:()=>null},
  $:id=>id==='escCalContent'?host:id==='escCalStatusBadge'?badge:null,addHeading(parent){parent.append(makeEl('heading'));},addUsbButton(){},complete(){},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},
  setInterval:fn2=>{timers.push(fn2);return timers.length;},clearInterval(){},setTimeout,clearTimeout,Date,JSON,Map,Promise};
 Object.assign(context.qs,{step:7,paramsMode:'keep',fileText:null,previewBoard:null,completed:{},escConfirmed:false});
 context.qs.esc={phase:'idle',outputs:[],zeroSide:null,ack1:false,ack2:false,fullAck:false,writing:false,fieldBusy:0,error:'',message:'',node:null,ui:null,lang:null,result:null,pending:[],pwm:null,servo:[],servoAt:0,timer:null};
 const helpers=wizard.slice(wizard.indexOf('function el(tag,cls,text)'),wizard.indexOf('function persist()'));
 const esc=wizard.slice(wizard.indexOf('// ---- ESC calibration (step 8'),wizard.indexOf('function renderEsc(box'));
 const renderBlock=wizard.slice(wizard.indexOf('function renderEsc(box'),wizard.indexOf('async function verifyCompassBatteryResult('));
 vm.createContext(context);
 const t="function t(key){return (copy[lang()]||copy.ru)[key]||copy.ru[key]||key;}";
 const exposed=vm.runInContext(`${t}\n${helpers}\n${esc}\n${renderBlock}\n({escStart,escFinish,escRestorePending,renderEscCalibration,updateEscPanel,escSetField,escSend,renderEsc,renderEscTab})`,context);
 exposedRef=exposed;
 const box=makeEl('div'),result=core.classifyEscProtocol(params,'matek-h743-wing-v3');
 const servo=(...pwm)=>{winHandlers['atlas:message']({detail:{type:'servo_output',port:0,pwm}});};
 return {...exposed,qs:context.qs,sent,writes,confirms,store,timers,box,result:kind?{...result,kind}:result,params,live,host,badge,winHandlers,navigations,replaced:()=>replaced,servo,
  show:()=>exposed.renderEscCalibration(box,kind?{...result,kind}:result,[]),ui:()=>context.qs.esc.ui,row:c=>context.qs.esc.ui.rows.get(c)};
}
(async()=>{
 // -- the table: one row per throttle output, filled from the controller, like a servo-output table
 {
  const h=harness();h.show();const r=h.row(3);
  assert.ok(r,'a row for the throttle output');
  assert.equal(r.MIN.value,'1000');assert.equal(r.TRIM.value,'1500');assert.equal(r.MAX.value,'2000');assert.equal(r.reverse.checked,false);assert.equal(r.fn.textContent,'Throttle');
  assert.equal(r.value.textContent,'—','no telemetry yet: no invented position');h.servo(0,0,1000);assert.equal(r.value.textContent,'1000','Position shows the real output (a MAVLink 2 payload without the port byte)');
  assert.equal(r.fill.style.width,'0.0%');h.servo(0,0,1600);assert.equal(r.fill.style.width,(50).toFixed(1)+'%');
  assert.equal(r.slider.disabled,true,'the bar cannot be dragged outside manual mode');
  // -- live edits: written at once, acknowledged, TRIM follows
  await h.escSetField(3,'MAX',1900);await tick();assert.deepEqual(h.writes.at(-1),[3,{MAX:1900}]);assert.equal(h.params.get('SERVO3_MAX').value,1900);assert.match(h.qs.esc.message,/SERVO3_MAX = 1900/);
  h.escSetField(3,'MIN',1600);await tick();assert.deepEqual(h.writes.at(-1),[3,{MIN:1600,TRIM:1600}],'TRIM follows MIN');assert.equal(r.TRIM.value,'1600');
  const count=h.writes.length;h.escSetField(3,'MAX',2300);await tick();assert.equal(h.writes.length,count,'an invalid value writes nothing');assert.equal(h.ui().error.hidden,false);assert.equal(r.MAX.value,'1900','the field goes back to the controller value');
  h.escSetField(3,'REVERSED',true);await tick();assert.deepEqual(h.writes.at(-1),[3,{REVERSED:1}]);assert.equal(r.reverse.checked,true);
  // the spinner arrows of a number field fire many changes: one write after a short pause
  const before=h.writes.length;for(const v of ['1650','1700','1750']){r.TRIM.value=v;r.TRIM.fire('change');}await wait(550);
  assert.equal(h.writes.length,before+1,'a burst of changes is one write');assert.deepEqual(h.writes.at(-1),[3,{TRIM:1750}]);
  // not on a safe link: nothing is written
  h.live.armed=true;h.escSetField(3,'MAX',1800);await tick();assert.equal(h.writes.length,before+1);assert.match(h.qs.esc.error,/DISARMED/);
 }
 // -- manual mode: confirmed take-over, the first signal is the level the controller output, full throttle needs its own tick, FUNCTION comes back last
 {
  const h=harness();h.show();let ui=h.ui();
  assert.equal(ui.startButton.disabled,true);assert.match(ui.why.textContent,/пропеллер снят/,'the reason is shown next to the disabled button');
  h.servo(1000);                                   // the controller outputs the low end before the take-over
  h.qs.esc.ack1=true;h.qs.esc.ack2=true;h.updateEscPanel();assert.equal(ui.startButton.disabled,false);assert.equal(ui.why.textContent,'');
  ui.startButton.fire('click');await tick();
  assert.match(h.confirms[0],/SERVO3/);assert.deepEqual(h.writes[0],[3,{FUNCTION:0}],'the throttle output is switched to Disabled first');
  assert.deepEqual(JSON.parse(h.store['atlas.esccal.pending.v1']).outputs,[{channel:3,func:70}]);
  assert.equal(h.qs.esc.phase,'active');assert.deepEqual(h.sent[0],[[3],1000],'the first signal is the zero level, never full throttle');assert.equal(h.timers.length,1);
  assert.equal(ui.live.hidden,false);assert.equal(ui.full.disabled,true,'full throttle needs its own confirmation');assert.equal(h.row(3).slider.disabled,true);
  assert.match(ui.zero.textContent,/Ноль газа · 1000/);assert.match(ui.full.textContent,/Полный газ · 2000/);
  h.qs.esc.fullAck=true;h.updateEscPanel();assert.equal(ui.full.disabled,false);assert.equal(h.row(3).slider.disabled,false);
  ui.full.fire('click');await tick();assert.deepEqual(h.sent.at(-1),[[3],2000]);
  const slider=h.row(3).slider;slider.value='1500';slider.fire('input');await tick();assert.deepEqual(h.sent.at(-1),[[3],1500],'the bar drives the signal');
  ui.zero.fire('click');await tick();assert.deepEqual(h.sent.at(-1),[[3],1000]);
  // an edit during manual mode: written, then the signal is sent again
  ui.full.fire('click');await tick();h.escSetField(3,'MAX',1900);await tick();await tick();assert.deepEqual(h.writes.at(-1),[3,{MAX:1900}]);assert.deepEqual(h.sent.at(-1),[[3],2000],'the signal is the old end until the user moves it');
  // finish: park at zero, give the throttle function back, no range write
  const w=h.writes.length;ui.finish.fire('click');await tick();await tick();
  assert.deepEqual(h.writes.slice(w),[[3,{FUNCTION:70}]],'only the throttle function comes back');assert.deepEqual(h.sent.at(-1),[[3],1000],'parked at the zero level');
  assert.equal(h.store['atlas.esccal.pending.v1'],undefined);assert.equal(h.qs.esc.phase,'done');assert.match(h.qs.esc.message,/Ручной режим выключен/);assert.equal(h.qs.esc.timer,null);
 }
 // -- a reversed aircraft: the zero level is what the controller really outputs (the screenshot: reversed, Position 1900)
 {
  const h=harness({params:P({...base,SERVO3_MIN:1000,SERVO3_TRIM:1000,SERVO3_MAX:1900,SERVO3_REVERSED:1})});h.show();h.servo(0,0,1900);
  h.qs.esc.ack1=h.qs.esc.ack2=true;h.updateEscPanel();h.ui().startButton.fire('click');await tick();
  assert.deepEqual(h.sent[0],[[3],1900],'measured 1900: that is the zero level');assert.match(h.ui().full.textContent,/Полный газ · 1000/);
  const unmeasured=harness({params:P({...base,SERVO3_REVERSED:1})});unmeasured.show();unmeasured.qs.esc.ack1=unmeasured.qs.esc.ack2=true;unmeasured.updateEscPanel();unmeasured.ui().startButton.fire('click');await tick();
  assert.deepEqual(unmeasured.sent[0],[[3],2000],'without telemetry a reversed output starts at the high end');
 }
 // -- failures and interruptions
 {
  const f=harness({failWrite:(channel,updates)=>updates.FUNCTION===0});f.show();f.qs.esc.ack1=f.qs.esc.ack2=true;f.updateEscPanel();f.ui().startButton.fire('click');await tick();
  assert.equal(f.qs.esc.phase,'idle');assert.equal(f.sent.length,0,'no signal was sent');assert.equal(f.ui().error.hidden,false);
  const r=harness({params:P({...base,SERVO3_FUNCTION:0})});r.store['atlas.esccal.pending.v1']=JSON.stringify({v:1,outputs:[{channel:3,func:70}],at:1});
  const pending=core.escPendingChannels(JSON.parse(r.store['atlas.esccal.pending.v1']),r.params);assert.equal(pending.length,1);
  r.renderEscCalibration(r.box,null,pending);assert.equal(r.ui().pending.children.length,2,'a warning and a restore button');assert.equal(r.ui().start.hidden,true,'manual mode cannot start while an output is not restored');
  await r.escRestorePending(pending);assert.deepEqual(r.writes,[[3,{FUNCTION:70}]]);assert.equal(r.store['atlas.esccal.pending.v1'],undefined);
  const n=harness();n.show();n.qs.esc.ack1=n.qs.esc.ack2=true;n.live.armed=true;n.updateEscPanel();assert.equal(n.ui().startButton.disabled,true,'armed: the Start button is disabled');
  await n.escStart();assert.equal(n.writes.length,0);assert.equal(n.confirms.length,0);
  // digital output: no manual signal even if the panel is open
  const d=harness({params:P({...base,SERVO_BLH_MASK:4,SERVO_BLH_OTYPE:6})});d.show();d.qs.esc.ack1=d.qs.esc.ack2=true;d.updateEscPanel();assert.equal(d.ui().startButton.disabled,true);assert.match(d.ui().why.textContent,/цифровому протоколу/);
  // outputs that cannot share one signal
  const m=harness({params:P({...base,SERVO4_FUNCTION:73,SERVO4_MIN:1100,SERVO4_TRIM:1100,SERVO4_MAX:1900,SERVO4_REVERSED:0})});m.show();m.qs.esc.ack1=m.qs.esc.ack2=true;m.updateEscPanel();
  assert.equal(m.ui().table.children.length,2,'a row for each throttle output');assert.equal(m.ui().startButton.disabled,true);assert.match(m.ui().why.textContent,/разные Min/);
 }
 // -- the standalone tab in the sidebar group "Calibration of the flight controller": same panel, same session, no wizard checkbox
 {
  const tab=harness();tab.renderEscTab();
  assert.ok(tab.host.children.includes(tab.qs.esc.node),'the tab shows the table');assert.equal(tab.host.children.some(c=>c.className==='qs-check'),false,'no wizard confirmation checkbox');assert.equal(tab.host.children.some(c=>c.tag==='heading'),false);
  assert.equal(tab.badge.textContent,'DISARMED · USB');
  const wizardBox=makeEl('div');tab.renderEsc(wizardBox,false);assert.ok(wizardBox.children.some(c=>c.className==='qs-check'),'the wizard step keeps its confirmation checkbox');
  tab.live.armed=true;tab.renderEscTab();assert.equal(tab.badge.textContent,'LINK');
  // the reported failure: a controller without SERVO_BLH_* parameters used to get "UNKNOWN" and no tool at all
  const noBlh=harness({params:P({SERVO3_FUNCTION:70,SERVO3_MIN:1000,SERVO3_TRIM:1000,SERVO3_MAX:1900,SERVO3_REVERSED:0})});noBlh.renderEscTab();
  assert.ok(noBlh.qs.esc.node,'without SERVO_BLH_* parameters the table and the manual mode are still offered');assert.ok(noBlh.row(3));
  const dshot=harness({params:P({...base,SERVO_BLH_MASK:4,SERVO_BLH_OTYPE:6})});dshot.renderEscTab();assert.equal(dshot.qs.esc.node,null,'DShot: no table');
  const off=harness({params:P({})});off.renderEscTab();assert.equal(off.qs.esc.node,null,'no parameters: no panel');
  const run=harness();run.renderEscTab();run.servo(1000);run.qs.esc.ack1=run.qs.esc.ack2=true;run.updateEscPanel();run.ui().startButton.fire('click');await tick();
  assert.equal(run.qs.esc.phase,'active');assert.equal(run.badge.textContent,'CALIBRATING');
  const node=run.qs.esc.node,rebuilt=run.replaced();run.renderEscTab();run.renderEscTab();assert.equal(run.qs.esc.node,node);assert.equal(run.replaced(),rebuilt,'the running panel is not rebuilt');
  run.winHandlers['atlas:navigate']({detail:{tab:'basic'}});await wait();assert.deepEqual(run.navigations,['esccal'],'leaving to another tab bounces back');assert.match(run.qs.esc.error,/Ручной режим ESC включён/);
  run.navigations.length=0;run.winHandlers['atlas:navigate']({detail:{tab:'esccal'}});await wait();assert.deepEqual(run.navigations,[]);
  run.qs.step=7;run.winHandlers['atlas:navigate']({detail:{tab:'quicksetup'}});await wait();assert.deepEqual(run.navigations,[],'the wizard ESC step may continue the session');
  run.qs.step=3;run.winHandlers['atlas:navigate']({detail:{tab:'quicksetup'}});await wait();assert.deepEqual(run.navigations,['esccal']);
  let prevented=0;run.winHandlers.beforeunload({preventDefault(){prevented++;}});assert.equal(prevented,1);
  const idle=harness();let prevented2=0;idle.winHandlers.beforeunload({preventDefault(){prevented2++;}});assert.equal(prevented2,0);
  // wiring: sidebar entry, panel, tab whitelists, request of the output telemetry
  const html=read('../configurator.html'),cfgText=read('../js/configurator/configurator.js'),calibration=read('../js/configurator/calibration.js');
  const group=html.slice(html.indexOf('data-t="calgroup"'),html.indexOf('cc-osd-menu'));
  assert.match(group,/data-tab="esccal"[^>]*>[^]*?data-qs-t="escCalNav"/);assert.ok(group.indexOf('data-tab="servos"')<group.indexOf('data-tab="esccal"')&&group.indexOf('data-tab="esccal"')<group.indexOf('data-tab="battery"'));
  assert.match(html,/<section class="cc-tab" data-panel="esccal"[^>]*>[^]*?id="escCalContent"[^]*?<\/section>/);
  assert.equal((cfgText.match(/'servos','esccal','battery'/g)||[]).length,3);assert.ok(cfgText.includes("['servos','esccal','osd'"));
  assert.match(calibration,/\[\[36,200000\]/,'the output telemetry (SERVO_OUTPUT_RAW) is requested on connect');
  assert.match(wizard,/if\(escTabActive\)renderEscTab\(\)/);
 }
 console.log('PASS: ESC calibration as a servo-output table: live Min/Trim/Max/Reverse, real Position from MAVLink 2 telemetry, confirmed manual signal, restore on failure / interruption, standalone sidebar tab.');
})().catch(error=>{console.error(error);process.exit(1);});
