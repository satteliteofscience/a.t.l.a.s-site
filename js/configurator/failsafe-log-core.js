/* Radio-failsafe and logging presets of the main screen: CIRCLE/LOG OFF, RTL/LOG ON and RTL/LOG OFF. No MAVLink and no aircraft outputs here.
 * The three parameter sets are the ones used with ArduPlane 4.6.3. On 4.7.3 the parameter FS_SHORT_TIMEOUT no longer exists (ArduPlane release notes 4.7:
 * "Short failsafe simplified by removing FS_SHORT_TIMEOUT"): the short failsafe now acts as soon as the receiver is judged lost, and that judgement is made
 * by the new RC_FS_TIMEOUT (1 s by default). The presets therefore do not write FS_SHORT_TIMEOUT and leave RC_FS_TIMEOUT as it is on the board. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasFailsafeLog=api;})(globalThis,()=>{
 'use strict';
 const freeze=p=>Object.freeze({...p,params:Object.freeze(p.params.map(Object.freeze))});
 const PRESETS=Object.freeze([
  {id:'circle-off',label:'CIRCLE/LOG OFF',params:[['ARSPD_USE',1],['FS_EKF_THRESH',0.8],['FS_GCS_ENABL',0],['FS_LONG_ACTN',2],['FS_LONG_TIMEOUT',240],['FS_SHORT_ACTN',0],['LOG_BACKEND_TYPE',0],['LOG_BITMASK',0]]},
  {id:'rtl-on',label:'RTL/LOG ON',params:[['FS_EKF_THRESH',0.8],['FS_GCS_ENABL',0],['FS_LONG_ACTN',1],['FS_LONG_TIMEOUT',0],['FS_SHORT_ACTN',0],['LOG_BACKEND_TYPE',1],['LOG_BITMASK',65535]]},
  {id:'rtl-off',label:'RTL/LOG OFF',params:[['FS_EKF_THRESH',0.8],['FS_GCS_ENABL',0],['FS_LONG_ACTN',1],['FS_LONG_TIMEOUT',0],['FS_SHORT_ACTN',0],['LOG_BACKEND_TYPE',0],['LOG_BITMASK',0]]}
 ].map(freeze));
 // [low, high, integer]: the only parameters these presets may write. FS_LONG_TIMEOUT may be 0 (no wait after the receiver is lost) although its documented range starts at 1.
 const specs=Object.freeze({
  ARSPD_USE:[0,1,true],FS_EKF_THRESH:[0.6,1,false],FS_GCS_ENABL:[0,3,true],FS_LONG_ACTN:[0,5,true],FS_LONG_TIMEOUT:[0,300,false],FS_SHORT_ACTN:[0,4,true],
  LOG_BACKEND_TYPE:[0,7,true],LOG_BITMASK:[0,2147483647,true]
 });
 const NAMES=Object.freeze(Object.keys(specs));
 /** Read-only values shown next to the buttons; RC_FS_TIMEOUT is the 4.7 replacement of FS_SHORT_TIMEOUT and is never written here. */
 const INFO=Object.freeze(['FS_SHORT_ACTN','FS_LONG_ACTN','FS_LONG_TIMEOUT','RC_FS_TIMEOUT','LOG_BACKEND_TYPE','LOG_BITMASK']);
 // The failsafe actions and timeouts first (the long timeout and the long action in the order that never pairs the new action with a worse wait), the log last.
 const ORDER=Object.freeze(['FS_GCS_ENABL','FS_EKF_THRESH','FS_SHORT_ACTN','ARSPD_USE','FS_LONG_ACTN','FS_LONG_TIMEOUT','LOG_BITMASK','LOG_BACKEND_TYPE']);
 const valid=(name,value)=>{const s=specs[name];return !!s&&typeof value==='number'&&Number.isFinite(value)&&value>=s[0]&&value<=s[1]&&(!s[2]||Number.isInteger(value));};
 const value=(params,name)=>{const p=params.get(name);return p&&Number.isFinite(p.value)?p.value:null;};
 const same=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<=1e-4*Math.max(1,Math.abs(b));
 const preset=id=>PRESETS.find(p=>p.id===id)||null;
 /** The board has the failsafe parameters this card edits. */
 const supported=params=>['FS_SHORT_ACTN','FS_LONG_ACTN','FS_LONG_TIMEOUT'].every(n=>params.has(n));
 /** Parameters of a preset that differ on the board: [{name, current, target}] (a parameter the board does not have is skipped). */
 const diff=(params,p)=>p.params.filter(([n])=>params.has(n)).map(([n,t])=>({name:n,current:value(params,n),target:t})).filter(x=>!same(x.current,x.target));
 /** 'unsupported' | 'active' | 'custom'; active = id of the preset whose values are all in place. */
 function status(params){
  if(!supported(params))return {state:'unsupported',active:null,diffs:{}};
  const diffs={};let active=null;
  for(const p of PRESETS){diffs[p.id]=diff(params,p);if(!active&&!diffs[p.id].length)active=p.id;}
  return {state:active?'active':'custom',active,diffs};
 }
 /** The ordered writes [[name, value], ...] that bring the board to the preset (only what differs). */
 function plan(params,id){
  const p=preset(id);if(!p)throw Error('Unknown preset: '+id);
  const changed=diff(params,p),target=new Map(changed.map(c=>[c.name,c.target]));
  const order=[...ORDER],timeout=changed.find(c=>c.name==='FS_LONG_TIMEOUT');
  // A longer wait goes in before the new long action; with a shorter wait the new action goes first. Never "glide at once" for a moment.
  if(timeout&&timeout.target>(timeout.current??0)){order.splice(order.indexOf('FS_LONG_ACTN'),2,'FS_LONG_TIMEOUT','FS_LONG_ACTN');}
  return order.filter(n=>target.has(n)).map(n=>[n,target.get(n)]);
 }
 /** LOG_BACKEND_TYPE is read at start-up: the controller must be rebooted for the log switch to take effect. */
 const rebootNeeded=updates=>updates.some(([n])=>n==='LOG_BACKEND_TYPE');
 return Object.freeze({PRESETS,NAMES,INFO,ORDER,specs,valid,value,preset,supported,diff,status,plan,rebootNeeded});
});
