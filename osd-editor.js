/* A.T.L.A.S. OSD Layout Editor 0.4.6 — uses real OSDn_* parameters. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const api=window.AtlasCC;
if(!api||!$('osdCanvas'))return;
const ui={screen:1,format:'pal',selected:null,draft:new Map(),drag:null,busy:false};
const lex={
 ru:{videoGroup:'ВИДЕО / ИНДИКАЦИЯ',osdTitle:'Настройка полётного OSD',intro:'Редактор, похожий на Mission Planner: включай элементы, перемещай по экрану и сохраняй координаты в полётный контроллер. Отображаются только реальные параметры OSDn_*.',layout:'РЕДАКТОР ЭКРАНА',screen:'Экран',layoutMode:'Формат',refresh:'Считать параметры',undo:'Отменить изменения',previewNote:'Предпросмотр приблизительный. Реальный вид зависит от видеосистемы, шрифта и разрешения. HD — макет, не гарантия диапазона координат.',items:'Элементы экрана',chooseItem:'Выбери элемент',showItem:'Показывать элемент',confirm:'Контроллер DISARMED, пропеллер снят, изменения проверены',save:'Записать OSD',globalTitle:'Глобальные параметры OSD',missingNote:'Если OSDn_* отсутствуют, проверь OSD_TYPE и поддерживаемый тип OSD. После включения OSD_TYPE может понадобиться перезагрузка и повторное чтение параметров.',none:'OSD-параметры не найдены. Подключи контроллер и считай параметры, либо включи DEMO для примера.',read:'Ожидание списка параметров…',demo:'ДЕМО / без записи',offline:'НЕ ПОДКЛЮЧЕН',ready:'Параметры OSD доступны',unsaved:'Изменения в макете не записаны',clean:'Изменений нет',need:'Для записи нужны USB, полный список параметров, DISARMED и подтверждение.',saving:'Записываются параметры',saved:'Запись подтверждена контроллером',error:'Ошибка записи',edit:'Изменить',emptyScreen:'На этом экране нет доступных элементов OSD',outOfRange:'Координаты должны быть внутри редактора'},
 uk:{videoGroup:'ВІДЕО / ІНДИКАЦІЯ',osdTitle:'Налаштування польотного OSD',intro:'Редактор на зразок Mission Planner: вмикай елементи, пересувай по екрану та зберігай координати в контролер. Відображаються лише наявні параметри OSDn_*.',layout:'РЕДАКТОР ЕКРАНА',screen:'Екран',layoutMode:'Формат',refresh:'Зчитати параметри',undo:'Скасувати зміни',previewNote:'Приблизний перегляд. Реальний вигляд залежить від відеосистеми, шрифту і роздільності. HD — лише макет.',items:'Елементи екрана',chooseItem:'Обери елемент',showItem:'Показувати елемент',confirm:'Контролер DISARMED, пропелер знято, зміни перевірені',save:'Записати OSD',globalTitle:'Загальні параметри OSD',missingNote:'Якщо OSDn_* відсутні, перевір OSD_TYPE. Після зміни типу може бути потрібне перезавантаження та повторне читання параметрів.',none:'Параметрів OSD немає. Підключи контролер, зчитай параметри або ввімкни DEMO.',read:'Очікування параметрів…',demo:'ДЕМО / без запису',offline:'НЕ ПІДКЛЮЧЕНО',ready:'Параметри OSD доступні',unsaved:'Незбережені зміни',clean:'Змін немає',need:'Для запису потрібні USB, повний список параметрів, DISARMED і підтвердження.',saving:'Запис параметрів',saved:'Запис підтверджено контролером',error:'Помилка запису',edit:'Змінити',emptyScreen:'На цьому екрані немає елементів OSD',outOfRange:'Координати поза межами макета'},
 en:{videoGroup:'VIDEO / DISPLAY',osdTitle:'Flight OSD Setup',intro:'Mission Planner-style OSD editor: enable elements, drag them on screen and save coordinates to the flight controller. Only actual OSDn_* parameters are shown.',layout:'SCREEN LAYOUT',screen:'Screen',layoutMode:'Format',refresh:'Read parameters',undo:'Discard changes',previewNote:'Approximate preview: actual positioning, font, and resolution depend on your video hardware. HD is a visual mock-up.',items:'Screen elements',chooseItem:'Select an element',showItem:'Show element',confirm:'FC is DISARMED, propeller removed, changes reviewed',save:'Write OSD',globalTitle:'Global OSD Parameters',missingNote:'If OSDn_* parameters are missing, check OSD_TYPE. Enabling a supported OSD type may require rebooting and reloading parameters.',none:'No OSD parameters detected. Connect FC and read parameters, or enable DEMO.',read:'Waiting for parameter list…',demo:'DEMO / no writes',offline:'DISCONNECTED',ready:'OSD parameters loaded',unsaved:'Unsaved layout changes',clean:'No changes',need:'USB, complete parameters, DISARMED and confirmation required.',saving:'Writing parameters',saved:'Controller confirmed settings',error:'Write failed',edit:'Edit',emptyScreen:'No OSD items on this screen',outOfRange:'Coordinates must stay inside editor'}
};
const names={ALTITUDE:'ALT',ASPEED:'ASPD',GSPEED:'GSPD',BAT_VOLT:'BAT',BATVOLT:'BAT',CURRENT:'AMP',RSSI:'RSSI',FLTMODE:'MODE',HORIZON:'ATT',HOMEDIST:'HOME',HOME:'HOME',THROTTLE:'THR',MESSAGE:'MSG',GPSLAT:'LAT',GPSLON:'LON',SATS:'SAT',PITCH:'PITCH',ROLL:'ROLL',CLIMBEFF:'CLIMB',WIND:'WIND',COMPASS:'HDG',BATUSED:'USED',BAT2_VOLT:'BAT2'};
const language=()=>window.AtlasLanguage?.()||'ru';
const t=k=>(lex[language()]||lex.ru)[k]||k;
const state=()=>api.getState();
const key=(item,suffix)=>`OSD${ui.screen}_${item}_${suffix}`;
const val=name=>ui.draft.has(name)?ui.draft.get(name):state().params.get(name)?.value;
const dimensions=()=>ui.format==='ntsc'?{x:30,y:13}:ui.format==='hd'?{x:50,y:18}:{x:30,y:16};
const safeWrite=()=>{const s=state();return s.connected&&!s.demo&&s.armed===false&&Date.now()-s.lastHeartbeat<4000&&!ui.busy;};
function items(){const result=new Map();const prefix=`OSD${ui.screen}_`;
 for(const param of state().params.keys()){
  if(!param.startsWith(prefix))continue;
  const m=/^OSD[1-4]_(.+)_(EN|X|Y)$/.exec(param);if(!m)continue;
  if(!result.has(m[1]))result.set(m[1],{});result.get(m[1])[m[2]]=param;
 }
 return [...result].filter(([name,fields])=>fields.X&&fields.Y).sort((a,b)=>a[0].localeCompare(b[0]));
}
function stage(name,v){if(!state().params.has(name))return;
 if(state().params.get(name).value===v)ui.draft.delete(name);else ui.draft.set(name,v);
}
function select(item){ui.selected=item;render();}
function osdLabel(name){return names[name]||name.replace(/_/g,' ').slice(0,12);}
function mark(){const s=state();$('osdConnectionStatus').textContent=s.demo?t('demo'):s.connected?t('ready'):t('offline');
 const c=ui.draft.size;$('osdSave').disabled=ui.busy||!safeWrite()||!c||!$('osdConfirm').checked;
 if(!ui.busy)$('osdStatus').textContent=c?`${t('unsaved')}: ${c} · ${safeWrite()?'':t('need')}`:t('clean');
}
function render(){const itemsInScreen=items(), available=new Map(itemsInScreen), dims=dimensions(),canvas=$('osdCanvas');
 $('osdResolution').textContent=`${dims.x} × ${dims.y}`;$('osdScreenCaption').textContent=ui.screen;
 $('osdPositionX').max=dims.x-1;$('osdPositionY').max=dims.y-1;
 canvas.style.setProperty('--osd-cols',dims.x);canvas.style.setProperty('--osd-rows',dims.y);
 canvas.replaceChildren();
 if(!itemsInScreen.length){const note=document.createElement('div');note.className='osd-empty';note.textContent=state().params.size?t('emptyScreen'):t('none');canvas.append(note);}
 const list=$('osdItemList');list.replaceChildren();
 for(const [item,fields] of itemsInScreen){
  const enabled=fields.EN?Number(val(fields.EN))===1:true;
  const rawX=Number(val(fields.X)),rawY=Number(val(fields.Y));
  const x=Math.max(0,Math.min(dims.x-1,Number.isFinite(rawX)?rawX:0));const y=Math.max(0,Math.min(dims.y-1,Number.isFinite(rawY)?rawY:0));
  const chip=document.createElement('button');chip.type='button';chip.className='osd-tile'+(!enabled?' disabled':'')+(ui.selected===item?' selected':'');chip.style.left=`${x/dims.x*100}%`;chip.style.top=`${y/dims.y*100}%`;
  chip.textContent=osdLabel(item);chip.title=`${item} · X=${rawX}, Y=${rawY}`;chip.dataset.item=item;
  chip.addEventListener('pointerdown',event=>startDrag(event,item));
  chip.addEventListener('click',()=>select(item));canvas.append(chip);
  const row=document.createElement('button');row.type='button';row.className='osd-item-row'+(ui.selected===item?' selected':'');
  const marker=document.createElement('span');marker.className='osd-item-eye';marker.textContent=enabled?'◉':'○';
  const label=document.createElement('span');label.textContent=item;const coords=document.createElement('small');coords.textContent=`${rawX}, ${rawY}`;row.append(marker,label,coords);row.addEventListener('click',()=>select(item));list.append(row);
 }
 const f=available.get(ui.selected);
 if(!f){ui.selected=itemsInScreen[0]?.[0]||null;}
 const chosen=available.get(ui.selected);
 $('osdSelectedTitle').textContent=ui.selected||t('chooseItem');
 $('osdSelectedEnabled').disabled=!chosen?.EN;
 $('osdSelectedEnabled').checked=chosen?.EN?Number(val(chosen.EN))===1:!!chosen;
 $('osdPositionX').disabled=!chosen;
 $('osdPositionY').disabled=!chosen;
 $('osdPositionX').value=chosen?String(val(chosen.X)):'';
 $('osdPositionY').value=chosen?String(val(chosen.Y)):'';
 $('osdItemCount').textContent=itemsInScreen.length;
 mark();
}
function startDrag(e,item){if(e.button!==0&&e.pointerType==='mouse')return;
 e.preventDefault();ui.selected=item;ui.drag={item,pointerId:e.pointerId};
 const target=e.currentTarget;target.setPointerCapture(e.pointerId);
 target.addEventListener('pointermove',moveDrag);target.addEventListener('pointerup',stopDrag,{once:true});target.addEventListener('pointercancel',stopDrag,{once:true});
}
function moveDrag(e){if(!ui.drag||e.pointerId!==ui.drag.pointerId)return;
 const rect=$('osdCanvas').getBoundingClientRect(),d=dimensions();
 const x=Math.max(0,Math.min(d.x-1,Math.floor((e.clientX-rect.left)/rect.width*d.x)));
 const y=Math.max(0,Math.min(d.y-1,Math.floor((e.clientY-rect.top)/rect.height*d.y)));
 stage(key(ui.drag.item,'X'),x);stage(key(ui.drag.item,'Y'),y);
 const tile=e.currentTarget;tile.style.left=`${x/d.x*100}%`;tile.style.top=`${y/d.y*100}%`;
 $('osdPositionX').value=x;$('osdPositionY').value=y;
}
function stopDrag(e){if(e.currentTarget?.hasPointerCapture?.(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 e.currentTarget?.removeEventListener('pointermove',moveDrag);ui.drag=null;render();}
function setCoordinate(axis,v){const it=ui.selected,d=dimensions();if(!it)return;
 const n=Number(v),max=axis==='X'?d.x-1:d.y-1;
 if(!Number.isInteger(n)||n<0||n>max){$('osdStatus').textContent=t('outOfRange');return;}
 stage(key(it,axis),n);render();}
function globalParams(){const keys=['OSD_TYPE','OSD_TYPE2','OSD_UNITS','OSD_CHAN','OSD_SW_METHOD','OSD_OPTIONS',`OSD${ui.screen}_ENABLE`,`OSD${ui.screen}_CHAN_MIN`,`OSD${ui.screen}_CHAN_MAX`];
 const target=$('osdGlobalGrid');target.replaceChildren();for(const k of keys){const p=state().params.get(k);if(!p)continue;
 const c=document.createElement('div');c.className='osd-global-item';const name=document.createElement('code');name.textContent=k;const valNode=document.createElement('b');valNode.textContent=String(p.value);
 const edit=document.createElement('button');edit.type='button';edit.textContent=t('edit');edit.disabled=!safeWrite();edit.addEventListener('click',()=>api.editParam(k));c.append(name,valNode,edit);target.append(c);
 }
 if(!target.childElementCount){const p=document.createElement('p');p.textContent=t('none');target.append(p);}
}
function everything(){render();globalParams();}
function translate(){for(const el of document.querySelectorAll('[data-osd-t]')){el.textContent=t(el.dataset.osdT);}everything();}
async function save(){if(ui.busy||!safeWrite()||!$('osdConfirm').checked||!ui.draft.size){$('osdStatus').textContent=t('need');return;}
 ui.busy=true;mark();const changes=Object.fromEntries(ui.draft);$('osdStatus').textContent=`${t('saving')}: 0/${Object.keys(changes).length}`;
 try{const result=await api.writeOSDParams(changes,p=>{$('osdStatus').textContent=`${t('saving')}: ${p.done}/${p.total} · ${p.name||''}`;});
  ui.draft.clear();$('osdConfirm').checked=false;everything();$('osdStatus').textContent=`✓ ${t('saved')}: ${result.done}/${result.total}`;
 }catch(e){ // Keep draft so unsuccessful settings are not lost.
  $('osdStatus').textContent=`⚠ ${t('error')}: ${e.message}`;api.log('OSD: '+e.message,true);
 }finally{ui.busy=false;$('osdSave').disabled=ui.busy||!safeWrite()||!ui.draft.size||!$('osdConfirm').checked;}
}
$('osdScreen').addEventListener('change',e=>{ui.screen=Number(e.target.value);ui.selected=null;everything();});
$('osdFormat').addEventListener('change',e=>{ui.format=e.target.value;everything();});
$('osdPositionX').addEventListener('change',e=>setCoordinate('X',e.target.value));
$('osdPositionY').addEventListener('change',e=>setCoordinate('Y',e.target.value));
$('osdSelectedEnabled').addEventListener('change',e=>{if(ui.selected)stage(key(ui.selected,'EN'),e.target.checked?1:0);render();});
$('osdConfirm').addEventListener('change',mark);
$('osdSave').addEventListener('click',save);
$('osdResetDraft').addEventListener('click',()=>{ui.draft.clear();$('osdConfirm').checked=false;everything();});
$('osdRefresh').addEventListener('click',()=>api.requestParameters());
window.addEventListener('atlas:state',()=>{ui.draft.clear();ui.selected=null;everything();});
window.addEventListener('atlas:parameters',()=>{if(document.querySelector('[data-panel="osd"].active'))everything();});
window.addEventListener('atlas:language',translate);
document.querySelector('[data-tab="osd"]')?.addEventListener('click',everything);
translate();
})();
