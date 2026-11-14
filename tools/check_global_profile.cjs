/* EKF3 G.L.O.B.A.L. activation profile: the validated parameter set, status/diff logic, the card in the configurator and the metadata of the new options. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../js/configurator/global-profile-core.js');
const read=p=>fs.readFileSync(p,'utf8');
const P=(obj)=>new Map(Object.entries(obj).map(([k,v])=>[k,{value:v,type:9}]));
const full=Object.fromEntries(core.PROFILE.map(([k,v])=>[k,v]));

// the profile is exactly the EKF3 block of atlas.param shipped with the 2.0 firmware (flown in the one-hour SITL test)
assert.deepEqual(Object.fromEntries(core.PROFILE),{
 AHRS_EKF_TYPE:3,AHRS_GPS_USE:1,EK3_NOAID_AUTO:1,EK3_NOAID_POS:1,EK3_NOAID_GPS:1,EK3_NOAID_M_NSE:5,
 EK3_SRC1_POSXY:0,EK3_SRC1_POSZ:1,EK3_SRC1_VELXY:0,EK3_SRC1_VELZ:0,EK3_SRC1_YAW:1,
 EK3_SRC2_POSXY:3,EK3_SRC2_POSZ:1,EK3_SRC2_VELXY:3,EK3_SRC2_VELZ:3,EK3_SRC2_YAW:1});
// the firmware requires the GPS set to use GPS for the horizontal position and the same yaw source as the NoAID set
assert.equal(full.EK3_SRC2_POSXY,3);assert.equal(full.EK3_SRC2_YAW,full.EK3_SRC1_YAW);assert.equal(full.EK3_SRC1_POSXY,0);assert.equal(full.EK3_SRC1_VELXY,0);
// every value passes its own range check; the three options come last so an interrupted write never leaves NOAID_AUTO on without a GPS set
for(const [name,value] of core.PROFILE)assert.ok(core.valid(name,value),name);
assert.deepEqual(core.PROFILE.slice(-3).map(x=>x[0]),['EK3_NOAID_POS','EK3_NOAID_GPS','EK3_NOAID_AUTO']);
// anything outside the whitelist or the ranges is refused
for(const [name,value] of [['EK3_NOAID_POS',2],['EK3_NOAID_AUTO',-1],['EK3_SRC2_POSXY',7],['AHRS_EKF_TYPE',4],['EK3_NOAID_POS',0.5],['SERVO1_FUNCTION',1],['ARMING_RUDDER',2],['EK3_NOAID_M_NSE',NaN],['EK3_NOAID_M_NSE',60]])assert.equal(core.valid(name,value),false,name+'='+value);
assert.ok(core.valid('EK3_NOAID_M_NSE',7.5));
// status: older firmware, everything in place, options off, anything else
assert.equal(core.status(P({AHRS_EKF_TYPE:3})).state,'unsupported');
assert.equal(core.status(P(full)).state,'active');assert.equal(core.status(P(full)).changes.length,0);
const off={...full,EK3_NOAID_POS:0,EK3_NOAID_GPS:0,EK3_NOAID_AUTO:0};
assert.equal(core.status(P(off)).state,'off');assert.deepEqual(core.status(P(off)).changes.map(x=>x.name).sort(),['EK3_NOAID_AUTO','EK3_NOAID_GPS','EK3_NOAID_POS']);
const partial={...full,EK3_SRC2_POSXY:0};
assert.equal(core.status(P(partial)).state,'partial');assert.deepEqual(core.status(P(partial)).changes,[{name:'EK3_SRC2_POSXY',current:0,target:3}]);
assert.equal(core.status(P({...full,EK3_NOAID_AUTO:0})).state,'partial');
// updates: the profile writes only what differs, in the safe order; "off" touches nothing but the three options (AUTO first)
assert.deepEqual(Object.keys(core.applyUpdates(P(off))),['EK3_NOAID_POS','EK3_NOAID_GPS','EK3_NOAID_AUTO']);
assert.deepEqual(core.applyUpdates(P(full)),{});
assert.deepEqual(core.disableUpdates(),{EK3_NOAID_AUTO:0,EK3_NOAID_GPS:0,EK3_NOAID_POS:0});
// a board that lacks some of the parameters is only diffed on the ones it has
assert.equal(core.diff(P({...full,EK3_SRC2_YAW:undefined})).some(x=>x.name==='EK3_SRC2_YAW'),true);

// wiring: the core loads before configurator.js, the card after the O.R.D.E.R. card, the API call exists and re-validates every value
const html=read('configurator.html'),cfg=read('js/configurator/configurator.js'),ui=read('js/configurator/global-profile-ui.js');
const scripts=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
const at=n=>scripts.indexOf('js/configurator/'+n);
assert.ok(at('global-profile-core.js')>=0&&at('global-profile-core.js')<at('configurator.js'),'core must load before configurator.js');
assert.ok(at('global-profile-ui.js')>at('capri-ui.js')&&at('capri-ui.js')>at('configurator.js'),'the card must load after the O.R.D.E.R. card');
assert.match(cfg,/writeGlobalProfile:async/);assert.match(cfg,/core\.valid\(name,value\)/);assert.match(cfg,/!canWrite\(\)/);assert.match(cfg,/writeParameterWithAck\(change\.name,change\.value,change\.type\)/);
assert.match(ui,/order\.after\(card\)/);assert.match(ui,/window\.confirm/);assert.match(ui,/api\.writeGlobalProfile/);
for(const lang of ['ru','uk','en'])assert.ok(new RegExp(`\\b${lang}:\\{title:`).test(ui),'card words in '+lang);
// the card says what really changes in flight and compares with the DCM without satellites; the numbers are the ones of the SITL dataset
const data=JSON.parse(read('data/sitl/atlas-global-hour.json')).metrics,r1=x=>Math.round(x*10)/10;
const cmp=ui.match(/const CMP=Object\.freeze\(\{([^}]*)\}\)/)[1];
const expected={tiltNoGps:[r1(data.ekf3.tilt_rms_nogps),r1(data.dcm.tilt_rms_nogps)],tiltAero:[r1(data.ekf3.tilt_rms_aero),r1(data.dcm.tilt_rms_aero)],posMed:[Math.round(data.ekf3.pos_med_nogps),Math.round(data.dcm.pos_med_nogps)],posMax:[Math.round(data.ekf3.pos_max_nogps),Math.round(data.dcm.pos_max_nogps)]};
for(const [key,[a,b]] of Object.entries(expected))assert.ok(cmp.includes(`${key}:[${a},${b}]`),`CMP ${key} must be [${a},${b}] as in the SITL dataset`);
for(const key of ['flightTitle','cmpTitle','cmpHead','cmpRows','cmpNote','cmpLink','paramsTitle','flight'])assert.equal((ui.match(new RegExp(`\\b${key}:`,'g'))||[]).length,3,key+' in ru, uk and en');
for(const lang of ['ru','uk','en']){
 const block=ui.slice(ui.indexOf(`\n ${lang}:{title:`),ui.indexOf(`\n ${lang==='ru'?'uk':lang==='uk'?'en':'};'}`,ui.indexOf(`\n ${lang}:{title:`)+5));
 assert.equal((block.match(/flight:\[('[^']*'(?:,'[^']*'){3})\]/)||[]).length,2,lang+': four flight statements');
 assert.equal((block.match(/cmpRows:\[('[^']*'(?:,'[^']*'){3})\]/)||[]).length,2,lang+': four comparison rows');
}
assert.ok(!/generated|сгенерир|згенерова/i.test(ui),'no "generated" wording in the card');
for(const key of ['global-flight','global-cmp-row','global-cmp-note'])assert.ok(read('css/capri.css').includes('.'+key),'style '+key);
assert.match(ui,/globalCmpLink[^;]*sitl-demo-global\.html|href="sitl-demo-global\.html"/);
assert.match(ui,/<details class="global-details" open>/,'the explanation is open by default');
// metadata of the new options is in the configurator's parameter table
const meta=JSON.parse(read('data/param-metadata.json')).parameters;
for(const name of ['EK3_NOAID_POS','EK3_NOAID_GPS','EK3_NOAID_AUTO','EK3_NOAID_M_NSE']){assert.ok(meta[name]&&meta[name].DisplayName&&meta[name].Description,'metadata for '+name);}
assert.deepEqual(Object.keys(meta.EK3_NOAID_AUTO.Values),['0','1']);
console.log('PASS: EKF3 G.L.O.B.A.L. profile, status/diff logic, configurator card and parameter metadata.');
