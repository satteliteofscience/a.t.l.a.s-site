/* A.T.L.A.S. firmware gate — deploy separately to Cloudflare Workers.
 * No secret PINs, tester credentials or firmware binaries belong in this public repo. */
const ORIGIN='https://satteliteofscience.github.io';
const MANIFEST_KEY='_internal/firmware-index.json';
const HEX_ID=/^[a-z0-9][a-z0-9-]{2,90}$/;
const SHA256=/^[a-f0-9]{64}$/i;
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
async function allowed(env,build,pin){
 if(typeof pin!=='string'||pin.length<8||pin.length>128)return false;
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
async function lookupBuild(env,id){
 if(!HEX_ID.test(id))return null;
 const indexFile=await env.FIRMWARE.get(MANIFEST_KEY);
 if(!indexFile)return null;
 let index;
 try{index=JSON.parse(await indexFile.text());}catch{return null;}
 const build=index?.builds?.[id];
 if(!build||!['release','early'].includes(build.channel))return null;
 const key=build.object_key;
 if(typeof key!=='string'||!/^([a-z0-9-]+\/)+[a-zA-Z0-9_.-]+\.hex$/.test(key)||key.startsWith('_internal/'))return null;
 if(typeof build.filename!=='string'||!/^[a-zA-Z0-9_.() +\-]{1,180}\.hex$/i.test(build.filename))return null;
 if(!SHA256.test(build.sha256||''))return null;
 return {...build,id};
}
export default {
 async fetch(request,env){
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
   const indexFile=await env.FIRMWARE.get(MANIFEST_KEY);
   if(!indexFile)return json('Catalog unavailable',503,cors);
   let index;
   try{index=JSON.parse(await indexFile.text());}catch{return json('Invalid catalog',503,cors);}
   const approved=new Set(['matek-h743-wing-v3','cube-orange-plus','uni-ic743-mini']);
   const published=[];
   for(const [id,entry] of Object.entries(index?.builds||{}).slice(0,100)){
    if(entry?.published!==true||entry.channel!=='release'||!approved.has(entry.board_id)||
       !/^[0-9]+[.][0-9]+$/.test(entry.version||'')||
       !Number.isSafeInteger(entry.bytes)||entry.bytes<=0)continue;
    const build=await lookupBuild(env,id);
    if(!build)continue;
    const head=await env.FIRMWARE.head(build.object_key);
    if(!head||head.size!==entry.bytes)continue;
    published.push({
     board_id:entry.board_id,version:entry.version,secure_id:id,channel:'release',
     filename:build.filename,sha256:build.sha256.toLowerCase(),bytes:entry.bytes,
     timestamp:Number.isSafeInteger(entry.timestamp)?entry.timestamp:0,
     label:typeof entry.label==='string'?entry.label.slice(0,160):'A.T.L.A.S. Release '+entry.version
    });
   }
   return respond(JSON.stringify({schema:1,builds:published}),200,{
    ...cors,'Content-Type':'application/json; charset=utf-8'
   });
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
