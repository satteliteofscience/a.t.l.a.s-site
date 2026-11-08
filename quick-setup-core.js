/* A.T.L.A.S. Quick Setup: pure validation and protocol classification. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.AtlasQuickSetupCore=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const THROTTLE_FUNCTIONS=Object.freeze([70,73,74]),DSHOT_TYPES=Object.freeze([4,5,6,7]),ONESHOT_TYPES=Object.freeze([1,2,3]),INTEGER_TYPES=Object.freeze([1,2,3,4,5,6]);
 const PARAM_RE=/^([A-Za-z][A-Za-z0-9_]{0,15})[\s,=]+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?)(?:[\s,;].*)?$/;
 function mapOf(value){if(value instanceof Map)return value;if(Array.isArray(value))return new Map(value);return new Map(Object.entries(value||{}));}
 function parseParamText(source,liveParams,metadata={}){
  const params=mapOf(liveParams),entries=new Map(),errors=[],warnings=[],duplicates=[];
  const lines=String(source||'').split(/\r?\n/);
  for(let index=0;index<lines.length;index++){
   const line=lines[index].trim();if(!line||line.startsWith('#')||line.startsWith('//'))continue;
   const match=line.match(PARAM_RE);if(!match){errors.push({line:index+1,reason:'format',text:line});continue;}
   const name=match[1],value=Number(match[2]);if(entries.has(name)){duplicates.push(name);continue;}
   if(!Number.isFinite(value)){errors.push({line:index+1,name,reason:'number'});continue;}
   const current=params.get(name);if(!current){errors.push({line:index+1,name,reason:'unknown'});continue;}
   const type=Number(current.type);
   if(![1,2,3,4,5,6,9,10].includes(type)){errors.push({line:index+1,name,reason:'type'});continue;}
   if(INTEGER_TYPES.includes(type)&&!Number.isInteger(value)){errors.push({line:index+1,name,reason:'integer'});continue;}
   if(type===7||type===8){errors.push({line:index+1,name,reason:'int64-unsupported'});continue;}
   const definition=metadata?.[name]||{};
   if(definition.ReadOnly===true||definition.readOnly===true){errors.push({line:index+1,name,reason:'readonly'});continue;}
   const range=definition.Range||definition.range;
   if(range){const low=Number(range.low),high=Number(range.high);if((Number.isFinite(low)&&value<low)||(Number.isFinite(high)&&value>high)){errors.push({line:index+1,name,reason:'range',low:Number.isFinite(low)?low:null,high:Number.isFinite(high)?high:null,value});continue;}}
   else warnings.push({name,reason:'range-not-in-local-metadata'});
   entries.set(name,value);
  }
  for(const name of duplicates)errors.push({name,reason:'duplicate'});
  const changes=[];
  for(const [name,value] of entries){const current=Number(params.get(name)?.value),tolerance=Math.max(1e-5,Math.abs(value)*2e-6);if(!Number.isFinite(current)||Math.abs(current-value)>tolerance)changes.push([name,value]);}
  return {entries,changes,errors,warnings,valid:entries.size>0&&errors.length===0};
 }
 function classifyEscProtocol(liveParams,board=''){
  const params=mapOf(liveParams),channels=[];
  for(let channel=1;channel<=16;channel++){const fn=Number(params.get('SERVO'+channel+'_FUNCTION')?.value);if(THROTTLE_FUNCTIONS.includes(fn))channels.push(channel);}
  if(!channels.length)return {kind:'no-throttle',channels:[],reason:'No SERVOx_FUNCTION 70/73/74 output was found.'};
  const maskParam=params.get('SERVO_BLH_MASK'),typeParam=params.get('SERVO_BLH_OTYPE');
  if(!maskParam||!typeParam)return {kind:'unknown',channels,reason:'SERVO_BLH_MASK or SERVO_BLH_OTYPE is not available in the parameter list.'};
  const canKeys=[...params.keys()].filter(name=>/^CAN_.*(?:DRIVER|PROTOCOL)$/.test(name));
  if(canKeys.some(name=>Number(params.get(name)?.value)>0))return {kind:'unknown',channels,reason:'CAN is configured; the physical ESC path cannot be inferred safely from this parameter subset.'};
  const rawMask=Number(maskParam.value),otype=Number(typeParam.value);if(!Number.isFinite(rawMask)||!Number.isInteger(rawMask)||!Number.isFinite(otype)||!Number.isInteger(otype))return {kind:'unknown',channels,reason:'ESC protocol mask/type values are invalid.'};const mask=rawMask>>>0,selected=channels.filter(channel=>(mask&(1<<(channel-1)))!==0);
  if(selected.length){
   if(DSHOT_TYPES.includes(otype)){
    if(selected.length!==channels.length)return {kind:'mixed',channels,dshotChannels:selected,reason:'Some throttle outputs are DShot and others are not.'};
    if(board==='cube-orange'&&selected.some(channel=>channel<=8))return {kind:'dshot-board-limit',channels,dshotChannels:selected,reason:'Cube Orange MAIN outputs 1–8 do not support DShot; verify the physical AUX output mapping.'};
    return {kind:'dshot',channels,dshotChannels:selected,otype,reason:'All detected throttle outputs are selected by SERVO_BLH_MASK with a DShot SERVO_BLH_OTYPE.'};
   }
   if(ONESHOT_TYPES.includes(otype))return {kind:'other-pulse',channels,selected,otype,reason:'OneShot / OneShot125 / brushed output is configured; do not assume the traditional PWM calibration procedure applies.'};
   return {kind:'unknown',channels,selected,otype,reason:'A non-default BLHeli output mask is set, but the output type is not recognized.'};
  }
  return {kind:'pwm',channels,otype,reason:'Throttle outputs are not selected by the BLHeli digital-output mask; current Plane parameters indicate normal PWM. Confirm wiring and ESC documentation.'};
 }
 function detectCompass(liveParams){
  const params=mapOf(liveParams),keys=['COMPASS_USE','COMPASS_USE2','COMPASS_USE3'],present=keys.filter(key=>params.has(key));
  if(!present.length)return {kind:'unknown',enabled:[],reason:'Compass enable parameters were not received.'};
  const enabled=present.filter(key=>Number(params.get(key)?.value)>0);
  return enabled.length?{kind:'enabled',enabled,reason:'At least one compass instance is enabled.'}:{kind:'disabled',enabled:[],reason:'All received compass instances are disabled.'};
 }
 function verifiedEvent(detail,kind){return !!detail&&detail.kind===kind&&detail.status==='done'&&detail.verified===true;}
 function canMarkManualComplete(confirmed,required){return confirmed===true&&required===true;}
 return Object.freeze({THROTTLE_FUNCTIONS,DSHOT_TYPES,INTEGER_TYPES,parseParamText,classifyEscProtocol,detectCompass,verifiedEvent,canMarkManualComplete});
});
