/* EKF3 G.L.O.B.A.L. activation profile: the validated parameter set, status/diff logic, the card in the configurator and the metadata of the new options. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../js/configurator/global-profile-core.js');
const read=p=>fs.readFileSync(p,'utf8');
const P=(obj)=>new Map(Object.entries(obj).map(([k,v])=>[k,{value:v,type:9}]));
const full=Object.fromEntries(core.PROFILE.map(([k,v])=>[k,v]));

// the profile is the EKF3 block of atlas.param shipped with the 2.0 firmware (flown in the one-hour SITL test) plus the two station-correction parameters of 2.2
assert.deepEqual(Object.fromEntries(core.PROFILE),{
 AHRS_EKF_TYPE:3,AHRS_GPS_USE:1,EK3_NOAID_AUTO:1,EK3_NOAID_POS:1,EK3_NOAID_GPS:1,EK3_NOAID_M_NSE:5,EK3_MAV_POS:1,EK3_MAV_HGT:1,
 EK3_SRC1_POSXY:0,EK3_SRC1_POSZ:1,EK3_SRC1_VELXY:0,EK3_SRC1_VELZ:0,EK3_SRC1_YAW:1,
 EK3_SRC2_POSXY:3,EK3_SRC2_POSZ:1,EK3_SRC2_VELXY:3,EK3_SRC2_VELZ:3,EK3_SRC2_YAW:1});
// the firmware requires the GPS set to use GPS for the horizontal position and the same yaw source as the NoAID set
assert.equal(full.EK3_SRC2_POSXY,3);assert.equal(full.EK3_SRC2_YAW,full.EK3_SRC1_YAW);assert.equal(full.EK3_SRC1_POSXY,0);assert.equal(full.EK3_SRC1_VELXY,0);
// every value passes its own range check; the three options come last so an interrupted write never leaves NOAID_AUTO on without a GPS set
for(const [name,value] of core.PROFILE)assert.ok(core.valid(name,value),name);
assert.deepEqual(core.PROFILE.slice(-3).map(x=>x[0]),['EK3_NOAID_POS','EK3_NOAID_GPS','EK3_NOAID_AUTO']);
// anything outside the whitelist or the ranges is refused
for(const [name,value] of [['EK3_NOAID_POS',2],['EK3_NOAID_AUTO',-1],['EK3_MAV_POS',2],['EK3_MAV_HGT',-1],['EK3_MAV_POS',0.5],['EK3_SRC2_POSXY',7],['AHRS_EKF_TYPE',4],['EK3_NOAID_POS',0.5],['SERVO1_FUNCTION',1],['ARMING_RUDDER',2],['EK3_NOAID_M_NSE',NaN],['EK3_NOAID_M_NSE',60]])assert.equal(core.valid(name,value),false,name+'='+value);
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
// firmware 2.2 adds the station correction: the two parameters sit before the three options, and boards without them (2.0, 2.1) keep working
assert.deepEqual(core.CORRECTION,['EK3_MAV_POS','EK3_MAV_HGT']);
const names=core.PROFILE.map(x=>x[0]);
for(const n of core.CORRECTION)assert.ok(names.indexOf(n)>=0&&names.indexOf(n)<names.indexOf('EK3_NOAID_POS'),n+' must be written before the options');
const legacy=Object.fromEntries(core.PROFILE.filter(([k])=>!core.CORRECTION.includes(k)));
assert.equal(core.status(P(legacy)).state,'active','a 2.0/2.1 board with the whole old profile is active');
assert.deepEqual(core.applyUpdates(P(legacy)),{});
assert.deepEqual(Object.keys(core.applyUpdates(P({...legacy,EK3_NOAID_POS:0,EK3_NOAID_GPS:0,EK3_NOAID_AUTO:0}))),['EK3_NOAID_POS','EK3_NOAID_GPS','EK3_NOAID_AUTO'],'the correction parameters are never written to a board that lacks them');
const fresh={...full,EK3_MAV_POS:0,EK3_MAV_HGT:0};
assert.equal(core.status(P(fresh)).state,'partial','a 2.2 board with the defaults of the two new parameters is partial');
assert.deepEqual(core.status(P(fresh)).changes.map(x=>x.name),['EK3_MAV_POS','EK3_MAV_HGT']);
assert.deepEqual(core.applyUpdates(P(fresh)),{EK3_MAV_POS:1,EK3_MAV_HGT:1});
const blank=Object.fromEntries(core.PROFILE.map(([k])=>[k,k==='EK3_SRC2_POSXY'?7:0]));
const writeOrder=Object.keys(core.applyUpdates(P(blank)));
assert.ok(writeOrder.indexOf('EK3_MAV_POS')<writeOrder.indexOf('EK3_NOAID_POS')&&writeOrder.indexOf('EK3_MAV_HGT')<writeOrder.indexOf('EK3_NOAID_POS'),'a full write puts the correction parameters before the options');
assert.deepEqual(writeOrder.slice(-3),['EK3_NOAID_POS','EK3_NOAID_GPS','EK3_NOAID_AUTO'],'the three options stay last');
// a board that lacks some of the parameters is only diffed on the ones it has
assert.equal(core.diff(P({...full,EK3_SRC2_YAW:undefined})).some(x=>x.name==='EK3_SRC2_YAW'),true);

// GPS arming skips are an explicit action that merges into the live mask.
assert.equal(core.GPS_SKIP_PARAM,'ARMING_SKIPCHK');
assert.equal(core.gpsSkipTarget(0),4104);
assert.equal(core.gpsSkipTarget(8),4104);
assert.equal(core.gpsSkipTarget((1<<19)|4),528396);
assert.equal(core.gpsSkipTarget(4108),4108);
assert.equal(core.gpsSkipTarget(-1),-1);
for(const invalid of [undefined,null,NaN,8.5,16777217,2147483648])assert.equal(core.gpsSkipTarget(invalid),null);
assert.equal(core.valid('ARMING_SKIPCHK',4096),false);
assert.deepEqual(core.applyUpdates(P({...full,ARMING_SKIPCHK:0})),{});

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
for(const key of ['flightTitle','cmpTitle','cmpHead','cmpRows','cmpNote','cmpLink','paramsTitle','flight','mavpos','mavhgt'])assert.equal((ui.match(new RegExp(`\\b${key}:`,'g'))||[]).length,3,key+' in ru, uk and en');
// the card lists the two correction parameters only on a board that has them, and the help text names them in every language
assert.ok(ui.includes('core.CORRECTION.filter(n=>params.has(n))'),'correction rows only where the parameters exist');
assert.equal((ui.match(/EK3_MAV_POS, EK3_MAV_HGT/g)||[]).length,3,'help text names the correction parameters in ru, uk and en');
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
for(const name of ['EK3_NOAID_POS','EK3_NOAID_GPS','EK3_NOAID_AUTO','EK3_NOAID_M_NSE','EK3_MAV_POS','EK3_MAV_HGT']){assert.ok(meta[name]&&meta[name].DisplayName&&meta[name].Description,'metadata for '+name);}
assert.deepEqual(Object.keys(meta.EK3_NOAID_AUTO.Values),['0','1']);
assert.deepEqual(Object.keys(meta.EK3_MAV_POS.Values),['0','1']);assert.deepEqual(Object.keys(meta.EK3_MAV_HGT.Values),['0','1']);
assert.ok(!/Altitude is not changed/.test(meta.EK3_NOAID_POS.Description),'EK3_NOAID_POS text follows the 2.2 behaviour: the altitude comes from the same EKF3 solution');
console.log('PASS: EKF3 G.L.O.B.A.L. profile, status/diff logic, configurator card and parameter metadata.');
