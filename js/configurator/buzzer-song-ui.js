/* Custom startup melody card (BUZ_CSTM_SONG*), under the G.L.O.B.A.L. card. The melody is edited as MML text, previewed in the browser and written
 * with confirmed, DISARMED-only parameter writes (AtlasCC.writeBuzzerSong); reading never changes anything on the board. */
(()=>{'use strict';
const api=window.AtlasCC,core=window.AtlasBuzzerSong;if(!api||!core)return;
const words={
 ru:{title:'Мелодия запуска',noparams:'Подключи контроллер и дождись чтения параметров',unsupported:'Нужна прошивка с параметром BUZ_CSTM_SONG',standard:'На плате: стандартная мелодия запуска',custom:'На плате: своя мелодия',chars:'симв.',
  label:'Текст мелодии в формате MML',placeholder:'Например: MFT200L4O6CD#8G.',count:'Символов',duration:'Длительность',sec:'с',notesCount:'Нот',
  preview:'Прослушать',stopPreview:'Стоп',example:'Пример',base:'Стандартная как основа',read:'Прочитать с платы',write:'Записать на плату',reset:'Вернуть стандартную',
  tooLong:'Слишком длинная мелодия: максимум 144 символа.',invalid:'Допустимы только печатные символы ASCII. Недопустимый символ номер',stops:'Плата остановит мелодию на символе',
  reasons:{unknown:'неизвестная команда',length:'длина L0',tempo:'темп меньше 32',mode:'неверный режим M',number:'номер ноты больше 84'},
  octave:'Октава выше 6 звучит как шестая.',wrap:'Числа от 256 плата читает по модулю 256, поэтому длина, темп или номер изменятся.',repeat:'MB повторяет мелодию без конца, пока её не прервёт другой звук.',
  willWrite:'Будет записано параметров',confirm:'Записать мелодию на контроллер?',confirmReset:'Вернуть стандартную мелодию запуска? Будет записан только BUZ_CSTM_SONG = 0, остальные параметры мелодии останутся.',
  written:'Записано и подтверждено контроллером. Мелодия прозвучит при следующем включении платы.',resetDone:'Стандартная мелодия возвращена.',already:'На плате уже эта мелодия.',readDone:'Мелодия прочитана с платы.',readStandard:'На плате стандартная мелодия: текста нет.',
  progress:'Записано',verifyFailed:'Контроллер вернул другие значения: мелодия не подтверждена.',blocked:'Запись возможна при USB-связи, DISARMED и после полного чтения параметров.',noAudio:'Браузер не умеет воспроизводить звук.',
  helpLabel:'Как это работает',
  help:['Мелодия звучит один раз при включении платы. Любой другой звук (смена режима, взвод, предупреждение) прерывает её.','Формат MML тот же, что у встроенных сигналов платы: ноты A–G (# или + — диез, − — бемоль, точка удлиняет), P — пауза, O — октава (0–6), < и > — сдвиг октавы, L — длина по умолчанию, T — темп (32–255), N — нота по номеру, MN / ML / MS — стиль, MF — один раз. Регистр букв и пробелы не важны.','В ArduPilot нет текстовых параметров, поэтому мелодия записывается числами в BUZ_CSTM_SONG, BUZ_CSTM_SONG2 … BUZ_CSTM_SONG48 по три символа; максимум 144 символа. BUZ_CSTM_SONG = 0 — стандартная мелодия.','Прослушивание в браузере приблизительное: плата играет на пищалке.']},
 uk:{title:'Мелодія запуску',noparams:'Підключи контролер і дочекайся читання параметрів',unsupported:'Потрібна прошивка з параметром BUZ_CSTM_SONG',standard:'На платі: стандартна мелодія запуску',custom:'На платі: власна мелодія',chars:'симв.',
  label:'Текст мелодії у форматі MML',placeholder:'Наприклад: MFT200L4O6CD#8G.',count:'Символів',duration:'Тривалість',sec:'с',notesCount:'Нот',
  preview:'Прослухати',stopPreview:'Стоп',example:'Приклад',base:'Стандартна як основа',read:'Прочитати з плати',write:'Записати на плату',reset:'Повернути стандартну',
  tooLong:'Задовга мелодія: максимум 144 символи.',invalid:'Припустимі лише друковані символи ASCII. Неприпустимий символ номер',stops:'Плата зупинить мелодію на символі',
  reasons:{unknown:'невідома команда',length:'довжина L0',tempo:'темп менший за 32',mode:'хибний режим M',number:'номер ноти більший за 84'},
  octave:'Октава вище 6 звучить як шоста.',wrap:'Числа від 256 плата читає за модулем 256, тому довжина, темп або номер зміняться.',repeat:'MB повторює мелодію без кінця, поки її не перерве інший звук.',
  willWrite:'Буде записано параметрів',confirm:'Записати мелодію на контролер?',confirmReset:'Повернути стандартну мелодію запуску? Буде записано лише BUZ_CSTM_SONG = 0, решта параметрів мелодії залишиться.',
  written:'Записано й підтверджено контролером. Мелодія пролунає під час наступного вмикання плати.',resetDone:'Стандартну мелодію повернуто.',already:'На платі вже ця мелодія.',readDone:'Мелодію прочитано з плати.',readStandard:'На платі стандартна мелодія: тексту немає.',
  progress:'Записано',verifyFailed:'Контролер повернув інші значення: мелодію не підтверджено.',blocked:'Запис можливий при USB-зв’язку, DISARMED і після повного читання параметрів.',noAudio:'Браузер не вміє відтворювати звук.',
  helpLabel:'Як це працює',
  help:['Мелодія звучить один раз під час вмикання плати. Будь-який інший звук (зміна режиму, взведення, попередження) перериває її.','Формат MML той самий, що й у вбудованих сигналів плати: ноти A–G (# або + — дієз, − — бемоль, крапка подовжує), P — пауза, O — октава (0–6), < і > — зсув октави, L — довжина за замовчуванням, T — темп (32–255), N — нота за номером, MN / ML / MS — стиль, MF — один раз. Регістр літер і пробіли не важливі.','В ArduPilot немає текстових параметрів, тому мелодія записується числами в BUZ_CSTM_SONG, BUZ_CSTM_SONG2 … BUZ_CSTM_SONG48 по три символи; максимум 144 символи. BUZ_CSTM_SONG = 0 — стандартна мелодія.','Прослуховування в браузері приблизне: плата грає на пищалці.']},
 en:{title:'Startup melody',noparams:'Connect the controller and wait for the parameter read',unsupported:'Firmware with the BUZ_CSTM_SONG parameter required',standard:'On the board: the standard startup melody',custom:'On the board: a custom melody',chars:'chars',
  label:'Melody text in MML',placeholder:'For example: MFT200L4O6CD#8G.',count:'Characters',duration:'Duration',sec:'s',notesCount:'Notes',
  preview:'Listen',stopPreview:'Stop',example:'Example',base:'Standard as a base',read:'Read from the board',write:'Write to the board',reset:'Back to standard',
  tooLong:'The melody is too long: 144 characters at most.',invalid:'Only printable ASCII characters are allowed. Not allowed: character number',stops:'The board stops the melody at character',
  reasons:{unknown:'unknown command',length:'length L0',tempo:'tempo below 32',mode:'wrong M mode',number:'note number above 84'},
  octave:'An octave above 6 sounds as 6.',wrap:'The board reads numbers modulo 256, so a length, tempo or note number of 256 or more changes.',repeat:'MB repeats the melody endlessly until another sound interrupts it.',
  willWrite:'Parameters to write',confirm:'Write the melody to the controller?',confirmReset:'Go back to the standard startup melody? Only BUZ_CSTM_SONG = 0 is written; the other melody parameters stay.',
  written:'Written and confirmed by the controller. The melody plays the next time the board is powered on.',resetDone:'The standard melody is back.',already:'The board already has this melody.',readDone:'The melody was read from the board.',readStandard:'The board has the standard melody: there is no text.',
  progress:'Written',verifyFailed:'The controller returned other values: the melody is not confirmed.',blocked:'Writing needs a USB link, DISARMED and a completed parameter read.',noAudio:'This browser cannot play sound.',
  helpLabel:'How it works',
  help:['The melody plays once when the board is powered on. Any other sound (mode change, arming, a warning) interrupts it.','The MML format is the one of the board’s built-in signals: notes A–G (# or + sharp, − flat, a dot lengthens), P rest, O octave (0–6), < and > octave shift, L default length, T tempo (32–255), N note by number, MN / ML / MS style, MF once. Letter case and spaces do not matter.','ArduPilot has no text parameters, so the melody is written as numbers into BUZ_CSTM_SONG, BUZ_CSTM_SONG2 … BUZ_CSTM_SONG48, three characters each; 144 characters at most. BUZ_CSTM_SONG = 0 is the standard melody.','Listening in the browser is approximate: the board plays on a piezo buzzer.']}
};
const tr=key=>(words[window.AtlasLanguage?.()]||words.ru)[key];
const $=id=>document.getElementById(id);
const card=document.createElement('article');card.className='cc-card order-card song-card';card.id='songPanel';
card.innerHTML='<div class="cc-card-title"><span>♪</span><strong id="songTitle"></strong><small>BUZ_CSTM_SONG</small></div><strong id="songStatus" role="status" aria-live="polite"></strong><label class="song-label" id="songLabel" for="songText"></label><textarea id="songText" class="song-text" rows="4" maxlength="600" spellcheck="false" autocomplete="off" autocapitalize="characters"></textarea><p class="song-info" id="songInfo"></p><ul class="song-notes" id="songNotes"></ul><div class="order-actions song-actions"><button id="songPreview" class="cc-button ghost" type="button"></button><button id="songExample" class="cc-button ghost" type="button"></button><button id="songBase" class="cc-button ghost" type="button"></button></div><div class="order-actions"><button id="songRead" class="cc-button ghost" type="button"></button><button id="songWrite" class="cc-button primary" type="button"></button><button id="songReset" class="cc-button ghost" type="button"></button></div><details class="global-details song-help"><summary id="songHelpLabel"></summary><ul id="songHelp"></ul></details><p id="songResult" role="status" aria-live="polite"></p>';
// Right column of the main screen, under the vehicle state (the O.R.D.E.R. and G.L.O.B.A.L. cards sit under the horizon).
const statusPanel=document.querySelector('.cc-status-panel');if(statusPanel)statusPanel.after(card);else document.querySelector('.cc-dashboard-right')?.prepend(card);
let busy=false,touched=false,playing=null,drawn='';
const text=()=>$('songText').value;
function link(){const s=api.getState();return {state:s,params:s.params,link:{ready:s.connected&&!s.demo&&s.params.size>0&&!s.paramLoading,canWrite:api.canWrite()}};}
function view(){const l=link();return core.model({params:l.params,text:text(),link:l.link,busy});}

// Listening in the browser: square waves like the board's buzzer, one note after another. Approximate, and never touches the board.
function stopPreview(){if(!playing)return;clearTimeout(playing.timer);try{playing.ctx.close();}catch{}playing=null;render();}
function startPreview(){
 const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx){$('songResult').textContent=tr('noAudio');return;}
 stopPreview();
 const events=core.run(text()).events;if(!events.length)return;
 const ctx=new Ctx();let t=ctx.currentTime+.06;
 for(const e of events){
  const d=e.ms/1000;
  if(e.kind==='note'){
   const osc=ctx.createOscillator(),gain=ctx.createGain(),edge=Math.min(.004,d/4);
   osc.type='square';osc.frequency.value=e.hz;
   gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(.05,t+edge);gain.gain.setValueAtTime(.05,Math.max(t+edge,t+d-edge));gain.gain.linearRampToValueAtTime(.0001,t+d);
   osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+d+.01);
  }
  t+=d;
 }
 playing={ctx,timer:setTimeout(stopPreview,Math.max(100,(t-ctx.currentTime)*1000+200))};render();
}

function render(){
 const m=view(),d=m.check,s=m.state,len=text().length,lang=window.AtlasLanguage?.()||'ru';
 const signature=JSON.stringify([lang,s,m.board.length,len,d.invalid,d.stop?.index,d.warnings.length,Math.round(d.durationMs),m.changes.length,m.can,busy,!!playing]);
 if(signature===drawn)return;drawn=signature;
 $('songTitle').textContent=tr('title');$('songLabel').textContent=tr('label');$('songText').placeholder=tr('placeholder');
 $('songHelpLabel').textContent=tr('helpLabel');const help=$('songHelp');help.replaceChildren();for(const line of tr('help')){const li=document.createElement('li');li.textContent=line;help.append(li);}
 $('songStatus').textContent=s==='custom'?`${tr('custom')} · ${m.board.length} ${tr('chars')}`:tr(s);card.dataset.state=s;
 const info=$('songInfo');info.replaceChildren();info.dataset.bad=String(len>core.MAX||d.invalid>=0);
 for(const [label,value,cls] of [[tr('count'),`${len} / ${core.MAX}`,'song-count'],[tr('duration'),`${(d.durationMs/1000).toFixed(1)} ${tr('sec')}`,''],[tr('notesCount'),String(d.notes),'']]){
  const part=document.createElement('span');part.append(`${label}: `);const b=document.createElement('b');b.textContent=value;if(cls)b.className=cls;part.append(b);info.append(part,' · ');
 }
 info.lastChild?.remove();
 const notes=$('songNotes');notes.replaceChildren();
 const add=(kind,msg)=>{const li=document.createElement('li');li.dataset.kind=kind;li.textContent=msg;notes.append(li);};
 if(d.tooLong)add('error',tr('tooLong'));
 if(d.invalid>=0)add('error',`${tr('invalid')} ${d.invalid+1}`);
 if(!d.tooLong&&d.invalid<0){
  if(d.stop)add('warn',`${tr('stops')} ${d.stop.index+1}${d.stop.char?` («${d.stop.char}»)`:''}: ${tr('reasons')[d.stop.reason]||d.stop.reason}`);
  if(d.warnings.some(w=>w.kind==='octave'))add('warn',tr('octave'));
  if(d.warnings.some(w=>w.kind==='wrap'))add('warn',tr('wrap'));
  if(d.repeats)add('warn',tr('repeat'));
  if(m.changes.length)add('info',`${tr('willWrite')}: ${m.changes.length}`);
 }
 $('songPreview').textContent=playing?tr('stopPreview'):tr('preview');$('songExample').textContent=tr('example');$('songBase').textContent=tr('base');
 $('songRead').textContent=tr('read');$('songWrite').textContent=tr('write');$('songReset').textContent=tr('reset');
 $('songPreview').disabled=!playing&&!m.can.preview;$('songExample').disabled=busy;$('songBase').disabled=busy;
 $('songRead').disabled=!m.can.read;$('songWrite').disabled=!m.can.write;$('songReset').disabled=!m.can.reset;
 // the melody on the board fills an untouched field once, so a connected board shows what it plays
 if(!touched&&s==='custom'&&!text()){$('songText').value=m.board.text;touched=true;drawn='';render();}
}
function setText(value){$('songText').value=value;touched=true;$('songResult').textContent='';drawn='';render();}
async function write(updates,confirmText,doneText,expected){
 if(busy||!api.canWrite())return;
 if(!updates.length){$('songResult').textContent=tr('already');return;}
 const first=updates[0][0],last=updates.at(-1)[0];
 if(!window.confirm(`${confirmText}\n\n${tr('willWrite')}: ${updates.length}\n${first} … ${last}`))return;
 busy=true;$('songResult').textContent='';drawn='';render();
 try{
  const r=await api.writeBuzzerSong(updates,p=>{$('songResult').textContent=`${tr('progress')}: ${p.done}/${p.total}${p.name?' · '+p.name:''}`;});
  // the values the controller echoed are checked again against what it now reports
  const now=core.board(api.getState().params);
  $('songResult').textContent=now.text===expected?`${doneText} (${r.done}/${r.total})`:tr('verifyFailed');
 }catch(e){$('songResult').textContent=e.message;}
 finally{busy=false;drawn='';render();}
}
$('songText').addEventListener('input',()=>{touched=true;$('songResult').textContent='';render();});
$('songPreview').onclick=()=>{if(playing)stopPreview();else startPreview();};
$('songExample').onclick=()=>setText(core.EXAMPLE);
$('songBase').onclick=()=>setText(core.STANDARD);
$('songRead').onclick=()=>{const b=core.board(api.getState().params);setText(b.text);$('songResult').textContent=b.state==='custom'?tr('readDone'):tr('readStandard');};
$('songWrite').onclick=()=>{const wanted=text();let updates=[];try{updates=core.plan(wanted,api.getState().params);}catch(e){$('songResult').textContent=e.message;return;}return write(updates,tr('confirm'),tr('written'),wanted);};
$('songReset').onclick=()=>write(core.plan('',api.getState().params),tr('confirmReset'),tr('resetDone'),'');
for(const event of ['atlas:state','atlas:language','atlas:parameters'])window.addEventListener(event,render);
window.addEventListener('pagehide',stopPreview);
const refresh=()=>{if(!document.hidden)render();};let timer=setInterval(refresh,500);window.addEventListener('pagehide',()=>{clearInterval(timer);timer=null;});window.addEventListener('pageshow',()=>{if(!timer)timer=setInterval(refresh,500);render();});render();
})();
