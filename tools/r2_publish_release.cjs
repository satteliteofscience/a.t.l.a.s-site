#!/usr/bin/env node
/* A.T.L.A.S. — prepare and merge a firmware release for the private R2 bucket (metadata only; the HEX never enters this repository).
 *
 *   node tools/r2_publish_release.cjs prepare --version 2.0 --matek F.hex --cube F.hex --uni F.hex [--out DIR] [--publish]
 *       Validates each Intel HEX exactly like the configurator does (contiguous image from 0x08000000, bootloader included, board marker),
 *       computes SHA-256 / bytes / timestamp and writes release-<version>-index-additions.json and r2-upload-<version>.ps1 into DIR
 *       (default firmware-gateway/release-<version>). Entries are "published": false unless --publish is given.
 *   node tools/r2_publish_release.cjs merge --index CURRENT.json --additions ADD.json --out MERGED.json [--publish]
 *       Appends the additions to the CURRENT private _internal/firmware-index.json (downloaded from R2) without touching any existing record.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const BUCKET='atlas-firmware-private';
const NAME='A.T.L.A.S-G.L.O.B.A.L';
const BOARDS=Object.freeze({
 matek:{board_id:'matek-h743-wing-v3',slug:'matek-h743-v3',file:'Matek-H743-V3',title:'Matek H743-WING V3',marker:'matek-h743-wing-v3',markerRequired:false},
 cube:{board_id:'cube-orange-plus',slug:'cube-orange-plus',file:'Cube-Orange-Plus',title:'Cube Orange Plus',marker:'cube-orange-plus',markerRequired:true},
 uni:{board_id:'uni-ic743-mini',slug:'uni-ic743-mini',file:'Uni-IC743-Mini',title:'Uni-IC743 Mini',marker:'uni-ic743-mini',markerRequired:true}
});
const ID=/^[a-z0-9][a-z0-9-]{2,90}$/,KEY=/^([a-z0-9-]+\/)+[a-zA-Z0-9_.-]+\.hex$/,NAMEOK=/^[a-zA-Z0-9_.() +\-]{1,180}\.hex$/i,SHA=/^[a-f0-9]{64}$/;

/** The configurator's own parser, so a file that passes here also passes the DFU loader. */
function loadParser(){
 const sandbox={window:{},TextEncoder,Uint8Array,Error,Math,parseInt,Number,String};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'js/configurator/dfu-flasher.js'),'utf8'),sandbox);
 return sandbox.window.AtlasDFU.parseIntelHex;
}
const versionTag=v=>String(v).replace('.','-');
function buildId(kind,version){return `${BOARDS[kind].slug}-release-${versionTag(version)}`;}
function entryFor(kind,version,info,publish){
 const b=BOARDS[kind];
 return {
  channel:'release',object_key:`release/${buildId(kind,version)}.hex`,filename:`ATLAS-${b.file}-release-${version}.hex`,
  board_id:b.board_id,version:String(version),sha256:info.sha256,bytes:info.bytes,image_bytes:info.image_bytes,timestamp:info.timestamp,
  label:`A.T.L.A.S. Release ${version} · ${NAME} · ArduPlane 4.7.2 · ${b.title}`,published:!!publish
 };
}
function inspect(kind,file,parse,now=Math.floor(Date.now()/1000)){
 const raw=fs.readFileSync(file);
 const text=raw.toString('latin1');
 const parsed=parse(text);
 const b=BOARDS[kind];
 if(parsed.detectedTarget!==b.marker&&(parsed.detectedTarget!==null||b.markerRequired))
  throw Error(`${path.basename(file)} is not a ${b.title} build (target marker: ${parsed.detectedTarget??'none'}). Never publish a HEX under the wrong board.`);
 return {sha256:crypto.createHash('sha256').update(raw).digest('hex'),bytes:raw.length,image_bytes:parsed.dataBytes,timestamp:now,
  address_start:'0x'+parsed.flashStart.toString(16).toUpperCase().padStart(8,'0'),address_end_exclusive:'0x'+parsed.flashEndExclusive.toString(16).toUpperCase().padStart(8,'0'),
  marker:parsed.detectedTarget};
}
function validEntry(id,e){
 const problems=[];
 if(!ID.test(id))problems.push('id');
 if(e.channel!=='release')problems.push('channel');
 if(!KEY.test(e.object_key||'')||e.object_key.startsWith('_internal/'))problems.push('object_key');
 if(!NAMEOK.test(e.filename||''))problems.push('filename');
 if(!SHA.test(e.sha256||''))problems.push('sha256');
 if(!Object.values(BOARDS).some(b=>b.board_id===e.board_id))problems.push('board_id');
 if(!/^[0-9]+[.][0-9]+$/.test(e.version||''))problems.push('version');
 if(!Number.isSafeInteger(e.bytes)||e.bytes<=0)problems.push('bytes');
 if(typeof e.published!=='boolean')problems.push('published');
 return problems;
}
/** Append additions to the current private index. Existing records are never changed; clashes are errors. */
function merge(current,additions,publish){
 if(!current||current.schema!==1||typeof current.builds!=='object')throw Error('The current index must be the schema-1 _internal/firmware-index.json downloaded from R2');
 const out={...current,builds:{...current.builds}};
 const keys=new Set(Object.values(out.builds).map(b=>b.object_key));
 for(const [id,entry] of Object.entries(additions.builds||{})){
  const problems=validEntry(id,entry);
  if(problems.length)throw Error(`Entry ${id} is invalid: ${problems.join(', ')}`);
  if(out.builds[id]){
   // The same build again (only "published" may differ): nothing changes, except that --publish switches it on.
   if(JSON.stringify({...out.builds[id],published:entry.published})!==JSON.stringify(entry))throw Error(`Build ${id} already exists in the index with different data. Use a new unique id and file name.`);
   if(publish)out.builds[id]={...out.builds[id],published:true};
   continue;
  }
  if(keys.has(entry.object_key))throw Error(`Object key ${entry.object_key} is already used by another build`);
  out.builds[id]={...entry,published:publish?true:entry.published};
  keys.add(entry.object_key);
 }
 return out;
}
function uploadScript(version,rows,dir,publish){
 const q=s=>`'${String(s).replace(/'/g,"''")}'`;
 const lines=[
  `# A.T.L.A.S. ${version} — upload to the PRIVATE R2 bucket ${BUCKET}. Run from the repository root after "npx wrangler login" (Wrangler 4: --remote talks to the real bucket).`,
  `# Review every line first. Nothing here makes a file public; the Worker serves it only after the PIN check, and only for entries with "published": true.`,
  "$ErrorActionPreference = 'Stop'",
  `$dir = ${q(dir)}`
 ];
 for(const r of rows)lines.push(`npx wrangler r2 object put ${BUCKET}/${r.object_key} --file ${q(r.path)} --content-type application/octet-stream --remote`);
 lines.push(
  `npx wrangler r2 object get ${BUCKET}/_internal/firmware-index.json --file "$dir/current-index.json" --remote`,
  `node tools/r2_publish_release.cjs merge --index "$dir/current-index.json" --additions "$dir/release-${version}-index-additions.json" --out "$dir/merged-index.json"${publish?' --publish':''}`,
  `# Keep a copy of the old index: "$dir/current-index.json" is the rollback.`,
  `npx wrangler r2 object put ${BUCKET}/_internal/firmware-index.json --file "$dir/merged-index.json" --content-type application/json --remote`
 );
 return lines.join('\r\n')+'\r\n';
}
function args(argv){const o={_:[]};for(let i=0;i<argv.length;i++){const a=argv[i];if(a.startsWith('--')){const k=a.slice(2);const next=argv[i+1];if(next===undefined||next.startsWith('--'))o[k]=true;else{o[k]=next;i++;}}else o._.push(a);}return o;}
function main(argv){
 const a=args(argv),cmd=a._[0];
 if(cmd==='prepare'){
  const version=String(a.version||'');
  if(!/^[0-9]+[.][0-9]+$/.test(version))throw Error('--version 2.0 required');
  const parse=loadParser(),builds={},rows=[],now=Math.floor(Date.now()/1000);
  for(const kind of Object.keys(BOARDS)){
   if(!a[kind])continue;
   const file=path.resolve(String(a[kind]));
   const info=inspect(kind,file,parse,now);
   const entry=entryFor(kind,version,info,a.publish);
   builds[buildId(kind,version)]=entry;rows.push({object_key:entry.object_key,path:file});
   console.log(`${BOARDS[kind].title}: ${entry.filename}  ${info.bytes} bytes  image ${info.image_bytes}  ${info.address_start}..${info.address_end_exclusive}  marker ${info.marker??'none'}  sha256 ${info.sha256}`);
  }
  if(!rows.length)throw Error('Give at least one of --matek, --cube, --uni');
  const dir=path.resolve(String(a.out||path.join(ROOT,'firmware-gateway',`release-${version}`)));
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,`release-${version}-index-additions.json`),JSON.stringify({schema:1,note:`Real values for release ${version}. Merge into the CURRENT private _internal/firmware-index.json with: node tools/r2_publish_release.cjs merge`,builds},null,2)+'\n');
  fs.writeFileSync(path.join(dir,`r2-upload-${version}.ps1`),uploadScript(version,rows,dir,a.publish));
  console.log(`written to ${dir}: release-${version}-index-additions.json and r2-upload-${version}.ps1 (published: ${a.publish?'true':'false'})`);
  return;
 }
 if(cmd==='merge'){
  if(!a.index||!a.additions||!a.out)throw Error('--index, --additions and --out required');
  const merged=merge(JSON.parse(fs.readFileSync(a.index,'utf8')),JSON.parse(fs.readFileSync(a.additions,'utf8')),!!a.publish);
  fs.writeFileSync(a.out,JSON.stringify(merged,null,2)+'\n');
  console.log(`merged index written: ${a.out} (${Object.keys(merged.builds).length} builds)`);
  return;
 }
 throw Error('usage: r2_publish_release.cjs prepare|merge (see the header of this file)');
}
module.exports={BOARDS,buildId,entryFor,inspect,merge,validEntry,loadParser,uploadScript};
if(require.main===module){try{main(process.argv.slice(2));}catch(error){console.error('ERROR: '+error.message);process.exit(1);}}
