/* O.R.D.E.R. configuration and telemetry validation. No aircraft outputs here. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasOrderCore=api;})(globalThis,()=>{
 'use strict';
 const COMMAND=31010,COOKIE=43605;
 const specs=Object.freeze({ORDER_MODE:[0,2,true],RUD_LIMIT_DEG:[0,45,true],RUD_BRK_EN:[0,1,true],ORDER_RLL_LIM:[0,90,true],ORDER_PIT_MIN:[-45,0,false],ORDER_PIT_MAX:[0,45,false],ORDER_RC_CH:[0,16,true]});
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
 return Object.freeze({COMMAND,COOKIE,specs,valid,hasLimits,commandAllowed,observed});
});
