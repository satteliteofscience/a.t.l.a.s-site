/* O.R.D.E.R. monitor and explicit, acknowledged activation. */
(()=>{'use strict';
const api=window.AtlasCC,core=window.AtlasOrderCore;if(!api||!core)return;
const words={
 ru:{title:'O.R.D.E.R. · П.Р.И.К.А.З.',unknown:'Состояние не подтверждено',on:'АКТИВЕН',off:'ВЫКЛЮЧЕН',unsupported:'Нужна прошивка с ORDER_MODE',rc:'Активация с RC',gcs:'Активация с конфигуратора',disabled:'Протокол отключён',enable:'Активировать',disable:'Выключить',settings:'Настройки O.R.D.E.R.',help:'Ограничения действуют только в ARMED FBWA. Нулевой предел отключает свою ветвь. Буст не запускается. Углы — текущая оценка AHRS, не заданные пределы.',confirm:'Активировать ограничения O.R.D.E.R. на контроллере?',requested:'Команда принята. Ожидается подтверждение состояния.',roll:'Крен AHRS',pitch:'Тангаж AHRS',range:'Диапазон активации',stale:'Нет свежей ориентации'},
 uk:{title:'Протокол O.R.D.E.R.',unknown:'Стан не підтверджено',on:'АКТИВНИЙ',off:'ВИМКНЕНО',unsupported:'Потрібна прошивка з ORDER_MODE',rc:'Активація з RC',gcs:'Активація з конфігуратора',disabled:'Протокол вимкнено',enable:'Активувати',disable:'Вимкнути',settings:'Налаштування O.R.D.E.R.',help:'Обмеження діють лише в ARMED FBWA. Нульова межа вимикає свою гілку. Буст не запускається. Кути — поточна оцінка AHRS, а не задані межі.',confirm:'Активувати обмеження O.R.D.E.R. на контролері?',requested:'Команду прийнято. Очікується підтвердження стану.',roll:'Крен AHRS',pitch:'Тангаж AHRS',range:'Діапазон активації',stale:'Немає свіжої орієнтації'},
 en:{title:'O.R.D.E.R. protocol',unknown:'State not confirmed',on:'ACTIVE',off:'OFF',unsupported:'Firmware with ORDER_MODE required',rc:'RC activation',gcs:'Configurator activation',disabled:'Protocol disabled',enable:'Activate',disable:'Deactivate',settings:'O.R.D.E.R. settings',help:'Limits apply only in ARMED FBWA. A zero boundary bypasses its branch. Does not start boost. Angles are the current AHRS estimate, not commanded limits.',confirm:'Activate O.R.D.E.R. limits on the controller?',requested:'Command accepted. Waiting for confirmed state.',roll:'AHRS roll',pitch:'AHRS pitch',range:'Activation range',stale:'No fresh attitude'}
};
const card=document.createElement('article');card.className='cc-card order-card';card.id='orderPanel';
card.innerHTML='<div class="cc-card-title"><span>◈</span><strong id="orderTitle"></strong><small>FBWA</small></div><strong id="orderStatus" role="status" aria-live="polite"></strong><p id="orderSource"></p><div class="order-angles"><div><small id="orderRollLabel"></small><b id="orderRoll">—</b></div><div><small id="orderPitchLabel"></small><b id="orderPitch">—</b></div></div><p id="orderRange"></p><div class="order-actions"><button id="orderEnable" class="cc-button primary" type="button"></button><button id="orderDisable" class="cc-button ghost" type="button"></button><button id="orderSettings" class="cc-button ghost" type="button"></button></div><p id="orderHelp"></p><p id="orderCommandResult" role="status" aria-live="polite"></p>';
document.querySelector('.cc-dashboard-right')?.prepend(card);
Object.assign(words.ru,{nolimits:'Включён настройкой · все ограничения равны 0',waiting:'ВКЛЮЧЁН · ожидает ARMED FBWA и исправного RC',gcs:'Включён настройкой · RC активации не используется',range:'Тумблер',unsupported:'Нужна прошивка с ORDER_REV=2',confirmed:'Настройка подтверждена контроллером.'});Object.assign(words.uk,{nolimits:'Увімкнено налаштуванням · усі обмеження дорівнюють 0',waiting:'УВІМКНЕНО · очікує ARMED FBWA та справного RC',gcs:'Увімкнено налаштуванням · RC активації не використовується',range:'Перемикач',unsupported:'Потрібна прошивка з ORDER_REV=2',confirmed:'Налаштування підтверджено контролером.'});Object.assign(words.en,{nolimits:'Enabled by configuration · all limits are zero',waiting:'ENABLED · waiting for ARMED FBWA and valid RC',gcs:'Enabled by configuration · activation RC ignored',range:'Switch',unsupported:'Firmware with ORDER_REV=2 required',confirmed:'Configuration confirmed by the controller.'});
const $=id=>document.getElementById(id);let sample=null,pwm=null,busy=false,lastConnection=null,requested=null;
function tr(key){return (words[window.AtlasLanguage?.()]||words.ru)[key];}
function render(){
 const s=api.getState(),now=Date.now();if(lastConnection!==s.connectionId){sample=null;pwm=null;requested=null;lastConnection=s.connectionId;$('orderCommandResult').textContent='';}
 const mode=s.params.get('ORDER_MODE')?.value,active=core.observed(s,sample,now),revision=s.params.get('ORDER_REV')?.value>=2;
 for(const [id,key]of Object.entries({orderTitle:'title',orderRollLabel:'roll',orderPitchLabel:'pitch',orderEnable:'enable',orderDisable:'disable',orderSettings:'settings',orderHelp:'help'}))$(id).textContent=tr(key);
 $('orderStatus').textContent=!revision?tr('unsupported'):mode===0?tr('off'):!core.hasLimits(s.params)?tr('nolimits'):active===true?tr('on'):mode===2&&active===false?tr('waiting'):active===null?tr('unknown'):tr('off');
 card.dataset.active=active===null?'unknown':String(active);
 $('orderSource').textContent=mode===1?tr('rc'):mode===2?tr('gcs'):tr('disabled');
 const fresh=s.connected&&!s.demo&&now-s.lastHeartbeat<4000&&now-s.lastAttitude<2500;
 for(const axis of ['roll','pitch'])$('order'+axis[0].toUpperCase()+axis.slice(1)).textContent=fresh&&Number.isFinite(s.telemetry[axis])?s.telemetry[axis].toFixed(1)+'°':'—';
 $('orderRange').textContent=mode===1?`${tr('range')}: RC${s.params.get('ORDER_RC_CH')?.value??'—'} · ${pwm&&pwm.value>0&&now-pwm.at<2500?pwm.value.toFixed(0)+' µs':'—'} · HIGH ≥1750 ON / LOW OFF`:'';
 $('orderEnable').disabled=busy||!core.commandAllowed(s,true)||mode===2;
 $('orderDisable').disabled=busy||!core.commandAllowed(s,false)||mode===0;
}
async function send(enable){
 if(busy||!core.commandAllowed(api.getState(),enable))return;
 if(enable&&!window.confirm(tr('confirm')))return;
 busy=true;requested=enable;render();
 try{await api.orderCommand(enable);requested=null;$('orderCommandResult').textContent=tr('confirmed');}
 catch(e){requested=null;$('orderCommandResult').textContent=e.message;}
 finally{busy=false;render();}
}
$('orderEnable').onclick=()=>send(true);$('orderDisable').onclick=()=>send(false);
$('orderSettings').onclick=()=>api.navigateOrder();
window.addEventListener('atlas:message',e=>{const d=e.detail,s=api.getState();if(d.sourceSysid!==s.sysid||d.sourceCompid!==s.compid)return;if(d.type==='named_float'&&d.name==='ORDER_PWM'&&Number.isFinite(d.value)){pwm={value:d.value,at:Date.now()};render();}if(d.type==='named_float'&&d.name==='ORDER_ON'&&(d.value===0||d.value===1)){sample={value:d.value,at:Date.now(),connectionId:s.connectionId};if(requested===(d.value===1)){$('orderCommandResult').textContent=tr('confirmed');requested=null;}render();}});
for(const event of ['atlas:state','atlas:language','atlas:parameters'])window.addEventListener(event,render);
const refresh=()=>{if(!document.hidden)render();};let timer=setInterval(refresh,250);window.addEventListener('pagehide',()=>{clearInterval(timer);timer=null;});window.addEventListener('pageshow',()=>{if(!timer)timer=setInterval(refresh,250);render();});render();
})();
