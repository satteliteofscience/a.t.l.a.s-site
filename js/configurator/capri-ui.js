/* O.R.D.E.R. monitor, explicit acknowledged activation, one-click preset (RC13) and a plain explanation of what the saved configuration does. */
(()=>{'use strict';
const api=window.AtlasCC,core=window.AtlasOrderCore;if(!api||!core)return;
const words={
 ru:{title:'Протокол П.Р.И.К.А.З',unknown:'Состояние не подтверждено',on:'АКТИВЕН',off:'ВЫКЛЮЧЕН',unsupported:'Нужна прошивка с ORDER_MODE',rc:'Активация с RC',gcs:'Активация с конфигуратора',disabled:'Протокол отключён',enable:'Активировать',disable:'Выключить',settings:'Настройки П.Р.И.К.А.З',help:'Ограничения действуют только в ARMED FBWA. Нулевой предел отключает свою ветвь. Буст не запускается. Углы — текущая оценка AHRS, не заданные пределы.',confirm:'Активировать ограничения П.Р.И.К.А.З на контроллере?',requested:'Команда принята. Ожидается подтверждение состояния.',roll:'Крен AHRS',pitch:'Тангаж AHRS',range:'Диапазон активации',stale:'Нет свежей ориентации'},
 uk:{title:'Протокол Н.А.К.А.З',unknown:'Стан не підтверджено',on:'АКТИВНИЙ',off:'ВИМКНЕНО',unsupported:'Потрібна прошивка з ORDER_MODE',rc:'Активація з RC',gcs:'Активація з конфігуратора',disabled:'Протокол вимкнено',enable:'Активувати',disable:'Вимкнути',settings:'Налаштування Н.А.К.А.З',help:'Обмеження діють лише в ARMED FBWA. Нульова межа вимикає свою гілку. Буст не запускається. Кути — поточна оцінка AHRS, а не задані межі.',confirm:'Активувати обмеження Н.А.К.А.З на контролері?',requested:'Команду прийнято. Очікується підтвердження стану.',roll:'Крен AHRS',pitch:'Тангаж AHRS',range:'Діапазон активації',stale:'Немає свіжої орієнтації'},
 en:{title:'O.R.D.E.R protocol',unknown:'State not confirmed',on:'ACTIVE',off:'OFF',unsupported:'Firmware with ORDER_MODE required',rc:'RC activation',gcs:'Configurator activation',disabled:'Protocol disabled',enable:'Activate',disable:'Deactivate',settings:'O.R.D.E.R settings',help:'Limits apply only in ARMED FBWA. A zero boundary bypasses its branch. Does not start boost. Angles are the current AHRS estimate, not commanded limits.',confirm:'Activate O.R.D.E.R limits on the controller?',requested:'Command accepted. Waiting for confirmed state.',roll:'AHRS roll',pitch:'AHRS pitch',range:'Activation range',stale:'No fresh attitude'}
};
const card=document.createElement('article');card.className='cc-card order-card';card.id='orderPanel';
card.innerHTML='<div class="cc-card-title"><span>◈</span><strong id="orderTitle"></strong><small>FBWA</small></div><strong id="orderStatus" role="status" aria-live="polite"></strong><p id="orderSource"></p><div class="order-angles"><div><small id="orderRollLabel"></small><b id="orderRoll">—</b></div><div><small id="orderPitchLabel"></small><b id="orderPitch">—</b></div></div><p id="orderRange"></p><div class="order-preset"><button id="orderPreset" class="cc-button primary" type="button"></button><p id="orderPresetState"></p></div><div class="order-actions"><button id="orderEnable" class="cc-button ghost" type="button"></button><button id="orderDisable" class="cc-button ghost" type="button"></button><button id="orderSettings" class="cc-button ghost" type="button"></button></div><p id="orderModesHint"></p><section class="order-how" id="orderHow"><div class="order-notice" id="orderNotice" role="status" aria-live="polite" hidden></div><details id="orderHowDetails"><summary id="orderHowTitle"></summary><ul id="orderHowList"></ul></details></section><p id="orderHelp"></p><p id="orderCommandResult" role="status" aria-live="polite"></p>';
document.querySelector('.cc-dashboard-right')?.prepend(card);
Object.assign(words.ru,{nolimits:'Включён настройкой · все ограничения равны 0',waiting:'ВКЛЮЧЁН · ожидает ARMED FBWA и исправного RC',gcs:'Включён настройкой · RC активации не используется',range:'Тумблер',unsupported:'Нужна версия прошивки с параметром O.R.D.E.R',confirmed:'Настройка подтверждена контроллером.'});Object.assign(words.uk,{nolimits:'Увімкнено налаштуванням · усі обмеження дорівнюють 0',waiting:'УВІМКНЕНО · очікує ARMED FBWA та справного RC',gcs:'Увімкнено налаштуванням · RC активації не використовується',range:'Перемикач',unsupported:'Потрібна версія прошивки з параметром O.R.D.E.R',confirmed:'Налаштування підтверджено контролером.'});Object.assign(words.en,{nolimits:'Enabled by configuration · all limits are zero',waiting:'ENABLED · waiting for ARMED FBWA and valid RC',gcs:'Enabled by configuration · activation RC ignored',range:'Switch',unsupported:'Firmware version with the O.R.D.E.R parameter required',confirmed:'Configuration confirmed by the controller.'});
// Preset and the plain explanation. Placeholders: {name} protocol name, {ch} channel, {roll} {stock} {rudder} {total} {pmin} {pmax}, {n} count.
Object.assign(words.ru,{
 preset:'Пресет и активация: руль 30° · крен 15° · тангаж ±5° · тумблер RC13',presetOn:'Пресет применён',presetPartial:'Пресет: отличается параметров — {n}',presetUnsupported:'Пресет недоступен: нужна прошивка 2.0 с ORDER_REV 2',presetNeedWrite:'Запись возможна при USB-связи, DISARMED и после полного чтения параметров.',
 presetConfirm:'Применить пресет и активировать {name}?\n\nПротокол включится тумблером на канале 13 (верхнее положение) в ARMED FBWA: предел крена 15° (рулём можно добавить ещё до 30°), тангаж от −5° до +5°. Запись возможна только при DISARMED; объяснение появится в карточке после записи.',activateLimits:'Ограничения ещё не заданы. Записать лимиты пресета (руль 30°, крен 15°, тангаж ±5°) и включить {name} без тумблера, чтобы они действовали всё время в ARMED FBWA?',switchReady:'ГОТОВ · включится тумблером RC{ch}',modesHint:'«Пресет и активация» включает протокол тумблером на канале 13. «Активировать» включает его без тумблера на всё время ARMED FBWA; если лимитов ещё нет, сначала записываются лимиты пресета.',presetWritten:'Записано и подтверждено контроллером.',progress:'Записано',
 howTitle:'Как это работает',noticePreset:'Готово: {name} настроен по пресету и записан в контроллер. Вот что теперь происходит:',noticeAlways:'Готово: {name} включён настройкой. Вот что теперь происходит:',noticeOff:'{name} выключен: ограничения не действуют.',
 howSwitch:'Включение: тумблер на канале {ch}. Верхнее положение (≥1750 µs) включает протокол, нижнее или среднее выключает. Назначь тумблер на этот канал в аппаратуре.',howSwitchHigh:' Каналы 13–16 приходят только по цифровой связи с приёмником (SBUS, CRSF, MAVLink2); на обычном PWM-входе их нет.',howSwitchNone:'Включение: канал не выбран (ORDER_RC_CH=0), тумблер ничего не включит.',howAlways:'Включение: настройкой, без тумблера. Ограничения действуют всё время, пока самолёт в ARMED FBWA.',howOff:'Протокол выключен (ORDER_MODE=0): ограничения не действуют.',
 howWhere:'Где работает: только в режиме FBWA при ARMED, исправном RC и без RC failsafe. В других режимах и на земле ничего не ограничивается.',
 howRoll:'Крен: пока протокол включён, предел крена {roll}° вместо ROLL_LIMIT_DEG ({stock}°). Сохранённый ROLL_LIMIT_DEG не меняется: после выключения прежний предел возвращается.',howRollNone:'Крен: предел не заменяется (ORDER_RLL_LIM=0), действует ROLL_LIMIT_DEG ({stock}°).',
 howRudder:'Руль: к пределу крена добавляется до {rudder}° крена от руля направления, всего до {total}°. Дальше действуют ограничения по сваливанию и скорости. Добавка работает при STALL_PREVENTION=1 и исправном датчике скорости.',howRudderNone:'Руль: добавка крена от руля не используется (RUD_LIMIT_DEG=0).',
 howPitchBoth:'Тангаж: заданный тангаж ограничен диапазоном от {pmin}° до +{pmax}° (после триммов и добавок газа).',howPitchLow:'Тангаж: заданный тангаж не ниже {pmin}° (после триммов и добавок газа).',howPitchHigh:'Тангаж: заданный тангаж не выше +{pmax}° (после триммов и добавок газа).',howPitchNone:'Тангаж: не ограничивается.',
 howSignal:'Подтверждение: при включении и выключении контроллер присылает сообщение «O.R.D.E.R. ACTIVATED» или «DEACTIVATED», а пока включено — раз в секунду текущие крен и тангаж. Положение тумблера в µs видно в этой карточке.',howLimit:'Это ограничение команд пилота, а не защита от сваливания и не гарантия физического крена. Буст не запускается.'
});
Object.assign(words.uk,{
 preset:'Пресет і активація: кермо 30° · крен 15° · тангаж ±5° · перемикач RC13',presetOn:'Пресет застосовано',presetPartial:'Пресет: відрізняється параметрів — {n}',presetUnsupported:'Пресет недоступний: потрібна прошивка 2.0 з ORDER_REV 2',presetNeedWrite:'Запис можливий при USB-зв’язку, DISARMED і після повного читання параметрів.',
 presetConfirm:'Застосувати пресет і активувати {name}?\n\nПротокол увімкнеться перемикачем на каналі 13 (верхнє положення) в ARMED FBWA: межа крену 15° (кермом можна додати ще до 30°), тангаж від −5° до +5°. Запис можливий лише при DISARMED; пояснення з’явиться в картці після запису.',activateLimits:'Обмеження ще не задано. Записати ліміти пресету (кермо 30°, крен 15°, тангаж ±5°) і ввімкнути {name} без перемикача, щоб вони діяли весь час в ARMED FBWA?',switchReady:'ГОТОВИЙ · увімкнеться перемикачем RC{ch}',modesHint:'«Пресет і активація» вмикає протокол перемикачем на каналі 13. «Активувати» вмикає його без перемикача на весь час ARMED FBWA; якщо лімітів ще немає, спочатку записуються ліміти пресету.',presetWritten:'Записано й підтверджено контролером.',progress:'Записано',
 howTitle:'Як це працює',noticePreset:'Готово: {name} налаштовано за пресетом і записано в контролер. Ось що тепер відбувається:',noticeAlways:'Готово: {name} увімкнено налаштуванням. Ось що тепер відбувається:',noticeOff:'{name} вимкнено: обмеження не діють.',
 howSwitch:'Увімкнення: перемикач на каналі {ch}. Верхнє положення (≥1750 µs) вмикає протокол, нижнє або середнє вимикає. Призначте перемикач на цей канал в апаратурі.',howSwitchHigh:' Канали 13–16 надходять лише через цифровий зв’язок із приймачем (SBUS, CRSF, MAVLink2); на звичайному PWM-вході їх немає.',howSwitchNone:'Увімкнення: канал не обрано (ORDER_RC_CH=0), перемикач нічого не ввімкне.',howAlways:'Увімкнення: налаштуванням, без перемикача. Обмеження діють увесь час, поки літак у ARMED FBWA.',howOff:'Протокол вимкнено (ORDER_MODE=0): обмеження не діють.',
 howWhere:'Де працює: лише в режимі FBWA при ARMED, справному RC і без RC failsafe. В інших режимах і на землі нічого не обмежується.',
 howRoll:'Крен: поки протокол увімкнено, межа крену {roll}° замість ROLL_LIMIT_DEG ({stock}°). Збережений ROLL_LIMIT_DEG не змінюється: після вимкнення колишня межа повертається.',howRollNone:'Крен: межа не замінюється (ORDER_RLL_LIM=0), діє ROLL_LIMIT_DEG ({stock}°).',
 howRudder:'Кермо: до межі крену додається до {rudder}° крену від керма напрямку, разом до {total}°. Далі діють обмеження за звалюванням і швидкістю. Додаток працює при STALL_PREVENTION=1 і справному датчику швидкості.',howRudderNone:'Кермо: додаток крену від керма не використовується (RUD_LIMIT_DEG=0).',
 howPitchBoth:'Тангаж: заданий тангаж обмежено діапазоном від {pmin}° до +{pmax}° (після тримерів і додатків газу).',howPitchLow:'Тангаж: заданий тангаж не нижче {pmin}° (після тримерів і додатків газу).',howPitchHigh:'Тангаж: заданий тангаж не вище +{pmax}° (після тримерів і додатків газу).',howPitchNone:'Тангаж: не обмежується.',
 howSignal:'Підтвердження: при ввімкненні й вимкненні контролер надсилає повідомлення «O.R.D.E.R. ACTIVATED» або «DEACTIVATED», а поки ввімкнено — раз на секунду поточні крен і тангаж. Положення перемикача в µs видно в цій картці.',howLimit:'Це обмеження команд пілота, а не захист від звалювання і не гарантія фізичного крену. Буст не запускається.'
});
Object.assign(words.en,{
 preset:'Preset and activation: rudder 30° · bank 15° · pitch ±5° · switch RC13',presetOn:'Preset applied',presetPartial:'Preset: parameters that differ — {n}',presetUnsupported:'Preset unavailable: firmware 2.0 with ORDER_REV 2 required',presetNeedWrite:'Writing needs a USB link, DISARMED and a completed parameter read.',
 presetConfirm:'Apply the preset and activate {name}?\n\nThe protocol turns on with the switch on channel 13 (high position) in ARMED FBWA: the bank limit is 15° (the rudder can add up to 30° more) and the pitch demand is limited to −5°…+5°. Writing is possible only while DISARMED; an explanation appears in the card after the write.',activateLimits:'No limits are set yet. Write the preset limits (rudder 30°, bank 15°, pitch ±5°) and turn {name} on without a switch, so they apply all the time in ARMED FBWA?',switchReady:'READY · turns on with the switch RC{ch}',modesHint:'“Preset and activation” turns the protocol on with the switch on channel 13. “Activate” turns it on without a switch for all of ARMED FBWA; when no limits exist yet, the preset limits are written first.',presetWritten:'Written and confirmed by the controller.',progress:'Written',
 howTitle:'How it works',noticePreset:'Done: {name} is configured with the preset and saved on the controller. This is what happens now:',noticeAlways:'Done: {name} is enabled by configuration. This is what happens now:',noticeOff:'{name} is off: no limits apply.',
 howSwitch:'Activation: a switch on channel {ch}. The high position (≥1750 µs) turns the protocol on, low or centre turns it off. Assign a switch to this channel in your transmitter.',howSwitchHigh:' Channels 13–16 arrive only over a digital receiver link (SBUS, CRSF, MAVLink2); a plain PWM input does not carry them.',howSwitchNone:'Activation: no channel is selected (ORDER_RC_CH=0), so the switch turns nothing on.',howAlways:'Activation: by configuration, without a switch. The limits apply all the time while the aircraft is in ARMED FBWA.',howOff:'The protocol is off (ORDER_MODE=0): no limits apply.',
 howWhere:'Where it works: only in FBWA while ARMED with a valid RC link and no RC failsafe. In other modes and on the ground nothing is limited.',
 howRoll:'Bank: while the protocol is on, the bank limit is {roll}° instead of ROLL_LIMIT_DEG ({stock}°). The saved ROLL_LIMIT_DEG is not changed: the old limit returns when the protocol is off.',howRollNone:'Bank: the limit is not replaced (ORDER_RLL_LIM=0), ROLL_LIMIT_DEG ({stock}°) applies.',
 howRudder:'Rudder: up to {rudder}° of extra bank from the rudder is added to the bank limit, {total}° in total. Stall and airspeed limits still apply. The extra bank works with STALL_PREVENTION=1 and a working airspeed sensor.',howRudderNone:'Rudder: no extra bank from the rudder (RUD_LIMIT_DEG=0).',
 howPitchBoth:'Pitch: the pitch demand is limited to {pmin}°…+{pmax}° (after trims and throttle additions).',howPitchLow:'Pitch: the pitch demand is not below {pmin}° (after trims and throttle additions).',howPitchHigh:'Pitch: the pitch demand is not above +{pmax}° (after trims and throttle additions).',howPitchNone:'Pitch: not limited.',
 howSignal:'Confirmation: when the protocol turns on or off the controller sends “O.R.D.E.R. ACTIVATED” or “DEACTIVATED”, and once a second the current roll and pitch while it is on. The switch position in µs is shown in this card.',howLimit:'This limits the pilot’s commands; it is not stall protection or a guaranteed physical bank angle. It does not start boost.'
});
const $=id=>document.getElementById(id);let sample=null,pwm=null,busy=false,lastConnection=null,requested=null,notice=null,howKey='';
function tr(key){return (words[window.AtlasLanguage?.()]||words.ru)[key];}
const fill=(text,values)=>text.replace(/\{(\w+)\}/g,(m,k)=>values&&values[k]!==undefined?values[k]:m);
const protocol=()=>core.protocolName(window.AtlasLanguage?.()||'ru');
const num=value=>Number.isFinite(value)?String(Math.round(value*10)/10):'—';
/** The explanation of the saved configuration, from the live parameters: one sentence per thing the protocol does. */
function howLines(summary){
 const out=[];
 if(summary.mode===0)return [fill(tr('howOff'))];
 if(summary.mode===2)out.push(tr('howAlways'));
 else out.push(summary.channel>0?fill(tr('howSwitch'),{ch:summary.channel})+(summary.channel>=13?tr('howSwitchHigh'):''):tr('howSwitchNone'));
 out.push(tr('howWhere'));
 out.push(summary.roll>0?fill(tr('howRoll'),{roll:num(summary.roll),stock:num(summary.stock)}):fill(tr('howRollNone'),{stock:num(summary.stock)}));
 out.push(summary.rudder>0?fill(tr('howRudder'),{rudder:num(summary.rudder),total:num(summary.bankTotal)}):tr('howRudderNone'));
 out.push(summary.pitchMin<0&&summary.pitchMax>0?fill(tr('howPitchBoth'),{pmin:num(summary.pitchMin),pmax:num(summary.pitchMax)}):summary.pitchMin<0?fill(tr('howPitchLow'),{pmin:num(summary.pitchMin)}):summary.pitchMax>0?fill(tr('howPitchHigh'),{pmax:num(summary.pitchMax)}):tr('howPitchNone'));
 out.push(tr('howSignal'),tr('howLimit'));
 return out;
}
function renderHow(s,revision){
 const summary=revision?core.summary(s.params):null,language=window.AtlasLanguage?.()||'ru';
 const key=JSON.stringify([language,summary,notice&&notice.kind]);if(key===howKey)return;howKey=key;
 $('orderHow').hidden=!summary;if(!summary)return;
 $('orderHowTitle').textContent=tr('howTitle');
 const list=$('orderHowList');list.replaceChildren();
 for(const text of howLines(summary)){const li=document.createElement('li');li.textContent=text;list.append(li);}
 const box=$('orderNotice');box.hidden=!notice;
 if(notice){box.textContent=fill(tr(notice.kind==='preset'?'noticePreset':notice.kind==='always'?'noticeAlways':'noticeOff'),{name:protocol()});$('orderHowDetails').open=true;}
}
function render(){
 const s=api.getState(),now=Date.now();if(lastConnection!==s.connectionId){sample=null;pwm=null;requested=null;notice=null;howKey='';lastConnection=s.connectionId;$('orderCommandResult').textContent='';}
 const mode=s.params.get('ORDER_MODE')?.value,active=core.observed(s,sample,now),revision=s.params.get('ORDER_REV')?.value>=2;
 for(const [id,key]of Object.entries({orderTitle:'title',orderRollLabel:'roll',orderPitchLabel:'pitch',orderEnable:'enable',orderDisable:'disable',orderSettings:'settings',orderHelp:'help',orderPreset:'preset',orderModesHint:'modesHint'}))$(id).textContent=tr(key);
 $('orderStatus').textContent=!revision?tr('unsupported'):mode===0?tr('off'):!core.hasLimits(s.params)?tr('nolimits'):active===true?tr('on'):mode===2&&active===false?tr('waiting'):mode===1&&active===false?fill(tr('switchReady'),{ch:s.params.get('ORDER_RC_CH')?.value??'—'}):active===null?tr('unknown'):tr('off');
 card.dataset.active=active===null?'unknown':String(active);
 $('orderSource').textContent=mode===1?tr('rc'):mode===2?tr('gcs'):tr('disabled');
 const fresh=s.connected&&!s.demo&&now-s.lastHeartbeat<4000&&now-s.lastAttitude<2500;
 for(const axis of ['roll','pitch'])$('order'+axis[0].toUpperCase()+axis.slice(1)).textContent=fresh&&Number.isFinite(s.telemetry[axis])?s.telemetry[axis].toFixed(1)+'°':'—';
 $('orderRange').textContent=mode===1?`${tr('range')}: RC${s.params.get('ORDER_RC_CH')?.value??'—'} · ${pwm&&pwm.value>0&&now-pwm.at<2500?pwm.value.toFixed(0)+' µs':'—'} · HIGH ≥${core.SWITCH_ON_US} ON / LOW OFF`:'';
 // Without any limit (a fresh controller) the button still works: the preset limits are written first, so no limit has to be typed in by hand.
 const needsLimits=revision&&core.commandAllowed(s,false)&&!core.hasLimits(s.params)&&core.presetStatus(s.params).state!=='unsupported'&&api.canWrite();
 $('orderEnable').disabled=busy||mode===2||!(core.commandAllowed(s,true)||needsLimits);
 $('orderDisable').disabled=busy||!core.commandAllowed(s,false)||mode===0;
 const ready=s.connected&&!s.demo&&s.params.size>0&&!s.paramLoading,preset=ready?core.presetStatus(s.params):{state:'unsupported',changes:[]};
 $('orderPresetState').textContent=!ready?'':preset.state==='unsupported'?tr('presetUnsupported'):preset.state==='active'?tr('presetOn'):fill(tr('presetPartial'),{n:preset.changes.length})+(api.canWrite()?'':' · '+tr('presetNeedWrite'));
 $('orderPreset').disabled=busy||!ready||preset.state!=='partial'||!api.canWrite();
 renderHow(s,ready&&revision);
}
// No limits yet: the preset limits are written first (rudder 30, bank 15, pitch -5..+5), then the protocol is turned on without a switch (ORDER_MODE 2).
async function activateWithLimits(){
 const s=api.getState();if(busy||!core.commandAllowed(s,false)||!api.canWrite())return;
 const updates=Object.fromEntries(core.PRESET.filter(([name,value])=>name!=='ORDER_MODE'&&name!=='ORDER_RC_CH'&&s.params.get(name)?.value!==value));
 const diff=Object.keys(updates).map(n=>`${n}: ${s.params.get(n)?.value??'—'} → ${updates[n]}`).join('\n');
 if(!window.confirm(`${fill(tr('activateLimits'),{name:protocol()})}\n\n${diff}`))return;
 busy=true;requested=true;$('orderCommandResult').textContent='';render();
 try{
  if(Object.keys(updates).length)await api.writeOrderPreset(updates,p=>{$('orderCommandResult').textContent=`${tr('progress')}: ${p.done}/${p.total}${p.name?' · '+p.name:''}`;});
  await api.orderCommand(true);requested=null;$('orderCommandResult').textContent=tr('confirmed');notice={kind:'always'};howKey='';
 }catch(e){requested=null;$('orderCommandResult').textContent=e.message;}
 finally{busy=false;render();}
}
async function send(enable){
 if(enable&&!core.hasLimits(api.getState().params))return activateWithLimits();
 if(busy||!core.commandAllowed(api.getState(),enable))return;
 if(enable&&!window.confirm(tr('confirm')))return;
 busy=true;requested=enable;render();
 try{await api.orderCommand(enable);requested=null;$('orderCommandResult').textContent=tr('confirmed');notice={kind:enable?'always':'off'};howKey='';}
 catch(e){requested=null;$('orderCommandResult').textContent=e.message;}
 finally{busy=false;render();}
}
async function applyPreset(){
 if(busy||!api.canWrite())return;
 const s=api.getState(),updates=core.presetUpdates(s.params),names=Object.keys(updates);if(!names.length)return;
 const diff=names.map(n=>`${n}: ${s.params.get(n)?.value??'—'} → ${updates[n]}`).join('\n');
 if(!window.confirm(`${fill(tr('presetConfirm'),{name:protocol()})}\n\n${diff}`))return;
 busy=true;$('orderCommandResult').textContent='';render();
 try{
  const r=await api.writeOrderPreset(updates,p=>{$('orderCommandResult').textContent=`${tr('progress')}: ${p.done}/${p.total}${p.name?' · '+p.name:''}`;});
  $('orderCommandResult').textContent=`${tr('presetWritten')} (${r.done}/${r.total})`;notice={kind:'preset'};howKey='';
 }catch(e){$('orderCommandResult').textContent=e.message;}
 finally{busy=false;render();}
}
$('orderEnable').onclick=()=>send(true);$('orderDisable').onclick=()=>send(false);$('orderPreset').onclick=applyPreset;
$('orderSettings').onclick=()=>api.navigateOrder();
window.addEventListener('atlas:message',e=>{const d=e.detail,s=api.getState();if(d.sourceSysid!==s.sysid||d.sourceCompid!==s.compid)return;if(d.type==='named_float'&&d.name==='ORDER_PWM'&&Number.isFinite(d.value)){pwm={value:d.value,at:Date.now()};render();}if(d.type==='named_float'&&d.name==='ORDER_ON'&&(d.value===0||d.value===1)){sample={value:d.value,at:Date.now(),connectionId:s.connectionId};if(requested===(d.value===1)){$('orderCommandResult').textContent=tr('confirmed');requested=null;}render();}});
for(const event of ['atlas:state','atlas:language','atlas:parameters'])window.addEventListener(event,render);
const refresh=()=>{if(!document.hidden)render();};let timer=setInterval(refresh,250);window.addEventListener('pagehide',()=>{clearInterval(timer);timer=null;});window.addEventListener('pageshow',()=>{if(!timer)timer=setInterval(refresh,250);render();});render();
})();
