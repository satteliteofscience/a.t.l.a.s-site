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
 // Mission Planner uses 110-byte burst/read blocks for @PARAM/param.pck.
 // Keep the MAVFTP wire payload maximum (239) separate from the chosen read size.
 // ArduPilot requires the same block size for every read on one open @PARAM handle.
 const MAGIC_VALUES=0x671b,MAGIC_DEFAULTS=0x671c,MAX_PAYLOAD=239,CHUNK=110,MAX_BYTES=1024*1024,MAX_PARAMS=8192;
 const enc=new TextEncoder(),dec=new TextDecoder('ascii',{fatal:true});
 function packet(seq,opcode,session=0,offset=0,size=0,data=new Uint8Array()){
  if(data.length>MAX_PAYLOAD||!Number.isInteger(seq)||!Number.isInteger(offset)||offset<0)throw Error('Invalid MAVFTP request');
  const b=new Uint8Array(12+data.length),v=new DataView(b.buffer);
  v.setUint16(0,seq&65535,true);b[2]=session&255;b[3]=opcode;b[4]=size;b[5]=0;b[6]=0;b[7]=0;
  v.setUint32(8,offset,true);b.set(data,12);return b;
 }
 function response(bytes){
  if(!(bytes instanceof Uint8Array)||bytes.length<12)return null;
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const size=bytes[4];
  if(size>MAX_PAYLOAD)return null;
  // MAVLink 2 legally trims trailing zeroes from FILE_TRANSFER_PROTOCOL.
  // The inner FTP size is authoritative: CRC already checked the outer frame.
  const data=new Uint8Array(size);
  data.set(bytes.subarray(12,Math.min(bytes.length,12+size)));
  return {seq:v.getUint16(0,true),session:bytes[2],opcode:bytes[3],size,reqOpcode:bytes[5],burstComplete:!!bytes[6],
   offset:v.getUint32(8,true),data};
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
  if(bytes.length-offset>MAX_PAYLOAD||bytes.subarray(offset).some(b=>b!==0))throw Error('Unexpected packed parameter tail');
  return out;
 }
 class Client{
  constructor({send,onProgress,onStage,timeoutMs=6000,maxRetries=3,maxTimeMs=110000,preferBurst=false}){
   if(typeof send!=='function')throw Error('MAVFTP send callback required');
   this.send=send;this.onProgress=onProgress||(()=>{});this.onStage=onStage||(()=>{});this.timeoutMs=timeoutMs;
   this.maxRetries=maxRetries;this.maxTimeMs=maxTimeMs;this.seq=1;this.waiting=null;this.burst=null;this.closed=false;this.session=null;this.preferBurst=preferBurst;this.lastMethod=null;this.lastFallback=null;this.responses=0;this.burstFrames=0;this.burstReceivedBytes=0;this.lastProgressAt=0;this.stage='idle';
  }
  handle(raw){
   const result=response(raw);
   if(!result||this.closed)return false;
   this.responses++;
   const burst=this.burst;
   if(burst&&result.reqOpcode===15&&result.session===burst.session){
    // Burst replies increment the FTP sequence, unlike one-shot ReadFile.
    // Reject stale responses and replies outside the requested file range.
    const delta=(result.seq-burst.seq+65536)%65536;
    if(delta>4096||result.offset<burst.offset||result.offset>MAX_BYTES)return false;
    if(result.opcode===129){
     if(result.data[0]===6)burst.finish(null,result.offset);
     else burst.finish(Error('MAVFTP burst NAK '+(result.data[0]??'?')));
     return true;
    }
    if(result.opcode!==128||result.size<1)return false;
    const previous=burst.frames.get(result.offset);
    if(previous&&(previous.length!==result.size||previous.some((byte,i)=>byte!==result.data[i]))){
     burst.finish(Error('Inconsistent MAVFTP burst block at '+result.offset));return true;
    }
    if(!previous){
     this.burstFrames++;this.burstReceivedBytes+=result.size;
     burst.frames.set(result.offset,result.data.slice());
     // A real ArduPilot burst can contain the entire packed parameter file.
     // Report received bytes while the stream is live, not only after EOF.
     const now=Date.now();
     if(now-this.lastProgressAt>=120||result.burstComplete){
      this.lastProgressAt=now;this.onProgress(this.burstReceivedBytes,'MAVFTP BURST');
     }
    }
    if(result.burstComplete)burst.finish(null,null);
    else burst.watchdog();
    return true;
   }
   const wait=this.waiting;
   if(!wait||result.reqOpcode!==wait.opcode)return false;
   if(wait.session!==null&&result.session!==wait.session)return false;
   if(result.opcode!==128&&result.opcode!==129)return false;
   if(wait.opcode===5&&result.offset!==wait.offset)return false;
   // PX4/ArduPilot may differ in whether the response sequence is request seq+1.
   if(result.seq!==wait.seq && result.seq!==((wait.seq+1)&65535))return false;
   clearTimeout(wait.timer);this.waiting=null;wait.resolve(result);return true;
  }
  async request(opcode,{session=0,offset=0,size=0,data=new Uint8Array(),ignoreReply=false,retries=this.maxRetries}={}){
   if(this.closed)throw Error('MAVFTP cancelled');
   const seq=(this.seq++&65535),bytes=packet(seq,opcode,session,offset,size,data);
   if(ignoreReply){await this.send(bytes);return null;}
   for(let attempt=0;attempt<=retries;attempt++){
    if(this.closed)throw Error('MAVFTP cancelled');
    const wait=new Promise((resolve,reject)=>{
     const holder={opcode,session:opcode===4?null:session,offset,seq,resolve,reject,timer:null};
     holder.timer=setTimeout(()=>{if(this.waiting===holder)this.waiting=null;reject(Error(`MAVFTP response timeout · opcode=${opcode} · offset=${offset} · session=${session} · replies=${this.responses}`));},this.timeoutMs);
     this.waiting=holder;
    });
    wait.catch(()=>{}); // absorb timeout if transport send fails before the waiter is awaited
    try{
     await this.send(bytes);
     return await wait;
    }catch(error){
     if(this.waiting){clearTimeout(this.waiting.timer);this.waiting=null;}
     if(attempt>=retries)throw error;
    }
   }
   throw Error('MAVFTP attempts exhausted');
  }
  cancel(){
   this.closed=true;
   if(this.burst)this.burst.finish(Error('MAVFTP cancelled'));
   if(this.waiting){const w=this.waiting;this.waiting=null;clearTimeout(w.timer);w.reject(Error('MAVFTP cancelled'));}
  }
  async burstRead(session,offset){
   if(this.closed)throw Error('MAVFTP cancelled');
   if(this.waiting||this.burst)throw Error('Overlapping MAVFTP requests');
   const seq=(this.seq++&65535);
   return new Promise((resolve,reject)=>{
    const burst={session,offset,seq,frames:new Map(),timer:null};
    burst.finish=(error,eofOffset=null)=>{
     if(this.burst!==burst)return;
     clearTimeout(burst.timer);this.burst=null;
     if(error)reject(error);
     else resolve({frames:burst.frames,eofOffset,timedOut:false});
    };
    burst.watchdog=()=>{
     clearTimeout(burst.timer);
     burst.timer=setTimeout(()=>{
      if(this.burst!==burst)return;
      // A burst can stop early when output buffers fill. Keep the confirmed
      // blocks and recover the next missing offset through ReadFile.
      const frames=burst.frames;this.burst=null;
      resolve({frames,eofOffset:null,timedOut:true});
     },Math.max(1200,this.timeoutMs*2));
    };
    this.burst=burst;burst.watchdog();
    Promise.resolve(this.send(packet(seq,15,session,offset,CHUNK))).catch(error=>burst.finish(error));
   });
  }
  async readSequential(session,started){
   this.stage='read';this.onStage('READ');
   const chunks=[];let offset=0;
   for(;;){
    if(this.closed)throw Error('MAVFTP cancelled');
    if(Date.now()-started>this.maxTimeMs)throw Error('MAVFTP full read timeout');
    if(offset>MAX_BYTES)throw Error('Oversized MAVFTP parameter file');
    const reply=await this.request(5,{session,offset,size:CHUNK});
    if(reply.opcode===129){
     if(reply.data[0]!==6)throw Error('MAVFTP read failed · offset='+offset+' · NAK '+reply.data[0]);
     break;
    }
    if(reply.size<1||reply.size>CHUNK)throw Error('Invalid MAVFTP read block');
    chunks.push(reply.data.slice());offset+=reply.size;this.onProgress(offset,'MAVFTP READ');
   }
   return Client.joinChunks(chunks,offset);
  }
  static joinChunks(chunks,total){
   const bytes=new Uint8Array(total);let pos=0;
   for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.length;}
   return bytes;
  }
  async readBurst(session,started){
   this.stage='burst';this.onStage('BURST');
   const chunks=[],saved=new Map();let offset=0,eofOffset=null,retries=0;
   // Only one outstanding operation. BurstReadFile is used for throughput,
   // ReadFile fills gaps if a burst packet is lost or the server stalls.
   while(true){
    if(this.closed)throw Error('MAVFTP cancelled');
    if(Date.now()-started>this.maxTimeMs)throw Error('MAVFTP full read timeout');
    if(offset>=MAX_BYTES)throw Error('Oversized MAVFTP parameter file');
    const before=offset;
    const future=[...saved.keys()].some(k=>k>offset);
    const mergeBurst=batch=>{
     for(const [position,bytes] of batch.frames){
      if(position<offset||position+bytes.length>MAX_BYTES||bytes.length>CHUNK)throw Error('Invalid MAVFTP burst offset/size');
      const old=saved.get(position);
      if(old&&(old.length!==bytes.length||old.some((b,i)=>b!==bytes[i])))throw Error('Conflicting MAVFTP burst data');
      saved.set(position,bytes);
     }
     if(batch.eofOffset!==null){
      if(eofOffset!==null&&eofOffset!==batch.eofOffset)throw Error('Conflicting MAVFTP EOF');
      eofOffset=batch.eofOffset;
     }
    };
    if(future||eofOffset!==null){
     try{
      // Recover an isolated missing block first, using the same 110-byte size.
      const reply=await this.request(5,{session,offset,size:CHUNK,retries:1});
      if(reply.opcode===129){
       if(reply.data[0]!==6)throw Error('MAVFTP gap repair failed · offset='+offset+' · NAK '+reply.data[0]);
       eofOffset=offset;
      }else{
       if(reply.size<1||reply.size>CHUNK)throw Error('Invalid MAVFTP gap block');
       saved.set(offset,reply.data.slice());
      }
     }catch(error){
      if(!String(error.message).includes('MAVFTP response timeout'))throw error;
      // If the bridge fails to deliver a ReadFile answer, re-request just
      // this missing offset via BurstReadFile instead of restarting all 16k.
      this.onStage('GAP-BURST-RETRY','offset='+offset);
      mergeBurst(await this.burstRead(session,offset));
     }
    }else{
     const batch=await this.burstRead(session,offset);
     mergeBurst(batch);
     if(batch.timedOut&&!batch.frames.size)retries++;
    }
    while(saved.has(offset)){
     const chunk=saved.get(offset);saved.delete(offset);
     chunks.push(chunk);offset+=chunk.length;
    }
    if(offset!==before){retries=0;this.onProgress(Math.max(offset,this.burstReceivedBytes),'MAVFTP BURST');}
    else if(++retries>=3)throw Error('MAVFTP burst stalled at '+offset);
    if(eofOffset!==null){
     if(offset>eofOffset)throw Error('MAVFTP data after EOF');
     if(offset===eofOffset)return Client.joinChunks(chunks,offset);
    }
    // A lost packet can leave later blocks buffered. Repair the missing
    // block in the next iteration rather than discarding downloaded bytes.
   }
  }
  async download(){
   if(this.closed)throw Error('MAVFTP cancelled');
   let session=null;const started=Date.now();
   try{
    this.stage='open';this.onStage('OPEN');
    const filename=enc.encode('@PARAM/param.pck?withdefaults=1');
    const opened=await this.request(4,{data:filename,size:filename.length});
    if(opened.opcode!==128||opened.size<4)throw Error('MAVFTP parameter file unsupported (NAK '+(opened.data[0]??'?')+')');
    session=opened.session;this.session=session;
    let bytes;
    if(this.preferBurst){
     try{
      bytes=await this.readBurst(session,started);
      this.lastMethod='MAVFTP BURST';
     }catch(error){
      if(this.closed)throw error;
      this.lastFallback=error.message;
      this.onStage('BURST-FAILED',error.message);
      // Some firmware/bridges reject bursts or throttle them too heavily.
      // Retry with the known-good sequential read on the same file session.
      this.onProgress(0,'MAVFTP READ');
      bytes=await this.readSequential(session,started);
      this.lastMethod='MAVFTP READ';
     }
    }else{
     bytes=await this.readSequential(session,started);
     this.lastMethod='MAVFTP READ';
    }
    this.stage='decode';this.onStage('DECODE');
    const rows=decodePacked(bytes);
    this.stage='done';this.onStage('DONE');
    return rows;
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
