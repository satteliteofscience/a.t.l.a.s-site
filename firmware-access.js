/* A.T.L.A.S. firmware access UI.
 * PINs are POSTed only to a server-side gateway. Never store or validate codes in public JS. */
(() => {
 'use strict';
 const wording={
  ru:{title:'ДОСТУП К ПРОШИВКЕ',release:'Общий PIN для обычной прошивки',early:'Персональный ключ Early Tester',prompt:'Введите код доступа',send:'ПРОВЕРИТЬ И ЗАГРУЗИТЬ',cancel:'Отмена',working:'Проверка и загрузка HEX…',invalid:'Неверный PIN или доступ отозван.',limited:'Слишком много попыток. Повторите позже.',offline:'Защищённое хранилище ещё не подключено.',error:'Не удалось загрузить прошивку. Попробуйте позже.',mismatch:'Контрольная сумма не совпала. Файл отклонён.',note:'Код проверяется сервером. Прошивка не записывается в контроллер до отдельного подтверждения.'},
  uk:{title:'ДОСТУП ДО ПРОШИВКИ',release:'Спільний PIN для звичайної прошивки',early:'Персональний ключ Early Tester',prompt:'Введіть код доступу',send:'ПЕРЕВІРИТИ ТА ЗАВАНТАЖИТИ',cancel:'Скасувати',working:'Перевірка та завантаження HEX…',invalid:'Хибний PIN або доступ відкликано.',limited:'Забагато спроб. Повторіть пізніше.',offline:'Захищене сховище ще не підключено.',error:'Не вдалося завантажити прошивку. Спробуйте пізніше.',mismatch:'Контрольна сума не збіглася. Файл відхилено.',note:'Код перевіряє сервер. Прошивка не записується в контролер до окремого підтвердження.'},
  en:{title:'FIRMWARE ACCESS',release:'Shared PIN for standard release',early:'Personal Early Tester key',prompt:'Enter access code',send:'VERIFY & LOAD HEX',cancel:'Cancel',working:'Verifying and loading HEX…',invalid:'Incorrect code or access revoked.',limited:'Too many attempts. Try again later.',offline:'Secure firmware storage is not connected yet.',error:'Firmware download failed. Please retry.',mismatch:'Checksum mismatch. Firmware rejected.',note:'The server validates this code. Flashing still requires separate, explicit approval.'}
 };
 const lang=()=>window.AtlasLanguage?.()||window.AtlasI18n?.lang||document.documentElement.lang||'ru';
 const t=k=>(wording[lang()]||wording.ru)[k];
 // Read the public gateway configuration on demand. A single temporary network
 // failure must not permanently disable protected downloads until page reload.
 // Cache successful configuration, but retry failed/disabled responses on the next click.
 let configPromise=null;
 function loadAccessConfig(){
  if(!configPromise){
   configPromise=fetch(new URL('data/firmware-access.json',document.baseURI),{cache:'no-store'})
    .then(r=>r.ok?r.json():null)
    .catch(()=>null)
    .then(config=>{
     if(config?.enabled!==true||!safeAPI(config?.gateway_url))configPromise=null;
     return config;
    });
  }
  return configPromise;
 }
 let modal=null,active=false;
 function safeAPI(raw){
  try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/')return null;return u.origin;}catch{return null;}
 }
 function buildId(entry){return typeof entry?.secure_id==='string'&&/^[a-z0-9][a-z0-9-]{2,90}$/.test(entry.secure_id)?entry.secure_id:null;}
 function safeFileName(entry){return /^[a-zA-Z0-9_.() +\-]{1,180}\.hex$/i.test(entry?.filename||'')?entry.filename:'firmware.hex';}
 async function sha256(blob){
  const bytes=await blob.arrayBuffer();
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');
 }
 function ensureDialog(){
  if(modal)return modal;
  const dialog=document.createElement('dialog');
  dialog.className='atlas-firmware-access';
  dialog.innerHTML='<form method="dialog" class="atlas-access-form"><p class="atlas-access-kicker"></p><h2 class="atlas-access-title"></h2><p class="atlas-access-kind"></p><label class="atlas-access-label" for="atlasAccessPin"></label><input id="atlasAccessPin" class="atlas-access-pin" type="password" autocomplete="off" minlength="8" maxlength="128" required spellcheck="false" autocapitalize="off"><p class="atlas-access-status" role="status" aria-live="polite"></p><div class="atlas-access-actions"><button type="button" class="atlas-access-cancel"></button><button type="submit" class="atlas-access-submit"></button></div><p class="atlas-access-note"></p></form>';
  document.body.append(dialog);
  modal=dialog;
  return modal;
 }
 async function requestBlob(entry){
  const id=buildId(entry);
  if(!id)throw Error('This firmware is not configured for protected access.');
  const config=await loadAccessConfig();
  const base=safeAPI(config?.gateway_url);
  if(config?.enabled!==true||!base)throw Error(t('offline'));
  if(active)throw Error(t('error'));
  const dialog=ensureDialog();
  const form=dialog.querySelector('form'),field=dialog.querySelector('.atlas-access-pin');
  const status=dialog.querySelector('.atlas-access-status');
  const submit=dialog.querySelector('.atlas-access-submit');
  dialog.querySelector('.atlas-access-kicker').textContent=t('title');
  dialog.querySelector('.atlas-access-title').textContent=safeFileName(entry);
  dialog.querySelector('.atlas-access-kind').textContent=t(entry.channel==='early'?'early':'release');
  dialog.querySelector('.atlas-access-label').textContent=t('prompt');
  dialog.querySelector('.atlas-access-cancel').textContent=t('cancel');
  submit.textContent=t('send');
  dialog.querySelector('.atlas-access-note').textContent=t('note');
  field.value='';field.disabled=false;status.textContent='';submit.disabled=false;active=true;
  return new Promise((resolve,reject)=>{
   let finished=false,abortController=null;
   function finish(err,blob){
    if(finished)return;finished=true;
    if(abortController)abortController.abort();
    dialog.removeEventListener('cancel',cancel);
    dialog.removeEventListener('close',cancel);
    form.removeEventListener('submit',attempt);
    dialog.querySelector('.atlas-access-cancel').removeEventListener('click',cancel);
    field.value='';field.disabled=false;active=false;if(dialog.open)dialog.close();
    if(err)reject(err);else resolve(blob);
   }
   function cancel(ev){if(ev?.type==='cancel')ev.preventDefault();finish(new Error('Access cancelled'));}
   async function attempt(event){
    event.preventDefault();
    if(finished)return;
    const pin=field.value;
    if(pin.length<8||pin.length>128){status.textContent=t('invalid');return;}
    submit.disabled=true;field.disabled=true;status.textContent=t('working');
    abortController=new AbortController();
    try{
     const response=await fetch(base+'/api/firmware/'+encodeURIComponent(id),{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin}),cache:'no-store',credentials:'omit',signal:abortController.signal
     });
     if(finished)return;
     if(!response.ok){
      status.textContent=response.status===401?t('invalid'):response.status===429?t('limited'):t('error');
      return;
     }
     const blob=await response.blob();
     if(finished)return;
     if(Number.isSafeInteger(entry.bytes)&&entry.bytes>0&&blob.size!==entry.bytes){
      status.textContent=t('mismatch');return;
     }
     const expected=String(entry.sha256||'').toLowerCase();
     if(!/^[a-f0-9]{64}$/.test(expected)||await sha256(blob)!==expected){
      if(!finished)status.textContent=t('mismatch');return;
     }
     if(!finished)finish(null,blob);
    }catch(error){if(!finished)status.textContent=t('error');}
    finally{if(!finished){submit.disabled=false;field.disabled=false;field.value='';field.focus();}abortController=null;}
   }
   dialog.addEventListener('cancel',cancel);
   dialog.addEventListener('close',cancel);
   form.addEventListener('submit',attempt);
   dialog.querySelector('.atlas-access-cancel').addEventListener('click',cancel);
   dialog.showModal();field.focus();
  });
 }
 async function download(entry){
  const blob=await requestBlob(entry);
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');anchor.href=url;anchor.download=safeFileName(entry);document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
 }
 window.AtlasFirmwareAccess={requestBlob,download,isProtected:entry=>!!buildId(entry)};
})();
