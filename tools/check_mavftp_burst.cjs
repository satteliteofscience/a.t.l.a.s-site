/* MAVFTP burst streaming, missing block recovery, fallback and AHRS status tests. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const ftp=require('../mavftp-param.js');
const read=p=>fs.readFileSync(p,'utf8');
const CHUNK=110;
function packedParams(count=180,shortNames=false,withDefaults=false){
 const header=Buffer.alloc(6);header.writeUInt16LE(withDefaults?0x671c:0x671b,0);header.writeUInt16LE(count,2);header.writeUInt16LE(count,4);
 const parts=[header];
 for(let i=0;i<count;i++){
  const name=Buffer.from(shortNames?'P'+String(i).padStart(4,'0'):'PARAM_'+String(i).padStart(4,'0'),'ascii');
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
function makeServer({dropOnce=null,disableBurst=false,dropGapRead=false,silentBackpressure=false,count=180,shortNames=false,omitEofNak=false,rejectCompact=false,badCompactMagic=false}={}){
 const data=packedParams(count,shortNames,rejectCompact||badCompactMagic);
 const counters={open:0,burst:0,read:0,missingRepaired:false},progress=[],stages=[];
 const delayed=[];
 let client;
 function schedule(msg,ms=0){delayed.push(setTimeout(()=>client.handle(msg),ms));}
 const send=async raw=>{
  const q=parseRequest(raw),seq=(q.seq+1)&65535;
  if(q.opcode===4){
   counters.open++;
   const filename=Buffer.from(q.data).toString();
   assert.ok(['@PARAM/param.pck?withdefaults=0','@PARAM/param.pck?withdefaults=1'].includes(filename),'MAVFTP must only open compact or stable packed formats');
   if(rejectCompact&&filename.endsWith('=0')){
    schedule(reply(seq,0,129,4,0,[7]));return;
   }
   assert.equal(filename,'@PARAM/param.pck?withdefaults='+(rejectCompact||badCompactMagic&&counters.open>1?'1':'0'));
   // The real ArduPilot virtual file returns a size ESTIMATE: param_count*12.
   // For a short-name 1338-param file the true payload is smaller.
   const estimate=Buffer.alloc(4);estimate.writeUInt32LE(count*12);
   schedule(reply(seq,1,128,4,0,estimate));return;
  }
  if(q.opcode===15){
   counters.burst++;assert.equal(q.size,CHUNK);
   if(dropGapRead&&q.offset===dropOnce)counters.missingRepaired=true;
   if(disableBurst){schedule(reply(seq,1,129,15,q.offset,[7]));return;}
   if(q.offset>=data.length){schedule(reply(seq,1,129,15,q.offset,[6]));return;}
   let sent=0,replySeq=seq,p=q.offset;
   while(p<data.length&&sent<(silentBackpressure?2:3)){
    const bytes=data.subarray(p,p+CHUNK);
    const skip=dropOnce!==null&&p===dropOnce&&!counters.missingRepaired;
    // Even when a block is dropped, the server advances to the next offset.
    const isLast=sent===2&&p+bytes.length<data.length;
    if(!skip)schedule(reply(replySeq,1,128,15,p,bytes,isLast),sent*2);
    p+=bytes.length;replySeq++;sent++;
   }
   if(p>=data.length&&!silentBackpressure&&!omitEofNak)schedule(reply(replySeq,1,129,15,p,[6]),sent*2);
   return;
  }
  if(q.opcode===5){
   counters.read++;assert.equal(q.size,CHUNK,'all reads on a packed parameter file must use the same 110-byte size');
   if(dropGapRead&&q.offset===dropOnce)return; // emulate a station dropping isolated ReadFile replies
   if(q.offset===dropOnce)counters.missingRepaired=true;
   if(q.offset>=data.length){if(!omitEofNak)schedule(reply(seq,1,129,5,q.offset,[6]));}
   else schedule(reply(seq,1,128,5,q.offset,data.subarray(q.offset,q.offset+CHUNK)));
   return;
  }
  if(q.opcode===1)return;
  throw Error('Unexpected MAVFTP operation '+q.opcode);
 };
 client=new ftp.Client({send,preferBurst:true,timeoutMs:500,burstIdleMs:silentBackpressure?30:900,maxRetries:1,maxTimeMs:15000,onProgress:(bytes,method)=>progress.push({bytes,method}),onStage:(stage,reason)=>stages.push({stage,reason})});
 return {client,counters,data,progress,stages,dispose:()=>delayed.forEach(clearTimeout)};
}
async function testBurst(){
 const s=makeServer();
 try{
  const rows=await s.client.download();
  assert.equal(rows.length,180);
  assert.equal(rows[179].value,179.5);
  assert.equal(s.client.lastMethod,'MAVFTP BURST');
  assert.equal(s.client.lastDefaults,0);
  assert.equal(s.client.lastBytes,s.data.length,'record exactly the downloaded packed bytes');
  assert.ok(s.client.lastDurationMs>0,'record real download time');
  assert.ok(s.counters.burst>=2);
  assert.equal(s.counters.read,0,'healthy burst uses zero sequential per-block reads');
  assert.ok(s.progress.some(x=>x.bytes>0&&x.method==='MAVFTP BURST'),
   'progress must be reported as soon as burst packets arrive, before a whole file completes');
  assert.ok(s.stages.some(x=>x.stage==='OPEN')&&s.stages.some(x=>x.stage==='BURST')&&s.stages.some(x=>x.stage==='DONE'),
   'OPEN, BURST and DONE stages must be observable');
 }finally{s.dispose();}
}
async function testCompactUnavailableUsesStableFullFormat(){
 const s=makeServer({rejectCompact:true});
 try{
  const rows=await s.client.download();
  assert.equal(rows.length,180,'fallback must still decode all parameters');
  assert.equal(s.client.lastDefaults,1,'fallback should use the previous withdefaults=1 source');
  assert.equal(s.client.lastMethod,'MAVFTP BURST');
  assert.equal(s.counters.open,2,'compact attempt then known-good format');
  assert.ok(s.client.lastCompactError?.includes('unsupported'),'reason for compact fallback must be recorded');
  assert.equal(s.client.lastBytes,s.data.length);
 }finally{s.dispose();}
}
async function testControllerIgnoresCompactFormat(){
 const s=makeServer({badCompactMagic:true});
 try{
  const rows=await s.client.download();
  assert.equal(rows.length,180);
  assert.equal(s.counters.open,2,'compact header mismatch should retry the original format');
  assert.equal(s.client.lastDefaults,1,'only verified full-file format should be marked successful');
  assert.ok(s.client.lastCompactError?.includes('not honored'),'compact-format mismatch must be diagnosed');
  assert.equal(s.client.lastBytes,s.data.length);
 }finally{s.dispose();}
}
async function testShortFinalBlockWithoutEofNak(){
 // Regression for the real FC: 1338 parameters -> advertised 16056 bytes,
 // but the packed file can finish much earlier, e.g. at roughly 14.7kB.
 // The ground-station bridge never delivers an explicit EOF NAK.
 const s=makeServer({count:1338,shortNames:true,omitEofNak:true});
 try{
  assert.ok(s.data.length<1338*12,'virtual AP_Filesystem_Param size must be only an estimate');
  assert.ok(s.data.length>14000&&s.data.length<16056);
  assert.notEqual(s.data.length%CHUNK,0,'final success block must be short');
  const rows=await s.client.download();
  assert.equal(rows.length,1338);
  assert.equal(rows[1337].value,1337.5);
  assert.equal(s.client.lastMethod,'MAVFTP BURST');
  assert.equal(s.counters.read,0,'no extra ReadFile at estimated size');
 }finally{s.dispose();}
}
async function testSequentialShortFinalBlockWithoutEofNak(){
 const s=makeServer({count:1338,shortNames:true,disableBurst:true,omitEofNak:true});
 try{
  const rows=await s.client.download();
  assert.equal(rows.length,1338,'read fallback must stop on a short final ACK too');
  assert.equal(s.client.lastMethod,'MAVFTP READ');
  assert.equal(s.client.lastFallback?.includes('NAK'),true);
 }finally{s.dispose();}
}
function testPartialDecodeIsRejected(){
 const data=packedParams(1338,true);
 assert.throws(()=>ftp.decodePacked(new Uint8Array(data.subarray(0,data.length-13))),
  /Truncated|Invalid|Unexpected|Duplicate/,
  'short-ACK EOF must not commit an incomplete parameter file');
}
async function testSilentBurstBackpressure(){
 // ArduPilot's GCS_FTP can stop pushing a burst without NAK, EOF, or
 // burst_complete when TX buffers fill. This is what 12s watchdogs hid.
 const s=makeServer({silentBackpressure:true});
 const started=Date.now();
 try{
  const rows=await s.client.download();
  assert.equal(rows.length,180,'must finish the complete packed file despite silent burst stops');
  assert.equal(s.client.lastMethod,'MAVFTP BURST');
  assert.ok(s.counters.burst>=10,'partial bursts must be resumed from the next offset');
  assert.equal(s.counters.read,0,'a contiguous silently stopped burst needs no individual ReadFile repairs');
  assert.ok(s.client.pausedBursts>=8,'short idle should detect repeated backpressure stops');
  assert.ok(s.stages.some(x=>x.stage==='BURST-PAUSE'));
  assert.ok(Date.now()-started<3000,'must not burn the overall 110s timer waiting 12s per partial burst');
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
async function testLostGapReadRecovery(){
 const s=makeServer({dropOnce:CHUNK,dropGapRead:true});
 try{
  const rows=await s.client.download();
  assert.equal(rows.length,180,'burst re-request should recover all parameters');
  assert.equal(s.client.lastMethod,'MAVFTP BURST','a lost isolated ReadFile should not force a whole-file restart');
  assert.ok(s.counters.read>=2,'initial ReadFile attempts really timed out');
  assert.ok(s.counters.missingRepaired,'resumed burst must request the missing offset');
  assert.ok(s.stages.some(x=>x.stage==='GAP-BURST-RETRY'),'gap recovery must be observable in diagnostics');
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
 await testBurst();await testCompactUnavailableUsesStableFullFormat();await testControllerIgnoresCompactFormat();await testShortFinalBlockWithoutEofNak();await testSequentialShortFinalBlockWithoutEofNak();testPartialDecodeIsRejected();await testSilentBurstBackpressure();await testLostBurstBlock();await testLostGapReadRecovery();await testUnsupportedBurstFallback();await testDelayedReadReply();await testTimeoutDiagnostics();
 const ui=read('configurator.js'),tests=read('tools/check_ahrs_nav_cache.cjs');
 assert.ok(ui.includes('preferBurst:true'),'TCP should request burst client');
 assert.ok(ui.includes('transfer.perf={durationMs:client.lastDurationMs'),'successful FTP reads should record measured performance');
 assert.ok(ui.includes('showParamPerf(x)'),'performance panel should update with actual transfer stats');
 const html=read('configurator.html'),css=read('configurator.css');
 for(const id of ['paramPerf','paramPerfTime','paramPerfSpeed','paramPerfBytes','paramPerfPauses','paramPerfMode'])
  assert.ok(html.includes('id="'+id+'"'),'missing visual performance metric '+id);
 assert.ok(css.includes('.cc-param-perf[hidden]'),'metrics must be invisible before a successful FTP read');
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