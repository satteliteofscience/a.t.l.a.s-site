'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../js/configurator/capri-core.js');
for(const [name,[lo,hi,integer]]of Object.entries(core.specs)){
 assert(core.valid(name,lo));assert(core.valid(name,hi));assert(!core.valid(name,lo-1));assert(!core.valid(name,hi+1));assert(!core.valid(name,NaN));
 if(integer)assert(!core.valid(name,lo+.5));
}
const params=new Map([['ORDER_MODE',{value:2}],['ORDER_REV',{value:2}],['RUD_LIMIT_DEG',{value:30}]]);
const s={connected:true,demo:false,sysid:1,armed:true,mode:5,lastHeartbeat:1000,params,connectionId:1,paramLoading:false};
assert(core.commandAllowed(s,true,1001));
for(const override of [{connected:false},{demo:true},{paramLoading:true}])assert(!core.commandAllowed({...s,...override},true,1001));
assert(!core.commandAllowed(s,true,5000));
assert(core.commandAllowed({...s,armed:false,mode:13},true,1001));
assert(core.commandAllowed({...s,armed:false,mode:13},false,1001));
assert.equal(core.observed(s,{value:1,connectionId:1,at:1000},1001),true);
assert.equal(core.observed(s,{value:0,connectionId:1,at:1000},1001),false);
assert.equal(core.observed(s,{value:1,connectionId:0,at:1000},1001),null);
assert.equal(core.observed(s,{value:1,connectionId:1,at:1000},3600),null);
params.set('ORDER_MODE',{value:1});assert(core.commandAllowed(s,true,1001));
params.delete('ORDER_REV');assert(!core.commandAllowed(s,true,1001));params.set('ORDER_REV',{value:2});
params.set('RUD_LIMIT_DEG',{value:0});assert(!core.commandAllowed(s,true,1001));assert(core.commandAllowed(s,false,1001));
const context={window:{},TextEncoder,TextDecoder,Uint8Array,DataView};vm.runInNewContext(fs.readFileSync(require.resolve('../js/configurator/mavlink.js'),'utf8'),context);
const M=context.window.AtlasMAV;
for(const value of [0,1]){
 const payload=new Uint8Array(16);new DataView(payload.buffer).setFloat32(4,value,true);payload.set(new TextEncoder().encode('ORDER_ON'),8);
 const frame=M.createFrame(251,payload),received=[];new M.Parser(x=>received.push(M.parseMessage(x))).push(frame);
 assert.equal(received.length,1);assert.equal(received[0].name,'ORDER_ON');assert.equal(received[0].value,value);
 frame[frame.length-1]^=1;new M.Parser(()=>assert.fail('Corrupt frame accepted')).push(frame);
}
const metadata=JSON.parse(fs.readFileSync(require.resolve('../data/param-metadata.json'),'utf8')).parameters;
for(const [name,[low,high]]of Object.entries(core.specs)){
 assert.equal(Number(metadata[name].Range.low),low);assert.equal(Number(metadata[name].Range.high),high);
}
// ---- site preset: rudder 30, bank 15, pitch -5..+5, activation by a two-position switch on channel 13 (ORDER_MODE=1)
assert.deepEqual(Object.fromEntries(core.PRESET),{RUD_LIMIT_DEG:30,ORDER_RLL_LIM:15,ORDER_PIT_MIN:-5,ORDER_PIT_MAX:5,ORDER_RC_CH:13,ORDER_MODE:1});
for(const [name,value]of core.PRESET)assert(core.valid(name,value),name);
// the limits and the channel go first, ORDER_MODE last: an interrupted write never leaves the protocol armed without its limits
assert.deepEqual(core.PRESET.map(x=>x[0]).slice(-2),['ORDER_RC_CH','ORDER_MODE']);
const P=obj=>new Map(Object.entries(obj).map(([k,v])=>[k,{value:v}]));
const zero={ORDER_REV:2,RUD_LIMIT_DEG:0,ORDER_RLL_LIM:0,ORDER_PIT_MIN:0,ORDER_PIT_MAX:0,ORDER_RC_CH:0,ORDER_MODE:0};
assert.equal(core.presetStatus(P(zero)).state,'partial');
assert.deepEqual(Object.keys(core.presetUpdates(P(zero))),['RUD_LIMIT_DEG','ORDER_RLL_LIM','ORDER_PIT_MIN','ORDER_PIT_MAX','ORDER_RC_CH','ORDER_MODE']);
const applied={...zero,...Object.fromEntries(core.PRESET)};
assert.equal(core.presetStatus(P(applied)).state,'active');assert.deepEqual(core.presetUpdates(P(applied)),{});
assert.equal(core.presetStatus(P({...applied,ORDER_REV:1})).state,'unsupported');
assert.equal(core.presetStatus(P({ORDER_REV:2,ORDER_MODE:0})).state,'unsupported');
assert.deepEqual(core.presetUpdates(P({...applied,ORDER_MODE:2,ORDER_RC_CH:0})),{ORDER_RC_CH:13,ORDER_MODE:1});
const sm=core.summary(P({...applied,ROLL_LIMIT_DEG:45,STALL_PREVENTION:1}));
assert.deepEqual([sm.mode,sm.channel,sm.roll,sm.rudder,sm.bankTotal,sm.pitchMin,sm.pitchMax],[1,13,15,30,45,-5,5]);
assert.equal(core.summary(P(zero)).bankTotal,null);
assert.equal(core.summary(P({...zero,RUD_LIMIT_DEG:20,ROLL_LIMIT_DEG:45})).bankTotal,65);
assert.equal(core.summary(P({...zero,RUD_LIMIT_DEG:45,ROLL_LIMIT_DEG:60})).bankTotal,85);
// ---- configurator wiring: the writer accepts only the six preset parameters with exactly the preset values, DISARMED only, one acknowledged write at a time
const read=p=>fs.readFileSync(require.resolve(p),'utf8').replace(/\r\n/g,'\n'),cfg=read('../js/configurator/configurator.js'),uiSource=read('../js/configurator/capri-ui.js');
assert.match(cfg,/writeOrderPreset:async/);assert.match(cfg,/for\(const \[name,wanted\] of core\.PRESET\)/);assert.match(cfg,/updates\[name\]!==wanted/);
assert.match(cfg,/Invalid O\.R\.D\.E\.R\. preset parameter/);assert.match(cfg,/ORDER_REV'\)\?\.value>=2/);
const writer=cfg.slice(cfg.indexOf('writeOrderPreset:async'),cfg.indexOf('sendServoPwm:async'));
assert.match(writer,/!canWrite\(\)/);assert.match(writer,/writeParameterWithAck\(change\.name,change\.value,change\.type\)/);assert.doesNotMatch(writer,/orderActivation|true\)/);
for(const lang of ['ru','uk','en']){
 const block=uiSource.slice(uiSource.indexOf(`Object.assign(words.${lang},{\n preset:`),uiSource.indexOf('});',uiSource.indexOf(`Object.assign(words.${lang},{\n preset:`)));
 assert.ok(block.length>500,lang+' preset words');
 for(const key of ['preset','presetConfirm','presetWritten','howTitle','noticePreset','noticeAlways','howSwitch','howSwitchHigh','howAlways','howWhere','howRoll','howRudder','howPitchBoth','howSignal','howLimit'])assert.ok(new RegExp(`\\b${key}:'`).test(block),`${lang}: ${key}`);
}
// ---- behaviour of the card: the preset click confirms the full diff, writes it, then explains what the saved configuration does
function runCard(language,initial,{confirm=true}={}){
 const els=new Map(),make=()=>({children:[],dataset:{},hidden:false,disabled:false,textContent:'',className:'',open:false,append(...k){this.children.push(...k);},prepend(...k){this.children.unshift(...k);},replaceChildren(...k){this.children=k;}});
 const byId=id=>{if(!els.has(id))els.set(id,make());return els.get(id);};
 const params=P(initial),calls=[],confirms=[],handlers={};
 const api={getState:()=>({connected:true,demo:false,sysid:1,compid:1,armed:false,lastHeartbeat:Date.now(),lastAttitude:Date.now(),params,telemetry:{roll:0,pitch:0},connectionId:1,paramLoading:false}),
  canWrite:()=>true,navigateOrder(){},orderCommand:async enable=>{params.set('ORDER_MODE',{value:enable?2:0});},
  writeOrderPreset:async(updates,cb)=>{calls.push(updates);let n=0;for(const[k,v]of Object.entries(updates)){cb({done:n,total:Object.keys(updates).length,name:k});params.set(k,{value:v});n++;}return{done:n,total:n};}};
 const window={AtlasCC:api,AtlasOrderCore:core,AtlasLanguage:()=>language,addEventListener:(e,f)=>{handlers[e]=f;},confirm:text=>{confirms.push(text);return confirm;}};
 const document={createElement:()=>make(),getElementById:byId,querySelector:()=>make(),hidden:false};
 vm.runInNewContext(fs.readFileSync(require.resolve('../js/configurator/capri-ui.js'),'utf8'),{window,document,setInterval:()=>1,clearInterval(){},Date,Math,JSON,Number,Object,String,Error,Promise});
 return {byId,calls,confirms,params,lines:()=>byId('orderHowList').children.map(x=>x.textContent)};
}
(async()=>{
 const card=runCard('ru',{...zero,ROLL_LIMIT_DEG:45,STALL_PREVENTION:1});
 assert.equal(card.byId('orderPreset').disabled,false,'the preset button is enabled while DISARMED with the preset not applied');
 assert.equal(card.byId('orderNotice').hidden,true,'no "done" notice before anything was written');
 await card.byId('orderPreset').onclick();
 assert.equal(card.confirms.length,1);for(const line of ['RUD_LIMIT_DEG: 0 → 30','ORDER_RLL_LIM: 0 → 15','ORDER_PIT_MIN: 0 → -5','ORDER_PIT_MAX: 0 → 5','ORDER_RC_CH: 0 → 13','ORDER_MODE: 0 → 1'])assert.ok(card.confirms[0].includes(line),'confirm shows '+line);
 assert.deepEqual(Object.keys(card.calls[0]),['RUD_LIMIT_DEG','ORDER_RLL_LIM','ORDER_PIT_MIN','ORDER_PIT_MAX','ORDER_RC_CH','ORDER_MODE']);
 assert.equal(card.byId('orderNotice').hidden,false,'the user is told what was done');assert.match(card.byId('orderNotice').textContent,/настроен по пресету/);
 const text=card.lines().join('\n');
 assert.equal(card.lines().length,7,'switch, where, bank, rudder, pitch, confirmation, limits');
 assert.match(text,/канале 13/);assert.match(text,/≥1750 µs/);assert.match(text,/цифровой связи/);assert.match(text,/ARMED/);assert.match(text,/крена 15° вместо ROLL_LIMIT_DEG \(45°\)/);assert.match(text,/до 30° крена[^.]*всего до 45°/);assert.match(text,/от −?5° до \+5°|от -5° до \+5°/);assert.match(text,/ACTIVATED/);assert.match(text,/не защита от сваливания/);
 assert.equal(card.byId('orderPreset').disabled,true,'applied preset: nothing left to write');assert.match(card.byId('orderPresetState').textContent,/Пресет применён/);
 const declined=runCard('ru',zero,{confirm:false});await declined.byId('orderPreset').onclick();assert.equal(declined.calls.length,0,'a declined confirmation writes nothing');
 const en=runCard('en',{...zero,ROLL_LIMIT_DEG:45});await en.byId('orderPreset').onclick();assert.match(en.byId('orderNotice').textContent,/configured with the preset/);assert.match(en.lines().join('\n'),/channel 13/);
 const uk=runCard('uk',{...zero,ROLL_LIMIT_DEG:45});await uk.byId('orderPreset').onclick();assert.match(uk.lines().join('\n'),/каналі 13/);
 // the explanation also follows a saved configuration that was not written by the preset (always-on mode, rudder only)
 const always=runCard('ru',{...zero,ORDER_MODE:2,RUD_LIMIT_DEG:20,ROLL_LIMIT_DEG:45});
 assert.match(always.lines().join('\n'),/без тумблера/);assert.match(always.lines().join('\n'),/не заменяется/);assert.match(always.lines().join('\n'),/Тангаж: не ограничивается/);
 const off=runCard('ru',zero);assert.deepEqual(off.lines(),['Протокол выключен (ORDER_MODE=0): ограничения не действуют.']);
 const old=runCard('ru',{ORDER_MODE:0});assert.equal(old.byId('orderHow').hidden,true,'firmware without interface revision 2: no explanation, no preset');assert.equal(old.byId('orderPreset').disabled,true);
 console.log('PASS: O.R.D.E.R. ranges, command guards, stale/reconnect state, real MAVLink framing, the RC13 preset and its explanation.');
})().catch(error=>{console.error(error);process.exit(1);});
