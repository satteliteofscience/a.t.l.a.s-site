/* Release publishing tool for the private R2 bucket: HEX validation (same parser as the configurator), board markers, index entries, merge rules, upload script. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const tool=require('./r2_publish_release.cjs');

// a synthetic but structurally real Intel HEX: contiguous from 0x08000000, 80 KB, with a board marker inside
function hexFor(markers,size=80000){
 const data=Buffer.alloc(size,0xa5);let at=1000;for(const m of markers){data.write(m,at,'latin1');at+=64;}
 const rec=(addr,type,bytes)=>{const arr=[bytes.length,(addr>>8)&255,addr&255,type,...bytes];const sum=arr.reduce((s,b)=>(s+b)&255,0);return ':'+[...arr,(256-sum)&255].map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join('');};
 const lines=[];let ext=-1;
 for(let off=0;off<size;off+=16){const abs=0x08000000+off,hi=abs>>>16;if(hi!==ext){lines.push(rec(0,4,[(hi>>8)&255,hi&255]));ext=hi;}lines.push(rec(abs&0xffff,0,[...data.subarray(off,Math.min(size,off+16))]));}
 lines.push(rec(0,1,[]));
 return lines.join('\r\n')+'\r\n';
}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-r2-'));
const write=(name,text)=>{const f=path.join(tmp,name);fs.writeFileSync(f,text,'latin1');return f;};
const parse=tool.loadParser();
const cubeHex=write('cube.hex',hexFor(['CubeOrangePlus'])),uniHex=write('uni.hex',hexFor(['Uni_IC743Mini'])),matekHex=write('matek.hex',hexFor(['MatekH743'])),plainHex=write('plain.hex',hexFor([]));

// each board accepts only its own marker (Matek also a file without a marker, as in release 1.0)
const NOW=1800000000;
const cube=tool.inspect('cube',cubeHex,parse,NOW);
assert.equal(cube.marker,'cube-orange-plus');assert.equal(cube.address_start,'0x08000000');assert.equal(cube.image_bytes,80000);assert.equal(cube.timestamp,NOW);
assert.equal(cube.sha256,crypto.createHash('sha256').update(fs.readFileSync(cubeHex)).digest('hex'));assert.equal(cube.bytes,fs.statSync(cubeHex).size);
assert.equal(tool.inspect('uni',uniHex,parse,NOW).marker,'uni-ic743-mini');assert.equal(tool.inspect('matek',matekHex,parse,NOW).marker,'matek-h743-wing-v3');assert.equal(tool.inspect('matek',plainHex,parse,NOW).marker,null);
assert.throws(()=>tool.inspect('uni',cubeHex,parse,NOW),/not a Uni-IC743 Mini build/);
assert.throws(()=>tool.inspect('cube',matekHex,parse,NOW),/not a Cube Orange Plus build/);
assert.throws(()=>tool.inspect('cube',plainHex,parse,NOW),/not a Cube Orange Plus build/);
assert.throws(()=>tool.inspect('matek',cubeHex,parse,NOW),/not a Matek H743-WING V3 build/);
// a corrupted record is refused by the parser
const badLines=fs.readFileSync(cubeHex,'latin1').split('\r\n');badLines[1]=badLines[1].slice(0,-1)+(badLines[1].slice(-1)==='0'?'1':'0'); // flip the last checksum digit of the first data record
const bad=write('bad.hex',badLines.join('\r\n'));
assert.throws(()=>tool.inspect('cube',bad,parse,NOW),/checksum/);

// index entries: names, keys and labels follow the existing 1.0 / 1.2 scheme and satisfy the gateway's own regexes
const e=tool.entryFor('cube','2.0',cube,false);
assert.equal(e.object_key,'release/cube-orange-plus-release-2-0.hex');assert.equal(e.filename,'ATLAS-Cube-Orange-Plus-release-2.0.hex');assert.equal(e.board_id,'cube-orange-plus');assert.equal(e.version,'2.0');
assert.equal(e.label,'A.T.L.A.S. Release 2.0 · A.T.L.A.S-G.L.O.B.A.L · ArduPlane 4.7.2 · Cube Orange Plus');assert.equal(e.published,false);assert.equal(tool.buildId('cube','2.0'),'cube-orange-plus-release-2-0');
assert.deepEqual(tool.validEntry(tool.buildId('cube','2.0'),e),[]);
assert.equal(tool.entryFor('matek','2.0',cube,false).filename,'ATLAS-Matek-H743-V3-release-2.0.hex');assert.equal(tool.buildId('uni','2.0'),'uni-ic743-mini-release-2-0');assert.equal(tool.buildId('matek','2.0'),'matek-h743-v3-release-2-0');
assert.deepEqual(tool.validEntry('x',e).includes('id'),true);

// merge: the existing records stay untouched, clashes are errors, --publish flips only the new entries
const current=JSON.parse(fs.readFileSync(path.join(__dirname,'../firmware-gateway/firmware-index.json'),'utf8'));
const add={schema:1,builds:{[tool.buildId('cube','2.0')]:e,[tool.buildId('uni','2.0')]:tool.entryFor('uni','2.0',tool.inspect('uni',uniHex,parse,NOW),false)}};
const merged=tool.merge(current,add,false);
for(const [id,old] of Object.entries(current.builds))assert.deepEqual(merged.builds[id],old,'existing build changed: '+id);
assert.equal(Object.keys(merged.builds).length,Object.keys(current.builds).length+2);assert.equal(merged.builds[tool.buildId('cube','2.0')].published,false);
assert.equal(tool.merge(current,add,true).builds[tool.buildId('uni','2.0')].published,true);
assert.deepEqual(tool.merge(merged,add,false),merged,'merging the same additions twice must change nothing');
// publishing after the upload: the same additions with --publish switch ONLY the two new entries on, every other record stays as it was
const live=tool.merge(merged,add,true);
for(const [id,old] of Object.entries(current.builds))assert.deepEqual(live.builds[id],old,'publishing changed an existing build: '+id);
assert.equal(live.builds[tool.buildId('cube','2.0')].published,true);assert.equal(live.builds[tool.buildId('uni','2.0')].published,true);
assert.deepEqual({...live.builds[tool.buildId('cube','2.0')],published:false},merged.builds[tool.buildId('cube','2.0')]);
assert.throws(()=>tool.merge(merged,{builds:{[tool.buildId('cube','2.0')]:{...e,sha256:'0'.repeat(64)}}},false),/already exists/);
assert.throws(()=>tool.merge(merged,{builds:{'cube-other-id':{...e}}},false),/already used/);
assert.throws(()=>tool.merge(current,{builds:{'cube-orange-plus-release-2-0':{...e,board_id:'somewhere-else'}}},false),/invalid/);
assert.throws(()=>tool.merge({schema:2,builds:{}},add,false),/schema-1/);

// upload script: private bucket, real R2 (--remote), the index backed up before it is replaced, no secrets
const script=tool.uploadScript('2.0',[{object_key:e.object_key,path:cubeHex}],tmp,false);
assert.ok(script.includes('atlas-firmware-private/release/cube-orange-plus-release-2-0.hex')&&script.includes('--remote')&&script.includes('_internal/firmware-index.json')&&script.includes('current-index.json'));
assert.ok(!/pin|secret|token|password/i.test(script.replace(/Nothing here makes a file public[^\r\n]*/,'')),'the upload script must not contain secrets');

// the command line: prepare writes the metadata and the script, never the HEX
const out=path.join(tmp,'out');
const run=cp.spawnSync(process.execPath,[path.join(__dirname,'r2_publish_release.cjs'),'prepare','--version','2.0','--cube',cubeHex,'--uni',uniHex,'--matek',matekHex,'--out',out],{encoding:'utf8'});
assert.equal(run.status,0,run.stderr);
const additions=JSON.parse(fs.readFileSync(path.join(out,'release-2.0-index-additions.json'),'utf8'));
assert.deepEqual(Object.keys(additions.builds).sort(),['cube-orange-plus-release-2-0','matek-h743-v3-release-2-0','uni-ic743-mini-release-2-0']);
assert.ok(Object.values(additions.builds).every(b=>b.published===false&&b.version==='2.0'),'new entries stay unpublished until --publish');
assert.ok(fs.existsSync(path.join(out,'r2-upload-2.0.ps1'))&&!fs.readdirSync(out).some(n=>/\.hex$/i.test(n)),'no HEX may be copied next to the metadata');
const wrong=cp.spawnSync(process.execPath,[path.join(__dirname,'r2_publish_release.cjs'),'prepare','--version','2.0','--uni',cubeHex,'--out',path.join(tmp,'o2')],{encoding:'utf8'});
assert.equal(wrong.status,1);assert.match(wrong.stderr,/not a Uni-IC743 Mini build/);
fs.rmSync(tmp,{recursive:true,force:true});
console.log('PASS: R2 release tool: HEX validation, board markers, index entries, merge rules and upload script.');
