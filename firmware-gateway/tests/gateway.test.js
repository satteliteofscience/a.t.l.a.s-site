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

test('public catalog only lists explicitly published, existing, correctly sized release objects',async()=>{
 const env=await fakeEnv();
 const catalog={
  schema:1,builds:{
   'matek-h743-v3-release-1-2':{
    channel:'release',board_id:'matek-h743-wing-v3',version:'1.2',
    object_key:'release/matek-h743-v3-release-1-2.hex',
    filename:'ATLAS-Matek-H743-V3-release-1.2.hex',
    sha256:'c'.repeat(64),bytes:11,timestamp:1794480000,published:true
   },
   'cube-orange-plus-release-1-2':{
    channel:'release',board_id:'cube-orange-plus',version:'1.2',
    object_key:'release/cube-orange-plus-release-1-2.hex',
    filename:'ATLAS-Cube-Orange-Plus-release-1.2.hex',
    sha256:'d'.repeat(64),bytes:20,published:true
   },
   'hidden-test-1':{
    channel:'early',board_id:'matek-h743-wing-v3',version:'1.2',
    object_key:'early/hidden-test-1.hex',filename:'hidden-test-1.hex',
    sha256:'e'.repeat(64),bytes:11,published:true
   }
  }
 };
 env.FIRMWARE.get=async key=>key==='_internal/firmware-index.json'?
  {text:async()=>JSON.stringify(catalog)}:null;
 env.FIRMWARE.head=async key=>key==='release/matek-h743-v3-release-1-2.hex'?{size:11}:
  key==='release/cube-orange-plus-release-1-2.hex'?{size:15}:null;
 const request=new Request('https://gateway.example/api/catalog',{headers:{Origin:ORIGIN}});
 const response=await gateway.fetch(request,env);
 assert.equal(response.status,200);
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),ORIGIN);
 const body=await response.json();
 assert.equal(body.schema,1);
 assert.equal(body.builds.length,1);
 assert.equal(body.builds[0].version,'1.2');
 assert.equal(body.builds[0].board_id,'matek-h743-wing-v3');
 assert.equal(body.builds[0].secure_id,'matek-h743-v3-release-1-2');
 assert.equal('object_key' in body.builds[0],false);
 assert.equal((await gateway.fetch(new Request('https://gateway.example/api/catalog',{
  headers:{Origin:'https://another.example'}
 }),env)).status,403);
});
