/* A.T.L.A.S. MAVFTP parameter reader.
 * Read-only @PARAM/param.pck virtual file, checked and decoded atomically.
 * The normal PARAM_REQUEST_LIST path remains available as fallback.
 */
(function(root,factory){
 'use strict';
 const exposed=factory();
 if(typeof module==='object'&&module.exports)module.exports=exposed;
 if(root)root.AtlasMavFtpParams=exposed;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const MAGIC_VALUES=0x671b,MAGIC_DEFAULTS=0x671c,CHUNK=239,MAX_BYTES=1024*1024,MAX_PARAMS=8192;
 const enc=new TextEncoder(),dec=new TextDecoder('ascii',{fatal:true});
 function packet(seq,opcode,session=0,offset=0,size=0,data=new Uint8Array()){
  if(data.length>CHUNK||!Number.isInteger(seq)||!Number.isInteger(offset)||offset<0)throw Error('Invalid MAVFTP request');
  const b=new Uint8Array(12+data.length),v=new DataView(b.buffer);
  v.setUint16(0,seq&65535,true);b[2]=session&255;b[3]=opcode;b[4]=size;b[5]=0;b[6]=0;b[7]=0;
  v.setUint32(8,offset,true);b.set(data,12);return b;
 }
 function response(bytes){
  if(!(bytes instanceof Uint8Array)||bytes.length<12)return null;
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const size=bytes[4];
  if(size>CHUNK||12+size>bytes.length)return null;
  return {seq:v.getUint16(0,true),session:bytes[2],opcode:bytes[3],size,reqOpcode:bytes[5],burstComplete:!!bytes[6],
   offset:v.getUint32(8,true),data:bytes.subarray(12,12+size)};
 }
 function decodePacked(bytes){
  if(!(bytes instanceof Uint8Array)||bytes.length<6)throw Error('Missing packed parameter header');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const magic=view.getUint16(0,true),count=view.getUint16(2,true),total=view.getUint16(4,true);
  if(![MAGIC_VALUES,MAGIC_DEFAULTS].includes(magic)||count<1||count>MAX_PARAMS||count!==total)throw Error('Invalid or incomplete MAVFTP parameter header');
  const out=[],names=new Set();let offset=6,prior='';
  for(let i=0;i<count;i++){
   while(offset<bytes.length&&bytes[offset]===0)offset++;
   if(offset+2>bytes.length)throw Error('Truncated parameter entry '+i);
   const first=bytes[offset++],second=bytes[offset++],type=first&15,flags=first>>4;
   if(![1,2,3,4].includes(type)||(flags&~1)!==0)throw Error('Unsupported packed parameter type/flags');
   const shared=second&15,suffixLen=(second>>4)+1,byteLen={1:1,2:2,3:4,4:4}[type];
   if(shared>prior.length||shared+suffixLen>16||offset+suffixLen+byteLen*(1+(flags&1))>bytes.length)throw Error('Invalid packed parameter name or length');
   const suffix=dec.decode(bytes.subarray(offset,offset+suffixLen));offset+=suffixLen;
   const name=prior.slice(0,shared)+suffix;
   if(!/^[A-Z][A-Z0-9_]{0,15}$/.test(name)||names.has(name))throw Error('Duplicate/invalid packed parameter '+name);
   let value;
   if(type===1)value=view.getInt8(offset);
   else if(type===2)value=view.getInt16(offset,true);
   else if(type===3)value=view.getInt32(offset,true);
   else value=view.getFloat32(offset,true);
   offset+=byteLen;
   if(flags&1)offset+=byteLen;
   if(!Number.isFinite(value))throw Error('Invalid numeric parameter '+name);
   // AP_Param native enum -> MAV_PARAM_TYPE for the existing PARAM_SET writer.
   const paramType={1:2,2:4,3:6,4:9}[type];
   out.push({name,value,type:paramType,index:i});names.add(name);prior=name;
  }
  // Some ArduPilot versions pad trailing entries to the read boundary.
  if(bytes.length-offset>CHUNK||bytes.subarray(offset).some(b=>b!==0))throw Error('Unexpected packed parameter tail');
  return out;
 }
 class Client{
  constructor({send,onProgress,timeoutMs=1600,maxRetries=4,maxTimeMs=110000}){
   if(typeof send!=='function')throw Error('MAVFTP send callback required');
   this.send=send;this.onProgress=onProgress||(()=>{});this.timeoutMs=timeoutMs;
   this.maxRetries=maxRetries;this.maxTimeMs=maxTimeMs;this.seq=1;this.waiting=null;this.closed=false;this.session=null;
  }
  handle(raw){
   const result=response(raw),wait=this.waiting;
   if(!result||!wait||this.closed||result.reqOpcode!==wait.opcode)return false;
   if(wait.session!==null&&result.session!==wait.session)return false;
   if(result.opcode!==128&&result.opcode!==129)return false;
   if(wait.opcode===5&&result.offset!==wait.offset)return false;
   // PX4/ArduPilot may differ in whether the response sequence is request seq+1.
   if(result.seq!==wait.seq && result.seq!==((wait.seq+1)&65535))return false;
   clearTimeout(wait.timer);this.waiting=null;wait.resolve(result);return true;
  }
  async request(opcode,{session=0,offset=0,size=0,data=new Uint8Array(),ignoreReply=false}={}){
   if(this.closed)throw Error('MAVFTP cancelled');
   const seq=(this.seq++&65535),bytes=packet(seq,opcode,session,offset,size,data);
   if(ignoreReply){await this.send(bytes);return null;}
   for(let attempt=0;attempt<=this.maxRetries;attempt++){
    if(this.closed)throw Error('MAVFTP cancelled');
    const wait=new Promise((resolve,reject)=>{
     const holder={opcode,session:opcode===4?null:session,offset,seq,resolve,reject,timer:null};
     holder.timer=setTimeout(()=>{if(this.waiting===holder)this.waiting=null;reject(Error('MAVFTP response timeout'));},this.timeoutMs);
     this.waiting=holder;
    });
    try{
     await this.send(bytes);
     return await wait;
    }catch(error){
     if(this.waiting){clearTimeout(this.waiting.timer);this.waiting=null;}
     if(attempt>=this.maxRetries)throw error;
    }
   }
   throw Error('MAVFTP attempts exhausted');
  }
  cancel(){
   this.closed=true;
   if(this.waiting){const w=this.waiting;this.waiting=null;clearTimeout(w.timer);w.reject(Error('MAVFTP cancelled'));}
  }
  async download(){
   if(this.closed)throw Error('MAVFTP cancelled');
   let session=null;const started=Date.now();
   try{
    const opened=await this.request(4,{data:enc.encode('@PARAM/param.pck?withdefaults=1'),size:enc.encode('@PARAM/param.pck?withdefaults=1').length});
    if(opened.opcode!==128||opened.size<4)throw Error('MAVFTP parameter file unsupported (NAK '+(opened.data[0]??'?')+')');
    session=opened.session;this.session=session;
    const chunks=[];let offset=0;
    for(;;){
     if(Date.now()-started>this.maxTimeMs)throw Error('MAVFTP full read timeout');
     if(offset>MAX_BYTES)throw Error('Oversized MAVFTP parameter file');
     const reply=await this.request(5,{session,offset,size:CHUNK});
     if(reply.opcode===129){
      if(reply.data[0]!==6)throw Error('MAVFTP read failed (NAK '+reply.data[0]+')');
      break;
     }
     if(reply.size<1||reply.size>CHUNK)throw Error('Invalid MAVFTP read block');
     chunks.push(reply.data.slice());offset+=reply.size;this.onProgress(offset);
     // EOF is determined by the server, never from its estimated OpenFileRO size.
    }
    const bytes=new Uint8Array(offset);let cursor=0;
    for(const c of chunks){bytes.set(c,cursor);cursor+=c.length;}
    return decodePacked(bytes);
   }finally{
    if(session!==null&&!this.closed){
     try{await this.request(1,{session,ignoreReply:true});}catch{}
    }
    this.session=null;
   }
  }
 }
 return Object.freeze({packet,response,decodePacked,Client});
});
