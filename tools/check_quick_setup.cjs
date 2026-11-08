'use strict';
const assert=require('node:assert/strict');
const core=require('../quick-setup-core.js');
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
(function testDuplicateAndUnknownRejected(){
 const result=core.parseParamText('AIRSPEED_MIN 18\nAIRSPEED_MIN 19\nNOT_A_PARAM 1\n',params([['AIRSPEED_MIN',15,9]]),{});
 assert.equal(result.valid,false);assert.ok(result.errors.some(x=>x.reason==='duplicate'));assert.ok(result.errors.some(x=>x.reason==='unknown'));
})();
(function testRangeAndIntegerValidation(){
 const result=core.parseParamText('THR_MAX 100.5\nAIRSPEED_MIN 999\n',params([['THR_MAX',100,6],['AIRSPEED_MIN',15,9]]),{AIRSPEED_MIN:{Range:{low:'5',high:'60'}}});
 assert.equal(result.valid,false);assert.ok(result.errors.some(x=>x.reason==='integer'));assert.ok(result.errors.some(x=>x.reason==='range'));
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
 assert.ok(profile.warnings.filter(x=>x.reason==='protected-skipped').length===2);
})();
(function testEscClassification(){
 assert.equal(core.classifyEscProtocol(escParams({mask:1<<2,otype:6,channels:[3]}),'matek-h743-wing-v3').kind,'dshot');
 assert.equal(core.classifyEscProtocol(escParams({mask:0,otype:6,channels:[3]}),'matek-h743-wing-v3').kind,'pwm');
 assert.equal(core.classifyEscProtocol(escParams({mask:1<<2,otype:6,channels:[3,4]})).kind,'mixed');
 assert.equal(core.classifyEscProtocol(escParams({mask:1<<2,otype:1,channels:[3]})).kind,'other-pulse');
 assert.equal(core.classifyEscProtocol(escParams({mask:1<<2,otype:6,channels:[3]}),'cube-orange').kind,'dshot-board-limit');
 assert.equal(core.classifyEscProtocol(escParams({mask:0,otype:0,can:true})).kind,'unknown');
 assert.equal(core.classifyEscProtocol(params([['SERVO3_FUNCTION',70,6]])).kind,'unknown');
 assert.equal(core.classifyEscProtocol(params([])).kind,'no-throttle');
})();
(function testCompassAndCompletionGates(){
 assert.equal(core.detectCompass(params([['COMPASS_USE',1,6],['COMPASS_USE2',0,6]])).kind,'enabled');
 assert.equal(core.detectCompass(params([['COMPASS_USE',0,6],['COMPASS_USE2',0,6]])).kind,'disabled');
 assert.equal(core.detectCompass(params([])).kind,'unknown');
 assert.equal(core.verifiedEvent({kind:'six',status:'done',verified:true},'six'),true);
 assert.equal(core.verifiedEvent({kind:'six',status:'done',verified:false},'six'),false);
 assert.equal(core.verifiedEvent({kind:'six',status:'started',verified:true},'six'),false);
 assert.equal(core.canMarkManualComplete(true,true),true);
 assert.equal(core.canMarkManualComplete(false,true),false);
})();
console.log('PASS: .param parsing, duplicate/unknown/range/type validation, DShot/PWM/OneShot/CAN classification, compass detection and verified completion gates.');
