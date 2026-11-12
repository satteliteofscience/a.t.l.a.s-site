/* A.T.L.A.S. — metadata-only release catalogue. Firmware stays in private R2. */
(()=>{
'use strict';
const targets=new Set(['matek-h743-wing-v3','cube-orange-plus','uni-ic743-mini']);
const validId=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9-]{2,90}$/.test(s);
const validName=s=>typeof s==='string'&&/^[a-zA-Z0-9_.() +\-]{1,180}\.hex$/i.test(s);
const valid=e=>e&&targets.has(e.board_id)&&validId(e.secure_id)&&
 e.channel==='release'&&/^\d+\.\d+$/.test(e.version||'')&&
 validName(e.filename)&&/^[a-f0-9]{64}$/i.test(e.sha256||'')&&
 Number.isSafeInteger(e.bytes)&&e.bytes>0;
const compare=(a,b)=>{
 const x=String(a.version||'0').split('.').map(Number),y=String(b.version||'0').split('.').map(Number);
 return (y[0]-x[0])||(y[1]-x[1])||(Number(b.timestamp||0)-Number(a.timestamp||0));
};
async function remote(){
 try{
  const r=await fetch(new URL('data/firmware-access.json',document.baseURI),{cache:'no-store'});
  if(!r.ok)return [];
  const config=await r.json();
  if(config.enabled!==true)return [];
  const url=new URL(config.gateway_url);
  if(url.protocol!=='https:'||url.pathname!=='/'||url.username||url.password||url.search||url.hash)return [];
  const response=await fetch(url.origin+'/api/catalog',{cache:'no-store',credentials:'omit'});
  if(!response.ok)return [];
  const data=await response.json();
  if(data.schema!==1||!Array.isArray(data.builds))return [];
  return data.builds.filter(valid).map(item=>({
   board_id:item.board_id,secure_id:item.secure_id,filename:item.filename,
   version:item.version,channel:'release',sha256:item.sha256.toLowerCase(),
   bytes:item.bytes,timestamp:Number(item.timestamp)||0,
   label:typeof item.label==='string'?item.label.slice(0,160):'A.T.L.A.S. Release '+item.version
  }));
 }catch{return [];} // Existing gateway without /api/catalog: retain 1.0.
}
function combine(board,existing,published){
 const entries=new Map();
 for(const entry of Array.isArray(existing)?existing:[]){
  if(entry?.channel==='release'&&validId(entry.secure_id)&&validName(entry.filename)&&/^[a-f0-9]{64}$/i.test(entry.sha256||'')){
   entries.set(entry.secure_id,entry);
  }
 }
 for(const entry of published){if(entry.board_id===board&&valid(entry))entries.set(entry.secure_id,entry);}
 return [...entries.values()].sort(compare);
}
async function mergeSiteCatalog(data){
 if(!data||!Array.isArray(data.boards))return data;
 const newer=await remote();
 return {...data,boards:data.boards.map(board=>{
  if(!targets.has(board.id))return board;
  const downloads=combine(board.id,board.downloads,newer);
  return {...board,downloads,version:downloads[0]?.version||board.version};
 })};
}
async function boardFiles(board,files){return combine(board,files,await remote());}
window.AtlasFirmwareCatalog={mergeSiteCatalog,boardFiles};
})();
