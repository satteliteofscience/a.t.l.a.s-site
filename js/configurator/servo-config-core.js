/* Shared, testable servo draft validation and serialized PARAM_SET scheduling. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.AtlasServoCore=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const EDITABLE_FIELDS=Object.freeze(['FUNCTION','MIN','TRIM','MAX','REVERSED']);
  function validateDraft(channel,draft,params){
    if(!Number.isInteger(channel)||channel<1||channel>16)return {error:'channel'};
    if(!params||typeof params.get!=='function')return {error:'params'};
    const values={};
    for(const field of ['FUNCTION','MIN','TRIM','MAX']){
      const name=`SERVO${channel}_${field}`,parameter=params.get(name),raw=draft?.[field];
      if(!parameter){if(raw!==''&&raw!==null&&raw!==undefined)return {error:'missing',name};continue;}
      const input=String(raw??'').trim(),value=Number(input);
      const min=field==='FUNCTION'?0:800,max=field==='FUNCTION'?1000:2200;
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
  return Object.freeze({EDITABLE_FIELDS,LIVE_FIELDS,validateDraft,selectLiveChanges,createSerialQueue});
});
