/* Verify protected Uni Mini publication metadata. This tests repository metadata only;
 * it does not establish whether the R2 object exists on the live Cloudflare account. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const boards=json('data/releases.json').boards;
assert.ok(!boards.some(b=>b.id==='other-boards'),'redundant Other controllers placeholder should not occupy space on the homepage');
assert.deepEqual(
  boards.filter(b=>b.status==='available').map(b=>b.id).sort(),
  ['cube-orange-plus','matek-h743-wing-v3','uni-ic743-mini'],
  'all three protected releases must remain visible in the homepage catalog'
);
const home=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('js/site/app.js','utf8');
assert.match(home,/id="boardSearch"/,'search by controller must be preserved');
assert.match(home,/id="boardGrid"/,'firmware catalog grid must remain mounted');
assert.match(app,/function renderBoards\(\)/,'board rendering must remain operational');

const manifest=json('Firmware/Uni-IC743 Mini/manifest.json');
const history=json('data/firmware-history.json').releases;
const index=json('firmware-gateway/firmware-index.json').builds;
const id='uni-ic743-mini-release-1',digest='647029f6835f4af59a5ea32cf081acf67394721341ed8482b4923a99dca1c375';
const board=boards.find(b=>b.id==='uni-ic743-mini');
assert.equal(board.status,'available');
assert.equal(board.downloads.length,1);
assert.equal(manifest.board_id,'uni-ic743-mini');
assert.equal(manifest.latest,'ATLAS-Uni-IC743-Mini-release-1.hex');
const items=[board.downloads[0],manifest.files[0],history.find(h=>h.secure_id===id)];
items.forEach(item=>{
 assert.ok(item);
 assert.equal(item.secure_id,id);
 assert.equal(item.sha256,digest);
 assert.equal(item.filename,'ATLAS-Uni-IC743-Mini-release-1.hex');
 assert.equal(item.bytes,4505460);
 assert.equal(item.channel,'release');
 assert.equal(item.source_url,'','GPL corresponding source is not yet verified');
 assert.equal(item.source_verified,false);
});
for(const item of items.slice(1)){
 assert.equal(item.image_bytes,1638196);
 assert.equal(item.address_start,'0x08000000');
 assert.equal(item.address_end_exclusive,'0x0818FF34');
}
assert.equal(index[id].object_key,'release/uni-ic743-mini-release-1.hex');
assert.equal(index[id].sha256,digest);
assert.equal(index[id].channel,'release');
const expectedOriginals={
 'matek-h743-v3-release-1':'db18bb8cda5805508a4834ee40388c8f493ceaa4498a3c778d37c600b24bcda9',
 'cube-orange-plus-release-1':'44b3c68b52ee75bf8de808275a43aafcbea0b076492f0b200052bb6dc7b427f6'
};
for(const [k,sha] of Object.entries(expectedOriginals)){
 assert.equal(index[k].sha256,sha);
 assert.equal(boards.find(b=>b.downloads.some(x=>x.secure_id===k)).downloads[0].sha256,sha);
}
function walk(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
}
assert.deepEqual(walk('Firmware').filter(f=>/\.hex$/i.test(f)),[],'Raw proprietary build bytes must stay out of the public repo');
console.log('PASS: staged protected Uni-IC743 Mini download, checksum, historical Matek/Cube firmware and source-verification flags.');
