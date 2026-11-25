/* A.T.L.A.S. mini-game, the rhythm flight on the attitude card of the home page (rules: flight-rhythm-core.js, the beat of the music: flight-beat.js).
   It flies to the main track of the site, or, as a separate choice, to one or two pieces of music the player opens from their own device: those files are read in the
   browser and nowhere else (nothing is uploaded, nothing is stored but the sound delay and the best accuracy). The music is played with Web Audio and its clock drives
   the flight. While this flight is on, it takes the card over from the other game (flight-game.js) and gives it back on exit. Everything here is a game on a synthetic
   display. No MAVLink, USB, or flight-controller connection. */
(() => {
 'use strict';
 const demo = window.AtlasFlightDemo, R = window.AtlasRhythm, B = window.AtlasBeat, base = demo && demo.layer;
 if (!demo || !R || !B || !base || !base.kit) return;
 const AC = window.AudioContext || window.webkitAudioContext;
 const { host, state, bound } = demo, kit = base.kit, CFG = R.CFG, DEG = Math.PI / 180;
 const root = host.closest('.hero-display') || host.parentElement;
 const actions = root.querySelector('.scope-actions');
 if (!AC || !actions) return;
 const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
 const MONO = '"IBM Plex Mono", monospace';
 // the main track: one file of the site (a long piece, so its second half is flown inverted)
 const MAIN = Object.freeze({ src: 'assets/music/pixelated-dreamscape.mp3', title: 'Pixelated Dreamscape Journey', by: 'StockTune' });
 const LATENCY_KEY = 'atlas-rhythm-latency', BEST_KEY = 'atlas-rhythm-best';
 const KEY_X = 4, KEY_Y = 3;                 // how fast the arrow keys move the aim (world units a second)
 const AXES = { arrowleft: ['x', -1], arrowright: ['x', 1], arrowup: ['y', 1], arrowdown: ['y', -1], a: ['x', -1], d: ['x', 1], w: ['y', 1], s: ['y', -1] };
 const ACT = [' ', 'enter', 'f', 'j'];       // the keys of the action
 const COLOR = { perfect: '#fff2b0', good: '#c7d070', miss: '#e07b4f' };

 const TEXT = {
  ru: { open: '♫ РИТМ', openLabel: 'Ритм-полёт под музыку', exit: '■ ВЫХОД', title: 'РИТМ-ПОЛЁТ', note: 'Файлы читаются только на твоём устройстве: на сайт ничего не отправляется.',
   mainLabel: 'ОСНОВНОЙ ТРЕК', own: 'СВОИ ТРЕКИ', back: 'ОСНОВНОЙ', loading: 'загружаю…', missing: 'этот трек ещё не добавлен на сайт: пока летай под свои файлы',
   track1: 'ТРЕК 1 · ПОЛЁТ', track2: 'ТРЕК 2 · ПЕРЕВОРОТ И ПОСАДКА', choose: 'ФАЙЛ', none: 'не выбран', reading: 'читаю файл…', listening: 'ищу ритм… {p} %', info: '{len} · {bpm} уд/мин', unsteady: 'ритм неровный',
   bad: 'не удалось прочитать этот файл', bwav: 'BWAV браузер не читает: выбери копию в WAV', short: 'трек слишком короткий', delay: 'ЗВУК ОТСТАЁТ? ЗАДЕРЖКА {ms} МС', fly: 'ЛЕТЕТЬ', close: 'ЗАКРЫТЬ',
   keys: 'Веди мышь в кольца. Пробел или клик — в бит: бочка двойной, выстрел один.', keysTouch: 'Веди пальцем в кольца. Кнопка внизу — в бит: бочка двойной, выстрел один.',
   score: 'СЧЁТ', accuracy: 'ТОЧНОСТЬ', combo: 'СЕРИЯ', act: 'В БИТ', ready: 'ПРИГОТОВЬСЯ', kill: 'ОГОНЬ В БИТ', roll: 'БОЧКА ×2', touchdown: 'КАСАНИЕ В БИТ',
   noise: 'ПОМЕХИ', inverted: 'ПЕРЕВЁРНУТЫЙ ПОЛЁТ', upright: 'ВЫХОД ИЗ ПЕРЕВОРОТА', landing: 'ЗАХОД НА ПОСАДКУ',
   perfect: 'ИДЕАЛЬНО', good: 'ХОРОШО', miss: 'МИМО', down: 'СБИТ!', rolled: 'БОЧКА!', soft: 'МЯГКОЕ КАСАНИЕ', hard: 'ЖЁСТКАЯ ПОСАДКА', away: 'УШЁЛ',
   paused: 'ПАУЗА', resume: 'Нажми, чтобы продолжить',
   cup: 'КУБОК ОФИЦИАЛЬНОГО ПИЛОТА A.T.L.A.S.', gold: 'ЗОЛОТО', silver: 'СЕРЕБРО', bronze: 'БРОНЗА', landed: 'ПОСАДКА УДАЛАСЬ', noCup: 'Для кубка нужна точность от 50 %',
   rings: 'КОЛЬЦА', kills: 'СБИТО', rolls: 'БОЧКИ', maxCombo: 'ЛУЧШАЯ СЕРИЯ', best: 'РЕКОРД ТОЧНОСТИ', again: 'ЕЩЁ РАЗ', liveDone: 'Посадка. Точность {a} %.', liveStart: 'Музыка пошла.' },
  uk: { open: '♫ РИТМ', openLabel: 'Ритм-політ під музику', exit: '■ ВИХІД', title: 'РИТМ-ПОЛІТ', note: 'Файли читаються лише на твоєму пристрої: на сайт нічого не надсилається.',
   mainLabel: 'ОСНОВНИЙ ТРЕК', own: 'СВОЇ ТРЕКИ', back: 'ОСНОВНИЙ', loading: 'завантажую…', missing: 'цей трек ще не додано на сайт: поки літай під свої файли',
   track1: 'ТРЕК 1 · ПОЛІТ', track2: 'ТРЕК 2 · ПЕРЕВОРОТ І ПОСАДКА', choose: 'ФАЙЛ', none: 'не вибрано', reading: 'читаю файл…', listening: 'шукаю ритм… {p} %', info: '{len} · {bpm} уд/хв', unsteady: 'ритм нерівний',
   bad: 'не вдалося прочитати цей файл', bwav: 'BWAV браузер не читає: вибери копію у WAV', short: 'трек занадто короткий', delay: 'ЗВУК ВІДСТАЄ? ЗАТРИМКА {ms} МС', fly: 'ЛЕТІТИ', close: 'ЗАКРИТИ',
   keys: 'Веди мишу в кільця. Пробіл або клік — у біт: бочка подвійний, постріл один.', keysTouch: 'Веди пальцем у кільця. Кнопка внизу — у біт: бочка подвійний, постріл один.',
   score: 'РАХУНОК', accuracy: 'ТОЧНІСТЬ', combo: 'СЕРІЯ', act: 'У БІТ', ready: 'ПРИГОТУЙСЯ', kill: 'ВОГОНЬ У БІТ', roll: 'БОЧКА ×2', touchdown: 'ДОТИК У БІТ',
   noise: 'ПЕРЕШКОДИ', inverted: 'ПЕРЕВЕРНУТИЙ ПОЛІТ', upright: 'ВИХІД З ПЕРЕВОРОТУ', landing: 'ЗАХІД НА ПОСАДКУ',
   perfect: 'ІДЕАЛЬНО', good: 'ДОБРЕ', miss: 'ПОВЗ', down: 'ЗБИТО!', rolled: 'БОЧКА!', soft: 'М’ЯКИЙ ДОТИК', hard: 'ЖОРСТКА ПОСАДКА', away: 'УТІК',
   paused: 'ПАУЗА', resume: 'Натисни, щоб продовжити',
   cup: 'КУБОК ОФІЦІЙНОГО ПІЛОТА A.T.L.A.S.', gold: 'ЗОЛОТО', silver: 'СРІБЛО', bronze: 'БРОНЗА', landed: 'ПОСАДКА ВДАЛАСЯ', noCup: 'Для кубка потрібна точність від 50 %',
   rings: 'КІЛЬЦЯ', kills: 'ЗБИТО', rolls: 'БОЧКИ', maxCombo: 'НАЙКРАЩА СЕРІЯ', best: 'РЕКОРД ТОЧНОСТІ', again: 'ЩЕ РАЗ', liveDone: 'Посадка. Точність {a} %.', liveStart: 'Музика пішла.' },
  en: { open: '♫ RHYTHM', openLabel: 'Rhythm flight to music', exit: '■ EXIT', title: 'RHYTHM FLIGHT', note: 'The files are read on your device only: nothing is sent to the site.',
   mainLabel: 'MAIN TRACK', own: 'MY TRACKS', back: 'MAIN TRACK', loading: 'loading…', missing: 'this track is not on the site yet: fly to your own files for now',
   track1: 'TRACK 1 · THE FLIGHT', track2: 'TRACK 2 · INVERTED AND LANDING', choose: 'FILE', none: 'not chosen', reading: 'reading the file…', listening: 'finding the beat… {p} %', info: '{len} · {bpm} BPM', unsteady: 'uneven rhythm',
   bad: 'this file could not be read', bwav: 'browsers cannot read BWAV: choose a WAV copy', short: 'the track is too short', delay: 'SOUND LATE? DELAY {ms} MS', fly: 'FLY', close: 'CLOSE',
   keys: 'Mouse into the rings. Space or click on the beat: twice for a roll, once to shoot.', keysTouch: 'Finger into the rings. The button below on the beat: twice for a roll, once to shoot.',
   score: 'SCORE', accuracy: 'ACCURACY', combo: 'COMBO', act: 'ON BEAT', ready: 'GET READY', kill: 'FIRE ON THE BEAT', roll: 'BARREL ROLL ×2', touchdown: 'TOUCH ON THE BEAT',
   noise: 'STATIC', inverted: 'INVERTED FLIGHT', upright: 'ROLLING UPRIGHT', landing: 'FINAL APPROACH',
   perfect: 'PERFECT', good: 'GOOD', miss: 'MISS', down: 'DOWN!', rolled: 'ROLL!', soft: 'SOFT TOUCHDOWN', hard: 'HARD LANDING', away: 'GOT AWAY',
   paused: 'PAUSED', resume: 'Press to go on',
   cup: 'OFFICIAL A.T.L.A.S. PILOT CUP', gold: 'GOLD', silver: 'SILVER', bronze: 'BRONZE', landed: 'YOU LANDED', noCup: 'A cup needs 50 % accuracy',
   rings: 'RINGS', kills: 'SHOT DOWN', rolls: 'ROLLS', maxCombo: 'BEST COMBO', best: 'BEST ACCURACY', again: 'AGAIN', liveDone: 'Landed. Accuracy {a} %.', liveStart: 'The music is playing.' }
 };
 const lang = () => { const l = window.AtlasI18n && window.AtlasI18n.lang; return TEXT[l] ? l : (TEXT[document.documentElement.lang] ? document.documentElement.lang : 'ru'); };
 const tx = (key, values) => { const t = TEXT[lang()]; let s = (coarse && t[key + 'Touch']) || t[key]; for (const [k, v] of Object.entries(values || {})) s = s.replace('{' + k + '}', v); return s; };
 const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
 const store = (() => { try { return window.localStorage; } catch { return null; } })();
 const read = key => { try { return store && store.getItem(key); } catch { return null; } };
 const write = (key, v) => { try { if (store) store.setItem(key, v); } catch { /* private windows */ } };
 const clock = s => { const n = Math.round(s); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };

 // ---------------------------------------------------------------- the parts of the card
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
 const panelButtons = el('div', 'rhythm-buttons'), flyBtn = el('button', 'game-btn is-primary'), switchBtn = el('button', 'game-btn is-switch'), closeBtn = el('button', 'game-btn');
 flyBtn.type = switchBtn.type = closeBtn.type = 'button'; panelButtons.append(flyBtn, switchBtn, closeBtn);
 // the main track and the choice of own files are two separate views of the panel
 const mainBox = el('div', 'rhythm-slot is-main'), mainName = el('span', 'rhythm-slot-name'), mainTitle = el('strong', 'rhythm-main-title'), mainInfo = el('span', 'rhythm-slot-info');
 mainBox.append(mainName, mainTitle, mainInfo);
 const main = { info: mainInfo, track: null, status: null, job: 0 };
 const ownBox = el('div', 'rhythm-files'); ownBox.append(note, slots[0].row, slots[1].row);
 panel.append(title, mainBox, ownBox, delayRow, hint, panelButtons);
 const hud = el('div', 'rhythm-hud'); hud.hidden = true; hud.setAttribute('aria-hidden', 'true');
 const cell = () => { const c = el('span', 'rhythm-cell'), label = el('small'), value = el('strong'); c.append(label, value); hud.append(c); return { label, value }; };
 const hudScore = cell(), hudAcc = cell(), hudCombo = cell();
 const progress = el('div', 'rhythm-progress'), progressFill = el('i'); progress.hidden = true; progress.setAttribute('aria-hidden', 'true'); progress.append(progressFill);
 const actBar = el('div', 'rhythm-act-bar'), actBtn = el('button', 'rhythm-act'); actBtn.type = 'button'; actBar.hidden = true; actBar.append(actBtn);
 const overlay = el('div', 'rhythm-overlay'); overlay.hidden = true;
 const live = el('div', 'game-live'); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
 host.append(progress, hud, panel, actBar, overlay, live);
 // the demo must not capture the pointer or take the arrow keys while the panel, the overlay or the button are used
 for (const node of [panel, overlay, actBar]) node.addEventListener('pointerdown', ev => ev.stopPropagation());
 for (const node of [panel, overlay]) node.addEventListener('keydown', ev => { if (ev.key !== 'Escape') ev.stopPropagation(); });      // (the keys of the action button are the card's)
 const centreMark = host.querySelector('.sim-center-mark');

 // ---------------------------------------------------------------- the state
 let mode = 'off', source = 'main', game = null, chart = null, ctx = null, out = null, noise = null, sources = [], t0 = 0, skew = 0, skewKnown = false;
 let steerId = null, aimSource = 'pointer', inside = false, punch = 0, horizon = 0, turnBank = 0, rollAnim = null, banner = null, lastHud = '', lastAct = '', markHidden = false;
 const plane = { scale: 1, x: 0, y: 0, alpha: 1 }, cam = { roll: 0, zoom: 1, active: false, px: 0, py: 0 };
 const virt = { x: 0, y: 0 }, aim = { x: 0, y: 0 }, keys = new Set(), popups = [], bursts = [], beams = [], sparks = [];
 const flying = () => mode === 'flight' || mode === 'paused';
 const engaged = () => flying() || mode === 'cup';
 const active = () => mode !== 'off';

 // ---------------------------------------------------------------- the music
 function audio() {
  if (ctx) return ctx;
  ctx = new AC();
  out = ctx.createGain(); out.gain.value = .85; out.connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noise.getChannelData(0); let seed = 99;
  for (let i = 0; i < d.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; d[i] = seed / 0x3fffffff - 1; }
  return ctx;
 }
 const decode = data => new Promise((resolve, reject) => { const p = audio().decodeAudioData(data, resolve, reject); if (p && p.then) p.then(resolve, reject); });
 /** A short burst of noise through a falling filter: the shot that brings an aircraft down, the tyres on the runway. */
 function boom(strength, from, to, length) {
  try {
   const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), now = ctx.currentTime;
   s.buffer = noise; f.type = 'lowpass'; f.frequency.setValueAtTime(from, now); f.frequency.exponentialRampToValueAtTime(to, now + length);
   g.gain.setValueAtTime(strength, now); g.gain.exponentialRampToValueAtTime(.001, now + length);
   s.connect(f); f.connect(g); g.connect(ctx.destination); s.start(now); s.stop(now + length + .02);
  } catch { /* a browser without some node: the flight goes on without the effect */ }
 }
 /** Reads a piece of music (get: a promise of its bytes) into the slot and finds its beat. */
 async function prepare(slot, name, get, first) {
  const job = ++slot.job;
  slot.track = null; slot.status = [first]; paintPanel();
  try {
   const data = await get();
   const head = new Uint8Array(data, 0, Math.min(4, data.byteLength));
   if (String.fromCharCode(...head) === 'BWAV') { if (job === slot.job) { slot.status = ['bwav']; paintPanel(); } return false; }
   const buffer = await decode(data);
   const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
   const m = B.mono(channels, buffer.sampleRate);
   const found = await B.analyseSlowly(m.samples, m.rate, p => { if (job === slot.job) { slot.status = ['listening', { p: Math.round(p * 100) }]; paintPanel(); } }, () => new Promise(r => setTimeout(r, 0)));
   if (job !== slot.job) return false;
   if (found.beats.length < CFG.intro + CFG.landing + 8) { slot.status = ['short']; paintPanel(); return false; }
   slot.track = { name, buffer, analysis: found };
   slot.status = ['info', { len: clock(found.duration), bpm: Math.round(found.bpm * 10) / 10 }, found.steady - found.chance < .25];
   paintPanel();
   return true;
  } catch (error) {
   if (job === slot.job) { const why = error && error.message; slot.status = [why === 'short' ? 'short' : why === 'missing' ? 'missing' : 'bad']; paintPanel(); }
   return false;
  }
 }
 /** A file of the player. */
 const load = (k, file) => prepare(slots[k], file.name, () => file.arrayBuffer(), 'reading');
 /** The main track of the site (read once; a missing file says so, and can be asked for again later). */
 function loadMain() {
  if (main.track || (main.status && ['loading', 'listening'].includes(main.status[0]))) return Promise.resolve(!!main.track);
  return prepare(main, MAIN.title, async () => { const r = await fetch(MAIN.src).catch(() => null); if (!r || !r.ok) throw new Error('missing'); return r.arrayBuffer(); }, 'loading');
 }

 // ---------------------------------------------------------------- texts
 function paintInfo(info, slot, name) {
  const st = slot.status || ['none'];
  info.textContent = tx(st[0], st[1]) + (st[2] ? ' · ' + tx('unsteady') : '') + (name && slot.track ? ' · ' + slot.track.name : '');
  info.classList.toggle('is-error', ['bad', 'bwav', 'short', 'missing'].includes(st[0])); info.classList.toggle('is-ready', !!slot.track);
  info.setAttribute('title', info.textContent);
 }
 /** The tracks the flight will play: the main track, or the files of the player. */
 const chosen = () => (source === 'main' ? [main.track] : slots.map(s => s.track)).filter(Boolean);
 function paintPanel() {
  title.textContent = tx('title'); note.textContent = tx('note'); hint.textContent = tx('keys');
  mainBox.hidden = source !== 'main'; ownBox.hidden = source !== 'own';
  mainName.textContent = tx('mainLabel'); mainTitle.textContent = `♫ ${MAIN.title} · ${MAIN.by}`; paintInfo(mainInfo, main, false);
  slots.forEach((s, k) => {
   s.name.textContent = tx(k ? 'track2' : 'track1'); s.word.textContent = tx('choose'); s.input.setAttribute('aria-label', `${tx(k ? 'track2' : 'track1')}: ${tx('choose')}`);
   paintInfo(s.info, s, true);
  });
  delayText.textContent = tx('delay', { ms: (+delay.value > 0 ? '+' : '') + delay.value });
  flyBtn.textContent = tx('fly'); switchBtn.textContent = tx(source === 'main' ? 'own' : 'back'); closeBtn.textContent = tx('close'); flyBtn.disabled = !chosen().length;
 }
 /** The other view of the panel. */
 function choose(which) {
  source = which === 'own' ? 'own' : 'main';
  paintPanel();
  if (source === 'main') loadMain();
 }
 function paintStatic() {
  openBtn.textContent = active() ? tx('exit') : tx('open'); openBtn.setAttribute('aria-label', active() ? tx('exit') : tx('openLabel'));
  hudScore.label.textContent = tx('score'); hudAcc.label.textContent = tx('accuracy'); hudCombo.label.textContent = tx('combo');
  lastHud = ''; lastAct = '';
  paintPanel();
  if (mode === 'paused' || mode === 'cup') paintOverlay();
 }
 function paintHud() {
  if (!game) return;
  const c = game.counts, judged = c.perfect + c.good + c.miss, acc = judged ? Math.round(100 * (c.perfect + .65 * c.good) / judged) : 100;
  const done = bound(game.t / chart.end, 0, 1);
  const key = [game.score, acc, game.combo, lang()].join('|');
  progressFill.style.width = (100 * done).toFixed(2) + '%';
  if (key === lastHud) return;
  lastHud = key;
  hudScore.value.textContent = String(game.score).padStart(6, '0'); hudAcc.value.textContent = acc + '%'; hudCombo.value.textContent = '×' + game.combo;
 }
 function paintAct(pendingMove) {
  const near = pendingMove && pendingMove.in < pendingMove.period * 2;
  const key = (near ? pendingMove.type : 'act') + lang();
  if (key === lastAct) return;
  lastAct = key;
  actBtn.textContent = near ? tx(pendingMove.type) : tx('act'); actBtn.classList.toggle('is-armed', !!near);
 }
 /** The pause and the cup. */
 function paintOverlay() {
  overlay.textContent = '';
  overlay.hidden = mode !== 'paused' && mode !== 'cup';
  overlay.dataset.kind = mode;
  if (mode === 'paused') { const box = el('div', 'rhythm-card'); box.append(el('div', 'rhythm-title', tx('paused')), el('div', 'rhythm-note', tx('resume'))); overlay.append(box); return; }
  if (mode !== 'cup' || !game) return;
  const s = R.summary(game), box = el('div', 'rhythm-card is-cup');
  if (s.cup) box.append(trophy(s.cup), el('div', 'rhythm-title', tx('cup')), el('div', 'rhythm-grade is-' + s.cup, tx(s.cup)));
  else box.append(el('div', 'rhythm-title', tx('landed')), el('div', 'rhythm-note', tx('noCup')));
  const row = (label, value) => { const r = el('div', 'rhythm-row'); r.append(el('span', '', label), el('strong', '', value)); return r; };
  const stats = el('div', 'rhythm-stats');
  const rings = game.chart.events.reduce((n, e, i) => n + (e.type === 'ring' && game.marks[i] && game.marks[i] !== 'miss' ? 1 : 0), 0);
  stats.append(row(tx('accuracy'), Math.round(s.accuracy * 100) + '%'), row(tx('score'), String(s.score)), row(tx('rings'), `${rings}/${s.rings}`), row(tx('maxCombo'), '×' + s.maxCombo),
   row(tx('kills'), `${s.kills}/${s.killsTotal}`), row(tx('rolls'), `${s.rolls}/${s.rollsTotal}`), row(tx('best'), Math.round((+read(BEST_KEY) || s.accuracy) * 100) + '%'), row(tx('perfect'), String(s.perfect)));
  const buttons = el('div', 'rhythm-buttons'), again = el('button', 'game-btn is-primary', tx('again')), leave = el('button', 'game-btn', tx('exit'));
  again.type = leave.type = 'button';
  again.addEventListener('click', () => fly()); leave.addEventListener('click', () => close());
  buttons.append(again, leave); box.append(stats, buttons); overlay.append(box);
 }
 const SVG = 'http://www.w3.org/2000/svg';
 function trophy(grade) {
  const svg = document.createElementNS(SVG, 'svg'); svg.setAttribute('viewBox', '0 0 64 64'); svg.setAttribute('class', 'rhythm-trophy is-' + grade); svg.setAttribute('aria-hidden', 'true');
  for (const d of ['M18 8h28v14c0 9-6 16-14 16S18 31 18 22Z', 'M18 12H9c0 10 4 15 11 16M46 12h9c0 10-4 15-11 16', 'M32 38v9M22 56h20M26 47h12l2 9H24Z', 'M32 14l2.6 5.4 5.9.8-4.3 4.1 1 5.8L32 27.3l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8Z']) {
   const p = document.createElementNS(SVG, 'path'); p.setAttribute('d', d); svg.append(p);
  }
  return svg;
 }

 // ---------------------------------------------------------------- in and out
 function open() {
  if (active() || base.engaged) return;
  mode = 'setup'; demo.layer = layer; kit.release();
  host.classList.add('is-rhythm'); root.classList.add('is-rhythm'); host.classList.toggle('is-narrow', state.w < 440);
  panel.hidden = false; paintStatic(); demo.wake();
  try { (source === 'main' ? host : slots[0].input).focus({ preventScroll: true }); } catch { /* old browsers */ }
  // once the main track is ready, Enter starts the flight (unless the pilot has moved on to something else)
  if (source === 'main') loadMain().then(ok => { if (ok && mode === 'setup' && source === 'main' && document.activeElement === host) { try { flyBtn.focus({ preventScroll: true }); } catch { /* old browsers */ } } });
 }
 function stopMusic() { for (const s of sources) { try { s.stop(); } catch { /* not started */ } try { s.disconnect(); } catch { /* gone */ } } sources = []; }
 function close() {
  if (!active()) return;
  stopMusic(); mode = 'off'; game = null; chart = null; keys.clear(); popups.length = bursts.length = beams.length = sparks.length = 0; banner = null; rollAnim = null; punch = horizon = 0; steerId = null;
  [main, ...slots].forEach(s => { if (s.status && !s.track) { s.job++; s.status = null; } });
  panel.hidden = true; hud.hidden = true; progress.hidden = true; actBar.hidden = true; overlay.hidden = true; overlay.textContent = '';
  host.classList.remove('is-rhythm', 'is-flying', 'is-narrow'); root.classList.remove('is-rhythm');
  if (centreMark && markHidden) { markHidden = false; centreMark.style.visibility = ''; }
  plane.scale = 1; plane.x = plane.y = 0; cam.roll = 0; cam.zoom = 1; cam.active = false;
  demo.layer = base; kit.release(); paintStatic(); demo.wake();
 }
 /** The field of the card in world units (the rings stay in the part the bars leave free). */
 const fieldOf = () => { const f = kit.fieldSize(); return { x: bound(f.x * .85, 1.4, 3), y: bound(f.gateY, .6, 1.4) }; };
 /** The flight starts: the chart, then the music a few seconds later (the count-in). */
 function fly() {
  const tracks = chosen();
  if (!tracks.length) return false;
  stopMusic();
  const c = audio();
  chart = R.buildChart(tracks.map(t => t.analysis), (Math.random() * 0xffffffff) >>> 0);
  const f = fieldOf(); game = R.create(chart, f);
  try { const p = c.resume(); if (p && p.catch) p.catch(() => {}); } catch { /* ignore */ }
  t0 = c.currentTime + CFG.countIn; skewKnown = false;
  out.gain.cancelScheduledValues(c.currentTime); out.gain.setValueAtTime(.85, c.currentTime);
  out.gain.setValueAtTime(.85, t0 + chart.end - 1.2); out.gain.linearRampToValueAtTime(.0001, t0 + chart.end);
  tracks.forEach((t, k) => { const s = c.createBufferSource(); s.buffer = t.buffer; s.connect(out); s.start(t0 + chart.starts[k]); s.stop(t0 + (k + 1 < tracks.length ? chart.starts[k + 1] : chart.end + .1)); sources.push(s); });
  mode = 'flight'; panel.hidden = true; overlay.hidden = true; overlay.textContent = ''; hud.hidden = false; progress.hidden = false; actBar.hidden = false;
  popups.length = bursts.length = beams.length = sparks.length = 0; keys.clear(); banner = null; rollAnim = null; punch = 0; horizon = 0; turnBank = 0; steerId = null; aimSource = 'pointer'; aim.x = aim.y = virt.x = virt.y = 0;
  plane.scale = .26; plane.x = plane.y = 0;
  host.classList.add('is-flying');
  paintStatic();
  try { host.focus({ preventScroll: true }); } catch { /* old browsers */ }
  live.textContent = tx('liveStart'); demo.wake();
  return true;
 }
 function pause() {
  if (mode !== 'flight') return;
  mode = 'paused'; keys.clear();
  try { const p = ctx.suspend(); if (p && p.catch) p.catch(() => {}); } catch { /* ignore */ }
  paintOverlay();
 }
 function resume() {
  if (mode !== 'paused') return;
  mode = 'flight'; skewKnown = false;
  try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch { /* ignore */ }
  paintOverlay(); demo.wake();
  try { host.focus({ preventScroll: true }); } catch { /* old browsers */ }
 }

 // ---------------------------------------------------------------- the clock: the time of the music as it is heard
 const lateness = () => (ctx.outputLatency || ctx.baseLatency || 0) + (+delay.value) / 1000;
 /** The audio clock moves in steps; the page clock is smooth. The difference between them is followed gently (and taken at once after a pause). */
 function syncClock() {
  const d = ctx.currentTime - performance.now() / 1000;
  if (!skewKnown || Math.abs(d - skew) > .06) { skew = d; skewKnown = true; } else skew += (d - skew) * .05;
 }
 const heard = stamp => (stamp === undefined ? performance.now() : stamp) / 1000 + skew - t0 - lateness();

 // ---------------------------------------------------------------- the action
 function press(stamp) {
  if (mode !== 'flight' || !game) return null;
  const hit = R.press(game, heard(stamp));
  handle(R.drain(game));
  return hit;
 }
 const word = (text, x, y, color, life = .9) => popups.push({ text, x, y, color, age: 0, life });
 function explode(x, y, z) {
  bursts.push({ x, y, z, age: 0, life: .7 });
  if (!reduced) for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, v = 1 + (i % 5) * .4; sparks.push({ x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: .5 + (i % 3) * .15 }); }
 }
 function handle(events) {
  for (const e of events) {
   if (e.type === 'count') { /* the middle of the card shows the number */ }
   else if (e.type === 'tap') {
    if (e.move === 'roll' && e.tap === 0) rollAnim = { t: 0, dur: Math.max(.45, chart.periods[0] * 1.1), dir: e.dir || 1 };
   } else if (e.type === 'ring') {
    if (e.quality !== 'miss') bursts.push({ x: e.x, y: e.y, z: 0, age: 0, life: .35, ring: true, color: COLOR[e.quality] });
    word(tx(e.quality), e.x, e.y + .35, COLOR[e.quality], .55);
   } else if (e.type === 'kill') {
    if (e.quality === 'miss') word(tx('away'), e.x, e.y + .5, COLOR.miss);
    else {
     beams.push({ x: e.x, y: e.y, z: 1.5, age: 0, life: .35 }); explode(e.x, e.y, 1.5); punch = 1; boom(.5, 2400, 90, .7);
     word(`${tx('down')} +${e.points}`, e.x, e.y + .55, '#fff2b0', 1.3);
    }
   } else if (e.type === 'roll') word(e.quality === 'miss' ? tx('miss') : `${tx('rolled')} +${e.points}`, e.x, e.y + .55, COLOR[e.quality], 1.2);
   else if (e.type === 'touchdown') { boom(e.quality === 'miss' ? .45 : .22, 900, 120, .45); word(tx(e.quality === 'miss' ? 'hard' : 'soft'), 0, -.4, e.quality === 'miss' ? COLOR.miss : '#fff2b0', 2.4); if (e.quality === 'miss' && !reduced) punch = .6; }
   else if (e.type === 'invert') banner = { text: tx(e.on ? 'inverted' : 'upright'), age: 0, life: 2 };
   else if (e.type === 'landing') banner = { text: tx('landing'), age: 0, life: 2.4 };
   else if (e.type === 'done') finish(e.summary);
  }
 }
 function finish(s) {
  if (s.accuracy > (+read(BEST_KEY) || 0)) write(BEST_KEY, String(Math.round(s.accuracy * 1000) / 1000));
  mode = 'cup'; keys.clear(); stopMusic(); actBar.hidden = true; progress.hidden = true;
  paintOverlay(); live.textContent = tx('liveDone', { a: Math.round(s.accuracy * 100) });
  setTimeout(() => { const b = overlay.querySelector('.game-btn'); if (mode === 'cup' && b) { try { b.focus({ preventScroll: true }); } catch { /* old browsers */ } } }, 120);
 }

 // ---------------------------------------------------------------- one frame (the demo calls these)
 function currentAim(dt) {
  let kx = 0, ky = 0;
  for (const k of keys) { const a = AXES[k]; if (a) { if (a[0] === 'x') kx += a[1]; else ky += a[1]; } }
  if (kx || ky) {
   if (aimSource !== 'keys') { virt.x = aim.x; virt.y = aim.y; aimSource = 'keys'; }
   virt.x = bound(virt.x + bound(kx, -1, 1) * KEY_X * dt, -game.field.x, game.field.x); virt.y = bound(virt.y + bound(ky, -1, 1) * KEY_Y * dt, -game.field.y, game.field.y);
   aim.x = virt.x; aim.y = virt.y;
  } else if (aimSource === 'pointer' && (inside || state.pointerId !== null)) { const w = kit.pointerPlane(); aim.x = w.x; aim.y = w.y; }
  return aim;
 }
 /** The attitude of the aircraft: it banks into its movement; inverted it flies on its back; a barrel roll turns it all the way round. */
 function steer(dt) {
  if (!engaged() || !game) return;
  state.boosted = false; host.classList.remove('is-boosting');
  const P = game.plane, inv = game.inverted ? 180 : 0, bank = bound(P.vx / CFG.speedMax * 80, -40, 40);
  turnBank = bank;      // the heading of the demo follows the bank of the turn, not the half roll of the inverted flight
  state.aimRoll = inv - bank; state.aimPitch = bound(P.vy / CFG.speedMax * 60, -24, 24); state.aimYaw = bank * .3;
  if (rollAnim && mode === 'flight') {
   rollAnim.t += dt;
   const k = Math.min(1, rollAnim.t / rollAnim.dur), ease = k * k * (3 - 2 * k);
   state.roll = inv - bank - rollAnim.dir * 360 * ease; state.rollVel = 0; state.aimRoll = state.roll;
   if (k >= 1) { state.roll += rollAnim.dir * 360; state.aimRoll = inv - bank; rollAnim = null; }
  }
 }
 function update(dt) {
  if (!active()) return;
  host.classList.toggle('is-narrow', state.w < 440);
  if (!engaged() || !game) return;
  if (mode === 'flight') {
   const f = fieldOf(); if (Math.abs(f.x - game.field.x) > .03 || Math.abs(f.y - game.field.y) > .03) R.setField(game, f.x, f.y);
   syncClock();
   R.step(game, heard(), dt, currentAim(dt));
   handle(R.drain(game));
  }
  const step = mode === 'paused' ? 0 : dt;
  for (const list of [popups, bursts, beams, sparks]) { for (const item of list) item.age += step; for (let i = list.length - 1; i >= 0; i--) if (list[i].age >= list[i].life) list.splice(i, 1); }
  for (const s of sparks) { s.x += s.vx * step; s.y += s.vy * step; }
  if (banner && (banner.age += step) >= banner.life) banner = null;
  punch *= Math.exp(-step * 5);
  horizon += ((game.inverted ? 180 : 0) - horizon) * (1 - Math.exp(-step * 5));
  const [ox, oy] = kit.demoOffset(game.plane.x, game.plane.y); plane.x = ox; plane.y = oy;
  const P = kit.worldToPixels(game.plane.x, game.plane.y, 0);
  cam.px = P.x; cam.py = P.y;
  const wantRoll = reduced ? 0 : bound(-game.plane.vx * .028, -.14, .14), wantZoom = reduced ? 1 : 1 + .14 * punch;
  cam.roll += (wantRoll - cam.roll) * (1 - Math.exp(-step * 7)); cam.zoom += (wantZoom - cam.zoom) * (1 - Math.exp(-step * 14));
  cam.active = Math.abs(cam.roll) > 5e-4 || Math.abs(cam.zoom - 1) > 5e-4;
  const pend = mode === 'flight' ? R.pending(game) : null;
  paintHud(); paintAct(pend);
  const hide = !status(); if (centreMark && hide !== markHidden) { markHidden = hide; centreMark.style.visibility = hide ? 'hidden' : ''; }
 }
 /** The text in the middle of the card. */
 function status() {
  if (!game || !engaged()) return null;
  if (mode === 'paused') return tx('paused');
  if (mode === 'cup') return null;
  if (game.phase === 'count') return `${tx('ready')} ${Math.max(1, Math.ceil(-game.t / (CFG.countIn / 3)))}`;
  if (game.glitch) return tx('noise');
  const p = R.pending(game);
  if (p && p.in < p.period * 2.5 && p.in > -.2) return tx(p.type);
  return banner ? banner.text : null;
 }

 // ---------------------------------------------------------------- drawing
 const toScreen = (x, y, z) => kit.worldToPixels(x, y, z);
 function ringPath(c, gm, r, segments = 32) {
  c.beginPath();
  for (let i = 0; i <= segments; i++) { const a = i / segments * Math.PI * 2, px = gm.x + Math.cos(a) * r * gm.s, py = gm.y - Math.sin(a) * r * gm.s * .83; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
 }
 const fadeOf = z => (z > 0 ? bound((CFG.zSpeed * CFG.lead - z) / 1.5, 0, 1) : bound(1 + z / .9, 0, 1));
 function drawRing(c, o) {
  const gm = toScreen(o.x, o.y, o.z), alpha = fadeOf(o.z);
  if (alpha <= .01) return;
  const col = o.mark ? COLOR[o.mark] : o.next ? '#f4e58a' : o.approach ? '#d6f08a' : '#9fae5c';
  c.save(); c.globalAlpha = alpha; ringPath(c, gm, o.r);
  if (o.next) { c.fillStyle = 'rgba(233,213,107,.07)'; c.fill(); }
  c.shadowColor = o.next ? 'rgba(233,213,107,.65)' : 'rgba(160,175,90,.2)'; c.shadowBlur = o.next ? 14 : 5; c.strokeStyle = col; c.lineWidth = o.next ? 2.4 : 1.4; c.stroke(); c.restore();
 }
 function drawEnemy(c, o) {
  const gm = toScreen(o.x, o.y, o.z), r = o.r * gm.s, alpha = o.z > 0 ? 1 : bound(1 + o.z / .9, 0, 1);
  if (alpha <= .01) return;
  c.save(); c.globalAlpha = alpha; c.translate(gm.x, gm.y);
  c.strokeStyle = '#e07b4f'; c.fillStyle = 'rgba(224,123,79,.18)'; c.lineWidth = 1.8; c.lineJoin = 'round'; c.shadowColor = 'rgba(224,123,79,.6)'; c.shadowBlur = 9;
  c.beginPath(); c.moveTo(-1.6 * r, .12 * r); c.lineTo(-.28 * r, -.2 * r); c.lineTo(.28 * r, -.2 * r); c.lineTo(1.6 * r, .12 * r); c.lineTo(.32 * r, .24 * r); c.lineTo(-.32 * r, .24 * r); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(0, 0, .22 * r, .4 * r, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-.14 * r, .3 * r); c.lineTo(-.62 * r, .82 * r); c.moveTo(.14 * r, .3 * r); c.lineTo(.62 * r, .82 * r); c.stroke(); c.restore();
 }
 /** The runway of the approach: it comes nearer, its threshold reaches the aircraft at the touchdown. */
 function drawRunway(c) {
  const [from, touch] = chart.landing;
  if (game.t < from - .2) return;
  const left = touch - game.t, z0 = Math.max(-.6, left * CFG.zSpeed * .32), z1 = z0 + 14, w = 1.5, y = -game.field.y - .35;
  const a = toScreen(-w, y, z0), b = toScreen(w, y, z0), d = toScreen(w, y, z1), e = toScreen(-w, y, z1);
  c.save(); c.globalAlpha = bound((game.t - from) / .8, 0, 1);
  c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(d.x, d.y); c.lineTo(e.x, e.y); c.closePath();
  c.fillStyle = 'rgba(150,170,80,.2)'; c.fill(); c.strokeStyle = '#e1ea8a'; c.lineWidth = 2; c.shadowColor = 'rgba(199,208,112,.6)'; c.shadowBlur = 9; c.stroke(); c.shadowBlur = 0;
  c.setLineDash([7, 9]); c.beginPath(); const m0 = toScreen(0, y, z0 + .4), m1 = toScreen(0, y, z1); c.moveTo(m0.x, m0.y); c.lineTo(m1.x, m1.y); c.stroke(); c.setLineDash([]);
  c.lineWidth = 2.4; c.beginPath();                             // the bars of the threshold
  for (let i = 0; i < 6; i++) { const x = -w * .82 + i * w * .33, p = toScreen(x, y, z0 + .15), q = toScreen(x, y, z0 + .8); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); }
  c.stroke(); c.restore();
 }
 /** Inverted: the ground is above the horizon. */
 function drawCeiling(c) {
  const k = horizon / 180;
  if (k < .05) return;
  const h = toScreen(0, 0, 200).y;
  c.save(); c.globalAlpha = k * .8; c.fillStyle = 'rgba(120,150,50,.07)'; c.fillRect(-state.w, -state.h, state.w * 3, state.h + h);
  c.strokeStyle = 'rgba(199,208,112,.16)'; c.lineWidth = 1; c.beginPath();
  for (let i = -6; i <= 6; i++) { c.moveTo(state.w / 2 + i * 6, h); c.lineTo(state.w / 2 + i * state.w * .16, -20); }
  const phase = (game.t * 1.2) % 1;
  for (let j = 0; j < 5; j++) { const p = ((j + phase) / 5) ** 2; const yy = h - p * (h + 20); c.moveTo(0, yy); c.lineTo(state.w, yy); }
  c.stroke(); c.restore();
 }
 /** The pulse of the beat: the horizon lights up for a moment on every beat, stronger on the first of the bar. */
 function drawPulse(c) {
  if (reduced || game.phase !== 'play') return;
  const b = R.beatNow(game);
  if (!b || b.since > .18) return;
  const strong = b.index % 4 === chart.downbeats[b.track], y = toScreen(0, 0, 200).y;
  c.save(); c.globalAlpha = (1 - b.since / .18) * (strong ? .55 : .3); c.strokeStyle = '#f4e58a'; c.lineWidth = strong ? 3 : 2; c.beginPath(); c.moveTo(0, y); c.lineTo(state.w, y); c.stroke(); c.restore();
 }
 let shown = [];
 function drawBack(c) {
  if (!engaged() || !game) return;
  drawCeiling(c); drawPulse(c); drawRunway(c);
  shown = mode === 'cup' ? [] : R.visible(game);
  for (const o of shown) if (o.z > .15) (o.kind === 'ring' ? drawRing : drawEnemy)(c, o);
 }
 function drawFront(c) {
  if (!engaged() || !game) return;
  for (const o of shown) if (o.z <= .15) (o.kind === 'ring' ? drawRing : drawEnemy)(c, o);
  for (const b of bursts) {
   const gm = toScreen(b.x, b.y, b.z), k = b.age / b.life;
   c.save(); c.globalAlpha = 1 - k; c.strokeStyle = b.color || '#fff2b0'; c.lineWidth = b.ring ? 2.4 * (1 - k) + .6 : 3 * (1 - k) + .8; ringPath(c, gm, (b.ring ? CFG.radius : .35) * (1 + k * (b.ring ? .7 : 3)), 24); c.stroke();
   if (!b.ring && !reduced) { c.globalAlpha = .55 * (1 - k); c.fillStyle = '#ffd9a8'; ringPath(c, gm, .45 * (1 + k), 20); c.fill(); }
   c.restore();
  }
  for (const s of sparks) { const gm = toScreen(s.x, s.y, s.z), k = s.age / s.life; c.save(); c.globalAlpha = 1 - k; c.strokeStyle = k < .4 ? '#fff2b0' : '#e07b4f'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(gm.x, gm.y); c.lineTo(gm.x - s.vx * gm.s * .12, gm.y + s.vy * gm.s * .1); c.stroke(); c.restore(); }
  const me = toScreen(game.plane.x, game.plane.y, .5);
  for (const b of beams) { const to = toScreen(b.x, b.y, b.z), k = b.age / b.life; c.save(); c.globalAlpha = 1 - k; c.strokeStyle = '#fff2b0'; c.lineWidth = 3 * (1 - k) + 1; c.shadowColor = 'rgba(255,242,176,.8)'; c.shadowBlur = 12; c.beginPath(); c.moveTo(me.x, me.y); c.lineTo(me.x + (to.x - me.x) * Math.min(1, k * 3.5), me.y + (to.y - me.y) * Math.min(1, k * 3.5)); c.stroke(); c.restore(); }
 }
 function cameraBegin(c) {
  c.save();
  if (engaged() && cam.active) { c.translate(cam.px, cam.py); c.rotate(cam.roll); c.scale(cam.zoom, cam.zoom); c.translate(-cam.px, -cam.py); }
 }
 /** After the camera: the aim of the next ring on the plane of the aircraft, the manoeuvres with their closing circles, the words, the static. */
 function cameraEnd(c) {
  c.restore();
  if (!game || mode === 'off' || mode === 'cup') return;
  if (mode !== 'paused') {
   const next = shown.find(o => o.kind === 'ring' && o.next) || shown.find(o => o.kind === 'ring' && !o.mark);
   if (next && next.in > -.05) {
    const a = toScreen(next.x, next.y, 0), close = bound(next.in / (chart.periods[0] * 2), 0, 1), lined = Math.hypot(game.plane.x - next.x, game.plane.y - next.y) <= next.r;
    c.save(); c.lineWidth = lined ? 2 : 1.4; c.setLineDash(lined ? [] : [6, 6]); c.strokeStyle = lined ? '#f4e58a' : 'rgba(244,229,138,.55)'; ringPath(c, a, next.r); c.stroke();
    if (!reduced && next.in < chart.periods[0] * 2) { c.setLineDash([]); c.globalAlpha = .8 * (1 - close) + .15; c.strokeStyle = '#fff2b0'; c.lineWidth = 1.2; ringPath(c, a, next.r * (1 + 1.2 * close)); c.stroke(); }
    c.restore();
   }
   const p = R.pending(game);
   if (p) drawMove(c, p);
  }
  c.save(); c.textAlign = 'center'; c.font = `700 12px ${MONO}`;
  for (const w of popups) { const gm = toScreen(w.x, w.y, 0), k = w.age / w.life; c.globalAlpha = k < .12 ? k / .12 : 1 - Math.max(0, (k - .55) / .45); c.fillStyle = w.color; c.shadowColor = w.color; c.shadowBlur = 8; c.fillText(w.text, bound(gm.x, 50, state.w - 50), bound(gm.y - k * 26, 72, state.h - 66)); }
  c.restore();
  if (punch > .55 && !reduced) { c.save(); c.globalAlpha = (punch - .55) * .35; c.fillStyle = '#fff6cc'; c.fillRect(0, 0, state.w, state.h); c.restore(); }
  if (game.glitch) drawStatic(c);
 }
 /** The closing circles of a manoeuvre: around the other aircraft (a shot) or around our own (a roll, a touchdown); the circle meets its mark on the beat. */
 function drawMove(c, p) {
  if (p.taps[0].in > p.period * CFG.show) return;      // (the touchdown is announced from the start of the approach: its circle comes with the last beats)
  const ev = chart.events[p.index], target = p.type === 'kill' ? toScreen(ev.x * game.field.x, ev.y * game.field.y, 1.5) : toScreen(game.plane.x, game.plane.y, 0);
  const size = p.type === 'kill' ? .75 : .62;
  c.save();
  p.taps.forEach((tap, k) => {
   if (tap.in < -.2) return;
   const far = bound(tap.in / (p.period * CFG.show), 0, 1), r = size * (1 + far * 3.2) + k * .14;
   c.globalAlpha = tap.hit ? .35 : .35 + .65 * (1 - far);
   c.strokeStyle = tap.hit ? COLOR[tap.hit] : tap.in < CFG.window.good ? '#fff2b0' : p.type === 'kill' ? '#ffb27a' : '#8fe3ff';
   c.lineWidth = tap.in < p.period ? 2.4 : 1.4; c.setLineDash(k ? [5, 5] : []); ringPath(c, target, r, 44); c.stroke();
  });
  c.setLineDash([]); c.globalAlpha = .9; c.lineWidth = 1.6; c.strokeStyle = p.type === 'kill' ? '#ff9d6a' : '#bfefff'; ringPath(c, target, size, 40); c.stroke();
  const label = p.type === 'roll' ? '↻ ×2' : p.type === 'kill' ? '⌖' : '▼';
  c.font = `700 ${p.type === 'kill' ? 16 : 13}px ${MONO}`; c.textAlign = 'center'; c.fillStyle = c.strokeStyle;
  c.fillText(label, target.x, target.y - size * target.s * .83 - 8);
  c.restore();
 }
 /** The break between the two pieces: the picture slips in strips and fills with static (a still fade where the motion is reduced). */
 function drawStatic(c) {
  const [a, b] = chart.glitch, k = bound((game.t - a) / (b - a), 0, 1), amount = Math.sin(Math.PI * k);
  const cv = c.canvas;
  c.save();
  if (!reduced && cv && cv.width && c.drawImage) {
   const dpr = cv.width / Math.max(1, state.w), tick = Math.floor(game.t * 12), rnd = R.mulberry32(tick * 977 + 3);
   for (let i = 0; i < 9; i++) { const y = rnd() * state.h, h = 4 + rnd() * 20, dx = (rnd() - .5) * 60 * amount; try { c.drawImage(cv, 0, y * dpr, cv.width, h * dpr, dx, y, state.w, h); } catch { break; } }
   c.globalAlpha = .35 * amount; c.fillStyle = '#cfd6a0';
   for (let i = 0; i < 260; i++) c.fillRect(rnd() * state.w, rnd() * state.h, 1 + rnd() * 3, 1);
   c.globalAlpha = .18 * amount; c.fillStyle = '#000';
   for (let y = (tick % 3); y < state.h; y += 3) c.fillRect(0, y, state.w, 1);
  } else { c.globalAlpha = .5 * amount; c.fillStyle = '#0d1409'; c.fillRect(0, 0, state.w, state.h); }
  c.restore();
 }

 // ---------------------------------------------------------------- the controls
 openBtn.addEventListener('click', () => { if (active()) close(); else open(); });
 closeBtn.addEventListener('click', () => close());
 flyBtn.addEventListener('click', () => fly());
 switchBtn.addEventListener('click', () => choose(source === 'main' ? 'own' : 'main'));
 delay.addEventListener('input', () => { write(LATENCY_KEY, delay.value); paintPanel(); });
 // the button of the action takes the touch itself (a second finger makes no click)
 let touchedAt = -1e9;
 actBtn.addEventListener('pointerdown', ev => { if (ev.pointerType === 'touch') { touchedAt = performance.now(); press(ev.timeStamp); } });
 actBtn.addEventListener('click', ev => { if (performance.now() - touchedAt > 700) press(ev.timeStamp); try { host.focus({ preventScroll: true }); } catch { /* old browsers */ } });
 overlay.addEventListener('click', () => { if (mode === 'paused') resume(); });
 const keyName = ev => (/^Key[A-Z]$/.test(ev.code || '') ? ev.code.slice(3) : ev.key).toLowerCase();
 function onKey(ev) {
  if (!active() || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const k = keyName(ev);
  if (k === 'escape') { ev.preventDefault(); close(); return; }
  if (!flying()) return;
  if (AXES[k]) { keys.add(k); ev.preventDefault(); return; }
  if (k === 'p' && !ev.repeat) { ev.preventDefault(); if (mode === 'flight') pause(); else resume(); return; }
  if (ACT.includes(k)) { ev.preventDefault(); if (ev.repeat) return; if (mode === 'paused') resume(); else press(ev.timeStamp); }      // on the press, never on the release
 }
 const onKeyUp = ev => { const k = keyName(ev); keys.delete(k); if (ev.target === actBtn && (k === ' ' || k === 'enter') && ev.preventDefault) ev.preventDefault(); };      // no second click from the button
 host.addEventListener('keydown', onKey);
 host.addEventListener('keyup', onKeyUp);
 // a key pressed while the focus is elsewhere on the page still reaches the flight, unless it is meant for a button or a field
 const forThePage = t => !!(t.isContentEditable || (t.closest && t.closest('a,button,input,select,textarea,summary,[contenteditable]')));
 document.addEventListener('keydown', ev => { if (ev.target && flying() && !host.contains(ev.target) && !forThePage(ev.target)) onKey(ev); });
 document.addEventListener('keyup', ev => { if (ev.target && !host.contains(ev.target)) onKeyUp(ev); });
 // a press on the card is the action too (mouse buttons, or a finger); a second finger must not take the steering from the first (before the demo sees it)
 host.addEventListener('pointerdown', ev => {
  if (!flying() || (ev.target && (panel.contains(ev.target) || overlay.contains(ev.target) || actBar.contains(ev.target)))) return;
  try { host.focus({ preventScroll: true }); } catch { /* old browsers */ }
  if (mode === 'paused') { resume(); return; }
  if (ev.pointerType === 'touch') { if (steerId !== null && steerId !== ev.pointerId) ev.stopImmediatePropagation(); else steerId = ev.pointerId; }
  inside = true; aimSource = 'pointer';
  press(ev.timeStamp);
 }, true);
 for (const type of ['pointerup', 'pointercancel']) host.addEventListener(type, ev => { if (ev.pointerId === steerId) steerId = null; else if (flying() && ev.pointerType === 'touch') ev.stopImmediatePropagation(); }, true);
 host.addEventListener('pointermove', ev => { if (!active()) return; inside = true; aimSource = 'pointer'; });
 host.addEventListener('pointerleave', () => { inside = false; });
 document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
 window.addEventListener('blur', () => pause());
 window.addEventListener('atlas:languagechange', paintStatic);

 const layer = {
  get active() { return flying(); }, plane, rollSign: -1, steer, update, drawBack, drawFront, status, cameraBegin, cameraEnd, cameraOwnsHorizon: true,
  get engaged() { return engaged(); }, get touchBlocksBoost() { return active(); }, get horizonShift() { return state.h * (.3 - .5); }, get horizonRoll() { return engaged() ? horizon : 0; },
  get sprint() { return 0; }, get airspeed() { return engaged() ? 220 : null; }, get speedTop() { return engaged() ? 520 : 0; }, get turnBank() { return engaged() ? turnBank : null; },
  onView(visible) { if (!visible) pause(); }
 };
 // for tests and for the curious
 window.AtlasFlightRhythm = Object.freeze({ open, close, load, loadMain, choose, fly, press, pause, resume, layer, TEXT, MAIN,
  get mode() { return mode; }, get source() { return source; }, get game() { return game; }, get chart() { return chart; }, get tracks() { return slots.map(s => s.track); }, get mainTrack() { return main.track; }, get time() { return mode === 'flight' ? heard() : null; } });
 paintStatic();
})();
