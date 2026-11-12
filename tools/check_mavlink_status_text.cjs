'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Status=require('../js/configurator/mavlink-status-core.js');
const read=path=>fs.readFileSync(path,'utf8');
const ctx={window:{},TextEncoder,TextDecoder,Uint8Array,DataView,console};
vm.runInNewContext(read('js/configurator/mavlink.js'),ctx,{filename:'js/configurator/mavlink.js'});
const M=ctx.window.AtlasMAV;

function statusFrame(severity,text,{sysid=42,compid=1,id=0,chunk=0,trim=true}={}){
 const bytes=typeof text==='string'?new TextEncoder().encode(text):text;
 if(bytes.length>50)throw Error('STATUSTEXT chunk max is 50 bytes');
 const payload=new Uint8Array(id?54:51);
 payload[0]=severity;payload.set(bytes,1);
 if(id){payload[51]=id&255;payload[52]=(id>>8)&255;payload[53]=chunk;}
 let end=payload.length;
 if(trim)while(end>1&&payload[end-1]===0)end--;
 return {id:253,sysid,compid,payload:payload.slice(0,end)};
}
function feed(assembler,severity,text,options){
 const frame=statusFrame(severity,text,options);
 return assembler.receive(M.parseMessage(frame),frame);
}
(function fullSeverityRangeAndMonitorMessages(){
 const a=new Status.Assembler();
 const performance=[
  'Filter: EKF3',
  'CPU Load:8% FreeRAM:321KB',
  'Platform H/IC-743 CPU: 480MHz Loop: 100Hz',
  'Performance ArduPlane-A.T.L.A.S V4.7.2'
 ];
 const received=performance.map(msg=>feed(a,6,msg));
 assert.deepEqual(received.map(r=>r.text),performance,'all INFO monitor strings must appear exactly');
 assert.ok(received.every(r=>r.level==='INFO'&&!r.warning));
 for(let severity=0;severity<=7;severity++){
  const item=feed(a,severity,'Test level '+severity);
  assert.ok(item&&item.text==='Test level '+severity,'MAV_SEVERITY '+severity+' must not be discarded');
  assert.equal(item.level,Status.SEVERITY[severity]);
  assert.equal(item.warning,severity<=4);
 }
 assert.equal(feed(a,8,'Bad severity'),null);
 assert.equal(feed(a,6,''),null);
 assert.equal(Status.severityLabel(-1),null);
 assert.equal(Status.severityLabel(7),'DEBUG');
})();
(function mavlink2FragmentationAndUtf8(){
 const a=new Status.Assembler();
 const text='A'.repeat(49)+'Я — датчик калиброван'; // UTF-8 Cyrillic byte boundary
 const bytes=new TextEncoder().encode(text);
 const first=statusFrame(6,bytes.subarray(0,50),{id:1234,chunk:0});
 const second=statusFrame(6,bytes.subarray(50),{id:1234,chunk:1});
 const parsed=M.parseMessage(first);
 assert.equal(parsed.statustextId,1234);
 assert.equal(parsed.chunkSeq,0);
 assert.equal(parsed.textBytes.length,50);
 assert.equal(parsed.terminated,false);
 assert.equal(a.receive(parsed,first),null,'first fragment must not log an incomplete message');
 const end=a.receive(M.parseMessage(second),second);
 assert.ok(end);
 assert.equal(end.text,text,'reassemble UTF-8 characters split across fragments');
 assert.equal(end.level,'INFO');
 assert.equal(a.pending.size,0);
 // ID extension with a short one-packet message is valid and complete.
 const one=feed(a,6,'Single-packet notice',{id:324,chunk:0});
 assert.equal(one.text,'Single-packet notice');
 // A MAVLink1 message without extension remains fully compatible.
 const old=feed(a,6,'MAVLink 1 info',{id:0});
 assert.equal(old.text,'MAVLink 1 info');
})();
(function missingChunksTimeoutAndMemoryBound(){
 let now=1000;const a=new Status.Assembler({now:()=>now,timeoutMs:1000,maxPending:3,maxFragments:4});
 const chunk='Z'.repeat(50);
 const incoming=(id,seq,text=chunk)=>feed(a,7,text,{id,chunk:seq,sysid:42,compid:1});
 assert.equal(incoming(1,0),null);
 assert.equal(incoming(1,2,'tail'),null,'gap in sequence must not publish a broken message');
 assert.equal(a.pending.size,0);
 assert.equal(incoming(2,1,'orphan'),null);
 assert.equal(incoming(3,0),null);
 now+=1200;
 assert.equal(incoming(3,1,'tail'),null,'expired fragment must not be completed');
 for(const id of [4,5,6,7])incoming(id,0);
 assert.ok(a.pending.size<=3,'bound unfinished fragment state');
 a.reset();
 assert.equal(a.pending.size,0,'disconnect must erase old fragments');
 assert.equal(incoming(7,1,'tail'),null,'old state must never cross sessions');
})();
(function actualCrcAndSystemIsolation(){
 const received=[],parser=new M.Parser(frame=>received.push(frame));
 const payload=statusFrame(6,'CPU Load:8% FreeRAM:321KB',{sysid:42,compid:1}).payload;
 const wire=M.createFrame(253,payload,7);
 wire[5]=42;wire[6]=1;
 const crc=M.crcX25(wire.subarray(1,wire.length-2),83);
 wire[wire.length-2]=crc&255;wire[wire.length-1]=crc>>8;
 parser.push(wire);
 assert.equal(received.length,1,'real MAVLink2 frame must pass CRC validation');
 const msg=M.parseMessage(received[0]);
 assert.equal(msg.severity,6);
 assert.equal(msg.text,'CPU Load:8% FreeRAM:321KB');
 assert.equal(M.belongsToSelectedVehicle(received[0],msg,42),true);
 assert.equal(M.belongsToSelectedVehicle(received[0],msg,43),false,'other sysid cannot inject status text');
})();
(function sourceAndInterfaceRegression(){
 const js=read('js/configurator/configurator.js'),html=read('configurator.html'),css=read('css/configurator.css');
 assert.match(html,/src="js\/configurator\/mavlink-status-core\.js" defer/,'status assembler must load before configurator');
 assert.match(js,/state\.statusTextAssembler=new window\.AtlasStatusTextCore\.Assembler\(\)/,
  'configure a single bounded fragment assembler per connection');
 assert.match(js,/const entry=state\.statusTextAssembler\.receive\(data,message\)/,
  'FC informational messages must be assembled and logged');
 assert.match(js,/log\(entry\.text,entry\.warning,\{source:'fc',severity:entry\.severity,level:entry\.level\}\)/,
  'all severity levels must reach the log with their severity metadata');
 assert.doesNotMatch(js,/data\.severity<=5/,'INFO/DEBUG suppression must be removed');
 assert.match(js,/while\(events\.children\.length>150\)/,
  'log scrollback must retain more than 11 messages but have a firm limit');
 assert.match(js,/state\.statusTextAssembler\.reset\(\)/,'disconnect/reconnect must discard stale fragments');
 assert.match(js,/row\.dataset\.severity=String\(meta\.severity\)/,'severity should be exposed for UI styling');
 assert.match(js,/body\.append\(tag,document\.createTextNode\(' '\+msg\)\)/,
  'FC messages must be inserted as text nodes, not HTML');
 assert.match(css,/\.cc-event-fc\[data-severity="7"\]/,'DEBUG styling required');
 assert.match(js,/if\(!data\|\|!M\.belongsToSelectedVehicle\(message,data,state\.sysid\)\)return/,
  'only selected vehicle telemetry can enter the event journal');
 const ahrs=read('js/configurator/ahrs-filter-core.js');
 assert.equal(require('../js/configurator/ahrs-filter-core.js').activeFromText('Filter: EKF3'),null,
  'performance monitor Filter text is not by itself proof of the runtime EKF3 backend');
 assert.ok(ahrs);
})();
console.log('PASS: full STATUSTEXT levels 0..7, performance-monitor INFO, UTF-8 MAVLink2 chunks, CRC, isolation, finite log & safe UI.');
