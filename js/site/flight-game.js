/* A.T.L.A.S. mini-game layer for the attitude card on the home page (the rules are in flight-game-core.js).
   Hold the pointer on the card for seven seconds and the game starts (no button). The aircraft follows the pointer (or a finger, or the arrow keys), the flight mode
   changes by itself along the plan of the mission, the rings, pylons, other aircraft and the runway are drawn in perspective on the card's own canvas, the camera
   rolls with the aircraft, left button / Space boosts (in AUTO the button is the gun), E or the right button fires the ULT.
   Everything here is a game on a synthetic display. No MAVLink, USB, or flight-controller connection. */
(() => {
 'use strict';
 const demo = window.AtlasFlightDemo, core = window.AtlasFlightGameCore;
 if (!demo || !core) return;
 const { host, state, bound } = demo, CFG = core.CFG, MODES = core.MODES, DEG = Math.PI / 180;
 const root = host.closest('.hero-display') || host.parentElement;
 const topline = root.querySelector('.scope-topline');
 const instructions = root.querySelector('.flight-instructions');
 if (!topline) return;
 const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const GAME_SCALE = .3;                        // the aircraft shrinks to this size while the game runs (it has to fit through a ring)
 const MONO = '"IBM Plex Mono", monospace';
 const CAM = { roll: .25, rollMax: .2, boostZoom: .04, driftZoom: .012, sprintZoom: .06 };   // the camera: how much of the bank it follows (radians), how far it leans in
 const PK = .42;                               // perspective: a ring at the depth z is drawn at 1 / (1 + z * PK) of its size, towards the vanishing point
 const VP = .3;                                // the vanishing point and the horizon: this share of the card height from the top
 const DWELL = 7, AWAY = 1.2;                  // seconds of holding the pointer on the card that start the game; seconds away from the card before the pause
 const KEY_X = 3.4, KEY_Y = 2.4;               // how fast the arrow keys move the aim (world units per second)
 const MODE_ORDER = ['FBWA', 'CRUISE', 'GUIDED', 'AUTO'];

 // ---- texts (the card is translated by the layer itself; i18n.js only knows the static page)
 const TEXT = {
  ru: { exit: 'ВЫХОД', score: 'СЧЁТ', best: 'РЕКОРД', gates: 'ВОРОТА', level: 'УРОВЕНЬ', ready: 'ПРИГОТОВЬСЯ', go: 'СТАРТ',
   perfect: 'ТОЧНО', good: 'ПРОЛЁТ', miss: 'МИМО', life: '+1 ЖИЗНЬ', gust: 'ПОРЫВ ВЕТРА', paused: 'ПАУЗА', pausedHint: 'Верни курсор в карточку или нажми пробел',
   over: 'ПОЛЁТ ЗАВЕРШЁН', again: 'ЕЩЁ РАЗ', accuracy: 'ТОЧНОСТЬ', streak: 'СЕРИЯ', rank: 'ЗВАНИЕ', newBest: 'НОВЫЙ РЕКОРД',
   hint: 'Веди самолёт курсором сквозь кольца', hintTouch: 'Веди самолёт пальцем сквозь кольца',
   ranks: ['КУРСАНТ', 'ПИЛОТ', 'КОМАНДИР', 'АС A.T.L.A.S.'],
   ult: 'ULT', ultReady: 'ULT ГОТОВ', noTargets: 'НЕТ ЦЕЛЕЙ', shot: 'СБИТ', hitPylon: 'ОПОРА', hitEnemy: 'СТОЛКНОВЕНИЕ',
   modeTo: 'РЕЖИМ', finale: 'ЗАХОД НА ПОСАДКУ', final: 'ЗАХОД', touchdown: 'ПОСАДКА', gradePerfect: 'ИДЕАЛЬНО', gradeGood: 'ХОРОШО', gradeHard: 'ЖЁСТКАЯ',
   won: 'ПОСАДКА ВЫПОЛНЕНА', landing: 'ПОСАДКА', kills: 'СБИТО',
   wind: 'ВЕТЕР', windUnit: 'м/с', windShift: 'ВЕТЕР ПОМЕНЯЛСЯ', sprintWarn: 'ФОРСАЖ!', sprint: 'ФОРСАЖ', sprintClean: 'ЧИСТЫЙ ФОРСАЖ', bonus: 'БОНУС', handover: 'УПРАВЛЕНИЕ У ТЕБЯ',
   music: 'МУЗЫКА', musicOn: 'ВКЛ', musicOff: 'ВЫКЛ', musicLabelOn: 'Музыка включена, нажми, чтобы выключить (клавиша M)', musicLabelOff: 'Музыка выключена, нажми, чтобы включить (клавиша M)',
   dwell: 'УДЕРЖИВАЙ КУРСОР — ИГРА ЧЕРЕЗ {n}', dwellTouch: 'УДЕРЖИВАЙ ПАЛЕЦ — ИГРА ЧЕРЕЗ {n}',
   tipFBWA: 'FBWA: крен до 45°, ветер сносит, ЛКМ — ускорение', tipFBWATouch: 'FBWA: самолёт летит за пальцем, ветер сносит',
   tipCRUISE: 'CRUISE: высоту держит автопилот, веди влево-вправо',
   tipGUIDED: 'GUIDED: самолёт летит к курсору с задержкой, целься заранее', tipGUIDEDTouch: 'GUIDED: самолёт летит к пальцу с задержкой, целься заранее',
   tipAUTO: 'AUTO: автопилот летит сам, стреляй ЛКМ по чужим самолётам', tipAUTOTouch: 'AUTO: автопилот летит сам, тапай по чужим самолётам',
   tipFinale: 'AUTOLAND: автопилот ведёт по глиссаде, держи курсор в центре', tipFinaleTouch: 'AUTOLAND: автопилот ведёт по глиссаде, держи палец у центра',
   tipGust: 'Порыв ветра сносит самолёт: подправляй курсор', tipGustTouch: 'Порыв ветра сносит самолёт: подправляй палец',
   tipWind: 'Ветер сносит самолёт и кольца: держи курсор против ветра', tipWindTouch: 'Ветер сносит самолёт и кольца: держи палец против ветра',
   tipSprint: 'ФОРСАЖ: всё летит быстрее, очки ×1.5',
   tipBonus: 'Голубые кольца — бонус: залети, если успеваешь',
   tipHandover: 'Управление переходит к тебе: веди курсор к кольцу', tipHandoverTouch: 'Управление переходит к тебе: веди палец к кольцу',
   tipMusic: 'Музыка включится после первого клика или клавиши (M)', tipMusicTouch: 'Музыка включится после первого касания',
   tipHazard: 'Красный круг — опора или чужой борт: не заходи в него',
   tipEnemy: 'Чужой борт! За кольца копится ULT: E или ПКМ — залп', tipEnemyTouch: 'Чужой борт! За кольца копится ULT: нажми кнопку ULT',
   tipUlt: 'ULT готов: E, ПКМ или кнопка внизу', tipUltTouch: 'ULT готов: нажми кнопку ULT',
   ultLabel: 'ULT: залп по чужим самолётам (клавиша E)',
   caption: 'Самолёт летит за *курсором* (FBWA) · *ЛКМ* — ускорение ×2 · *M* — музыка · *Esc* — выход',
   caption2: 'Режимы меняются сами: *FBWA → CRUISE → GUIDED → AUTO* · ветер и форсаж · *E* или *ПКМ* — ULT',
   captionTouch: 'Самолёт летит за *пальцем* · *♪* — музыка · *ВЫХОД* — вернуться', caption2Touch: 'Режимы меняются сами · ветер и форсаж · *ULT* — кнопка внизу карточки',
   pausedHintTouch: 'Коснись карточки, чтобы продолжить',
   buttonExit: 'Выйти из мини-игры',
   liveStart: 'Игра началась. Самолёт летит за курсором (FBWA), режимы меняются сами, ветер сносит, E — ULT, M — музыка.', liveOver: 'Игра окончена. Счёт {score}, ворота {gates}.',
   liveWon: 'Посадка выполнена. Счёт {score}, ворота {gates}.' },
  uk: { exit: 'ВИХІД', score: 'РАХУНОК', best: 'РЕКОРД', gates: 'ВОРОТА', level: 'РІВЕНЬ', ready: 'ПРИГОТУЙСЯ', go: 'СТАРТ',
   perfect: 'ТОЧНО', good: 'ПРОЛІТ', miss: 'МИМО', life: '+1 ЖИТТЯ', gust: 'ПОРИВ ВІТРУ', paused: 'ПАУЗА', pausedHint: 'Поверни курсор у картку або натисни пробіл',
   over: 'ПОЛІТ ЗАВЕРШЕНО', again: 'ЩЕ РАЗ', accuracy: 'ТОЧНІСТЬ', streak: 'СЕРІЯ', rank: 'ЗВАННЯ', newBest: 'НОВИЙ РЕКОРД',
   hint: 'Веди літак курсором крізь кільця', hintTouch: 'Веди літак пальцем крізь кільця',
   ranks: ['КУРСАНТ', 'ПІЛОТ', 'КОМАНДИР', 'АС A.T.L.A.S.'],
   ult: 'ULT', ultReady: 'ULT ГОТОВИЙ', noTargets: 'НЕМАЄ ЦІЛЕЙ', shot: 'ЗБИТО', hitPylon: 'ОПОРА', hitEnemy: 'ЗІТКНЕННЯ',
   modeTo: 'РЕЖИМ', finale: 'ЗАХІД НА ПОСАДКУ', final: 'ЗАХІД', touchdown: 'ПОСАДКА', gradePerfect: 'ІДЕАЛЬНО', gradeGood: 'ДОБРЕ', gradeHard: 'ЖОРСТКА',
   won: 'ПОСАДКУ ВИКОНАНО', landing: 'ПОСАДКА', kills: 'ЗБИТО',
   wind: 'ВІТЕР', windUnit: 'м/с', windShift: 'ВІТЕР ЗМІНИВСЯ', sprintWarn: 'ФОРСАЖ!', sprint: 'ФОРСАЖ', sprintClean: 'ЧИСТИЙ ФОРСАЖ', bonus: 'БОНУС', handover: 'КЕРУВАННЯ У ТЕБЕ',
   music: 'МУЗИКА', musicOn: 'УВІМК', musicOff: 'ВИМК', musicLabelOn: 'Музику ввімкнено, натисни, щоб вимкнути (клавіша M)', musicLabelOff: 'Музику вимкнено, натисни, щоб ввімкнути (клавіша M)',
   dwell: 'ТРИМАЙ КУРСОР — ГРА ЧЕРЕЗ {n}', dwellTouch: 'ТРИМАЙ ПАЛЕЦЬ — ГРА ЧЕРЕЗ {n}',
   tipFBWA: 'FBWA: крен до 45°, вітер зносить, ЛКМ — прискорення', tipFBWATouch: 'FBWA: літак летить за пальцем, вітер зносить',
   tipCRUISE: 'CRUISE: висоту тримає автопілот, веди ліворуч-праворуч',
   tipGUIDED: 'GUIDED: літак летить до курсору із затримкою, цілься заздалегідь', tipGUIDEDTouch: 'GUIDED: літак летить до пальця із затримкою, цілься заздалегідь',
   tipAUTO: 'AUTO: автопілот летить сам, стріляй ЛКМ по чужих літаках', tipAUTOTouch: 'AUTO: автопілот летить сам, тапай по чужих літаках',
   tipFinale: 'AUTOLAND: автопілот веде по глісаді, тримай курсор у центрі', tipFinaleTouch: 'AUTOLAND: автопілот веде по глісаді, тримай палець біля центру',
   tipGust: 'Порив вітру зносить літак: підправляй курсор', tipGustTouch: 'Порив вітру зносить літак: підправляй палець',
   tipWind: 'Вітер зносить літак і кільця: тримай курсор проти вітру', tipWindTouch: 'Вітер зносить літак і кільця: тримай палець проти вітру',
   tipSprint: 'ФОРСАЖ: усе летить швидше, очки ×1.5',
   tipBonus: 'Блакитні кільця — бонус: залети, якщо встигаєш',
   tipHandover: 'Керування переходить до тебе: веди курсор до кільця', tipHandoverTouch: 'Керування переходить до тебе: веди палець до кільця',
   tipMusic: 'Музика ввімкнеться після першого кліку чи клавіші (M)', tipMusicTouch: 'Музика ввімкнеться після першого дотику',
   tipHazard: 'Червоне коло — опора або чужий борт: не заходь у нього',
   tipEnemy: 'Чужий борт! За кільця накопичується ULT: E або ПКМ — залп', tipEnemyTouch: 'Чужий борт! За кільця накопичується ULT: натисни ULT',
   tipUlt: 'ULT готовий: E, ПКМ або кнопка внизу', tipUltTouch: 'ULT готовий: натисни кнопку ULT',
   ultLabel: 'ULT: залп по чужих літаках (клавіша E)',
   caption: 'Літак летить за *курсором* (FBWA) · *ЛКМ* — прискорення ×2 · *M* — музика · *Esc* — вихід',
   caption2: 'Режими змінюються самі: *FBWA → CRUISE → GUIDED → AUTO* · вітер і форсаж · *E* або *ПКМ* — ULT',
   captionTouch: 'Літак летить за *пальцем* · *♪* — музика · *ВИХІД* — повернутися', caption2Touch: 'Режими змінюються самі · вітер і форсаж · *ULT* — кнопка внизу картки',
   pausedHintTouch: 'Торкнись картки, щоб продовжити',
   buttonExit: 'Вийти з міні-гри',
   liveStart: 'Гру розпочато. Літак летить за курсором (FBWA), режими змінюються самі, вітер зносить, E — ULT, M — музика.', liveOver: 'Гру закінчено. Рахунок {score}, ворота {gates}.',
   liveWon: 'Посадку виконано. Рахунок {score}, ворота {gates}.' },
  en: { exit: 'EXIT', score: 'SCORE', best: 'BEST', gates: 'GATE', level: 'LEVEL', ready: 'GET READY', go: 'GO',
   perfect: 'PERFECT', good: 'GATE', miss: 'MISSED', life: '+1 LIFE', gust: 'GUST', paused: 'PAUSED', pausedHint: 'Move the cursor back onto the card or press Space',
   over: 'FLIGHT OVER', again: 'AGAIN', accuracy: 'ACCURACY', streak: 'STREAK', rank: 'RANK', newBest: 'NEW BEST',
   hint: 'Fly through the rings with the cursor', hintTouch: 'Fly through the rings with your finger',
   ranks: ['CADET', 'PILOT', 'COMMANDER', 'A.T.L.A.S. ACE'],
   ult: 'ULT', ultReady: 'ULT READY', noTargets: 'NO TARGETS', shot: 'SHOT DOWN', hitPylon: 'PYLON', hitEnemy: 'COLLISION',
   modeTo: 'MODE', finale: 'FINAL APPROACH', final: 'FINAL', touchdown: 'TOUCHDOWN', gradePerfect: 'PERFECT', gradeGood: 'GOOD', gradeHard: 'HARD',
   won: 'LANDED', landing: 'LANDING', kills: 'KILLS',
   wind: 'WIND', windUnit: 'm/s', windShift: 'WIND SHIFT', sprintWarn: 'AFTERBURNER!', sprint: 'AFTERBURNER', sprintClean: 'CLEAN BURN', bonus: 'BONUS', handover: 'YOUR CONTROL',
   music: 'MUSIC', musicOn: 'ON', musicOff: 'OFF', musicLabelOn: 'Music is on, press to turn it off (key M)', musicLabelOff: 'Music is off, press to turn it on (key M)',
   dwell: 'HOLD THE CURSOR HERE — GAME IN {n}', dwellTouch: 'HOLD YOUR FINGER HERE — GAME IN {n}',
   tipFBWA: 'FBWA: bank up to 45°, the wind pushes, LMB boosts', tipFBWATouch: 'FBWA: the aircraft follows your finger, the wind pushes',
   tipCRUISE: 'CRUISE: the autopilot holds altitude, steer left and right',
   tipGUIDED: 'GUIDED: the aircraft flies to the cursor with a delay, aim ahead', tipGUIDEDTouch: 'GUIDED: the aircraft follows your finger late, aim ahead',
   tipAUTO: 'AUTO: the autopilot flies, shoot other aircraft with LMB', tipAUTOTouch: 'AUTO: the autopilot flies, tap other aircraft to shoot',
   tipFinale: 'AUTOLAND: the autopilot flies the glide path, hold the centre', tipFinaleTouch: 'AUTOLAND: autopilot on the glide path, hold near the centre',
   tipGust: 'A gust pushes the aircraft: correct with the cursor', tipGustTouch: 'A gust pushes the aircraft: correct with your finger',
   tipWind: 'The wind pushes the aircraft and the rings: lean into it', tipWindTouch: 'The wind pushes the aircraft and the rings: lean into it',
   tipSprint: 'AFTERBURNER: everything flies faster, points ×1.5',
   tipBonus: 'Blue rings are a bonus: take them if you can',
   tipHandover: 'The controls come back to you: fly to the next ring', tipHandoverTouch: 'The controls come back to you: fly to the next ring',
   tipMusic: 'The music starts after the first click or key (M)', tipMusicTouch: 'The music starts after the first touch',
   tipHazard: 'A red circle is a pylon or an aircraft: stay out of it',
   tipEnemy: 'Hostile aircraft! Rings charge the ULT: E or RMB fires', tipEnemyTouch: 'Hostile aircraft! Rings charge the ULT: tap ULT',
   tipUlt: 'ULT ready: E, RMB or the button below', tipUltTouch: 'ULT ready: tap the ULT button',
   ultLabel: 'ULT: salvo at the other aircraft (key E)',
   caption: 'The aircraft follows the *cursor* (FBWA) · *LMB* — boost ×2 · *M* — music · *Esc* — exit',
   caption2: 'Modes change by themselves: *FBWA → CRUISE → GUIDED → AUTO* · wind and afterburner · *E* or *RMB* — ULT',
   captionTouch: 'The aircraft follows your *finger* · *♪* — music · *EXIT* — go back', caption2Touch: 'Modes change by themselves · wind and afterburner · *ULT* — button at the bottom of the card',
   pausedHintTouch: 'Touch the card to continue',
   buttonExit: 'Leave the mini-game',
   liveStart: 'Game started. The aircraft follows the cursor (FBWA), the modes change by themselves, the wind pushes, E fires the ULT, M toggles the music.', liveOver: 'Game over. Score {score}, gates {gates}.',
   liveWon: 'Landed. Score {score}, gates {gates}.' }
 };
 const lang = () => { const l = window.AtlasI18n && window.AtlasI18n.lang; return TEXT[l] ? l : (TEXT[document.documentElement.lang] ? document.documentElement.lang : 'ru'); };
 const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);     // a touch screen: no mouse, no keys
 const tx = key => { const t = TEXT[lang()]; return (coarse && t[key + 'Touch']) || t[key]; };
 const pad = (n, d) => String(Math.max(0, Math.floor(n))).padStart(d, '0');
 const clock = s => `${pad(s / 60, 2)}:${pad(s % 60, 2)}`;

 // ---- small DOM helpers
 const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
 const rich = (node, text) => { node.textContent = ''; text.split('*').forEach((part, i) => node.append(i % 2 ? el('strong', '', part) : document.createTextNode(part))); };
 const store = (() => { try { return window.localStorage; } catch { return null; } })();
 let best = store ? core.readBest(store) : 0, newBest = false;

 // ---- music: an eight-bar chiptune loop (the notes are data in flight-game-core.js) synthesised with Web Audio: a square lead, a triangle bass, noise drums, and an arpeggio
 //      while the afterburner burns (the tempo goes up too). No audio files and no libraries. Browsers let sound start only after a click, a key or a touch; the pointer hold
 //      that starts the game is none of these, so the music waits for the first of them (the player's own button in the header turns it off and on, and so does the M key).
 //      The choice is kept in localStorage (every access may throw).
 const audio = (() => {
  const AC = window.AudioContext || window.webkitAudioContext, LOOK = .14, VOLUME = .17, steps = core.MUSIC.steps, stepBase = 60 / core.MUSIC.bpm / 4;
  let ctx = null, master = null, noiseBuf = null, pulse = null, timer = 0, next = 0, pos = 0, wanted = false, held = false, mood = 'normal', tempo = 1, notes = 0;
  let on = store ? core.readMusic(store) : true;
  const freq = m => 440 * Math.pow(2, (m - 69) / 12);
  const live = () => !!ctx && ctx.state === 'running';
  // before the first click, key or touch of the page a context would only be suspended (and the console would complain): wait for it where the browser says so
  const activated = () => { try { return typeof navigator === 'undefined' || !navigator.userActivation || navigator.userActivation.hasBeenActive; } catch { return true; } };
  function build() {
   if (ctx) return true;
   if (!AC || !activated()) return false;
   try { ctx = new AC(); } catch { ctx = null; return false; }
   try {
    master = ctx.createGain(); master.gain.value = 0;
    if (typeof ctx.createDynamicsCompressor === 'function') { const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination); } else master.connect(ctx.destination);
   } catch { ctx = null; return false; }
   try {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); let seed = 12345;
    for (let i = 0; i < d.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; d[i] = seed / 0x3fffffff - 1; }
    const re = new Float32Array(16), im = new Float32Array(16);
    for (let n = 1; n < 16; n++) re[n] = 2 / (n * Math.PI) * Math.sin(n * Math.PI * .25);      // a square wave with a quarter duty: the thin voice of the arpeggio
    pulse = ctx.createPeriodicWave(re, im);
   } catch { noiseBuf = null; pulse = null; }
   return true;
  }
  function tone(type, m, t, len, vol) {
   const o = ctx.createOscillator(), g = ctx.createGain();
   if (type === 'pulse' && pulse) o.setPeriodicWave(pulse); else o.type = type === 'pulse' ? 'square' : type;
   o.frequency.setValueAtTime(freq(m), t);
   g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .006); g.gain.setValueAtTime(vol, t + Math.max(.01, len * .55)); g.gain.linearRampToValueAtTime(.0001, t + len);
   o.connect(g); g.connect(master); o.start(t); o.stop(t + len + .02); notes++;
  }
  function kick(t) {
   const o = ctx.createOscillator(), g = ctx.createGain();
   o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .11);
   g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.001, t + .16);
   o.connect(g); g.connect(master); o.start(t); o.stop(t + .18); notes++;
  }
  function hiss(t, len, vol, hp) {
   if (!noiseBuf) return;
   const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
   s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
   s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + len + .02); notes++;
  }
  function playStep(i, t) {
   const s = core.MUSIC.tuneStep(i), len = stepBase / tempo;
   if (s.lead) tone('square', s.lead.m, t, s.lead.len * len * .94, .085);
   if (s.bass != null) tone('triangle', s.bass, t, len * 1.9, .24);
   if (mood === 'sprint') tone('pulse', s.arp, t, len * .9, .04);
   if (mood !== 'calm') { if (s.kick) kick(t); if (s.snare) hiss(t, .11, .16, 1500); if (s.hat) hiss(t, .035, .05, 7000); }
  }
  function tick() {
   if (!live()) return;                              // blocked or suspended: the clock of the context does not move, nothing is scheduled
   const now = ctx.currentTime;
   tempo += ((mood === 'sprint' ? 1.2 : 1) - tempo) * .12;
   if (next < now - .25) next = now + .05;           // woke up late: go on from now, do not play the backlog
   try { while (next < now + LOOK) { playStep(pos, next); next += stepBase / tempo; pos = (pos + 1) % steps; } } catch { /* a browser without some node: the game goes on without sound */ }
  }
  function level() {
   if (!master) return;
   const v = on && wanted && !held ? VOLUME : 0;
   try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(v, ctx.currentTime, .06); } catch { try { master.gain.value = v; } catch { /* ignore */ } }
  }
  function run() {
   if (!on || !wanted || held || !AC || !build()) return;
   try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch { /* ignore */ }
   if (!timer) timer = setInterval(tick, 30);
   level();
  }
  function halt() {
   if (timer) { clearInterval(timer); timer = 0; }
   level();
   setTimeout(() => { if (ctx && !(on && wanted && !held)) { try { const p = ctx.suspend(); if (p && p.catch) p.catch(() => {}); } catch { /* ignore */ } } }, 280);   // let the fade finish, then let go of the audio device
  }
  return {
   get supported() { return !!AC; }, get on() { return on; }, get running() { return live(); }, get notes() { return notes; }, get mood() { return mood; },
   /** the game starts: play from the top of the tune (if the browser allows sound yet) */
   play() { wanted = true; held = false; pos = 0; next = 0; tempo = 1; run(); },
   /** the game ends or is left */
   stop() { wanted = false; halt(); },
   /** the game is paused (true) or goes on (false) */
   hold(v) { held = !!v; if (held) halt(); else run(); },
   /** calm: no drums (the landing), normal, sprint: arpeggio and a faster tempo */
   setMood(m) { mood = m; },
   /** the player's switch; returns whether the music is on now */
   toggle() { on = !on; if (store) core.writeMusic(store, on); if (on) run(); else halt(); return on; },
   /** a click, a key or a touch happened: this is the moment a blocked browser lets the sound start */
   unlock() { if (wanted && on && !held && !live()) run(); },
   /** the music is wanted but the browser does not let it start yet */
   waiting() { return wanted && on && !held && !live(); }
  };
 })();

 // ---- the card gets: an exit button in the header (only while the game runs), a hold-to-start bar, a score bar, the mode and ULT bar, a tip line, an overlay, a flash and a caption
 const actions = el('span', 'scope-actions');
 const toggle = el('button', 'game-toggle');
 toggle.type = 'button'; toggle.hidden = true;
 const toggleText = el('span');
 toggle.append(toggleText);
 // the music button: only while the game runs, next to the exit button
 const musicBtn = el('button', 'game-music');
 musicBtn.type = 'button'; musicBtn.hidden = true;
 const musicText = el('span', 'game-music-text');
 musicBtn.append(el('span', 'game-music-icon', '♪'), musicText);
 const dots = topline.querySelector('.scope-dots');
 if (dots) { dots.replaceWith(actions); actions.append(musicBtn, toggle, dots); } else { topline.append(actions); actions.append(musicBtn, toggle); }

 const dwellBar = el('div', 'game-dwell'), dwellFill = el('i');
 dwellBar.setAttribute('aria-hidden', 'true'); dwellBar.append(dwellFill);
 const hud = el('div', 'game-hud'); hud.hidden = true; hud.setAttribute('aria-hidden', 'true');
 const hudScore = el('div', 'game-score'), hudScoreLabel = el('span'), hudScoreValue = el('strong', '', '00000');
 hudScore.append(hudScoreLabel, hudScoreValue);
 const hudMeta = el('div', 'game-meta'), hudGate = el('span'), hudMult = el('span'), hudLives = el('span', 'game-lives'), hudTime = el('span', 'game-time');
 for (let i = 0; i < CFG.lives; i++) hudLives.append(el('i'));
 hudMeta.append(hudGate, hudMult, hudLives, hudTime);
 // the wind sits in the score line: an arrow that points where it blows, its speed and five pips of strength
 const hudWind = el('div', 'game-wind'), windArrow = el('i', 'game-wind-arrow'), windValue = el('b'), windPips = el('span', 'game-wind-pips');
 for (let i = 0; i < 5; i++) windPips.append(el('i'));
 hudWind.append(windArrow, windValue, windPips);
 hudScore.append(hudWind);
 hud.append(hudScore, hudMeta);
 const tip = el('div', 'game-tip'); tip.hidden = true; tip.setAttribute('aria-hidden', 'true');
 const bar = el('div', 'game-bar'); bar.hidden = true;
 const ultBtn = el('button', 'game-ult'); ultBtn.type = 'button';
 const ultLabel = el('span', 'game-ult-label'), ultMeter = el('span', 'game-ult-meter'), ultFill = el('i'), ultKey = el('span', 'game-ult-key', 'E');
 ultMeter.append(ultFill); ultBtn.append(ultLabel, ultMeter, ultKey);
 // the modes are not buttons: the plan of the mission changes them; the active one shows how far it has got and how long it lasts
 const modesRow = el('div', 'game-modes'), chips = {};
 MODE_ORDER.forEach(name => {
  const chip = el('span', 'game-mode'), fill = el('i', 'game-mode-fill'), left = el('b', 'game-mode-left');
  chip.dataset.mode = name; chip.append(fill, el('span', '', name), left);
  chips[name] = { chip, fill, left }; modesRow.append(chip);
 });
 const landingLabel = el('div', 'game-landing', 'AUTOLAND'); landingLabel.hidden = true;
 bar.append(ultBtn, modesRow, landingLabel);
 const overlay = el('div', 'game-overlay'); overlay.hidden = true;
 const flash = el('div', 'game-flash'); flash.setAttribute('aria-hidden', 'true');
 const live = el('div', 'game-live'); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
 const glow = el('div', 'game-glow'); glow.setAttribute('aria-hidden', 'true');      // the glow at the edges of the card while the afterburner burns
 host.append(dwellBar, glow, hud, tip, bar, flash, overlay, live);
 const caption = el('div', 'scope-caption game-caption'), captionText = el('span'), captionText2 = el('span', 'game-caption2'); caption.hidden = true;
 const captionBody = el('span', 'game-caption-body'); captionBody.append(captionText, el('br'), captionText2);
 caption.append(el('span', 'mini-cross', '+'), captionBody);
 if (instructions) instructions.after(caption); else root.append(caption);
 // the overlay, the bars and the button must not start the demo's boost and pointer capture
 for (const node of [overlay, toggle, bar, musicBtn]) node.addEventListener('pointerdown', ev => ev.stopPropagation());
 const gridEl = root.querySelector('.scope-grid');

 // ---- state of the layer
 let mode = 'demo', game = null, pauseReason = '', engaged = false, lastPointer = 'mouse', inside = false, aimSource = 'pointer', firing = false;
 let goBanner = 0, banner = null, gustInfo = null, lastHud = '', overlayKey = '', markHidden = false, tipTimer = 0, seenHazard = false, away = 0, keyPlay = false;
 let hovering = false, dwellHeld = 0, dwellLock = false, dwellLast = 0, dwellText = '', dwellOn = false, lmbDown = false, tipPrio = 0;
 let sprintView = 0, lastWind = '', audioWait = 0, seenBonus = false, sprintOn = false;
 const aimOut = { x: 0, y: 0, neutral: false };
 const WIND_UNIT = 6;                          // world units per second -> the metres per second shown on the card
 // the streaks that show the wind (they drift with it) and the afterburner (they fly away from the vanishing point)
 const STREAKS = Array.from({ length: 28 }, (_, i) => ({ u: (i * .6180339 + .13) % 1, v: (i * .381966 + .31) % 1, s: .6 + ((i * .7311) % 1) * .8 }));
 const LINES = Array.from({ length: 34 }, (_, i) => ({ a: ((i * 137.508) % 360) * DEG, p: (i * .6180339) % 1, l: .5 + ((i * .37) % 1) * .8 }));
 const arrowOf = (dx, dy) => ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'][((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8];
 const tipsShown = new Set(), tipQueue = [];
 const plane = { scale: 1, x: 0, y: 0, alpha: 1 }, popups = [], rings = [], sparks = [], beams = [], tracers = [], keys = new Set();
 const virt = { x: 0, y: 0 }, lastAim = { x: 0, y: 0 }, cam = { roll: 0, zoom: 1, kick: 0, px: 0, py: 0, active: false };
 const AXES = { arrowleft: ['x', -1], arrowright: ['x', 1], arrowup: ['y', 1], arrowdown: ['y', -1], a: ['x', -1], d: ['x', 1], w: ['y', 1], s: ['y', -1] };
 const announce = text => { live.textContent = ''; live.textContent = text; };
 const setBanner = (text, life) => { banner = { text, life, age: 0 }; };
 const isRunning = () => mode === 'run' || mode === 'count';

 // ---- the view: the rings fly from the vanishing point at the top of the card to the plane of the aircraft (the depth 0), where the pointer is
 const baseOf = () => Math.min(state.w * .155, state.h * .21);
 const sAt = z => 1 / (1 + Math.max(z, -1) * PK);
 /** A point of the game world on the card: pixels of the centre, and the size in pixels of one world unit at that depth. */
 function worldToPixels(x, y, z) {
  const base = baseOf(), s = sAt(z), cy = state.h * .51, vy = state.h * VP;
  return { x: state.w / 2 + x * base * s, y: vy + (cy - y * .83 * base - vy) * s, s: base * s };
 }
 /** The demo draws its aircraft with its own oblique camera; this is where to put the aircraft (in the demo's units) so that it is drawn at worldToPixels(x, y, 0). */
 function demoOffset(x, y) {
  const gy = 7.8 * y / (7.8 + .36 * y);
  return [x * (7.8 - .36 * gy) / 7.8, gy];
 }
 function pointerScreen() { return { x: (state.targetX + 1) / 2 * state.w, y: (1 - state.targetY) / 2 * state.h }; }
 /** The pointer on the plane of the aircraft, in world units: the place the aircraft flies to. */
 function pointerPlane() { const p = pointerScreen(), base = baseOf(); return { x: (p.x - state.w / 2) / base, y: (state.h * .51 - p.y) / (.83 * base) }; }
 const planeScreen = () => (game ? worldToPixels(game.plane.x, game.plane.y, 0) : { x: cam.px, y: cam.py });
 /** Where the pointer is in the world at the depth z (the camera is taken out again); tol is the reach of the gun in world units at that depth (about 24 px). */
 function pointerAt(z) {
  const p = pointerScreen(), s = sAt(z), base = baseOf(), vy = state.h * VP;
  let sx = p.x, sy = p.y;
  if (cam.active) {
   const c = Math.cos(cam.roll), si = Math.sin(cam.roll), dx = (sx - cam.px) / cam.zoom, dy = (sy - cam.py) / cam.zoom;
   sx = cam.px + dx * c + dy * si; sy = cam.py - dx * si + dy * c;
  }
  return { x: (sx - state.w / 2) / (base * s), y: (state.h * .51 - vy - (sy - vy) / s) / (.83 * base), tol: 24 / (base * s) };
 }

 // ---- overlay: one place decides what is shown (the countdown digit, GO, pause, the end screen)
 function wantedOverlay() {
  if (mode === 'count' && game) return 'count:' + Math.max(1, Math.ceil(game.countdown / (CFG.countdown / 3)));
  if (mode === 'run' && goBanner > 0) return 'go';
  if (mode === 'paused') return 'paused';
  if (mode === 'over') return 'over';
  return '';
 }
 function button(label, cls, onClick) {
  const b = el('button', 'game-btn ' + cls, label); b.type = 'button';
  b.addEventListener('click', ev => { ev.stopPropagation(); onClick(); });
  return b;
 }
 function paintOverlay(key) {
  overlay.textContent = '';
  overlay.dataset.kind = key.startsWith('count:') ? 'count' : key;
  if (key.startsWith('count:') || key === 'go') {
   const box = el('div', 'game-count-box');
   box.append(el('div', 'game-count', key === 'go' ? tx('go') : key.slice(6)), el('div', 'game-hint', tx('hint')));
   overlay.append(box);
   return;
  }
  const panel = el('div', 'game-panel');
  if (key === 'paused') panel.append(el('div', 'game-title', tx('paused')), el('div', 'game-hint', tx('pausedHint')));
  else if (key === 'over' && game) {
   const s = core.summary(game);
   const row = (label, value, cls) => { const r = el('div', 'game-row' + (cls ? ' ' + cls : '')); r.append(el('span', '', label), el('strong', '', value)); return r; };
   panel.append(el('div', 'game-title' + (s.won ? ' is-won' : ''), s.won ? tx('won') : tx('over')), el('div', 'game-rank', tx('ranks')[s.rank]), row(tx('score'), pad(s.score, 5), 'is-main'), row(tx('best'), pad(Math.max(best, s.score), 5)));
   if (newBest) panel.append(el('div', 'game-newbest', tx('newBest')));
   if (s.won && s.landing) panel.append(row(tx('landing'), tx('grade' + s.landing.grade[0].toUpperCase() + s.landing.grade.slice(1)) + ' +' + s.landing.bonus));
   panel.append(row(tx('gates'), String(s.passed)), row(tx('kills'), String(s.kills)), row(tx('accuracy'), s.accuracy + '%'), row(tx('streak'), '×' + s.maxStreak));
   const buttons = el('div', 'game-buttons'), again = button(tx('again'), 'is-primary', restart);
   buttons.append(again, button(tx('exit'), '', exit));
   panel.append(buttons);
   setTimeout(() => { if (mode === 'over') { try { again.focus({ preventScroll: true }); } catch { /* old browsers */ } } }, 80);
  }
  overlay.append(panel);
 }
 function syncOverlay() {
  const key = wantedOverlay();
  if (key === overlayKey) return;
  overlayKey = key;
  if (!key) { overlay.hidden = true; overlay.textContent = ''; return; }
  overlay.hidden = false; paintOverlay(key);
 }

 // ---- texts and HUD
 function paintStatic() {
  toggleText.textContent = '■ ' + tx('exit');
  toggle.setAttribute('aria-label', tx('buttonExit'));
  hudScoreLabel.textContent = tx('score');
  ultLabel.textContent = tx('ult');
  ultBtn.setAttribute('aria-label', tx('ultLabel'));
  rich(captionText, tx('caption')); rich(captionText2, tx('caption2'));
  lastHud = ''; lastWind = ''; overlayKey = '__repaint__';
  paintMusic();
  syncOverlay();
 }
 /** The wind in the score line: the arrow, the speed, the strength. */
 function paintWind() {
  if (!game) return;
  const W = core.windInfo(game), deg = Math.round(-W.dir / DEG / 3) * 3, mps = Math.round(W.speed * WIND_UNIT), pips = Math.min(5, Math.round(W.speed / 4.2 * 5));
  const key = [deg, mps, pips, W.gust ? 1 : 0, lang()].join('|');
  if (key === lastWind) return;
  lastWind = key;
  windArrow.style.transform = `rotate(${deg}deg)`;
  windValue.textContent = `${pad(mps, 2)} ${tx('windUnit')}`;
  [...windPips.children].forEach((p, i) => p.classList.toggle('is-on', i < pips));
  hudWind.classList.toggle('is-gust', W.gust);
  hudWind.setAttribute('title', `${tx('wind')} ${pad(mps, 2)} ${tx('windUnit')}`);
 }
 function paintHud() {
  if (!game) return;
  const info = core.modeInfo(game), pct = info.len ? Math.round(100 * info.t / info.len) : 0, secs = Math.ceil(info.left);
  const mult = core.multiplier(game) * MODES[game.mode].score, boosted = game.boost > .6, next = core.nextGate(game);
  const remaining = Math.max(0, Math.ceil(CFG.missionTime - game.runTime)), ultFull = game.ult >= 100;
  const key = [game.score, game.lives, game.streak, boosted, next ? next.n : game.gateCount, lang(), game.mode, Math.round(game.ult), game.finale ? 1 : 0, game.finale ? 0 : remaining, pct, secs, info.next, coarse].join('|');
  if (key === lastHud) return;
  lastHud = key;
  hudScoreValue.textContent = pad(game.score, 5);
  hudGate.textContent = next && next.approach ? `${tx('final')} ${next.index}/${CFG.landing.gates}` : `${tx('gates')} ${pad(next ? next.n : game.gateCount, 2)}`;
  hudMult.textContent = `×${mult.toFixed(1)}`;
  hudMult.classList.toggle('is-boost', boosted);
  hudTime.textContent = game.finale ? 'AUTOLAND' : 'T-' + clock(remaining);
  hudTime.classList.toggle('is-final', !!game.finale);
  [...hudLives.children].forEach((dot, i) => dot.classList.toggle('is-off', i >= game.lives));
  ultFill.style.width = Math.round(game.ult) + '%';
  ultBtn.classList.toggle('is-ready', ultFull);
  ultKey.textContent = coarse ? '▶' : 'E';
  modesRow.hidden = !!game.finale; landingLabel.hidden = !game.finale;
  for (const name of MODE_ORDER) {
   const c = chips[name], active = game.mode === name && !game.finale;
   c.chip.classList.toggle('is-active', active); c.chip.classList.toggle('is-next', !active && info.next === name);
   c.fill.style.width = active ? pct + '%' : '0%';
   c.left.textContent = active ? clock(secs) : '';
   if (active) c.chip.setAttribute('aria-current', 'true'); else c.chip.removeAttribute('aria-current');
  }
 }
 // one line of tips at a time: what a mode asks of the pilot (priority 2) is not pushed away by the hints that come while it is up, they wait their turn
 function setTip(text, prio) { tip.textContent = text; tip.hidden = false; tipTimer = 5.2; tipPrio = prio; }
 function showTip(id, text, force, prio = 1) {
  if (!force && tipsShown.has(id)) return;
  tipsShown.add(id);
  if (!tip.hidden && tipTimer > 0 && prio <= tipPrio) { if (tipQueue.length < 3 && !tipQueue.some(q => q.id === id)) tipQueue.push({ id, text, prio }); return; }
  setTip(text, prio);
 }
 function nextTip() { tipPrio = 0; const q = tipQueue.shift(); if (q) setTip(q.text, q.prio); else tip.hidden = true; }

 // ---- flow
 // How far the aircraft may go and how high or low a gate may be, worked out from the size of the card (world units of the card's camera).
 // The rings stay below the score bar and above the bar with the modes (their lower edge may reach under the bar a little: it is see-through); the aircraft may go a little further than the rings.
 function fieldSize() {
  const base = Math.min(state.w * .155, state.h * .21), centre = state.h * .51, ringPx = CFG.radius0 * base * .83;
  const up = centre - (56 + ringPx), down = state.h - 70 - ringPx - centre;
  return {
   x: bound((state.w / 2 - 34) / base, 1.6, CFG.fieldX),
   y: bound((state.h * .5 - 60) / (base * .83), .9, 1.5),
   gateY: bound(Math.min(up, down) / (base * .83), .45, 1.4)
  };
 }
 function start() {
  if (mode === 'count' || mode === 'run' || mode === 'paused') return;
  game = core.create((Math.random() * 0xffffffff) >>> 0, fieldSize());
  core.begin(game);
  mode = 'count'; engaged = true; layer.active = true; pauseReason = ''; newBest = false; goBanner = 0; banner = null; gustInfo = null; seenHazard = false;
  firing = false; away = 0; aimSource = 'pointer'; keyPlay = false; lastAim.x = lastAim.y = 0;
  dwellHeld = 0; dwellText = ''; setDwellBar(false);
  tipsShown.clear(); tipQueue.length = 0; tipPrio = 0; tip.hidden = true; tipTimer = 0;
  popups.length = rings.length = sparks.length = beams.length = tracers.length = 0;
  sprintView = 0; sprintOn = false; lastWind = ''; audioWait = 0; seenBonus = false; host.classList.remove('is-sprint');
  root.classList.add('is-game'); host.classList.add('is-game');
  hud.hidden = false; caption.hidden = false; bar.hidden = false; toggle.hidden = false; musicBtn.hidden = !audio.supported;
  paintStatic();
  try { host.focus({ preventScroll: true }); } catch { /* old browsers */ }
  announce(tx('liveStart'));
  audio.setMood('normal'); audio.play();
  demo.wake();
 }
 function restart() { mode = 'demo'; game = null; start(); }
 function exit() {
  if (mode === 'demo') return;
  mode = 'demo'; engaged = false; game = null; keys.clear(); firing = false; lmbDown = false; tipQueue.length = 0; tipPrio = 0;
  dwellHeld = 0; dwellText = ''; dwellLock = hovering; setDwellBar(false);       // the pointer is still on the card: the next game needs a new visit
  popups.length = rings.length = sparks.length = beams.length = tracers.length = 0;
  root.classList.remove('is-game'); host.classList.remove('is-game', 'is-hit', 'is-narrow', 'is-sprint');
  hud.hidden = true; caption.hidden = true; bar.hidden = true; tip.hidden = true; toggle.hidden = true; musicBtn.hidden = true; sprintView = 0; sprintOn = false;
  audio.stop();
  showCentreMark();
  paintStatic();
  demo.wake();
 }
 function pause(reason) {
  if (!isRunning()) return;
  core.pause(game); mode = 'paused'; pauseReason = reason; firing = false; syncOverlay(); audio.hold(true);
 }
 function resume() {
  if (mode !== 'paused') return;
  core.resume(game); mode = game.phase === 'count' ? 'count' : 'run'; pauseReason = ''; away = 0;
  syncOverlay(); audio.hold(false); demo.wake();
 }
 /** The music button and the M key: the music goes off and on (and the choice is kept). */
 function toggleMusic() { audio.toggle(); paintMusic(); }
 function paintMusic() {
  const on = audio.on;
  musicText.textContent = on ? tx('musicOn') : tx('musicOff');
  musicBtn.classList.toggle('is-off', !on);
  musicBtn.setAttribute('aria-pressed', String(on));
  musicBtn.setAttribute('aria-label', on ? tx('musicLabelOn') : tx('musicLabelOff'));
  musicBtn.setAttribute('title', tx('music') + ': ' + (on ? tx('musicOn') : tx('musicOff')));
 }
 function fireUlt() {
  if (!game || mode !== 'run') return 0;
  const n = core.fireUlt(game);
  handle(core.drain(game));
  return n;
 }
 /** The gun of the AUTO mode: a shot at the pointer. */
 function shootAtPointer() {
  if (!game || mode !== 'run' || game.mode !== 'AUTO') return null;
  const target = core.shoot(game, pointerAt);
  handle(core.drain(game));
  return target;
 }
 toggle.addEventListener('click', () => { if (mode !== 'demo') exit(); });
 musicBtn.addEventListener('click', ev => { ev.stopPropagation(); toggleMusic(); try { host.focus({ preventScroll: true }); } catch { /* old browsers */ } });      // the arrow keys and M go on working
 ultBtn.addEventListener('click', ev => { ev.stopPropagation(); fireUlt(); });
 // the first click, key or touch of the page is the moment a browser lets the music start
 for (const type of ['pointerdown', 'pointerup', 'keydown', 'touchend', 'click']) document.addEventListener(type, () => audio.unlock(), true);

 const keyName = ev => ev.key.toLowerCase();
 host.addEventListener('keydown', ev => {
  const k = keyName(ev);
  if (k === 'escape' && mode !== 'demo') { ev.preventDefault(); exit(); return; }
  if (mode === 'demo') { if (k === 'enter' && !ev.repeat) { ev.preventDefault(); start(); keyPlay = true; } return; }
  if (AXES[k]) { keys.add(k); keyPlay = true; ev.preventDefault(); if (mode === 'paused' && pauseReason !== 'manual') resume(); return; }
  if (ev.repeat) return;
  if (k === 'm') { toggleMusic(); return; }
  if (k === 'e' || k === 'q') { fireUlt(); return; }
  if (k === 'p' && isRunning()) { pause('manual'); return; }
  if (k === ' ' || k === 'enter') {
   if (mode === 'paused') { ev.preventDefault(); resume(); }
   else if (mode === 'over') { ev.preventDefault(); restart(); }
   else if (k === ' ' && game && game.mode === 'AUTO') shootAtPointer();
  }
 });
 host.addEventListener('keyup', ev => keys.delete(keyName(ev)));
 host.addEventListener('blur', () => keys.clear());
 // where the pointer is: the aircraft follows it only while it is on the card (a stale position from an earlier visit must not steer);
 // holding it on the card for DWELL seconds starts the game
 host.addEventListener('pointerdown', ev => {
  lastPointer = ev.pointerType; inside = true; hovering = true; aimSource = 'pointer'; keyPlay = false;
  if (!engaged) return;                           // before the game the demo boosts and the dwell goes on
  if (ev.button === 2) { fireUlt(); return; }    // the right button fires the ULT (the demo ignores it and keeps the context menu off)
  if (ev.button === 0 && ev.pointerType !== 'touch') lmbDown = true;
  if (ev.button === 0 || ev.pointerType === 'touch') { firing = true; shootAtPointer(); }
 });
 host.addEventListener('pointermove', ev => {
  lastPointer = ev.pointerType; inside = true; aimSource = 'pointer'; keyPlay = false;
  if (ev.pointerType !== 'touch' || ev.pointerId === state.pointerId) hovering = true;
  // the mouse is moving over the card again after a pause that was not asked for (left the card, switched tab, scrolled away)
  if (mode === 'paused' && pauseReason !== 'manual' && (ev.pointerType === 'mouse' || ev.pointerType === 'pen')) resume();
 });
 const lifted = ev => { firing = false; lmbDown = false; if (ev.pointerType === 'touch') { inside = false; hovering = false; dwellLock = false; } };
 host.addEventListener('pointerup', lifted);
 host.addEventListener('pointercancel', ev => { lifted(ev); inside = false; hovering = false; dwellLock = false; });
 host.addEventListener('pointerleave', ev => {
  if (state.pointerId !== null) return;
  inside = false; hovering = false; dwellLock = false; dwellHeld = 0;
 });
 host.addEventListener('pointerenter', ev => {
  if (ev.pointerType === 'mouse' || ev.pointerType === 'pen') {
   lastPointer = ev.pointerType; inside = true; hovering = true; keyPlay = false; dwellLock = false;      // a new visit
   if (mode === 'paused' && pauseReason !== 'manual') resume();
  }
 });
 overlay.addEventListener('click', () => { if (mode === 'paused') resume(); });
 document.addEventListener('visibilitychange', () => { if (document.hidden) pause('hidden'); });
 window.addEventListener('blur', () => pause('hidden'));
 window.addEventListener('atlas:languagechange', paintStatic);

 // ---- hold the pointer on the card: a thin bar at the top fills up, the middle mark counts down, and at the end the game starts
 function setDwellBar(on) { if (on !== dwellOn) { dwellOn = on; dwellBar.classList.toggle('is-on', on); } if (!on) dwellFill.style.transform = 'scaleX(0)'; }
 function updateDwell() {
  const now = performance.now(), gap = now - dwellLast; dwellLast = now;
  if (gap > 300) { dwellHeld = 0; return; }     // the loop was asleep (the card was out of view or the tab hidden): start over
  if (!hovering || dwellLock) { dwellHeld = 0; dwellText = ''; setDwellBar(false); return; }
  dwellHeld += gap / 1000;
  dwellFill.style.transform = `scaleX(${bound(dwellHeld / DWELL, 0, 1).toFixed(3)})`;
  setDwellBar(dwellHeld > 1);
  dwellText = dwellHeld >= 2 ? tx('dwell').replace('{n}', String(Math.max(1, Math.ceil(DWELL - dwellHeld)))) : '';
  if (dwellHeld >= DWELL) start();
 }

 // ---- the camera: it banks with the aircraft (turning about the aircraft, so the aircraft stays under the pointer) and leans in when the throttle is open
 function camToScreen(px, py) {
  if (!cam.active) return [px, py];
  const c = Math.cos(cam.roll), s = Math.sin(cam.roll), dx = px - cam.px, dy = py - cam.py;
  return [cam.px + cam.zoom * (dx * c - dy * s), cam.py + cam.zoom * (dx * s + dy * c)];
 }
 function cameraBegin(ctx) {
  ctx.save();
  if (!cam.active) return;
  ctx.translate(cam.px, cam.py); ctx.rotate(cam.roll); ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.px, -cam.py);
 }
 function cameraEnd(ctx) { ctx.restore(); drawOverlay(ctx); }
 function updateCamera(dt) {
  let r = 0, z = 1;
  if (engaged && game && !reduced) {
   r = bound(CAM.roll * state.roll * DEG, -CAM.rollMax, CAM.rollMax);
   z = 1 + CAM.boostZoom * game.boost + CAM.driftZoom * Math.min(1, Math.abs(game.plane.vx) / CFG.maxSpeed) + CAM.sprintZoom * sprintView;
  }
  if (engaged && game) { const S = planeScreen(); cam.px = S.x; cam.py = S.y; }
  const a = 1 - Math.exp(-dt * 7);
  cam.roll += (r + cam.kick - cam.roll) * a; cam.zoom += (z - cam.zoom) * a;
  cam.kick *= Math.exp(-dt * 6);
  cam.active = Math.abs(cam.roll) > 5e-4 || Math.abs(cam.zoom - 1) > 5e-4;
  if (gridEl) gridEl.style.transform = cam.active ? `rotate(${cam.roll.toFixed(4)}rad) scale(${(1.45 * cam.zoom).toFixed(3)})` : '';
 }

 // ---- steering: the aircraft follows the aim; the demo's attitude only shows the bank and the climb of that motion (a right turn = right bank)
 function steer() {
  if (!engaged) return;
  if (!game || mode === 'over' || mode === 'paused') { state.aimRoll = state.aimPitch = state.aimYaw = 0; return; }
  const P = game.plane, allowed = MODES[game.mode].boost;
  if (!allowed && state.boosted) { state.boosted = false; host.classList.remove('is-boosting'); }                                      // CRUISE and AUTO: no boost (in AUTO the button is the gun)
  else if (allowed && lmbDown && !state.boosted && mode === 'run') { state.boosted = true; host.classList.add('is-boosting'); }   // the button is still held when the mode changes back
  // FBWA: what the aircraft shows is its real bank and pitch (the limits are in the core: 45 and 25 degrees, a gust shakes the wings); a right bank is a negative roll of the model
  state.aimRoll = -bound(P.bank / DEG, -58, 58); state.aimPitch = bound(P.tilt / DEG, -32, 32); state.aimYaw = -state.aimRoll * .3;
 }
 /** Where the aircraft is told to go: the arrow keys move an aim of their own, otherwise the pointer; when the pointer has left the card the last aim stays. */
 function currentAim(dt) {
  let kx = 0, ky = 0;
  for (const k of keys) { const a = AXES[k]; if (a) { if (a[0] === 'x') kx += a[1]; else ky += a[1]; } }
  if (kx || ky) {
   if (aimSource !== 'keys') { virt.x = lastAim.x; virt.y = lastAim.y; aimSource = 'keys'; }
   virt.x = bound(virt.x + bound(kx, -1, 1) * KEY_X * dt, -game.fieldX, game.fieldX); virt.y = bound(virt.y + bound(ky, -1, 1) * KEY_Y * dt, -game.fieldY, game.fieldY);
   lastAim.x = virt.x; lastAim.y = virt.y;
  } else if (aimSource === 'pointer' && (inside || state.pointerId !== null)) {
   const w = pointerPlane(); lastAim.x = w.x; lastAim.y = w.y;
  }
  // no pointer, no finger and no key in charge: the stick is let go, the wings come level by themselves (the wind still carries the aircraft)
  aimOut.x = lastAim.x; aimOut.y = lastAim.y; aimOut.neutral = aimSource === 'pointer' && !(inside || state.pointerId !== null);
  return aimOut;
 }

 // ---- one frame of the game
 function hit() {
  if (reduced) return;
  flash.classList.remove('is-miss', 'is-ult'); void flash.offsetWidth; flash.classList.add('is-miss');
  host.classList.remove('is-hit'); void host.offsetWidth; host.classList.add('is-hit');
  cam.kick = (Math.random() < .5 ? -1 : 1) * .06;
 }
 function burst(x, y, n, speed, z) {
  if (reduced) return;
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = speed * (.6 + Math.random() * .8); sparks.push({ x, y, z: z || 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: .4 + Math.random() * .25, dx: 0, dy: 0 }); }
 }
 function handle(events) {
  for (const e of events) {
   if (e.type === 'start') { goBanner = .7; mode = 'run'; }
   else if (e.type === 'gate') {
    const perfect = e.quality === 'perfect';
    popups.push({ text: `${perfect ? tx('perfect') : tx('good')} +${e.points}`, x: e.x, y: e.y, z: 0, age: 0, life: 1.1, color: perfect ? '#fff2b0' : '#cfd37a' });
    rings.push({ x: e.x, y: e.y, r: e.gate.r, age: 0, life: .45, color: perfect ? '#fff2b0' : '#c7d070' });
    burst(e.x, e.y, perfect ? 14 : 8, 70 + Math.random() * 110);
    if (e.streak % 5 === 0) popups.push({ text: `${tx('streak')} ×${e.streak}`, x: e.x, y: e.y - .8, z: 0, age: 0, life: 1.3, color: '#e6d05f' });
   } else if (e.type === 'miss') {
    popups.push({ text: tx('miss'), x: e.x, y: e.y, z: 0, age: 0, life: 1.2, color: '#e07b4f' });
    rings.push({ x: e.x, y: e.y, r: e.gate.r, age: 0, life: .5, color: '#e07b4f' });
    hit();
   } else if (e.type === 'hit') {
    popups.push({ text: e.kind === 'enemy' ? tx('hitEnemy') : tx('hitPylon'), x: e.x, y: e.y, z: 0, age: 0, life: 1.3, color: '#e07b4f' });
    rings.push({ x: e.x, y: e.y, r: e.thing.r * 1.6, age: 0, life: .55, color: '#e07b4f' });
    burst(e.x, e.y, 16, 120);
    hit();
   } else if (e.type === 'life') popups.push({ text: tx('life'), x: 0, y: .9, z: 0, age: 0, life: 1.4, color: '#e6d05f' });
   else if (e.type === 'level') setBanner(`${tx('level')} ${e.level}`, 1.8);
   else if (e.type === 'gust') { gustInfo = e.stage === 'end' ? null : { dirX: e.dirX, dirY: e.dirY, stage: e.stage }; if (e.stage === 'warn') showTip('gust', tx('tipGust')); }
   else if (e.type === 'enemy') showTip('enemy', tx('tipEnemy'));
   else if (e.type === 'ultReady') { popups.push({ text: tx('ultReady'), x: 0, y: -1, z: 0, age: 0, life: 1.6, color: '#fff2b0' }); showTip('ult', tx('tipUlt'), true); }
   else if (e.type === 'ultDenied') { popups.push({ text: tx('noTargets'), x: 0, y: -1, z: 0, age: 0, life: 1.1, color: '#e07b4f' }); ultBtn.classList.remove('is-denied'); void ultBtn.offsetWidth; ultBtn.classList.add('is-denied'); }
   else if (e.type === 'ult') {
    for (const t of e.targets) {
     beams.push({ x: t.x, y: t.y, z: t.z, age: 0, life: .45, thin: false });
     rings.push({ x: t.x, y: t.y, r: t.r * 1.8, age: 0, life: .6, color: '#fff2b0' });
     burst(t.x, t.y, 18, 150, 0);
     popups.push({ text: `${tx('shot')} +${Math.round(e.points / e.targets.length)}`, x: t.x, y: t.y, z: 0, age: 0, life: 1.3, color: '#fff2b0' });
    }
    if (!reduced) { flash.classList.remove('is-miss', 'is-ult'); void flash.offsetWidth; flash.classList.add('is-ult'); cam.kick = .04; }
   } else if (e.type === 'shot') {
    beams.push({ x: e.x, y: e.y, z: e.z, age: 0, life: .22, thin: true });
    rings.push({ x: e.x, y: e.y, r: e.r * 1.6, age: 0, life: .5, color: '#fff2b0' });
    burst(e.x, e.y, 14, 130, 0);
    popups.push({ text: `${tx('shot')} +${e.points}`, x: e.x, y: e.y, z: 0, age: 0, life: 1.2, color: '#fff2b0' });
   } else if (e.type === 'shotMiss') {
    const p = pointerScreen(); tracers.push({ x: p.x, y: p.y, age: 0, life: .16 });
   } else if (e.type === 'bonus') {
    popups.push({ text: `${tx('bonus')} +${e.points}`, x: e.x, y: e.y, z: 0, age: 0, life: 1.1, color: '#9ff0dc' });
    rings.push({ x: e.x, y: e.y, r: e.r, age: 0, life: .45, color: '#8fe3d0' });
    burst(e.x, e.y, 10, 90);
   } else if (e.type === 'sprint') {
    if (e.stage === 'warn') { setBanner(tx('sprintWarn'), 1.5); showTip('sprint', tx('tipSprint'), false, 2); }
    else if (e.stage === 'start') { setBanner(`${tx('sprint')} ×${e.peak.toFixed(1)}`, 1.5); cam.kick = (Math.random() < .5 ? -1 : 1) * .025; }
    else if (e.clean) popups.push({ text: `${tx('sprintClean')} +${e.bonus}`, x: 0, y: .95, z: 0, age: 0, life: 1.7, color: '#fff2b0' });
   } else if (e.type === 'wind') setBanner(tx('windShift'), 1.6);
   else if (e.type === 'mode') {
    firing = false;
    if (e.from) setBanner(`${tx('modeTo')} ${e.to}`, 1.8);
    if (e.to !== 'AUTOLAND') showTip('mode-' + e.to, tx('tip' + e.to), false, 2);
    if (e.handover) showTip('handover', tx('tipHandover'), false, 2);
   } else if (e.type === 'finale') { setBanner(tx('finale'), 3.2); showTip('finale', tx('tipFinale'), true, 2); }
   else if (e.type === 'touchdown') popups.push({ text: `${tx('touchdown')} · ${tx('grade' + e.grade[0].toUpperCase() + e.grade.slice(1))}`, x: 0, y: -.8, z: 0, age: 0, life: 2.2, color: '#fff2b0' });
   else if (e.type === 'over' || e.type === 'won') {
    mode = 'over'; firing = false;
    newBest = e.summary.score > best && e.summary.score > 0;
    if (newBest) { best = e.summary.score; if (store) core.writeBest(store, best); }
    keys.clear(); gustInfo = null; tip.hidden = true; audio.stop();
    announce((e.type === 'won' ? tx('liveWon') : tx('liveOver')).replace('{score}', e.summary.score).replace('{gates}', e.summary.passed));
   }
  }
 }
 function update(dt) {
  const want = engaged ? GAME_SCALE : 1;
  plane.scale = reduced ? want : plane.scale + (want - plane.scale) * (1 - Math.exp(-dt * 5.5));
  if (Math.abs(plane.scale - want) < .004) plane.scale = want;
  const blend = bound((1 - plane.scale) / (1 - GAME_SCALE), 0, 1);
  if (!engaged && plane.scale === 1) { layer.active = cam.active; plane.x = plane.y = 0; }
  updateCamera(dt);
  if (!game || !engaged) {
   plane.x *= Math.exp(-dt * 8); plane.y *= Math.exp(-dt * 8); plane.alpha = 1;
   updateDwell();
   return;
  }
  const f = fieldSize();
  if (Math.abs(f.x - game.fieldX) > .03 || Math.abs(f.y - game.fieldY) > .03 || Math.abs(f.gateY - game.gateY) > .03) core.setField(game, f.x, f.y, f.gateY);
  const aim = currentAim(dt);
  if (firing && mode === 'run' && game.mode === 'AUTO') shootAtPointer();
  core.step(game, dt, { tx: aim.x, ty: aim.y, boost: state.boosted && lastPointer !== 'touch', neutral: aim.neutral });
  handle(core.drain(game));
  if (!seenHazard && (game.obstacles.length || game.enemies.length)) { seenHazard = true; showTip('hazard', tx('tipHazard')); }
  if (!seenBonus && game.bonuses.some(b => b.state === 'ahead' && b.z < 7.5)) { seenBonus = true; showTip('bonus', tx('tipBonus')); }
  if (game.runTime > 3 && mode === 'run') showTip('wind', tx('tipWind'));
  // the afterburner: how much of it is on the card (the speed lines, the lean-in of the camera, the glow at the edges, the speed readout) and in the music
  const sp = core.sprintInfo(game);
  sprintView += (sp.amt - sprintView) * (1 - Math.exp(-dt * 6));
  if (sprintView < .004) sprintView = 0;
  const hot = sprintView > .12;
  if (hot !== sprintOn) { sprintOn = hot; host.classList.toggle('is-sprint', hot); }
  audio.setMood(game.finale ? 'calm' : sprintView > .25 ? 'sprint' : 'normal');
  if (audio.waiting() && mode === 'run') { audioWait += dt; if (audioWait > 1.6) showTip('music', tx('tipMusic')); } else audioWait = 0;
  const [ox, oy] = demoOffset(game.plane.x, game.plane.y);
  plane.x = ox * blend; plane.y = oy * blend;
  plane.alpha = game.invuln > 0 ? .5 + .35 * Math.sin(game.time * 34) : 1;
  // the mouse stays away from the card for a while: the game waits (a touch screen has no pointer to lose, the arrow keys have their own timer)
  if (mode === 'run' && lastPointer !== 'touch' && !inside && state.pointerId === null && !keyPlay) { away += dt; if (away > AWAY) { away = 0; pause('away'); } }
  else away = 0;
  if (goBanner > 0) goBanner -= dt;
  if (banner && (banner.age += dt) >= banner.life) banner = null;
  if (tipTimer > 0 && (tipTimer -= dt) <= 0) nextTip();
  for (const list of [popups, rings, sparks, beams, tracers]) {
   for (const item of list) item.age += dt;
   for (let i = list.length - 1; i >= 0; i--) if (list[i].age >= list[i].life) list.splice(i, 1);
  }
  for (const s of sparks) { s.dx += s.vx * dt; s.dy += s.vy * dt; }
  syncOverlay();
  paintHud();
  paintWind();
  showCentreMark();
  host.classList.toggle('is-narrow', state.w < 440);     // a narrow card has no room for the readouts next to the score bar
 }

 // ---- drawing (the demo calls these around its own aircraft, inside the camera; drawOverlay comes after the camera: it is what the pointer works with)
 function ringPath(ctx, gm, r, segments) {
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
   const a = i / segments * Math.PI * 2, px = gm.x + Math.cos(a) * r * gm.s, py = gm.y - Math.sin(a) * r * gm.s * .83;
   if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
 }
 const fade = z => (z > 0 ? bound((CFG.zFar - z) / 1.5, 0, 1) : bound(1 + z / 1.5, 0, 1));
 function drawGate(ctx, gate, isNext) {
  const gm = worldToPixels(gate.x, gate.y, gate.z), alpha = fade(gate.z);
  if (alpha <= .01) return;
  let col = gate.approach ? '#d6f08a' : '#9fae5c', width = 1.4, glow = 'rgba(160,175,90,.15)';
  if (gate.state === 'missed') { col = '#e07b4f'; width = 1.8; glow = 'rgba(224,123,79,.5)'; }
  else if (gate.state === 'passed') { col = gate.quality === 'perfect' ? '#fff2b0' : '#c7d070'; width = 1.8; glow = 'rgba(240,225,120,.5)'; }
  else if (isNext) { col = gate.approach ? '#eaffb0' : '#f4e58a'; width = 2.2 + Math.max(0, 1 - gate.z / 3) * .9; glow = 'rgba(233,213,107,.65)'; }
  ctx.save();
  ctx.globalAlpha = alpha;
  ringPath(ctx, gm, gate.r, 32);
  if (isNext) { ctx.fillStyle = 'rgba(233,213,107,.06)'; ctx.fill(); }
  ctx.shadowColor = glow; ctx.shadowBlur = isNext ? 15 : 6; ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.shadowBlur = 0; ctx.lineWidth = 1.2;
  // brackets at 12, 3, 6 and 9 o'clock, like the marks of the HUD
  for (let i = 0; i < 4; i++) {
   const a = i * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), r0 = gate.r * gm.s, r1 = r0 * 1.16;
   ctx.beginPath(); ctx.moveTo(gm.x + c * r0, gm.y - s * r0 * .83); ctx.lineTo(gm.x + c * r1, gm.y - s * r1 * .83); ctx.stroke();
  }
  if (isNext) {
   ctx.beginPath(); ctx.moveTo(gm.x - 5, gm.y); ctx.lineTo(gm.x + 5, gm.y); ctx.moveTo(gm.x, gm.y - 4); ctx.lineTo(gm.x, gm.y + 4); ctx.stroke();
   ctx.font = `700 ${Math.max(9, Math.min(12, gm.s * .17))}px ${MONO}`; ctx.textAlign = 'center'; ctx.fillStyle = '#d9cf8a';
   ctx.fillText(gate.approach ? `${tx('final')} ${gate.index}/${CFG.landing.gates}` : `WP ${pad(gate.n, 2)}`, gm.x, gm.y - gate.r * gm.s * .83 - 9);
  }
  ctx.restore();
 }
 function drawPylon(ctx, o) {
  const gm = worldToPixels(o.x, o.y, o.z), alpha = fade(o.z);
  if (alpha <= .01) return;
  ctx.save(); ctx.globalAlpha = alpha;
  ringPath(ctx, gm, o.r, 10);
  ctx.fillStyle = 'rgba(224,123,79,.12)'; ctx.fill();
  ctx.shadowColor = 'rgba(224,123,79,.55)'; ctx.shadowBlur = 9; ctx.strokeStyle = o.state === 'hit' ? '#fff2b0' : '#e07b4f'; ctx.lineWidth = 1.9; ctx.lineJoin = 'round'; ctx.stroke(); ctx.shadowBlur = 0;
  const r = o.r * gm.s * .62;      // a cross inside, like a no-go mark
  ctx.lineWidth = 1.3; ctx.beginPath();
  ctx.moveTo(gm.x - r, gm.y - r * .83); ctx.lineTo(gm.x + r, gm.y + r * .83); ctx.moveTo(gm.x + r, gm.y - r * .83); ctx.lineTo(gm.x - r, gm.y + r * .83); ctx.stroke();
  ctx.restore();
 }
 function drawEnemy(ctx, e, locked) {
  const gm = worldToPixels(e.x, e.y, e.z), alpha = fade(e.z);
  if (alpha <= .01) return;
  const r = e.r * gm.s;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(gm.x, gm.y); ctx.rotate(bound(-e.vx * .22, -.5, .5));
  ctx.strokeStyle = '#e07b4f'; ctx.fillStyle = 'rgba(224,123,79,.15)'; ctx.lineWidth = 1.7; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(224,123,79,.6)'; ctx.shadowBlur = 9;
  ctx.beginPath();      // the wings of an aircraft coming straight at us
  ctx.moveTo(-1.6 * r, .12 * r); ctx.lineTo(-.28 * r, -.2 * r); ctx.lineTo(.28 * r, -.2 * r); ctx.lineTo(1.6 * r, .12 * r); ctx.lineTo(.32 * r, .24 * r); ctx.lineTo(-.32 * r, .24 * r); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, .22 * r, .4 * r, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-.14 * r, .3 * r); ctx.lineTo(-.62 * r, .82 * r); ctx.moveTo(.14 * r, .3 * r); ctx.lineTo(.62 * r, .82 * r); ctx.stroke();
  ctx.shadowBlur = 0; ctx.fillStyle = '#ffd9a8'; ctx.beginPath(); ctx.arc(0, -.1 * r, Math.max(1.6, r * .07), 0, Math.PI * 2); ctx.fill();
  if (locked) {        // the ULT is ready (or the pointer is on it in AUTO): the target is marked
   const w = 1.9 * r, h = 1.15 * r, k = Math.min(w, h) * .38;
   ctx.strokeStyle = '#fff2b0'; ctx.lineWidth = 1.6; ctx.beginPath();
   for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.moveTo(sx * w, sy * (h - k)); ctx.lineTo(sx * w, sy * h); ctx.lineTo(sx * (w - k), sy * h); }
   ctx.stroke();
  }
  ctx.restore();
 }
 function drawRunway(ctx, F) {
  if (F.runwayZ == null) return;
  const z0 = F.runwayZ, z1 = z0 + 14, w = 1.05, y = F.groundY;
  const a = worldToPixels(-w, y, z0), b = worldToPixels(w, y, z0), c = worldToPixels(w, y, z1), d = worldToPixels(-w, y, z1);
  ctx.save(); ctx.globalAlpha = bound((CFG.zFar + 2 - z0) / 2.5, 0, 1) * (z0 < -1 ? bound(1 + (z0 + 1) / 1.5, 0, 1) : 1);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
  ctx.fillStyle = 'rgba(150,170,80,.1)'; ctx.fill(); ctx.strokeStyle = '#c7d070'; ctx.lineWidth = 1.6; ctx.shadowColor = 'rgba(199,208,112,.5)'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.setLineDash([7, 9]); ctx.lineWidth = 1.2; ctx.beginPath();           // the centreline and the threshold bars
  const m0 = worldToPixels(0, y, z0 + .4), m1 = worldToPixels(0, y, z1); ctx.moveTo(m0.x, m0.y); ctx.lineTo(m1.x, m1.y); ctx.stroke(); ctx.setLineDash([]);
  ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < 5; i++) { const x = -w * .8 + i * w * .4, p = worldToPixels(x, y, z0 + .15), q = worldToPixels(x, y, z0 + .75); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); }
  ctx.stroke(); ctx.restore();
 }
 /** Is the pointer on an enemy, as the gun sees it? (AUTO only; it lights the brackets of that enemy.) */
 function underPointer(e) {
  if (game.mode !== 'AUTO' || mode !== 'run' || (!inside && lastPointer !== 'touch')) return false;
  const c = pointerAt(e.z);
  return Math.hypot(c.x - e.x, c.y - e.y) <= e.r * CFG.shotRadius + c.tol;
 }
 /** A bonus ring: small, pale blue, dashed, a plus in the middle. Optional: nothing is lost if it goes by. */
 function drawBonus(ctx, b) {
  const gm = worldToPixels(b.x, b.y, b.z), alpha = fade(b.z);
  if (alpha <= .01) return;
  ctx.save(); ctx.globalAlpha = alpha;
  ringPath(ctx, gm, b.r, 24); ctx.fillStyle = 'rgba(120,225,205,.09)'; ctx.fill();
  ctx.shadowColor = 'rgba(120,225,205,.65)'; ctx.shadowBlur = 8; ctx.strokeStyle = '#8fe3d0'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
  ctx.shadowBlur = 0; const r = b.r * gm.s * .34; ctx.lineWidth = 1.3; ctx.beginPath();
  ctx.moveTo(gm.x - r, gm.y); ctx.lineTo(gm.x + r, gm.y); ctx.moveTo(gm.x, gm.y - r * .83); ctx.lineTo(gm.x, gm.y + r * .83); ctx.stroke();
  ctx.restore();
 }
 /** The wind as streaks that drift across the card the way it blows: more of them, longer and faster when it is stronger, and brighter in a gust. */
 function drawWind(ctx) {
  const W = core.windInfo(game);
  if (W.speed < .2 || mode === 'over') return;
  const n = Math.min(STREAKS.length, Math.round(5 + W.speed * 6)), dx = Math.cos(W.dir), dy = -Math.sin(W.dir), t = game.time, k = W.speed * .2;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 1; ctx.strokeStyle = '#d3d889';
  ctx.globalAlpha = Math.min(.4, (.07 + .04 * W.speed) * (W.gust ? 1.7 : 1));
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
   const s = STREAKS[i], x = (((s.u + t * dx * k * s.s) % 1) + 1) % 1 * state.w, y = state.h * .1 + (((s.v + t * dy * k * s.s) % 1) + 1) % 1 * state.h * .8, len = (8 + W.speed * 9) * s.s;
   ctx.moveTo(x, y); ctx.lineTo(x - dx * len, y - dy * len);
  }
  ctx.stroke(); ctx.restore();
 }
 /** The afterburner: streaks fly away from the vanishing point, longer and brighter the more of the speed is on. */
 function drawSpeedLines(ctx) {
  if (reduced || sprintView < .05) return;
  const cx = state.w / 2, cy = state.h * VP, R = Math.hypot(state.w, state.h) * .62, t = game.time;
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#f0e08a';
  for (const s of LINES) {
   const u = (s.p + t * (.9 + sprintView * 1.6) * (.6 + s.l * .5)) % 1, r0 = u * u * R, r1 = r0 + R * (.05 + .22 * sprintView) * s.l, c = Math.cos(s.a), si = Math.sin(s.a) * .8;
   ctx.globalAlpha = Math.min(1, u * 2.4) * (1 - u * .45) * .6 * sprintView; ctx.lineWidth = .8 + u * 1.7 * sprintView;
   ctx.beginPath(); ctx.moveTo(cx + c * r0, cy + si * r0); ctx.lineTo(cx + c * r1, cy + si * r1); ctx.stroke();
  }
  ctx.restore();
 }
 function drawBack(ctx) {
  if (!game) return;
  const F = game.finale;
  drawWind(ctx); drawSpeedLines(ctx);
  if (F) drawRunway(ctx, F);
  const things = [];
  for (const g of game.gates) if (g.z > .15) things.push([g.z, 'gate', g]);
  for (const o of game.obstacles) if (o.z > .15) things.push([o.z, 'pylon', o]);
  for (const b of game.bonuses) if (b.z > .15 && b.state === 'ahead') things.push([b.z, 'bonus', b]);
  for (const e of game.enemies) if (e.z > .15 && e.state === 'ahead') things.push([e.z, 'enemy', e]);
  things.sort((a, b) => b[0] - a[0]);
  const next = core.nextGate(game), ready = game.ult >= 100;
  for (const [, kind, obj] of things) { if (kind === 'gate') drawGate(ctx, obj, obj === next); else if (kind === 'pylon') drawPylon(ctx, obj); else if (kind === 'bonus') drawBonus(ctx, obj); else drawEnemy(ctx, obj, ready || underPointer(obj)); }
 }
 function drawFront(ctx) {
  if (!game) return;
  for (const gate of game.gates) if (gate.z <= .15) drawGate(ctx, gate, false);
  for (const b of game.bonuses) if (b.z <= .15 && b.state === 'ahead') drawBonus(ctx, b);
  for (const o of game.obstacles) if (o.z <= .15) drawPylon(ctx, o);
  for (const e of game.enemies) if (e.z <= .15 && e.state === 'ahead') drawEnemy(ctx, e, false);
  for (const r of rings) {
   const gm = worldToPixels(r.x, r.y, 0), k = r.age / r.life;
   ctx.save(); ctx.globalAlpha = (1 - k) * .8; ctx.strokeStyle = r.color; ctx.lineWidth = 2.2 * (1 - k) + .6;
   ringPath(ctx, gm, r.r * (1 + k * .7), 28); ctx.stroke(); ctx.restore();
  }
  for (const s of sparks) {
   const gm = worldToPixels(s.x, s.y, s.z), k = s.age / s.life;
   ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff2b0'; ctx.lineWidth = 1.4;
   ctx.beginPath(); ctx.moveTo(gm.x + s.dx, gm.y + s.dy); ctx.lineTo(gm.x + s.dx + s.vx * .03, gm.y + s.dy + s.vy * .03); ctx.stroke(); ctx.restore();
  }
  // the ULT and the gun: a beam from the aircraft to every target
  const me0 = worldToPixels(game.plane.x, game.plane.y, .6);
  for (const b of beams) {
   const to = worldToPixels(b.x, b.y, b.z), k = b.age / b.life;
   ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff2b0'; ctx.lineWidth = (b.thin ? 1.4 : 2.4) * (1 - k) + .8; ctx.shadowColor = 'rgba(255,242,176,.8)'; ctx.shadowBlur = 10;
   ctx.beginPath(); ctx.moveTo(me0.x, me0.y); ctx.lineTo(me0.x + (to.x - me0.x) * Math.min(1, k * 3), me0.y + (to.y - me0.y) * Math.min(1, k * 3)); ctx.stroke(); ctx.restore();
  }
  // the mark of the aircraft: bright when it is lined up with the next gate, orange when it is not
  if (mode !== 'over' && plane.scale < .9) {
   const me = worldToPixels(game.plane.x, game.plane.y, 0), next = core.nextGate(game);
   const lined = next ? Math.hypot(game.plane.x - next.x, game.plane.y - next.y) <= next.r : true;
   ctx.save(); ctx.strokeStyle = lined ? '#fff2b0' : 'rgba(224,150,100,.9)'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 1.4;
   ctx.shadowColor = lined ? 'rgba(255,242,176,.7)' : 'rgba(224,123,79,.5)'; ctx.shadowBlur = 8;
   ctx.beginPath(); ctx.arc(me.x, me.y, 8, 0, Math.PI * 2); ctx.stroke();
   ctx.beginPath(); ctx.arc(me.x, me.y, 1.8, 0, Math.PI * 2); ctx.fill();
   ctx.shadowBlur = 0; ctx.beginPath();
   for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.moveTo(me.x + dx * 11, me.y + dy * 11); ctx.lineTo(me.x + dx * 15, me.y + dy * 15); }
   ctx.stroke(); ctx.restore();
  }
 }
 // ---- the symbols of the pointer plane, drawn after the camera (they do not roll): the aim ring and the level line of the next gate, the footprints of what is coming,
 //      the aim of GUIDED and CRUISE, the gun sight of AUTO, and the texts that rise from the gates
 function drawAim(ctx) {
  const next = core.nextGate(game), P = game.plane, M = game.mode, me = worldToPixels(P.x, P.y, 0);
  if (next) {
   const a = worldToPixels(next.x, next.y, 0), d = Math.hypot(P.x - next.x, P.y - next.y), lined = d <= next.r, perfect = d <= next.r * CFG.perfect;
   const k = M === 'AUTO' || M === 'AUTOLAND' ? .55 : 1;
   ctx.save();
   // the level of the next gate, across the whole card, with a mark at each side and a tick at the level of the aircraft: put the two on one line
   ctx.lineWidth = 1; ctx.setLineDash([2, 8]); ctx.strokeStyle = `rgba(244,229,138,${(lined ? .4 : .2) * k})`;
   ctx.beginPath(); ctx.moveTo(0, a.y); ctx.lineTo(state.w, a.y); ctx.stroke(); ctx.setLineDash([]);
   ctx.fillStyle = `rgba(244,229,138,${.8 * k})`;
   ctx.beginPath(); ctx.moveTo(0, a.y - 5); ctx.lineTo(9, a.y); ctx.lineTo(0, a.y + 5); ctx.closePath(); ctx.moveTo(state.w, a.y - 5); ctx.lineTo(state.w - 9, a.y); ctx.lineTo(state.w, a.y + 5); ctx.closePath(); ctx.fill();
   ctx.strokeStyle = lined ? 'rgba(255,242,176,.95)' : 'rgba(224,150,100,.9)'; ctx.lineWidth = 2; ctx.beginPath();
   ctx.moveTo(0, me.y); ctx.lineTo(12, me.y); ctx.moveTo(state.w, me.y); ctx.lineTo(state.w - 12, me.y); ctx.stroke();
   if (M === 'CRUISE') { ctx.font = `700 10px ${MONO}`; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(244,229,138,.85)'; ctx.fillText('ALT HOLD', 16, a.y - 7); }
   // the rails of the tunnel: from the ring in the distance to its ring on the plane of the aircraft
   const far = worldToPixels(next.x, next.y, next.z);
   if (next.z > .6 && next.z < CFG.zFar && !next.approach) {
    ctx.setLineDash([2, 6]); ctx.lineWidth = 1; ctx.strokeStyle = `rgba(244,229,138,${.16 * k})`; ctx.beginPath();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
     const f = camToScreen(far.x + dx * next.r * far.s, far.y - dy * next.r * far.s * .83);
     ctx.moveTo(a.x + dx * next.r * a.s, a.y - dy * next.r * a.s * .83); ctx.lineTo(f[0], f[1]);
    }
    ctx.stroke(); ctx.setLineDash([]);
   }
   // the ring on the plane of the aircraft (dashed until the aircraft is inside it), the zone of a perfect pass, the way from the aircraft to the middle
   ctx.lineWidth = lined ? 2 : 1.5; ctx.setLineDash(lined ? [] : [6, 6]);
   ctx.strokeStyle = lined ? (perfect ? '#fff2b0' : '#f4e58a') : `rgba(244,229,138,${.6 * k})`; ctx.shadowColor = 'rgba(244,229,138,.6)'; ctx.shadowBlur = lined ? 10 : 0;
   ringPath(ctx, a, next.r, 40); ctx.stroke(); ctx.shadowBlur = 0;
   ctx.setLineDash([2, 3]); ctx.lineWidth = 1; ctx.strokeStyle = `rgba(255,242,176,${.4 * k})`; ringPath(ctx, a, next.r * CFG.perfect, 24); ctx.stroke();
   ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(a.x - 4, a.y); ctx.lineTo(a.x + 4, a.y); ctx.moveTo(a.x, a.y - 4); ctx.lineTo(a.x, a.y + 4); ctx.stroke();
   if (!lined && (M === 'MANUAL' || M === 'GUIDED' || M === 'CRUISE')) { ctx.setLineDash([3, 6]); ctx.strokeStyle = 'rgba(244,229,138,.3)'; ctx.beginPath(); ctx.moveTo(me.x, me.y); ctx.lineTo(a.x, a.y); ctx.stroke(); }
   ctx.restore();
  }
  if (M === 'GUIDED' || M === 'CRUISE') {
   // the point the aircraft is flying to (GUIDED: the pointer, CRUISE: the pointer sideways at the level of the gate)
   const t = worldToPixels(game.aim.x, game.aim.y, 0);
   ctx.save(); ctx.strokeStyle = 'rgba(244,229,138,.55)'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 5]);
   ctx.beginPath(); ctx.moveTo(me.x, me.y); ctx.lineTo(t.x, t.y); ctx.stroke(); ctx.setLineDash([]);
   ctx.strokeStyle = '#f4e58a'; ctx.shadowColor = 'rgba(244,229,138,.7)'; ctx.shadowBlur = 8; ctx.lineWidth = 1.5; ctx.beginPath();
   ctx.moveTo(t.x, t.y - 8); ctx.lineTo(t.x + 8, t.y); ctx.lineTo(t.x, t.y + 8); ctx.lineTo(t.x - 8, t.y); ctx.closePath(); ctx.stroke(); ctx.restore();
  }
 }
 /** Where the things that are coming will cross the plane of the aircraft: a red circle the size of the collision (the aircraft's centre must stay out of it). */
 function drawFootprints(ctx) {
  const speed = core.speedOf(game), reach = 4.4 + 1.6 * sprintView, drift = core.enemyDrift(game), push = game.wind.sx * CFG.ringWind;      // the faster it goes, the earlier the circles show
  for (const h of [...game.obstacles, ...game.enemies]) {
   if (h.state !== 'ahead' || h.z <= 0 || h.z > reach) continue;
   let x = h.x, y = h.y;
   if (h.kind === 'enemy') { const t = h.z / (speed * (1 + CFG.enemySpeed)); x = bound(h.x + (h.vx + drift.x) * t, -game.fieldX, game.fieldX); y = bound(h.y + (h.vy + drift.y) * t, -game.fieldY, game.fieldY); }
   else x = bound(h.x + push * h.z / speed, -game.fieldX, game.fieldX);                                     // a pylon is carried a little by the wind on the way
   const gm = worldToPixels(x, y, 0), k = bound(1 - h.z / reach, 0, 1);
   ctx.save(); ctx.globalAlpha = .3 + .6 * k; ctx.setLineDash([4, 5]); ctx.strokeStyle = '#e07b4f'; ctx.fillStyle = 'rgba(224,123,79,.08)'; ctx.lineWidth = 1.3;
   ringPath(ctx, gm, h.r + CFG.planeR, 28); ctx.fill(); ctx.stroke(); ctx.restore();
  }
 }
 function drawSight(ctx) {
  if (game.mode !== 'AUTO' || mode !== 'run' || (!inside && !(lastPointer === 'touch' && state.pointerId !== null))) return;
  const p = pointerScreen();
  let lock = false;
  for (const e of game.enemies) if (e.state === 'ahead' && e.z >= .35 && underPointer(e)) { lock = true; break; }
  ctx.save(); ctx.strokeStyle = lock ? '#fff2b0' : 'rgba(255,206,150,.85)'; ctx.lineWidth = lock ? 2 : 1.4; ctx.shadowColor = lock ? 'rgba(255,242,176,.8)' : 'rgba(224,123,79,.5)'; ctx.shadowBlur = lock ? 10 : 4;
  ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.moveTo(p.x + dx * 9, p.y + dy * 9); ctx.lineTo(p.x + dx * 21, p.y + dy * 21); } ctx.stroke();
  const me = worldToPixels(game.plane.x, game.plane.y, 0);      // the aircraft stays where it is under the rolling camera
  for (const t of tracers) {
   const k = t.age / t.life;
   ctx.globalAlpha = 1 - k; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(me.x, me.y); ctx.lineTo(t.x, t.y); ctx.stroke();
  }
  ctx.restore();
 }
 function drawPopups(ctx) {
  if (!popups.length) return;
  ctx.save(); ctx.textAlign = 'center'; ctx.font = `700 12px ${MONO}`;
  for (const p of popups) {
   const gm = worldToPixels(p.x, p.y, p.z || 0), k = p.age / p.life, at = camToScreen(gm.x, gm.y - gm.s * .9 - k * 34);
   ctx.globalAlpha = k < .15 ? k / .15 : 1 - Math.max(0, (k - .55) / .45);
   ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
   ctx.fillText(p.text, at[0], Math.max(at[1], 98));   // never under the score bar and the line in the middle
  }
  ctx.restore();
 }
 function drawOverlay(ctx) {
  if (!game || !engaged) return;
  if (mode !== 'over') { drawFootprints(ctx); drawAim(ctx); drawSight(ctx); }
  drawPopups(ctx);
 }
 // the demo shows this text in the middle of the card instead of its own; while nothing special happens the mark is hidden
 function status() {
  if (!engaged) return dwellText || null;
  if (mode === 'paused') return tx('paused');
  if (mode === 'count') return tx('ready');
  if (banner) return banner.text;
  if (gustInfo) { const arrow = arrowOf(gustInfo.dirX, gustInfo.dirY); return `${tx('gust')} ${gustInfo.stage === 'warn' ? arrow : arrow + arrow}`; }
  if (game && sprintView > .35 && game.sprint.phase === 'burn') return `${tx('sprint')} ×${game.sprint.mul.toFixed(1)}`;      // while the afterburner burns the middle of the card says so
  return null;
 }
 const centreMark = host.querySelector('.sim-center-mark');
 function showCentreMark() {
  const hide = engaged && !status();
  if (centreMark && hide !== markHidden) { markHidden = hide; centreMark.style.visibility = hide ? 'hidden' : ''; }
 }

 const layer = demo.layer = {
  active: false, plane, rollSign: -1, steer, update, drawBack, drawFront, status, cameraBegin, cameraEnd, cameraOwnsHorizon: true,
  get engaged() { return engaged; }, get touchBlocksBoost() { return engaged; }, get horizonShift() { return state.h * (VP - .5); },
  get sprint() { return engaged ? sprintView : 0; },                      // 0..1: how much of the afterburner is on (the demo shows it in the speed readout, the trail and the propeller)
  get music() { return audio; }, toggleMusic,
  onView(visible) { if (!visible) pause('view'); },
  // for tests and for the curious: the running game and the way in and out
  get game() { return game; }, get mode() { return mode; }, get camera() { return cam; }, get dwell() { return dwellHeld; }, get hovering() { return hovering; },
  start, exit, pause, resume, fireUlt, shoot: shootAtPointer, worldToPixels, pointerAt
 };
 paintStatic();
})();
