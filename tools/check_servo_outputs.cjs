'use strict';
/* Servo outputs table: the function list of ArduPlane 4.7.3 and the function drop-down plus the reverse switch on every output row.
   calibration.js runs here against a small stub DOM and a stub controller; the only proof of a write is the echoed parameter value. */
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const core=require('../js/configurator/servo-config-core.js');
const batteryCore=require('../js/configurator/battery-cal-core.js');
const source=read('js/configurator/calibration.js');

/* ---------- function list (core, no DOM) ---------- */
function testFunctionList(){
 const all=[...core.FUNCTION_NAMES.keys()],grouped=core.FUNCTION_GROUPS.flatMap(group=>group.values);
 assert.equal(all.length,147,'the Plane list of 4.7.3 has 147 values');
 assert.equal(new Set(grouped).size,grouped.length,'a value must sit in exactly one group');
 assert.deepEqual(all.filter(value=>!grouped.includes(value)),[],'every value must be in a group');
 assert.deepEqual(grouped.filter(value=>!core.FUNCTION_NAMES.has(value)),[],'a group must not list an unknown value');
 assert.deepEqual(core.FUNCTION_GROUPS.map(group=>group.id),['main','motors','rc','payload','other','script']);
 const names={'-1':'GPIO',0:'Disabled',1:'RCPassThru',4:'Aileron',19:'Elevator',21:'Rudder',70:'Throttle',2:'Flap',3:'FlapAuto',24:'FlaperonLeft',25:'FlaperonRight',77:'ElevonLeft',78:'ElevonRight',79:'VTailLeft',80:'VTailRight',33:'Motor1',26:'GroundSteering',110:'Airbrakes',94:'Script1',109:'Script16'};
 for(const [value,name] of Object.entries(names))assert.equal(core.functionName(Number(value)),name,'SERVO function '+value);
 assert.equal(core.functionName(999),null);assert.equal(core.functionName(undefined),null);
 assert.equal(core.functionLabel(4),'Aileron (4)');assert.equal(core.functionLabel(999),'999');
 const main=core.functionGroups()[0].items.map(item=>item.value);
 assert.deepEqual(main.slice(0,7),[-1,0,1,4,19,21,70],'the surfaces a fixed-wing pilot needs come first');
 /* validation accepts GPIO (-1) and every listed function, rejects the rest */
 const params=new Map([['SERVO1_FUNCTION',{value:4}],['SERVO1_MIN',{value:1000}],['SERVO1_TRIM',{value:1500}],['SERVO1_MAX',{value:2000}],['SERVO1_REVERSED',{value:0}]]);
 const draft=fn=>({FUNCTION:String(fn),MIN:'1000',TRIM:'1500',MAX:'2000',REVERSED:false});
 assert.deepEqual(core.validateDraft(1,draft(-1),params).changes,[['FUNCTION',-1]]);
 for(const value of all)assert.ok(!core.validateDraft(1,draft(value),params).error,'function '+value+' must validate');
 assert.equal(core.validateDraft(1,draft(-2),params).error,'invalid');
 assert.equal(core.validateDraft(1,draft(1001),params).error,'invalid');
 assert.equal(core.validateDraft(1,draft('4.5'),params).error,'invalid');
}

/* ---------- stub DOM ---------- */
class FakeClassList{
 constructor(){this.set=new Set();}
 add(...names){for(const name of names)this.set.add(name);}
 remove(...names){for(const name of names)this.set.delete(name);}
 toggle(name,force){const on=force===undefined?!this.set.has(name):!!force;if(on)this.set.add(name);else this.set.delete(name);return on;}
 contains(name){return this.set.has(name);}
 toString(){return [...this.set].join(' ');}
}
class FakeElement{
 constructor(tag,doc){this.tagName=String(tag).toUpperCase();this.ownerDocument=doc;this.children=[];this.attributes=new Map();this.style={};this.dataset={};this.listeners=new Map();this.classList=new FakeClassList();
  this._text='';this._value='';this._selected=undefined;this.checked=false;this.disabled=false;this.hidden=false;this.title='';this.type='';this.open=false;this.shown=0;}
 get className(){return this.classList.toString();}
 set className(value){this.classList.set=new Set(String(value).split(/\s+/).filter(Boolean));}
 get textContent(){return this.children.length?this.children.map(child=>child.textContent).join(''):this._text;}
 set textContent(value){this.children=[];this._text=String(value);}
 get label(){return this.attributes.get('label')??'';}
 set label(value){this.attributes.set('label',String(value));}
 get value(){if(this.tagName==='SELECT')return this._selected!==undefined?this._selected:(this.options()[0]?.value??'');return this._value;}
 set value(value){if(this.tagName==='SELECT'){const text=String(value);this._selected=this.options().some(option=>option.value===text)?text:'';return;}this._value=String(value);}
 options(){const found=[];const walk=node=>{for(const child of node.children){if(child.tagName==='OPTION')found.push(child);else walk(child);}};walk(this);return found;}
 append(...nodes){for(const node of nodes)this.children.push(typeof node==='string'?Object.assign(new FakeElement('#text',this.ownerDocument),{_text:node}):node);}
 appendChild(node){this.append(node);return node;}
 replaceChildren(...nodes){this.children=[];this._text='';this._selected=undefined;this.append(...nodes);}
 setAttribute(name,value){this.attributes.set(name,String(value));}
 getAttribute(name){return this.attributes.has(name)?this.attributes.get(name):null;}
 removeAttribute(name){this.attributes.delete(name);}
 addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
 removeEventListener(){}
 dispatch(type,extra={}){const event={type,target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...extra};for(const fn of this.listeners.get(type)||[])fn(event);return event;}
 querySelector(){return null;}
 querySelectorAll(){return [];}
 closest(){return null;}
 showModal(){this.open=true;this.shown++;}
 close(){this.open=false;}
 focus(){this.ownerDocument.activeElement=this;}
 blur(){if(this.ownerDocument.activeElement===this)this.ownerDocument.activeElement=null;}
}
const SELECT_IDS=new Set(['servoEditFunction']);
function byClass(node,name){if(node.classList?.contains(name))return node;for(const child of node.children||[]){const found=byClass(child,name);if(found)return found;}return null;}
function byTag(node,tag){if(node.tagName===tag)return node;for(const child of node.children||[]){const found=byTag(child,tag);if(found)return found;}return null;}
function allByTag(node,tag,list=[]){if(node.tagName===tag)list.push(node);for(const child of node.children||[])allByTag(child,tag,list);return list;}

function fixtureParams(){
 const params=new Map(),put=(name,value)=>params.set(name,{value,type:4});
 for(let n=1;n<=16;n++){put(`SERVO${n}_MIN`,1000);put(`SERVO${n}_TRIM`,1500);put(`SERVO${n}_MAX`,2000);put(`SERVO${n}_REVERSED`,0);put(`SERVO${n}_FUNCTION`,0);}
 params.get('SERVO1_FUNCTION').value=4;params.get('SERVO2_FUNCTION').value=19;params.get('SERVO3_FUNCTION').value=70;params.get('SERVO4_FUNCTION').value=999;
 params.get('SERVO2_REVERSED').value=1;
 return params;
}
function makeEnv(lang='ru'){
 const timers={list:[],next:0,setTimeout(fn,ms){const id=++this.next;this.list.push({id,fn,ms});return id;},clearTimeout(id){this.list=this.list.filter(timer=>timer.id!==id);},setInterval(){return ++this.next;},runAll(){const run=this.list.splice(0);for(const timer of run)timer.fn();}};
 const document={activeElement:null,hidden:false,ids:new Map(),
  getElementById(id){if(!this.ids.has(id)){const el=new FakeElement(SELECT_IDS.has(id)?'select':'div',this);if(id==='servoRebootNote')el.hidden=true;this.ids.set(id,el);}return this.ids.get(id);},
  createElement(tag){return new FakeElement(tag,this);},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){}};
 const params=fixtureParams();
 const api={params,writes:[],logs:[],connected:true,allowed:true,busy:false,failWith:null,hold:false,pending:[],active:0,maxActive:0,
  getState(){return {connected:this.connected,demo:false,sysid:1,compid:1,armed:false,lastHeartbeat:Date.now(),params,telemetry:{},selectedBoard:'matek-h743-wing-v3',paramLoading:false,paramCount:params.size,paramComplete:true,lastVoltageTelemetry:0,mode:'FBWA',transport:'usb',compassStatus:{}};},
  canWrite(){return this.connected&&this.allowed&&!this.busy;},
  canCalibrate(){return this.connected&&this.allowed;},
  log(text,bad){this.logs.push({text,bad:!!bad});},
  requestMessage(){return Promise.resolve();},command(){return Promise.resolve();},diagnosticStats(){return {};},editParam(){},sendServoPwm(){return Promise.resolve();},
  releaseNext(){const next=this.pending.shift();if(next)next();},
  async writeServoConfig(channel,updates){
   this.writes.push({channel,updates:{...updates}});
   if(!this.canWrite())throw Error('Requires live DISARMED USB, complete parameter read and no other write');
   this.busy=true;this.active++;this.maxActive=Math.max(this.maxActive,this.active);
   try{
    if(this.hold)await new Promise(resolve=>this.pending.push(resolve));else await Promise.resolve();
    if(this.failWith)throw Error(this.failWith);
    for(const [field,value] of Object.entries(updates)){const name=`SERVO${channel}_${field}`;params.set(name,{...params.get(name),value});}
    return {done:Object.keys(updates).length,total:Object.keys(updates).length};
   }finally{this.busy=false;this.active--;}
  }};
 const listeners=new Map();
 const window={AtlasCC:api,AtlasServoCore:core,AtlasBatteryCalCore:batteryCore,confirm:()=>true,
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
  dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);return true;}};
 class CustomEvent{constructor(type,init){this.type=type;this.detail=init?.detail;}}
 const env={lang,timers,document,api,window,params};
 const context=vm.createContext({window,document,navigator:{},localStorage:{getItem:key=>key==='atlas-language'?env.lang:null},CustomEvent,Blob:class{},URL:{createObjectURL(){return '';},revokeObjectURL(){}},console,
  setTimeout:(fn,ms)=>timers.setTimeout(fn,ms),clearTimeout:id=>timers.clearTimeout(id),setInterval:(fn,ms)=>timers.setInterval(fn,ms)});
 vm.runInContext(source,context,{filename:'js/configurator/calibration.js'});
 env.rows=()=>document.getElementById('servoGrid').children.slice(1);
 env.part=(n,name)=>byClass(env.rows()[n-1],name);
 env.revInput=n=>byTag(env.part(n,'servo-rev'),'INPUT');
 env.render=()=>window.dispatchEvent({type:'atlas:state'});
 return env;
}
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();await new Promise(resolve=>setImmediate(resolve));};
async function choose(env,n,value){const fn=env.part(n,'servo-fn');fn.value=String(value);fn.dispatch('change');await settle();}
async function toggle(env,n,checked){const input=env.revInput(n);input.checked=checked;input.dispatch('change');await settle();}

/* ---------- the table ---------- */
function testTableBuilt(){
 const env=makeEnv();
 const grid=env.document.getElementById('servoGrid');
 assert.equal(grid.children.length,17,'header plus 16 output rows');
 assert.ok(grid.children[0].classList.contains('servo-head'));
 assert.deepEqual(grid.children[0].children.map(cell=>cell.textContent),['Выход','Позиция','Реверс','Функция','MIN · TRIM · MAX','']);
 for(let n=1;n<=16;n++){
  const row=env.rows()[n-1];
  for(const name of ['servo-num','servo-pos','servo-pwm','servo-track','servo-rev','servo-fn','servo-lim','servo-setup','servo-note'])assert.ok(byClass(row,name),`row ${n} needs .${name}`);
  assert.equal(byClass(row,'servo-num').textContent,`SERVO ${n}`);
  const fn=byClass(row,'servo-fn');
  assert.equal(fn.tagName,'SELECT');
  assert.equal(fn.getAttribute('aria-label'),`SERVO ${n} · функция выхода`);
  assert.equal(env.revInput(n).getAttribute('aria-label'),`SERVO ${n} · реверс выхода`);
  assert.equal(fn.options().length,147+2,'all 147 functions plus the two service options');
  const groups=fn.children.filter(child=>child.tagName==='OPTGROUP');
  assert.deepEqual(groups.map(group=>group.label),['Основные','Моторы и поворотные моторы','Каналы RC','Подвес, камера, нагрузка','Прочее','Скрипты (Lua)']);
  assert.equal(groups[0].children[0].textContent,'GPIO (-1)');
  assert.ok(groups[0].children.some(option=>option.textContent==='Aileron (4)'&&option.value==='4'));
  assert.ok(byClass(row,'servo-note').hidden,'no note before a write');
 }
 assert.equal(env.document.getElementById('servoRebootNote').hidden,true);
}
function testRowsShowParameters(){
 const env=makeEnv();
 const lim=n=>env.part(n,'servo-lim').textContent;
 assert.equal(env.part(1,'servo-fn').value,'4');
 assert.equal(env.part(2,'servo-fn').value,'19');
 assert.equal(env.part(3,'servo-fn').value,'70');
 assert.equal(env.revInput(1).checked,false);
 assert.equal(env.revInput(2).checked,true);
 assert.ok(env.part(2,'servo-rev').classList.contains('on'),'reversed output is highlighted');
 assert.ok(!env.part(1,'servo-rev').classList.contains('on'));
 assert.equal(lim(1),'MIN 1000 · TRIM 1500 · MAX 2000');
 for(let n=1;n<=16;n++){assert.equal(env.part(n,'servo-fn').disabled,false,`row ${n} editable`);assert.equal(env.revInput(n).disabled,false);assert.equal(env.part(n,'servo-setup').disabled,false);}
 /* a function the list does not know stays visible and is never rewritten */
 const odd=env.part(4,'servo-fn');
 assert.equal(odd.value,'999');
 const custom=odd.options().find(option=>option.value==='999');
 assert.ok(custom&&!custom.hidden&&/999 · нестандартная/.test(custom.textContent),'unknown function is shown as custom');
 assert.equal(env.api.writes.length,0,'rendering never writes');
 /* the list of a known value hides the custom entry */
 assert.ok(odd.options().filter(option=>option.hidden).length>=1);
 assert.equal(env.part(1,'servo-fn').options().find(option=>option.value==='4').hidden,false);
}
function testMissingParameters(){
 const env=makeEnv();
 for(const field of ['FUNCTION','REVERSED','MIN','TRIM','MAX'])env.params.delete(`SERVO16_${field}`);
 env.render();
 assert.equal(env.part(16,'servo-fn').value,'');
 assert.equal(env.part(16,'servo-fn').disabled,true,'no parameter, no control');
 assert.equal(env.revInput(16).disabled,true);
 assert.equal(env.part(16,'servo-setup').disabled,true);
 assert.equal(env.part(16,'servo-lim').textContent,'MIN — · TRIM — · MAX —');
 assert.equal(env.part(15,'servo-fn').disabled,false);
}

/* ---------- writing from the row ---------- */
async function testFunctionChange(){
 const env=makeEnv();
 env.api.hold=true;
 const fn=env.part(1,'servo-fn');fn.value='21';fn.dispatch('change');
 await settle();
 assert.deepEqual(env.api.writes,[{channel:1,updates:{FUNCTION:21}}],'one PARAM_SET request for the chosen function');
 assert.equal(env.params.get('SERVO1_FUNCTION').value,4,'nothing is claimed before the echo');
 assert.match(env.part(1,'servo-note').textContent,/^Запись: SERVO1_FUNCTION = 21…/);
 for(let n=1;n<=16;n++){assert.equal(env.part(n,'servo-fn').disabled,true,'every control waits while a write is in flight');assert.equal(env.revInput(n).disabled,true);}
 env.api.releaseNext();await settle();
 assert.equal(env.params.get('SERVO1_FUNCTION').value,21);
 assert.equal(env.part(1,'servo-fn').value,'21');
 assert.match(env.part(1,'servo-note').textContent,/^✓ SERVO1_FUNCTION = 21 · подтверждено контроллером/);
 assert.ok(!env.part(1,'servo-note').classList.contains('bad'));
 assert.equal(env.part(1,'servo-fn').disabled,false,'controls come back after the echo');
 const reboot=env.document.getElementById('servoRebootNote');
 assert.equal(reboot.hidden,false,'FUNCTION needs a restart');assert.match(reboot.textContent,/SERVO1/);assert.match(reboot.textContent,/перезагрузки контроллера/);
 assert.ok(env.api.logs.some(log=>/SERVO1_FUNCTION = 21 confirmed by PARAM_VALUE/.test(log.text)&&!log.bad));
 env.timers.runAll();
 assert.equal(env.part(1,'servo-note').hidden,true,'a success note fades out');
 /* GPIO (-1) is a valid choice */
 env.api.hold=false;
 await choose(env,5,-1);
 assert.deepEqual(env.api.writes[1],{channel:5,updates:{FUNCTION:-1}});
 assert.equal(env.params.get('SERVO5_FUNCTION').value,-1);
 assert.match(env.document.getElementById('servoRebootNote').textContent,/SERVO1, SERVO5/);
}
async function testReverseToggle(){
 const env=makeEnv();
 await toggle(env,1,true);
 assert.deepEqual(env.api.writes,[{channel:1,updates:{REVERSED:1}}]);
 assert.equal(env.params.get('SERVO1_REVERSED').value,1);
 assert.equal(env.revInput(1).checked,true);
 assert.ok(env.part(1,'servo-rev').classList.contains('on'));
 assert.match(env.part(1,'servo-note').textContent,/^✓ SERVO1_REVERSED = 1 · подтверждено контроллером/);
 assert.equal(env.document.getElementById('servoRebootNote').hidden,true,'reverse acts at once: no restart note');
 await toggle(env,2,false);
 assert.deepEqual(env.api.writes[1],{channel:2,updates:{REVERSED:0}});
 assert.equal(env.params.get('SERVO2_REVERSED').value,0);
 assert.ok(!env.part(2,'servo-rev').classList.contains('on'));
 /* the same state again is not a write */
 await toggle(env,2,false);
 assert.equal(env.api.writes.length,2);
}
async function testFailureReverts(){
 const env=makeEnv();
 env.api.failWith='PARAM_VALUE timeout';
 await choose(env,1,19);
 assert.equal(env.params.get('SERVO1_FUNCTION').value,4);
 assert.equal(env.part(1,'servo-fn').value,'4','the list goes back to what the controller really has');
 assert.match(env.part(1,'servo-note').textContent,/^⚠ PARAM_VALUE timeout/);
 assert.ok(env.part(1,'servo-note').classList.contains('bad'));
 assert.equal(env.document.getElementById('servoRebootNote').hidden,true,'a failed write asks for no restart');
 assert.ok(env.api.logs.some(log=>log.bad&&/PARAM_VALUE timeout/.test(log.text)));
 env.timers.runAll();
 assert.equal(env.part(1,'servo-note').hidden,false,'an error stays until the next action');
 await toggle(env,2,false);
 assert.equal(env.params.get('SERVO2_REVERSED').value,1);
 assert.equal(env.revInput(2).checked,true,'the switch goes back too');
 assert.ok(env.part(2,'servo-rev').classList.contains('on'));
 /* a write that the controller never echoed is not success */
 env.api.failWith=null;
 const original=env.api.writeServoConfig.bind(env.api);
 env.api.writeServoConfig=async(channel,updates)=>{env.api.writes.push({channel,updates});return {done:0,total:1};};
 await choose(env,3,21);
 assert.equal(env.part(3,'servo-fn').value,'70');
 assert.match(env.part(3,'servo-note').textContent,/^⚠ Controller did not confirm SERVO3_FUNCTION/);
 env.api.writeServoConfig=original;
}
async function testLockedWhenNotAllowed(){
 const env=makeEnv();
 env.api.allowed=false;env.render();
 for(let n=1;n<=16;n++){assert.equal(env.part(n,'servo-fn').disabled,true,`row ${n} locked`);assert.equal(env.revInput(n).disabled,true);assert.ok(env.part(n,'servo-rev').classList.contains('off'));}
 assert.equal(env.part(1,'servo-fn').value,'4','locked rows still show the controller values');
 /* a stray event must not reach the controller */
 await choose(env,1,19);
 assert.equal(env.api.writes.length,0);
 assert.equal(env.part(1,'servo-fn').value,'4');
 assert.match(env.part(1,'servo-note').textContent,/^⚠ Подключи USB/);
 await toggle(env,2,false);
 assert.equal(env.api.writes.length,0);
 assert.equal(env.revInput(2).checked,true);
 env.api.allowed=true;env.render();
 assert.equal(env.part(1,'servo-fn').disabled,false,'writable again after DISARMED link is back');
}
async function testNoParallelWrites(){
 const env=makeEnv();
 env.api.hold=true;
 const first=env.part(1,'servo-fn');first.value='19';first.dispatch('change');await settle();
 /* a stray second event while the first write is open is refused, not sent in parallel */
 const second=env.part(2,'servo-fn');second.value='21';second.dispatch('change');await settle();
 assert.equal(env.api.writes.length,1,'the second attempt never reaches the controller');
 assert.equal(env.api.maxActive,1,'never two PARAM_SET transactions at once');
 assert.equal(env.part(2,'servo-fn').value,'19','the refused change is rolled back');
 assert.match(env.part(2,'servo-note').textContent,/^⚠ Другая операция выполняется/);
 const input=env.revInput(3);input.checked=true;input.dispatch('change');await settle();
 assert.equal(env.api.writes.length,1);assert.equal(env.revInput(3).checked,false);
 env.api.releaseNext();await settle();
 assert.equal(env.params.get('SERVO1_FUNCTION').value,19);
 assert.equal(env.params.get('SERVO2_FUNCTION').value,19);
 assert.equal(env.part(2,'servo-fn').disabled,false,'the table is writable again after the echo');
}
async function testDisconnectClearsRestartNote(){
 const env=makeEnv();
 await choose(env,1,19);
 assert.equal(env.document.getElementById('servoRebootNote').hidden,false);
 env.api.connected=false;env.render();
 assert.equal(env.document.getElementById('servoRebootNote').hidden,true,'after the link drops the controller is restarting');
 assert.equal(env.part(1,'servo-fn').disabled,true);
}

/* ---------- languages ---------- */
function testLanguages(){
 for(const [lang,labels,group] of [['uk',['Вихід','Позиція','Реверс','Функція','MIN · TRIM · MAX',''],'Основні'],['en',['Output','Position','Reverse','Function','MIN · TRIM · MAX',''],'Main']]){
  const env=makeEnv(lang);
  const grid=env.document.getElementById('servoGrid');
  assert.deepEqual(grid.children[0].children.map(cell=>cell.textContent),labels,lang);
  assert.equal(byTag(env.rows()[0],'SELECT').children.find(child=>child.tagName==='OPTGROUP').label,group,lang);
  assert.equal(byClass(env.rows()[0],'servo-setup').textContent,{uk:'Налаштувати',en:'Setup'}[lang]);
  assert.equal(env.part(1,'servo-fn').value,'4');assert.equal(env.part(4,'servo-fn').options().find(option=>option.value==='999').textContent.includes({uk:'нестандартна',en:'custom'}[lang]),true);
 }
 /* switching the language rebuilds the rows without losing the values */
 const env=makeEnv('ru');
 env.lang='en';env.window.dispatchEvent({type:'atlas:language'});
 assert.equal(env.document.getElementById('servoGrid').children[0].children[1].textContent,'Position');
 assert.equal(env.part(1,'servo-fn').value,'4');assert.equal(env.revInput(2).checked,true);
 assert.equal(env.document.getElementById('servoGrid').children.length,17);
}

/* ---------- the dialog still works and uses the same list ---------- */
async function testDialog(){
 const env=makeEnv();
 const dialog=env.document.getElementById('servoDialog'),select=env.document.getElementById('servoEditFunction');
 assert.equal(select.tagName,'SELECT');assert.equal(select.options().length,149);
 env.part(2,'servo-setup').dispatch('click');
 assert.equal(dialog.shown,1);assert.equal(select.value,'19');
 assert.match(env.document.getElementById('servoEditorInfo').textContent,/SERVO2_FUNCTION = 19 \/ Elevator/);
 select.value='21';select.dispatch('input');
 assert.equal(env.document.getElementById('servoEditorSave').disabled,false,'a changed function can be written');
 assert.match(env.document.getElementById('servoEditorChanges').children.map(c=>c.textContent).join('|'),/SERVO2_FUNCTION: 19 → 21/);
 for(let n=1;n<=16;n++)assert.equal(env.part(n,'servo-fn').disabled,true,'rows wait while the dialog is open');
 env.document.getElementById('servoEditorForm').dispatch('submit');
 await settle();
 assert.deepEqual(env.api.writes,[{channel:2,updates:{FUNCTION:21}}]);
 assert.equal(env.params.get('SERVO2_FUNCTION').value,21);
 assert.match(env.document.getElementById('servoRebootNote').textContent,/SERVO2/,'the dialog path also asks for the restart');
 assert.equal(dialog.open,false);
 assert.equal(env.part(1,'servo-fn').disabled,false,'rows are back after the dialog');
 /* an unknown function is kept in the dialog */
 env.part(4,'servo-setup').dispatch('click');
 assert.equal(select.value,'999');
 assert.ok(select.options().some(option=>option.value==='999'&&!option.hidden));
}

/* ---------- page wiring ---------- */
function testWiring(){
 const html=read('configurator.html'),css=read('css/configurator.css');
 assert.match(html,/<select id="servoEditFunction"><\/select>/);
 assert.doesNotMatch(html,/servoFunctionChoices|<datalist/,'the dialog uses the shared function list, not a short datalist');
 assert.match(html,/id="servoRebootNote"[^>]*hidden/);
 assert.match(html,/<div class="servo-grid" id="servoGrid"><\/div>/);
 assert.match(html,/css\/configurator\.css\?v=2-2-servo-menu/);
 assert.match(html,/servo-config-core\.js\?v=2-2-servo-menu/);assert.match(html,/calibration\.js\?v=2-2-servo-menu/);
 for(const cls of ['servo-row','servo-head','servo-num','servo-pos','servo-pwm','servo-rev','servo-fn','servo-lim','servo-setup','servo-note','servo-reboot-note'])assert.ok(css.includes('.'+cls),'css for .'+cls);
 assert.doesNotMatch(css,/servo-channel|servo-reverse-tag|\.servo-params/,'old card styles are gone');
 assert.match(css,/\.servo-row\.servo-head\{display:none\}/,'narrow screens drop the header row');
 assert.doesNotMatch(source,/servo-channel|servoFunctions\b|REV ON/,'old card code is gone');
 assert.match(source,/enqueueServoWrite\(\(\)=>api\.writeServoConfig\(channel,\{\[field\]:value\}\)\)/,'the row writes through the one serial queue');
 assert.match(source,/Controller did not confirm/,'success needs the echoed value');
 const coreSource=read('js/configurator/servo-config-core.js');
 assert.match(coreSource,/field==='FUNCTION'\?-1:800/,'GPIO (-1) is allowed as a function');
}

(async()=>{
 testFunctionList();
 testTableBuilt();
 testRowsShowParameters();
 testMissingParameters();
 await testFunctionChange();
 await testReverseToggle();
 await testFailureReverts();
 await testLockedWhenNotAllowed();
 await testNoParallelWrites();
 await testDisconnectClearsRestartNote();
 testLanguages();
 await testDialog();
 testWiring();
 console.log('PASS: servo outputs — the 4.7.3 function list in six groups with GPIO, one table row per output with the function list and the reverse switch, writes through the serial queue proved only by the controller echo, rollback on failure, locked without a DISARMED link, restart note, three languages, dialog on the same list, page wiring.');
})().catch(error=>{console.error(error);process.exitCode=1;});
