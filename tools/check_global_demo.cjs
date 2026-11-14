/* Update 2.0 (EKF3 NoAID G.L.O.B.A.L.): the 2.0 changelog release, the banner on the changelog page, the one-hour EKF3 / DCM replay page and its recorded data. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
// changelog release 2.0: three languages for every item, ids, sources
const window={};vm.runInNewContext(read('data/changelog/2.0.js'),{window});
const r=window.AtlasRelease20;
assert.equal(r.version,'2.0');assert.equal(r.id,'release-2-0');
assert.ok(r.changes.length>=10,'2.0 changelog needs the full list of changes');
for(const item of r.changes)for(const lang of ['ru','uk','en']){assert.equal(item[lang].length,3,'every item needs title, base and new text ('+lang+')');assert.ok(item[lang].every(x=>x&&x.length>10),'empty text in '+lang+': '+item.ru[0]);}
for(const lang of ['ru','uk','en']){assert.ok(r.hint[lang]&&r.baseLabel[lang]&&r.modLabel[lang]&&r.sourceLabel[lang]);}
for(const name of ['EK3_NOAID_POS','EK3_NOAID_GPS','EK3_NOAID_AUTO'])assert.ok(JSON.stringify(r.changes).includes(name),'2.0 changelog must describe '+name);
// changelog page: banner, scripts in order, renderer knows release 2.0 first
const html=read('changelog.html'),log=read('js/site/changelog.js');
assert.match(html,/id="chGlobalTitle"[^>]*>A\.T\.L\.A\.S EKF3 NoAID G\.L\.O\.B\.A\.L\./,'2.0 banner title missing');
assert.match(html,/id="chSitlGlobal"[^>]*href="sitl-demo-global\.html"|href="sitl-demo-global\.html"[^>]*id="chSitlGlobal"|id="chSitlGlobal" class="ch-sitl-demo" href="sitl-demo-global\.html"/,'2.0 demo button missing');
const scripts=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
assert.ok(scripts.indexOf('data/changelog/2.0.js')>=0&&scripts.indexOf('data/changelog/2.0.js')<scripts.indexOf('js/site/changelog.js'),'2.0.js must load before the renderer');
assert.match(log,/const releases=\[window\.AtlasRelease20,window\.AtlasRelease12,/,'release 2.0 must be the first release');
for(const text of ['ОБНОВЛЕНИЕ 2.0','ОНОВЛЕННЯ 2.0','UPDATE 2.0','Часовой полёт SITL на модели 7,2 кг: EKF3 NoAID G.L.O.B.A.L. и DCM','Годинний політ SITL на моделі 7,2 кг: EKF3 NoAID G.L.O.B.A.L. і DCM','One-hour SITL flight on the 7.2 kg model: EKF3 NoAID G.L.O.B.A.L. and DCM','Release 2.0'])assert.ok(log.includes(text),'changelog text missing: '+text);
assert.match(log,/release-\(1-\[012\]\|2-0\)/,'#release-2-0 must open its section');
// replay page wiring
const page=read('sitl-demo-global.html'),js=read('js/site/global-demo.js');
assert.match(page,/data-src="data\/sitl\/atlas-global-hour\.json"/);assert.match(page,/<script src="js\/site\/global-demo\.js(\?[^"]*)?" defer>/);assert.match(page,/href="css\/global-demo\.css(\?[^"]*)?"/);
const idsUsed=[...new Set([...js.matchAll(/\$\('([A-Za-z]+)'\)/g)].map(m=>m[1]))];
for(const id of idsUsed)assert.ok(page.includes(`id="${id}"`),'sitl-demo-global.html lacks #'+id);
for(const lang of ['ru','uk','en'])assert.ok(page.includes(`data-language="${lang}"`));
const count=(text,re)=>(text.match(re)||[]).length;
for(const key of ['title','loading','failed','play','pause','legend','posTitle','tiltTitle','metricsTitle','eventsTitle','reportTitle','limits','scope','report','mapEkf','mapDcm','m_tilt','m_snap','m_lev_n','m_lev_t','m_lev_err','m_lev_est','e_gps_on','e_lvl','paramsTitle','params','fullTitle','fullLegend','fullInfo','viewLabel','viewAll','viewFollow','truthPos','ahrsPos','homeName','s_aero','s_landing'])assert.equal(count(js,new RegExp('[ ,{]'+key+':','g')),3,'text must exist in ru, uk and en: '+key);
for(const text of ['EKF3 NoAID G.L.O.B.A.L.'])assert.ok(js.includes(text));
// the position map is a satellite photo of the Dnipro airport area (Esri World Imagery) with a grid fallback; the pilot's levelling is not called ACRO on the page
assert.ok(js.includes('World_Imagery/MapServer/tile/')&&js.includes('Esri, Maxar, Earthstar Geographics'),'satellite map layer and its credit missing');
assert.ok(!/ACRO/.test(js),'the page must say levelling, not ACRO');
// the full flight track (truth, AHRS, GPS-off stretches, error at every GPS return) is drawn for both flights on the shared map base
assert.ok(js.includes('function drawFull(')&&js.includes('function baseMap(')&&/drawFull\('fullEkf','ekf3'\)/.test(js)&&/drawFull\('fullDcm','dcm'\)/.test(js),'full-track maps missing');
for(const id of ['fullEkf','fullDcm','fullEkfInfo','fullDcmInfo','fullLegend','fullTitle'])assert.ok(page.includes(`id="${id}"`),'#'+id);
assert.ok(page.includes('id="mapView"')&&page.includes('id="mapEkfCoords"')&&page.includes('id="mapDcmCoords"'));
// recorded data
const d=JSON.parse(read('data/sitl/atlas-global-hour.json'));
assert.equal(d.columns.length,21);assert.ok(d.hz>0&&d.end>3000,'about one hour expected');
for(const f of ['ekf3','dcm']){
 const F=d.flights[f];assert.ok(F.rows.length>d.end*d.hz*0.95,f+': rows missing');let last=-1;
 for(const row of F.rows){assert.equal(row.length,21);assert.ok(row[0]>last);last=row[0];for(const i of [0,1,2,3,4,5,6,7,8,9,10,11,12,17,18,19,20])assert.ok(Number.isFinite(row[i]),f+': non-finite column '+i);}
 assert.ok(Array.isArray(F.messages)&&Array.isArray(F.events)&&Array.isArray(F.wind)&&F.wind.length,f+': events, messages and wind needed');
 assert.ok(d.segments[f].length>=5,f+': programme segments missing');
}
assert.ok(d.flights.ekf3.rows.some(r=>r[13]!==null),'the EKF3 flight needs the GPS marker (AHRS2) positions');
assert.ok(d.gps_on.length>=3&&d.route.length>=4);
// the test passport shown at the top of the page comes from the recorded run: parameters of both flights, what differs between them, model, wind, programme
const S=d.setup;assert.ok(S&&S.seed&&S.binary&&S.speedup>0&&S.rate>0,'setup: seed, build, speed-up and loop rate needed');
assert.deepEqual(S.differs,['AHRS_EKF_TYPE','EK3_NOAID_AUTO','EK3_NOAID_GPS','EK3_NOAID_POS'],'the two flights may differ only in the estimator and the NOAID options');
for(const k of ['AHRS_EKF_TYPE','EK3_NOAID_POS','EK3_NOAID_GPS','EK3_NOAID_AUTO','EK3_SRC1_POSXY','EK3_SRC1_YAW','EK3_SRC2_POSXY','EK3_SRC2_VELXY','EK3_SRC2_YAW'])for(const f of ['ekf3','dcm'])assert.ok(Number.isFinite(S.params[f][k]),'setup parameter '+f+'.'+k);
assert.equal(S.params.ekf3.AHRS_EKF_TYPE,3);assert.equal(S.params.dcm.AHRS_EKF_TYPE,0);for(const k of ['EK3_NOAID_POS','EK3_NOAID_GPS','EK3_NOAID_AUTO']){assert.equal(S.params.ekf3[k],1);assert.equal(S.params.dcm[k],0);}
assert.ok(S.model.span>0&&S.model.area>0&&S.pilot.work_alt>0&&S.wind.length>=6&&S.gust.turb>0,'setup: model, pilot and wind needed');
// the start point is the Dnipro airport (UKDD), the EKF origin sits on it
assert.ok(Math.abs(d.home.lat-48.3572)<0.001&&Math.abs(d.home.lon-35.1006)<0.001,'home must be the Dnipro airport');
assert.ok(Math.abs(d.home.origin[0]-d.home.lat)<0.001&&Math.abs(d.home.origin[1]-d.home.lon)<0.001,'the EKF origin must be at home');
for(const f of ['ekf3','dcm']){const L=d.flights[f].levels;assert.ok(Array.isArray(L)&&L.length>=5,f+': levelling list missing');for(const l of L){assert.equal(l.length,6);assert.ok(Number.isFinite(l[0])&&Number.isFinite(l[3]));}
 assert.ok(!d.flights[f].events.some(e=>['rescue_begin','untrusted_wait'].includes(e[1])),f+': the raw rescue events must not be on the page');}
for(const k of ['tilt_rms','tilt_p95','tilt_max','tilt_rms_aero','tilt_rms_gps','tilt_rms_nogps','pos_med_gps','pos_med_nogps','pos_max_nogps'])for(const f of ['ekf3','dcm'])assert.ok(Number.isFinite(d.metrics[f][k]),'metric '+f+'.'+k);
console.log('PASS: update 2.0 changelog, banner, one-hour EKF3 / DCM replay page and its recorded data.');
