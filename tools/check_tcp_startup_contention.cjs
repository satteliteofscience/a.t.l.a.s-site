/* First TCP connection must not compete with station-managed telemetry while MAVFTP runs. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const js=fs.readFileSync('js/configurator/configurator.js','utf8');
function extract(start,end){
 const a=js.indexOf(start),b=js.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'expected source markers: '+start);
 return js.slice(a,b);
}
const heartbeat=extract("if(data.type==='heartbeat' && data.compid===1){","else if(data.type==='attitude')");
assert.match(heartbeat,/if\(state\.transport!=='bridge'\)void requestStreams\(\)/,
 'TCP first heartbeat should not negotiate all station telemetry rates during FTP');
assert.match(heartbeat,/startParamLoad\(\)/,
 'first TCP heartbeat must still initiate automatic 239-byte MAVFTP read');
const client=extract('function startFastParamStream(transfer){','function startParamLoad(');
assert.match(client,/readSize:blockSize/,'keep selected 239-byte burst and 110 fallback');
assert.match(client,/concurrentParamValues:transfer\.concurrentParamValues/,
 'capture concurrent PARAM_VALUE count for measured throughput diagnostics');
const receive=extract("else if(data.type==='param'){","window.dispatchEvent(new CustomEvent('atlas:message'");
assert.match(receive,/if\(ftpActive&&state\.paramLoading\)transfer\.concurrentParamValues=/,
 'count unsolicited legacy parameter stream during MAVFTP');
assert.match(receive,/if\(!ftpActive\)scheduleParameterRerender\(\)/,
 'do not perform redundant table rerender for each unsolicited parameter during MAVFTP');

async function checkLegacyParamStartup(transport){
 const state={transport,connected:true,sysid:1,compid:1,params:new Map()};
 const requests=[];
 let now=10000;
 const context={
  state,Date:{now:()=>now},renderParams(){},renderBasic(){},showProgress(){},
  toast(message,error){if(error)throw Error(message);},tr:key=>key,
  setInterval:()=>1,clearInterval(){},
  startFastParamStream(transfer){
   if(transport!=='bridge')return false;
   transfer.phase='ftp';
   return true;
  },
  M:{paramList:()=>null,paramReadByIndex:(_sys,_comp,index)=>index},
  async transmit(id,payload){requests.push([id,payload]);}
 };
 const source=extract('function stopParamRepair(){','function finishParamTransfer(')+
  extract('async function recoverMissingParams(){','function renderAhrsFilter(')+
  extract('function startLegacyParamStream(transfer){','function startFastParamStream(')+
  extract('function startParamLoad(','function canWrite(');
 vm.runInNewContext(source,context);
 assert.equal(context.startParamLoad(),true);
 if(transport==='bridge')context.startLegacyParamStream(state.paramTransfer);
 assert.deepEqual(requests,[[21,null]],transport+' must request the legacy parameter list');
 assert.equal(state.paramRepairTimer,1);
 state.paramCount=3;
 state.paramTransfer.seen.add(0).add(2);
 now+=4000;
 await context.recoverMissingParams();
 await context.recoverMissingParams();
 assert.deepEqual(requests,[[21,null],[20,1]],transport+' repairs the missing index without immediately repeating it');
}
const recoverySource=extract('async function requestBridgeMissingStreams(){','function handleMessage(');
const sent=[],mockNow=Date.now(),state={
 transport:'bridge',connected:true,paramLoading:true,sysid:1,compid:1,
 lastAttitude:mockNow,lastVfr:mockNow
};
const ctx={
 state,Date:{now:()=>mockNow},M:{commandLong:(sys,comp,command,params)=>({sys,comp,command,params})},
 transmit:async(id,payload)=>sent.push({id,payload}),log:()=>{}
};
vm.runInNewContext(recoverySource+'\nthis.check=requestBridgeMissingStreams;',ctx);
(async()=>{
 await checkLegacyParamStartup('usb');
 await checkLegacyParamStartup('bridge');
 await ctx.check();
 assert.equal(sent.length,0,'never negotiate streams while packed parameters are loading');
 state.paramLoading=false;
 await ctx.check();
 assert.equal(sent.length,0,'station-provided fresh attitude and VFR must not be reconfigured');
 state.lastVfr=0;
 await ctx.check();
 assert.equal(sent.length,1,'only missing VFR should be requested');
 assert.equal(sent[0].payload.command,511);
 assert.equal(sent[0].payload.params[0],74);
 sent.length=0;state.lastVfr=mockNow;state.lastAttitude=0;
 await ctx.check();
 assert.equal(sent.length,1,'only missing attitude should be requested');
 assert.equal(sent[0].payload.params[0],30);
 sent.length=0;state.transport='usb';
 await ctx.check();
 assert.equal(sent.length,0,'bridge-specific recovery must not change USB behavior');
 assert.match(js,/if\(state\.transport==='bridge'\)\{\s*setTimeout\(\(\)=>\{if\(state\.connected&&!state\.paramLoading\)void requestBridgeMissingStreams\(\);},600\)/,
  'recover missing bridge telemetry only after parameter read completes');
 assert.match(js,/lastAttitude=0;state\.streamStart=0/g);
 assert.match(js,/!state\.paramLoading&&!state\.vfrFallbackSent/,
  'avoid VFR stream fallback during active FTP');
 console.log('PASS: first TCP heartbeat does not race 4 stream requests with MAVFTP; missing telemetry recovers only after transfer; concurrent legacy PARAM_VALUE tracked without UI rerenders.');
})().catch(e=>{console.error(e);process.exitCode=1;});
