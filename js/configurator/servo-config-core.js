/* Shared, testable servo draft validation and serialized PARAM_SET scheduling. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.AtlasServoCore=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const EDITABLE_FIELDS=Object.freeze(['FUNCTION','MIN','TRIM','MAX','REVERSED']);
  // SERVOn_FUNCTION values of ArduPlane 4.7.3 ("value:name", libraries/SRV_Channel/SRV_Channel.cpp, vehicle Plane).
  const FUNCTION_TABLE='-1:GPIO,0:Disabled,1:RCPassThru,2:Flap,3:FlapAuto,4:Aileron,6:Mount1Yaw,7:Mount1Pitch,8:Mount1Roll,9:Mount1Retract,10:CameraTrigger,12:Mount2Yaw,13:Mount2Pitch,14:Mount2Roll,15:Mount2Retract,16:DifferentialSpoilerLeft1,17:DifferentialSpoilerRight1,19:Elevator,21:Rudder,22:SprayerPump,23:SprayerSpinner,24:FlaperonLeft,25:FlaperonRight,26:GroundSteering,27:Parachute,28:Gripper,29:LandingGear,30:EngineRunEnable,33:Motor1,34:Motor2,35:Motor3,36:Motor4,37:Motor5,38:Motor6,39:Motor7/TailTiltServo,40:Motor8,41:TiltMotorsFront,45:TiltMotorsRear,46:TiltMotorRearLeft,47:TiltMotorRearRight,51:RCIN1,52:RCIN2,53:RCIN3,54:RCIN4,55:RCIN5,56:RCIN6,57:RCIN7,58:RCIN8,59:RCIN9,60:RCIN10,61:RCIN11,62:RCIN12,63:RCIN13,64:RCIN14,65:RCIN15,66:RCIN16,67:Ignition,69:Starter,70:Throttle,73:ThrottleLeft,74:ThrottleRight,75:TiltMotorFrontLeft,76:TiltMotorFrontRight,77:ElevonLeft,78:ElevonRight,79:VTailLeft,80:VTailRight,82:Motor9,83:Motor10,84:Motor11,85:Motor12,86:DifferentialSpoilerLeft2,87:DifferentialSpoilerRight2,90:CameraISO,91:CameraAperture,92:CameraFocus,93:CameraShutterSpeed,94:Script1,95:Script2,96:Script3,97:Script4,98:Script5,99:Script6,100:Script7,101:Script8,102:Script9,103:Script10,104:Script11,105:Script12,106:Script13,107:Script14,108:Script15,109:Script16,110:Airbrakes,120:NeoPixel1,121:NeoPixel2,122:NeoPixel3,123:NeoPixel4,124:RateRoll,125:RatePitch,126:RateThrust,127:RateYaw,129:ProfiLED1,130:ProfiLED2,131:ProfiLED3,132:ProfiLEDClock,134:SERVOn_MIN,135:SERVOn_TRIM,136:SERVOn_MAX,138:Alarm,139:Alarm Inverted,140:RCIN1Scaled,141:RCIN2Scaled,142:RCIN3Scaled,143:RCIN4Scaled,144:RCIN5Scaled,145:RCIN6Scaled,146:RCIN7Scaled,147:RCIN8Scaled,148:RCIN9Scaled,149:RCIN10Scaled,150:RCIN11Scaled,151:RCIN12Scaled,152:RCIN13Scaled,153:RCIN14Scaled,154:RCIN15Scaled,155:RCIN16Scaled,160:Motor13,161:Motor14,162:Motor15,163:Motor16,164:Motor17,165:Motor18,166:Motor19,167:Motor20,168:Motor21,169:Motor22,170:Motor23,171:Motor24,172:Motor25,173:Motor26,174:Motor27,175:Motor28,176:Motor29,177:Motor30,178:Motor31,179:Motor32';
  const FUNCTION_NAMES=new Map(FUNCTION_TABLE.split(',').map(item=>{const at=item.indexOf(':');return [Number(item.slice(0,at)),item.slice(at+1)];}));
  const span=(from,to)=>Array.from({length:to-from+1},(_,i)=>from+i);
  // Menu order: what a fixed-wing pilot reaches for first goes on top; every value of the table is in exactly one group.
  const FUNCTION_GROUPS=Object.freeze([
    {id:'main',values:Object.freeze([-1,0,1,4,19,21,70,2,3,24,25,77,78,79,80,73,74,26,16,17,86,87,110])},
    {id:'motors',values:Object.freeze([...span(33,40),...span(82,85),...span(160,179),41,45,46,47,75,76])},
    {id:'rc',values:Object.freeze([...span(51,66),...span(140,155)])},
    {id:'payload',values:Object.freeze([...span(6,10),...span(12,15),...span(90,93),22,23,27,28,29])},
    {id:'other',values:Object.freeze([30,67,69,...span(120,127),...span(129,132),134,135,136,138,139])},
    {id:'script',values:Object.freeze(span(94,109))}
  ]);
  function functionName(value){const name=FUNCTION_NAMES.get(Number(value));return name===undefined?null:name;}
  function functionLabel(value){const name=functionName(value);return name===null?String(value):name+' ('+value+')';}
  function functionGroups(){return FUNCTION_GROUPS.map(group=>({id:group.id,items:group.values.map(value=>({value,name:FUNCTION_NAMES.get(value),label:functionLabel(value)}))}));}
  function validateDraft(channel,draft,params){
    if(!Number.isInteger(channel)||channel<1||channel>16)return {error:'channel'};
    if(!params||typeof params.get!=='function')return {error:'params'};
    const values={};
    for(const field of ['FUNCTION','MIN','TRIM','MAX']){
      const name=`SERVO${channel}_${field}`,parameter=params.get(name),raw=draft?.[field];
      if(!parameter){if(raw!==''&&raw!==null&&raw!==undefined)return {error:'missing',name};continue;}
      const input=String(raw??'').trim(),value=Number(input);
      const min=field==='FUNCTION'?-1:800,max=field==='FUNCTION'?1000:2200;
      if(!input||!Number.isInteger(value)||value<min||value>max)return {error:'invalid',name};
      values[field]=value;
    }
    const reverseName=`SERVO${channel}_REVERSED`;
    if(params.has(reverseName))values.REVERSED=(draft?.REVERSED===true||Number(draft?.REVERSED)===1)?1:0;
    const min=values.MIN??params.get(`SERVO${channel}_MIN`)?.value;
    const trim=values.TRIM??params.get(`SERVO${channel}_TRIM`)?.value;
    const max=values.MAX??params.get(`SERVO${channel}_MAX`)?.value;
    if([min,trim,max].every(Number.isFinite)&&!(min<=trim&&trim<=max))return {error:'range'};
    const changes=Object.entries(values).filter(([field,value])=>params.get(`SERVO${channel}_${field}`)?.value!==value);
    return {values,changes};
  }
  const LIVE_FIELDS=Object.freeze(['MIN','TRIM','MAX','REVERSED']);
  function selectLiveChanges(validation,field='ALL'){
    if(!validation||validation.error||!Array.isArray(validation.changes))return [];
    return validation.changes.filter(([key])=>LIVE_FIELDS.includes(key)&&(field==='ALL'||key===field));
  }
  function createSerialQueue(){
    let tail=Promise.resolve(),pending=0;
    const enqueue=task=>{
      if(typeof task!=='function')return Promise.reject(new TypeError('Servo queue expects a function'));
      pending++;
      const current=tail.then(task,task);
      tail=current.catch(()=>{}).finally(()=>{pending--;});
      return current;
    };
    Object.defineProperty(enqueue,'pending',{get:()=>pending});
    return enqueue;
  }
  return Object.freeze({EDITABLE_FIELDS,LIVE_FIELDS,FUNCTION_NAMES,FUNCTION_GROUPS,functionName,functionLabel,functionGroups,validateDraft,selectLiveChanges,createSerialQueue});
});
