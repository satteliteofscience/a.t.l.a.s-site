/* Cube Orange Plus protected firmware and DFU cross-board safety checks. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const catalog=JSON.parse(read('data/releases.json')),boards=catalog.boards;
const cube=boards.find(b=>b.id==='cube-orange-plus'),matek=boards.find(b=>b.id==='matek-h743-wing-v3');
const manifest=JSON.parse(read('Firmware/Cube Orange Plus/manifest.json'));
const privateIndex=JSON.parse(read('firmware-gateway/firmware-index.json'));
const secureId='cube-orange-plus-release-1';
const digest='44b3c68b52ee75bf8de808275a43aafcbea0b076492f0b200052bb6dc7b427f6';
assert.equal(cube.name,'Cube Orange Plus');
assert.equal(cube.status,'available');
assert.equal(cube.downloads.length,1);
assert.equal(cube.downloads[0].secure_id,secureId);
assert.equal(cube.downloads[0].channel,'release');
assert.equal(cube.downloads[0].sha256,digest);
assert.equal(cube.downloads[0].source_verified,false);
assert.equal(cube.downloads[0].source_url,'');
assert.equal(manifest.board_id,'cube-orange-plus');
assert.equal(manifest.files[0].secure_id,secureId);
assert.equal(manifest.files[0].sha256,digest);
assert.equal(manifest.files[0].bytes,5102076);
assert.equal(privateIndex.builds[secureId].sha256,digest);
assert.equal(privateIndex.builds[secureId].object_key,'release/cube-orange-plus-release-1.hex');
assert.equal(matek.downloads[0].secure_id,'matek-h743-v3-release-1','Matek protected release must not change');
const dfu=read('js/configurator/dfu-ui.js'),transport=read('js/configurator/dfu-flasher.js'),quick=read('js/configurator/quick-setup.js');
assert.ok(dfu.includes("'cube-orange-plus':'Firmware/Cube Orange Plus/manifest.json'"));
assert.ok(dfu.includes('selectedBoard()===expectedBoard')||dfu.includes('selectedBoard()!==expectedBoard'));
assert.ok(dfu.includes("image.detectedTarget==='cube-orange-plus'"));
assert.ok(dfu.includes("if(!imageMatchesBoard())return 'target'"));
assert.ok(dfu.includes("image=null;fileInfo=null;"));
assert.ok(dfu.includes("if(releaseLoadBusy||localLoadBusy||!readyToFlash())return;"));
assert.ok(dfu.includes("dfuConfirmBoard")&&dfu.includes("dfuConfirmText"));
assert.ok(transport.includes('function supportsH743FlashMap(name)'));
assert.ok(transport.includes("new TextEncoder().encode('CubeOrangePlus')"));
assert.ok(quick.includes('if(matek||cube||uni)'));
assert.ok(quick.includes("qs.firmwareSource='dfu'")&&quick.includes('d.board===selectedBoard()'));
const context={window:{},Uint8Array,DataView,TextEncoder,TextDecoder,console,setTimeout};
vm.runInNewContext(transport,context,{filename:'js/configurator/dfu-flasher.js'});
const parse=context.window.AtlasDFU.parseIntelHex;
assert.equal(context.window.AtlasDFU.supportsH743FlashMap('@Internal Flash /0x08000000/08*128Kg,08*128Kg'),true);
assert.equal(context.window.AtlasDFU.supportsH743FlashMap('@Internal Flash /0x08000000/04*128Kg'),false);
function hexLine(type,address,data){
 const arr=[data.length,(address>>>8)&255,address&255,type,...data];
 arr.push((-arr.reduce((sum,b)=>sum+b,0))&255);
 return ':'+arr.map(b=>b.toString(16).padStart(2,'0').toUpperCase()).join('');
}
function testHex(withCube){
 const image=new Uint8Array(65568).fill(0xFF);
 const marker=new TextEncoder().encode('CubeOrangePlus');
 if(withCube)image.set(marker,0x340);
 const lines=[];let previousUpper=-1;
 for(let i=0;i<image.length;i+=32){
  const address=0x08000000+i,upper=address>>>16;
  if(upper!==previousUpper){lines.push(hexLine(4,0,[(upper>>>8)&255,upper&255]));previousUpper=upper;}
  lines.push(hexLine(0,address&65535,Array.from(image.subarray(i,i+32))));
 }
 lines.push(hexLine(1,0,[]));
 return lines.join('\n')+'\n';
}
assert.equal(parse(testHex(true)).detectedTarget,'cube-orange-plus');
assert.equal(parse(testHex(false)).detectedTarget,null);
console.log('PASS: protected Cube Orange Plus catalog, board-specific DFU selection, ROM flash-map and target marker gates.');
