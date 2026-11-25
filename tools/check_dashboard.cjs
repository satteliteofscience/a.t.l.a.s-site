/* The A.T.L.A.S. tools panel of the Flight-data screen: the groups and the search (dashboard-core.js), the panel in a stub DOM (dashboard-ui.js: closed cards that open,
   remembered, found by name, purpose, keyword or parameter, three languages, the buttons of the G.L.O.B.A.L. card above its explanation) and the wiring of
   configurator.html. The panel only arranges the cards: it writes nothing to the controller. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const core=require('../js/configurator/dashboard-core.js');
const IDS=['orderPanel','fslogPanel','globalPanel','windPanel','songPanel'];

// ---------------------------------------------------------------- the groups: every card of our functions once, in groups that say what they are for
assert.ok(Object.isFrozen(core)&&Object.isFrozen(core.GROUPS)&&core.GROUPS.every(g=>Object.isFrozen(g)&&Object.isFrozen(g.cards))&&Object.isFrozen(core.KEYWORDS));
assert.deepEqual(core.GROUPS.map(g=>g.id),['protect','nogps','sound']);assert.deepEqual([...core.CARDS],IDS);assert.equal(new Set(core.CARDS).size,core.CARDS.length);
for(const [file,id] of [['capri-ui','orderPanel'],['failsafe-log-ui','fslogPanel'],['global-profile-ui','globalPanel'],['wind-profile-ui','windPanel'],['buzzer-song-ui','songPanel']]){
 const ui=read(`js/configurator/${file}.js`);assert.ok(ui.includes(`card.id='${id}'`),`${file}.js still gives its card the id ${id}`);
 assert.ok(core.KEYWORDS[id]&&core.KEYWORDS[id].split(' ').length>5,'keywords of '+id);
}

// ---------------------------------------------------------------- the search: words of three languages, parameter names, forgiving about case, ё and apostrophes
assert.equal(core.normalize('  Отказ   РАДИО, ЁЖ  зв’язок '),'отказ радио, еж звязок');
assert.ok(core.matches('Отказ радио и лог','радио лог')&&core.matches('FS_LONG_TIMEOUT','fs_long')&&core.matches('что-то ещё','еще'),'part of a word, any order');
assert.ok(!core.matches('Отказ радио','радио ветер')&&core.matches('что угодно','')&&core.matches('x','   '));
const head=id=>({orderPanel:'Протокол П.Р.И.К.А.З Ограничения крена и тангажа в FBWA: пресет и тумблер RC13 Защита полёта',fslogPanel:'Отказ радио и лог Что делать при потере радио (CIRCLE или RTL) и запись лога Защита полёта',
 globalPanel:'Профиль EKF3 G.L.O.B.A.L. Позиция без GPS на EKF3 и переход на GPS: профиль параметров Полёт без GPS',windPanel:'Ветер Ветер без GPS: наборы NOAID_WIND и команда ветра Полёт без GPS',songPanel:'Мелодия запуска Своя мелодия пищалки при включении платы Звук'})[id];
const body=id=>({globalPanel:'EKF3 считает ветер нулевым, поэтому дрейф зависит от ветра. Сравнение с DCM',orderPanel:'Это ограничение команд пилота'})[id]||'';
const find=q=>core.search(q,head,body);
assert.deepEqual(find(''),IDS,'an empty search shows everything');
for(const [q,want] of [['ветер',['windPanel']],['вітер',['windPanel']],['wind',['windPanel']],['радио',['fslogPanel']],['лог',['fslogPanel']],['rtl',['fslogPanel']],['RC13',['orderPanel']],['приказ',['orderPanel']],['order',['orderPanel']],
 ['мелодия',['songPanel']],['buzzer',['songPanel']],['global',['globalPanel']],['без gps',['globalPanel','windPanel']],['gps',['globalPanel','windPanel']],['защита',['orderPanel','fslogPanel']],['radio failsafe',['fslogPanel']],['тумблер крена',['orderPanel']],
 ['DCM',['globalPanel']],['ограничение пилота',['orderPanel']],['zzz',[]]])assert.deepEqual(find(q),want,'search: '+q);
assert.deepEqual(core.search('ветер',head),['windPanel'],'a word that another card only mentions in its text does not bring that card up');
// every parameter that a card is about finds it: the names come from the card's own module
const orderCore=require('../js/configurator/capri-core.js'),failsafe=require('../js/configurator/failsafe-log-core.js'),globalCore=require('../js/configurator/global-profile-core.js'),wind=require('../js/configurator/wind-profile-core.js');
for(const [name] of orderCore.PRESET)assert.ok(find(name).includes('orderPanel'),'the O.R.D.E.R. card is found by '+name);
for(const name of [...failsafe.NAMES,...failsafe.INFO])assert.ok(find(name).includes('fslogPanel'),'the failsafe card is found by '+name);
for(const name of [...globalCore.CORRECTION,'EK3_NOAID_POS','EK3_NOAID_GPS','EK3_NOAID_AUTO','EK3_SRC1_POSXY','EK3_SRC2_POSXY'])assert.ok(find(name).includes('globalPanel'),'the G.L.O.B.A.L. card is found by '+name);
for(const name of ['NOAID_WIND','NOAID_SLEW','NOAID_WAGE'])assert.ok(find(name).includes('windPanel'),'the wind card is found by '+name);
assert.ok(['NOAID_WIND',wind.SLEW].every(n=>core.KEYWORDS.windPanel.includes(n))&&find('BUZ_CSTM_SONG').join()==='songPanel');

// ---------------------------------------------------------------- the open cards are remembered; a blocked storage breaks nothing
{
 const mem={},ok={getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=v;}},broken={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
 assert.deepEqual(core.readOpen(ok),[]);assert.equal(core.writeOpen(ok,['windPanel','nope','songPanel']),true);assert.deepEqual(core.readOpen(ok),['windPanel','songPanel'],'only the known cards');
 mem[core.OPEN_KEY]='junk';assert.deepEqual(core.readOpen(ok),[]);mem[core.OPEN_KEY]='{"a":1}';assert.deepEqual(core.readOpen(ok),[]);
 assert.deepEqual(core.readOpen(broken),[]);assert.equal(core.writeOpen(broken,[]),false);assert.deepEqual(core.readOpen(null),[]);
}

// ---------------------------------------------------------------- the panel in a stub DOM
class El{
 constructor(tag,cls=''){this.tagName=tag.toUpperCase();this.id='';this.kids=[];this.parent=null;this.attrs={};this.handlers={};this.dataset={};this.hidden=false;this.text='';this.value='';this.placeholder='';this.focused=0;this.scrolled=[];this.rect={top:200};
  this.classes=new Set(cls.split(' ').filter(Boolean));const c=this.classes;
  this.classList={add:(...x)=>x.forEach(v=>c.add(v)),remove:(...x)=>x.forEach(v=>c.delete(v)),contains:v=>c.has(v),toggle:(v,f)=>{const on=f===undefined?!c.has(v):!!f;on?c.add(v):c.delete(v);return on;}};}
 set className(v){this.classes.clear();String(v).split(/\s+/).filter(Boolean).forEach(x=>this.classes.add(x));}get className(){return [...this.classes].join(' ');}
 set textContent(v){this.kids=[];this.text=String(v);}get textContent(){return this.text+this.kids.map(k=>k.textContent).join(' ');}
 get children(){return this.kids;}
 append(...nodes){for(const n of nodes){if(n.parent)n.parent.kids.splice(n.parent.kids.indexOf(n),1);n.parent=this;this.kids.push(n);}}
 after(n){const p=this.parent;if(n.parent)n.parent.kids.splice(n.parent.kids.indexOf(n),1);n.parent=p;p.kids.splice(p.kids.indexOf(this)+1,0,n);}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return k in this.attrs?this.attrs[k]:null;}
 addEventListener(t,f){(this.handlers[t]=this.handlers[t]||[]).push(f);}
 /** fires an event here and bubbles it to the parents */
 fire(t,ev={}){const e=Object.assign({type:t,target:this,prevented:false,preventDefault(){this.prevented=true;}},ev);for(let n=this;n;n=n.parent)for(const f of n.handlers[t]||[])f(e);return e;}
 contains(n){for(;n;n=n.parent)if(n===this)return true;return false;}
 matchesSel(s){return s[0]==='#'?this.id===s.slice(1):s[0]==='.'?this.classes.has(s.slice(1)):this.tagName===s.toUpperCase();}
 querySelector(sel){const parts=sel.split(' ');const walk=n=>{for(const k of n.kids){if(k.matchesSel(parts[parts.length-1])){let ok=true,p=k.parent;for(let i=parts.length-2;i>=0&&ok;i--){while(p&&p!==n.parent&&!p.matchesSel(parts[i]))p=p.parent;ok=!!p&&p.matchesSel(parts[i]);}if(ok)return k;}const r=walk(k);if(r)return r;}return null;};return walk(this);}
 closest(sel){for(let n=this;n;n=n.parent)if(n.matchesSel(sel))return n;return null;}
 focus(){this.focused++;this.doc.activeElement=this;}select(){this.selected=true;}
 getBoundingClientRect(){return this.rect;}scrollIntoView(o){this.scrolled.push(o);}
}
const node=(tag,{id='',cls='',text=''}={})=>{const n=new El(tag,cls);n.id=id;if(text)n.textContent=text;return n;};
/** The five cards, built the way their scripts build them (title bar with the icon, the name and the tag; the status; the parts that matter to the panel). */
function build({cards=IDS,stored,storageBroken=false,language='ru',width=1440}={}){
 const lang={v:language},dash=node('section',{cls:'cc-tab active'}),panel=node('section',{id:'atlasTools',cls:'atlas-tools'});panel.hidden=true;
 const input=node('input',{id:'atlasSearch'}),box=node('div',{id:'atlasToolGroups'}),side=node('div',{cls:'cc-dashboard-right'});
 panel.append(node('h2',{id:'atlasToolsTitle'}),node('small',{id:'atlasToolsCount'}),node('p',{id:'atlasToolsLead'}),input,node('p',{id:'atlasSearchNote'}),box);side.append(panel);dash.append(side);
 const mounts=node('div',{id:'mounts'});dash.append(mounts);
 const names={orderPanel:'Протокол П.Р.И.К.А.З',fslogPanel:'Отказ радио и лог',globalPanel:'Профиль EKF3 G.L.O.B.A.L.',windPanel:'Ветер',songPanel:'Мелодия запуска'};
 for(const id of cards){
  const card=node('article',{id,cls:'cc-card order-card'}),title=node('div',{cls:'cc-card-title'});title.append(node('span',{text:'◈'}),node('strong',{text:names[id]}),node('small',{text:'TAG'}));card.append(title);
  const add=(tag,o)=>{const n=node(tag,o);card.append(n);return n;};
  add('strong',{id:id.replace('Panel','')+'Status',text:'Подключи контроллер'});
  if(id==='orderPanel'){add('p',{id:'orderModesHint',text:'тумблер'});add('p',{id:'orderHelp',text:'Это ограничение команд пилота'});add('p',{id:'orderCommandResult'});}
  if(id==='fslogPanel'){add('div',{id:'fslogButtons'});add('p',{id:'fslogHelp',text:'наборы'});add('p',{id:'fslogNote',text:'RC_FS_TIMEOUT'});add('p',{id:'fslogResult'});}
  if(id==='globalPanel'){add('div',{id:'globalOptions'});const d=add('details',{cls:'global-details'});d.append(node('p',{text:'EKF3 считает ветер нулевым. Сравнение с DCM'}));const actions=add('div',{cls:'order-actions'});actions.append(node('button',{id:'globalApply'}),node('button',{id:'globalDisable'}));add('p',{id:'globalHelp',text:'Профиль записывает'});add('p',{id:'globalResult'});}
  if(id==='windPanel'){add('div',{id:'windButtons'});add('p',{id:'windHelp',text:'Профиль включает и выключает'});add('div',{cls:'wind-cmd'});}
  if(id==='songPanel')add('textarea',{id:'songText'});
  mounts.append(card);
 }
 const mem={...(stored?{[core.OPEN_KEY]:stored}:{})},storage=storageBroken?{getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}}:{getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=v;}};
 const all=n=>[n,...n.kids.flatMap(all)],document={activeElement:null,createElement:t=>{const n=new El(t);n.doc=document;return n;},getElementById:id=>all(dash).find(n=>n.id===id)||null,handlers:{},addEventListener(t,f){(this.handlers[t]=this.handlers[t]||[]).push(f);},
  key(key,extra={}){const e=Object.assign({key,prevented:false,preventDefault(){this.prevented=true;}},extra);for(const f of this.handlers.keydown||[])f(e);return e;}};
 for(const n of all(dash))n.doc=document;
 const winHandlers={},window={AtlasDashboard:core,AtlasLanguage:()=>lang.v,localStorage:storage,innerHeight:900,addEventListener:(t,f)=>{(winHandlers[t]=winHandlers[t]||[]).push(f);},matchMedia:()=>({matches:false}),getComputedStyle:()=>({scrollMarginTop:'90px'})};
 vm.runInNewContext(read('js/configurator/dashboard-ui.js'),{window,document,Set,Map,String,Number,Object,Array,JSON,parseFloat});
 const $=id=>document.getElementById(id);
 return {$,document,window,panel,input,box,mem,dash,lang,
  groups:()=>box.kids,card:id=>$(id),toggle:id=>$(id).querySelector('.atlas-tool-toggle'),title:id=>$(id).querySelector('.cc-card-title'),desc:id=>$(id).querySelector('.atlas-tool-desc'),
  visible:()=>IDS.filter(id=>$(id)&&!$(id).hidden&&$(id).parent.parent.hidden===false),
  type(q){input.value=q;input.fire('input');},press(key){return input.fire('keydown',{key});},
  setLanguage(l){lang.v=l;for(const f of winHandlers['atlas:language']||[])f();}};
}
{
 const t=build();
 assert.equal(t.panel.hidden,false,'the panel appears');assert.equal(t.$('atlasToolsCount').textContent,'5');assert.equal(t.$('atlasToolsTitle').textContent,'Инструменты A.T.L.A.S.');
 assert.deepEqual(t.groups().map(g=>g.dataset.group),['protect','nogps','sound']);assert.deepEqual(t.groups().map(g=>g.querySelector('.atlas-group-title').textContent),['Защита полёта','Полёт без GPS','Звук']);
 assert.deepEqual(t.groups().map(g=>g.querySelector('.atlas-group-list').kids.map(c=>c.id)),[['orderPanel','fslogPanel'],['globalPanel','windPanel'],['songPanel']],'every card is moved into its group');
 for(const id of IDS){const card=t.card(id),toggle=t.toggle(id);
  assert.ok(card.classes.has('atlas-tool')&&card.classes.has('is-closed')&&!card.classes.has('is-open'),'closed at first: '+id);
  assert.ok(toggle&&toggle.tagName==='BUTTON'&&toggle.type==='button'&&toggle.attrs['aria-expanded']==='false'&&toggle.attrs['aria-controls']===id&&toggle.parent===t.title(id),'a button in the head says it can be opened: '+id);
  assert.equal(toggle.querySelector('span').textContent,'Открыть');assert.ok(toggle.attrs['aria-label'].startsWith('Открыть: '));
  assert.ok(t.desc(id).textContent.length>25&&t.desc(id).parent===card&&card.kids[1]===t.desc(id),'a line that says what it is for, under the head: '+id);}
 // the head (or the button) opens and closes; a closed card opens by a click anywhere on it; a click inside an open card changes nothing
 t.toggle('windPanel').fire('click');assert.ok(t.card('windPanel').classes.has('is-open')&&t.toggle('windPanel').attrs['aria-expanded']==='true'&&t.toggle('windPanel').querySelector('span').textContent==='Свернуть');assert.deepEqual(JSON.parse(t.mem[core.OPEN_KEY]),['windPanel'],'remembered');
 t.card('windPanel').querySelector('.wind-cmd').fire('click');assert.ok(t.card('windPanel').classes.has('is-open'),'a click on what is inside keeps it open');
 t.title('windPanel').fire('click');assert.ok(t.card('windPanel').classes.has('is-closed'),'the head closes it');
 t.card('songPanel').querySelector('#songStatus').fire('click');assert.ok(t.card('songPanel').classes.has('is-open'),'a click on a closed card opens it');
 t.toggle('songPanel').fire('click');assert.ok(t.card('songPanel').classes.has('is-closed'),'one click on the button of an open card closes it (not twice through the head)');
 // opening brings a card that is out of sight into view, one that is in sight stays where it is
 t.card('fslogPanel').rect={top:-300};t.toggle('fslogPanel').fire('click');assert.equal(t.card('fslogPanel').scrolled.length,1);assert.equal(t.card('fslogPanel').scrolled[0].block,'start');
 t.card('orderPanel').rect={top:300};t.toggle('orderPanel').fire('click');assert.equal(t.card('orderPanel').scrolled.length,0);t.card('globalPanel').rect={top:850};t.toggle('globalPanel').fire('click');assert.equal(t.card('globalPanel').scrolled.length,1,'low on the screen: brought up');
 // what the panel moves inside the cards: the buttons of the G.L.O.B.A.L. card above its explanation, the long help folded at the end; the same elements, by their ids
 const g=t.card('globalPanel'),order=g.kids.map(k=>k.id||k.className||k.tagName);
 assert.ok(order.indexOf('order-actions')===order.indexOf('globalOptions')+1&&order.indexOf('globalResult')===order.indexOf('order-actions')+1&&order.indexOf('global-details')>order.indexOf('globalResult'),'the buttons come right after the options: '+order.join(' '));
 for(const [id,inside] of [['orderPanel',['orderHelp']],['fslogPanel',['fslogHelp','fslogNote']],['globalPanel',['globalHelp']],['windPanel',['windHelp']]]){
  const last=t.card(id).kids[t.card(id).kids.length-1];assert.ok(last.tagName==='DETAILS'&&last.classes.has('atlas-notes')&&last.kids[0].tagName==='SUMMARY'&&last.kids[0].textContent==='Пояснения','folded notes at the end of '+id);
  assert.deepEqual(last.kids.slice(1).map(k=>k.id),inside,'the long help of '+id);for(const x of inside)assert.ok(t.$(x),'still found by its id: '+x);}
 assert.ok(!t.card('songPanel').querySelector('.atlas-notes'),'the melody card has nothing to fold');
 assert.ok(t.$('globalApply')&&t.$('globalDisable')&&t.$('orderModesHint').parent===t.card('orderPanel'),'what is not long stays where it was');
}
{
 // the search: it hides the cards that do not match and the groups left empty; Enter opens the first one; Esc clears; "/" goes to the field
 const t=build();assert.equal(t.$('atlasSearchNote').dataset.kind,'hint');assert.ok(/Enter/.test(t.$('atlasSearchNote').textContent));
 t.type('ветер');assert.deepEqual(t.visible(),['windPanel']);assert.deepEqual(t.groups().map(g=>g.hidden),[true,false,true]);assert.equal(t.$('atlasSearchNote').dataset.kind,'found');assert.ok(/Найдено: 1/.test(t.$('atlasSearchNote').textContent));
 t.press('Enter');assert.ok(t.card('windPanel').classes.has('is-open')&&t.toggle('windPanel').focused===1,'Enter opens the card found and goes to it');
 t.type('FS_LONG');assert.deepEqual(t.visible(),['fslogPanel']);t.type('gps');assert.deepEqual(t.visible(),['globalPanel','windPanel']);t.type('zzz');assert.deepEqual(t.visible(),[]);assert.equal(t.$('atlasSearchNote').dataset.kind,'none');
 t.press('Enter');assert.ok(!t.card('orderPanel').classes.has('is-open'),'nothing to open');
 const esc=t.press('Escape');assert.ok(esc.prevented&&t.input.value===''&&t.visible().length===5&&t.groups().every(g=>!g.hidden),'Esc clears the search');
 t.press('Enter');assert.ok(!t.card('orderPanel').classes.has('is-open'),'Enter in an empty field opens nothing');
 t.type('Сравнение с DCM');assert.deepEqual(t.visible(),['globalPanel'],'what is written inside a card is searched when nothing is named so');
 t.type('');t.document.activeElement=null;let e=t.document.key('/');assert.ok(e.prevented&&t.input.focused===1&&t.input.selected,'"/" goes to the search');
 t.input.tagName='INPUT';t.document.activeElement=t.input;assert.equal(t.document.key('/').prevented,false,'not while typing');
 t.document.activeElement=null;assert.equal(t.document.key('/',{ctrlKey:true}).prevented,false);t.dash.classes.delete('active');assert.equal(t.document.key('/').prevented,false,'only on the Flight-data screen');
}
{
 // the open cards come back; a broken storage and missing cards break nothing; the texts follow the language
 const t=build({stored:'["globalPanel","songPanel","junk"]'});assert.ok(t.card('globalPanel').classes.has('is-open')&&t.card('songPanel').classes.has('is-open')&&t.card('windPanel').classes.has('is-closed'));
 const b=build({storageBroken:true});b.toggle('windPanel').fire('click');assert.ok(b.card('windPanel').classes.has('is-open'));
 const part=build({cards:['windPanel','songPanel']});assert.equal(part.$('atlasToolsCount').textContent,'2');assert.deepEqual(part.groups().map(g=>g.dataset.group),['nogps','sound'],'only the groups with cards');
 const none=build({cards:[]});assert.equal(none.panel.hidden,true,'no cards: no panel');
 t.setLanguage('uk');assert.equal(t.$('atlasToolsTitle').textContent,'Інструменти A.T.L.A.S.');assert.deepEqual(t.groups().map(g=>g.querySelector('.atlas-group-title').textContent),['Захист польоту','Політ без GPS','Звук']);assert.equal(t.toggle('songPanel').querySelector('span').textContent,'Згорнути');assert.ok(/мелодія/.test(t.desc('songPanel').textContent)&&/Знайти/.test(t.input.placeholder));
 assert.equal(t.card('windPanel').querySelector('.atlas-notes').kids[0].textContent,'Пояснення');
 t.setLanguage('en');assert.equal(t.$('atlasToolsTitle').textContent,'A.T.L.A.S. tools');assert.equal(t.toggle('windPanel').querySelector('span').textContent,'Open');assert.ok(/Find/.test(t.input.placeholder)&&/wind/i.test(t.desc('windPanel').textContent));
}
{
 // the texts: the same keys in the three languages, short enough for a closed card, no mix-ups, no "generated" wording
 const ui=read('js/configurator/dashboard-ui.js'),wm=ui.match(/const words=(\{[^]*?\n\});/);assert.ok(wm);const words=vm.runInNewContext('('+wm[1]+')');
 assert.deepEqual(Object.keys(words).sort(),['en','ru','uk']);const keys=Object.keys(words.ru).sort();for(const l of ['uk','en'])assert.deepEqual(Object.keys(words[l]).sort(),keys,l);
 for(const l of ['ru','uk','en']){for(const k of keys)assert.ok(words[l][k].length>0,k+' ('+l+')');assert.ok(words[l].found.includes('{n}'),'the count ('+l+')');
  for(const id of IDS)assert.ok(words[l]['d_'+id].length<=90,'a purpose that fits two lines: '+id+' ('+l+') '+words[l]['d_'+id].length);for(const g of core.GROUPS)assert.ok(words[l]['g_'+g.id]);}
 assert.ok(!/[ыэёъ]/i.test(Object.values(words.uk).join(' ')),'no Russian-only letters in the Ukrainian texts');assert.ok(Object.values(words.en).every(x=>!/[а-яіїєґ]/i.test(x)));
 assert.ok(!/generated|сгенерир|згенерова/i.test(ui+read('js/configurator/dashboard-core.js')),'no "generated" wording');
 // the panel arranges, it does not write: no call of a writer or of the link, no HTML strings
 const code=ui+read('js/configurator/dashboard-core.js');      // (the only things it writes are the open cards, to localStorage)
 assert.ok(!/AtlasCC|sendWindEstimate|orderCommand|PARAM_SET|writeParameter|write(?:FailsafeLogPreset|GlobalProfile|WindProfile|OrderPreset|BuzzerSong|ServoConfig)|\.onclick\s*=|fetch\(|WebSocket|innerHTML|insertAdjacentHTML|eval\(|new Function/.test(code),'the panel never writes to the controller and replaces no button of a card');
}

// ---------------------------------------------------------------- configurator.html and the style
const html=read('configurator.html'),css=read('css/dashboard.css');
const scripts=[...html.matchAll(/<script src="([^"?]+)[^"]*" defer>/g)].map(m=>m[1]),at=n=>scripts.indexOf('js/configurator/'+n+'.js');
for(const n of ['capri-ui','global-profile-ui','buzzer-song-ui','failsafe-log-ui','wind-profile-ui'])assert.ok(at(n)>=0&&at('dashboard-ui')>at(n),'the panel is arranged after '+n+' made its card');
assert.ok(at('dashboard-core')>=0&&at('dashboard-core')<at('dashboard-ui'),'the groups before the panel');
assert.ok(/css\/dashboard\.css\?v=dash-\d+/.test(html)&&/dashboard-core\.js\?v=dash-\d+/.test(html)&&/dashboard-ui\.js\?v=dash-\d+/.test(html),'cache tags');
const dash=html.slice(html.indexOf('data-panel="dashboard"'),html.indexOf('<!-- QUICK SETUP -->'));
const left=dash.slice(dash.indexOf('cc-dashboard-left'),dash.indexOf('cc-dashboard-right')),right=dash.slice(dash.indexOf('cc-dashboard-right'));
const pos=s=>left.indexOf(s);assert.ok(pos('cc-attitude-card')>0&&pos('cc-status-panel')>pos('cc-attitude-card')&&pos('cc-messages-panel')>pos('cc-status-panel')&&pos('id="dashBelow"')>pos('cc-messages-panel'),'the live data on the left: horizon, vehicle state, messages');
assert.ok(right.includes('id="atlasTools"')&&!right.includes('cc-status-panel')&&!right.includes('cc-messages-panel'),'the tools on the right');
for(const id of ['atlasTools','atlasToolsTitle','atlasToolsCount','atlasToolsLead','atlasSearch','atlasSearchNote','atlasToolGroups'])assert.ok(right.includes(`id="${id}"`),'#'+id);
assert.ok(/<section class="atlas-tools" id="atlasTools"[^>]* hidden>/.test(right),'hidden until the cards are arranged in it');assert.ok(/id="atlasSearchNote" role="status" aria-live="polite"/.test(right)&&/type="search" id="atlasSearch"[^>]*aria-label=/.test(right),'the search is announced');
assert.equal([...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)].length,0,'no inline script');
for(const sel of ['.atlas-tools','.atlas-search','.atlas-group-title','.atlas-group-list','.atlas-tool-toggle','.atlas-tool.is-closed','.atlas-tool.is-open','.atlas-notes','[hidden]','.cc-dashboard-left .cc-facts','prefers-reduced-motion','@media(max-width:1100px)'])assert.ok(css.includes(sel),'style '+sel);
assert.ok(/\.atlas-tool\.is-closed>:not\(\.cc-card-title\):not\(\.atlas-tool-desc\):not\(\[id\$="Status"\]\)\{display:none!important\}/.test(css),'a closed card shows its head, purpose and state only');
// one column below 1100 px: the horizon, then the tools, the vehicle state and the messages
const cssOrder=name=>Number(new RegExp(`\\${name}\\{order:(\\d+)\\}`).exec(css)?.[1]);assert.deepEqual([cssOrder('.cc-attitude-card'),cssOrder('.atlas-tools'),cssOrder('.cc-status-panel'),cssOrder('.cc-messages-panel')],[1,2,3,4]);
assert.ok(!/@import|url\(http/.test(css));
console.log('PASS: the A.T.L.A.S. tools panel of the Flight-data screen: three groups, closed cards that open and are remembered, search by words and parameters in three languages, notes folded, the buttons near the top, nothing written to the controller, layout and wiring.');
