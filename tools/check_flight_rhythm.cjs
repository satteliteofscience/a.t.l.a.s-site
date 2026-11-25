'use strict';
/* The mini-game's flight to the player's own music: the beat finder (on click tracks of known tempo), the chart (rings on the beat, manoeuvres on the bar, the break
   and the inverted second piece, the landing on the last strong beat), the judging and the cup, the card layer in a stub DOM with a fake Web Audio (files, beat,
   flight, pause, cup, back to the other game), and the wiring on index.html with the texts in three languages. Nothing is read from the network. */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const ROOT = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const B = require('../js/site/flight-beat.js'), R = require('../js/site/flight-rhythm-core.js'), C = R.CFG;

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
  assert.ok(a.beats.every((t, i) => !i || Math.abs(t - a.beats[i - 1] - a.period) < 1e-9) && a.beats.length > 45 / a.period - 3, 'a beat every period to the end');
 }
 const fast = found(200, .25, 45), off = ((fast.offset - .25) % .3 + .45) % .3 - .15;
 assert.ok(Math.abs(fast.bpm - 100) < .05 && Math.abs(off) < .006 && Math.abs((fast.offset - .25) / .6 - Math.round((fast.offset - .25) / .6)) < .02 && fast.steady > .95, 'a grid of 200 is felt as 100, on the stronger beats: ' + fast.bpm + ' ' + fast.offset.toFixed(3));
 const quiet = found(120, .3, 50, 40);
 assert.ok(quiet.energy[quiet.beats.findIndex(t => t > 44)] < .2 && quiet.energy[quiet.beats.findIndex(t => t > 20)] > .5, 'the loudness of the beats tells the quiet end');
 assert.throws(() => B.analyse(new Float32Array(22050 * 4), 22050), /short/, 'a few seconds are too little');
}
(async () => {
 const m = B.mono([clicks(128, .5, 20)], 44100), seen = [];
 const slow = await B.analyseSlowly(m.samples, m.rate, p => seen.push(p), () => Promise.resolve()), fast = B.analyse(m.samples, m.rate);
 assert.deepEqual([slow.bpm, slow.offset, slow.downbeat], [fast.bpm, fast.offset, fast.downbeat], 'in steps or at once: the same');
 assert.ok(seen.length > 5 && seen.every((p, i) => p >= (seen[i - 1] || 0) && p <= 1) && seen[seen.length - 1] === 1, 'the progress goes up to the end: ' + seen.length);

 // ---------------------------------------------------------------- the chart
 const part = (bpm, seconds, offset = .4, downbeat = 1) => {
  const period = 60 / bpm, beats = []; for (let t = offset; t < seconds - .3; t += period) beats.push(t);
  return { beats, period, downbeat, soundEnd: seconds, energy: beats.map((t, i) => (t > seconds - 6 ? .15 : (i >> 4) % 3 === 2 ? .95 : .55 + (i % 4) * .02)) };
 };
 const one = part(130, 88), two = part(138, 167), chart = R.buildChart([one, two], 5);
 assert.ok(chart.events.every((e, i) => !i || e.t >= chart.events[i - 1].t), 'the events in the order of time');
 const rings = chart.events.filter(e => e.type === 'ring'), moves = chart.events.filter(e => e.type === 'kill' || e.type === 'roll'), down = chart.events.filter(e => e.type === 'touchdown');
 assert.ok(rings.length > 150 && moves.length >= 14 && down.length === 1, `rings ${rings.length}, manoeuvres ${moves.length}, one touchdown`);
 assert.deepEqual(moves.map(m => m.type), moves.map((_, i) => (i % 2 ? 'roll' : 'kill')), 'a shot and a barrel roll take turns');
 const beatIndex = (e, k) => Math.round((e.t - chart.starts[k] - [one, two][k].beats[0]) / [one, two][k].period);
 for (const m of moves) { const t = [one, two][m.track]; assert.equal((((beatIndex(m, m.track) - t.downbeat) % 4) + 4) % 4, 0, 'a manoeuvre starts a bar');
  assert.ok(m.taps.length === (m.type === 'roll' ? 2 : 1) && (m.type !== 'roll' || Math.abs(m.taps[1] - m.taps[0] - t.period / 2) < 1e-9), 'a roll is two taps, a half beat apart');
  assert.ok(rings.every(r => Math.abs(r.t - m.t) > (C.clear - .01) * t.period), 'no rings right around a manoeuvre');
  assert.ok(m.from < m.t && m.t - m.from > 3.9 * t.period, 'announced four beats before'); }
 for (const k of [0, 1]) { const t = [one, two][k]; assert.ok(rings.filter(r => r.track === k).every(r => beatIndex(r, k) >= C.intro && Math.abs(r.t - chart.starts[k] - t.beats[0] - beatIndex(r, k) * t.period) < 1e-9), 'every ring on a beat, none in the intro of piece ' + (k + 1)); }
 assert.ok(rings.filter(r => !r.approach).every(r => Math.abs(r.x) <= .9 && Math.abs(r.y) <= .85), 'the rings stay on the card');
 for (let i = 1; i < rings.length; i++) { const a = rings[i - 1], b = rings[i]; if (a.approach || b.approach || a.track !== b.track) continue;
  const speed = Math.hypot((b.x - a.x) * 2.6, (b.y - a.y) * 1.4) / (b.t - a.t); assert.ok(speed < C.speedMax * .65, 'every next ring can be reached: ' + speed.toFixed(2)); }
 const loud = rings.filter(r => r.track === 0 && !r.approach), gaps = new Set(loud.slice(1).map((r, i) => Math.round((r.t - loud[i].t) / one.period)));
 assert.ok(gaps.has(1) && gaps.has(2), 'rings on every beat in the loud parts, else every second one');
 assert.ok(rings.filter(r => r.track === 0).every(r => r.t < one.soundEnd - 1.9 * one.period + chart.starts[0]), 'the first piece ends without rings in its last two beats');
 assert.ok(chart.glitch && chart.glitch[1] === chart.starts[1] && chart.glitch[1] - chart.glitch[0] >= C.gapMin - 1e-9 && chart.glitch[0] >= one.soundEnd - 1e-9, 'the break between the pieces');
 assert.ok(chart.inverted && chart.inverted[0] > chart.glitch[0] && chart.inverted[0] < chart.glitch[1] && Math.abs(chart.inverted[1] - (chart.landing[0] - 4 * two.period)) < 1e-9, 'inverted from the break to four beats before the approach');
 const touch = down[0], strongLast = Math.max(...two.beats.map((t, i) => (two.energy[i] > .4 && t <= two.soundEnd - .5 ? t : 0)));
 assert.ok(Math.abs(touch.t - chart.starts[1] - strongLast) < 1e-9 && chart.landing[1] === touch.t && chart.end > touch.t && chart.end <= touch.t + 5 + 1e-9, 'the wheels touch on the last strong beat');
 const approach = rings.filter(r => r.approach);
 assert.ok(approach.length >= 5 && approach.every((r, i) => !i || (r.y < approach[i - 1].y && r.r < approach[i - 1].r)) && approach[approach.length - 1].y < -.5, 'the approach goes down to the runway');
 assert.ok(rings.every(r => r.approach || r.t < chart.landing[0] + 1e-9 || r.track === 0), 'only the approach in the last bars');
 const solo = R.buildChart([part(120, 40)], 2);
 assert.ok(!solo.glitch && !solo.inverted && solo.events.some(e => e.type === 'touchdown'), 'one short piece: no break, no inversion, still a landing');
 {
  const long = part(128, 150), c = R.buildChart([long], 3), mid = c.glitch[0] + 2 * long.period, index = Math.round((mid - long.beats[0]) / long.period);
  assert.ok(index >= long.beats.length * .4 - 1 && index <= long.beats.length * .6 + 1 && (((index - long.downbeat) % 4) + 4) % 4 === 0, 'one long piece breaks at a bar near its middle: beat ' + index + ' of ' + long.beats.length);
  assert.ok(Math.abs(c.glitch[1] - c.glitch[0] - 4 * long.period) < 1e-9 && Math.abs(c.inverted[0] - mid) < 1e-9 && Math.abs(c.inverted[1] - (c.landing[0] - 4 * long.period)) < 1e-9, 'four beats of static, then inverted until four beats before the approach');
  assert.ok(c.events.every(e => e.t < c.glitch[0] - 1e-9 || e.t >= c.glitch[1] - 1e-9), 'nothing to do while the picture breaks');
  assert.ok(c.events.filter(e => e.t > c.glitch[1] && e.t < c.inverted[1]).length > 20, 'the second half is a flight of its own');
 }
 assert.throws(() => R.buildChart([]), /tracks/);assert.throws(() => R.buildChart([part(130, 10)]), /tracks/);assert.throws(() => R.buildChart([one, two, one]), /tracks/);
 assert.deepEqual(R.buildChart([one, two], 5).events, chart.events, 'the same seed gives the same chart');

 // ---------------------------------------------------------------- flying and judging
 const fly = (late, aimless) => { const g = R.create(chart); let t = -C.countIn; const events = []; while (g.phase !== 'done' && t < chart.end + 1) { g.t = t; const aim = aimless ? { x: g.field.x, y: g.field.y } : R.autopilot(g, late || 0); R.step(g, t, 1 / 60, aim); events.push(...R.drain(g)); t += 1 / 60; } return { g, s: R.summary(g), events }; };
 const ace = fly(0);
 assert.ok(ace.g.phase === 'done' && ace.s.accuracy === 1 && ace.s.cup === 'gold' && ace.s.kills === ace.s.killsTotal && ace.s.rolls === ace.s.rollsTotal && ace.s.landing === 'perfect', 'a pilot on every beat: the gold cup ' + JSON.stringify(ace.s));
 for (const type of ['start', 'invert', 'glitch', 'landing', 'done']) assert.ok(ace.events.some(e => e.type === type), 'the flight says ' + type);
 assert.deepEqual(ace.events.filter(e => e.type === 'invert').map(e => e.on), [true, false]);
 const late = fly(.1); assert.ok(late.s.kills === late.s.killsTotal && late.s.landing === 'good' && late.s.accuracy > .85 && late.s.accuracy < 1, '100 ms late: good, not perfect ' + late.s.accuracy);
 const tooLate = fly(.2); assert.ok(tooLate.s.kills === 0 && tooLate.s.rolls === 0 && tooLate.s.landing === 'miss', '200 ms late misses every press');
 const lost = fly(.2, true); assert.ok(lost.s.accuracy < C.cupFrom && lost.s.cup === null && lost.g.phase === 'done', 'nobody at the stick: it lands, there is no cup ' + lost.s.accuracy);
 {
  const g = R.create(chart), i = g.chart.events.findIndex(e => e.type === 'kill'), t = g.chart.events[i].t;
  assert.equal(R.press(g, t - .2), null, 'too early: nothing');assert.equal(g.marks[i], null);
  assert.equal(R.press(g, t + .1).quality, 'good');assert.equal(g.marks[i], 'good', 'one shot settles it');assert.equal(R.press(g, t), null, 'and only once');
  const h = R.create(chart), j = h.chart.events.findIndex(e => e.type === 'roll'), [t1, t2] = h.chart.events[j].taps;
  assert.equal(R.press(h, t1 + .03).quality, 'perfect');assert.equal(h.marks[j], null, 'a roll waits for its second tap');assert.equal(R.press(h, t2 - .05).tap, 1);assert.equal(h.marks[j], 'perfect');assert.equal(h.rolls, 1);
  const k = R.create(chart);R.press(k, t1);R.step(k, t2 + C.window.good + .01, 1 / 60, null);assert.equal(k.marks[j], 'miss', 'half a roll is a miss');
  const m2 = R.create(chart);m2.combo = 25;assert.equal(R.multiplier(m2), 2);m2.combo = 99;assert.equal(R.multiplier(m2), 2.5, 'the score grows with the combo, up to a limit');
  R.setField(m2, 2, 1);const v = R.create(chart, { x: 2, y: 1 });v.t = chart.events[0].t - 1;assert.ok(R.visible(v).every(o => Math.abs(o.x) <= 2 && Math.abs(o.y) <= 1), 'positions follow the field of the card');
  assert.ok(R.visible(v).some(o => o.next), 'the next ring is marked');
  const pend = R.create(chart);pend.t = chart.events.find(e => e.taps).from + .01;assert.ok(R.pending(pend) && R.pending(pend).type === 'kill', 'a manoeuvre is announced');
  pend.t = chart.starts[0] + one.beats[10] + .05;const b = R.beatNow(pend);assert.ok(b.index === 10 && Math.abs(b.since - .05) < 1e-9, 'the beat that plays');
 }

 // ---------------------------------------------------------------- the card layer in a stub DOM with a fake Web Audio
 class El {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.kids = []; this.classes = new Set(); this.handlers = {}; this.attrs = {}; this.style = {}; this.dataset = {}; this.parent = null; this.hidden = false; this._text = ''; this.value = ''; this.files = null; this.focused = 0; this.disabled = false; }
  set className(v) { this.classes = new Set(String(v).split(/\s+/).filter(Boolean)); } get className() { return [...this.classes].join(' '); }
  get classList() { const c = this.classes; return { add: (...a) => a.forEach(x => c.add(x)), remove: (...a) => a.forEach(x => c.delete(x)), contains: x => c.has(x), toggle: (x, on) => { const want = on === undefined ? !c.has(x) : !!on; if (want) c.add(x); else c.delete(x); return want; } }; }
  get children() { return this.kids; }
  set textContent(v) { this.kids = []; this._text = String(v); } get textContent() { return this._text + this.kids.map(k => k.textContent).join(''); }
  append(...n) { for (const k of n) { k.parent = this; this.kids.push(k); } } prepend(...n) { for (const k of n.reverse()) { k.parent = this; this.kids.unshift(k); } }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = v; } getAttribute(k) { return this.attrs[k]; }
  addEventListener(t, f, capture) { (this.handlers[t] = this.handlers[t] || [])[capture ? 'unshift' : 'push'](f); }
  fire(t, ev = {}) { const e = Object.assign({ target: this, stopped: false, prevented: false, stopPropagation() { this.stopped = true; }, stopImmediatePropagation() { this.stopped = true; }, preventDefault() { this.prevented = true; } }, ev); for (const f of this.handlers[t] || []) { f(e); if (e.immediate) break; } return e; }
  contains(n) { for (let x = n; x; x = x.parent) if (x === this) return true; return false; }
  closest() { return null; }
  find(p) { for (const k of this.kids) { if (p(k)) return k; const d = k.find(p); if (d) return d; } return null; }
  querySelector(sel) { return this.find(n => sel.slice(1).split('.').every(c => n.classes.has(c))); }
  focus() { this.focused++; }
 }
 const root = new El('div'); root.className = 'hero-display';
 const actions = new El('div'); actions.className = 'scope-actions'; const host = new El('div'); host.className = 'scope-main flight-playground';
 const mark = new El('div'); mark.className = 'sim-center-mark'; host.append(mark); root.append(actions, host); host.closest = () => root;
 const state = { w: 520, h: 350, targetX: 0, targetY: 0, pointerId: null, roll: 0, rollVel: 0, aimRoll: 0, aimPitch: 0, aimYaw: 0, boosted: false };
 const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
 let released = 0;
 const base = { engaged: false, kit: { worldToPixels: (x, y, z) => { const s = 1 / (1 + z * .42), base = Math.min(state.w * .155, state.h * .21), cy = state.h * .51, vy = state.h * .3; return { x: state.w / 2 + x * base * s, y: vy + (cy - y * .83 * base - vy) * s, s: base * s }; },
  demoOffset: (x, y) => [x, y], pointerPlane: () => { const base = Math.min(state.w * .155, state.h * .21), px = (state.targetX + 1) / 2 * state.w, py = (1 - state.targetY) / 2 * state.h; return { x: (px - state.w / 2) / base, y: (state.h * .51 - py) / (.83 * base) }; },
  fieldSize: () => ({ x: 2.6, y: 1.3, gateY: 1.1 }), release: () => { released++; } } };
 const demo = { host, state, bound: clamp, layer: base, woke: 0, wake() { this.woke++; } };
 let now = 5000; const perf = { now: () => now };
 const contexts = [];
 const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
 class AC {
  constructor() { this.frozen = null; this.base = now / 1000 - 10; this.destination = {}; this.outputLatency = 0; this.sampleRate = 44100; this.started = []; this.state = 'running'; contexts.push(this); }
  get currentTime() { return this.frozen === null ? now / 1000 - this.base : this.frozen; }
  suspend() { if (this.frozen === null) this.frozen = this.currentTime; this.state = 'suspended'; return Promise.resolve(); }
  resume() { if (this.frozen !== null) { this.base = now / 1000 - this.frozen; this.frozen = null; } this.state = 'running'; return Promise.resolve(); }
  createGain() { return { gain: param(), connect() {} }; } createBiquadFilter() { return { type: '', frequency: param(), connect() {} }; }
  createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
  createBufferSource() { const ctx = this; return { buffer: null, at: null, off: null, connect() {}, disconnect() {}, start(t) { this.at = t; ctx.started.push(this); }, stop(t) { this.off = t === undefined ? ctx.currentTime : t; } }; }
  decodeAudioData(data) { const kind = new Uint8Array(data)[0]; if (kind === 9) return Promise.reject(new Error('bad data')); const x = clicks(kind === 1 ? 130 : 138, .3, kind === 3 ? 12 : kind === 4 ? 60 : 40); return Promise.resolve({ numberOfChannels: 1, sampleRate: 44100, kind, getChannelData: () => x }); }
 }
 const saved = {};
 const storage = { getItem: k => saved[k] ?? null, setItem: (k, v) => { saved[k] = v; } };
 const docHandlers = {}, winHandlers = {}, timers = [];
 const document = { createElement: t => new El(t), createElementNS: (_, t) => new El(t), documentElement: { lang: 'ru' }, hidden: false, addEventListener: (t, f) => (docHandlers[t] = docHandlers[t] || []).push(f) };
 const window = { AtlasFlightDemo: demo, AtlasRhythm: R, AtlasBeat: B, AtlasI18n: { lang: 'ru' }, AudioContext: AC, localStorage: storage, matchMedia: () => ({ matches: false }), addEventListener: (t, f) => (winHandlers[t] = winHandlers[t] || []).push(f) };
 const layerSrc = read('js/site/flight-rhythm.js');
 const fetched = []; let onSite = false;      // the main track: not on the site at first
 const fetch = url => { fetched.push(url); return Promise.resolve(onSite ? { ok: true, arrayBuffer: () => Promise.resolve(Uint8Array.from([4, 0, 0, 0]).buffer) } : { ok: false, status: 404 }); };
 vm.runInNewContext(layerSrc, { window, document, performance: perf, fetch, setTimeout: (f, ms) => { if (ms) timers.push(f); else setImmediate(f); }, Uint8Array, Float32Array, Promise, Math: Object.assign(Object.create(Math), { random: () => .37 }), String, Number, Array, Object, JSON, Error });
 const settle = async ready => { for (let i = 0; i < 2000 && !ready(); i++) await new Promise(r => setImmediate(r)); };
 const A = window.AtlasFlightRhythm, find = c => root.find(n => n.classes.has(c));
 assert.ok(A, 'the layer is there');
 const openBtn = find('game-own'), panel = find('rhythm-panel'), actBtn = find('rhythm-act'), overlay = find('rhythm-overlay'), hud = find('rhythm-hud');
 assert.ok(openBtn && openBtn.parent === actions && actions.kids[0] === openBtn && openBtn.textContent === '♫ РИТМ' && panel.hidden && hud.hidden && overlay.hidden && !fetched.length, 'only a button in the header until it is used (nothing is loaded before)');
 const inputs = []; (function walk(n) { if (n.tagName === 'INPUT' && n.type === 'file') inputs.push(n); n.kids.forEach(walk); })(panel);
 assert.ok(inputs.length === 2 && /audio\/\*/.test(inputs[0].accept), 'two files can be chosen');
 base.engaged = true; openBtn.fire('click'); assert.equal(demo.layer, base, 'not while the other game runs'); base.engaged = false;
 openBtn.fire('click');
 assert.ok(A.mode === 'setup' && demo.layer === A.layer && !panel.hidden && released >= 1 && host.classes.has('is-rhythm') && root.classes.has('is-rhythm') && openBtn.textContent === '■ ВЫХОД', 'the panel opens and the card is this flight\'s');
 const flyButton = panel.find(n => n.classes.has('game-btn') && n.classes.has('is-primary')), switchButton = panel.find(n => n.classes.has('is-switch'));
 const mainBox = panel.find(n => n.classes.has('is-main')), ownBox = panel.find(n => n.classes.has('rhythm-files'));
 // first the main track of the site, as a view of its own; here it is missing
 await settle(() => /ещё не добавлен/.test(panel.textContent));
 assert.ok(A.source === 'main' && !mainBox.hidden && ownBox.hidden && fetched.length === 1 && fetched[0] === 'assets/music/pixelated-dreamscape.mp3' && A.MAIN.src === fetched[0], 'the panel opens on the main track and asks the site for it');
 assert.ok(/Pixelated Dreamscape Journey · StockTune/.test(mainBox.textContent) && /ещё не добавлен/.test(mainBox.textContent) && flyButton.disabled && switchButton.textContent === 'СВОИ ТРЕКИ', 'a missing main track says so and leaves the own files');
 const ev = panel.fire('keydown', { key: ' ' }), pd = panel.fire('pointerdown', {}); assert.ok(ev.stopped && pd.stopped, 'the demo gets no keys or pointer from the panel');
 switchButton.fire('click'); assert.ok(A.source === 'own' && mainBox.hidden && !ownBox.hidden && switchButton.textContent === 'ОСНОВНОЙ' && flyButton.disabled, 'the choice of own files is a separate view');
 onSite = true; switchButton.fire('click'); await settle(() => A.mainTrack);
 assert.ok(A.source === 'main' && A.mainTrack && fetched.length === 2 && !flyButton.disabled && /1:00 · 138 уд\/мин/.test(mainBox.textContent), 'now on the site: read once and ready: ' + mainBox.textContent);
 switchButton.fire('click'); switchButton.fire('click'); await new Promise(r => setImmediate(r)); assert.equal(fetched.length, 2, 'not fetched again');
 {
  flyButton.fire('click'); const c = A.chart; assert.ok(A.mode === 'flight' && c.starts.length === 1 && c.glitch && c.inverted && contexts[0].started.filter(s => s.buffer && s.buffer.kind === 4).length === 1, 'the main track: one piece, its second half inverted');
  host.fire('keydown', { key: 'Escape' }); assert.equal(A.mode, 'off'); contexts[0].started.length = 0;
  openBtn.fire('click'); assert.ok(A.mode === 'setup' && A.source === 'main' && !flyButton.disabled, 'it stays ready');
 }
 switchButton.fire('click'); assert.equal(A.source, 'own'); released = 1;
 const file = (kind, name) => ({ name, arrayBuffer: () => Promise.resolve(Uint8Array.from(kind === 'bwav' ? [66, 87, 65, 86, 0] : [kind, 0, 0, 0]).buffer) });
 assert.equal(await A.load(0, file('bwav', 'a.bwav')), false);assert.ok(/BWAV/.test(panel.textContent) && /WAV/.test(panel.textContent), 'BWAV: the panel asks for a WAV copy');
 assert.equal(await A.load(0, file(9, 'x.bin')), false);assert.ok(/не удалось прочитать/.test(panel.textContent));
 assert.equal(await A.load(0, file(3, 'tiny.mp3')), false);assert.ok(/слишком короткий/.test(panel.textContent));
 inputs[0].files = [file(1, 'one.wav')]; inputs[0].fire('change'); assert.equal(await A.load(1, file(2, 'two.mp3')), true);
 for (let i = 0; i < 400 && !A.tracks[0]; i++) await new Promise(r => setImmediate(r));
 assert.ok(A.tracks[0] && A.tracks[1] && Math.abs(A.tracks[0].analysis.bpm - 130) < .1 && Math.abs(A.tracks[1].analysis.bpm - 138) < .1, 'both files are read and their beat found');
 assert.ok(/0:40 · 130 уд\/мин · one\.wav/.test(panel.textContent) && /138 уд\/мин · two\.mp3/.test(panel.textContent), 'the panel shows length, tempo and name: ' + panel.textContent);
 const delay = panel.find(n => n.tagName === 'INPUT' && n.type === 'range'); delay.value = '120'; delay.fire('input'); assert.ok(saved['atlas-rhythm-latency'] === '120' && /\+120 МС/.test(panel.textContent), 'the sound delay is kept');
 delay.value = '0'; delay.fire('input');
 // the flight
 const ctx2d = new Proxy({}, { get: (t, k) => (k === 'canvas' ? { width: 1040, height: 700 } : k in t ? t[k] : () => ({ addColorStop() {} })), set: (t, k, v) => { t[k] = v; return true; } });
 panel.find(n => n.classes.has('is-primary')).fire('click');
 const audio = contexts[0], music = () => audio.started.filter(s => s.buffer && s.buffer.kind);      // (the shots make short sounds of their own)
 assert.ok(A.mode === 'flight' && panel.hidden && !hud.hidden && contexts.length === 1 && music().length === 2, 'it flies, both pieces are scheduled on the one audio clock');
 const t0 = music()[0].at - A.chart.starts[0];
 assert.ok(Math.abs(t0 - audio.currentTime - C.countIn) < 1e-6 && Math.abs(music()[1].at - t0 - A.chart.starts[1]) < 1e-6 && music()[0].off <= music()[1].at + 1e-9, 'at their times of the chart, after the count-in');
 const frame = (dt = 1 / 120) => { now += dt * 1000; A.layer.steer(dt); A.layer.update(dt); A.layer.cameraBegin(ctx2d); A.layer.drawBack(ctx2d); A.layer.drawFront(ctx2d); A.layer.cameraEnd(ctx2d); };
 const pilot = () => {
  const g = A.game; let next = null; for (let i = g.cursor; i < g.chart.events.length; i++) if (g.chart.events[i].type === 'ring' && !g.marks[i]) { next = g.chart.events[i]; break; }
  if (next) { const base = Math.min(state.w * .155, state.h * .21), px = state.w / 2 + next.x * g.field.x * base, py = state.h * .51 - next.y * g.field.y * .83 * base; state.targetX = px / state.w * 2 - 1; state.targetY = 1 - py / state.h * 2; host.fire('pointermove', { pointerType: 'mouse' }); }
  const t = A.time; for (let i = g.cursor; i < g.chart.events.length; i++) { const e = g.chart.events[i]; if (e.t - t > .5) break; if (e.taps && !g.marks[i]) e.taps.forEach((tap, k) => { if (!g.hits[i][k] && t >= tap - .004) host.fire('keydown', { key: ' ', code: 'Space', timeStamp: now }); }); }
 };
 const statuses = new Set(); let inverted = 0, glitch = 0, rolled = 0, paused = false;
 assert.ok(/ПРИГОТОВЬСЯ 3/.test(A.layer.status()) || (frame(), /ПРИГОТОВЬСЯ/.test(A.layer.status())), 'a count before the music');
 for (let i = 0; i < 120 * 120 && A.mode !== 'cup'; i++) {
  frame(); if (A.mode !== 'flight') continue; pilot();
  const g = A.game, s = A.layer.status(); if (s) statuses.add(s);
  if (g.inverted) { inverted++; if (inverted === 240) assert.ok(Math.abs(Math.abs(A.layer.horizonRoll) - 180) < 3 && Math.abs(state.aimRoll - 180) <= 41 && Math.abs(A.layer.turnBank) <= 40, 'inverted: the horizon turned over, the aircraft on its back, the heading follows the turn only'); }
  if (g.glitch) glitch++;
  if (Math.abs(state.roll) > 200 && !g.inverted) rolled++;
  if (!paused && g.t > 20) {
   paused = true; document.hidden = true; for (const h of docHandlers.visibilitychange) h(); document.hidden = false;
   const at = g.t; assert.ok(A.mode === 'paused' && audio.state === 'suspended' && !overlay.hidden && /ПАУЗА/.test(overlay.textContent), 'a hidden tab pauses the music and the flight');
   for (let k = 0; k < 240; k++) frame(); assert.equal(A.game.t, at, 'the time stands still');
   overlay.fire('click'); assert.ok(A.mode === 'flight' && audio.state === 'running' && overlay.hidden, 'a press goes on'); frame(); assert.ok(Math.abs(A.time - at) < .05, 'from the same place in the music: ' + (A.time - at));
  }
 }
 assert.equal(A.mode, 'cup', 'the flight ends with the cup');
 for (const text of ['ОГОНЬ В БИТ', 'БОЧКА ×2', 'ПОМЕХИ', 'ПЕРЕВЁРНУТЫЙ ПОЛЁТ', 'ЗАХОД НА ПОСАДКУ', 'КАСАНИЕ В БИТ']) assert.ok(statuses.has(text), 'the middle of the card says ' + text + ': ' + [...statuses].join(' | '));
 assert.ok(inverted > 200 && glitch > 100 && rolled > 10, `inverted ${inverted}, static ${glitch}, rolling frames ${rolled}`);
 const card = overlay.find(n => n.classes.has('rhythm-card'));
 assert.ok(card.find(n => n.classes.has('rhythm-trophy') && n.classes.has('is-gold')) && /КУБОК ОФИЦИАЛЬНОГО ПИЛОТА A\.T\.L\.A\.S\./.test(card.textContent) && /ЗОЛОТО/.test(card.textContent) && /100%/.test(card.textContent), 'the gold cup of the official A.T.L.A.S. pilot: ' + card.textContent);
 assert.ok(saved['atlas-rhythm-best'] === '1' && audio.started.every(s => s.off !== null) && actBtn.parent.hidden, 'the best is kept, the music stopped');
 for (const lang of ['uk', 'en']) { window.AtlasI18n.lang = lang; for (const h of winHandlers['atlas:languagechange']) h(); assert.ok(overlay.textContent.includes(A.TEXT[lang].cup) && openBtn.textContent === A.TEXT[lang].exit, 'the cup in ' + lang); }
 window.AtlasI18n.lang = 'ru';
 // again, the keys, the touch, the exit
 overlay.find(n => n.classes.has('is-primary') && n.tagName === 'BUTTON').fire('click'); assert.ok(A.mode === 'flight' && overlay.hidden && music().length === 4, 'again: a new flight ' + music().length);
 host.fire('keydown', { key: 'p', code: 'KeyP' }); assert.equal(A.mode, 'paused'); host.fire('keydown', { key: ' ', code: 'Space' }); assert.equal(A.mode, 'flight', 'P pauses, Space goes on');
 const before = state.pointerId; for (let k = 0; k < 5; k++) frame();
 const one1 = host.fire('pointerdown', { pointerType: 'touch', pointerId: 1, button: 0 }), two2 = host.fire('pointerdown', { pointerType: 'touch', pointerId: 2, button: 0 });
 assert.ok(!one1.stopped && two2.stopped, 'a second finger acts and does not take the steering'); host.fire('pointerup', { pointerType: 'touch', pointerId: 2 }); host.fire('pointerup', { pointerType: 'touch', pointerId: 1 });
 const act = actBtn.parent.fire('pointerdown', {}); assert.ok(act.stopped, 'the button of the beat does not start the demo\'s boost');
 const up = host.fire('keyup', { key: ' ', code: 'Space', target: actBtn }); assert.ok(up.prevented, 'Space on that button makes no second press');
 const outside = (key, code) => { const e = { key, code, target: { closest: () => null }, prevented: false, preventDefault() { this.prevented = true; } }; for (const h of docHandlers.keydown) h(e); return e; };
 assert.ok(outside(' ', 'Space').prevented && outside('ArrowLeft', 'ArrowLeft').prevented, 'the keys reach the flight from the page'); outside('Escape', 'Escape');
 assert.ok(A.mode === 'off' && demo.layer === base && panel.hidden && hud.hidden && overlay.hidden && !host.classes.has('is-rhythm') && !root.classes.has('is-rhythm') && released === 2 && openBtn.textContent === '♫ РИТМ', 'Esc gives the card back to the other game');
 openBtn.fire('click'); assert.ok(A.mode === 'setup' && A.source === 'own' && A.tracks[0] && A.tracks[1] && A.mainTrack, 'the files and the view stay chosen for the next time'); openBtn.fire('click'); assert.equal(A.mode, 'off');

 // ---------------------------------------------------------------- the page, the code and the texts
 const page = read('index.html'), css = read('css/flight-game.css'), gameSrc = read('js/site/flight-game.js'), demoSrc = read('js/site/flight-demo.js');
 const scripts = [...page.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]), at = n => scripts.findIndex(s => s.startsWith(n));
 assert.ok(at('js/site/flight-game.js') >= 0 && at('js/site/flight-beat.js?v=flight-game-') > at('js/site/flight-game.js') && at('js/site/flight-rhythm-core.js?v=flight-game-') > at('js/site/flight-beat.js') && at('js/site/flight-rhythm.js?v=flight-game-') > at('js/site/flight-rhythm-core.js'), 'the other game, then the beat finder, the rules, the layer');
 const tags = [...page.matchAll(/flight-(?:demo|game|game-core|beat|rhythm|rhythm-core)\.(?:js|css)\?v=(flight-game-\d+)/g)].map(m => m[1]);
 assert.ok(tags.length === 7 && new Set(tags).size === 1, 'one cache tag for every file of the game: ' + tags);
 assert.ok(/kit: Object\.freeze\(\{ worldToPixels, demoOffset, pointerPlane, fieldSize, release\(\)/.test(gameSrc) && /if \(demo\.layer !== layer\) return;/.test(gameSrc), 'the other game shares its view and leaves the keys alone while this one has the card');
 assert.ok(demoSrc.includes('lay.horizonRoll||0') && demoSrc.includes('hooks.layer.turnBank'), 'the demo turns the horizon over and keeps the heading');
 const rules = read('js/site/flight-rhythm-core.js') + read('js/site/flight-beat.js'), all = layerSrc + rules;
 assert.ok(!/XMLHttpRequest|WebSocket|sendBeacon|\bimport\(|importScripts|innerHTML|insertAdjacentHTML|eval\(|new Function|navigator\.(usb|serial)/.test(all) && !/fetch\(/.test(rules), 'nothing is sent anywhere, no HTML from strings');
 assert.ok((layerSrc.match(/fetch\(/g) || []).length === 1 && layerSrc.includes('fetch(MAIN.src)') && /src: 'assets\/music\/[\w-]+\.mp3'/.test(layerSrc), 'the only request is for the main track of the site: the files of the player stay on the device');
 assert.ok(!/new Audio\(|<audio|https?:\/\/(?!www\.w3\.org)/.test(all), 'no music from another site');
 {
  const file = path.join(ROOT, A.MAIN.src);
  assert.ok(fs.existsSync(file), 'the main track is on the site: ' + A.MAIN.src);
  const bytes = fs.readFileSync(file);
  assert.ok(bytes.length > 100000 && bytes.length < 10e6 && (bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)), 'an MP3 of a reasonable size: ' + bytes.length);
 }
 assert.deepEqual(Object.keys(saved).sort(), ['atlas-rhythm-best', 'atlas-rhythm-latency'], 'only the delay and the best accuracy are stored');
 const keys = Object.keys(A.TEXT.ru).sort();
 for (const lang of ['uk', 'en']) assert.deepEqual(Object.keys(A.TEXT[lang]).sort(), keys, 'the same texts in ' + lang);
 for (const lang of ['ru', 'uk', 'en']) for (const k of keys) assert.ok(typeof A.TEXT[lang][k] === 'string' && A.TEXT[lang][k].length, k + ' in ' + lang);
 assert.ok(!/[ыэёъ]/i.test(Object.values(A.TEXT.uk).join(' ')), 'no Russian-only letters in the Ukrainian texts');
 for (const sel of ['.game-own', '.hero-display.is-game .game-own', '.rhythm-panel', '.rhythm-files', '.rhythm-slot', '.is-main', '.rhythm-main-title', '.rhythm-pick', '.rhythm-slot-info', '.is-error', '.rhythm-delay', '.rhythm-hud', '.rhythm-progress', '.rhythm-act', '.is-armed', '.rhythm-overlay', '.rhythm-card', '.rhythm-trophy', '.rhythm-grade', '.rhythm-stats', '.is-gold', '.is-silver', '.is-bronze', '.is-narrow .rhythm-card', '.is-flying'])
  assert.ok(css.includes(sel), 'style ' + sel);
 console.log('PASS: rhythm flight — beat finder (tempo, first beat within 6 ms, bars, quiet end), chart (rings on the beat, shots and barrel rolls on the bar, the break, the inverted second piece or half, the landing on the last strong beat), judging and the cups, card layer in a stub DOM with fake Web Audio (the main track of the site and the own files as separate views, a missing file, delay, flight, pause, cup, again, touch, keys, back to the other game), page wiring and ru/uk/en texts.');
})().catch(error => { console.error(error); process.exit(1); });
