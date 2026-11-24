/* AI-assisted. Wind profile card on the main screen: three NOAID_WIND presets (wind off, operator command only, learning) and the operator's wind command with its answer.
 * The presets are explicit, confirmed, DISARMED-only parameter writes (AtlasCC.writeWindProfile). The wind command is not a parameter write: it works with a live link, armed or not. */
(()=>{'use strict';
const api=window.AtlasCC,core=window.AtlasWindProfile;if(!api||!core)return;
const words={
 ru:{title:'Ветер',noparams:'Подключи контроллер и дождись чтения параметров',unsupported:'Нужна прошивка 3.0 (параметр NOAID_WIND)',active:'АКТИВЕН',custom:'СВОЁ ЗНАЧЕНИЕ · ни один набор не совпал',
  p_off:'Ветер выкл',p_command:'Только команда',p_learn:'Обучение',
  tips:{off:'NOAID_WIND 0: счисление считает ветер нулевым, обучения и команды нет.',command:'NOAID_WIND 1: ветер задаёт только оператор командой; в штиль он остаётся нулевым.',learn:'NOAID_WIND 7: команда оператора, обучение ветра по меткам и поправки шкалы Pitot и курса (R3).'},
  bit0:'команда оператора',bit1:'обучение ветра по меткам',bit2:'поправки Pitot и курса (R3)',wage:'забывание ветра без меток',wageOff:'выкл',unit:' с',on:'вкл',off:'выкл',
  details:'Что означает каждый набор',
  help:'Профиль включает и выключает функции ветра прошивки 3.0 одним параметром NOAID_WIND. «Ветер выкл» (0): счисление считает ветер нулевым. «Только команда» (1): ветер задаёт оператор; в штиль выбирай его: неточные метки не превратятся в ложный ветер. «Обучение» (7): прошивка учит ветер и ошибки датчиков по меткам оператора; нужно при настоящем ветре и аккуратных метках. Запись возможна только при DISARMED.',
  calm:'В штиль обучение не нужно. Выключение обучения уже выученный ветер не обнуляет: чтобы сказать, что ветер снова 0, отправь команду «Ветер 0» ниже.',
  confirm:'Записать профиль ветра «{label}» на контроллер?',written:'Записано и подтверждено контроллером.',already:'Контроллер уже в этом состоянии.',progress:'Записано',keeps:'Выученный ветер остался в памяти: если ветра нет, отправь «Ветер 0».',
  cmdTitle:'Ввести ветер командой оператора',speed:'Скорость, м/с',dir:'Откуда дует, °',send:'Отправить ветер',zero:'Ветер 0 (штиль)',
  cmdHint:'Команда MAV_CMD_EXTERNAL_WIND_ESTIMATE работает в полёте без GPS-привязки позиции и только если в NOAID_WIND включён бит команды (значения 1, 3, 7). Скорость 0 говорит автопилоту, что ветер снова нулевой. Команда не записывает параметры, поэтому работает и в полёте.',
  bit0off:'В NOAID_WIND сейчас нет бита команды: автопилот отклонит команду. Выбери «Только команда» или «Обучение» на земле при DISARMED.',
  demo:'В демо-режиме команда не отправляется.',nolink:'Нет живой связи с контроллером.',badWind:'Скорость 0–40 м/с, направление 0–360°.',sending:'Отправляю…',accepted:'Принято автопилотом',rejected:'Автопилот отклонил команду',
  noAck:'Ответа нет: команда отправлена, смотри сообщения автопилота.',fc:'Автопилот',confirmWind:'Отправить автопилоту ветер {s} м/с, откуда дует {d}°?',confirmZero:'Сказать автопилоту, что ветер 0?'},
 uk:{title:'Вітер',noparams:'Підключи контролер і дочекайся читання параметрів',unsupported:'Потрібна прошивка 3.0 (параметр NOAID_WIND)',active:'АКТИВНИЙ',custom:'ВЛАСНЕ ЗНАЧЕННЯ · жоден набір не збігся',
  p_off:'Вітер вимк',p_command:'Лише команда',p_learn:'Навчання',
  tips:{off:'NOAID_WIND 0: лічба вважає вітер нульовим, навчання й команди немає.',command:'NOAID_WIND 1: вітер задає лише оператор командою; у штиль він лишається нульовим.',learn:'NOAID_WIND 7: команда оператора, навчання вітру за мітками та поправки шкали Pitot і курсу (R3).'},
  bit0:'команда оператора',bit1:'навчання вітру за мітками',bit2:'поправки Pitot і курсу (R3)',wage:'забування вітру без міток',wageOff:'вимк',unit:' с',on:'увімк',off:'вимк',
  details:'Що означає кожен набір',
  help:'Профіль вмикає й вимикає функції вітру прошивки 3.0 одним параметром NOAID_WIND. «Вітер вимк» (0): лічба вважає вітер нульовим. «Лише команда» (1): вітер задає оператор; у штиль обирай його: неточні мітки не перетворяться на хибний вітер. «Навчання» (7): прошивка вчить вітер і похибки датчиків за мітками оператора; потрібне за справжнього вітру й акуратних міток. Запис можливий лише при DISARMED.',
  calm:'У штиль навчання не потрібне. Вимкнення навчання вже вивчений вітер не обнуляє: щоб сказати, що вітер знову 0, надішли команду «Вітер 0» нижче.',
  confirm:'Записати профіль вітру «{label}» на контролер?',written:'Записано й підтверджено контролером.',already:'Контролер уже в цьому стані.',progress:'Записано',keeps:'Вивчений вітер лишився в пам’яті: якщо вітру немає, надішли «Вітер 0».',
  cmdTitle:'Ввести вітер командою оператора',speed:'Швидкість, м/с',dir:'Звідки дме, °',send:'Надіслати вітер',zero:'Вітер 0 (штиль)',
  cmdHint:'Команда MAV_CMD_EXTERNAL_WIND_ESTIMATE працює в польоті без GPS-прив’язки позиції й лише якщо в NOAID_WIND увімкнений біт команди (значення 1, 3, 7). Швидкість 0 каже автопілоту, що вітер знову нульовий. Команда не записує параметри, тому працює і в польоті.',
  bit0off:'У NOAID_WIND зараз немає біта команди: автопілот відхилить команду. Обери «Лише команда» або «Навчання» на землі при DISARMED.',
  demo:'У демо-режимі команда не надсилається.',nolink:'Немає живого зв’язку з контролером.',badWind:'Швидкість 0–40 м/с, напрям 0–360°.',sending:'Надсилаю…',accepted:'Прийнято автопілотом',rejected:'Автопілот відхилив команду',
  noAck:'Відповіді немає: команду надіслано, дивись повідомлення автопілота.',fc:'Автопілот',confirmWind:'Надіслати автопілоту вітер {s} м/с, звідки дме {d}°?',confirmZero:'Сказати автопілоту, що вітер 0?'},
 en:{title:'Wind',noparams:'Connect the controller and wait for the parameter read',unsupported:'Firmware 3.0 required (parameter NOAID_WIND)',active:'ACTIVE',custom:'OWN VALUE · no preset matches',
  p_off:'Wind off',p_command:'Command only',p_learn:'Learning',
  tips:{off:'NOAID_WIND 0: the dead reckoning takes the wind as zero, no learning and no command.',command:'NOAID_WIND 1: only the operator sets the wind, with a command; in calm air it stays zero.',learn:'NOAID_WIND 7: the operator command, the wind learned from the fixes and the Pitot scale and heading corrections (R3).'},
  bit0:'operator command',bit1:'wind learned from fixes',bit2:'Pitot and heading corrections (R3)',wage:'wind forgotten without fixes',wageOff:'off',unit:' s',on:'on',off:'off',
  details:'What each preset means',
  help:'The profile switches the wind functions of firmware 3.0 on and off with one parameter, NOAID_WIND. “Wind off” (0): the dead reckoning takes the wind as zero. “Command only” (1): the operator sets the wind; pick it in calm air, an inaccurate fix then cannot turn into a false wind. “Learning” (7): the firmware learns the wind and the sensor errors from the operator’s fixes; use it in a real wind with accurate fixes. Writing is possible only while DISARMED.',
  calm:'Calm air needs no learning. Switching the learning off does not clear a wind that has already been learned: to say the wind is 0 again, send the “Wind 0” command below.',
  confirm:'Write the wind profile “{label}” to the controller?',written:'Written and confirmed by the controller.',already:'The controller is already in this state.',progress:'Written',keeps:'The learned wind stayed in memory: if there is no wind, send “Wind 0”.',
  cmdTitle:'Enter the wind with the operator command',speed:'Speed, m/s',dir:'Blowing from, °',send:'Send wind',zero:'Wind 0 (calm)',
  cmdHint:'The MAV_CMD_EXTERNAL_WIND_ESTIMATE command works in flight without GPS aiding of the position and only if NOAID_WIND has the command bit set (values 1, 3, 7). A speed of 0 tells the autopilot the wind is zero again. The command writes no parameter, so it also works in flight.',
  bit0off:'NOAID_WIND has no command bit now: the autopilot will refuse the command. Pick “Command only” or “Learning” on the ground while DISARMED.',
  demo:'The command is not sent in demo mode.',nolink:'No live link to the controller.',badWind:'Speed 0–40 m/s, direction 0–360°.',sending:'Sending…',accepted:'Accepted by the autopilot',rejected:'The autopilot refused the command',
  noAck:'No answer: the command was sent, watch the autopilot messages.',fc:'Autopilot',confirmWind:'Send the autopilot a wind of {s} m/s blowing from {d}°?',confirmZero:'Tell the autopilot the wind is 0?'}
};
const tr=key=>(words[window.AtlasLanguage?.()]||words.ru)[key];
const $=id=>document.getElementById(id);
const card=document.createElement('article');card.className='cc-card order-card wind-card';card.id='windPanel';
card.innerHTML='<div class="cc-card-title"><span>◈</span><strong id="windTitle"></strong><small>NOAID_WIND</small></div><strong id="windStatus" role="status" aria-live="polite"></strong><div class="wind-buttons" id="windButtons"></div><div class="global-options" id="windValues"></div><details class="global-details"><summary id="windDetailsLabel"></summary><ul id="windDetails"></ul></details><p id="windHelp"></p><p id="windCalm" class="wind-calm"></p><p id="windResult" role="status" aria-live="polite"></p>'+
 '<div class="wind-cmd"><h4 id="windCmdTitle"></h4><div class="wind-cmd-row"><label><span id="windSpeedLabel"></span><input id="windSpeed" type="number" inputmode="decimal" min="0" max="40" step="0.1" value="0"></label><label><span id="windDirLabel"></span><input id="windDir" type="number" inputmode="decimal" min="0" max="360" step="1" value="0"></label></div><div class="order-actions"><button id="windSend" class="cc-button primary" type="button"></button><button id="windZero" class="cc-button ghost" type="button"></button></div><p id="windCmdHint"></p><p id="windCmdWarn" class="wind-warn"></p><p id="windCmdResult" role="status" aria-live="polite"></p></div>';
// Main screen, right column: straight under the radio-failsafe and log card (or under the vehicle state when that card is absent).
const anchor=document.getElementById('fslogPanel')||document.querySelector('.cc-status-panel');
if(anchor)anchor.after(card);else document.querySelector('.cc-dashboard-right')?.prepend(card);
let busy=false,cmdBusy=false,drawnLanguage=null;
const buttons=new Map();
for(const p of core.PRESETS){
 const b=document.createElement('button');b.className='cc-button ghost';b.type='button';b.dataset.preset=p.id;b.onclick=()=>run(p.id);buttons.set(p.id,b);$('windButtons').append(b);
}
// Static text: rebuilt only when the language changes.
function renderStatic(){
 const language=window.AtlasLanguage?.()||'ru';if(drawnLanguage===language)return;drawnLanguage=language;
 $('windTitle').textContent=tr('title');$('windDetailsLabel').textContent=tr('details');$('windHelp').textContent=tr('help');$('windCalm').textContent=tr('calm');
 const list=$('windDetails');list.replaceChildren();
 for(const p of core.PRESETS){const li=document.createElement('li');li.textContent=`${tr('p_'+p.id)}: ${tr('tips')[p.id]}`;list.append(li);const b=buttons.get(p.id);b.textContent=tr('p_'+p.id);b.title=tr('tips')[p.id];}
 $('windCmdTitle').textContent=tr('cmdTitle');$('windSpeedLabel').textContent=tr('speed');$('windDirLabel').textContent=tr('dir');$('windSend').textContent=tr('send');$('windZero').textContent=tr('zero');$('windCmdHint').textContent=tr('cmdHint');
}
const num1=x=>(Math.round(x*10)/10).toString();
function render(){
 const s=api.getState(),params=s.params,ready=s.connected&&!s.demo&&params.size>0&&!s.paramLoading;
 renderStatic();
 const st=ready?core.status(params):{state:'noparams',active:null,value:null};
 $('windStatus').textContent=st.state==='noparams'?tr('noparams'):st.state==='unsupported'?tr('unsupported'):st.state==='active'?`${tr('active')} · ${tr('p_'+st.active)} (${st.value})`:`${tr('custom')} (${st.value})`;
 card.dataset.state=st.state;
 const values=$('windValues');values.replaceChildren();
 if(st.state==='active'||st.state==='custom'){
  const b=core.bits(st.value);
  for(const [key,label,on] of [['b0','bit0',b.command],['b1','bit1',b.learn],['b2','bit2',b.calibrate]]){const row=document.createElement('div'),a=document.createElement('small'),v=document.createElement('b');row.dataset.on=String(!!on);a.textContent=tr(label);v.textContent=on?tr('on'):tr('off');row.append(a,v);values.append(row);}
  const wage=core.value(params,'NOAID_WAGE');
  if(wage!==null){const row=document.createElement('div'),a=document.createElement('small'),v=document.createElement('b');row.dataset.on=String(wage>0);a.textContent=`NOAID_WAGE · ${tr('wage')}`;v.textContent=wage>0?`${wage}${tr('unit')}`:tr('wageOff');row.append(a,v);values.append(row);}
 }
 const writable=ready&&api.canWrite()&&st.state!=='unsupported';
 for(const p of core.PRESETS){const b=buttons.get(p.id),on=st.active===p.id;b.disabled=busy||!writable||on;b.setAttribute('aria-pressed',String(on));b.classList.toggle('primary',on);b.classList.toggle('ghost',!on);}
 // the command panel: a live link, armed or not; not in demo mode
 const live=s.connected&&!s.demo&&s.sysid!==null&&Date.now()-s.lastHeartbeat<4000;
 $('windSend').disabled=cmdBusy||!live;$('windZero').disabled=cmdBusy||!live;$('windSpeed').disabled=cmdBusy;$('windDir').disabled=cmdBusy;
 const warn=$('windCmdWarn');warn.textContent=s.demo?tr('demo'):!s.connected?tr('nolink'):(ready&&core.commandAdvice(params)==='bit0off')?tr('bit0off'):'';
}
/** One event of the link (an ack or a text) or null after the time-out; the listener is removed in both cases. */
function waitFor(match,ms){
 return new Promise(resolve=>{
  const done=v=>{clearTimeout(timer);window.removeEventListener('atlas:message',on);resolve(v);};
  const on=e=>{const r=match(e.detail||{});if(r!==undefined&&r!==null)done(r);};
  const timer=setTimeout(()=>done(null),ms);window.addEventListener('atlas:message',on);
 });
}
async function run(id){
 if(busy||!api.canWrite())return;
 const s=api.getState(),updates=core.plan(s.params,id);
 if(!updates.length){$('windResult').textContent=tr('already');return;}
 const keeps=core.keepsLearnedWind(s.params,id),preview=updates.map(([n,v])=>`${n}: ${s.params.get(n)?.value??'—'} → ${v}`).join('\n');
 if(!window.confirm(`${tr('confirm').replace('{label}',tr('p_'+id))}\n\n${preview}${keeps?`\n\n${tr('keeps')}`:''}`))return;
 busy=true;$('windResult').textContent='';render();
 try{
  const r=await api.writeWindProfile(updates,p=>{$('windResult').textContent=`${tr('progress')}: ${p.done}/${p.total}${p.name?' · '+p.name:''}`;});
  $('windResult').textContent=`${tr('written')} (${r.done}/${r.total})${keeps?' '+tr('keeps'):''}`;
 }catch(e){$('windResult').textContent=e.message;}
 finally{busy=false;render();}
}
async function sendWind(zero){
 if(cmdBusy)return;
 let cmd;try{cmd=core.windCommand(zero?0:$('windSpeed').value,zero?0:$('windDir').value);}catch{$('windCmdResult').textContent=tr('badWind');return;}
 if(zero){$('windSpeed').value='0';$('windDir').value='0';}
 const question=cmd.speed===0?tr('confirmZero'):tr('confirmWind').replace('{s}',num1(cmd.speed)).replace('{d}',String(Math.round(cmd.direction)));
 if(!window.confirm(question))return;
 cmdBusy=true;$('windCmdResult').textContent=tr('sending');render();
 try{
  // listen before sending: the answer can come back within a few milliseconds
  const ack=waitFor(m=>m.type==='ack'&&m.command===core.COMMAND?m:null,3000);
  const text=waitFor(m=>m.type==='text'&&/NOAID wind set/.test(m.text||'')?m.text:null,4500);
  await api.sendWindEstimate(cmd.speed,cmd.direction);
  const a=await ack;
  if(a===null)$('windCmdResult').textContent=tr('noAck');
  else if(a.result===0){
   $('windCmdResult').textContent=tr('accepted');
   const t=await Promise.race([text,new Promise(r=>setTimeout(()=>r(null),1500))]);
   if(t)$('windCmdResult').textContent=`${tr('accepted')} · ${tr('fc')}: ${t}`;
  }else $('windCmdResult').textContent=`${tr('rejected')} (${core.resultName(a.result)}, ${a.result})`;
 }catch(e){$('windCmdResult').textContent=e.message;}
 finally{cmdBusy=false;render();}
}
$('windSend').onclick=()=>sendWind(false);
$('windZero').onclick=()=>sendWind(true);
for(const event of ['atlas:state','atlas:language','atlas:parameters'])window.addEventListener(event,render);
const refresh=()=>{if(!document.hidden)render();};let timer=setInterval(refresh,500);window.addEventListener('pagehide',()=>{clearInterval(timer);timer=null;});window.addEventListener('pageshow',()=>{if(!timer)timer=setInterval(refresh,500);render();});render();
})();
