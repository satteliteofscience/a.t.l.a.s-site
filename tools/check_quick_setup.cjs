'use strict';
const assert=require('node:assert/strict');
const core=require('../quick-setup-core.js');
// Parameter recovery must distinguish saving, rebooting, and merely reconnecting.
(function testCompassRecovery(){
 const now=Date.now(),values={COMPASS_USE:1,COMPASS_DEV_ID:123,COMPASS_OFS_X:10,COMPASS_OFS_Y:20,COMPASS_OFS_Z:30,STAT_BOOTCNT:10};
 const state=(change={})=>({connected:true,demo:false,armed:false,lastHeartbeat:now,paramComplete:true,paramLoading:false,sysid:1,compid:1,params:new Map(Object.entries({...values,...change}).map(([k,v])=>[k,{value:v}])),compassStatus:{present:true,healthy:true,lastSeen:now}});
 const before=core.snapshotCompassSession(state()),assess=(s,opts={})=>core.assessCompassRecovery(before,s,opts,now);
 assert.equal(assess(state()).kind,'unverified','unchanged offsets cannot replace a missing calibration report');
 assert.equal(assess(state(),{saved:true}).kind,'reboot-required','successful calibration alone is not a reboot');
 assert.equal(assess(state(),{saved:true,manualReboot:true,sawDisconnect:true}).kind,'reboot-required','manual checkbox must not override an unchanged known boot counter');
 assert.equal(assess(state({COMPASS_OFS_X:15})).kind,'reboot-required','offline saving still requires reboot');
 assert.equal(assess(state({COMPASS_OFS_X:15,STAT_BOOTCNT:11})).kind,'ready','saved coefficients and actual reboot can be recognized automatically');
 assert.equal(assess(state({STAT_BOOTCNT:11}),{saved:true,reportVerified:true}).kind,'ready','a saved report allows unchanged coefficients');
 assert.equal(assess({...state({STAT_BOOTCNT:11}),paramComplete:false},{saved:true}).kind,'waiting');
 assert.equal(assess({...state({STAT_BOOTCNT:11}),armed:true},{saved:true}).kind,'waiting');
 assert.equal(assess({...state({STAT_BOOTCNT:11}),connected:false},{saved:true}).kind,'waiting');
 assert.equal(assess({...state({STAT_BOOTCNT:11}),lastHeartbeat:now-5000},{saved:true}).kind,'waiting');
 assert.equal(assess({...state({STAT_BOOTCNT:11}),sysid:2},{saved:true}).reason,'different-controller');
 assert.equal(assess(state({STAT_BOOTCNT:11,COMPASS_DEV_ID:456}),{saved:true}).reason,'different-compass');
 assert.equal(assess({...state({STAT_BOOTCNT:11}),compassStatus:{present:true,healthy:false,lastSeen:now}},{saved:true}).kind,'waiting');
 const unknown=state();unknown.params.delete('STAT_BOOTCNT');const baseline=core.snapshotCompassSession(unknown);
 assert.equal(core.assessCompassRecovery(baseline,unknown,{saved:true,manualReboot:true},now).kind,'reboot-required');
 assert.equal(core.assessCompassRecovery(baseline,unknown,{saved:true,manualReboot:true,sawDisconnect:true},now).kind,'ready');
})();
function params(entries){return new Map(entries.map(([name,value,type=9])=>[name,{value,type}]));}
function escParams({mask=0,otype=0,channels=[3],can=false}={}){
 const out=[['SERVO_BLH_MASK',mask],['SERVO_BLH_OTYPE',otype]];
 for(const ch of channels)out.push(['SERVO'+ch+'_FUNCTION',70,6]);
 if(can)out.push(['CAN_P1_DRIVER',1,6],['CAN_D1_PROTOCOL',1,6]);
 return params(out);
}
(function testValidParamFileAndDiff(){
 const live=params([['AIRSPEED_MIN',15,9],['THR_MAX',100,6]]);
 const result=core.parseParamText('# A.T.L.A.S. profile\nAIRSPEED_MIN 18\nTHR_MAX 90\n',live,{AIRSPEED_MIN:{Range:{low:'5',high:'60'}},THR_MAX:{Range:{low:'0',high:'100'}}});
 assert.equal(result.valid,true);assert.deepEqual(result.changes,[['AIRSPEED_MIN',18],['THR_MAX',90]]);assert.equal(result.errors.length,0);
})();
(function testDuplicateAndUnknownAreSkipped(){
 const result=core.parseParamText('AIRSPEED_MIN 18\nAIRSPEED_MIN 19\nNOT_A_PARAM 1\n',params([['AIRSPEED_MIN',15,9]]),{});
 assert.equal(result.valid,true);
 assert.deepEqual(result.changes,[['AIRSPEED_MIN',18]]);
 assert.ok(result.skipped.some(x=>x.reason==='duplicate'));
 assert.ok(result.skipped.some(x=>x.reason==='unknown'));
})();
(function testRangeAndIntegerValidation(){
 const result=core.parseParamText('THR_MAX 100.5\nAIRSPEED_MIN 999\n',params([['THR_MAX',100,6],['AIRSPEED_MIN',15,9]]),{AIRSPEED_MIN:{Range:{low:'5',high:'60'}}});
 assert.equal(result.valid,false);assert.ok(result.skipped.some(x=>x.reason==='integer'));assert.ok(result.skipped.some(x=>x.reason==='range'));
})();
(function testDeclaredBoardHeaderMustMatch(){
 const live=params([['AIRSPEED_MIN',15,9]]);
 const match=core.parseParamText('# Board: Matek H743-WING V3\nAIRSPEED_MIN 18\n',live,{}, {boardLabel:'Matek H743-WING V3'});
 const wrong=core.parseParamText('# Board: Orange Cube\nAIRSPEED_MIN 18\n',live,{}, {boardLabel:'Matek H743-WING V3'});
 assert.equal(match.valid,true);
 assert.equal(wrong.valid,false);
 assert.ok(wrong.errors.some(x=>x.reason==='board'));
})();
(function testProtectedSystemStateSkipped(){
 const live=params([['FORMAT_VERSION',0,6],['STAT_BOOTCNT',20,6],['THR_MAX',100,6]]);
 const profile=core.parseParamText('FORMAT_VERSION 999\nSTAT_BOOTCNT 0\nTHR_MAX 95\n',live,{});
 assert.equal(profile.valid,true);
 assert.deepEqual(profile.changes,[['THR_MAX',95]]);
 assert.ok(profile.skipped.filter(x=>x.reason==='protected-skipped').length===2);
})();
(function testUnsafeParamValuesAreRejected(){
 const live=params([['THR_MAX',100,6],['SERVO3_MIN',1000,3],['SERVO3_TRIM',1500,4],['BAT_AMP_PERVLT',2.5,9],['FLOAT64_EXPERIMENT',1,10]]);
 for(const line of ['THR_MAX 90 unexpected','SERVO3_MIN -1','SERVO3_MIN 65536','SERVO3_TRIM 32768','THR_MAX 2147483648','FLOAT64_EXPERIMENT 1.3']){
  const result=core.parseParamText(line+'\n',live,{});
  assert.equal(result.valid,false,'accepted '+line);
 }
 const okay=core.parseParamText('THR_MAX 90 # inline comment\nBAT_AMP_PERVLT 1.25 ; supported comment\n',live,{});
 assert.equal(okay.valid,true);
 assert.equal(okay.changes.length,2);
})();
(function testPartialImportContinuesWithSkips(){
 const live=params([['THR_MAX',100,6],['CAN_P1_BITRATE',1000000,6],['SERVO3_MIN',1000,3]]);
 const file='THR_MAX 95\nBARO1_WCF_BCK 1\nCAN_P1_BITRATE 250000\nSERVO3_MIN 70000\n';
 const result=core.parseParamText(file,live,{CAN_P1_BITRATE:{ReadOnly:true}});
 assert.equal(result.valid,true);
 assert.deepEqual(result.changes,[['THR_MAX',95]]);
 assert.deepEqual(result.skipped.map(x=>x.reason),['unknown','readonly','type-range']);
 assert.equal(result.metadataMissingCount,1);
 assert.equal(result.errors.length,0);
})();
(function testMetadataRangeNoLongerSpamsWarnings(){
 const live=params([['THR_MAX',100,6],['TRIM_ARSPD_CM',2200,6]]);
 const result=core.parseParamText('THR_MAX 90\nTRIM_ARSPD_CM 2000\n',live,{});
 assert.equal(result.valid,true);assert.equal(result.metadataMissingCount,2);
 assert.equal(result.warnings.length,0);
})();
(function testQuickWriteButtonSafetyAndNoBackupPrecondition(){
 const now=Date.now(),s={connected:true,demo:false,armed:false,lastHeartbeat:now,paramLoading:false,paramComplete:true,params:params([['THR_MAX',100,6]]),selectedBoard:'matek-h743-wing-v3'};
 const q={preview:{valid:true,changes:[['THR_MAX',95]]},previewBoard:s.selectedBoard,compatConfirmed:true,applyBusy:false,readBusy:false,backupDownloaded:false};
 assert.deepEqual(core.writeBlockers(s,q,true,now),[],'backup download must not silently block a safe write');
 assert.ok(core.writeBlockers({...s,armed:true},q,false,now).includes('disarmed'));
 assert.ok(core.writeBlockers({...s,lastHeartbeat:now-4500},q,false,now).includes('heartbeat'));
 assert.ok(core.writeBlockers({...s,paramLoading:true},q,false,now).includes('loading'));
 assert.ok(core.writeBlockers({...s,paramComplete:false},q,true,now).includes('incomplete'));
 assert.ok(core.writeBlockers({...s,connectionId:2},{...q,previewConnection:1},true,now).includes('stalePreview'));
 assert.ok(core.writeBlockers({...s,params:params([])},q,false,now).includes('empty'));
 assert.ok(core.writeBlockers(s,{...q,compatConfirmed:false},true,now).includes('compat'));
 assert.ok(core.writeBlockers(s,{...q,previewBoard:'cube-orange'},true,now).includes('board'));
 assert.ok(core.writeBlockers(s,{...q,preview:{...q.preview,changes:[]}},true,now).includes('unchanged'));
 assert.deepEqual(core.writeBlockers(s,q,false,now),['writer'],'busy MAVLink parameter writer must block');
})();
(function testEscClassification(){
 assert.equal(core.classifyEscProtocol(escParams({mask:1<<2,otype:6,channels:[3]}),'matek-h743-wing-v3').kind,'dshot');
 assert.equal(core.classifyEscProtocol(escParams({mask:0,otype:6,channels:[3]}),'matek-h743-wing-v3').kind,'pwm');
 assert.equal(core.classifyEscProtocol(escParams({mask:1<<2,otype:6,channels:[3,4]})).kind,'mixed');
 assert.equal(core.classifyEscProtocol(escParams({mask:1<<2,otype:1,channels:[3]})).kind,'other-pulse');
 assert.equal(core.classifyEscProtocol(escParams({mask:1<<2,otype:6,channels:[3]}),'cube-orange').kind,'dshot-board-limit');
 assert.equal(core.classifyEscProtocol(escParams({mask:0,otype:0,can:true})).kind,'pwm');
 assert.equal(core.classifyEscProtocol(params([['SERVO3_FUNCTION',70,6]])).kind,'unknown');
 assert.equal(core.classifyEscProtocol(params([])).kind,'no-throttle');
})();
(function testEscUsesLoadedProfile(){
 const live=escParams({mask:0,otype:0,channels:[3],can:true});
 const profile='SERVO3_FUNCTION 70\nSERVO_BLH_MASK 4\nSERVO_BLH_OTYPE 6\nCAN_P1_DRIVER 1\n';
 const result=core.classifyEscFromProfile(live,profile,'matek-h743-wing-v3');
 assert.equal(result.kind,'dshot','CAN peripheral must not mask configured DShot throttle');
 assert.equal(result.source,'profile+controller');
 assert.equal(result.channels[0],3);
 assert.equal(core.classifyEscFromProfile(live,'','matek-h743-wing-v3').kind,'pwm');
 assert.equal(core.readEscProfile('THR_MAX 100\nSERVO_BLH_MASK 4\n').has('THR_MAX'),false,'only ESC-relevant keys may override assessment');
})();
(function testPostCompassCalibrationEvidenceAcrossInstances(){
 const now=Date.now(),healthy={present:true,healthy:true,lastSeen:now};
 const before=params([['COMPASS_OFS_X',2],['COMPASS_OFS_Y',3],['COMPASS_OFS_Z',4],['COMPASS_OFS2_X',10],['COMPASS_OFS2_Y',12],['COMPASS_OFS2_Z',13]]);
 const after=params([['COMPASS_OFS_X',2],['COMPASS_OFS_Y',3],['COMPASS_OFS_Z',4],['COMPASS_OFS2_X',22],['COMPASS_OFS2_Y',14],['COMPASS_OFS2_Z',13]]);
 const baseline=core.snapshotCompassOffsets(before);
 const result=core.assessPostCompassCalibration(baseline,after,healthy,now);
 assert.equal(result.kind,'evidence','second/external compass offset updates must be detected');
 assert.ok(result.changed.includes('COMPASS_OFS2_X'));
 assert.equal(core.assessPostCompassCalibration(baseline,before,healthy,now).kind,'unverified','unchanged offsets do not prove new calibration');
 assert.equal(core.assessPostCompassCalibration(baseline,after,{present:true,healthy:false,lastSeen:now},now).kind,'unverified','unhealthy compass does not prove success');
 assert.equal(core.assessPostCompassCalibration(baseline,after,{present:true,healthy:true,lastSeen:now-6000},now).kind,'unverified','stale sensor status is not evidence');
})();
(function testCompassAndCompletionGates(){
 const now=Date.now(),enabled=params([['COMPASS_USE',1,6],['COMPASS_USE2',0,6]]);
 assert.equal(core.detectCompass(enabled).kind,'unknown','enable setting does not prove hardware is present');
 assert.equal(core.detectCompass(enabled,{present:false,healthy:false,lastSeen:now},now).kind,'absent');
 assert.equal(core.detectCompass(enabled,{present:true,healthy:false,lastSeen:now},now).kind,'unhealthy','a configured but unhealthy compass must not be claimed fully connected');
 assert.equal(core.detectCompass(enabled,{present:true,healthy:true,lastSeen:now-6000},now).kind,'unknown','stale SYS_STATUS cannot certify presence');
 assert.equal(core.detectCompass(params([['COMPASS_USE',0,6],['COMPASS_USE2',0,6]]),{present:true,lastSeen:now},now).kind,'disabled');
 assert.equal(core.detectCompass(params([])).kind,'unknown');
 assert.equal(core.verifiedEvent({kind:'six',status:'done',verified:true},'six'),true);
 assert.equal(core.verifiedEvent({kind:'six',status:'done',verified:false},'six'),false);
 assert.equal(core.verifiedEvent({kind:'six',status:'started',verified:true},'six'),false);
 assert.equal(core.canMarkManualComplete(true,true),true);
 assert.equal(core.canMarkManualComplete(false,true),false);
})();
console.log('PASS: .param parsing, duplicate/unknown/range/type validation, DShot/PWM/OneShot/CAN classification, compass detection and verified completion gates.');
