/* Read-only A.T.L.A.S. static support checks. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const c=JSON.parse(fs.readFileSync('data/support.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('support.js','utf8');
const priv=fs.readFileSync('privacy.html','utf8');
assert.equal(c.donation_provider,'monobank-jar');
assert.equal(c.donation_url,'https://send.monobank.ua/jar/7jkKfdWREX');
assert.equal(c.donation_title,'A.T.L.A.S. — Підтримка розробки');
assert.equal(c.iban,'');
const url=new URL(c.donation_url);
assert.equal(url.protocol,'https:');
assert.equal(url.hostname,'send.monobank.ua');
assert.match(url.pathname,/^\/jar\/[A-Za-z0-9_-]+\/?$/);
for(const id of ['atlasDonation','donationReveal','donationPanel','atlasDirectDonation','donationDirectTitle','donationDirectIntro','donationDirectLink','donationDirectNote','atlasSubscriberForm']){
 assert.ok(html.includes('id="'+id+'"'),'missing element '+id);
}
assert.match(html,/<a[^>]*id="donationDirectLink"[^>]*rel="noopener noreferrer"/);
assert.ok(js.includes("const monobankJarURL="));
assert.ok(js.includes('direct.hidden=!jarURL'));
assert.ok(js.includes("$('donationSkipSubscription').hidden=!!jarURL"));
assert.ok(js.includes('!isJar&&validIBAN'));
for(const label of ['Поддержать через monobank Банку','Підтримати через monobank Банку','Support via monobank Jar']){
 assert.ok(js.includes(label),'missing language: '+label);
}
for(const label of ['monobank Банки','monobank Jar'])assert.ok(priv.includes(label));
console.log('PASS: Jar URL, independent donations, hidden IBAN, RU/UA/ENG, privacy.');
