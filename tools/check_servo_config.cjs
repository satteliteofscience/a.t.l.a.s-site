'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../servo-config-core.js');

function makeParams(reverse=0){
 return new Map([
  ['SERVO1_FUNCTION',{value:4}],['SERVO1_MIN',{value:1000}],
  ['SERVO1_TRIM',{value:1500}],['SERVO1_MAX',{value:2000}],
  ['SERVO1_REVERSED',{value:reverse}]
 ]);
}
function draft(reverse){return {FUNCTION:'4',MIN:'1000',TRIM:'1500',MAX:'2000',REVERSED:reverse};}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function runDraft(queue,params,snapshot,stats){
 return queue(async()=>{
  const check=core.validateDraft(1,snapshot,params);
  assert.equal(check.error,undefined);
  for(const [field,value] of check.changes){
   stats.active++;stats.maxActive=Math.max(stats.maxActive,stats.active);
   await delay(4);
   params.set(`SERVO1_${field}`,{value});
   stats.writes.push([field,value]);
   stats.active--;
  }
  return check.changes.length;
 });
}

async function testReverseThenImmediateApply(){
 const params=makeParams(),queue=core.createSerialQueue(),stats={active:0,maxActive:0,writes:[]},next=draft(true);
 const liveReverse=runDraft(queue,params,next,stats);
 const applyClick=runDraft(queue,params,next,stats);
 await Promise.all([liveReverse,applyClick]);
 assert.equal(params.get('SERVO1_REVERSED').value,1,'reverse must persist when Apply follows immediately');
 assert.deepEqual(stats.writes,[['REVERSED',1]],'queued Apply must not race or duplicate an already acknowledged reverse');
 assert.equal(stats.maxActive,1,'PARAM_SET transactions must never overlap');
}

async function testReverseThenEnableImmediateApply(){
 const params=makeParams(0),queue=core.createSerialQueue(),stats={active:0,maxActive:0,writes:[]};
 const pendingDraft=draft(true);
 let applyImmediately=false;
 // User checks Reverse while Apply Immediately is OFF: it must remain a local draft.
 if(applyImmediately){
  await queue(async()=>{
   const check=core.validateDraft(1,pendingDraft,params);
   for(const [field,value] of core.selectLiveChanges(check,'ALL')){
    stats.active++;stats.maxActive=Math.max(stats.maxActive,stats.active);
    await delay(4);params.set(`SERVO1_${field}`,{value});stats.writes.push([field,value]);stats.active--;
   }
  });
 }
 assert.equal(params.get('SERVO1_REVERSED').value,0,'Reverse remains a draft while immediate apply is OFF');
 // Enabling the checkbox must flush the full pending draft, including REVERSED.
 applyImmediately=true;
 if(applyImmediately){
  await queue(async()=>{
   const check=core.validateDraft(1,pendingDraft,params);
   const changes=core.selectLiveChanges(check,'ALL');
   assert.deepEqual(changes,[['REVERSED',1]],'the enable transition must select the pending reverse');
   for(const [field,value] of changes){
    stats.active++;stats.maxActive=Math.max(stats.maxActive,stats.active);
    await delay(4);params.set(`SERVO1_${field}`,{value});stats.writes.push([field,value]);stats.active--;
   }
  });
 }
 assert.equal(params.get('SERVO1_REVERSED').value,1,'Reverse must be written when Apply Immediately is enabled');
 assert.deepEqual(stats.writes,[['REVERSED',1]]);
 assert.equal(stats.maxActive,1);
}

async function testEnableImmediateFlushesAllPendingLiveFields(){
 const params=makeParams(0),pending={...draft(true),MIN:'1050',TRIM:'1500',MAX:'1950'};
 const check=core.validateDraft(1,pending,params);
 assert.deepEqual(core.selectLiveChanges(check,'ALL'),[['MIN',1050],['MAX',1950],['REVERSED',1]]);
 assert.deepEqual(core.selectLiveChanges(check,'REVERSED'),[['REVERSED',1]]);
 assert.deepEqual(core.selectLiveChanges(check,'FUNCTION'),[]);
}

async function testApplyThenReverse(){
 const params=makeParams(),queue=core.createSerialQueue(),stats={active:0,maxActive:0,writes:[]};
 await runDraft(queue,params,draft(false),stats);
 await runDraft(queue,params,draft(true),stats);
 assert.equal(params.get('SERVO1_REVERSED').value,1,'reverse must persist when toggled after Apply');
 assert.deepEqual(stats.writes,[['REVERSED',1]]);
 assert.equal(stats.maxActive,1);
}

async function testRapidReverseToggles(){
 const params=makeParams(),queue=core.createSerialQueue(),stats={active:0,maxActive:0,writes:[]};
 await Promise.all([runDraft(queue,params,draft(true),stats),runDraft(queue,params,draft(false),stats),runDraft(queue,params,draft(true),stats)]);
 assert.equal(params.get('SERVO1_REVERSED').value,1,'last queued reverse state must win');
 assert.equal(stats.maxActive,1);
}

async function testQueueRecoversAfterFailure(){
 const queue=core.createSerialQueue();
 await assert.rejects(queue(async()=>{throw new Error('simulated PARAM_VALUE timeout');}),/timeout/);
 assert.equal(await queue(async()=>42),42,'one failed write must not poison later writes');
}

function testDraftValidation(){
 const params=makeParams();
 assert.deepEqual(core.validateDraft(1,draft(true),params).changes,[['REVERSED',1]]);
 assert.equal(core.validateDraft(1,{...draft(true),MIN:'1700'},params).error,'range');
 assert.equal(core.validateDraft(1,{...draft(true),MAX:'2300'},params).error,'invalid');
 assert.equal(core.validateDraft(17,draft(true),params).error,'channel');
}

function testConfiguratorUsesOneQueue(){
 const source=fs.readFileSync('calibration.js','utf8');
 assert.match(source,/const enqueueServoWrite=servoCore\.createSerialQueue\(\)/);
 assert.match(source,/enqueueServoWrite\(\(\)=>realtimeParamChange\(field\)\)/);
 assert.match(source,/servoCore\.selectLiveChanges\(validation,field\)/,'live writes must use the shared live-field selector');
 const toggleAt=source.indexOf("$('servoLiveApply').addEventListener('change'");
 const toggleEnd=source.indexOf("$('servoBenchConsent')",toggleAt);
 const toggleHandler=source.slice(toggleAt,toggleEnd);
 assert.match(toggleHandler,/if\(\$('servoLiveApply'\)\.checked\)queueRealtime\('ALL'\)/,'enabling Apply Immediately must flush the current draft');
 assert.match(source,/await enqueueServoWrite\(async\(\)=>/);
 assert.match(source,/servoSavePending/);
 assert.doesNotMatch(source,/servoLiveQueue/);
 const saveStart=source.indexOf('async function saveServoEditor(ev)');
 const saveEnd=source.indexOf('function renderServo()',saveStart);
 const saveHandler=source.slice(saveStart,saveEnd);
 assert.ok(saveStart>=0&&saveEnd>saveStart,'servo Apply handler must be present');
 assert.match(saveHandler,/if\(servoSavePending\|\|servoEditing===null\|\|benchActive\)return/);
 assert.doesNotMatch(saveHandler,/if\(servoIsSaving\|\|/,'Apply must not be discarded while an immediate reverse write is in flight');
 const writer=fs.readFileSync('configurator.js','utf8');
 assert.match(writer,/for\(const field of \['FUNCTION','MIN','TRIM','MAX','REVERSED'\]\)/,'servo parameters must use deterministic write order');
 const html=fs.readFileSync('configurator.html','utf8');
 assert.match(html,/<script src="servo-config-core\.js" defer><\/script><script src="calibration\.js" defer>/);
 assert.match(html,/<details class="servo-bench-details">/);
}

(async()=>{
 await testReverseThenImmediateApply();
 await testReverseThenEnableImmediateApply();
 await testEnableImmediateFlushesAllPendingLiveFields();
 await testApplyThenReverse();
 await testRapidReverseToggles();
 await testQueueRecoversAfterFailure();
 testDraftValidation();
 testConfiguratorUsesOneQueue();
 console.log('PASS: reverse→Apply, Reverse draft→enable Apply Immediately, pending live-field flush, Apply→reverse, rapid toggles, serialized writes and queue recovery.');
})().catch(error=>{console.error(error);process.exitCode=1;});
