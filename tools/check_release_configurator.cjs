'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),net=require('node:net'),dgram=require('node:dgram'),{spawn}=require('node:child_process');
const core=require('../battery-cal-core.js');
const fs=require('node:fs');
const config=fs.readFileSync('configurator.js','utf8');
const quick=fs.readFileSync('quick-setup-core.js','utf8');
const tree=fs.readFileSync('param-tree.js','utf8');
const html=fs.readFileSync('configurator.html','utf8');
const script=fs.readFileSync('tools/mavlink-bridge.cjs','utf8');
const page=fs.readFileSync('app.js','utf8');
(function testBatteryCalibration(){
 const value=core.compute({monitorType:4,multiplier:10,reportedVolts:24.5,measuredVolts:25.2});
 assert.equal(value.ok,true);assert.ok(Math.abs(value.newMultiplier-10.285714)<1e-5);
 for(const typ of [0,8,9,10])assert.equal(core.compute({monitorType:typ,multiplier:10,reportedVolts:24,measuredVolts:24.5}).ok,false);
 assert.equal(core.compute({monitorType:3,multiplier:10,reportedVolts:20,measuredVolts:30}).reason,'large-difference');
 assert.equal(core.compute({monitorType:25,multiplier:10,reportedVolts:24,measuredVolts:NaN}).ok,false);
})();
assert.match(config,/AtlasQuickSetupCore\.parseParamText\(state\.importedText,state\.params,metadata\)/,'ordinary import must use validated Quick Setup parser');
assert.match(config,/state\.importReport\.skipped/,'ordinary import must report unsupported records');
assert.match(config,/writeParameterWithAck\(name,value,p\.type\)/,'single edits must use central acknowledged PARAM_SET writer');
assert.match(tree,/valueButton\.disabled=readOnly\|\|!canWrite\(\)/,'read-only table row must be locked');
assert.match(quick,/String\(definition\.ReadOnly\)\.toLowerCase/,'pdef string ReadOnly fields must be respected');
assert.match(fs.readFileSync('calibration.js','utf8'),/function renderBatteryCal\(/,'battery calibration preview must be rendered in normal monitor');
assert.match(config,/lastVoltageTelemetry/,'battery calibration needs fresh SYS_STATUS voltage timing');
assert.match(html,/id="batteryCalMeasured"/,'measured voltage input is missing');
assert.match(html,/id="networkMode"/,'UDP/TCP configurator controls must exist');
assert.match(config,/function connectBridge\(\)/,'MAVLink network transport should be supported');
assert.match(config,/state\.netSocket\.send\(frame\)/,'bridge should send the same MAVLink frame as USB');
assert.match(script,/ORIGINS\.has\(origin\)/,'local bridge must enforce browser Origin');
assert.match(script,/url\.searchParams\.get\('token'\)!==TOKEN/,'local bridge must enforce session token');
assert.match(page,/landAtSupport\(\)/,'support deep link should be aligned after page load');

function getFreePort(){
 return new Promise((resolve,reject)=>{
  const server=net.createServer();server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>{const p=server.address().port;server.close(()=>resolve(p));});
 });
}
function maskedFrame(op,data){
 data=Buffer.isBuffer(data)?data:Buffer.from(data);
 assert.ok(data.length<126);
 const mask=crypto.randomBytes(4),head=Buffer.from([0x80|op,0x80|data.length]),payload=Buffer.from(data);
 for(let i=0;i<payload.length;i++)payload[i]^=mask[i%4];
 return Buffer.concat([head,mask,payload]);
}
async function webSocket(port,token){
 return new Promise((resolve,reject)=>{
  const socket=net.createConnection({host:'127.0.0.1',port});
  let handshake=false,buffer=Buffer.alloc(0);const queue=[],waiting=[];
  function push(msg){
   const match=waiting.findIndex(x=>x.predicate(msg));
   if(match>=0){const w=waiting.splice(match,1)[0];clearTimeout(w.timer);w.resolve(msg);}
   else queue.push(msg);
  }
  function receive(chunk){
   buffer=Buffer.concat([buffer,chunk]);
   if(!handshake){
    const end=buffer.indexOf('\r\n\r\n');if(end<0)return;
    assert.match(buffer.subarray(0,end).toString(),/101 Switching Protocols/);
    buffer=buffer.subarray(end+4);handshake=true;
    resolve({send(op,data){socket.write(maskedFrame(op,data));},
     wait(predicate=()=>true,timeout=5000){
      const match=queue.findIndex(predicate);
      if(match>=0)return Promise.resolve(queue.splice(match,1)[0]);
      return new Promise((res,rej)=>{
       const obj={predicate,resolve:res,timer:setTimeout(()=>{const i=waiting.indexOf(obj);if(i>=0)waiting.splice(i,1);rej(Error('WebSocket response timeout'));},timeout)};
       waiting.push(obj);
      });
     },close(){socket.destroy();}});
   }
   while(buffer.length>=2){
    const opcode=buffer[0]&15,len=buffer[1]&127;let pos=2,n=len;
    if(len===126){if(buffer.length<4)return;n=buffer.readUInt16BE(2);pos=4;}
    if(buffer.length<pos+n)return;
    const payload=Buffer.from(buffer.subarray(pos,pos+n));buffer=buffer.subarray(pos+n);
    push({opcode,payload});
   }
  }
  socket.on('data',receive);socket.on('error',reject);
  socket.once('connect',()=>{
   const key=crypto.randomBytes(16).toString('base64');
   socket.write('GET /mavlink?token='+token+' HTTP/1.1\r\nHost: 127.0.0.1:'+port+'\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: '+key+'\r\nOrigin: https://satteliteofscience.github.io\r\n\r\n');
  });
 });
}
async function runIntegration(){
 const wsPort=await getFreePort(),token='test-token-'+crypto.randomBytes(12).toString('hex'),peer=dgram.createSocket('udp4');
 await new Promise((resolve,reject)=>{peer.once('error',reject);peer.bind(0,'127.0.0.1',resolve);});
 const udpListenPort=await getFreePort();
 const child=spawn(process.execPath,['tools/mavlink-bridge.cjs'],{env:{...process.env,ATLAS_BRIDGE_PORT:String(wsPort),ATLAS_BRIDGE_TOKEN:token},stdio:['ignore','pipe','pipe']});
 let stderr='';child.stderr.on('data',d=>{stderr+=d.toString();});
 let client=null;
 try{
  await new Promise((resolve,reject)=>{
   let buf='';const timer=setTimeout(()=>reject(Error('Bridge startup timeout: '+stderr)),8000);
   child.stdout.on('data',chunk=>{buf+=chunk.toString();if(buf.includes('bridge listening')){clearTimeout(timer);resolve();}});
   child.once('exit',code=>{clearTimeout(timer);reject(Error('Bridge exited '+code+' '+stderr));});
  });
  client=await webSocket(wsPort,token);
  client.send(1,JSON.stringify({mode:'udp-listen',host:'127.0.0.1',port:udpListenPort}));
  const ready=await client.wait(x=>x.opcode===1);
  assert.equal(JSON.parse(ready.payload.toString()).type,'ready');
  const bytes=Buffer.from([0xfd,0x01,0x02,0x03]);
  peer.send(bytes,udpListenPort,'127.0.0.1');
  const message=await client.wait(x=>x.opcode===2);
  assert.deepEqual(message.payload,bytes,'UDP incoming MAVLink bytes should reach WebSocket');
  const outgoing=Buffer.from([0xfe,0x11,0x22]);
  const reply=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('UDP roundtrip timeout')),5000);peer.once('message',data=>{clearTimeout(timeout);resolve(data);});});
  client.send(2,outgoing);
  assert.deepEqual(await reply,outgoing,'WebSocket MAVLink bytes should reach UDP peer');
  // Reconfigure through new authenticated sessions: UDP target and TCP client.
  client.close();client=null;await new Promise(resolve=>setTimeout(resolve,700));
  const udpTarget=dgram.createSocket('udp4');
  await new Promise(resolve=>udpTarget.bind(0,'127.0.0.1',resolve));
  try{
   udpTarget.on('message',(bytes,rinfo)=>udpTarget.send(bytes,rinfo.port,rinfo.address));
   client=await webSocket(wsPort,token);
   client.send(1,JSON.stringify({mode:'udp-target',host:'127.0.0.1',port:udpTarget.address().port}));
   assert.equal(JSON.parse((await client.wait(x=>x.opcode===1)).payload.toString()).type,'ready');
   client.send(2,Buffer.from([11,22,33]));
   assert.deepEqual((await client.wait(x=>x.opcode===2)).payload,Buffer.from([11,22,33]),'UDP target must pass MAVLink both ways');
  }finally{client?.close();client=null;udpTarget.close();}
  await new Promise(resolve=>setTimeout(resolve,700));
  const tcpServer=net.createServer(socket=>socket.on('data',data=>socket.write(data)));
  await new Promise(resolve=>tcpServer.listen(0,'127.0.0.1',resolve));
  try{
   client=await webSocket(wsPort,token);
   client.send(1,JSON.stringify({mode:'tcp-client',host:'127.0.0.1',port:tcpServer.address().port}));
   assert.equal(JSON.parse((await client.wait(x=>x.opcode===1)).payload.toString()).type,'ready');
   client.send(2,Buffer.from([0xfd,0xab,0x03]));
   assert.deepEqual((await client.wait(x=>x.opcode===2)).payload,Buffer.from([0xfd,0xab,0x03]),'TCP client must pass MAVLink both ways');
  }finally{client?.close();client=null;tcpServer.close();}
  console.log('PASS: authenticated bridge, UDP listen, UDP target, TCP client, full imports and battery math');
 }finally{
  client?.close();peer.close();child.kill('SIGTERM');
 }
}
runIntegration().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
