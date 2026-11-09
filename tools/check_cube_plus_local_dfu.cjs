/* Cube Orange Plus local HEX flashing safety regression checks. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const flasher=read('dfu-flasher.js'),ui=read('dfu-ui.js'),quick=read('quick-setup.js'),cfg=read('configurator.js');
assert.ok(cfg.includes("'cube-orange-plus'"));
assert.ok(cfg.includes("'HEX · LOCAL'"),'Cube must show local HEX capability pending secure R2 publication');
assert.ok(ui.includes("'cube-orange-plus':'Firmware/Cube Orange Plus/manifest.json'"));
assert.ok(ui.includes("image.detectedTarget==='cube-orange-plus'"),'Cube requires embedded target marker');
assert.ok(ui.includes("if(!imageMatchesBoard())return 'target'"),'wrong target must block destructive action');
assert.ok(ui.includes("image=null;fileInfo=null;"),'changing the board must discard stale HEX');
assert.ok(ui.includes("if(!readyToFlash())return;"),'erase must be guarded');
assert.ok(ui.includes("dfuConfirmBoard")&&ui.includes("dfuConfirmBackup")&&ui.includes("dfuConfirmText"));
assert.ok(quick.includes('if(matek||cube)'),'Quick Setup must embed the same DFU panel for Cube');
assert.ok(quick.includes("d.board===selectedBoard()"),'Quick Setup must only accept a verified flash for selected board');
assert.ok(flasher.includes("new TextEncoder().encode('CubeOrangePlus')"));
const context={window:{},Uint8Array,DataView,TextEncoder,TextDecoder,console,setTimeout};
vm.runInNewContext(flasher,context,{filename:'dfu-flasher.js'});
const api=context.window.AtlasDFU;
assert.equal(api.supportsH743FlashMap('@Internal Flash /0x08000000/08*128Kg,08*128Kg'),true);
assert.equal(api.supportsH743FlashMap('@Internal Flash /0x08000000/04*128Kg'),false);
const line=(type,addr,data)=>{
 const a=[data.length,addr>>8&255,addr&255,type,...data];
 a.push((-a.reduce((v,x)=>v+x,0))&255);
 return ':'+a.map(x=>x.toString(16).padStart(2,'0')).join('');
};
function sample(cube){
 const bytes=new Uint8Array(65568).fill(255);
 if(cube)bytes.set(new TextEncoder().encode('CubeOrangePlus'),256);
 const rows=[];let upper=-1;
 for(let offset=0;offset<bytes.length;offset+=32){
  const addr=0x08000000+offset,next=addr>>>16;
  if(next!==upper){rows.push(line(4,0,[next>>>8&255,next&255]));upper=next;}
  rows.push(line(0,addr&65535,Array.from(bytes.subarray(offset,offset+32))));
 }
 rows.push(line(1,0,[]));return rows.join('\n');
}
assert.equal(api.parseIntelHex(sample(true)).detectedTarget,'cube-orange-plus');
assert.equal(api.parseIntelHex(sample(false)).detectedTarget,null);
console.log('PASS: Cube Orange Plus local HEX selection, target marker, DFU guards and Quick Setup firmware stage.');
