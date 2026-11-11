'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const ctx={window:{},TextEncoder,TextDecoder,Uint8Array,DataView,console};
vm.runInNewContext(read('mavlink.js'),ctx,{filename:'mavlink.js'});
const M=ctx.window.AtlasMAV;
const mkHeartbeat=(sysid,vehicleType=1,compid=1)=>{
 const payload=new Uint8Array(9);
 payload[4]=vehicleType;payload[5]=3;payload[6]=0;payload[7]=4;payload[8]=3;
 const frame={sysid,compid,id:0,payload};
 return [frame,M.parseMessage(frame)];
};
(function mixedSystemProtection(){
 const [own,decoded]=mkHeartbeat(42);
 assert.equal(M.belongsToSelectedVehicle(own,decoded,null),true,'first real FC heartbeat may claim a session');
 assert.equal(M.belongsToSelectedVehicle(own,decoded,42),true,'same FC may keep the session alive');
 assert.equal(M.belongsToSelectedVehicle(own,decoded,43),false,'another FC cannot steal an existing session');
 const [other,otherData]=mkHeartbeat(43);
 assert.equal(M.belongsToSelectedVehicle(other,otherData,42),false,'second autopilot cannot overwrite selected sysid');
 const [gcs,gcsData]=mkHeartbeat(255,6,1);
 assert.equal(M.belongsToSelectedVehicle(gcs,gcsData,null),false,'GCS heartbeat must not claim the autopilot session');
 const [nonAutopilot,nonAutoData]=mkHeartbeat(42,1,190);
 assert.equal(M.belongsToSelectedVehicle(nonAutopilot,nonAutoData,null),false,'non-autopilot compid must not become selected FC');
 for(const type of ['attitude','sys','vfr','param','ack','command_long','mag_report','mag_progress']){
  assert.equal(M.belongsToSelectedVehicle({sysid:43,compid:1},{type},42),false,'other SYSID '+type+' must not enter dashboard/calibration/write ACK');
  assert.equal(M.belongsToSelectedVehicle({sysid:42,compid:1},{type},42),true,'same FC '+type+' should pass');
  assert.equal(M.belongsToSelectedVehicle({sysid:42,compid:1},{type},null),false,'ignore '+type+' until first FC heartbeat');
 }
})();
(function handlerGuards(){
 const cfg=read('configurator.js'),wizard=read('quick-setup.js'),temp=read('tempcal-ui.js');
 assert.match(cfg,/if\(!data\|\|!M\.belongsToSelectedVehicle\(message,data,state\.sysid\)\)return/,'FC identity must be enforced before processing any parsed message');
 assert.match(cfg,/function heartbeatLive\(now=Date\.now\(\)\)/,'fresh heartbeat gate must exist');
 assert.match(cfg,/const t=state\.demo\|\|heartbeatLive\(\)\?state\.telemetry/,'old dashboard telemetry must not be displayed as live');
 assert.match(cfg,/if\(state\.sysid!==null&&!heartbeatLive\(\)&&!state\.heartbeatStale\)/,'heartbeat loss must be detected only once per outage');
 assert.match(cfg,/else if\(recovered\)\{updateConnectionUI\(\);updateTelemetryUI\(\);/,'heartbeat recovery must restore UI status');
 assert.match(cfg,/WebSocket bridge handshake timed out \(12 s\)/,'network handshake must have a bounded timeout');
 assert.match(cfg,/if\(state\.connecting\|\|closingConnection\)return;if\(state\.connected\)/,'USB must wait for another connect or teardown');
 assert.match(wizard,/let wizardActive=/,'Quick Setup should track whether its panel is visible');
 assert.match(wizard,/if\(!wizardActive\|\|\[4,5\]\.includes\(qs\.step\)\)return/,'inactive wizard must not rerender for streamed parameters');
 assert.match(wizard,/if\(qs\.step===8\)\{reconcileCompass\(\);return;\}/,'compass packets use bounded recovery instead of rebuilding the form');
 assert.match(wizard,/if\(wizardActive&&qs\.step===8\)render\(\)/,'background compass readback must not move the visible calibration widget');
 assert.match(wizard,/if\(qs\.step===9\)/,'INS temperature stage remains present');
 assert.match(wizard,/if\(\(ready&&!embedded\)\|\|\(!ready&&embedded\)\)render\(\)/,'INS form should not be rebuilt on every packet');
 assert.match(temp,/for\(const old of roots\)if\(!old\.isConnected\)roots\.delete\(old\)/,'detached INS editor instances must be discarded');
 assert.match(temp,/if\(current\)\{/,'reuse an already-mounted INS editor');
})();
(function documentedHardwareScope(){
 const readme=read('README.md'),about=read('GITHUB-ABOUT.md');
 const home=read('index.html'),config=read('configurator.html'),meta=read('page-meta.js');
 assert.match(readme,/bench-tested A\.T\.L\.A\.S\. Control Center on a real flight controller/,'README should document actual device validation');
 assert.match(readme,/UDP\/TCP bridge.*analog multimeter.*INS temperature-learning/,'README must not claim unverified hardware features are fully proven');
 assert.match(about,/hardware-tested browser configurator/,'repository About suggestion must mention real-device testing');
 assert.match(home,/прошёл стендовую проверку на реальном полётном контроллере/,'landing page must mention hardware check');
 assert.match(config,/<meta name="description" content="A\.T\.L\.A\.S\. — конфигуратор \d+\.\d+: USB\/MAVLink/,'configurator metadata should identify the current version without claiming every new flow is hardware-tested');
 assert.match(meta,/browser configurator bench-tested with a real flight controller/,'English metadata should acknowledge hardware test');
})();
console.log('PASS: mixed-vehicle SYSID isolation, telemetry freshness and network timeout, hidden-wizard/INS optimization, honest real-hardware test scope');
