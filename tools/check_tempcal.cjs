'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const core=require('../tempcal-core.js');
const read=path=>fs.readFileSync(path,'utf8');
const pm=(...pairs)=>new Map(pairs.map(([name,value])=>[name,{value,type:9}]));
(function sensorDiscoveryAndTemperatureRange(){
 const params=pm(
  ['INS_TCAL1_ENABLE',2],['INS_TCAL1_TMIN',11],['INS_TCAL1_TMAX',58],
  ['INS_TCAL1_ACC1_X',0.000234],['INS_TCAL1_ACC2_X',0.003],['INS_TCAL1_GYR3_Z',-0.003],
  ['INS_ACC1_CALTEMP',38.2],['INS_GYR1_CALTEMP',39.1],
  ['INS_TCAL2_ENABLE',1],['INS_TCAL2_TMIN',12],['INS_TCAL2_TMAX',55],
  ['INS_TCAL2_GYR1_X',-0.003],
  ['INS_ACC2_CALTEMP',-300],['INS_GYR2_CALTEMP',34],
  ['INS_TCAL3_ENABLE',0],
  ['INS4_TCAL_ENABLE',2],['INS4_TCAL_TMIN',5],['INS4_TCAL_TMAX',55]
 );
 const sensors=core.readSensors(params);
 assert.deepEqual(sensors.map(x=>x.index),[1,2,3,4]);
 assert.deepEqual(sensors.map(x=>x.mode),[2,1,0,2]);
 assert.equal(sensors[0].min,11);assert.equal(sensors[0].max,58);
 assert.equal(sensors[0].coefficients.length,3);
 assert.deepEqual(sensors[0].coefficients.map(x=>x.name),['INS_TCAL1_ACC1_X','INS_TCAL1_ACC2_X','INS_TCAL1_GYR3_Z']);
 assert.equal(sensors[0].baseline.accel,38.2);
 assert.equal(sensors[0].baseline.gyro,39.1);
 assert.equal(sensors[0].baselineReady,true);
 assert.equal(sensors[1].baseline.accel,null,'-300 invalid calibration temperature sentinel must not be treated as real');
 assert.equal(sensors[1].baselineReady,false);
 assert.equal(sensors[2].min,null,'missing fields are missing, not synthetic');
 assert.equal(sensors[2].max,null);
 assert.equal(sensors[3].prefix,'INS4_TCAL_');
 assert.equal(core.snapshot(params).length,4);
 assert.equal(core.readSensors(pm(['INS_TCAL1_TMAX',60])).length,0,'no ENABLE means sensor presence is unknown');
})();
(function limitsAndModes(){
 for(const m of [0,1,2])assert.equal(core.validMode(m),true);
 for(const m of [-1,3,2.1,NaN,'2'])assert.equal(core.validMode(m),false);
 assert.equal(core.validateRange(11,58).recommended,true);
 assert.equal(core.validateRange(20,30).ok,true);
 assert.equal(core.validateRange(20,29.99).ok,false);
 assert.equal(core.validateRange(-71,60).ok,false);
 assert.equal(core.validateRange(5,81).ok,false);
 assert.equal(core.validateRange(NaN,25).ok,false);
})();
(function uiWiring(){
 const html=read('configurator.html'),cfg=read('configurator.js'),ui=read('tempcal-ui.js'),wizard=read('quick-setup.js'),workflow=read('.github/workflows/website-support-check.yml');
 assert.match(html,/CONTROL CENTER <b>RELEASE 1\.0<\/b>/,'configurator header must display Release 1.0');
 assert.doesNotMatch(html,/<b>0\.7\.1/,'deprecated version not allowed');
 assert.match(html,/data-tab="temperature"/,'dedicated temperature tab missing from sidebar');
 assert.match(html,/data-panel="temperature"/,'temperature workspace panel missing');
 assert.match(cfg,/'battery','compass','temperature','osd'/,'temperature route missing');
 assert.match(cfg,/if\(first\).*startParamLoad\(\)/s,'full parameter download must automatically start after first MAVLink heartbeat');
 assert.match(ui,/window\.addEventListener\('atlas:parameters'/,'temperature data must refresh after receiving PARAM_VALUE list');
 assert.match(ui,/window\.addEventListener\('atlas:state'/,'connection changes must refresh INS controls');
 assert.match(ui,/window\.AtlasTempCal=Object\.freeze\(\{mount,report,refresh:refreshParameters\}\)/,'INS module API required');
 assert.match(ui,/writeAdvancedParams\(\{\[sensor\.enableName\]:mode\}\)/,'mode must be written through central ACK writer');
 assert.match(ui,/if\(mode===2\)/,'learning mode must trigger reread');
 assert.match(ui,/await refreshParameters\(true,2\)/,'learning mode must automatically reread complete parameters twice');
 assert.match(ui,/writeAdvancedParams\(\{\[sensor\.minName\]:min,\[sensor\.maxName\]:max\}\)/,'temperature limits must be written through ACK');
 assert.match(ui,/startedLearning.*Map/,'learning state must track earlier session');
 assert.match(ui,/sawDisconnect/,'post-training state cannot be inferred without observing a reconnect');
 assert.match(ui,/sensor\.coefficients/,'coefficients must be displayed from FC not invented');
 assert.match(ui,/sensor\.baseline/,'CALTEMP parameters must be displayed');
 assert.match(wizard,/stepTemp/,'Quick Setup temperature step must exist');
 assert.match(wizard,/else if\(qs\.step===9\)renderTemperature\(box\)/,'temperature step 10 must precede final');
 assert.match(wizard,/qs\.step===10/,'final step must become 11');
 assert.match(workflow,/check_tempcal\.cjs/,'CI must execute temperature regression suite');
})();
console.log('PASS: INS 0/1/2 modes, temperature ranges, polynomial coefficients, baseline calibration, Quick Setup 11 stages and auto reread.');
