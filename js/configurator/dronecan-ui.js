/* AI-assisted. DroneCAN tab of the configurator: the CAN bus of the flight controller is forwarded over the MAVLink link (MAV_CMD_CAN_FORWARD, CAN_FRAME); the tab lists the nodes,
   reads and writes their parameters, saves them and restarts a node. The codec is js/configurator/dronecan-core.js. Not a firmware updater: no file transfer, no motor or servo commands. */
(() => {
  'use strict';
  const DC = window.AtlasDroneCAN;
  const root = document.getElementById('dcRoot');
  if (!DC || !root) return;
  const T = {
    ru: {title: 'DroneCAN', intro: 'Шина CAN полётного контроллера пробрасывается по MAVLink (MAV_CMD_CAN_FORWARD): видны все устройства на шине (GPS, Pitot, компас, ESC, батарея), можно читать и менять их параметры, сохранять их в память устройства и перезапускать устройство. Нужна прошивка с DroneCAN на выбранной шине (CAN_Pn_DRIVER) и живая связь с контроллером. Лучше всего по USB: через радиосвязь поток кадров CAN может её забить.',
      bus: 'Шина', node: 'Номер узла конфигуратора', connect: 'Подключить шину', disconnect: 'Отключить', demo: 'В демо-режиме шина CAN недоступна.', nolink: 'Нет связи MAVLink с контроллером.',
      idle: 'Шина не подключена.', waiting: 'Запрос отправлен, жду кадры CAN…', ok: n => `Шина подключена: ${n.fps} кадр/с, узлов: ${n.nodes}, ошибок CRC: ${n.bad}.`, nofr: 'Кадров CAN нет: проверь CAN_Pn_DRIVER, проводку, терминаторы и питание узлов.',
      refused: r => `Контроллер отклонил пересылку CAN (код ${r}): прошивка без поддержки или такой шины нет.`, noack: 'Ответа на запрос пересылки нет: если кадры идут, всё работает.', stopped: 'Пересылка CAN остановлена.',
      nodes: 'Устройства на шине', none: 'Узлов пока нет. NodeStatus приходит раз в секунду.', id: 'ID', name: 'Имя', health: 'Состояние', mode: 'Режим', uptime: 'Работает', sw: 'ПО', hw: 'Аппаратная часть', seen: 'Слышно', params: 'Параметры', restart: 'Перезапуск', offline: 'нет сигнала', thisFc: 'контроллер',
      healthNames: ['норма', 'предупреждение', 'ошибка', 'критично'], modeNames: {0: 'работает', 1: 'запуск', 2: 'обслуживание', 3: 'обновление ПО', 7: 'отключён'},
      nodeParams: id => `Параметры узла ${id}`, read: 'Прочитать все', readn: n => `Прочитано: ${n}`, cancel: 'Остановить', save: 'Сохранить в память узла', filter: 'Фильтр по имени', write: 'Записать', pname: 'Параметр', pval: 'Значение', pdef: 'По умолчанию', prange: 'Предел', pnone: 'Параметры не прочитаны.',
      needDisarm: 'Запись, сохранение и перезапуск — только при DISARMED и свежем HEARTBEAT.', written: 'записано', failed: m => `ошибка: ${m}`, saved: 'Параметры сохранены в память узла.', saveNo: 'Узел не подтвердил сохранение.', restartAsk: id => `Перезапустить узел ${id}? Устройство на время пропадёт с шины.`, restarted: 'Команда перезапуска принята.', badValue: 'Некорректное значение.',
      live: 'Сообщения устройств', lnode: 'Узел', ltype: 'Тип', lcount: 'Принято', lval: 'Последнее значение', warn: 'Параметры устройств на шине CAN меняют работу датчиков и приводов. Меняй только то, что понимаешь, на земле и без винта.'},
    uk: {title: 'DroneCAN', intro: 'Шина CAN польотного контролера прокидається по MAVLink (MAV_CMD_CAN_FORWARD): видно всі пристрої на шині (GPS, Піто, компас, ESC, батарея), можна читати й змінювати їхні параметри, зберігати їх у пам’ять пристрою та перезапускати пристрій. Потрібна прошивка з DroneCAN на вибраній шині (CAN_Pn_DRIVER) і жива зв’язка з контролером. Найкраще по USB: через радіозв’язок потік кадрів CAN може її забити.',
      bus: 'Шина', node: 'Номер вузла конфігуратора', connect: 'Підключити шину', disconnect: 'Відключити', demo: 'У демо-режимі шина CAN недоступна.', nolink: 'Немає зв’язку MAVLink з контролером.',
      idle: 'Шину не підключено.', waiting: 'Запит надіслано, чекаю кадри CAN…', ok: n => `Шину підключено: ${n.fps} кадр/с, вузлів: ${n.nodes}, помилок CRC: ${n.bad}.`, nofr: 'Кадрів CAN немає: перевір CAN_Pn_DRIVER, проводку, термінатори та живлення вузлів.',
      refused: r => `Контролер відхилив пересилання CAN (код ${r}): прошивка без підтримки або такої шини немає.`, noack: 'Відповіді на запит пересилання немає: якщо кадри йдуть, усе працює.', stopped: 'Пересилання CAN зупинено.',
      nodes: 'Пристрої на шині', none: 'Вузлів поки немає. NodeStatus приходить раз на секунду.', id: 'ID', name: 'Ім’я', health: 'Стан', mode: 'Режим', uptime: 'Працює', sw: 'ПЗ', hw: 'Апаратна частина', seen: 'Чутно', params: 'Параметри', restart: 'Перезапуск', offline: 'немає сигналу', thisFc: 'контролер',
      healthNames: ['норма', 'попередження', 'помилка', 'критично'], modeNames: {0: 'працює', 1: 'запуск', 2: 'обслуговування', 3: 'оновлення ПЗ', 7: 'відключено'},
      nodeParams: id => `Параметри вузла ${id}`, read: 'Прочитати всі', readn: n => `Прочитано: ${n}`, cancel: 'Зупинити', save: 'Зберегти в пам’ять вузла', filter: 'Фільтр за ім’ям', write: 'Записати', pname: 'Параметр', pval: 'Значення', pdef: 'За замовчуванням', prange: 'Межі', pnone: 'Параметри не прочитано.',
      needDisarm: 'Запис, збереження й перезапуск — лише за DISARMED і свіжого HEARTBEAT.', written: 'записано', failed: m => `помилка: ${m}`, saved: 'Параметри збережено в пам’ять вузла.', saveNo: 'Вузол не підтвердив збереження.', restartAsk: id => `Перезапустити вузол ${id}? Пристрій на деякий час зникне з шини.`, restarted: 'Команду перезапуску прийнято.', badValue: 'Некоректне значення.',
      live: 'Повідомлення пристроїв', lnode: 'Вузол', ltype: 'Тип', lcount: 'Прийнято', lval: 'Останнє значення', warn: 'Параметри пристроїв на шині CAN змінюють роботу датчиків і приводів. Змінюй лише те, що розумієш, на землі й без гвинта.'},
    en: {title: 'DroneCAN', intro: 'The CAN bus of the flight controller is forwarded over MAVLink (MAV_CMD_CAN_FORWARD): you see every device on the bus (GPS, airspeed, compass, ESC, battery), read and change their parameters, save them to the device and restart it. It needs firmware with DroneCAN on the chosen bus (CAN_Pn_DRIVER) and a live link to the controller. USB is best: over a radio link the stream of CAN frames can choke it.',
      bus: 'Bus', node: 'Configurator node ID', connect: 'Connect bus', disconnect: 'Disconnect', demo: 'The CAN bus is not available in demo mode.', nolink: 'No MAVLink link to the controller.',
      idle: 'The bus is not connected.', waiting: 'Request sent, waiting for CAN frames…', ok: n => `Bus connected: ${n.fps} frames/s, nodes: ${n.nodes}, CRC errors: ${n.bad}.`, nofr: 'No CAN frames: check CAN_Pn_DRIVER, wiring, terminators and node power.',
      refused: r => `The controller refused CAN forwarding (code ${r}): the firmware lacks it or there is no such bus.`, noack: 'No answer to the forwarding request: if frames arrive, it works.', stopped: 'CAN forwarding stopped.',
      nodes: 'Devices on the bus', none: 'No nodes yet. NodeStatus arrives once a second.', id: 'ID', name: 'Name', health: 'Health', mode: 'Mode', uptime: 'Uptime', sw: 'Software', hw: 'Hardware', seen: 'Seen', params: 'Parameters', restart: 'Restart', offline: 'no signal', thisFc: 'controller',
      healthNames: ['OK', 'warning', 'error', 'critical'], modeNames: {0: 'operational', 1: 'initialization', 2: 'maintenance', 3: 'software update', 7: 'offline'},
      nodeParams: id => `Parameters of node ${id}`, read: 'Read all', readn: n => `Read: ${n}`, cancel: 'Stop', save: 'Save to node memory', filter: 'Filter by name', write: 'Write', pname: 'Parameter', pval: 'Value', pdef: 'Default', prange: 'Range', pnone: 'Parameters have not been read.',
      needDisarm: 'Writing, saving and restarting need DISARMED and a fresh HEARTBEAT.', written: 'written', failed: m => `failed: ${m}`, saved: 'Parameters saved to the node memory.', saveNo: 'The node did not confirm the save.', restartAsk: id => `Restart node ${id}? The device leaves the bus for a while.`, restarted: 'Restart command accepted.', badValue: 'Invalid value.',
      live: 'Device messages', lnode: 'Node', ltype: 'Type', lcount: 'Received', lval: 'Last value', warn: 'Parameters of CAN devices change how sensors and actuators work. Change only what you understand, on the ground and without a propeller.'}
  };
  const lang = () => { const l = window.AtlasLanguage ? window.AtlasLanguage() : 'ru'; return T[l] ? l : 'ru'; };
  const tr = k => T[lang()][k] !== undefined ? T[lang()][k] : T.ru[k];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const S = {client: null, bus: 1, forwarding: false, waitingAck: false, since: 0, frames0: 0, fps: 0, selected: null, params: [], listing: false, cancel: false, timer: null, msg: '', msgBad: false, note: null, paramMsg: '', filter: '', built: false};
  const cc = () => window.AtlasCC;
  const canWrite = () => !!(cc() && cc().canCalibrate && cc().canCalibrate());

  function nodeName(n) { return n.info && n.info.name ? n.info.name : '—'; }
  function fmtUptime(s) { s = Math.max(0, s | 0); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s % 60).padStart(2, '0'); }
  const numText = x => String(+x.toPrecision(7));
  function valText(v) { return !v ? '' : v.real !== undefined ? numText(v.real) : v.int !== undefined ? String(v.int) : v.bool !== undefined ? String(v.bool) : v.str !== undefined ? v.str : ''; }
  function kind(v) { return !v ? '' : v.real !== undefined ? 'real' : v.int !== undefined ? 'int' : v.bool !== undefined ? 'bool' : 'str'; }
  function summary(s) {
    const v = s.value; if (!v) return `${s.size} B`;
    if (s.typeKey === 'RawAirData') return `Pdiff ${v.diff.toFixed(1)} Pa · Pstatic ${(v.static / 100).toFixed(1)} hPa · T ${(v.sat - 273.15).toFixed(1)} °C`;
    if (s.typeKey === 'Fix2') return `${v.lat.toFixed(6)}, ${v.lon.toFixed(6)} · ${v.hmsl.toFixed(1)} m · sats ${v.sats} · fix ${v.status}`;
    if (s.typeKey === 'BatteryInfo') return `${v.voltage.toFixed(2)} V · ${v.current.toFixed(1)} A · ${v.soc} %`;
    return `${s.size} B`;
  }

  function build() {
    const t = tr;
    root.innerHTML = `<div class="dc-bar"><label>${esc(t('bus'))} <select id="dcBus"><option value="1">CAN1</option><option value="2">CAN2</option></select></label>
      <label>${esc(t('node'))} <input id="dcNodeId" type="number" min="1" max="127" value="${S.client ? S.client.nodeId : 126}"></label>
      <button class="cc-button primary" type="button" id="dcConnect"></button><span class="dc-status" id="dcStatus" role="status" aria-live="polite"></span></div>
      <p class="dc-warn">${esc(t('warn'))}</p>
      <div class="cc-card"><div class="cc-card-title"><span>⇄</span><strong>${esc(t('nodes'))}</strong><small>DRONECAN · NodeStatus</small></div><div class="dc-tablewrap"><table class="dc-table" id="dcNodes"></table></div></div>
      <div class="cc-card" id="dcParamsCard" hidden><div class="cc-card-title"><span>≡</span><strong id="dcParamsTitle"></strong><small id="dcParamsInfo"></small></div>
        <div class="dc-bar"><button class="cc-button" type="button" id="dcRead">${esc(t('read'))}</button><button class="cc-button ghost" type="button" id="dcCancel" hidden>${esc(t('cancel'))}</button><button class="cc-button" type="button" id="dcSave">${esc(t('save'))}</button>
        <input id="dcFilter" type="search" placeholder="${esc(t('filter'))}" aria-label="${esc(t('filter'))}"><span class="dc-status" id="dcParamMsg" role="status" aria-live="polite"></span></div>
        <p class="dc-note">${esc(t('needDisarm'))}</p><div class="dc-tablewrap dc-tall"><table class="dc-table" id="dcParams"></table></div></div>
      <div class="cc-card"><div class="cc-card-title"><span>◈</span><strong>${esc(t('live'))}</strong><small>DRONECAN · MESSAGES</small></div><div class="dc-tablewrap"><table class="dc-table" id="dcLive"></table></div></div>`;
    root.querySelector('#dcBus').value = String(S.bus);
    root.querySelector('#dcBus').addEventListener('change', e => { S.bus = +e.target.value; });
    root.querySelector('#dcNodeId').addEventListener('change', e => { const v = Math.max(1, Math.min(127, +e.target.value | 0)); e.target.value = v; ensureClient().nodeId = v; });
    root.querySelector('#dcConnect').addEventListener('click', () => (S.forwarding ? stop(true) : start()));
    root.querySelector('#dcRead').addEventListener('click', readParams);
    root.querySelector('#dcCancel').addEventListener('click', () => { S.cancel = true; });
    root.querySelector('#dcSave').addEventListener('click', saveParams);
    root.querySelector('#dcFilter').addEventListener('input', e => { S.filter = e.target.value.trim().toUpperCase(); renderParams(); });
    root.querySelector('#dcNodes').addEventListener('click', e => { const b = e.target.closest('button[data-act]'); if (!b) return; const id = +b.dataset.id; if (b.dataset.act === 'params') selectNode(id); if (b.dataset.act === 'restart') restartNode(id); });
    root.querySelector('#dcParams').addEventListener('click', e => { const b = e.target.closest('button[data-write]'); if (b) writeParam(b.dataset.write); });
    S.built = true; renderAll();
  }
  function ensureClient() {
    if (!S.client) {
      S.client = DC.createClient({nodeId: 126, sendFrame: (id, data) => cc().sendCanFrame(S.bus - 1, id, data)});
      S.client.on('node', () => {}); S.client.on('message', () => {});
    }
    return S.client;
  }
  // the status line: the state of the bus, then the answer to the last action (a restart, for example) for a few seconds
  function setMsg(text, bad) {
    S.msg = text; S.msgBad = !!bad; const el = root.querySelector('#dcStatus'); if (!el) return;
    const n = S.note && Date.now() < S.note.until ? S.note : null;
    el.textContent = text + (n ? ' · ' + n.text : ''); el.classList.toggle('bad', !!bad || !!(n && n.bad));
  }
  function note(text, bad) { S.note = {text, bad: !!bad, until: Date.now() + 8000}; setMsg(S.msg, S.msgBad); }
  function renderStatus() {
    const btn = root.querySelector('#dcConnect'); if (!btn) return;
    btn.textContent = S.forwarding ? tr('disconnect') : tr('connect');
    const st = cc() && cc().getState ? cc().getState() : null;
    btn.disabled = !S.forwarding && (!st || !st.connected || st.demo || st.sysid === null);
    root.querySelector('#dcBus').disabled = S.forwarding; root.querySelector('#dcNodeId').disabled = S.forwarding;
    if (!S.forwarding) { if (!S.msg) setMsg(!st || !st.connected ? tr('nolink') : st.demo ? tr('demo') : tr('idle')); return; }
    const c = S.client, s = c.stats(), nodes = c.nodes.size;
    if (S.waitingAck) setMsg(tr('waiting'));
    else if (s.frames === 0 && Date.now() - S.since > 3000) setMsg(tr('nofr'), true);
    else setMsg(tr('ok')({fps: S.fps, nodes, bad: s.badCrc}));
  }
  function renderNodes() {
    const t = root.querySelector('#dcNodes'); if (!t) return; const c = S.client;
    const list = c ? Array.from(c.nodes.values()).sort((a, b) => a.id - b.id) : [];
    if (!list.length) { t.innerHTML = `<tbody><tr><td class="dc-empty">${esc(tr('none'))}</td></tr></tbody>`; return; }
    const st = cc() && cc().getState ? cc().getState() : null, writeOk = canWrite();
    t.innerHTML = `<thead><tr><th>${esc(tr('id'))}</th><th>${esc(tr('name'))}</th><th>${esc(tr('health'))}</th><th>${esc(tr('mode'))}</th><th>${esc(tr('uptime'))}</th><th>${esc(tr('sw'))}</th><th>${esc(tr('hw'))}</th><th>${esc(tr('seen'))}</th><th></th></tr></thead><tbody>` +
      list.map(n => {
        const off = c.offline(n), s = n.status, i = n.info;
        const sw = i ? `${i.sw.major}.${i.sw.minor}${i.sw.flags & 1 ? ' · ' + (i.sw.vcs >>> 0).toString(16) : ''}` : '—', hw = i ? `${i.hw.major}.${i.hw.minor} · ${i.hw.uid.slice(0, 8)}` : '—';
        return `<tr class="${off ? 'dc-off' : ''}"><td>${n.id}</td><td>${esc(nodeName(n))}</td><td class="dc-h${s ? s.health : 0}">${s ? esc(tr('healthNames')[s.health]) : '—'}</td><td>${s ? esc(tr('modeNames')[s.mode] || s.mode) : '—'}</td><td>${s ? fmtUptime(s.uptime) : '—'}</td><td>${esc(sw)}</td><td>${esc(hw)}</td><td>${off ? esc(tr('offline')) : '✓'}</td>` +
          `<td class="dc-actions"><button class="cc-button" type="button" data-act="params" data-id="${n.id}">${esc(tr('params'))}</button><button class="cc-button ghost" type="button" data-act="restart" data-id="${n.id}"${writeOk ? '' : ' disabled'}>${esc(tr('restart'))}</button></td></tr>`;
      }).join('') + '</tbody>';
  }
  function renderLive() {
    const t = root.querySelector('#dcLive'); if (!t) return; const c = S.client, rows = c ? Array.from(c.seen.values()).sort((a, b) => a.source - b.source || a.typeId - b.typeId) : [];
    if (!rows.length) { t.innerHTML = ''; return; }
    t.innerHTML = `<thead><tr><th>${esc(tr('lnode'))}</th><th>${esc(tr('ltype'))}</th><th>${esc(tr('lcount'))}</th><th>${esc(tr('lval'))}</th></tr></thead><tbody>` +
      rows.slice(0, 60).map(s => `<tr><td>${s.source}</td><td>${esc(s.typeKey || 'ID ' + s.typeId)}</td><td>${s.count}</td><td>${esc(summary(s))}</td></tr>`).join('') + '</tbody>';
  }
  function renderParams() {
    const card = root.querySelector('#dcParamsCard'); if (!card) return; card.hidden = S.selected === null; if (S.selected === null) return;
    root.querySelector('#dcParamsTitle').textContent = tr('nodeParams')(S.selected);
    root.querySelector('#dcParamsInfo').textContent = S.listing ? tr('readn')(S.params.length) : (S.params.length ? S.params.length + ' ' + tr('params').toLowerCase() : '');
    root.querySelector('#dcRead').disabled = S.listing; root.querySelector('#dcCancel').hidden = !S.listing; root.querySelector('#dcSave').disabled = S.listing || !canWrite();
    const t = root.querySelector('#dcParams'), f = S.filter, list = f ? S.params.filter(p => p.name.toUpperCase().includes(f)) : S.params;
    if (!S.params.length) { t.innerHTML = `<tbody><tr><td class="dc-empty">${esc(tr('pnone'))}</td></tr></tbody>`; return; }
    const writeOk = canWrite();
    t.innerHTML = `<thead><tr><th>#</th><th>${esc(tr('pname'))}</th><th>${esc(tr('pval'))}</th><th>${esc(tr('pdef'))}</th><th>${esc(tr('prange'))}</th><th></th></tr></thead><tbody>` + list.map(p => {
      const rng = p.min || p.max ? `${valText(p.min)} … ${valText(p.max)}` : '', k = kind(p.value);
      return `<tr data-name="${esc(p.name)}"><td>${p.index}</td><td class="mono">${esc(p.name)}</td><td><input class="dc-val" data-pv="${esc(p.name)}" data-kind="${k}" value="${esc(valText(p.value))}" size="14" aria-label="${esc(p.name)}"${writeOk ? '' : ' disabled'}></td><td>${esc(valText(p.default))}</td><td>${esc(rng)}</td>` +
        `<td><button class="cc-button" type="button" data-write="${esc(p.name)}"${writeOk ? '' : ' disabled'}>${esc(tr('write'))}</button><span class="dc-rowmsg" data-rm="${esc(p.name)}"></span></td></tr>`;
    }).join('') + '</tbody>';
  }
  function renderAll() { renderStatus(); renderNodes(); renderLive(); renderParams(); }
  function paramMsg(text, bad) { S.paramMsg = text; const el = root.querySelector('#dcParamMsg'); if (el) { el.textContent = text; el.classList.toggle('bad', !!bad); } }

  async function start() {
    const a = cc(); const st = a && a.getState ? a.getState() : null;
    if (!st || !st.connected || st.demo || st.sysid === null) { setMsg(!st || !st.connected ? tr('nolink') : tr('demo'), true); return; }
    const c = ensureClient(); c.reset(); S.since = Date.now(); S.frames0 = 0; S.fps = 0; S.waitingAck = true; S.forwarding = true; S.msg = '';
    try { await a.canForward(S.bus); } catch (e) { S.forwarding = false; S.waitingAck = false; setMsg(tr('failed')(e.message), true); renderAll(); return; }
    setTimeout(() => { if (S.waitingAck) { S.waitingAck = false; renderStatus(); } }, 2500);
    clearInterval(S.timer); let tick = 0;
    S.timer = setInterval(() => {
      tick++; const s = c.stats(); S.fps = Math.round((s.frames - S.frames0) * 2); S.frames0 = s.frames;
      if (tick % 2 === 0) c.broadcastStatus().catch(() => {});
      // the controller stops forwarding when it hears no request for a few seconds: the request is repeated
      if (tick % 4 === 0) cc().canForward(S.bus).catch(() => {});
      renderStatus(); renderNodes(); renderLive();
    }, 500);
    renderAll();
  }
  async function stop(sendStop) {
    clearInterval(S.timer); S.timer = null; const was = S.forwarding; S.forwarding = false; S.waitingAck = false; S.cancel = true;
    if (was && sendStop && cc() && cc().canForward) { try { await cc().canForward(0); } catch (e) { /* the link may be gone */ } }
    S.msg = was ? tr('stopped') : ''; if (S.built) { renderAll(); setMsg(S.msg); }
  }
  function selectNode(id) { S.selected = id; S.params = []; S.filter = ''; paramMsg(''); renderParams(); const f = root.querySelector('#dcFilter'); if (f) f.value = ''; readParams(); }
  async function readParams() {
    if (S.selected === null || S.listing || !S.client) return; S.listing = true; S.cancel = false; S.params = []; paramMsg(''); renderParams();
    const id = S.selected; let lastRender = 0;
    try {
      const list = await S.client.listParams(id, (n, r) => { S.params.push(r); const now = Date.now(); if (now - lastRender > 400) { lastRender = now; root.querySelector('#dcParamsInfo').textContent = tr('readn')(n); } }, () => S.cancel || !S.forwarding);
      S.params = list;
    } catch (e) { paramMsg(tr('failed')(e.message), true); }
    S.listing = false; renderParams();
  }
  function parseInput(text, k) {
    if (k === 'real') { const x = Number(text); return text.trim() !== '' && Number.isFinite(x) ? {real: x} : null; }
    if (k === 'int') { const x = Number(text); return text.trim() !== '' && Number.isInteger(x) ? {int: x} : null; }
    if (k === 'bool') { const s = text.trim().toLowerCase(); return s === '1' || s === 'true' ? {bool: 1} : s === '0' || s === 'false' ? {bool: 0} : null; }
    return {str: text};
  }
  async function writeParam(name) {
    if (!canWrite() || S.selected === null) return;
    const inp = root.querySelector(`input[data-pv="${CSS.escape(name)}"]`), msg = root.querySelector(`[data-rm="${CSS.escape(name)}"]`); if (!inp) return;
    const v = parseInput(inp.value, inp.dataset.kind); if (!v) { if (msg) msg.textContent = tr('badValue'); return; }
    try {
      const r = await S.client.setParam(S.selected, name, v); const p = S.params.find(x => x.name === name); if (p && r.value) p.value = r.value;
      inp.value = valText(r.value); if (msg) msg.textContent = '✓ ' + tr('written');
    } catch (e) { if (msg) msg.textContent = tr('failed')(e.message); }
  }
  async function saveParams() {
    if (!canWrite() || S.selected === null) return; paramMsg('…');
    try { const r = await S.client.saveParams(S.selected); paramMsg(r.ok ? tr('saved') : tr('saveNo'), !r.ok); } catch (e) { paramMsg(tr('failed')(e.message), true); }
  }
  async function restartNode(id) {
    if (!canWrite() || !window.confirm(tr('restartAsk')(id))) return;
    try { const r = await S.client.restartNode(id); note(`${id}: ` + (r.ok ? tr('restarted') : tr('failed')('refused')), !r.ok); } catch (e) { note(`${id}: ` + tr('failed')(e.message), true); }
  }

  window.addEventListener('atlas:message', ev => {
    const d = ev.detail; if (!d) return;
    if (d.type === 'can_frame') { if (S.forwarding && S.client) { if (S.waitingAck) { S.waitingAck = false; } S.client.onFrame(d.canId, d.data); } return; }
    if (d.type === 'ack' && d.command === 32000 && S.waitingAck) { S.waitingAck = false; if (d.result !== 0) { stop(false).then(() => setMsg(tr('refused')(d.result), true)); } }
  });
  window.addEventListener('atlas:state', () => { const st = cc() && cc().getState ? cc().getState() : null; if (S.forwarding && (!st || !st.connected)) stop(false); if (S.built) { renderStatus(); renderNodes(); renderParams(); } });
  window.addEventListener('atlas:navigate', ev => { if (ev.detail && ev.detail.tab !== 'dronecan' && S.forwarding) stop(true); if (ev.detail && ev.detail.tab === 'dronecan' && S.built) renderAll(); });
  window.addEventListener('atlas:language', () => { const nav = document.getElementById('dcNavLabel'); if (nav) nav.textContent = tr('title'); const h = document.getElementById('dcTitle'); if (h) h.textContent = tr('title'); const p = document.getElementById('dcIntro'); if (p) p.textContent = tr('intro'); if (S.built) build(); });
  window.addEventListener('pagehide', () => { if (S.forwarding && cc() && cc().canForward) { try { cc().canForward(0).catch(() => {}); } catch (e) { /* closing */ } } });
  const intro = document.getElementById('dcIntro'); if (intro) intro.textContent = tr('intro');
  build();
  window.AtlasDroneCANUi = Object.freeze({state: S, start, stop, selectNode, readParams, writeParam});
})();
