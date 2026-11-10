/* MAVFTP burst streaming, missing block recovery, fallback and AHRS status tests. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const ftp=require('../mavftp-param.js');
const read=p=>fs.readFileSync(p,'utf8');
const CHUNK=110;
function packedParams(count=180){
 const header=Buffer.alloc(6);header.writeUInt16LE(0x671c,0);header.writeUInt16LE(count,2);header.writeUInt16LE(count,4);
 const parts=[header];
 for(let i=0;i<count;i++){
  const name=Buffer.from('PARAM_'+String(i).padStart(4,'0'),'ascii');
  const entry=Buffer.alloc(2+name.length+4);
  entry[0]=4;entry[1]=(name.length-1)<<4;name.copy(entry,2);
  entry.writeFloatLE(i+0.5,2+name.length);parts.push(entry);
 }
 return Buffer.concat(parts);
}
function reply(seq,session,opcode,reqOpcode,offset,data=Buffer.alloc(0),complete=false){
 const bytes=Uint8Array.from(data);
 const b=new Uint8Array(12+bytes.length),v=new DataView(b.buffer);
 v.setUint16(0,seq&65535,true);
 b[2]=session;b[3]=opcode;b[4]=bytes.length;b[5]=reqOpcode;b[6]=complete?1:0;
 v.setUint32(8,offset,true);b.set(bytes,12);return b;
}
function parseRequest(raw){
 const v=new DataView(raw.buffer,raw.byteOffset,raw.byteLength);
 return {seq:v.getUint16(0,true),session:raw[2],opcode:raw[3],size:raw[4],offset:v.getUint32(8,true),data:raw.slice(12)};
}
function makeServer({dropOnce=null,disableBurst=false}={}){
 const data=packedParams();
 const counters={open:0,burst:0,read:0,missingRepaired:false},progress=[],stages=[];
 const delayed=[];
 let client;
 function schedule(msg,ms=0){delayed.push(setTimeout(()=>client.handle(msg),ms));}
 const send=async raw=>{
  const q=parseRequest(raw),seq=(q.seq+1)&65535;
  if(q.opcode===4){
   counters.open++;
   assert.equal(Buffer.from(q.data).toString(),'@PARAM/param.pck?withdefaults=1');
   const estimate=Buffer.alloc(4);estimate.writeUInt32LE(data.length+222);
   schedule(reply(seq,1,128,4,0,estimate));return;
  }
  if(q.opcode===15){
   counters.burst++;assert.equal(q.size,CHUNK);
   if(disableBurst){schedule(reply(seq,1,129,15,q.offset,[7]));return;}
   if(q.offset>=data.length){schedule(reply(seq,1,129,15,q.offset,[6]));return;}
   let sent=0,replySeq=seq,p=q.offset;
   while(p<data.length&&sent<3){
    const bytes=data.subarray(p,p+CHUNK);
    const skip=dropOnce!==null&&p===dropOnce&&!counters.missingRepaired;
    // Even when a block is dropped, the server advances to the next offset.
    const isLast=sent===2&&p+bytes.length<data.length;
    if(!skip)schedule(reply(replySeq,1,128,15,p,bytes,isLast),sent*2);
    p+=bytes.length;replySeq++;sent++;
   }
   if(p>=data.length)schedule(reply(replySeq,1,129,15,p,[6]),sent*2);
   return;
  }
  if(q.opcode===5){
   counters.read++;
   if(q.offset===dropOnce)counters.missingRepaired=true;
   if(q.offset>=data.length)schedule(reply(seq,1,129,5,q.offset,[6]));
   else schedule(reply(seq,1,128,5,q.offset,data.subarray(q.offset,q.offset+CHUNK)));
   return;
  }
  if(q.opcode===1)return;
  throw Error('Unexpected MAVFTP operation '+q.opcode);
 };
 client=new ftp.Client({send,preferBurst:true,timeoutMs:500,maxRetries:1,maxTimeMs:15000,onProgress:(bytes,method)=>progress.push({bytes,method}),onStage:(stage,reason)=>stages.push({stage,reason})});
 return {client,counters,data,progress,stages,dispose:()=>delayed.forEach(clearTimeout)};
}
async function testBurst(){
 const s=makeServer();
 try{
  const rows=await s.client.download();
  assert.equal(rows.length,180);
  assert.equal(rows[179].value,179.5);
  assert.equal(s.client.lastMethod,'MAVFTP BURST');
  assert.ok(s.counters.burst>=2);
  assert.equal(s.counters.read,0,'healthy burst uses zero sequential per-block reads');
  assert.ok(s.progress.some(x=>x.bytes>0&&x.method==='MAVFTP BURST'),
   'progress must be reported as soon as burst packets arrive, before a whole file completes');
  assert.ok(s.stages.some(x=>x.stage==='OPEN')&&s.stages.some(x=>x.stage==='BURST')&&s.stages.some(x=>x.stage==='DONE'),
   'OPEN, BURST and DONE stages must be observable');
 }finally{s.dispose();}
}
async function testLostBurstBlock(){
 const s=makeServer({dropOnce:CHUNK});
 try{
  const rows=await s.client.download();
  assert.equal(rows.length,180);
  assert.equal(s.client.lastMethod,'MAVFTP BURST');
  assert.ok(s.counters.missingRepaired,'missing offset recovered with ReadFile');
  assert.equal(s.counters.read,1,'only the missing packet should be requested');
 }finally{s.dispose();}
}
async function testDelayedReadReply(){
 const packed=packedParams(6);
 const timers=[];
 let client;
 const send=async raw=>{
  const q=parseRequest(raw),seq=(q.seq+1)&65535;
  if(q.opcode===4){
   const estimate=Buffer.alloc(4);estimate.writeUInt32LE(packed.length,0);
   timers.push(setTimeout(()=>client.handle(reply(seq,1,128,4,0,estimate)),5));
  }else if(q.opcode===5){
   const result=q.offset>=packed.length
    ?reply(seq,1,129,5,q.offset,[6])
    :reply(seq,1,128,5,q.offset,packed.subarray(q.offset,q.offset+CHUNK));
   // Simulate a busy ArduPilot bridge requiring more than the old 1.6s timeout.
   timers.push(setTimeout(()=>client.handle(result),q.offset===0?2100:5));
  }
 };
 client=new ftp.Client({send,preferBurst:false,maxRetries:1,maxTimeMs:15000});
 try{
  assert.equal(client.timeoutMs,6000,'TCP default timeout should tolerate congested links');
  const rows=await client.download();
  assert.equal(rows.length,6);
  assert.equal(client.lastMethod,'MAVFTP READ');
 }finally{timers.forEach(clearTimeout);}
}
async function testTimeoutDiagnostics(){
 let client;
 client=new ftp.Client({send:async()=>{},preferBurst:false,timeoutMs:30,maxRetries:0});
 await assert.rejects(client.request(5,{session:4,offset:956,size:CHUNK}),/opcode=5 · offset=956 · session=4 · replies=0/);
}
async function testUnsupportedBurstFallback(){
 const s=makeServer({disableBurst:true});
 try{
  const rows=await s.client.download();
  assert.equal(rows.length,180);
  assert.equal(s.client.lastMethod,'MAVFTP READ');
  assert.equal(s.counters.burst,1);
  assert.ok(s.counters.read>4,'server without burst uses old reliable reads');
  assert.ok(s.client.lastFallback?.includes('NAK'),'unsupported burst reason must remain available for diagnostics');
  assert.ok(s.stages.some(x=>x.stage==='BURST-FAILED'),'Burst-to-Read fallback must produce a stage marker');
 }finally{s.dispose();}
}
(async()=>{
 await testBurst();await testLostBurstBlock();await testUnsupportedBurstFallback();await testDelayedReadReply();await testTimeoutDiagnostics();
 const ui=read('configurator.js'),tests=read('tools/check_ahrs_nav_cache.cjs');
 assert.ok(ui.includes('preferBurst:true'),'TCP should request burst client');
 assert.ok(ui.includes("transfer.reader='MAVLink PARAM_VALUE'"),'fallback must identify real legacy mode');
 assert.ok(ui.includes("transfer.reader=client.lastMethod"),'finished mode should show actual method');
 assert.ok(ui.includes("const visible=info.label.endsWith(' · CFG')"),'AHRS status row should be concise');
 assert.ok(ui.includes('const title=info.label+'),'full AHRS provenance should remain in tooltip');
 assert.ok(ui.includes("const ftpActive=transfer?.phase==='ftp'"),'PARAM_VALUE messages must recognize the active FTP reader');
 assert.ok(ui.includes('if(transfer&&state.paramLoading&&!ftpActive)'),'simultaneous legacy PARAM_VALUE must not steal MAVFTP progress');
 assert.ok(ui.includes('transfer&&!ftpActive&&transfer.seen.size>=state.paramCount'),'competing PARAM_VALUE must not complete MAVFTP prematurely');
 assert.ok(ui.includes("toast('MAVFTP failed"),'FTP errors must remain visible after legacy fallback');
 assert.ok(ui.includes('paramFtpError:state.paramTransfer?.ftpError'),'diagnostic API must retain the FTP fallback reason');
 assert.ok(tests.includes('configured-only'),'existing AHRS verification tests must be preserved');
 console.log('PASS: MAVFTP burst, lost-packet recovery, unsupported burst fallback, mode diagnostics and concise AHRS status');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});