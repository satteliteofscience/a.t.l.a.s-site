/* A.T.L.A.S. analog battery voltage calibration. Pure and unit-testable. */
(function(root,factory){
 const out=factory();
 if(typeof module==='object'&&module.exports)module.exports=out;
 if(root)root.AtlasBatteryCalCore=out;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const ANALOG_TYPES=Object.freeze([3,4,25]);
 function compute({monitorType,multiplier,reportedVolts,measuredVolts}){
  if(!ANALOG_TYPES.includes(Number(monitorType)))return {ok:false,reason:'analog-required'};
  for(const n of [multiplier,reportedVolts,measuredVolts]){
   if(typeof n!=='number'||!Number.isFinite(n))return {ok:false,reason:'invalid-number'};
  }
  if(multiplier<=0||multiplier>100||reportedVolts<2||reportedVolts>100||measuredVolts<2||measuredVolts>100)return {ok:false,reason:'out-of-range'};
  const ratio=measuredVolts/reportedVolts,updated=multiplier*ratio;
  if(ratio<0.8||ratio>1.2)return {ok:false,reason:'large-difference',ratio};
  if(updated<=0||updated>100||!Number.isFinite(updated))return {ok:false,reason:'invalid-multiplier'};
  return {ok:true,ratio,oldMultiplier:multiplier,newMultiplier:Number(updated.toFixed(6)),difference:measuredVolts-reportedVolts};
 }
 return Object.freeze({ANALOG_TYPES,compute});
});
