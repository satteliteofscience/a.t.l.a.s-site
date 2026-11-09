/* A.T.L.A.S. Quick Setup: pure validation and protocol classification. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.AtlasQuickSetupCore=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const THROTTLE_FUNCTIONS=Object.freeze([70,73,74]),DSHOT_TYPES=Object.freeze([4,5,6,7]),ONESHOT_TYPES=Object.freeze([1,2,3]),INTEGER_TYPES=Object.freeze([1,2,3,4,5,6]);
 const PROTECTED_NAMES=new Set(['FORMAT_VERSION','SYSID_SW_MREV']);
 const TYPE_RANGES=Object.freeze({1:[0,255],2:[-128,127],3:[0,65535],4:[-32768,32767],5:[0,4294967295],6:[-2147483648,2147483647]});
 const PARAM_RE=/^([A-Za-z][A-Za-z0-9_]{0,15})[\s,=]+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?)(?:\s*(?:#|\/\/|;).*)?$/;
 function mapOf(value){if(value instanceof Map)return value;if(Array.isArray(value))return new Map(value);return new Map(Object.entries(value||{}));}
 function parseParamText(source,liveParams,metadata={},context={}){
  const params=mapOf(liveParams),entries=new Map(),errors=[],warnings=[],skipped=[],seen=new Set();
  let metadataMissingCount=0;
  const lines=String(source||'').split(/\r?\n/);
  const boardComment=lines.find(line=>/^\s*#\s*Board\s*:/i.test(line));
  const claimedBoard=boardComment?.replace(/^\s*#\s*Board\s*:\s*/i,'').trim();
  if(claimedBoard&&context.boardLabel&&claimedBoard!==context.boardLabel)errors.push({reason:'board',sourceBoard:claimedBoard,selectedBoard:context.boardLabel});
  else if(!claimedBoard&&context.boardLabel)warnings.push({reason:'board-unverified'});
  const skip=(line,name,reason,value)=>{const item={line,name,reason};if(value!==undefined)item.value=value;skipped.push(item);};
  for(let index=0;index<lines.length;index++){
   const line=lines[index].trim();if(!line||line.startsWith('#')||line.startsWith('//'))continue;
   const match=line.match(PARAM_RE);
   if(!match){skip(index+1,null,'format');continue;}
   const name=match[1],value=Number(match[2]);
   if(seen.has(name)){skip(index+1,name,'duplicate');continue;}
   seen.add(name);
   // Only present, writable, well-typed parameters are eligible for PARAM_SET.
   if(PROTECTED_NAMES.has(name)||name.startsWith('STAT_')){skip(index+1,name,'protected-skipped');continue;}
   if(!Number.isFinite(value)){skip(index+1,name,'number');continue;}
   const current=params.get(name);
   if(!current){skip(index+1,name,'unknown');continue;}
   const type=Number(current.type);
   if(![1,2,3,4,5,6,9].includes(type)){skip(index+1,name,'type');continue;}
   if(INTEGER_TYPES.includes(type)&&!Number.isSafeInteger(value)){skip(index+1,name,'integer');continue;}
   if(TYPE_RANGES[type]&&(value<TYPE_RANGES[type][0]||value>TYPE_RANGES[type][1])){skip(index+1,name,'type-range',value);continue;}
   const definition=metadata?.[name]||{};
   if(definition.ReadOnly===true||definition.readOnly===true){skip(index+1,name,'readonly');continue;}
   const range=definition.Range||definition.range;
   if(range){
    const low=Number(range.low),high=Number(range.high);
    if((Number.isFinite(low)&&value<low)||(Number.isFinite(high)&&value>high)){skip(index+1,name,'range',value);continue;}
   }else metadataMissingCount++;
   entries.set(name,value);
  }
  const changes=[];
  for(const [name,value] of entries){
   const current=Number(params.get(name)?.value),tolerance=Math.max(1e-5,Math.abs(value)*2e-6);
   if(!Number.isFinite(current)||Math.abs(current-value)>tolerance)changes.push([name,value]);
  }
  return {entries,changes,errors,warnings,skipped,metadataMissingCount,valid:entries.size>0&&errors.length===0};
 }
 // Return explicit reasons for a disabled write button. Backup is created on the write click,
 // not a hidden prerequisite. The hardware writer remains the final safety gate.
 function writeBlockers(s,qs={},canWrite=false,now=Date.now()){
  const out=[];
  if(!s?.connected||s.demo)out.push('usb');
  else{
   if(s.armed!==false)out.push('disarmed');
   if(!Number.isFinite(s.lastHeartbeat)||Math.abs(now-s.lastHeartbeat)>4000)out.push('heartbeat');
  }
  if(s?.paramLoading)out.push('loading');
  if(!(s?.params instanceof Map)||s.params.size===0)out.push('empty');
  if(!qs.preview)out.push('file');
  else{
   if(!qs.preview.valid)out.push('invalid');
   if(qs.previewBoard!==s?.selectedBoard)out.push('board');
   if(!Array.isArray(qs.preview.changes)||qs.preview.changes.length===0)out.push('unchanged');
  }
  if(!qs.compatConfirmed)out.push('compat');
  if(qs.applyBusy||qs.readBusy)out.push('busy');
  if(!out.length&&!canWrite)out.push('writer');
  return out;
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
    if(board==='cube-orange'&&selected.some(channel=>channel<=8))return {kind:'dshot-board-limit',channels,dshotChannels:selected,reason:'Cube Orange MAIN DShot support depends on firmware and IOMCU configuration. On modern ArduPlane versions MAIN outputs may support DShot; verify BRD_IO_DSHOT (where present), wiring and the boot RCOut protocol report.'};
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
 return Object.freeze({THROTTLE_FUNCTIONS,DSHOT_TYPES,INTEGER_TYPES,parseParamText,writeBlockers,classifyEscProtocol,detectCompass,verifiedEvent,canMarkManualComplete});
});
