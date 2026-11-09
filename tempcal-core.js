/* A.T.L.A.S. INS temperature calibration — parameter-only pure helpers.
 * No fake temperature or synthetic IMU calibration progress is generated here.
 */
(function(root,factory){
 'use strict';
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 if(root)root.AtlasTempCalCore=core;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const PREFIXES=Object.freeze(['INS_TCAL1_','INS_TCAL2_','INS_TCAL3_','INS4_TCAL_','INS5_TCAL_']);
 const MODES=Object.freeze({DISABLED:0,ENABLED:1,LEARNING:2});
 function paramsMap(params){
  if(params instanceof Map)return params;
  return new Map(Object.entries(params||{}));
 }
 function readSensors(raw){
  const params=paramsMap(raw);
  return PREFIXES.map((prefix,index)=>{
   const enable=params.get(prefix+'ENABLE');
   if(!enable||!Number.isFinite(Number(enable.value)))return null;
   const value=Number(enable.value);
   const min=params.get(prefix+'TMIN'),max=params.get(prefix+'TMAX');
   const coefficients=[];
   for(const sensor of ['ACC','GYR'])for(const order of [1,2,3])for(const axis of ['X','Y','Z']){
    const name=prefix+sensor+order+'_'+axis;
    if(params.has(name)&&Number.isFinite(Number(params.get(name).value)))coefficients.push(Object.freeze({name,value:Number(params.get(name).value),sensor,order,axis}));
   }
   const accelName='INS_ACC'+(index+1)+'_CALTEMP',gyroName='INS_GYR'+(index+1)+'_CALTEMP';
   const baseAccel=Number(params.get(accelName)?.value),baseGyro=Number(params.get(gyroName)?.value);
   const accelBase=params.has(accelName)&&Number.isFinite(baseAccel)&&baseAccel>-200?baseAccel:null;
   const gyroBase=params.has(gyroName)&&Number.isFinite(baseGyro)&&baseGyro>-200?baseGyro:null;
   const minValue=min&&Number.isFinite(Number(min.value))?Number(min.value):null;
   const maxValue=max&&Number.isFinite(Number(max.value))?Number(max.value):null;
   return Object.freeze({index:index+1,prefix,enableName:prefix+'ENABLE',mode:value,
    minName:prefix+'TMIN',maxName:prefix+'TMAX',
    min:minValue,max:maxValue,
    hasMin:!!min,hasMax:!!max,
    completeFields:!!min&&!!max,
    validMode:[0,1,2].includes(value),
    calibratedRange:minValue!==null&&maxValue!==null&&maxValue-minValue>=10,
    coefficients,coefficientCount:coefficients.length,
    baseline:Object.freeze({accelName,gyroName,accel:accelBase,gyro:gyroBase}),
    baselineReady:accelBase!==null&&gyroBase!==null});
  }).filter(Boolean);
 }
 function validateRange(min,max){
  if(typeof min!=='number'||typeof max!=='number'||!Number.isFinite(min)||!Number.isFinite(max))
   return {ok:false,reason:'not-numeric'};
  if(min < -70||max>80||min>=80||max < -70)return {ok:false,reason:'temperature-bounds'};
  if(max-min<10)return {ok:false,reason:'span-small'};
  return {ok:true,span:max-min,recommended:max-min>=25};
 }
 function snapshot(raw){
  return readSensors(raw).map(s=>Object.freeze({index:s.index,prefix:s.prefix,mode:s.mode,min:s.min,max:s.max,coefficientCount:s.coefficientCount,
   coefficients:s.coefficients.map(x=>[x.name,x.value]),baseline:s.baseline}));
 }
 function validMode(mode){return Number.isInteger(mode)&&mode>=0&&mode<=2;}
 return Object.freeze({PREFIXES,MODES,readSensors,snapshot,validateRange,validMode});
});
