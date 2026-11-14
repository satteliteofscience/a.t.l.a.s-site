/* EKF3 G.L.O.B.A.L. activation profile card, next to the O.R.D.E.R. card. Explicit, confirmed, DISARMED-only parameter writes. */
(()=>{'use strict';
const api=window.AtlasCC,core=window.AtlasGlobalCore;if(!api||!core)return;
// Numbers of the one-hour SITL flight (data/sitl/atlas-global-hour.json, shown on sitl-demo-global.html); tools/check_global_profile.cjs pins them to the dataset.
// [EKF3, DCM]: horizon error without GPS (deg RMS), horizon error in rolls and rotations (deg RMS), position error without GPS median / maximum (m).
const CMP=Object.freeze({tiltNoGps:[2.1,22.9],tiltAero:[2.1,38.9],posMed:[842,1780],posMax:[3410,6301]});
const words={
 ru:{title:'Профиль EKF3 G.L.O.B.A.L.',unsupported:'Нужна прошивка 2.0 (A.T.L.A.S-G.L.O.B.A.L)',noparams:'Подключи контроллер и дождись чтения параметров',active:'АКТИВЕН · профиль применён',off:'ВЫКЛЮЧЕН · опции NoAID равны 0',partial:'ЧАСТИЧНО · отличается параметров',options:'Опции NoAID',apply:'Применить профиль',disable:'Выключить опции',details:'Что изменится',nothing:'Все параметры профиля уже совпадают.',help:'Профиль записывает параметры EKF3, проверенные в часовом SITL-полёте: позиция по счислению, метка GPS, автоматический переход на GPS и наборы источников EK3_SRC1 / EK3_SRC2. Запись возможна только при DISARMED. После записи перезагрузи контроллер.',confirm:'Записать профиль EKF3 G.L.O.B.A.L. на контроллер?',confirmOff:'Выключить EK3_NOAID_POS, EK3_NOAID_GPS и EK3_NOAID_AUTO? Остальные параметры не изменятся.',written:'Записано и подтверждено контроллером. Перезагрузи контроллер, чтобы источники EKF3 применились.',progress:'Записано',already:'Профиль уже применён.',blocked:'Запись возможна при USB-связи, DISARMED и после полного чтения параметров.',pos:'позиция по счислению',gps:'метка GPS',auto:'переход на GPS',changed:'изменится',
  flightTitle:'В полёте',
  flight:['Позиция на карте и для L1-навигации берётся из EKF3: без спутников это счисление по скорости воздуха и курсу, со спутниками — позиция, подтянутая GPS.','Положение GPS показывается отдельной меткой («таблеткой») только для сравнения и напрямую в навигации не используется.','Переход на GPS автоматический: после 5 с хорошего 3D-фикса (не меньше AHRS_GPS_MINSATS спутников на основном GPS) EKF3 переходит на EK3_SRC2, через 3 с после потери GPS возвращается на EK3_SRC1. Горизонт всё время остаётся на EKF3.','Без спутников горизонт остаётся на EKF3. DCM без GPS накапливает ошибку на манёврах, поэтому горизонт у него хуже.'],
  cmpTitle:'Сравнение с DCM без спутников',cmpHead:'часовой SITL-полёт',cmpEkf:'EKF3',cmpDcm:'DCM',
  cmpRows:['Ошибка горизонта без GPS, RMS','Ошибка горизонта в бочках и вращениях, RMS','Ошибка позиции без GPS, медиана','Ошибка позиции без GPS, максимум'],
  cmpUnits:{deg:'°',m:' м'},
  cmpNote:'Один сценарий SITL: ветер до 15 м/с, порывы. EKF3 считает ветер нулевым, поэтому дрейф позиции без GPS зависит от ветра и на отдельных участках может быть больше, чем у DCM. Главный выигрыш — горизонт.',cmpLink:'Полный трек и разбор полёта',paramsTitle:'Параметры, которые будут записаны'},
 uk:{title:'Профіль EKF3 G.L.O.B.A.L.',unsupported:'Потрібна прошивка 2.0 (A.T.L.A.S-G.L.O.B.A.L)',noparams:'Підключи контролер і дочекайся читання параметрів',active:'АКТИВНИЙ · профіль застосовано',off:'ВИМКНЕНО · опції NoAID дорівнюють 0',partial:'ЧАСТКОВО · відрізняється параметрів',options:'Опції NoAID',apply:'Застосувати профіль',disable:'Вимкнути опції',details:'Що зміниться',nothing:'Усі параметри профілю вже збігаються.',help:'Профіль записує параметри EKF3, перевірені в годинному SITL-польоті: позиція за лічбою, мітка GPS, автоматичний перехід на GPS і набори джерел EK3_SRC1 / EK3_SRC2. Запис можливий лише при DISARMED. Після запису перезавантаж контролер.',confirm:'Записати профіль EKF3 G.L.O.B.A.L. на контролер?',confirmOff:'Вимкнути EK3_NOAID_POS, EK3_NOAID_GPS і EK3_NOAID_AUTO? Інші параметри не зміняться.',written:'Записано й підтверджено контролером. Перезавантаж контролер, щоб джерела EKF3 застосувалися.',progress:'Записано',already:'Профіль уже застосовано.',blocked:'Запис можливий при USB-зв’язку, DISARMED і після повного читання параметрів.',pos:'позиція за лічбою',gps:'мітка GPS',auto:'перехід на GPS',changed:'зміниться',
  flightTitle:'У польоті',
  flight:['Позиція на карті та для L1-навігації береться з EKF3: без супутників це лічба за швидкістю повітря й курсом, із супутниками — позиція, підтягнута GPS.','Положення GPS показується окремою міткою («таблеткою») лише для порівняння й напряму в навігації не використовується.','Перехід на GPS автоматичний: після 5 с доброго 3D-фікса (не менше AHRS_GPS_MINSATS супутників на основному GPS) EKF3 переходить на EK3_SRC2, через 3 с після втрати GPS повертається на EK3_SRC1. Горизонт увесь час залишається на EKF3.','Без супутників горизонт залишається на EKF3. DCM без GPS накопичує похибку на маневрах, тому горизонт у нього гірший.'],
  cmpTitle:'Порівняння з DCM без супутників',cmpHead:'годинний SITL-політ',cmpEkf:'EKF3',cmpDcm:'DCM',
  cmpRows:['Похибка горизонту без GPS, RMS','Похибка горизонту в бочках і обертаннях, RMS','Похибка позиції без GPS, медіана','Похибка позиції без GPS, максимум'],
  cmpUnits:{deg:'°',m:' м'},
  cmpNote:'Один сценарій SITL: вітер до 15 м/с, пориви. EKF3 вважає вітер нульовим, тому дрейф позиції без GPS залежить від вітру й на окремих ділянках може бути більшим, ніж у DCM. Головний виграш — горизонт.',cmpLink:'Повний трек і розбір польоту',paramsTitle:'Параметри, які буде записано'},
 en:{title:'EKF3 G.L.O.B.A.L. profile',unsupported:'Firmware 2.0 (A.T.L.A.S-G.L.O.B.A.L) required',noparams:'Connect the controller and wait for the parameter read',active:'ACTIVE · profile applied',off:'OFF · NoAID options are 0',partial:'PARTIAL · parameters that differ',options:'NoAID options',apply:'Apply profile',disable:'Switch options off',details:'What will change',nothing:'All profile parameters already match.',help:'The profile writes the EKF3 parameters flown in the one-hour SITL test: dead-reckoned position, the GPS marker, the automatic switch to GPS and the EK3_SRC1 / EK3_SRC2 source sets. Writing is possible only while DISARMED. Reboot the controller afterwards.',confirm:'Write the EKF3 G.L.O.B.A.L. profile to the controller?',confirmOff:'Switch EK3_NOAID_POS, EK3_NOAID_GPS and EK3_NOAID_AUTO off? No other parameter changes.',written:'Written and confirmed by the controller. Reboot the controller so the EKF3 sources take effect.',progress:'Written',already:'The profile is already applied.',blocked:'Writing needs a USB link, DISARMED and a completed parameter read.',pos:'dead-reckoned position',gps:'GPS marker',auto:'switch to GPS',changed:'will change',
  flightTitle:'In flight',
  flight:['The position on the map and for L1 navigation comes from EKF3: without satellites it is dead reckoning from airspeed and heading, with satellites it is the position pulled in by GPS.','The GPS position is shown as a separate marker (the “pill”) for comparison only and is not used for navigation directly.','The switch to GPS is automatic: after 5 s of a good 3D fix (at least AHRS_GPS_MINSATS satellites on the primary GPS) EKF3 moves to EK3_SRC2, and 3 s after the GPS is lost it returns to EK3_SRC1. The horizon stays on EKF3 all the time.','Without satellites the horizon stays on EKF3. The DCM without GPS accumulates error in manoeuvres, so its horizon is worse.'],
  cmpTitle:'Comparison with the DCM without satellites',cmpHead:'one-hour SITL flight',cmpEkf:'EKF3',cmpDcm:'DCM',
  cmpRows:['Horizon error without GPS, RMS','Horizon error in rolls and rotations, RMS','Position error without GPS, median','Position error without GPS, maximum'],
  cmpUnits:{deg:'°',m:' m'},
  cmpNote:'One SITL scenario: wind up to 15 m/s with gusts. EKF3 assumes zero wind, so the position drift without GPS depends on the wind and on some legs can be larger than the DCM’s. The main gain is the horizon.',cmpLink:'Full track and flight breakdown',paramsTitle:'Parameters that will be written'}
};
const tr=key=>(words[window.AtlasLanguage?.()]||words.ru)[key];
const $=id=>document.getElementById(id);
const card=document.createElement('article');card.className='cc-card order-card global-card';card.id='globalPanel';
card.innerHTML='<div class="cc-card-title"><span>◈</span><strong id="globalTitle"></strong><small>EKF3</small></div><strong id="globalStatus" role="status" aria-live="polite"></strong><div class="global-options" id="globalOptions"></div><details class="global-details" open><summary id="globalDetailsLabel"></summary><div class="global-flight"><h4 id="globalFlightTitle"></h4><ul id="globalFlight"></ul><h4 id="globalCmpTitle"></h4><div class="global-cmp" id="globalCmp"></div><p class="global-cmp-note" id="globalCmpNote"></p><a id="globalCmpLink" href="sitl-demo-global.html"></a><h4 id="globalParamsTitle"></h4><ul id="globalChanges"></ul></div></details><div class="order-actions"><button id="globalApply" class="cc-button primary" type="button"></button><button id="globalDisable" class="cc-button ghost" type="button"></button></div><p id="globalHelp"></p><p id="globalResult" role="status" aria-live="polite"></p>';
const order=$('orderPanel');if(order)order.after(card);else document.querySelector('.cc-dashboard-right')?.prepend(card);
let busy=false;
// Static text of the card (what changes in flight, DCM comparison). Rebuilt only when the language changes, not on every state event.
let drawnLanguage=null;
function renderStatic(){
 const language=window.AtlasLanguage?.()||'ru';if(drawnLanguage===language)return;drawnLanguage=language;
 $('globalFlightTitle').textContent=tr('flightTitle');
 const list=$('globalFlight');list.replaceChildren();
 for(const text of tr('flight')){const li=document.createElement('li');li.textContent=text;list.append(li);}
 $('globalCmpTitle').textContent=`${tr('cmpTitle')} · ${tr('cmpHead')}`;
 const units=tr('cmpUnits'),rows=tr('cmpRows'),values=[CMP.tiltNoGps,CMP.tiltAero,CMP.posMed,CMP.posMax],unit=['deg','deg','m','m'];
 const cmp=$('globalCmp');cmp.replaceChildren();
 const head=document.createElement('div');head.className='global-cmp-row global-cmp-head';
 for(const text of ['',tr('cmpEkf'),tr('cmpDcm')]){const s=document.createElement('span');s.textContent=text;head.append(s);}cmp.append(head);
 rows.forEach((label,i)=>{
  const row=document.createElement('div');row.className='global-cmp-row';
  const name=document.createElement('span');name.textContent=label;row.append(name);
  values[i].forEach((v,k)=>{const b=document.createElement('b');b.dataset.estimator=k===0?'ekf3':'dcm';b.textContent=(unit[i]==='deg'?v.toFixed(1):String(v))+units[unit[i]];row.append(b);});
  cmp.append(row);
 });
 $('globalCmpNote').textContent=tr('cmpNote');$('globalCmpLink').textContent=tr('cmpLink')+' →';$('globalParamsTitle').textContent=tr('paramsTitle');
}
function render(){
 const s=api.getState(),params=s.params,ready=s.connected&&!s.demo&&params.size>0&&!s.paramLoading;
 renderStatic();
 $('globalTitle').textContent=tr('title');$('globalDetailsLabel').textContent=tr('details');$('globalApply').textContent=tr('apply');$('globalDisable').textContent=tr('disable');$('globalHelp').textContent=tr('help');
 const st=ready?core.status(params):{state:'noparams',changes:[]};
 $('globalStatus').textContent=st.state==='noparams'?tr('noparams'):st.state==='unsupported'?tr('unsupported'):st.state==='partial'?`${tr('partial')}: ${st.changes.length}`:tr(st.state);
 card.dataset.state=st.state;
 const opt=$('globalOptions');opt.replaceChildren();
 if(st.state!=='noparams'&&st.state!=='unsupported'){
  for(const [name,label] of [['EK3_NOAID_POS','pos'],['EK3_NOAID_GPS','gps'],['EK3_NOAID_AUTO','auto']]){
   const v=params.get(name)?.value,row=document.createElement('div');row.dataset.on=String(v===1);
   const a=document.createElement('small'),b=document.createElement('b');a.textContent=`${name} · ${tr(label)}`;b.textContent=Number.isFinite(v)?String(v):'—';row.append(a,b);opt.append(row);
  }
 }
 const list=$('globalChanges');list.replaceChildren();
 if(st.state==='noparams'||st.state==='unsupported'||!st.changes.length){const li=document.createElement('li');li.textContent=tr('nothing');list.append(li);}
 else for(const c of st.changes){const li=document.createElement('li');li.textContent=`${c.name}: ${c.current??'—'} → ${c.target}`;list.append(li);}
 const writable=ready&&api.canWrite()&&st.state!=='unsupported';
 $('globalApply').disabled=busy||!writable||st.state==='active';
 $('globalDisable').disabled=busy||!writable||st.state==='off'||(st.state!=='partial'&&st.state!=='active');
}
async function run(updates,confirmText){
 if(busy||!api.canWrite())return;
 const names=Object.keys(updates);if(!names.length){$('globalResult').textContent=tr('already');return;}
 const s=api.getState(),preview=names.map(n=>`${n}: ${s.params.get(n)?.value??'—'} → ${updates[n]}`).join('\n');
 if(!window.confirm(`${confirmText}\n\n${preview}`))return;
 busy=true;$('globalResult').textContent='';render();
 try{
  const r=await api.writeGlobalProfile(updates,p=>{$('globalResult').textContent=`${tr('progress')}: ${p.done}/${p.total}${p.name?' · '+p.name:''}`;});
  $('globalResult').textContent=`${tr('written')} (${r.done}/${r.total})`;
 }catch(e){$('globalResult').textContent=e.message;}
 finally{busy=false;render();}
}
$('globalApply').onclick=()=>run(core.applyUpdates(api.getState().params),tr('confirm'));
$('globalDisable').onclick=()=>run(Object.fromEntries(Object.entries(core.disableUpdates()).filter(([n,v])=>api.getState().params.get(n)?.value!==v)),tr('confirmOff'));
for(const event of ['atlas:state','atlas:language','atlas:parameters'])window.addEventListener(event,render);
const refresh=()=>{if(!document.hidden)render();};let timer=setInterval(refresh,500);window.addEventListener('pagehide',()=>{clearInterval(timer);timer=null;});window.addEventListener('pageshow',()=>{if(!timer)timer=setInterval(refresh,500);render();});render();
})();
