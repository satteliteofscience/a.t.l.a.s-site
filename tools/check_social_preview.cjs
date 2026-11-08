/* Static Open Graph and Twitter Card metadata must work without JavaScript. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root='https://satteliteofscience.github.io/a.t.l.a.s-site/';
const image=root+'assets/github-social-preview.jpg';
const pages=['index.html','configurator.html','faq.html','changelog.html','privacy.html'];
const og=['og:type','og:site_name','og:locale','og:url','og:title','og:description','og:image','og:image:secure_url','og:image:type','og:image:alt'];
const tw=['twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:alt'];
for(const page of pages){
 const html=fs.readFileSync(page,'utf8');
 const head=html.split('</head>')[0];
 const canonical=page==='index.html'?root:root+page;
 const tags=[...head.matchAll(/<meta\b[^>]*>/g)].map(m=>m[0]);
 assert.ok(head.includes('<link rel="canonical" href="'+canonical+'">'),page+' canonical');
 for(const name of og)assert.equal(tags.filter(t=>t.includes('property="'+name+'"')).length,1,page+' '+name);
 for(const name of tw)assert.equal(tags.filter(t=>t.includes('name="'+name+'"')).length,1,page+' '+name);
 for(const [name,val] of [['og:url',canonical],['og:image',image],['og:image:secure_url',image],['og:image:type','image/jpeg'],['twitter:image',image],['twitter:card','summary_large_image']]){
  const attr=name.startsWith('og:')?'property':'name';
  const tag=tags.find(t=>t.includes(attr+'="'+name+'"'));
  assert.ok(tag.includes('content="'+val+'"'),page+' '+name);
 }
 for(const name of ['og:title','og:description','twitter:title','twitter:description']){
  const attr=name.startsWith('og:')?'property':'name';
  const tag=tags.find(t=>t.includes(attr+'="'+name+'"'));
  assert.ok(/content="[^"]{15,}"/.test(tag),page+' '+name+' should have descriptive text');
 }
}
const jpeg=fs.readFileSync('assets/github-social-preview.jpg');
assert.ok(jpeg.byteLength>10000 && jpeg.byteLength<5000000,'Preview image size');
assert.equal(jpeg[0],0xff,'JPEG SOI marker');
assert.equal(jpeg[1],0xd8,'JPEG SOI marker');
assert.equal(jpeg[jpeg.byteLength-2],0xff,'JPEG EOI marker');
assert.equal(jpeg[jpeg.byteLength-1],0xd9,'JPEG EOI marker');
console.log('PASS: static social previews for five pages; image '+jpeg.byteLength+' bytes');
