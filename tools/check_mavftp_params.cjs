'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),ftp=require('../mavftp-param.js');
const read=path=>fs.readFileSync(path,'utf8');
const rawHeader=(seq,session,opcode,reqOpcode,offset,data)=>{
 const b=new Uint8Array(12+data.length),v=new DataView(b.buffer);
 v.setUint16(0,seq,true);b[2]=session;b[3]=opcode;b[4]=data.length;b[5]=reqOpcode;
 v.setUint32(8,offset,true);b.set(data,12);return b;
};
function samplePacked(){
 const chunks=[],hdr=new Uint8Array(6),h=new DataView(hdr.buffer);h.setUint16(0,0x671c,true);h.setUint16(2,4,true);h.setUint16(4,4,true);
 chunks.push(hdr);let prev='';
 const entries=[['AIRSPEED_MIN',9,4],['AIRSPEED_MAX',22,4],['INS_TCAL1_ENABLE',2,3],['SERVO1_REVERSED',1,1]];
 for(let i=0;i<entries.length;i++){
  const [name,value,type]=entries[i];let common=0;while(common<15&&name[common]===prev[common])common++;
  const suffix=name.slice(common),flags=i===0?1:0;
  const data=new Uint8Array(2+suffix.length+(type===1?1:4)*(1+flags)),v=new DataView(data.buffer);
  data[0]=type|(flags<<4);data[1]=common|((suffix.length-1)<<4);
  data.set(Buffer.from(suffix,'ascii'),2);
  const offset=2+suffix.length;
  if(type===1)v.setInt8(offset,value);else if(type===3)v.setInt32(offset,value,true);else v.setFloat32(offset,value,true);
  if(flags)v.setFloat32(offset+4,10,true);
  chunks.push(data);prev=name;
 }
 return Buffer.concat(chunks.map(x=>Buffer.from(x)));
}
(async()=>{
 const packed=samplePacked(),items=ftp.decodePacked(packed);
 assert.equal(items.length,4);
 assert.deepEqual(items.map(x=>x.name),['AIRSPEED_MIN','AIRSPEED_MAX','INS_TCAL1_ENABLE','SERVO1_REVERSED']);
 assert.equal(items[0].value,9);assert.equal(items[0].type,9);
 assert.equal(items[2].value,2);assert.equal(items[2].type,6);
 assert.equal(items[3].type,2);
 assert.throws(()=>ftp.decodePacked(packed.subarray(0,packed.length-1)),/Truncated|Invalid/);
 const invalid=Buffer.from(packed);invalid[0]=0;
 assert.throws(()=>ftp.decodePacked(invalid),/header/);
 let client,requests=0,reads=0,termination=false;
 client=new ftp.Client({
  timeoutMs:100,maxRetries:2,
  onProgress:bytes=>assert.ok(bytes>0),
  send:async request=>{
   requests++;const req=ftp.response(request);
   assert.equal(req.opcode===5?req.size:0,req.opcode===5?239:0);
   let response;
   if(req.opcode===4){
    assert.equal(Buffer.from(req.data).toString(),'@PARAM/param.pck?withdefaults=1');
    const estimate=Buffer.alloc(4);estimate.writeUInt32LE(999999); // not the file size
    response=rawHeader(req.seq,1,128,4,0,estimate);
   }else if(req.opcode===5){
    reads++;
    if(req.offset>=packed.length)response=rawHeader(req.seq,1,129,5,req.offset,Uint8Array.of(6));
    else response=rawHeader(req.seq,1,128,5,req.offset,packed.subarray(req.offset,req.offset+239));
   }else if(req.opcode===1){termination=true;return;}
   else throw Error('Unsupported FTP request '+req.opcode);
   setTimeout(()=>client.handle(response),1);
  }
 });
 const downloaded=await client.download();
 assert.equal(downloaded.length,items.length);
 assert.equal(reads,2,'must read through EOF NAK, not use the estimated OpenFileRO length');
 assert.ok(termination);
 assert.equal(client.session,null);
 assert.deepEqual(items.map(x=>x.value),downloaded.map(x=>x.value));
 let failureClient,ftpAttempts=0;
 failureClient=new ftp.Client({timeoutMs:20,maxRetries:1,
  send:async request=>{
   ftpAttempts++;
   const req=ftp.response(request);
   if(req.opcode===4)setTimeout(()=>failureClient.handle(rawHeader(req.seq,0,129,4,0,Uint8Array.of(10))),1);
  }
 });
 await assert.rejects(failureClient.download(),/unsupported/);
 assert.equal(ftpAttempts,1,'unsupported FTP should trigger immediate fallback, no request storm');
 const full=read('configurator.js'),html=read('configurator.html'),mav=read('mavlink.js');
 assert.match(html,/<script src="mavftp-param.js" defer><\/script>/,'fast reader must be loaded before main configurator');
 assert.match(full,/if\(!startFastParamStream\(transfer\)\)startLegacyParamStream\(transfer\)/,'unsupported mode must keep the legacy path');
 assert.match(full,/startLegacyParamStream\(transfer\);\s*\}\);/,'failed FTP must fall back automatically');
 assert.match(full,/state\.params=new Map\(rows\.map/,'parameter cache must be replaced only after a fully valid packed download');
 assert.match(full,/else if\(data\.type==='mavftp'\)\{state\.ftpClient\?\.handle\(data\.data\);\}/,'MAVFTP replies must enter the active client');
 assert.match(full,/state\.ftpClient\?\.cancel\(\)/,'session must be cancelled on disconnect');
 assert.match(mav,/new Uint8Array\(3\+header\.length\)/,'MAVLink2 outbound FTP must not waste 240 zero bytes on read requests');
 console.log('PASS: packed MAVFTP decode, type mapping, full read with unreliable file estimate, unsupported fallback and release integration.');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
