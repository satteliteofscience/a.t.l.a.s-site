/* AI-assisted. A.T.L.A.S. wind profile of the main screen: five NOAID_WIND presets (off, operator command only, learning, and the last two with the GPS wind carried over), their status and plan,
 * and the operator's wind command (MAV_CMD_EXTERNAL_WIND_ESTIMATE). No MAVLink and no aircraft outputs here: the card reads the parameters, AtlasCC does the verified writes and the command.
 * NOAID_WIND (firmware 3.0) is a bitmask: 1 = the operator enters the wind with a command, 2 = the wind is learned from the operator's position fixes,
 * 4 = the scale error of the airspeed sensor and the heading bias are learned with it (needs 2). Firmware 3.1 with the wind carry-over adds 8 = at the loss of GPS the wind that the filter
 * estimated with it is carried into the dead reckoning, 16 = it is taken even when it hardly differs (with 8 and learning); earlier firmware ignores these two bits.
 * Switching the learning off does not clear a wind that has already been learned: the command with speed 0 does (SITL, 24.11.2026).
 * Release 3.1 adds NOAID_SLEW (the gradual application of a fix) as the recommended companion of learning. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasWindProfile=api;})(globalThis,()=>{
 'use strict';
 const NAME='NOAID_WIND';
 const BIT=Object.freeze({command:1,learn:2,calibrate:4,carry:8,always:16});
 const VALUE_MAX=31;
 // the order of the buttons: off, then every preset without the carry-over next to its variant with it (two columns on the card)
 const PRESETS=Object.freeze([
  {id:'off',value:0},
  {id:'command',value:BIT.command},
  {id:'commandGps',value:BIT.command|BIT.carry},
  {id:'learn',value:BIT.command|BIT.learn|BIT.calibrate},
  {id:'learnGps',value:BIT.command|BIT.learn|BIT.calibrate|BIT.carry}
 ].map(Object.freeze));
 /** Read-only values shown next to the buttons. */
 const INFO=Object.freeze(['NOAID_WIND','NOAID_WAGE','NOAID_SLEW']);
 // NOAID_SLEW: the seconds over which an operator fix is applied in flight (0 = at once, the roll command of the navigation then jumps with the position). The card offers the recommended value
 // as a second whitelisted write next to NOAID_WIND; nothing else is writable here.
 const SLEW='NOAID_SLEW',SLEW_RECOMMENDED=20,SLEW_MAX=120;
 const valid=(name,value)=>typeof value==='number'&&Number.isInteger(value)&&((name===NAME&&value>=0&&value<=VALUE_MAX)||(name===SLEW&&value>=0&&value<=SLEW_MAX));
 const value=(params,name)=>{const p=params.get(name);return p&&Number.isFinite(p.value)?p.value:null;};
 const preset=id=>PRESETS.find(p=>p.id===id)||null;
 const supported=params=>params.has(NAME);
 /** 'unsupported' | 'active' | 'custom'; active = the id of the preset whose value is on the board. */
 function status(params){
  if(!supported(params))return {state:'unsupported',active:null,value:null};
  const v=value(params,NAME),p=PRESETS.find(x=>x.value===v);
  return {state:p?'active':'custom',active:p?p.id:null,value:v};
 }
 /** The ordered writes [[name,value]] that bring the board to the preset (empty when it is there already). */
 function plan(params,id){const p=preset(id);if(!p)throw Error('Unknown wind preset: '+id);return value(params,NAME)===p.value?[]:[[NAME,p.value]];}
 /** The five bits of a NOAID_WIND value (null when the value is unknown). */
 const bits=v=>Object.fromEntries(Object.entries(BIT).map(([k,b])=>[k,Number.isInteger(v)?!!(v&b):null]));
 /** True when writing the preset takes the learning away from a board that may hold a learned wind: the card then says that the wind stays in memory. */
 const keepsLearnedWind=(params,id)=>{const cur=value(params,NAME),p=preset(id);return !!p&&Number.isInteger(cur)&&(cur&BIT.learn)!==0&&(p.value&BIT.learn)===0;};
 /** What the card says about the gradual fix: 'unknown' (not read yet or the board has no NOAID_SLEW), 'recommend' (learning is on and a fix still moves the position at once), 'ok'. */
 function slewAdvice(params){const w=value(params,NAME),s=value(params,SLEW);if(w===null||s===null)return 'unknown';return (w&BIT.learn)!==0&&s===0?'recommend':'ok';}
 /** The one write that switches the gradual fix on: [[NOAID_SLEW,20]] while it is 0 (a value chosen by the owner is never overwritten), else nothing. */
 const slewPlan=params=>value(params,SLEW)===0?[[SLEW,SLEW_RECOMMENDED]]:[];
 // The operator wind command
 const COMMAND=43004,ACCURACY=1,MAX_SPEED=40;
 const num=x=>typeof x==='number'?x:(typeof x==='string'&&x.trim()!==''?Number(x.trim().replace(',','.')):NaN);
 /** The validated command: {command,speed,direction,params:[speed,accuracy,direction,0]}. Speed 0..40 m/s (0 = the wind is zero), direction = where the wind blows FROM, 0..360 deg. */
 function windCommand(speed,direction){
  const s=num(speed),d=num(direction===undefined||direction===null||direction===''?0:direction);
  if(!Number.isFinite(s)||!Number.isFinite(d)||s<0||s>MAX_SPEED||d<0||d>360)throw Error('Invalid wind: speed 0..40 m/s, direction 0..360 deg');
  return {command:COMMAND,speed:s,direction:s===0?0:d,params:[s,ACCURACY,s===0?0:d,0]};
 }
 /** The wind command is accepted only with the command bit of NOAID_WIND: 'ok' | 'bit0off' | 'unknown'. */
 function commandAdvice(params){const v=params?value(params,NAME):null;return v===null?'unknown':(v&BIT.command)?'ok':'bit0off';}
 /** COMMAND_ACK result (MAV_RESULT) as a name. */
 const RESULTS=Object.freeze(['accepted','temporarily_rejected','denied','unsupported','failed','in_progress','cancelled']);
 const resultName=code=>RESULTS[code]||'unknown';
 return Object.freeze({NAME,SLEW,SLEW_RECOMMENDED,SLEW_MAX,BIT,VALUE_MAX,PRESETS,INFO,COMMAND,ACCURACY,MAX_SPEED,valid,value,preset,supported,status,plan,bits,keepsLearnedWind,slewAdvice,slewPlan,windCommand,commandAdvice,resultName});
});
