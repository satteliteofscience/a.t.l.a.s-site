/* EKF3 G.L.O.B.A.L. activation profile card, next to the O.R.D.E.R. card. Explicit, confirmed, DISARMED-only parameter writes. */
(()=>{'use strict';
const api=window.AtlasCC,core=window.AtlasGlobalCore;if(!api||!core)return;
const words={
 ru:{title:'Профиль EKF3 G.L.O.B.A.L.',unsupported:'Нужна прошивка 2.0 (A.T.L.A.S-G.L.O.B.A.L)',noparams:'Подключи контроллер и дождись чтения параметров',active:'АКТИВЕН · профиль применён',off:'ВЫКЛЮЧЕН · опции NoAID равны 0',partial:'ЧАСТИЧНО · отличается параметров',options:'Опции NoAID',apply:'Применить профиль',disable:'Выключить опции',details:'Что изменится',nothing:'Все параметры профиля уже совпадают.',help:'Профиль записывает параметры EKF3, проверенные в часовом SITL-полёте: позиция по счислению, метка GPS, автоматический переход на GPS и наборы источников EK3_SRC1 / EK3_SRC2. Запись возможна только при DISARMED. После записи перезагрузи контроллер.',confirm:'Записать профиль EKF3 G.L.O.B.A.L. на контроллер?',confirmOff:'Выключить EK3_NOAID_POS, EK3_NOAID_GPS и EK3_NOAID_AUTO? Остальные параметры не изменятся.',written:'Записано и подтверждено контроллером. Перезагрузи контроллер, чтобы источники EKF3 применились.',progress:'Записано',already:'Профиль уже применён.',blocked:'Запись возможна при USB-связи, DISARMED и после полного чтения параметров.',pos:'позиция по счислению',gps:'метка GPS',auto:'переход на GPS',changed:'изменится'},
 uk:{title:'Профіль EKF3 G.L.O.B.A.L.',unsupported:'Потрібна прошивка 2.0 (A.T.L.A.S-G.L.O.B.A.L)',noparams:'Підключи контролер і дочекайся читання параметрів',active:'АКТИВНИЙ · профіль застосовано',off:'ВИМКНЕНО · опції NoAID дорівнюють 0',partial:'ЧАСТКОВО · відрізняється параметрів',options:'Опції NoAID',apply:'Застосувати профіль',disable:'Вимкнути опції',details:'Що зміниться',nothing:'Усі параметри профілю вже збігаються.',help:'Профіль записує параметри EKF3, перевірені в годинному SITL-польоті: позиція за лічбою, мітка GPS, автоматичний перехід на GPS і набори джерел EK3_SRC1 / EK3_SRC2. Запис можливий лише при DISARMED. Після запису перезавантаж контролер.',confirm:'Записати профіль EKF3 G.L.O.B.A.L. на контролер?',confirmOff:'Вимкнути EK3_NOAID_POS, EK3_NOAID_GPS і EK3_NOAID_AUTO? Інші параметри не зміняться.',written:'Записано й підтверджено контролером. Перезавантаж контролер, щоб джерела EKF3 застосувалися.',progress:'Записано',already:'Профіль уже застосовано.',blocked:'Запис можливий при USB-зв’язку, DISARMED і після повного читання параметрів.',pos:'позиція за лічбою',gps:'мітка GPS',auto:'перехід на GPS',changed:'зміниться'},
 en:{title:'EKF3 G.L.O.B.A.L. profile',unsupported:'Firmware 2.0 (A.T.L.A.S-G.L.O.B.A.L) required',noparams:'Connect the controller and wait for the parameter read',active:'ACTIVE · profile applied',off:'OFF · NoAID options are 0',partial:'PARTIAL · parameters that differ',options:'NoAID options',apply:'Apply profile',disable:'Switch options off',details:'What will change',nothing:'All profile parameters already match.',help:'The profile writes the EKF3 parameters flown in the one-hour SITL test: dead-reckoned position, the GPS marker, the automatic switch to GPS and the EK3_SRC1 / EK3_SRC2 source sets. Writing is possible only while DISARMED. Reboot the controller afterwards.',confirm:'Write the EKF3 G.L.O.B.A.L. profile to the controller?',confirmOff:'Switch EK3_NOAID_POS, EK3_NOAID_GPS and EK3_NOAID_AUTO off? No other parameter changes.',written:'Written and confirmed by the controller. Reboot the controller so the EKF3 sources take effect.',progress:'Written',already:'The profile is already applied.',blocked:'Writing needs a USB link, DISARMED and a completed parameter read.',pos:'dead-reckoned position',gps:'GPS marker',auto:'switch to GPS',changed:'will change'}
};
const tr=key=>(words[window.AtlasLanguage?.()]||words.ru)[key];
const $=id=>document.getElementById(id);
const card=document.createElement('article');card.className='cc-card order-card global-card';card.id='globalPanel';
card.innerHTML='<div class="cc-card-title"><span>◈</span><strong id="globalTitle"></strong><small>EKF3</small></div><strong id="globalStatus" role="status" aria-live="polite"></strong><div class="global-options" id="globalOptions"></div><details class="global-details"><summary id="globalDetailsLabel"></summary><ul id="globalChanges"></ul></details><div class="order-actions"><button id="globalApply" class="cc-button primary" type="button"></button><button id="globalDisable" class="cc-button ghost" type="button"></button></div><p id="globalHelp"></p><p id="globalResult" role="status" aria-live="polite"></p>';
const order=$('orderPanel');if(order)order.after(card);else document.querySelector('.cc-dashboard-right')?.prepend(card);
let busy=false;
function render(){
 const s=api.getState(),params=s.params,ready=s.connected&&!s.demo&&params.size>0&&!s.paramLoading;
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
