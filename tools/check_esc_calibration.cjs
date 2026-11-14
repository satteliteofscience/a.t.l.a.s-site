/* ESC calibration of a plain PWM regulator in Quick Setup: pure helpers, the safety order of the writes and the whole flow on a fake controller. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('../js/configurator/quick-setup-core.js');
const read=p=>fs.readFileSync(require.resolve(p),'utf8').replace(/\r\n/g,'\n');
const wizard=read('../js/configurator/quick-setup.js'),cfg=read('../js/configurator/configurator.js');

// ---- pure helpers
assert.deepEqual(core.ESC_PWM_LIMITS,{min:1000,max:2200});
for(const [min,max,ok] of [[1000,2000,true],[1000,2200,true],[1100,2200,true],[1000,1100,true],[999,2000,false],[1000,2201,false],[1000,1099,false],[1500,1500,false],[1000.5,2000,false],[NaN,2000,false]])assert.equal(!core.validateEscRange(min,max).error,ok,`${min}-${max}`);
assert.equal(core.escPwm(0,1000,2000,0),1000);assert.equal(core.escPwm(100,1000,2000,0),2000);assert.equal(core.escPwm(50,1000,2000,0),1500);
assert.equal(core.escPwm(0,1000,2000,1),2000,'reversed: zero throttle is the upper end');assert.equal(core.escPwm(100,1000,2000,1),1000,'reversed: full throttle is the lower end');
assert.equal(core.escPwm(100,1000,2200,0),2200);assert.equal(core.escPwm(-5,1000,2000,0),1000);assert.equal(core.escPwm(150,1000,2000,0),2000);assert.equal(core.escPwm(50,2000,1000,0),null);
const P=entries=>new Map(Object.entries(entries).map(([k,v])=>[k,{value:v,type:9}]));
const base={SERVO3_FUNCTION:70,SERVO3_MIN:1000,SERVO3_TRIM:1500,SERVO3_MAX:2000,SERVO3_REVERSED:0,SERVO_BLH_MASK:0,SERVO_BLH_OTYPE:0};
let plan=core.escCalibrationPlan(P(base),[3]);
assert.deepEqual(plan.range,{min:1000,max:2000});assert.equal(plan.reversed,0);assert.deepEqual(plan.outputs,[{channel:3,func:70,min:1000,trim:1500,max:2000,reversed:0}]);
plan=core.escCalibrationPlan(P({...base,SERVO3_MIN:800,SERVO3_MAX:2500,SERVO3_REVERSED:1}),[3]);assert.deepEqual(plan.range,{min:1000,max:2200},'the start range is clamped to 1000-2200');assert.equal(plan.reversed,1);
assert.equal(core.escCalibrationPlan(P({...base,SERVO3_FUNCTION:4}),[3]).error,'function','only throttle outputs are taken over');
assert.equal(core.escCalibrationPlan(P({...base,SERVO3_FUNCTION:0}),[3]).error,'function','an output that is already Disabled is not taken over');
assert.equal(core.escCalibrationPlan(P({SERVO3_FUNCTION:70}),[3]).error,'missing');assert.equal(core.escCalibrationPlan(P(base),[]).error,'none');
assert.deepEqual(core.escFinalWrites({trim:1500},{min:1000,max:2000},0),{MIN:1000,TRIM:1500,MAX:2000,REVERSED:0});
assert.deepEqual(core.escFinalWrites({trim:1500},{min:1600,max:2200},1),{MIN:1600,TRIM:1600,MAX:2200,REVERSED:1},'TRIM is pulled into the new range');
const record={v:1,outputs:[{channel:3,func:70},{channel:4,func:73}],at:1};
assert.deepEqual(core.escPendingChannels(record,P({SERVO3_FUNCTION:0,SERVO4_FUNCTION:73})),[{channel:3,func:70}]);
assert.deepEqual(core.escPendingChannels(record,P({SERVO3_FUNCTION:70,SERVO4_FUNCTION:73})),[]);
assert.deepEqual(core.escPendingChannels({v:2,outputs:record.outputs},P({SERVO3_FUNCTION:0})),[]);assert.deepEqual(core.escPendingChannels(null,P({})),[]);
assert.deepEqual(core.escPendingChannels({v:1,outputs:[{channel:3,func:4}]},P({SERVO3_FUNCTION:0})),[],'only a throttle function may be restored');

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
const apply=fn('escApply');
assert.ok(apply.indexOf('escFinalWrites')<apply.indexOf('escRestore(e.outputs)'),'the throttle function is given back after the range was written');
assert.ok(apply.indexOf('sendEscCalibrationPwm')<apply.indexOf('escFinalWrites'),'the ESC is parked at zero before the parameters change');
const sendCalls=[...wizard.matchAll(/api\.sendEscCalibrationPwm\(/g)].map(m=>wizard.lastIndexOf('async function ',m.index));
assert.ok(sendCalls.length>=3&&sendCalls.every(i=>/async function esc(Send|Apply|Cancel)\(/.test(wizard.slice(i,i+40))),'PWM is only sent from the calibration functions');
assert.match(wizard,/if\(qs\.esc\.phase==='active'&&index!==7\)/,'the step cannot be left while the outputs are taken over');
assert.match(wizard,/qs\.esc\.phase==='active'\|\|qs\.esc\.writing\|\|qs\.esc\.pending\.length>0\)\)return false/,'Next stays disabled while a calibration runs or an output is not restored');
assert.match(wizard,/qs\.esc\.node&&qs\.esc\.lang===lang\(\)&&\$\('qsContent'\)\?\.contains\(qs\.esc\.node\)/,'the running panel survives re-renders');
for(const lang of ['ru','uk','en']){
 const block=wizard.slice(wizard.indexOf(`\n ${lang}:{escCalTitle`),wizard.indexOf('\n',wizard.indexOf(`\n ${lang}:{escCalTitle`)+1));
 assert.ok(block.length>0,lang);
}
for(const key of ['escCalTitle','escCalIntro','escCalSteps','escCalAck1','escCalAck2','escCalStart','escCalConfirm','escCalActive','escCalRange','escCalMin','escCalMax','escCalReverse','escCalReverseHint','escCalZero','escCalFull','escCalFullAck','escCalSignal','escCalApply','escCalCancel','escCalApplied','escCalCancelled','escCalPending','escCalRestore','escCalRangeBad','escCalFail'])assert.equal((wizard.match(new RegExp(`\\b${key}:`,'g'))||[]).length,3,key+' in ru, uk and en');

// ---- the whole flow on a fake controller
function makeEl(tag){return {tag,children:[],listeners:{},className:'',textContent:'',hidden:false,disabled:false,checked:false,value:'',type:'',
 append(...k){this.children.push(...k);},replaceChildren(...k){this.children=k;},contains(node){return this.children.includes(node);},addEventListener(n,f){(this.listeners[n]||(this.listeners[n]=[])).push(f);},fire(n){for(const f of this.listeners[n]||[])f({target:this});}};}
const wait=()=>new Promise(resolve=>setTimeout(resolve,25));   // the bounce back is a setTimeout(0)
const plain=value=>JSON.parse(JSON.stringify(value));   // objects made inside the vm context have another prototype
const tick=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
function harness({language='ru',params=P(base),failWrite=null}={}){
 const sent=[],writes=[],timers=[],store={};
 const live={connected:true,demo:false,armed:false,lastHeartbeat:Date.now(),params,paramLoading:false,paramComplete:true,selectedBoard:'matek-h743-wing-v3'};
 const fake={getState:()=>live,canWrite:()=>true,
  writeServoConfig:async(channel,updates)=>{
   if(failWrite&&failWrite(channel,updates))throw Error('PARAM_SET timeout');
   writes.push(plain([channel,updates]));for(const [field,value] of Object.entries(updates))params.set(`SERVO${channel}_${field}`,{value,type:9});},
  sendEscCalibrationPwm:async(channels,pwm)=>{for(const c of channels)if(params.get(`SERVO${c}_FUNCTION`).value!==0)throw Error('not Disabled');sent.push(plain([channels,pwm]));}};
 const host=makeEl('div'),badge=makeEl('span'),winHandlers={},navigations=[];let replaced=0;
 {const original=host.replaceChildren;host.replaceChildren=function(...k){replaced++;return original.apply(this,k);};}
 const confirms=[],renders={count:0};let exposedRef=null;   // render() of the wizard rebuilds the step and so refreshes the panel
 const context={qs:{esc:null},api:fake,core,copy:{ru:{},uk:{},en:{}},lang:()=>language,render:()=>{renders.count++;if(exposedRef)exposedRef.updateEscPanel();},wizardActive:true,
  window:{confirm:text=>{confirms.push(text);return true;},addEventListener(name,fn){winHandlers[name]=fn;}},
  document:{createElement:makeEl,activeElement:null,querySelector:()=>null},
  $:id=>id==='escCalContent'?host:id==='escCalStatusBadge'?badge:null,addHeading(parent,title){parent.append(makeEl('heading'));},addUsbButton(){},complete(){},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},
  setInterval:fn2=>{timers.push(fn2);return timers.length;},clearInterval(){},setTimeout,Date,JSON,Map};   // Map: the wizard checks params instanceof Map, the params come from this realm
 Object.assign(context.qs,{step:7,paramsMode:'keep',fileText:null,previewBoard:null,completed:{},escConfirmed:false});
 context.api.navigate=tab=>navigations.push(tab);
 context.qs.esc={phase:'idle',outputs:[],range:{min:1000,max:2000},reversed:0,percent:0,ack1:false,ack2:false,fullAck:false,writing:false,error:'',message:'',node:null,ui:null,lang:null,result:null,pending:[],pwm:null,servo:[],servoAt:0,timer:null,applied:null};
 const helpers=wizard.slice(wizard.indexOf('function el(tag,cls,text)'),wizard.indexOf('function persist()'));
 const esc=wizard.slice(wizard.indexOf('// ---- ESC calibration of a normal PWM regulator'),wizard.indexOf('function renderEsc(box'));
 const renderBlock=wizard.slice(wizard.indexOf('function renderEsc(box'),wizard.indexOf('async function verifyCompassBatteryResult('));   // the step renderer and the standalone tab
 vm.createContext(context);
 const t="function t(key){return (copy[lang()]||copy.ru)[key]||copy.ru[key]||key;}";
 const exposed=vm.runInContext(`${t}\n${helpers}\n${esc}\n${renderBlock}\n({escStart,escApply,escCancel,escRestorePending,renderEscCalibration,updateEscPanel,escSetRange,escSend,renderEsc,renderEscTab})`,context);
 exposedRef=exposed;
 const box=makeEl('div'),result=core.classifyEscProtocol(params,'matek-h743-wing-v3');
 return {...exposed,qs:context.qs,sent,writes,confirms,store,timers,box,result,params,live,renders,host,badge,winHandlers,navigations,replaced:()=>replaced,show:()=>exposed.renderEscCalibration(box,result,[]),ui:()=>context.qs.esc.ui};
}
(async()=>{
 const h=harness();h.show();let ui=h.ui();
 assert.equal(ui.startButton.disabled,true,'the Start button waits for both confirmations');
 assert.equal(ui.start.hidden,false);assert.equal(ui.live.hidden,true);
 h.qs.esc.ack1=true;h.qs.esc.ack2=true;h.updateEscPanel();assert.equal(ui.startButton.disabled,false);
 ui.startButton.fire('click');await tick();
 assert.match(h.confirms[0],/SERVO3/,'the confirmation names the output');
 assert.deepEqual(h.writes[0],[3,{FUNCTION:0}],'the throttle output is switched to Disabled first');
 assert.deepEqual(JSON.parse(h.store['atlas.esccal.pending.v1']).outputs,[{channel:3,func:70}],'the original function is remembered');
 assert.equal(h.qs.esc.phase,'active');assert.deepEqual(h.sent[0],[[3],1000],'the first signal is the minimum (0 %), never full throttle');
 assert.equal(ui.live.hidden,false);assert.equal(ui.start.hidden,true);assert.equal(ui.full.disabled,true,'full throttle needs its own confirmation');
 assert.equal(h.timers.length,1,'one keep-alive timer');
 // slider, zero / full throttle
 h.qs.esc.fullAck=true;h.updateEscPanel();assert.equal(ui.full.disabled,false);
 ui.full.fire('click');await tick();assert.deepEqual(h.sent.at(-1),[[3],2000]);
 ui.zero.fire('click');await tick();assert.deepEqual(h.sent.at(-1),[[3],1000]);
 ui.slider.value='50';ui.slider.fire('input');await tick();assert.deepEqual(h.sent.at(-1),[[3],1500]);
 // reverse applies at once
 ui.full.fire('click');await tick();ui.reverse.checked=true;ui.reverse.fire('change');await tick();
 assert.equal(h.qs.esc.reversed,1);assert.deepEqual(h.sent.at(-1),[[3],1000],'reversed: full throttle is the low end');
 ui.zero.fire('click');await tick();assert.deepEqual(h.sent.at(-1),[[3],2000],'reversed: zero throttle is the high end');
 // the range can be changed up to 2200 and not outside 1000-2200
 ui.max.value='2200';ui.max.fire('change');await tick();assert.deepEqual(plain(h.qs.esc.range),{min:1000,max:2200});assert.deepEqual(h.sent.at(-1),[[3],2200]);
 const before=h.sent.length;ui.min.value='900';ui.min.fire('change');await tick();assert.deepEqual(plain(h.qs.esc.range),{min:1000,max:2200},'an invalid range is refused');assert.equal(ui.error.hidden,false);assert.equal(h.sent.length,before,'nothing is sent for it');
 ui.min.value='1100';ui.min.fire('change');await tick();assert.deepEqual(plain(h.qs.esc.range),{min:1100,max:2200});
 // apply: park at zero, write MIN / TRIM / MAX / REVERSED, give the throttle function back last, forget the record
 const writesBefore=h.writes.length;ui.apply.fire('click');await tick();
 assert.deepEqual(h.sent.at(-1),[[3],2200],'parked at the zero signal of the new range (reversed: the upper end)');
 assert.deepEqual(h.writes.slice(writesBefore),[[3,{MIN:1100,TRIM:1500,MAX:2200,REVERSED:1}],[3,{FUNCTION:70}]]);
 assert.equal(h.store['atlas.esccal.pending.v1'],undefined,'the restore record is removed once the function is back');
 assert.equal(h.qs.esc.phase,'done');assert.match(h.qs.esc.message,/1100–2200/);assert.equal(h.params.get('SERVO3_FUNCTION').value,70);
 assert.equal(h.qs.esc.timer,null,'the keep-alive timer is stopped');
 // cancel: only the function comes back; range and reverse are untouched
 const c=harness();c.show();c.qs.esc.ack1=c.qs.esc.ack2=true;c.updateEscPanel();c.ui().startButton.fire('click');await tick();
 c.ui().reverse.checked=true;c.ui().reverse.fire('change');await tick();
 const cw=c.writes.length;c.ui().cancel.fire('click');await tick();
 assert.deepEqual(c.writes.slice(cw),[[3,{FUNCTION:70}]],'cancel writes only the throttle function back');
 assert.equal(c.qs.esc.phase,'idle');assert.equal(c.params.get('SERVO3_REVERSED').value,0);assert.equal(c.store['atlas.esccal.pending.v1'],undefined);
 // a start that fails halfway puts the function back
 const f=harness({failWrite:(channel,updates)=>updates.FUNCTION===0});f.show();f.qs.esc.ack1=f.qs.esc.ack2=true;f.updateEscPanel();f.ui().startButton.fire('click');await tick();
 assert.equal(f.qs.esc.phase,'idle');assert.equal(f.sent.length,0,'no signal was sent');assert.equal(f.ui().error.hidden,false);
 // an interrupted calibration (page closed) is restored from the next visit
 const r=harness({params:P({...base,SERVO3_FUNCTION:0})});
 r.store['atlas.esccal.pending.v1']=JSON.stringify({v:1,outputs:[{channel:3,func:70}],at:1});
 const pending=core.escPendingChannels(JSON.parse(r.store['atlas.esccal.pending.v1']),r.params);assert.equal(pending.length,1);
 r.renderEscCalibration(r.box,null,pending);assert.equal(r.ui().pending.children.length,2,'a warning and a restore button');assert.equal(r.ui().start.hidden,true,'a new calibration cannot start while an output is not restored');
 await r.escRestorePending(pending);assert.deepEqual(r.writes,[[3,{FUNCTION:70}]]);assert.equal(r.store['atlas.esccal.pending.v1'],undefined);
 // without a safe link nothing is written
 const n=harness();n.show();n.qs.esc.ack1=n.qs.esc.ack2=true;n.live.armed=true;n.updateEscPanel();assert.equal(n.ui().startButton.disabled,true,'armed: the Start button is disabled');
 await n.escStart();assert.equal(n.writes.length,0);assert.equal(n.confirms.length,0);
 // DShot / other protocols never get the panel (the wizard shows it only for plain PWM); language switch rebuilds the panel
 assert.notEqual(core.classifyEscProtocol(P({...base,SERVO_BLH_MASK:4,SERVO_BLH_OTYPE:6}),'matek-h743-wing-v3').kind,'pwm');
 assert.match(wizard,/if\(result\.kind==='pwm'\|\|qs\.esc\.phase==='done'\)renderEscCalibration\(box,result,\[\]\)/);
 const en=harness({language:'en'});en.show();assert.equal(en.ui().startButton.textContent,'Start calibration');
 // ---- the standalone tab in the sidebar group "Calibration of the flight controller": same panel, same session, no wizard checkbox
 {
  const tab=harness();tab.renderEscTab();
  assert.ok(tab.host.children.includes(tab.qs.esc.node),'the tab shows the calibration panel for a plain PWM output');
  assert.equal(tab.host.children.some(c=>c.className==='qs-check'),false,'the tab has no wizard confirmation checkbox');
  assert.equal(tab.host.children.some(c=>c.tag==='heading'),false,'the tab has its own title, not the wizard heading');
  assert.equal(tab.badge.textContent,'DISARMED · USB');
  const wizardBox=makeEl('div');tab.renderEsc(wizardBox,false);
  assert.ok(wizardBox.children.some(c=>c.className==='qs-check'),'the wizard step keeps its confirmation checkbox');assert.ok(wizardBox.children.some(c=>c.tag==='heading'));
  tab.live.armed=true;tab.renderEscTab();assert.equal(tab.badge.textContent,'LINK','armed: no safe link');
  const dshot=harness({params:P({...base,SERVO_BLH_MASK:4,SERVO_BLH_OTYPE:6})});dshot.renderEscTab();
  assert.equal(dshot.qs.esc.node,null,'DShot: no calibration panel');assert.ok(dshot.host.children.length>=3,'DShot: the protocol and the "no calibration needed" message are shown');
  const off=harness({params:P({})});off.renderEscTab();assert.equal(off.qs.esc.node,null,'no parameters: no panel');
  // a running calibration is not rebuilt on every heartbeat and cannot be left by navigation
  const run=harness();run.renderEscTab();run.qs.esc.ack1=run.qs.esc.ack2=true;run.updateEscPanel();run.ui().startButton.fire('click');await tick();
  assert.equal(run.qs.esc.phase,'active');assert.equal(run.badge.textContent,'CALIBRATING');
  const node=run.qs.esc.node,rebuilt=run.replaced();run.renderEscTab();run.renderEscTab();
  assert.equal(run.qs.esc.node,node);assert.equal(run.replaced(),rebuilt,'the running panel is not rebuilt');
  run.winHandlers['atlas:navigate']({detail:{tab:'basic'}});await wait();
  assert.deepEqual(run.navigations,['esccal'],'leaving to another tab bounces back to the calibration');assert.match(run.qs.esc.error,/Калибровка ESC идёт/);
  run.navigations.length=0;run.winHandlers['atlas:navigate']({detail:{tab:'esccal'}});await wait();assert.deepEqual(run.navigations,[]);
  run.qs.step=7;run.winHandlers['atlas:navigate']({detail:{tab:'quicksetup'}});await wait();assert.deepEqual(run.navigations,[],'the wizard ESC step may continue the session');
  run.qs.step=3;run.winHandlers['atlas:navigate']({detail:{tab:'quicksetup'}});await wait();assert.deepEqual(run.navigations,['esccal'],'other wizard steps may not');
  let prevented=0;run.winHandlers.beforeunload({preventDefault(){prevented++;}});assert.equal(prevented,1,'closing the page during a calibration asks first');
  const idle=harness();let prevented2=0;idle.winHandlers.beforeunload({preventDefault(){prevented2++;}});assert.equal(prevented2,0,'no prompt without a calibration');
  // wiring: sidebar entry in the calibration group, the panel, the tab whitelists and the translations
  const html=read('../configurator.html'),cfgText=read('../js/configurator/configurator.js');
  const group=html.slice(html.indexOf('data-t="calgroup"'),html.indexOf('cc-osd-menu'));
  assert.match(group,/data-tab="esccal"[^>]*>[^]*?data-qs-t="escCalNav"/,'the ESC calibration entry is in the "Calibration of the flight controller" group');
  assert.ok(group.indexOf('data-tab="servos"')<group.indexOf('data-tab="esccal"')&&group.indexOf('data-tab="esccal"')<group.indexOf('data-tab="battery"'));
  assert.match(html,/<section class="cc-tab" data-panel="esccal"[^>]*>[^]*?id="escCalContent"[^]*?<\/section>/);
  assert.equal((cfgText.match(/'servos','esccal','battery'/g)||[]).length,3,'navigate, hashchange and first load accept the tab');
  assert.ok(cfgText.includes("['servos','esccal','osd'"),'opening the tab without parameters starts the parameter read');
  for(const key of ['escCalNav','escCalTabTitle','escCalTabIntro'])assert.equal((wizard.match(new RegExp(`\\b${key}:`,'g'))||[]).length,3,key+' in ru, uk and en');
  assert.match(wizard,/if\(escTabActive\)renderEscTab\(\)/,'the tab is drawn when the page opens on it');
 }
 console.log('PASS: ESC PWM calibration: range 1000-2200, live reverse, confirmed take-over of the throttle outputs, restore on cancel / failure / interruption, standalone sidebar tab.');
})().catch(error=>{console.error(error);process.exit(1);});
