'use strict';
/* The mini-game's own tracks: the beat finder (on click tracks of known tempo, a doubled grid taken at the felt tempo, the bars, a quiet end), the panel on the card
   in a stub DOM with a fake audio decoder (files, errors, the beat, the race with them, closing, keys), the wiring on index.html and the texts in three languages.
   Nothing is read from the network. */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const ROOT = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const B = require('../js/site/flight-beat.js'), core = require('../js/site/flight-game-core.js');

/** A click track: a low drum on the first of every bar, a snap on the other beats, a soft tick between. */
function clicks(bpm, offset, seconds, rate = 44100, quietFrom = seconds) {
 const x = new Float32Array(Math.round(seconds * rate)); let seed = 7;
 const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x3fffffff - 1;
 for (let i = 0, t = offset; t < seconds; i++, t = offset + i * 60 / bpm) {
  const kick = i % 4 === 0, v = t >= quietFrom ? .05 : 1;
  for (let n = 0; n < rate * .09; n++) { const k = Math.round(t * rate) + n; if (k >= x.length) break; x[k] += v * Math.exp(-n / (rate * .02)) * (kick ? .8 * Math.sin(2 * Math.PI * 70 * n / rate) : .35 * rnd()); }
  const half = t + 30 / bpm;
  for (let n = 0; n < rate * .02; n++) { const k = Math.round(half * rate) + n; if (k >= x.length) break; x[k] += v * Math.exp(-n / (rate * .004)) * .12 * rnd(); }
 }
 return x;
}
const found = (bpm, offset, seconds, quietFrom) => { const m = B.mono([clicks(bpm, offset, seconds, 44100, quietFrom)], 44100); return B.analyse(m.samples, m.rate); };

// ---------------------------------------------------------------- the beat finder
{
 const stereo = B.mono([Float32Array.from([1, 1, 0, 0]), Float32Array.from([0, 0, 1, 1])], 44100);
 assert.deepEqual([...stereo.samples], [.5, .5], 'two channels become one at half the rate');assert.equal(stereo.rate, 22050);
 for (const [bpm, offset] of [[130, .453], [138, .354], [95, .2], [174, .05], [117.3, 1.37]]) {
  const a = found(bpm, offset, 45), err = ((a.offset - offset) % a.period + a.period * 1.5) % a.period - a.period / 2;
  assert.ok(Math.abs(a.bpm - bpm) < .05, `the tempo of a ${bpm} BPM track: ${a.bpm}`);
  assert.ok(Math.abs(err) < .006, `the first beat of a ${bpm} BPM track within 6 ms: ${(err * 1000).toFixed(1)} ms`);
  assert.ok(a.steady > .95 && a.steady - a.chance > .5, 'a steady track is seen as steady');
  const bar = a.beats.findIndex((t, i) => i % 4 === a.downbeat), k = Math.round((a.beats[bar] - offset) / a.period);
  assert.equal(((k % 4) + 4) % 4, 0, 'the bar starts on the low drum at ' + bpm);
 }
 const fast = found(200, .25, 45), off = ((fast.offset - .25) % .3 + .45) % .3 - .15;
 assert.ok(Math.abs(fast.bpm - 100) < .05 && Math.abs(off) < .006 && Math.abs((fast.offset - .25) / .6 - Math.round((fast.offset - .25) / .6)) < .02 && fast.steady > .95, 'a grid of 200 is felt as 100, on the stronger beats: ' + fast.bpm + ' ' + fast.offset.toFixed(3));
 const quiet = found(120, .3, 50, 40);
 assert.ok(quiet.energy[quiet.beats.findIndex(t => t > 44)] < .2 && quiet.energy[quiet.beats.findIndex(t => t > 20)] > .5, 'the loudness of the beats tells the quiet end');
 assert.throws(() => B.analyse(new Float32Array(22050 * 4), 22050), /short/, 'a few seconds are too little');
}
(async () => {
 const m = B.mono([clicks(128, .5, 20)], 44100), seen = [];
 const slow = await B.analyseSlowly(m.samples, m.rate, p => seen.push(p), () => Promise.resolve()), whole = B.analyse(m.samples, m.rate);
 assert.deepEqual([slow.bpm, slow.offset, slow.downbeat], [whole.bpm, whole.offset, whole.downbeat], 'in steps or at once: the same');
 assert.ok(seen.length > 5 && seen.every((p, i) => p >= (seen[i - 1] || 0) && p <= 1) && seen[seen.length - 1] === 1, 'the progress goes up to the end: ' + seen.length);

 // ---------------------------------------------------------------- the panel in a stub DOM with a fake decoder
 class El {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.kids = []; this.classes = new Set(); this.handlers = {}; this.attrs = {}; this.style = {}; this.parent = null; this.hidden = false; this._text = ''; this.value = ''; this.files = null; this.focused = 0; this.disabled = false; }
  set className(v) { this.classes = new Set(String(v).split(/\s+/).filter(Boolean)); } get className() { return [...this.classes].join(' '); }
  get classList() { const c = this.classes; return { add: (...a) => a.forEach(x => c.add(x)), remove: (...a) => a.forEach(x => c.delete(x)), contains: x => c.has(x), toggle: (x, on) => { const want = on === undefined ? !c.has(x) : !!on; if (want) c.add(x); else c.delete(x); return want; } }; }
  set textContent(v) { this.kids = []; this._text = String(v); } get textContent() { return this._text + this.kids.map(k => k.textContent).join(''); }
  append(...n) { for (const k of n) { k.parent = this; this.kids.push(k); } } prepend(...n) { for (const k of n.reverse()) { k.parent = this; this.kids.unshift(k); } }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  addEventListener(t, f) { (this.handlers[t] = this.handlers[t] || []).push(f); }
  fire(t, ev = {}) { const e = Object.assign({ target: this, stopped: false, prevented: false, stopPropagation() { this.stopped = true; }, preventDefault() { this.prevented = true; } }, ev); for (const f of this.handlers[t] || []) f(e); return e; }
  closest() { return null; }
  find(p) { for (const k of this.kids) { if (p(k)) return k; const d = k.find(p); if (d) return d; } return null; }
  querySelector(sel) { return this.find(n => n.classes.has(sel.slice(1))); }
  focus() { this.focused++; }
 }
 const root = new El('div'); root.className = 'hero-display';
 const actions = new El('div'); actions.className = 'scope-actions'; const host = new El('div'); host.className = 'scope-main flight-playground';
 root.append(actions, host); host.closest = () => root;
 const state = { w: 360, h: 300 };
 const blocks = [], starts = [];
 const base = { engaged: false, block: on => blocks.push(on), start: choice => { starts.push(choice); return true; } };
 const demo = { host, state, bound: (v, lo, hi) => Math.max(lo, Math.min(hi, v)), layer: base, woke: 0, wake() { this.woke++; } };
 let decoded = 0;
 class Offline { decodeAudioData(data) { decoded++; const kind = new Uint8Array(data)[0]; if (kind === 9) return Promise.reject(new Error('bad data')); const x = clicks(kind === 1 ? 130 : 138, .3, kind === 3 ? 12 : 40); return Promise.resolve({ numberOfChannels: 1, sampleRate: 44100, kind, getChannelData: () => x }); } }
 const saved = {}, winHandlers = {};
 const document = { createElement: t => new El(t), documentElement: { lang: 'ru' } };
 const window = { AtlasFlightDemo: demo, AtlasBeat: B, AtlasI18n: { lang: 'ru' }, OfflineAudioContext: Offline, localStorage: { getItem: k => saved[k] ?? null, setItem: (k, v) => { saved[k] = v; } }, matchMedia: () => ({ matches: false }), addEventListener: (t, f) => (winHandlers[t] = winHandlers[t] || []).push(f) };
 const src = read('js/site/flight-tracks.js');
 vm.runInNewContext(src, { window, document, setTimeout: f => setImmediate(f), Uint8Array, Float32Array, Promise, Math, String, Number, Array, Object, JSON, Error });
 const A = window.AtlasFlightTracks, find = c => root.find(n => n.classes.has(c));
 const openBtn = find('game-own'), panel = find('rhythm-panel');
 assert.ok(A && openBtn.parent === actions && actions.kids[0] === openBtn && openBtn.textContent === '♫ СВОИ ТРЕКИ' && panel.hidden && !blocks.length, 'a button in the header, the panel closed');
 base.engaged = true; openBtn.fire('click'); assert.ok(panel.hidden, 'not while the game runs'); base.engaged = false;
 openBtn.fire('click');
 assert.ok(!panel.hidden && blocks.at(-1) === true && host.classes.has('is-rhythm') && root.classes.has('is-rhythm') && host.classes.has('is-narrow') && openBtn.textContent === '■ ЗАКРЫТЬ', 'the panel opens: the game does not start by itself behind it');
 const fly = panel.find(n => n.classes.has('is-primary'));
 assert.ok(fly.disabled && fly.textContent === 'В ГОНКУ', 'nothing to race to yet');
 assert.ok(panel.fire('keydown', { key: ' ' }).stopped && panel.fire('pointerdown', {}).stopped && !panel.fire('keydown', { key: 'Escape' }).stopped, 'keys and pointer stay in the panel, Escape goes on');
 const file = (kind, name) => ({ name, arrayBuffer: () => Promise.resolve(Uint8Array.from(kind === 'bwav' ? [66, 87, 65, 86, 0] : [kind, 0, 0, 0]).buffer) });
 assert.equal(await A.load(0, file('bwav', 'a.bwav')), false);assert.ok(/BWAV/.test(panel.textContent) && decoded === 0, 'BWAV: asks for a WAV copy');
 assert.equal(await A.load(0, file(9, 'x.bin')), false);assert.ok(/не удалось прочитать/.test(panel.textContent));
 assert.equal(await A.load(0, file(3, 'tiny.mp3')), false);assert.ok(/слишком короткий/.test(panel.textContent));
 const inputs = []; (function walk(n) { if (n.tagName === 'INPUT' && n.type === 'file') inputs.push(n); n.kids.forEach(walk); })(panel);
 assert.ok(inputs.length === 2 && /audio\/\*/.test(inputs[0].accept), 'two files can be chosen');
 inputs[0].files = [file(1, 'one.wav')]; inputs[0].fire('change'); assert.equal(await A.load(1, file(2, 'two.mp3')), true);
 for (let i = 0; i < 400 && !A.tracks[0]; i++) await new Promise(r => setImmediate(r));
 assert.ok(A.tracks[0] && A.tracks[1] && /0:40 · 130 уд\/мин · one\.wav/.test(panel.textContent) && /138 уд\/мин · two\.mp3/.test(panel.textContent) && !fly.disabled, 'both read: length, tempo, name ' + panel.textContent);
 for (const t of A.tracks) { const m2 = t.music, bars = (m2.end - m2.offset) / (4 * m2.beat); assert.ok(Math.abs(bars - Math.round(bars)) < 1e-6 && bars >= 8 && m2.end <= 40 && m2.offset < 4 * m2.beat + .01, 'the music of the race: a bar start, whole bars ' + JSON.stringify(m2)); }
 const delay = panel.find(n => n.tagName === 'INPUT' && n.type === 'range'); delay.value = '120'; delay.fire('input'); assert.ok(saved['atlas-rhythm-latency'] === '120' && /\+120 МС/.test(panel.textContent), 'the sound delay is kept');
 for (const lang of ['uk', 'en']) { window.AtlasI18n.lang = lang; for (const h of winHandlers['atlas:languagechange']) h(); assert.ok(panel.textContent.includes(A.TEXT[lang].title) && openBtn.textContent === A.TEXT[lang].shut, 'the panel in ' + lang); }
 window.AtlasI18n.lang = 'ru'; for (const h of winHandlers['atlas:languagechange']) h();
 fly.fire('click');
 assert.ok(starts.length === 1 && panel.hidden && blocks.at(-1) === false && !host.classes.has('is-rhythm') && !host.classes.has('is-narrow') && openBtn.textContent === '♫ СВОИ ТРЕКИ', 'the race starts, the card is the game\'s again');
 const choice = starts[0];
 assert.ok(choice.music.length === 2 && choice.buffers.length === 2 && choice.buffers[0].kind === 1 && choice.buffers[1].kind === 2 && Math.abs(choice.music[0].beat - 60 / 130) < 1e-3 && Math.abs(choice.music[1].beat - 60 / 138) < 1e-3, 'with both pieces in their order');
 const g = core.create(3, { music: choice.music }); assert.equal(g.music, choice.music); assert.ok(core.segmentAt(g.music, choice.music[0].end + 1).i === 1, 'the rules fly them in turn');
 openBtn.fire('click'); assert.ok(A.tracks[0] && A.tracks[1], 'the files stay chosen'); host.fire('keydown', { key: 'Escape' }); assert.ok(panel.hidden && blocks.at(-1) === false, 'Escape closes');

 // ---------------------------------------------------------------- the page, the code and the texts
 const page = read('index.html'), css = read('css/flight-game.css');
 const scripts = [...page.matchAll(/<script src="([^"]+)"/g)].map(m2 => m2[1]), at = n => scripts.findIndex(s => s.startsWith(n));
 assert.ok(at('js/site/flight-game.js') >= 0 && at('js/site/flight-beat.js?v=flight-game-') > at('js/site/flight-game.js') && at('js/site/flight-tracks.js?v=flight-game-') > at('js/site/flight-beat.js'), 'the game, then the beat finder, then the panel');
 assert.ok(!/flight-rhythm/.test(page) && !fs.existsSync(path.join(ROOT, 'js/site/flight-rhythm.js')), 'the separate rhythm mode is gone');
 const all = src + read('js/site/flight-beat.js');
 assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|\bimport\(|importScripts|innerHTML|insertAdjacentHTML|eval\(|new Function|navigator\.(usb|serial)|https?:\/\//.test(all), 'the files of the player stay on the device: nothing is sent anywhere, no HTML from strings');
 assert.deepEqual(Object.keys(saved).sort(), ['atlas-rhythm-latency'], 'only the delay is stored');
 const keys = Object.keys(A.TEXT.ru).sort();
 for (const lang of ['uk', 'en']) assert.deepEqual(Object.keys(A.TEXT[lang]).sort(), keys, 'the same texts in ' + lang);
 for (const lang of ['ru', 'uk', 'en']) for (const k of keys) assert.ok(typeof A.TEXT[lang][k] === 'string' && A.TEXT[lang][k].length, k + ' in ' + lang);
 assert.ok(!/[ыэёъ]/i.test(Object.values(A.TEXT.uk).join(' ')), 'no Russian-only letters in the Ukrainian texts');
 for (const sel of ['.game-own', '.hero-display.is-game .game-own', '.rhythm-panel', '.rhythm-slot', '.rhythm-pick', '.rhythm-slot-info', '.is-error', '.rhythm-delay', '.rhythm-buttons', '.is-narrow .rhythm-panel', '.game-place', '.game-route s', '.game-beat', '.is-cup', '.game-trophy'])
  assert.ok(css.includes(sel), 'style ' + sel);
 console.log('PASS: own tracks — beat finder (tempo, first beat within 6 ms, bars, doubled grids at the felt tempo, quiet end), the panel in a stub DOM with a fake decoder (files, errors, beat, the music of the race, delay, three languages, the race with both pieces, keys, closing), page wiring and ru/uk/en texts.');
})().catch(error => { console.error(error); process.exit(1); });
