/* AI-assisted. A.T.L.A.S. DroneCAN (UAVCAN v0) subset for the configurator: CAN transfers, a few DSDL types, node list, node parameters.
   Pure logic: no DOM, no MAVLink. The bridge hands CAN frames in (onFrame) and takes CAN frames out (sendFrame). Checked against frames made by pydronecan (tools/check_dronecan.cjs). */
(() => {
  'use strict';
  // data type signatures of DroneCAN (DSDL of ArduPilot 4.7.3); the transfer CRC of a multi-frame transfer starts from the signature
  const SIG = Object.freeze({
    NodeStatus: '0f0868d0c1a7c6f1', GetNodeInfo: 'ee468a8121c46a9e', GetSet: 'a7b622f939d1a4d5', ExecuteOpcode: '3b131ac5eb69d2cd', RestartNode: '569e05394a3017f0',
    RawAirData: 'c77df38ba122f5da', Fix2: 'ca41e7000f37435f', BatteryInfo: '249c26548a711966'
  });
  const TYPES = Object.freeze({
    NodeStatus: {service: false, id: 341}, RawAirData: {service: false, id: 1027}, Fix2: {service: false, id: 1063}, BatteryInfo: {service: false, id: 1092},
    GetNodeInfo: {service: true, id: 1}, GetSet: {service: true, id: 11}, ExecuteOpcode: {service: true, id: 10}, RestartNode: {service: true, id: 5}
  });
  const EFF = 0x80000000;
  const RESTART_MAGIC = 0xACCE551B1E;

  function crcByte(crc, b) {
    crc ^= (b & 255) << 8;
    for (let i = 0; i < 8; i++) crc = (crc & 0x8000) ? (((crc << 1) ^ 0x1021) & 0xffff) : ((crc << 1) & 0xffff);
    return crc;
  }
  function crc16(crc, bytes) { for (const b of bytes) crc = crcByte(crc, b); return crc; }
  function baseCrc(hex) { let crc = 0xffff; for (let i = 14; i >= 0; i -= 2) crc = crcByte(crc, parseInt(hex.slice(i, i + 2), 16)); return crc; }   // the signature goes in least significant byte first
  const BASE = {}; for (const k of Object.keys(SIG)) BASE[k] = baseCrc(SIG[k]);
  const BY_ID = new Map(); for (const [k, t] of Object.entries(TYPES)) BY_ID.set((t.service ? 's' : 'm') + t.id, k);

  /* ---------- bit streams: bytes of a value little endian, bits most significant first, a partial last byte left aligned ---------- */
  class BitWriter {
    constructor() { this.bytes = []; this.bits = 0; }
    bit(b) { const i = this.bits >> 3; if (i >= this.bytes.length) this.bytes.push(0); if (b) this.bytes[i] |= 0x80 >> (this.bits & 7); this.bits++; }
    uint(value, n) {
      let v = BigInt(value); const k = Math.ceil(n / 8), parts = [];
      for (let i = 0; i < k; i++) parts.push(Number((v >> BigInt(8 * i)) & 255n));
      const r = n - 8 * (k - 1);
      if (r < 8) parts[k - 1] = (parts[k - 1] << (8 - r)) & 255;
      for (let i = 0; i < k; i++) { const nb = i < k - 1 ? 8 : r; for (let j = 0; j < nb; j++) this.bit((parts[i] >> (7 - j)) & 1); }
    }
    int(value, n) { let v = BigInt(value); if (v < 0n) v += 1n << BigInt(n); this.uint(v, n); }
    f32(x) { const d = new DataView(new ArrayBuffer(4)); d.setFloat32(0, x, true); this.uint(d.getUint32(0, true), 32); }
    void(n) { for (let i = 0; i < n; i++) this.bit(0); }
    raw(bytes) { for (const b of bytes) this.uint(b, 8); }
    out() { return Uint8Array.from(this.bytes); }
  }
  class BitReader {
    constructor(bytes) { this.b = bytes; this.pos = 0; this.len = bytes.length * 8; }
    bit() { const p = this.pos++; if (p >= this.len) return 0; return (this.b[p >> 3] >> (7 - (p & 7))) & 1; }
    uint(n) {
      const k = Math.ceil(n / 8), r = n - 8 * (k - 1); let v = 0n;
      for (let i = 0; i < k; i++) { const nb = i < k - 1 ? 8 : r; let byte = 0; for (let j = 0; j < nb; j++) byte = (byte << 1) | this.bit(); v |= BigInt(byte) << BigInt(8 * i); }
      return v;
    }
    num(n) { return Number(this.uint(n)); }
    int(n) { let v = this.uint(n); if (v >> BigInt(n - 1)) v -= 1n << BigInt(n); return v; }
    inum(n) { return Number(this.int(n)); }
    f32() { const d = new DataView(new ArrayBuffer(4)); d.setUint32(0, Number(this.uint(32)), true); return d.getFloat32(0, true); }
    f16() { const h = this.num(16), s = (h >> 15) & 1, e = (h >> 10) & 31, f = h & 1023; let v; if (e === 0) v = f * Math.pow(2, -24); else if (e === 31) v = f ? NaN : Infinity; else v = (1 + f / 1024) * Math.pow(2, e - 15); return s ? -v : v; }
    skip(n) { this.pos += n; }
    left() { return Math.max(0, this.len - this.pos); }
    tail() { const out = []; while (this.left() >= 8) out.push(this.num(8)); return Uint8Array.from(out); }   // a tail array: the rest of the payload, no length prefix
  }
  const text = bytes => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return s; };
  const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');

  /* ---------- the types ---------- */
  const enc = {
    GetNodeInfoRequest: () => new Uint8Array(0),
    // value: null (empty), {real}, {int}, {bool}, {str}
    GetSetRequest({index = 0, value = null, name = ''}) {
      const w = new BitWriter(); w.uint(index, 13); writeValue(w, value); w.raw(new TextEncoder().encode(name).subarray(0, 92)); return w.out();
    },
    ExecuteOpcodeRequest: ({opcode, argument = 0}) => { const w = new BitWriter(); w.uint(opcode, 8); w.int(argument, 48); return w.out(); },
    RestartNodeRequest: () => { const w = new BitWriter(); w.uint(RESTART_MAGIC, 40); return w.out(); },
    NodeStatus: ({uptime = 0, health = 0, mode = 0, sub = 0, vendor = 0}) => { const w = new BitWriter(); w.uint(uptime >>> 0, 32); w.uint(health, 2); w.uint(mode, 3); w.uint(sub, 3); w.uint(vendor, 16); return w.out(); }
  };
  function writeValue(w, v) {
    if (!v) { w.uint(0, 3); return; }
    if (v.int !== undefined) { w.uint(1, 3); w.int(v.int, 64); } else if (v.real !== undefined) { w.uint(2, 3); w.f32(v.real); } else if (v.bool !== undefined) { w.uint(3, 3); w.uint(v.bool ? 1 : 0, 8); }
    else if (v.str !== undefined) { const b = new TextEncoder().encode(v.str).subarray(0, 128); w.uint(4, 3); w.uint(b.length, 8); w.raw(b); } else w.uint(0, 3);
  }
  function readValue(r) {      // the union Value (3 bit tag)
    const tag = r.num(3);
    if (tag === 1) return {int: Number(r.int(64))};
    if (tag === 2) return {real: r.f32()};
    if (tag === 3) return {bool: r.num(8)};
    if (tag === 4) { const n = r.num(8), b = []; for (let i = 0; i < n; i++) b.push(r.num(8)); return {str: text(b)}; }
    return null;
  }
  function readNumeric(r) {    // the union NumericValue (2 bit tag)
    const tag = r.num(2);
    if (tag === 1) return {int: Number(r.int(64))};
    if (tag === 2) return {real: r.f32()};
    return null;
  }
  const dec = {
    NodeStatus(bytes) { const r = new BitReader(bytes); return {uptime: r.num(32), health: r.num(2), mode: r.num(3), sub: r.num(3), vendor: r.num(16)}; },
    GetNodeInfoResponse(bytes) {
      const r = new BitReader(bytes), status = dec.NodeStatus(bytes); r.skip(56);
      const sw = {major: r.num(8), minor: r.num(8), flags: r.num(8), vcs: r.num(32), crc: r.uint(64).toString(16).padStart(16, '0')};
      const hw = {major: r.num(8), minor: r.num(8)}; const uid = []; for (let i = 0; i < 16; i++) uid.push(r.num(8)); hw.uid = hex(uid);
      const n = r.num(8), coa = []; for (let i = 0; i < n; i++) coa.push(r.num(8)); hw.coa = hex(coa);
      return {status, sw, hw, name: text(r.tail())};
    },
    GetSetResponse(bytes) {
      const r = new BitReader(bytes); r.skip(5); const value = readValue(r); r.skip(5); const def = readValue(r); r.skip(6); const max = readNumeric(r); r.skip(6); const min = readNumeric(r);
      return {value, default: def, max, min, name: text(r.tail())};
    },
    ExecuteOpcodeResponse(bytes) { const r = new BitReader(bytes); return {argument: r.inum(48), ok: !!r.num(1)}; },
    RestartNodeResponse(bytes) { const r = new BitReader(bytes); return {ok: !!r.num(1)}; },
    RawAirData(bytes) { const r = new BitReader(bytes); return {flags: r.num(8), static: r.f32(), diff: r.f32(), ts: r.f16(), td: r.f16(), sat: r.f16(), pt: r.f16()}; },
    BatteryInfo(bytes) {
      const r = new BitReader(bytes); const o = {temperature: r.f16(), voltage: r.f16(), current: r.f16(), power: r.f16(), remaining: r.f16(), full: r.f16(), hours: r.f16()};
      o.flags = r.num(11); o.soh = r.num(7); o.soc = r.num(7); o.socSd = r.num(7); o.id = r.num(8); o.model = r.num(32); o.modelName = text(r.tail()); return o;
    },
    Fix2(bytes) {
      const r = new BitReader(bytes); r.skip(56 + 56); const std = r.num(3); r.skip(13); const leap = r.num(8);
      const lon = r.inum(37) * 1e-8, lat = r.inum(37) * 1e-8, hell = r.inum(27) * 1e-3, hmsl = r.inum(27) * 1e-3;
      const vel = [r.f32(), r.f32(), r.f32()]; return {lon, lat, hell, hmsl, vel, sats: r.num(6), status: r.num(2), mode: r.num(4), sub: r.num(6), std, leap};
    }
  };

  /* ---------- CAN identifiers and transfers ---------- */
  function makeId(o) {
    let id = (o.prio & 31) * 0x1000000;
    if (o.service) id += (o.typeId & 255) * 0x10000 + (o.request ? 0x8000 : 0) + (o.dest & 127) * 0x100 + 0x80;
    else id += (o.typeId & 0xffff) * 0x100;
    return id + (o.source & 127);
  }
  function parseId(id) {
    id &= 0x1fffffff; const service = !!(id & 0x80), o = {prio: (id >>> 24) & 31, service, source: id & 127};
    if (service) { o.typeId = (id >>> 16) & 255; o.request = !!(id & 0x8000); o.dest = (id >>> 8) & 127; } else o.typeId = (id >>> 8) & 0xffff;
    return o;
  }
  function toFrames(typeKey, idFields, payload, tid) {
    const id = makeId(idFields), out = []; let rest = Array.from(payload);
    if (rest.length > 7) { const crc = crc16(BASE[typeKey], rest); rest = [crc & 255, crc >> 8].concat(rest); }
    let toggle = 0, first = true;
    for (;;) {
      const chunk = rest.slice(0, 7); rest = rest.slice(7); const last = rest.length === 0;
      out.push({id, data: Uint8Array.from(chunk.concat([(first ? 0x80 : 0) | (last ? 0x40 : 0) | (toggle ? 0x20 : 0) | (tid & 31)]))});
      if (last) break; toggle ^= 1; first = false;
    }
    return out;
  }
  // reassembly of the transfers of all nodes
  class Assembler {
    constructor() { this.open = new Map(); this.badCrc = 0; this.dropped = 0; }
    push(canId, data, nowMs = Date.now()) {
      canId &= 0x1fffffff; if (!data || !data.length) return null;
      const tail = data[data.length - 1], sot = !!(tail & 0x80), eot = !!(tail & 0x40), tog = (tail >> 5) & 1, tid = tail & 31, key = canId & 0x00ffffff, info = parseId(canId);
      if (info.source === 0) return null;                      // anonymous frames (dynamic node id requests) are not ours
      for (const [k, s] of this.open) if (nowMs - s.t > 2000) { this.open.delete(k); this.dropped++; }
      if (sot) {
        if (eot) return this.done(info, tid, data.subarray(0, data.length - 1), false);
        this.open.set(key, {tid, tog: 1, bytes: Array.from(data.subarray(0, data.length - 1)), t: nowMs}); return null;
      }
      const s = this.open.get(key);
      if (!s || s.tid !== tid || s.tog !== tog) { if (s) { this.open.delete(key); this.dropped++; } return null; }
      for (let i = 0; i < data.length - 1; i++) s.bytes.push(data[i]);
      s.tog ^= 1; s.t = nowMs;
      if (eot) { this.open.delete(key); return this.done(info, tid, Uint8Array.from(s.bytes), true); }
      return null;
    }
    done(info, tid, payload, multi) {
      const key = BY_ID.get((info.service ? 's' : 'm') + info.typeId); let crcOk = null;
      if (multi) {
        if (payload.length < 2) { this.badCrc++; return null; }
        const got = payload[0] | (payload[1] << 8); payload = payload.subarray(2);
        if (key) { crcOk = crc16(BASE[key], payload) === got; if (!crcOk) { this.badCrc++; return null; } }
      }
      return {...info, tid, payload, multi, typeKey: key || null, crcOk};
    }
  }

  /* ---------- the client: our node on the CAN bus ---------- */
  function createClient(opts) {
    const o = Object.assign({nodeId: 126, now: () => Date.now(), sendFrame: async () => {}}, opts || {});
    const asm = new Assembler(), nodes = new Map(), pending = new Map(), tids = new Map(), handlers = {node: [], message: [], frame: []}, seen = new Map();
    let stats = {frames: 0, transfers: 0, tx: 0}, started = o.now();
    const emit = (k, v) => { for (const f of handlers[k] || []) { try { f(v); } catch (e) { console.warn('DroneCAN handler', e); } } };
    const nextTid = key => { const t = (tids.get(key) || 0) & 31; tids.set(key, (t + 1) & 31); return t; };
    function node(id) { let n = nodes.get(id); if (!n) { n = {id, status: null, info: null, lastSeen: 0, infoAt: 0, params: null, firstSeen: o.now()}; nodes.set(id, n); } return n; }
    function onTransfer(t) {
      stats.transfers++;
      if (!t.service) {
        if (t.typeKey === 'NodeStatus') {
          const st = dec.NodeStatus(t.payload), n = node(t.source), restarted = n.status && st.uptime + 2 < n.status.uptime;
          n.status = st; n.lastSeen = o.now(); if (restarted) n.info = null; emit('node', n);
          if (n.info === null && o.now() - n.infoAt > 4000) { n.infoAt = o.now(); client.getNodeInfo(n.id).catch(() => {}); }
          return;
        }
        const k = t.typeKey || ('msg' + t.typeId), s = seen.get(t.source + ':' + k) || {count: 0}; s.count++; s.last = o.now(); s.source = t.source; s.typeId = t.typeId; s.typeKey = t.typeKey; s.size = t.payload.length;
        if (t.typeKey && dec[t.typeKey]) { try { s.value = dec[t.typeKey](t.payload); } catch (e) { s.value = null; } }
        seen.set(t.source + ':' + k, s); emit('message', s); return;
      }
      if (!t.request && t.dest === o.nodeId) {
        const key = `${t.source}:${t.typeId}:${t.tid}`, p = pending.get(key);
        if (p) { try { p.done(null, dec[t.typeKey + 'Response'](t.payload)); } catch (e) { p.done(e); } }
      }
    }
    const client = {
      get nodeId() { return o.nodeId; }, set nodeId(v) { o.nodeId = v & 127; },
      nodes, seen, stats: () => ({...stats, badCrc: asm.badCrc, dropped: asm.dropped}),
      on(k, f) { (handlers[k] = handlers[k] || []).push(f); },
      onFrame(canId, data) {
        stats.frames++; if (!(canId & EFF) && canId > 0x7ff) return;
        const t = asm.push(canId, data, o.now()); if (t) onTransfer(t);
      },
      async request(dest, typeKey, payload, opt = {}) {
        const T = TYPES[typeKey], tid = nextTid('s' + dest + ':' + T.id), frames = toFrames(typeKey, {prio: 24, service: true, request: true, typeId: T.id, source: o.nodeId, dest}, payload, tid), key = `${dest}:${T.id}:${tid}`;
        const timeout = opt.timeoutMs || 700, retries = opt.retries === undefined ? 2 : opt.retries;
        return new Promise((resolve, reject) => {
          let n = 0, timer = null;
          const done = (err, val) => { clearInterval(timer); pending.delete(key); err ? reject(err) : resolve(val); };
          const send = async () => { try { for (const f of frames) { await o.sendFrame((f.id | EFF) >>> 0, f.data); stats.tx++; } } catch (e) { done(e); } };
          pending.set(key, {done}); timer = setInterval(() => { if (++n > retries) done(new Error('timeout')); else send(); }, timeout); send();
        });
      },
      async broadcastStatus() {
        const f = toFrames('NodeStatus', {prio: 20, service: false, typeId: 341, source: o.nodeId}, enc.NodeStatus({uptime: Math.floor((o.now() - started) / 1000)}), nextTid('m341'));
        for (const x of f) { await o.sendFrame((x.id | EFF) >>> 0, x.data); stats.tx++; }
      },
      async getNodeInfo(id) { const r = await client.request(id, 'GetNodeInfo', enc.GetNodeInfoRequest()); const n = node(id); n.info = r; emit('node', n); return r; },
      getParam: (id, {index = 0, name = ''} = {}) => client.request(id, 'GetSet', enc.GetSetRequest({index, value: null, name})),
      setParam: (id, name, value) => client.request(id, 'GetSet', enc.GetSetRequest({index: 0, value, name}), {retries: 1}),
      saveParams: id => client.request(id, 'ExecuteOpcode', enc.ExecuteOpcodeRequest({opcode: 0, argument: 0}), {timeoutMs: 1500}),
      restartNode: id => client.request(id, 'RestartNode', enc.RestartNodeRequest(), {retries: 0, timeoutMs: 1500}),
      async listParams(id, onProgress, isCancelled) {
        const list = []; let index = 0;
        for (;;) {
          if (isCancelled && isCancelled()) break;
          const r = await client.getParam(id, {index}); if (!r.name) break;
          r.index = index; list.push(r); index++; if (onProgress) onProgress(list.length, r);
          if (index > 8190) break;
        }
        return list;
      },
      offline: (n, now = o.now()) => !n.lastSeen || now - n.lastSeen > 3000,
      reset() { nodes.clear(); seen.clear(); pending.clear(); asm.open.clear(); stats = {frames: 0, transfers: 0, tx: 0}; started = o.now(); }
    };
    return client;
  }

  window.AtlasDroneCAN = Object.freeze({SIG, TYPES, EFF, RESTART_MAGIC, crc16, BASE, BitWriter, BitReader, enc, dec, makeId, parseId, toFrames, Assembler, createClient});
})();
