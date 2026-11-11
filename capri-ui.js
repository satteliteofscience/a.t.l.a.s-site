/* C.A.P.R.I. monitor and explicit, acknowledged activation. */
(()=>{'use strict';
const api=window.AtlasCC,core=window.AtlasCapriCore;if(!api||!core)return;
const words={
 ru:{title:'Протокол C.A.P.R.I.',unknown:'Состояние не подтверждено',on:'АКТИВЕН',off:'ВЫКЛЮЧЕН',unsupported:'Нужна прошивка с CAPRI_MODE',rc:'Активация с RC',gcs:'Активация с конфигуратора',disabled:'Протокол отключён',enable:'Активировать',disable:'Выключить',settings:'Настройки C.A.P.R.I.',help:'Ограничения действуют только в ARMED FBWA. Нулевой предел отключает свою ветвь. Буст не запускается. Углы — текущая оценка AHRS, не заданные пределы.',confirm:'Активировать ограничения C.A.P.R.I. на контроллере?',requested:'Команда принята. Ожидается подтверждение состояния.',roll:'Крен AHRS',pitch:'Тангаж AHRS',range:'Диапазон активации',stale:'Нет свежей ориентации'},
 uk:{title:'Протокол C.A.P.R.I.',unknown:'Стан не підтверджено',on:'АКТИВНИЙ',off:'ВИМКНЕНО',unsupported:'Потрібна прошивка з CAPRI_MODE',rc:'Активація з RC',gcs:'Активація з конфігуратора',disabled:'Протокол вимкнено',enable:'Активувати',disable:'Вимкнути',settings:'Налаштування C.A.P.R.I.',help:'Обмеження діють лише в ARMED FBWA. Нульова межа вимикає свою гілку. Буст не запускається. Кути — поточна оцінка AHRS, а не задані межі.',confirm:'Активувати обмеження C.A.P.R.I. на контролері?',requested:'Команду прийнято. Очікується підтвердження стану.',roll:'Крен AHRS',pitch:'Тангаж AHRS',range:'Діапазон активації',stale:'Немає свіжої орієнтації'},
 en:{title:'C.A.P.R.I. protocol',unknown:'State not confirmed',on:'ACTIVE',off:'OFF',unsupported:'Firmware with CAPRI_MODE required',rc:'RC activation',gcs:'Configurator activation',disabled:'Protocol disabled',enable:'Activate',disable:'Deactivate',settings:'C.A.P.R.I. settings',help:'Limits apply only in ARMED FBWA. A zero boundary bypasses its branch. Does not start boost. Angles are the current AHRS estimate, not commanded limits.',confirm:'Activate C.A.P.R.I. limits on the controller?',requested:'Command accepted. Waiting for confirmed state.',roll:'AHRS roll',pitch:'AHRS pitch',range:'Activation range',stale:'No fresh attitude'}
};
const card=document.createElement('article');card.className='cc-card capri-card';card.id='capriPanel';
card.innerHTML='<div class="cc-card-title"><span>◈</span><strong id="capriTitle"></strong><small>FBWA</small></div><strong id="capriStatus" role="status" aria-live="polite"></strong><p id="capriSource"></p><div class="capri-angles"><div><small id="capriRollLabel"></small><b id="capriRoll">—</b></div><div><small id="capriPitchLabel"></small><b id="capriPitch">—</b></div></div><p id="capriRange"></p><div class="capri-actions"><button id="capriEnable" class="cc-button primary" type="button"></button><button id="capriDisable" class="cc-button ghost" type="button"></button><button id="capriSettings" class="cc-button ghost" type="button"></button></div><p id="capriHelp"></p><p id="capriCommandResult" role="status" aria-live="polite"></p>';
document.querySelector('.cc-dashboard-right')?.prepend(card);
Object.assign(words.ru,{waiting:'ВКЛЮЧЁН · ожидает ARMED FBWA и исправного RC',gcs:'Включён настройкой · RC активации не используется',range:'Тумблер',unsupported:'Нужна прошивка с CAPRI_REV=2',confirmed:'Настройка подтверждена контроллером.'});Object.assign(words.uk,{waiting:'УВІМКНЕНО · очікує ARMED FBWA та справного RC',gcs:'Увімкнено налаштуванням · RC активації не використовується',range:'Перемикач',unsupported:'Потрібна прошивка з CAPRI_REV=2',confirmed:'Налаштування підтверджено контролером.'});Object.assign(words.en,{waiting:'ENABLED · waiting for ARMED FBWA and valid RC',gcs:'Enabled by configuration · activation RC ignored',range:'Switch',unsupported:'Firmware with CAPRI_REV=2 required',confirmed:'Configuration confirmed by the controller.'});
const $=id=>document.getElementById(id);let sample=null,pwm=null,busy=false,lastConnection=null,requested=null;
function tr(key){return (words[window.AtlasLanguage?.()]||words.ru)[key];}
function render(){
 const s=api.getState(),now=Date.now();if(lastConnection!==s.connectionId){sample=null;pwm=null;requested=null;lastConnection=s.connectionId;$('capriCommandResult').textContent='';}
 const mode=s.params.get('CAPRI_MODE')?.value,active=core.observed(s,sample,now),revision=s.params.get('CAPRI_REV')?.value>=2;
 for(const [id,key]of Object.entries({capriTitle:'title',capriRollLabel:'roll',capriPitchLabel:'pitch',capriEnable:'enable',capriDisable:'disable',capriSettings:'settings',capriHelp:'help'}))$(id).textContent=tr(key);
 $('capriStatus').textContent=!revision?tr('unsupported'):mode===0?tr('off'):active===true?tr('on'):mode===2&&active===false?tr('waiting'):active===null?tr('unknown'):tr('off');
 card.dataset.active=active===null?'unknown':String(active);
 $('capriSource').textContent=mode===1?tr('rc'):mode===2?tr('gcs'):tr('disabled');
 const fresh=s.connected&&!s.demo&&now-s.lastHeartbeat<4000&&now-s.lastAttitude<2500;
 for(const axis of ['roll','pitch'])$('capri'+axis[0].toUpperCase()+axis.slice(1)).textContent=fresh&&Number.isFinite(s.telemetry[axis])?s.telemetry[axis].toFixed(1)+'°':'—';
 $('capriRange').textContent=mode===1?`${tr('range')}: RC${s.params.get('CAPRI_RC_CH')?.value??'—'} · ${pwm&&pwm.value>0&&now-pwm.at<2500?pwm.value.toFixed(0)+' µs':'—'} · HIGH ≥1750 ON / LOW OFF`:'';
 $('capriEnable').disabled=busy||!core.commandAllowed(s,true)||mode===2;
 $('capriDisable').disabled=busy||!core.commandAllowed(s,false)||mode===0;
}
async function send(enable){
 if(busy||!core.commandAllowed(api.getState(),enable))return;
 if(enable&&!window.confirm(tr('confirm')))return;
 busy=true;requested=enable;render();
 try{await api.capriCommand(enable);requested=null;$('capriCommandResult').textContent=tr('confirmed');}
 catch(e){requested=null;$('capriCommandResult').textContent=e.message;}
 finally{busy=false;render();}
}
$('capriEnable').onclick=()=>send(true);$('capriDisable').onclick=()=>send(false);
$('capriSettings').onclick=()=>api.navigateCapri();
window.addEventListener('atlas:message',e=>{const d=e.detail,s=api.getState();if(d.sourceSysid!==s.sysid||d.sourceCompid!==s.compid)return;if(d.type==='named_float'&&d.name==='CAPRI_PWM'&&Number.isFinite(d.value)){pwm={value:d.value,at:Date.now()};render();}if(d.type==='named_float'&&d.name==='CAPRI_ON'&&(d.value===0||d.value===1)){sample={value:d.value,at:Date.now(),connectionId:s.connectionId};if(requested===(d.value===1)){$('capriCommandResult').textContent=tr('confirmed');requested=null;}render();}});
for(const event of ['atlas:state','atlas:language','atlas:parameters'])window.addEventListener(event,render);
const refresh=()=>{if(!document.hidden)render();};let timer=setInterval(refresh,250);window.addEventListener('pagehide',()=>{clearInterval(timer);timer=null;});window.addEventListener('pageshow',()=>{if(!timer)timer=setInterval(refresh,250);render();});render();
})();
