/* Demo dashboard arming status regression.
 * Only the rendered status is simulated: the underlying MAVLink ARM state and write guards
 * must remain fully independent of the visual demo. */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const src=fs.readFileSync('configurator.js','utf8');
const first=src.indexOf('function updateTelemetryUI(){');
const last=src.indexOf('function enterDemo(){',first);
assert.ok(first>=0&&last>first,'telemetry dashboard function not found');
const fn=src.slice(first,last);
for(const key of ['ru','uk','en'])assert.match(src,new RegExp("simArmed:'ARMED / SIM'"),'simulated ARM label must be supplied');
assert.ok(src.includes('state.demo?tr(\'simArmed\')'),'demo should show explicitly simulated ARMED state');
assert.ok(src.includes('!state.demo')||src.includes("state.connected&&!state.demo"),'demo must not be allowed to write settings');
assert.match(src,/state\.armed=null;/,'demo should not forge real MAVLink ARM state');
function display(state,live){
 const elements={};
 const tr=key=>({simArmed:'ARMED / SIM',armed:'ARMED — WRITE LOCKED',disarmed:'DISARMED',unknown:'UNKNOWN',simulation:'SIM / NOT LIVE FLIGHT'})[key]||key;
 const context={
   state,heartbeatLive:()=>live,
   $:id=>(elements[id]??=( {style:{},textContent:'',innerHTML:'',title:''} )),
   tr,cleanNum:(v,p)=>Number(v).toFixed(p),modes:{},
   renderAhrsFilter:()=>{},Number,Math
 };
 vm.runInNewContext(fn+'\nupdateTelemetryUI();',context,{filename:'configurator-dashboard-arm.js'});
 return elements;
}
const telemetry={roll:18.6,pitch:2.3,yaw:323.6,airspeed:81,altitude:161,throttle:80,voltage:23.26};
const demo={demo:true,connected:false,armed:null,sysid:null,mode:null,lastVfr:0,telemetry};
const simulated=display(demo,false);
assert.equal(simulated.armedState.textContent,'ARMED / SIM');
assert.equal(simulated.armedState.title,'SIM / NOT LIVE FLIGHT');
assert.equal(demo.armed,null,'display must not update real armed state');
assert.equal(simulated.flightMode.textContent,'FBWA / SIM');
const stopped=display({...demo,demo:false,armed:false},true);
assert.equal(stopped.armedState.textContent,'DISARMED','real disarmed state must be shown unchanged');
const running=display({...demo,demo:false,armed:true},true);
assert.equal(running.armedState.textContent,'ARMED — WRITE LOCKED','real armed state must be shown unchanged');
const timeout=display({...demo,demo:false,armed:true},false);
assert.equal(timeout.armedState.textContent,'UNKNOWN','lost MAVLink must not fabricate live ARM state');
console.log('PASS: synthetic flight is ARMED / SIM, while live ARM, DISARM, heartbeat loss and write guards remain unchanged.');
