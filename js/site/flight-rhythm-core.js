/* A.T.L.A.S. mini-game, the "own track" flight: the rules. The beats of one or two pieces of music (from flight-beat.js) become a flight: a ring arrives on a beat,
   a manoeuvre (a barrel roll) and a shot at another aircraft come on the bar, between the two pieces the picture breaks up and the second one is flown inverted, and
   the last bars are the landing: the wheels touch on the last strong beat. Pure rules, no DOM; times are seconds of the music (0 = the first note of the first piece). */
((root, factory) => { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.AtlasRhythm = api; })(globalThis, () => {
 'use strict';
 const CFG = Object.freeze({
  zSpeed: 3.6,                  // depth units a second towards the aircraft
  lead: 2.3,                    // a ring is seen this long before its beat
  countIn: 3.2,                 // before the first note
  gapBeats: 4, gapMin: 1.6,     // between the two pieces (the picture breaks up)
  radius: .74, perfect: .5,     // a ring; the share of it that counts as the middle
  window: Object.freeze({ perfect: .07, good: .15 }),      // a press: how far from its beat (s)
  intro: 8,                     // beats of every piece without rings
  loud: .82,                    // rings on every beat only in the loudest parts (the share of beats quieter than this)
  cupFrom: .5,                  // below this accuracy the flight lands, but there is no cup
  every: 16, first: 8,          // a manoeuvre every so many beats, the first this many after the intro
  show: 4,                      // beats a manoeuvre is announced before its own
  clear: 1.5,                   // beats around a manoeuvre without rings
  landing: 16,                  // beats of the approach
  splitFrom: 96,                // one piece with at least this many beats is flown in two halves (the second inverted)
  reach: 1.9,                   // how far (world units a second) one ring may be from the last
  followK: 9, speedMax: 5.2,    // the aircraft follows the aim
  points: Object.freeze({ perfect: 100, good: 60, roll: 300, kill: 500, touchdown: 600 }),
  grades: Object.freeze({ gold: .9, silver: .75 })
 });
 const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
 function mulberry32(seed) { let a = seed >>> 0; return () => { a = a + 0x6d2b79f5 >>> 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
 const percentile = (list, p) => { const s = [...list].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };

 /** For one long piece: the beat where its second half begins (the break and the inverted flight come there): a bar start near the middle, after the quietest bar. */
 function halfOf(track) {
  const n = track.beats.length;
  if (n < CFG.splitFrom) return -1;
  let best = -1, quiet = Infinity;
  for (let i = Math.floor(n * .4); i <= Math.floor(n * .6); i++) {
   if ((((i - track.downbeat) % 4) + 4) % 4) continue;
   const before = (track.energy[i - 4] + track.energy[i - 3] + track.energy[i - 2] + track.energy[i - 1]) / 4 + Math.abs(i / n - .5) * .2;
   if (before < quiet) { quiet = before; best = i; }
  }
  return best;
 }

 /** The flight for the pieces of music: [{beats, energy, downbeat, period, soundEnd}] (one or two). Positions are -1..1 and scaled to the card when flown. */
 function buildChart(tracks, seed = 1) {
  if (!Array.isArray(tracks) || !tracks.length || tracks.length > 2 || tracks.some(t => !t || !t.beats || t.beats.length < CFG.intro + CFG.landing + 8)) throw new RangeError('tracks');
  const rnd = mulberry32(seed), events = [], starts = [], parts = [];
  let at = 0, kind = 0, middle = null;
  const path = { x: 0, y: 0, t: 0, phrase: 0, shape: 0, dir: 1 };
  const ring = (t, extra) => {
   // the next place of the path: a shape for every eight beats, never further than the reach allows
   const dt = Math.max(.25, t - path.t);
   if (path.phrase++ % 8 === 0) { path.shape = Math.floor(rnd() * 4); path.dir = rnd() < .5 ? -1 : 1; }
   const i = path.phrase % 8;
   let tx, ty;
   if (path.shape === 0) { tx = path.dir * Math.sin(i / 8 * Math.PI * 2) * .85; ty = Math.sin(i / 4 * Math.PI) * .35; }             // a wave
   else if (path.shape === 1) { tx = (i % 2 ? 1 : -1) * path.dir * .45; ty = path.y + (rnd() - .5) * .3; }                          // left and right
   else if (path.shape === 2) { tx = path.dir * (-.8 + i * .23); ty = path.dir * (.65 - i * .18); }                                  // a slope
   else { const a = path.dir * i / 8 * Math.PI * 2; tx = Math.cos(a) * .6; ty = Math.sin(a) * .7; }                                   // a circle
   const mx = CFG.reach * dt / 2.6, my = CFG.reach * dt / 1.5;
   path.x = clamp(path.x + clamp(tx - path.x, -mx, mx), -.9, .9); path.y = clamp(path.y + clamp(ty - path.y, -my, my), -.85, .85); path.t = t;
   events.push(Object.assign({ type: 'ring', t, x: path.x, y: path.y, r: CFG.radius }, extra));
  };
  tracks.forEach((track, k) => {
   if (k) at += Math.max(CFG.gapMin, CFG.gapBeats * track.period);
   const S = at, beats = track.beats.map(b => S + b), n = beats.length, last = k === tracks.length - 1;
   starts.push(S);
   const loudLine = percentile(track.energy, CFG.loud), mid = percentile(track.energy, .5);
   // the last strong beat is where the wheels touch; the approach takes the beats before it
   let touch = -1, from = n;
   if (last) {
    for (let i = n - 1; i >= CFG.intro + CFG.landing; i--) if (track.energy[i] >= .45 * mid && track.beats[i] <= track.soundEnd - .5) { touch = i; break; }
    if (touch < 0) touch = n - 1;
    from = Math.max(CFG.intro, touch - CFG.landing);
   }
   const limit = last ? from : n - 2;                            // rings end where the approach starts, or two beats before the end of the first piece
   const half = tracks.length === 1 ? halfOf(track) : -1;       // one long piece: the break in its middle, nothing to do for two beats before and four after
   if (half >= 0) middle = { half, t: beats[half], period: track.period };
   const free = i => half < 0 || i < half - 2 || i >= half + 4;
   // the manoeuvres: on a bar start, alternating a shot and a barrel roll
   const moves = [];
   let q = CFG.intro + CFG.first;
   while ((((q - track.downbeat) % 4) + 4) % 4) q++;
   for (; q <= limit - 3; q += CFG.every) if (free(q)) moves.push(q);
   for (const m of moves) {
    const type = kind++ % 2 ? 'roll' : 'kill', t = beats[m];
    if (type === 'kill') events.push({ type, t, taps: [t], x: (rnd() - .5) * 1.1, y: (rnd() - .5) * .7 + .1, from: t - CFG.show * track.period, track: k });
    else events.push({ type, t, taps: [t, t + track.period / 2], dir: rnd() < .5 ? -1 : 1, from: t - CFG.show * track.period, track: k });
   }
   for (let i = CFG.intro; i < limit; i++) {
    if (!free(i) || moves.some(m => i > m - CFG.clear - 1e-9 && i < m + CFG.clear + 1e-9)) continue;
    const loud = track.energy[i] >= loudLine;
    if (loud || (((i - track.downbeat) % 2) + 2) % 2 === 0) ring(beats[i], { track: k });
   }
   if (last) {
    // the approach: a ring every second beat, lower and smaller, to the middle of the runway; then the touchdown
    for (let i = from + 1; i < touch - 1; i += 2) {
     const p = (i - from) / (touch - from);
     events.push({ type: 'ring', t: beats[i], x: path.x * Math.pow(1 - p, 1.6), y: .5 - 1.35 * p, r: CFG.radius * (1.12 - .3 * p), approach: true, track: k });
    }
    events.push({ type: 'touchdown', t: beats[touch], taps: [beats[touch]], from: beats[from], track: k });
    parts.push({ landing: [beats[from], beats[touch]], end: Math.min(S + track.soundEnd + .6, beats[touch] + 5) });
   }
   at = S + track.soundEnd;
  });
  events.sort((a, b) => a.t - b.t);
  const tail = parts[parts.length - 1], two = tracks.length > 1;
  // the break: the silence between two pieces, or four beats around the middle of one long piece; after it the flight is inverted until four beats before the approach
  const gap = two ? [starts[1] - Math.max(CFG.gapMin, CFG.gapBeats * tracks[1].period), starts[1]] : middle ? [middle.t - 2 * middle.period, middle.t + 2 * middle.period] : null;
  const turn = two ? starts[1] - (gap[1] - gap[0]) / 2 : middle ? middle.t : 0;
  const inverted = gap ? [turn, tail.landing[0] - 4 * tracks[tracks.length - 1].period] : null;
  return Object.freeze({ events, starts, landing: tail.landing, glitch: gap, inverted: inverted && inverted[1] > inverted[0] ? inverted : null, end: tail.end,
   periods: tracks.map(t => t.period), beats: tracks.map((t, k) => t.beats.map(b => starts[k] + b)), downbeats: tracks.map(t => t.downbeat) });
 }

 /** A flight of that chart on a field of fieldX by fieldY world units. */
 function create(chart, field = { x: 2.6, y: 1.2 }) {
  return {
   chart, field: { x: field.x, y: field.y }, t: -CFG.countIn, phase: 'count', plane: { x: 0, y: 0, vx: 0, vy: 0 },
   marks: chart.events.map(() => null), hits: chart.events.map(e => (e.taps ? e.taps.map(() => null) : null)), cursor: 0,
   score: 0, combo: 0, maxCombo: 0, counts: { perfect: 0, good: 0, miss: 0 }, kills: 0, rolls: 0,
   inverted: false, glitch: false, landing: false, queue: [], lastCount: null
  };
 }
 function setField(g, x, y) { g.field.x = x; g.field.y = y; }
 const place = (g, ev) => ({ x: ev.x * g.field.x, y: ev.y * g.field.y });
 const emit = (g, e) => g.queue.push(e);
 const drain = g => g.queue.splice(0);
 const multiplier = g => 1 + Math.min(3, Math.floor(g.combo / 10)) * .5;

 /** One judged item: quality 'perfect' | 'good' | 'miss'. */
 function judge(g, i, quality) {
  const ev = g.chart.events[i];
  g.marks[i] = quality; g.counts[quality]++;
  let gained = 0;
  if (quality === 'miss') g.combo = 0;
  else {
   g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo);
   const base = ev.type === 'ring' ? CFG.points[quality] : Math.round(CFG.points[ev.type] * (quality === 'perfect' ? 1 : .6));
   gained = Math.round(base * multiplier(g)); g.score += gained;
   if (ev.type === 'kill') g.kills++;
   if (ev.type === 'roll') g.rolls++;
  }
  const at = ev.type === 'ring' ? place(g, ev) : ev.type === 'kill' ? place(g, ev) : { x: g.plane.x, y: g.plane.y };
  emit(g, { type: ev.type, quality, points: gained, combo: g.combo, x: at.x, y: at.y, index: i });
 }
 /** A manoeuvre with all its taps in (or its time over): perfect if all were in the middle of their beat, good if all came, else a miss. */
 function settleMove(g, i) {
  const taps = g.hits[i];
  judge(g, i, taps.every(q => q === 'perfect') ? 'perfect' : taps.every(q => q && q !== 'miss') ? 'good' : 'miss');
 }

 /** The press of the action (Space, click, tap) at the time t of the music. Returns what it hit, or null (a press that hit nothing changes nothing). */
 function press(g, t) {
  if (g.phase === 'done') return null;
  let best = null;
  for (let i = g.cursor; i < g.chart.events.length; i++) {
   const ev = g.chart.events[i];
   if (ev.t - CFG.window.good > t) break;
   if (!ev.taps || g.marks[i]) continue;
   ev.taps.forEach((tap, k) => {
    const d = Math.abs(t - tap);
    if (!g.hits[i][k] && d <= CFG.window.good && (!best || d < best.d)) best = { i, k, d };
   });
  }
  if (!best) return null;
  const ev = g.chart.events[best.i], quality = best.d <= CFG.window.perfect ? 'perfect' : 'good';
  g.hits[best.i][best.k] = quality;
  const result = { type: ev.type, tap: best.k, taps: ev.taps.length, quality, offset: t - ev.taps[best.k], index: best.i };
  emit(g, Object.assign({ type: 'tap' }, { move: ev.type, tap: best.k, taps: ev.taps.length, quality, dir: ev.dir || 0 }));
  if (g.hits[best.i].every(Boolean)) settleMove(g, best.i);
  return result;
 }

 /** The aircraft follows the aim; then everything whose time has come is judged. t: the time of the music now (as it is heard). */
 function step(g, t, dt, aim) {
  const P = g.plane, f = g.field;
  if (aim && dt > 0) {
   const ax = clamp(aim.x, -f.x, f.x), ay = clamp(aim.y, -f.y, f.y), k = 1 - Math.exp(-dt * CFG.followK);
   let dx = (ax - P.x) * k, dy = (ay - P.y) * k;
   const most = CFG.speedMax * dt, d = Math.hypot(dx, dy);
   if (d > most) { dx *= most / d; dy *= most / d; }
   P.vx = dx / dt; P.vy = dy / dt; P.x += dx; P.y += dy;
  }
  g.t = t;
  if (g.phase === 'done') return;
  if (g.phase === 'count') {
   const left = Math.ceil(-t / (CFG.countIn / 3));
   if (t >= 0) { g.phase = 'play'; emit(g, { type: 'start' }); } else if (left !== g.lastCount && left <= 3) { g.lastCount = left; emit(g, { type: 'count', left }); }
  }
  const C = g.chart;
  for (let i = g.cursor; i < C.events.length; i++) {
   const ev = C.events[i];
   if (ev.t > t) break;
   if (g.marks[i]) continue;
   if (ev.type === 'ring') {
    const at = place(g, ev), d = Math.hypot(P.x - at.x, P.y - at.y);
    judge(g, i, d <= ev.r * CFG.perfect ? 'perfect' : d <= ev.r ? 'good' : 'miss');
   } else if (t > ev.taps[ev.taps.length - 1] + CFG.window.good) { g.hits[i] = g.hits[i].map(q => q || 'miss'); settleMove(g, i); }
  }
  while (g.cursor < C.events.length && g.marks[g.cursor]) g.cursor++;
  const within = span => !!span && t >= span[0] && t < span[1];
  const glitch = within(C.glitch), inverted = within(C.inverted), landing = t >= C.landing[0];
  if (glitch !== g.glitch) { g.glitch = glitch; emit(g, { type: 'glitch', on: glitch }); }
  if (inverted !== g.inverted) { g.inverted = inverted; emit(g, { type: 'invert', on: inverted }); }
  if (landing && !g.landing) { g.landing = true; emit(g, { type: 'landing' }); }
  if (t >= C.end) { g.phase = 'done'; emit(g, { type: 'done', summary: summary(g) }); }
 }

 /** What the flight was worth: the accuracy decides the cup. */
 function summary(g) {
  const total = g.chart.events.length, c = g.counts, judged = c.perfect + c.good + c.miss;
  const accuracy = judged ? (c.perfect + .65 * c.good) / judged : 0;
  const count = type => g.chart.events.filter(e => e.type === type).length;
  const down = g.chart.events.findIndex(e => e.type === 'touchdown');
  return { accuracy, cup: accuracy >= CFG.grades.gold ? 'gold' : accuracy >= CFG.grades.silver ? 'silver' : accuracy >= CFG.cupFrom ? 'bronze' : null, score: g.score, perfect: c.perfect, good: c.good, miss: c.miss, total,
   maxCombo: g.maxCombo, rings: count('ring'), kills: g.kills, killsTotal: count('kill'), rolls: g.rolls, rollsTotal: count('roll'), landing: down >= 0 ? g.marks[down] : null };
 }
 /** The rings and the aircraft that are on the card now: {kind, x, y, z, r, mark, next, ...} from the far one to the near one. */
 function visible(g) {
  const t = g.t, out = [];
  let nextRing = -1;
  for (let i = g.cursor; i < g.chart.events.length; i++) if (g.chart.events[i].type === 'ring' && !g.marks[i]) { nextRing = i; break; }
  for (let i = 0; i < g.chart.events.length; i++) {
   const ev = g.chart.events[i];
   if (ev.type === 'ring') {
    const z = (ev.t - t) * CFG.zSpeed;
    if (ev.t - t > CFG.lead || t - ev.t > .3) continue;
    const at = place(g, ev);
    out.push({ kind: 'ring', x: at.x, y: at.y, z, r: ev.r, mark: g.marks[i], next: i === nextRing, approach: !!ev.approach, in: ev.t - t, index: i });
   } else if (ev.type === 'kill') {
    if (t < ev.from || t - ev.t > .9 || (g.marks[i] && g.marks[i] !== 'miss')) continue;
    const at = place(g, ev), z = 1.5 + (ev.t - t) * CFG.zSpeed * .75;
    out.push({ kind: 'enemy', x: at.x, y: at.y, z, r: .55, mark: g.marks[i], in: ev.t - t, index: i, vx: 0 });
   }
  }
  return out.sort((a, b) => b.z - a.z);
 }
 /** The manoeuvre that is announced now (from its first show to its end), or null. */
 function pending(g) {
  for (let i = g.cursor; i < g.chart.events.length; i++) {
   const ev = g.chart.events[i];
   if (!ev.taps || g.marks[i]) continue;
   if (g.t < ev.from - 1e-9) return null;
   return { type: ev.type, in: ev.t - g.t, taps: ev.taps.map((tap, k) => ({ in: tap - g.t, hit: g.hits[i][k] })), period: g.chart.periods[ev.track || 0], dir: ev.dir || 0, index: i };
  }
  return null;
 }
 /** The beat of the music that is playing: how long since the last one (s) and its number; null between pieces. */
 function beatNow(g) {
  const B = g.chart.beats;
  for (let k = B.length - 1; k >= 0; k--) {
   const list = B[k];
   if (g.t < list[0]) continue;
   let lo = 0, hi = list.length - 1;
   while (lo < hi) { const m = (lo + hi + 1) >> 1; if (list[m] <= g.t) lo = m; else hi = m - 1; }
   const since = g.t - list[lo];
   return since <= g.chart.periods[k] ? { since, index: lo, track: k, period: g.chart.periods[k] } : null;
  }
  return null;
 }
 /** A pilot who takes every ring and presses on the beat (for tests and the curious); late: how late (s). */
 function autopilot(g, late = 0) {
  const C = g.chart;
  for (let i = g.cursor; i < C.events.length; i++) {
   const ev = C.events[i];
   if (ev.taps) ev.taps.forEach((tap, k) => { if (!g.hits[i][k] && !g.marks[i] && g.t >= tap + late) press(g, tap + late); });
   if (ev.t - g.t > 1) break;
  }
  for (let i = g.cursor; i < C.events.length; i++) if (C.events[i].type === 'ring' && !g.marks[i]) return place(g, C.events[i]);
  return { x: 0, y: 0 };
 }
 return Object.freeze({ CFG, buildChart, create, setField, step, press, drain, summary, visible, pending, beatNow, multiplier, autopilot, mulberry32 });
});
