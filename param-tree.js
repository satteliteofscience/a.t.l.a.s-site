/* A.T.L.A.S. parameter tree v0.4.3.
 * Uses only the list actually reported by the flight controller for parameter names/values.
 * Human-readable descriptions are optional source metadata (partial shipped snapshot or
 * optional ArduPilot Plane pdef); unknown fields are displayed as '—'. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const dict={
 ru:{all:'Все параметры',tree:'Дерево параметров',show:'Группы параметров',hide:'Скрыть группы',name:'Name',value:'Value',def:'Default',units:'Units',opts:'Options',desc:'Desc',fav:'Fav',meta:'Метаданные',loadmeta:'Загрузить pdef XML/JSON',online:'Обновить pdef из ArduPilot',local:'Локальные описания',official:'Метаданные ArduPlane',missing:'Описание отсутствует',edited:'Изменённые',onlynod:'Без default',nomatches:'Нет совпадений',group:'Группа',noParams:'Сначала считай параметры с полётного контроллера.',source:'Источник',withdesc:'Описание',noinfo:'—',metadataerror:'Не удалось получить метаданные (возможно, CORS). Скачай Plane apm.pdef.json и загрузи через кнопку.',count:'параметров'},
 uk:{all:'Усі параметри',tree:'Дерево параметрів',show:'Групи параметрів',hide:'Сховати групи',name:'Name',value:'Value',def:'Default',units:'Units',opts:'Options',desc:'Desc',fav:'Fav',meta:'Метадані',loadmeta:'Завантажити pdef XML/JSON',online:'Оновити pdef ArduPilot',local:'Локальні описи',official:'Метадані ArduPlane',missing:'Опис відсутній',edited:'Змінені',onlynod:'Без default',nomatches:'Немає збігів',group:'Група',noParams:'Спершу зчитай параметри контролера.',source:'Джерело',withdesc:'Опис',noinfo:'—',metadataerror:'Не вдалося отримати метадані (можливо, CORS). Завантаж Plane apm.pdef.json як файл.',count:'параметрів'},
 en:{all:'All parameters',tree:'Parameter tree',show:'Show tree',hide:'Hide tree',name:'Name',value:'Value',def:'Default',units:'Units',opts:'Options',desc:'Desc',fav:'Fav',meta:'Metadata',loadmeta:'Load pdef XML/JSON',online:'Fetch ArduPilot pdef',local:'Local descriptions',official:'ArduPlane metadata',missing:'No description',edited:'Modified',onlynod:'No default',nomatches:'No matches',group:'Group',noParams:'Load parameters from the controller first.',source:'Source',withdesc:'Description',noinfo:'—',metadataerror:'Metadata fetch blocked (possibly CORS). Download Plane apm.pdef.json and load it from a file.',count:'parameters'}
};
let meta=new Map(), metadataKind='loading', favorite=new Set(), expanded=new Set(['ACRO']), treeOpen=false, initCalled=false;
let localMeta=new Map(), officialMeta=new Map();
try{favorite=new Set(JSON.parse(localStorage.getItem('atlas-favorites')||'[]'));}catch{}
function t(lang,k){return (dict[lang]||dict.ru)[k]||k;}
function normalize(raw){const out=new Map();function add(name,value){if(!name||typeof value!=='object'||!value||Array.isArray(value))return;
 const key=name.replace(/^.*:/,'').trim().toUpperCase();if(/^[A-Z][A-Z_0-9]{0,15}$/.test(key))out.set(key,value);
 }
 if(raw.parameters)for(const [name,def]of Object.entries(raw.parameters))add(name,def);
 else for(const [group,values]of Object.entries(raw)){if(values&&typeof values==='object'&&!Array.isArray(values))for(const [name,def]of Object.entries(values))add(name,def);}
 return out;}
function normalizeXML(source){const xml=new DOMParser().parseFromString(source,'text/xml');if(xml.querySelector('parsererror'))throw Error('Invalid XML');const out=new Map();for(const p of xml.querySelectorAll('param')){
 const name=(p.getAttribute('name')||'').replace(/^.*:/,'').toUpperCase();if(!/^[A-Z][A-Z_0-9]{0,15}$/.test(name))continue;
 const data={DisplayName:p.getAttribute('humanName')||'',Description:p.getAttribute('documentation')||''};for(const field of p.querySelectorAll('field')){const key=field.getAttribute('name');if(!key)continue;if(key==='Range'){let xs=field.textContent.trim().split(/\s+/);if(xs.length>1)data.Range={low:xs[0],high:xs[1]};}else data[key]=field.textContent.trim();}
 const choices={};for(const v of p.querySelectorAll('values > value'))choices[v.getAttribute('code')]=v.textContent.trim();if(Object.keys(choices).length)data.Values=choices;
 out.set(name,data);
 }return out;}
function refreshMetadata(){
 meta=new Map([...localMeta,...officialMeta]);
 metadataKind=officialMeta.size?'official':localMeta.size?'local':'none';
 const status=$('paramMetadataStatus');
 if(status)status.textContent='—';
}
async function fetchBundled(){
 try{
  if(window.AtlasMetadataInline)localMeta=normalize(window.AtlasMetadataInline);
  else{
   const response=await fetch('data/param-metadata.json');
   if(!response.ok)throw Error('HTTP '+response.status);
   localMeta=normalize(await response.json());
  }
 }catch{}
 refreshMetadata();
 window.dispatchEvent(new Event('atlas:metadata'));
}
function groupOf(key){if(key.startsWith('CAPRI_')||key==='RUD_LIMIT_DEG'||key==='RUD_BRK_EN')return 'C.A.P.R.I.';const i=key.indexOf('_');return i>0?key.slice(0,i):'#';}
function optionsText(m){let x=[];
 if(m.Values&&typeof m.Values==='object')x=Object.entries(m.Values).map(([n,s])=>n+':'+s);
 if(!x.length&&m.Bitmask)x=[String(m.Bitmask)];
 if(!x.length&&m.Range)x=[typeof m.Range==='object'?`${m.Range.low??''} … ${m.Range.high??''}`:String(m.Range)];
 return x.join(' · ')||'—';}
function flattenMeta(raw){if(typeof raw==='string'&&raw.trim().startsWith('<'))return normalizeXML(raw);return normalize(typeof raw==='string'?JSON.parse(raw):raw);}
function initialize({render,langGetter}){if(initCalled)return;initCalled=true;
 const input=$('paramMetadataFile'),source=$('paramMetadataStatus');
 input?.addEventListener('change',async ev=>{const f=ev.target.files?.[0];if(!f)return;try{const parsed=flattenMeta(await f.text());if(!parsed.size)throw Error('Empty / unsupported pdef');officialMeta=parsed;refreshMetadata();render();}catch(e){source.textContent=e.message;}finally{input.value='';}});
 $('paramMetadataOnline')?.addEventListener('click',async()=>{source.textContent='Loading Plane pdef…';try{const resp=await fetch('https://autotest.ardupilot.org/Parameters/Plane/apm.pdef.json');if(!resp.ok)throw Error('HTTP '+resp.status);const parsed=normalize(await resp.json());if(!parsed.size)throw Error('pdef empty');officialMeta=parsed;refreshMetadata();render();}catch(e){source.textContent=t(langGetter(),'metadataerror')+' ('+e.message+')';}});
 $('paramTreeToggle')?.addEventListener('click',()=>{treeOpen=!treeOpen;$('paramTreeLayout')?.classList.toggle('tree-open',treeOpen);$('paramTreeToggle').textContent=t(langGetter(),treeOpen?'hide':'show');});
 fetchBundled();}
function render({state,lang,formatParam,canWrite,edit,onSelect,limit}){
 const root=$('paramTree'),tbody=$('paramsTable');if(!root||!tbody)return;
 const tr=key=>t(lang,key),query=$('paramSearch').value.trim().toUpperCase(),groups=new Map();
 const all=[...state.params.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
 for(const [name] of all){
  const group=groupOf(name);
  if(!groups.has(group))groups.set(group,[]);
  groups.get(group).push(name);
 }
 // Group categories are based on exact FC parameter prefixes, like Mission Planner.
 const selection=state.treeSelection||'ALL';const searched=all.filter(([name])=>{const md=meta.get(name)||{};return name.includes(query)||String(md.Description||'').toUpperCase().includes(query)||String(md.DisplayName||'').toUpperCase().includes(query);});
 const selected=searched.filter(([name,p])=>{
  if(selection!=='ALL' && selection.startsWith('G:') && groupOf(name)!==selection.slice(2))return false;
  if(selection!=='ALL' && selection.startsWith('P:') && name!==selection.slice(2))return false;
  const md=meta.get(name)||{};
  if($('paramModifiedOnly')?.checked){const def=Number(md.Default);const fromDefault=md.Default!==undefined&&Number.isFinite(def)&&Math.abs(def-p.value)>1e-5;const changedImported=state.imported?.has(name)&&Math.abs(state.imported.get(name)-p.value)>1e-5;if(!fromDefault&&!changedImported)return false;}
  if($('paramNoDefaultOnly')?.checked && md.Default!==undefined && md.Default!=='')return false;
  return true;
 });
 root.replaceChildren();const allButton=document.createElement('button');allButton.className='pt-group all'+(selection==='ALL'?' selected':'');allButton.textContent=`⌂ ${tr('all')} (${all.length})`;allButton.addEventListener('click',()=>select('ALL'));root.append(allButton);
 const sortedGroups=[...groups.keys()].sort((a,b)=>a==='C.A.P.R.I.'?1:b==='C.A.P.R.I.'?-1:a.localeCompare(b));
 for(const group of sortedGroups){const names=groups.get(group);const open=expanded.has(group);
  const groupLine=document.createElement('div');groupLine.className='pt-group-row';
  const toggle=document.createElement('button');toggle.className='pt-expander';toggle.textContent=names.length>1?(open?'−':'+'):'·';toggle.setAttribute('aria-label',`${open?'Collapse':'Expand'} ${group}`);toggle.onclick=()=>{if(open)expanded.delete(group);else expanded.add(group);render({state,lang,formatParam,canWrite,edit,onSelect,limit});};
  const groupButton=document.createElement('button');groupButton.className='pt-group'+(selection==='G:'+group?' selected':'');groupButton.textContent=`${group==='\u0023'?'OTHER':group}  ${names.length>1?'('+names.length+')':''}`;groupButton.title=names.join(', ');groupButton.onclick=()=>{expanded.add(group);select('G:'+group);};groupLine.append(toggle,groupButton);root.append(groupLine);
  if(open){const list=document.createElement('div');list.className='pt-leaves';for(const name of names){if(query&&!name.includes(query)&&!String(meta.get(name)?.Description||'').toUpperCase().includes(query))continue;const leaf=document.createElement('button');leaf.className='pt-leaf'+(selection==='P:'+name?' selected':'');leaf.textContent=name;leaf.onclick=()=>select('P:'+name);list.append(leaf);}root.append(list);}
 }
 function select(v){state.treeSelection=v;state.tableLimit=150;treeOpen=false;$('paramTreeLayout')?.classList.remove('tree-open');onSelect();}
 tbody.replaceChildren();const frag=document.createDocumentFragment();const visible=selected.slice(0,Math.min(limit,3000));
 for(const [name,p]of visible){const md=meta.get(name)||{},row=document.createElement('tr');
  const cName=document.createElement('td');cName.className='pt-name';cName.textContent=name;
  const cValue=document.createElement('td');const valueButton=document.createElement('button');valueButton.type='button';valueButton.className='pt-value';valueButton.textContent=formatParam(p.value);const readOnly=md.ReadOnly===true||md.readOnly===true||String(md.ReadOnly).toLowerCase()==='true'||name==='FORMAT_VERSION'||name==='SYSID_SW_MREV'||name.startsWith('STAT_');
  valueButton.disabled=readOnly||!canWrite();valueButton.onclick=()=>edit(name);valueButton.title=readOnly?'Read-only parameter':canWrite()?'Edit '+name:'Requires live DISARMED MAVLink';cValue.append(valueButton);
  const cDefault=document.createElement('td');cDefault.textContent=md.Default??'—';
  const cUnits=document.createElement('td');cUnits.textContent=md.Units??'—';
  const cOptions=document.createElement('td');cOptions.className='pt-options';const opt=optionsText(md);cOptions.textContent=opt;cOptions.title=opt;
  const cDesc=document.createElement('td');cDesc.className='pt-desc';cDesc.textContent=md.Description||md.DisplayName||'—';cDesc.title=md.Description||md.DisplayName||'';
  const cFav=document.createElement('td');const fav=document.createElement('input');fav.type='checkbox';fav.checked=favorite.has(name);fav.setAttribute('aria-label','Favorite '+name);fav.onchange=()=>{if(fav.checked)favorite.add(name);else favorite.delete(name);try{localStorage.setItem('atlas-favorites',JSON.stringify([...favorite]));}catch{}};cFav.append(fav);
  row.append(cName,cValue,cDefault,cUnits,cOptions,cDesc,cFav);frag.append(row);
 }
 if(!visible.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=7;cell.className='pt-empty';cell.textContent=all.length?tr('nomatches'):tr('noParams');row.append(cell);frag.append(row);}
 tbody.append(frag);
 const summary=$('paramsSummary');if(summary)summary.textContent=`${visible.length} / ${selected.length} · ${all.length} ${tr('count')}`;
 const more=$('moreParamsBtn');if(more)more.hidden=visible.length>=selected.length;
 const status=$('paramMetadataStatus');if(status&&status.textContent==='—')status.textContent=(metadataKind==='official'?tr('official'):tr('local'))+` · ${meta.size}`;
 for(const key of ['name','value','def','units','opts','desc','fav']){const th=document.querySelector('[data-pth="'+key+'"]');if(th)th.textContent=tr(key);}
 if($('paramTreeToggle'))$('paramTreeToggle').textContent=tr(treeOpen?'hide':'show');
 if($('ptTreeLabel'))$('ptTreeLabel').textContent=tr('tree');
 if($('paramModifiedLabel'))$('paramModifiedLabel').textContent=tr('edited');
 if($('paramNoDefaultLabel'))$('paramNoDefaultLabel').textContent=tr('onlynod');
 if($('paramMetadataOnline'))$('paramMetadataOnline').textContent=tr('online');
 if($('paramMetaUploadLabel'))$('paramMetaUploadLabel').textContent=tr('loadmeta');
}
window.AtlasParamTree={initialize,render,getMetadata:()=>new Map(meta),isReadOnly:name=>{const d=meta.get(name)||{};return d.ReadOnly===true||d.readOnly===true||String(d.ReadOnly).toLowerCase()==='true'||name==='FORMAT_VERSION'||name==='SYSID_SW_MREV'||name.startsWith('STAT_');}};
})();
