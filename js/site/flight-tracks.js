/* A.T.L.A.S. mini-game: the panel of own tracks on the attitude card of the home page. The player opens one or two pieces of music from their own device, the beat of
   each is found (flight-beat.js) and the race of the game (flight-game.js) flies to them: its rings, obstacles and manoeuvres on their beats. The files are read in
   the browser and nowhere else: nothing is uploaded, nothing is stored but the sound delay. While the panel is open, the game does not start by itself and leaves
   the keys to the panel. Everything here is a game on a synthetic display. No MAVLink, USB, or flight-controller connection. */
(() => {
 'use strict';
 const demo = window.AtlasFlightDemo, B = window.AtlasBeat, game = demo && demo.layer;
 const Decoder = window.OfflineAudioContext || window.webkitOfflineAudioContext;
 if (!demo || !B || !Decoder || !game || !game.block) return;
 const { host, state, bound } = demo;
 const root = host.closest('.hero-display') || host.parentElement;
 const actions = root.querySelector('.scope-actions');
 if (!actions) return;
 const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
 const LATENCY_KEY = 'atlas-rhythm-latency';
 const BARS = 8;      // the shortest piece the race can use

 const TEXT = {
  ru: { open: '♫ СВОИ ТРЕКИ', openLabel: 'Гонка под свою музыку', shut: '■ ЗАКРЫТЬ', title: 'ГОНКА ПОД СВОЮ МУЗЫКУ', note: 'Файлы читаются только на твоём устройстве: на сайт ничего не отправляется.',
   track1: 'ТРЕК 1', track2: 'ТРЕК 2 · ПО ЖЕЛАНИЮ', choose: 'ФАЙЛ', none: 'не выбран', reading: 'читаю файл…', listening: 'ищу ритм… {p} %', info: '{len} · {bpm} уд/мин', unsteady: 'ритм неровный',
   bad: 'не удалось прочитать этот файл', bwav: 'BWAV браузер не читает: выбери копию в WAV', short: 'трек слишком короткий', delay: 'ЗВУК ОТСТАЁТ? ЗАДЕРЖКА {ms} МС', fly: 'В ГОНКУ', close: 'ЗАКРЫТЬ',
   keys: 'Гонка на 20 км под твою музыку: кольца, ящики, препятствия и манёвры идут в бит. Два трека играют по очереди, на смене — переворот.' },
  uk: { open: '♫ СВОЇ ТРЕКИ', openLabel: 'Перегони під свою музику', shut: '■ ЗАКРИТИ', title: 'ПЕРЕГОНИ ПІД СВОЮ МУЗИКУ', note: 'Файли читаються лише на твоєму пристрої: на сайт нічого не надсилається.',
   track1: 'ТРЕК 1', track2: 'ТРЕК 2 · ЗА БАЖАННЯМ', choose: 'ФАЙЛ', none: 'не вибрано', reading: 'читаю файл…', listening: 'шукаю ритм… {p} %', info: '{len} · {bpm} уд/хв', unsteady: 'ритм нерівний',
   bad: 'не вдалося прочитати цей файл', bwav: 'BWAV браузер не читає: вибери копію у WAV', short: 'трек занадто короткий', delay: 'ЗВУК ВІДСТАЄ? ЗАТРИМКА {ms} МС', fly: 'У ПЕРЕГОНИ', close: 'ЗАКРИТИ',
   keys: 'Перегони на 20 км під твою музику: кільця, ящики, перешкоди й маневри йдуть у біт. Два треки грають по черзі, на зміні — переворот.' },
  en: { open: '♫ MY TRACKS', openLabel: 'Race to your own music', shut: '■ CLOSE', title: 'RACE TO YOUR OWN MUSIC', note: 'The files are read on your device only: nothing is sent to the site.',
   track1: 'TRACK 1', track2: 'TRACK 2 · OPTIONAL', choose: 'FILE', none: 'not chosen', reading: 'reading the file…', listening: 'finding the beat… {p} %', info: '{len} · {bpm} BPM', unsteady: 'uneven rhythm',
   bad: 'this file could not be read', bwav: 'browsers cannot read BWAV: choose a WAV copy', short: 'the track is too short', delay: 'SOUND LATE? DELAY {ms} MS', fly: 'RACE', close: 'CLOSE',
   keys: 'A 20 km race to your music: rings, boxes, obstacles and manoeuvres on the beat. Two tracks take turns, the flight turns over between them.' }
 };
 const lang = () => { const l = window.AtlasI18n && window.AtlasI18n.lang; return TEXT[l] ? l : (TEXT[document.documentElement.lang] ? document.documentElement.lang : 'ru'); };
 const tx = (key, values) => { let s = TEXT[lang()][key]; for (const [k, v] of Object.entries(values || {})) s = s.replace('{' + k + '}', v); return s; };
 const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
 const store = (() => { try { return window.localStorage; } catch { return null; } })();
 const read = key => { try { return store && store.getItem(key); } catch { return null; } };
 const write = (key, v) => { try { if (store) store.setItem(key, v); } catch { /* private windows */ } };
 const clock = s => { const n = Math.round(s); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };

 // ---------------------------------------------------------------- the button in the header and the panel on the card
 const openBtn = el('button', 'game-own'); openBtn.type = 'button'; actions.prepend(openBtn);
 const panel = el('div', 'rhythm-panel'); panel.hidden = true;
 const title = el('div', 'rhythm-title'), note = el('div', 'rhythm-note'), hint = el('div', 'rhythm-note is-keys');
 const slots = [0, 1].map(k => {
  const row = el('div', 'rhythm-slot'), name = el('span', 'rhythm-slot-name'), pick = el('label', 'rhythm-pick'), word = el('span'), input = el('input'), info = el('span', 'rhythm-slot-info');
  input.type = 'file'; input.accept = 'audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.bwav'; pick.append(word, input); row.append(name, pick, info);
  input.addEventListener('change', () => { const file = input.files && input.files[0]; if (file) load(k, file); });
  return { row, name, word, input, info, track: null, status: null, job: 0 };
 });
 const delayRow = el('label', 'rhythm-delay'), delayText = el('span'), delay = el('input');
 delay.type = 'range'; delay.min = '-150'; delay.max = '350'; delay.step = '10';
 delay.value = String(bound(Math.round(+read(LATENCY_KEY) || 0), -150, 350)); delayRow.append(delayText, delay);
 const buttons = el('div', 'rhythm-buttons'), flyBtn = el('button', 'game-btn is-primary'), closeBtn = el('button', 'game-btn');
 flyBtn.type = closeBtn.type = 'button'; buttons.append(flyBtn, closeBtn);
 panel.append(title, note, slots[0].row, slots[1].row, delayRow, hint, buttons);
 host.append(panel);
 // the demo must not capture the pointer or take the arrow keys while the panel is used
 panel.addEventListener('pointerdown', ev => ev.stopPropagation());
 panel.addEventListener('keydown', ev => { if (ev.key !== 'Escape') ev.stopPropagation(); });
 let shown = false, decoder = null;

 /** The bytes decoded into sound (an offline context needs no click). */
 const decode = data => new Promise((resolve, reject) => { decoder = decoder || new Decoder(2, 1, 44100); const p = decoder.decodeAudioData(data, resolve, reject); if (p && p.then) p.then(resolve, reject); });
 /** The music of the race for a found beat: the bar starts and the end of the last whole bar. */
 function piece(found) {
  const beat = found.period, offset = found.beats[found.downbeat % found.beats.length] || found.offset, bars = Math.floor((found.soundEnd - offset) / (4 * beat));
  return bars >= BARS ? { beat, offset, end: offset + bars * 4 * beat } : null;
 }
 /** A file of the player: read, decoded, its beat found. */
 async function load(k, file) {
  const slot = slots[k], job = ++slot.job;
  slot.track = null; slot.status = ['reading']; paint();
  try {
   const data = await file.arrayBuffer();
   const head = new Uint8Array(data, 0, Math.min(4, data.byteLength));
   if (String.fromCharCode(...head) === 'BWAV') { if (job === slot.job) { slot.status = ['bwav']; paint(); } return false; }
   const buffer = await decode(data);
   const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
   const m = B.mono(channels, buffer.sampleRate);
   const found = await B.analyseSlowly(m.samples, m.rate, p => { if (job === slot.job) { slot.status = ['listening', { p: Math.round(p * 100) }]; paint(); } }, () => new Promise(r => setTimeout(r, 0)));
   if (job !== slot.job) return false;
   const music = piece(found);
   if (!music) { slot.status = ['short']; paint(); return false; }
   slot.track = { name: file.name, buffer, music };
   slot.status = ['info', { len: clock(found.duration), bpm: Math.round(found.bpm * 10) / 10 }, found.steady - found.chance < .25];
   paint();
   return true;
  } catch (error) {
   if (job === slot.job) { slot.status = [error && error.message === 'short' ? 'short' : 'bad']; paint(); }
   return false;
  }
 }
 function paint() {
  openBtn.textContent = tx(shown ? 'shut' : 'open'); openBtn.setAttribute('aria-label', tx(shown ? 'close' : 'openLabel'));
  title.textContent = tx('title'); note.textContent = tx('note'); hint.textContent = tx('keys');
  slots.forEach((s, k) => {
   s.name.textContent = tx(k ? 'track2' : 'track1'); s.word.textContent = tx('choose'); s.input.setAttribute('aria-label', `${tx(k ? 'track2' : 'track1')}: ${tx('choose')}`);
   const st = s.status || ['none'];
   s.info.textContent = tx(st[0], st[1]) + (st[2] ? ' · ' + tx('unsteady') : '') + (s.track ? ' · ' + s.track.name : '');
   s.info.classList.toggle('is-error', ['bad', 'bwav', 'short'].includes(st[0])); s.info.classList.toggle('is-ready', !!s.track);
   s.info.setAttribute('title', s.info.textContent);
  });
  delayText.textContent = tx('delay', { ms: (+delay.value > 0 ? '+' : '') + delay.value });
  flyBtn.textContent = tx('fly'); closeBtn.textContent = tx('close'); flyBtn.disabled = !slots.some(s => s.track);
 }
 function open() {
  if (shown || game.engaged) return false;
  shown = true; game.block(true); panel.hidden = false;
  host.classList.add('is-rhythm'); root.classList.add('is-rhythm'); host.classList.toggle('is-narrow', state.w < 440);
  paint();
  try { slots[0].input.focus({ preventScroll: true }); } catch { /* old browsers */ }
  return true;
 }
 function close() {
  if (!shown) return false;
  shown = false; panel.hidden = true; host.classList.remove('is-rhythm', 'is-narrow'); root.classList.remove('is-rhythm');
  slots.forEach(s => { if (s.status && !s.track) { s.job++; s.status = null; } });
  game.block(false); paint(); demo.wake();
  return true;
 }
 /** The race starts with the chosen pieces, in their order. */
 function fly() {
  const tracks = slots.map(s => s.track).filter(Boolean);
  if (!tracks.length) return false;
  close();
  return game.start({ music: tracks.map(t => t.music), buffers: tracks.map(t => t.buffer) });
 }
 openBtn.addEventListener('click', () => { if (shown) close(); else open(); });
 closeBtn.addEventListener('click', () => close());
 flyBtn.addEventListener('click', () => fly());
 delay.addEventListener('input', () => { write(LATENCY_KEY, delay.value); paint(); });
 host.addEventListener('keydown', ev => { if (shown && ev.key === 'Escape') { ev.preventDefault(); close(); } });
 window.addEventListener('atlas:languagechange', paint);
 // for tests and for the curious
 window.AtlasFlightTracks = Object.freeze({ open, close, load, fly, TEXT, piece, get shown() { return shown; }, get tracks() { return slots.map(s => s.track); } });
 paint();
})();
