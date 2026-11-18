/* Custom startup melody (BUZ_CSTM_SONG*): packing into the 48 parameters, the safe write order, the reference MML interpreter, the card and its wiring. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../js/configurator/buzzer-song-core.js');
const read=p=>fs.readFileSync(p,'utf8');
const P=obj=>new Map(Object.entries(obj).map(([k,v])=>[k,{value:v,type:6}]));
const boardWith=(text,extra={})=>{const m=P(Object.fromEntries(core.NAMES.map(n=>[n,0])));const values=core.pack(text);values.forEach((v,i)=>m.set(core.name(i+1),{value:v,type:6}));for(const [k,v] of Object.entries(extra))m.set(k,{value:v,type:6});return m;};

// 48 parameters of three characters each; names fit the 16 characters of a parameter name
assert.equal(core.CHUNKS,48);assert.equal(core.PER,3);assert.equal(core.MAX,144);
assert.equal(core.NAMES.length,48);assert.equal(core.NAMES[0],'BUZ_CSTM_SONG');assert.equal(core.NAMES[1],'BUZ_CSTM_SONG2');assert.equal(core.NAMES[47],'BUZ_CSTM_SONG48');
assert.ok(core.NAMES.every(n=>n.length<=16&&core.NAME_RE.test(n)));assert.equal(new Set(core.NAMES).size,48);
for(const bad of ['BUZ_CSTM_SONG0','BUZ_CSTM_SONG1','BUZ_CSTM_SONG49','BUZ_CSTM_SONG100','BUZ_CSTM_SON','BUZ_CSTM_SONGX','NTF_BUZZ_VOLUME','buz_cstm_song'])assert.equal(core.NAME_RE.test(bad),false,bad);
assert.equal(core.indexOf('BUZ_CSTM_SONG'),1);assert.equal(core.indexOf('BUZ_CSTM_SONG35'),35);
// the writer accepts only the melody parameters and integers a MAVLink float carries exactly
assert.ok(core.valid('BUZ_CSTM_SONG',0)&&core.valid('BUZ_CSTM_SONG48',16777215)&&core.valid('BUZ_CSTM_SONG7',5523021));
for(const [n,v] of [['BUZ_CSTM_SONG',-1],['BUZ_CSTM_SONG',16777216],['BUZ_CSTM_SONG',1.5],['BUZ_CSTM_SONG',NaN],['BUZ_CSTM_SONG',Infinity],['BUZ_CSTM_SONG49',1],['NTF_BUZZ_TYPES',1],['SERVO1_FUNCTION',1],['BUZ_CSTM_SONG','5']])assert.equal(core.valid(n,v),false,n+'='+v);
assert.equal(Math.fround(16777215),16777215,'the largest value is exact in a float');

// packing: value = char0 + char1*256 + char2*65536, the text ends at the first zero byte
assert.deepEqual(core.pack(''),[]);
assert.deepEqual(core.pack('C'),[0x43]);assert.deepEqual(core.pack('CD#'),[0x43+0x44*256+0x23*65536]);
assert.deepEqual(core.pack('MFT2'),[0x4d+0x46*256+0x54*65536,0x32]);
assert.equal(core.pack('~~~')[0],0x7e7e7e);assert.equal(core.pack(' ~ ')[0],0x20+0x7e*256+0x20*65536);
assert.throws(()=>core.pack('x'.repeat(145)),/at most 144/);assert.throws(()=>core.pack('Cé'),/not printable ASCII/);assert.throws(()=>core.pack('C\nD'),/not printable ASCII/);
assert.equal(core.pack('A'.repeat(144)).length,48);
// the example melody of 104 characters takes 35 parameters; the helper script of the firmware work gave the same first and last values
const ex=core.pack(core.EXAMPLE);assert.equal(core.EXAMPLE.length,104);assert.equal(ex.length,35);assert.equal(ex[0],5523021);assert.equal(ex[1],3158066);assert.equal(ex[2],5190732);assert.equal(ex[33],4405283);assert.equal(ex[34],11826);
assert.ok(ex.every(v=>v>0&&v<=core.TOP));
// unpack is what the firmware's AP_BuzzerSong::get_song reads
const full=v=>[...v,...Array(48-v.length).fill(0)];
assert.equal(core.unpack(full(ex)),core.EXAMPLE);assert.equal(core.unpack(full(core.pack('A'.repeat(144)))),'A'.repeat(144));
assert.equal(core.unpack(full([0,ex[1]])),'','BUZ_CSTM_SONG = 0 means no custom melody whatever the others hold');
assert.equal(core.unpack(full([0x43+0x07*256+0x44*65536])),'C','a non-printable byte ends the text');
assert.equal(core.unpack(full([-1])),'','garbage without a printable first character plays the standard melody');
assert.equal(core.unpack(full([0x01000000+0x42])),'B','bits above the 24-bit chunk are ignored');
assert.equal(core.unpack(full([0x43+0*256+0x44*65536,0x45])),'C','the first zero byte ends the text even when more data follows');
assert.equal(core.unpack([]),'');
for(const text of [core.STANDARD,core.EXAMPLE,'C','CD','CDE','MFT200L4','A'.repeat(144),'A'.repeat(143),'A'.repeat(142)])assert.equal(core.unpack(full(core.pack(text))),text,'round trip '+text.length);

// what the board holds
assert.equal(core.board(P({})).state,'unsupported');assert.equal(core.supported(P({BUZ_CSTM_SONG:0})),false,'the last parameter must exist as well');
assert.equal(core.board(boardWith('')).state,'standard');
const onBoard=core.board(boardWith(core.EXAMPLE));assert.equal(onBoard.state,'custom');assert.equal(onBoard.text,core.EXAMPLE);assert.equal(onBoard.length,104);
assert.equal(core.board(boardWith('',{BUZ_CSTM_SONG:-1})).state,'standard');
assert.equal(core.board(new Map()).state,'unsupported');

// the write plan: only what differs, melody switched off first and BUZ_CSTM_SONG written last
const empty=boardWith('');
const toExample=core.plan(core.EXAMPLE,empty);
assert.equal(toExample.length,35);assert.deepEqual(toExample.at(-1),['BUZ_CSTM_SONG',5523021]);assert.equal(toExample.filter(([n])=>n==='BUZ_CSTM_SONG').length,1,'an empty board is not switched off first');
assert.deepEqual(toExample.slice(0,2),[['BUZ_CSTM_SONG2',3158066],['BUZ_CSTM_SONG3',5190732]]);
assert.ok(toExample.every(([n,v])=>core.valid(n,v)));
assert.deepEqual(core.plan(core.EXAMPLE,boardWith(core.EXAMPLE)),[],'nothing to write when the board already has it');
// replacing an active melody: off first, the changed parameters, BUZ_CSTM_SONG last
const replace=core.plan('MFT200L4O6CDE',boardWith(core.EXAMPLE));
assert.deepEqual(replace[0],['BUZ_CSTM_SONG',0]);assert.equal(replace.at(-1)[0],'BUZ_CSTM_SONG');assert.equal(replace.at(-1)[1],core.pack('MFT200L4O6CDE')[0]);
assert.ok(replace.slice(1,-1).every(([n])=>n!=='BUZ_CSTM_SONG'));
// the text ends with a zero byte unless it fills its last parameter: then a zero parameter must follow, but only when something else is there
const threes=core.plan('ABC',boardWith('XYZ123'));assert.deepEqual(threes.map(x=>x[0]),['BUZ_CSTM_SONG','BUZ_CSTM_SONG2','BUZ_CSTM_SONG'],'ABC over XYZ123: off, zero the next parameter, new value');
assert.deepEqual(threes.map(x=>x[1]),[0,0,core.pack('ABC')[0]]);
const keep=core.plan('ABC',boardWith('XYZ'));assert.deepEqual(keep,[['BUZ_CSTM_SONG',0],['BUZ_CSTM_SONG',core.pack('ABC')[0]]],'only the first parameter changes: off, then the value');
assert.deepEqual(core.plan('ABCD',boardWith('ABC')).map(x=>x[0]),['BUZ_CSTM_SONG','BUZ_CSTM_SONG2','BUZ_CSTM_SONG'],'a longer melody that keeps the first parameter is switched off for the write');
assert.deepEqual(core.plan('A'.repeat(144),empty).length,48,'144 characters need no terminator');
// switching off
assert.deepEqual(core.plan('',boardWith(core.EXAMPLE)),[['BUZ_CSTM_SONG',0]]);assert.deepEqual(core.plan('',empty),[]);
assert.throws(()=>core.plan('x'.repeat(145),empty));

// the reference interpreter: the sequence the SITL build of the controller played, checked against the golden values of the firmware tests
const golden={
 standard:{text:core.STANDARD,count:43,notes:21,total:4076.923,first:[['N',1479.978,100.962],['P',14.423],['N',1760,100.962],['P',14.423]],last:[['N',1479.978,201.923],['P',28.846]]},
 example:{text:core.EXAMPLE,count:76,notes:34,total:11550,first:[['N',4186.009,262.5],['P',37.5],['N',4978.032,131.25],['P',18.75]],last:[['N',4186.009,787.5],['P',75]]},
 short:{text:'MFT255L32CDE',count:6,notes:3,total:88.235,first:[['N',1046.502,25.735],['P',3.676],['N',1174.659,25.735],['P',3.676]],last:[['N',1318.51,25.735],['P',3.676]]},
 dots_legato:{text:'MLT120O3C4..D8.P2.E+G-',count:5,notes:4,total:3750,first:[['N',523.251,875],['N',587.33,375],['P',1500],['N',698.456,500]],last:[['N',698.456,500],['N',739.989,500]]},
 numbers:{text:'T150N60N0 8N40L16N61',count:8,notes:4,total:1300,first:[['N',1975.533,350],['P',50],['N',97.999,350],['P',50]],last:[['N',2093.005,87.5],['P',12.5]]},
 lower_case_space:{text:'mft 200 l 8 o 5 c d e f g',count:10,notes:5,total:750,first:[['N',2093.005,131.25],['P',18.75],['N',2349.318,131.25],['P',18.75]],last:[['N',3135.963,131.25],['P',18.75]]},
 octave_clamp:{text:'O7C>>C<<<<<<<<C',count:6,notes:3,total:1500,first:[['N',4186.009,437.5],['P',62.5],['N',4186.009,437.5],['P',62.5]],last:[['N',65.406,437.5],['P',62.5]]},
 sharp_flat_edges:{text:'O0A-O6B#',count:4,notes:2,total:1000,first:[['N',103.826,437.5],['P',62.5],['N',7902.133,437.5],['P',62.5]],last:[['N',7902.133,437.5],['P',62.5]]}
};
const row=e=>e.kind==='note'?['N',e.hz,e.ms]:['P',e.ms];
const near=(a,b,eps=2e-3)=>Math.abs(a-b)<=eps*Math.max(1,Math.abs(b));
for(const [key,g] of Object.entries(golden)){
 const r=core.run(g.text),ev=r.events;
 assert.equal(ev.length,g.count,key+': event count');assert.equal(ev.filter(e=>e.kind==='note').length,g.notes,key+': notes');
 assert.ok(near(ev.reduce((a,e)=>a+e.ms,0),g.total),key+': total duration');
 const same=(got,want)=>got.length===want.length&&got.every((x,i)=>x[0]===want[i][0]&&want[i].slice(1).every((v,k)=>near(x[k+1],v)));
 assert.ok(same(ev.slice(0,4).map(row),g.first),key+': first events '+JSON.stringify(ev.slice(0,4).map(row)));
 assert.ok(same(ev.slice(-g.last.length).map(row),g.last),key+': last events');
 assert.equal(r.stop,null,key+': plays to the end');
}
// how the player stops early, and what it quietly changes
const stops=(text,reason,index)=>{const r=core.run(text);assert.ok(r.stop,text+' stops');assert.equal(r.stop.reason,reason,text);if(index!==undefined)assert.equal(r.stop.index,index,text+' index');return r;};
stops('CD#XE','unknown',3);stops('L0C','length',0);stops('T31C','tempo',0);stops('T280C','tempo',0);   // the numbers of the player are 8 bits: 280 wraps to 24, below the minimum tempo
assert.ok(core.run('T300C').stop===null,'300 wraps to 44, which still plays');assert.deepEqual(core.run('T300C').warnings,[{kind:'wrap',index:1}]);assert.deepEqual(core.run('T255C').warnings,[]);
assert.deepEqual(core.run('T280C').warnings,[{kind:'wrap',index:1}]);
stops('MXC','mode',0);stops('M','mode',0);stops('N85','number',0);
assert.equal(core.run('CD').events.length,4);assert.equal(core.run('').events.length,0);assert.equal(core.run('   ').events.length,0);
assert.deepEqual(core.run('O7C').warnings,[{kind:'octave',index:0}]);assert.equal(core.run('MBC').repeats,true,'MB repeats the melody');assert.equal(core.run('MFC').repeats,false);
assert.ok(core.run('MBC').events.length>0&&core.run('MBC').events.length<10);
assert.equal(core.run('T130O4C').events[0].kind,'note');assert.ok(near(core.run('T120L4C').events[0].ms,437.5));
// describe: length, refused characters, duration, early stop
const d=core.describe(core.EXAMPLE);assert.equal(d.length,104);assert.equal(d.tooLong,false);assert.equal(d.invalid,-1);assert.equal(d.notes,34);assert.ok(near(d.durationMs,11550));assert.equal(d.stop,null);assert.deepEqual(d.warnings,[{kind:'octave',index:core.EXAMPLE.indexOf('O7')}]);
assert.equal(core.describe('CéD').invalid,1);assert.equal(core.describe('A'.repeat(145)).tooLong,true);assert.equal(core.describe('CXD').stop.index,1);

// the card model: states, what each button may do
const ready={ready:true,canWrite:true};
let m=core.model({params:boardWith(''),text:core.EXAMPLE,link:ready});
assert.equal(m.state,'standard');assert.equal(m.can.write,true);assert.equal(m.can.reset,false);assert.equal(m.can.read,true);assert.equal(m.can.preview,true);assert.equal(m.changes.length,35);
m=core.model({params:boardWith(core.EXAMPLE),text:core.EXAMPLE,link:ready});assert.equal(m.state,'custom');assert.equal(m.can.write,false,'the same melody is already on the board');assert.equal(m.can.reset,true);
m=core.model({params:boardWith(core.EXAMPLE),text:'',link:ready});assert.equal(m.can.write,false,'an empty text is written with the reset button');assert.equal(m.can.preview,false);
m=core.model({params:boardWith(''),text:core.EXAMPLE,link:{ready:true,canWrite:false}});assert.equal(m.can.write,false,'no write while armed or while another write runs');assert.equal(m.can.read,true);assert.equal(m.can.preview,true);
m=core.model({params:boardWith(''),text:core.EXAMPLE,link:ready,busy:true});assert.equal(m.can.write,false);assert.equal(m.can.read,false);assert.equal(m.can.reset,false);
m=core.model({params:boardWith(''),text:'A'.repeat(145),link:ready});assert.equal(m.can.write,false);assert.equal(m.can.preview,false);assert.equal(m.textOk,false);
m=core.model({params:boardWith(''),text:'Cé',link:ready});assert.equal(m.can.write,false);assert.equal(m.textOk,false);
m=core.model({params:P({ARMING_RUDDER:1}),text:'C',link:ready});assert.equal(m.state,'unsupported');assert.equal(m.can.write,false);assert.equal(m.can.read,false);assert.equal(m.can.preview,true,'the preview needs no board');
m=core.model({params:new Map(),text:'C',link:{ready:false}});assert.equal(m.state,'noparams');assert.equal(m.can.write,false);
m=core.model({params:boardWith(''),text:'CXD',link:ready});assert.equal(m.can.write,true,'a melody the player stops early is still writable (the card warns)');assert.equal(m.check.stop.index,1);

// ---- configurator wiring: scripts, styles, the writer in configurator.js, the card, the metadata
const cfg=read('js/configurator/configurator.js').replace(/\r\n/g,'\n'),html=read('configurator.html'),uiSource=read('js/configurator/buzzer-song-ui.js'),meta=JSON.parse(read('data/param-metadata.json')).parameters;
const scripts=[...html.matchAll(/<script src="([^"?]+)/g)].map(x=>x[1]),at=n=>scripts.indexOf('js/configurator/'+n);
assert.ok(at('buzzer-song-core.js')>=0&&at('buzzer-song-core.js')<at('configurator.js'),'the core loads before configurator.js');
assert.ok(at('buzzer-song-ui.js')>at('global-profile-ui.js')&&at('global-profile-ui.js')>at('capri-ui.js'),'the card loads after the G.L.O.B.A.L. card, which it follows');
assert.ok(html.includes('css/buzzer-song.css'));for(const key of ['song-card','song-text','song-notes','song-info','song-help','songResult'])assert.ok(read('css/buzzer-song.css').includes(key),'style '+key);
assert.match(uiSource,/\$\('globalPanel'\)\|\|\$\('orderPanel'\)/);assert.match(uiSource,/anchor\.after\(card\)/);assert.match(uiSource,/window\.confirm/);assert.match(uiSource,/api\.writeBuzzerSong/);assert.match(uiSource,/api\.canWrite\(\)/);
for(const lang of ['ru','uk','en'])assert.ok(new RegExp(`\\n ${lang}:\\{title:`).test(uiSource),'card words in '+lang);
for(const key of ['title','noparams','unsupported','standard','custom','label','placeholder','preview','stopPreview','example','base','read','write','reset','tooLong','invalid','stops','reasons','octave','wrap','repeat','willWrite','confirm','confirmReset','written','resetDone','already','readDone','readStandard','progress','verifyFailed','blocked','helpLabel','help'])assert.equal((uiSource.match(new RegExp(`(?:[{,]|\\n)\\s*${key}:`,'g'))||[]).length,3,key+' in ru, uk and en');
for(const lang of ['ru','uk','en']){const block=uiSource.slice(uiSource.indexOf(`\n ${lang}:{title:`),uiSource.indexOf(lang==='ru'?'\n uk:{title:':lang==='uk'?'\n en:{title:':'\n};'));assert.equal((block.match(/help:\['(?:[^']|\\')*'(?:,'(?:[^']|\\')*'){3}\]/)||[]).length,1,lang+': four help lines');for(const n of ['BUZ_CSTM_SONG48','144'])assert.ok(block.includes(n),lang+' help names '+n);}
assert.ok(!/generated|сгенерир|згенерова/i.test(uiSource),'no "generated" wording in the card');
assert.ok(uiSource.includes('core.EXAMPLE')&&uiSource.includes('core.STANDARD'));
// the writer: only the melody parameters, exact echo, DISARMED, the plan's order
assert.match(cfg,/writeBuzzerSong:async/);const writer=cfg.slice(cfg.indexOf('writeBuzzerSong:async'),cfg.indexOf('writeOrderPreset:async'));
assert.match(writer,/core\.valid\(name,value\)/);assert.match(writer,/!canWrite\(\)/);assert.match(writer,/writeParameterWithAck\(change\.name,change\.value,change\.type\)/);assert.match(writer,/echoed!==change\.value/);assert.match(writer,/state\.armed!==false/);
// metadata of the 48 parameters in the configurator's parameter table
for(const n of core.NAMES){const d=meta[n];assert.ok(d&&d.DisplayName&&d.Description,'metadata for '+n);assert.deepEqual(d.Range,{low:'0',high:'16777215'},n+' range');assert.equal(d.Default,'0');}
assert.equal(meta.BUZ_CSTM_SONG.User,'Standard');assert.equal(meta.BUZ_CSTM_SONG2.User,'Advanced');assert.match(meta.BUZ_CSTM_SONG.Description,/first zero byte/);assert.match(meta.BUZ_CSTM_SONG.Description,/standard startup melody/);
assert.match(meta.BUZ_CSTM_SONG17.DisplayName,/characters 49-51/);assert.match(meta.BUZ_CSTM_SONG48.DisplayName,/characters 142-144/);

const vm=require('node:vm');
// the writer of configurator.js run against a fake link: order, exact echo, refusals
function runWriter({armed=false,canWrite=true,echo=(n,v)=>v,params}={}){
 const state={params:params||new Map(core.NAMES.map(n=>[n,{value:0,type:6}])),connected:true,armed,lastHeartbeat:Date.now(),servoConfigBusy:false},writes=[],progress=[];
 const ctx={window:{AtlasBuzzerSong:core,dispatchEvent(){}},Event:class{},state,txGeneration:1,Date,Error,Array,Number,JSON,Promise,
  canWrite:()=>canWrite,renderParams(){},renderBasic(){},writeParameterWithAck:async(name,value,type)=>{writes.push([name,value,type]);const v=echo(name,value);state.params.set(name,{value:v,type});return v;}};
 const api=vm.runInNewContext('({'+writer.replace(/,\s*$/,'')+'})',ctx);
 return {api,state,writes,progress,run:u=>api.writeBuzzerSong(u,p=>progress.push(p))};
}
(async()=>{
 const plan=core.plan(core.EXAMPLE,boardWith(''));
 const ok=runWriter();const r=await ok.run(plan);
 assert.equal(JSON.stringify(r),'{"done":35,"total":35}');assert.deepEqual(ok.writes.map(x=>x.slice(0,2)),plan,'written in the order of the plan');assert.ok(ok.writes.every(x=>x[2]===6),'with the type the board reports');assert.equal(ok.writes.at(-1)[0],'BUZ_CSTM_SONG','BUZ_CSTM_SONG last');
 assert.equal(core.board(ok.state.params).text,core.EXAMPLE,'what the board reports is the melody');assert.equal(ok.state.servoConfigBusy,false);assert.equal(ok.progress.at(-1).done,35);assert.equal(ok.progress.length,36);
 await assert.rejects(runWriter({canWrite:false}).run(plan),/Live USB/);
 for(const bad of [[['SERVO1_FUNCTION',1]],[['BUZ_CSTM_SONG',-1]],[['BUZ_CSTM_SONG',16777216]],[['BUZ_CSTM_SONG',1.5]],[['BUZ_CSTM_SONG49',1]],[],[['BUZ_CSTM_SONG','5']],'BUZ_CSTM_SONG',[['BUZ_CSTM_SONG',1],['NTF_BUZZ_TYPES',0]]]){const w=runWriter();await assert.rejects(w.run(bad),/Invalid startup melody/);assert.equal(w.writes.length,0,'nothing is written for '+JSON.stringify(bad));}
 await assert.rejects(runWriter({params:new Map([['BUZ_CSTM_SONG',{value:0,type:6}]])}).run([['BUZ_CSTM_SONG2',5]]),/not present on FC/);
 // an echo that differs by one (within the generic tolerance of the acknowledgement) is an error, and the count of what was recorded is reported
 const off=runWriter({echo:(n,v)=>n==='BUZ_CSTM_SONG4'?v+1:v});await assert.rejects(off.run(plan),/Recorded 2\/35: BUZ_CSTM_SONG4: the controller reports/);assert.equal(off.state.servoConfigBusy,false);
 // ARM or a lost link in the middle stops the write
 const mid=runWriter({echo:(n,v)=>{if(n==='BUZ_CSTM_SONG3')mid.state.armed=true;return v;}});await assert.rejects(mid.run(plan),/Recorded 2\/35: Disconnected or ARM state changed/);assert.equal(mid.writes.length,2,'the write stops before the next parameter');assert.notEqual(mid.writes.at(-1)[0],'BUZ_CSTM_SONG','BUZ_CSTM_SONG is not reached: the board keeps the standard melody');

 // ---- the card against a fake DOM: confirm, write in order, check what the board reports, languages
 function runCard(language,initial,{confirm=true,canWrite=true,write,connected=true,audio=false}={}){
  const els=new Map(),make=()=>({children:[],dataset:{},hidden:false,disabled:false,textContent:'',className:'',value:'',placeholder:'',listeners:{},append(...k){this.children.push(...k);},prepend(...k){this.children.unshift(...k);},after(){},replaceChildren(...k){this.children=k;},addEventListener(t,f){this.listeners[t]=f;}});
  const byId=id=>{if(!els.has(id))els.set(id,make());return els.get(id);};
  const params=initial instanceof Map?initial:P(initial),calls=[],confirms=[],handlers={};
  const api={getState:()=>({connected,demo:false,sysid:1,compid:1,armed:false,lastHeartbeat:Date.now(),params,paramLoading:false,connectionId:1}),canWrite:()=>canWrite,
   writeBuzzerSong:write||(async(updates,cb)=>{calls.push(updates);let n=0;for(const [k,v] of updates){cb({done:n,total:updates.length,name:k});params.set(k,{value:v,type:6});n++;}cb({done:n,total:n,name:''});return {done:n,total:n};})};
  if(write){const inner=write;api.writeBuzzerSong=async(u,cb)=>{calls.push(u);return inner(u,cb,params);};}
  const window={AtlasCC:api,AtlasBuzzerSong:core,AtlasLanguage:()=>language,addEventListener:(e,f)=>{handlers[e]=f;},confirm:t=>{confirms.push(t);return confirm;}};
  if(audio)window.AudioContext=class{constructor(){this.currentTime=0;this.destination={};this.starts=0;audio.contexts.push(this);}createOscillator(){return {frequency:{},connect(){},start:()=>{this.starts++;},stop(){}};}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){}};}close(){this.closed=true;}};
  const timers=[];
  const document={createElement:()=>make(),getElementById:byId,querySelector:()=>make(),hidden:false};
  vm.runInNewContext(read('js/configurator/buzzer-song-ui.js'),{window,document,setInterval:()=>1,clearInterval(){},setTimeout:(f,ms)=>{timers.push([f,ms]);return timers.length;},clearTimeout(){},Date,Math,JSON,Number,Object,String,Error,Promise,Array});
  const type=value=>{byId('songText').value=value;byId('songText').listeners.input();};
  return {byId,calls,confirms,params,handlers,type,timers,refresh:()=>handlers['atlas:parameters']()};
 }
 const blank=P(Object.fromEntries(core.NAMES.map(n=>[n,0])));
 const clone=m=>new Map([...m].map(([k,v])=>[k,{...v}]));
 // standard melody on the board, empty field
 let c=runCard('ru',clone(blank));
 assert.equal(c.byId('songStatus').textContent,'На плате: стандартная мелодия запуска');assert.equal(c.byId('songWrite').disabled,true,'nothing to write yet');assert.equal(c.byId('songReset').disabled,true,'the board has no custom melody');assert.equal(c.byId('songRead').disabled,false);assert.equal(c.byId('songPreview').disabled,true);
 c.byId('songExample').onclick();assert.equal(c.byId('songText').value,core.EXAMPLE);assert.equal(c.byId('songWrite').disabled,false);assert.equal(c.byId('songPreview').disabled,false);
 assert.match(c.byId('songInfo').children.map(x=>x.children?x.children.map(k=>k.textContent).join(''):x).join(''),/104 \/ 144/);
 await c.byId('songWrite').onclick();
 assert.equal(c.confirms.length,1);assert.match(c.confirms[0],/Записать мелодию на контроллер\?/);assert.match(c.confirms[0],/35/);assert.ok(c.confirms[0].includes('BUZ_CSTM_SONG2 … BUZ_CSTM_SONG'),'the confirmation names the first and the last write');
 assert.equal(c.calls.length,1);assert.deepEqual(c.calls[0],plan);assert.match(c.byId('songResult').textContent,/Записано и подтверждено контроллером/);assert.match(c.byId('songResult').textContent,/\(35\/35\)/);
 assert.equal(c.byId('songStatus').textContent,'На плате: своя мелодия · 104 симв.');assert.equal(c.byId('songWrite').disabled,true,'the melody is on the board now');assert.equal(c.byId('songReset').disabled,false);
 // reset: one write, BUZ_CSTM_SONG = 0
 await c.byId('songReset').onclick();assert.equal(c.confirms.length,2);assert.match(c.confirms[1],/BUZ_CSTM_SONG = 0/);assert.deepEqual(c.calls[1],[['BUZ_CSTM_SONG',0]]);assert.match(c.byId('songResult').textContent,/Стандартная мелодия возвращена/);assert.equal(c.byId('songStatus').textContent,'На плате: стандартная мелодия запуска');
 // a declined confirmation writes nothing
 const declined=runCard('ru',clone(blank),{confirm:false});declined.byId('songExample').onclick();await declined.byId('songWrite').onclick();assert.equal(declined.calls.length,0);assert.equal(declined.confirms.length,1);
 // armed or busy link: no write, no reset, reading still works
 const armed=runCard('ru',clone(blank),{canWrite:false});armed.byId('songExample').onclick();assert.equal(armed.byId('songWrite').disabled,true);assert.equal(armed.byId('songRead').disabled,false);await armed.byId('songWrite').onclick();assert.equal(armed.calls.length,0);
 // the board's own melody fills an untouched field, and reading puts it back after edits
 const custom=runCard('ru',boardWith(core.EXAMPLE));assert.equal(custom.byId('songText').value,core.EXAMPLE,'an untouched field shows what the board plays');assert.equal(custom.byId('songWrite').disabled,true);assert.equal(custom.byId('songReset').disabled,false);
 custom.type('MFT100CDE');assert.equal(custom.byId('songWrite').disabled,false);custom.byId('songRead').onclick();assert.equal(custom.byId('songText').value,core.EXAMPLE);assert.match(custom.byId('songResult').textContent,/прочитана с платы/);
 await custom.byId('songReset').onclick();assert.equal(custom.byId('songText').value,core.EXAMPLE,'the field keeps the text after a reset');
 // replacing an active melody writes it off first and BUZ_CSTM_SONG last
 const replace2=runCard('ru',boardWith(core.EXAMPLE));replace2.type('MFT200L4O6CDE');await replace2.byId('songWrite').onclick();assert.deepEqual(replace2.calls[0][0],['BUZ_CSTM_SONG',0]);assert.equal(replace2.calls[0].at(-1)[0],'BUZ_CSTM_SONG');assert.equal(core.board(replace2.params).text,'MFT200L4O6CDE');
 // text the firmware refuses is flagged and never written; a melody the player stops early is written with a warning
 const bad=runCard('ru',clone(blank));bad.type('C'+String.fromCharCode(233)+'D');assert.equal(bad.byId('songWrite').disabled,true);assert.match(bad.byId('songNotes').children.map(x=>x.textContent).join('|'),/ASCII.*номер 2/);
 bad.type('A'.repeat(145));assert.equal(bad.byId('songWrite').disabled,true);assert.match(bad.byId('songNotes').children.map(x=>x.textContent).join('|'),/максимум 144/);assert.equal(bad.byId('songPreview').disabled,true);
 bad.type('CDXE');assert.equal(bad.byId('songWrite').disabled,false);assert.match(bad.byId('songNotes').children.map(x=>x.textContent).join('|'),/остановит мелодию на символе 3 \(«X»\): неизвестная команда/);
 bad.type('O7CT300D');const warns=bad.byId('songNotes').children.map(x=>x.textContent).join('|');assert.match(warns,/Октава выше 6/);assert.match(warns,/по модулю 256/);
 bad.type('MBCD');assert.match(bad.byId('songNotes').children.map(x=>x.textContent).join('|'),/MB повторяет/);
 // a board that returns other values: the melody is not confirmed
 const liar=runCard('ru',clone(blank),{write:async(updates,cb,params)=>{for(const [k,v] of updates)params.set(k,{value:k==='BUZ_CSTM_SONG'?v:v,type:6});params.set('BUZ_CSTM_SONG2',{value:7,type:6});return {done:updates.length,total:updates.length};}});
 liar.byId('songExample').onclick();await liar.byId('songWrite').onclick();assert.match(liar.byId('songResult').textContent,/мелодия не подтверждена/);
 // a failed write shows the writer's message
 const broken=runCard('ru',clone(blank),{write:async()=>{throw Error('Recorded 2/35: boom');}});broken.byId('songExample').onclick();await broken.byId('songWrite').onclick();assert.equal(broken.byId('songResult').textContent,'Recorded 2/35: boom');assert.equal(broken.byId('songWrite').disabled,false,'the card is usable again');
 // boards without the parameters, no link yet
 const old=runCard('ru',P({ARMING_RUDDER:1}));assert.equal(old.byId('songStatus').textContent,'Нужна прошивка с параметром BUZ_CSTM_SONG');assert.equal(old.byId('songWrite').disabled,true);assert.equal(old.byId('songRead').disabled,true);
 const none=runCard('ru',new Map(),{connected:false});assert.equal(none.byId('songStatus').textContent,'Подключи контроллер и дождись чтения параметров');
 // three languages
 for(const [lang,status,wrote] of [['uk','На платі: стандартна мелодія запуску',/Записано й підтверджено контролером/],['en','On the board: the standard startup melody',/Written and confirmed by the controller/]]){const l=runCard(lang,clone(blank));assert.equal(l.byId('songStatus').textContent,status);l.byId('songExample').onclick();await l.byId('songWrite').onclick();assert.match(l.byId('songResult').textContent,wrote);assert.equal(l.byId('songHelp').children.length,4,lang+' help lines');}
 // the preview: no board needed, no sound without AudioContext, one oscillator per note with it
 const noAudio=runCard('ru',new Map(),{connected:false});noAudio.byId('songText').value='MFT200CDE';noAudio.byId('songText').listeners.input();assert.equal(noAudio.byId('songPreview').disabled,false);noAudio.byId('songPreview').onclick();assert.match(noAudio.byId('songResult').textContent,/не умеет воспроизводить звук/);
 const audio={contexts:[]},heard=runCard('en',new Map(),{connected:false,audio});heard.byId('songText').value='MFT200CDE';heard.byId('songText').listeners.input();heard.byId('songPreview').onclick();assert.equal(audio.contexts.length,1);assert.equal(audio.contexts[0].starts,3,'one oscillator per note');assert.equal(heard.byId('songPreview').textContent,'Stop');
 heard.byId('songPreview').onclick();assert.equal(audio.contexts[0].closed,true,'Stop closes the audio context');assert.equal(heard.byId('songPreview').textContent,'Listen');

 console.log('PASS: BUZ_CSTM_SONG packing, write plan, reference MML interpreter, the writer, the card in three languages and the metadata of the 48 parameters.');
})().catch(e=>{console.error(e);process.exit(1);});
