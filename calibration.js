/* A.T.L.A.S. 0.4: MAVLink calibration, servo output and battery display.
   This module does NOT contain commands for arming, servo override or motor tests.
   Calibration requires a fresh DISARMED MAVLink heartbeat and real USB connection.
   Full accel progress is driven exclusively by ArduPilot COMMAND_LONG 42429.
 */
(() => {
'use strict';
const api=window.AtlasCC,servoCore=window.AtlasServoCore,$=id=>document.getElementById(id);
if(!servoCore)throw new Error('A.T.L.A.S. servo configuration core failed to load');
const lex={
 ru:{accelIntro:'Калибровка акселерометра через MAVLink. Сними пропеллер и проверь AHRS_ORIENTATION перед калибровкой.',simpleTitle:'Простая калибровка',simpleInfo:'Поставь самолёт горизонтально и не двигай. Калибрует только смещения акселерометра, не полную геометрию.',startSimple:'Калибровать (1 положение)',sixTitle:'Полная 6-позиционная',sixInfo:'Автопилот запрашивает шесть положений по очереди. После каждого запроса установи самолёт и дождись неподвижности.',startSix:'Начать 6-позиционную',levelTitle:'Установить горизонт',levelInfo:'После калибровки акселерометра установи самолёт в положение горизонтального полёта. Коррекция уровня до 10°.',setLevel:'Установить уровень',wizard:'Мастер калибровки',requestedPose:'Запрошенное положение',waitRequest:'Ожидается команда автопилота',confirmPose:'Положение установлено',calSafe:'Все калибровки требуют живого USB/MAVLink и подтверждённого DISARMED. Демо ничего не записывает.',diagAdvanced:'Диагностика MAVLink',servoBenchAdvanced:'Дополнительно: ручной PWM-тест',servoIntro:'Выходные PWM и настройка сервоприводов: FUNCTION, MIN, TRIM, MAX, REVERSED. Нажми «Настроить» на нужном канале. Ручной PWM-тест доступен только для поддерживаемых функций выхода.',servoChannels:'Выходные каналы / PWM',servoNote:'Выбери «Настроить» на нужном выходе, чтобы изменить FUNCTION, MIN, TRIM, MAX и REVERSED. Выходы могут быть активны даже при DISARM.',servoSetup:'Настроить',servoEditTitle:'Настройка сервовыхода',servoSave:'Записать изменения',servoCancel:'Отмена',servoReversed:'Реверс направления',servoSaving:'Запись',servoNoChanges:'Нет изменений',servoDone:'Подтверждено контроллером',servoWarning:'Перед записью сними пропеллер. Изменения могут немедленно повлиять на физические выходы.',servoInvalid:'Проверь целые значения и диапазон PWM 800–2200 µs; MIN ≤ TRIM ≤ MAX.',servoNoLink:'Подключи USB, дождись DISARMED и полной загрузки параметров.',batteryIntro:'Контроль напряжения, тока и параметров батареи. Калибровочные коэффициенты устанавливай по измерениям мультиметра.',batterySettings:'Параметры Battery Monitor',batteryNote:'Некоторые изменения BATT_MONITOR и датчиков вступают в силу только после перезагрузки.',compassIntro:'Магнитометр и его калибровка. Если в конфигурации без GPS компас выключен, включать его ради этой процедуры не требуется.',compassCal:'Калибровка магнитометра',compassHelp:'Медленно вращай аппарат вокруг трёх осей, пока полётник не сообщит об успехе. Нажми «Сохранить результат» после успешного отчёта.',compassStart:'Начать калибровку',fitnessLabel:'Точность калибровки',fitnessFast:'Быстрая · 32 (мягкий порог)',fitnessNormal:'Обычная · 16 (стандарт)',fitnessAccurate:'Точная · 8 (строгий порог)',fitnessVeryAccurate:'Очень точная · 4 (очень строгий)',fitnessExplanation:'Меньше COMPASS_CAL_FIT — выше строгость результата, а не обязательно меньше времени. Режим будет записан на контроллер с проверкой.',fitnessNoParam:'COMPASS_CAL_FIT отсутствует в считанных параметрах. Невозможно применить выбранную точность.',fitnessRetry:'Попытка не прошла критерий. Автопилот автоматически повторяет калибровку; продолжай поворачивать аппарат или нажми «Отмена».',compassAccept:'Сохранить результат',compassCancel:'Отмена',compassSettings:'Параметры компаса',compassNote:'Команда калибровки может быть отклонена, если компас не установлен, отключён или неисправен.',poses:['Горизонтально','Левый бок','Правый бок','Нос вниз','Нос вверх','На спине'],poseHelp:['Положи самолёт горизонтально, зафиксируй и не двигай.','Положи на левый бок и зафиксируй.','Положи на правый бок и зафиксируй.','Поверни носом вниз и зафиксируй.','Поверни носом вверх и зафиксируй.','Переверни на спину и зафиксируй.'],waiting:'Ожидание запроса от контроллера…',still:'Удерживай положение неподвижно, затем подтверди.',ack:'Команда принята полётником',done:'Успешно завершено по подтверждению полётника',failed:'Контроллер сообщил об ошибке',timeout:'Нет ответа от контроллера. Проверь сообщения и соединение.',need:'Подключи USB/MAVLink и дождись DISARMED, затем повтори.',demo:'DEMO / без реального подключения',sending:'Отправка MAVLink-команды…',next:'Ожидание следующего положения…',noServo:'НЕТ ТЕЛЕМЕТРИИ',edit:'Изменить',none:'Не загружено',calBusy:'Другая калибровка уже выполняется',notSaved:'Успешно, требуется подтвердить сохранение',cancelled:'Операция отменена',compassRunning:'Калибровка компаса выполняется',noParams:'Сначала загрузите параметры в основном разделе',batteryNow:'Данные от полётника',fromDemo:'ДЕМОНСТРАЦИЯ'},
 uk:{accelIntro:'Калібрування акселерометра через MAVLink. Зніми пропелер і перевір AHRS_ORIENTATION.',simpleTitle:'Просте калібрування',simpleInfo:'Розмісти літак горизонтально й нерухомо. Коригує зміщення акселерометра, а не повну геометрію.',startSimple:'Калібрувати (1 позиція)',sixTitle:'Повне 6-позиційне',sixInfo:'Автопілот запитує кожне положення. Розташуй літак і дочекайся нерухомості перед підтвердженням.',startSix:'Почати 6-позиційне',levelTitle:'Встановити горизонт',levelInfo:'Після калібрування встанови літак у положення горизонтального польоту. Корекція рівня до 10°.',setLevel:'Встановити рівень',wizard:'Майстер калібрування',requestedPose:'Запитане положення',waitRequest:'Очікування команди автопілота',confirmPose:'Положення встановлено',calSafe:'Калібрування можливе лише з USB/MAVLink та підтвердженим DISARMED. Демо нічого не записує.',diagAdvanced:'Діагностика MAVLink',servoBenchAdvanced:'Додатково: ручний PWM-тест',servoIntro:'Вихідні PWM та налаштування сервоприводів: FUNCTION, MIN, TRIM, MAX, REVERSED. Натисни «Налаштувати» для потрібного каналу. Ручний PWM-тест доступний тільки для допустимих функцій виходу.',servoChannels:'Вихідні канали / PWM',servoNote:'Обери «Налаштувати» на виході, щоб змінити FUNCTION, MIN, TRIM, MAX та REVERSED. Виходи можуть бути активними й у DISARM.',servoSetup:'Налаштувати',servoEditTitle:'Налаштування сервовиходу',servoSave:'Записати зміни',servoCancel:'Скасувати',servoReversed:'Реверс напрямку',servoSaving:'Запис',servoNoChanges:'Немає змін',servoDone:'Підтверджено контролером',servoWarning:'Перед записом зніми пропелер. Зміни можуть негайно вплинути на фізичні виходи.',servoInvalid:'Перевір цілі значення та PWM 800–2200 µs; MIN ≤ TRIM ≤ MAX.',servoNoLink:'Під’єднай USB, дочекайся DISARMED та повного списку параметрів.',batteryIntro:'Контроль напруги, струму і параметрів батареї. Калібрувальні коефіцієнти перевіряй мультиметром.',batterySettings:'Параметри Battery Monitor',batteryNote:'Деякі зміни BATT_MONITOR набирають чинності лише після перезавантаження.',compassIntro:'Магнітометр і його калібрування. Якщо компас вимкнений, не вмикай його лише заради цієї процедури.',compassCal:'Калібрування магнітометра',compassHelp:'Повільно обертай апарат навколо всіх осей. Після успішного звіту натисни «Зберегти результат».',compassStart:'Почати калібрування',fitnessLabel:'Точність калібрування',fitnessFast:'Швидка · 32 (м’який поріг)',fitnessNormal:'Звичайна · 16 (стандарт)',fitnessAccurate:'Точна · 8 (суворий поріг)',fitnessVeryAccurate:'Дуже точна · 4 (дуже суворий)',fitnessExplanation:'Менше COMPASS_CAL_FIT означає суворіший результат, але не обов’язково швидший час. Поріг буде записано на контролер із перевіркою.',fitnessNoParam:'COMPASS_CAL_FIT немає в отриманих параметрах. Обрану точність застосувати неможливо.',fitnessRetry:'Спроба не пройшла критерій. Автопілот повторює калібрування; продовжуй повертати апарат або натисни «Скасувати».',compassAccept:'Зберегти результат',compassCancel:'Скасувати',compassSettings:'Параметри компаса',compassNote:'Команду можуть відхилити, якщо компас відсутній або несправний.',poses:['Горизонтально','Лівий бік','Правий бік','Ніс донизу','Ніс догори','На спині'],poseHelp:['Поклади літак горизонтально та не рухай.','Поклади на лівий бік і зафіксуй.','Поклади на правий бік і зафіксуй.','Поверни носом донизу й зафіксуй.','Поверни носом догори й зафіксуй.','Переверни на спину й зафіксуй.'],waiting:'Очікування запиту від контролера…',still:'Тримай положення нерухомо, потім підтвердь.',ack:'Команду прийнято',done:'Успіх підтверджено контролером',failed:'Контролер повідомив про помилку',timeout:'Немає відповіді контролера. Перевір з’єднання.',need:'Під’єднай USB/MAVLink, дочекайся DISARMED.',demo:'DEMO / без реального з’єднання',sending:'Надсилання MAVLink…',next:'Очікування наступного положення…',noServo:'НЕМАЄ ТЕЛЕМЕТРІЇ',edit:'Змінити',none:'Не завантажено',calBusy:'Інше калібрування вже триває',notSaved:'Успішно, потрібно підтвердити збереження',cancelled:'Операцію скасовано',compassRunning:'Калібрування компаса триває',noParams:'Спочатку завантаж параметри',batteryNow:'Дані від контролера',fromDemo:'ДЕМОНСТРАЦІЯ'},
 en:{accelIntro:'Accelerometer calibration using MAVLink. Remove the propeller and verify AHRS_ORIENTATION before calibration.',simpleTitle:'Simple calibration',simpleInfo:'Place the aircraft level and keep it motionless. Calibrates offsets, not full six-axis geometry.',startSimple:'Calibrate (single pose)',sixTitle:'Full six-position',sixInfo:'The autopilot requests each position. Position the aircraft, hold still, then confirm.',startSix:'Start six-position',levelTitle:'Calibrate level',levelInfo:'After accel calibration, set the aircraft to its level-flight attitude. Trim correction is limited to 10°.',setLevel:'Set level',wizard:'Calibration wizard',requestedPose:'Requested position',waitRequest:'Waiting for autopilot command',confirmPose:'Position ready',calSafe:'All calibrations require a live USB/MAVLink connection and confirmed DISARMED state. DEMO never writes.',diagAdvanced:'MAVLink diagnostics',servoBenchAdvanced:'Advanced: manual PWM test',servoIntro:'Live PWM and servo configuration: FUNCTION, MIN, TRIM, MAX, REVERSED. Select Setup for the desired channel. Direct PWM is restricted to eligible servo functions.',servoChannels:'Output channels / PWM',servoNote:'Select Setup on any output to edit FUNCTION, MIN, TRIM, MAX and REVERSED. Outputs may remain active while DISARMED.',servoSetup:'Setup',servoEditTitle:'Servo output setup',servoSave:'Write changes',servoCancel:'Cancel',servoReversed:'Reverse direction',servoSaving:'Writing',servoNoChanges:'No changes',servoDone:'Confirmed by controller',servoWarning:'Remove the propeller. Changes can immediately affect physical outputs.',servoInvalid:'Enter integer PWM values between 800–2200 µs; MIN ≤ TRIM ≤ MAX.',servoNoLink:'Connect USB, wait for DISARMED and finish reading parameters.',batteryIntro:'Battery telemetry and monitor parameters. Calibrate sensor scaling against a multimeter.',batterySettings:'Battery Monitor parameters',batteryNote:'Some BATT_MONITOR settings require reboot to take effect.',compassIntro:'Magnetometer calibration. If compass is disabled in your NoGPS configuration, there is no need to enable it just for this page.',compassCal:'Magnetometer calibration',compassHelp:'Rotate the aircraft slowly around all axes. Once the autopilot reports success, accept the result.',compassStart:'Start calibration',fitnessLabel:'Calibration precision',fitnessFast:'Fast · 32 (relaxed fit)',fitnessNormal:'Normal · 16 (default)',fitnessAccurate:'Accurate · 8 (strict fit)',fitnessVeryAccurate:'Very accurate · 4 (very strict)',fitnessExplanation:'Lower COMPASS_CAL_FIT is stricter, not necessarily faster. The selected threshold is written with parameter readback.',fitnessNoParam:'COMPASS_CAL_FIT is missing from downloaded parameters. Cannot apply selected precision.',fitnessRetry:'Fit failed. The autopilot is retrying automatically; continue rotating or press Cancel.',compassAccept:'Accept and save',compassCancel:'Cancel',compassSettings:'Compass parameters',compassNote:'The autopilot may reject calibration when no enabled, healthy compass is present.',poses:['Level','Left side','Right side','Nose down','Nose up','Back / inverted'],poseHelp:['Place the aircraft level and keep it still.','Place on its left side and keep it still.','Place on its right side and keep it still.','Point the nose down and keep it still.','Point the nose up and keep it still.','Place inverted on its back and keep it still.'],waiting:'Waiting for autopilot position request…',still:'Keep the aircraft motionless, then confirm.',ack:'Command accepted by autopilot',done:'Successful completion confirmed by autopilot',failed:'Autopilot reported failure',timeout:'No response from autopilot. Check connection and system messages.',need:'Connect USB/MAVLink, wait for DISARMED, then retry.',demo:'DEMO / no hardware link',sending:'Sending MAVLink command…',next:'Waiting for next position…',noServo:'NO TELEMETRY',edit:'Edit',none:'Not loaded',calBusy:'Another calibration is in progress',notSaved:'Calibration succeeded; accept to save',cancelled:'Operation cancelled',compassRunning:'Compass calibration running',noParams:'Load parameters first',batteryNow:'Autopilot telemetry',fromDemo:'DEMO'}
};
let language='ru';const tt=k=>(lex[language]||lex.ru)[k]||k;
const accel={kind:null,status:'idle',requested:null,lastPos:null,completed:new Set(),timer:null,started:0,lastAck:null,lastMessage:'',firstRequest:false};
const mag={running:false,complete:false,autosaved:false,saving:false,qualityBusy:false,pct:0,lastResult:null,reported:new Map(),results:new Map(),timer:null,retryOnFailure:true,retries:0,lastRetryAt:0,startedAt:0};
const live={servos:new Array(16).fill(null),servoTime:0,current:null,remaining:null,consumed:null,batteryTime:0};
const positions=['◇','▱','◪','↓','↑','◆'];let paramRenderQueued=false;
const diagWords={
 ru:{init:'Сначала полётник калибрует гироскопы. Держи его неподвижно. После этого он должен запросить положение 1/6.',late:'Не получен запрос MAV_CMD_ACCELCAL_VEHICLE_POS (42429). Посмотри сообщения полётника: возможно, не прошла начальная калибровка гироскопов.',expired:'Калибровка не началась: за 60 секунд не пришёл запрос положения 42429. Проверь вкладку сообщений и перезапусти мастер.',localStop:'Мастер остановлен на сайте. На самом контроллере калибровка может ещё выполняться; при необходимости перезапусти его.',startStatus:'Команда отправлена, ожидаем ответ ArduPlane',ackStatus:'Ответ на начало калибровки',waitingStep:'Ожидаем новое положение от контроллера',reset:'Закрыть мастер'},
 uk:{init:'Спершу контролер калібрує гіроскопи. Тримай його нерухомо. Потім він має запросити положення 1/6.',late:'Не отримано запиту MAV_CMD_ACCELCAL_VEHICLE_POS (42429). Перевір повідомлення контролера: можливо, початкове калібрування гіроскопів не вдалося.',expired:'Калібрування не почалося: за 60 секунд немає запиту позиції 42429. Перевір повідомлення та запусти майстер знову.',localStop:'Майстер зупинено на сайті. Контролер може продовжувати калібрування; за потреби перезапусти його.',startStatus:'Команду надіслано, очікуємо ArduPlane',ackStatus:'Відповідь на початок калібрування',waitingStep:'Очікуємо наступне положення від контролера',reset:'Закрити майстер'},
 en:{init:'The autopilot first calibrates its gyros. Keep it motionless. It should then request pose 1/6.',late:'No MAV_CMD_ACCELCAL_VEHICLE_POS (42429) received. Check autopilot messages: preliminary gyro calibration may have failed.',expired:'No 42429 position request within 60 seconds. Check the MAVLink log and restart the wizard.',localStop:'Wizard closed locally. The autopilot may still be calibrating; reboot it if necessary.',startStatus:'Command sent; awaiting ArduPlane response',ackStatus:'Calibration start ACK',waitingStep:'Waiting for next pose from autopilot',reset:'Close wizard'}
};
const dd=k=>(diagWords[language]||diagWords.ru)[k];
const now=()=>Date.now();
function safe(){return api.canCalibrate();}
function status(el,text){$(el).textContent=text;}
function currentState(){return api.getState();}
function emit(text,bad=false){api.log('CAL: '+text,bad);}
function guard(){if(!safe()){emit(tt('need'),true);return false;}if(accel.kind||mag.running){emit(tt('calBusy'),true);return false;}return true;}
function detectedMagnetometer(){const s=currentState(),m=s.compassStatus;return !!(m&&m.present===true&&Date.now()-m.lastSeen>=0&&Date.now()-m.lastSeen<5500&&['COMPASS_USE','COMPASS_USE2','COMPASS_USE3'].some(key=>Number(s.params.get(key)?.value)>0));}
function clearAccelTimer(){if(accel.timer)clearTimeout(accel.timer);accel.timer=null;}
function armAccelTimer(){clearAccelTimer();const duration=accel.kind==='six'&&!accel.firstRequest?60000:accel.kind==='six'?240000:90000;accel.timer=setTimeout(()=>{if(accel.kind){status('accelDiagnostic',dd('expired'));markAccelResult(false,dd('expired'));}},duration);}
function markAccelResult(ok,info){const completedKind=accel.kind;clearAccelTimer();accel.kind=null;accel.requested=null;accel.status=ok?'done':'failed';status('accelStatus',info||tt(ok?'done':'failed'));emit(info||tt(ok?'done':'failed'),!ok);renderAccel();window.dispatchEvent(new CustomEvent('atlas:calibration',{detail:{kind:completedKind==='six'?'six':completedKind==='level'?'level':'accelerometer',status:ok?'done':'failed',verified:!!ok,info:info||''}}));}
async function startAccel(kind,p5){if(!guard())return;
 accel.kind=kind;accel.status='waiting';window.dispatchEvent(new CustomEvent('atlas:calibration',{detail:{kind:kind==='six'?'six':kind==='level'?'level':'accelerometer',status:'started',verified:false}}));accel.requested=null;accel.lastPos=null;accel.lastConfirmation=0;accel.completed.clear();accel.started=now();accel.firstRequest=false;accel.lastAck=null;accel.lastMessage='';renderAccel();status('accelStatus',dd('startStatus'));status('accelDiagnostic',kind==='six'?dd('init'):tt('sending'));armAccelTimer();
 try{await api.command(241,[0,0,0,0,p5,0,0]);status('accelStatus',dd('startStatus'));emit(`COMMAND_LONG 241 param5=${p5} sent; waiting for ACK/position`);}catch(e){markAccelResult(false,e.message);}}
async function confirmPosition(){if(accel.kind!=='six'||!Number.isInteger(accel.requested)||!safe()){emit(tt('need'),true);return;}const pos=accel.requested;accel.requested=null;accel.lastPos=pos;accel.lastConfirmation=now();accel.status='capturing';renderAccel();status('accelStatus',tt('next'));armAccelTimer();
 try{await api.command(42429,[pos,0,0,0,0,0,0]);emit(`ACCELCAL_VEHICLE_POS ${pos} confirmed`);}catch(e){markAccelResult(false,e.message);}}
function handleAccelPosition(p){const pos=Math.round(p.params[0]);if(!accel.kind||accel.kind!=='six')return;
 if(pos===16777215){accel.completed.add(accel.lastPos);markAccelResult(true);return;}
 if(pos===16777216){markAccelResult(false);return;}
 if(pos<1||pos>6)return;accel.firstRequest=true;status('accelDiagnostic',`MAV_CMD 42429 received: ${pos}/6`);
 if(accel.status==='capturing'&&accel.lastPos===pos&&now()-accel.lastConfirmation<1500)return;
 if(accel.lastPos!==null&&accel.lastPos!==pos)accel.completed.add(accel.lastPos);
 accel.requested=pos;accel.status='pose';armAccelTimer();renderAccel();status('accelStatus',tt('still'));emit(`Autopilot requests position ${pos}`);
}
function handleAck(d){if(d.command===241&&accel.kind){accel.lastAck=d.result;emit(`COMMAND_ACK 241 result=${d.result}`);status('accelDiagnostic',`${dd('ackStatus')}: MAV_RESULT=${d.result}`);if(d.result===0||d.result===5){if(accel.kind==='six'){if(accel.requested===null && accel.status!=='capturing'){accel.status='waiting';renderAccel();status('accelStatus',tt('waiting'));}}else if(d.result===0)markAccelResult(true);else {accel.status='waiting';renderAccel();}}else markAccelResult(false,`${tt('failed')} · MAV_RESULT=${d.result}`);}
 if(d.command===42424&&mag.running){if(d.result!==0&&d.result!==5){mag.running=false;mag.complete=false;status('compassStatus',`${tt('failed')} · MAV_RESULT=${d.result}`);window.dispatchEvent(new CustomEvent('atlas:calibration',{detail:{kind:'compass',status:'failed',verified:false,reason:'MAV_RESULT='+d.result}}));renderCompass();}}
 if(d.command===42425){if(d.result===0){mag.saving=true;status('compassStatus',tt('waiting'));}else{mag.saving=false;status('compassStatus',`${tt('failed')} · MAV_RESULT=${d.result}`);}renderCompass();}
 if(d.command===42426){mag.running=false;mag.complete=false;status('compassStatus',tt('cancelled'));window.dispatchEvent(new CustomEvent('atlas:calibration',{detail:{kind:'compass',status:'cancelled',verified:false}}));renderCompass();}
}
function renderAccel(){const s=currentState();
 const rx=api.diagnosticStats?.();if(rx&&$('accelRxStats'))$('accelRxStats').textContent=`RX OK ${rx.valid} · CRC FAIL ${rx.invalid} · COMMAND_LONG ${rx.commands} · POS(42429) ${rx.positionRequests} · ACK ${rx.acknowledgements} · TEXT ${rx.textMessages} · FC ${rx.sysid??'?'}:${rx.compid??'?'}`;
 let can=safe()&&!mag.running&&!accel.kind;for(const id of ['accSimpleBtn','accSixBtn','accLevelBtn'])$(id).disabled=!can;
 $('accConfirmPosBtn').disabled=!(accel.kind==='six'&&accel.requested!==null&&safe());$('accAbortBtn').hidden=!accel.kind;
 $('accelLiveBadge').textContent=s.demo?tt('demo'):safe()?'USB / DISARMED':s.armed===true?'ARMED / BLOCKED':'USB / DISARM REQUIRED';
 const pos=accel.requested;status('accelStage',accel.kind?accel.status.toUpperCase():accel.status.toUpperCase());status('accelPoseLabel',pos?`${pos}/6 · ${tt('poses')[pos-1]}`:'—');
 status('accelPoseIcon',pos?positions[pos-1]:'◇');status('accelPoseHint',pos?tt('poseHelp')[pos-1]:accel.kind===null?tt('waitRequest'):tt('waiting'));
 const wrap=$('accelSteps');wrap.replaceChildren();for(let i=1;i<=6;i++){const b=document.createElement('span');b.className='cal-step-dot'+(accel.requested===i?' current':accel.completed.has(i)?' done':'');b.textContent=`${i} · ${tt('poses')[i-1]}`;wrap.append(b);}
}
const monitored=['BATT_MONITOR','BATT_CAPACITY','BATT_VOLT_PIN','BATT_CURR_PIN','BATT_VOLT_MULT','BATT_AMP_PERVLT','BATT_AMP_OFFSET','BATT_LOW_VOLT','BATT_CRT_VOLT','BATT_FS_LOW_ACT','BATT2_MONITOR'];
const magnets=['COMPASS_USE','COMPASS_USE2','COMPASS_USE3','COMPASS_ENABLE','COMPASS_ORIENT','COMPASS_EXTERN2','COMPASS_OFS_X','COMPASS_OFS_Y','COMPASS_OFS_Z','COMPASS_DEC'];
function drawParams(target,keys){const grid=$(target);grid.replaceChildren();const s=currentState();const params=s.params;let count=0;
 for(const key of keys){const v=params.get(key);if(!v&&!s.demo)continue;count++;
  const row=document.createElement('div');row.className='cal-param-row';const left=document.createElement('div');const name=document.createElement('code');name.textContent=key;const tag=document.createElement('small');tag.textContent=/VOLT|AMP|CAPACITY|LOW|CRT/.test(key)?'POWER SENSOR':'FLIGHT CONTROLLER';left.append(name,tag);
  const right=document.createElement('div');const val=document.createElement('b');val.textContent=v?Number(v.value.toPrecision(7)).toString():'—';const btn=document.createElement('button');btn.type='button';btn.textContent=tt('edit');btn.disabled=!v||!safe();btn.addEventListener('click',()=>api.editParam(key));right.append(val,btn);row.append(left,right);grid.append(row);
 }
 if(!count){const notice=document.createElement('p');notice.className='cc-under-panel';notice.textContent=tt('noParams');grid.append(notice);}
}
let servoEditing=null,servoIsSaving=false;
const servoFields=['FUNCTION','MIN','TRIM','MAX','REVERSED'];
const servoFunctions={0:'Disabled',4:'Aileron',19:'Elevator',21:'Rudder',70:'Throttle',79:'VTail left',80:'VTail right'};
const servoRealtimeWords={
 ru:{on:'Применять сразу (реверс и PWM-пределы)',note:'При включении режима отправляются все накопленные REVERSED / MIN / TRIM / MAX; далее REVERSED — при щелчке, пределы — после изменения поля. Запись проверяется по PARAM_VALUE.',bench:'PWM BENCH TEST / Ручной выход',help:'Прямая команда PWM доступна только для FUNCTION 0, 1 и RC Passthrough. Для THROTTLE и V-tail не применяется; сайт не меняет FUNCTION автоматически.',consent:'Снят пропеллер; DISARMED; понимаю, что сигнал может немедленно запустить двигатель или двигать руль.',start:'Начать тест',stop:'Остановить / 1000 µs',direct:'Задать PWM',idle:'Тест выключен. При потере связи PWM может остаться на выходе: отключи питание ESC.',unsupported:'Для этой функции прямой PWM не поддерживается. Изменяй SERVOx_* или используй отдельную процедуру настройки ESC.',liveDone:'Изменение подтверждено полётником',liveError:'Ошибка мгновенной записи',benchStart:'Отправлена первая команда 1000 µs; двигай ползунок. Тест автоматически завершится через 30 с.',benchStop:'Отправлена команда 1000 µs. Проверь фактический выход и отключи питание ESC.',benchSent:'PWM отправлен. Ожидается физическая проверка / SERVO_OUTPUT_RAW.',benchTimeout:'30 с истекли — отправлена команда 1000 µs. Проверь сигнал.',busy:'Другая операция выполняется; повтори после подтверждения.'},
 uk:{on:'Застосовувати відразу (реверс і межі PWM)',note:'Під час увімкнення режиму надсилаються всі накопичені REVERSED / MIN / TRIM / MAX; далі REVERSED — під час перемикання, межі — після зміни поля. Запис підтверджується PARAM_VALUE.',bench:'PWM BENCH TEST / Ручний вихід',help:'Прямий PWM доступний лише для FUNCTION 0, 1 та RC Passthrough. Для THROTTLE і V-tail не використовується; сайт не змінює FUNCTION автоматично.',consent:'Пропелер знято; DISARMED; розумію, що сигнал може запустити двигун або зрушити руль.',start:'Почати тест',stop:'Зупинити / 1000 µs',direct:'Встановити PWM',idle:'Тест вимкнено. Після втрати зв’язку PWM може залишитись на виході: вимкни живлення ESC.',unsupported:'Для цієї функції прямий PWM не підтримується. Змінюй SERVOx_* або використовуй окреме калібрування ESC.',liveDone:'Зміну підтверджено контролером',liveError:'Помилка миттєвого запису',benchStart:'Надіслано 1000 µs; керуй повзунком. Тест автоматично завершується через 30 с.',benchStop:'Надіслано 1000 µs. Перевір фізичний вихід та вимкни живлення ESC.',benchSent:'PWM надіслано. Потрібна перевірка фізичного виходу або SERVO_OUTPUT_RAW.',benchTimeout:'Минуло 30 с — надіслано 1000 µs. Перевір вихід.',busy:'Інша операція триває; спробуй після підтвердження.'},
 en:{on:'Apply reverse and PWM limits immediately',note:'Enabling this mode sends all pending REVERSED / MIN / TRIM / MAX edits. Afterwards, REVERSED is sent on toggle and limits on field change; every write is checked via PARAM_VALUE.',bench:'PWM BENCH TEST / Direct output',help:'Direct PWM only works for FUNCTION 0, 1 and RC passthrough. THROTTLE and V-tail are not eligible; the website never reassigns FUNCTION automatically.',consent:'Propeller removed; FC DISARMED; I understand an output signal may start a motor or move a control surface.',start:'Start test',stop:'Stop / 1000 µs',direct:'Output PWM',idle:'Test inactive. PWM may persist on lost connection: disconnect ESC power.',unsupported:'Direct PWM is unsupported for this function. Edit SERVOx_* or use an ESC-specific procedure.',liveDone:'Controller confirmed the parameter change',liveError:'Immediate write failed',benchStart:'Initial 1000 µs command sent; move the slider. Test stops automatically after 30 s.',benchStop:'1000 µs command sent. Verify hardware output and disconnect ESC power.',benchSent:'PWM command sent, physical output / SERVO_OUTPUT_RAW still needs verification.',benchTimeout:'30 s elapsed — 1000 µs command sent. Check output.',busy:'Another write is active; retry after acknowledgment.'}
};
const rt=k=>(servoRealtimeWords[language]||servoRealtimeWords.ru)[k];
const directAllowed=fn=>Number.isInteger(fn)&&(fn===0||fn===1||(fn>=51&&fn<=66)||(fn>=140&&fn<=155));
let servoLiveBusy=false,servoSavePending=false;
const enqueueServoWrite=servoCore.createSerialQueue();
let benchActive=false,benchDeadline=0,benchPending=null,benchBusy=false,benchTimer=null,benchLastSent=1000,benchRequested=1000,benchAckTimer=null;
function isLiveEditor(){return servoEditing!==null&&$('servoLiveApply').checked&&safe();}
function updateRealtimeUi(){
 const channel=servoEditing,values=channel?servoValues(channel):{};
 const enabled=channel!==null&&safe()&&directAllowed(values.FUNCTION)&&!servoLiveBusy&&!servoIsSaving;
 $('servoBenchStart').disabled=!enabled||benchActive||!$('servoBenchConsent').checked;
 $('servoBenchStop').disabled=!benchActive;
 $('servoBenchSlider').disabled=!benchActive||!safe();
 $('servoBenchFunction').textContent=`FUNCTION=${values.FUNCTION??'—'}${directAllowed(values.FUNCTION)?' / DO_SET_SERVO':' / BLOCKED'}`;
 $('servoBenchHelp').textContent=directAllowed(values.FUNCTION)?rt('help'):rt('unsupported');
 $('servoBenchStart').title=directAllowed(values.FUNCTION)?'':(language==='ru'?'FUNCTION='+values.FUNCTION+': ручной PWM недоступен. Реверс и MIN/MAX меняются через PARAM_SET.':'FUNCTION='+values.FUNCTION+': direct PWM disabled; use PARAM_SET');
 $('servoLiveApplyLabel').textContent=rt('on');$('servoLiveApplyNote').textContent=rt('note');$('servoLiveApply').disabled=servoSavePending||servoIsSaving;
 if($('servoLiveDisabledHint')){$('servoLiveDisabledHint').hidden=$('servoLiveApply').checked;$('servoLiveDisabledHint').textContent=(language==='uk'?'Зміни ще НЕ надсилаються. Увімкни «Застосовувати відразу». Для THROTTLE ручний PWM через DO_SET_SERVO заблокований.':language==='en'?'Changes are NOT being sent. Enable “Apply immediately”. Direct DO_SET_SERVO PWM is blocked for THROTTLE.':'Изменения пока НЕ отправляются на контроллер. Включи «Применять сразу». Для газа (FUNCTION=70) прямой PWM-тест заблокирован.');}
 $('servoBenchTitle').textContent=rt('bench');$('servoBenchConsentLabel').textContent=rt('consent');
 $('servoBenchValueLabel').textContent=rt('direct');$('servoBenchStart').textContent=rt('start');$('servoBenchStop').textContent=rt('stop');
 $('servoBenchReadout').textContent=`${$('servoBenchSlider').value} µs`;
 const actual=channel?live.servos[channel-1]:null;
 $('servoBenchObserved').textContent=(channel&&now()-live.servoTime<6000&&Number.isFinite(actual)&&actual>0)?`SERVO_OUTPUT_RAW · SERVO${channel} = ${actual} µs`:'SERVO_OUTPUT_RAW: —';
}
async function realtimeParamChange(field){
 if(!isLiveEditor()||servoLiveBusy||benchActive||field==='FUNCTION')return;
 const validation=validateServoEditor();
 if(validation.error){$('servoEditorStatus').textContent='⚠ '+validation.error;return;}
 // ALL is used when Apply Immediately is enabled: flush every pending live-edit field,
 // not just the field that happened to fire the most recent change event.
 const changes=servoCore.selectLiveChanges(validation,field);
 if(!changes.length)return;
 const channel=servoEditing,updates=Object.fromEntries(changes);
 servoLiveBusy=true;servoIsSaving=true;updateRealtimeUi();
 const summary=changes.map(([key,value])=>`SERVO${channel}_${key} = ${value}`).join(', ');
 $('servoEditorStatus').textContent=`PARAM_SET ${summary}…`;
 try{
  await api.writeServoConfig(channel,updates);
  $('servoEditorStatus').textContent=`✓ ${rt('liveDone')} · ${changes.length} parameter(s)`;
 }catch(e){
  $('servoEditorStatus').textContent=`⚠ ${rt('liveError')}: ${e.message}`;
  const values=servoValues(channel);
  for(const [key] of changes){
   const value=values[key];
   if(key==='REVERSED')$('servoEditReverse').checked=Number(value)===1;
   else if(Number.isFinite(value))$('servoEdit'+key.charAt(0)+key.slice(1).toLowerCase()).value=String(value);
  }
  emit(`Live SERVO${channel}: ${e.message}`,true);
 }finally{servoLiveBusy=false;servoIsSaving=false;updateServoEditor();renderServo();updateRealtimeUi();}
}
function queueRealtime(field){
 if(!isLiveEditor()||servoSavePending)return;
 if(field==='ALL'){
  // Cancel pending debounce callbacks and commit the whole current draft once.
  for(const key of Object.keys(servoLiveDebounce)){clearTimeout(servoLiveDebounce[key]);delete servoLiveDebounce[key];}
 }
 // Immediate field writes and the Apply Immediately flush share one serial queue.
 enqueueServoWrite(()=>realtimeParamChange(field)).catch(e=>emit(e.message,true));
}
function benchCanSend(){const v=servoValues(servoEditing||0);return benchActive&&servoEditing!==null&&safe()&&$('servoBenchConsent').checked&&directAllowed(v.FUNCTION)&&!servoIsSaving&&!servoLiveBusy;}
function benchStopTimer(){if(benchTimer){clearTimeout(benchTimer);benchTimer=null;}}
async function benchSend(pwm){
 if(!benchCanSend())throw Error('Bench session / DISARM / FUNCTION guard failed');
 const ch=servoEditing;
 await api.sendServoPwm(ch,pwm);
 benchLastSent=pwm;
}
function queueBenchSend(pwm){
 if(!benchCanSend())return;
 benchRequested=pwm;
 if(benchBusy)return;
 benchBusy=true;
 const perform=async()=>{
  while(benchCanSend()&&benchRequested!==benchLastSent){
   const next=benchRequested;
   await benchSend(next);
   $('servoBenchStatus').textContent=`${rt('benchSent')} · SERVO${servoEditing} = ${next} µs`;
   await new Promise(r=>setTimeout(r,125));
  }
 };
 perform().catch(e=>{$('servoBenchStatus').textContent='⚠ '+e.message;stopBench('error');}).finally(()=>{benchBusy=false;if(benchCanSend()&&benchRequested!==benchLastSent)queueBenchSend(benchRequested);});
}
async function startBench(){
 if(benchActive||servoEditing===null||!safe()||!$('servoBenchConsent').checked||!directAllowed(servoValues(servoEditing).FUNCTION)||servoLiveBusy||servoIsSaving)return;
 benchActive=true;benchDeadline=Date.now()+30000;benchLastSent=-1;benchRequested=1000;$('servoBenchSlider').value='1000';updateRealtimeUi();
 try{
  await benchSend(1000);
  $('servoBenchStatus').textContent=rt('benchStart');
  benchTimer=setTimeout(()=>stopBench('timeout'),30000);
 }catch(e){$('servoBenchStatus').textContent='⚠ '+e.message;benchActive=false;updateRealtimeUi();}
}
function stopBench(reason='manual'){
 const ch=servoEditing,wasActive=benchActive;
 benchActive=false;benchStopTimer();benchRequested=1000;
 $('servoBenchSlider').value='1000';
 updateRealtimeUi();
 if(wasActive&&ch!==null&&safe()){
  // Best effort only. The physical output can retain its last value if the connection drops.
  api.sendServoPwm(ch,1000).then(()=>{$('servoBenchStatus').textContent=reason==='timeout'?rt('benchTimeout'):rt('benchStop');})
   .catch(e=>{$('servoBenchStatus').textContent='⚠ STOP: '+e.message+' — '+rt('idle');});
 }else $('servoBenchStatus').textContent=rt('idle');
}
function servoEditorClosed(){if(benchActive)stopBench('closed');for(const t of Object.values(servoLiveDebounce))clearTimeout(t);servoEditing=null;servoIsSaving=false;servoSavePending=false;benchStopTimer();}
$('servoLiveApply').addEventListener('change',()=>{if(benchActive)stopBench('mode');updateRealtimeUi();if($('servoLiveApply').checked)queueRealtime('ALL');});
$('servoBenchConsent').addEventListener('change',()=>{if(benchActive&&!$('servoBenchConsent').checked)stopBench('consent');updateRealtimeUi();});
$('servoBenchSlider').addEventListener('input',()=>{$('servoBenchReadout').textContent=`${$('servoBenchSlider').value} µs`;if(benchActive)queueBenchSend(Number($('servoBenchSlider').value));});
$('servoBenchStart').addEventListener('click',startBench);$('servoBenchStop').addEventListener('click',()=>stopBench('manual'));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&benchActive)stopBench('hidden');});
window.addEventListener('blur',()=>{if(benchActive)stopBench('blur');});
const servoLiveDebounce={};
for(const f of ['MIN','TRIM','MAX']){const input=$('servoEdit'+f.charAt(0)+f.slice(1).toLowerCase());input.addEventListener('input',()=>{clearTimeout(servoLiveDebounce[f]);servoLiveDebounce[f]=setTimeout(()=>queueRealtime(f),550);});input.addEventListener('change',()=>{clearTimeout(servoLiveDebounce[f]);queueRealtime(f);});}
$('servoEditReverse').addEventListener('change',()=>queueRealtime('REVERSED'));

function servoValues(channel){const p=currentState().params;const result={};for(const f of servoFields){result[f]=p.get(`SERVO${channel}_${f}`)?.value??null;}return result;}
function servoChanges(){if(servoEditing===null)return [];
 const current=servoValues(servoEditing);
 return servoFields.filter(f=>Number.isFinite(current[f])&&current[f]!==Number(f==='REVERSED'?$('servoEditReverse').checked:$('servoEdit'+f.charAt(0)+f.slice(1).toLowerCase()).value));
}
function captureServoDraft(){
 return {
  FUNCTION:$('servoEditFunction').value,
  MIN:$('servoEditMin').value,
  TRIM:$('servoEditTrim').value,
  MAX:$('servoEditMax').value,
  REVERSED:$('servoEditReverse').checked
 };
}
function validateServoDraft(channel,draft){
 if(!Number.isInteger(channel)||channel<1||channel>16)return {error:tt('servoNoLink')};
 const result=servoCore.validateDraft(channel,draft,currentState().params);
 if(result.error==='missing')return {error:result.name+' unavailable'};
 if(result.error)return {error:tt('servoInvalid')};
 return result;
}
function validateServoEditor(){
 if(servoEditing===null)return {error:tt('servoNoLink')};
 return validateServoDraft(servoEditing,captureServoDraft());
}
function updateServoEditor(){
 if(servoEditing===null)return;
 const check=validateServoEditor(),changes=check.changes||[],values=servoValues(servoEditing);
 const writerLocked=servoSavePending||(servoIsSaving&&!servoLiveBusy);
 $('servoEditorChanges').replaceChildren();
 if(check.error)$('servoEditorChanges').textContent=check.error;
 else if(!changes.length)$('servoEditorChanges').textContent=tt('servoNoChanges');
 else for(const [field,newValue] of changes){const el=document.createElement('div');el.textContent=`SERVO${servoEditing}_${field}: ${values[field]} → ${newValue}`;$('servoEditorChanges').append(el);}
 for(const field of ['FUNCTION','MIN','TRIM','MAX']){
  const input=$('servoEdit'+field.charAt(0)+field.slice(1).toLowerCase());
  input.disabled=writerLocked||!Number.isFinite(values[field]);
 }
 $('servoEditReverse').disabled=writerLocked||!Number.isFinite(values.REVERSED);
 $('servoLiveApply').disabled=servoSavePending||servoIsSaving;
 $('servoEditorSave').disabled=writerLocked||benchActive||!safe()||!!check.error||!changes.length||!('writeServoConfig' in api);
 $('servoEditorCancel').disabled=servoSavePending||servoIsSaving;
 $('servoEditorClose').disabled=servoSavePending||servoIsSaving;
}
function openServoEditor(n){if(servoIsSaving||benchActive)return;
 const s=currentState(),values=servoValues(n);
 if(!s.connected||s.demo||!safe()){emit(tt('servoNoLink'),true);return;}
 servoEditing=n;servoSavePending=false;benchActive=false;$('servoLiveApply').checked=false;$('servoBenchConsent').checked=false;$('servoBenchSlider').value='1000';$('servoBenchStatus').textContent=rt('idle');
 $('servoDialogTitle').textContent=`${tt('servoEditTitle')} · SERVO ${n}`;
 $('servoEditorInfo').textContent=`SERVO${n}_FUNCTION = ${values.FUNCTION??'—'}${servoFunctions[values.FUNCTION]?' / '+servoFunctions[values.FUNCTION]:''}`;
 for(const f of ['FUNCTION','MIN','TRIM','MAX']){const inp=$('servoEdit'+f.charAt(0)+f.slice(1).toLowerCase());inp.value=Number.isFinite(values[f])?String(values[f]):'';inp.disabled=!Number.isFinite(values[f]);}
 $('servoEditReverse').checked=Number(values.REVERSED)===1;$('servoEditReverse').disabled=!Number.isFinite(values.REVERSED);
 $('servoEditorStatus').textContent='';$('servoEditorWarning').textContent=tt('servoWarning');
 $('servoReverseLabel').textContent=tt('servoReversed');$('servoEditorSave').textContent=tt('servoSave');$('servoEditorCancel').textContent=tt('servoCancel');
 $('servoDialog').showModal();updateServoEditor();updateRealtimeUi();
}
function closeServoEditor(){if(servoIsSaving||servoSavePending)return;if(benchActive)stopBench('closed');$('servoDialog').close();servoEditorClosed();}
async function saveServoEditor(ev){
 ev.preventDefault();
 // A live REVERSED write may already be in flight. Queue the final form snapshot
 // behind it instead of dropping Apply or racing a second PARAM_SET transaction.
 if(servoSavePending||servoEditing===null||benchActive)return;
 const channel=servoEditing,draft=captureServoDraft(),initial=validateServoDraft(channel,draft);
 if(initial.error){updateServoEditor();return;}
 if(!initial.changes.length){updateServoEditor();return;}
 for(const timer of Object.values(servoLiveDebounce))clearTimeout(timer);
 servoSavePending=true;
 $('servoEditorCancel').disabled=true;$('servoEditorClose').disabled=true;
 updateServoEditor();updateRealtimeUi();
 try{
  await enqueueServoWrite(async()=>{
   if(servoEditing!==channel)throw Error('Servo editor was closed');
   if(!safe())throw Error(tt('servoNoLink'));
   const check=validateServoDraft(channel,draft);
   if(check.error)throw Error(check.error);
   if(!check.changes.length)return {done:0,total:0};
   servoIsSaving=true;updateServoEditor();updateRealtimeUi();
   return api.writeServoConfig(channel,Object.fromEntries(check.changes),(p)=>{
    $('servoEditorStatus').textContent=`${tt('servoSaving')}: ${p.done}/${p.total} · ${p.current||'OK'}`;
   });
  });
  const confirmed=validateServoDraft(channel,draft);
  if(confirmed.error||confirmed.changes.length)throw Error('Controller did not confirm every requested servo parameter');
  $('servoEditorStatus').textContent=`✓ ${tt('servoDone')} · ${initial.changes.length}/${initial.changes.length}`;
  emit(`SERVO ${channel}: ${initial.changes.length} requested change(s) confirmed by PARAM_VALUE`);
  $('servoDialog').close();servoEditorClosed();
 }catch(error){
  $('servoEditorStatus').textContent=`⚠ ${error.message}`;
  emit(`SERVO ${channel}: ${error.message}`,true);
 }finally{
  servoIsSaving=false;servoSavePending=false;
  $('servoEditorCancel').disabled=false;$('servoEditorClose').disabled=false;
  updateServoEditor();renderServo();updateRealtimeUi();
 }
}
function renderServo(){const s=currentState();const demo=s.demo;status('servoStatusBadge',demo?'DEMO / SIM':(s.connected&&live.servoTime&&now()-live.servoTime<6000)?'MAVLINK / LIVE':tt('noServo'));const wrap=$('servoGrid');wrap.replaceChildren();for(let n=1;n<=16;n++){
 const pwm=demo?Math.round(1500+250*Math.sin(now()/1300+n*.5)):live.servos[n-1];const p=s.params;
 const card=document.createElement('div');card.className='servo-channel';const head=document.createElement('div');head.className='servo-channel-head';const label=document.createElement('span');label.textContent=`SERVO ${n}`;const func=document.createElement('span');const functionCode=p.get(`SERVO${n}_FUNCTION`)?.value;func.textContent=`FN ${functionCode??'—'}${servoFunctions[functionCode]?' / '+servoFunctions[functionCode]:''}`;head.append(label,func);
 const value=document.createElement('b');value.textContent=Number.isFinite(pwm)&&pwm>0?`${pwm} µs`:'—';const bar=document.createElement('div');bar.className='servo-track';const fill=document.createElement('i');fill.style.width=Number.isFinite(pwm)&&pwm>0?Math.min(100,Math.max(0,(pwm-800)/1400*100))+'%':'0%';bar.append(fill);
 const footer=document.createElement('div');footer.className='servo-params';const limit=document.createElement('span');limit.textContent=`MIN ${p.get(`SERVO${n}_MIN`)?.value??'—'} · TRIM ${p.get(`SERVO${n}_TRIM`)?.value??'—'} · MAX ${p.get(`SERVO${n}_MAX`)?.value??'—'}`;
 const button=document.createElement('button');button.type='button';button.textContent=tt('servoSetup');button.disabled=!safe()||!p.has(`SERVO${n}_FUNCTION`)||servoIsSaving;button.addEventListener('click',()=>openServoEditor(n));footer.append(limit,button);
 const rev=document.createElement('span');rev.className='servo-reverse-tag';rev.textContent=Number(p.get(`SERVO${n}_REVERSED`)?.value)===1?'REV ON':'REV OFF';
 card.append(head,value,bar,footer,rev);wrap.append(card);
 }}
$('servoEditorForm').addEventListener('submit',saveServoEditor);
$('servoEditorClose').addEventListener('click',closeServoEditor);
$('servoEditorCancel').addEventListener('click',closeServoEditor);
$('servoDialog').addEventListener('cancel',ev=>{if(servoIsSaving)ev.preventDefault();else servoEditorClosed();});
for(const id of ['servoEditFunction','servoEditMin','servoEditTrim','servoEditMax','servoEditReverse'])$(id).addEventListener('input',updateServoEditor);
function renderBattery(){const s=currentState();const demo=s.demo;const v=demo?23.4:s.telemetry.voltage;const curr=demo?4.7:live.current;const pct=demo?78:live.remaining;const consumed=demo?2340:live.consumed;
 status('batteryVoltage',Number.isFinite(v)?v.toFixed(2)+' V':'—');status('batteryCurrent',Number.isFinite(curr)?curr.toFixed(2)+' A':'—');status('batteryPercent',Number.isFinite(pct)?pct+' %':'—');status('batteryConsumed',Number.isFinite(consumed)?Math.round(consumed)+' mAh':'—');status('batteryBadge',demo?tt('fromDemo'):live.batteryTime&&now()-live.batteryTime<10000?'BATTERY_STATUS / LIVE':s.connected?'SYS_STATUS / MAVLINK':'NO MAVLINK');}
function renderCompass(){const s=currentState();const can=safe()&&!accel.kind&&!mag.qualityBusy,physical=detectedMagnetometer();const reportDone=mag.complete;
 $('compassFitness').disabled=mag.running||mag.qualityBusy;
 $('compassStartBtn').disabled=!can||!physical||mag.running;
 $('compassAcceptBtn').disabled=!can||!reportDone||mag.autosaved||mag.saving;
 $('compassCancelBtn').disabled=!can||!mag.running;
 $('compassProgressBar').style.width=mag.pct+'%';status('compassProgressValue',Math.round(mag.pct)+'%');status('compassProgressText',mag.running?tt('compassRunning'):mag.complete?(mag.autosaved?tt('done'):tt('notSaved')):mag.lastResult||'NO DATA');status('compassBadge',s.demo?tt('demo'):safe()?'USB / DISARMED':'DISARM REQUIRED');}
async function startMag(){
 if(!guard()||!detectedMagnetometer()){emit('Magnetometer not confirmed by fresh SYS_STATUS',true);return;}
 const threshold=Number($('compassFitness').value);
 if(![4,8,16,32].includes(threshold)){status('compassStatus',tt('fitnessNoParam'));return;}
 const current=currentState().params.get('COMPASS_CAL_FIT');
 if(!current||!api.canWrite()){status('compassStatus',current?tt('servoNoLink'):tt('fitnessNoParam'));return;}
 mag.qualityBusy=true;renderCompass();status('compassStatus',tt('sending'));
 try{
  if(Math.abs(Number(current.value)-threshold)>1e-4){
   const write=await api.writeAdvancedParams({COMPASS_CAL_FIT:threshold});
   if(write.done!==1)throw Error('COMPASS_CAL_FIT: no confirmed PARAM_VALUE echo');
  }
  if(!safe()||!detectedMagnetometer())throw Error(tt('need'));
  mag.running=true;mag.complete=false;mag.autosaved=false;mag.saving=false;mag.pct=0;mag.retryOnFailure=true;mag.retries=0;mag.lastRetryAt=0;mag.startedAt=now();
  mag.reported.clear();mag.results.clear();mag.lastResult=null;
  window.dispatchEvent(new CustomEvent('atlas:calibration',{detail:{kind:'compass',status:'started',verified:false,fitness:threshold}}));
  // Autopilot retry-on-failure=1, autosave=1, autoreboot=0. No client-side forced retry loop.
  await api.command(42424,[0,1,1,0,0,0,0]);
  emit('MAV_CMD_DO_START_MAG_CAL retry=1 autosave=1 autoreboot=0 fit='+threshold);
  status('compassStatus',tt('compassRunning'));
 }catch(e){
  mag.running=false;mag.complete=false;
  status('compassStatus',e.message);
  window.dispatchEvent(new CustomEvent('atlas:calibration',{detail:{kind:'compass',status:'failed',verified:false,reason:e.message}}));
 }finally{mag.qualityBusy=false;renderCompass();}
}
async function acceptMag(){if(!safe()||!mag.complete||mag.autosaved)return;try{await api.command(42425,[0,0,0,0,0,0,0]);status('compassStatus',tt('sending'));}catch(e){status('compassStatus',e.message);}}
async function cancelMag(){if(!safe()||!mag.running)return;try{await api.command(42426,[0,0,0,0,0,0,0]);status('compassStatus',tt('sending'));}catch(e){status('compassStatus',e.message);}}
function magProgress(d){if(!mag.running)return;mag.reported.set(d.compassId,Math.min(100,d.pct));const counts=[...mag.reported.values()];mag.pct=counts.reduce((a,b)=>a+b,0)/counts.length;status('compassStatus',`${tt('compassRunning')} · #${d.compassId} · ${d.pct}%`);renderCompass();}
function magReport(d){
 if(!mag.running&&!mag.complete)return;
 const count=Math.max(1,Array.from({length:8},(_,i)=>(d.mask&(1<<i))?1:0).reduce((a,b)=>a+b,0));
 mag.results.set(d.compassId,{status:d.status,autosaved:d.autosaved});
 const entries=[...mag.results.values()],ok=entries.length>=count&&entries.every(x=>x.status===4),failed=entries.some(x=>x.status>=5);
 if(failed&&mag.running&&mag.retryOnFailure){
  // ArduPilot is already retrying. Repeated MAG_CAL_REPORT packets must not trigger an extra MAVLink START or terminal failure.
  if(now()-mag.lastRetryAt>2500){mag.retries++;mag.lastRetryAt=now();emit('MAG_CAL attempt failed; autopilot retry #'+mag.retries);}
  mag.results.clear();mag.reported.clear();mag.pct=0;mag.complete=false;
  mag.lastResult=tt('fitnessRetry');
  status('compassStatus',mag.lastResult);
  window.dispatchEvent(new CustomEvent('atlas:calibration',{detail:{kind:'compass',status:'retrying',verified:false,retries:mag.retries}}));
  renderCompass();return;
 }
 mag.reported.set(d.compassId,d.status===4?100:mag.pct);mag.pct=ok?100:Math.min(99,mag.pct);
 mag.complete=ok;mag.autosaved=ok&&entries.every(x=>x.autosaved);if(ok||failed)mag.running=false;
 if(mag.autosaved)mag.saving=false;
 mag.lastResult=`#${d.compassId} · cal_status ${d.status} · fitness ${d.fitness.toFixed(2)}`;
 status('compassStatus',failed?`${tt('failed')} · ${mag.lastResult}`:ok?(mag.autosaved?tt('done'):tt('notSaved')):tt('compassRunning'));
 if(!mag.running||failed)emit('MAG_CAL_REPORT '+mag.lastResult,failed);
 window.dispatchEvent(new CustomEvent('atlas:calibration',{detail:{kind:'compass',status:failed?'failed':ok?(mag.autosaved?'done':'awaiting-save'):'progress',verified:!!(ok&&mag.autosaved),autosaved:mag.autosaved,fitness:d.fitness,compassId:d.compassId}}));
 renderCompass();
}

function onMessage(evt){const d=evt.detail,s=currentState();if(s.sysid===null||d.sourceSysid!==s.sysid||!s.connected)return;
 if(d.type==='text'&&accel.kind){
  const msg=d.text.trim();if(msg){accel.lastMessage=msg;emit(`FC [${d.severity}]: ${msg}`,d.severity<=3);status('accelDiagnostic',`FC: ${msg}`);}
 }

 if(d.type==='command_long'&&d.command===42429)handleAccelPosition(d);
 else if(d.type==='ack')handleAck(d);
 else if(d.type==='ack'&&d.command===183){$('servoBenchStatus').textContent=`DO_SET_SERVO: MAV_RESULT=${d.result} · ${d.result===0?rt('benchSent'):rt('unsupported')}`;if(d.result!==0&&benchActive)stopBench('rejected');}
 else if(d.type==='servo_output'){const offset=d.port*8;for(let i=0;i<d.pwm.length;i++)if(offset+i<16)live.servos[offset+i]=d.pwm[i];live.servoTime=now();if(servoEditing!==null)updateRealtimeUi();}
 else if(d.type==='battery_status'&&d.id===0){live.current=d.current===-1?null:d.current/100;live.remaining=d.remaining<0?null:d.remaining;live.consumed=d.consumed<0?null:d.consumed;live.batteryTime=now();}
 else if(d.type==='mag_progress')magProgress(d);
 else if(d.type==='mag_report')magReport(d);
 else if(d.type==='param'&&!paramRenderQueued){paramRenderQueued=true;setTimeout(()=>{paramRenderQueued=false;if(document.querySelector('[data-panel="battery"].active'))drawParams('batteryParamGrid',monitored);if(document.querySelector('[data-panel="compass"].active'))drawParams('compassParamGrid',magnets);},400);}
}
function onState(){if(benchActive&&!safe())stopBench('connection');if(!currentState().connected){lastStreamRequest=0;if(accel.kind)markAccelResult(false,tt('need'));if(mag.running)window.dispatchEvent(new CustomEvent('atlas:calibration',{detail:{kind:'compass',status:'failed',verified:false,reason:'MAVLink disconnected'}}));mag.running=false;mag.complete=false;mag.saving=false;live.servos.fill(null);live.servoTime=0;live.current=null;live.remaining=null;live.consumed=null;live.batteryTime=0;}renderAll();if(servoEditing!==null)updateRealtimeUi();}
let lastStreamRequest=0;
async function requestTelemetry(){const s=currentState();if(!s.connected||s.sysid===null||lastStreamRequest===s.sysid)return;lastStreamRequest=s.sysid;
 for(const [id,interval] of [[36,200000],[147,1000000],[191,500000],[192,500000]]){try{await api.requestMessage(id,interval);}catch(e){emit('MAVLink stream '+id+': '+e.message,true);}}
}
function changeLanguage(){try{language=localStorage.getItem('atlas-language')||'ru';}catch{language='ru';}for(const el of document.querySelectorAll('[data-cal-t]'))el.textContent=tt(el.dataset.calT);$('accAbortBtn').textContent=dd('reset');
 renderAll();if(servoEditing!==null)updateRealtimeUi();}
function renderAll(){renderAccel();renderServo();renderBattery();renderCompass();drawParams('batteryParamGrid',monitored);drawParams('compassParamGrid',magnets);}
$('accSimpleBtn').addEventListener('click',()=>startAccel('simple',4));$('accSixBtn').addEventListener('click',()=>startAccel('six',1));$('accLevelBtn').addEventListener('click',()=>startAccel('level',2));$('accConfirmPosBtn').addEventListener('click',confirmPosition);
$('accAbortBtn').addEventListener('click',()=>{if(accel.kind){markAccelResult(false,dd('localStop'));}else{accel.status='idle';renderAccel();}status('accelDiagnostic',dd('localStop'));});
$('copyAccelDebug').addEventListener('click',async()=>{const data={time:new Date().toISOString(),mavlink:api.diagnosticStats?.(),calibration:{kind:accel.kind,status:accel.status,lastAck:accel.lastAck,requested:accel.requested,firstRequest:accel.firstRequest,lastMessage:accel.lastMessage},currentStatus:$('accelDiagnostic').textContent};const text=JSON.stringify(data,null,2);try{await navigator.clipboard.writeText(text);emit('Diagnostic copied');}catch{const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='atlas-accel-diagnostic.json';a.click();URL.revokeObjectURL(url);}});$('compassStartBtn').addEventListener('click',startMag);$('compassAcceptBtn').addEventListener('click',acceptMag);$('compassCancelBtn').addEventListener('click',cancelMag);
window.addEventListener('atlas:message',onMessage);window.addEventListener('atlas:state',onState);window.addEventListener('atlas:language',changeLanguage);
for(const b of document.querySelectorAll('.cc-calibration-menu [data-tab]'))b.addEventListener('click',()=>{if(b.dataset.tab==='servos'||b.dataset.tab==='battery'||b.dataset.tab==='compass')requestTelemetry();renderAll();});
// Light UI refresh; does not synthesize live values or send calibration commands.
setInterval(()=>{const s=currentState();if(s.connected&&s.sysid!==null)requestTelemetry();if(document.querySelector('[data-panel="servos"].active'))renderServo();if(benchActive){if(!benchCanSend())stopBench('link');else if(Date.now()>benchDeadline)stopBench('timeout');}if(document.querySelector('[data-panel="battery"].active'))renderBattery();if(document.querySelector('[data-panel="accelerometer"].active')){
   if(accel.kind==='six'&&!accel.firstRequest&&accel.started>0&&now()-accel.started>18000&&accel.lastAck===null){status('accelDiagnostic',dd('late'));}
   renderAccel();
  }if(document.querySelector('[data-panel="compass"].active')||$('compassStartBtn').closest('.qs-cal-dock'))renderCompass();},1250);
changeLanguage();
})();
