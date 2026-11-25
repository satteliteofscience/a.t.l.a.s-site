/* The A.T.L.A.S. tools panel of the Flight-data screen: the cards of our functions (O.R.D.E.R., radio failsafe and log, G.L.O.B.A.L., wind, startup melody), grouped,
   closed to their name, purpose and state until opened, and found by a search box. This only arranges the cards: their logic, their buttons and what they write stay
   in their own scripts, which run before this one. */
(()=>{'use strict';
const core=window.AtlasDashboard,panel=document.getElementById('atlasTools');
if(!core||!panel)return;
const words={
 ru:{title:'Инструменты A.T.L.A.S.',lead:'Нажми на карточку, чтобы открыть.',placeholder:'Найти: ветер, FS_LONG, мелодия…',searchLabel:'Поиск карточки по названию, слову или параметру',hint:'Enter — открыть · Esc — сбросить · / — к поиску',found:'Найдено: {n} · Enter откроет первую',none:'Ничего не найдено. Попробуй название функции или параметра.',open:'Открыть',close:'Свернуть',notes:'Пояснения',
  g_protect:'Защита полёта',g_nogps:'Полёт без GPS',g_sound:'Звук',
  d_orderPanel:'Ограничения крена и тангажа в FBWA: пресет и тумблер RC13',d_fslogPanel:'Что делать при потере радио (CIRCLE или RTL) и запись лога',d_globalPanel:'Позиция без GPS на EKF3 и переход на GPS: профиль параметров',d_windPanel:'Ветер без GPS: наборы NOAID_WIND и команда ветра',d_songPanel:'Своя мелодия пищалки при включении платы'},
 uk:{title:'Інструменти A.T.L.A.S.',lead:'Натисни на картку, щоб відкрити.',placeholder:'Знайти: вітер, FS_LONG, мелодія…',searchLabel:'Пошук картки за назвою, словом або параметром',hint:'Enter — відкрити · Esc — скинути · / — до пошуку',found:'Знайдено: {n} · Enter відкриє першу',none:'Нічого не знайдено. Спробуй назву функції або параметра.',open:'Відкрити',close:'Згорнути',notes:'Пояснення',
  g_protect:'Захист польоту',g_nogps:'Політ без GPS',g_sound:'Звук',
  d_orderPanel:'Обмеження крену й тангажу у FBWA: пресет і перемикач RC13',d_fslogPanel:'Що робити при втраті радіо (CIRCLE чи RTL) і запис логу',d_globalPanel:'Позиція без GPS на EKF3 і перехід на GPS: профіль параметрів',d_windPanel:'Вітер без GPS: набори NOAID_WIND і команда вітру',d_songPanel:'Власна мелодія пищалки під час вмикання плати'},
 en:{title:'A.T.L.A.S. tools',lead:'Click a card to open it.',placeholder:'Find: wind, FS_LONG, melody…',searchLabel:'Find a card by name, word or parameter',hint:'Enter — open · Esc — clear · / — search',found:'Found: {n} · Enter opens the first one',none:'Nothing found. Try the name of a function or of a parameter.',open:'Open',close:'Close',notes:'Notes',
  g_protect:'Flight protection',g_nogps:'Flying without GPS',g_sound:'Sound',
  d_orderPanel:'Bank and pitch limits in FBWA: preset and switch RC13',d_fslogPanel:'What happens on radio loss (CIRCLE or RTL), and logging',d_globalPanel:'Position without GPS on EKF3 and the switch to GPS: parameter profile',d_windPanel:'Wind without GPS: NOAID_WIND presets and the wind command',d_songPanel:'Your own buzzer melody when the board powers on'}
};
const tr=key=>(words[window.AtlasLanguage?.()]||words.ru)[key];
const $=id=>document.getElementById(id);
const input=$('atlasSearch'),note=$('atlasSearchNote'),box=$('atlasToolGroups');
const store=(()=>{try{return window.localStorage;}catch{return null;}})();
const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const open=new Set(store?core.readOpen(store):[]),tools=new Map(),groups=[],noteTitles=[];
let query='';
const make=(tag,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;return n;};

/** The buttons of the G.L.O.B.A.L. profile go above its long explanation, and the long general help of each card folds into "notes" at its end, so that the buttons
    are near the top. The elements are moved, not copied: the card scripts keep writing into them by their ids. */
function tidy(card,id){
 const find=sel=>card.querySelector(sel);
 if(id==='globalPanel'){const options=find('#globalOptions'),actions=find('.order-actions'),result=find('#globalResult');if(options&&actions){options.after(actions);if(result)actions.after(result);}}
 const long={orderPanel:['#orderHelp'],fslogPanel:['#fslogHelp','#fslogNote'],globalPanel:['#globalHelp'],windPanel:['#windHelp']}[id]||[];
 const nodes=long.map(find).filter(Boolean);
 if(!nodes.length)return;
 const details=make('details','global-details atlas-notes'),summary=make('summary');
 details.append(summary,...nodes);card.append(details);noteTitles.push(summary);
}
const titleOf=card=>card.querySelector('.cc-card-title strong')?.textContent||'';
function paintTool(id){
 const t=tools.get(id),on=open.has(id),word=tr(on?'close':'open');
 t.card.classList.toggle('is-open',on);t.card.classList.toggle('is-closed',!on);
 t.toggle.setAttribute('aria-expanded',String(on));t.label.textContent=word;t.toggle.setAttribute('aria-label',`${word}: ${titleOf(t.card)}`);
}
/** An opened card whose head is hidden behind the top bars, or low down on the screen, is brought to the top. */
function reveal(card){
 const rect=card.getBoundingClientRect?.();if(!rect)return;
 const top=parseFloat(window.getComputedStyle?.(card).scrollMarginTop)||0;
 if(rect.top<top-2||rect.top>window.innerHeight*.6)card.scrollIntoView({block:'start',behavior:reduced?'auto':'smooth'});
}
function setOpen(id,on){
 if(!tools.has(id))return;
 if(on)open.add(id);else open.delete(id);
 paintTool(id);
 if(store)core.writeOpen(store,[...open]);
 if(on)reveal(tools.get(id).card);
}
function adopt(card,id){
 card.classList.add('atlas-tool');
 const head=card.querySelector('.cc-card-title');
 const toggle=make('button','atlas-tool-toggle'),label=make('span'),chevron=make('i');
 toggle.type='button';toggle.setAttribute('aria-controls',id);chevron.setAttribute('aria-hidden','true');toggle.append(label,chevron);head.append(toggle);
 const desc=make('p','atlas-tool-desc');head.after(desc);
 tidy(card,id);
 // the whole header opens and closes the card (the button is in it); anywhere on a closed card opens it
 head.addEventListener('click',()=>setOpen(id,!open.has(id)));
 card.addEventListener('click',ev=>{if(!open.has(id)&&!head.contains(ev.target))setOpen(id,true);});
 tools.set(id,{card,toggle,label,desc});
}
for(const group of core.GROUPS){
 const present=group.cards.filter(id=>$(id)?.querySelector('.cc-card-title'));
 if(!present.length)continue;
 const section=make('div','atlas-group'),heading=make('h3','atlas-group-title'),list=make('div','atlas-group-list');
 section.dataset.group=group.id;section.append(heading,list);
 for(const id of present){const card=$(id);adopt(card,id);list.append(card);}
 box.append(section);groups.push({id:group.id,section,heading,cards:present});
}
if(!tools.size)return;
panel.hidden=false;

// ---- the search: it hides the cards that do not match; Enter opens the first one that does
const groupOf=id=>groups.find(g=>g.cards.includes(id))?.id;
const headOf=id=>{const t=tools.get(id);return t?`${titleOf(t.card)} ${tr('d_'+id)} ${tr('g_'+groupOf(id))}`:'';};
const textOf=id=>tools.get(id)?.card.textContent||'';
const found=()=>core.search(query,headOf,textOf).filter(id=>tools.has(id));
function applySearch(){
 const hits=query.trim()?new Set(found()):null;
 for(const g of groups){
  let any=false;
  for(const id of g.cards){const hit=!hits||hits.has(id);tools.get(id).card.hidden=!hit;any=any||hit;}
  g.section.hidden=!any;
 }
 note.dataset.kind=!hits?'hint':hits.size?'found':'none';
 note.textContent=!hits?tr('hint'):hits.size?tr('found').replace('{n}',String(hits.size)):tr('none');
}
input.addEventListener('input',()=>{query=input.value;applySearch();});
input.addEventListener('keydown',ev=>{
 if(ev.key==='Escape'){ev.preventDefault();input.value=query='';applySearch();}
 else if(ev.key==='Enter'&&query.trim()){
  ev.preventDefault();
  const first=found()[0];
  if(first){setOpen(first,true);tools.get(first).toggle.focus();}
 }
});
document.addEventListener('keydown',ev=>{
 if(ev.key!=='/'||ev.ctrlKey||ev.metaKey||ev.altKey||!panel.closest('.cc-tab')?.classList.contains('active'))return;
 const a=document.activeElement;
 if(a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable))return;
 ev.preventDefault();input.focus();input.select?.();
});

// ---- texts (the card scripts repaint their own on the same event, before this listener)
function paint(){
 $('atlasToolsTitle').textContent=tr('title');$('atlasToolsLead').textContent=tr('lead');$('atlasToolsCount').textContent=String(tools.size);
 input.placeholder=tr('placeholder');input.setAttribute('aria-label',tr('searchLabel'));
 for(const g of groups)g.heading.textContent=tr('g_'+g.id);
 for(const [id,t] of tools){t.desc.textContent=tr('d_'+id);paintTool(id);}
 for(const s of noteTitles)s.textContent=tr('notes');
 applySearch();
}
window.addEventListener('atlas:language',paint);
paint();
})();
