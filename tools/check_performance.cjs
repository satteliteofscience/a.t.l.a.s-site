/* Performance invariants: faster critical rendering without behavior or visual regressions. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=f=>fs.readFileSync(f,'utf8');
const pages=['index.html','configurator.html','faq.html','changelog.html'];
const fonts='https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&amp;family=IBM+Plex+Sans:wght@400;500;600;700&amp;family=Russo+One&amp;display=swap';
for(const page of pages){
 const head=read(page).split('</head>')[0];
 assert.ok(head.includes('<link rel="preconnect" href="https://fonts.googleapis.com">'),page+' needs font stylesheet preconnect');
 assert.ok(head.includes('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'),page+' needs font file preconnect');
 assert.equal(head.split('href="'+fonts+'"').length-1,1,page+' must load the same fonts only once');
 assert.ok(head.includes('href="styles.css"'),page+' original styles must remain');
}
assert.ok(!read('styles.css').includes('@import url('),'Do not block local stylesheet on remote font discovery');
const home=read('index.html');
for(const name of ['features','downloads','guide']){
 assert.match(home,new RegExp('<img data-headline="'+name+'"[^>]+decoding="async" loading="lazy" fetchpriority="low">'),name+' should lazy load');
}
assert.match(home,/<img data-headline="hero"[^>]+decoding="async" loading="eager" fetchpriority="high">/,'hero stays high-priority');
assert.match(home,/<h2 class="block-blueprint-title">Проверенная сборка\. Ответственная эксплуатация\.<\/h2>/,'release safety heading is rendered as live text');
const config=read('configurator.js');
assert.ok(config.includes("function scheduleHorizon()"),'HUD visibility scheduler missing');
assert.ok(config.includes("document.hidden||state.selectedTab!=='dashboard'||state.hudRaf"),'Do not schedule hidden/inactive HUD frames');
assert.ok(config.includes("document.addEventListener('visibilitychange',scheduleHorizon)"),'Resume when tab visible');
assert.ok(config.includes('function drawHorizon(ts)'), 'HUD rendering preserved');
assert.ok(config.includes('ctx.clearRect(0,0,w,h)')&&config.includes('updateTelemetryUI()'), 'HUD functionality preserved');
for(const js of ['app.js','support.js','contact-support.js','firmware-access.js','dfu-ui.js']){
 assert.ok(fs.existsSync(js),'Functional module missing: '+js);
}
console.log('PASS: earlier font discovery, critical/lazy image priority, tab-aware HUD animation and functional scripts retained.');
