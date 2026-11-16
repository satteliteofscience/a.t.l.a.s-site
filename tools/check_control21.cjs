'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),d=JSON.parse(read('data/sitl/atlas-21-control.json'));
assert.equal(d.schema,1);assert.equal(d.release,'2.1');assert.equal(d.control_seconds,2700);assert.equal(d.simulation_only,true);assert.equal(d.wind_mps,0);
assert.ok(Math.abs(d.home.lat-48.35722222)<1e-6&&Math.abs(d.home.lon-35.10055556)<1e-6);
assert.equal(d.columns.length,27);assert.equal(new Set(d.columns).size,27);
assert.match(d.binary.sha256,/^[0-9a-f]{64}$/);assert.ok(d.binary.controller_files_verified>2000);
let samples=0;
for(const [key,f] of Object.entries(d.flights)){
 const m=f.metrics;assert.equal(f.status,'completed');assert.match(f.log_sha256,/^[0-9a-f]{64}$/);assert.ok(f.capture_bytes>1e6);
 assert.equal(m.control_seconds,2700);assert.ok(m.log_seconds>m.first_release+2700);assert.equal(m.wind_mps,0);assert.equal(m.gps_fix_3d_samples_after_release,0);
 assert.equal(f.params.AHRS_EKF_TYPE,key==='ekf3'?3:0);assert.equal(m.unexpected_primary_samples,0);
 assert.ok(m.aerobatic_height_range[0]>=500&&m.aerobatic_height_range[1]<=700,'aerobatic height corridor');
 assert.equal(m.false_ground_holds_before_touchdown,0);assert.equal(m.rearmed_pitot_launch_latch_max,0);
 assert.equal(m.disarm_checks.length,2);for(const c of m.disarm_checks){assert.equal(c.launch_latch_after,0);assert.deepEqual(c.ahrs_values,[key==='ekf3'?3:0]);assert.ok(c.time_s+m.first_release+1.5<=m.dataflash_coverage_s[1]);}
 assert.equal(m.ground.length,2);assert.ok(m.ground.every(x=>x.stop_confirmed&&x.hold_delay_s>=0&&Number.isFinite(x.drift_after_hold_m)));
 for(const n of [0,1,2,4,5,7,10,11,13])assert.ok(m.modes_executed.includes(n),'recorded requested mode '+n);assert.ok(!m.modes_executed.includes(8),'no AUTOTUNE');
 assert.equal(m.boosts.length,2);for(const b of m.boosts){assert.ok(b.true_gspd_peak_kmh>=420);for(const n of ['true_gspd_kmh','true_tas_kmh','pitot_tas_kmh','estimated_gspd_kmh'])assert.ok(Number.isFinite(b[n])&&b[n]>0);assert.ok(b.true_tas_kmh>=b.true_gspd_kmh);}
 assert.ok(m.visual_rescues.length>0,'report keeps actual interventions visible');
 assert.ok(f.row_files.length>1);let previous=-Infinity,first=0,last=0;
 for(const path of f.row_files){assert.match(path,/^data\/sitl\/atlas-21-(ekf3|dcm)-\d+\.json$/);const rows=JSON.parse(read(path));assert.ok(rows.length>0&&rows.length<=350);for(const r of rows){assert.equal(r.length,d.columns.length);assert.ok(r.every(Number.isFinite));assert.ok(r[0]>previous,'strictly ordered replay samples');if(!samples)first=r[0];previous=r[0];last=r[0];samples++;}}
 assert.ok(last>=2700&&last>=Math.max(...m.disarm_checks.map(x=>x.time_s))+1.5);
 assert.ok(Number.isFinite(m.tilt.rms)&&Number.isFinite(m.position.maximum));
}
for(const p of ['assets/sitl21/rms.png','data/sitl/atlas-21-rms.csv','data/sitl/atlas-21-report.md','sitl-demo-21.html','css/control21.css','css/release21.css'])assert.ok(fs.statSync(p).size>100,p);
const report=read('data/sitl/atlas-21-report.md');for(const s of ['500–700','DISARM','EAS/TAS','GSPD','визуального пилота'])assert.ok(report.includes(s));
new vm.Script(read('js/site/control21.js'));
const log=read('js/site/changelog.js');assert.ok(log.includes("demo.href='sitl-demo-21.html'"));
console.log('PASS: two native 45-minute recordings, full landing/disarm coverage, GPS off, 500–700 m aerobatics, >420 km/h boosts, finite replay chunks and downloadable measured report ('+samples+' frames).');
