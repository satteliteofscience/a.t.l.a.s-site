/* Temporary A.T.L.A.S. user-initiated Cloudflare gateway integration checks.
 * Never persist, echo, prefill or log access codes. No auto-download or flashing. */
(() => {
 'use strict';
 const endpoint='https://atlas-firmware-gateway.gamingchanel57.workers.dev/api/firmware/matek-h743-v3-release-1';
 const expectedSha='db18bb8cda5805508a4834ee40388c8f493ceaa4498a3c778d37c600b24bcda9';
 const expectedSize=4654592;
 const $=id=>document.getElementById(id);
 const input=$('pin'),result=$('result'),check=$('check'),negative=$('negative');
 const display=(text,kind='')=>{result.textContent=text;result.dataset.status=kind;};
 async function perform(pin,shouldAllow){
  check.disabled=true;negative.disabled=true;
  display('Выполняется запрос к Cloudflare Worker…');
  try{
   const response=await fetch(endpoint,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({pin}),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'
   });
   if(!shouldAllow){
    const success=response.status===401;
    display('НЕВЕРНЫЙ PIN → HTTP '+response.status+'\n'+(success?'ПРОЙДЕНО: сервер отказал в доступе.':'ОШИБКА: ожидался HTTP 401 без файла.'),success?'pass':'fail');
    return;
   }
   if(!response.ok){
    display('ЗАЩИЩЁННАЯ ЗАГРУЗКА → HTTP '+response.status+'\nСервер не выдал HEX. Проверь настройки Worker, секрет и наличие файла в R2.','fail');
    return;
   }
   const data=await response.arrayBuffer();
   const digest=await crypto.subtle.digest('SHA-256',data);
   const hash=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
   const header=(response.headers.get('X-ATLAS-SHA256')||'').toLowerCase();
   const ok=data.byteLength===expectedSize&&hash===expectedSha&&header===expectedSha;
   display('ПРАВИЛЬНЫЙ PIN → HTTP '+response.status+
    '\nРазмер: '+data.byteLength+' байт / '+expectedSize+
    '\nSHA-256: '+hash+
    '\nX-ATLAS-SHA256: '+header+
    '\n'+(ok?'ПРОЙДЕНО: скачивание и проверка целостности успешны.':'ОШИБКА: размер, хеш или заголовок не совпали.'),ok?'pass':'fail');
  }catch(err){
   display('ОШИБКА СЕТИ ИЛИ CORS: '+(err?.message||'Неизвестная ошибка'),'fail');
  }finally{
   check.disabled=false;negative.disabled=false;
  }
 }
 check.addEventListener('click',()=>{
  const pin=input.value;input.value='';
  if(pin.length<8||pin.length>128){display('Введите PIN (8–128 символов).','fail');return;}
  perform(pin,true);
 });
 negative.addEventListener('click',()=>perform('ATLAS-INVALID-TEST-CODE-NOT-A-SECRET',false));
 input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();check.click();}});
})();
