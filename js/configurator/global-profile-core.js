/* EKF3 G.L.O.B.A.L. activation profile: the validated parameter set, status and diff. No MAVLink and no aircraft outputs here.
 * The values are the EKF3 block of atlas.param shipped with the 2.0 firmware (flown in the one-hour SITL test, see sitl-demo-global.html). */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasGlobalCore=api;})(globalThis,()=>{
 'use strict';
 const OPTIONS=Object.freeze(['EK3_NOAID_POS','EK3_NOAID_GPS','EK3_NOAID_AUTO']);
 // Order matters: the source sets and AHRS first, the three options last, so an interrupted write never leaves NOAID_AUTO on without a GPS source set.
 const PROFILE=Object.freeze([
  ['EK3_SRC2_POSXY',3],['EK3_SRC2_POSZ',1],['EK3_SRC2_VELXY',3],['EK3_SRC2_VELZ',3],['EK3_SRC2_YAW',1],
  ['EK3_SRC1_POSXY',0],['EK3_SRC1_POSZ',1],['EK3_SRC1_VELXY',0],['EK3_SRC1_VELZ',0],['EK3_SRC1_YAW',1],
  ['AHRS_EKF_TYPE',3],['AHRS_GPS_USE',1],['EK3_NOAID_M_NSE',5],
  ['EK3_NOAID_POS',1],['EK3_NOAID_GPS',1],['EK3_NOAID_AUTO',1]
 ].map(Object.freeze));
 const specs=Object.freeze({
  EK3_NOAID_POS:[0,1],EK3_NOAID_GPS:[0,1],EK3_NOAID_AUTO:[0,1],EK3_NOAID_M_NSE:[0.5,50],AHRS_EKF_TYPE:[0,3],AHRS_GPS_USE:[0,1],
  EK3_SRC1_POSXY:[0,6],EK3_SRC1_POSZ:[0,3],EK3_SRC1_VELXY:[0,6],EK3_SRC1_VELZ:[0,6],EK3_SRC1_YAW:[0,8],
  EK3_SRC2_POSXY:[0,6],EK3_SRC2_POSZ:[0,3],EK3_SRC2_VELXY:[0,6],EK3_SRC2_VELZ:[0,6],EK3_SRC2_YAW:[0,8]
 });
 const valid=(name,value)=>{const s=specs[name];return !!s&&Number.isFinite(value)&&value>=s[0]&&value<=s[1]&&(name==='EK3_NOAID_M_NSE'||Number.isInteger(value));};
 const value=(params,name)=>{const p=params.get(name);return p&&Number.isFinite(p.value)?p.value:null;};
 /** Firmware 2.0 has the three new options; older firmware does not. */
 function supported(params){return OPTIONS.every(name=>params.has(name));}
 /** Parameters that differ from the profile: [{name, current, target}] (parameters missing on the board are skipped). */
 function diff(params,profile=PROFILE){return profile.filter(([name])=>params.has(name)).map(([name,target])=>({name,current:value(params,name),target})).filter(x=>x.current!==x.target);}
 /** 'unsupported' | 'active' | 'off' | 'partial'. 'active' = the whole profile is in place; 'off' = the three options are 0. */
 function status(params){
  if(!supported(params))return {state:'unsupported',changes:[]};
  const changes=diff(params);
  if(!changes.length)return {state:'active',changes};
  if(OPTIONS.every(name=>value(params,name)===0))return {state:'off',changes};
  return {state:'partial',changes};
 }
 /** The updates that switch the three options off (EK3_NOAID_AUTO first), nothing else is touched. */
 const disableUpdates=()=>Object.fromEntries(['EK3_NOAID_AUTO','EK3_NOAID_GPS','EK3_NOAID_POS'].map(name=>[name,0]));
 const applyUpdates=params=>Object.fromEntries(diff(params).map(({name,target})=>[name,target]));
 return Object.freeze({OPTIONS,PROFILE,specs,valid,supported,diff,status,disableUpdates,applyUpdates});
});
