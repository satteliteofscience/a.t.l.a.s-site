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

function catalogOf(count){
 const builds={};
 for(let i=1;i<=count;i++)builds['matek-h743-v3-release-1-'+i]={
  channel:'release',board_id:'matek-h743-wing-v3',version:'1.'+i,object_key:'release/matek-'+i+'.hex',
  filename:'ATLAS-Matek-1.'+i+'.hex',sha256:'c'.repeat(64),bytes:11,timestamp:1794480000+i,published:true
 };
 return {schema:1,builds};
}
const askCatalog=(env,origin=ORIGIN)=>gateway.fetch(new Request('https://gateway.example/api/catalog',{headers:{Origin:origin}}),env);

test('a PIN shorter than the documented minimum is refused even when its hash is configured; MIN_PIN_LENGTH can lower the limit',async()=>{
 const env=await fakeEnv();
 const short='Short-PIN-9',twelve='Twelve-chars';   // 11 and 12 characters
 env.ACCESS_CODES_JSON=JSON.stringify({release:{enabled:true,pin_sha256:await hash(short)},testers:[]});
 assert.equal((await call(env,'release-test-1',short)).status,401);
 env.MIN_PIN_LENGTH='8';
 assert.equal((await call(env,'release-test-1',short)).status,200);
 env.MIN_PIN_LENGTH='0';   // nonsense falls back to the documented minimum
 assert.equal((await call(env,'release-test-1',short)).status,401);
 delete env.MIN_PIN_LENGTH;
 env.ACCESS_CODES_JSON=JSON.stringify({release:{enabled:true,pin_sha256:await hash(twelve)},testers:[]});
 assert.equal((await call(env,'release-test-1',twelve)).status,200);
});

test('the catalog reads the private index once and checks the object sizes side by side',async()=>{
 const env=await fakeEnv();
 const catalog=catalogOf(6);
 let indexReads=0,inFlight=0,maxInFlight=0;
 env.FIRMWARE.get=async key=>{if(key==='_internal/firmware-index.json'){indexReads++;return {text:async()=>JSON.stringify(catalog)};}return null;};
 env.FIRMWARE.head=async()=>{inFlight++;maxInFlight=Math.max(maxInFlight,inFlight);await new Promise(r=>setTimeout(r,5));inFlight--;return {size:11};};
 const response=await askCatalog(env);
 assert.equal(response.status,200);
 assert.equal((await response.json()).builds.length,6);
 assert.equal(indexReads,1);            // it used to read the index once per build (7 reads here)
 assert.ok(maxInFlight>1);              // and to ask for the sizes one after another
 assert.match(response.headers.get('Cache-Control'),/public, max-age=60/);
 // one failing size lookup drops that build only
 env.FIRMWARE.head=async key=>{if(key==='release/matek-2.hex')throw new Error('bucket hiccup');return {size:11};};
 const partial=await (await askCatalog(env)).json();
 assert.equal(partial.builds.length,5);
 assert.ok(!partial.builds.some(b=>b.version==='1.2'));
});

test('after the first answer the catalog comes from the edge cache: only a miss reads the bucket and counts against the limiter',async()=>{
 const stored=new Map();let puts=0;
 globalThis.caches={default:{match:async req=>stored.get(req.url)?.clone(),put:async(req,res)=>{puts++;stored.set(req.url,res);}}};
 try{
  const env=await fakeEnv();let reads=0,limits=0;
  const catalog=catalogOf(1);
  env.FIRMWARE.get=async key=>{reads++;return key==='_internal/firmware-index.json'?{text:async()=>JSON.stringify(catalog)}:null;};
  env.FIRMWARE.head=async()=>({size:11});
  env.CATALOG_LIMITER={limit:async()=>{limits++;return {success:true};}};
  const first=await askCatalog(env),second=await askCatalog(env);
  assert.equal(first.status,200);assert.equal(second.status,200);
  assert.deepEqual(await second.json(),await first.json());
  assert.equal(reads,1);assert.equal(limits,1);assert.equal(puts,1);
  assert.equal(second.headers.get('Access-Control-Allow-Origin'),ORIGIN);
  // another origin is refused before the cache is consulted
  assert.equal((await askCatalog(env,'https://another.example')).status,403);
 }finally{delete globalThis.caches;}
});

test('a catalog miss over the limit gets 429 with Retry-After; without the binding the catalog still works',async()=>{
 const env=await fakeEnv();
 env.FIRMWARE.get=async key=>key==='_internal/firmware-index.json'?{text:async()=>JSON.stringify({schema:1,builds:{}})}:null;
 env.CATALOG_LIMITER={limit:async()=>({success:false})};
 const refused=await askCatalog(env);
 assert.equal(refused.status,429);assert.equal(refused.headers.get('Retry-After'),'60');
 delete env.CATALOG_LIMITER;
 assert.equal((await askCatalog(env)).status,200);
});
