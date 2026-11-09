/* A.T.L.A.S. browser MAVLink 1/2 framing, parameter and telemetry subset.
   This is a pre-release ground tool. CRC validated; unsupported MAVLink IDs are ignored.
   No auto-arming, motor output or firmware-writing commands are implemented. */
(() => {
  'use strict';
  const CRC_EXTRA = Object.freeze({0:50,1:124,20:214,21:159,22:220,23:168,30:39,66:148,74:20,76:152,77:143,36:222,65:118,110:84,147:154,191:92,192:36,253:83});
  const enc = new TextEncoder();
  const decoder = new TextDecoder('ascii');
  function crcX25(data, extra) {
    let crc = 0xffff;
    function acc(v) { let tmp=(v^(crc&255))&255; tmp ^= (tmp<<4)&255; crc=((crc>>8)^(tmp<<8)^(tmp<<3)^(tmp>>4))&0xffff; }
    for(const b of data) acc(b);
    acc(extra); return crc;
  }
  class Parser {
    constructor(onMessage) { this.onMessage=onMessage; this.buffer=new Uint8Array(0); this.valid=0; this.invalid=0; }
    push(chunk) {
      const raw = new Uint8Array(this.buffer.length + chunk.length);
      raw.set(this.buffer); raw.set(chunk,this.buffer.length);
      let i=0;
      while(i<raw.length) {
        const magic=raw[i];
        if(magic!==0xfd && magic!==0xfe){i++;continue;}
        const v2=magic===0xfd, header=v2?10:6;
        if(raw.length-i<header) break;
        const plen=raw[i+1], signed=v2&&!!(raw[i+2]&1), size=header+plen+2+(signed?13:0);
        if(raw.length-i<size)break;
        const msgid=v2?(raw[i+7]|(raw[i+8]<<8)|(raw[i+9]<<16)):raw[i+5];
        const extra=CRC_EXTRA[msgid];
        if(extra!==undefined){
          const crcAt=i+header+plen, expected=raw[crcAt]|(raw[crcAt+1]<<8);
          const calculated=crcX25(raw.subarray(i+1,crcAt),extra);
          if(expected===calculated){
            this.valid++;
            try{this.onMessage({id:msgid,sysid:raw[i+(v2?5:3)],compid:raw[i+(v2?6:4)],payload:raw.slice(i+header,crcAt),signed});}catch(err){console.warn('MAVLink frame processing',err);}
          }else this.invalid++;
        }
        i+=size;
      }
      this.buffer=raw.slice(i);
      if(this.buffer.length>4096)this.buffer=new Uint8Array(0);
    }
  }
  const view = bytes => new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const ascii16 = bytes=>decoder.decode(bytes).replace(/\x00.*$/,'').trim();
  const asciiText = bytes=>decoder.decode(bytes).replace(/\x00.*$/,'').trim();
  function createFrame(id,payload,seq=0) {
    const extra=CRC_EXTRA[id];if(extra===undefined)throw new Error('Unsupported outgoing MAVLink ID '+id);
    if(payload.length>255)throw new Error('MAVLink length exceeded');
    const b=new Uint8Array(10+payload.length+2);
    b.set([0xfd,payload.length,0,0,seq&255,255,190,id&255,(id>>8)&255,(id>>16)&255]);
    b.set(payload,10);
    const crc=crcX25(b.subarray(1,10+payload.length),extra);
    b[10+payload.length]=crc&255;b[11+payload.length]=(crc>>8)&255;
    return b;
  }
  function putName(target,offset,name) { const chars=enc.encode(name.slice(0,16));target.set(chars,offset); }
  function heartbeat() {const b=new Uint8Array(9);const v=view(b);v.setUint32(0,0,true);b.set([6,8,0,4,3],4);return b;}
  function paramList(sysid,compid) {return Uint8Array.of(sysid,compid);}
  // Legacy stream-group fallback for flight controllers not honoring SET_MESSAGE_INTERVAL.
  function requestDataStream(sysid,compid,streamId,rateHz) {
    if(!Number.isInteger(streamId)||streamId<0||streamId>12||!Number.isInteger(rateHz)||rateHz<1||rateHz>25)throw Error('Invalid MAVLink stream request');
    const b=new Uint8Array(6);view(b).setUint16(0,rateHz,true);b[2]=sysid;b[3]=compid;b[4]=streamId;b[5]=1;return b;
  }
  function paramRead(sysid,compid,name) {const b=new Uint8Array(20);const v=view(b);v.setInt16(0,-1,true);b[2]=sysid;b[3]=compid;putName(b,4,name);return b;}
  // A PARAM_REQUEST_LIST is a stream, not a reliable transaction. Re-request lost entries
  // individually by their 0-based index according to the MAVLink PARAM protocol.
  function paramReadByIndex(sysid,compid,index) {
    if(!Number.isInteger(index)||index<0||index>32767)throw Error('Invalid PARAM index '+index);
    const b=new Uint8Array(20);
    view(b).setInt16(0,index,true);
    b[2]=sysid;b[3]=compid;
    return b;
  }
  function paramSet(sysid,compid,name,value,type) {const b=new Uint8Array(23);view(b).setFloat32(0,value,true);b[4]=sysid;b[5]=compid;putName(b,6,name);b[22]=type;return b;}
  function commandLong(sysid,compid,command,parameters) {const b=new Uint8Array(33);const v=view(b);for(let i=0;i<7;i++)v.setFloat32(i*4,parameters[i]??0,true);v.setUint16(28,command,true);b[30]=sysid;b[31]=compid;b[32]=0;return b;}
  function parseMessage(frame) {
    const v=view(frame.payload),id=frame.id;
    if(id===0 && v.byteLength>=9) return {type:'heartbeat',sysid:frame.sysid,compid:frame.compid,mode:v.getUint32(0,true),vehicleType:v.getUint8(4),autopilot:v.getUint8(5),baseMode:v.getUint8(6),systemStatus:v.getUint8(7),armed:!!(v.getUint8(6)&128)};
    if(id===30 && v.byteLength>=28) return {type:'attitude',roll:v.getFloat32(4,true),pitch:v.getFloat32(8,true),yaw:v.getFloat32(12,true)};
    // MAVLink 2 strips trailing zero bytes. With throttle=0, VFR_HUD can be shorter than 20 bytes;
    // this is normal at rest, and missing bytes represent zero, not missing telemetry.
    if(id===74 && v.byteLength>=1){const bytes=new Uint8Array(20);bytes.set(frame.payload.subarray(0,20));const hud=view(bytes);return {type:'vfr',airspeed:hud.getFloat32(0,true),groundspeed:hud.getFloat32(4,true),altitude:hud.getFloat32(8,true),climb:hud.getFloat32(12,true),heading:hud.getInt16(16,true),throttle:hud.getUint16(18,true)};}
    if(id===1 && v.byteLength>=19) return {type:'sys',sensorsPresent:v.getUint32(0,true),sensorsEnabled:v.getUint32(4,true),sensorsHealthy:v.getUint32(8,true),voltage:v.getUint16(14,true),remaining:v.getInt8(18)};
    if(id===22 && v.byteLength>=25) return {type:'param',value:v.getFloat32(0,true),count:v.getUint16(4,true),index:v.getUint16(6,true),name:ascii16(frame.payload.slice(8,24)),paramType:v.getUint8(24)};
    // MAVLink 2 trims trailing zero bytes. COMMAND_LONG sent to target 0/0 with confirmation 0
    // is only 30 bytes, not the nominal 33. The command and 7 params are complete at 30.
    if(id===76 && v.byteLength>=30) return {type:'command_long',command:v.getUint16(28,true),params:Array.from({length:7},(_,i)=>v.getFloat32(i*4,true)),targetSystem:v.byteLength>30?v.getUint8(30):0,targetComponent:v.byteLength>31?v.getUint8(31):0,confirmation:v.byteLength>32?v.getUint8(32):0};
    if(id===77 && v.byteLength>=3) return {type:'ack',command:v.getUint16(0,true),result:v.getUint8(2),progress:v.byteLength>=4?v.getUint8(3):null};
    if(id===65 && v.byteLength>=4) return {type:'rc_channels',channels:Array.from({length:18},(_,i)=>(v.byteLength>=6+i*2?v.getUint16(4+i*2,true):0)),count:v.byteLength>=41?v.getUint8(40):0,rssi:v.byteLength>=42?v.getUint8(41):null};
    if(id===110 && v.byteLength>=15) return {type:'mavftp',data:frame.payload.slice(3)};
    if(id===36 && v.byteLength>=21) return {type:'servo_output',port:v.getUint8(20),pwm:Array.from({length:8},(_,i)=>v.getUint16(4+i*2,true)).concat(v.byteLength>=37?Array.from({length:8},(_,i)=>v.getUint16(21+i*2,true)):[])};
    if(id===147 && v.byteLength>=36) return {type:'battery_status',id:v.getUint8(32),voltageCells:Array.from({length:10},(_,i)=>v.getUint16(10+i*2,true)),current:v.getInt16(30,true),consumed:v.getInt32(0,true),remaining:v.getInt8(35),temperature:v.getInt16(8,true)};
    if(id===191 && v.byteLength>=17) return {type:'mag_progress',compassId:v.getUint8(12),mask:v.getUint8(13),status:v.getUint8(14),attempt:v.getUint8(15),pct:v.getUint8(16)};
    if(id===192 && v.byteLength>=40) return {type:'mag_report',compassId:v.getUint8(36),mask:v.getUint8(37),status:v.getUint8(38),autosaved:!!v.getUint8(39),fitness:v.getFloat32(0,true)};
    // STATUSTEXT is also commonly MAVLink2 zero-truncated when the message is shorter than 50 chars.
    if(id===253 && v.byteLength>=2) return {type:'text',severity:v.getUint8(0),text:asciiText(frame.payload.slice(1,Math.min(51,v.byteLength)))};
    return null;
  }
  // One flight controller per session: a second vehicle on a UDP/TCP stream must not
  // silently take over the write target (SYSID) or contaminate telemetry/ACKs.
  // MAV_TYPE_GCS is 6; a ground station can also emit HEARTBEAT.
  function belongsToSelectedVehicle(frame,decoded,activeSysId){
    if(!frame||!decoded||!Number.isInteger(frame.sysid)||frame.sysid<1||frame.sysid>255)return false;
    if(decoded.type==='heartbeat'){
      return frame.compid===1 && decoded.vehicleType!==6 &&
        (activeSysId===null||frame.sysid===activeSysId);
    }
    return activeSysId!==null && frame.sysid===activeSysId;
  }
  function ftpFrame(sysid,compid,header){if(header.length>251)throw Error('MAVFTP payload too large');const payload=new Uint8Array(3+header.length);payload[0]=0;payload[1]=sysid;payload[2]=compid;payload.set(header,3);return payload;}
  window.AtlasMAV={ftpFrame,Parser,createFrame,parseMessage,belongsToSelectedVehicle,heartbeat,paramList,requestDataStream,paramRead,paramReadByIndex,paramSet,commandLong,crcX25};
})();
