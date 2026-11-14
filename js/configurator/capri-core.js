/* O.R.D.E.R. configuration and telemetry validation. No aircraft outputs here. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasOrderCore=api;})(globalThis,()=>{
 'use strict';
 const COMMAND=31010,COOKIE=43605;
 const protocolName=lang=>({en:'O.R.D.E.R',ru:'П.Р.И.К.А.З',uk:'Н.А.К.А.З'}[lang]||'O.R.D.E.R');
 const specs=Object.freeze({ORDER_MODE:[0,2,true],RUD_LIMIT_DEG:[0,45,true],RUD_BRK_EN:[0,1,true],ORDER_RLL_LIM:[0,90,true],ORDER_PIT_MIN:[-45,0,false],ORDER_PIT_MAX:[0,45,false],ORDER_RC_CH:[0,16,true]});
 // One-click preset of the site: rudder +30 deg, base bank 15 deg, pitch -5..+5 deg, switched by a two-position channel 13 (ORDER_MODE=1).
 // Order matters: the limits and the channel first, ORDER_MODE last, so an interrupted write never leaves the protocol armed without its limits.
 const PRESET=Object.freeze([['RUD_LIMIT_DEG',30],['ORDER_RLL_LIM',15],['ORDER_PIT_MIN',-5],['ORDER_PIT_MAX',5],['ORDER_RC_CH',13],['ORDER_MODE',1]].map(Object.freeze));
 const SWITCH_ON_US=1750;
 function valid(name,value){const s=specs[name];return !!s&&Number.isFinite(value)&&value>=s[0]&&value<=s[1]&&(!s[2]||Number.isInteger(value));}
 function hasLimits(params){return (params.get('ORDER_RLL_LIM')?.value||0)>0||(params.get('RUD_LIMIT_DEG')?.value||0)>0||(params.get('ORDER_PIT_MIN')?.value||0)<0||(params.get('ORDER_PIT_MAX')?.value||0)>0;}
 function commandAllowed(state,enable,now=Date.now()){
  return typeof enable==='boolean'&&state.connected&&!state.demo&&state.sysid!==null&&state.params.get('ORDER_REV')?.value>=2&&
    now-state.lastHeartbeat>=0&&now-state.lastHeartbeat<4000&&!state.paramLoading&&state.params.has('ORDER_MODE')&&
    (!enable||hasLimits(state.params));
 }
 function observed(state,sample,now=Date.now()){
  if(!state.connected||state.demo||now-state.lastHeartbeat>=4000||!sample||sample.connectionId!==state.connectionId||now-sample.at>2500)return null;
  return sample.value===1?true:sample.value===0?false:null;
 }
 const value=(params,name)=>{const p=params.get(name);return p&&Number.isFinite(p.value)?p.value:null;};
 /** 'unsupported' (firmware without interface revision 2 or without one of the parameters) | 'active' (every value equals the preset) | 'partial'. */
 function presetStatus(params){
  if(!(value(params,'ORDER_REV')>=2)||PRESET.some(([name])=>!params.has(name)))return {state:'unsupported',changes:[]};
  const changes=PRESET.filter(([name,target])=>value(params,name)!==target).map(([name,target])=>({name,current:value(params,name),target}));
  return {state:changes.length?'partial':'active',changes};
 }
 /** The writes that bring the controller to the preset, in the safe order: {name: value}. */
 const presetUpdates=params=>Object.fromEntries(presetStatus(params).changes.map(({name,target})=>[name,target]));
 /** What the saved configuration does, from the live parameters, for the explanation shown to the user.
  *  mode 0 off, 1 switch on the channel, 2 always on (enabled by configuration). */
 function summary(params){
  const mode=value(params,'ORDER_MODE')??0,rudder=value(params,'RUD_LIMIT_DEG')??0,roll=value(params,'ORDER_RLL_LIM')??0,stock=value(params,'ROLL_LIMIT_DEG');
  const pitchMin=value(params,'ORDER_PIT_MIN')??0,pitchMax=value(params,'ORDER_PIT_MAX')??0;
  return {mode,channel:value(params,'ORDER_RC_CH')??0,rudder,roll,stock,pitchMin,pitchMax,brake:(value(params,'RUD_BRK_EN')??0)>0,
   // the bank the pilot can reach with stick plus rudder (the firmware also caps it at 85 deg and by the aerodynamic limit)
   bankTotal:roll>0||rudder>0?Math.min(85,(roll>0?roll:(stock??0))+rudder):null,limits:hasLimits(params),
   stallPrevention:value(params,'STALL_PREVENTION')};
 }
 return Object.freeze({COMMAND,COOKIE,SWITCH_ON_US,PRESET,protocolName,specs,valid,hasLimits,commandAllowed,observed,presetStatus,presetUpdates,summary});
});
