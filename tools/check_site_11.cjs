'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = file => fs.readFileSync(file, 'utf8');

function checkPageTitle() {
  const handlers = new Map();
  const tag = () => ({setAttribute() {}});
  const document = {
    title: '', documentElement: {lang: 'en'},
    head: {querySelector: () => null, append() {}}, createElement: tag
  };
  const window = {addEventListener: (name, callback) => handlers.set(name, callback)};
  vm.runInNewContext(read('page-meta.js'), {
    document, window, location: {pathname: '/a.t.l.a.s-site/index.html'},
    MutationObserver: class { observe() {} }
  });
  assert.match(document.title, /^Configurator A\.T\.L\.A\.S\./);
  for (const [lang, event, prefix] of [
    ['ru', 'atlas:languagechange', 'Конфигуратор A.T.L.A.S.'],
    ['uk', 'atlas:languagechange', 'Конфігуратор A.T.L.A.S.'],
    ['en', 'atlas:language', 'Configurator A.T.L.A.S.']
  ]) {
    document.documentElement.lang = lang;
    handlers.get(event)();
    assert.ok(document.title.startsWith(prefix), document.title);
    if (lang === 'ru') assert.ok(read('index.html').includes(`<title>${document.title}</title>`));
  }
}

function checkRelease() {
  const window = {};
  vm.runInNewContext(read('data/changelog/1.1.js'), {window});
  const release = window.AtlasRelease11;
  assert.equal(release.version, '1.1');
  assert.equal(release.sources.length, 47);
  assert.equal(new Set(release.sources).size, release.sources.length);
  assert.ok(release.changes.length >= 25);
  for (const lang of ['ru', 'uk', 'en']) {
    for (const item of release.changes) {
      assert.equal(item[lang].length, 3);
      assert.ok(item[lang].every(line => line.trim().length > 0));
    }
  }
  const html = read('changelog.html');
  const scripts = [...html.matchAll(/<script\s+src="([^"?]+)(?:\?[^\"]*)?"\s+defer><\/script>/g)].map(match => match[1]);
  const previous = scripts.indexOf('data/changelog/1.1.js');
  const current = scripts.indexOf('data/changelog/1.2.js');
  const renderer = scripts.indexOf('changelog.js');
  assert.ok(previous >= 0 && current > previous && renderer > current,
    'Load both release datasets before the renderer, allowing cache-version queries');
  assert.match(read('changelog.js'), /version:'1\.0'/);
}

async function checkMetadataFallback() {
  const handlers = new Map();
  const nodes = new Map(['paramMetadataFile', 'paramMetadataOnline', 'paramMetadataStatus'].map(id =>
    [id, {addEventListener: (event, callback) => handlers.set(id + ':' + event, callback)}]));
  const window = {AtlasMetadataInline: JSON.parse(read('data/param-metadata.json')), dispatchEvent() {}};
  vm.runInNewContext(read('param-tree.js'), {
    window, document: {getElementById: id => nodes.get(id)}, Event: class {},
    fetch: async () => ({ok: true, json: async () => ({
      ArduPlane: {'ArduPlane:ROLL_LIMIT_DEG': {DisplayName: 'Official roll limit'}}
    })})
  });
  const tree = window.AtlasParamTree;
  tree.initialize({render() {}, langGetter: () => 'en'});
  await handlers.get('paramMetadataOnline:click')();
  let definitions = tree.getMetadata();
  assert.equal(definitions.get('ROLL_LIMIT_DEG').DisplayName, 'Official roll limit');
  assert.equal(definitions.get('RUD_LIMIT_DEG').Range.high, '45');
  const file = {text: async () => JSON.stringify({parameters: {
    RUD_LIMIT_DEG: {Description: 'Firmware-specific description'}
  }})};
  await handlers.get('paramMetadataFile:change')({target: {files: [file]}});
  definitions = tree.getMetadata();
  assert.equal(definitions.get('RUD_LIMIT_DEG').Description, 'Firmware-specific description');
}

async function checkQueue() {
  const configurator = read('configurator.js');
  assert.match(configurator, /tab==='basic'&&previous!=='basic'\)renderBasic\(\)/);
  const source = configurator.slice(configurator.indexOf('async function transmit('),
    configurator.indexOf('async function requestStreams('));
  let resume, sent = 0;
  const port = {writable: {getWriter: () => ({write: async () => { sent++; }, releaseLock() {}})}};
  const socket = {readyState: 1, send() { sent++; }};
  const state = {connected: true, rxActive: true, port, seq: 0,
    txPromise: new Promise(resolve => { resume = resolve; })};
  const context = {state, txGeneration: 0, M: {createFrame() {}}, tr: key => key, WebSocket: {OPEN: 1}};
  vm.runInNewContext(source, context);
  const stale = assert.rejects(context.transmit(23, []), /Connection closed/);
  // Web Serial may return the same port object after reopening.
  context.txGeneration++;
  resume();
  await stale;
  assert.equal(sent, 0);
  await context.transmit(23, []);
  assert.equal(sent, 1);
  Object.assign(state, {port: null, netSocket: socket, bridgeReady: true});
  state.txPromise = new Promise(resolve => { resume = resolve; });
  const replaced = assert.rejects(context.transmit(23, []), /WebSocket closed/);
  state.netSocket = {...socket};
  resume();
  await replaced;
  assert.equal(sent, 1);
  await context.transmit(23, []);
  assert.equal(sent, 2);
}

async function main() {
  checkPageTitle();
  checkRelease();
  await checkMetadataFallback();
  await checkQueue();
  console.log('PASS: localized titles, release 1.1, parameter metadata, and connection-scoped MAVLink queue.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
