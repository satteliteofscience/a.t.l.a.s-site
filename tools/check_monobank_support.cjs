/* Read-only A.T.L.A.S. static donor + Early Tester checks. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const donation=JSON.parse(fs.readFileSync('data/support.json','utf8'));
const signup=JSON.parse(fs.readFileSync('data/subscriptions.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('support.js','utf8');
const privacy=fs.readFileSync('privacy.html','utf8');
assert.equal(donation.donation_provider,'monobank-jar');
assert.equal(donation.donation_url,'https://send.monobank.ua/jar/7jkKfdWREX');
assert.equal(donation.donation_title,'A.T.L.A.S. — Підтримка розробки');
assert.equal(donation.iban,'');
assert.equal(signup.provider,'tally-hosted');
assert.equal(signup.form_url,'https://tally.so/r/ArKQJl');
assert.equal(signup.review,'manual');
assert.equal(signup.automated_newsletters,false);
for(const [value,host,pattern] of [
 [donation.donation_url,'send.monobank.ua',/^\/jar\/[a-zA-Z0-9_-]+\/?$/],
 [signup.form_url,'tally.so',/^\/r\/[a-zA-Z0-9]+\/?$/]
]){
 const url=new URL(value);
 assert.equal(url.protocol,'https:');assert.equal(url.hostname,host);assert.match(url.pathname,pattern);
}
for(const id of ['atlasDonation','donationReveal','donationPanel','atlasDirectDonation','donationDirectLink','atlasTesterApplyPanel','atlasTesterLink','atlasTesterPrivacyLink','atlasTesterInfo','atlasTesterStep1','atlasTesterStep2','atlasTesterStep3']){
 assert.ok(html.includes('id="'+id+'"'),'missing element '+id);
}
assert.match(html,/<a[^>]*id="donationDirectLink"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
assert.match(html,/<a[^>]*id="atlasTesterLink"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
assert.ok(!html.includes('id="atlasSubscriberForm"'),'legacy email form must be removed');
assert.ok(js.includes("valid(support.donation_url,'send.monobank.ua'"));
assert.ok(js.includes('donationBlock.hidden=!jar'), 'Jar container must become visible when a valid donation URL is configured');
assert.ok(js.includes('donationLink.hidden=!jar'), 'Jar payment button must be visible when a valid donation URL is configured');
assert.ok(js.includes("valid(application.form_url,'tally.so'"));
for(const fragment of ['Поддержать через monobank Банку','Підтримати через monobank Банку','Support via monobank Jar','Подать заявку тестировщика','Подати заявку тестувальника','Apply to test early firmware']){
 assert.ok(js.includes(fragment),'missing translated label: '+fragment);
}
assert.ok(privacy.includes('Tally')&&privacy.includes('Google Sheets'));
assert.ok(privacy.includes('необязательны')&&privacy.includes('voluntary'));
console.log('PASS: monobank Jar, Tally form, three languages, privacy and manual review.');
