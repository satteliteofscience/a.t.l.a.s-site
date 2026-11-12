/* Regress transient catalog and PIN gateway outages, plus current release copy. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const app=read('js/site/app.js'),gate=read('js/site/firmware-access.js');
const home=read('index.html'),translations=read('js/site/i18n.js'),meta=read('js/site/page-meta.js');
const css=read('css/styles.css');
const catalog=JSON.parse(read('data/releases.json'));
const ids=['cube-orange-plus','matek-h743-wing-v3','uni-ic743-mini'];
for(const id of ids)assert.ok(catalog.boards.some(b=>b.id===id && b.status==='available' && b.downloads.length),'Required protected board: '+id);
assert.ok(!home.includes('Для Uni-IC743 Mini пока доступна локальная установка HEX'),'stale public-copy restriction');
for(const name of ['Matek H743-WING V3','Cube Orange Plus','Uni-IC743 Mini']){
 assert.ok(home.includes(name),'homepage must name '+name);
 assert.ok(meta.includes(name),'language-aware metadata must name '+name);
 const og=home.match(/<meta property="og:description" content="([^"]+)"/);
 assert.ok(og && og[1].includes(name),'social preview must name '+name);
}
assert.match(home,/проверены по формату и контрольным суммам; это не заменяет испытаний на конкретном контроллере/,'homepage must not overstate verification: format/checksum checks do not replace hardware testing');
assert.ok(translations.includes('PIN-protected builds for Matek H743-WING V3, Cube Orange Plus and Uni-IC743 Mini are published in the catalog'));
assert.ok(translations.includes('Захищені збірки для Matek H743-WING V3, Cube Orange Plus та Uni-IC743 Mini публікуються в каталозі'));
assert.ok(app.includes('plannedChip.hidden=!hasPlanned'),'hide empty Planned filter only while no future builds exist');
assert.ok(css.includes('.filter-chip[hidden]{display:none!important}'),'hidden filter must be invisible');
assert.ok(gate.includes("method:'POST'")&&gate.includes("JSON.stringify({pin})"),'PIN authorization must be preserved');
assert.ok(gate.includes("crypto.subtle.digest('SHA-256'"),'firmware integrity verification required');

async function checkCatalogRecovery(){
 const start=app.indexOf('  async function loadData() {');
 const end=app.indexOf("\n  el('boardSearch')",start);
 assert.ok(start>=0&&end>start,'catalog reload function missing');
 const loader=app.slice(start,end);
 let attempts=0,renders=0;
 const state={data:catalog,catalogSignature:JSON.stringify(catalog.boards),query:'',filter:'all',fetchFailed:false};
 const nodes={downloadStatus:{textContent:''}};
 const ctx={
  state,console,window:{},
  el:id=>id==='atlasEmbeddedData'?null:(nodes[id]||(nodes[id]={textContent:''})),
  tr:x=>x,
  renderBoards:()=>{renders++;nodes.downloadStatus.textContent='Recovered';},
  bindPublicCatalog:()=>{},
  fetch:async()=>{attempts++;if(attempts===1)throw Error('temporary outage');return {ok:true,json:async()=>catalog};},
  JSON
 };
 vm.runInNewContext('let catalogRequestActive=false;\n'+loader+'\nthis.testLoadData=loadData;',ctx);
 await ctx.testLoadData();
 assert.equal(renders,0,'transient outage must keep rendered firmware cards');
 assert.equal(state.data,catalog,'transient outage must retain last valid release catalog');
 assert.equal(state.fetchFailed,true);
 assert.match(nodes.downloadStatus.textContent,/Показаны ранее загруженные/);
 await ctx.testLoadData();
 assert.equal(attempts,2);
 assert.equal(renders,1,'recovery with unchanged data must refresh the warning status');
 assert.equal(state.fetchFailed,false);
 await ctx.testLoadData();
 assert.equal(attempts,3);
 assert.equal(renders,1,'unchanged healthy catalog should not rebuild cards every minute');
}
async function checkPinConfigRetry(){
 const start=gate.indexOf(' let configPromise=null;');
 const end=gate.indexOf(' let modal=null,active=false;',start);
 assert.ok(start>=0&&end>start,'resilient gateway config loader missing');
 const loader=gate.slice(start,end);
 let requests=0;
 const config={enabled:true,gateway_url:'https://atlas-firmware-gateway.gamingchanel57.workers.dev/'};
 const ctx={
  document:{baseURI:'https://satteliteofscience.github.io/a.t.l.a.s-site/'},
  URL,
  safeAPI:s=>s===config.gateway_url?'https://atlas-firmware-gateway.gamingchanel57.workers.dev':null,
  fetch:async()=>{requests++;if(requests===1)throw Error('offline');return {ok:true,json:async()=>config};}
 };
 vm.runInNewContext(loader+'\nthis.testLoadAccessConfig=loadAccessConfig;',ctx);
 assert.equal(await ctx.testLoadAccessConfig(),null,'first temporary outage is handled');
 const recovered=await ctx.testLoadAccessConfig();
 assert.equal(recovered.enabled,true,'second attempt recovers');
 assert.equal(await ctx.testLoadAccessConfig(),recovered,'valid configuration is cached');
 assert.equal(requests,2,'failed config retried once, successful config reused');
}
(async()=>{
 await checkCatalogRecovery();
 await checkPinConfigRetry();
 console.log('PASS: 3-board homepage metadata and translation, cached firmware cards during outages, planned-filter cleanup, PIN gateway retry and integrity guards.');
})().catch(e=>{console.error(e);process.exitCode=1;});
