'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),d=JSON.parse(read('data/sitl/atlas-22-control.json'));
assert.equal(d.schema,1);assert.equal(d.release,'2.2');assert.equal(d.control_seconds,2700);assert.equal(d.simulation_only,true);assert.equal(d.wind_mps,0);
assert.ok(Math.abs(d.home.lat-48.35722222)<1e-6&&Math.abs(d.home.lon-35.10055556)<1e-6);
assert.equal(d.columns.length,27);assert.equal(new Set(d.columns).size,27);
assert.match(d.binary.sha256,/^[0-9a-f]{64}$/);assert.ok(d.binary.controller_files_verified>2000);
let samples=0;
for(const [key,f] of Object.entries(d.flights)){
 const m=f.metrics;assert.equal(f.status,'completed');assert.match(f.log_sha256,/^[0-9a-f]{64}$/);assert.ok(f.capture_bytes>1e6);
 assert.equal(m.control_seconds,2700);assert.ok(m.log_seconds>m.first_release+2700);assert.equal(m.wind_mps,0);
 assert.equal(m.gps_fix_3d_samples_after_release,0,'no satellites after the catapult release');assert.ok(m.gps_fix_3d_samples_before_release>0,'the station GPS was really present on the ground');
 assert.equal(f.params.AHRS_EKF_TYPE,key==='ekf3'?3:0);assert.equal(f.params.EK3_MAV_POS,1);assert.equal(f.params.EK3_MAV_HGT,1);assert.equal(m.unexpected_primary_samples,0);
 assert.ok(m.aerobatic_height_range[0]>=500&&m.aerobatic_height_range[1]<=700,'aerobatic height corridor');
 assert.equal(m.false_ground_holds_before_touchdown,0);assert.equal(m.rearmed_pitot_launch_latch_max,0);
 assert.equal(m.disarm_checks.length,2);for(const c of m.disarm_checks){assert.equal(c.launch_latch_after,0);assert.deepEqual(c.ahrs_values,[key==='ekf3'?3:0]);assert.ok(c.time_s+m.first_release+1.5<=m.log_seconds);}
 assert.equal(m.ground.length,2);assert.ok(m.ground.every(x=>x.stop_confirmed&&x.hold_delay_s>=0&&Number.isFinite(x.after_stop_position_drift_m)));
 for(const n of [0,1,2,4,5,6,7,10,11,12,13,15])assert.ok(m.modes_executed.includes(n),'recorded requested mode '+n);assert.ok(!m.modes_executed.includes(8),'no AUTOTUNE');
 assert.equal(m.boosts.length,2);for(const b of m.boosts){assert.ok(b.true_gspd_peak_kmh>=420);for(const n of ['true_gspd_kmh','true_tas_kmh','pitot_tas_kmh','estimated_gspd_kmh'])assert.ok(Number.isFinite(b[n])&&b[n]>0);assert.ok(b.true_tas_kmh>=b.true_gspd_kmh);}
 assert.ok(m.visual_rescues.length>0,'report keeps actual interventions visible');
 const names=f.phases.map(p=>p.name);
 for(const n of ['heavy1_ailerons','heavy1_rudder','heavy3_roll_reversal_1','heavy3_roll_reversal_-1','heavy3_pitch_pulses','heavy3_inverted_pass','heavy3_sustained_turn','native_fbwb','native_loiter','native_guided','native_stabilize','native_manual','native_cruise','native_auto','native_rtl','native_circle','operator_in_flight','station_origin_home','station_map_drag_1','station_map_drag_2','station_button','boost_420_order_active'])assert.ok(names.includes(n),'phase '+n);
 assert.ok(names.some(n=>/^heavy1_barrel_-?1_/.test(n))&&names.some(n=>/spin_like/.test(n)));
 const op=m.operator;assert.ok(op.button_refused_texts.length>0&&/rejected/.test(op.button_refused_texts[0]),'the button in flight is refused with a message');
 assert.ok(op.button_time_s>=2700&&op.drag_time_s>op.button_time_s&&op.drag_human_error_m>0&&op.drag_human_error_m<60);
 if(key==='ekf3')assert.ok(op.position_error_after_m<op.position_error_before_m,'the map drag brings the EKF3 position back');
 else assert.ok(Math.abs(op.position_error_after_m-op.position_error_before_m)<50,'the drag is not applied to the DCM position');
 assert.ok(Math.abs(m.station.rel_after_arm)<1.5,key+': height above HOME after ARM');assert.ok(Math.abs(m.station.rel_min)<1.5&&Math.abs(m.station.rel_max)<1.5,key+': height above HOME stays near zero during the preparation');
 assert.ok(f.row_files.length>1);let previous=-Infinity,first=0,last=0,firstRow=true;
 for(const path of f.row_files){assert.match(path,/^data\/sitl\/atlas-22-(ekf3|dcm)-\d+\.json$/);const rows=JSON.parse(read(path));assert.ok(rows.length>0&&rows.length<=350);for(const r of rows){assert.equal(r.length,d.columns.length);assert.ok(r.every(Number.isFinite));assert.ok(r[0]>previous,'strictly ordered replay samples');if(firstRow){first=r[0];firstRow=false;}previous=r[0];last=r[0];samples++;}}
 assert.ok(first<-60&&first>-400,'the replay starts with the station preparation');assert.ok(last>=2700&&last>=Math.max(...m.disarm_checks.map(x=>x.time_s))+1.5);
 assert.ok(Number.isFinite(m.tilt.rms)&&Number.isFinite(m.position.maximum)&&Number.isFinite(m.height_error_m.rms));
}
// the same station routine on the 2.1 and 2.2 builds
for(const k of ['v21','v22']){const g=d.ground[k];assert.deepEqual(g.columns,['t','n','e','err','rel','abs','home_alt','gps_fix']);assert.ok(g.rows.length>200);let t=-Infinity;for(const r of g.rows){assert.equal(r.length,8);assert.ok(r.every(Number.isFinite));assert.ok(r[0]>t);t=r[0];}assert.match(g.binary_sha256,/^[0-9a-f]{64}$/);for(const n of ['station_home','arm','station_drag','station_button_start','station_button_end','station_gps_window_1_start','station_gps_window_2_end'])assert.ok(g.marks.some(m=>m.name===n),k+' '+n);}
assert.equal(d.ground.v22.binary_sha256,d.binary.sha256);assert.notEqual(d.ground.v21.binary_sha256,d.binary.sha256);
const A=d.ground.v21.summary,B=d.ground.v22.summary;
assert.ok(Math.abs(B.rel_in_gps_window_1)<1.5&&Math.abs(B.rel_in_gps_window_2)<1.5&&Math.abs(B.rel_after_arm)<1.5&&Math.abs(B.rel_min)<1.5&&Math.abs(B.rel_max)<1.5,'2.2: height above HOME stays near zero');
assert.ok(Math.abs(B.home_alt_after_gps_window_1-d.home.alt)<1&&Math.abs(B.home_alt_after_arm-d.home.alt)<1,'2.2: HOME does not move');
assert.ok(B.drag_ack.length===2&&B.drag_ack.every(x=>x===0)&&B.drag_error_max.every(x=>x>50&&x<200),'2.2: the map drag is accepted');
assert.equal(B.button_corrections,1);assert.ok(B.button_error_before>50&&B.button_error_after<2,'2.2: one correction brings the position back');
assert.ok(A.rel_in_gps_window_1<-10,'2.1 control: the station GPS shifts the height above HOME');assert.ok(A.home_alt_after_gps_window_1-d.home.alt>10,'2.1 control: HOME takes the GPS height');
assert.ok(A.rel_after_arm<-100,'2.1 control: the height after ARM is wrong');assert.ok(A.drag_ack.length===2&&A.drag_ack.every(x=>x!==0),'2.1 control: the map drag is refused in NoAID');assert.equal(A.button_corrections,0);
// the same programme on the 2.1 build
for(const k of ['ekf3','dcm']){const b=d.baseline21[k];assert.match(b.log_sha256,/^[0-9a-f]{64}$/);assert.equal(b.unexpected_primary_samples,0);assert.ok(Number.isFinite(b.tilt.rms)&&Number.isFinite(b.position.rms)&&Number.isFinite(b.height_error_m.rms));assert.ok(b.aerobatic_height_range[0]>=480&&b.aerobatic_height_range[1]<=720);}
for(const p of ['assets/sitl22/rms.png','assets/sitl22/ground.png','data/sitl/atlas-22-rms.csv','data/sitl/atlas-22-report.md','sitl-demo-22.html','css/control22.css','css/release22.css'])assert.ok(fs.statSync(p).size>100,p);
const report=read('data/sitl/atlas-22-report.md');for(const s of ['500–700','DISARM','EAS/TAS','GSPD','визуального пилота','EK3_MAV_POS','EK3_MAV_HGT','без спутников'])assert.ok(report.includes(s),'report mentions '+s);
new vm.Script(read('js/site/control22.js'));
const page=read('sitl-demo-22.html');for(const id of ['ground','gRel','gErr','gHome','groundRows','groundMsgs','panels','range','prepOption','operator','compare','boosts','metrics','notes','method','events','scrub','phase','play'])assert.ok(page.includes('id="'+id+'"'),'page element '+id);
assert.ok(page.includes('js/site/control22.js')&&page.includes('css/control22.css')&&page.includes('css/control21.css'));
const log=read('js/site/changelog.js'),html=read('changelog.html');assert.ok(log.includes("demo.href='sitl-demo-22.html'"));assert.ok(html.includes('id="chSitl22"')&&html.includes('href="sitl-demo-22.html"')&&html.includes('css/release22.css'));
assert.ok(html.indexOf('ch22-banner')<html.indexOf('ch-legacy-intro')&&html.indexOf('ch-legacy-intro')<html.indexOf('ch21-banner'),'2.2 banner is the newest, 2.1 moved into the earlier demonstrations');
// public wording: nothing marked as generated, no credentials or private paths
const texts=[report,read('js/site/control22.js'),page].join('\n');
assert.ok(!/generated|сгенерир|згенерова/i.test(report),'no "generated" wording in the report');
assert.ok(!/[A-Za-z]:\\|\\\\wsl|\/home\/ardun|\/mnt\/[cd]\/|ArduPilot\\|Codex/i.test(texts),'no private paths or tool names in public files');
console.log('PASS: 2.2 showcase - station routine on the 2.1 and 2.2 builds, two native 45-minute flights without satellites, all modes and heavy piloting, operator in flight, finite replay chunks and downloadable report ('+samples+' frames).');
