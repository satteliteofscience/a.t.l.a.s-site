/* A.T.L.A.S. production firmware access guard: no direct public HEX. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const config=json('data/firmware-access.json');
const catalog=json('data/releases.json');
const manifest=json('Firmware/Matek Wing H743-V3/manifest.json');
const history=json('data/firmware-history.json');
const id='matek-h743-v3-release-1';
const sha='db18bb8cda5805508a4834ee40388c8f493ceaa4498a3c778d37c600b24bcda9';
assert.equal(config.enabled,true,'PIN-gate must be enabled after verified 200/401 integration test');
assert.equal(config.gateway_url,'https://atlas-firmware-gateway.gamingchanel57.workers.dev/');
const board=catalog.boards.find(b=>b.id==='matek-h743-wing-v3');
assert.equal(board.status,'available');
assert.equal(board.downloads.length,1);
const siteRelease=board.downloads[0];
const dfuRelease=manifest.files[0];
for(const data of [siteRelease,dfuRelease,history.releases[0]]){
 assert.equal(data.secure_id,id,'Only allow verified private R2 object ID');
 assert.equal(data.channel,'release');
 assert.equal(data.sha256,sha);
 assert.equal(data.filename,'ATLAS-Matek-H743-V3-release-1.hex');
 assert.equal(data.bytes||4654592,4654592);
 assert.ok(!('url' in data),'Direct public HEX URL is forbidden');
 assert.ok(!('path' in data),'Direct public HEX path is forbidden');
}
assert.equal(manifest.latest,siteRelease.filename);
assert.ok(!('latest_path' in manifest));
assert.equal(siteRelease.source_verified,false,'Corresponding GPL source not yet verified; cannot claim it is');
assert.ok(!siteRelease.source_url,'Corresponding source link must not be invented');
function findPublicHex(dir){
 if(!fs.existsSync(dir))return [];
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  const p=path.join(dir,e.name);
  return e.isDirectory()?findPublicHex(p):e.isFile()&&/\.hex$/i.test(e.name)?[p]:[];
 });
}
assert.deepEqual(findPublicHex('Firmware'),[],'Raw HEX must not remain in the public current branch');
const app=read('js/site/app.js'),cc=read('js/configurator/configurator.js'),dfu=read('js/configurator/dfu-ui.js');
const gate=read('js/site/firmware-access.js'),worker=read('firmware-gateway/src/index.js');
const ui1=read('index.html'),ui2=read('configurator.html');
for(const html of [ui1,ui2]){
 assert.ok(html.includes('js/site/firmware-access.js'),'PIN dialog logic required');
 assert.ok(html.includes('css/firmware-access.css'),'PIN dialog style required');
}
assert.ok(app.includes('AtlasFirmwareAccess.download(item)'));
assert.ok(app.includes('AtlasFirmwareAccess?.isProtected(item)'));
assert.ok(!app.includes('link.href = safeUrl(item.url)'),'Public site downloads forbidden');
assert.ok(read('js/configurator/release-picker.js').includes('access.download(item)')&&cc.includes('access:window.AtlasFirmwareAccess'),'configurator downloads go through the PIN gateway (cards in release-picker.js)');
assert.ok(!cc.includes('new URL(d.url,location.href)'),'Public Configurator downloads forbidden');
assert.ok(dfu.includes('AtlasFirmwareAccess.requestBlob(info)'),'DFU site-load must use server-checked PIN');
assert.ok(!dfu.includes('releaseURL(') && !dfu.includes('fetch(fileURL'),'No DFU direct URL fallback');
assert.ok(dfu.includes('localFile(file)'),'User-provided local HEX must remain supported');
assert.ok(dfu.includes("dfuConfirmText")&&dfu.includes('readyToFlash'),'Destructive DFU controls preserved');
assert.ok(gate.includes("method:'POST'")&&gate.includes("JSON.stringify({pin})"));
assert.ok(gate.includes("crypto.subtle.digest('SHA-256'"),'Client integrity check required');
assert.ok(worker.includes('env.ACCESS_CODES_JSON')&&worker.includes('env.FIRMWARE.get(build.object_key)')&&worker.includes('env.ACCESS_LIMITER.limit'));
assert.ok(!gate.includes('ATL-USSM-HCSD-KUXJ-YFB7'),'Never embed real PIN');
const oldFlow=read('.github/workflows/firmware-manifest.yml');
assert.ok(oldFlow.includes('workflow_dispatch'));
assert.ok(!oldFlow.includes('  push:'),'Old public pipeline must not auto-publish');
assert.ok(!oldFlow.includes('gh release create'),'Old GitHub Release publisher must not run');
for(const f of ['tools/release_manager.py','tools/update_firmware_manifest.py','tools/publish_github_releases.py']){
 const script=read(f);
 assert.ok(script.includes("get('enabled') is True")||script.includes('get("enabled") is True'),f+' must refuse publishing when gated');
}
console.log('PASS: production R2+PIN gating for both downloads and DFU site loads; zero public HEX or publisher fallback; GPL source not misrepresented.');
