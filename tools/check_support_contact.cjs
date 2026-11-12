/* A.T.L.A.S. support dialog and firmware catalog regressions. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const page=read('index.html'),app=read('js/site/app.js'),script=read('js/site/contact-support.js'),css=read('css/contact-support.css');
assert.ok(page.includes('id="issuesLink"')&&page.includes('aria-haspopup="dialog"'));
assert.ok(page.includes('id="supportContactDialog"')&&page.includes('aria-labelledby="supportContactTitle"'));
for(const id of ['supportContactClose','supportContactSend','supportContactSendLabel','supportContactEmail','supportContactCopy','supportContactDescription']){
 assert.ok(page.includes('id="'+id+'"'),'Missing contact element: '+id);
}
assert.ok(page.includes('src="js/site/contact-support.js"')&&page.includes('href="css/contact-support.css"'));
assert.ok(page.includes('mailto:deluxe.history@outlook.com'));
assert.ok(script.includes("const email='deluxe.history@outlook.com'"));
assert.ok(script.includes('dialog.showModal()')&&script.includes('dialog.close()'));
assert.ok(script.includes('encodeURIComponent(t.subject)')&&script.includes('navigator.clipboard.writeText(email)'));
assert.ok(script.includes("atlas:languagechange")&&script.includes('translations.ru'));
assert.ok(script.includes('uk:')&&script.includes('en:'));
assert.ok(css.includes('.atlas-contact-dialog::backdrop')&&css.includes('.support-contact-trigger:focus-visible'));
assert.ok(!app.includes('version-gpl-note'),'GPL reminder in firmware card must be hidden');
assert.ok(!app.includes('sourceNotice'),'GPL reminder text in firmware card must be removed');
const docs=read('docs/RELEASE-DEPLOYMENT.md');
assert.ok(docs.includes('GNU GPLv3')&&docs.includes('Corresponding Source'),'Licensing obligations must remain documented');
console.log('PASS: multilingual modal and mailto; copied address; firmware-card warning removed; GPL docs retained.');
