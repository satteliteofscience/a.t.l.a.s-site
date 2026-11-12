/* A.T.L.A.S. AHRS estimator indication.
 * Only an explicit FC AHRS activation STATUSTEXT confirms the runtime backend.
 * Parameters indicate requested configuration, not proof of the active estimator.
 */
(function(root,factory){
 'use strict';
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 if(root)root.AtlasAhrsFilterCore=core;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 function activeFromText(text){
  if(typeof text!=='string')return null;
  const match=/^AHRS:\s*(DCM|EKF2|EKF3|External)\s+active\b/i.exec(text.trim());
  if(!match)return null;
  return match[1].toUpperCase()==='EXTERNAL'?'EXTERNAL':match[1].toUpperCase();
 }
 function configured(params){
  const entries=params instanceof Map?params:new Map(Object.entries(params||{}));
  const get=name=>{const p=entries.get(name);return p===undefined?null:Number(typeof p==='object'&&p!==null?p.value:p);};
  const use=get('AHRS_EKF_USE'),type=get('AHRS_EKF_TYPE');
  if(use===0||type===0)return 'DCM';
  if(type===3)return 'EKF3';
  if(type===2)return 'EKF2';
  if(type===11)return 'EXTERNAL';
  return null;
 }
 function indication({connected=false,live=false,demo=false,announced=null,params=new Map(),language='ru'}={}){
  const lang=['ru','uk','en'].includes(language)?language:'ru';
  const t={
   ru:{unknown:'Не определён',waiting:'Ожидание AHRS',demo:'Демо',active:'Подтверждён сообщением AHRS полётника',selected:'Выбран в параметрах (CFG)',noData:'Нет свежей связи с контроллером',noParam:'Параметры AHRS ещё не получены'},
   uk:{unknown:'Невідомо',waiting:'Очікування AHRS',demo:'Демо',active:'Підтверджено повідомленням AHRS контролера',selected:'Обрано в параметрах (CFG)',noData:'Немає актуального з’єднання з контролером',noParam:'Параметри AHRS ще не отримано'},
   en:{unknown:'Unknown',waiting:'Waiting for AHRS',demo:'Demo',active:'Confirmed by autopilot AHRS status message',selected:'Selected in parameters (CFG)',noData:'No fresh flight controller connection',noParam:'AHRS parameters not yet available'}
  }[lang];
  if(demo)return {label:'SIM',detail:t.demo,verified:false};
  if(!connected||!live)return {label:'—',detail:t.noData,verified:false};
  if(['DCM','EKF2','EKF3','EXTERNAL'].includes(announced))return {label:announced,detail:t.active,verified:true};
  const chosen=configured(params);
  if(chosen)return {label:chosen+' · CFG',detail:t.selected,verified:false};
  return {label:t.unknown,detail:t.noParam,verified:false};
 }
 return Object.freeze({activeFromText,configured,indication});
});
