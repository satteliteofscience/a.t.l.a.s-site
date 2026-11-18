/* Radio-failsafe and logging presets on the main screen: CIRCLE/LOG OFF, RTL/LOG ON, RTL/LOG OFF. Explicit, confirmed, DISARMED-only parameter writes. */
(()=>{'use strict';
const api=window.AtlasCC,core=window.AtlasFailsafeLog;if(!api||!core)return;
const words={
 ru:{title:'Отказ радио и лог',noparams:'Подключи контроллер и дождись чтения параметров',unsupported:'На контроллере нет параметров отказа FS_*',active:'АКТИВЕН',custom:'СВОИ ЗНАЧЕНИЯ · ни один набор не совпал',values:'Сейчас на контроллере',details:'Что записывает каждый набор',
  tips:{'circle-off':'Потеря радио: круг, через 240 с планирование. Лог выключен.','rtl-on':'Потеря радио: возврат домой без ожидания. Лог включён.','rtl-off':'Потеря радио: возврат домой без ожидания. Лог выключен.'},
  help:'Наборы для проверки отказа радио и записи лога. CIRCLE: короткий отказ даёт круг, длинный через FS_LONG_TIMEOUT (240 с) даёт планирование (FS_LONG_ACTN 2). RTL: возврат домой сразу (FS_LONG_TIMEOUT 0). LOG ON включает лог (LOG_BACKEND_TYPE 1, LOG_BITMASK 65535), LOG OFF выключает (оба 0). Запись возможна только при DISARMED.',
  note:'В 4.7.3 параметра FS_SHORT_TIMEOUT нет: короткий отказ срабатывает сразу, как только приёмник признан потерянным, а время до этого задаёт RC_FS_TIMEOUT ({rc}). Наборы его не меняют.',
  confirm:'Записать набор «{label}» на контроллер?',reboot:'LOG_BACKEND_TYPE меняется: перезагрузи контроллер, чтобы лог включился или выключился.',written:'Записано и подтверждено контроллером.',already:'Контроллер уже в этом состоянии.',progress:'Записано',blocked:'Запись возможна при USB-связи, DISARMED и после полного чтения параметров.',unit:' с'},
 uk:{title:'Відмова радіо та лог',noparams:'Підключи контролер і дочекайся читання параметрів',unsupported:'На контролері немає параметрів відмови FS_*',active:'АКТИВНИЙ',custom:'ВЛАСНІ ЗНАЧЕННЯ · жоден набір не збігся',values:'Зараз на контролері',details:'Що записує кожен набір',
  tips:{'circle-off':'Втрата радіо: коло, через 240 с планування. Лог вимкнено.','rtl-on':'Втрата радіо: повернення додому без очікування. Лог увімкнено.','rtl-off':'Втрата радіо: повернення додому без очікування. Лог вимкнено.'},
  help:'Набори для перевірки відмови радіо та запису логу. CIRCLE: коротка відмова дає коло, довга через FS_LONG_TIMEOUT (240 с) дає планування (FS_LONG_ACTN 2). RTL: повернення додому одразу (FS_LONG_TIMEOUT 0). LOG ON вмикає лог (LOG_BACKEND_TYPE 1, LOG_BITMASK 65535), LOG OFF вимикає (обидва 0). Запис можливий лише при DISARMED.',
  note:'У 4.7.3 параметра FS_SHORT_TIMEOUT немає: коротка відмова спрацьовує одразу, щойно приймач визнано втраченим, а час до цього задає RC_FS_TIMEOUT ({rc}). Набори його не змінюють.',
  confirm:'Записати набір «{label}» на контролер?',reboot:'LOG_BACKEND_TYPE змінюється: перезавантаж контролер, щоб лог увімкнувся або вимкнувся.',written:'Записано й підтверджено контролером.',already:'Контролер уже в цьому стані.',progress:'Записано',blocked:'Запис можливий при USB-зв’язку, DISARMED і після повного читання параметрів.',unit:' с'},
 en:{title:'Radio failsafe and log',noparams:'Connect the controller and wait for the parameter read',unsupported:'The controller has no FS_* failsafe parameters',active:'ACTIVE',custom:'CUSTOM VALUES · no preset matches',values:'On the controller now',details:'What each preset writes',
  tips:{'circle-off':'Radio lost: circle, glide after 240 s. Log off.','rtl-on':'Radio lost: return home without waiting. Log on.','rtl-off':'Radio lost: return home without waiting. Log off.'},
  help:'Presets for testing the radio failsafe and for the log. CIRCLE: a short failsafe circles, a long one after FS_LONG_TIMEOUT (240 s) glides (FS_LONG_ACTN 2). RTL: return home at once (FS_LONG_TIMEOUT 0). LOG ON turns the log on (LOG_BACKEND_TYPE 1, LOG_BITMASK 65535), LOG OFF turns it off (both 0). Writing is possible only while DISARMED.',
  note:'In 4.7.3 there is no FS_SHORT_TIMEOUT: the short failsafe acts as soon as the receiver is judged lost, and RC_FS_TIMEOUT ({rc}) sets that wait. The presets do not change it.',
  confirm:'Write the “{label}” preset to the controller?',reboot:'LOG_BACKEND_TYPE changes: reboot the controller so the log switches on or off.',written:'Written and confirmed by the controller.',already:'The controller is already in this state.',progress:'Written',blocked:'Writing needs a USB link, DISARMED and a completed parameter read.',unit:' s'}
};
const tr=key=>(words[window.AtlasLanguage?.()]||words.ru)[key];
const $=id=>document.getElementById(id);
const card=document.createElement('article');card.className='cc-card order-card fslog-card';card.id='fslogPanel';
card.innerHTML='<div class="cc-card-title"><span>◈</span><strong id="fslogTitle"></strong><small>FS · LOG</small></div><strong id="fslogStatus" role="status" aria-live="polite"></strong><div class="fslog-buttons" id="fslogButtons"></div><div class="global-options" id="fslogValues"></div><details class="global-details"><summary id="fslogDetailsLabel"></summary><ul id="fslogDetails"></ul></details><p id="fslogHelp"></p><p id="fslogNote"></p><p id="fslogResult" role="status" aria-live="polite"></p>';
// Right column of the main screen, straight under the vehicle state.
const statusPanel=document.querySelector('.cc-status-panel');if(statusPanel)statusPanel.after(card);else document.querySelector('.cc-dashboard-right')?.prepend(card);
let busy=false,drawnLanguage=null;
const buttons=new Map();
for(const preset of core.PRESETS){
 const b=document.createElement('button');b.className='cc-button ghost';b.type='button';b.dataset.preset=preset.id;b.textContent=preset.label;
 b.onclick=()=>run(preset.id);buttons.set(preset.id,b);$('fslogButtons').append(b);
}
// Static text: rebuilt only when the language changes.
function renderStatic(){
 const language=window.AtlasLanguage?.()||'ru';if(drawnLanguage===language)return;drawnLanguage=language;
 $('fslogTitle').textContent=tr('title');$('fslogDetailsLabel').textContent=tr('details');$('fslogHelp').textContent=tr('help');
 const list=$('fslogDetails');list.replaceChildren();
 for(const preset of core.PRESETS){const li=document.createElement('li');li.textContent=`${preset.label}: ${preset.params.map(([n,v])=>`${n} ${v}`).join(' · ')}`;list.append(li);}
 for(const preset of core.PRESETS)buttons.get(preset.id).title=tr('tips')[preset.id];
}
function render(){
 const s=api.getState(),params=s.params,ready=s.connected&&!s.demo&&params.size>0&&!s.paramLoading;
 renderStatic();
 const st=ready?core.status(params):{state:'noparams',active:null,diffs:{}};
 const label=st.active?core.preset(st.active).label:'';
 $('fslogStatus').textContent=st.state==='noparams'?tr('noparams'):st.state==='unsupported'?tr('unsupported'):st.state==='active'?`${tr('active')} · ${label}`:tr('custom');
 card.dataset.state=st.state;
 const values=$('fslogValues');values.replaceChildren();
 if(st.state==='active'||st.state==='custom'){
  for(const name of core.INFO){
   if(!params.has(name))continue;
   const v=core.value(params,name),row=document.createElement('div'),a=document.createElement('small'),b=document.createElement('b');
   a.textContent=name;b.textContent=v===null?'—':String(v);row.append(a,b);values.append(row);
  }
 }
 const rc=core.value(params,'RC_FS_TIMEOUT');
 $('fslogNote').textContent=tr('note').replace('{rc}',rc===null?'—':`${rc}${tr('unit')}`);
 const writable=ready&&api.canWrite()&&st.state!=='unsupported';
 for(const preset of core.PRESETS){
  const b=buttons.get(preset.id),on=st.active===preset.id;
  b.disabled=busy||!writable||on;b.setAttribute('aria-pressed',String(on));b.classList.toggle('primary',on);b.classList.toggle('ghost',!on);
 }
}
async function run(id){
 if(busy||!api.canWrite())return;
 const preset=core.preset(id),s=api.getState(),updates=core.plan(s.params,id);
 if(!updates.length){$('fslogResult').textContent=tr('already');return;}
 const reboot=core.rebootNeeded(updates),preview=updates.map(([n,v])=>`${n}: ${s.params.get(n)?.value??'—'} → ${v}`).join('\n');
 if(!window.confirm(`${tr('confirm').replace('{label}',preset.label)}\n\n${preview}${reboot?`\n\n${tr('reboot')}`:''}`))return;
 busy=true;$('fslogResult').textContent='';render();
 try{
  const r=await api.writeFailsafeLogPreset(updates,p=>{$('fslogResult').textContent=`${tr('progress')}: ${p.done}/${p.total}${p.name?' · '+p.name:''}`;});
  $('fslogResult').textContent=`${tr('written')} (${r.done}/${r.total})${reboot?' '+tr('reboot'):''}`;
 }catch(e){$('fslogResult').textContent=e.message;}
 finally{busy=false;render();}
}
for(const event of ['atlas:state','atlas:language','atlas:parameters'])window.addEventListener(event,render);
const refresh=()=>{if(!document.hidden)render();};let timer=setInterval(refresh,500);window.addEventListener('pagehide',()=>{clearInterval(timer);timer=null;});window.addEventListener('pageshow',()=>{if(!timer)timer=setInterval(refresh,500);render();});render();
})();
