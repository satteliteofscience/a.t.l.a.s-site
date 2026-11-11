'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../capri-core.js');
for(const [name,[lo,hi,integer]]of Object.entries(core.specs)){
 assert(core.valid(name,lo));assert(core.valid(name,hi));assert(!core.valid(name,lo-1));assert(!core.valid(name,hi+1));assert(!core.valid(name,NaN));
 if(integer)assert(!core.valid(name,lo+.5));
}
const params=new Map([['CAPRI_MODE',{value:2}],['RUD_LIMIT_DEG',{value:30}]]);
const s={connected:true,demo:false,sysid:1,armed:true,mode:5,lastHeartbeat:1000,params,connectionId:1,paramLoading:false};
assert(core.commandAllowed(s,true,1001));
for(const override of [{connected:false},{demo:true},{armed:false},{mode:13},{lastHeartbeat:0},{paramLoading:true}])assert(!core.commandAllowed({...s,...override},true,5000));
assert(core.commandAllowed({...s,armed:false,mode:13},false,1001));
assert.equal(core.observed(s,{value:1,connectionId:1,at:1000},1001),true);
assert.equal(core.observed(s,{value:0,connectionId:1,at:1000},1001),false);
assert.equal(core.observed(s,{value:1,connectionId:0,at:1000},1001),null);
assert.equal(core.observed(s,{value:1,connectionId:1,at:1000},3600),null);
params.set('CAPRI_MODE',{value:1});assert(!core.commandAllowed(s,true,1001));
const context={window:{},TextEncoder,TextDecoder,Uint8Array,DataView};vm.runInNewContext(fs.readFileSync(require.resolve('../mavlink.js'),'utf8'),context);
const M=context.window.AtlasMAV;
for(const value of [0,1]){
 const payload=new Uint8Array(16);new DataView(payload.buffer).setFloat32(4,value,true);payload.set(new TextEncoder().encode('CAPRI_ON'),8);
 const frame=M.createFrame(251,payload),received=[];new M.Parser(x=>received.push(M.parseMessage(x))).push(frame);
 assert.equal(received.length,1);assert.equal(received[0].name,'CAPRI_ON');assert.equal(received[0].value,value);
 frame[frame.length-1]^=1;new M.Parser(()=>assert.fail('Corrupt frame accepted')).push(frame);
}
const metadata=JSON.parse(fs.readFileSync(require.resolve('../data/param-metadata.json'),'utf8')).parameters;
for(const [name,[low,high]]of Object.entries(core.specs)){
 assert.equal(Number(metadata[name].Range.low),low);assert.equal(Number(metadata[name].Range.high),high);
}
console.log('PASS: C.A.P.R.I. ranges, command guards, stale/reconnect state and real MAVLink framing.');
