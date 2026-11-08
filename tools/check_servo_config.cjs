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
 assert.match(source,/await enqueueServoWrite\(async\(\)=>/);
 assert.match(source,/servoSavePending/);
 assert.doesNotMatch(source,/servoLiveQueue/);
 const html=fs.readFileSync('configurator.html','utf8');
 assert.match(html,/<script src="servo-config-core\.js" defer><\/script><script src="calibration\.js" defer>/);
 assert.match(html,/<details class="servo-bench-details">/);
}

(async()=>{
 await testReverseThenImmediateApply();
 await testApplyThenReverse();
 await testRapidReverseToggles();
 await testQueueRecoversAfterFailure();
 testDraftValidation();
 testConfiguratorUsesOneQueue();
 console.log('PASS: reverse→Apply, Apply→reverse, rapid toggles, serialized writes, queue recovery and progressive-disclosure UI.');
})().catch(error=>{console.error(error);process.exitCode=1;});
