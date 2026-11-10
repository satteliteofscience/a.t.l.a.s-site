/* A.T.L.A.S. Control Center / pre-release */
(() => {
'use strict';
const M=window.AtlasMAV;
const $=id=>document.getElementById(id);
const words={
  ru:{atlasSupport:"Поддержать проект",faq:'Ответы на вопросы',changelog:'Список изменений',home:'← На сайт',workspace:'Конфигуратор',offline:'НЕ ПОДКЛЮЧЕН',online:'СОЕДИНЕНИЕ USB',demoStatus:'ДЕМОНСТРАЦИЯ',dashboard:'Полётные данные',basic:'Базовая настройка',params:'Список параметров',firmware:'Прошивка контроллера',maintenance:'ОБСЛУЖИВАНИЕ ПОЛЁТНОГО КОНТРОЛЛЕРА',calgroup:'КАЛИБРОВКА ПОЛЁТНОГО КОНТРОЛЛЕРА',accelerometer:'Акселерометр',experimental:'РЕЛИЗ 1.0 / ПРОВЕРЕНО',linktitle:'СОЕДИНЕНИЕ С КОНТРОЛЛЕРОМ',choose:'Выбери демонстрацию или подключи контроллер через USB',demo:'Демо',connect:'Подключить USB',disconnect:'Отключить USB',disconnectTcp:'Отключить TCP/UDP',estimator:'Фильтр AHRS',stopDemo:'Закрыть демо',safety:'Рабочий конфигуратор A.T.L.A.S. для поддерживаемых плат. Настраивай контроллер на земле; перед изменениями сними пропеллер. Режим DEMO никогда не записывает параметры в плату.',attitude:'Искусственный горизонт',status:'Состояние аппарата',vehicle:'Контроллер',arming:'ARM / DISARM',flightmode:'Режим',voltage:'Напряжение',altitude:'Высота',parameters:'Параметры',messages:'Сообщения системы',hudhelp:'Демонстрация использует искусственные данные. При USB-подключении горизонт отображает реальные MAVLink ATTITUDE, а скорость — VFR_HUD.',refresh:'Обновить параметры',basicInfo:'Параметры считываются с подключённого контроллера. Изменение разрешено только при DISARM; каждую запись необходимо подтвердить. В деморежиме редактирование отключено.',all:'Все',controls:'Управление',speed:'Скорость и тяга',security:'Защита',atlas:'A.T.L.A.S.',load:'Загрузить параметры',export:'Экспорт .param',import:'Импорт .param',parameter:'Параметр',value:'Значение',type:'Тип',action:'Действие',more:'Показать ещё',paramAdvanced:'Дополнительно · метаданные',importdiff:'Сравнение с импортированным файлом',importhelp:'Импорт используется для сравнения и поиска. Массовая запись параметров пока отключена для безопасности; каждое изменение можно подтвердить отдельно.',paramnotice:'Параметры с пометкой A.T.L.A.S. могут отсутствовать в стандартном ArduPlane. Часть настроек вступает в силу только после перезагрузки.',preview:'ПРЕДПРОСМОТР',stepboard:'Выбор платы',stepfile:'Файл прошивки',stepflash:'Установка',selectcontroller:'Полётный контроллер',boardwarn:'Выбирайте точную аппаратную ревизию. Название в каталоге само по себе не подтверждает совместимость бинарного файла.',apj:'Проверка .APJ',dropfile:'Перетащите файл .apj',browse:'или нажмите для выбора файла',flashdisclaimer:'Запись .apj через стандартный загрузчик ArduPilot пока отключена. Ниже доступна запись полного HEX через STM32 DFU; загрузчик не определяет модель платы автоматически — перед стиранием проверь маркировку и ревизию.',install:'Записать прошивку (пока недоступно)',mission:'Инструкция Mission Planner ↗',releases:'Сборки A.T.L.A.S.',footer:'НЕ ОФИЦИАЛЬНЫЙ ПРОДУКТ ARDUPILOT',newvalue:'Новое значение',editwarning:'Изменение конфигурации влияет на поведение автопилота. Перед записью снимите пропеллер и проверьте значение.',cancel:'Отмена',save:'Подтвердить запись',search:'Поиск по названию параметра...',edit:'Изменить',empty:'Подключи контроллер и загрузи параметры либо включи демонстрацию.',noParams:'Параметры ещё не загружены',simulation:'SIM / НЕ РЕАЛЬНЫЙ ПОЛЁТ',armed:'ARMED — ЗАПИСЬ ЗАПРЕЩЕНА',simArmed:'ARMED / SIM',disarmed:'DISARMED',unknown:'НЕИЗВЕСТНО',loading:'Чтение параметров...',connected:'Подключение установлено',nosupport:'Браузер не поддерживает Web Serial. Используй Chrome / Edge по HTTPS или localhost.',needlink:'Сначала подключите полётный контроллер.',selectvalid:'Нужно число с допустимой точностью.',noread:'Параметр ещё не получен с контроллера.',senderror:'Не удалось подтвердить запись параметра.',writesuccess:'Запись подтверждена контроллером',exportempty:'Нет загруженных параметров для экспорта.',imported:'Файл импортирован для сравнения',refreshdone:'Запрошен список параметров',nomatches:'Нет совпадений',pending:'Ожидается',notavailable:'Сборка не опубликована',compat:'Совместимость не подтверждена',metaBad:'Неверный файл .apj: ожидается JSON с image и board_id.',metaFound:'Файл прочитан; сверка с реальным bootloader board ID ещё не выполнена.',filename:'Файл',boardid:'BOARD ID',size:'Размер образа',format:'Формат',nofirmware:'Проверенные релизы пока не опубликованы',validating:'Проверка локального файла',error:'Ошибка',paramReq:'Контроллер не ответил на команду в отведённое время',saved:'Параметры загружены',saveNotLive:'В демонстрации запись отключена',boardWaiting:'Выбран контроллер: ',horizonMissing:'НЕТ ДАННЫХ С ДАТЧИКОВ',readTip:'Нажми «Загрузить параметры» после подключения USB',active:'АКТИВЕН',parameterImportDiff:'изменённые параметры',unsupported:'Режим чтения без сохранения',onlyDisarmed:'Запись доступна только при полученном DISARMED от полётного контроллера.',buttonBusy:'Запись...',project:'ATLAS'},
  uk:{atlasSupport:"Підтримати проєкт",faq:'Питання та відповіді',changelog:'Список змін',home:'← На сайт',workspace:'Конфігуратор',offline:'НЕ ПІДКЛЮЧЕНО',online:'USB З’ЄДНАННЯ',demoStatus:'ДЕМОНСТРАЦІЯ',dashboard:'Польотні дані',basic:'Основні налаштування',params:'Список параметрів',firmware:'Прошивання контролера',maintenance:'ОБСЛУГОВУВАННЯ ПОЛЬОТНОГО КОНТРОЛЕРА',calgroup:'КАЛІБРУВАННЯ ПОЛЬОТНОГО КОНТРОЛЕРА',accelerometer:'Акселерометр',experimental:'РЕЛІЗ 1.0 / ПЕРЕВІРЕНО',linktitle:'З’ЄДНАННЯ З КОНТРОЛЕРОМ',choose:'Обери демонстрацію або під’єднай контролер через USB',demo:'Демо',connect:'Підключити USB',disconnect:'Відключити USB',disconnectTcp:'Відключити TCP/UDP',estimator:'Фільтр AHRS',stopDemo:'Закрити демо',safety:'Робочий конфігуратор A.T.L.A.S. для підтримуваних плат. Налаштовуй контролер на землі; перед змінами зніми пропелер. Режим DEMO ніколи не записує параметри в плату.',attitude:'Штучний горизонт',status:'Стан апарата',vehicle:'Контролер',arming:'ARM / DISARM',flightmode:'Режим',voltage:'Напруга',altitude:'Висота',parameters:'Параметри',messages:'Повідомлення системи',hudhelp:'Демонстрація використовує штучні дані. Під час USB-з’єднання горизонт показує реальні MAVLink ATTITUDE, а швидкість — VFR_HUD.',refresh:'Оновити параметри',basicInfo:'Параметри зчитуються з під’єднаного контролера. Зміни дозволені лише в стані DISARM; кожен запис потрібно підтвердити. У деморежимі редагування вимкнено.',all:'Усі',controls:'Керування',speed:'Швидкість і тяга',security:'Захист',atlas:'A.T.L.A.S.',load:'Завантажити параметри',export:'Експорт .param',import:'Імпорт .param',parameter:'Параметр',value:'Значення',type:'Тип',action:'Дія',more:'Показати ще',paramAdvanced:'Додатково · метадані',importdiff:'Порівняння з імпортованим файлом',importhelp:'Імпорт слугує для порівняння та пошуку. Масовий запис вимкнений з міркувань безпеки; кожну зміну можна підтвердити окремо.',paramnotice:'Параметри A.T.L.A.S. можуть бути відсутні у звичайному ArduPlane. Частина налаштувань діє після перезавантаження.',preview:'ПОПЕРЕДНІЙ ПЕРЕГЛЯД',stepboard:'Вибір плати',stepfile:'Файл прошивки',stepflash:'Установлення',selectcontroller:'Польотний контролер',boardwarn:'Обирайте точну апаратну ревізію. Назва в каталозі не підтверджує сумісність бінарного файлу.',apj:'Перевірка .APJ',dropfile:'Перетягніть файл .apj',browse:'або натисніть для вибору',flashdisclaimer:'Прошивання .apj через стандартний завантажувач ArduPilot поки вимкнено. Нижче доступний запис повного HEX через STM32 DFU; завантажувач не визначає модель плати автоматично — перед стиранням перевір маркування та ревізію.',install:'Записати прошивку (недоступно)',mission:'Інструкція Mission Planner ↗',releases:'Збірки A.T.L.A.S.',footer:'НЕОФІЦІЙНИЙ ПРОДУКТ ARDUPILOT',newvalue:'Нове значення',editwarning:'Зміна конфігурації впливає на автопілот. Перед записом зніміть пропелер та перевірте значення.',cancel:'Скасувати',save:'Підтвердити запис',search:'Пошук за назвою параметра...',edit:'Змінити',empty:'Під’єднай контролер і завантаж параметри або ввімкни демонстрацію.',noParams:'Параметри ще не завантажені',simulation:'SIM / НЕ СПРАВЖНІЙ ПОЛІТ',armed:'ARMED — ЗАПИС ЗАБОРОНЕНО',simArmed:'ARMED / SIM',disarmed:'DISARMED',unknown:'НЕВІДОМО',loading:'Читання параметрів...',connected:'З’єднання встановлено',nosupport:'Браузер не підтримує Web Serial. Використайте Chrome / Edge через HTTPS або localhost.',needlink:'Спершу під’єднайте контролер.',selectvalid:'Потрібне коректне число.',noread:'Параметр ще не отримано.',senderror:'Не вдалося підтвердити запис параметра.',writesuccess:'Контролер підтвердив запис',exportempty:'Немає параметрів для експорту.',imported:'Файл імпортований для порівняння',refreshdone:'Запитано список параметрів',nomatches:'Немає збігів',pending:'Очікується',notavailable:'Збірку ще не опубліковано',compat:'Сумісність не підтверджено',metaBad:'Помилка .apj: очікується JSON із image та board_id.',metaFound:'Файл прочитаний; звірка з bootloader board ID ще не проводилась.',filename:'Файл',boardid:'BOARD ID',size:'Розмір образу',format:'Формат',nofirmware:'Перевірені релізи поки не опубліковані',validating:'Перевірка локального файлу',error:'Помилка',paramReq:'Контролер не відповів вчасно',saved:'Параметри завантажено',saveNotLive:'У демонстрації запис вимкнено',boardWaiting:'Обраний контролер: ',horizonMissing:'НЕМАЄ ДАНИХ ДАТЧИКІВ',readTip:'Натисни «Завантажити параметри» після підключення USB',active:'АКТИВНИЙ',parameterImportDiff:'змінені параметри',unsupported:'Лише читання без збереження',onlyDisarmed:'Запис доступний лише після підтвердженого DISARMED.',buttonBusy:'Запис...',project:'ATLAS'},
  en:{atlasSupport:"Support the project",faq:'FAQ',changelog:'Changelog',home:'← Main website',workspace:'Configurator',offline:'DISCONNECTED',online:'USB CONNECTED',demoStatus:'DEMO MODE',dashboard:'Flight Data',basic:'Basic Setup',params:'Parameter List',firmware:'Firmware Flasher',maintenance:'FLIGHT CONTROLLER MAINTENANCE',calgroup:'FLIGHT CONTROLLER CALIBRATION',accelerometer:'Accelerometer',experimental:'RELEASE 1.0 / VERIFIED',linktitle:'FLIGHT CONTROLLER CONNECTION',choose:'Choose demo mode or connect your controller via USB',demo:'Demo',connect:'Connect USB',disconnect:'Disconnect USB',disconnectTcp:'Disconnect TCP/UDP',estimator:'AHRS filter',stopDemo:'Exit demo',safety:'A.T.L.A.S. configurator for supported boards. Configure on the ground; remove the propeller before changing settings. DEMO never writes to the flight controller.',attitude:'Attitude Indicator',status:'Vehicle Status',vehicle:'Flight controller',arming:'ARM / DISARM',flightmode:'Flight Mode',voltage:'Voltage',altitude:'Altitude',parameters:'Parameters',messages:'System Messages',hudhelp:'Demo uses synthetic readings. When connected via USB, the attitude indicator uses live MAVLink ATTITUDE and airspeed uses VFR_HUD.',refresh:'Refresh Parameters',basicInfo:'Parameters are read from the connected controller. Writes require DISARM and explicit confirmation. Editing is disabled in demo mode.',all:'All',controls:'Flight Controls',speed:'Speed & Throttle',security:'Safety',atlas:'A.T.L.A.S.',load:'Load Parameters',export:'Export .param',import:'Import .param',parameter:'Parameter',value:'Value',type:'Type',action:'Action',more:'Show More',paramAdvanced:'Advanced · metadata',importdiff:'Compare with Imported File',importhelp:'Import is for comparison and search. Bulk writing is disabled for safety; confirm and write individual changes instead.',paramnotice:'A.T.L.A.S. parameters may be absent in stock ArduPlane. Some settings take effect only after a reboot.',preview:'PREVIEW ONLY',stepboard:'Select Board',stepfile:'Firmware File',stepflash:'Installation',selectcontroller:'Flight Controller',boardwarn:'Select the exact hardware revision. A catalog name alone does not prove that a binary is compatible.',apj:'.APJ Inspector',dropfile:'Drop an .apj file here',browse:'or click to select a file',flashdisclaimer:'ArduPilot .apj bootloader flashing remains disabled. Full-HEX STM32 ROM DFU is available below; the loader does not identify the board automatically, so verify the exact model and revision before erasing.',install:'Flash Firmware (Unavailable)',mission:'Mission Planner Guide ↗',releases:'A.T.L.A.S. Builds',footer:'NOT AN OFFICIAL ARDUPILOT PRODUCT',newvalue:'New Value',editwarning:'Changing flight-controller configuration affects aircraft behavior. Remove the propeller and verify the new value before applying.',cancel:'Cancel',save:'Confirm Write',search:'Search parameters by name...',edit:'Edit',empty:'Connect the controller and load parameters, or start the demo.',noParams:'No parameters loaded',simulation:'SIM / NOT LIVE FLIGHT',armed:'ARMED — WRITE LOCKED',simArmed:'ARMED / SIM',disarmed:'DISARMED',unknown:'UNKNOWN',loading:'Loading parameters...',connected:'Connection established',nosupport:'Web Serial unsupported. Use Chrome / Edge on HTTPS or localhost.',needlink:'Connect a controller first.',selectvalid:'Enter a valid numeric value.',noread:'The parameter has not been read from the controller.',senderror:'Could not verify parameter write.',writesuccess:'Write acknowledged by controller',exportempty:'No loaded parameters to export.',imported:'File loaded for comparison',refreshdone:'Requested parameter list',nomatches:'No matches',pending:'Pending',notavailable:'Build not published',compat:'Compatibility not confirmed',metaBad:'Invalid .apj: expected JSON containing image and board_id.',metaFound:'File parsed. Live bootloader board ID has not been checked.',filename:'Filename',boardid:'BOARD ID',size:'Image Size',format:'Format',nofirmware:'No verified public releases yet',validating:'Reading local file',error:'Error',paramReq:'Controller did not reply in time',saved:'Parameters loaded',saveNotLive:'Demo mode cannot write',boardWaiting:'Selected board: ',horizonMissing:'NO SENSOR DATA',readTip:'Click Load Parameters after connecting USB',active:'ACTIVE',parameterImportDiff:'changed parameters',unsupported:'Read-only preview',onlyDisarmed:'Writing is allowed only after a confirmed DISARMED heartbeat.',buttonBusy:'Writing...',project:'ATLAS'}
};

// Parameter-tree and batch-import vocabulary (Mission Planner-inspired, prefix-based grouping).
Object.assign(words.ru,{
 categoryAll:'Все параметры',categoryCore:'Система и плата',categoryFlight:'Управление и стабилизация',categorySpeed:'Скорость и TECS',categoryNav:'Навигация и миссии',categoryTakeoff:'Взлёт и посадка',categorySensors:'Датчики / EKF',categoryServo:'RC и сервоприводы',categoryPower:'Питание / двигатели',categorySafety:'Безопасность',categoryComms:'Телеметрия и порты',categoryOther:'Прочее',categoryLabel:'Категории параметров',writeImported:'Записать отличия в контроллер',cancelBatch:'Остановить запись',confirmBatch:'Я проверил изменения и сохранил резервную копию параметров',batchNote:'Записываются все отличающиеся параметры, которые присутствуют в текущем списке контроллера. Неизвестные параметры будут пропущены и перечислены в отчёте. Запись требует DISARMED.',batchEmpty:'Нет отличий для записи',batchStart:'Массовая запись началась',batchDone:'Запись завершена',batchStopped:'Запись остановлена',batchPartial:'Записано частично — проверь отчёт',batchNoLink:'Подключи USB, загрузи параметры и подтверди резервную копию',batchReadFirst:'Сначала получи параметры с контроллера',batchProgress:'Запись параметров',batchUnsupported:'Отсутствуют на этом контроллере',batchFailed:'Не удалось записать',batchSaved:'Подтверждено',batchConsent:'Подтверди проверку перед записью',resumeLoad:'Дочитать отсутствующие',servoTitle:'Выходы сервоприводов',batteryTitle:'Монитор батареи',compassTitle:'Компас',
});
Object.assign(words.uk,{
 categoryAll:'Усі параметри',categoryCore:'Система і плата',categoryFlight:'Керування та стабілізація',categorySpeed:'Швидкість і TECS',categoryNav:'Навігація та місії',categoryTakeoff:'Зліт і посадка',categorySensors:'Датчики / EKF',categoryServo:'RC і сервоприводи',categoryPower:'Живлення / двигуни',categorySafety:'Безпека',categoryComms:'Телеметрія і порти',categoryOther:'Інше',categoryLabel:'Категорії параметрів',writeImported:'Записати відмінності у контролер',cancelBatch:'Зупинити запис',confirmBatch:'Я перевірив зміни і зберіг резервну копію параметрів',batchNote:'Записуються всі відмінні параметри, наявні у поточному списку контролера. Невідомі параметри пропускаються та зазначаються у звіті. Запис лише DISARMED.',batchEmpty:'Немає відмінностей для запису',batchStart:'Пакетний запис розпочато',batchDone:'Запис завершено',batchStopped:'Запис зупинено',batchPartial:'Запис частковий — перевір звіт',batchNoLink:'Під’єднай USB, завантаж параметри і підтвердь резервну копію',batchReadFirst:'Спочатку прочитай параметри з контролера',batchProgress:'Запис параметрів',batchUnsupported:'Відсутні на цьому контролері',batchFailed:'Не вдалося записати',batchSaved:'Підтверджено',batchConsent:'Підтверди перевірку перед записом',resumeLoad:'Дочитати відсутні',servoTitle:'Виходи сервоприводів',batteryTitle:'Монітор батареї',compassTitle:'Компас',
});
Object.assign(words.en,{
 categoryAll:'All parameters',categoryCore:'System / board',categoryFlight:'Flight control',categorySpeed:'Airspeed and TECS',categoryNav:'Navigation / missions',categoryTakeoff:'Takeoff / landing',categorySensors:'Sensors / EKF',categoryServo:'RC and servo outputs',categoryPower:'Power / motors',categorySafety:'Failsafes / safety',categoryComms:'Telemetry / serial ports',categoryOther:'Other',categoryLabel:'Parameter categories',writeImported:'Write differences to controller',cancelBatch:'Stop writing',confirmBatch:'I reviewed the changes and saved a parameter backup',batchNote:'Writes all differing parameters that exist in the current vehicle parameter list. Unknown parameters are skipped and reported. DISARMED required.',batchEmpty:'No changes to write',batchStart:'Batch parameter write started',batchDone:'Write complete',batchStopped:'Write stopped',batchPartial:'Partially written — see report',batchNoLink:'Connect USB, load parameters and confirm backup',batchReadFirst:'Read vehicle parameters first',batchProgress:'Writing parameters',batchUnsupported:'Not available on this controller',batchFailed:'Could not write',batchSaved:'Confirmed',batchConsent:'Confirm review before writing',resumeLoad:'Fetch missing entries',servoTitle:'Servo Outputs',batteryTitle:'Battery Monitor',compassTitle:'Compass',
});
const categoryDefs=[['all','categoryAll'],['core','categoryCore'],['flight','categoryFlight'],['speed','categorySpeed'],['nav','categoryNav'],['takeoff','categoryTakeoff'],['sensors','categorySensors'],['servo','categoryServo'],['power','categoryPower'],['safety','categorySafety'],['comms','categoryComms'],['other','categoryOther']];
// Categories reflect parameter names, not authoritative metadata; preserve full list and search.
function parameterCategory(name){
 if(/^(FS_|FENCE_|ARMING_|STALL_|FLIGHT_OPTIONS|TERRAIN_|AFS_|THR_FAILSAFE|BATT_FS_|RC_FS_)/.test(name))return 'safety';
 if(/^(TKOFF_|LAND_|FLARE_|LANDING_|Q_LAND_|Q_TKOFF_)/.test(name))return 'takeoff';
 if(/^(COMPASS_|GPS_|EK[23]_|INS_|AHRS_|ARSPD_|BARO_|RNGFND_|FLOW_|GND_|OF_|SENS_)/.test(name))return 'sensors';
 if(/^(BATT|MOT_|ESC_|Q_M_|Q_MOT_|POWER_|VOLT_|CURR_)/.test(name))return 'power';
 if(/^(SERVO\d+_|RC\d+_|RCMAP_|RC_OPTIONS|ELEVON_|VTAIL_|MIXING_|DSPOILR_|KFF_RDDRMIX)/.test(name))return 'servo';
 if(/^(SERIAL|SR\d|MAV|OSD|RSSI_|RLY|RELAY|CAN_|NTF_|ADSB_|BRD_CAN|LOG_|LOGGING_|GCS_|SCR_|LUA_)/.test(name))return 'comms';
 if(/^(TECS_|AIRSPEED_|THR_|TRIM_ARSPD|TRIM_THROTTLE|PTCH2SRV_|RLL2SRV_|YAW2SRV_)/.test(name))return 'speed';
 if(/^(WP_|NAV_|RTL_|LOIT_|CIRCLE_|MIS_|AUTO_|RALLY_|HOME_|CRUISE_)/.test(name))return 'nav';
 if(/^(ROLL_|PITCH_|YAW_|RUD_|KFF_|PTCH_|RLL_|ACRO_|FBWA_|AUTOTUNE_|STAB_|Q_A_)/.test(name))return 'flight';
 if(/^(SYSID_|BRD_|SCHED_|FORMAT_|FRAME_|Q_ENABLE|Q_FRAME_|GND_|ARM_|STAT_|INITIAL_|PARAM_|WPNAV_|INS_LOG_)/.test(name))return 'core';
 return 'other';
}

let lang='ru';try{let saved=localStorage.getItem('atlas-language');if(words[saved])lang=saved;}catch{}
const tr=(k)=>words[lang]?.[k]||words.ru[k]||k;
const state={demo:false,connected:false,connecting:false,transport:null,netSocket:null,bridgeReady:false,lastVoltageTelemetry:0,port:null,reader:null,rxActive:false,sysid:null,compid:1,seq:0,armed:null,lastHeartbeat:0,heartbeatStale:false,lastVfr:0,streamStart:0,vfrFallbackSent:false,telemetry:{roll:null,pitch:null,yaw:null,airspeed:null,altitude:null,throttle:null,voltage:null},mode:null,compassStatus:null,params:new Map(),paramCount:null,paramLoading:false,paramTransfer:null,paramRepairTimer:null,ftpClient:null,activeFilter:null,selectedBoard:'cube-orange-plus',boards:[],selectedTab:'dashboard',group:'all',paramCategory:'all',treeSelection:'ALL',tableLimit:150,imported:null,importedText:null,importReport:null,readTwoBusy:false,bulk:null,bulkCancel:false,servoConfigBusy:false,editName:null,writeWait:null,streamTimer:null,renderTimer:0,txPromise:Promise.resolve(),logCount:0,statusTextAssembler:null,apj:null,apjFilename:null,pageLeaving:false,hudLoopActive:true,hudRaf:0};
state.statusTextAssembler=new window.AtlasStatusTextCore.Assembler();
window.AtlasLanguage=()=>lang;
window.AtlasSelectedBoard=()=>state.selectedBoard;
const settingDefs=[
 {key:'ROLL_LIMIT_DEG',group:'control',desc:['Ограничение крена в обычном FBWA','Обмеження крену у FBWA','Bank limit in standard FBWA']},
 {key:'PITCH_MAX',group:'control',desc:['Максимальный тангаж','Максимальний тангаж','Maximum pitch angle']},
 {key:'PITCH_MIN',group:'control',desc:['Минимальный тангаж','Мінімальний тангаж','Minimum pitch angle']},
 {key:'AIRSPEED_MIN',group:'speed',desc:['Минимальная воздушная скорость','Мінімальна повітряна швидкість','Minimum airspeed']},
 {key:'AIRSPEED_MAX',group:'speed',desc:['Максимальная воздушная скорость','Максимальна повітряна швидкість','Maximum airspeed']},
 {key:'TRIM_ARSPD_CM',group:'speed',desc:['Крейсерская скорость × 100','Крейсерська швидкість × 100','Cruise airspeed × 100']},
 {key:'THR_MIN',group:'speed',desc:['Нижний предел газа','Нижня межа газу','Minimum throttle']},
 {key:'THR_MAX',group:'speed',desc:['Верхний предел газа','Верхня межа газу','Maximum throttle']},
 {key:'STALL_PREVENTION',group:'safety',desc:['Защита от сваливания','Захист від звалювання','Stall prevention']},
 {key:'FS_LONG_ACTN',group:'safety',desc:['Действие длительного failsafe','Дія тривалого failsafe','Long failsafe action']},
 {key:'ARSPD_USE',group:'safety',desc:['Использование Пито','Використання трубки Піто','Use airspeed sensor']},
 {key:'RUD_LIMIT_DEG',group:'atlas',desc:['Дополнительный крен FBWA от рудера','Додатковий крен FBWA від керма напряму','FBWA additional bank from rudder']},
 {key:'EK3_PRIMARY',group:'atlas',desc:['Основное ядро EKF3','Основне ядро EKF3','Primary EKF3 core']},
 {key:'EK3_IMU_MASK',group:'atlas',desc:['Маска IMU для EKF3','Маска IMU для EKF3','EKF3 IMU mask']}
];
const modes={0:'MANUAL',1:'CIRCLE',2:'STABILIZE',3:'TRAINING',4:'ACRO',5:'FBWA',6:'FBWB',7:'CRUISE',8:'AUTOTUNE',10:'AUTO',11:'RTL',12:'LOITER',13:'TAKEOFF',14:'AVOID_ADSB',15:'GUIDED',17:'QSTABILIZE',18:'QHOVER',19:'QLOITER',20:'QLAND',21:'QRTL',22:'QAUTOTUNE',23:'QACRO'};
const cleanNum=(n,dec=2)=>Number.isFinite(n)?Number(n).toFixed(dec):'—';
function log(msg,warn=false,meta=null){
 const tm=new Date().toLocaleTimeString('ru-RU',{hour12:false});
 const row=document.createElement('div');
 row.className='cc-event'+(warn?' warn':'')+(meta?.source==='fc'?' cc-event-fc':'');
 const time=document.createElement('time');time.textContent=tm;
 const body=document.createElement('span');
 if(meta?.source==='fc'){
  row.dataset.source='fc';row.dataset.severity=String(meta.severity);
  const tag=document.createElement('strong');tag.className='cc-event-tag';
  tag.textContent='FC · '+meta.level;
  body.append(tag,document.createTextNode(' '+msg));
 }else body.textContent=msg;
 row.append(time,body);
 const events=$('events');events.prepend(row);
 // Keep a useful scrollback without unbounded DOM growth from periodic INFO.
 while(events.children.length>150)events.lastChild.remove();
 state.logCount++;$('logCounter').textContent=`${state.logCount} EVENTS`;
}
function toast(message,warning=false){log(message,warning);}
function setLang(next){if(!words[next])return;lang=next;try{localStorage.setItem('atlas-language',lang);}catch{};document.documentElement.lang=next;
 document.querySelectorAll('[data-t]').forEach(el=>{let k=el.dataset.t;if(words[lang][k])el.textContent=tr(k);});document.querySelectorAll('[data-ph]').forEach(el=>el.placeholder=tr(el.dataset.ph));
 document.querySelectorAll('[data-language]').forEach(el=>{el.classList.toggle('active',el.dataset.language===next);el.setAttribute('aria-pressed',String(el.dataset.language===next));});
 $('twoPassParamsBtn').textContent=(readTwoLex[next]||readTwoLex.ru).button;
 updateNetworkLabels();
 updateConnectionUI();renderBasic();renderParams();renderBoards();renderReleases();updateTelemetryUI();renderImportDiff();renderCategoryNav();showProgress();window.dispatchEvent(new Event('atlas:language'));
}
function navigate(tab){
 if(!['dashboard','quicksetup','basic','params','firmware','accelerometer','servos','battery','compass','temperature','osd','tuning','mavftp','modes','radio','joystick','gimbal','parachute'].includes(tab))return;
 const previous=state.selectedTab;
 state.selectedTab=tab;
 document.body.classList.toggle('cc-quick-setup',tab==='quicksetup');
 window.dispatchEvent(new CustomEvent('atlas:navigate',{detail:{tab}}));
 document.querySelectorAll('.cc-tab').forEach(el=>el.classList.toggle('active',el.dataset.panel===tab));
 document.querySelectorAll('.cc-nav').forEach(el=>{let active=el.dataset.tab===tab;el.classList.toggle('active',active);el.setAttribute('aria-current',active?'page':'false');});
 scheduleHorizon();
 window.location.hash=tab;
 // The first heartbeat already fetches the full parameter list.
 // Reopening Parameter List must show the cached data, not force another
 // expensive download over the radio. Explicit Refresh remains available.
 if(tab==='params'&&previous!=='params'){renderParams();showProgress();}
 if(state.params.size===0&&!state.paramTransfer&&
    (tab==='params'||['servos','osd','tuning','modes','radio','gimbal','parachute','temperature'].includes(tab))&&
    state.connected&&state.sysid!==null&&!state.paramLoading&&!state.bulk?.running&&!state.servoConfigBusy){
   startParamLoad(false);
 }
}
function heartbeatLive(now=Date.now()){
 return state.connected&&state.sysid!==null&&state.lastHeartbeat>0&&now-state.lastHeartbeat>=0&&now-state.lastHeartbeat<7000;
}
function updateConnectionUI(){
 const connected=state.connected,live=heartbeatLive(),demo=state.demo;
 $('connectionPill').classList.toggle('online',live);
 $('connectionPill').classList.toggle('demo',demo);
 $('connectionLabel').textContent=connected&&!live?(state.sysid!==null?'MAVLINK TIMEOUT':'WAITING FOR MAVLINK'):
   live?(state.transport==='bridge'?'UDP/TCP · MAVLINK':tr('online')):tr(demo?'demoStatus':'offline');
 $('connectBtnText').textContent=connected&&state.transport==='bridge'?tr('disconnectTcp'):tr(connected?'disconnect':'connect');
 $('connectBtn').title=connected&&state.transport==='bridge'?'TCP/UDP MAVLink · '+$('networkHost').value+':'+$('networkPort').value:'';
 $('demoBtn').lastElementChild.textContent=tr(demo?'stopDemo':'demo');
 $('linkSubtitle').textContent=connected?
   (live?`${tr('connected')} · ${state.transport==='bridge'?'UDP/TCP':'USB'} · sys ${state.sysid}`:
     `${state.transport==='bridge'?'UDP/TCP':'USB'} · ${state.sysid!==null?'HEARTBEAT LOST':'WAITING HEARTBEAT'}`):tr('choose');
 $('flightSource').textContent=live?'MAVLINK / LIVE':demo?'DEMO / SIMULATION':'NO DATA';
 $('hudSource').textContent=live?'ATTITUDE / MAVLINK':demo?'ATTITUDE / SYNTHETIC':'NO TELEMETRY';
 $('hudWatermark').textContent=live?'LIVE MAVLINK':demo?'SIMULATED DATA':connected?'WAITING FOR FC':'WAITING FOR FC';
 $('connectBtn').disabled=state.connecting;
 const net=$('networkConnectBtn');if(net)net.disabled=state.connecting;
 updateNetworkLabels();
}
function formatParam(n){return Number.isFinite(n)?(Number.isInteger(n)?String(n):Number(n.toPrecision(7)).toString()):'—';}
const paramLex={
 ru:{waiting:'Ожидание первого PARAM_VALUE…',receiving:'Загрузка параметров',repair:'Восстанавливаются пропущенные параметры',done:'Получен полный список параметров',partial:'Получен неполный список. Повтори загрузку или проверь связь USB.',idle:'Нажми «Загрузить параметры» после соединения.',retry:'Повторяем запрос списка параметров…',noReply:'Нет ответа PARAM_VALUE от контроллера.'},
 uk:{waiting:'Очікування першого PARAM_VALUE…',receiving:'Завантаження параметрів',repair:'Повторний запит пропущених параметрів',done:'Отримано повний список параметрів',partial:'Неповний список. Повтори завантаження або перевір USB.',idle:'Натисни «Завантажити параметри» після з’єднання.',retry:'Повторюємо запит списку параметрів…',noReply:'Немає відповіді PARAM_VALUE від контролера.'},
 en:{waiting:'Waiting for first PARAM_VALUE…',receiving:'Downloading parameters',repair:'Recovering missing parameters',done:'Full parameter list received',partial:'Incomplete parameter list. Retry or check USB connection.',idle:'Click Load Parameters after connecting.',retry:'Retrying parameter list request…',noReply:'No PARAM_VALUE response from controller.'}
};
const pl=(k)=>(paramLex[lang]||paramLex.ru)[k]||k;
function showProgress(){
 const x=state.paramTransfer,total=state.paramCount;
 const known=x&&Number.isInteger(total)?x.seen.size:state.params.size;
 const percent=total?Math.min(100,Math.round(100*known/total)):0;
 $('paramProgressFill').style.width=percent+'%';
 $('paramProgressLabel').textContent=`${known} / ${total??'?'}`;
 $('paramCount').textContent=`${known} / ${total??'?'}`;
 const note=$('paramLoadNote');if(!note)return;$('refreshParamsBtn').textContent=x?.phase==='partial'?tr('resumeLoad'):tr('load');
 const status=x?.phase||'idle';
 if(status==='ftp'){
   const kb=((x.bytes||0)/1024).toFixed(1),stage=x.ftpStage||'OPEN';
   note.textContent=`MAVFTP ${stage} · ${kb} kB received`;
   $('paramProgressLabel').textContent=`MAVFTP · ${kb} kB`;
   $('paramCount').textContent='MAVFTP';return;
  }
 note.classList.toggle('is-warning',status==='partial'||status==='noReply');
 if(!x){note.textContent=pl('idle');return;}
 if(status==='complete'){note.textContent=`✓ ${pl('done')} · ${known}/${total}${x.reader?' · '+x.reader:''}${x.ftpBurstError?' · Burst→READ: '+x.ftpBurstError:''}`;return;}
 if(status==='partial'){note.textContent=`⚠ ${pl('partial')} · ${known}/${total} · missing ${Math.max(0,total-known)}`;return;}
 if(status==='noReply'){note.textContent=`⚠ ${pl('noReply')}`;return;}
 if(status==='retry'){note.textContent=pl('retry');return;}
 if(total&&x.phase==='repair'){note.textContent=`${pl('repair')} · ${Math.max(0,total-known)} missing · ${x.requests} requests`;return;}
 note.textContent=total?`${pl('receiving')} · ${percent}%${x.reader?' · '+x.reader:''}${x.ftpError?' · FTP: '+x.ftpError:''}` : pl('waiting');
}
function stopParamRepair(){if(state.paramRepairTimer){clearInterval(state.paramRepairTimer);state.paramRepairTimer=null;}}
function finishParamTransfer(complete){
 const x=state.paramTransfer;if(!x||!state.paramLoading)return;
 state.paramLoading=false;x.phase=complete?'complete':'partial';stopParamRepair();showProgress();
 window.dispatchEvent(new CustomEvent('atlas:parameters',{detail:{complete:!!complete,count:x.seen.size,total:state.paramCount,phase:x.phase}}));
 toast(complete?`${tr('saved')} · ${x.seen.size}/${state.paramCount}`:`${pl('partial')} · ${x.seen.size}/${state.paramCount}`,!complete);
 // Rendering thousands of rows during the stream blocks the serial RX loop.
 state.tableLimit=150;
 if(state.importedText)prepareImported();
 scheduleParameterRerender();
}
async function recoverMissingParams(){
 const x=state.paramTransfer;
 if(!x||!state.connected||!state.paramLoading||state.sysid===null||x.repairBusy)return;
 x.repairBusy=true;
 try{
  const time=Date.now();
  if(!state.paramCount){
    if(time-x.started<5000)return;
    if(x.listRetries>=3){state.paramLoading=false;x.phase='noReply';stopParamRepair();showProgress();toast(pl('noReply'),true);return;}
    if(time-x.lastListRequest<5000)return;
    x.listRetries++;x.lastListRequest=time;x.phase='retry';showProgress();
    await transmit(21,M.paramList(state.sysid,state.compid));return;
  }
  if(x.seen.size>=state.paramCount){finishParamTransfer(true);return;}
  // Wait until the initial high-throughput list stream becomes idle.
  if(time-x.lastNew<3400)return;
  x.phase='repair';
  let sent=0,pending=0;
  for(let i=0;i<state.paramCount;i++){
    if(x.seen.has(i))continue;
    const tries=x.attempts.get(i)||0;
    if(tries>=5)continue;
    pending++;
    if(time-(x.lastRequested.get(i)||0)<2800||sent>=12)continue;
    x.attempts.set(i,tries+1);x.lastRequested.set(i,time);
    await transmit(20,M.paramReadByIndex(state.sysid,state.compid,i));
    x.requests++;sent++;
  }
  showProgress();
  if(!sent&&!pending&&time-x.lastNew>3500)finishParamTransfer(false);
 }catch(e){toast('PARAM_REQUEST_READ: '+e.message,true);}
 finally{if(x)x.repairBusy=false;}
}
function renderAhrsFilter(){
 const core=window.AtlasAhrsFilterCore;
 if(!core)return;
 const info=core.indication({connected:state.connected,live:heartbeatLive(),demo:state.demo,
   announced:state.activeFilter,params:state.params,language:lang});
 const badge=$('ahrsFilterBadge'),detail=$('ahrsFilterDetail');
 if(badge){if(badge.textContent!==info.label)badge.textContent=info.label;if(badge.title!==info.detail)badge.title=info.detail;badge.dataset.verified=String(info.verified);}
 if(detail){
    // Compact visible status; full AHRS provenance remains in the tooltip.
    const visible=info.label.endsWith(' · CFG')?info.label:info.verified?info.label:info.detail;
    if(detail.textContent!==visible)detail.textContent=visible;
    const title=info.label+' — '+info.detail;if(detail.title!==title)detail.title=title;
  }
}
function updateTelemetryUI(){const t=state.demo||heartbeatLive()?state.telemetry:{roll:null,pitch:null,yaw:null,airspeed:null,altitude:null,throttle:null,voltage:null};
 $('rollReadout').textContent=Number.isFinite(t.roll)?`${t.roll>=0?'+':''}${cleanNum(t.roll,1)}°`:'--.-°';
 $('pitchReadout').textContent=Number.isFinite(t.pitch)?`${t.pitch>=0?'+':''}${cleanNum(t.pitch,1)}°`:'--.-°';
 $('yawReadout').textContent=Number.isFinite(t.yaw)?`${cleanNum((t.yaw+360)%360,1)}°`:'---.-°';
 const freshAirspeed=state.demo||(Number.isFinite(state.lastVfr)&&Date.now()-state.lastVfr<6500);
 $('speedReadout').innerHTML=freshAirspeed&&Number.isFinite(t.airspeed)&&t.airspeed>=0?`${Math.round(t.airspeed)} <em>km/h</em>`:'--- <em>km/h</em>';
 $('speedReadout').title=freshAirspeed?'MAVLink VFR_HUD · воздушная скорость по данным автопилота':'Нет свежего VFR_HUD · проверь отправку телеметрии и работу датчика Пито';
 $('voltageReadout').textContent=Number.isFinite(t.voltage)?`${cleanNum(t.voltage,2)} V`:'—';
 $('altReadout').textContent=Number.isFinite(t.altitude)?`${cleanNum(t.altitude,1)} m`:'—';
 $('vehicleModel').textContent=state.demo?'SIM / ArduPlane':heartbeatLive()?`MAVLink SYS ${state.sysid}`:'—';
 const armed=heartbeatLive()?state.armed:null;
 // The demo depicts an aircraft already flying, so display a SIMULATED armed state.
 // Never change state.armed: real MAVLink ARM/DISARM and write interlocks are separate.
 $('armedState').textContent=state.demo?tr('simArmed'):armed===true?tr('armed'):armed===false?tr('disarmed'):tr('unknown');
 $('armedState').style.color=state.demo||armed===true?'#efae7f':'#c4d685';
 $('armedState').title=state.demo?tr('simulation'):'';
 $('flightMode').textContent=state.demo?'FBWA / SIM':heartbeatLive()&&state.mode!==null?(modes[state.mode]||`CUSTOM ${state.mode}`):'—';renderAhrsFilter();
}
function enterDemo(){if(state.connected||state.connecting){toast(tr('needlink'),true);return;}state.demo=!state.demo;stopParamRepair();state.paramTransfer=null;state.params.clear();state.telemetry={roll:null,pitch:null,yaw:null,airspeed:null,altitude:null,throttle:null,voltage:null};state.paramCount=null;state.armed=null;
 if(state.demo){const demo={'ROLL_LIMIT_DEG':45,'PITCH_MAX':2000,'PITCH_MIN':-1500,'AIRSPEED_MIN':16,'AIRSPEED_MAX':45,'TRIM_ARSPD_CM':2200,'THR_MIN':0,'THR_MAX':100,'STALL_PREVENTION':1,'FS_LONG_ACTN':0,'ARSPD_USE':1,'RUD_LIMIT_DEG':30,'EK3_PRIMARY':0,'EK3_IMU_MASK':3,'TECS_SPDWEIGHT':1,'TKOFF_ALT':150,'SERVO1_FUNCTION':4,'SERVO2_FUNCTION':19,'SERVO3_FUNCTION':70,'OSD_TYPE':1,'OSD_UNITS':0,'OSD1_ENABLE':1,'OSD1_ALTITUDE_EN':1,'OSD1_ALTITUDE_X':24,'OSD1_ALTITUDE_Y':2,'OSD1_ASPEED_EN':1,'OSD1_ASPEED_X':1,'OSD1_ASPEED_Y':3,'OSD1_BAT_VOLT_EN':1,'OSD1_BAT_VOLT_X':2,'OSD1_BAT_VOLT_Y':13,'OSD1_HORIZON_EN':1,'OSD1_HORIZON_X':15,'OSD1_HORIZON_Y':8,'OSD1_RSSI_EN':1,'OSD1_RSSI_X':2,'OSD1_RSSI_Y':1,'OSD1_MESSAGE_EN':0,'OSD1_MESSAGE_X':1,'OSD1_MESSAGE_Y':12};for(const [name,value]of Object.entries(demo))state.params.set(name,{value,type:Number.isInteger(value)?6:9,index:state.params.size});state.paramCount=state.params.size;toast('SIM DEMO · no USB hardware connected');}else toast('Demo exited');
 updateConnectionUI();renderParams();renderBasic();updateTelemetryUI();window.dispatchEvent(new Event('atlas:state'));}
async function cleanupForNavigation(){
 state.pageLeaving=true;state.hudLoopActive=false;if(state.hudRaf){cancelAnimationFrame(state.hudRaf);state.hudRaf=0;}
 state.bulkCancel=true;stopParamRepair();state.ftpClient?.cancel();state.ftpClient=null;state.activeFilter=null;state.statusTextAssembler.reset();state.paramTransfer=null;state.paramLoading=false;if(state.streamTimer){clearInterval(state.streamTimer);state.streamTimer=null;}state.rxActive=false;
 const reader=state.reader;state.reader=null;
 try{if(reader)await reader.cancel();}catch{}
 const port=state.port;state.port=null;
 try{if(port)await port.close();}catch{}
 if(state.netSocket){const ws=state.netSocket;state.netSocket=null;ws.close();}state.bridgeReady=false;state.transport=null;
 state.connected=false;state.connecting=false;state.demo=false;state.sysid=null;state.armed=null;
}

async function disconnect(){state.bulkCancel=true;stopParamRepair();state.ftpClient?.cancel();state.ftpClient=null;state.activeFilter=null;state.statusTextAssembler.reset();state.paramTransfer=null;if(state.streamTimer){clearInterval(state.streamTimer);state.streamTimer=null;}state.rxActive=false;const reader=state.reader;state.reader=null;
 try{if(reader)await reader.cancel();}catch{}
 try{if(reader)reader.releaseLock();}catch{}
 const port=state.port;state.port=null;try{if(port)await port.close();}catch(e){console.warn(e);}
 const socket=state.netSocket;state.netSocket=null;state.bridgeReady=false;state.transport=null;if(socket){try{socket.close();}catch{}}
 state.connected=false;state.sysid=null;state.compassStatus=null;state.lastVoltageTelemetry=0;state.lastHeartbeat=0;state.heartbeatStale=false;state.lastVfr=0;state.vfrFallbackSent=false;state.armed=null;state.mode=null;state.params.clear();state.paramCount=null;state.telemetry={roll:null,pitch:null,yaw:null,airspeed:null,altitude:null,throttle:null,voltage:null};state.paramLoading=false;
 if(state.writeWait){clearTimeout(state.writeWait.timer);state.writeWait.reject(Error('Connection closed'));state.writeWait=null;}
 updateConnectionUI();renderBasic();renderParams();updateTelemetryUI();window.dispatchEvent(new Event('atlas:state'));toast('MAVLink disconnected');}
async function transmit(messageId,payload){
 if(!state.connected||(!state.port&&!(state.netSocket&&state.bridgeReady)))throw Error(tr('needlink'));
 const frame=M.createFrame(messageId,payload,state.seq++);
 const current=state.txPromise.then(async()=>{
  if(state.netSocket&&state.bridgeReady){
   if(state.netSocket.readyState!==WebSocket.OPEN)throw Error('WebSocket closed');
   state.netSocket.send(frame);
  }else{
   if(!state.port)throw Error('USB port closed');
   const writer=state.port.writable.getWriter();try{await writer.write(frame);}finally{writer.releaseLock();}
  }
 });
 state.txPromise=current.catch(()=>{});return current;
}

async function requestStreams(){if(!state.connected||state.sysid===null)return;
 for(const [id,rate]of [[30,100000],[74,200000],[1,1000000],[65,200000]]){
   try{await transmit(76,M.commandLong(state.sysid,state.compid,511,[id,rate,0,0,0,0,0]));}catch(e){toast('Stream request: '+e.message,true);}
 }
}
function handleMessage(message){if(state.pageLeaving)return;const data=M.parseMessage(message);if(!data||!M.belongsToSelectedVehicle(message,data,state.sysid))return;
 if(data.type==='command_long'){state.rxCommands=(state.rxCommands||0)+1;if(data.command===42429)state.rxPositions=(state.rxPositions||0)+1;}
 if(data.type==='ack')state.rxAcks=(state.rxAcks||0)+1;
 if(data.type==='text')state.rxTexts=(state.rxTexts||0)+1;
 if(data.type==='heartbeat' && data.compid===1){const first=state.sysid===null,recovered=state.heartbeatStale;state.sysid=data.sysid;state.compid=data.compid;state.lastHeartbeat=Date.now();state.heartbeatStale=false;state.armed=data.armed;state.mode=data.mode;
   if(first){state.streamStart=Date.now();toast(`MAVLink HEARTBEAT · sys=${state.sysid} comp=${state.compid}`);requestStreams();updateConnectionUI();startParamLoad();window.dispatchEvent(new Event('atlas:state'));}
   else if(recovered){updateConnectionUI();updateTelemetryUI();window.dispatchEvent(new Event('atlas:state'));}
 }else if(data.type==='attitude'){state.telemetry.roll=data.roll*180/Math.PI;state.telemetry.pitch=data.pitch*180/Math.PI;state.telemetry.yaw=data.yaw*180/Math.PI;state.lastAttitude=Date.now();}
 else if(data.type==='vfr'&&message.sysid===state.sysid){state.lastVfr=Date.now();state.telemetry.airspeed=Number.isFinite(data.airspeed)&&data.airspeed>=0?data.airspeed*3.6:null;state.telemetry.altitude=data.altitude;state.telemetry.throttle=data.throttle;}
 else if(data.type==='sys'){state.telemetry.voltage=data.voltage===65535?null:data.voltage/1000;if(data.voltage!==65535&&message.sysid===state.sysid)state.lastVoltageTelemetry=Date.now();if(message.sysid===state.sysid&&message.compid===state.compid){const magBit=4;state.compassStatus={present:!!(data.sensorsPresent&magBit),enabled:!!(data.sensorsEnabled&magBit),healthy:!!(data.sensorsHealthy&magBit),lastSeen:Date.now()};}}
 else if(data.type==='text'){
   // All standard MAV_SEVERITY levels 0..7 are user-visible, including
   // performance-monitor INFO (6) / DEBUG (7). Do not lose fragments or
   // treat incomplete multi-chunk STATUSTEXT as a complete notification.
   const entry=state.statusTextAssembler.receive(data,message);
   if(entry){
     if(message.compid===state.compid){
       const observed=window.AtlasAhrsFilterCore?.activeFromText(entry.text);
       if(observed){state.activeFilter=observed;renderAhrsFilter();}
     }
     log(entry.text,entry.warning,{source:'fc',severity:entry.severity,level:entry.level});
   }
 }
 else if(data.type==='mavftp'&&message.compid===state.compid){state.ftpClient?.handle(data.data);}
 else if(data.type==='param'){
  if(!data.name||message.sysid!==state.sysid||message.compid!==state.compid)return;
  state.params.set(data.name,{value:data.value,type:data.paramType,index:data.index});
  if(data.count>0&&data.count<=32767)state.paramCount=data.count;
  const transfer=state.paramTransfer;
  // Unsolicited PARAM_VALUE must not steal the active FTP phase or finish
  // its transfer prematurely via a competing legacy parameter stream.
  const ftpActive=transfer?.phase==='ftp';
  if(transfer&&state.paramLoading&&!ftpActive){
    const idx=data.index;
    if(Number.isInteger(idx)&&idx>=0&&idx<state.paramCount){
      if(!transfer.seen.has(idx))transfer.lastNew=Date.now();
      transfer.seen.add(idx);
    }
    transfer.phase='receiving';
  }
  if(state.writeWait && state.writeWait.name===data.name){const w=state.writeWait;
   // One reported value can be either a write acknowledgment or the original unchanged value.
   const tolerance=Math.max(0.00001,Math.abs(w.value)*1e-5);
   if(Math.abs(data.value-w.value)<=tolerance){clearTimeout(w.timer);state.writeWait=null;w.resolve(data.value);}
  }
  if(state.paramLoading && state.paramCount>0 && transfer&&!ftpActive&&transfer.seen.size>=state.paramCount){finishParamTransfer(true);}
  scheduleParameterRerender();
 }
 window.dispatchEvent(new CustomEvent('atlas:message',{detail:{...data,sourceSysid:message.sysid,sourceCompid:message.compid}}));
}
let renderQueued=false;
function scheduleParameterRerender(){if(renderQueued||state.pageLeaving)return;renderQueued=true;setTimeout(()=>{renderQueued=false;if(state.pageLeaving)return;if(state.selectedTab==='params')renderParams();if(state.selectedTab==='basic')renderBasic();showProgress();if(!document.hidden)window.dispatchEvent(new Event('atlas:parameters'));},state.paramLoading?1600:400);}
async function connect(){if(state.connecting)return;if(state.connected){await disconnect();return;}
 if(state.demo)enterDemo();
 if(!window.isSecureContext||!('serial' in navigator)){toast(tr('nosupport'),true);alert(tr('nosupport'));return;}
 state.connecting=true;updateConnectionUI();
 try{
  const port=await navigator.serial.requestPort();
  await port.open({baudRate:Number($('baud').value),bufferSize:8192});
  state.port=port;state.transport='usb';state.rxActive=true;state.connected=true;state.seq=0;stopParamRepair();state.activeFilter=null;state.statusTextAssembler.reset();state.ftpClient?.cancel();state.ftpClient=null;state.paramTransfer=null;state.params.clear();state.paramCount=null;state.paramLoading=false;state.armed=null;state.sysid=null;state.compassStatus=null;state.lastVoltageTelemetry=0;state.lastHeartbeat=0;state.heartbeatStale=false;state.lastVfr=0;state.streamStart=0;state.vfrFallbackSent=false;state.mode=null;
  updateConnectionUI();log('USB CDC open · '+$('baud').value+' bps');
  const parser=new M.Parser(handleMessage);state.rxParser=parser;
  state.rxPositions=0;state.rxCommands=0;state.rxAcks=0;state.rxTexts=0;
  state.streamTimer=setInterval(heartbeatTick,1000);
  transmit(0,M.heartbeat()).catch(()=>{});
  // Avoid blocking the UI by running the receive loop as an async task.
  (async()=>{try{while(state.rxActive&&state.port){const reader=state.port.readable.getReader();state.reader=reader;try{while(state.rxActive){const {value,done}=await reader.read();if(done)break;if(value)parser.push(value);}}finally{reader.releaseLock();state.reader=null;}}}catch(err){if(state.rxActive)toast('USB RX: '+err.message,true);}finally{if(state.rxActive)disconnect().catch(console.error);}})();
 }catch(err){toast('USB: '+err.message,true);if(state.port)await disconnect();}
 finally{state.connecting=false;updateConnectionUI();}
}
const readTwoLex={
 ru:{start:'Читаю параметры',done:'Два прохода завершены',incomplete:'Загрузка неполная: можно повторить',busy:'Ожидается завершение предыдущего чтения',button:'Прочитать параметры · 2 прохода'},
 uk:{start:'Зчитую параметри',done:'Два проходи завершено',incomplete:'Не всі параметри отримано: повтори зчитування',busy:'Читання вже триває',button:'Зчитати параметри · 2 проходи'},
 en:{start:'Reading parameters',done:'Two passes completed',incomplete:'Read incomplete: retry if needed',busy:'Another transfer is in progress',button:'Read parameters · 2 passes'}
};
async function readParamsTwice(){
 if(state.readTwoBusy||!state.connected||state.sysid===null||state.bulk?.running||state.servoConfigBusy){toast((readTwoLex[lang]||readTwoLex.ru).busy,true);return;}
 const text=readTwoLex[lang]||readTwoLex.ru;
 state.readTwoBusy=true;const button=$('twoPassParamsBtn');button.disabled=true;
 try{
  for(let pass=1;pass<=2;pass++){
   if(!state.connected||state.sysid===null)throw Error(tr('needlink'));
   if(!state.paramLoading&&!startParamLoad(true))throw Error(text.busy);
   button.textContent=text.start+' '+pass+'/2';
   const started=Date.now();
   while(state.connected&&state.paramLoading&&Date.now()-started<75000)await new Promise(resolve=>setTimeout(resolve,300));
   if(state.paramLoading)throw Error(text.incomplete+' · timeout');
   if(!state.connected)throw Error(tr('needlink'));
  }
  toast(state.paramTransfer?.phase==='complete'?text.done:text.incomplete,state.paramTransfer?.phase!=='complete');
 }catch(e){toast(e.message,true);}
 finally{state.readTwoBusy=false;button.disabled=false;button.textContent=text.button;renderParams();renderImportDiff();}
}
const networkLex={
 ru:{oneClickTitle:'TCP 127.0.0.1:5760 · подключение в один клик',oneClickHelp:'Скачай один файл для Windows и открой двойным щелчком. Он запустит локальный коннектор, откроет сайт и подключит TCP автоматически — без копирования токена. При отсутствии Node.js первый запуск скачает проверенную портативную версию.',oneClickDownload:'Скачать TCP Connector для Windows',oneClickSafety:'Разреши доступ к локальной сети в браузере. Не закрывай окно коннектора во время работы. Если станция допускает только одного TCP-клиента, сначала отключи Mission Planner.',advanced:'Ручные настройки UDP/TCP и других адресов',title:'TCP / UDP · подключение',mode:'Режим соединения',host:'Адрес полётника / прослушивания',port:'Порт MAVLink',bridge:'Локальный WebSocket-мост',token:'Токен из терминала',warning:'GitHub Pages не открывает UDP/TCP напрямую. Запусти на ПК: node tools/mavlink-bridge.cjs. Мост слушает только localhost и требует токен. Для удалённого соединения используй доверенную сеть/VPN.',connect:'Подключить UDP/TCP вручную',disconnect:'Отключить сеть'},
 uk:{oneClickTitle:'TCP 127.0.0.1:5760 · з’єднання в один клік',oneClickHelp:'Завантаж один файл для Windows і відкрий подвійним клацанням. Він запустить локальний конектор, відкриє сайт і підключить TCP автоматично — без копіювання токена. За відсутності Node.js перший запуск завантажить перевірену портативну версію.',oneClickDownload:'Завантажити TCP Connector для Windows',oneClickSafety:'Дозволь доступ до локальної мережі у браузері. Не закривай вікно конектора. Якщо станція підтримує лише одного TCP-клієнта, відключи Mission Planner.',advanced:'Ручні налаштування UDP/TCP та інших адрес',title:'TCP / UDP · підключення',mode:'Режим з’єднання',host:'Адреса контролера / прослуховування',port:'Порт MAVLink',bridge:'Локальний WebSocket-міст',token:'Токен із термінала',warning:'GitHub Pages не відкриває UDP/TCP напряму. Запусти: node tools/mavlink-bridge.cjs. Міст працює лише на localhost і потребує токен. Для віддаленого з’єднання користуйся VPN.',connect:'Під’єднати UDP/TCP вручну',disconnect:'Від’єднати мережу'},
 en:{oneClickTitle:'TCP 127.0.0.1:5760 · one-click connection',oneClickHelp:'Download one Windows file and double-click it. It starts the local connector, opens the site and connects to TCP automatically, without pasting a token. If Node.js is missing, the first launch downloads a verified portable copy.',oneClickDownload:'Download TCP Connector for Windows',oneClickSafety:'Allow browser access to the local device. Keep the connector window open. If the TCP station supports only one client, disconnect Mission Planner first.',advanced:'Manual UDP/TCP setup and other addresses',title:'TCP / UDP · connections',mode:'Connection mode',host:'Remote / listening IP',port:'MAVLink port',bridge:'Local WebSocket bridge',token:'Terminal session token',warning:'GitHub Pages cannot open raw UDP/TCP. Run locally: node tools/mavlink-bridge.cjs. Bridge binds localhost and requires a token. Use a trusted network/VPN for remote MAVLink.',connect:'Connect UDP/TCP manually',disconnect:'Disconnect network'}
};
function updateNetworkLabels(){
 const text=networkLex[lang]||networkLex.ru;
 document.querySelectorAll('[data-net-t]').forEach(el=>{if(text[el.dataset.netT])el.textContent=text[el.dataset.netT];});
 $('networkConnectBtn').textContent=state.transport==='bridge'&&state.connected?text.disconnect:text.connect;
}
function networkStatus(message,isError=false){const e=$('networkStatus');if(e){e.textContent=message;e.style.color=isError?'#e7a388':'#bed096';}if(message)toast(message,isError);}
// One-click connector passes a short-lived random token in the URL fragment.
 // Fragments are not transmitted with HTTP requests; erase immediately so they
 // are not left visible in the address bar or followed by navigation.
function consumeOneClickTcpToken(){
 const match=/^#atlas-tcp=([a-f0-9]{40})$/.exec(window.location.hash);
 if(!match)return null;
 window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search+'#dashboard');
 return match[1];
}
function startOneClickTcp(token){
 if(!/^[a-f0-9]{40}$/.test(token))return;
 $('networkOptions').open=true;
 $('networkAdvanced').open=false;
 $('networkMode').value='tcp-client';
 $('networkHost').value='127.0.0.1';
 $('networkPort').value='5760';
 $('networkBridge').value='ws://127.0.0.1:8765/mavlink';
 $('networkToken').value=token;
 networkStatus('TCP Connector: подключаюсь к 127.0.0.1:5760…');
 void connectBridge();
}
function syncNetworkDefaults(){
 const mode=$('networkMode').value;
 $('networkHost').value=mode==='udp-listen'?'0.0.0.0':'127.0.0.1';
 $('networkPort').value=mode==='tcp-client'?'5760':'14550';
}
async function connectBridge(){
 if(state.transport==='bridge'&&state.connected){await disconnect();updateNetworkLabels();return;}
 if(state.connecting)return;
 const mode=$('networkMode').value,host=$('networkHost').value.trim(),port=Number($('networkPort').value),token=$('networkToken').value.trim();
 let endpoint;try{endpoint=new URL($('networkBridge').value.trim());}catch{networkStatus('Invalid WebSocket URL',true);return;}
 const localhost=['127.0.0.1','localhost','[::1]'].includes(endpoint.hostname);
 if(!['ws:','wss:'].includes(endpoint.protocol)||(!localhost&&endpoint.protocol!=='wss:')||endpoint.pathname!=='/mavlink'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||!token||!Number.isInteger(port)||port<1||port>65535||!/^[-.a-zA-Z0-9:]{1,253}$/.test(host)){
  networkStatus('Check bridge URL, token, mode and host/port (non-local WebSocket must use WSS)',true);return;
 }
 if(state.connected)await disconnect();
 if(state.demo)enterDemo();
 state.connecting=true;updateConnectionUI();networkStatus('Opening authenticated local WebSocket…');
 try{
  const url=endpoint.href+(endpoint.href.includes('?')?'&':'?')+'token='+encodeURIComponent(token);
  const ws=new WebSocket(url);ws.binaryType='arraybuffer';state.netSocket=ws;
  const handshakeTimer=setTimeout(()=>{if(state.netSocket===ws&&!state.bridgeReady){networkStatus('WebSocket bridge handshake timed out (12 s)',true);ws.close();}},12000);
  ws.onopen=()=>{if(state.netSocket===ws)ws.send(JSON.stringify({mode,host,port}));};
  ws.onmessage=event=>{
   if(state.netSocket!==ws)return;
   if(typeof event.data==='string'){
    let message;try{message=JSON.parse(event.data);}catch{networkStatus('Unexpected bridge message',true);return;}
    if(message.type==='error'){
     const failed=String(message.message||'Unknown bridge error');
     networkStatus(/ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT/.test(failed)?
       'TCP 127.0.0.1:5760 недоступен. Проверь, что станция запущена, TCP включён и Mission Planner отключён, если допускается только один клиент. '+failed:
       'MAVLink bridge: '+failed,true);
     ws.close();return;
    }
    if(message.type!=='ready')return;
    clearTimeout(handshakeTimer);state.bridgeReady=true;state.transport='bridge';state.connected=true;state.connecting=false;state.rxActive=true;state.seq=0;
    stopParamRepair();state.activeFilter=null;state.statusTextAssembler.reset();state.ftpClient?.cancel();state.ftpClient=null;state.paramTransfer=null;state.params.clear();state.paramCount=null;state.paramLoading=false;
    state.armed=null;state.sysid=null;state.compassStatus=null;state.lastHeartbeat=0;state.heartbeatStale=false;state.lastVoltageTelemetry=0;
    state.lastVfr=0;state.streamStart=0;state.vfrFallbackSent=false;state.mode=null;
    const parser=new M.Parser(handleMessage);state.rxParser=parser;
    state.rxPositions=0;state.rxCommands=0;state.rxAcks=0;state.rxTexts=0;
    state.streamTimer=setInterval(heartbeatTick,1000);
    transmit(0,M.heartbeat()).catch(()=>{});
    updateConnectionUI();updateNetworkLabels();
    networkStatus('WebSocket bridge ready · '+mode+' '+host+':'+port+' · waiting for MAVLink HEARTBEAT');
    window.dispatchEvent(new Event('atlas:state'));
   }else if(state.bridgeReady&&event.data instanceof ArrayBuffer)state.rxParser.push(new Uint8Array(event.data));
  };
  ws.onerror=()=>{if(state.netSocket===ws)networkStatus('WebSocket error: check bridge token / TLS / browser network restrictions',true);};
  ws.onclose=()=>{clearTimeout(handshakeTimer);if(state.netSocket!==ws)return;state.connecting=false;if(state.connected){void disconnect().then(updateNetworkLabels);}else{state.netSocket=null;state.bridgeReady=false;updateConnectionUI();updateNetworkLabels();}};
 }catch(e){networkStatus(e.message,true);state.connecting=false;updateConnectionUI();}
}
function heartbeatTick(){
 if(!state.connected)return;
 transmit(0,M.heartbeat()).catch(()=>{});
 if(state.sysid!==null&&!heartbeatLive()&&!state.heartbeatStale){
  state.heartbeatStale=true;state.activeFilter=null;state.statusTextAssembler.reset();updateConnectionUI();updateTelemetryUI();window.dispatchEvent(new Event('atlas:state'));
 }
 if(state.sysid!==null&&!state.vfrFallbackSent&&state.streamStart>0&&state.lastVfr===0&&Date.now()-state.streamStart>7000&&Date.now()-state.lastHeartbeat<4000){
  state.vfrFallbackSent=true;
  transmit(66,M.requestDataStream(state.sysid,state.compid,11,3)).catch(err=>log('VFR_HUD fallback: '+err.message));
 }
}
function startLegacyParamStream(transfer){
 if(!state.connected||state.paramTransfer!==transfer||!state.paramLoading)return;
 state.ftpClient=null;stopParamRepair();
 const time=Date.now();
 transfer.phase='receiving';transfer.reader='MAVLink PARAM_VALUE';transfer.seen.clear();transfer.attempts.clear();transfer.lastRequested.clear();
 transfer.started=time;transfer.lastNew=time;transfer.lastListRequest=time;transfer.listRetries=0;transfer.requests=0;transfer.repairBusy=false;
 state.params.clear();state.paramCount=null;state.paramRepairTimer=setInterval(recoverMissingParams,1400);
 showProgress();
 transmit(21,M.paramList(state.sysid,state.compid)).then(()=>toast(tr('refreshdone'))).catch(err=>{
  if(state.paramTransfer!==transfer)return;
  toast(err.message,true);state.paramLoading=false;stopParamRepair();transfer.phase='partial';showProgress();
 });
}
function startFastParamStream(transfer){
 if(!window.AtlasMavFtpParams||state.transport!=='bridge'||state.compid!==1)return false;
 transfer.phase='ftp';transfer.reader='MAVFTP BURST';transfer.bytes=0;showProgress();
 const client=new window.AtlasMavFtpParams.Client({
  preferBurst:true,
  onStage:(stage,reason)=>{
   if(state.paramTransfer!==transfer||!state.paramLoading)return;
   transfer.ftpStage=stage;
   if(stage==='BURST-FAILED')transfer.ftpBurstError=reason||'unknown';
   showProgress();
  },
  send:packet=>transmit(110,M.ftpFrame(state.sysid,state.compid,packet)),
  onProgress:bytes=>{
   if(state.paramTransfer!==transfer||!state.paramLoading)return;
   transfer.bytes=bytes;showProgress();
  }
 });
 state.ftpClient=client;
 toast('MAVFTP · OPEN @PARAM/param.pck · BurstReadFile attempt');
 void client.download().then(rows=>{
  if(state.ftpClient!==client||state.paramTransfer!==transfer||!state.paramLoading||!state.connected)return;
  // Commit only fully decoded/validated sets. No partial list is presented as complete.
  state.params=new Map(rows.map(row=>[row.name,{value:row.value,type:row.type,index:row.index}]));
  state.paramCount=rows.length;transfer.seen=new Set(rows.map(row=>row.index));transfer.reader=client.lastMethod||'MAVFTP';
  transfer.lastNew=Date.now();state.ftpClient=null;
  toast('MAVFTP success · '+transfer.reader+' · '+rows.length+' params'+(client.lastFallback?' · burst fallback: '+client.lastFallback:''));
  finishParamTransfer(true);
 }).catch(error=>{
  if(state.ftpClient!==client||state.paramTransfer!==transfer||!state.paramLoading||!state.connected)return;
  state.ftpClient=null;
  transfer.ftpError=error.message;
  toast('MAVFTP failed · '+(transfer.ftpStage||'OPEN')+' · '+error.message+' · '+client.responses+' replies · PARAM_REQUEST_LIST fallback',true);
  startLegacyParamStream(transfer);
 });
 return true;
}
function startParamLoad(fresh=false){if(state.bulk?.running||state.servoConfigBusy){toast(tr('buttonBusy'),true);return false;}if(state.paramLoading)return false;if(!state.connected||state.sysid===null){toast(tr('needlink'),true);return false;}
 const old=state.paramTransfer;
 if(!fresh&&old?.phase==='partial'&&state.paramCount>0&&old.seen.size<state.paramCount){
  stopParamRepair();old.attempts.clear();old.lastRequested.clear();old.requests=0;old.lastNew=Date.now()-5000;old.started=Date.now();old.phase='repair';old.repairBusy=false;state.paramLoading=true;
  state.paramRepairTimer=setInterval(recoverMissingParams,1400);recoverMissingParams();showProgress();toast(tr('resumeLoad')+` · ${state.paramCount-old.seen.size}`);return true;
 }
 state.ftpClient?.cancel();state.ftpClient=null;stopParamRepair();
 state.paramLoading=true;state.params.clear();state.paramCount=null;state.tableLimit=150;
 const time=Date.now(),transfer={seen:new Set(),attempts:new Map(),lastRequested:new Map(),phase:'receiving',reader:null,ftpStage:null,ftpError:null,ftpBurstError:null,started:time,lastNew:time,lastListRequest:time,listRetries:0,requests:0,repairBusy:false};
 state.paramTransfer=transfer;renderParams();renderBasic();showProgress();
 if(!startFastParamStream(transfer))startLegacyParamStream(transfer);
 return true;
}
function canWrite(){return state.connected&&!state.demo&&state.sysid!==null&&state.armed===false&&Date.now()-state.lastHeartbeat<4000&&!state.writeWait&&!state.bulk?.running&&!state.servoConfigBusy&&!state.paramLoading&&!state.readTwoBusy;}
window.AtlasCC = Object.freeze({
  getState:()=>({connected:state.connected,demo:state.demo,sysid:state.sysid,compid:state.compid,armed:state.armed,lastHeartbeat:state.lastHeartbeat,params:state.params,telemetry:state.telemetry,lastVoltageTelemetry:state.lastVoltageTelemetry,transport:state.transport,compassStatus:state.compassStatus,selectedBoard:state.selectedBoard,paramLoading:state.paramLoading,paramCount:state.paramCount,paramPhase:state.paramTransfer?.phase||'idle',paramReader:state.paramTransfer?.reader||null,paramComplete:!state.paramLoading&&state.paramTransfer?.phase==='complete'&&Number.isInteger(state.paramCount)&&state.params.size===state.paramCount}),
  canWrite:()=>canWrite(),
  connectUsb:()=>connect(),
  connectBridge:()=>connectBridge(),
  selectBoard:(id)=>{if(window.AtlasDfuUi?.isBusy()||!['matek-h743-wing-v3','cube-orange-plus','uni-ic743-mini'].includes(id))return false;state.selectedBoard=id;renderBoards();window.dispatchEvent(new CustomEvent('atlas:board',{detail:{board:id}}));return true;},
  navigate:(tab)=>navigate(tab),
  diagnosticStats:()=>({valid:state.rxParser?.valid??0,invalid:state.rxParser?.invalid??0,connected:state.connected,sysid:state.sysid,compid:state.compid,lastHeartbeat:state.lastHeartbeat,paramReader:state.paramTransfer?.reader||null,paramPhase:state.paramTransfer?.phase||'idle',paramFtpStage:state.paramTransfer?.ftpStage||null,paramFtpError:state.paramTransfer?.ftpError||null,paramFtpBurstError:state.paramTransfer?.ftpBurstError||null,positionRequests:state.rxPositions||0,commands:state.rxCommands||0,acknowledgements:state.rxAcks||0,textMessages:state.rxTexts||0}),
  canCalibrate:()=>state.connected&&!state.demo&&state.sysid!==null&&state.armed===false&&Date.now()-state.lastHeartbeat<4000&&!state.writeWait,
  rebootController:()=>{
    if(!state.connected||state.demo||state.sysid===null||state.armed!==false||Date.now()-state.lastHeartbeat>=4000||state.writeWait||state.servoConfigBusy||state.paramLoading||state.bulk?.running)throw Error('Reboot blocked: live USB, DISARMED and idle writes required');
    // MAV_CMD_PREFLIGHT_REBOOT_SHUTDOWN: param1=1 reboots autopilot only. Actual reboot must be confirmed by fresh heartbeat after disconnect.
    return transmit(76,M.commandLong(state.sysid,state.compid,246,[1,0,0,0,0,0,0]));
  },
  command:(id,p=[])=>{if(!window.AtlasCC.canCalibrate())throw Error('USB / DISARM heartbeat required');return transmit(76,M.commandLong(state.sysid,state.compid,id,p));},
  requestMessage:(id,micros)=>{if(!state.connected||state.sysid===null)return Promise.reject(Error('No MAVLink heartbeat'));return transmit(76,M.commandLong(state.sysid,state.compid,511,[id,micros,0,0,0,0,0]));},
  editParam:(name)=>openEdit(name),
  writeServoConfig:async (channel,updates,onProgress=()=>{})=>{
    if(!Number.isInteger(channel)||channel<1||channel>16)throw Error('Invalid servo channel');
    if(!canWrite())throw Error('Requires live DISARMED USB, complete parameter read and no other write');
    const allowed=new Set(['FUNCTION','MIN','TRIM','MAX','REVERSED']);
    const changes=[];
    // Use a stable field order; REVERSED is deliberately applied after function and PWM limits.
    for(const field of ['FUNCTION','MIN','TRIM','MAX','REVERSED']){
      if(!Object.prototype.hasOwnProperty.call(updates,field))continue;
      const value=updates[field];
      if(!allowed.has(field)||!Number.isFinite(value)||!Number.isInteger(value))throw Error('Invalid SERVO field: '+field);
      const name=`SERVO${channel}_${field}`,p=state.params.get(name);
      if(!p)throw Error(name+' not present on controller');
      if(p.value!==value)changes.push({name,value,type:p.type});
    }
    if(!changes.length)return {done:0,total:0};
    const proposed=Object.fromEntries(['MIN','TRIM','MAX'].map(k=>[k,updates[k]??state.params.get(`SERVO${channel}_${k}`)?.value]));
    if(Object.values(proposed).every(Number.isFinite)&&!(proposed.MIN<=proposed.TRIM&&proposed.TRIM<=proposed.MAX))throw Error('MIN ≤ TRIM ≤ MAX required');
    state.servoConfigBusy=true;
    let done=0;
    try{
      for(const change of changes){
        if(!state.connected||state.armed!==false||Date.now()-state.lastHeartbeat>=4000)throw Error(`Stopped after ${done}/${changes.length}: USB/ARM state changed`);
        onProgress({done,total:changes.length,current:change.name});
        // PARAM_VALUE echoes the accepted value; do not report success until it arrives.
        await writeParameterWithAck(change.name,change.value,change.type);
        done++;
      }
      onProgress({done,total:changes.length,current:''});
      return {done,total:changes.length};
    }catch(e){throw Error(`Saved ${done}/${changes.length}; ${e.message}`);}finally{
      state.servoConfigBusy=false;renderBasic();renderParams();renderImportDiff();
    }
  },
  requestParameters:(fresh=false)=>{if(state.connected&&!state.paramLoading)return startParamLoad(fresh);return false;},
  writeOSDParams:async (updates,onProgress=()=>{})=>{
    if(!canWrite())throw Error('Live USB, confirmed DISARMED, completed parameter read and idle writer required');
    const valid=/^OSD(?:[1-4]_[A-Z0-9_]+_(?:EN|X|Y)|[1-4]_ENABLE|TYPE|UNITS|CHAN|SW_METHOD)$/;
    const changes=[];
    for(const [name,value] of Object.entries(updates)){
      if(!valid.test(name)||!Number.isInteger(value))throw Error(`Invalid OSD parameter: ${name}`);
      const p=state.params.get(name);
      if(!p)throw Error(`${name}: not present on FC`);
      if(name.endsWith('_EN')||name.endsWith('_ENABLE')){if(value!==0&&value!==1)throw Error(`${name}: expected 0 or 1`);}
      else if(name.endsWith('_X')&&!(value>=0&&value<=63))throw Error(`${name}: X range 0..63`);
      else if(name.endsWith('_Y')&&!(value>=0&&value<=31))throw Error(`${name}: Y range 0..31`);
      if(p.value!==value)changes.push({name,value,type:p.type});
    }
    state.servoConfigBusy=true;
    let done=0;
    try{
      for(const ch of changes){
        if(!state.connected||state.armed!==false||Date.now()-state.lastHeartbeat>=4000)throw Error('Disconnected or ARM state changed');
        onProgress({done,total:changes.length,name:ch.name});
        await writeParameterWithAck(ch.name,ch.value,ch.type);
        done++;
      }
      return {done,total:changes.length};
    }catch(e){throw Error(`Recorded ${done}/${changes.length}: ${e.message}`);}
    finally{state.servoConfigBusy=false;renderParams();renderBasic();}
  },
  // DO_SET_SERVO is supported only on Disabled / passthrough channels. Never override throttle/flight functions.
  sendServoPwm:async(channel,pwm)=>{
    if(!Number.isInteger(channel)||channel<1||channel>16||!Number.isInteger(pwm)||pwm<1000||pwm>2000)throw Error('Invalid direct servo PWM');
    if(!window.AtlasCC.canCalibrate()||state.servoConfigBusy||state.bulk?.running||state.paramLoading)throw Error('Live DISARMED link required');
    const func=state.params.get(`SERVO${channel}_FUNCTION`)?.value;
    if(!Number.isInteger(func)||!(func===0||func===1||(func>=51&&func<=66)||(func>=140&&func<=155)))
      throw Error(`SERVO${channel}_FUNCTION=${func??'?'}: direct DO_SET_SERVO not supported; command was not sent`);
    await transmit(76,M.commandLong(state.sysid,state.compid,183,[channel,pwm,0,0,0,0,0]));
    return {channel,pwm,submitted:true}; // COMMAND_ACK or SERVO_OUTPUT_RAW required for confirmation.
  },
  writeAdvancedParams:async (updates,onProgress=()=>{},shouldCancel=()=>false,options={})=>{
    if(!canWrite())throw Error('Live USB + confirmed DISARMED + idle PARAM transfer required');
    const changes=[];
    const metadata=Object.fromEntries(window.AtlasParamTree?.getMetadata?.()||[]);
    for(const [name,value] of Object.entries(updates)){
      if(!/^[A-Z][A-Z0-9_]{0,15}$/.test(name)||!Number.isFinite(value))throw Error('Invalid parameter: '+name);
      const p=state.params.get(name);
      if(!p)throw Error(name+' not present on flight controller');
      const report=window.AtlasQuickSetupCore?.parseParamText(name+' '+value+'\n',new Map([[name,p]]),metadata);
      if(!report?.valid||report.skipped.length||report.errors.length)throw Error(name+': '+(report?.skipped?.[0]?.reason||report?.errors?.[0]?.reason||'unsupported write'));
      if(Math.abs(p.value-value)>Math.max(1e-5,Math.abs(value)*2e-6))changes.push({name,value,type:p.type});
    }
    if(!changes.length)return {done:0,total:0};
    state.servoConfigBusy=true;let done=0;const skipped=[];
    try{
      for(const c of changes){
        if(shouldCancel())throw Error('Cancelled after '+done+'/'+changes.length);
        if(!state.connected||state.armed!==false||Date.now()-state.lastHeartbeat>4000)throw Error('Connection/ARM state changed');
        onProgress({done,total:changes.length,name:c.name});
        try{await writeParameterWithAck(c.name,c.value,c.type);done++;}
        catch(e){
          if(options.skipRejected===true&&state.connected&&state.armed===false&&Date.now()-state.lastHeartbeat<4000&&!shouldCancel()){
            skipped.push({name:c.name,reason:e.message});continue;
          }
          throw e;
        }
      }
      onProgress({done,total:changes.length,name:'',skipped:skipped.length});return {done,total:changes.length,skipped};
    }catch(e){throw Error('Recorded '+done+'/'+changes.length+': '+e.message);}
    finally{state.servoConfigBusy=false;renderParams();renderBasic();window.dispatchEvent(new Event('atlas:parameters'));}
  },
  ftpSend:async(header)=>{
    if(!state.connected||state.sysid===null||(!state.port&&!state.bridgeReady))throw Error('Connect MAVLink first');
    return transmit(110,M.ftpFrame(state.sysid,state.compid,header));
  },
  log:(msg,warning=false)=>toast(msg,warning)
});
function openEdit(name){const p=state.params.get(name);if(!p){toast(tr('noread'),true);return;}
 if(!canWrite()){toast(state.demo?tr('saveNotLive'):tr('onlyDisarmed'),true);return;}
 if(window.AtlasParamTree?.isReadOnly(name)){toast(name+' · ReadOnly',true);return;}
 state.editName=name;$('editName').textContent=name;$('editOriginal').textContent=`${tr('value')}: ${formatParam(p.value)} | MAV_PARAM_TYPE: ${p.type}`;$('editValue').value=formatParam(p.value);$('editDialog').showModal();$('editValue').focus();$('editValue').select();}
async function saveEdit(ev){
 ev.preventDefault();
 const name=state.editName,p=state.params.get(name),raw=$('editValue').value.trim(),value=Number(raw);
 if(!p||!raw||!Number.isFinite(value)){toast(tr('selectvalid'),true);return;}
 if(!canWrite()){toast(tr('onlyDisarmed'),true);return;}
 const metadata=Object.fromEntries(window.AtlasParamTree?.getMetadata?.()||[]);
 const report=window.AtlasQuickSetupCore?.parseParamText(name+' '+raw+'\n',state.params,metadata);
 if(!report?.valid||report.skipped.length||report.errors.length){toast(name+' · '+(report?.skipped?.[0]?.reason||report?.errors?.[0]?.reason||'Invalid parameter'),true);return;}
 if(!confirm(`${name}: ${formatParam(p.value)} → ${value}\n${tr('editwarning')}`))return;
 $('editDialog').close();
 try{
  await writeParameterWithAck(name,value,p.type);
  toast(`${tr('writesuccess')}: ${name}=${value}`);
  renderParams();renderBasic();
 }catch(err){toast(`${tr('senderror')} ${name}: ${err.message}`,true);}
}

function renderBasic(){const grid=$('basicGrid');grid.replaceChildren();const filter=state.group;for(const s of settingDefs){if(filter!=='all'&&filter!==s.group)continue;
 const value=state.params.get(s.key);const card=document.createElement('article');card.className='cc-setting-card';
 const row=document.createElement('div');row.className='cc-setting-line';const code=document.createElement('code');code.textContent=s.key;const label=document.createElement('span');label.className='cc-setting-tag';label.textContent=s.group.toUpperCase();row.append(code,label);
 const desc=document.createElement('div');desc.className='cc-setting-label';desc.textContent=s.desc[lang==='uk'?1:lang==='en'?2:0];
 const bottom=document.createElement('div');bottom.className='cc-setting-bottom';const val=document.createElement('strong');val.textContent=value?formatParam(value.value):'—';const btn=document.createElement('button');btn.className='cc-button ghost';btn.textContent=tr('edit');btn.disabled=!value||!canWrite();btn.addEventListener('click',()=>openEdit(s.key));bottom.append(val,btn);card.append(row,desc,bottom);grid.append(card);
 }}
function renderCategoryNav(){
 const node=$('paramCategories');if(!node)return;
 const counts=new Map(categoryDefs.map(([c])=>[c,0]));
 for(const name of state.params.keys())counts.set(parameterCategory(name),(counts.get(parameterCategory(name))||0)+1);
 node.replaceChildren();
 for(const [category,label] of categoryDefs){const button=document.createElement('button');button.type='button';button.className='cc-param-category'+(state.paramCategory===category?' selected':'');button.dataset.category=category;
  button.textContent=`${tr(label)} · ${category==='all'?state.params.size:(counts.get(category)||0)}`;
  button.addEventListener('click',()=>{state.paramCategory=category;state.tableLimit=150;renderParams();});node.append(button);
 }
}
function renderParams(){
 if(window.AtlasParamTree){
  window.AtlasParamTree.render({state,lang,formatParam,canWrite,edit:openEdit,onSelect:renderParams,limit:state.tableLimit});
  showProgress();return;
 }
}

function exportParams(){if(state.params.size===0){toast(tr('exportempty'),true);return;}
 const rows=[...state.params].sort((a,b)=>a[0].localeCompare(b[0])).map(([name,p])=>`${name}\t${formatParam(p.value)}`);const blob=new Blob(['# A.T.L.A.S. parameter backup\n# '+new Date().toISOString()+'\n'+rows.join('\n')+'\n'],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`ATLAS-${new Date().toISOString().slice(0,10)}.param`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);}
function prepareImported(){
 if(!state.importedText||!state.params.size){state.imported=null;state.importReport=null;return;}
 const metadata=Object.fromEntries(window.AtlasParamTree?.getMetadata?.()||[]);
 const report=window.AtlasQuickSetupCore.parseParamText(state.importedText,state.params,metadata);
 state.importReport=report;state.imported=new Map(report.entries);
}
async function importParams(file){
 if(!file)return;
 try{
  if(file.size>5*1024*1024)throw Error('Maximum .param file size: 5 MiB');
  state.importedText=await file.text();
  state.imported=null;state.importReport=null;
  if(!state.params.size)toast('File selected: read FC parameters first');
  else prepareImported();
  $('bulkConsent').checked=false;state.bulk=null;state.bulkCancel=false;
  renderImportDiff();navigate('params');
  toast(`${tr('imported')}: ${state.importReport?.entries?.size||0}; skipped: ${state.importReport?.skipped?.length||0}`);
 }catch(e){toast(e.message,true);}finally{$('importParamFile').value='';}
}
function downloadImportReport(){
 if(!state.importReport)return;
 const lines=['# A.T.L.A.S. skipped .param entries','# '+new Date().toISOString()];
 for(const x of state.importReport.skipped)lines.push([x.line||'',x.name||'',x.reason||'',x.value??''].join('\t'));
 for(const x of state.importReport.errors)lines.push(['',x.name||'',x.reason||'validation-error',''].join('\t'));
 if(state.bulk?.failed)for(const x of state.bulk.failed)lines.push(['',x,'write-rejected',''].join('\t'));
 const blob=new Blob([lines.join('\n')+'\n'],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='ATLAS-import-skipped.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function paramEqual(a,b){return Math.abs(a-b)<=Math.max(1e-5,Math.abs(b)*2e-6);}
function importDiffRows(){if(!state.imported)return [];
 return [...state.imported].filter(([name,value])=>{const p=state.params.get(name);return !p||!paramEqual(p.value,value);});}
function renderImportDiff(){const box=$('importDiff');if(!state.importedText){box.hidden=true;return;}box.hidden=false;
 const differing=importDiffRows(),missing=state.importReport?.skipped||[],writable=differing.filter(([name])=>state.params.has(name));
 $('importDiffCount').textContent=`${writable.length} ${tr('parameterImportDiff')} / ${missing.length} ${tr('batchUnsupported')}`;
 const rows=$('importDiffRows');rows.replaceChildren();for(const [name,val]of differing.slice(0,60)){
  const row=document.createElement('div');row.className='cc-diff-row';const key=document.createElement('code');key.textContent=name;const right=document.createElement('span');const current=state.params.get(name);
  right.textContent=current?`${formatParam(current.value)} → ${formatParam(val)}`:`— → ${formatParam(val)} (${tr('batchUnsupported')})`;
  row.append(key,right);rows.append(row);
 }if(differing.length>60){const x=document.createElement('p');x.textContent=`+ ${differing.length-60} ...`;rows.append(x);}
 const summary=$('importSkipNote');if(summary)summary.textContent=state.importedText&&!state.params.size?'Read FC parameters first':`${missing.length} skipped (unknown, read-only, invalid or unsupported) · ${state.importReport?.metadataMissingCount||0} without local range metadata`;
 const list=$('importSkippedRows');if(list){list.replaceChildren();for(const item of missing.slice(0,20)){const row=document.createElement('div');row.textContent=(item.name||'line '+item.line)+' · '+item.reason;list.append(row);}}
 const reportBtn=$('importDownloadSkipped');if(reportBtn)reportBtn.disabled=!state.importReport;
 const b=state.bulk,canStart=!!state.importReport&&!state.importReport.errors.length&&writable.length>0&&canWrite()&&$('bulkConsent').checked&&!state.paramLoading;
 $('bulkWriteBtn').disabled=!!b?.running||!canStart;
 $('bulkCancelBtn').hidden=!b?.running;
 $('bulkConsent').disabled=!!b?.running;
 if(b?.running)$('bulkProgress').textContent=`${tr('batchProgress')}: ${b.done}/${b.total} · ${tr('batchFailed')}: ${b.failed.length}`;
 else if(b)$('bulkProgress').textContent=`${b.message} · ${tr('batchSaved')}: ${b.done}/${b.total} · ${tr('batchFailed')}: ${b.failed.length}`+(b.failed.length?` [${b.failed.slice(0,8).join(', ')}]`:'');
 else $('bulkProgress').textContent=`${writable.length} ${tr('parameterImportDiff')}; ${missing.length} ${tr('batchUnsupported')}`;
}
async function writeParameterWithAck(name,value,type){
 if(!state.connected||state.sysid===null||state.armed!==false||Date.now()-state.lastHeartbeat>=4000)throw Error('MAVLink link or DISARMED heartbeat missing');
 if(state.writeWait)throw Error('Other PARAM_SET in progress');
 const promise=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{if(state.writeWait?.name===name){state.writeWait=null;reject(Error(tr('paramReq')));}},3500);state.writeWait={name,value,resolve,reject,timer};});
 try{await transmit(23,M.paramSet(state.sysid,state.compid,name,value,type));return await promise;}
 catch(e){if(state.writeWait?.name===name){clearTimeout(state.writeWait.timer);state.writeWait=null;}throw e;}
}
async function writeImported(){
 if(!state.imported||!state.importReport||state.importReport.errors.length||!$('bulkConsent').checked||!canWrite()||state.paramLoading){toast(tr('batchNoLink'),true);renderImportDiff();return;}
 const entries=importDiffRows().filter(([name])=>state.params.has(name));
 if(!entries.length){toast(tr('batchEmpty'));return;}
 state.bulk={running:true,total:entries.length,done:0,failed:[],message:''};state.bulkCancel=false;
 renderImportDiff();toast(tr('batchStart')+' · '+entries.length);
 for(const [name,value]of entries){if(state.bulkCancel||!state.connected||state.armed!==false||Date.now()-state.lastHeartbeat>=4000)break;
  const p=state.params.get(name);if(!p){state.bulk.failed.push(name+' (not loaded)');continue;}
  let verified=false;
  for(let attempt=1;attempt<=3;attempt++){
   if(state.bulkCancel||!state.connected||state.armed!==false)break;
   try{await writeParameterWithAck(name,value,p.type);verified=true;break;}catch(e){if(attempt===3)state.bulk.failed.push(name+': '+e.message);}
  }
  if(verified)state.bulk.done++;
  renderImportDiff();await new Promise(resolve=>setTimeout(resolve,85));
 }
 const b=state.bulk;b.running=false;b.message=state.bulkCancel?tr('batchStopped'):b.done===b.total?tr('batchDone'):tr('batchPartial');
 $('bulkConsent').checked=false;renderImportDiff();renderParams();renderBasic();toast(`${b.message} · ${b.done}/${b.total}`+ (b.failed.length?` · ${b.failed.slice(0,8).join(', ')}`:''),b.done!==b.total);
}
function renderBoards(){const grid=$('firmwareBoards');grid.replaceChildren();const boards=state.boards.length?state.boards.filter(b=>b.id!=='other-boards'):[{id:'cube-orange-plus',name:'Cube Orange Plus',status:'planned'},{id:'matek-h743-wing-v3',name:'Matek H743-WING V3',status:'planned'},{id:'uni-ic743-mini',name:'Uni-IC743 Mini',status:'planned'}];for(const b of boards){const btn=document.createElement('button');btn.className='cc-board-choice'+(state.selectedBoard===b.id?' selected':'');btn.type='button';const mark=document.createElement('span');mark.textContent=state.selectedBoard===b.id?'✓':'';const name=document.createElement('strong');name.textContent=b.name;const small=document.createElement('small');small.textContent=b.status==='available'?'HEX':['cube-orange-plus','uni-ic743-mini'].includes(b.id)?'HEX · LOCAL':tr('pending').toUpperCase();btn.append(mark,name,small);btn.addEventListener('click',()=>{if(window.AtlasDfuUi?.isBusy())return;state.selectedBoard=b.id;renderBoards();window.dispatchEvent(new CustomEvent('atlas:board',{detail:{board:b.id}}));});grid.append(btn);}const selected=boards.find(b=>b.id===state.selectedBoard);$('boardSelection').textContent=tr('boardWaiting')+(selected?.name||'—')+' / '+tr('compat');}
function renderReleases(){
 const container=$('releaseList');container.replaceChildren();
 const boards=state.boards.filter(b=>b.id!=='other-boards');
 if(!boards.length)boards.push({name:'Cube Orange Plus',downloads:[]},{name:'Matek H743-WING V3',downloads:[]},{name:'Uni-IC743 Mini',downloads:[]});
 for(const board of boards){
  const box=document.createElement('div');box.className='cc-release-item';
  const title=document.createElement('strong');title.textContent=board.name;
  const info=document.createElement('small');
  const downloads=(board.downloads||[]).filter(d=>
   window.AtlasFirmwareAccess?.isProtected(d) && d.channel==='release' &&
   /^[a-f0-9]{64}$/i.test(d.sha256||''));
  info.textContent=downloads.length?`${downloads.length} ${tr('releases')}`:tr('notavailable');box.append(title,info);
  for(const d of downloads){
   const btn=document.createElement('button');
   btn.className='cc-release-download';btn.type='button';
   const releaseName=document.createElement('span');
   releaseName.className='cc-release-download-title';
   releaseName.textContent=d.label||d.filename||'Firmware';
   const actionLabel=document.createElement('span');
   actionLabel.className='cc-release-download-action';
   const actionText={ru:'СКАЧАТЬ',uk:'ЗАВАНТАЖИТИ',en:'DOWNLOAD'};
   actionLabel.textContent='PIN · '+(actionText[lang]||actionText.ru)+' ↗';
   btn.append(releaseName,actionLabel);
   btn.addEventListener('click',async()=>{
    btn.disabled=true;
    try{await window.AtlasFirmwareAccess.download(d);}
    catch(err){if(err.message!=='Access cancelled')toast(err.message||'Firmware access failed',true);}
    finally{btn.disabled=false;}
   });
   box.append(btn);
  }
  container.append(box);
 }
}
async function loadCatalog(){let info=null;try{const embedded=$('atlasEmbeddedData');if(embedded)info=JSON.parse(embedded.textContent);else{const response=await fetch('data/releases.json',{cache:'no-store'});if(response.ok)info=await response.json();}}catch(e){console.warn(e);}state.boards=info?.boards||[];renderBoards();renderReleases();}
async function parseApj(file){if(!file)return;state.apj=null;state.apjFilename=file.name;try{if(file.size>32*1024*1024)throw Error('File too large');const obj=JSON.parse(await file.text());if(!Number.isSafeInteger(obj.board_id)||typeof obj.image!=='string'||!obj.image.length)throw Error(tr('metaBad'));state.apj=obj;
 const node=$('apjMetadata');node.replaceChildren();const pair=(k,v)=>{const dl=document.createElement('dl'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=String(v);dl.append(dt,dd);node.append(dl);};pair(tr('filename'),file.name);pair(tr('boardid'),obj.board_id);pair(tr('size'),(obj.image_size===undefined?'?':`${(obj.image_size/1024).toFixed(1)} KiB`));pair(tr('format'),'ArduPilot APJ / JSON');pair('STATUS',tr('metaFound'));toast(`APJ board_id=${obj.board_id} · ${file.name}`);
 }catch(err){$('apjMetadata').textContent=tr('metaBad');toast(`${tr('error')}: ${err.message}`,true);}}
// Schedule work only while the user can see the dashboard; keep the same ~30 FPS when active.
function scheduleHorizon(){
 if(state.pageLeaving||!state.hudLoopActive||document.hidden||state.selectedTab!=='dashboard'||state.hudRaf)return;
 state.hudRaf=requestAnimationFrame(drawHorizon);
}
function drawHorizon(ts){
 state.hudRaf=0;
 if(!state.hudLoopActive||state.pageLeaving||document.hidden||state.selectedTab!=='dashboard')return;
 if(ts-(state.lastCanvasDraw||0)<33){scheduleHorizon();return;}
 state.lastCanvasDraw=ts;
 const canvas=$('attitudeCanvas'),ctx=canvas.getContext('2d');const rect=canvas.getBoundingClientRect();
 if(rect.width<10)return;
 const dpr=Math.min(2,window.devicePixelRatio||1),w=rect.width,h=rect.height;if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 if(state.demo){const t=ts/1000;state.telemetry.roll=19*Math.sin(t*.66);state.telemetry.pitch=8*Math.sin(t*.41);state.telemetry.yaw=(220+(t*3.2)%360)%360;state.telemetry.airspeed=104+28*Math.sin(t*.21);state.telemetry.altitude=150+16*Math.sin(t*.32);state.telemetry.voltage=23.2+0.1*Math.cos(t*.05);}
 const visualValid=state.demo||heartbeatLive();
 const roll=visualValid?(state.telemetry.roll||0):0,pitch=visualValid?(state.telemetry.pitch||0):0;const r=roll*Math.PI/180;
 const midx=w/2,midy=h/2;ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();ctx.translate(midx,midy);ctx.rotate(-r);ctx.translate(0,pitch*h/88);const W=2*Math.max(w,h);
 const sky=ctx.createLinearGradient(0,-W,0,0);sky.addColorStop(0,'#0a201b');sky.addColorStop(1,'#304b38');ctx.fillStyle=sky;ctx.fillRect(-W,-W,2*W,W);
 const ground=ctx.createLinearGradient(0,0,0,W);ground.addColorStop(0,'#474326');ground.addColorStop(1,'#18190d');ctx.fillStyle=ground;ctx.fillRect(-W,0,2*W,W);
 ctx.strokeStyle='#eedb7a';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-W,0);ctx.lineTo(W,0);ctx.stroke();ctx.lineWidth=1;
 ctx.font='bold 12px "IBM Plex Mono",monospace';ctx.textAlign='left';
 for(let angle=-80;angle<=80;angle+=10){if(angle===0)continue;let y=-angle*h/88;ctx.strokeStyle=angle%20===0?'#ced09bb3':'#9ba87988';ctx.fillStyle='#ded2a7';ctx.lineWidth=angle%20===0?1.5:1;ctx.beginPath();ctx.moveTo(-31,y);ctx.lineTo(31,y);ctx.stroke();if(angle%20===0){ctx.fillText(String(Math.abs(angle)),-64,y+4);ctx.fillText(String(Math.abs(angle)),38,y+4);}}
 ctx.restore();
 // screen overlay rings, angular ticks, and flight director fixed to aircraft
 ctx.strokeStyle='#e5ce6555';ctx.lineWidth=1;ctx.beginPath();ctx.arc(midx,midy,Math.min(w,h)*.38,0,Math.PI*2);ctx.stroke();
 ctx.lineWidth=3.2;ctx.strokeStyle='#ffe48a';ctx.lineCap='square';ctx.beginPath();ctx.moveTo(midx-w*.23,midy);ctx.lineTo(midx-w*.085,midy);ctx.lineTo(midx-w*.05,midy+12);ctx.moveTo(midx+w*.23,midy);ctx.lineTo(midx+w*.085,midy);ctx.lineTo(midx+w*.05,midy+12);ctx.moveTo(midx-13,midy);ctx.lineTo(midx+13,midy);ctx.moveTo(midx,midy-13);ctx.lineTo(midx,midy+13);ctx.stroke();
 ctx.strokeStyle='#d4c368b8';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(midx,midy,Math.min(w,h)*.45,Math.PI*1.1,Math.PI*1.9);ctx.stroke();for(let a=-60;a<=60;a+=15){const deg=(a-90)*Math.PI/180,rad=Math.min(w,h)*.45;ctx.beginPath();ctx.moveTo(midx+rad*Math.cos(deg),midy+rad*Math.sin(deg));ctx.lineTo(midx+(rad-((a%30)?7:13))*Math.cos(deg),midy+(rad-((a%30)?7:13))*Math.sin(deg));ctx.stroke();}
 ctx.fillStyle='#f6e17b';ctx.beginPath();ctx.moveTo(midx,midy-Math.min(w,h)*.46);ctx.lineTo(midx-9,midy-Math.min(w,h)*.46-13);ctx.lineTo(midx+9,midy-Math.min(w,h)*.46-13);ctx.fill();
 ctx.font='bold 12px "IBM Plex Mono",monospace';ctx.textAlign='center';ctx.fillStyle='#e4d088';ctx.fillText('A.T.L.A.S. // ATTITUDE',midx,h-20);ctx.textAlign='left';ctx.fillStyle='#b9c495a6';ctx.textAlign='right';ctx.fillText(state.demo?'SYNTHETIC':heartbeatLive()?'MAVLINK':state.connected?'NO HEARTBEAT':'OFFLINE',w-15,26);
 if(ts-state.renderTimer>140){state.renderTimer=ts;updateTelemetryUI();}scheduleHorizon();
}
function wire(){document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.language)));document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.tab)));
 // Explicitly close the live serial session BEFORE navigating home; pagehide alone
 // cannot guarantee that asynchronous port.close() completes before unloading.
 document.querySelectorAll('a[href="index.html"], a[href="faq.html"], a[href="changelog.html"]').forEach(a=>a.addEventListener('click',async ev=>{
   if(!state.connected && !state.rxActive && !state.port)return;
   ev.preventDefault();const href=a.href;
   await Promise.race([cleanupForNavigation().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,1500))]);
   window.location.assign(href);
 }));
 $('networkMode').addEventListener('change',syncNetworkDefaults);$('networkConnectBtn').addEventListener('click',connectBridge);
 $('connectBtn').addEventListener('click',connect);$('demoBtn').addEventListener('click',enterDemo);$('readBasicsBtn').addEventListener('click',()=>startParamLoad(false));$('refreshParamsBtn').addEventListener('click',()=>startParamLoad(true));$('twoPassParamsBtn').addEventListener('click',readParamsTwice);$('exportParamsBtn').addEventListener('click',exportParams);$('paramSearch').addEventListener('input',()=>{state.tableLimit=150;renderParams();});$('moreParamsBtn').addEventListener('click',()=>{state.tableLimit+=180;renderParams();});$('paramModifiedOnly').addEventListener('change',renderParams);$('paramNoDefaultOnly').addEventListener('change',renderParams);
 window.addEventListener('atlas:metadata',()=>{if(state.importedText)prepareImported();renderParams();renderImportDiff();});
 window.AtlasParamTree?.initialize({render:renderParams,langGetter:()=>lang});
 $('importParamFile').addEventListener('change',ev=>importParams(ev.target.files[0]));$('bulkConsent').addEventListener('change',renderImportDiff);$('bulkWriteBtn').addEventListener('click',writeImported);$('importDownloadSkipped').addEventListener('click',downloadImportReport);$('bulkCancelBtn').addEventListener('click',()=>{state.bulkCancel=true;$('bulkProgress').textContent=tr('batchStopped')+' — '+tr('pending');});$('apjInput').addEventListener('change',ev=>parseApj(ev.target.files[0]));
 $('apjDropzone').addEventListener('dragover',ev=>{ev.preventDefault();$('apjDropzone').classList.add('dragging');});$('apjDropzone').addEventListener('dragleave',()=>$('apjDropzone').classList.remove('dragging'));$('apjDropzone').addEventListener('drop',ev=>{ev.preventDefault();$('apjDropzone').classList.remove('dragging');parseApj(ev.dataTransfer?.files?.[0]);});
 document.querySelectorAll('[data-group]').forEach(btn=>btn.addEventListener('click',()=>{state.group=btn.dataset.group;document.querySelectorAll('[data-group]').forEach(n=>n.classList.toggle('active',n===btn));renderBasic();}));
 $('closeEdit').addEventListener('click',()=>$('editDialog').close());$('cancelEdit').addEventListener('click',()=>$('editDialog').close());$('editForm').addEventListener('submit',saveEdit);
 window.addEventListener('hashchange',()=>{const tab=location.hash.replace('#','');if(['dashboard','quicksetup','basic','params','firmware','accelerometer','servos','battery','compass','temperature','osd','tuning','mavftp','modes','radio','joystick','gimbal','parachute'].includes(tab))navigate(tab);});
 const leavePage=()=>{cleanupForNavigation().catch(()=>{});};
 window.addEventListener('pagehide',leavePage,{capture:true});
 window.addEventListener('beforeunload',leavePage,{capture:true});
 document.addEventListener('visibilitychange',scheduleHorizon);
 window.addEventListener('pageshow',ev=>{if(ev.persisted){state.pageLeaving=false;state.hudLoopActive=true;state.lastHeartbeat=0;updateConnectionUI();scheduleHorizon();}});
}
const oneClickToken=consumeOneClickTcpToken();
wire();setLang(lang);loadCatalog();const firstTab=location.hash.replace('#','');navigate(['dashboard','quicksetup','basic','params','firmware','accelerometer','servos','battery','compass','temperature','osd','tuning','mavftp','modes','radio','joystick','gimbal','parachute'].includes(firstTab)?firstTab:'dashboard');toast('A.T.L.A.S. Control Center · Release 1.0');state.hudLoopActive=true;scheduleHorizon();
if(oneClickToken)startOneClickTcp(oneClickToken);
})();
