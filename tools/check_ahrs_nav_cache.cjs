'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const core=require('../js/configurator/ahrs-filter-core.js');
const read=path=>fs.readFileSync(path,'utf8');
function p(...rows){return new Map(rows.map(([name,value])=>[name,{value,type:9,index:0}]));}
(function testAuthoritativeActiveFilter(){
 assert.equal(core.activeFromText('AHRS: EKF3 active'),'EKF3');
 assert.equal(core.activeFromText('AHRS: DCM active'),'DCM');
 assert.equal(core.activeFromText(' AHRS: EKF2 active '),'EKF2');
 assert.equal(core.activeFromText('AHRS: External active'),'EXTERNAL');
 for(const t of ['PreArm: EKF3 configured','AHRS: EKF3 configured','AHRS: EKF3 failed','EKF3 active','AHRS: DCM inactive','noise AHRS: EKF3 active',''])
  assert.equal(core.activeFromText(t),null,'untrusted text must not mark a runtime estimator confirmed: '+t);
 assert.equal(core.activeFromText(null),null);
})();
(function testConfiguredIsNotActive(){
 const selected=p(['AHRS_EKF_USE',1],['AHRS_EKF_TYPE',3]);
 assert.equal(core.configured(selected),'EKF3');
 assert.equal(core.configured(p(['AHRS_EKF_USE',0],['AHRS_EKF_TYPE',3])),'DCM');
 assert.equal(core.configured(p(['AHRS_EKF_TYPE',0])),'DCM');
 assert.equal(core.configured(p(['AHRS_EKF_TYPE',2])),'EKF2');
 assert.equal(core.configured(p(['AHRS_EKF_TYPE',11])),'EXTERNAL');
 assert.equal(core.configured(new Map()),null);
 let state=core.indication({connected:true,live:true,params:selected,language:'ru'});
 assert.equal(state.label,'EKF3 · CFG');
 assert.equal(state.verified,false,'an AHRS parameter is not proof of active EKF3');
 assert.match(state.detail,/параметрах/,'configured AHRS status must identify source');
 assert.doesNotMatch(state.detail,/не подтверждён/,'obsolete long warning removed');
 state=core.indication({connected:true,live:true,announced:'DCM',params:selected});
 assert.equal(state.label,'DCM');
 assert.equal(state.verified,true,'live AHRS: DCM active message overrides EKF3 selection');
 state=core.indication({connected:true,live:true,announced:'EKF3',params:p(['AHRS_EKF_USE',0])});
 assert.equal(state.label,'EKF3');
 assert.equal(state.verified,true,'actual AHRS messages are more authoritative than cached selection');
 state=core.indication({connected:true,live:false,announced:'EKF3',params:selected});
 assert.equal(state.label,'—');
 assert.equal(state.verified,false,'lost heartbeat must suppress even previously confirmed estimator');
 state=core.indication({connected:false,live:false,announced:'EKF3',params:selected});
 assert.equal(state.verified,false);
 state=core.indication({demo:true,connected:false,params:selected});
 assert.equal(state.label,'SIM');assert.equal(state.verified,false);
})();
(function integrationAndPerformance(){
 const js=read('js/configurator/configurator.js'),html=read('configurator.html'),css=read('css/configurator.css');
 const first=js.indexOf('function navigate(tab){'),last=js.indexOf('function heartbeatLive(',first);
 assert.ok(first>=0&&last>first);
 const nav=js.slice(first,last);
 assert.match(nav,/if\(tab==='params'&&previous!=='params'\)\{renderParams\(\);showProgress\(\);\}/,
 'entering the parameter list should immediately show cached values');
 assert.match(nav,/state\.params\.size===0&&!state\.paramTransfer/,
 'navigation should only start an initial read when no cache or prior transfer exists');
 assert.doesNotMatch(nav,/tab==='params'&&previous!=='params'\)\|\|/,
 'ordinary revisit must not trigger another full parameter download');
 assert.match(js,/connected&&state\.transport==='bridge'\?tr\('disconnectTcp'\)/,
 'toolbar button must show Disconnect TCP/UDP for bridge connections');
 assert.match(js,/if\(state\.connected\)\{await disconnect\(\);return;\}/,
 'toolbar button should actually disconnect an active bridge');
 assert.match(js,/updateNetworkLabels\(\);\s*\}/,
 'manual network button should synchronize with main connection state');
 assert.match(js,/activeFilter:null/,'runtime AHRS state must be tracked per connection');
 assert.match(js,/message\.compid===state\.compid[\s\S]{0,220}activeFromText\(entry\.text\)/,
 'only actual FC component status messages should set the active backend');
 assert.match(js,/state\.activeFilter=null;state\.statusTextAssembler\.reset\(\);updateConnectionUI\(\);updateTelemetryUI\(\)/,
 'lost heartbeat must reset estimator confidence');
 assert.match(js,/const info=core\.indication\(/,'AHRS on the dashboard must use provenance-sensitive state');
 assert.doesNotMatch(js,/ctx\.fillText\('EKF3',15,26\)/,
 'the horizon must not paint decorative EKF3 text');
 assert.match(html,/id="ahrsFilterBadge"/,'horizon AHRS badge required');
 assert.match(html,/id="ahrsFilterDetail"/,'show the configured/verified status');
 assert.match(html,/src="js\/configurator\/ahrs-filter-core\.js" defer/,
 'AHRS parser module must be loaded before main code');
 assert.match(css,/\.cc-filter-indicator\[data-verified="true"\]/,
 'confirmed AHRS indication must differ visually from configured-only');
 const update=js.slice(js.indexOf('function updateTelemetryUI(){'),js.indexOf('function enterDemo(){'));
 assert.doesNotMatch(update,/showProgress\(\)/,
 'HUD refresh loop must not rewrite parameter progress each frame');
})();
console.log('PASS: cached parameter list without repeat download, TCP button state, live AHRS/DCM with honest configured-only fallback.');
