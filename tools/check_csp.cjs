/* Content-Security-Policy and frame guard: every page carries the same strict policy, nothing executes inline except hashed scripts,
 * and every outside host the code talks to is named in the policy (and every host in the policy is still used). */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const read=f=>fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n');
const pages=fs.readdirSync('.').filter(f=>f.endsWith('.html')).sort();
assert.ok(pages.length>=13,'all pages are checked: '+pages.length);
const parse=p=>Object.fromEntries(p.split(';').map(s=>s.trim()).filter(Boolean).map(s=>{const [k,...v]=s.split(/\s+/);return [k,v];}));
const gateway=new URL(JSON.parse(read('data/firmware-access.json')).gateway_url).origin;
let baseline=null;
for(const page of pages){
 const html=read(page);
 const metas=[...html.matchAll(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)">/gi)];
 assert.equal(metas.length,1,page+': exactly one policy');
 const at=metas[0].index,p=parse(metas[0][1]);
 // the policy comes first: before any script, stylesheet or style block
 for(const re of [/<script\b/i,/<link\b[^>]*rel="stylesheet"/i,/<style\b/i]){const m=re.exec(html);if(m)assert.ok(m.index>at,page+': the policy must come before '+re);}
 assert.deepEqual(p['default-src'],["'self'"],page);assert.deepEqual(p['object-src'],["'none'"],page);assert.deepEqual(p['base-uri'],["'self'"],page);assert.deepEqual(p['form-action'],["'self'"],page);
 // scripts: own files and hashed inline scripts only
 const script=p['script-src'];assert.equal(script[0],"'self'",page);
 for(const s of script.slice(1))assert.match(s,/^'sha256-[A-Za-z0-9+/]{43}='$/,page+': script-src holds only hashes besides self');
 const inline=[...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!/type\s*=\s*["'](?:application\/(?:ld\+)?json|text\/plain)/i.test(m[1])).map(m=>"'sha256-"+crypto.createHash('sha256').update(m[2],'utf8').digest('base64')+"'");
 assert.deepEqual([...script.slice(1)].sort(),inline.sort(),page+': the hashes are exactly those of the inline scripts (a changed inline script needs a new hash)');
 assert.ok(!/\son[a-z]+\s*=\s*["']/i.test(html),page+': no inline event handlers');assert.ok(!/href\s*=\s*["']\s*javascript:/i.test(html),page+': no javascript: links');
 // every page has the same policy apart from the hashes
 const rest=JSON.stringify(Object.entries(p).filter(([k])=>k!=='script-src'));if(baseline===null)baseline=rest;assert.equal(rest,baseline,page+': same policy as the other pages');
 assert.ok(p['connect-src'].includes(gateway),page+': the firmware gateway of data/firmware-access.json is allowed');
 // frame guard: the first script of every page except the self-contained 404
 if(page==='404.html')assert.ok(!html.includes('frame-guard.js'));
 else{const first=/<script\b[^>]*>/i.exec(html);assert.equal(first[0],'<script src="js/site/frame-guard.js">',page+': the frame guard is the first script');assert.ok(first.index>at);}
}
// the guard hides a page shown in a frame of another origin and keeps same-origin frames working
const guard=read('js/site/frame-guard.js');
assert.match(guard,/window\.top!==window\.self/);assert.match(guard,/window\.top\.location\.origin!==window\.location\.origin/);assert.match(guard,/catch\{foreign=true;\}/);assert.match(guard,/document\.documentElement\.hidden=true/);
// behaviour of the guard in the four situations that matter (the real browser check: a frame of another origin shows an empty page)
const vm=require('node:vm');
function runGuard(makeTop){
 const doc={documentElement:{hidden:false,style:{}}},replaced=[];
 const win={location:{origin:'https://satteliteofscience.github.io',href:'https://satteliteofscience.github.io/a.t.l.a.s-site/faq.html'}};win.self=win;win.top=makeTop(win,replaced);
 vm.runInNewContext(guard,{window:win,document:doc});
 return {hidden:doc.documentElement.hidden,display:doc.documentElement.style.display,replaced};
}
assert.equal(runGuard(win=>win).hidden,false,'not framed: the page stays');
assert.equal(runGuard((win)=>({location:{origin:win.location.origin}})).hidden,false,'framed by a page of the same origin: allowed');
assert.equal(runGuard(()=>({get location(){throw new Error('SecurityError: cross-origin');}})).hidden,true,'framed by another origin that cannot be read: hidden');
const other=runGuard((win,replaced)=>({location:{origin:'https://evil.example',replace:u=>replaced.push(u)}}));
assert.equal(other.hidden,true);assert.equal(other.display,'none');assert.deepEqual(other.replaced,['https://satteliteofscience.github.io/a.t.l.a.s-site/faq.html'],'it also tries to break out to the real page');
// hosts: every outside host named in a script, style or page is allowed by the policy (or is a plain link); every host of the policy is still used
const policy=parse(/content="([^"]*)"/.exec(/<meta\s+http-equiv="Content-Security-Policy"[^>]*>/i.exec(read('index.html'))[0])[1]);
const allowedHosts=new Set(Object.values(policy).flat().filter(s=>/^https:\/\/[a-z0-9.-]+$/i.test(s)).map(s=>new URL(s).host));
const linkOnly=new Set(['github.com','ardupilot.org','arduconfigurator.com','send.monobank.ua','tally.so','satteliteofscience.github.io','example.invalid','nodejs.org','www.nodejs.org','discuss.ardupilot.org','firmware.ardupilot.org']);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const codeFiles=[...walk('js'),...walk('css'),...walk('data').filter(f=>/\.(js|json)$/.test(f)&&!f.includes(path.join('data','sitl'))),...pages];
const used=new Map();
for(const f of codeFiles){for(const m of read(f).matchAll(/https?:\/\/([a-z0-9.-]+)(?::\d+)?/gi)){const h=m[1].toLowerCase();if(/^(127\.0\.0\.1|localhost)$/.test(h)||h.endsWith('.invalid'))continue;(used.get(h)||used.set(h,new Set()).get(h)).add(f);}}
for(const [h,files] of used){if(linkOnly.has(h)||h==='www.w3.org')continue;assert.ok(allowedHosts.has(h),'host '+h+' is used in '+[...files][0]+' but not allowed by the policy (add it, or list it as link-only in this check)');}
for(const h of allowedHosts)assert.ok(used.has(h),'the policy allows '+h+' but nothing uses it any more');
console.log('PASS: strict Content-Security-Policy and frame guard on '+pages.length+' pages; '+allowedHosts.size+' outside hosts, all in use; inline scripts hashed.');
