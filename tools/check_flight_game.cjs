/* Mini-game on the attitude card of the home page: the rules (flight-game-core.js) - the aircraft that follows the pointer, the plan that changes the flight modes
   (MANUAL, CRUISE, GUIDED, AUTO), pylons, other aircraft, the gun and the ULT, the five-minute mission and the AUTOLAND finale - the card layer (flight-game.js) in a
   stub DOM (hold the pointer for seven seconds to start, perspective, the aim ring, camera, tips), the hooks in the demo, the wiring on index.html and the texts in
   three languages. The card shows synthetic data only. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const core=require('../js/site/flight-game-core.js');
const C=core.CFG,M=core.MODES;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

// ---------------------------------------------------------------- the configuration
assert.ok(Object.isFrozen(C)&&Object.isFrozen(core)&&Object.isFrozen(M)&&Object.isFrozen(C.landing)&&Object.isFrozen(core.PLAN)&&core.PLAN.every(p=>Object.isFrozen(p)),'the configuration and the API are frozen');
assert.deepEqual(Object.keys(M).sort(),['AUTO','AUTOLAND','CRUISE','GUIDED','MANUAL'],'five modes in all, AUTOLAND is the finale');
assert.ok(!('setMode' in core)&&!('PICKABLE' in core),'the pilot does not pick the modes: the plan changes them');
for(const [name,m] of Object.entries(M))assert.ok(m.k>0&&m.lag>0&&m.score>0&&m.speed>0&&m.gust>=0&&typeof m.boost==='boolean','every mode has a pull, a lag and a price: '+name);
assert.ok(M.MANUAL.gust===1&&M.MANUAL.k>M.GUIDED.k&&M.MANUAL.lag<M.GUIDED.lag&&M.CRUISE.k<M.MANUAL.k,'MANUAL is the quick one, GUIDED the heavy one');
assert.ok(M.CRUISE.gust<.5&&M.GUIDED.gust<.5&&M.AUTO.gust<.5&&M.CRUISE.speed<1&&M.MANUAL.boost&&M.GUIDED.boost&&!M.CRUISE.boost&&!M.AUTO.boost&&!M.AUTOLAND.boost,'the autopilots take part of the wind, CRUISE is slow, the boost belongs to MANUAL and GUIDED');
assert.ok(M.AUTO.score<M.MANUAL.score&&M.GUIDED.score>M.MANUAL.score&&M.AUTO.ult>M.MANUAL.ult&&M.AUTOLAND.ult===0,'every mode has its price: AUTO pays less and charges the ULT faster, GUIDED pays more');
assert.deepEqual([...C.ranks],[...C.ranks].sort((a,b)=>a-b),'ranks go up');assert.equal(core.rankOf(0),0);assert.equal(core.rankOf(C.ranks[3]),3);assert.equal(core.rankOf(C.ranks[1]-1),0);
assert.equal(C.missionTime,300,'the final approach comes after five minutes');
for(let l=1;l<80;l++){
 assert.ok(core.speedMul(l)>=core.speedMul(Math.max(1,l-1))&&core.speedMul(l)<=C.maxSpeedMul,'speed grows and is capped');
 assert.ok(core.radiusOf(l)<=C.radius0&&core.radiusOf(l)>=C.radiusMin,'the ring shrinks to a floor');
 assert.ok(core.gustWait(l)>=C.gustMin&&core.gustPowerOf(l)<=C.gustPowerMax,'gusts stay bounded');
 assert.ok(core.obstacleChance(l)<=C.obstacleMax&&core.enemyGap(l)>=C.enemyMin,'pylons and enemies stay bounded');
 for(const name of ['MANUAL','CRUISE','GUIDED','AUTO'])for(const boosted of [false,true]){
  if(boosted&&!M[name].boost)continue;
  assert.ok(core.spacingOf(l)/(C.baseSpeed*core.speedMul(l)*M[name].speed*(1+C.boostSpeed*(boosted?1:0)))>=(boosted?1:1.4),'enough seconds between two gates at level '+l+' in '+name+(boosted?' with the boost':''));
 }
}

// ---------------------------------------------------------------- the plan of the mission changes the modes by itself
{
 assert.deepEqual(core.PLAN.map(p=>p.mode),['MANUAL','CRUISE','GUIDED','AUTO','MANUAL','CRUISE','GUIDED','AUTO'],'the four modes, twice, in this order');
 const total=core.PLAN.reduce((s,p)=>s+p.len,0);assert.ok(core.PLAN.every(p=>p.len>=20)&&total<=C.missionTime-C.clearBefore,'every mode lasts a while; the plan ends before the airspace is cleared ('+total+' s)');
 let from=0;
 for(const [i,p] of core.PLAN.entries()){
  for(const t of [from+.01,from+p.len/2,from+p.len-.01]){const m=core.modeAt(t);assert.ok(m.mode===p.mode&&m.index===i&&m.from===from&&m.to===from+p.len,'mode at '+t);}
  from+=p.len;
 }
 const tail=core.modeAt(from+.1);assert.ok(tail.mode==='MANUAL'&&tail.index===core.PLAN.length&&tail.to===C.missionTime,'MANUAL goes on until the final approach');
 const g=core.create(3);g.runTime=50;let info=core.modeInfo(g);assert.ok(info.mode==='CRUISE'&&Math.abs(info.t-5)<1e-9&&info.len===30&&Math.abs(info.left-25)<1e-9&&info.next==='GUIDED','where the plan is');
 g.runTime=from+3;info=core.modeInfo(g);assert.ok(info.mode==='MANUAL'&&info.next==='AUTOLAND','the last stretch is followed by the landing');
 g.finale={};info=core.modeInfo(g);assert.ok(info.mode==='AUTOLAND'&&info.next===null);
}

// ---------------------------------------------------------------- helpers: a game, a pilot with a hand and a reaction time, a simulation
const FIELD={x:3.4,y:1.5,gateY:.85};
// the card is 760 x 400 px here: the same view as the layer (perspective towards a vanishing point at 30 % of the height)
const W=760,H=400,BASE=Math.min(W*.155,H*.21),PK=.42,VP=.3,KY=(H*.51-H*VP)*PK/(.83*BASE);
const cursorAt=(c,z)=>{const k=1+PK*z;return {x:c.x*k,y:c.y*k-KY*z,tol:24*k/BASE};};      // the pointer at (c.x, c.y) on the plane of the aircraft, seen at the depth z
const aimAt=e=>{const s=1/(1+PK*e.z);return {x:e.x*s,y:(e.y+KY*e.z)*s};};                  // where the pointer has to be to be on an enemy
const gauss=r=>{let u=0;while(!u)u=r();const v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
// a pilot: flies the pointer to the next ring (round the pylons the way the autopilot does, round the enemies), shoots in AUTO, fires the ULT. delay: reaction time, tau: the hand, noise: the shake
function human({delay=.15,tau=.09,noise=.2,corr=.4,shoot=true,ult=true,ultDelay=.3,look=1,shootGap=.25,avoidEnemy=true,seed=1}={}){
 const rnd=core.mulberry32(seed*7919+13),buf=[];let cur={x:0,y:0},nx=0,ny=0,t=0,lastClick=-9,ultSince=-1;
 return (g,dt)=>{
  t+=dt;const out={tx:cur.x,ty:cur.y,boost:false,click:false,ult:false};let want;
  if(g.mode==='AUTO'&&!g.finale){
   const e=g.enemies.filter(q=>q.state==='ahead'&&q.z>.5&&q.z<8.5).sort((a,b)=>a.z-b.z)[0];
   want=shoot&&e?aimAt(e):{x:0,y:0};
   if(shoot&&e){const c=cursorAt(cur,e.z);if(Math.hypot(c.x-e.x,c.y-e.y)<e.r*C.shotRadius+c.tol&&t-lastClick>shootGap){out.click=true;lastClick=t;}}
  }else if(g.finale){want={x:clamp(-g.plane.x*1.2,-.9,.9)*g.fieldX,y:0};}
  else{
   const a=core.autopilot(g),gate=core.nextGate(g);let tx=a.x,ty=a.y;
   if(gate&&look){
    const ahead=g.gates.filter(q=>q.state==='ahead'&&q!==gate)[0],speed=C.baseSpeed*core.speedMul(g.level)*M[g.mode].speed,tA=gate.z/speed,L=look*(g.mode==='GUIDED'?1.5:1);
    if(ahead&&tA<L){const w=clamp((L-tA)/L,0,1)*.6*gate.r,dx=ahead.x-gate.x,dy=ahead.y-gate.y,d=Math.hypot(dx,dy)||1;tx+=dx/d*Math.min(w,d);ty+=dy/d*Math.min(w*.8,d);}
   }
   if(avoidEnemy)for(const e of g.enemies){
    if(e.state!=='ahead'||e.z<0||e.z>4.6)continue;
    const tt=e.z/(C.baseSpeed*core.speedMul(g.level)*M[g.mode].speed*(1+C.enemySpeed)),hx=e.x+e.vx*tt,hy=e.y+e.vy*tt,clear=e.r+C.planeR+.38,dx=tx-hx,dy=ty-hy,d=Math.hypot(dx,dy);
    if(d<clear){tx=hx+(d>1e-3?dx/d:1)*clear;ty=hy+(d>1e-3?dy/d:0)*clear;}
   }
   want={x:tx,y:ty};
  }
  buf.push({t,x:want.x,y:want.y});while(buf.length>1&&buf[1].t<=t-delay)buf.shift();
  nx+=-nx/corr*dt+noise*Math.sqrt(2*dt/corr)*gauss(rnd);ny+=-ny/corr*dt+noise*Math.sqrt(2*dt/corr)*gauss(rnd);
  const k=1-Math.exp(-dt/tau);cur.x+=(buf[0].x+nx-cur.x)*k;cur.y+=(buf[0].y+ny-cur.y)*k;
  const can=g.ult>=100&&g.enemies.some(q=>q.state==='ahead'&&q.z>.3);
  if(ult&&can){if(ultSince<0)ultSince=t;if(t-ultSince>=ultDelay)out.ult=true;}else ultSince=-1;
  out.tx=cur.x;out.ty=cur.y;return out;
 };
}
const SKILLED={delay:.15,tau:.09,noise:.2,shootGap:.25,ultDelay:.3},AVERAGE={delay:.25,tau:.13,noise:.3,shootGap:.4,ultDelay:.6,look:.6},SLOPPY={delay:.4,tau:.2,noise:.45,shootGap:.6,ultDelay:1.2,avoidEnemy:false,look:0};
const idle=()=>()=>({tx:0,ty:0,boost:false});
function fly(seed,makeBot,{dt=1/60,maxT=420,skipTo=0}={}){
 const g=core.create(seed,FIELD);core.begin(g);if(skipTo)g.runTime=skipTo;const bot=makeBot(seed);let t=0;const log=[];
 while(g.phase!=='over'&&g.phase!=='won'&&t<maxT){
  const cmd=bot(g,dt);
  if(cmd.click)core.shoot(g,z=>cursorAt({x:cmd.tx,y:cmd.ty},z));
  if(cmd.ult)core.fireUlt(g);
  core.step(g,dt,{tx:cmd.tx,ty:cmd.ty,boost:cmd.boost});
  log.push(...core.drain(g));t+=dt;
 }
 return {g,log,t};
}
const profile=opts=>seed=>human({...opts,seed});
// a running game in which one thing is placed to the point of arriving; the plan would switch the mode back, so a test puts the clock inside the window of the mode it wants
const running=(seed=2,field=FIELD)=>{const g=core.create(seed,field);core.begin(g);g.phase='run';g.runTime=1;return g;};
const windowOf=(mode,i=0)=>{let from=0,n=0;for(const p of core.PLAN){if(p.mode===mode){if(n===i)return from;n++;}from+=p.len;}return null;};
const inMode=(g,mode,i=0)=>{g.runTime=windowOf(mode,i)+1;g.mode=mode;return g;};
const run=(g,seconds,input={},dt=1/60)=>{for(let i=0;i<Math.round(seconds/dt);i++)core.step(g,dt,input);return core.drain(g);};

// ---------------------------------------------------------------- phases and determinism
{
 const g=core.create(1);assert.equal(g.phase,'ready');core.step(g,1,{});assert.equal(g.time,0,'nothing moves before begin');
 core.begin(g);assert.equal(g.phase,'count');assert.equal(g.gates.length,1);assert.equal(g.gates[0].x,0);assert.equal(g.gates[0].y,0,'the first gate is in the middle');assert.equal(g.mode,'MANUAL');
 let starts=0,modes=[],guard=0;while(g.phase==='count'&&guard++<1000){core.step(g,1/60,{});for(const e of core.drain(g)){if(e.type==='start')starts++;if(e.type==='mode')modes.push(e);}}
 assert.equal(g.phase,'run');assert.equal(starts,1,'one start event');assert.equal(g.gates[0].z,C.firstGate,'the gates wait during the countdown');
 assert.ok(modes.length===1&&modes[0].from===null&&modes[0].to==='MANUAL'&&modes[0].index===0,'the first mode is announced when the game starts');
 core.step(g,1/60,{});assert.ok(g.gates[0].z<C.firstGate,'and then they fly');
 const h=core.create(2);core.begin(h);for(let i=0;i<30;i++)core.step(h,1/60,{tx:2,ty:-1});assert.ok(h.plane.x>0&&h.plane.y<0,'the aircraft already follows the pointer during the countdown');
}
{
 const a=fly(7,profile(SKILLED),{maxT:150}),b=fly(7,profile(SKILLED),{maxT:150}),c=fly(8,profile(SKILLED),{maxT:150});
 const shape=r=>JSON.stringify([r.g.gates.map(x=>[x.n,x.x,x.y]),r.g.obstacles.map(x=>[x.x,x.y]),r.g.enemies.map(x=>[x.x,x.y]),r.g.score,r.g.kills,r.log.length]);
 assert.equal(shape(a),shape(b),'the same seed and the same pilot give the same game');assert.notEqual(shape(a),shape(c),'another seed gives another game');
}

// ---------------------------------------------------------------- pilots: staying put loses; aiming, dodging and shooting get all the way down
{
 for(let seed=1;seed<=12;seed++){
  const r=fly(seed,idle,{maxT:300});
  assert.equal(r.g.phase,'over','a pointer left in the middle loses (seed '+seed+')');assert.ok(r.t<120&&r.g.passed<=C.lives*6,'... within two minutes and a few gates');
  assert.equal(r.log.filter(e=>e.type==='over').length,1);assert.equal(r.log.filter(e=>e.type==='miss'||e.type==='hit').length,C.lives,'one missed gate or one hit per life (nobody regains a life by staying put)');
  const frozen=JSON.stringify(r.g.plane);core.step(r.g,1,{tx:3,ty:1,boost:true});assert.equal(JSON.stringify(r.g.plane),frozen,'no movement after the end');
 }
 const N=30,wins={skilled:0,average:0,sloppy:0,quiet:0};let kills=0,level=0;
 for(let seed=1;seed<=N;seed++){
  const r=fly(seed,profile(SKILLED));
  if(r.g.phase==='won'){wins.skilled++;assert.ok(r.g.runTime>=C.missionTime,'a landing only after the five minutes');assert.equal(r.log.filter(e=>e.type==='touchdown').length,1);assert.ok(r.log.some(e=>e.type==='finale'));}
  kills+=r.g.kills;level+=r.g.level;
  assert.ok(r.log.filter(e=>e.type==='gate').reduce((s,e)=>s+e.points,0)<=r.g.score,'the score is at least the sum of the gate points');
  assert.ok(Math.abs(r.g.plane.x)<=r.g.fieldX&&Math.abs(r.g.plane.y)<=r.g.fieldY,'the aircraft stays in the field');
  const modes=r.log.filter(e=>e.type==='mode').map(e=>e.to);if(r.g.runTime>=C.missionTime)assert.deepEqual(modes,['MANUAL','CRUISE','GUIDED','AUTO','MANUAL','CRUISE','GUIDED','AUTO','MANUAL','AUTOLAND'],'a whole mission goes through the plan and ends in AUTOLAND');
  if(fly(seed,profile(AVERAGE)).g.phase==='won')wins.average++;
  if(fly(seed,profile(SLOPPY)).g.phase==='won')wins.sloppy++;
  if(fly(seed,profile({...SKILLED,shoot:false,ult:false})).g.phase==='won')wins.quiet++;
 }
 assert.ok(wins.skilled>=N*.5,'a good pilot lands in about every other game or better: '+wins.skilled+'/'+N);
 assert.ok(wins.sloppy<=N*.15,'a careless one rarely does: '+wins.sloppy+'/'+N);
 assert.ok(wins.skilled>wins.average&&wins.average>=wins.sloppy,'skill counts: '+JSON.stringify(wins));
 assert.ok(wins.skilled>=wins.quiet+4,'the gun and the ULT matter: '+wins.skilled+'/'+N+' with them, '+wins.quiet+'/'+N+' without');
 assert.ok(kills/N>=8,'other aircraft are shot down ('+(kills/N).toFixed(1)+' a game)');assert.ok(level/N>=12,'a long mission goes through many levels ('+(level/N).toFixed(1)+')');
}

// ---------------------------------------------------------------- scoring, one gate at a time
{
 const trial=(dx,dy,{streak=0,lives=C.lives,boost=0,mode='MANUAL'}={})=>{
  const g=running();inMode(g,mode);g.streak=streak;g.lives=lives;g.boost=boost;
  const gate=g.gates[0];gate.z=.02;g.plane.x=gate.x+dx;g.plane.y=gate.y+dy;
  core.step(g,.02,{boost:boost>.6});return {g,gate,events:core.drain(g).filter(e=>e.type!=='mode')};
 };
 const r=C.radius0;
 let t=trial(0,0);assert.equal(t.events[0].quality,'perfect');assert.equal(t.events[0].points,100);assert.equal(t.g.streak,1);assert.equal(t.gate.state,'passed');
 t=trial(r*C.perfect*.9,0);assert.equal(t.events[0].quality,'perfect','just inside the zone of a perfect pass');
 t=trial(r*(C.perfect+.1),0);assert.equal(t.events[0].quality,'good');assert.equal(t.events[0].points,50);
 t=trial(r*.99,0);assert.equal(t.events[0].type,'gate','just inside the ring counts');
 t=trial(r*1.05,0);assert.equal(t.events[0].type,'miss');assert.equal(t.g.lives,C.lives-1);assert.equal(t.g.streak,0);assert.equal(t.gate.state,'missed');
 t=trial(0,0,{streak:5});assert.equal(t.events[0].mult.toFixed(1),'1.5','a streak raises the multiplier');assert.equal(t.events[0].points,150);
 t=trial(0,0,{streak:40});assert.ok(t.events[0].mult<=2.2+1e-9,'the streak multiplier is capped');
 t=trial(0,0,{boost:1});assert.ok(t.events[0].boosted&&t.events[0].points>=190,'boost doubles the points');
 t=trial(0,0,{mode:'AUTO'});assert.equal(t.events[0].points,50,'a gate in AUTO pays half');t=trial(0,0,{mode:'CRUISE'});assert.equal(t.events[0].points,80,'in CRUISE four fifths');t=trial(0,0,{mode:'GUIDED'});assert.equal(t.events[0].points,120,'in GUIDED a fifth more');
 t=trial(0,0,{streak:C.lifeEvery-1,lives:C.lives-1});assert.equal(t.g.lives,C.lives);assert.ok(t.events.some(e=>e.type==='life'),'a life every '+C.lifeEvery+' gates in a row');
 t=trial(0,0,{streak:C.lifeEvery-1,lives:C.lives});assert.equal(t.g.lives,C.lives,'never above the maximum');
 t=trial(r*2,0,{lives:1});assert.equal(t.g.phase,'over');assert.ok(t.events.some(e=>e.type==='over'&&e.summary.missed===1));
 const g=running(3);g.passed=C.gatesPerLevel-1;const gate=g.gates[0];gate.z=.02;g.plane.x=gate.x;g.plane.y=gate.y;core.step(g,.02,{});
 assert.equal(g.level,2);assert.ok(core.drain(g).some(e=>e.type==='level'&&e.level===2),'a level up after '+C.gatesPerLevel+' gates');
 // the final approach has no levels
 const f=running(3);f.runTime=C.missionTime;core.step(f,.02,{});core.drain(f);f.passed=C.gatesPerLevel*2-1;const ap=f.gates.find(x=>x.approach);if(ap){ap.z=.01;f.plane.x=ap.x;f.plane.y=ap.y;core.step(f,.02,{});}
 assert.ok(!core.drain(f).some(e=>e.type==='level')&&f.level===1,'no level up in the final approach');
}

// ---------------------------------------------------------------- the ULT is charged by the rings
{
 const pass=(g,mode,q)=>{inMode(g,mode);const gate=g.gates.find(x=>x.state==='ahead');gate.z=.02;g.plane.x=gate.x+(q==='good'?gate.r*.7:0);g.plane.y=gate.y;core.step(g,.02,{});return core.drain(g);};
 let g=running();pass(g,'MANUAL','perfect');assert.equal(g.ult,C.ultPerfect,'a perfect ring charges '+C.ultPerfect);
 g=running();pass(g,'MANUAL','good');assert.equal(g.ult,C.ultGood);
 g=running();pass(g,'AUTO','perfect');assert.ok(g.ult>C.ultPerfect,'AUTO charges faster');g=running();pass(g,'CRUISE','perfect');assert.ok(g.ult<C.ultPerfect,'CRUISE charges slower');
 g=running();g.ult=90;const ev=pass(g,'MANUAL','perfect');assert.equal(g.ult,100,'capped at 100');assert.ok(ev.some(e=>e.type==='ultReady'),'ULT READY is announced once');
 g=running();g.ult=100;g.ultCool=0;assert.equal(core.fireUlt(g),0,'nothing to shoot at: not fired');assert.equal(g.ult,100,'... and not used up');assert.ok(core.drain(g).some(e=>e.type==='ultDenied'));
}

// ---------------------------------------------------------------- pylons and other aircraft
{
 const arrive=(g,thing,dx,dy)=>{thing.z=.02;thing.x=g.plane.x+dx;thing.y=g.plane.y+dy;core.step(g,.02,{});return core.drain(g);};
 let g=running(),pylon=()=>({id:99,kind:'pylon',x:0,y:0,z:5,r:C.pylonR,state:'ahead',age:0});
 g.streak=4;let p=pylon();g.obstacles.push(p);let ev=arrive(g,p,0,0);
 assert.equal(g.lives,C.lives-1);assert.equal(g.streak,0);assert.equal(g.hits,1);assert.ok(g.invuln>0&&g.invuln<=C.invuln);assert.equal(p.state,'hit');assert.ok(ev.some(e=>e.type==='hit'&&e.kind==='pylon'),'a hit event');
 let q=pylon();g.obstacles.push(q);ev=arrive(g,q,0,0);assert.equal(g.lives,C.lives-1,'no second hit while the aircraft is protected');assert.ok(!ev.some(e=>e.type==='hit'));
 g=running();p=pylon();g.obstacles.push(p);arrive(g,p,p.r+C.planeR+.05,0);assert.equal(g.lives,C.lives,'a near miss is a miss');assert.equal(p.state,'passed');
 g=running();g.lives=1;p=pylon();g.obstacles.push(p);ev=arrive(g,p,0,0);assert.equal(g.phase,'over');assert.ok(ev.some(e=>e.type==='over'));
 // pylons: none at first, then between the gates, never inside a ring
 let seen=0,inRing=0;
 for(let seed=1;seed<=10;seed++){
  const h=core.create(seed,FIELD);core.begin(h);h.phase='run';
  for(let i=0;i<7000;i++){
   core.step(h,1/60,{});
   if(h.phase==='over'){h.phase='run';h.lives=C.lives;h.gates.forEach(x=>{x.state='passed';});}
   if(h.runTime<C.obstacleFrom)assert.equal(h.obstacles.length,0,'no pylons in the first '+C.obstacleFrom+' s');
   for(const o of h.obstacles){if(o.age>0)continue;seen++;if(h.gates.some(x=>Math.hypot(x.x-o.x,x.y-o.y)<x.r*.9+C.pylonR-1e-9&&Math.abs(x.z-o.z)<C.spacing/2+.1))inRing++;}
  }
 }
 assert.ok(seen>=20,'pylons appear ('+seen+')');assert.equal(inRing,0,'never inside a ring');   // (the loop above follows 70 s of ten games with nobody at the pointer)
 // other aircraft: not before enemyFrom, a few at a time (more while the autopilot flies and the pilot shoots), each warned about
 const e=core.create(4,FIELD);core.begin(e);e.phase='run';e.gates.forEach(x=>{x.state='passed';});let first=null,warned=0;const most={auto:0,other:0},count={auto:0,other:0},time={auto:0,other:0};
 for(let i=0;i<60*140;i++){
  core.step(e,1/60,{});const k=e.mode==='AUTO'?'auto':'other';if(e.runTime>C.enemyFrom+3)time[k]+=1/60;
  for(const x of core.drain(e))if(x.type==='enemy'){warned++;if(e.runTime>C.enemyFrom+3)count[k]++;if(first===null)first=e.runTime;}
  if(e.phase==='over'){e.phase='run';e.lives=C.lives;}
  e.gates.forEach(x=>{if(x.state==='ahead'&&x.z<1)x.state='passed';});
  const n=e.enemies.filter(x=>x.state==='ahead').length;most[k]=Math.max(most[k],n);
 }
 assert.ok(first>=C.enemyFrom-.1&&first<=C.enemyFrom+1,'the first other aircraft at about '+C.enemyFrom+' s: '+first);assert.ok(most.other<=C.enemyMax&&most.auto<=C.enemyMaxAuto&&warned>=8,'a few at a time, many in two minutes ('+warned+')');
 assert.ok(time.auto>20&&count.auto/time.auto>=1.8*count.other/time.other,'they come at least twice as often while the autopilot flies and the pilot shoots: '+(count.auto/time.auto).toFixed(3)+' against '+(count.other/time.other).toFixed(3)+' a second');
 // in AUTO they come at the aircraft
 let aimed=0,total=0;
 for(let seed=1;seed<=20;seed++){const h=running(seed);inMode(h,'AUTO');h.enemyClock=0;h.plane.x=1;h.plane.y=.2;core.step(h,1/60,{});const en=h.enemies[0];if(!en)continue;total++;const T=en.z/(C.baseSpeed*core.speedMul(1)*(1+C.enemySpeed));if(Math.hypot(en.x+en.vx*T-1,en.y+en.vy*T-.2)<2.2)aimed++;}
 assert.ok(total>=15&&aimed>=total*.8,'in AUTO the other aircraft are aimed at the aircraft: '+aimed+'/'+total);
 // a collision with another aircraft
 g=running();let en={id:7,kind:'enemy',x:0,y:0,z:3,r:C.enemyR,state:'ahead',age:0,vx:0,vy:0};g.enemies.push(en);en.z=.02;core.step(g,.02,{});ev=core.drain(g);
 assert.equal(g.lives,C.lives-1);assert.ok(ev.some(x=>x.type==='hit'&&x.kind==='enemy'),'hit by another aircraft');assert.ok(!g.enemies.includes(en)||en.state==='crashed');
}

// ---------------------------------------------------------------- the gun of the AUTO mode and the ULT shoot the other aircraft down
{
 const enemy=(id,x,y,z)=>({id,kind:'enemy',x,y,z,r:C.enemyR,state:'ahead',age:0,vx:0,vy:0});
 const mk=(mode='AUTO')=>{const g=running(6);inMode(g,mode);g.enemies.push(enemy(21,1,.2,5),enemy(22,-1,.1,7));g.enemyClock=99;return g;};
 const pointer=(x,y,tol=0)=>()=>({x,y,tol});
 let g=mk();const hit=core.shoot(g,pointer(1.3,.3));
 assert.equal(hit&&hit.id,21,'a shot at the pointer hits the enemy under it');assert.equal(g.kills,1);assert.equal(g.score,C.shotKill);assert.equal(hit.state,'shot');
 let ev=core.drain(g);assert.ok(ev.some(e=>e.type==='shot'&&e.points===C.shotKill&&e.z===5),'a shot event');
 run(g,.1);assert.ok(!g.enemies.some(e=>e.id===21),'the one that was shot is gone');assert.ok(g.enemies.some(e=>e.id===22));
 g=mk();assert.equal(core.shoot(g,pointer(1+C.enemyR*C.shotRadius+.2,.2)),null,'a shot beside misses');assert.equal(g.kills,0);assert.ok(core.drain(g).some(e=>e.type==='shotMiss'));
 g=mk();assert.ok(core.shoot(g,pointer(1+C.enemyR*C.shotRadius+.2,.2,.3)),'the reach grows with the tolerance the layer adds for far things');
 g=mk();assert.equal(core.shoot(g,pointer(0,.15)).id,21,'two in reach: the nearer one first');
 g=mk();core.shoot(g,pointer(1,.2));core.drain(g);assert.equal(core.shoot(g,pointer(-1,.1)),null,'a short cooldown between two shots');assert.ok(core.drain(g).length===0,'... and no event for a shot that was not fired');
 g.fireCool=0;assert.equal(core.shoot(g,pointer(-1,.1)).id,22,'then it works again');
 g=mk('MANUAL');assert.equal(core.shoot(g,pointer(1,.2)),null,'the gun is for AUTO only');assert.equal(g.kills,0);assert.equal(core.drain(g).length,0);
 g=mk();g.phase='paused';assert.equal(core.shoot(g,pointer(1,.2)),null,'not while paused');g.phase='run';g.finale={};assert.equal(core.shoot(g,pointer(1,.2)),null,'not in the final approach');
 g=mk();g.enemies.length=0;g.enemies.push(enemy(23,2,0,.2));assert.equal(core.shoot(g,pointer(2,0)),null,'an enemy already at the aircraft cannot be shot');
 // the ULT: every enemy in front, charged by the rings
 g=running(6);g.enemies.push(enemy(11,1,0,6),enemy(12,-1,.5,8),enemy(13,0,0,.05));
 g.ult=99;assert.equal(core.fireUlt(g),0,'needs a full charge');
 g.ult=100;g.ultCool=0;const score=g.score,n=core.fireUlt(g);
 assert.equal(n,2,'two in front of the aircraft are shot down, the one already at it is not');assert.equal(g.kills,2);assert.equal(g.ult,0);assert.equal(g.score,score+2*C.ultKill);
 ev=core.drain(g);assert.ok(ev.some(e=>e.type==='ult'&&e.targets.length===2&&e.points===2*C.ultKill));
 core.step(g,.02,{});const after=core.drain(g);assert.ok(!g.enemies.some(e=>e.id===11||e.id===12),'the shot ones are gone');assert.ok(after.some(e=>e.type==='hit'&&e.kind==='enemy'&&e.thing.id===13),'the one that was already at the aircraft was not shot: it hit it');
 assert.equal(core.fireUlt(g),0,'charged again first');
 const h=running(6);inMode(h,'AUTO');h.enemies.push(enemy(1,0,0,5));h.ult=100;core.fireUlt(h);assert.equal(h.score,Math.round(C.ultKill*M.AUTO.score),'the points follow the mode');
 const w=running(6);w.enemies.push(enemy(1,0,0,5));w.ult=100;w.ultCool=.3;assert.equal(core.fireUlt(w),0,'a short cooldown');
 w.phase='paused';w.ultCool=0;assert.equal(core.fireUlt(w),0,'not while paused');
}

// ---------------------------------------------------------------- the modes: what the aircraft does in each
{
 // the plan switches the mode in the middle of a run, with one event, and nothing else does
 const g=running(3);run(g,.2);g.runTime=core.PLAN[0].len-.05;let ev=run(g,.1);
 assert.equal(g.mode,'CRUISE');assert.deepEqual(ev.filter(e=>e.type==='mode').map(e=>[e.from,e.to,e.index]),[['MANUAL','CRUISE',1]],'one mode event at the boundary of the plan');
 assert.equal(run(g,5).filter(e=>e.type==='mode').length,0,'no more of them in the middle of a mode');
 g.runTime=windowOf('AUTO')-.05;g.enemyClock=40;ev=run(g,.1);assert.equal(g.mode,'AUTO');assert.ok(g.enemyClock<=3,'the first intruder comes soon after the autopilot takes over');
 g.mode='MANUAL';g.runTime=C.missionTime-.02;ev=run(g,.1);assert.equal(g.mode,'AUTOLAND');assert.deepEqual(ev.filter(e=>e.type==='mode').map(e=>e.to),['AUTOLAND']);assert.ok(ev.some(e=>e.type==='finale'));
 run(g,1);assert.equal(g.mode,'AUTOLAND','the plan does not touch the final approach');
 // a pause does not move the plan
 const p=running(3);const rt=p.runTime;core.pause(p);core.step(p,1,{});assert.equal(p.runTime,rt);
}
{
 // MANUAL follows the pointer quickly, GUIDED slowly (aim ahead), CRUISE only sideways at the height of the next ring, AUTO ignores the pointer
 const reach=(mode,seconds,target)=>{const g=running(9);inMode(g,mode);run(g,seconds,target);return g;};
 const manual=reach('MANUAL',1,{tx:2,ty:1});assert.ok(Math.hypot(manual.plane.x-2,manual.plane.y-1)<.12,'MANUAL is at the pointer within a second: '+manual.plane.x.toFixed(2)+', '+manual.plane.y.toFixed(2));
 const early=Math.hypot(reach('MANUAL',.3,{tx:2,ty:1}).plane.x-2,0),slow=Math.hypot(reach('GUIDED',.3,{tx:2,ty:1}).plane.x-2,0);assert.ok(slow>early+.4,'GUIDED is late where MANUAL is already there: '+slow.toFixed(2)+' against '+early.toFixed(2));
 const guided=reach('GUIDED',3,{tx:2,ty:1});assert.ok(Math.hypot(guided.plane.x-2,guided.plane.y-1)<.12,'GUIDED gets there in the end');
 const cruise=reach('CRUISE',1.5,{tx:1.5,ty:-1.4}),gate=cruise.gates[0];assert.ok(Math.abs(cruise.plane.x-1.5)<.15,'CRUISE steers sideways with the pointer');assert.ok(Math.abs(cruise.plane.y-gate.y)<.1&&Math.abs(cruise.aim.y-gate.y)<1e-9,'... and holds the height of the next ring whatever the pointer says');
 const auto=reach('AUTO',1.5,{tx:-3,ty:1.4}),ag=auto.gates[0];assert.ok(Math.abs(auto.plane.x-ag.x)<.3&&Math.abs(auto.plane.y-ag.y)<.3,'AUTO flies to the ring and ignores the pointer');
 // AUTO takes the rings by itself: perfect passes, no help
 const h=running(9);inMode(h,'AUTO');let gates=0,perfect=0;
 for(let i=0;i<60*8&&h.mode==='AUTO';i++){core.step(h,1/60,{tx:-3,ty:1.4});for(const e of core.drain(h))if(e.type==='gate'){gates++;if(e.quality==='perfect')perfect++;}}
 assert.ok(gates>=3&&perfect===gates,'AUTO takes the rings, '+perfect+' of '+gates+' perfect');
 // the wind: MANUAL takes all of it, the autopilots part of it, the pointer has to lean against it
 const dev=mode=>{const k=running(9);inMode(k,mode);for(let i=0;i<60;i++){k.gust.phase='blow';k.gust.t=.9;k.gust.dirX=1;k.gust.dirY=0;k.gust.power=2;core.step(k,1/60,{tx:0,ty:0});}return Math.abs(k.plane.x);};
 assert.ok(dev('MANUAL')>.3,'the wind pushes MANUAL off the pointer: '+dev('MANUAL').toFixed(2));assert.ok(dev('CRUISE')<dev('MANUAL')*.8&&dev('AUTO')<dev('MANUAL')*.8&&dev('GUIDED')<dev('MANUAL')*.6,'the other modes keep more of the pointer');
 // gates come slower in CRUISE; the boost works in MANUAL and GUIDED, not in CRUISE and AUTO
 const gz=(mode,boost)=>{const k=running(9);inMode(k,mode);const z=k.gates[0].z;for(let i=0;i<60;i++)core.step(k,1/60,{boost});return z-k.gates[0].z;};
 assert.ok(gz('CRUISE',false)<gz('MANUAL',false)*.9,'the gates come slower in CRUISE');
 for(const mode of ['CRUISE','AUTO'])assert.ok(Math.abs(gz(mode,true)-gz(mode,false))<1e-9,'no boost in '+mode);
 for(const mode of ['MANUAL','GUIDED'])assert.ok(gz(mode,true)>gz(mode,false),'the boost works in '+mode);
}
{
 // the autopilot flies round a pylon that stands on its way and goes back to the middle of the ring after it
 const setup=()=>{const g=running(8);inMode(g,'AUTO');g.gates=[{id:1,n:1,x:2,y:.3,z:5,r:1,state:'ahead',quality:null,age:0,approach:false}];g.lastGate=g.gates[0];g.plane.x=-2;g.plane.y=0;g.enemyClock=99;g.gust.wait=99;return g;};
 let g=setup();g.obstacles.push({id:5,kind:'pylon',x:1,y:.2,z:2.5,r:C.pylonR,state:'ahead',age:0});
 const a=core.autopilot(g);assert.ok(Math.hypot(a.x-2,a.y-.3)>.5,'the target is moved off the pylon: '+a.x.toFixed(2)+', '+a.y.toFixed(2));
 run(g,3);assert.equal(g.hits,0,'AUTO flies round the pylon');
 g=setup();assert.ok(Math.hypot(core.autopilot(g).x-2,core.autopilot(g).y-.3)<1e-9,'without a pylon the target is the middle of the ring');
 g=setup();g.obstacles.push({id:6,kind:'pylon',x:1,y:.2,z:6,r:C.pylonR,state:'ahead',age:0});assert.ok(Math.hypot(core.autopilot(g).x-2,core.autopilot(g).y-.3)<1e-9,'a pylon beyond the ring is for later');
 // over a whole run of AUTO the pylons hurt rarely
 let hits=0,pylons=0;
 for(let seed=1;seed<=12;seed++){const k=running(seed);inMode(k,'AUTO');k.enemyClock=1e9;let last=0;for(let i=0;i<60*24&&k.phase==='run';i++){core.step(k,1/60,{});core.drain(k);if(k.runTime-last>3){last=k.runTime;const gate=core.nextGate(k);if(gate)k.obstacles.push({id:1000+i,kind:'pylon',x:(k.plane.x+gate.x)/2,y:(k.plane.y+gate.y)/2,z:Math.min(gate.z-.8,3.4),r:C.pylonR,state:'ahead',age:0});}}hits+=k.hits;pylons+=k.obstacles.length+k.hits;}
 assert.ok(hits<=6,'the autopilot dodges the pylons that stand on its way: '+hits+' hits');
}

// ---------------------------------------------------------------- wind, field, pause
{
 const g=core.create(5);core.begin(g);g.phase='run';const seen=[];let t=0,maxPush=0;
 while(t<60){core.step(g,1/60,{});for(const e of core.drain(g))if(e.type==='gust')seen.push([e.stage,t]);maxPush=Math.max(maxPush,Math.hypot(g.gust.vx,g.gust.vy));t+=1/60;if(g.phase==='over')break;}
 const warn=seen.find(s=>s[0]==='warn'),blow=seen.find(s=>s[0]==='blow');
 assert.ok(warn&&blow&&warn[1]>=C.gustFirst-.1&&Math.abs(blow[1]-warn[1]-C.gustWarn)<.1,'a warning '+C.gustWarn+' s before the first gust');
 assert.ok(maxPush>0&&maxPush<=C.gustPowerMax+1e-9,'the push is bounded');
}
{
 const g=core.create(9,{x:2,y:1,gateY:.6});core.begin(g);g.phase='run';for(let i=0;i<300;i++)core.step(g,1/60,{tx:99,ty:99});
 assert.equal(g.plane.x,2);assert.equal(g.plane.y,1,'the aircraft stops at the edge of the field');
 for(let i=0;i<20;i++)core.step(g,1/60,{});
 g.obstacles.push({id:90,kind:'pylon',x:3,y:2,z:4,r:C.pylonR,state:'ahead',age:0});
 core.setField(g,1.5,.8,.5);assert.equal(g.plane.x,1.5);assert.ok(g.gates.every(x=>Math.abs(x.y)<=.5+1e-9&&Math.abs(x.x)<=1.5)&&g.obstacles.every(o=>Math.abs(o.x)<=1.5&&Math.abs(o.y)<=.5+1e-9),'a smaller card pulls everything inside');
 const z=g.gates[0].z;core.pause(g);assert.equal(g.phase,'paused');core.step(g,1,{});assert.equal(g.gates[0].z,z,'time stands still while paused');
 const rt=g.runTime;core.resume(g);assert.equal(g.phase,'run');core.step(g,.3,{});assert.equal(g.gates[0].z,z,'a short freeze after the pause');assert.equal(g.runTime,rt,'and the mission clock waits too');
 for(let i=0;i<60;i++)core.step(g,1/60,{});assert.ok(g.runTime>rt,'then the clock and the gates move again');
 const c=core.create(9);core.begin(c);core.pause(c);core.resume(c);assert.equal(c.phase,'count','a paused countdown goes back to the countdown');
 assert.equal(core.pause(core.create(1)).phase,'ready','nothing to pause before begin');
 // the input may be missing or broken: the aircraft stays where it is
 const k=core.create(9);core.begin(k);k.phase='run';k.runTime=1;core.step(k,1/60);core.step(k,1/60,{tx:NaN,ty:undefined});core.step(k,1/60,null);assert.ok(Number.isFinite(k.plane.x)&&Number.isFinite(k.plane.y));
}

// ---------------------------------------------------------------- the final approach
{
 const g=running(12);g.runTime=C.missionTime-C.clearBefore-.5;g.gates.forEach(x=>{x.state='passed';});
 // the airspace is cleared before the finale: nothing new appears in the last seconds
 g.obstacles.length=g.enemies.length=0;let late=0;
 for(let i=0;i<60*10;i++){core.step(g,1/60,{});if(g.phase!=='run')break;if(g.runTime>C.missionTime-C.clearBefore+.2&&(g.obstacles.some(o=>o.age<.05)||g.enemies.some(e=>e.age<.05)))late++;}
 assert.equal(late,0,'no pylon and no other aircraft in the last '+C.clearBefore+' s');
}
{
 const g=running(12);g.runTime=C.missionTime-.2;g.lives=2;let events=[];
 for(let i=0;i<60*60&&g.phase==='run';i++){core.step(g,1/60,{});events.push(...core.drain(g));}
 assert.equal(g.phase,'won','a pointer left alone lands: the autopilot flies the glide path (lives: '+g.lives+')');
 const fin=events.filter(e=>e.type==='finale'),td=events.filter(e=>e.type==='touchdown'),won=events.filter(e=>e.type==='won');
 assert.equal(fin.length,1);assert.equal(td.length,1);assert.equal(won.length,1,'one finale, one touchdown, one end');
 assert.equal(g.mode,'AUTOLAND');assert.ok(g.finale&&g.finale.spawned===C.landing.gates,'seven approach gates');
 assert.ok(['perfect','good','hard'].includes(td[0].grade)&&td[0].bonus===C.landing.bonus[td[0].grade]+g.lives*C.landing.lifeBonus,'the landing bonus: '+td[0].grade+' '+td[0].bonus);
 assert.equal(td[0].grade,'perfect','the pointer in the middle lands in the middle');
 assert.equal(won[0].summary.won,true);assert.equal(won[0].summary.landing.grade,td[0].grade);
 const approach=events.filter(e=>e.type==='gate'&&e.gate.approach);assert.ok(approach.length>=C.landing.gates-2,'the approach gates are rings too ('+approach.length+')');
 const before=g.score;core.step(g,1,{});assert.equal(g.score,before,'nothing after the touchdown');
 // the pilot cannot fire the ULT or the gun in it
 const h=running(12);h.runTime=C.missionTime;core.step(h,.02,{});assert.equal(h.mode,'AUTOLAND');h.ult=100;h.enemies.push({id:1,kind:'enemy',x:0,y:0,z:5,r:.6,state:'ahead',age:0,vx:0,vy:0});h.ultCool=0;assert.equal(core.fireUlt(h),0);assert.equal(core.shoot(h,()=>({x:0,y:0,tol:5})),null);
 // the glide path goes down and the runway comes last
 const k=running(12);k.runTime=C.missionTime;const ys=[];let runwaySeen=false;
 for(let i=0;i<60*40&&k.phase==='run';i++){core.step(k,1/60,{});for(const e of core.drain(k))if(e.type==='gate'&&e.gate.approach)ys.push(e.gate.y);if(k.finale&&k.finale.runwayZ!=null)runwaySeen=true;}
 assert.ok(runwaySeen,'a runway ahead');assert.ok(ys.length>=5&&ys[0]>ys[ys.length-1],'the approach gates go down: '+ys.map(y=>y.toFixed(2)).join(' '));
 assert.ok(k.finale.groundY<ys[ys.length-1],'the runway is below the last gate');
 // the pointer nudges the autopilot a little: far to one side it costs the perfect landing, but not the landing
 const side=running(12);side.runTime=C.missionTime;for(let i=0;i<60*60&&side.phase==='run';i++)core.step(side,1/60,{tx:99,ty:0});core.drain(side);
 assert.equal(side.phase,'won','a pointer thrown to the edge still lands');assert.ok(side.landing.dx>.3&&side.landing.dx<=C.nudgeX+.2&&side.landing.grade!=='perfect','the nudge is small: '+side.landing.dx.toFixed(2)+' '+side.landing.grade);
 const wild=running(12);wild.runTime=C.missionTime;for(let i=0;i<60*60&&wild.phase==='run';i++)core.step(wild,1/60,{tx:(i%240<120?99:-99),ty:(i%180<90?9:-9),boost:true});core.drain(wild);
 assert.ok(wild.phase==='won'||wild.phase==='over','the finale ends');
}

// ---------------------------------------------------------------- the best score: storage may throw
{
 const mem={};const ok={getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=v;}};
 assert.equal(core.readBest(ok),0);assert.equal(core.writeBest(ok,1234.9),true);assert.equal(core.readBest(ok),1234);
 mem[core.BEST_KEY]='junk';assert.equal(core.readBest(ok),0);mem[core.BEST_KEY]='-5';assert.equal(core.readBest(ok),0);
 const broken={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
 assert.equal(core.readBest(broken),0);assert.equal(core.writeBest(broken,5),false);
}

// ---------------------------------------------------------------- the card layer in a stub DOM
class El{
 constructor(tag){this.tagName=String(tag).toUpperCase();this.kids=[];this.attrs={};this.handlers={};this.classes=new Set();this.dataset={};this.style={};this._text='';this.hidden=false;this.parent=null;this.focused=0;
  const self=this;this.classList={add:(...c)=>c.forEach(x=>self.classes.add(x)),remove:(...c)=>c.forEach(x=>self.classes.delete(x)),toggle:(c,f)=>{const on=f===undefined?!self.classes.has(c):!!f;on?self.classes.add(c):self.classes.delete(c);return on;},contains:c=>self.classes.has(c)};}
 set className(v){this.classes=new Set(String(v).split(/\s+/).filter(Boolean));}get className(){return[...this.classes].join(' ');}
 set textContent(v){this.kids=[];this._text=String(v);}get textContent(){return this._text+this.kids.map(k=>k.textContent).join('');}
 get children(){return this.kids.filter(k=>k instanceof El);}get firstChild(){return this.kids[0]||null;}
 append(...nodes){for(const n of nodes){if(n instanceof El)n.parent=this;this.kids.push(n);}}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return k in this.attrs?this.attrs[k]:null;}removeAttribute(k){delete this.attrs[k];}
 addEventListener(t,f){(this.handlers[t]=this.handlers[t]||[]).push(f);}
 fire(t,ev={}){const e=Object.assign({type:t,stopped:false,prevented:false,stopPropagation(){this.stopped=true;},preventDefault(){this.prevented=true;}},ev);for(const f of this.handlers[t]||[])f(e);return e;}
 after(n){const p=this.parent;n.parent=p;p.kids.splice(p.kids.indexOf(this)+1,0,n);}
 replaceWith(n){const p=this.parent;n.parent=p;p.kids[p.kids.indexOf(this)]=n;}
 focus(){this.focused++;}
 find(pred){if(pred(this))return this;for(const k of this.kids)if(k instanceof El){const r=k.find(pred);if(r)return r;}return null;}
 findAll(pred,out=[]){if(pred(this))out.push(this);for(const k of this.kids)if(k instanceof El)k.findAll(pred,out);return out;}
}
function runLayer({lang='ru',storageBlocked=false,coarse=false,springs=true,width=520,height=350}={}){
 const mem={};
 const storage=storageBlocked?{getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}}:{getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=v;}};
 const root=new El('div');root.className='hero-display';
 const topline=new El('div');topline.className='scope-topline';const label=new El('span');const dots=new El('span');dots.className='scope-dots';topline.append(label,dots);
 const host=new El('div');host.className='scope-main flight-playground';const instr=new El('div');instr.className='scope-caption flight-instructions';
 const mark=new El('div');mark.className='sim-center-mark';host.append(mark);
 root.append(topline,host,instr);
 host.closest=()=>root;root.closest=()=>null;host.querySelector=sel=>host.find(n=>n.classes.has(sel.slice(1)));
 root.querySelector=sel=>root.find(n=>n.classes.has(sel.slice(1)));topline.querySelector=sel=>topline.find(n=>n.classes.has(sel.slice(1)));
 const winHandlers={},docHandlers={},clock={t:100000};
 const state={w:width,h:height,roll:0,pitch:0,boosted:false,targetX:0,targetY:0,hovered:false,pointerId:null,aimRoll:0,aimPitch:0,aimYaw:0};
 const demo={host,canvas:{},state,bound:clamp,layer:null,woke:0,wake(){this.woke++;}};
 const document={createElement:t=>new El(t),createTextNode:t=>({textContent:String(t)}),hidden:false,documentElement:{lang},addEventListener:(t,f)=>{(docHandlers[t]=docHandlers[t]||[]).push(f);}};
 const window={AtlasFlightDemo:demo,AtlasFlightGameCore:core,AtlasI18n:{lang},matchMedia:q=>({matches:coarse&&/coarse/.test(q)}),localStorage:storage,addEventListener:(t,f)=>{(winHandlers[t]=winHandlers[t]||[]).push(f);}};
 vm.runInNewContext(read('js/site/flight-game.js'),{window,document,setTimeout:()=>0,Math:Object.assign(Object.create(Math),{random:core.mulberry32(20261119)}),Set,String,Number,Array,JSON,Object,Boolean,Date,performance:{now:()=>clock.t}});   // the same games every time
 const layer=demo.layer;
 const find=cls=>root.find(n=>n.classes.has(cls));
 const calls={save:0,restore:0,rotate:0,translate:0};
 const ctx=new Proxy({},{get:(t,k)=>{if(k==='createRadialGradient'||k==='createLinearGradient')return()=>({addColorStop(){}});if(typeof k!=='string')return undefined;if(k in calls)return()=>{calls[k]++;};return t[k]||(()=>{});},set:(t,k,v)=>{t[k]=v;return true;}});
 return {layer,demo,state,root,host,find,clock,toggle:find('game-toggle'),overlay:host.find(n=>n.classes.has('game-overlay')),hud:host.find(n=>n.classes.has('game-hud')),caption:find('game-caption'),bar:find('game-bar'),tip:find('game-tip'),
  dwellBar:find('game-dwell'),ultBtn:find('game-ult'),chips:Object.fromEntries(root.findAll(n=>n.classes.has('game-mode')).map(b=>[b.dataset.mode,b])),topline,mem,window,winHandlers,docHandlers,ctx,calls,centre:mark,
  frame(dt=1/60){
   clock.t+=dt*1000;layer.steer(dt);
   if(springs){state.roll+=(state.aimRoll-state.roll)*Math.min(1,dt*4);state.pitch+=(state.aimPitch-state.pitch)*Math.min(1,dt*4);}
   layer.update(dt);layer.cameraBegin(ctx);layer.drawBack(ctx);layer.drawFront(ctx);layer.cameraEnd(ctx);
  },
  frames(n,dt){for(let i=0;i<n;i++)this.frame(dt);},seconds(s){this.frames(Math.round(s*60));},
  point(px,py){state.targetX=px/state.w*2-1;state.targetY=1-py/state.h*2;},                        // the pointer at a place on the card (pixels)
  move(px,py,type='mouse'){this.point(px,py);host.fire('pointermove',{pointerType:type});},
  setLang(l){window.AtlasI18n.lang=l;for(const f of winHandlers['atlas:languagechange']||[])f();}};
}
// time passes and nobody loses a life: the rings that come are taken, and the wind waits unless a test wants it
const settle=(tt,s,gust=true)=>{const g=tt.layer.game;for(let i=0;i<Math.round(s*60);i++){g.gates.forEach(x=>{if(x.state==='ahead')x.state='passed';});g.lives=C.lives;if(gust)g.gust.wait=99;tt.frame();}};
{
 const t=runLayer();
 assert.ok(t.layer&&t.demo.layer===t.layer,'the layer registers itself in the demo');
 // no start button: the header has only the exit button, and it is hidden until the game runs
 assert.ok(t.toggle&&t.toggle.parent.classes.has('scope-actions'),'the exit button sits in the header, next to the dots');assert.equal(t.toggle.tagName,'BUTTON');assert.equal(t.toggle.type,'button','a button that never submits a form');
 assert.ok(t.topline.kids.includes(t.toggle.parent)&&t.toggle.parent.kids.includes(t.topline.find(n=>n.classes.has('scope-dots'))),'the dots are kept');
 assert.ok(t.toggle.hidden,'nothing to press before the game: it is started by holding the pointer on the card');
 assert.ok(!t.root.findAll(n=>n.tagName==='BUTTON'&&!n.hidden).some(b=>/ИГРА|ГРА|PLAY|СТАРТ|START/i.test(b.textContent)),'no start button anywhere');
 assert.ok(t.hud.hidden&&t.overlay.hidden&&t.caption.hidden&&t.bar.hidden&&t.tip.hidden,'nothing of the game shows before it starts');assert.equal(t.layer.mode,'demo');assert.equal(t.layer.status(),null,'the demo keeps its own status text');
 assert.deepEqual(Object.keys(t.chips),['MANUAL','CRUISE','GUIDED','AUTO'],'four modes in the bar');
 for(const [name,chip] of Object.entries(t.chips)){assert.equal(chip.tagName,'SPAN','the mode '+name+' is an indicator, not a button');assert.ok(!(chip.handlers.click||[]).length&&!(chip.handlers.pointerdown||[]).length,'and it listens to nothing');}
 assert.ok(t.ultBtn&&t.ultBtn.attrs['aria-label']);
 assert.equal(t.layer.cameraOwnsHorizon,true);assert.ok(Math.abs(t.layer.horizonShift-(.3-.5)*t.state.h)<1e-9,'the horizon of the demo goes to the vanishing point of the rings');
}
// ---- hold the pointer for seven seconds: a bar fills up, the middle mark counts down, the game starts
{
 const t=runLayer(),bar=t.dwellBar,fill=bar.children[0];
 assert.ok(bar&&fill&&bar.attrs['aria-hidden']==='true','the bar of the hold');
 t.seconds(2);assert.ok(t.layer.dwell===0&&!bar.classes.has('is-on')&&t.layer.status()===null,'no pointer on the card: nothing counts');
 t.host.fire('pointerenter',{pointerType:'mouse'});assert.ok(t.layer.hovering);
 t.seconds(.8);assert.ok(Math.abs(t.layer.dwell-.8)<.05&&!bar.classes.has('is-on')&&t.layer.status()===null,'a short visit shows nothing');
 t.seconds(.5);assert.ok(bar.classes.has('is-on'),'after a second the bar appears');assert.ok(/scaleX\(0\.1/.test(fill.style.transform),'... and fills up: '+fill.style.transform);assert.equal(t.layer.status(),null,'the text waits a little longer');
 t.seconds(1);assert.equal(t.layer.status(),'УДЕРЖИВАЙ КУРСОР — ИГРА ЧЕРЕЗ 5','after two seconds the middle mark counts down: '+t.layer.status());
 t.seconds(1);assert.equal(t.layer.status(),'УДЕРЖИВАЙ КУРСОР — ИГРА ЧЕРЕЗ 4');
 t.setLang('en');t.seconds(.1);assert.equal(t.layer.status(),'HOLD THE CURSOR HERE — GAME IN 4','the count follows the language');t.setLang('uk');t.seconds(.1);assert.ok(/ТРИМАЙ КУРСОР — ГРА ЧЕРЕЗ 4/.test(t.layer.status()));t.setLang('ru');
 assert.equal(t.layer.mode,'demo');t.seconds(2.9);assert.equal(t.layer.mode,'demo','still waiting at 6.4 s: '+t.layer.dwell.toFixed(2));assert.equal(t.layer.status(),'УДЕРЖИВАЙ КУРСОР — ИГРА ЧЕРЕЗ 1','the last second');
 t.seconds(.8);assert.equal(t.layer.mode,'count','at seven seconds the game starts by itself: '+t.layer.dwell.toFixed(2));assert.ok(t.layer.engaged&&!t.toggle.hidden,'and the exit button appears');assert.ok(/■ ВЫХОД/.test(t.toggle.textContent));
 assert.ok(!bar.classes.has('is-on')&&t.layer.dwell===0,'the bar is gone');assert.equal(t.layer.status(),'ПРИГОТОВЬСЯ');
 // after the exit the pointer is still on the card: it takes a new visit to start again
 t.layer.exit();assert.equal(t.layer.mode,'demo');assert.ok(t.toggle.hidden);t.seconds(9);assert.equal(t.layer.mode,'demo','holding on after the exit does not start another game');assert.equal(t.layer.dwell,0);
 t.host.fire('pointerleave',{pointerType:'mouse'});t.seconds(1);t.host.fire('pointerenter',{pointerType:'mouse'});t.seconds(7.2);assert.equal(t.layer.mode,'count','leave and come back: a new hold starts a new game');
 t.host.fire('keydown',{key:'Escape'});assert.equal(t.layer.mode,'demo');t.seconds(8);assert.equal(t.layer.mode,'demo','also after Esc');
}
{
 // leaving the card, a sleeping page, a finger lifted: the hold starts over
 const t=runLayer();t.host.fire('pointerenter',{pointerType:'mouse'});t.seconds(3);assert.ok(t.layer.dwell>2.9);
 t.host.fire('pointerleave',{pointerType:'mouse'});t.seconds(.1);assert.equal(t.layer.dwell,0);assert.ok(!t.dwellBar.classes.has('is-on')&&t.layer.status()===null,'leaving the card cancels the count');
 t.host.fire('pointerenter',{pointerType:'mouse'});t.seconds(3);t.clock.t+=600;t.frame();assert.equal(t.layer.dwell,0,'a page that slept (the card out of view, the tab hidden) starts over, it does not jump ahead');
 t.seconds(7.5);assert.equal(t.layer.mode,'count');
 const s=runLayer();s.host.fire('pointerenter',{pointerType:'mouse'});s.seconds(6.5);s.host.fire('pointerleave',{pointerType:'mouse'});s.seconds(.5);s.host.fire('pointerenter',{pointerType:'mouse'});s.seconds(2);assert.equal(s.layer.mode,'demo','a visit that was cut short does not add up');
 // holding the button down (the demo's boost) does not matter
 const b=runLayer();b.host.fire('pointerenter',{pointerType:'mouse'});b.host.fire('pointerdown',{pointerType:'mouse',button:0});b.seconds(7.3);assert.equal(b.layer.mode,'count');
 // the keyboard: Enter on the card; leaving the game that way does not lock the pointer out of the next hold
 const k=runLayer();k.host.fire('keydown',{key:'Enter'});assert.equal(k.layer.mode,'count','Enter starts the game for those who have no pointer');
 k.host.fire('keydown',{key:'Escape'});assert.equal(k.layer.mode,'demo');k.host.fire('pointerenter',{pointerType:'mouse'});k.seconds(7.3);assert.equal(k.layer.mode,'count','the pointer comes later: its hold starts a game');
 // a finger: hold it down; lifting it cancels
 const f=runLayer({coarse:true});f.host.fire('pointerdown',{pointerType:'touch',button:0,pointerId:3});f.seconds(2.2);assert.equal(f.layer.status(),'УДЕРЖИВАЙ ПАЛЕЦ — ИГРА ЧЕРЕЗ 5','a finger gets the words for a finger');
 f.host.fire('pointerup',{pointerType:'touch',pointerId:3});f.seconds(.1);assert.equal(f.layer.dwell,0);assert.equal(f.layer.status(),null);
 f.host.fire('pointerdown',{pointerType:'touch',button:0,pointerId:4});f.seconds(7.3);assert.equal(f.layer.mode,'count','seven seconds with a finger down start the game');
 const c=runLayer({coarse:true});c.host.fire('pointerdown',{pointerType:'touch',button:0,pointerId:5});c.seconds(3);c.host.fire('pointercancel',{pointerType:'touch'});c.seconds(.1);assert.equal(c.layer.dwell,0,'a finger that starts to scroll the page cancels the hold');
 // the card keeps working as the demo: the frames of the demo do not break without a pointer
 const idle=runLayer();idle.seconds(30);assert.equal(idle.layer.mode,'demo');assert.equal(idle.layer.plane.scale,1);
}
// ---- the game: the aircraft is where the pointer is
{
 const t=runLayer({springs:false});
 t.host.fire('pointerenter',{pointerType:'mouse'});t.seconds(7.3);assert.equal(t.layer.mode,'count');assert.ok(t.host.classes.has('is-game')&&t.root.classes.has('is-game'));assert.ok(!t.hud.hidden&&!t.caption.hidden&&!t.bar.hidden);
 assert.ok(t.layer.active&&t.layer.engaged&&t.demo.woke>0,'the demo runs at full speed and is woken up');
 assert.ok(t.caption.textContent.includes('курсором')&&t.caption.textContent.includes('Esc')&&t.caption.textContent.includes('ПКМ')&&/MANUAL.*CRUISE.*GUIDED.*AUTO/.test(t.caption.textContent)&&/сами/.test(t.caption.textContent),'the hint under the card: the pointer, the keys, the modes that change by themselves, the ULT');
 assert.ok(!t.overlay.hidden&&t.overlay.dataset.kind==='count'&&/^[123]$/.test(t.overlay.find(n=>n.classes.has('game-count')).textContent),'the countdown shows a digit');
 assert.ok(t.layer.game.fieldX>0&&t.layer.game.gateY>0,'the field is worked out from the size of the card');assert.equal(t.root.findAll(n=>n.classes.has('game-lives'))[0].children.length,C.lives,'a dot for every life');
 t.setLang('en');assert.ok(/Exit|EXIT/.test(t.toggle.textContent));t.setLang('ru');
 const w=t.state.w,h=t.state.h,base=Math.min(w*.155,h*.21);
 // the aircraft goes where the pointer is: its place on the card is the place of the pointer
 const lookAt=(px,py)=>{t.move(px,py);t.seconds(1.6);const g=t.layer.game,p=t.layer.worldToPixels(g.plane.x,g.plane.y,0);return {g,p};};
 for(const [px,py] of [[w*.75,h*.6],[w*.25,h*.45],[w*.5,h*.51],[w*.62,h*.35]]){
  const {g,p}=lookAt(px,py);g.gates.forEach(x=>{x.state='passed';});g.lives=C.lives;
  assert.ok(Math.abs(p.x-px)<4&&Math.abs(p.y-py)<4,'the aircraft is under the pointer at '+Math.round(px)+', '+Math.round(py)+': it is at '+p.x.toFixed(1)+', '+p.y.toFixed(1));
 }
 // the aircraft of the demo is drawn exactly there (its own oblique camera is taken into account)
 const demoProject=(x,y,z)=>{const depth=7.8+z*.65-y*.36,scale=Math.min(w*.155,h*.21)*(7.8/depth);return [w*.5+x*scale,h*.51-(y*.83+z*.52)*scale];};
 for(const [px,py] of [[w*.8,h*.7],[w*.2,h*.3],[w*.5,h*.51]]){const {g,p}=lookAt(px,py);g.gates.forEach(x=>{x.state='passed';});g.lives=C.lives;const q=demoProject(t.layer.plane.x,t.layer.plane.y,0);assert.ok(Math.abs(q[0]-p.x)<.6&&Math.abs(q[1]-p.y)<.6,'the demo draws the aircraft at '+q.map(v=>v.toFixed(1))+' and the game says '+p.x.toFixed(1)+', '+p.y.toFixed(1));}
 // the pointer leaves the card: the aircraft keeps the last aim and the game waits, then pauses
 t.move(w*.7,h*.4);t.seconds(1);const keep=t.layer.game.plane.x;t.host.fire('pointerleave',{pointerType:'mouse'});t.point(w*.1,h*.9);t.seconds(.5);
 assert.ok(Math.abs(t.layer.game.plane.x-keep)<.05&&t.layer.mode==='run','the aircraft holds the last aim, the game is still running for a moment');
 t.seconds(.9);assert.equal(t.layer.mode,'paused','a mouse that stays away pauses the game');assert.equal(t.overlay.dataset.kind,'paused');assert.equal(t.layer.status(),'ПАУЗА');
 t.move(w*.5,h*.5);assert.equal(t.layer.mode,'run','the mouse coming back resumes');
 t.host.fire('pointerleave',{pointerType:'mouse'});t.seconds(.6);t.host.fire('pointerenter',{pointerType:'mouse'});t.seconds(1);assert.equal(t.layer.mode,'run','back within the grace time: no pause at all');
 t.host.fire('keydown',{key:'p'});assert.equal(t.layer.mode,'paused');t.move(w*.5,h*.5);assert.equal(t.layer.mode,'paused','a pause by key waits for the key');t.host.fire('keydown',{key:' '});assert.equal(t.layer.mode,'run');
 t.layer.onView(false);assert.equal(t.layer.mode,'paused','the card scrolled out of view');t.layer.resume();
 // arrow keys move an aim of their own; the keys are a way to play without a mouse, so they hold the pause back for a while
 t.layer.game.gates.forEach(x=>{x.state='passed';});t.move(w*.5,h*.51);t.seconds(1);const x0=t.layer.game.plane.x;
 t.host.fire('keydown',{key:'ArrowRight'});t.seconds(.6);t.host.fire('keyup',{key:'ArrowRight'});const x1=t.layer.game.plane.x;assert.ok(x1>x0+1,'the right arrow moves the aircraft to the right: '+x0.toFixed(2)+' -> '+x1.toFixed(2));
 t.seconds(1);const x2=t.layer.game.plane.x;t.seconds(.5);assert.ok(Math.abs(t.layer.game.plane.x-x2)<.02&&x2>=x1-.05,'and it stays where it was left (the pointer is not asked again while the keys are in charge)');
 t.host.fire('keydown',{key:'ArrowUp'});t.seconds(.4);t.host.fire('keyup',{key:'ArrowUp'});assert.ok(t.layer.game.plane.y>.3,'the up arrow climbs');
 t.host.fire('pointerleave',{pointerType:'mouse'});settle(t,6);assert.equal(t.layer.mode,'run','the keys are a way to play without a pointer: no pause for a pointer that is not there');
 t.move(w*.5,h*.5);t.host.fire('pointerleave',{pointerType:'mouse'});t.seconds(1.8);assert.equal(t.layer.mode,'paused','but once the pointer has been on the card, leaving it pauses again');
 t.host.fire('keydown',{key:'ArrowLeft'});assert.equal(t.layer.mode,'run','a key press brings the game back from that pause');t.host.fire('keyup',{key:'ArrowLeft'});
 // a finger never loses the card: no pause when it is lifted
 const f=runLayer({coarse:true,springs:false});f.layer.start();f.seconds(3);f.host.fire('pointerdown',{pointerType:'touch',button:0,pointerId:1});f.move(f.state.w*.3,f.state.h*.5,'touch');f.host.fire('pointerup',{pointerType:'touch',pointerId:1});f.seconds(6);assert.equal(f.layer.mode,'run','a lifted finger does not pause the game');
}
// ---- the plan, the mode bar, the tips
{
 const t=runLayer({springs:false});t.layer.start();t.seconds(C.countdown+.3);assert.equal(t.layer.mode,'run');
 const g=t.layer.game,chip=n=>t.chips[n],part=(n,cls)=>chip(n).children.find(x=>x.classes.has(cls)),fillOf=n=>part(n,'game-mode-fill'),leftOf=n=>part(n,'game-mode-left').textContent;
 t.move(t.state.w*.5,t.state.h*.51);settle(t,.1);
 assert.equal(g.mode,'MANUAL');assert.ok(chip('MANUAL').classes.has('is-active')&&!chip('CRUISE').classes.has('is-active')&&chip('CRUISE').classes.has('is-next'),'MANUAL is flying, CRUISE comes next');
 assert.equal(leftOf('MANUAL'),'00:45','the time the mode has left');assert.equal(chip('MANUAL').attrs['aria-current'],'true');assert.equal(chip('CRUISE').attrs['aria-current'],undefined);
 assert.ok(!t.tip.hidden&&t.tip.textContent.startsWith('MANUAL:')&&/курсор/.test(t.tip.textContent),'the tip of the first mode: '+t.tip.textContent);
 assert.equal(t.layer.status(),null,'nothing to say in the middle of a plain run');assert.equal(t.centre.style.visibility,'hidden','the demo\'s text in the middle of the card is hidden then');
 // the keys 1-4 and the chips do nothing: the plan decides
 for(const k of ['1','2','3','4'])t.host.fire('keydown',{key:k});for(const c of Object.values(t.chips))c.fire('click');assert.equal(g.mode,'MANUAL','the mode cannot be picked');
 // half way through MANUAL
 settle(t,6);assert.ok(t.tip.hidden,'a tip goes away by itself');
 g.runTime=22.5;settle(t,.1);assert.ok(/^(4|5)\d%$/.test(fillOf('MANUAL').style.width),'the bar of the mode fills as its time runs out: '+fillOf('MANUAL').style.width);
 // the boundaries of the plan, one after the other: the mode, the announcement in the middle, the chips, the tip (once per mode)
 const from=[];{let f=0;for(const p of core.PLAN){from.push(f);f+=p.len;}}
 const shown=[];
 for(let i=1;i<core.PLAN.length;i++){
  g.runTime=from[i]-.03;settle(t,.3);const now=t.tip.hidden?'':t.tip.textContent;shown.push([g.mode,now.startsWith(g.mode+':')]);
  if(i===1){
   assert.equal(g.mode,'CRUISE');assert.equal(t.layer.status(),'РЕЖИМ CRUISE','the new mode is announced in the middle of the card');t.frame();assert.equal(t.centre.style.visibility,'');
   assert.ok(chip('CRUISE').classes.has('is-active')&&!chip('MANUAL').classes.has('is-active')&&chip('GUIDED').classes.has('is-next')&&!chip('CRUISE').classes.has('is-next'),'exactly one mode is active, the next is marked');
   assert.ok(/^00:[23]\d$/.test(leftOf('CRUISE'))&&leftOf('MANUAL')==='','the active mode counts the seconds');assert.ok(/автопилот/.test(now),'a tip for the new mode: '+now);
   settle(t,2);assert.equal(t.layer.status(),null,'the announcement goes away');
  }
  settle(t,5.4);
 }
 assert.deepEqual(shown.map(s=>s[0]),['CRUISE','GUIDED','AUTO','MANUAL','CRUISE','GUIDED','AUTO'],'the whole plan');
 assert.deepEqual(shown.slice(0,3).map(s=>s[1]),[true,true,true],'every mode brings its tip');assert.deepEqual(shown.slice(3).map(s=>s[1]),[false,false,false,false],'a mode that comes back does not repeat its tip');
 // tips: the one a mode brings is not pushed away by a hint, the hint waits and comes after
 const q=runLayer({springs:false});q.layer.start();q.seconds(C.countdown+.3);const qg=q.layer.game;qg.gust.wait=0;settle(q,.1,false);
 assert.ok(q.tip.textContent.startsWith('MANUAL:'),'the mode tip stays while a gust is announced: '+q.tip.textContent);assert.equal(q.layer.status().startsWith('ПОРЫВ ВЕТРА'),true,'the gust itself is announced in the middle');
 settle(q,5.4,false);assert.ok(!q.tip.hidden&&/Порыв ветра/.test(q.tip.textContent),'then the tip about the gust: '+q.tip.textContent);
 // the finale
 g.runTime=C.missionTime-.05;settle(t,.3);assert.equal(g.mode,'AUTOLAND');assert.equal(t.layer.status(),'ЗАХОД НА ПОСАДКУ');
 assert.ok(t.bar.children.find(n=>n.classes.has('game-landing')).hidden===false&&t.root.find(n=>n.classes.has('game-modes')).hidden===true,'the modes give way to AUTOLAND');assert.ok(/AUTOLAND/.test(t.tip.textContent),'and the tip of the landing');
 assert.ok(Object.values(t.chips).every(c=>!c.classes.has('is-active')));
}

// ---- the view: perspective, the aim ring, hazards, the camera
{
 const t=runLayer({springs:false});t.layer.start();t.seconds(C.countdown+.3);const g=t.layer.game,w=t.state.w,h=t.state.h,base=Math.min(w*.155,h*.21),P=(x,y,z)=>t.layer.worldToPixels(x,y,z);
 const o=P(0,0,0);assert.ok(Math.abs(o.x-w/2)<1e-9&&Math.abs(o.y-h*.51)<1e-9&&Math.abs(o.s-base)<1e-9,'at the depth of the aircraft the card is as it always was');
 const far=P(0,0,C.zFar);assert.ok(far.s<base*.3&&far.y<o.y&&Math.abs(far.y-h*.3)<(o.y-h*.3)*.3,'far away things shrink and climb towards the vanishing point at 30 % of the height');
 assert.ok(Math.abs(P(0,0,200).y-h*.3)<2&&P(0,0,200).s<base*.04,'... and meet there');
 for(const z of [0,2,5,9]){assert.ok(P(1,0,z).x>P(0,0,z).x&&P(0,1,z).y<P(0,0,z).y&&P(0,-1,z).y>P(0,0,z).y,'right is right and up is up at the depth '+z);}
 let prev=1e9;for(const z of [0,1,2,3,5,7,9.4]){const s=P(0,0,z).s;assert.ok(s<prev,'the size falls with the depth');prev=s;}
 assert.ok(P(2,0,6).x-w/2<P(2,0,0).x-w/2,'the sides come in too');
 assert.ok(Math.abs(P(0,.8,6).y-P(0,0,6).y)<Math.abs(P(0,.8,0).y-P(0,0,0).y),'a difference in height is smaller in the distance, but it is always the same way round');
 // the pointer seen from the depth of a thing: what the gun uses
 t.move(w*.62,h*.4);const here=t.layer.pointerAt(0),pl=t.layer.pointerAt(6);
 assert.ok(Math.abs(P(here.x,here.y,0).x-w*.62)<1e-6&&Math.abs(P(here.x,here.y,0).y-h*.4)<1e-6,'the pointer on the plane of the aircraft');
 assert.ok(Math.abs(P(pl.x,pl.y,6).x-w*.62)<1e-6&&Math.abs(P(pl.x,pl.y,6).y-h*.4)<1e-6,'and the point at another depth that is drawn under it');assert.ok(pl.tol>here.tol,'the gun reaches further in the distance, where things are small');
 // every kind of thing can be drawn, in every mode, and the canvas is always put back
 g.gates.forEach(x=>{x.state='passed';});g.lives=C.lives;
 const en=(x,y,z)=>({id:900+Math.round(z*10),kind:'enemy',x,y,z,r:C.enemyR,state:'ahead',age:0,vx:.4,vy:0});
 for(const mode of ['MANUAL','CRUISE','GUIDED','AUTO']){
  g.runTime=windowOf(mode)+2;g.obstacles.push({id:800+mode.length,kind:'pylon',x:.5,y:.2,z:2.4,r:C.pylonR,state:'ahead',age:0});g.enemies.push(en(-1.2,.3,3.2),en(1.4,0,5.5));g.ult=100;
  const s0=t.calls.save,r0=t.calls.restore;t.seconds(.6);assert.equal(t.calls.save-s0,t.calls.restore-r0,'the canvas is put back every frame in '+mode);
  g.obstacles.length=0;g.enemies.length=0;g.gates.forEach(x=>{x.state='passed';});g.lives=C.lives;
 }
 g.runTime=C.missionTime-.05;t.seconds(5);assert.ok(g.finale);const s0=t.calls.save,r0=t.calls.restore;t.seconds(8);assert.equal(t.calls.save-s0,t.calls.restore-r0,'and in the final approach with the runway');
 // the camera banks with the aircraft about the aircraft (it stays under the pointer), limited, level at rest
 const c=runLayer({springs:false});c.layer.start();c.seconds(C.countdown+.3);c.layer.game.gates.forEach(x=>{x.state='passed';});c.move(c.state.w*.7,c.state.h*.45);c.seconds(1.5);
 c.state.roll=-60;c.seconds(.8);assert.ok(c.layer.camera.roll<-.1&&c.layer.camera.roll>=-.3,'the camera follows the bank, limited (and shaken a little by a hit): '+c.layer.camera.roll);assert.ok(c.layer.camera.active);
 const pp=c.layer.worldToPixels(c.layer.game.plane.x,c.layer.game.plane.y,0);assert.ok(Math.abs(c.layer.camera.px-pp.x)<1&&Math.abs(c.layer.camera.py-pp.y)<1,'the camera turns about the aircraft');
 c.state.roll=60;c.seconds(1);assert.ok(c.layer.camera.roll>.1,'and the other way');
 c.state.roll=0;c.seconds(2);assert.ok(Math.abs(c.layer.camera.roll)<.02);
 // the bank of the aircraft is the bank of its motion: a right turn is a right bank
 const m=runLayer();m.layer.start();m.seconds(C.countdown+.3);m.layer.game.gates.forEach(x=>{x.state='passed';});m.move(m.state.w*.9,m.state.h*.51);m.seconds(.25);assert.ok(m.state.aimRoll<-20,'moving right banks right (a negative roll of the model): '+m.state.aimRoll);
 m.move(m.state.w*.1,m.state.h*.51);m.seconds(.5);assert.ok(m.state.aimRoll>20,'and left');m.seconds(2);assert.ok(Math.abs(m.state.aimRoll)<3,'level at rest');
}
// ---- the gun, the ULT, the boost
{
 const t=runLayer({springs:false});t.layer.start();t.seconds(C.countdown+.3);const g=t.layer.game,w=t.state.w,h=t.state.h,P=(x,y,z)=>t.layer.worldToPixels(x,y,z);
 g.gust.wait=99;g.enemyClock=1e9;
 const stand=()=>{g.gates.forEach(x=>{x.state='passed';});g.lives=C.lives;};
 const enemy=(id,x,y,z)=>({id,kind:'enemy',x,y,z,r:C.enemyR,state:'ahead',age:0,vx:0,vy:0});
 // not in MANUAL
 g.enemies.push(enemy(41,1,.3,4));stand();const p=P(1,.3,4);t.move(p.x,p.y);t.host.fire('pointerdown',{pointerType:'mouse',button:0});t.host.fire('pointerup',{pointerType:'mouse'});assert.equal(g.kills,0,'the left button is the boost in MANUAL, not a gun');
 // in AUTO a click on an enemy shoots it
 g.enemies.length=0;g.runTime=windowOf('AUTO')+1;g.mode='AUTO';stand();t.seconds(.2);g.enemies.push(enemy(42,1,.3,4),enemy(43,-1.5,0,6));
 let q=P(1,.3,4);t.move(q.x,q.y);t.seconds(.02);t.host.fire('pointerdown',{pointerType:'mouse',button:0});assert.equal(g.kills,1,'a click on an enemy in AUTO shoots it down');t.host.fire('pointerup',{pointerType:'mouse'});
 assert.ok(g.enemies.find(e=>e.id===42).state==='shot','that one is the target');t.seconds(.05);assert.ok(!g.enemies.some(e=>e.id===42),'and it is gone');assert.ok(t.layer.game.score>=C.shotKill);
 q=P(-1.5,0,6);t.move(q.x,q.y);t.seconds(.3);t.host.fire('pointerdown',{pointerType:'mouse',button:0});assert.equal(g.kills,2,'the pointer follows the perspective: an enemy far away is shot where it is drawn');t.host.fire('pointerup',{pointerType:'mouse'});
 t.seconds(.3);g.enemies.push(enemy(44,1,.3,4));q=P(-2.5,-1,0);t.move(q.x,q.y);t.seconds(.3);t.host.fire('pointerdown',{pointerType:'mouse',button:0});assert.equal(g.kills,2,'a click beside misses');t.host.fire('pointerup',{pointerType:'mouse'});
 assert.ok(t.layer.mode==='run');
 // holding the button keeps firing at the pointer
 g.enemies.length=0;stand();g.enemies.push(enemy(45,.5,.2,5),enemy(46,.6,.1,6));q=P(.55,.15,5.5);t.move(q.x,q.y);t.seconds(.1);t.host.fire('pointerdown',{pointerType:'mouse',button:0});t.seconds(.6);assert.equal(g.kills,4,'a held button fires again and again');t.host.fire('pointerup',{pointerType:'mouse'});
 // the ULT: not without a charge, not without a target, then a salvo (E, the right button, the button of the bar)
 g.enemies.length=0;stand();t.host.fire('keydown',{key:'e'});assert.equal(g.kills,4);
 g.ult=100;g.ultCool=0;t.host.fire('keydown',{key:'e'});assert.equal(g.ult,100,'no target: no shot');
 g.enemies.push(enemy(50,0,0,6));t.frame();assert.ok(g.ultCool>0,'a shot with no target costs a short cooldown');g.ultCool=0;
 t.host.fire('pointerdown',{pointerType:'mouse',button:2});assert.equal(g.kills,5,'the right mouse button fires the ULT');assert.equal(g.ult,0);t.frames(5);
 g.ult=100;g.ultCool=0;g.enemies.push(enemy(51,0,0,6));t.ultBtn.fire('click');assert.equal(g.kills,6,'and the ULT button');
 // the boost: the button is held, the mode changes to one without it and back
 const b=runLayer({springs:false});b.layer.start();b.seconds(C.countdown+.3);const bg=b.layer.game;bg.gust.wait=99;bg.gates.forEach(x=>{x.state='passed';});
 b.host.fire('pointerdown',{pointerType:'mouse',button:0});b.state.boosted=true;b.seconds(.1);assert.equal(b.state.boosted,true,'the boost stays in MANUAL');
 bg.runTime=windowOf('CRUISE')+1;bg.gates.forEach(x=>{x.state='passed';});b.seconds(.1);assert.equal(bg.mode,'CRUISE');assert.equal(b.state.boosted,false,'no boost in CRUISE');
 bg.runTime=windowOf('GUIDED')+1;bg.gates.forEach(x=>{x.state='passed';});b.seconds(.2);assert.equal(bg.mode,'GUIDED');assert.equal(b.state.boosted,true,'the button is still held: the boost comes back in GUIDED');
 b.host.fire('pointerup',{pointerType:'mouse'});b.state.boosted=false;bg.runTime=windowOf('CRUISE',1)+1;b.seconds(.1);bg.runTime=windowOf('MANUAL',1)+1;bg.gates.forEach(x=>{x.state='passed';});b.seconds(.2);assert.equal(b.state.boosted,false,'a released button does not come back');
 // the overlay, the bar and the button must not reach the demo's boost
 assert.ok(t.overlay.fire('pointerdown',{}).stopped,'a press on the overlay does not boost');assert.ok(t.toggle.fire('pointerdown',{}).stopped);assert.ok(t.bar.fire('pointerdown',{}).stopped,'nor a press on the bar');
 // touch never boosts in the game, the mouse and Space still do
 assert.equal(t.layer.touchBlocksBoost,true);t.layer.exit();assert.equal(t.layer.touchBlocksBoost,false);
}
// ---- the end of a game, the best score, texts for a finger, a small card
{
 const t=runLayer({springs:false});t.layer.start();t.seconds(C.countdown+.3);t.layer.game.lives=1;const gate=core.nextGate(t.layer.game);gate.z=.01;t.layer.game.plane.x=gate.x+9;t.frame(.02);
 t.seconds(.1);assert.equal(t.layer.mode,'over');assert.equal(t.overlay.dataset.kind,'over');
 const buttons=t.overlay.findAll(n=>n.tagName==='BUTTON');assert.equal(buttons.length,2,'again and exit');assert.ok(buttons[0].classes.has('is-primary'));
 assert.ok(t.overlay.textContent.includes('ПОЛЁТ ЗАВЕРШЁН')&&/КУРСАНТ|ПИЛОТ|КОМАНДИР|АС/.test(t.overlay.textContent)&&t.overlay.textContent.includes('СБИТО'));
 t.setLang('en');assert.ok(t.overlay.textContent.includes('FLIGHT OVER')&&t.overlay.textContent.includes('AGAIN')&&t.overlay.textContent.includes('KILLS'),'the end screen follows the language');t.setLang('ru');
 t.host.fire('keydown',{key:'Enter'});assert.equal(t.layer.mode,'count','Enter starts another game');
 t.host.fire('keydown',{key:'Escape'});assert.equal(t.layer.mode,'demo');assert.ok(!t.host.classes.has('is-game')&&t.hud.hidden&&t.overlay.hidden&&t.caption.hidden&&t.bar.hidden&&t.tip.hidden&&t.toggle.hidden);assert.ok(!t.layer.engaged);
 t.frames(500);assert.equal(t.layer.active,false,'the aircraft and the camera are back, the demo runs at its own speed');assert.equal(t.layer.plane.scale,1);assert.equal(t.layer.plane.x,0);assert.equal(t.layer.camera.active,false);
 t.host.fire('keydown',{key:'Escape'});assert.equal(t.layer.mode,'demo','Esc in the demo does nothing');
 t.host.fire('keydown',{key:'e'});t.host.fire('keydown',{key:'2'});assert.equal(t.layer.mode,'demo','the game keys do nothing in the demo');
 t.layer.start();t.toggle.fire('click');assert.equal(t.layer.mode,'demo','the button of the header leaves the game');
 // a whole game ends in the end screen, and the exit button works at any time
 const full=runLayer({springs:false});full.host.fire('keydown',{key:'Enter'});assert.equal(full.layer.mode,'count');let guard=0;while(full.layer.mode!=='over'&&guard++<60*400)full.frame(1/60);
 assert.equal(full.layer.mode,'over','a game with no pilot ends');full.overlay.findAll(n=>n.tagName==='BUTTON')[1].fire('click');assert.equal(full.layer.mode,'demo','the exit button of the end screen');
 // the best score is kept
 const b=runLayer();b.layer.start();b.frames(Math.ceil((C.countdown+.2)*60));
 b.layer.game.score=450;b.layer.game.lives=1;const g=b.layer.game,gt=core.nextGate(g);gt.z=.01;g.plane.x=gt.x+9;b.frame(.02);
 assert.equal(b.layer.mode,'over');assert.equal(Number(b.mem[core.BEST_KEY]||0),450,'the best score is written: '+b.mem[core.BEST_KEY]);
 // storage that throws must not break the game
 const blocked=runLayer({storageBlocked:true});blocked.host.fire('keydown',{key:'Enter'});blocked.frames(300);assert.equal(blocked.layer.mode,'run');
 // a touch screen gets texts for a finger, not for a mouse and keys
 const touch=runLayer({coarse:true,lang:'en'});touch.layer.start();touch.host.fire('pointerdown',{pointerType:'touch',button:0,pointerId:1});assert.ok(touch.caption.textContent.includes('finger')&&!touch.caption.textContent.includes('Esc'),'finger hint on a touch screen');
 touch.seconds(C.countdown+.3);assert.ok(/finger/.test(touch.tip.textContent)&&!/LMB|cursor/.test(touch.tip.textContent),'the tip of MANUAL speaks of a finger: '+touch.tip.textContent);
 touch.layer.pause('hidden');assert.ok(touch.overlay.textContent.includes('Touch the card'),'touch pause hint');
 // a card that is too small still gives the aircraft and the gates a box
 const small=runLayer({width:300,height:240});small.layer.start();small.frames(10);assert.ok(small.layer.game.fieldX>=1.6&&small.layer.game.gateY>=.45);
 assert.ok(small.host.classes.has('is-narrow'),'a narrow card drops the readouts');
}

// ---------------------------------------------------------------- the demo hooks and the page
const demo=read('js/site/flight-demo.js'),page=read('index.html'),css=read('css/flight-game.css'),layerSrc=read('js/site/flight-game.js'),coreSrc=read('js/site/flight-game-core.js');
for(const needle of ['window.AtlasFlightDemo','layer: null','hooks.layer.steer(dt)','hooks.layer.update(dt)','hooks.layer.drawBack(ctx)','hooks.layer.drawFront(ctx)','hooks.layer.cameraBegin(ctx)','hooks.layer.cameraEnd(ctx)','cameraOwnsHorizon','lay.horizonShift','pl.alpha','lay.status()','hooks.layer.onView(false)','touchBlocksBoost','hooks.layer.active?12:30','const placed=p=>'])
 assert.ok(demo.replace(/\s+/g,' ').includes(needle),'the demo has the hook: '+needle);
assert.ok(!/project\(rotate\(/.test(demo),'every vertex of the aircraft goes through placed()');
const scripts=[...page.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]),at=n=>scripts.findIndex(s=>s.startsWith(n));
assert.ok(at('js/site/flight-demo.js?v=flight-game-')>=0&&at('js/site/flight-game-core.js?v=flight-game-')>at('js/site/flight-demo.js')&&at('js/site/flight-game.js?v=flight-game-')>at('js/site/flight-game-core.js'),'the demo, then the rules, then the layer; new cache tags');
assert.ok(page.includes('css/flight-game.css?v=flight-game-'),'the stylesheet is linked');
const tags=[...page.matchAll(/flight-game(?:-core)?\.(?:js|css)\?v=(flight-game-\d+)|flight-demo\.js\?v=(flight-game-\d+)/g)].map(m=>m[1]||m[2]);assert.ok(tags.length===4&&new Set(tags).size===1,'one cache tag for the four files of the game: '+tags);
assert.equal([...page.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)].length,0,'no inline script was added to the home page');
for(const id of ['flightPlayground','flightCanvas','simRoll','simPitch','simYaw','simSpeed','simThrottle','simMotionState'])assert.ok(page.includes(`id="${id}"`),'the card keeps #'+id);
assert.ok(page.includes('class="scope-dots"')&&page.includes('flight-instructions')&&page.includes('class="hero-display"')&&page.includes('scope-grid'),'the layer finds the header, the dots, the grid and the hint line');
for(const sel of ['.game-toggle','.game-dwell','.game-hud','.game-score','.game-meta','.game-lives','.game-time','.game-overlay','.game-panel','.game-count','.game-count-box','.game-hint','.game-title','.game-row','.game-btn','.game-flash','.game-live','.game-caption','.scope-actions',
  '.game-bar','.game-modes','.game-mode','.game-mode-fill','.game-mode-left','.game-ult','.game-ult-meter','.game-landing','.game-tip','.is-active','.is-next','.is-on','.is-ready','.is-denied','.is-game','.is-hit','.is-narrow','prefers-reduced-motion','[hidden]','[data-kind="count"]'])assert.ok(css.includes(sel),'style '+sel);
assert.ok(!css.includes('.game-pip'),'the pulsing "play" pip is gone with the button');
assert.ok(!/@import|url\(http/.test(css),'the stylesheet loads nothing from outside');
// everything the layer builds is plain DOM: no inline handlers, no HTML strings, no eval
assert.ok(!/innerHTML|insertAdjacentHTML|eval\(|new Function|document\.write|onclick=/.test(layerSrc+coreSrc),'no HTML injection in the game');
assert.ok(!/generated|сгенерир|згенерова/i.test(layerSrc+css+coreSrc),'no "generated" wording');
assert.ok(!/MAVLink\.|WebSocket|fetch\(|XMLHttpRequest|navigator\.(usb|serial)/.test(layerSrc+coreSrc),'the game never talks to a controller or the network');

// ---------------------------------------------------------------- the texts
const textBlock=layerSrc.slice(layerSrc.indexOf('const TEXT = {'),layerSrc.indexOf('const lang = '));
const TEXT=vm.runInNewContext('('+textBlock.slice(textBlock.indexOf('{'),textBlock.lastIndexOf('}')+1)+')');
assert.deepEqual(Object.keys(TEXT).sort(),['en','ru','uk']);
const keys=Object.keys(TEXT.ru).sort();
for(const lang of ['uk','en']){assert.deepEqual(Object.keys(TEXT[lang]).sort(),keys,'the same texts in '+lang);}
const tipKeys=['tipMANUAL','tipCRUISE','tipGUIDED','tipAUTO','tipFinale','tipGust','tipHazard','tipEnemy','tipUlt','tipMANUALTouch','tipGUIDEDTouch','tipAUTOTouch','tipFinaleTouch','tipGustTouch','tipEnemyTouch','tipUltTouch'];
for(const lang of ['ru','uk','en']){
 const t=TEXT[lang];
 for(const k of keys)assert.ok(k==='ranks'?Array.isArray(t.ranks)&&t.ranks.length===4&&t.ranks.every(x=>x.length>2):typeof t[k]==='string'&&t[k].length>0,k+' in '+lang);
 for(const k of ['caption','caption2','captionTouch','caption2Touch'])assert.equal((t[k].match(/\*/g)||[]).length%2,0,'balanced emphasis in '+k+' ('+lang+')');
 for(const k of ['liveOver','liveWon'])assert.ok(t[k].includes('{score}')&&t[k].includes('{gates}'),'placeholders of the end announcement '+k+' ('+lang+')');
 for(const k of ['dwell','dwellTouch'])assert.ok(t[k].includes('{n}')&&t[k].length<=40,'the count of the hold has its number and fits the middle of the card: '+k+' ('+lang+') '+t[k].length);
 assert.ok(t.exit.length<=7,'button words stay short ('+lang+')');assert.ok(!('play' in t)&&!('buttonStart' in t)&&!('modeLabel' in t),'no words for a start button or for mode buttons ('+lang+')');
 for(const k of tipKeys)assert.ok(t[k]&&t[k].length<=64,'a tip fits one line of the card: '+k+' ('+lang+') '+(t[k]||'').length);
 for(const k of tipKeys.filter(x=>/Touch$/.test(x)))assert.ok(!/\bE\b|ПКМ|RMB|ЛКМ|LMB|клавіш|клавиш|\bkeys?\b|курсор|cursor/.test(t[k].replace(/ULT|CRUISE|GUIDED/g,'')),'the touch tips name no keys and no mouse: '+k+' ('+lang+')');
 assert.ok(/курсор|cursor/i.test(t.tipMANUAL)&&/курсор|cursor/i.test(t.tipGUIDED)&&/MANUAL/.test(t.tipMANUAL)&&/CRUISE/.test(t.tipCRUISE)&&/GUIDED/.test(t.tipGUIDED)&&/AUTO/.test(t.tipAUTO)&&/AUTOLAND/.test(t.tipFinale),'every mode tip names its mode ('+lang+')');
 assert.ok(/ЛКМ|LMB/.test(t.tipAUTO)&&/ULT/.test(t.tipEnemy)&&/ULT/.test(t.tipUlt),'the tips name the gun and the ULT ('+lang+')');
 for(const g of ['gradePerfect','gradeGood','gradeHard'])assert.ok(t[g]);
 assert.ok(!/кнопк[аиу]\s+(старт|игр)|start button/i.test(Object.values(t).flat().join(' ')),'no words about a start button ('+lang+')');
}
assert.ok(/[а-яё]/i.test(TEXT.ru.over)&&/[іїєґ]/i.test(TEXT.uk.accuracy+TEXT.uk.over+TEXT.uk.streak),'Russian and Ukrainian are not mixed up');
assert.ok(!/[ыэёъ]/i.test(Object.values(TEXT.uk).flat().join(' ')),'no Russian-only letters in the Ukrainian texts');
assert.ok(Object.values(TEXT.en).flat().every(x=>!/[а-яіїєґ]/i.test(x)),'English texts are English');
console.log('PASS: mini-game — hold the pointer seven seconds to start, the aircraft follows the pointer, the plan of modes (MANUAL, CRUISE, GUIDED, AUTO), perspective rings with an aim ring, pylons, other aircraft, the gun, the ULT, the five-minute mission and the AUTOLAND finale, camera, best score, the card layer in a stub DOM, demo hooks, page wiring and ru/uk/en texts.');
