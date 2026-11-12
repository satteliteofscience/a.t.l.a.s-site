/* A.T.L.A.S. DFU user interface: destructive commands require explicit opt-in. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  if(!$('dfuPanel')||!window.AtlasDFU)return;
  const MANIFESTS=Object.freeze({
    'matek-h743-wing-v3':'Firmware/Matek Wing H743-V3/manifest.json',
    'cube-orange-plus':'Firmware/Cube Orange Plus/manifest.json',
    'uni-ic743-mini':'Firmware/Uni-IC743 Mini/manifest.json'
  });
  const supportedBoard=id=>Object.prototype.hasOwnProperty.call(MANIFESTS,id);
  const T={
    ru:{title:'STM32 DFU · ПОЛНАЯ ЗАПИСЬ HEX',mode:'DFU-подключение (не MAVLink)',howdfu:'Удерживай BOOT на USB-переходнике Matek и подключи USB к ПК. Затем нажми «Подключить DFU». Закрой Mission Planner и другие программы, занявшие USB.',detect:'Подключить DFU',disconnect:'Отключить DFU',getLatest:'Загрузить последний .hex',chooseLocal:'Выбрать локальный .hex',notloaded:'Файл не загружен',waiting:'DFU не подключён',ready:'Устройство DFU обнаружено',unsupported:'WebUSB недоступен. Требуется Chrome / Edge, HTTPS или localhost.',manifestEmpty:'В каталоге нет опубликованного HEX. Выбери локальный файл или добавь его в приватную папку Firmware.',unsafeBoard:'Выбери Matek H743-WING V3 в карточках выше.',flash:'СТЕРЕТЬ И ЗАПИСАТЬ HEX',erasing:'Выполняется...',backup:'Я сохранил параметры и знаю, что стирание удалит загрузчик и все данные Flash.',model:'Я проверил маркировку платы: это Matek H743-WING V3 (STM32H743). USB DFU не подтверждает модель платы.',confirm:'Для подтверждения введи ERASE',warning:'ВНИМАНИЕ: полный Mass Erase 2 MiB (до 0xFF), затем запись и побайтовая проверка. При обрыве питания понадобится восстановление через DFU/STM32CubeProgrammer. Перед началом проверь резервную копию параметров и способ восстановления загрузчика.',nohardware:'Никаких операций ERASE/WRITE без нажатия кнопки не выполняется.',meta:'Источник · SHA-256 · диапазон памяти',complete:'Готово: запись проверена побайтово. Выйди из DFU вручную и проверь работу платы.',postflash:'После успешной записи дождись полной загрузки контроллера. Если COM-порт не появился, отключи и подключи USB ещё два раза. По наблюдениям на Matek H743-WING V3 порт может определиться только при третьем подключении.',chipUnknown:'Режим DFU найден, но карту 2 MiB / 16×128 KiB или wTransferSize определить не удалось. Прошивка заблокирована.',progress:'ПРОГРЕСС',stError:'ОШИБКА',fileIssue:'Ошибка HEX',private:'Удалённая прошивка загружается из приватного R2 после проверки PIN.',slow:'Запись может занять некоторое время. Не отключай USB и питание.'},
    uk:{title:'STM32 DFU · ПОВНИЙ ЗАПИС HEX',mode:'DFU-з’єднання (не MAVLink)',howdfu:'Утримуй BOOT на USB-перехіднику Matek і під’єднай USB до ПК. Потім натисни «Під’єднати DFU». Закрий Mission Planner та інші програми, що займають USB.',detect:'Під’єднати DFU',disconnect:'Від’єднати DFU',getLatest:'Завантажити останній .hex',chooseLocal:'Вибрати локальний .hex',notloaded:'Файл не завантажений',waiting:'DFU не під’єднано',ready:'DFU-пристрій виявлено',unsupported:'WebUSB недоступний. Потрібні Chrome / Edge, HTTPS або localhost.',manifestEmpty:'У каталозі немає опублікованого HEX. Вибери локальний файл або додай його до приватної папки Firmware.',unsafeBoard:'Вибери Matek H743-WING V3 у картках вище.',flash:'СТЕРТИ Й ЗАПИСАТИ HEX',erasing:'Виконується...',backup:'Я зберіг параметри та знаю, що стирання видалить завантажувач і всю Flash.',model:'Я перевірив маркування плати: Matek H743-WING V3 (STM32H743). USB DFU не підтверджує модель плати.',confirm:'Для підтвердження введи ERASE',warning:'УВАГА: повне Mass Erase 2 MiB (до 0xFF), потім запис та побайтова перевірка. У разі втрати живлення потрібне відновлення через DFU/STM32CubeProgrammer. Перед початком перевір резервну копію параметрів і спосіб відновлення завантажувача.',nohardware:'ERASE/WRITE не виконується без натискання кнопки.',meta:'Джерело · SHA-256 · адреси',complete:'Готово: запис перевірено побайтно. Вийди з DFU вручну та перевір роботу плати.',postflash:'Після успішного запису дочекайся повного завантаження контролера. Якщо COM-порт не з’явився, від’єднай і під’єднай USB ще двічі. За спостереженнями на Matek H743-WING V3 порт може визначитися лише з третього підключення.',chipUnknown:'DFU знайдено, але карту 2 MiB / 16×128 KiB або wTransferSize не визначено. Прошивання заблоковано.',progress:'ПРОГРЕС',stError:'ПОМИЛКА',fileIssue:'Помилка HEX',private:'Віддалена прошивка завантажується з приватного R2 після перевірки PIN.',slow:'Не вимикай живлення та USB до завершення.'},
    en:{title:'STM32 DFU · FULL HEX FLASH',mode:'DFU connection (not MAVLink)',howdfu:'Hold BOOT on the Matek USB adapter while connecting USB to the PC. Then select Connect DFU. Close Mission Planner and other programs using the USB interface.',detect:'Connect DFU',disconnect:'Disconnect DFU',getLatest:'Load latest .hex',chooseLocal:'Choose local .hex',notloaded:'No firmware loaded',waiting:'DFU not connected',ready:'DFU device detected',unsupported:'WebUSB unavailable. Use Chrome / Edge on HTTPS or localhost.',manifestEmpty:'No HEX published in the catalog. Select a local file or add it to the private Firmware folder.',unsafeBoard:'Select Matek H743-WING V3 in the board list above.',flash:'ERASE + PROGRAM HEX',erasing:'Working...',backup:'I backed up parameters and understand that erasing removes the bootloader and all Flash data.',model:'I checked the board label: Matek H743-WING V3 (STM32H743). USB DFU cannot identify the board model.',confirm:'Type ERASE to confirm',warning:'WARNING: full-chip Mass Erase 2 MiB (to 0xFF), then program and byte-for-byte verify. Power loss may require recovery via DFU/STM32CubeProgrammer. Before proceeding, confirm your parameter backup and bootloader recovery method.',nohardware:'No ERASE/WRITE operation runs without clicking the flash button.',meta:'Source · SHA-256 · flash range',complete:'Done: byte-for-byte readback matched. Exit DFU manually and validate the board.',postflash:'After a successful flash, wait for the flight controller to finish booting. If the COM port does not appear, disconnect and reconnect USB two more times. On the Matek H743-WING V3, the port has been observed to appear only on the third connection.',chipUnknown:'DFU found, but 2 MiB / 16×128 KiB map or wTransferSize is unknown. Flashing locked.',progress:'PROGRESS',stError:'ERROR',fileIssue:'Invalid HEX',private:'Remote firmware loads from private R2 after a valid PIN.',slow:'Do not disconnect power or USB until complete.'}
  };
  const CUBE_T={
    ru:{
      howdfu:'Cube Orange Plus (STM32H757): обычное обновление через загрузчик ArduPilot и .apj предпочтительнее. Для записи полного HEX требуется ROM DFU (STM32 BOOTLOADER), который на Cube может требовать аппаратного доступа. Не замыкай контакты без инструкции производителя.',
      unsafeBoard:'Выбери именно Cube Orange Plus.',
      model:'Я проверил надпись на контроллере: Cube Orange Plus (STM32H757), а не Cube Orange. USB DFU не определяет модель платы.',
      warning:'ОПАСНО: полный Mass Erase 2 MiB на STM32H757 удаляет загрузчик и прошивку. Возможна необходимость восстановления через ST-LINK/STM32CubeProgrammer. Перед началом сохрани параметры и убедись, что доступно восстановление загрузчика.',
      postflash:'После записи переподключи USB и проверь запуск Cube Orange Plus. Если не стартует, используй STM32CubeProgrammer или аппаратный отладчик. До калибровок пропеллеры должны быть сняты.'
    },
    uk:{
      howdfu:'Cube Orange Plus (STM32H757): звичайне оновлення через завантажувач ArduPilot та .apj є кращим варіантом. Для повного HEX потрібен ROM DFU (STM32 BOOTLOADER), на Cube може знадобитися фізичний доступ. Не замикай контакти без інструкції виробника.',
      unsafeBoard:'Обери саме Cube Orange Plus.',
      model:'Я перевірив маркування контролера: Cube Orange Plus (STM32H757), а не Cube Orange. USB DFU не визначає модель плати.',
      warning:'НЕБЕЗПЕКА: повний Mass Erase 2 MiB на STM32H757 видаляє завантажувач і прошивку. Може знадобитися відновлення через ST-LINK/STM32CubeProgrammer. Перед початком збережи параметри та переконайся, що відновлення завантажувача доступне.',
      postflash:'Після запису повторно підключи USB і перевір запуск Cube Orange Plus. Якщо не стартує, використовуй STM32CubeProgrammer або апаратний відладчик. До калібрувань зніми пропелери.'
    },
    en:{
      howdfu:'Cube Orange Plus (STM32H757): normal updates through the ArduPilot bootloader with .apj are preferred. Full HEX requires STM32 ROM DFU, which may need physical board access. Do not bridge pins without official hardware instructions.',
      unsafeBoard:'Select Cube Orange Plus.',
      model:'I verified the physical board label: Cube Orange Plus (STM32H757), NOT Cube Orange. Generic USB DFU cannot identify the board model.',
      warning:'DANGER: full 2 MiB Mass Erase on STM32H757 removes the bootloader and firmware. ST-LINK/STM32CubeProgrammer recovery may be required. Back up parameters and ensure you have a bootloader recovery path before flashing.',
      postflash:'After flashing, reconnect USB and verify Cube Orange Plus starts. If not, use STM32CubeProgrammer or a hardware debug probe. Remove propellers before calibrations.'
    }
  };
  const UNI_T={
    ru:{
      howdfu:'Uni-IC743 Mini (STM32H743): для полной записи HEX требуется режим STM32 ROM DFU. Способ входа в BOOT зависит от кастомной платы; проверь её схему. Не замыкай контакты наугад. Отключи Mission Planner.',
      model:'Я проверил именно плату Uni-IC743 Mini (STM32H743) и маркер Uni_IC743Mini в HEX. Идентификатор STM32 DFU сам по себе не определяет модель платы.',
      warning:'ВНИМАНИЕ: полный Mass Erase 2 MiB удаляет загрузчик и параметры. Перед записью обеспечь возможность восстановления через STM32CubeProgrammer или SWD.',
      postflash:'После записи отключи BOOT-режим и переподключи USB. Проверь появление MAVLink, параметры, датчики и режимы. Пропеллер снимай до любых проверок и калибровок.'
    },
    uk:{
      howdfu:'Uni-IC743 Mini (STM32H743): для повного HEX потрібен STM32 ROM DFU. Вхід у BOOT залежить від кастомної плати; перевір її схему. Не замикай контакти навмання. Закрий Mission Planner.',
      model:'Я перевірив саме Uni-IC743 Mini (STM32H743) і маркер Uni_IC743Mini у HEX. STM32 DFU сам по собі не визначає модель плати.',
      warning:'УВАГА: повне стирання 2 MiB видаляє завантажувач і параметри. Підготуй відновлення через STM32CubeProgrammer або SWD.',
      postflash:'Після запису вийди з BOOT і повторно підключи USB. Перевір MAVLink, параметри, датчики та режими. Зніми пропелер перед калібруванням.'
    },
    en:{
      howdfu:'Uni-IC743 Mini (STM32H743): full HEX installation requires STM32 ROM DFU. BOOT entry depends on the custom board hardware; consult its schematic, and do not randomly bridge pins. Close Mission Planner.',
      model:'I verified the Uni-IC743 Mini (STM32H743) board label and Uni_IC743Mini firmware marker. Generic STM32 DFU cannot identify the board.',
      warning:'WARNING: full 2 MiB Mass Erase removes the bootloader and parameters. Ensure STM32CubeProgrammer/SWD recovery is available.',
      postflash:'Exit BOOT mode and reconnect USB. Verify MAVLink, parameters, sensors and flight modes. Remove the propeller before checks or calibration.'
    }
  };
  const tr=key=>{
    const lang=window.AtlasLanguage?.()||'ru';
    const board=selectedBoard();
    return (board==='cube-orange-plus'?CUBE_T[lang]?.[key]:board==='uni-ic743-mini'?UNI_T[lang]?.[key]:null)||(T[lang]||T.ru)[key]||key;
  };
  let current=null, image=null, fileInfo=null, busy=false, releaseLoadBusy=false, localLoadBusy=false, lastPhase='', usbSupported=!!(navigator.usb&&window.isSecureContext);
   window.AtlasDfuUi=Object.freeze({isBusy:()=>busy||releaseLoadBusy||localLoadBusy});
  function selectedBoard(){return window.AtlasSelectedBoard?.()||'cube-orange-plus';}
  function imageMatchesBoard(){
    if(!image||!supportedBoard(selectedBoard()))return false;
    const board=selectedBoard();
    if(board==='cube-orange-plus')return image.detectedTarget==='cube-orange-plus';
    if(board==='uni-ic743-mini')return image.detectedTarget==='uni-ic743-mini';
    // Preserve support for legacy Matek builds without a public target string,
    // but never allow a known Cube or Uni target to be written to a Matek.
    return board==='matek-h743-wing-v3' &&
      (image.detectedTarget===null||image.detectedTarget==='matek-h743-wing-v3');
  }
  function log(message,kind='info'){
    const box=$('dfuLog'),row=document.createElement('div');row.className='dfu-log-line'+(kind==='error'?' error':'');const tm=document.createElement('time');tm.textContent=new Date().toLocaleTimeString('en-GB',{hour12:false});const txt=document.createElement('span');txt.textContent=message;row.append(tm,txt);box.prepend(row);while(box.children.length>70)box.lastChild.remove();
  }
  function status(message,failed=false){$('dfuStatus').textContent=message;$('dfuStatus').classList.toggle('failed',failed);if(failed)log(message,'error');else log(message);}
  function progress({stage,completed,total,message}){
    if(message&&stage!==lastPhase){lastPhase=stage;log(`[${stage}] ${message}`);}
    const pct=total?Math.round(100*completed/total):0;
    $('dfuProgress').style.width=`${pct}%`;
    $('dfuProgressLabel').textContent=`${stage.toUpperCase()} · ${pct}%`;
  }
  // Show which independent safety gate is keeping the flash action disabled.
  // Never bypass or auto-select a board: the operator must select the exact hardware.
  const G={
    ru:{busy:'Операция DFU уже выполняется.',usb:'Сначала подключите STM32 DFU.',map:'Карта Flash или размер передачи не подтверждены. Стирание заблокировано.',file:'Сначала загрузите и проверьте HEX-файл.',board:'Выбери Matek H743-WING V3 в шаге Quick Setup или разделе «Полётный контроллер».',model:'Подтвердите маркировку платы.',backup:'Подтвердите резервную копию и риск стирания.',erase:'Введите ERASE точно, латинскими заглавными буквами.',ready:'Все условия выполнены. ВНИМАНИЕ: WebUSB-прошивальщик ещё не испытан на реальном Matek.'},
    uk:{busy:'Операція DFU вже виконується.',usb:'Спочатку під’єднайте STM32 DFU.',map:'Карту Flash або розмір передачі не підтверджено. Стирання заблоковано.',file:'Спочатку завантажте та перевірте HEX-файл.',board:'Обери Matek H743-WING V3 у кроці Quick Setup або розділі «Польотний контролер».',model:'Підтвердьте маркування плати.',backup:'Підтвердьте резервну копію та ризик стирання.',erase:'Введіть ERASE точно, великими латинськими літерами.',ready:'Усі умови виконано. УВАГА: WebUSB-прошивач ще не перевірено на реальному Matek.'},
    en:{busy:'DFU operation already in progress.',usb:'Connect the STM32 DFU device first.',map:'Flash map or transfer size has not been verified. Erase is blocked.',file:'Load and verify a HEX file first.',board:'Select Matek H743-WING V3 in the Quick Setup step or the Flight Controller section.',model:'Confirm the board marking.',backup:'Confirm your backup and understand the erase risk.',erase:'Enter ERASE in uppercase letters.',ready:'All conditions met. WARNING: WebUSB flashing is still untested on a real Matek controller.'}
  };
  function blockedBy(){
    if(busy||releaseLoadBusy||localLoadBusy)return 'busy';
    if(!current?.opened)return 'usb';
    if(!current.flashMapVerified||!current.transferSize)return 'map';
    if(!image)return 'file';
    if(!supportedBoard(selectedBoard()))return 'board';
    if(!imageMatchesBoard())return 'target';
    if(!$('dfuConfirmBoard').checked)return 'model';
    if(!$('dfuConfirmBackup').checked)return 'backup';
    if($('dfuConfirmText').value.trim()!=='ERASE')return 'erase';
    return 'ready';
  }
  function updateGateStatus(){
    const el=$('dfuGateStatus');if(!el)return;
    const lang=window.AtlasLanguage?.()||'ru';const key=blockedBy();
    const targetMessages={
      ru:'Целевая плата внутри HEX не совпадает с выбранной (CubeOrangePlus / Uni_IC743Mini / MatekH743). Запись заблокирована.',
      uk:'Цільова плата в HEX не збігається з обраною (CubeOrangePlus / Uni_IC743Mini / MatekH743). Запис заблоковано.',
      en:'Firmware target does not match the selected board (CubeOrangePlus / Uni_IC743Mini / MatekH743). Flashing locked.'
    };
    el.textContent=key==='target'?targetMessages[lang]:(G[lang]||G.ru)[key];
    el.dataset.ready=key==='ready'?'true':'false';
  }
  function readyToFlash(){return !busy&&!releaseLoadBusy&&!localLoadBusy&&current?.opened&&current?.flashMapVerified&&!!current?.transferSize&&image&&supportedBoard(selectedBoard())&&imageMatchesBoard()&&$('dfuConfirmBoard').checked&&$('dfuConfirmBackup').checked&&$('dfuConfirmText').value.trim()==='ERASE';}
  function refreshControls(){
    $('dfuFlashBtn').disabled=!readyToFlash();$('dfuConnectBtn').disabled=busy||!usbSupported;$('dfuLatestBtn').disabled=busy||releaseLoadBusy||localLoadBusy;$('dfuLocalInput').disabled=busy||releaseLoadBusy||localLoadBusy;$('dfuLoadReleaseBtn').disabled=busy||releaseLoadBusy||localLoadBusy||$('dfuReleaseSelect').disabled;
    $('dfuConfirmBoard').disabled=busy;$('dfuConfirmBackup').disabled=busy;$('dfuConfirmText').disabled=busy;
    $('dfuFlashBtn').textContent=busy?tr('erasing'):tr('flash');$('dfuConnectBtn').textContent=current?.opened?tr('disconnect'):tr('detect');
    updateGateStatus();
    $('dfuDetected').textContent=current?.opened?`STM32 DFU 0483:DF11 · ${current.transferSize??'?'} bytes · ${current.flashMapVerified?'2 MiB OK':'MAP UNKNOWN'}`:tr('waiting');
  }
  function meta(){
    const box=$('dfuFileMeta');box.replaceChildren();
    if(!image){box.textContent=tr('notloaded');return;}
    const add=(name,value)=>{const row=document.createElement('div'),a=document.createElement('span'),b=document.createElement('b');a.textContent=name;b.textContent=value;row.append(a,b);box.append(row);};
    add('SOURCE',fileInfo?.source||'LOCAL');add('FILE',fileInfo?.filename||'—');add('SHA-256',fileInfo?.sha256||'—');add('DATA',`${image.dataBytes.toLocaleString('en-US')} bytes / ${image.lines} lines`);add('FLASH',`0x08000000 → 0x${image.flashEndExclusive.toString(16).toUpperCase()}`);
  }
  async function digest(data){const result=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(result)].map(x=>x.toString(16).padStart(2,'0')).join('');}
  async function loadHex(blob,info){
    const expectedBoard=selectedBoard();
    const bytes=await blob.arrayBuffer();
    const hash=await digest(bytes);
    if(info.sha256&&hash.toLowerCase()!==info.sha256.toLowerCase())throw Error('SHA-256 mismatch. File rejected.');
    if(info.bytes&&bytes.byteLength!==info.bytes)throw Error('Manifest size mismatch. File rejected.');
    const hex=new TextDecoder('ascii',{fatal:true}).decode(bytes);
    const parsed=window.AtlasDFU.parseIntelHex(hex);
    if(selectedBoard()!==expectedBoard)throw Error('Board selection changed while validating the HEX. Select the file again.');
    if(selectedBoard()==='cube-orange-plus'&&parsed.detectedTarget!=='cube-orange-plus')
      throw Error('Cube Orange Plus firmware marker missing. Never flash a Cube Orange or Matek HEX to Orange Plus.');
    if(selectedBoard()==='uni-ic743-mini'&&parsed.detectedTarget!=='uni-ic743-mini')
      throw Error('Uni-IC743 Mini target marker missing. Wrong HEX rejected.');
    if(selectedBoard()==='matek-h743-wing-v3'&&parsed.detectedTarget!==null&&parsed.detectedTarget!=='matek-h743-wing-v3')
      throw Error('Wrong target: Cube Orange Plus or Uni-IC743 Mini HEX cannot be flashed to a Matek controller.');
    image=parsed;fileInfo={...info,sha256:hash};meta();refreshControls();status(`${info.filename} · ${image.dataBytes} image bytes · SHA-256 OK`);
  }
  async function loadManifest(){
    if(location.protocol==='file:')throw Error('Open the site over HTTPS or localhost to load the firmware catalog.');
    const board=selectedBoard();
    if(!supportedBoard(board))throw Error('Unsupported board');
    const response=await fetch(new URL(MANIFESTS[board],document.baseURI),{cache:'no-store'});
    // Cube's local HEX flash mode can precede the protected server release.
    // No placeholder public firmware, no fake download or broken page state.
    if(!response.ok&&!(['cube-orange-plus','uni-ic743-mini'].includes(board)&&response.status===404))
      throw Error(`HTTP ${response.status}: manifest.json`);
    const manifest=response.ok?await response.json():{board_id:board,files:[]};
    if(manifest.board_id!==board||board!==selectedBoard()||!Array.isArray(manifest.files))throw Error(tr('manifestEmpty'));
    if(window.AtlasFirmwareCatalog)manifest.files=await window.AtlasFirmwareCatalog.boardFiles(board,manifest.files);
    if(board!==selectedBoard())throw Error('Board selection changed while loading the firmware catalog.');
    const select=$('dfuReleaseSelect');
    select.replaceChildren();
    if(!manifest.files.length){select.disabled=true;$('dfuLoadReleaseBtn').disabled=true;refreshControls();return manifest;}
    manifest.files.forEach((entry,index)=>{
      const option=document.createElement('option');option.value=String(index);
      const stamp=entry.timestamp?new Date(entry.timestamp*1000).toLocaleDateString('en-CA'):'';
      option.textContent=`${index===0?'LATEST · ':''}${entry.label||entry.version||entry.filename} ${stamp}`;
      select.append(option);
    });
    if(!manifest.files.some(item=>String(item.version)==='1.2')){
      const pending=document.createElement('option');pending.value='pending';pending.disabled=true;
      const lang=window.AtlasLanguage?.()||'ru';
      pending.textContent='1.2 · '+({ru:'готовится',uk:'готується',en:'coming soon'}[lang]||'coming soon');
      select.prepend(pending);
    }
    select.value='0';select.disabled=false;$('dfuLoadReleaseBtn').disabled=false;
    return manifest;
  }
  async function latest(requestedIndex=null){
    if(busy||releaseLoadBusy||localLoadBusy)return;
    releaseLoadBusy=true;refreshControls();
    const expectedBoard=selectedBoard();
    try{
      $('dfuLatestBtn').disabled=true;$('dfuLoadReleaseBtn').disabled=true;
      const manifest=await loadManifest();
      const index=requestedIndex===null?0:Number(requestedIndex);
      const info=manifest.files[index];if(!info)throw Error(tr('manifestEmpty'));
      $('dfuReleaseSelect').value=String(index);
      status(`Selected: ${info.label||info.filename}`);
      if(!window.AtlasFirmwareAccess?.isProtected(info) || info.channel!=='release')
        throw Error('Protected build ID is required for server-hosted firmware.');
      // Verified protected download. No public HEX link fallback.
      const blob=await window.AtlasFirmwareAccess.requestBlob(info);
      if(selectedBoard()!==expectedBoard)throw Error('Board selection changed while loading firmware.');
      await loadHex(blob,{...info,source:'A.T.L.A.S. Secure R2 · PIN'});
    }catch(error){image=null;fileInfo=null;meta();status(error.message||String(error),true);}finally{releaseLoadBusy=false;refreshControls();}
  }
  async function localFile(file){
    if(!file||busy||releaseLoadBusy||localLoadBusy)return;
    localLoadBusy=true;refreshControls();
    try{
      if(!/\.hex$/i.test(file.name)||file.size>16*1024*1024)throw Error('Select an Intel HEX file under 16 MiB');
      await loadHex(file,{filename:file.name,source:'LOCAL FILE'});
    }catch(error){image=null;fileInfo=null;meta();status(`${tr('fileIssue')}: ${error.message}`,true);}finally{localLoadBusy=false;refreshControls();}
  }
  async function connect(){
    if(busy||releaseLoadBusy)return;
    if(current?.opened){try{await current.close();}catch(e){status(e.message,true);}current=null;refreshControls();return;}
    if(!usbSupported){status(tr('unsupported'),true);return;}
    try{
      // Browser chooser is required: no automatic USB access or unconsented writes.
      const device=await navigator.usb.requestDevice({filters:[{vendorId:0x0483,productId:0xdf11}]});
      const dfu=new window.AtlasDFU.STM32DfuDevice(device,progress);
      await dfu.open();current=dfu;
      status(`${tr('ready')}: ${dfu.interfaceName}. ${dfu.flashMapVerified&&dfu.transferSize?'READY':tr('chipUnknown')}`);
    }catch(error){status(`DFU: ${error.message}`,true);}finally{refreshControls();}
  }
  async function flash(){
    if(releaseLoadBusy||localLoadBusy||!readyToFlash())return;
    const expected=fileInfo?.filename;
    if(!imageMatchesBoard())return;
    const words=[tr('warning'),`Controller: ${selectedBoard()}`,`File: ${expected}`,`SHA256: ${fileInfo?.sha256}`,`Start: 0x08000000`, 'ERASE ALL INTERNAL FLASH (2 MiB)?'];
    if(!confirm(words.join('\n\n')))return;
    busy=true;refreshControls();$('dfuProgress').style.width='0%';
    const unload=event=>{event.preventDefault();event.returnValue='DFU write in progress';};
    window.addEventListener('beforeunload',unload);
    try{
      status(tr('slow'));
      await current.flash(image);
      status(tr('complete'));
      $('dfuProgressLabel').textContent='VERIFIED · 100%';
      window.dispatchEvent(new CustomEvent('atlas:dfu',{detail:{success:true,board:selectedBoard(),filename:expected,sha256:fileInfo?.sha256||null,verified:true}}));
    }catch(error){status(`DFU ${tr('stError')}: ${error.message} — Leave board in DFU; recover/reflash via STM32CubeProgrammer if needed.`,true);window.dispatchEvent(new CustomEvent('atlas:dfu',{detail:{success:false,board:selectedBoard(),reason:error.message}}));}finally{
      window.removeEventListener('beforeunload',unload);busy=false;refreshControls();window.dispatchEvent(new Event('atlas:dfu-idle'));
    }
  }
  function translate(){
    document.querySelectorAll('[data-dfu-t]').forEach(el=>{el.textContent=tr(el.dataset.dfuT)});
    $('dfuConfirmText').placeholder=tr('confirm');if(!image)meta();refreshControls();
  }
  $('dfuConnectBtn').addEventListener('click',connect);
  $('dfuLatestBtn').addEventListener('click',()=>latest());
  $('dfuLoadReleaseBtn').addEventListener('click',()=>latest($('dfuReleaseSelect').value));
  $('dfuLocalInput').addEventListener('change',e=>{const file=e.target.files?.[0];e.target.value='';void localFile(file);});
  $('dfuFlashBtn').addEventListener('click',flash);
  [$('dfuConfirmBoard'),$('dfuConfirmBackup')].forEach(e=>e.addEventListener('change',refreshControls));
  $('dfuConfirmText').addEventListener('input',refreshControls);
  $('firmwareBoards').addEventListener('click',()=>queueMicrotask(refreshControls));
   window.addEventListener('atlas:board',()=>{refreshControls();
     // A board selection is NOT a board identification. Invalidate the previous
     // downloaded/local image and destructive-operation confirmations.
     image=null;fileInfo=null;
     $('dfuConfirmBoard').checked=false;
     $('dfuConfirmBackup').checked=false;
     $('dfuConfirmText').value='';
     $('dfuReleaseSelect').replaceChildren();
     $('dfuReleaseSelect').disabled=true;
     translate();meta();refreshControls();
     if(location.protocol!=='file:')loadManifest().catch(e=>status(e.message,true));
   });
  document.querySelectorAll('[data-language]').forEach(e=>e.addEventListener('click',()=>queueMicrotask(()=>{translate();translatePicker();})));
  const P={ru:['Версия для установки / отката','Загрузить выбранную'],uk:['Версія для встановлення / повернення','Завантажити вибрану'],en:['Firmware version / rollback','Load selected version']};
  function translatePicker(){const lang=window.AtlasLanguage?.()||'ru';const labels=P[lang]||P.ru;$('dfuReleaseSelectLabel').textContent=labels[0];$('dfuLoadReleaseBtn').textContent=labels[1];}
  if(navigator.usb)navigator.usb.addEventListener('disconnect',event=>{if(current?.device===event.device){current.opened=false;current=null;status('USB DFU disconnected',true);refreshControls();}});
  translate();translatePicker();meta();if(!usbSupported)status(tr('unsupported'),true);
  if(location.protocol!=='file:')loadManifest().catch(err=>console.warn('Firmware archive not loaded:',err.message));
})();
