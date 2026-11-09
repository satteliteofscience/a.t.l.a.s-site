/* A.T.L.A.S. MAVLink STATUSTEXT receiver.
 * MAV_SEVERITY 0..7 is a valid message range, including INFO and DEBUG.
 * Fragmented MAVLink2 STATUSTEXT messages are shown only when complete.
 */
(function(root,factory){
 'use strict';
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 if(root)root.AtlasStatusTextCore=core;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const SEVERITY=Object.freeze(['EMERGENCY','ALERT','CRITICAL','ERROR','WARNING','NOTICE','INFO','DEBUG']);
 const decoder=new TextDecoder('utf-8',{fatal:false});
 function severityLabel(value){return Number.isInteger(value)&&value>=0&&value<SEVERITY.length?SEVERITY[value]:null;}
 function cleanText(bytes){
  let end=bytes.indexOf(0);
  if(end<0)end=bytes.length;
  return decoder.decode(bytes.subarray(0,end)).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').trim();
 }
 class Assembler {
  constructor({now=()=>Date.now(),timeoutMs=5000,maxFragments=12,maxPending=12}={}){
   this.now=now;this.timeoutMs=timeoutMs;this.maxFragments=maxFragments;this.maxPending=maxPending;
   this.pending=new Map();
  }
  reset(){this.pending.clear();}
  receive(data,frame){
   if(!data||data.type!=='text'||!severityLabel(data.severity)||!frame||
      !Number.isInteger(frame.sysid)||!Number.isInteger(frame.compid))return null;
   const time=this.now();
   for(const [key,item] of this.pending){if(time-item.at>this.timeoutMs)this.pending.delete(key);}
   const bytes=data.textBytes instanceof Uint8Array?data.textBytes:
     new TextEncoder().encode(String(data.text||''));
   const id=Number.isInteger(data.statustextId)?data.statustextId:0;
   const seq=Number.isInteger(data.chunkSeq)?data.chunkSeq:0;
   const finished=data.terminated===true||bytes.length<50||bytes.indexOf(0)>=0;
   const key=frame.sysid+':'+frame.compid+':'+id;
   const output=(chunks,severity)=>{
    const count=chunks.reduce((sum,part)=>sum+part.length,0);
    if(count>this.maxFragments*50)return null;
    const joined=new Uint8Array(count);let offset=0;
    for(const part of chunks){joined.set(part,offset);offset+=part.length;}
    const text=cleanText(joined);
    return text?{text,severity,level:severityLabel(severity),warning:severity<=4,
      sysid:frame.sysid,compid:frame.compid}:null;
   };
   if(id===0 && seq===0)return output([bytes],data.severity);
   if(id<=0||id>65535||seq<0||seq>=this.maxFragments)return null;
   if(seq===0){
    this.pending.delete(key);
    if(finished)return output([bytes],data.severity);
    if(this.pending.size>=this.maxPending)this.pending.delete(this.pending.keys().next().value);
    this.pending.set(key,{chunks:[bytes.slice()],next:1,severity:data.severity,at:time});
    return null;
   }
   const item=this.pending.get(key);
   if(!item)return null;
   if(item.next!==seq||item.severity!==data.severity){
    this.pending.delete(key);return null;
   }
   item.chunks.push(bytes.slice());item.next++;item.at=time;
   if(!finished)return null;
   this.pending.delete(key);
   return output(item.chunks,data.severity);
  }
 }
 return Object.freeze({SEVERITY,severityLabel,Assembler});
});
