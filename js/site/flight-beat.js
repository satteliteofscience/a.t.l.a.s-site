/* A.T.L.A.S. mini-game, the "own track" flight: finds the beat of a piece of music the player opened from their own device (tempo, the first beat, the bars, how loud
   every beat is, where the sound ends). Pure arithmetic on the samples: no DOM, no network, nothing is stored or sent anywhere. Used by flight-rhythm.js. */
((root, factory) => { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.AtlasBeat = api; })(globalThis, () => {
 'use strict';
 const N = 1024, HOP = 256, TARGET = 22050;
 const ATTACK = .66;             // the share of the window by which a frame comes before the onset it shows (measured on clicks)
 const MIN_SECONDS = 8;
 const FASTEST = 175;            // BPM: a faster grid is taken at half its tempo

 /** The channels mixed into one and brought near 22 kHz (groups of samples averaged). */
 function mono(channels, rate) {
  const k = Math.max(1, Math.round(rate / TARGET)), len = Math.floor(channels[0].length / k), out = new Float32Array(len);
  for (const c of channels) for (let i = 0; i < len; i++) { let s = 0; for (let j = i * k; j < i * k + k; j++) s += c[j]; out[i] += s / (k * channels.length); }
  return { samples: out, rate: rate / k };
 }
 // an FFT of N points with its tables made once
 const REV = new Uint16Array(N), COS = new Float64Array(N / 2), SIN = new Float64Array(N / 2);
 for (let i = 0; i < N; i++) { let r = 0; for (let b = 1, x = i; b < N; b <<= 1, x >>= 1) r = (r << 1) | (x & 1); REV[i] = r; }
 for (let i = 0; i < N / 2; i++) { COS[i] = Math.cos(-2 * Math.PI * i / N); SIN[i] = Math.sin(-2 * Math.PI * i / N); }
 function fft(re, im) {
  for (let i = 0; i < N; i++) { const j = REV[i]; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= N; len <<= 1) {
   const half = len >> 1, step = N / len;
   for (let i = 0; i < N; i += len) for (let k = 0, w = 0; k < half; k++, w += step) {
    const a = i + k, z = a + half, tr = re[z] * COS[w] - im[z] * SIN[w], ti = re[z] * SIN[w] + im[z] * COS[w];
    re[z] = re[a] - tr; im[z] = im[a] - ti; re[a] += tr; im[a] += ti;
   }
  }
 }
 const percentile = (list, p) => { const s = Float64Array.from(list).sort(); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };

 /** The work in steps (a generator that yields its progress 0..1, so that the page stays alive); its return value is the result. */
 function* work(samples, rate) {
  const fps = rate / HOP, frames = Math.floor((samples.length - N) / HOP) + 1;
  if (!(frames > MIN_SECONDS * fps)) throw new RangeError('short');
  // ---- how much new sound every frame brings (the rise of the log spectrum), how much the low drums grow, and the loudness
  const hann = Float64Array.from({ length: N }, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / (N - 1)));
  const flux = new Float64Array(frames), low = new Float64Array(frames), rms = new Float64Array(frames), lowBin = Math.ceil(160 * N / rate);
  let prev = new Float64Array(N / 2), cur = new Float64Array(N / 2), lowWas = 0;
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let f = 0; f < frames; f++) {
   let e = 0;
   for (let i = 0, p = f * HOP; i < N; i++, p++) { const s = samples[p]; re[i] = s * hann[i]; im[i] = 0; e += s * s; }
   fft(re, im);
   let d = 0, lowNow = 0;
   for (let k = 1; k < N / 2; k++) { const m = re[k] * re[k] + im[k] * im[k]; if (k <= lowBin) lowNow += m; cur[k] = Math.log1p(20 * Math.sqrt(m)); const up = cur[k] - prev[k]; if (up > 0) d += up; }
   [prev, cur] = [cur, prev];
   lowNow = Math.sqrt(lowNow);
   if (f) { flux[f] = d; low[f] = Math.max(0, lowNow - lowWas); }
   lowWas = lowNow;
   rms[f] = Math.sqrt(e / N);
   if (f % 600 === 599) yield .75 * f / frames;
  }
  // an onset is what stands above the flux around it
  const peaky = src => {
   const out = new Float64Array(frames), w = Math.round(.15 * fps);
   let sum = 0;
   for (let f = 0; f < Math.min(frames, w); f++) sum += src[f];
   for (let f = 0; f < frames; f++) {
    if (f + w < frames) sum += src[f + w];
    if (f - w - 1 >= 0) sum -= src[f - w - 1];
    out[f] = Math.max(0, src[f] - sum / (Math.min(frames - 1, f + w) - Math.max(0, f - w) + 1));
   }
   return out;
  };
  const on = peaky(flux), onLow = peaky(low);
  const read = (a, p) => { const i = Math.floor(p), t = p - i; return i >= 0 && i + 1 < frames ? a[i] * (1 - t) + a[i + 1] * t : 0; };
  // the strong onsets (about three a second), to see how well a grid explains them
  const peaks = [];
  for (let f = 2; f < frames - 2; f++) if (on[f] > on[f - 1] && on[f] >= on[f + 1] && on[f] > on[f - 2] && on[f] >= on[f + 2]) peaks.push([on[f], (f * HOP + ATTACK * N) / rate]);
  peaks.sort((x, y) => y[0] - x[0]);
  const strong = peaks.slice(0, Math.max(1, Math.round(frames / fps * 3)));
  const share = (period, offset) => { const half = period / 2; return strong.filter(([, t]) => { const d = (((t - offset) % half) + half) % half; return Math.min(d, half - d) <= .035; }).length / strong.length; };
  const chanceOf = period => Math.min(1, .14 / period);      // 70 ms of every half beat would catch that share by chance
  // ---- the tempo: how well the onsets repeat after one, two and four beats, with a mild liking for the middle tempos; the four best go on
  const acf = lag => { let s = 0, c = 0; for (let f = 0; f + lag + 1 < frames; f++, c++) s += on[f] * read(on, f + lag); return c ? s / c : 0; };
  const liking = bpm => Math.exp(-.5 * (Math.log2(bpm / 130) / .9) ** 2);
  const tries = [];
  for (let bpm = 70, n = 0; bpm <= 200; bpm += .5, n++) {
   const L = 60 * fps / bpm;
   tries.push({ bpm, s: (acf(L) + .6 * acf(2 * L) + .4 * acf(4 * L)) * liking(bpm) });
   if (n % 40 === 39) yield .75 + .13 * n / 262;
  }
  tries.sort((x, y) => y.s - x.s);
  const top = [];
  for (const c of tries) { if (top.every(t => Math.abs(t.bpm - c.bpm) >= 4)) top.push(c); if (top.length === 4) break; }
  // ---- the grid: the tempo and the phase that put the most onset strength on the beats; of the candidates the one whose grid explains the onsets best
  const score = (bpm, phase, wide) => { const L = 60 * fps / bpm; let s = 0, c = 0; for (let p = phase; p < frames; p += L, c++) s += wide ? Math.max(read(on, p - 1), read(on, p), read(on, p + 1)) : read(on, p); return c ? s / c : 0; };
  const search = (centre, range, step) => {
   let g = { bpm: centre, phase: 0, v: -1 };
   for (let k = -Math.round(range / step); k <= Math.round(range / step); k++) {
    const bpm = centre + k * step, L = 60 * fps / bpm;
    for (let phase = 0; phase < L; phase++) { const v = score(bpm, phase, true); if (v > g.v) g = { bpm, phase, v }; }
   }
   return g;
  };
  let grid = null, mark = -Infinity;
  for (let i = 0; i < top.length; i++) {
   const g = search(top[i].bpm, 1, .05), period = 60 / g.bpm, c = chanceOf(period);
   const fits = (share(period, (g.phase * HOP + ATTACK * N) / rate) - c) / Math.max(.05, 1 - c) * Math.sqrt(liking(g.bpm));
   if (fits > mark) { mark = fits; grid = g; }
   yield .88 + .03 * (i + 1);
  }
  grid = search(grid.bpm, .1, .01);
  let fine = { bpm: grid.bpm, phase: grid.phase, v: -1 };
  for (let k = -10; k <= 10; k++) for (let d = -1.5; d <= 1.5; d += .125) { const bpm = grid.bpm + k * .002, v = score(bpm, grid.phase + d, false); if (v > fine.v) fine = { bpm, phase: grid.phase + d, v }; }
  const fitted = 60 / fine.bpm, steady = share(fitted, (fine.phase * HOP + ATTACK * N) / rate), chance = chanceOf(fitted);
  // a very fast grid is twice the beat a listener feels: every second beat is kept, the ones with the low drum (and the stronger onsets)
  if (fine.bpm > FASTEST) {
   const L = 60 * fps / fine.bpm, sum = [0, 0], mean = a2 => a2.reduce((s, v) => s + v, 0) / frames || 1, low1 = mean(onLow), all = mean(on);
   const peak = (a2, p) => Math.max(read(a2, p - 1), read(a2, p), read(a2, p + 1));
   for (let i = 0, p = fine.phase; p < frames; p += L, i++) sum[i % 2] += peak(onLow, p) / low1 + .3 * peak(on, p) / all;
   fine = { bpm: fine.bpm / 2, phase: fine.phase + (sum[1] > sum[0] ? L : 0) };
  }
  const bpm = Math.round(fine.bpm * 100) / 100, period = 60 / bpm, first = (fine.phase * HOP + ATTACK * N) / rate;
  // ---- the sound itself: where it begins and ends, the beats, how loud and how strong each one is, which of every four starts a bar
  let a = 0; while (a < frames && rms[a] < .004) a++;
  let z = frames - 1; while (z > a && rms[z] < .004) z--;
  const soundStart = a * HOP / rate, soundEnd = Math.min(samples.length / rate, (z * HOP + N) / rate);
  let offset = first - Math.floor(first / period) * period;
  while (offset < soundStart - period * .25) offset += period;
  const beats = [];
  for (let i = 0; offset + i * period < soundEnd - .05; i++) beats.push(offset + i * period);
  const frameOf = t => Math.round(t * fps - ATTACK * N / HOP);
  const around = (a2, t, w) => { let m = 0; for (let f = Math.max(0, frameOf(t) - w); f <= Math.min(frames - 1, frameOf(t) + w); f++) m = Math.max(m, a2[f]); return m; };
  const raw = beats.map(t => { let s = 0, c = 0; for (let f = Math.max(0, frameOf(t)); f < Math.min(frames, frameOf(t + period)); f++, c++) s += rms[f] * rms[f]; return c ? Math.sqrt(s / c) : 0; });
  const loud = percentile(raw, .95) || 1, energy = raw.map(v => Math.min(1, v / loud));
  const hits = beats.map(t => around(on, t, 3)), hard = percentile(hits, .95) || 1, strength = hits.map(v => Math.min(1, v / hard));
  const bar = [0, 0, 0, 0];
  beats.forEach((t, i) => { bar[i % 4] += around(onLow, t, 3); });
  const downbeat = bar.indexOf(Math.max(...bar));
  // how steady: the share of the strong onsets that fall near the half-beat grid that fitted, next to the share that would fall there by chance
  return { duration: samples.length / rate, bpm, period, offset, beats, energy, strength, downbeat, soundStart, soundEnd, steady, chance };
 }
 /** All at once (tests, short pieces). */
 function analyse(samples, rate) { const g = work(samples, rate); let s = g.next(); while (!s.done) s = g.next(); return s.value; }
 /** In steps: onProgress(0..1) after each, then pause() (a promise) lets the page breathe. */
 async function analyseSlowly(samples, rate, onProgress, pause) {
  const g = work(samples, rate); let s = g.next();
  while (!s.done) { if (onProgress) onProgress(s.value); await pause(); s = g.next(); }
  if (onProgress) onProgress(1);
  return s.value;
 }
 return Object.freeze({ mono, analyse, analyseSlowly, ATTACK, MIN_SECONDS });
});
