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
   if(definition.ReadOnly===true||definition.readOnly===true||String(definition.ReadOnly).toLowerCase()==='true'||String(definition.readOnly).toLowerCase()==='true'){skip(index+1,name,'readonly');continue;}
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
  else if(s?.connected&&s.paramComplete!==true)out.push('incomplete');
  if(!(s?.params instanceof Map)||s.params.size===0)out.push('empty');
  if(!qs.preview)out.push('file');
  else{
   if(!qs.preview.valid)out.push('invalid');
   if(qs.previewBoard!==s?.selectedBoard)out.push('board');
   if(qs.previewConnection!==s?.connectionId)out.push('stalePreview');
   if(!Array.isArray(qs.preview.changes)||qs.preview.changes.length===0)out.push('unchanged');
  }
  if(!qs.compatConfirmed)out.push('compat');
  if(qs.applyBusy||qs.readBusy)out.push('busy');
  if(!out.length&&!canWrite)out.push('writer');
  return out;
 }
 // A verified .param profile describes the intended output protocol, not the ESC firmware brand.
 function readEscProfile(source){
  const result=new Map();
  const keys=/^(?:SERVO(?:[1-9]|1[0-6])_FUNCTION|SERVO_BLH_MASK|SERVO_BLH_OTYPE)$/;
  for(const raw of String(source||'').split(/\r?\n/)){
   const match=raw.trim().match(/^([A-Z][A-Z0-9_]{0,15})[\s,=]+([+-]?\d+)(?=\s|$|[,;])/);
   if(!match||!keys.test(match[1]))continue;
   const n=Number(match[2]);if(Number.isSafeInteger(n)&&n>=0&&n<=4294967295)result.set(match[1],{value:n,type:6});
  }
  return result;
 }
 function classifyEscFromProfile(liveParams,source,board=''){
  const merged=new Map(mapOf(liveParams)),overrides=readEscProfile(source);
  for(const [name,value] of overrides)merged.set(name,value);
  return {...classifyEscProtocol(merged,board),source:overrides.size?'profile+controller':'controller',overrides:overrides.size};
 }
 function classifyEscProtocol(liveParams,board=''){
  const params=mapOf(liveParams),channels=[];
  for(let channel=1;channel<=16;channel++){const fn=Number(params.get('SERVO'+channel+'_FUNCTION')?.value);if(THROTTLE_FUNCTIONS.includes(fn))channels.push(channel);}
  if(!channels.length)return {kind:'no-throttle',channels:[],reason:'No SERVOx_FUNCTION 70/73/74 output was found.'};
  const maskParam=params.get('SERVO_BLH_MASK'),typeParam=params.get('SERVO_BLH_OTYPE');
  if(!maskParam||!typeParam)return {kind:'unknown',channels,reason:'SERVO_BLH_MASK or SERVO_BLH_OTYPE is not available in the parameter list.'};
  // CAN bus settings do not by themselves imply that the throttle ESC is on CAN.
  // A motor output selected for DShot stays DShot even when CAN is configured for GPS, peripherals or telemetry.
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
 function detectCompass(liveParams,sensorStatus,now=Date.now()){
  const params=mapOf(liveParams),keys=['COMPASS_USE','COMPASS_USE2','COMPASS_USE3'],present=keys.filter(key=>params.has(key));
  const enabled=present.filter(key=>Number(params.get(key)?.value)>0);
  if(present.length&&!enabled.length)return {kind:'disabled',enabled:[],reason:'All received compass instances are disabled.'};
  // MAVLink SYS_STATUS present flag is derived from AP::compass().available(), not configuration.
  const fresh=sensorStatus&&Number.isFinite(sensorStatus.lastSeen)&&now-sensorStatus.lastSeen>=0&&now-sensorStatus.lastSeen<5500;
  if(!fresh)return {kind:'unknown',enabled,reason:'No fresh SYS_STATUS magnetometer presence information.'};
  if(sensorStatus.present!==true)return {kind:'absent',enabled,reason:'Autopilot SYS_STATUS reports no magnetometer physically available.'};
  if(!present.length)return {kind:'unknown',enabled,reason:'Magnetometer present but enable parameters have not been read.'};
  if(sensorStatus.healthy!==true)return {kind:'unhealthy',enabled,healthy:false,reason:'SYS_STATUS reports the magnetometer present but not healthy; physical connection and sensor data must still be checked.'};
  return {kind:'enabled',enabled,healthy:true,reason:'Magnetometer presence and health confirmed by fresh SYS_STATUS.'};
 }
 // A pre/post reboot offset comparison is useful evidence, but it is NOT a MAG_CAL_REPORT.
 // Do not claim digital calibration success from parameters alone.
 function snapshotCompassOffsets(liveParams){
  const params=mapOf(liveParams),out={};
  // ArduPilot may store a CAN/external compass as instance 2 or 3.
  for(const prefix of ['COMPASS_OFS_','COMPASS_OFS2_','COMPASS_OFS3_']){
   for(const axis of ['X','Y','Z']){
    const name=prefix+axis,value=Number(params.get(name)?.value);
    if(params.has(name)&&Number.isFinite(value))out[name]=value;
   }
  }
  return out;
 }
 function assessPostCompassCalibration(before,after,sensorStatus,now=Date.now()){
  const old=before||{},newValues=snapshotCompassOffsets(after);
  const sets=['COMPASS_OFS_','COMPASS_OFS2_','COMPASS_OFS3_'].map(prefix=>['X','Y','Z'].map(axis=>prefix+axis));
  const valid=sets.filter(keys=>keys.every(k=>Number.isFinite(old[k])&&Number.isFinite(newValues[k])));
  if(!valid.length)return {kind:'unverified',reason:'missing-offsets',changed:[]};
  const changed=valid.flatMap(keys=>keys.filter(k=>Math.abs(newValues[k]-old[k])>0.1));
  const fresh=sensorStatus&&sensorStatus.present===true&&sensorStatus.healthy===true&&Number.isFinite(sensorStatus.lastSeen)&&now-sensorStatus.lastSeen>=0&&now-sensorStatus.lastSeen<5500;
  if(!fresh)return {kind:'unverified',reason:'magnetometer-not-healthy',changed};
  if(!changed.length)return {kind:'unverified',reason:'offsets-unchanged',changed};
  return {kind:'evidence',reason:'offsets-changed-and-healthy',changed};
 }
 function verifiedEvent(detail,kind){return !!detail&&detail.kind===kind&&detail.status==='done'&&detail.verified===true;}
 function canMarkManualComplete(confirmed,required){return confirmed===true&&required===true;}
 return Object.freeze({THROTTLE_FUNCTIONS,DSHOT_TYPES,INTEGER_TYPES,parseParamText,writeBlockers,readEscProfile,classifyEscFromProfile,classifyEscProtocol,detectCompass,snapshotCompassOffsets,assessPostCompassCalibration,verifiedEvent,canMarkManualComplete});
});
