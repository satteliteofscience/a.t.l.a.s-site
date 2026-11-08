/* A.T.L.A.S. DFU user interface: destructive commands require explicit opt-in. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  if(!$('dfuPanel')||!window.AtlasDFU)return;
  const basePath=new URL('Firmware/Matek Wing H743-V3/',document.baseURI);
  const T={
    ru:{title:'STM32 DFU · ПОЛНАЯ ЗАПИСЬ HEX',mode:'DFU-подключение (не MAVLink)',howdfu:'Удерживай BOOT на USB-переходнике Matek и подключи USB к ПК. Затем нажми «Подключить DFU». Закрой Mission Planner и другие программы, занявшие USB.',detect:'Подключить DFU',disconnect:'Отключить DFU',getLatest:'Загрузить последний .hex',chooseLocal:'Выбрать локальный .hex',notloaded:'Файл не загружен',waiting:'DFU не подключён',ready:'Устройство DFU обнаружено',unsupported:'WebUSB недоступен. Требуется Chrome / Edge, HTTPS или localhost.',manifestEmpty:'В каталоге нет опубликованного HEX. Выбери локальный файл или добавь его в приватную папку Firmware.',unsafeBoard:'Выбери Matek H743-WING V3 в карточках выше.',flash:'СТЕРЕТЬ И ЗАПИСАТЬ HEX',erasing:'Выполняется...',backup:'Я сохранил параметры и знаю, что стирание удалит загрузчик и все данные Flash.',model:'Я проверил маркировку платы: это Matek H743-WING V3 (STM32H743). USB DFU не подтверждает модель платы.',confirm:'Для подтверждения введи ERASE',warning:'ВНИМАНИЕ: полный Mass Erase 2 MiB (до 0xFF), затем запись и побайтовая проверка. При обрыве питания понадобится восстановление через DFU/STM32CubeProgrammer. Проверено только на уровне кода, не на физической плате.',nohardware:'Никаких операций ERASE/WRITE без нажатия кнопки не выполняется.',meta:'Источник · SHA-256 · диапазон памяти',complete:'Готово: запись проверена побайтово. Выйди из DFU вручную и проверь работу платы.',chipUnknown:'Режим DFU найден, но карту 2 MiB / 16×128 KiB или wTransferSize определить не удалось. Прошивка заблокирована.',progress:'ПРОГРЕСС',stError:'ОШИБКА',fileIssue:'Ошибка HEX',private:'Файл в публичной папке доступен всем пользователям сайта.',slow:'Запись может занять некоторое время. Не отключай USB и питание.'},
    uk:{title:'STM32 DFU · ПОВНИЙ ЗАПИС HEX',mode:'DFU-з’єднання (не MAVLink)',howdfu:'Утримуй BOOT на USB-перехіднику Matek і під’єднай USB до ПК. Потім натисни «Під’єднати DFU». Закрий Mission Planner та інші програми, що займають USB.',detect:'Під’єднати DFU',disconnect:'Від’єднати DFU',getLatest:'Завантажити останній .hex',chooseLocal:'Вибрати локальний .hex',notloaded:'Файл не завантажений',waiting:'DFU не під’єднано',ready:'DFU-пристрій виявлено',unsupported:'WebUSB недоступний. Потрібні Chrome / Edge, HTTPS або localhost.',manifestEmpty:'У каталозі немає опублікованого HEX. Вибери локальний файл або додай його до приватної папки Firmware.',unsafeBoard:'Вибери Matek H743-WING V3 у картках вище.',flash:'СТЕРТИ Й ЗАПИСАТИ HEX',erasing:'Виконується...',backup:'Я зберіг параметри та знаю, що стирання видалить завантажувач і всю Flash.',model:'Я перевірив маркування плати: Matek H743-WING V3 (STM32H743). USB DFU не підтверджує модель плати.',confirm:'Для підтвердження введи ERASE',warning:'УВАГА: повне Mass Erase 2 MiB (до 0xFF), потім запис та побайтова перевірка. У разі втрати живлення потрібне відновлення через DFU/STM32CubeProgrammer. Ще не перевірено на фізичній платі.',nohardware:'ERASE/WRITE не виконується без натискання кнопки.',meta:'Джерело · SHA-256 · адреси',complete:'Готово: запис перевірено побайтно. Вийди з DFU вручну та перевір роботу плати.',chipUnknown:'DFU знайдено, але карту 2 MiB / 16×128 KiB або wTransferSize не визначено. Прошивання заблоковано.',progress:'ПРОГРЕС',stError:'ПОМИЛКА',fileIssue:'Помилка HEX',private:'Файл у публічній папці доступний усім користувачам сайту.',slow:'Не вимикай живлення та USB до завершення.'},
    en:{title:'STM32 DFU · FULL HEX FLASH',mode:'DFU connection (not MAVLink)',howdfu:'Hold BOOT on the Matek USB adapter while connecting USB to the PC. Then select Connect DFU. Close Mission Planner and other programs using the USB interface.',detect:'Connect DFU',disconnect:'Disconnect DFU',getLatest:'Load latest .hex',chooseLocal:'Choose local .hex',notloaded:'No firmware loaded',waiting:'DFU not connected',ready:'DFU device detected',unsupported:'WebUSB unavailable. Use Chrome / Edge on HTTPS or localhost.',manifestEmpty:'No HEX published in the catalog. Select a local file or add it to the private Firmware folder.',unsafeBoard:'Select Matek H743-WING V3 in the board list above.',flash:'ERASE + PROGRAM HEX',erasing:'Working...',backup:'I backed up parameters and understand that erasing removes the bootloader and all Flash data.',model:'I checked the board label: Matek H743-WING V3 (STM32H743). USB DFU cannot identify the board model.',confirm:'Type ERASE to confirm',warning:'WARNING: full-chip Mass Erase 2 MiB (to 0xFF), then program and byte-for-byte verify. Power loss may require recovery via DFU/STM32CubeProgrammer. Code only; not yet hardware-tested.',nohardware:'No ERASE/WRITE operation runs without clicking the flash button.',meta:'Source · SHA-256 · flash range',complete:'Done: byte-for-byte readback matched. Exit DFU manually and validate the board.',chipUnknown:'DFU found, but 2 MiB / 16×128 KiB map or wTransferSize is unknown. Flashing locked.',progress:'PROGRESS',stError:'ERROR',fileIssue:'Invalid HEX',private:'Files in a public site are publicly accessible.',slow:'Do not disconnect power or USB until complete.'}
  };
  const tr=key=>(T[window.AtlasLanguage?.()||'ru']||T.ru)[key]||key;
  let current=null, image=null, fileInfo=null, busy=false, lastPhase='', usbSupported=!!(navigator.usb&&window.isSecureContext);
  function selectedBoard(){return window.AtlasSelectedBoard?.()||'cube-orange';}
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
    ru:{busy:'Операция DFU уже выполняется.',usb:'Сначала подключите STM32 DFU.',map:'Карта Flash или размер передачи не подтверждены. Стирание заблокировано.',file:'Сначала загрузите и проверьте HEX-файл.',board:'Выбрана другая плата. Прокрутите вверх и выберите Matek H743-WING V3 в разделе «Полётный контроллер».',model:'Подтвердите маркировку платы.',backup:'Подтвердите резервную копию и риск стирания.',erase:'Введите ERASE точно, латинскими заглавными буквами.',ready:'Все условия выполнены. ВНИМАНИЕ: WebUSB-прошивальщик ещё не испытан на реальном Matek.'},
    uk:{busy:'Операція DFU вже виконується.',usb:'Спочатку під’єднайте STM32 DFU.',map:'Карту Flash або розмір передачі не підтверджено. Стирання заблоковано.',file:'Спочатку завантажте та перевірте HEX-файл.',board:'Обрано іншу плату. Прокрутіть угору й виберіть Matek H743-WING V3 у розділі «Польотний контролер».',model:'Підтвердьте маркування плати.',backup:'Підтвердьте резервну копію та ризик стирання.',erase:'Введіть ERASE точно, великими латинськими літерами.',ready:'Усі умови виконано. УВАГА: WebUSB-прошивач ще не перевірено на реальному Matek.'},
    en:{busy:'DFU operation already in progress.',usb:'Connect the STM32 DFU device first.',map:'Flash map or transfer size has not been verified. Erase is blocked.',file:'Load and verify a HEX file first.',board:'Another board is selected. Scroll up and select Matek H743-WING V3 in Flight Controller.',model:'Confirm the board marking.',backup:'Confirm your backup and understand the erase risk.',erase:'Enter ERASE in uppercase letters.',ready:'All conditions met. WARNING: WebUSB flashing is still untested on a real Matek controller.'}
  };
  function blockedBy(){
    if(busy)return 'busy';
    if(!current?.opened)return 'usb';
    if(!current.flashMapVerified||!current.transferSize)return 'map';
    if(!image)return 'file';
    if(selectedBoard()!=='matek-h743-wing-v3')return 'board';
    if(!$('dfuConfirmBoard').checked)return 'model';
    if(!$('dfuConfirmBackup').checked)return 'backup';
    if($('dfuConfirmText').value.trim()!=='ERASE')return 'erase';
    return 'ready';
  }
  function updateGateStatus(){
    const el=$('dfuGateStatus');if(!el)return;
    const lang=window.AtlasLanguage?.()||'ru';const key=blockedBy();
    el.textContent=(G[lang]||G.ru)[key];
    el.dataset.ready=key==='ready'?'true':'false';
  }
  function readyToFlash(){return !busy&&current?.opened&&current?.flashMapVerified&&!!current?.transferSize&&image&&selectedBoard()==='matek-h743-wing-v3'&&$('dfuConfirmBoard').checked&&$('dfuConfirmBackup').checked&&$('dfuConfirmText').value.trim()==='ERASE';}
  function refreshControls(){
    $('dfuFlashBtn').disabled=!readyToFlash();$('dfuConnectBtn').disabled=busy||!usbSupported;$('dfuLatestBtn').disabled=busy;$('dfuLocalInput').disabled=busy;$('dfuLoadReleaseBtn').disabled=busy||$('dfuReleaseSelect').disabled;
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
    const bytes=await blob.arrayBuffer();
    const hash=await digest(bytes);
    if(info.sha256&&hash.toLowerCase()!==info.sha256.toLowerCase())throw Error('SHA-256 mismatch. File rejected.');
    if(info.bytes&&bytes.byteLength!==info.bytes)throw Error('Manifest size mismatch. File rejected.');
    const hex=new TextDecoder('ascii',{fatal:true}).decode(bytes);
    const parsed=window.AtlasDFU.parseIntelHex(hex);
    image=parsed;fileInfo={...info,sha256:hash};meta();refreshControls();status(`${info.filename} · ${image.dataBytes} image bytes · SHA-256 OK`);
  }
  async function loadManifest(){
    if(location.protocol==='file:')throw Error('Open the site over HTTPS or localhost to load the firmware catalog.');
    const response=await fetch(new URL('manifest.json',basePath),{cache:'no-store'});
    if(!response.ok)throw Error(`HTTP ${response.status}: manifest.json`);
    const manifest=await response.json();
    if(manifest.board_id!=='matek-h743-wing-v3'||!Array.isArray(manifest.files)||!manifest.files.length)throw Error(tr('manifestEmpty'));
    const select=$('dfuReleaseSelect');
    select.replaceChildren();
    manifest.files.forEach((entry,index)=>{
      const option=document.createElement('option');option.value=String(index);
      const stamp=entry.timestamp?new Date(entry.timestamp*1000).toLocaleDateString('en-CA'):'';
      option.textContent=`${index===0?'LATEST · ':''}${entry.label||entry.version||entry.filename} ${stamp}`;
      select.append(option);
    });
    select.disabled=false;$('dfuLoadReleaseBtn').disabled=false;
    return manifest;
  }
  function releaseURL(info){
    if(!info||!/^([\w\d .()_+\-]+)\.hex$/i.test(info.filename)||!/^[a-f0-9]{64}$/i.test(info.sha256))throw Error('Invalid firmware entry');
    if(!info.path)return new URL(encodeURIComponent(info.filename),basePath);
    if(typeof info.path!=='string'||info.path.includes('..')||!info.path.startsWith('Firmware/Matek Wing H743-V3/')||!info.path.endsWith('/'+info.filename))throw Error('Invalid firmware path');
    const url=new URL(info.path,document.baseURI);
    if(url.origin!==basePath.origin)throw Error('External firmware URL blocked');
    return url;
  }
  async function latest(requestedIndex=null){
    if(busy)return;
    try{
      $('dfuLatestBtn').disabled=true;$('dfuLoadReleaseBtn').disabled=true;
      const manifest=await loadManifest();
      const index=requestedIndex===null?0:Number(requestedIndex);
      const info=manifest.files[index];if(!info)throw Error('Firmware version not found');
      $('dfuReleaseSelect').value=String(index);
      status(`Selected: ${info.label||info.filename}`);
      let blob;
      if(window.AtlasFirmwareAccess?.isProtected(info)){
        // The same PIN gate protects both website downloads and DFU load-from-site.
        blob=await window.AtlasFirmwareAccess.requestBlob(info);
      }else{
        const fileURL=releaseURL(info);
        const file=await fetch(fileURL,{cache:'no-store'});
        if(!file.ok)throw Error(`HTTP ${file.status}: ${info.filename}`);
        blob=await file.blob();
      }
      await loadHex(blob,{...info,source:'A.T.L.A.S. Release Archive'});
    }catch(error){image=null;fileInfo=null;meta();status(error.message||String(error),true);}finally{refreshControls();}
  }
  async function localFile(file){
    if(!file||busy)return;
    try{
      if(!/\.hex$/i.test(file.name)||file.size>16*1024*1024)throw Error('Select an Intel HEX file under 16 MiB');
      await loadHex(file,{filename:file.name,source:'LOCAL FILE'});
    }catch(error){image=null;fileInfo=null;meta();status(`${tr('fileIssue')}: ${error.message}`,true);}finally{refreshControls();}
  }
  async function connect(){
    if(busy)return;
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
    if(!readyToFlash())return;
    const expected=fileInfo?.filename;
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
    }catch(error){status(`DFU ${tr('stError')}: ${error.message} — Leave board in DFU; recover/reflash via STM32CubeProgrammer if needed.`,true);}finally{
      window.removeEventListener('beforeunload',unload);busy=false;refreshControls();
    }
  }
  function translate(){
    document.querySelectorAll('[data-dfu-t]').forEach(el=>{el.textContent=tr(el.dataset.dfuT)});
    $('dfuConfirmText').placeholder=tr('confirm');if(!image)meta();refreshControls();
  }
  $('dfuConnectBtn').addEventListener('click',connect);
  $('dfuLatestBtn').addEventListener('click',()=>latest());
  $('dfuLoadReleaseBtn').addEventListener('click',()=>latest($('dfuReleaseSelect').value));
  $('dfuLocalInput').addEventListener('change',e=>localFile(e.target.files?.[0]));
  $('dfuFlashBtn').addEventListener('click',flash);
  [$('dfuConfirmBoard'),$('dfuConfirmBackup')].forEach(e=>e.addEventListener('change',refreshControls));
  $('dfuConfirmText').addEventListener('input',refreshControls);
  $('firmwareBoards').addEventListener('click',()=>queueMicrotask(refreshControls));
  document.querySelectorAll('[data-language]').forEach(e=>e.addEventListener('click',()=>queueMicrotask(()=>{translate();translatePicker();})));
  const P={ru:['Версия для установки / отката','Загрузить выбранную'],uk:['Версія для встановлення / повернення','Завантажити вибрану'],en:['Firmware version / rollback','Load selected version']};
  function translatePicker(){const lang=window.AtlasLanguage?.()||'ru';const labels=P[lang]||P.ru;$('dfuReleaseSelectLabel').textContent=labels[0];$('dfuLoadReleaseBtn').textContent=labels[1];}
  if(navigator.usb)navigator.usb.addEventListener('disconnect',event=>{if(current?.device===event.device){current.opened=false;current=null;status('USB DFU disconnected',true);refreshControls();}});
  translate();translatePicker();meta();if(!usbSupported)status(tr('unsupported'),true);
  if(location.protocol!=='file:')loadManifest().catch(err=>console.warn('Firmware archive not loaded:',err.message));
})();
