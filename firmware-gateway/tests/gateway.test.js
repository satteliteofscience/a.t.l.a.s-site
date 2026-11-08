import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import gateway from '../src/index.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const ORIGIN='https://satteliteofscience.github.io';
const index={
 builds:{
  'release-test-1':{channel:'release',object_key:'release/test-1.hex',filename:'test-1.hex',sha256:'a'.repeat(64)},
  'early-test-1':{channel:'early',object_key:'early/test-1.hex',filename:'test-2.hex',sha256:'b'.repeat(64)}
 }
};
const hash=async s=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))).toString('hex');
async function fakeEnv(opts={}){
 const codes={
  release:{enabled:true,pin_sha256:await hash('Shared-PIN-123456')},
  testers:[
   {id:'approved',enabled:true,pin_sha256:await hash('PERSONAL-KEY-EXAMPLE-1'),build_ids:['early-test-1']},
   {id:'revoked',enabled:false,pin_sha256:await hash('PERSONAL-KEY-REVOKED'),build_ids:['early-test-1']}
  ]
 };
 return {
  ACCESS_CODES_JSON:JSON.stringify(codes),
  ACCESS_LIMITER:{limit:async()=>({success:opts.limited!==true})},
  FIRMWARE:{get:async key=>key==='_internal/firmware-index.json'?
   {text:async()=>JSON.stringify(index)}:
   key==='release/test-1.hex'||key==='early/test-1.hex'?
   {body:new Uint8Array([58,48,48,48,48,48,48,49,70,70,10]),size:11}:null}
 };
}
async function call(env,id,pin,origin=ORIGIN,method='POST'){
 return gateway.fetch(new Request('https://gateway.example/api/firmware/'+id,{
  method,headers:{'Content-Type':'application/json','Origin':origin},
  body:method==='POST'?JSON.stringify({pin}):undefined
 }),env);
}
test('shared release PIN allows release but not early test build',async()=>{
 const env=await fakeEnv();
 const success=await call(env,'release-test-1','Shared-PIN-123456');
 assert.equal(success.status,200);
 assert.equal(success.headers.get('X-ATLAS-SHA256'),'a'.repeat(64));
 assert.equal((await success.arrayBuffer()).byteLength,11);
 assert.equal((await call(env,'early-test-1','Shared-PIN-123456')).status,401);
});
test('individual tester key can be revoked and cannot access release',async()=>{
 const env=await fakeEnv();
 assert.equal((await call(env,'early-test-1','PERSONAL-KEY-EXAMPLE-1')).status,200);
 assert.equal((await call(env,'release-test-1','PERSONAL-KEY-EXAMPLE-1')).status,401);
 assert.equal((await call(env,'early-test-1','PERSONAL-KEY-REVOKED')).status,401);
 assert.equal((await call(env,'early-test-1','not-a-valid-key')).status,401);
});
test('rate limiter and browser origin validation',async()=>{
 assert.equal((await call(await fakeEnv({limited:true}),'release-test-1','Shared-PIN-123456')).status,429);
 assert.equal((await call(await fakeEnv(),'release-test-1','Shared-PIN-123456','https://invalid.example')).status,403);
 const options=await call(await fakeEnv(),'release-test-1',null,ORIGIN,'OPTIONS');
 assert.equal(options.status,204);
 assert.equal(options.headers.get('Access-Control-Allow-Origin'),ORIGIN);
});
