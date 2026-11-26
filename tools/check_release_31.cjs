'use strict';
// AI-assisted. The 3.1 state of the site: the changelog entry in RU/UK/EN (how it works and why, recommendations, when it hurts, nuances, the experimental notice), the banner, the current-release labels,
// the wind FAQ and the warning on the Wind card of the configurator.
const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const window={};vm.runInNewContext(read('data/changelog/3.1.js'),{window});
const r=window.AtlasRelease31;
assert.equal(r.version,'3.1');assert.equal(r.id,'release-3-1');assert.equal(r.channel,'UPDATE');
assert.equal(r.changes.length,11,'the wind in the navigation, the modes, the NOAID_WIND bits, the GPS wind carry-over, no learning, the recommendations, the harm and nuances, the OSD, the configurator warning, the base 4.7.3, the validation');
const texts=[];
const titles={ru:[/Ветер в наведении без GPS/,/режимы затронуты/,/Параметр NOAID_WIND/,/Перенос ветра из GPS/,/Без обучения/,/Рекомендации/,/вредно/,/OSD/,/предупреждение/,/ArduPlane 4\.7\.3/,/Проверки 3\.1/],uk:[/Вітер у наведенні без GPS/,/режими зачеплено/,/Параметр NOAID_WIND/,/Перенесення вітру з GPS/,/Без навчання/,/Рекомендації/,/шкідливо/,/OSD/,/попередження/,/ArduPlane 4\.7\.3/,/Перевірки 3\.1/],en:[/Wind in the navigation without GPS/,/modes are affected/,/NOAID_WIND parameter/,/Carrying the GPS wind over/,/Without learning/,/Recommendations/,/hurts/,/OSD/,/warning/,/ArduPlane 4\.7\.3/,/3\.1 validation/]};
for(const lang of ['ru','uk','en']){
 for(const label of ['hint','baseLabel','modLabel','sourceLabel'])assert.ok(r[label][lang].length>10,label+' '+lang);
 r.changes.forEach((c,i)=>{assert.equal(c[lang].length,3);assert.ok(c[lang].every(t=>t.trim().length>20));assert.match(c[lang][0],titles[lang][i],lang+': title of item '+(i+1));texts.push(...c[lang]);});
 texts.push(r.hint[lang]);
 assert.match(r.hint[lang],/SITL/,lang+': the hint states how the version was tested');
 assert.ok(({ru:/ЭКСПЕРИМЕНТАЛЬНО/,uk:/ЕКСПЕРИМЕНТАЛЬНО/,en:/EXPERIMENTAL/})[lang].test(r.hint[lang]),lang+': the hint opens with the experimental notice');
 const all=r.changes.map(c=>c[lang].join(' ')).join(' ');
 assert.ok(({ru:/ещё предстоит/,uk:/ще попереду/,en:/still pending/})[lang].test(all),lang+': the hardware limits are stated');
 assert.ok(/\d+ (полётов|полёта|полёт|польотів|польоти|політ|flights)/.test(all),lang+': the validation item gives the number of flights');
 assert.ok(!/{{[A-Z]+}}/.test(all),lang+': no placeholder is left in the public text');
 // how and why it works, recommendations, harm, nuances: the words that must be there
 const item=i=>r.changes[i][lang].join(' ');
 for(const name of ['NOAID_WIND','NOAID_WAGE','FBWA','GSPD','NWD','AUTO','RTL','GUIDED','LOITER','TAKEOFF','CRUISE'])assert.ok(all.includes(name),lang+': '+name);
 assert.ok(({ru:/экспериментальн/i,uk:/експериментальн/i,en:/experimental/i})[lang].test(item(0)),lang+': the first item says that the function is experimental');
 assert.ok(({ru:/не заменяет GPS/,uk:/не замінює GPS/,en:/does not replace GPS/})[lang].test(item(6)),lang+': the harm item says that it does not replace GPS');
 assert.ok(({ru:/ошибки наклона/,uk:/похибки нахилу/,en:/tilt/})[lang].test(item(6)),lang+': tilt errors can be taken for wind');
 assert.ok(({ru:/компромисс/,uk:/компроміс/,en:/compromise/})[lang].test(item(6)),lang+': a compromise in the absence of GPS');
 assert.ok(({ru:/перенесётся и ложный ветер/,uk:/перенесеться й хибний вітер/,en:/a false wind is carried over/})[lang].test(item(6)),lang+': a false source is carried over');
 assert.ok(({ru:/FBWA ведёт себя как в 3\.0/,uk:/FBWA поводиться як у 3\.0/,en:/FBWA behaves as in 3\.0/})[lang].test(item(1)),lang+': FBWA is unchanged');
 assert.ok(({ru:/Указатель ветра на OSD теперь без GPS показывает ветер счисления/,uk:/Покажчик вітру на OSD тепер без GPS показує вітер лічби/,en:/wind pointer on the OSD now shows the wind of the dead reckoning/})[lang].test(item(7)),lang+': the OSD shows the wind of the dead reckoning');
 assert.ok(/WIND/.test(item(7))&&/OSD1_WIND_EN/.test(item(7)),lang+': the station message and the OSD element');
 assert.ok(({ru:/«Ветер 0»/,uk:/«Вітер 0»/,en:/wind 0/})[lang].test(item(5)),lang+': the wind 0 command in the recommendations');
 assert.ok(({ru:/Если сомневаетесь, поставьте 0/,uk:/Якщо сумніваєтеся, поставте 0/,en:/If in doubt set 0/})[lang].test(item(5)),lang+': the fallback to 0');
 // every bit with its value, the ready values, the carry-over and its messages, no learning with NOAID_WAGE, the card with the carry-over presets
 for(const [bit,value] of [[0,1],[1,2],[2,4],[3,8],[4,16]])assert.ok(({ru:new RegExp('Бит '+bit+', значение '+value+','),uk:new RegExp('Біт '+bit+', значення '+value+','),en:new RegExp('Bit '+bit+', value '+value+',')})[lang].test(item(2)),lang+': bit '+bit+' = '+value);
 for(const v of ['15','31','9'])assert.ok(new RegExp(v+' — ').test(item(2)),lang+': the ready value '+v);
 for(const msg of ['NOAID wind from GPS','NOAID wind kept, GPS','NOAID no steady GPS wind to take'])assert.ok(item(3).includes(msg),lang+': '+msg);
 assert.ok(({ru:/после подтверждения пуска/,uk:/після підтвердження пуску/,en:/after the launch is confirmed/})[lang].test(item(3))&&({ru:/вручную ещё на земле/,uk:/вручну ще на землі/,en:/by hand on the ground/})[lang].test(item(3)),lang+': a take-off with the GPS present');
 assert.ok(item(4).includes('NOAID_WAGE')&&({ru:/заменяется ветром GPS/,uk:/замінюється вітром GPS/,en:/replaced by the GPS wind/})[lang].test(item(4)),lang+': a commanded wind is replaced without learning');
 assert.ok(({ru:/«Обучение \+ ветер GPS» \(15\)/,uk:/«Навчання \+ вітер GPS» \(15\)/,en:/“Learning \+ GPS wind” \(15\)/})[lang].test(item(8))&&({ru:/значения 8 и 31 записывайте в списке параметров/i,uk:/значення 8 і 31 записуйте в списку параметрів/i,en:/write the values 8 and 31 in the parameter list/i})[lang].test(item(8)),lang+': the card sets the carry-over presets, 8 and 31 go through the parameter list');
 assert.ok(({ru:/не содержат/,uk:/не містять/,en:/does not contain them/})[lang].test(r.hint[lang]),lang+': the hint says that earlier 3.1 files lack the addition');
}
assert.equal(new Set(r.sources).size,r.sources.length);
for(const p of r.sources){assert.match(p,/^(ArduPlane|libraries)\/[\w/]+\.(cpp|h)$/);}
for(const p of ['libraries/AP_AHRS/AP_AHRS.cpp','libraries/AP_NavEKF3/AP_NavEKF3_PosVelFusion.cpp','libraries/AP_NavEKF3/AP_NavEKF3_Control.cpp','libraries/AP_NavEKF3/AP_NavEKF3_NoAIDParams.cpp','libraries/AP_OSD/AP_OSD_Screen.cpp'])assert.ok(r.sources.includes(p),p);
// public wording: how and why in words, never thresholds, time windows, counts or formulas, and nothing marked as generated
for(const t of texts){
 assert.ok(!/generated|сгенерир|згенерова/i.test(t),'no "generated" wording: '+t.slice(0,60));
 assert.ok(!/\b\d+(?:[.,]\d+)?\s*(?:с|сек|секунд\w*|s|sec|seconds?|ms|мс|м|m|метр\w*|metres?|meters?)(?![\p{L}\d])/iu.test(t),'no threshold or time window: '+t.slice(0,80));
 assert.ok(!/порог|threshold|Joseph|Jacobian|ковариац|covariance|Калман|Kalman/i.test(t),'no filter internals: '+t.slice(0,80));
 assert.ok(!/[×]/.test(t),'no formulas: '+t.slice(0,60));
}
// the 3.0 wind item carries one honest sentence as well
const w30=(()=>{const w={};vm.runInNewContext(read('data/changelog/3.0.js'),{window:w});return w.AtlasRelease30.changes[0];})();
assert.ok(/Функция экспериментальная/.test(w30.ru.join(' '))&&/Функція експериментальна/.test(w30.uk.join(' '))&&/The function is experimental/.test(w30.en.join(' ')),'the 3.0 wind item says that the function is experimental');
// wiring: the data file loads after 3.0 and before the renderer, the newest release is the first, the banner is the newest, the notice is built in three languages
const page=read('changelog.html'),log=read('js/site/changelog.js');
const scripts=[...page.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
assert.ok(scripts.indexOf('data/changelog/3.1.js')>scripts.indexOf('data/changelog/3.0.js'));assert.ok(scripts.indexOf('data/changelog/3.1.js')<scripts.indexOf('js/site/changelog.js'));
assert.match(log,/const releases=\[window\.AtlasRelease31,window\.AtlasRelease30,/);
assert.match(log,/release-\(1-\[012\]\|2-\[012\]\|3-\[01\]\)/,'#release-3-1 opens its section');
assert.ok(page.indexOf('id="ch31Title"')>0&&page.indexOf('id="ch31Title"')<page.indexOf('ch-legacy-intro'),'the 3.1 banner is the newest');
assert.ok(page.includes('href="#release-3-1"')&&page.includes('id="ch31Warn"'),'the banner links the 3.1 section and carries the warning');
for(const t of ['ЭКСПЕРИМЕНТАЛЬНАЯ ФУНКЦИЯ','ЕКСПЕРИМЕНТАЛЬНА ФУНКЦІЯ','EXPERIMENTAL FUNCTION','ОБНОВЛЕНИЕ 3.1 · ЭКСПЕРИМЕНТАЛЬНО','UPDATE 3.1 · EXPERIMENTAL','Release 3.1 · Разработка','Release 3.1 · Розробка','Release 3.1 · Developed','изменения 3.1 относительно 3.0','зміни 3.1 відносно 3.0','changes 3.1 compared with 3.0'])assert.ok(log.includes(t),t);
assert.ok(log.includes("release.version==='3.1'")&&log.includes("'ch-experimental'"),'the 3.1 section opens with the experimental notice');
assert.ok(/\.ch-experimental\{/.test(read('css/release30.css'))&&/\.ch31-warn\{/.test(read('css/release30.css')),'the styles of the notice');
// the current-release labels
const config=read('configurator.html'),code=read('js/configurator/configurator.js'),meta=read('js/site/page-meta.js'),home=read('index.html'),i18n=read('js/site/i18n.js');
assert.match(config,/CONFIGURATOR 3\.1/);assert.ok(!/CONFIGURATOR (2|3)\.0|КОНФИГУРАТОР (2|3)\.0|КОНФІГУРАТОР (2|3)\.0/.test(config+code),'no older configurator label');
assert.ok(code.includes("experimental:'КОНФІГУРАТОР 3.1'")&&code.includes("experimental:'КОНФИГУРАТОР 3.1'")&&code.includes("experimental:'CONFIGURATOR 3.1'"));
for(const t of ['Конфигуратор A.T.L.A.S. 3.1','Конфігуратор A.T.L.A.S. 3.1','Configurator A.T.L.A.S. 3.1','Release 3.1 A.T.L.A.S-G.L.O.B.A.L'])assert.ok(meta.includes(t),t);
assert.ok(!/Release (2\.[012]|3\.0)|конфигуратор (2\.[012]|3\.0)|Configurator (2\.[012]|3\.0)|Конфигуратор A\.T\.L\.A\.S\. (2\.[012]|3\.0)/.test(meta),'no older label in the page metadata');
for(const html of ['index.html','configurator.html','changelog.html','faq.html'])assert.ok(read(html).includes('js/site/page-meta.js?v=release-3.1'),'metadata cache refreshed: '+html);
for(const t of ['RELEASE 3.1 · A.T.L.A.S-G.L.O.B.A.L','Release <span>3.1</span>','Актуальная версия A.T.L.A.S. — 3.1','Release 3.1 A.T.L.A.S-G.L.O.B.A.L by Oleksandr'])assert.ok(home.includes(t),t);
assert.ok(!/Release (2\.[012]|3\.0)|RELEASE (2\.[012]|3\.0)/.test(home),'home page has no older label');
assert.ok(home.includes('GPL-3.0-or-later'),'the license name is untouched');
assert.ok(i18n.includes('Актуальная версия A.T.L.A.S. — 3.1')&&i18n.includes('Core A.T.L.A.S. 3.1 features.')&&!/Release (2\.[012]|3\.0) A\.T\.L\.A\.S-G/.test(i18n),'translations follow the home page');
assert.ok(/faq\.js\?v=release-3\.1/.test(read('faq.html'))&&/i18n\.js\?v=release-3\.1/.test(home));
const catalog=JSON.parse(read('data/releases.json'));
assert.equal(catalog.project.latest_release,'3.1','the newest release is announced; a card stays "coming soon" until its HEX is published');
assert.equal(catalog.project.release_names['3.1'],'A.T.L.A.S-G.L.O.B.A.L');assert.equal(catalog.project.release_names['3.0'],'A.T.L.A.S-G.L.O.B.A.L');
// the cards of the boards (home page and configurator) describe the version that is chosen: every named release has its own text, and the text of a board names none
const latest=catalog.project.latest_release;
for(const board of catalog.boards){
 for(const v of Object.keys(catalog.project.release_names))for(const lang of ['ru','uk','en'])assert.ok(board.version_descriptions?.[v]?.[lang]?.includes('Release '+v),`${board.id}: a ${lang} text of release ${v}`);
 for(const key of ['description','description_uk','description_en'])assert.ok(board[key]&&!/Release \d/.test(board[key]),`${board.id} ${key} names no release: it stands in for versions without a text`);
}
// the configurator without a board speaks of the newest release too
assert.ok(code.includes(`toast('A.T.L.A.S. Control Center · Release ${latest} A.T.L.A.S-G.L.O.B.A.L')`),'the start message of the configurator');
assert.ok(read('js/configurator/dfu-ui.js').includes(`const ANNOUNCED_RELEASE='${latest}';`),'the release announced as coming soon in the DFU list');
// the wind FAQ: a category in three languages and the questions that users ask (FBWA, OSD, which modes, what to pick, when it hurts)
const faqWin={};vm.runInNewContext(read('data/faq-20.js'),{window:faqWin});
const ui=faqWin.AtlasFaqUi,items=faqWin.AtlasFaq20;
assert.ok(ui.order.includes('wind'));
for(const lang of ['ru','uk','en'])assert.ok(ui[lang].cats.wind&&/(экспериментально|експериментально|experimental)/.test(ui[lang].cats.wind),'the category says experimental ('+lang+')');
const wind=items.filter(i=>i.cat==='wind'),ids=wind.map(i=>i.id);
for(const id of ['wind-what','wind-nav-31','wind-modes','wind-fbwa','wind-osd','wind-use','wind-carry','wind-harm','wind-checks'])assert.ok(ids.includes(id),'FAQ item '+id);
const by=Object.fromEntries(wind.map(i=>[i.id,i]));
for(const lang of ['ru','uk','en']){
 assert.ok(({ru:/FBWA/,uk:/FBWA/,en:/FBWA/})[lang].test(by['wind-fbwa'][lang][0])&&({ru:/на FBWA не влияет/,uk:/на FBWA не впливає/,en:/does not affect FBWA/})[lang].test(by['wind-fbwa'][lang][1]),'the FBWA answer ('+lang+')');
 assert.ok(/OSD/.test(by['wind-osd'][lang][0])&&/NWD/.test(by['wind-osd'][lang][1])&&/GSPD/.test(by['wind-osd'][lang][1]),'the OSD answer ('+lang+')');
 assert.ok(({ru:/экспериментальная/,uk:/експериментальна/,en:/experimental/})[lang].test(by['wind-what'][lang][1]),'the experimental notice in the first answer ('+lang+')');
 // the carry-over: bits 8 and 16 in the first answer, the OSD answer says that the pointer shows the wind of the dead reckoning, the choice names 9 and 15, the carry-over answer states the messages
 assert.ok(/8/.test(by['wind-what'][lang][1])&&/16/.test(by['wind-what'][lang][1]),'the new bits in the first answer ('+lang+')');
 assert.ok(({ru:/показывает ветер счисления/,uk:/показує вітер лічби/,en:/shows the wind of the dead reckoning/})[lang].test(by['wind-osd'][lang][1]),'the OSD shows the dead-reckoning wind ('+lang+')');
 assert.ok(/9/.test(by['wind-use'][lang][0])&&/15/.test(by['wind-use'][lang][0]),'the choice names 9 and 15 ('+lang+')');
 for(const msg of ['NOAID wind from GPS','NOAID wind kept, GPS','NOAID no steady GPS wind to take'])assert.ok(by['wind-carry'][lang][1].includes(msg),'wind-carry '+lang+': '+msg);
}
console.log('PASS: 3.1 changelog in RU/UK/EN (how and why, recommendations, harm, nuances, experimental notice), the banner, current-release labels, the wind FAQ ('+wind.length+' items) and the card warning wiring.');
