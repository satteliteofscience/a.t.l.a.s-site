'use strict';
/* Regression tests for Uni-IC743 Mini integration, safe board isolation and MAVLink recovery. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const catalog=JSON.parse(read('data/releases.json'));
const ids=catalog.boards.map(b=>b.id);
assert.equal(new Set(ids).size,ids.length,'catalog has duplicate board identifiers');
const uni=catalog.boards.find(b=>b.id==='uni-ic743-mini');
assert.ok(uni&&uni.name==='Uni-IC743 Mini');
assert.ok(['planned','available'].includes(uni.status),'invalid Uni release state');
if(uni.status==='planned'){
 assert.deepEqual(uni.downloads,[],'do not enable protected download before uploading the HEX to private R2');
}else{
 assert.equal(uni.downloads.length,1);
 assert.equal(uni.downloads[0].secure_id,'uni-ic743-mini-release-1');
 assert.equal(uni.downloads[0].sha256,'647029f6835f4af59a5ea32cf081acf67394721341ed8482b4923a99dca1c375');
 assert.equal(uni.downloads[0].source_verified,false);
}
assert.ok(uni.target.includes('Uni_IC743Mini'));
const miniManifest=JSON.parse(read('Firmware/Uni-IC743 Mini/manifest.json'));
assert.equal(miniManifest.board_id,'uni-ic743-mini');
if(uni.status==='planned')assert.equal(miniManifest.files.length,0,'placeholder manifest must not offer a broken URL');
else assert.equal(miniManifest.files[0].secure_id,'uni-ic743-mini-release-1');
const cfg=read('configurator.js'),quick=read('quick-setup.js'),dfu=read('dfu-ui.js'),flash=read('dfu-flasher.js');
assert.ok(cfg.includes("'uni-ic743-mini'"),'configurator needs a new controller');
assert.ok(cfg.includes("HEX · LOCAL"),'local HEX must be clearly labelled');
assert.ok(quick.includes("['uni-ic743-mini','Uni-IC743 Mini']"),'Quick Setup firmware stage must list custom target');
assert.ok(quick.includes('if(matek||cube||uni)'),'Quick Setup must use one verified DFU component for all 3 targets');
assert.ok(dfu.includes("'uni-ic743-mini':'Firmware/Uni-IC743 Mini/manifest.json'"));
assert.ok(dfu.includes("image.detectedTarget==='uni-ic743-mini'"));
assert.ok(dfu.includes("parsed.detectedTarget!=='uni-ic743-mini'"));
assert.ok(dfu.includes("releaseLoadBusy")&&dfu.includes("localLoadBusy"),'concurrent HEX reads must be serialized');
assert.ok(dfu.includes("e.target.value=''"),'file picker must allow retrying same file');
assert.ok(dfu.includes("selectedBoard()!==expectedBoard"),'abort if board changed during integrity check');
assert.ok(dfu.includes("dfuConfirmBoard")&&dfu.includes("dfuConfirmBackup")&&dfu.includes("dfuConfirmText"));
assert.ok(dfu.includes("if(!readyToFlash())return;")||dfu.includes("!readyToFlash())return;"),'DFU erase must be guarded');
const ctx={window:{},TextEncoder,TextDecoder,Uint8Array,DataView,console,setTimeout};
vm.runInNewContext(flash,ctx,{filename:'dfu-flasher.js'});
const f=ctx.window.AtlasDFU;
assert.equal(f.supportsH743FlashMap('@Internal Flash /0x08000000/08*128Kg,08*128Kg'),true);
function record(type,address,data){
 const values=[data.length,address>>8&255,address&255,type,...data];
 values.push((-values.reduce((sum,v)=>sum+v,0))&255);
 return ':'+values.map(b=>b.toString(16).padStart(2,'0').toUpperCase()).join('');
}
function synthetic(targets){
 const bytes=new Uint8Array(65568).fill(0xff);
 targets.forEach((target,i)=>bytes.set(new TextEncoder().encode(target),256+i*48));
 const records=[];let previous=-1;
 for(let offset=0;offset<bytes.length;offset+=32){
  const absolute=0x08000000+offset,upper=absolute>>>16;
  if(upper!==previous){records.push(record(4,0,[(upper>>>8)&255,upper&255]));previous=upper;}
  records.push(record(0,absolute&0xffff,Array.from(bytes.subarray(offset,offset+32))));
 }
 records.push(record(1,0,[]));return records.join('\n');
}
assert.equal(f.parseIntelHex(synthetic(['Uni_IC743Mini'])).detectedTarget,'uni-ic743-mini');
assert.equal(f.parseIntelHex(synthetic(['CubeOrangePlus'])).detectedTarget,'cube-orange-plus');
assert.equal(f.parseIntelHex(synthetic(['MatekH743'])).detectedTarget,'matek-h743-wing-v3');
assert.equal(f.parseIntelHex(synthetic([])).detectedTarget,null);
assert.throws(()=>f.parseIntelHex(synthetic(['Uni_IC743Mini','CubeOrangePlus'])),/Conflicting board target markers/);
assert.throws(()=>f.parseIntelHex(synthetic(['Uni_IC743Mini']).replace(/:[0-9A-F]{6}00/,'INVALID')),/Invalid HEX syntax/);
const pin=read('firmware-access.js');
assert.ok(pin.includes('signal:abortController.signal'),'PIN fetch must be cancellable');
assert.ok(pin.includes('if(finished)return;'),'cancelled PIN request must not alter a new modal');
assert.ok(pin.includes('blob.size!==entry.bytes'),'protected download size must match release metadata');
const mavlink=read('mavlink.js');const mctx={window:{},TextEncoder,TextDecoder,Uint8Array,DataView,console};
vm.runInNewContext(mavlink,mctx,{filename:'mavlink.js'});
const mav=mctx.window.AtlasMAV;
const received=[],parser=new mav.Parser(frame=>received.push(frame));
const good=mav.createFrame(0,mav.heartbeat(),0);
const corrupt=Uint8Array.from(good);corrupt[1]=50; // header claims a much longer MAVLink payload
const stream=new Uint8Array(corrupt.length+good.length*6);
stream.set(corrupt);
for(let i=0;i<6;i++)stream.set(good,corrupt.length+i*good.length);
parser.push(stream);
assert.ok(parser.invalid>=1,'corrupted framing must be detected');
assert.ok(received.length>=1,'parser must recover and receive good HEARTBEAT after corrupt length');
console.log('PASS: Uni local HEX catalog, strict 3-board matching, FLASH safety and MAVLink recovery.');
