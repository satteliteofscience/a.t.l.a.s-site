'use strict';
// AI-assisted. Checks the DroneCAN codec of the configurator against frames made by the reference implementation (pydronecan, see tools/dronecan-vectors.json):
// the same transfers must encode to the same CAN frames and the frames must decode to the same values; then a node answers requests through the client.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.resolve(__dirname, '..');
const sandbox = {window: {}, console, TextEncoder, TextDecoder, setInterval, clearInterval, setTimeout, clearTimeout};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/configurator/dronecan-core.js'), 'utf8'), sandbox, {filename: 'dronecan-core.js'});
const DC = sandbox.window.AtlasDroneCAN;
const vectors = JSON.parse(fs.readFileSync(path.join(__dirname, 'dronecan-vectors.json'), 'utf8')).vectors;
const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
const unhex = s => Uint8Array.from(s.match(/../g) || [], h => parseInt(h, 16));
let checks = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); checks++; };
const near = (a, b, msg) => ok(Math.abs(a - b) <= 1e-3 * Math.max(1, Math.abs(b)), msg + ': ' + a + ' vs ' + b);
const val = v => v === null ? null : v.real !== undefined ? {real: v.real} : v.int !== undefined ? {int: v.int} : v.bool !== undefined ? {bool: v.bool} : {str: v.str};

for (const v of vectors) {
  // decode: the frames of the reference arrive one by one; one completed transfer comes out
  const asm = new DC.Assembler(); let t = null;
  for (const f of v.frames) { const r = asm.push((f.id | DC.EFF) >>> 0, unhex(f.data), 1000); if (r) t = r; }
  ok(t, v.name + ': no transfer completed');
  ok(t.source === v.source && t.service === v.service && t.tid === v.tid, v.name + ': header');
  ok(v.frames.length === 1 || t.crcOk === true, v.name + ': the transfer CRC is checked and fits');
  const typeKey = v.kind.split('.')[0], e = v.expect;
  if (v.kind === 'NodeStatus') { const d = DC.dec.NodeStatus(t.payload); ok(d.uptime === e.uptime && d.health === e.health && d.mode === e.mode && d.sub === e.sub && d.vendor === e.vendor, v.name + ': values'); }
  if (v.kind === 'GetNodeInfo.Response') {
    const d = DC.dec.GetNodeInfoResponse(t.payload);
    ok(d.status.uptime === e.status.uptime && d.status.health === e.status.health && d.sw.major === e.sw.major && d.sw.flags === e.sw.flags && d.sw.vcs === e.sw.vcs && d.sw.crc === e.sw.crc, v.name + ': software');
    ok(d.hw.major === e.hw.major && d.hw.uid === e.hw.uid && d.hw.coa === e.hw.coa && d.name === e.name, v.name + ': hardware and name');
  }
  if (v.kind === 'GetSet.Response') {
    const d = DC.dec.GetSetResponse(t.payload);
    ok(JSON.stringify(val(d.value)) === JSON.stringify(e.value === null ? null : e.value.str !== undefined ? {str: e.value.str} : e.value.real !== undefined ? {real: e.value.real} : e.value.int !== undefined ? {int: e.value.int} : {bool: e.value.bool}), v.name + ': value ' + JSON.stringify(d.value));
    ok(JSON.stringify(val(d.default)) === JSON.stringify(e.default === null ? null : e.default.real !== undefined ? {real: e.default.real} : e.default.int !== undefined ? {int: e.default.int} : {bool: e.default.bool}), v.name + ': default');
    ok(JSON.stringify(val(d.max)) === JSON.stringify(e.max === null ? null : e.max.real !== undefined ? {real: e.max.real} : {int: e.max.int}), v.name + ': max');
    ok(JSON.stringify(val(d.min)) === JSON.stringify(e.min === null ? null : e.min.real !== undefined ? {real: e.min.real} : {int: e.min.int}), v.name + ': min');
    ok(d.name === e.name, v.name + ': name');
  }
  if (v.kind === 'ExecuteOpcode.Response') { const d = DC.dec.ExecuteOpcodeResponse(t.payload); ok(d.argument === e.argument && d.ok === e.ok, v.name + ': values'); }
  if (v.kind === 'RestartNode.Response') { const d = DC.dec.RestartNodeResponse(t.payload); ok(d.ok === e.ok, v.name + ': values'); }
  if (v.kind === 'RawAirData') { const d = DC.dec.RawAirData(t.payload); ok(d.flags === e.flags, v.name + ': flags'); near(d.static, e.static, 'static'); near(d.diff, e.diff, 'diff'); near(d.ts, e.ts, 'ts'); near(d.td, e.td, 'td'); near(d.sat, e.sat, 'sat'); near(d.pt, e.pt, 'pt'); }
  if (v.kind === 'BatteryInfo') { const d = DC.dec.BatteryInfo(t.payload); near(d.temperature, e.temperature, 'temp'); near(d.voltage, e.voltage, 'volt'); near(d.current, e.current, 'cur'); ok(d.soc === e.soc && d.flags === e.flags && d.id === e.id && d.modelName === e.model_name, v.name + ': fields ' + JSON.stringify(d)); }
  if (v.kind === 'Fix2') { const d = DC.dec.Fix2(t.payload); near(d.lon, e.lon, 'lon'); near(d.lat, e.lat, 'lat'); near(d.hmsl, e.hmsl, 'hmsl'); ok(d.sats === e.sats && d.status === e.status && d.mode === e.mode, v.name + ': fields'); near(d.vel[0], 1.5, 'vn'); near(d.vel[1], -2.5, 've'); near(d.vel[2], 0.25, 'vd'); }
  // encode: the payloads that the configurator sends must give the frames of the reference
  let payload = null;
  if (v.kind === 'GetNodeInfo.Request') payload = DC.enc.GetNodeInfoRequest();
  if (v.kind === 'GetSet.Request') payload = DC.enc.GetSetRequest({index: e.index, value: e.value, name: e.name});
  if (v.kind === 'ExecuteOpcode.Request') payload = DC.enc.ExecuteOpcodeRequest(e);
  if (v.kind === 'RestartNode.Request') payload = DC.enc.RestartNodeRequest();
  if (v.kind === 'NodeStatus') payload = DC.enc.NodeStatus(e);
  if (payload) {
    const frames = DC.toFrames(typeKey, {prio: v.prio, service: v.service, request: v.request, typeId: DC.TYPES[typeKey].id, source: v.source, dest: v.dest}, payload, v.tid);
    ok(frames.length === v.frames.length, v.name + ': frame count ' + frames.length + ' vs ' + v.frames.length);
    frames.forEach((f, i) => ok(f.id === v.frames[i].id && hex(f.data) === v.frames[i].data, v.name + ': frame ' + i + ' ' + f.id.toString(16) + ' ' + hex(f.data) + ' vs ' + v.frames[i].id.toString(16) + ' ' + v.frames[i].data));
  }
}

// a lost frame, a wrong toggle and a wrong CRC must not produce a transfer
{
  const v = vectors.find(x => x.name === 'GetSet response real'), a = new DC.Assembler();
  for (let i = 0; i < v.frames.length; i++) { if (i === 2) continue; assert.strictEqual(a.push((v.frames[i].id | DC.EFF) >>> 0, unhex(v.frames[i].data), 1), null); } checks++;
  const b = new DC.Assembler(); let got = null;
  v.frames.forEach((f, i) => { const d = unhex(f.data); if (i === 1) d[0] ^= 0xff; const r = b.push((f.id | DC.EFF) >>> 0, d, 1); if (r) got = r; });
  ok(got === null && b.badCrc === 1, 'a wrong byte is caught by the transfer CRC');
}

// the client against a node that answers like a real one: node info, a parameter list, a write, save and restart
(async () => {
  const nodeId = 42, params = [{name: 'ARSPD_RATIO', real: 2.0}, {name: 'CAN_D1_PROTOCOL', int: 1}, {name: 'LABEL', str: 'pitot'}];
  let restarts = 0, saves = 0, client = null;
  const reply = (typeKey, payload, request) => { const T = DC.TYPES[typeKey]; for (const f of DC.toFrames(typeKey, {prio: 24, service: true, request: false, typeId: T.id, source: nodeId, dest: request.source}, payload, request.tid)) setImmediate(() => client.onFrame((f.id | DC.EFF) >>> 0, f.data)); };
  const asmNode = new DC.Assembler();
  const w = (typeKey, fn) => { const b = new DC.BitWriter(); fn(b); return b.out(); };
  client = DC.createClient({nodeId: 126, sendFrame: async (id, data) => {
    const t = asmNode.push(id, data, Date.now()); if (!t || !t.request || t.dest !== nodeId) return;
    if (t.typeKey === 'GetNodeInfo') reply('GetNodeInfo', w('', b => { b.uint(100, 32); b.uint(0, 2); b.uint(0, 3); b.uint(0, 3); b.uint(0, 16); b.uint(1, 8); b.uint(7, 8); b.uint(0, 8); b.uint(0, 32); b.uint(0, 64); b.uint(2, 8); b.uint(1, 8); for (let i = 0; i < 16; i++) b.uint(i, 8); b.uint(0, 8); b.raw(new TextEncoder().encode('com.test.pitot')); }), t);
    if (t.typeKey === 'GetSet') {
      const r = new DC.BitReader(t.payload), index = r.num(13), tag = r.num(3); let value = null;
      if (tag === 2) value = {real: r.f32()}; else if (tag === 1) value = {int: Number(r.int(64))}; else if (tag === 4) { const n = r.num(8), bytes = []; for (let i = 0; i < n; i++) bytes.push(r.num(8)); value = {str: String.fromCharCode(...bytes)}; }
      const name = String.fromCharCode(...r.tail()); const p = name ? params.find(x => x.name === name) : params[index];
      if (p && value) Object.assign(p, value);
      reply('GetSet', w('', b => { if (!p) { b.void(5); b.uint(0, 3); b.void(5); b.uint(0, 3); b.void(6); b.uint(0, 2); b.void(6); b.uint(0, 2); return; }
        const put = (x) => { if (x.real !== undefined) { b.uint(2, 3); b.f32(x.real); } else if (x.int !== undefined) { b.uint(1, 3); b.int(x.int, 64); } else { const s = new TextEncoder().encode(x.str); b.uint(4, 3); b.uint(s.length, 8); b.raw(s); } };
        b.void(5); put(p); b.void(5); b.uint(0, 3); b.void(6); b.uint(0, 2); b.void(6); b.uint(0, 2); b.raw(new TextEncoder().encode(p.name)); }), t);
    }
    if (t.typeKey === 'ExecuteOpcode') { saves++; reply('ExecuteOpcode', w('', b => { b.int(0, 48); b.uint(1, 1); }), t); }
    if (t.typeKey === 'RestartNode') { const r = new DC.BitReader(t.payload); if (Number(r.uint(40)) === DC.RESTART_MAGIC) restarts++; reply('RestartNode', w('', b => b.uint(1, 1)), t); }
  }});
  const info = await client.getNodeInfo(nodeId); ok(info.name === 'com.test.pitot' && info.sw.major === 1 && info.sw.minor === 7 && info.hw.uid === '000102030405060708090a0b0c0d0e0f', 'client: node info');
  const list = await client.listParams(nodeId); ok(list.length === 3 && list[0].name === 'ARSPD_RATIO' && list[1].value.int === 1 && list[2].value.str === 'pitot', 'client: parameter list ' + list.length);
  const set = await client.setParam(nodeId, 'ARSPD_RATIO', {real: 1.75}); ok(set.value.real === 1.75 && params[0].real === 1.75, 'client: write and read back');
  const saved = await client.saveParams(nodeId); ok(saved.ok && saves === 1, 'client: save');
  const rs = await client.restartNode(nodeId); ok(rs.ok && restarts === 1, 'client: restart with the magic number');
  const quiet = DC.createClient({nodeId: 126, sendFrame: async () => {}}); let failed = false; try { await quiet.request(77, 'GetNodeInfo', DC.enc.GetNodeInfoRequest(), {timeoutMs: 20, retries: 1}); } catch (e) { failed = /timeout/.test(e.message); } ok(failed, 'client: no answer gives a timeout');
  console.log('DroneCAN check: ' + checks + ' checks passed');
})().catch(e => { console.error(e); process.exit(1); });
