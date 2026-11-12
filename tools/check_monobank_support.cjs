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
assert.ok(privacy.includes('Tally')&&privacy.includes('Google Sheets'));
console.log('PASS: single one-click monobank CTA, glitch animations, Tally and three languages.');
