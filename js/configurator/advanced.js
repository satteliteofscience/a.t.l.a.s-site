/* A.T.L.A.S. Control Center 0.5.0 — advanced configuration panels.
 * Live reads from the existing MAVLink link. Writes only by explicit consent,
 * on live DISARMED vehicle, by the existing acknowledged PARAM_SET queue.
 * Joystick is local preview only. MAVFTP is read-only. No parachute deploy. */
(() => {
'use strict';
const A=()=>window.AtlasCC;
const $=id=>document.getElementById(id);
const T={
ru:{tuning:'Основная настройка',mavftp:'MAVFTP',modes:'Режимы полёта',radio:'Калибровка радио',joystick:'Джойстик',gimbal:'Камера / подвес',parachute:'Парашют',refresh:'Обновить',tuningIntro:'Настройка PID, L1, TECS и тяги по реальным параметрам полётного контроллера.',confirmWrites:'DISARMED, пропеллер снят, параметры проверены',saveChanges:'Записать изменения',ftpReadOnly:'Только чтение',ftpInfo:'Просмотр и скачивание файлов автопилота через MAVLink FTP. Изменение и удаление отключены.',up:'Вверх',browse:'Открыть папку',name:'Имя',type:'Тип',size:'Размер',ftpEmpty:'Подключи USB и открой каталог',modesConfig:'Шесть положений переключателя',livePwm:'PWM канала',activePos:'Активная позиция',saveModes:'Записать режимы',radioIntro:'Живые RC-каналы. Собери минимумы и максимумы, затем поставь стики в центр и сохрани RCx_MIN/TRIM/MAX.',startCal:'Собирать диапазоны',stopCal:'Остановить',saveRC:'Записать RCx_MIN/TRIM/MAX',inputPreview:'Локальный ввод',joystickIntro:'Просмотр USB-геймпада. Управление самолётом через джойстик здесь отключено.',gimbalIntro:'Параметры подвеса MNT1_* и CAM1_*. MNT1_TYPE обычно требует перезагрузки.',configOnly:'Только конфигурация',chuteIntro:'Настройка CHUTE_* без команд раскрытия. Проверь механическую защиту перед изменением.',download:'Скачать',folder:'Папка',file:'Файл',noParams:'Нет данных. Подключи полётник и загрузи параметры.',readOnly:'Демо: запись отключена',noTelemetry:'Нет телеметрии RC_CHANNELS',started:'Сбор диапазонов запущен',stopped:'Сбор остановлен. Стики в центр для TRIM.',saved:'Запись подтверждена',noChange:'Изменений нет',missing:'нет на плате',selectFile:'Выбери файл',notAvailable:'Недоступно',gpNone:'Геймпад не подключён',calWarn:'Нужны реальные входные сигналы и диапазон не менее 120 мкс',fileLarge:'Файл слишком велик для браузерной загрузки',ftpError:'Ошибка MAVFTP'},
uk:{tuning:'Основне налаштування',mavftp:'MAVFTP',modes:'Режими польоту',radio:'Калібрування радіо',joystick:'Джойстик',gimbal:'Камера / підвіс',parachute:'Парашут',refresh:'Оновити',tuningIntro:'Налаштування PID, L1, TECS і тяги за параметрами контролера.',confirmWrites:'DISARMED, пропелер знято, параметри перевірено',saveChanges:'Записати зміни',ftpReadOnly:'Лише читання',ftpInfo:'Перегляд і завантаження файлів автопілота через MAVLink FTP. Запис і видалення вимкнені.',up:'Вгору',browse:'Відкрити теку',name:'Назва',type:'Тип',size:'Розмір',ftpEmpty:'Підключи USB і відкрий теку',modesConfig:'Шість положень перемикача',livePwm:'PWM каналу',activePos:'Активна позиція',saveModes:'Записати режими',radioIntro:'Живі RC-канали. Збери мінімуми/максимуми, потім постав стики в центр і збережи RCx_MIN/TRIM/MAX.',startCal:'Збирати діапазони',stopCal:'Зупинити',saveRC:'Записати RCx_MIN/TRIM/MAX',inputPreview:'Локальний ввід',joystickIntro:'Перегляд USB-геймпада. Керування літаком через джойстик тут вимкнено.',gimbalIntro:'Параметри підвісу MNT1_* і CAM1_*. MNT1_TYPE зазвичай вимагає перезапуску.',configOnly:'Лише конфігурація',chuteIntro:'Налаштування CHUTE_* без команд розкриття. Перевір механічний захист.',download:'Завантажити',folder:'Тека',file:'Файл',noParams:'Немає даних. Підключи контролер та зчитай параметри.',readOnly:'Демо: запис вимкнено',noTelemetry:'Немає телеметрії RC_CHANNELS',started:'Збір діапазонів розпочато',stopped:'Збір зупинено. Стики в центр для TRIM.',saved:'Запис підтверджено',noChange:'Немає змін',missing:'відсутній',selectFile:'Обери файл',notAvailable:'Недоступно',gpNone:'Геймпад не підключено',calWarn:'Потрібні реальні RC-сигнали та діапазон щонайменше 120 мкс',fileLarge:'Файл завеликий для браузера',ftpError:'Помилка MAVFTP'},
en:{tuning:'Basic Tuning',mavftp:'MAVFTP',modes:'Flight Modes',radio:'Radio Calibration',joystick:'Joystick',gimbal:'Camera Gimbal',parachute:'Parachute',refresh:'Refresh',tuningIntro:'Edit real PID, L1, TECS and throttle parameters from your flight controller.',confirmWrites:'DISARMED, propeller removed, parameter changes reviewed',saveChanges:'Write changes',ftpReadOnly:'Read only',ftpInfo:'Browse and download autopilot files over MAVLink FTP. File modifications and deletion disabled.',up:'Up',browse:'Browse',name:'Name',type:'Type',size:'Size',ftpEmpty:'Connect USB and browse a directory',modesConfig:'Six flight-mode switch positions',livePwm:'Channel PWM',activePos:'Active switch position',saveModes:'Save flight modes',radioIntro:'Live RC channels. Capture min/max, center sticks, then save RCx_MIN/TRIM/MAX.',startCal:'Capture ranges',stopCal:'Stop capture',saveRC:'Save RCx_MIN/TRIM/MAX',inputPreview:'Local input preview',joystickIntro:'USB gamepad preview only. Sending joystick control commands to aircraft is disabled.',gimbalIntro:'Mount controls based on MNT1_* and CAM1_*. MNT1_TYPE typically requires reboot.',configOnly:'Config only',chuteIntro:'CHUTE_* configuration without deploying the parachute. Check physical safety.',download:'Download',folder:'Folder',file:'File',noParams:'No data. Connect your controller and load parameters.',readOnly:'Demo: writes disabled',noTelemetry:'No RC_CHANNELS telemetry',started:'Capturing channel ranges',stopped:'Capture stopped. Center sticks for TRIM.',saved:'Write verified',noChange:'No changes',missing:'missing on FC',selectFile:'Select file',notAvailable:'Unavailable',gpNone:'No gamepad connected',calWarn:'Requires live RC and at least 120 µs range',fileLarge:'File too large for browser download',ftpError:'MAVFTP error'}
};
const FIELDS={
ru:{'Servo Roll PID':'PID крена','Servo Pitch PID':'PID тангажа','Servo Yaw':'Канал рыскания','L1 Control':'Навигация L1','Navigation angles':'Ограничения углов','Throttle':'Газ','Airspeed':'Воздушная скорость','Camera / Mount type':'Тип камеры и подвеса','Roll':'Крен','Pitch':'Тангаж','Yaw / Pan':'Рыскание / поворот','Parachute':'Парашют','Damping':'Демпфирование','Climb max (m/s)':'Макс. набор (м/с)','Sink min (m/s)':'Мин. снижение (м/с)','Sink max (m/s)':'Макс. снижение (м/с)','Pitch damping':'Демпфирование тангажа','Time constant':'Постоянная времени','Cruise (%)':'Крейсерский газ (%)','Minimum (m/s)':'Минимум (м/с)','Maximum (m/s)':'Максимум (м/с)','Min (%)':'Минимум (%)','Max (%)':'Максимум (%)','Minimum (°)':'Минимум (°)','Maximum (°)':'Максимум (°)','Flight Mode ':'Режим полёта '},
uk:{'Servo Roll PID':'PID крену','Servo Pitch PID':'PID тангажу','Servo Yaw':'Канал рискання','L1 Control':'Навігація L1','Navigation angles':'Обмеження кутів','Throttle':'Газ','Airspeed':'Повітряна швидкість','Camera / Mount type':'Тип камери та підвісу','Roll':'Крен','Pitch':'Тангаж','Yaw / Pan':'Рискання / поворот','Parachute':'Парашут','Damping':'Демпфування','Climb max (m/s)':'Макс. набір (м/с)','Sink min (m/s)':'Мін. зниження (м/с)','Sink max (m/s)':'Макс. зниження (м/с)','Pitch damping':'Демпфування тангажу','Time constant':'Стала часу','Cruise (%)':'Крейсерський газ (%)','Minimum (m/s)':'Мінімум (м/с)','Maximum (m/s)':'Максимум (м/с)','Min (%)':'Мінімум (%)','Max (%)':'Максимум (%)','Minimum (°)':'Мінімум (°)','Maximum (°)':'Максимум (°)','Flight Mode ':'Режим польоту '},
en:{}
};
let lang=document.documentElement.lang==='uk'?'uk':document.documentElement.lang==='en'?'en':'ru';
const lf = k => (FIELDS[lang]||{})[k] || k;
const tr=k=>(T[lang]||T.ru)[k]||k;
const defs={
 tuning:[
  ['Servo Roll PID',[['RLL2SRV_P','P',.001],['RLL2SRV_I','I',.001],['RLL2SRV_D','D',.0001],['RLL2SRV_IMAX','INT_MAX',.01]]],
  ['Servo Pitch PID',[['PTCH2SRV_P','P',.001],['PTCH2SRV_I','I',.001],['PTCH2SRV_D','D',.0001],['PTCH2SRV_IMAX','INT_MAX',.01]]],
  ['Servo Yaw',[['YAW2SRV_RLL','Yaw to roll',.01],['YAW2SRV_INT','Integral',.01],['YAW2SRV_DAMP','Damping',.01],['YAW2SRV_IMAX','Integrator max',1]]],
  ['L1 Control',[['NAVL1_PERIOD','Period',.1],['NAVL1_DAMPING','Damping',.01]]],
  ['TECS',[['TECS_CLMB_MAX','Climb max (m/s)',.1],['TECS_SINK_MIN','Sink min (m/s)',.1],['TECS_SINK_MAX','Sink max (m/s)',.1],['TECS_PTCH_DAMP','Pitch damping',.05],['TECS_TIME_CONST','Time constant',.1]]],
  ['Navigation angles',[['ROLL_LIMIT_DEG','Bank max (deg)',1],['PITCH_MAX','Pitch max (centideg)',100],['PITCH_MIN','Pitch min (centideg)',100]]],
  ['Throttle',[['THR_CRUISE','Cruise (%)',1],['THR_MIN','Min (%)',1],['THR_MAX','Max (%)',1],['THR_SLEWRATE','Slew rate',1]]],
  ['Airspeed',[['TRIM_ARSPD_CM','Cruise (cm/s)',100],['AIRSPEED_MIN','Minimum (m/s)',.5],['AIRSPEED_MAX','Maximum (m/s)',.5],['ARSPD_RATIO','Ratio',.1]]]
 ],
 gimbal:[
  ['Camera / Mount type',[['MNT1_TYPE','Mount driver',1],['MNT1_DEFLT_MODE','Default mode',1],['MNT1_RC_RATE','RC rate',1],['CAM1_TYPE','Camera driver',1]]],
  ['Roll',[['MNT1_ROLL_MIN','Minimum (°)',1],['MNT1_ROLL_MAX','Maximum (°)',1],['MNT1_RETRACT_X','Retract angle',1],['MNT1_NEUTRAL_X','Neutral angle',1]]],
  ['Pitch',[['MNT1_PITCH_MIN','Minimum (°)',1],['MNT1_PITCH_MAX','Maximum (°)',1],['MNT1_RETRACT_Y','Retract angle',1],['MNT1_NEUTRAL_Y','Neutral angle',1]]],
  ['Yaw / Pan',[['MNT1_YAW_MIN','Minimum (°)',1],['MNT1_YAW_MAX','Maximum (°)',1],['MNT1_RETRACT_Z','Retract angle',1],['MNT1_NEUTRAL_Z','Neutral angle',1]]]
 ],
 chute:[
  ['Parachute',[['CHUTE_ENABLED','Enable (0 / 1)',1],['CHUTE_TYPE','Release type (0 / 10)',1],['CHUTE_SERVO_OFF','Resting PWM',10],['CHUTE_SERVO_ON','Deploy PWM',10],['CHUTE_ALT_MIN','Min altitude (m)',1],['CHUTE_CRT_SINK','Critical sink (m/s)',.5]]]
 ]
};
const modes=[[0,'MANUAL'],[1,'CIRCLE'],[2,'STABILIZE'],[3,'TRAINING'],[4,'ACRO'],[5,'FBWA'],[6,'FBWB'],[7,'CRUISE'],[8,'AUTOTUNE'],[10,'AUTO'],[11,'RTL'],[12,'LOITER'],[13,'TAKEOFF'],[14,'AVOID_ADSB'],[15,'GUIDED'],[17,'QSTABILIZE'],[18,'QHOVER'],[19,'QLOITER'],[20,'QLAND'],[21,'QRTL'],[22,'QAUTOTUNE'],[23,'QACRO'],[24,'THERMAL'],[25,'LOITER_TO_QLAND'],[26,'AUTOLAND']];
const state={rc:new Array(18).fill(0),lastRc:0,collect:false,rcMin:new Array(18).fill(2200),rcMax:new Array(18).fill(800),joyMap:[0,1,2,3],ftpSeq:0,ftpPending:null,ftpBusy:false,ftpCurrent:'/',ftpFiles:[],isSaving:false,radioRenderAt:0};
const st=()=>A()?.getState?.()||{connected:false,demo:false,params:new Map()};
function putStatus(id,msg,isError=false){const node=$(id);if(node){node.textContent=msg;node.style.borderLeftColor=isError?'#d77b52':'#b9c963';}}
function canSave(){const s=st();return s.connected&&!s.demo&&s.armed===false&&Date.now()-s.lastHeartbeat<4000;}
function el(tag,attrs={},text=''){const node=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')node.className=v;else node.setAttribute(k,v);}if(text!=='')node.textContent=String(text);return node;}
function getParam(name){return st().params?.get(name);}
function format(v){return Number.isFinite(v)?String(Number(v.toPrecision(8))):'—';}
const panelInput=(name)=>document.querySelector(`.ac-field input[data-param="${name}"]`);
function inputCard(section,container,head,entries){
 const card=el('article',{class:'ac-card'});card.append(el('h3',{},lf(head)));
 for(const[name,label,step] of entries){const p=getParam(name),row=el('div',{class:'ac-field'+(p?'':' ac-unavailable')});row.dataset.field=name;
 const labelBox=el('label',{},lf(label));labelBox.append(el('small',{},name));row.append(labelBox);
 const spin=el('div',{class:'ac-spinner'});const minus=el('button',{type:'button'},'−');const input=el('input',{type:'number',step:String(step),'data-param':name,'aria-label':name});const plus=el('button',{type:'button'},'+');
 if(!p){input.value='';input.placeholder='—';input.disabled=true;minus.disabled=true;plus.disabled=true;}
 else{input.value=format(p.value);input.dataset.original=String(p.value);}
 for(const [btn,sign] of [[minus,-1],[plus,1]])btn.addEventListener('click',()=>{if(input.disabled)return;const current=Number(input.value||0),next=Number((current+sign*step).toFixed(7));input.value=String(next);input.dispatchEvent(new Event('input'));});
 input.addEventListener('input',()=>{const changed=Number(input.value)!==Number(input.dataset.original);row.classList.toggle('ac-dirty',changed);});
 spin.append(minus,input,plus);row.append(spin);card.append(row);
 }
 container.append(card);
}
function renderForms(section){const out=$(section==='tuning'?'atlasTuningGrid':section==='gimbal'?'gimbalGrid':'chuteGrid');out.replaceChildren();
 for(const [title,entries] of defs[section])inputCard(section,out,title,entries);
}
function currentEdits(section){const root=$(section==='tuning'?'atlasTuningGrid':section==='gimbal'?'gimbalGrid':'chuteGrid');const edits={};
 for(const input of root.querySelectorAll('input[data-param]')){
  const p=getParam(input.dataset.param);if(!p||input.disabled||!input.value.trim())continue;
  const value=Number(input.value);if(!Number.isFinite(value))throw Error(`${input.dataset.param}: invalid value`);
  if(Math.abs(value-p.value)>1e-6)edits[input.dataset.param]=value;
 }
 if(section==='chute'){
  if('CHUTE_ENABLED' in edits&&!([0,1].includes(edits.CHUTE_ENABLED)))throw Error('CHUTE_ENABLED: only 0 or 1');
  for(const key of ['CHUTE_SERVO_OFF','CHUTE_SERVO_ON'])if(key in edits&&(edits[key]<800||edits[key]>2200))throw Error(key+': PWM out of range');
 }
 return edits;
}
async function writeSet(updates,consent,statusId,refresh){if(!consent.checked)throw Error(tr('confirmWrites'));
 if(!canSave())throw Error('Requires live DISARMED USB + fresh heartbeat');
 if(state.isSaving)throw Error('Another write is pending');state.isSaving=true;
 try{const keys=Object.keys(updates);if(!keys.length){putStatus(statusId,tr('noChange'));return;}
  const r=await A().writeAdvancedParams(updates,p=>putStatus(statusId,`${p.done}/${p.total} · ${p.name||'...'}`));
  putStatus(statusId,`${tr('saved')}: ${r.done}/${r.total}`);consent.checked=false;refresh?.();
 }finally{state.isSaving=false;}}
async function saveForm(section){const status=section==='tuning'?'tuningStatus':section==='gimbal'?'gimbalStatus':'chuteStatus';
 try{await writeSet(currentEdits(section),$(section==='tuning'?'tuningConsent':section==='gimbal'?'gimbalConsent':'chuteConsent'),status,()=>renderForms(section));}
 catch(e){putStatus(status,e.message,true);}}
function renderModes(){const root=$('modeRows');root.replaceChildren();
 for(let i=1;i<=6;i++){
  const name=`FLTMODE${i}`,p=getParam(name),row=el('div',{class:'ac-mode-row','data-index':String(i)});
  const label=el('label',{},lf('Flight Mode ')+i),select=el('select',{'data-param':name,'aria-label':name});
  for(const [num,text] of modes){const op=el('option',{value:String(num)},text);select.append(op);}if(p){if(!modes.some(([v])=>v===p.value))select.append(el('option',{value:String(p.value)},'CUSTOM '+p.value));select.value=String(p.value);}else{const missing=el('option',{value:''},'— NO PARAM DATA —');select.prepend(missing);select.value='';select.disabled=true;}
  row.append(label,select);root.append(row);
 }
 const ch=getParam('FLTMODE_CH')?.value;$('modeChannel').textContent=ch===undefined?'—':String(ch);renderActiveMode();
}
function pwmToPosition(pwm){return pwm<=1230?1:pwm<=1360?2:pwm<=1490?3:pwm<=1620?4:pwm<=1749?5:6;}
function renderActiveMode(){const ch=getParam('FLTMODE_CH')?.value;const pwm=Number.isInteger(ch)&&ch>0?state.rc[ch-1]:0;
 $('modePwm').textContent=pwm>0?pwm+' µs':'—';const pos=pwm>0?pwmToPosition(pwm):0;$('modeActive').textContent=pos||'—';
 $('modeRows').querySelectorAll('.ac-mode-row').forEach(e=>e.classList.toggle('ac-active',Number(e.dataset.index)===pos));
}
async function saveModes(){try{const updates={};for(const select of $('modeRows').querySelectorAll('select[data-param]')){const p=getParam(select.dataset.param);if(p&&p.value!==Number(select.value))updates[select.dataset.param]=Number(select.value);}
 await writeSet(updates,$('modesConsent'),'modesStatus',renderModes);
 }catch(e){putStatus('modesStatus',e.message,true);}}
function renderRadio(){const root=$('radioRows');root.replaceChildren();const count=16;
 for(let i=0;i<count;i++){const val=state.rc[i];const box=el('article',{class:'ac-rc-card'});box.append(el('header',{},''));box.lastChild.append(el('span',{},`RC${i+1}`),el('span',{},val?'LIVE':'—'));
 const value=el('strong',{'data-rc-value':String(i)},val?val+' µs':'—');box.append(value);
 const track=el('div',{class:'ac-rc-track'});const bar=el('i',{'data-rc-bar':String(i)});bar.style.width=val?`${Math.max(0,Math.min(100,(val-800)/14))}%`:'0%';track.append(bar);box.append(track);
 const min=state.rcMin[i]<=state.rcMax[i]?state.rcMin[i]:getParam(`RC${i+1}_MIN`)?.value;
 const max=state.rcMin[i]<=state.rcMax[i]?state.rcMax[i]:getParam(`RC${i+1}_MAX`)?.value;
 const range=el('div',{class:'ac-rc-range','data-rc-range':String(i)},`${min??'—'} / ${getParam(`RC${i+1}_TRIM`)?.value??'—'} / ${max??'—'}`);box.append(range);root.append(box);
 }
}
function updateRadio(){if(Date.now()-state.radioRenderAt<200)return;state.radioRenderAt=Date.now();
 for(let i=0;i<16;i++){const val=state.rc[i],value=document.querySelector(`[data-rc-value="${i}"]`),bar=document.querySelector(`[data-rc-bar="${i}"]`),range=document.querySelector(`[data-rc-range="${i}"]`);
 if(value)value.textContent=val?val+' µs':'—';if(bar)bar.style.width=val?`${Math.max(0,Math.min(100,(val-800)/14))}%`:'0%';
 if(range&&state.collect&&state.rcMin[i]<=state.rcMax[i])range.textContent=`${state.rcMin[i]} / ${val||'—'} / ${state.rcMax[i]}`;
 }
 renderActiveMode();
}
function startRC(){const s=st();if(!s.connected||s.armed!==false){putStatus('radioStatus','Connect a DISARMED controller first',true);return;}
 state.collect=true;state.rcMin.fill(2200);state.rcMax.fill(800);putStatus('radioStatus',tr('started'));renderRadio();}
function stopRC(){state.collect=false;putStatus('radioStatus',tr('stopped'));renderRadio();}
async function saveRC(){try{if(state.collect)throw Error('Stop capture before saving');if(Date.now()-state.lastRc>1500)throw Error(tr('noTelemetry'));
 const changes={};for(let i=0;i<16;i++){const lo=state.rcMin[i],hi=state.rcMax[i],val=state.rc[i];if(lo>hi||hi-lo<120||val<lo||val>hi)continue;
 const ch=i+1;for(const [suffix,value] of [['MIN',lo],['MAX',hi],['TRIM',val]]){const name=`RC${ch}_${suffix}`;if(getParam(name))changes[name]=value;}}
 if(!Object.keys(changes).length)throw Error(tr('calWarn'));
 await writeSet(changes,$('radioConsent'),'radioStatus',renderRadio);
 }catch(e){putStatus('radioStatus',e.message,true);}}
function setupJoystick(){for(const [idx,id] of ['joyRoll','joyPitch','joyYaw','joyThrottle'].entries()){const select=$(id);for(let i=0;i<12;i++)select.append(el('option',{value:String(i)},'Axis '+i));select.value=String(idx);select.addEventListener('change',()=>{state.joyMap[idx]=Number(select.value);});}}
function pollJoystick(){const tab=location.hash.replace('#','');if(tab!=='joystick'||document.hidden)return;
 const gp=navigator.getGamepads?.()?.find(Boolean);$('joyDevice').textContent=gp?.id||tr('gpNone');const axes=$('joyAxes'),buttons=$('joyButtons');axes.replaceChildren();buttons.replaceChildren();
 if(!gp){putStatus('joyStatus',tr('gpNone'));return;}
 gp.axes.forEach((n,i)=>{const box=el('div',{class:'ac-joy-axis'});box.append(el('span',{},`Axis ${i}: ${n.toFixed(2)}`));const bar=el('div',{class:'ac-joy-bar'}),fill=el('i');fill.style.width=((n+1)*50)+'%';bar.append(fill);box.append(bar);axes.append(box);});
 gp.buttons.forEach((b,i)=>{const n=el('span',{class:b.pressed?'pressed':''},'B'+i+(b.pressed?' ●':''));buttons.append(n);});putStatus('joyStatus',`LOCAL PREVIEW · ${gp.axes.length} axes / ${gp.buttons.length} buttons · no MAVLink outputs`);
}
// MAVFTP / FILE_TRANSFER_PROTOCOL, read-only operations 3/4/5/1.
const ftpErr={1:'Failure',2:'Errno',3:'Invalid data',4:'Invalid session',5:'No sessions',6:'EOF',7:'Unknown opcode',9:'Protected',10:'Not found'};
function ftpPacket(seq,opcode,path='',offset=0,session=0,size){const bytes=new TextEncoder().encode(path),head=new Uint8Array(251);const view=new DataView(head.buffer);view.setUint16(0,seq,true);head[2]=session;head[3]=opcode;head[4]=size===undefined?Math.min(bytes.length+1,239):size;view.setUint32(8,offset,true);if(size===undefined){if(bytes.length>238)throw Error('Path too long');head.set(bytes,12);}return head;}
function onFtpReply(data){const h=data.data;if(!h||h.length<12||!state.ftpPending)return;const v=new DataView(h.buffer,h.byteOffset,h.byteLength);const seq=v.getUint16(0,true),req=h[5],op=h[3],size=h[4];const job=state.ftpPending;
 if((op!==128&&op!==129)||req!==job.opcode||!(seq===job.seq||seq===((job.seq+1)&0xffff)))return;
 state.ftpPending=null;clearTimeout(job.timer);
 const result={op,req,session:h[2],offset:v.getUint32(8,true),data:h.slice(12,12+Math.min(size,239)),size};
 if(op===129){const err=result.data[0];job.reject(Object.assign(Error('MAVFTP NAK '+(ftpErr[err]||err)),{code:err}));}else job.resolve(result);
}
async function ftpCall(opcode,path='',offset=0,session=0,size){if(state.ftpPending)throw Error('MAVFTP busy');const seq=state.ftpSeq++&65535;const pkt=ftpPacket(seq,opcode,path,offset,session,size);
 return new Promise(async(resolve,reject)=>{const timer=setTimeout(()=>{if(state.ftpPending?.seq===seq)state.ftpPending=null;reject(Error('MAVFTP timeout'));},4500);state.ftpPending={seq,opcode,timer,resolve,reject};try{await A().ftpSend(pkt);}catch(e){clearTimeout(timer);state.ftpPending=null;reject(e);}});
}
function ftpNormalize(path){path=path.trim().replaceAll('\\','/');if(!path)return '/';if(path==='@SYS'||path.startsWith('@SYS/'))return path.replace(/\/+$/,'')||'@SYS';return '/'+path.replace(/^\/+|\/+$/g,'');}
function ftpJoin(base,file){return (base==='/'?'/':base+'/')+file;}
function ftpParent(path){if(path==='/'||path==='@SYS')return '/';const parts=path.split('/');parts.pop();return parts.join('/')||'/';}
function ftpRender(){const root=$('ftpRows');root.replaceChildren();for(const item of state.ftpFiles){const row=el('tr');const name=el('td'),btn=el('button',{type:'button',class:'ac-link'},(item.directory?'▣ ':'▤ ')+item.name);btn.onclick=()=>item.directory?ftpBrowse(ftpJoin(state.ftpCurrent,item.name)):ftpDownload(item);name.append(btn);row.append(name,el('td',{},item.directory?tr('folder'):tr('file')),el('td',{},item.size??'—'));
 const action=el('td');if(!item.directory){const b=el('button',{class:'cc-button ghost',type:'button'},tr('download'));b.onclick=()=>ftpDownload(item);action.append(b);}row.append(action);root.append(row);}
 if(!state.ftpFiles.length)root.append(el('tr',{},''));if(!state.ftpFiles.length)root.lastChild.append(el('td',{colspan:'4'},tr('ftpEmpty')));
}
function ftpDecodeList(data){const result=[];const text=new TextDecoder().decode(data);for(const line of text.split('\0')){if(!line)continue;const marker=line[0];if(marker==='S')continue;if(marker!=='F'&&marker!=='D')continue;const entry=line.slice(1).split('\t');const name=entry[0];if(!name||name==='.'||name==='..')continue;result.push({name,directory:marker==='D',size:entry[1]||''});}return result;}
async function ftpBrowse(path){if(state.ftpBusy)return;state.ftpBusy=true;const normalized=ftpNormalize(path||$('ftpPath').value);putStatus('ftpStatus',`MAVFTP LIST ${normalized}…`);
 try{if(!st().connected)throw Error('Connect USB first');const found=[];let offset=0;for(let attempt=0;attempt<75;attempt++){
  let r;try{r=await ftpCall(3,normalized,offset);}catch(e){if(e.code===6)break;throw e;}
  const items=ftpDecodeList(r.data);found.push(...items);if(items.length===0)break;offset+=items.length;
 }
 state.ftpCurrent=normalized;$('ftpPath').value=normalized;state.ftpFiles=found;ftpRender();putStatus('ftpStatus',`MAVFTP · ${normalized} · ${found.length} entries`);
 }catch(e){putStatus('ftpStatus',tr('ftpError')+': '+e.message,true);}finally{state.ftpBusy=false;}}
async function ftpDownload(file){if(state.ftpBusy)return;state.ftpBusy=true;const path=ftpJoin(state.ftpCurrent,file.name);let session=null;
 try{putStatus('ftpStatus',`MAVFTP OPEN ${path}`);const opened=await ftpCall(4,path);session=opened.session;const sizeView=new DataView(opened.data.buffer,opened.data.byteOffset,opened.data.byteLength);if(opened.data.length<4)throw Error('MAVFTP missing file size');const len=sizeView.getUint32(0,true);if(len>12*1024*1024)throw Error(tr('fileLarge')+' (>12MiB)');
  const chunks=[];let offset=0;while(offset<len){const r=await ftpCall(5,'',offset,session,Math.min(239,len-offset));if(r.data.length===0)throw Error('MAVFTP empty read');if(r.offset!==offset)throw Error('MAVFTP offset mismatch');chunks.push(r.data);offset+=r.data.length;putStatus('ftpStatus',`${file.name} · ${offset}/${len} bytes`);}
  const blob=new Blob(chunks,{type:'application/octet-stream'}),url=URL.createObjectURL(blob),a=el('a',{href:url,download:file.name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);putStatus('ftpStatus',`${file.name} · ${len} bytes downloaded`);
 }catch(e){putStatus('ftpStatus',tr('ftpError')+': '+e.message,true);}finally{if(session!==null){try{await ftpCall(1,'',0,session,0);}catch{}}state.ftpBusy=false;}}
function setLanguage(){lang=document.documentElement.lang==='uk'?'uk':document.documentElement.lang==='en'?'en':'ru';document.querySelectorAll('[data-x]').forEach(n=>{n.textContent=tr(n.dataset.x);});renderForms('tuning');renderForms('gimbal');renderForms('chute');renderModes();renderRadio();ftpRender();}
function renderAll(){renderForms('tuning');renderForms('gimbal');renderForms('chute');renderModes();renderRadio();}
function init(){setupJoystick();renderAll();setLanguage();
 for(const section of ['tuning','gimbal','chute']){$(section+'Save').addEventListener('click',()=>saveForm(section));$(section+'Read')?.addEventListener('click',()=>A().requestParameters());}
 $('modesSave').addEventListener('click',saveModes);$('modesRead').addEventListener('click',()=>A().requestParameters());
 $('radioStart').addEventListener('click',startRC);$('radioStop').addEventListener('click',stopRC);$('radioSave').addEventListener('click',saveRC);$('radioRefresh').addEventListener('click',()=>A().requestParameters());
 $('ftpBrowse').addEventListener('click',()=>ftpBrowse($('ftpPath').value));$('ftpUp').addEventListener('click',()=>ftpBrowse(ftpParent(state.ftpCurrent)));
 document.querySelectorAll('[data-ftppath]').forEach(n=>n.addEventListener('click',()=>ftpBrowse(n.dataset.ftppath)));
 window.addEventListener('atlas:language',setLanguage);
 window.addEventListener('atlas:parameters',()=>{const active=document.querySelector('.cc-nav.active')?.dataset.tab;if(['tuning','gimbal','parachute'].includes(active))renderForms(active==='parachute'?'chute':active);if(active==='modes')renderModes();if(active==='radio')renderRadio();});
 window.addEventListener('atlas:state',()=>{if(!st().connected){state.rc.fill(0);state.lastRc=0;state.collect=false;state.ftpFiles=[];}renderAll();});
 window.addEventListener('atlas:message',ev=>{const d=ev.detail;if(d?.type==='rc_channels'){
   d.channels.forEach((v,i)=>{if(v>=800&&v<=2200){state.rc[i]=v;if(state.collect){state.rcMin[i]=Math.min(v,state.rcMin[i]);state.rcMax[i]=Math.max(v,state.rcMax[i]);}}});state.lastRc=Date.now();updateRadio();
  }else if(d?.type==='mavftp')onFtpReply(d);});
 setInterval(pollJoystick,420);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
