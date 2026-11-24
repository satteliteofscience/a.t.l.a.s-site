/* AI-assisted. The wind profile of the configurator: the three NOAID_WIND presets (status, plan, limits), the operator wind command (validation, COMMAND_INT bytes against the pymavlink vectors),
   the card and its three languages, the writer and the sender in AtlasCC, and the wiring in configurator.html. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const core=require('../js/configurator/wind-profile-core.js');
const params=obj=>new Map(Object.entries(obj).map(([n,v],i)=>[n,{value:v,type:2,index:i}]));

// presets: off 0, command only 1, learning 7; the status names the preset or the own value
assert.deepEqual(core.PRESETS.map(p=>[p.id,p.value]),[['off',0],['command',1],['learn',7]]);
for(const [v,active] of [[0,'off'],[1,'command'],[7,'learn']])assert.deepEqual(core.status(params({NOAID_WIND:v})),{state:'active',active,value:v});
for(const v of [2,3,4,5,6]){const s=core.status(params({NOAID_WIND:v}));assert.equal(s.state,'custom');assert.equal(s.active,null);assert.equal(s.value,v);}
assert.equal(core.status(params({ARSPD_USE:1})).state,'unsupported','a board without NOAID_WIND (firmware before 3.0)');
// plan: the one write, nothing when the board is there already
assert.deepEqual(core.plan(params({NOAID_WIND:0}),'learn'),[['NOAID_WIND',7]]);assert.deepEqual(core.plan(params({NOAID_WIND:7}),'command'),[['NOAID_WIND',1]]);assert.deepEqual(core.plan(params({NOAID_WIND:3}),'off'),[['NOAID_WIND',0]]);
assert.deepEqual(core.plan(params({NOAID_WIND:1}),'command'),[]);assert.throws(()=>core.plan(params({NOAID_WIND:1}),'nope'),/Unknown wind preset/);
// limits: NOAID_WIND, an integer 0..7, and (3.1) NOAID_SLEW, an integer 0..120, nothing else
assert.ok(core.valid('NOAID_WIND',0)&&core.valid('NOAID_WIND',7));for(const v of [0,20,120])assert.ok(core.valid('NOAID_SLEW',v),'NOAID_SLEW '+v);
for(const bad of [[ 'NOAID_WIND',8],['NOAID_WIND',-1],['NOAID_WIND',1.5],['NOAID_WIND',NaN],['NOAID_WIND','7'],['NOAID_SLEW',121],['NOAID_SLEW',-1],['NOAID_SLEW',1.5],['NOAID_SLEW','20'],['NOAID_SLEW',NaN],['NOAID_WAGE',1],['NOAID_HOLD',2],['NOAID_PWATCH',7],['EK3_NOAID_POS',1]])assert.ok(!core.valid(...bad),'refused: '+bad.join('='));
// 3.1: the gradual fix is recommended only while learning is on and the fix still moves the position at once; the one write never overwrites a value the owner chose
assert.equal(core.slewAdvice(params({NOAID_WIND:7,NOAID_SLEW:0})),'recommend');assert.equal(core.slewAdvice(params({NOAID_WIND:3,NOAID_SLEW:0})),'recommend');assert.equal(core.slewAdvice(params({NOAID_WIND:2,NOAID_SLEW:0})),'recommend');
assert.equal(core.slewAdvice(params({NOAID_WIND:7,NOAID_SLEW:20})),'ok');assert.equal(core.slewAdvice(params({NOAID_WIND:1,NOAID_SLEW:0})),'ok');assert.equal(core.slewAdvice(params({NOAID_WIND:0,NOAID_SLEW:0})),'ok');
assert.equal(core.slewAdvice(params({NOAID_WIND:7})),'unknown');assert.equal(core.slewAdvice(params({ARSPD_USE:1})),'unknown');
assert.deepEqual(core.slewPlan(params({NOAID_WIND:7,NOAID_SLEW:0})),[['NOAID_SLEW',20]]);assert.deepEqual(core.slewPlan(params({NOAID_WIND:7,NOAID_SLEW:30})),[]);assert.deepEqual(core.slewPlan(params({NOAID_WIND:7,NOAID_SLEW:20})),[]);assert.deepEqual(core.slewPlan(params({NOAID_WIND:7})),[]);
assert.deepEqual([core.SLEW,core.SLEW_RECOMMENDED,core.SLEW_MAX],['NOAID_SLEW',20,120]);assert.ok(core.INFO.includes('NOAID_SLEW'));
// the bits and the note that a learned wind stays when the learning goes
assert.deepEqual(core.bits(7),{command:true,learn:true,calibrate:true});assert.deepEqual(core.bits(1),{command:true,learn:false,calibrate:false});assert.deepEqual(core.bits(null),{command:null,learn:null,calibrate:null});
assert.ok(core.keepsLearnedWind(params({NOAID_WIND:7}),'command')&&core.keepsLearnedWind(params({NOAID_WIND:7}),'off')&&core.keepsLearnedWind(params({NOAID_WIND:3}),'command'));
assert.ok(!core.keepsLearnedWind(params({NOAID_WIND:1}),'off')&&!core.keepsLearnedWind(params({NOAID_WIND:0}),'learn')&&!core.keepsLearnedWind(params({NOAID_WIND:7}),'learn'));
// the command: speed 0..40, direction 0..360, speed 0 = the wind is zero (direction forced to 0); texts with a decimal comma are accepted
assert.deepEqual(core.windCommand(7,235),{command:43004,speed:7,direction:235,params:[7,1,235,0]});assert.deepEqual(core.windCommand(0,123),{command:43004,speed:0,direction:0,params:[0,1,0,0]});
assert.deepEqual(core.windCommand('11,5','330').params,[11.5,1,330,0]);assert.deepEqual(core.windCommand('3',''),{command:43004,speed:3,direction:0,params:[3,1,0,0]});assert.deepEqual(core.windCommand(40,360).params,[40,1,360,0]);
for(const bad of [[-0.1,0],[40.1,0],[5,-1],[5,360.5],[NaN,0],['x',0],[5,'y'],[Infinity,0]])assert.throws(()=>core.windCommand(...bad),/Invalid wind/,'refused: '+bad.join(','));
assert.equal(core.commandAdvice(params({NOAID_WIND:7})),'ok');assert.equal(core.commandAdvice(params({NOAID_WIND:3})),'ok');assert.equal(core.commandAdvice(params({NOAID_WIND:2})),'bit0off');assert.equal(core.commandAdvice(params({NOAID_WIND:0})),'bit0off');assert.equal(core.commandAdvice(params({FOO:1})),'unknown');assert.equal(core.commandAdvice(null),'unknown');
assert.deepEqual([0,2,4,9].map(core.resultName),['accepted','denied','failed','unknown']);

// COMMAND_INT bytes: the browser encoder against frames built independently with struct and the x25 CRC and parsed back by pymavlink (tools/wind-command-vectors.json)
const window={};vm.runInNewContext(read('js/configurator/mavlink.js'),{window,TextEncoder,TextDecoder,Uint8Array,DataView,Error,Math,console,Number,Object,Array});
const M=window.AtlasMAV,vectors=JSON.parse(read('tools/wind-command-vectors.json'));
assert.equal(vectors.crc_extra,158);assert.ok(vectors.cases.length>=6);
const hex=b=>Buffer.from(b).toString('hex');
for(const c of vectors.cases){
 const payload=M.commandInt(c.sysid,c.compid,43004,core.windCommand(c.speed,c.direction).params);
 assert.equal(hex(payload),c.payload,`payload of the wind ${c.speed} m/s from ${c.direction}`);
 assert.equal(hex(M.createFrame(75,payload,c.seq)),c.frame,`frame of the wind ${c.speed} m/s from ${c.direction}`);
}
assert.equal(M.commandInt(1,1,43004,[0,1,0,0]).length,35);assert.throws(()=>M.commandInt(1,1,70000,[0,0,0,0]),/Invalid COMMAND_INT/);assert.throws(()=>M.commandInt(1,1,43004,null),/Invalid COMMAND_INT/);
// the parser still accepts the ack of the command (COMMAND_ACK 77, result accepted)
const ack=Uint8Array.from([0xfc,0xa7,0]);assert.deepEqual(JSON.parse(JSON.stringify(M.parseMessage({id:77,payload:ack,sysid:1,compid:1}))),{type:'ack',command:43004,result:0,progress:null});

// the card: ids, three languages with the same keys, the calm note, the position under the radio-failsafe card
const ui=read('js/configurator/wind-profile-ui.js');
const wm=ui.match(/const words=(\{[^]*?\n\});/);assert.ok(wm,'the words of the card');
const words=vm.runInNewContext('('+wm[1]+')');
const keys=lang=>new Set(Object.keys(words[lang]));
const ru=keys('ru'),uk=keys('uk'),en=keys('en');
for(const lang of ['uk','en'])assert.deepEqual(Object.keys(words[lang].tips).sort(),Object.keys(words.ru.tips).sort(),'the preset tips of '+lang);
for(const lang of ['ru','uk','en'])for(const [k,v] of Object.entries(words[lang]))if(k!=='tips')assert.ok(typeof v==='string'&&v.length>1,'text '+k+' ('+lang+')');
for(const k of ['title','noparams','unsupported','active','custom','p_off','p_command','p_learn','tips','details','help','calm','confirm','written','already','progress','keeps','cmdTitle','speed','dir','send','zero','cmdHint','bit0off','demo','nolink','badWind','sending','accepted','rejected','noAck','fc','confirmWind','confirmZero','bit0','bit1','bit2','wage','on','off','exp','expLink','howTitle','how1','how2','how3','how4','how5','how6','how7','slew','slewRec','slewBtn','slewConfirm'])assert.ok(ru.has(k)&&uk.has(k)&&en.has(k),'card text '+k+' in ru, uk and en');
// 3.1: the recommendations "how to teach the wind" (seven points in three languages, the first names the launch confirmation) and the gradual-fix offer
for(const lang of ['ru','uk','en']){assert.ok(/NOAID motion confirmed/.test(words[lang].how1),'how1 names the launch confirmation ('+lang+')');assert.ok(/NOAID_SLEW/.test(words[lang].slewRec)&&/NOAID_SLEW 20/.test(words[lang].slewConfirm)&&/20/.test(words[lang].slewBtn),'the gradual-fix texts name the parameter and the value ('+lang+')');}
assert.ok(ui.includes('id="windHow"')&&ui.includes('id="windSlew"')&&ui.includes('id="windSlewBtn"')&&/for\(let i=1;i<=7;i\+\+\)/.test(ui)&&/core\.slewPlan\(/.test(ui)&&/core\.slewAdvice\(/.test(ui),'the card lists the seven points and offers the gradual fix through the same writer');
// 3.1: the experimental warning sits on the card in three languages and links to the 3.1 section of the changelog
assert.ok(words.ru.exp.startsWith('ЭКСПЕРИМЕНТАЛЬНАЯ ФУНКЦИЯ')&&words.uk.exp.startsWith('ЕКСПЕРИМЕНТАЛЬНА ФУНКЦІЯ')&&words.en.exp.startsWith('EXPERIMENTAL FUNCTION'),'the warning opens with the word experimental in three languages');
for(const lang of ['ru','uk','en'])assert.ok(/GPS/.test(words[lang].exp)&&/3\.1/.test(words[lang].exp),'the warning says that it does not replace GPS and names 3.1 ('+lang+')');
assert.ok(ui.includes('id="windExp"')&&ui.includes('href="changelog.html#release-3-1"'),'the warning element and its link');
assert.deepEqual([...ru].sort(),[...uk].sort());assert.deepEqual([...ru].sort(),[...en].sort());
for(const id of [...ui.matchAll(/\$\('([A-Za-z]+)'\)/g)].map(m=>m[1]))assert.ok(ui.includes(`id="${id}"`),'the card has #'+id);
assert.ok(/getElementById\('fslogPanel'\)/.test(ui)&&/anchor\.after\(card\)/.test(ui),'the card sits under the radio-failsafe and log card');
assert.ok(/NOAID_WIND 0 или 1|«Только команда»/.test(ui)&&/Выключение обучения уже выученный ветер не обнуляет/.test(ui)&&/Switching the learning off does not clear a wind that has already been learned/.test(ui)&&/Вимкнення навчання вже вивчений вітер не обнуляє/.test(ui),'the calm note in three languages');
assert.ok(/api\.writeWindProfile\(/.test(ui)&&/api\.sendWindEstimate\(/.test(ui)&&/window\.confirm\(/.test(ui),'the card writes through AtlasCC and asks first');
// AtlasCC: the writer and the sender (COMMAND_INT 75, the command 43004), the writer only for DISARMED, the sender with a live heartbeat in demo-free mode
const code=read('js/configurator/configurator.js');
assert.ok(/writeWindProfile:async \(updates,onProgress=\(\)=>\{\}\)=>\{[^]*?canWrite\(\)[^]*?Invalid wind profile write[^]*?writeParameterWithAck/.test(code),'the profile writer: DISARMED, one verified parameter');
assert.ok(/sendWindEstimate:\(speed,direction\)=>\{[^]*?windCommand\(speed,direction\)[^]*?state\.demo[^]*?Date\.now\(\)-state\.lastHeartbeat>=4000[^]*?transmit\(75,M\.commandInt\(/.test(code),'the sender: validated, live link, not in demo mode, COMMAND_INT');
// configurator.html: stylesheet, core before the configurator, UI after the failsafe card, cache tags
const html=read('configurator.html'),pos=s=>html.indexOf(s);
assert.ok(pos('css/wind-profile.css?v=3-1-wind3')>0&&pos('js/configurator/wind-profile-core.js?v=3-1-wind2')>pos('js/configurator/failsafe-log-core.js')&&pos('js/configurator/wind-profile-core.js')<pos('js/configurator/configurator.js'),'the core loads before the configurator');
assert.ok(pos('js/configurator/wind-profile-ui.js?v=3-1-wind2')>pos('js/configurator/failsafe-log-ui.js')&&pos('js/configurator/wind-profile-ui.js')>pos('js/configurator/configurator.js'),'the card loads after the failsafe card and the configurator');
assert.ok(/mavlink\.js\?v=3-0-wind/.test(html)&&/configurator\.js\?v=3-0-wind/.test(html),'cache tags of mavlink.js and configurator.js');
assert.ok(read('css/wind-profile.css').includes('.wind-card'),'the stylesheet');
console.log('PASS: wind profile: three NOAID_WIND presets, the operator wind command (COMMAND_INT bytes against pymavlink), the card in three languages and its wiring.');
