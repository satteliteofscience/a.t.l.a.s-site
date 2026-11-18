/* The CI workflow must run everything on every push and pull request: every tools/check_*.cjs by file name, the syntax of every script and the gateway unit tests. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const yml=fs.readFileSync('.github/workflows/website-support-check.yml','utf8').replace(/\r\n/g,'\n');
const smoke=yml.slice(yml.indexOf('\n  smoke:'),yml.indexOf('\n  windows-connector-syntax:'));
assert.ok(smoke.length>200,'the smoke job exists');
// triggers: every push and pull request, and no path filter that has to be kept in sync with new files
const on=yml.slice(yml.indexOf('\non:'),yml.indexOf('\npermissions:'));
assert.match(on,/\n  push:\n/);assert.match(on,/\n  pull_request:\n/);assert.match(on,/\n  workflow_dispatch:/);
assert.ok(!/paths:/.test(on),'a path filter lets pushes skip the checks');
assert.match(yml,/permissions:\n  contents: read/);
// the whole suite by file name
assert.match(smoke,/for f in tools\/check_\*\.cjs; do/);
assert.match(smoke,/find js data tools -type f/);
assert.match(smoke,/node --check "\$f"/);
assert.match(smoke,/node --input-type=module --check < firmware-gateway\/src\/index\.js/);
assert.match(smoke,/node --test firmware-gateway\/tests\/\*\.test\.js/);
assert.match(smoke,/find Firmware\/ -type f -iname '\*\.hex'/);
assert.match(smoke,/py_compile tools\/release_manager\.py/);
assert.ok(!/node tools\/check_/.test(smoke),'a hand-written list of checks would drift again');
// the Windows connector job stays
assert.match(yml,/windows-connector-syntax:/);assert.match(yml,/A\.T\.L\.A\.S\.-TCP-Connector\.cmd/);
assert.match(yml,/\$file = 'tools\/A\.T\.L\.A\.S\.-USB-Drivers\.cmd'/);assert.match(yml,/USB-Drivers\.cmd check/);
// every check script follows the pattern the loop uses
const checks=fs.readdirSync('tools').filter(n=>/^check_.*\.cjs$/.test(n));
assert.ok(checks.length>=40,'the check scripts are all named check_*.cjs');
console.log('PASS: CI runs on every push and pull request, executes all '+checks.length+' tools/check_*.cjs checks by name, checks every script and runs the gateway tests.');
