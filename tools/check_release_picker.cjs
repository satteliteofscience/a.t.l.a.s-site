/* The firmware builds section of the configurator: the same version picker as the firmware cards of the main page, fed by the same merged catalogue. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const picker=require('../js/configurator/release-picker.js');
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');

// ---- a small fake DOM
function makeEl(tag){
 return {tag,children:[],listeners:{},attrs:{},dataset:{},className:'',textContent:'',disabled:false,href:'',rel:'',target:'',type:'',
  classList:{toggle(name,on){const set=new Set(this.owner.className.split(/\s+/).filter(Boolean));on?set.add(name):set.delete(name);this.owner.className=[...set].join(' ');}},
  append(...k){this.children.push(...k);},replaceChildren(...k){this.children=k;},setAttribute(n,v){this.attrs[n]=String(v);},
  addEventListener(n,f){(this.listeners[n]||(this.listeners[n]=[])).push(f);},async fire(n,event={}){for(const f of this.listeners[n]||[])await f({preventDefault(){},...event});}};
}
const doc={createElement:tag=>{const e=makeEl(tag);e.classList.owner=e;return e;}};
const walk=(node,out=[])=>{out.push(node);for(const c of node.children||[])walk(c,out);return out;};
const byClass=(node,cls)=>walk(node).filter(n=>(n.className||'').split(/\s+/).includes(cls));
const text=node=>walk(node).map(n=>n.textContent||'').join(' ');

// ---- data: three boards, release 2.0 announced, 1.2 and 1.0 published (hash / names as in the real catalogue)
const sha=c=>c.repeat(64);
const build=(version,id,extra={})=>({filename:`ATLAS-${id}-${version}.hex`,label:`A.T.L.A.S. Release ${version} · ${id}`,version,channel:'release',secure_id:`${id}-${version.replace('.','')}`,sha256:sha('a'),bytes:1000,timestamp:1799000000+Number(version.replace('.','')),...extra});
const cube={id:'cube-orange-plus',name:'Cube Orange Plus',status:'available',description:'base text',version_descriptions:{'1.2':{ru:'Описание 1.2',uk:'Опис 1.2',en:'Description 1.2'},'1.0':{ru:'Описание 1.0'}},
 downloads:[build('1.2','cube'),build('1.0','cube'),build('1.1','cube',{channel:'dev'}),build('0.9','cube',{sha256:'zz'}),{...build('0.8','cube'),filename:''}]};
const uni={id:'uni-ic743-mini',name:'Uni-IC743 Mini',status:'available',downloads:[build('1.0','uni')]};
const matek={id:'matek-h743-wing-v3',name:'Matek H743-WING V3',status:'planned',downloads:[]};
const project={latest_release:'2.0',release_names:{'2.0':'A.T.L.A.S-G.L.O.B.A.L','1.2':'EKF'},sources:{'1.2':'Firmware/Sources/ATLAS-source-v1.2.tar.gz'}};
const downloads=[];
const access={isProtected:item=>item.secure_id!=='unprotected',download:async item=>{downloads.push(item.secure_id);if(item.secure_id==='uni-10')throw Error('Access cancelled');}};
const toasts=[];

(async()=>{
 // -- helpers
 assert.deepEqual(['1.0','2.0','1.2','1.10'].sort(picker.compareVersions),['2.0','1.10','1.2','1.0']);
 const v=picker.versionsOf(cube,project,access);
 assert.deepEqual(v.names,['2.0','1.2','1.0'],'every published build plus the announced latest release, newest first');assert.equal(v.latestReady,'1.2');assert.equal(v.items.length,2,'a dev build, a bad checksum and a nameless file are not offered');
 assert.deepEqual(picker.versionsOf(matek,project,access),{items:[],names:['2.0'],latestReady:null});
 assert.equal(picker.versionsOf(cube,{},access).names.join(),'1.2,1.0');
 assert.equal(picker.descriptionOf(cube,'1.2','uk'),'Опис 1.2');assert.equal(picker.descriptionOf(cube,'1.0','en'),'Описание 1.0','falls back to the Russian text');assert.equal(picker.descriptionOf(cube,'2.0','ru'),'base text');

 // -- the cards
 const container=doc.createElement('div'),selected={};
 const draw=(language='ru')=>picker.render({document:doc,container,boards:[cube,uni,matek],project,language,access,selected,toast:(m,bad)=>toasts.push([m,bad]),baseURI:'https://example.org/configurator.html',noBuilds:'нет сборок'});
 draw();
 const cards=container.children;assert.equal(cards.length,3);
 const [cubeCard,uniCard,matekCard]=cards;
 const options=card=>byClass(card,'board-version-option');
 assert.deepEqual(options(cubeCard).map(o=>o.dataset.version),['2.0','1.2','1.0']);
 assert.deepEqual(options(cubeCard).map(o=>byClass(o,'board-version-kind')[0].textContent),['СКОРО','НОВАЯ','АРХИВ'],'announced, latest published, archive');
 assert.equal(byClass(options(cubeCard)[0],'board-version-name')[0].textContent,'A.T.L.A.S-G.L.O.B.A.L','the release name is shown');
 assert.ok(options(cubeCard)[0].className.includes('is-pending'));
 assert.equal(options(cubeCard).find(o=>o.attrs['aria-pressed']==='true').dataset.version,'1.2','the latest published build is selected');
 assert.match(text(byClass(cubeCard,'board-version-legend')[0]),/ВЫБОР ВЕРСИИ · 3/);
 assert.match(text(cubeCard),/Описание 1\.2/);
 const result=byClass(cubeCard,'board-version-result')[0];
 const button=byClass(result,'cc-release-download')[0];assert.ok(button);
 assert.match(text(button),/A\.T\.L\.A\.S\. Release 1\.2/);assert.match(byClass(button,'cc-release-download-action')[0].textContent,/^LATEST · PIN · СКАЧАТЬ ↗$/);
 assert.match(text(result),/SHA-256: aaaaaaaaaaaaaaaa…/);
 const source=byClass(result,'version-source-link')[0];assert.equal(source.href,'https://example.org/Firmware/Sources/ATLAS-source-v1.2.tar.gz');assert.equal(source.rel,'noopener noreferrer');
 // -- selecting versions
 await options(cubeCard)[2].fire('click');   // 1.0
 assert.equal(selected['cube-orange-plus'],'1.0');assert.match(text(byClass(cubeCard,'board-version-result')[0]),/Описание 1\.0/);
 assert.equal(byClass(byClass(cubeCard,'board-version-result')[0],'cc-release-download-action')[0].textContent,'PIN · СКАЧАТЬ ↗','an archive build has no LATEST mark');
 assert.equal(byClass(byClass(cubeCard,'board-version-result')[0],'version-source-link').length,0,'no source link for a version without one');
 await options(cubeCard)[0].fire('click');   // 2.0, not published yet
 const pending=byClass(cubeCard,'board-version-result')[0];
 assert.match(text(pending),/Сборка ещё не опубликована/);assert.equal(byClass(pending,'cc-release-download').length,0,'nothing to download for an announced release');
 await options(cubeCard)[1].fire('keydown',{key:'ArrowDown'});assert.equal(selected['cube-orange-plus'],'1.0','arrow keys move the selection');
 await options(cubeCard)[2].fire('keydown',{key:'ArrowUp'});assert.equal(selected['cube-orange-plus'],'1.2');
 // -- the selection survives a re-render (language switch, catalogue refresh)
 draw('en');assert.equal(selected['cube-orange-plus'],'1.2');
 const enCube=container.children[0];assert.match(text(byClass(enCube,'board-version-legend')[0]),/SELECT RELEASE · 3/);assert.deepEqual(options(enCube).map(o=>byClass(o,'board-version-kind')[0].textContent),['SOON','LATEST','ARCHIVE']);
 assert.match(text(enCube),/Description 1\.2/);assert.match(byClass(enCube,'cc-release-download-action')[0].textContent,/DOWNLOAD/);
 draw('uk');assert.match(byClass(container.children[0],'cc-release-download-action')[0].textContent,/ЗАВАНТАЖИТИ/);assert.match(text(container.children[0]),/Опис 1\.2/);
 draw('ru');
 // -- download goes through the PIN gateway; a cancelled PIN is not an error
 const btn=byClass(container.children[0],'cc-release-download')[0];await btn.fire('click');
 assert.deepEqual(downloads,['cube-12'],'the selected build is requested through AtlasFirmwareAccess');assert.equal(btn.disabled,false);
 const uniBtn=byClass(container.children[1],'cc-release-download')[0];await uniBtn.fire('click');assert.deepEqual(toasts,[],'"Access cancelled" is silent');
 access.download=async()=>{throw Error('Gateway down');};await uniBtn.fire('click');assert.deepEqual(toasts,[['Gateway down',true]]);
 // -- boards
 assert.equal(options(uniCard).length,2,'Uni: the announced 2.0 and the published 1.0');
 assert.equal(byClass(matekCard,'board-version-option').length,0,'a board with no published build has no picker');assert.match(text(matekCard),/нет сборок/);
 // -- the checksum copy button
 Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:async value=>{globalThis.__copied=value;}}},configurable:true});
 const copy=byClass(container.children[0],'checksum-btn')[0];await copy.fire('click');assert.equal(globalThis.__copied,sha('a'));assert.equal(copy.textContent,'Скопировано ✓');
 // -- scroll hint only for long lists
 const many={...cube,downloads:['1.0','1.1','1.2','1.3','1.4'].map(version=>build(version,'cube'))};picker.render({document:doc,container,boards:[many],project,language:'ru',access,selected:{}});
 assert.equal(byClass(container,'board-version-list')[0].dataset.scroll,'true');

 // ---- wiring in the configurator
 const html=read('configurator.html'),cfg=read('js/configurator/configurator.js'),css=read('css/configurator.css');
 const scripts=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
 assert.ok(scripts.indexOf('js/configurator/release-picker.js')>=0&&scripts.indexOf('js/configurator/release-picker.js')<scripts.indexOf('js/configurator/configurator.js'),'the picker loads before configurator.js');
 assert.ok(scripts.includes('js/site/firmware-catalog.js')&&scripts.includes('js/site/firmware-access.js'),'the catalogue merge and the PIN gateway are loaded');
 assert.match(cfg,/AtlasFirmwareCatalog\.mergeSiteCatalog\(info\)/,'the configurator uses the same merged catalogue as the main page');
 assert.match(cfg,/state\.project=info\?\.project\|\|null/);assert.match(cfg,/AtlasReleasePicker\.render\(\{document,container:\$\('releaseList'\),boards,project:state\.project/);
 assert.match(cfg,/tab==='firmware'&&Date\.now\(\)-\(state\.catalogAt\|\|0\)>60000\)loadCatalog\(\)/,'the catalogue is refreshed when the firmware tab opens');
 assert.match(html,/id="releaseCatalogLatest"/);assert.doesNotMatch(html,/<small>data\/releases\.json<\/small>/,'the header no longer claims that the list is only the static file');
 for(const selector of ['.cc-release-item .board-version-control','.cc-release-item .cc-release-desc'])assert.ok(css.includes(selector),'style '+selector);
 console.log('PASS: configurator firmware section: version picker per board (published + announced releases), selected build with PIN download / SHA-256 / source, merged catalogue, RU/UA/EN.');
})().catch(error=>{console.error(error);process.exit(1);});
