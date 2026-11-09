/* A.T.L.A.S. INS temperature calibration — shared Quick Setup / full configurator UI.
 * Only the FC owns the calibration. The site writes/reads genuine INS_TCAL parameters.
 */
(()=>{
'use strict';
const api=window.AtlasCC,core=window.AtlasTempCalCore;
if(!api||!core)throw Error('A.T.L.A.S. INS temp calibration dependencies are unavailable');
const language=()=>window.AtlasLanguage?.()||'ru';
const translations={
 ru:{
  title:'Температурная калибровка INS',body:'Настраивай каждый IMU отдельно. Это температурная компенсация гироскопа и акселерометра, не обычная шестипозиционная калибровка.',
  modes:['0 · Выключено','1 · Включено (сохранённая калибровка)','2 · Самообучение после перезапуска'],
  disabled:'Температурная компенсация отключена, обычные калибровки IMU остаются действующими.',
  enabled:'Используются сохранённые коэффициенты, если они уже есть. Этот режим не запускает обучение.',
  learning:'Обучение запланировано. Оно начнётся после полного перезапуска контроллера с холодными IMU.',
  noSensors:'На этом контроллере нет доступных INS_TCALn_ENABLE. Проверь прошивку, поддержку IMU и полный список параметров. Ничего не записывается.',
  noLink:'Подключи полётник, дождись полного списка параметров и подтверждённого DISARMED.',
  imu:'Датчик IMU',current:'Режим контроллера',mode:'Температурная компенсация',min:'Минимальная температура · °C',max:'Целевая максимальная температура · °C',
  missing:'TMIN/TMAX сейчас отсутствуют в списке контроллера. После выбора 2 мастер автоматически повторно считывает все параметры. Если поля не появились, перезапитай полётник и подключись снова.',
  available:'Диапазон параметров считан. Введи минимальную и целевую максимальную температуру.',
  record:'Записать TMIN и TMAX',read:'Перечитать все параметры',busy:'Запись/чтение параметров…',written:'Изменения подтверждены PARAM_VALUE.',reload:'Режим записан. Автоматически перечитываю параметры контроллера…',
  reloaded:'Список параметров обновлён. Теперь можно установить TMIN и TMAX.',partial:'Чтение неполное или прервано. Проверь USB/MAVLink и повтори; доступные параметры показаны отдельно.',
  range:'TMAX должен быть как минимум на 10 °C выше TMIN, оба значения в пределах −70…80 °C.',
  recommended:'Желательный перепад — не меньше 25 °C. Третьему IMU Cube Orange иногда нужна меньшая целевая температура.',
  reboot:'После установки ENABLE=2 и температурных границ полностью перепитай холодный контроллер в тёплом помещении. Не двигай его до окончания обучения. Отсоединение USB в браузере не выключает питание 5 В по кабелю.',
  finish:'Сам ArduPilot завершает обучение при достижении TMAX либо если температура выросла менее чем на 0,5 °C за 10 минут. После успеха ENABLE обычно переключается на 1. Никакого таймера завершения со стороны сайта нет.',
  data:'Минимальные 10 °C перепада обязательны для калибровки. Желательны 25 °C. При преждевременном выключении после накопления данных режим 2 может остаться активным: переключение на 1 использует сохранённые данные, но не подтверждает их качество.',
  prep:'До запуска нужна выполненная калибровка акселерометра и гироскопа (INS_ACCn_CALTEMP / INS_GYRn_CALTEMP должны быть валидными). Для журнала полезен LOG_DISARMED=1, при наличии карты памяти.',
  caltemp:'Температуры базовой калибровки INS_ACC/GYR_CALTEMP не определены. Выполни 6-позиционную и калибровку гироскопов перед обучением.',
  disconnect:'Нет свежей связи; изменение параметров недоступно.',
  startHint:'Выбор режима 2 сразу записывает INS_TCALn_ENABLE=2 с подтверждением и автоматически перечитывает полный список. Других подтверждений на этом шаге не требуется.',
  noFields:'Диапазон будет доступен после обновления параметров, иногда только после перезагрузки.',
  imuReady:'IMU с температурной компенсацией: ',idle:'Ожидается команда.',reloadButton:'Обновить после перепитания',
  invalidValue:'Некорректное значение температуры.',noHardware:'Фактическое завершение обучения проверяется после нового полного чтения INS_TCAL. Режим 1 сам по себе не гарантирует точности.',base:'Температура базовой калибровки',accel:'Акселерометр',gyro:'Гироскоп',coefficients:'Коэффициенты температурных смещений',coeffCount:'Коэффициентов прочитано',coefInfo:'ACC/GYR — полиномы 1–3 порядка по X, Y и Z; показаны только реальные значения INS_TCAL из контроллера.',noneCoefficients:'Коэффициенты ещё не переданы контроллером.',recorded:'Записанный диапазон',pendingTraining:'Предыдущее самообучение было запущено в этой сессии. После переподключения контроллер вернул ENABLE=1; это признак завершения по ArduPilot, проверь диапазон и коэффициенты.',pendingUnfinished:'Повторное считывание показало ENABLE=2. Обучение ещё включено либо было прервано.',baselineMissing:'Отсутствует действительная температура базовой калибровки INS_ACC/GYR_CALTEMP. Проверь калибровку IMU.',cached:'Значения считываются с контроллера автоматически при MAVLink-подключении; если список неполный, используй повторное чтение.'
 },
 uk:{
  title:'Температурне калібрування INS',body:'Налаштовуй кожен IMU окремо. Це температурна компенсація гіроскопа та акселерометра, не звичайне шестипозиційне калібрування.',
  modes:['0 · Вимкнено','1 · Увімкнено (збережене калібрування)','2 · Самонавчання після перезапуску'],
  disabled:'Температурну компенсацію вимкнено, звичайні калібрування IMU діють.',
  enabled:'Використовуються збережені коефіцієнти, якщо вони існують. Навчання не починається.',
  learning:'Навчання заплановано. Почнеться після повного перезапуску холодного контролера.',
  noSensors:'На цьому контролері немає параметрів INS_TCALn_ENABLE. Перевір прошивку й повний список.',
  noLink:'Під’єднай контролер, дочекайся повного списку параметрів та DISARMED.',
  imu:'Датчик IMU',current:'Режим контролера',mode:'Температурна компенсація',min:'Мінімальна температура · °C',max:'Цільова максимальна температура · °C',
  missing:'TMIN/TMAX відсутні. Після вибору 2 параметри зчитуються автоматично. Якщо поля не з’явилися, перезапусти контролер і під’єднайся знову.',
  available:'Діапазон зчитано. Введи мінімальну та цільову максимальну температуру.',
  record:'Записати TMIN і TMAX',read:'Перечитати всі параметри',busy:'Запис/читання параметрів…',written:'Зміни підтверджено PARAM_VALUE.',reload:'Режим записано. Автоматично перечитую параметри…',
  reloaded:'Список оновлено. Можна встановити TMIN і TMAX.',partial:'Читання неповне або перерване. Перевір USB/MAVLink.',
  range:'TMAX має бути хоча б на 10 °C вище TMIN. Межі −70…80 °C.',recommended:'Рекомендований перепад не менше 25 °C. Третьому IMU Cube Orange іноді потрібна нижча цільова температура.',
  reboot:'Після ENABLE=2 і встановлення меж переподай живлення холодного контролера в теплому приміщенні. Не рухай його. Програмне від’єднання USB не вимикає 5 В кабелю.',
  finish:'ArduPilot завершує навчання після TMAX або якщо температура виросла менш ніж на 0,5 °C за 10 хвилин. Після успіху ENABLE зазвичай стає 1.',
  data:'Мінімальний перепад — 10 °C, рекомендований 25 °C. Перерване навчання може залишити режим 2; перехід на 1 не підтверджує якість калібрування.',
  prep:'До запуску потрібні чинні INS_ACCn_CALTEMP та INS_GYRn_CALTEMP. Для журналу корисний LOG_DISARMED=1 із картою пам’яті.',
  caltemp:'Не знайдено чинні температури початкового калібрування. Виконай калібрування акселерометра й гіроскопа.',
  disconnect:'Немає актуального з’єднання.',startHint:'Вибір 2 одразу записує ENABLE=2 і зчитує параметри без додаткових підтверджень.',noFields:'Діапазон може з’явитися після перезапуску.',imuReady:'IMU з компенсацією: ',idle:'Очікування.',reloadButton:'Оновити після перезапуску',
  invalidValue:'Неправильна температура.',noHardware:'Завершення навчання перевіряється після нового зчитування INS_TCAL. Режим 1 не гарантує точності.',base:'Температура базового калібрування',accel:'Акселерометр',gyro:'Гіроскоп',coefficients:'Коефіцієнти температурних зміщень',coeffCount:'Зчитано коефіцієнтів',coefInfo:'ACC/GYR — поліноми 1–3 порядку для X, Y та Z; показано тільки отримані INS_TCAL.',noneCoefficients:'Коефіцієнти ще не надійшли від контролера.',recorded:'Збережений діапазон',pendingTraining:'Навчання було запущене в цій сесії. Після повторного зчитування ENABLE=1 — ознака завершення; перевір діапазон і коефіцієнти.',pendingUnfinished:'Після зчитування ENABLE=2. Навчання ще активне або було перерване.',baselineMissing:'Не знайдено дійсної температури INS_ACC/GYR_CALTEMP. Перевір калібрування IMU.',cached:'Параметри зчитуються автоматично після MAVLink-підключення. Якщо список неповний, перечитай його.'
 },
 en:{
  title:'INS temperature calibration',body:'Configure each IMU separately. This is gyro/accelerometer temperature compensation, not a six-position calibration.',
  modes:['0 · Off','1 · Enabled (saved coefficients)','2 · Auto-learning on next boot'],
  disabled:'Temperature compensation is disabled. Ordinary IMU calibrations remain effective.',
  enabled:'Use previously saved calibration coefficients if available. No learning is started.',
  learning:'Learning is configured and will begin after a full power cycle from a cool IMU.',
  noSensors:'No INS_TCALn_ENABLE parameters are available. Check firmware support and reread the full parameter list.',
  noLink:'Connect the controller, read its parameters and confirm DISARMED.',
  imu:'IMU sensor',current:'Controller mode',mode:'Temperature compensation',min:'Minimum temperature · °C',max:'Target maximum temperature · °C',
  missing:'TMIN/TMAX are missing. Choosing 2 automatically rereads all parameters. If the fields remain absent, reboot the FC and reconnect.',
  available:'Temperature range loaded. Enter minimum and target maximum temperatures.',
  record:'Write TMIN and TMAX',read:'Reread all parameters',busy:'Reading/writing parameters…',written:'Controller confirmed changes via PARAM_VALUE.',reload:'Mode saved. Automatically rereading all controller parameters…',
  reloaded:'Parameter list updated. TMIN/TMAX can now be configured.',partial:'Read incomplete or interrupted; check USB/MAVLink and retry.',
  range:'TMAX must be at least 10 °C above TMIN; both within −70…80 °C.',recommended:'A 25 °C or larger span is recommended. Cube Orange IMU3 may require a lower target.',
  reboot:'After ENABLE=2 and range setup, completely power-cycle the cold FC in a warm room and keep it motionless. Browser USB disconnect does not remove 5 V cable power.',
  finish:'ArduPilot finishes at TMAX or when temperature rises by less than 0.5 °C over 10 minutes. Successful completion normally changes ENABLE back to 1.',
  data:'At least 10 °C span is required, 25 °C recommended. Interrupting calibration may leave 2 active; switching to 1 uses saved coefficients but does not prove their quality.',
  prep:'Before learning, gyro/accel calibration temperatures (INS_ACCn_CALTEMP / INS_GYRn_CALTEMP) should be valid. LOG_DISARMED=1 with SD is useful for review.',
  caltemp:'Baseline INS_ACC/GYR_CALTEMP missing or invalid. Calibrate gyro and accelerometer first.',
  disconnect:'No fresh MAVLink link.',startHint:'Selecting 2 writes ENABLE=2 with readback, then automatically rereads all parameters without extra confirmation.',
  noFields:'Temperature fields may become available after a reboot.',imuReady:'IMUs with compensation: ',idle:'Waiting.',reloadButton:'Refresh after reboot',
  invalidValue:'Invalid temperature range.',noHardware:'After reconnect, inspect genuine INS_TCAL values. Mode 1 alone does not prove calibration accuracy.',base:'Baseline calibration temperature',accel:'Accelerometer',gyro:'Gyroscope',coefficients:'Temperature offset coefficients',coeffCount:'Coefficients received',coefInfo:'ACC/GYR are first- to third-order X/Y/Z polynomials; only values actually reported by the FC are displayed.',noneCoefficients:'No coefficients received yet.',recorded:'Stored temperature interval',pendingTraining:'Learning was started in this session. After reconnect ENABLE=1, which normally indicates completion; inspect the coefficients and range.',pendingUnfinished:'After reread ENABLE is still 2; learning is active or was interrupted.',baselineMissing:'Valid INS_ACC/GYR_CALTEMP was not received. Check basic IMU calibration.',cached:'INS temperature parameters are read automatically on MAVLink connect. Retry if the full list is incomplete.'
 }
};
const roots=new Set(),drafts=new Map(),messages=new Map();
let busy=false,reading=false,readToken=0,lastEvent='',lastSensors='',lastConnected=false;
const startedLearning=new Map();const completedLearning=new Map();
const t=k=>(translations[language()]||translations.ru)[k]??translations.ru[k]??k;
const e=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const getState=()=>api.getState();
const safe=(s=getState())=>s.connected&&!s.demo&&s.armed===false&&Date.now()-s.lastHeartbeat<4000&&!s.paramLoading&&api.canWrite();
function report(){
 const s=getState(),list=core.readSensors(s.params);
 return {sensors:list,connected:s.connected,complete:s.paramComplete===true,busy:busy||reading,learning:list.some(i=>i.mode===2),
  configured:list.length>0&&list.every(i=>i.mode!==2),supported:list.length>0};
}
function rememberLearning(sensor){startedLearning.set(sensor.prefix,{start:core.snapshot(getState().params).find(x=>x.prefix===sensor.prefix)||null,time:Date.now(),sawDisconnect:false});completedLearning.delete(sensor.prefix);}
function watchLearning(sensors,fullyRead){
 if(!fullyRead)return;
 for(const sensor of sensors){
  if(!startedLearning.has(sensor.prefix))continue;
  const record=startedLearning.get(sensor.prefix);
  if(sensor.mode===1&&record.sawDisconnect){completedLearning.set(sensor.prefix,{previous:record,current:sensor});startedLearning.delete(sensor.prefix);}
 }
}
function announce(detail={}){
 const snapshot=report();
 window.dispatchEvent(new CustomEvent('atlas:tempcal',{detail:{...snapshot,...detail}}));
}
function updateAll(){
 for(const root of [...roots]){
  if(!root.isConnected){roots.delete(root);continue;}
  if(root.contains(document.activeElement)&&document.activeElement?.matches('input[type="number"]'))continue;
  draw(root);
 }
}
function setMessage(prefix,text){messages.set(prefix,text);updateAll();}
function getDraft(sensor){
 if(!drafts.has(sensor.prefix))drafts.set(sensor.prefix,{min:sensor.min===null?'':String(sensor.min),max:sensor.max===null?'':String(sensor.max)});
 return drafts.get(sensor.prefix);
}
async function waitForParameters(timeout=65000){
 const started=Date.now();
 while(Date.now()-started<timeout){
  const s=getState();
  if(!s.connected||s.demo)return {ok:false,reason:'disconnected'};
  if(!s.paramLoading)return {ok:!!s.paramComplete,reason:s.paramPhase||'partial'};
  await new Promise(resolve=>setTimeout(resolve,400));
 }
 return {ok:false,reason:'timeout'};
}
async function refreshParameters(force=true,passes=1){
 if(reading)return;
 const s=getState();
 if(!s.connected||!Number.isInteger(s.sysid))throw Error(t('noLink'));
 reading=true;readToken++;updateAll();
 try{
  for(let pass=1;pass<=passes;pass++){
   const current=getState();
   if(!current.connected||!Number.isInteger(current.sysid))throw Error(t('disconnect'));
   if(!current.paramLoading&&!api.requestParameters(force))throw Error(t('partial'));
   const result=await waitForParameters();
   if(!result.ok)throw Error(t('partial')+' ('+result.reason+')');
  }
  lastEvent='read-ok';
  updateAll();announce({type:'read',success:true});
  return {ok:true,passes};
 }finally{reading=false;updateAll();}
}
async function chooseMode(sensor,mode){
 if(busy||reading||!safe()||!core.validMode(mode)){setMessage(sensor.prefix,t('noLink'));return;}
 busy=true;setMessage(sensor.prefix,t('busy'));
 try{
  const result=await api.writeAdvancedParams({[sensor.enableName]:mode});
  if(result.done!==1&&result.total!==0)throw Error('No acknowledged INS_TCAL ENABLE write');
  messages.set(sensor.prefix,t(mode===2?'reload':'written'));
  announce({type:'mode',sensor:sensor.index,mode,verified:true});
  if(mode===2){
   rememberLearning(sensor);
   // When ENABLE=2, firmware may reveal TMIN/TMAX only after a fresh transfer.
   // Force the second complete list automatically, without a confirm dialog.
   busy=false;
   updateAll();
   try{await refreshParameters(true,2);messages.set(sensor.prefix,t('reloaded'));}
   catch(error){messages.set(sensor.prefix,error.message);}
  }
 }catch(error){messages.set(sensor.prefix,error.message||String(error));}
 finally{busy=false;updateAll();announce({type:'settled'});}
}
async function saveRange(sensor){
 const draft=getDraft(sensor),min=Number(draft.min),max=Number(draft.max);
 const check=core.validateRange(min,max);
 if(!draft.min.trim()||!draft.max.trim()||!check.ok){setMessage(sensor.prefix,t('range'));return;}
 if(!sensor.hasMin||!sensor.hasMax||!safe()||busy||reading){setMessage(sensor.prefix,t('noLink'));return;}
 busy=true;setMessage(sensor.prefix,t('busy'));
 try{
  const res=await api.writeAdvancedParams({[sensor.minName]:min,[sensor.maxName]:max});
  if(res.total!==undefined&&res.done!==res.total)throw Error('Temperature PARAM_VALUE readback missing');
  messages.set(sensor.prefix,t('written'));
  drafts.set(sensor.prefix,{min:String(min),max:String(max)});
  announce({type:'range',sensor:sensor.index,verified:true,min,max});
 }catch(err){messages.set(sensor.prefix,err.message||String(err));}
 finally{busy=false;updateAll();announce({type:'settled'});}
}
function label(text,input){
 const node=e('label','tc-field'),span=e('span','',text);
 node.append(span,input);return node;
}
function addInfo(root,text,warning=false){
 root.append(e('p',warning?'tc-note tc-warning':'tc-note',text));
}
function draw(root){
 root.replaceChildren();
 const s=getState(),sensors=core.readSensors(s.params);
 const opts=root.dataset.wizard==='1';
 if(!opts){root.append(e('h2','',t('title')));addInfo(root,t('body'));}
 addInfo(root,t('cached'));
 addInfo(root,t('prep'));
 if(!s.connected||s.demo||!s.params?.size){addInfo(root,t('noLink'),true);
  const refresh=e('button','cc-button ghost',t('read'));refresh.type='button';refresh.disabled=!s.connected||busy||reading;
  refresh.addEventListener('click',()=>refreshParameters(true).catch(err=>setMessage('general',err.message)));root.append(refresh);return;}
 if(!sensors.length){addInfo(root,t('noSensors'),true);const reload=e('button','cc-button ghost',t('read'));
  reload.type='button';reload.disabled=busy||reading||!s.connected;reload.addEventListener('click',()=>refreshParameters(true).catch(err=>setMessage('general',err.message)));root.append(reload);return;
 }
 const count=e('div','tc-summary',t('imuReady')+sensors.length+' · '+(reading||busy?t('busy'):s.paramComplete?t('available'):t('partial')));
 root.append(count);
 for(const sensor of sensors){
  const card=e('section','tc-sensor');
  card.append(e('h3','',t('imu')+' '+sensor.index+' · '+sensor.prefix+'*'));
  const desc=e('p','tc-mode-desc',t(sensor.mode===2?'learning':sensor.mode===1?'enabled':'disabled'));
  const selector=e('select','qs-board-select');
  for(let value=0;value<=2;value++){const option=e('option','',t('modes')[value]);option.value=String(value);selector.append(option);}
  selector.value=String(sensor.mode);
  selector.disabled=busy||reading||!safe()||!s.paramComplete;
  selector.addEventListener('change',()=>{void chooseMode(sensor,Number(selector.value));});
  card.append(label(t('mode'),selector),desc);
  const formatTemp=value=>value===null?'—':Number(value).toFixed(1)+' °C';
  const info=e('div','tc-detail');
  info.append(e('div','tc-detail-row',t('recorded')+' · '+formatTemp(sensor.min)+' → '+formatTemp(sensor.max)));
  info.append(e('div','tc-detail-row',t('base')+' · '+t('accel')+': '+formatTemp(sensor.baseline.accel)+' / '+t('gyro')+': '+formatTemp(sensor.baseline.gyro)));
  info.append(e('div','tc-detail-row',t('coeffCount')+' · '+sensor.coefficientCount+'/18'));
  card.append(info);
  if(!sensor.baselineReady)addInfo(card,t('baselineMissing'),true);
  const done=completedLearning.get(sensor.prefix);
  if(done)addInfo(card,t('pendingTraining'),!sensor.calibratedRange||!sensor.coefficientCount);
  else if(startedLearning.has(sensor.prefix))addInfo(card,t('pendingUnfinished'),true);
  const details=e('details','tc-coeff-list'),summary=e('summary','',t('coefficients')+' · '+sensor.coefficientCount);details.append(summary);
  addInfo(details,t('coefInfo'));
  if(sensor.coefficients.length){
   const table=e('table','tc-coeff-table');
   for(const x of sensor.coefficients){const tr=e('tr');tr.append(e('td','',x.name),e('td','',Number(x.value).toPrecision(7)));table.append(tr);}
   details.append(table);
  }else addInfo(details,t('noneCoefficients'));
  card.append(details);
  const note=messages.get(sensor.prefix);
  if(note)addInfo(card,note);
  if(sensor.mode===2||sensor.mode===1){
   if(sensor.completeFields){
    const values=getDraft(sensor),fields=e('div','tc-range');
    for(const [key,word] of [['min','min'],['max','max']]){
     const input=e('input');input.type='number';input.min='-70';input.max='80';input.step='0.5';input.inputMode='decimal';input.value=values[key];
     input.disabled=busy||reading||!safe();
     input.addEventListener('input',()=>{values[key]=input.value;});
     fields.append(label(t(word),input));
    }
    card.append(fields);
    const check=core.validateRange(Number(values.min),Number(values.max));
    if(!check.ok||!values.min.trim()||!values.max.trim())addInfo(card,t('range'),true);
    else if(!check.recommended)addInfo(card,t('recommended'),true);
    const save=e('button','cc-button outline',t('record'));save.type='button';
    save.disabled=busy||reading||!safe()||!check.ok||!values.min.trim()||!values.max.trim();
    save.addEventListener('click',()=>{void saveRange(sensor);});card.append(save);
   }else addInfo(card,t('missing'),true);
   if(sensor.mode===2){addInfo(card,t('reboot'),true);addInfo(card,t('finish'));}
  }
  root.append(card);
 }
 addInfo(root,t('startHint'));
 addInfo(root,t('data'));
 const refresh=e('button','cc-button ghost',t('reloadButton'));refresh.type='button';
 refresh.disabled=busy||reading||!s.connected||s.demo;
 refresh.addEventListener('click',()=>refreshParameters(true).catch(err=>setMessage('general',err.message)));
 root.append(refresh);
 if(messages.has('general'))addInfo(root,messages.get('general'),true);
 const badge=e('p','tc-note',t('noHardware'));
 root.append(badge);
}
function mount(parent,options={}){
 if(!parent)return;
 const root=e('div','tc-root');root.dataset.wizard=options.wizard?'1':'0';parent.append(root);roots.add(root);draw(root);return root;
}
window.addEventListener('atlas:parameters',()=>{
 const s=getState(),sensorInfo=core.readSensors(s.params);
 watchLearning(sensorInfo,!s.paramLoading&&s.paramComplete===true);
 const summary=sensorInfo.map(i=>i.prefix+':'+i.mode+':'+i.min+':'+i.max+':'+i.coefficientCount+':'+i.coefficients.map(x=>x.value).join(',')).join('|')+'|'+s.paramComplete;
 if(!s.paramLoading&&summary!==lastSensors){lastSensors=summary;updateAll();announce({type:'parameters'});}
});
window.addEventListener('atlas:state',()=>{
 const s=getState(),connected=!!s.connected;
 if(connected!==lastConnected){
  if(!connected)for(const record of startedLearning.values())record.sawDisconnect=true;
  lastConnected=connected;updateAll();announce({type:'connection'});
 }
});
function translateHeader(){
 const dict=translations[language()]||translations.ru;
 const nav=document.querySelector('[data-tc-nav]'),heading=document.querySelector('[data-tc-head]'),desc=document.querySelector('[data-tc-description]');
 if(nav)nav.textContent=dict.title;
 if(heading)heading.textContent=dict.title;
 if(desc)desc.textContent=dict.body;
}
window.addEventListener('atlas:language',()=>{translateHeader();updateAll();});
window.addEventListener('atlas:navigate',event=>{
 if(event.detail?.tab==='temperature'){
  const panel=document.getElementById('temperatureWorkspace');
  if(panel){panel.replaceChildren();mount(panel,{wizard:false});}
 }
});
window.AtlasTempCal=Object.freeze({mount,report,refresh:refreshParameters});
translateHeader();
const firstMount=document.getElementById('temperatureWorkspace');
if(firstMount){firstMount.replaceChildren();mount(firstMount,{wizard:false});}
})();
