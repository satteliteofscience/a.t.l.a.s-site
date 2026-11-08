/* Firmware access transport and inactive-by-default tests. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const config=JSON.parse(fs.readFileSync('data/firmware-access.json','utf8'));
const site=fs.readFileSync('index.html','utf8');
const cc=fs.readFileSync('configurator.html','utf8');
const catalog=fs.readFileSync('app.js','utf8');
const configurator=fs.readFileSync('configurator.js','utf8');
const dfu=fs.readFileSync('dfu-ui.js','utf8');
const client=fs.readFileSync('firmware-access.js','utf8');
const gateway=fs.readFileSync('firmware-gateway/src/index.js','utf8');
const workerConfig=fs.readFileSync('firmware-gateway/wrangler.toml','utf8');
assert.equal(config.enabled,false,'must not claim secured until external Worker deployed');
assert.equal(config.gateway_url,'','do not invent a gateway endpoint');
for(const page of [site,cc]){
 assert.ok(page.includes('firmware-access.js'),'Access UI script missing');
 assert.ok(page.includes('firmware-access.css'),'Access CSS missing');
}
assert.ok(catalog.includes("window.AtlasFirmwareAccess?.isProtected(item)")&&catalog.includes('AtlasFirmwareAccess.download(item)'));
assert.ok(configurator.includes('window.AtlasFirmwareAccess?.isProtected(d)')&&configurator.includes('AtlasFirmwareAccess.download(d)'));
assert.ok(dfu.includes('window.AtlasFirmwareAccess?.isProtected(info)')&&dfu.includes('AtlasFirmwareAccess.requestBlob(info)'),'DFU must gate web-fetched builds');
assert.ok(client.includes("method:'POST'")&&client.includes("JSON.stringify({pin})")&&client.includes("crypto.subtle.digest('SHA-256'"),'Validate PIN server-side and binary integrity client-side');
assert.ok(gateway.includes('env.ACCESS_CODES_JSON')&&gateway.includes('env.FIRMWARE.get(build.object_key)')&&gateway.includes('env.ACCESS_LIMITER.limit'),'Missing server PIN gate/storage/rate limiter');
assert.ok(!gateway.includes('Authorization: Bearer sample'));
assert.ok(workerConfig.includes('atlas-firmware-private'));
assert.ok(!site.includes('secure_id='),'do not hardcode unverified protected release IDs');
console.log('PASS: both download routes and DFU support server-checked PINs; integration not falsely activated.');
