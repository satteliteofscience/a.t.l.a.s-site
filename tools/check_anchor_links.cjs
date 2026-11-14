/* Hash links: every link points at an id that exists on the page it names, and the CSS offsets put the target where the reader expects it
 * (no double offsets: the landing page has no sticky header, the changelog / FAQ header height is measured). The real landing positions are measured in a browser;
 * this check keeps the rules that produce them. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');
const pages=fs.readdirSync(root).filter(f=>f.endsWith('.html'));

// ids built by script: the changelog releases (js/site/changelog.js links them as '#'+release.id) and the FAQ items
const releaseIds=new Set([...['data/changelog/1.1.js','data/changelog/1.2.js','data/changelog/2.0.js','js/site/changelog.js'].flatMap(f=>[...read(f).matchAll(/["']?\bid["']?:\s*['"](release-[\w-]+)['"]/g)].map(m=>m[1]))]);
assert.ok(releaseIds.has('release-2-0')&&releaseIds.has('release-1-2'),'release ids found in data/changelog: '+[...releaseIds]);
const staticIds=file=>new Set([...read(file).matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]));
const idsOf=file=>{
 const ids=staticIds(file);
 if(file==='changelog.html')for(const id of releaseIds)ids.add(id);
 // the configurator opens a tab by its hash (#basic, #esccal, ...): the tab panels are the targets
 if(file==='configurator.html')for(const m of read(file).matchAll(/data-panel="([^"]+)"/g))ids.add(m[1]);
 return ids;
};

// ---- every hash link has a target on the page it names
let checked=0;const byTarget=new Map();
for(const page of pages){
 const html=read(page);
 for(const m of html.matchAll(/href="([^"#]*)#([^"]+)"/g)){
  const file=m[1].replace(/^\.\//,'')||page;
  if(/^[a-z]+:/i.test(file))continue;                       // an external page
  assert.ok(fs.existsSync(path.join(root,file)),`${page}: link to ${file}#${m[2]} names a page that does not exist`);
  assert.ok(idsOf(file).has(m[2]),`${page}: ${file}#${m[2]} has no target with that id`);
  checked++;if(file==='index.html')byTarget.set(m[2],(byTarget.get(m[2])||0)+1);
 }
}
assert.ok(checked>=20,'hash links checked: '+checked);
// the release links that the changelog page builds itself
const changelogJs=read('js/site/changelog.js');assert.match(changelogJs,/link\.href='#'\+release\.id/);
for(const id of releaseIds)assert.ok(idsOf('changelog.html').has(id),id);
// ids are unique on every page (a duplicate id sends the reader to the first one)
for(const page of pages){const ids=[...read(page).matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);const seen=new Set();for(const id of ids){assert.ok(!seen.has(id),`${page}: duplicate id ${id}`);seen.add(id);}}

// ---- the landing page: no sticky header, so no scroll-padding; every section lands with its first label --anchor-gap below the top edge
const styles=read('css/styles.css'),index=read('index.html');
assert.match(styles,/html\{scroll-behavior:smooth;scroll-padding-top:0\}/,'the landing page has no sticky header: no scroll-padding');
assert.match(styles,/:root\{--anchor-gap:28px\}/);
assert.match(styles,/\.section\{--section-pt:116px;[^}]*padding:var\(--section-pt\) 30px 0;scroll-margin-top:calc\(var\(--anchor-gap\) - var\(--section-pt\)\)\}/,'a section lands where its padding ends');
for(const rule of [/\.downloads-section\{--section-pt:124px\}/,/\.project-section\{--section-pt:115px;/,/\.section\{--section-pt:88px\}/,/\.section\{--section-pt:75px;padding:var\(--section-pt\) 18px 0\}/,/\.downloads-section\{--section-pt:84px\}/,/\.support-section\{--section-pt:34px;/,/\.support-section\{--section-pt:26px;/])assert.match(styles,rule,String(rule));
assert.doesNotMatch(styles,/\.(section|downloads-section|project-section|support-section)\{[^}]*padding(-top)?:\d+px/,'a section padding must go through --section-pt, or its anchor offset drifts');
assert.doesNotMatch(styles,/scroll-margin-top:\d+px\}[^]*scroll-margin-top:\d+px\}[^]*scroll-margin-top:\d+px\}/,'only the metrics strip and the safety block carry fixed margins');
assert.match(styles,/\.metrics\{scroll-margin-top:20px\}\.safety-block\{scroll-margin-top:24px\}/);
// each link target on the landing page is a section the rules above cover
const classOf=id=>{const m=index.match(new RegExp(`<(\\w+)[^>]*\\sid="${id}"[^>]*>`));assert.ok(m,id);return (m[0].match(/class="([^"]*)"/)||[,''])[1].split(/\s+/);};
for(const id of byTarget.keys()){const c=classOf(id);assert.ok(id==='top'||c.includes('section')||c.includes('metrics')||c.includes('safety-block')||c.includes('site-header'),`#${id} is not a section the anchor rules know: ${c}`);}
for(const id of ['overview','features','downloads','guide','support','top'])assert.ok(byTarget.has(id)||id==='top'||id==='overview',id+' is linked');

// ---- the changelog and FAQ pages: a sticky header whose real height drives the offset, no extra margins on the targets
const changelogCss=read('css/changelog.css'),faqCss=read('css/faq.css');
assert.match(changelogCss,/html\{scroll-padding-top:calc\(var\(--ch-head-h,60px\) \+ 16px\)\}/);
assert.doesNotMatch(changelogCss,/scroll-margin-top/,'release targets add no margin on top of the header offset');
assert.doesNotMatch(faqCss,/scroll-margin-top/,'FAQ items add no margin on top of the header offset');
assert.match(changelogCss,/\.ch-head\{position:sticky;top:0;/);
const helper=read('js/site/anchor-land.js');
assert.match(helper,/--ch-head-h/);assert.match(helper,/scrollPaddingTop/);assert.match(helper,/scrollMarginTop/);assert.match(helper,/behavior:'instant'/);
assert.match(helper,/for\(const name of \['wheel','touchstart','keydown','mousedown'\]\)/,'the helper never fights a reader who scrolls');
for(const page of ['index.html','faq.html','changelog.html']){
 const html=read(page),at=html.indexOf('js/site/anchor-land.js');assert.ok(at>0,page+' loads the helper');
 const firstOwnScript=html.search(/<script src="(?:js\/site\/(?:app|faq|changelog)|data\/)/);assert.ok(at<firstOwnScript,page+': the helper loads before the page scripts');
}
// ---- the configurator opens tabs by hash: a tab opened while the page is scrolled down must start where its title is visible (sticky top bar = 72 px)
const cfg=read('js/configurator/configurator.js'),wizard=read('js/configurator/quick-setup.js');
assert.match(cfg,/if\(previous!==tab\)\{const panel=document\.querySelector\('\.cc-tab\.active'\),bar=document\.querySelector\('\.cc-topbar'\);[^]*?window\.scrollTo\(\{top:Math\.max\(0,window\.scrollY\+top-edge\),behavior:'instant'\}\)/,'navigate() aligns the opened tab below the top bar');
assert.ok(cfg.indexOf("el.classList.toggle('active',el.dataset.panel===tab)")<cfg.indexOf("if(previous!==tab){const panel=document.querySelector('.cc-tab.active')"),'the alignment runs after the tab became visible');
assert.match(wizard,/function revealWizardStart\(\)\{[^]*?window\.scrollTo\(\{top:Math\.max\(0,window\.scrollY\+top-edge\),behavior:'instant'\}\)/);
assert.match(wizard,/persist\(\);render\(\);revealWizardStart\(\);/,'a wizard step opens with its title in view');
// the old support-only workaround and the double offsets are gone
assert.doesNotMatch(read('js/site/app.js'),/landAtSupport/);
console.log(`PASS: ${checked} hash links point at existing targets; offsets have no double margins (landing page, changelog, FAQ); the landing helper keeps targets in place.`);
