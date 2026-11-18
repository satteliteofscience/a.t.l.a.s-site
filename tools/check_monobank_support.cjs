/* A.T.L.A.S. static donation and Early Tester regression checks. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const script=fs.readFileSync('js/site/support.js','utf8');
const css=fs.readFileSync('css/support.css','utf8');
const donor=JSON.parse(fs.readFileSync('data/support.json','utf8'));
const tester=JSON.parse(fs.readFileSync('data/subscriptions.json','utf8'));
const privacy=fs.readFileSync('privacy.html','utf8');
assert.equal(donor.donation_provider,'monobank-jar');
assert.equal(donor.donation_url,'https://send.monobank.ua/jar/7jkKfdWREX');
assert.equal(donor.iban,'');
assert.equal(tester.provider,'tally-hosted');
assert.equal(tester.form_url,'https://tally.so/r/ArKQJl');
assert.equal(tester.review,'manual');
assert.equal(tester.automated_newsletters,false);
for(const [value,host,pattern] of [[donor.donation_url,'send.monobank.ua',/^\/jar\/[A-Za-z0-9_-]+\/?$/],[tester.form_url,'tally.so',/^\/r\/[A-Za-z0-9]+\/?$/]]){
 const u=new URL(value);
 assert.equal(u.protocol,'https:');assert.equal(u.hostname,host);assert.match(u.pathname,pattern);
}
for(const id of ['atlasDonateShortcut','atlasQuickDonate','atlasQuickDonateLabel','atlasQuickDonateSubtitle','atlasQuickDonateNote','atlasTesterLink','atlasTesterLinkLabel','atlasTesterPrivacyLink','atlasTesterInfo','atlasTesterStep1','atlasTesterStep2','atlasTesterStep3']){
 assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
}
for(const id of ['atlasDonation','donationReveal','donationPanel','atlasDirectDonation','donationDirectLink','atlasSubscriberForm']){
 assert.ok(!html.includes('id="'+id+'"'),'Legacy duplicate/spoiler remains: '+id);
}
assert.equal((html.match(/href="https:\/\/send\.monobank\.ua\/jar\/7jkKfdWREX"/g)||[]).length,1,'exactly one direct Jar link');
assert.match(html,/<a[^>]*id="atlasQuickDonate"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
assert.ok(html.indexOf('id="atlasTesterLink"')>html.indexOf('class="support-early"'));
assert.ok(html.includes('id="atlasQuickDonateLabel"')&&html.includes('id="atlasQuickDonateSubtitle"'));
assert.ok(script.includes("shortcut.hidden=!jar"),'Jar URL must be validated');
assert.ok(script.includes("put('atlasQuickDonateLabel',t.quickDonate)"),'RU/UA/EN text must be dynamic');
assert.ok(script.includes("put('atlasQuickDonateSubtitle',t.subtitle)"));
assert.ok(!script.includes("donationReveal")&&!script.includes("donationDirectLink"),'Old JS spoiler logic present');
for(const s of ['ПОДДЕРЖАТЬ ЧЕРЕЗ MONOBANK','ПІДТРИМАТИ ЧЕРЕЗ MONOBANK','SUPPORT VIA MONOBANK','Подать заявку тестировщика','Подати заявку тестувальника','Apply to test early firmware']){
 assert.ok(script.includes(s),'Missing translation '+s);
}
assert.ok(css.includes('.atlas-donate-cta:hover .atlas-donation-glitch'));
assert.ok(css.includes('.atlas-donate-cta:active .atlas-donation-glitch'));
assert.ok(css.includes('prefers-reduced-motion:reduce'));
assert.ok(script.includes("for(const link of [$('atlasQuickDonate'),$('atlasTesterLink')])"));
const privacyJs=fs.readFileSync('js/site/privacy.js','utf8'),supportJs=fs.readFileSync('js/site/contact-support.js','utf8');
assert.ok(privacy.includes('Tally')&&privacy.includes('Google Sheets'));
// the privacy page has no inline script (Content-Security-Policy); its texts are in js/site/privacy.js, in three languages with the same slots
assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(privacy),'privacy.html must not hold an inline script');assert.ok(privacy.includes('src="js/site/privacy.js"'));
const dict=JSON.parse(privacyJs.match(/const d=(\{.*\});\r?\nconst keys/)[1]),slots=[...privacyJs.match(/const keys=\[(.*?)\]/)[1].matchAll(/'(\w+)'/g)].map(m=>m[1]);
for(const l of ['ru','uk','en'])assert.equal(dict[l].length,slots.length,'every language fills every slot: '+l);
for(const id of slots)assert.ok(privacy.includes('id="'+id+'"'),'slot element '+id);
// the operator contact is the support address already shown on the site; the third-party services and the retention are named in every language
const mail=privacy.match(/id="privacyMailLink" href="mailto:([^"]+)"/)[1];assert.ok(supportJs.includes(mail)&&html.includes(mail),'the privacy contact is the site support address');
for(const l of ['ru','uk','en']){const all=dict[l].join(' ');for(const w of ['Google Fonts','OpenStreetMap','Esri','Cloudflare','GitHub Pages','PIN','Tally','Google Sheet'])assert.ok(all.includes(w),l+' mentions '+w);assert.ok(!/ещё требуется|ще потрібно|still needs|необходим опубликованный|потрібен опублікований/.test(all),l+' no longer says the contact is missing');}
console.log('PASS: single one-click monobank CTA, glitch animations, Tally and three languages.');
