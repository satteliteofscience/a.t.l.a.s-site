/* Firmware builds of the configurator, laid out like the firmware cards of the main page: one card per board with a version picker
 * (every published build plus the announced latest release), the selected build below it with its PIN download, SHA-256 and source link.
 * The catalogue is the same one the main page uses (data/releases.json merged with the published builds of the gateway). */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasReleasePicker=api;})(globalThis,()=>{
 'use strict';
 const WORDS={
  ru:{choose:'ВЫБОР ВЕРСИИ',pending:'Сборка ещё не опубликована',current:'НОВАЯ',archive:'АРХИВ',soon:'СКОРО',source:'Исходный код',copy:'Копировать SHA-256',copied:'Скопировано ✓',copyFail:'Невозможно скопировать',none:'Сборка пока не опубликована',noDescription:'Описание отсутствует.',latest:'LATEST',published:'● ОПУБЛИКОВАНО',preparing:'◷ ПОДГОТОВКА',failed:'Не удалось получить доступ к прошивке'},
  uk:{choose:'ВИБІР ВЕРСІЇ',pending:'Збірку ще не опубліковано',current:'НОВА',archive:'АРХІВ',soon:'НЕЗАБАРОМ',source:'Вихідний код',copy:'Копіювати SHA-256',copied:'Скопійовано ✓',copyFail:'Неможливо скопіювати',none:'Збірку поки не опубліковано',noDescription:'Опис відсутній.',latest:'LATEST',published:'● ОПУБЛІКОВАНО',preparing:'◷ ПІДГОТОВКА',failed:'Не вдалося отримати доступ до прошивки'},
  en:{choose:'SELECT RELEASE',pending:'Build not published yet',current:'LATEST',archive:'ARCHIVE',soon:'SOON',source:'Source code',copy:'Copy SHA-256',copied:'Copied ✓',copyFail:'Copy failed',none:'No build published yet',noDescription:'No description.',latest:'LATEST',published:'● PUBLISHED',preparing:'◷ IN PREPARATION',failed:'Firmware access failed'}
 };
 const ACTION={ru:'СКАЧАТЬ',uk:'ЗАВАНТАЖИТИ',en:'DOWNLOAD'};
 const words=language=>WORDS[language]||WORDS.ru;
 /** "2.0" before "1.2" before "1.0"; any number of dot-separated parts. */
 const compareVersions=(a,b)=>{
  const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);
  for(let i=0;i<Math.max(x.length,y.length);i++){const d=(y[i]||0)-(x[i]||0);if(d)return d;}
  return 0;
 };
 /** The builds a board offers: protected (PIN gateway), release channel, with a checksum. */
 const downloadable=(board,access)=>Array.isArray(board?.downloads)?board.downloads.filter(item=>access?.isProtected?.(item)&&item.channel==='release'&&typeof item.filename==='string'&&item.filename.trim()&&/^[a-f0-9]{64}$/i.test(item.sha256||'')):[];
 /** Versions of a board: every published build plus the announced latest release (shown as "soon" until it is published), newest first. */
 function versionsOf(board,project,access){
  const items=downloadable(board,access),announced=String(project?.latest_release||'');
  const names=[...new Set([...items.map(item=>String(item.version||'')),announced])].filter(Boolean).sort(compareVersions);
  const latestReady=names.find(name=>items.some(item=>String(item.version)===name))||null;
  return {items,names,latestReady};
 }
 const safeUrl=(value,base)=>{
  try{const u=new URL(value,base);return u.protocol==='https:'||(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname))?u.href:null;}catch{return null;}
 };
 const descriptionOf=(board,version,language)=>{
  const texts=board.version_descriptions?.[version];
  return texts?.[language]||texts?.ru||board[`description_${language}`]||board.description||words(language).noDescription;
 };

 /** Render every board into `container`. `selected` remembers the chosen version per board between renders. */
 function render({document,container,boards,project,language='ru',access,selected={},toast=()=>{},baseURI='https://example.invalid/',title='',noBuilds=''}){
  const w=words(language),make=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=String(text);return n;};
  container.replaceChildren();
  for(const board of boards){
   const box=make('div','cc-release-item');
   box.dataset.board=board.id||'';
   box.append(make('strong','',board.name||board.id||'—'));
   const {items,names,latestReady}=versionsOf(board,project,access);
   if(!items.length){box.append(make('small','',noBuilds||w.none));container.append(box);continue;}
   const published=board.status==='available';
   box.append(make('small','',published?w.published:w.preparing));
   const chooser=make('fieldset','board-version-control');
   chooser.append(make('legend','board-version-legend',`${w.choose} · ${names.length}`));
   const list=make('div','board-version-segmented board-version-list');
   list.setAttribute('role','group');list.setAttribute('aria-label',`${w.choose} — ${board.name||board.id}`);
   if(names.length>4)list.dataset.scroll='true';
   const view=make('div','board-version-result'),buttons=new Map();
   const buildEntry=item=>{
    const wrap=make('div','version-current');
    const button=make('button','cc-release-download');button.type='button';
    const releaseName=make('span','cc-release-download-title',item.label||item.filename||'Firmware');
    const actionLabel=make('span','cc-release-download-action');
    const actionText=ACTION;
    actionLabel.textContent=(item.secure_id===items[0]?.secure_id?'LATEST · ':'')+'PIN · '+(actionText[language]||actionText.ru)+' ↗';
    button.append(releaseName,actionLabel);
    button.addEventListener('click',async()=>{
     button.disabled=true;
     try{await access.download(item);}
     catch(error){if(error.message!=='Access cancelled')toast(error.message||w.failed,true);}
     finally{button.disabled=false;}
    });
    wrap.append(button);
    const meta=make('div','version-meta');
    const stamp=Number(item.timestamp),date=stamp>0?new Date(stamp*1000):null;
    if(date&&Number.isFinite(date.getTime()))meta.append(make('span','',date.toLocaleDateString(language)));
    if(/^[0-9a-f]{64}$/i.test(item.sha256||'')){
     meta.append(make('code','',`SHA-256: ${item.sha256.slice(0,16)}…`));
     const copy=make('button','checksum-btn',w.copy);copy.type='button';
     copy.addEventListener('click',async()=>{try{await globalThis.navigator.clipboard.writeText(item.sha256);copy.textContent=w.copied;}catch{copy.textContent=w.copyFail;}});
     meta.append(copy);
    }
    const rawSource=item.source_url||project?.sources?.[item.version],sourceUrl=rawSource?safeUrl(rawSource,baseURI):null;   // no source for this version: no link (new URL(undefined) would be valid)
    if(sourceUrl){const link=make('a','version-source-link',w.source);link.href=sourceUrl;link.rel='noopener noreferrer';link.target='_blank';meta.append(link);}
    wrap.append(meta);
    return wrap;
   };
   const select=name=>{
    const item=items.find(entry=>String(entry.version)===name);
    selected[board.id]=name;
    view.replaceChildren(make('p','cc-release-desc',descriptionOf(board,name,language)),item?buildEntry(item):make('div','download-placeholder',w.pending));
    for(const [version,button] of buttons){const active=version===name;button.setAttribute('aria-pressed',String(active));button.classList.toggle('is-selected',active);}
   };
   for(const name of names){
    const entry=items.find(item=>String(item.version)===name),ready=!!entry;
    const button=make('button','board-version-option'+(ready?'':' is-pending'));
    button.type='button';button.dataset.version=name;button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`${w.choose} ${name}`);
    button.append(make('span','board-version-number',name));
    const info=make('span','board-version-info');
    const releaseName=project?.release_names?.[name];
    if(releaseName)info.append(make('b','board-version-name',releaseName));
    info.append(make('small','board-version-kind',!ready?w.soon:name===latestReady?w.current:w.archive));
    button.append(info);
    const stamp=Number(entry?.timestamp),when=stamp>0?new Date(stamp*1000):null;
    button.append(make('span','board-version-date',when&&Number.isFinite(when.getTime())?when.toLocaleDateString(language):''));
    button.addEventListener('click',()=>select(name));
    button.addEventListener('keydown',event=>{
     if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
     const next=names[names.indexOf(name)+(event.key==='ArrowDown'?1:-1)];
     if(!next)return;
     event.preventDefault();select(next);buttons.get(next).focus?.({preventScroll:true});
    });
    buttons.set(name,button);list.append(button);
   }
   chooser.append(list);box.append(chooser,view);container.append(box);
   const preferred=selected[board.id];
   select(names.includes(preferred)?preferred:String(latestReady||items[0].version||''));
  }
 }
 return Object.freeze({WORDS,compareVersions,downloadable,versionsOf,descriptionOf,render});
});
