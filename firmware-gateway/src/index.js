/* A.T.L.A.S. firmware gate — deploy separately to Cloudflare Workers.
 * No secret PINs, tester credentials or firmware binaries belong in this public repo. */
const ORIGIN='https://satteliteofscience.github.io';
const MANIFEST_KEY='_internal/firmware-index.json';
const HEX_ID=/^[a-z0-9][a-z0-9-]{2,90}$/;
const SHA256=/^[a-f0-9]{64}$/i;
// Shortest accepted PIN or tester key: the documented minimum. An older, shorter release PIN can be kept working by setting the plain variable
// MIN_PIN_LENGTH (for example "8") in the Worker settings; the better fix is a new PIN of at least 12 random characters.
const MIN_PIN_LENGTH=12;
// The public catalog may be served from the edge cache (and the browser) for this many seconds: only a cache miss reads the bucket.
const CATALOG_TTL=60;
const respond=(body,status=200,headers={})=>new Response(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const json=(message,status=400,headers={})=>respond(JSON.stringify({error:message}),status,{'Content-Type':'application/json; charset=utf-8',...headers});
async function digestPin(pin){
 const bytes=new TextEncoder().encode(pin);
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
function sameHash(a,b){
 if(typeof a!=='string'||typeof b!=='string'||a.length!==64||b.length!==64)return false;
 let diff=0;
 for(let i=0;i<64;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}
function minPinLength(env){
 const configured=Number(env?.MIN_PIN_LENGTH);
 return Number.isInteger(configured)&&configured>=1?configured:MIN_PIN_LENGTH;
}
async function allowed(env,build,pin){
 if(typeof pin!=='string'||pin.length<minPinLength(env)||pin.length>128)return false;
 let config;
 try{config=JSON.parse(env.ACCESS_CODES_JSON||'{}');}catch{return false;}
 const h=await digestPin(pin);
 if(build.channel==='release')return sameHash(h,config?.release?.pin_sha256) && config?.release?.enabled===true;
 if(build.channel!=='early')return false;
 const testers=Array.isArray(config?.testers)?config.testers:[];
 return testers.some(t=>
   t?.enabled===true && sameHash(h,t.pin_sha256) &&
   (!t.expires_at||new Date(t.expires_at).getTime()>Date.now()) &&
   (!Array.isArray(t.build_ids)||t.build_ids.includes(build.id))
 );
}
/** The private index of builds, or null when it is missing or not valid JSON. */
async function loadIndex(env){
 const indexFile=await env.FIRMWARE.get(MANIFEST_KEY);
 if(!indexFile)return null;
 try{return JSON.parse(await indexFile.text());}catch{return null;}
}
/** One build of an already loaded index, or null when its entry is not well formed. */
function checkBuild(index,id){
 if(!HEX_ID.test(id))return null;
 const build=index?.builds?.[id];
 if(!build||!['release','early'].includes(build.channel))return null;
 const key=build.object_key;
 if(typeof key!=='string'||!/^([a-z0-9-]+\/)+[a-zA-Z0-9_.-]+\.hex$/.test(key)||key.startsWith('_internal/'))return null;
 if(typeof build.filename!=='string'||!/^[a-zA-Z0-9_.() +\-]{1,180}\.hex$/i.test(build.filename))return null;
 if(!SHA256.test(build.sha256||''))return null;
 return {...build,id};
}
async function lookupBuild(env,id){
 if(!HEX_ID.test(id))return null;
 const index=await loadIndex(env);
 return index?checkBuild(index,id):null;
}
/** The public catalog: the index is read once and the object sizes are checked side by side. */
async function buildCatalog(env){
 const index=await loadIndex(env);
 if(!index)return null;
 const approved=new Set(['matek-h743-wing-v3','cube-orange-plus','uni-ic743-mini']);
 const candidates=[];
 for(const [id,entry] of Object.entries(index?.builds||{}).slice(0,100)){
  if(entry?.published!==true||entry.channel!=='release'||!approved.has(entry.board_id)||
     !/^[0-9]+[.][0-9]+$/.test(entry.version||'')||
     !Number.isSafeInteger(entry.bytes)||entry.bytes<=0)continue;
  const build=checkBuild(index,id);
  if(build)candidates.push({id,entry,build});
 }
 const heads=await Promise.all(candidates.map(c=>Promise.resolve(env.FIRMWARE.head(c.build.object_key)).catch(()=>null)));
 const published=[];
 candidates.forEach((c,i)=>{
  const head=heads[i];
  if(!head||head.size!==c.entry.bytes)return;
  published.push({
   board_id:c.entry.board_id,version:c.entry.version,secure_id:c.id,channel:'release',
   filename:c.build.filename,sha256:c.build.sha256.toLowerCase(),bytes:c.entry.bytes,
   timestamp:Number.isSafeInteger(c.entry.timestamp)?c.entry.timestamp:0,
   label:typeof c.entry.label==='string'?c.entry.label.slice(0,160):'A.T.L.A.S. Release '+c.entry.version
  });
 });
 return {schema:1,builds:published};
}
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url),origin=request.headers.get('Origin');
  const cors=origin===ORIGIN?{
   'Access-Control-Allow-Origin':ORIGIN,
   'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
   'Access-Control-Allow-Headers':'Content-Type',
   'Access-Control-Expose-Headers':'X-ATLAS-SHA256, Content-Disposition',
   'Vary':'Origin'
  }:{'Vary':'Origin'};
  if(url.pathname==='/health'&&request.method==='GET')return json('operational',200,cors);
  if(url.pathname==='/api/firmware'&&request.method==='OPTIONS'&&origin===ORIGIN)return respond(null,204,{...cors,'Access-Control-Max-Age':'600'});
  if(url.pathname.startsWith('/api/firmware/')&&request.method==='OPTIONS'&&origin===ORIGIN)return respond(null,204,{...cors,'Access-Control-Max-Age':'600'});
  if(origin!==ORIGIN)return json('Forbidden',403,cors);
  if(url.pathname==='/api/catalog'&&request.method==='GET'){
   if(!env.FIRMWARE)return json('Catalog not configured',503,cors);
   // Only the allowed origin gets here, so one cached answer serves everybody.
   const cache=typeof caches!=='undefined'?caches.default:null;
   const cacheKey=new Request(url.origin+'/api/catalog');
   if(cache){const hit=await cache.match(cacheKey);if(hit)return hit;}
   // A miss reads the private bucket, so only a miss is rate limited (the CATALOG_LIMITER binding is optional).
   if(env.CATALOG_LIMITER){
    const limited=await env.CATALOG_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});
    if(!limited.success)return json('Too many requests',429,{...cors,'Retry-After':'60'});
   }
   const catalog=await buildCatalog(env);
   if(!catalog)return json('Catalog unavailable',503,cors);
   const response=respond(JSON.stringify(catalog),200,{
    ...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age='+CATALOG_TTL
   });
   if(cache){const store=cache.put(cacheKey,response.clone());if(typeof ctx?.waitUntil==='function')ctx.waitUntil(store);else await store;}
   return response;
  }
  if(request.method!=='POST'||!url.pathname.startsWith('/api/firmware/'))return json('Not found',404,cors);
  if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return json('JSON required',415,cors);
  const id=url.pathname.slice('/api/firmware/'.length);
  if(!HEX_ID.test(id))return json('Not found',404,cors);
  if(!env.FIRMWARE||!env.ACCESS_CODES_JSON||!env.ACCESS_LIMITER)return json('Gateway not configured',503,cors);
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const limited=await env.ACCESS_LIMITER.limit({key:ip});
  if(!limited.success)return json('Too many attempts',429,{...cors,'Retry-After':'60'});
  const size=Number(request.headers.get('Content-Length')||0);
  if(size>512)return json('Invalid request',413,cors);
  let input;
  try{const raw=await request.text();if(raw.length>512)return json('Invalid request',413,cors);input=JSON.parse(raw);}
  catch{return json('Invalid JSON',400,cors);}
  const build=await lookupBuild(env,id);
  // Return the same denial for missing builds and wrong codes: no information leak.
  if(!build||!(await allowed(env,build,input?.pin)))return json('Invalid key or unavailable firmware',401,cors);
  const object=await env.FIRMWARE.get(build.object_key);
  if(!object)return json('Firmware unavailable',404,cors);
  return respond(object.body,200,{
    ...cors,
    'Content-Type':'application/octet-stream',
    'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(build.filename),
    'X-ATLAS-SHA256':build.sha256.toLowerCase(),
    'Content-Length':String(object.size),
    'X-Robots-Tag':'noindex, nofollow'
  });
 }
};
