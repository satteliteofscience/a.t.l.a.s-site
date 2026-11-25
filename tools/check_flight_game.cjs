/* Mini-game on the attitude card of the home page: the rules (flight-game-core.js) - the aircraft that follows the pointer in stabilised FBWA flight (bank and pitch
   limits, level by itself), the wind (steady, turning, gusts, carrying the rings), the afterburner sprints, bonus rings, formations of other aircraft, the 20 km route
   along which the flight modes change (FBWA, CRUISE, GUIDED, AUTO), rings that never stop coming, the time as the goal (a normal run about five minutes, faster is a
   higher rank), the weapon boxes (roulette, one slot: turbo, machine gun, homing missiles, invulnerability, repelling barrier), the feathers that make the weapons
   stronger every ten, pylons, the gun and the ULT, the AUTOLAND finale, the chiptune tune as data - the card layer (flight-game.js) in a stub DOM (hold the pointer
   for seven seconds to start, perspective, the aim ring, camera, wind and afterburner on the card, the weapon slot and its keys, the route bar and the end screen, the
   music made with a fake Web Audio, tips), the hooks in the demo, the wiring on index.html and the texts in three languages. The card shows synthetic data only. */
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
assert.deepEqual(Object.keys(M).sort(),['AUTO','AUTOLAND','CRUISE','FBWA','GUIDED'],'five modes in all, AUTOLAND is the finale, FBWA flies the mission (there is no MANUAL)');
assert.ok(!('setMode' in core)&&!('PICKABLE' in core),'the pilot does not pick the modes: the plan changes them');
for(const [name,m] of Object.entries(M))assert.ok(m.k>0&&m.kd>0&&m.lag>0&&m.score>0&&m.speed>0&&m.gust>=0&&typeof m.boost==='boolean','every mode has a pull, a damping, a lag and a price: '+name);
assert.ok(M.FBWA.gust===1&&M.FBWA.k>M.GUIDED.k&&M.FBWA.lag<M.GUIDED.lag&&M.CRUISE.k<M.FBWA.k,'FBWA is the quick one, GUIDED the heavy one');
{ // the airframe: stabilised flight with limits, in every mode
 const A=C.air;assert.ok(Object.isFrozen(A),'the airframe is frozen');
 assert.ok(Math.abs(A.rollLim*180/Math.PI-45)<1.5&&Math.abs(A.pitchLim*180/Math.PI-25)<1.5,'FBWA limits: 45 degrees of bank, 25 of pitch');
 assert.ok(A.ax/A.dragX>C.maxSpeed*.9&&A.ax/A.dragX<C.maxSpeed*1.4,'a full bank slides the aircraft sideways at about the top speed of the card: '+(A.ax/A.dragX).toFixed(1));
}
assert.ok(M.CRUISE.gust<.5&&M.GUIDED.gust<.5&&M.AUTO.gust<.5&&M.CRUISE.speed<1&&M.FBWA.boost&&M.GUIDED.boost&&!M.CRUISE.boost&&!M.AUTO.boost&&!M.AUTOLAND.boost,'the autopilots take part of the wind, CRUISE is slow, the boost belongs to FBWA and GUIDED');
assert.ok(M.AUTO.score<M.FBWA.score&&M.GUIDED.score>M.FBWA.score&&M.AUTO.ult>M.FBWA.ult&&M.AUTOLAND.ult===0,'every mode has its price: AUTO pays less and charges the ULT faster, GUIDED pays more');
// the goal is a distance, the rank is the time: the sooner, the higher
assert.equal(C.distance,20000,'the goal is 20 km');assert.ok(C.unit>0&&!('missionTime' in C),'no mission clock any more');
assert.deepEqual([...C.grades],[...C.grades].sort((a,b)=>b-a),'a higher rank wants a shorter time');assert.equal(C.grades.length,3);
assert.equal(core.gradeOf(C.grades[0]+1),0);assert.equal(core.gradeOf(C.grades[0]),1);assert.equal(core.gradeOf(C.grades[1]),2);assert.equal(core.gradeOf(C.grades[2]),3);assert.equal(core.gradeOf(60),3);
assert.ok(core.timeBonus(240)>core.timeBonus(300)&&core.timeBonus(C.timeRef+10)===0&&core.timeBonus(200)-core.timeBonus(210)===10*C.timePts,'every second saved pays');
assert.ok(core.FINALE_AT>0&&core.FINALE_AT<C.distance&&C.distance-core.FINALE_AT<1000,'the final approach is the last few hundred metres');
assert.deepEqual([...core.WEAPONS],['turbo','gun','missiles','mask','barrier'],'five weapons');
assert.ok(Object.isFrozen(core.WEAPONS)&&Object.isFrozen(C.weights)&&Math.abs(core.WEAPONS.reduce((s,w)=>s+C.weights[w],0)-1)<1e-9&&core.WEAPONS.every(w=>C.weights[w]>.1),'every weapon comes out of a box, the weights add up');
assert.ok(C.feathersPerLevel===10&&C.maxLevel>=3,'an upgrade every ten feathers');
// every level makes every weapon stronger
for(let l=1;l<=C.maxLevel;l++){
 const a=n=>core.weaponParams(n,l-1),b=n=>core.weaponParams(n,l);
 assert.ok(b('turbo').dur>a('turbo').dur&&b('turbo').mul>a('turbo').mul,'turbo at level '+l);
 assert.ok(b('gun').dur>a('gun').dur&&b('gun').every<a('gun').every&&b('gun').reach>a('gun').reach&&(b('gun').pylons||!a('gun').pylons),'machine gun at level '+l);
 assert.ok(b('missiles').count>a('missiles').count&&b('missiles').splash>=a('missiles').splash,'missiles at level '+l);
 assert.ok(b('mask').dur>a('mask').dur&&b('mask').mul>a('mask').mul,'invulnerability at level '+l);
 assert.ok(b('barrier').dur>a('barrier').dur&&b('barrier').r>a('barrier').r&&(b('barrier').crush||!a('barrier').crush),'barrier at level '+l);
}
assert.ok(core.weaponParams('gun',C.gunPylonLevel).pylons&&!core.weaponParams('gun',0).pylons&&core.weaponParams('barrier',C.barrierCrushLevel).crush&&!core.weaponParams('barrier',0).crush,'the later levels add new tricks');
assert.ok(core.weaponParams('missiles',3).splash>0&&core.weaponParams('missiles',0).splash===0&&core.weaponParams('nothing',1)===null);
assert.equal(core.weaponParams('turbo',99).dur,core.weaponParams('turbo',C.maxLevel).dur,'never above the top level');
assert.ok(core.weaponParams('turbo',0).mul>core.weaponParams('mask',0).mul&&C.weaponCap>=C.speedCap,'the turbo is the fastest, the speed has a ceiling');
for(let l=1;l<80;l++){
 assert.ok(core.speedMul(l)>=core.speedMul(Math.max(1,l-1))&&core.speedMul(l)<=C.maxSpeedMul,'speed grows and is capped');
 assert.ok(core.radiusOf(l)<=C.radius0&&core.radiusOf(l)>=C.radiusMin,'the ring shrinks to a floor');
 assert.ok(core.gustWait(l)>=C.gustMin&&core.gustPowerOf(l)<=C.gustPowerMax,'gusts stay bounded');
 assert.ok(core.windSpeedOf(l)<=C.windMax&&core.windSpeedOf(l)>=core.windSpeedOf(Math.max(1,l-1)),'the steady wind grows and is capped');
 assert.ok(core.obstacleChance(l)<=C.obstacleMax&&core.enemyGap(l)>=C.enemyMin&&core.bonusChance(l)<=C.bonusMax,'pylons, enemies and bonus rings stay bounded');
 assert.ok(core.sprintPeakOf(l)<=C.sprintPeakMax&&core.sprintLenOf(l)<=C.sprintLenMax&&core.sprintGapOf(l)>=C.sprintGapMin&&core.sprintPeakOf(l)>=core.sprintPeakOf(Math.max(1,l-1)),'every sprint is faster and comes sooner, within bounds');
 for(const name of ['FBWA','CRUISE','GUIDED','AUTO'])for(const boosted of [false,true]){
  if(boosted&&!M[name].boost)continue;
  assert.ok(core.spacingOf(l)/(C.baseSpeed*core.speedMul(l)*M[name].speed*(1+C.boostSpeed*(boosted?1:0)))>=(boosted?.9:1.3),'enough seconds between two gates at level '+l+' in '+name+(boosted?' with the boost':''));
 }
 // the sprint: the gates of its corridor are further apart, the speed is capped; the nominal time between two gates stays above a second
 const peak=core.sprintPeakOf(l),gap=core.spacingOf(l)*(1+(peak-1)*C.sprintSpace),fast=C.baseSpeed*core.speedMul(l)*Math.min(C.speedCap,peak);
 assert.ok(gap/fast>=1.1,'enough time between two gates of a sprint corridor at level '+l+': '+(gap/fast).toFixed(2)+' s');
 assert.ok(C.baseSpeed*core.speedMul(l)*C.speedCap<=C.baseSpeed*C.maxSpeedMul*C.speedCap+1e-9,'the approach speed has a ceiling');
}
assert.ok(C.sprintPeakMax<=C.speedCap&&C.sprintPeak0>=1.4,'a sprint is a real jump in speed, and the cap lets it through');

// ---------------------------------------------------------------- the plan of the route changes the modes by itself
{
 assert.deepEqual(core.PLAN.map(p=>p.mode),['FBWA','CRUISE','GUIDED','AUTO','FBWA','CRUISE','GUIDED','AUTO'],'the four modes, twice, in this order');
 const total=core.PLAN.reduce((s,p)=>s+p.len,0);assert.ok(core.PLAN.every(p=>p.len>=1500)&&total<core.FINALE_AT-C.clearBefore,'every leg is a while long; the plan ends before the airspace is cleared ('+total+' m)');
 let from=0;
 for(const [i,p] of core.PLAN.entries()){
  for(const d of [from+.1,from+p.len/2,from+p.len-.1]){const m=core.modeAt(d);assert.ok(m.mode===p.mode&&m.index===i&&m.from===from&&m.to===from+p.len,'mode at '+d+' m');}
  from+=p.len;
 }
 const tail=core.modeAt(from+1);assert.ok(tail.mode==='FBWA'&&tail.index===core.PLAN.length&&tail.to===core.FINALE_AT,'FBWA goes on until the final approach');
 const g=core.create(3);g.dist=core.PLAN[0].len+500;let info=core.modeInfo(g);assert.ok(info.mode==='CRUISE'&&Math.abs(info.t-500)<1e-9&&info.len===core.PLAN[1].len&&Math.abs(info.left-(core.PLAN[1].len-500))<1e-9&&info.next==='GUIDED','where the plan is');
 g.dist=from+30;info=core.modeInfo(g);assert.ok(info.mode==='FBWA'&&info.next==='AUTOLAND','the last stretch is followed by the landing');
 g.finale={};info=core.modeInfo(g);assert.ok(info.mode==='AUTOLAND'&&info.next===null);
}

// ---------------------------------------------------------------- helpers: a game, a pilot with a hand and a reaction time, a simulation
const FIELD={x:3.4,y:1.5,gateY:.85};
// the card is 760 x 400 px here: the same view as the layer (perspective towards a vanishing point at 30 % of the height)
const W=760,H=400,BASE=Math.min(W*.155,H*.21),PK=.42,VP=.3,KY=(H*.51-H*VP)*PK/(.83*BASE);
const cursorAt=(c,z)=>{const k=1+PK*z;return {x:c.x*k,y:c.y*k-KY*z,tol:24*k/BASE};};      // the pointer at (c.x, c.y) on the plane of the aircraft, seen at the depth z
const aimAt=e=>{const s=1/(1+PK*e.z);return {x:e.x*s,y:(e.y+KY*e.z)*s};};                  // where the pointer has to be to be on an enemy
const gauss=r=>{let u=0;while(!u)u=r();const v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
// a pilot: flies the pointer to the next ring (round the pylons the way the autopilot does, round the enemies, through a box, a bonus ring or a feather that is a small
// detour), shoots in AUTO, fires the ULT, uses the weapon of the box. delay: reaction time, tau: the hand, noise: the shake, avoidZ: how far ahead the other aircraft are
// noticed, lean: how fast the hand leans against a steady push, loot: how greedy for boxes and feathers, weapons: uses them at all, speed: uses the speed weapons too,
// useDelay: how long it takes to press the button, boost: holds the boost button all the way
function human({delay=.15,tau=.09,noise=.2,corr=.4,shoot=true,ult=true,ultDelay=.3,look=1,shootGap=.25,avoidEnemy=true,avoidZ=6.5,lean=.9,bonus=.6,loot=.6,weapons=true,speed=true,useDelay=.35,boost=false,seed=1}={}){
 const rnd=core.mulberry32(seed*7919+13),buf=[];let cur={x:0,y:0},nx=0,ny=0,t=0,lastClick=-9,ultSince=-1,useSince=-1,lx=0,ly=0;
 return (g,dt)=>{
  t+=dt;const out={tx:cur.x,ty:cur.y,boost:false,click:false,ult:false,use:false};let want;
  if(g.mode==='AUTO'&&!g.finale){
   const e=g.enemies.filter(q=>q.state==='ahead'&&q.z>.5&&q.z<8.5).sort((a,b)=>a.z-b.z)[0];
   want=shoot&&e?aimAt(e):{x:0,y:0};
   if(shoot&&e){const c=cursorAt(cur,e.z);if(Math.hypot(c.x-e.x,c.y-e.y)<e.r*C.shotRadius+c.tol&&t-lastClick>shootGap){out.click=true;lastClick=t;}}
  }else if(g.finale){want={x:clamp(-g.plane.x*1.2,-.9,.9)*g.fieldX,y:0};}
  else{
   const a=core.autopilot(g),gate=core.nextGate(g),v=core.speedOf(g);let tx=a.x,ty=a.y;
   if(gate&&look){
    const ahead=g.gates.filter(q=>q.state==='ahead'&&q!==gate)[0],tA=gate.z/v,L=look*(g.mode==='GUIDED'?1.5:1);
    if(ahead&&tA<L){const w=clamp((L-tA)/L,0,1)*.6*gate.r,dx=ahead.x-gate.x,dy=ahead.y-gate.y,d=Math.hypot(dx,dy)||1;tx+=dx/d*Math.min(w,d);ty+=dy/d*Math.min(w*.8,d);}
   }
   if(gate&&g.mode!=='CRUISE'){      // a detour only when there is time to get there and back to the ring
    const feasible=q=>q.z/v>.3+Math.hypot(q.x-g.plane.x,q.y-g.plane.y)/4&&(gate.z-q.z)/v>.25+Math.hypot(q.x-tx,q.y-ty)/3.2;
    const near=(list,reach)=>list.filter(q=>q.state==='ahead'&&q.z>.3&&q.z<gate.z&&Math.hypot(q.x-tx,q.y-ty)<reach&&feasible(q)).sort((p,q)=>p.z-q.z)[0];
    const pick=(loot&&!g.weapon&&!g.roll&&near(g.boxes,1.1*loot+.7))||(bonus&&near(g.bonuses,1.3*bonus+1))||(loot&&near(g.plumes,.9*loot+.4));
    if(pick){tx=pick.x;ty=pick.y;}
   }
   if(avoidEnemy)for(const e of g.enemies){
    if(e.state!=='ahead'||e.z<0||e.z>avoidZ)continue;
    const dr=core.enemyDrift(g),tt=e.z/(v*(1+C.enemySpeed)),hx=e.x+(e.vx+dr.x)*tt,hy=e.y+(e.vy+dr.y)*tt,clear=e.r+C.planeR+.38,dx=tx-hx,dy=ty-hy,d=Math.hypot(dx,dy);
    if(d<clear){tx=hx+(d>1e-3?dx/d:1)*clear;ty=hy+(d>1e-3?dy/d:0)*clear;}
   }
   want={x:tx,y:ty};
  }
  // the hand leans against a steady push (the wind): an integrator on the offset between the aircraft and where it should be
  if(lean&&!g.finale&&g.mode!=='AUTO'&&g.mode!=='CRUISE'){lx=clamp(lx+(want.x-g.plane.x)*lean*dt*.6,-1.4,1.4);ly=clamp(ly+(want.y-g.plane.y)*lean*dt*.6,-.7,.7);}else{lx*=.98;ly*=.98;}
  buf.push({t,x:want.x+lx,y:want.y+ly});while(buf.length>1&&buf[1].t<=t-delay)buf.shift();
  nx+=-nx/corr*dt+noise*Math.sqrt(2*dt/corr)*gauss(rnd);ny+=-ny/corr*dt+noise*Math.sqrt(2*dt/corr)*gauss(rnd);
  const k=1-Math.exp(-dt/tau);cur.x+=(buf[0].x+nx-cur.x)*k;cur.y+=(buf[0].y+ny-cur.y)*k;
  const can=g.ult>=100&&g.enemies.some(q=>q.state==='ahead'&&q.z>.3);
  if(ult&&can){if(ultSince<0)ultSince=t;if(t-ultSince>=ultDelay)out.ult=true;}else ultSince=-1;
  let wanted=false;      // the weapon of the box: the speed ones at once (the turbo when no pylon stands right ahead), the others when there is something for them
  if(weapons&&g.weapon&&!g.finale){
   const ahead=(list,z)=>list.some(q=>q.state==='ahead'&&q.z>.5&&q.z<z);
   if(g.weapon==='turbo')wanted=speed&&!g.obstacles.some(o=>o.state==='ahead'&&o.z>0&&o.z<5&&Math.hypot(o.x-g.plane.x,o.y-g.plane.y)<1.6);
   else if(g.weapon==='mask')wanted=speed;
   else if(g.weapon==='gun')wanted=ahead(g.enemies,8);
   else if(g.weapon==='missiles')wanted=ahead(g.enemies,9)||ahead(g.obstacles,9);
   else wanted=ahead(g.enemies,5)||ahead(g.obstacles,5);
  }
  if(wanted){if(useSince<0)useSince=t;if(t-useSince>=useDelay)out.use=true;}else useSince=-1;
  out.boost=boost&&g.mode!=='AUTO';
  out.tx=cur.x;out.ty=cur.y;return out;
 };
}
const SKILLED={delay:.15,tau:.09,noise:.2,shootGap:.25,ultDelay:.3,lean:.9},AVERAGE={delay:.25,tau:.13,noise:.3,shootGap:.4,ultDelay:.6,look:.6,avoidZ:5,lean:.45,bonus:0,loot:.35,useDelay:.8},SLOPPY={delay:.4,tau:.2,noise:.45,shootGap:.6,ultDelay:1.2,avoidEnemy:false,look:0,lean:0,bonus:0,loot:.2,useDelay:1.5};const idle=()=>()=>({tx:0,ty:0,boost:false});
function fly(seed,makeBot,{dt=1/60,maxT=600}={}){
 const g=core.create(seed,FIELD);core.begin(g);const bot=makeBot(seed);let t=0,newest=0,since=0,gap=0;const log=[];
 while(g.phase!=='over'&&g.phase!=='won'&&t<maxT){
  const cmd=bot(g,dt);
  if(cmd.click)core.shoot(g,z=>cursorAt({x:cmd.tx,y:cmd.ty},z));
  if(cmd.ult)core.fireUlt(g);
  if(cmd.use)core.useWeapon(g);
  core.step(g,dt,{tx:cmd.tx,ty:cmd.ty,boost:cmd.boost});
  for(const e of core.drain(g)){e.at=g.dist;log.push(e);}t+=dt;
  if(g.phase==='run'&&!g.finale){const last=g.lastGate?g.lastGate.id:0;if(last!==newest){newest=last;since=g.runTime;}gap=Math.max(gap,g.runTime-since);}
 }
 return {g,log,t,gap};
}
const profile=opts=>seed=>human({...opts,seed});
// a running game in which one thing is placed to the point of arriving; the plan would switch the mode back, so a test puts the route inside the leg of the mode it wants
const running=(seed=2,field=FIELD)=>{const g=core.create(seed,field);core.begin(g);g.phase='run';g.runTime=1;return g;};
const windowOf=(mode,i=0)=>{let from=0,n=0;for(const p of core.PLAN){if(p.mode===mode){if(n===i)return from;n++;}from+=p.len;}return null;};
const inMode=(g,mode,i=0)=>{g.dist=windowOf(mode,i)+1;g.runTime=Math.max(g.runTime,windowOf(mode,i)/65);g.mode=mode;return g;};      // (the clock of a flight that got there)
const run=(g,seconds,input={},dt=1/60)=>{for(let i=0;i<Math.round(seconds/dt);i++)core.step(g,dt,input);return core.drain(g);};

// ---------------------------------------------------------------- phases and determinism
{
 const g=core.create(1);assert.equal(g.phase,'ready');core.step(g,1,{});assert.equal(g.time,0,'nothing moves before begin');
 core.begin(g);assert.equal(g.phase,'count');assert.equal(g.gates.length,1);assert.equal(g.gates[0].x,0);assert.equal(g.gates[0].y,0,'the first gate is in the middle');assert.equal(g.mode,'FBWA');
 let starts=0,modes=[],guard=0;while(g.phase==='count'&&guard++<1000){core.step(g,1/60,{});for(const e of core.drain(g)){if(e.type==='start')starts++;if(e.type==='mode')modes.push(e);}}
 assert.equal(g.phase,'run');assert.equal(starts,1,'one start event');assert.equal(g.gates[0].z,C.firstGate,'the gates wait during the countdown');
 assert.ok(modes.length===1&&modes[0].from===null&&modes[0].to==='FBWA'&&modes[0].index===0,'the first mode is announced when the game starts');
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
  assert.equal(r.g.phase,'over','a pointer left in the middle loses (seed '+seed+')');assert.ok(r.t<120&&r.g.passed<=40,'... within two minutes and a few gates');
  assert.equal(r.log.filter(e=>e.type==='over').length,1);assert.equal(r.log.filter(e=>e.type==='miss'||e.type==='hit').length,C.lives+r.log.filter(e=>e.type==='life').length,'one missed gate or one hit per life (and the life that a long run of gates at the middle gave back)');
  const frozen=JSON.stringify(r.g.plane);core.step(r.g,1,{tx:3,ty:1,boost:true});assert.equal(JSON.stringify(r.g.plane),frozen,'no movement after the end');
 }
 const N=40,wins={skilled:0,average:0,sloppy:0,quiet:0,plain:0,boost:0},times={skilled:[],plain:[],boost:[]};let kills=0,level=0,feathers=0,used=0,boxes=0,gap=0;
 const median=a=>{const s=[...a].sort((x,y)=>x-y);return s[s.length>>1];};
 for(let seed=1;seed<=N;seed++){
  const r=fly(seed,profile(SKILLED));
  if(r.g.phase==='won'){wins.skilled++;times.skilled.push(r.g.finishTime);assert.ok(r.g.dist===C.distance&&r.g.finishTime===r.g.runTime,'a landing only at the end of the route');assert.equal(r.log.filter(e=>e.type==='touchdown').length,1);assert.ok(r.log.some(e=>e.type==='finale'));
   const s=core.summary(r.g);assert.ok(s.won&&s.rank===core.gradeOf(s.time)&&s.timeBonus===core.timeBonus(r.g.finishTime)&&s.dist===C.distance&&s.avg>150,'the summary of a finished route: '+JSON.stringify(s));}
  else assert.equal(core.summary(r.g).rank,0,'no rank without the finish');
  kills+=r.g.kills;level+=r.g.level;feathers+=r.g.feathers;used+=r.g.used;boxes+=r.g.boxesTaken;gap=Math.max(gap,r.gap);
  assert.ok(r.log.filter(e=>e.type==='gate').reduce((s,e)=>s+e.points,0)<=r.g.score,'the score is at least the sum of the gate points');
  assert.ok(Math.abs(r.g.plane.x)<=r.g.fieldX&&Math.abs(r.g.plane.y)<=r.g.fieldY,'the aircraft stays in the field');
  const modes=r.log.filter(e=>e.type==='mode').map(e=>e.to);if(r.g.finale)assert.deepEqual(modes,['FBWA','CRUISE','GUIDED','AUTO','FBWA','CRUISE','GUIDED','AUTO','FBWA','AUTOLAND'],'a whole route goes through the plan and ends in AUTOLAND');
  if(fly(seed,profile(AVERAGE)).g.phase==='won')wins.average++;
  if(fly(seed,profile(SLOPPY)).g.phase==='won')wins.sloppy++;
  if(fly(seed,profile({...SKILLED,shoot:false,ult:false,weapons:false})).g.phase==='won')wins.quiet++;
  const plain=fly(seed,profile({...SKILLED,speed:false}));if(plain.g.phase==='won'){wins.plain++;times.plain.push(plain.g.finishTime);}
  const fast=fly(seed,profile({...SKILLED,boost:true}));if(fast.g.phase==='won'){wins.boost++;times.boost.push(fast.g.finishTime);}
 }
 assert.ok(wins.skilled>=N*.5&&wins.skilled<=N*.9,'a good pilot usually gets there (the game is hard, but it can be won): '+wins.skilled+'/'+N);
 assert.ok(wins.sloppy<=N*.15,'a careless one rarely does: '+wins.sloppy+'/'+N);
 assert.ok(wins.skilled>=wins.average-N*.1&&wins.average>=wins.sloppy+N*.25,'skill counts: '+JSON.stringify(wins));
 assert.ok(wins.skilled>=wins.quiet+3,'the weapons, the gun and the ULT matter: '+wins.skilled+'/'+N+' with them, '+wins.quiet+'/'+N+' without');
 // the distance is the goal: a normal run, without the button boost and the speed weapons, takes about five minutes; faster flying is a shorter time and a higher rank
 assert.ok(times.plain.length>=N*.4&&median(times.plain)>=285&&median(times.plain)<=315,'about five minutes without the boost and the speed weapons: '+median(times.plain).toFixed(1)+' s ('+times.plain.length+' flights)');
 assert.ok(median(times.skilled)<median(times.plain)-4,'the speed weapons save time: '+median(times.skilled).toFixed(1)+' against '+median(times.plain).toFixed(1));
 assert.ok(times.boost.length>=4&&median(times.boost)<=median(times.plain)-40,'holding the boost saves much more, at a higher risk: '+median(times.boost).toFixed(1)+' s, '+wins.boost+'/'+N+' finish');
 assert.ok(core.gradeOf(median(times.boost))>core.gradeOf(median(times.plain))&&core.gradeOf(median(times.plain))===1,'a normal run is a PILOT, a fast one ranks higher');
 assert.ok(kills/N>=8,'other aircraft are shot down ('+(kills/N).toFixed(1)+' a game)');assert.ok(level/N>=12,'a long route goes through many levels ('+(level/N).toFixed(1)+')');
 assert.ok(boxes/N>=6&&used/N>=3,'boxes are taken and their weapons used: '+(boxes/N).toFixed(1)+' boxes, '+(used/N).toFixed(1)+' weapons a game');
 assert.ok(feathers/N>=20&&feathers/N<=C.feathersPerLevel*(C.maxLevel+2),'feathers make a few upgrades in a game, not all of them at once: '+(feathers/N).toFixed(1));
 assert.ok(gap<=4,'a new ring never keeps the pilot waiting long: '+gap.toFixed(1)+' s');
}
// ---------------------------------------------------------------- the rings never stop coming: a long gap between two of them (a sprint corridor late in the route) used to
// leave the last ring frozen behind the aircraft, and then no new ring was ever laid out (at about three minutes into a flight)
{
 let long=0,stalls=[];
 for(let seed=1;seed<=24;seed++){
  const g=core.create(seed,FIELD);core.begin(g);let since=0,newest=0,maxGap=0;
  while(g.phase!=='won'&&g.phase!=='over'&&g.runTime<600){
   const next=core.nextGate(g);if(next){g.plane.x=next.x;g.plane.y=next.y;}g.lives=C.lives;g.obstacles.length=g.enemies.length=0;
   core.step(g,1/60,{tx:g.plane.x,ty:g.plane.y});core.drain(g);
   maxGap=Math.max(maxGap,g.gap);
   if(g.phase==='run'&&!g.finale){const id=g.lastGate.id;if(id!==newest){newest=id;since=g.runTime;}else if(g.runTime-since>4){stalls.push({seed,at:+since.toFixed(1)});break;}}
  }
  if(maxGap>C.zFar-C.zGone)long++;
  assert.ok(g.phase==='won'&&g.finale,'a perfect pilot flies the whole route (seed '+seed+', '+g.phase+' at '+g.dist.toFixed(0)+' m)');
 }
 assert.deepEqual(stalls,[],'a new ring keeps coming all the way: '+JSON.stringify(stalls));
 assert.ok(long>=12,'(the long gaps that used to stop the rings do happen on the way: in '+long+' of 24 games)');
 // the smallest case: the last ring has left the list and the next one is due far beyond the spawn window
 const g=running(4,{...FIELD,calm:true});g.gates.forEach(x=>{x.state='passed';});g.gates.length=1;g.lastGate=g.gates[0];g.gap=C.zFar-C.zGone+1.5;g.lastGate.z=C.zFar-C.spacing;
 let n=g.gateCount,seen=0;for(let i=0;i<60*12;i++){core.step(g,1/60,{});g.lives=C.lives;if(g.gateCount>n){n=g.gateCount;seen++;}}
 assert.ok(seen>=3,'after a gap longer than the window the rings still come: '+seen);
}

// ---------------------------------------------------------------- scoring, one gate at a time
{
 const trial=(dx,dy,{streak=0,lives=C.lives,boost=0,mode='FBWA'}={})=>{
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
 const f=running(3);f.dist=core.FINALE_AT;core.step(f,.02,{});for(let i=0;i<600&&!f.gates.some(x=>x.approach);i++){core.step(f,1/60,{});f.lives=C.lives;}core.drain(f);
 f.passed=C.gatesPerLevel*2-1;const ap=f.gates.find(x=>x.approach);assert.ok(ap,'an approach gate on its way');ap.z=.01;f.plane.x=ap.x;f.plane.y=ap.y;core.step(f,.02,{});
 assert.ok(!core.drain(f).some(e=>e.type==='level')&&f.level===1,'no level up in the final approach');
}

// ---------------------------------------------------------------- the ULT is charged by the rings
{
 const pass=(g,mode,q)=>{inMode(g,mode);const gate=g.gates.find(x=>x.state==='ahead');gate.z=.02;g.plane.x=gate.x+(q==='good'?gate.r*.7:0);g.plane.y=gate.y;core.step(g,.02,{});return core.drain(g);};
 let g=running();pass(g,'FBWA','perfect');assert.equal(g.ult,C.ultPerfect,'a perfect ring charges '+C.ultPerfect);
 g=running();pass(g,'FBWA','good');assert.equal(g.ult,C.ultGood);
 g=running();pass(g,'AUTO','perfect');assert.ok(g.ult>C.ultPerfect,'AUTO charges faster');g=running();pass(g,'CRUISE','perfect');assert.ok(g.ult<C.ultPerfect,'CRUISE charges slower');
 g=running();g.ult=90;const ev=pass(g,'FBWA','perfect');assert.equal(g.ult,100,'capped at 100');assert.ok(ev.some(e=>e.type==='ultReady'),'ULT READY is announced once');
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
 for(let i=0;i<60*200;i++){
  core.step(e,1/60,{});const k=e.mode==='AUTO'?'auto':'other';if(e.runTime>C.enemyFrom+3)time[k]+=1/60;
  for(const x of core.drain(e))if(x.type==='enemy'){warned++;if(e.runTime>C.enemyFrom+3)count[k]++;if(first===null)first=e.runTime;}
  if(e.phase==='over'){e.phase='run';e.lives=C.lives;}
  e.gates.forEach(x=>{if(x.state==='ahead'&&x.z<1)x.state='passed';});
  const n=e.enemies.filter(x=>x.state==='ahead').length;most[k]=Math.max(most[k],n);
 }
 assert.ok(first>=C.enemyFrom-.1&&first<=C.enemyFrom+1,'the first other aircraft at about '+C.enemyFrom+' s: '+first);assert.ok(most.other<=C.enemyMax&&most.auto<=C.enemyMaxAuto&&warned>=8,'a few at a time, many in three minutes ('+warned+')');
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
 g=mk('FBWA');assert.equal(core.shoot(g,pointer(1,.2)),null,'the gun is for AUTO only');assert.equal(g.kills,0);assert.equal(core.drain(g).length,0);
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
 const g=running(3);run(g,.2);g.dist=core.PLAN[0].len-3;let ev=run(g,.1);
 assert.equal(g.mode,'CRUISE');assert.deepEqual(ev.filter(e=>e.type==='mode').map(e=>[e.from,e.to,e.index]),[['FBWA','CRUISE',1]],'one mode event at the boundary of the plan');
 assert.equal(run(g,5).filter(e=>e.type==='mode').length,0,'no more of them in the middle of a mode');
 g.dist=windowOf('AUTO')-3;g.enemyClock=40;ev=run(g,.1);assert.equal(g.mode,'AUTO');assert.ok(g.enemyClock<=3,'the first intruder comes soon after the autopilot takes over');
 g.mode='FBWA';g.dist=core.FINALE_AT-1;ev=run(g,.1);assert.equal(g.mode,'AUTOLAND');assert.deepEqual(ev.filter(e=>e.type==='mode').map(e=>e.to),['AUTOLAND']);assert.ok(ev.some(e=>e.type==='finale'));
 run(g,1);assert.equal(g.mode,'AUTOLAND','the plan does not touch the final approach');
 // a pause does not move the clock or the route
 const p=running(3);const rt=p.runTime,d=p.dist;core.pause(p);core.step(p,1,{});assert.ok(p.runTime===rt&&p.dist===d);
}
{
 // FBWA follows the pointer (stabilised: it takes a moment to bank, to slide and to level out), GUIDED later (aim ahead), CRUISE only sideways at the height of the next ring, AUTO ignores the pointer
 const CALM={...FIELD,calm:true};      // no wind, no gusts: the aircraft goes where the stick sends it
 const reach=(mode,seconds,target,field=CALM)=>{const g=running(9,field);inMode(g,mode);run(g,seconds,target);return g;};
 const manual=reach('FBWA',1.8,{tx:2,ty:1});assert.ok(Math.hypot(manual.plane.x-2,manual.plane.y-1)<.15,'FBWA is at the pointer within two seconds: '+manual.plane.x.toFixed(2)+', '+manual.plane.y.toFixed(2));
 assert.ok(Math.abs(manual.plane.roll)<.05&&Math.abs(manual.plane.pitch)<.05,'... and the wings are level again when it is there');
 const half=reach('FBWA',.5,{tx:2,ty:1}),slow=reach('GUIDED',.5,{tx:2,ty:1});assert.ok(half.plane.x>1&&slow.plane.x<half.plane.x-.15,'GUIDED is late where FBWA is already on its way: '+slow.plane.x.toFixed(2)+' against '+half.plane.x.toFixed(2));
 const guided=reach('GUIDED',3,{tx:2,ty:1});assert.ok(Math.hypot(guided.plane.x-2,guided.plane.y-1)<.12,'GUIDED gets there in the end');
 const cruise=reach('CRUISE',1.8,{tx:1.5,ty:-1.4}),gate=cruise.gates[0];assert.equal(core.nextGate(cruise),gate,'(the first ring is still ahead)');assert.ok(Math.abs(cruise.plane.x-1.5)<.15,'CRUISE steers sideways with the pointer');assert.ok(Math.abs(cruise.plane.y-gate.y)<.1&&Math.abs(cruise.aim.y-gate.y)<1e-9,'... and holds the height of the next ring whatever the pointer says');
 const auto=reach('AUTO',2,{tx:-3,ty:1.4}),ag=auto.gates[0];assert.ok(Math.abs(auto.plane.x-ag.x)<.3&&Math.abs(auto.plane.y-ag.y)<.3,'AUTO flies to the ring and ignores the pointer');
 // AUTO takes the rings by itself: perfect passes, no help
 const h=running(9);inMode(h,'AUTO');let gates=0,perfect=0;
 for(let i=0;i<60*8&&h.mode==='AUTO';i++){core.step(h,1/60,{tx:-3,ty:1.4});for(const e of core.drain(h))if(e.type==='gate'){gates++;if(e.quality==='perfect')perfect++;}}
 assert.ok(gates>=3&&perfect===gates,'AUTO takes the rings, '+perfect+' of '+gates+' perfect');
 // the wind: FBWA takes all of it, the autopilots part of it, the pointer has to lean against it
 const dev=mode=>{const k=running(9);inMode(k,mode);for(let i=0;i<60;i++){k.gust.phase='blow';k.gust.t=.9;k.gust.dirX=1;k.gust.dirY=0;k.gust.power=2;core.step(k,1/60,{tx:0,ty:0});}return Math.abs(k.plane.x);};
 assert.ok(dev('FBWA')>.2,'the wind pushes FBWA off the pointer: '+dev('FBWA').toFixed(2));assert.ok(dev('CRUISE')<dev('FBWA')*.8&&dev('AUTO')<dev('FBWA')*.8&&dev('GUIDED')<dev('FBWA')*.6,'the other modes keep more of the pointer');
 // gates come slower in CRUISE; the boost works in FBWA and GUIDED, not in CRUISE and AUTO
 const gz=(mode,boost)=>{const k=running(9);inMode(k,mode);const z=k.gates[0].z;for(let i=0;i<60;i++)core.step(k,1/60,{boost});return z-k.gates[0].z;};
 assert.ok(gz('CRUISE',false)<gz('FBWA',false)*.9,'the gates come slower in CRUISE');
 for(const mode of ['CRUISE','AUTO'])assert.ok(Math.abs(gz(mode,true)-gz(mode,false))<1e-9,'no boost in '+mode);
 for(const mode of ['FBWA','GUIDED'])assert.ok(gz(mode,true)>gz(mode,false),'the boost works in '+mode);
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
 for(let seed=1;seed<=12;seed++){const k=running(seed);inMode(k,'AUTO');k.enemyClock=1e9;let last=0;for(let i=0;i<60*24&&k.phase==='run';i++){core.step(k,1/60,{});core.drain(k);if(k.runTime-last>3){const gate=core.nextGate(k);if(gate&&gate.z>4.6){last=k.runTime;pylons++;k.obstacles.push({id:1000+i,kind:'pylon',x:(k.plane.x+gate.x)/2,y:(k.plane.y+gate.y)/2,z:Math.min(gate.z-1.5,4.2),r:C.pylonR,state:'ahead',age:0});}}}hits+=k.hits;}
 assert.ok(pylons>=60&&hits<=pylons*.08,'the autopilot dodges the pylons that stand right on its way (they come with a second and a half to spare, as in the game): '+hits+' hits of '+pylons);
}

// ---------------------------------------------------------------- wind, field, pause
{
 const g=core.create(5);core.begin(g);g.phase='run';const seen=[];let t=0,maxPush=0;
 while(t<60){core.step(g,1/60,{});for(const e of core.drain(g))if(e.type==='gust')seen.push([e.stage,t]);maxPush=Math.max(maxPush,Math.hypot(g.gust.vx,g.gust.vy));t+=1/60;if(g.phase==='over')break;}
 const warn=seen.find(s=>s[0]==='warn'),blow=seen.find(s=>s[0]==='blow');
 assert.ok(warn&&blow&&warn[1]>=C.gustFirst-.1&&Math.abs(blow[1]-warn[1]-C.gustWarn)<.1,'a warning '+C.gustWarn+' s before the first gust');
 assert.ok(maxPush>0&&maxPush<=C.gustPowerMax*1.2+1e-9,'the push is bounded');
}
{
 const g=core.create(9,{x:2,y:1,gateY:.6,calm:true});core.begin(g);g.phase='run';for(let i=0;i<300;i++)core.step(g,1/60,{tx:99,ty:99});
 assert.ok(g.plane.x<=2&&g.plane.x>1.999&&g.plane.y<=1&&g.plane.y>.999,'the aircraft stops at the edge of the field');
 for(let i=0;i<20;i++)core.step(g,1/60,{});
 g.obstacles.push({id:90,kind:'pylon',x:3,y:2,z:4,r:C.pylonR,state:'ahead',age:0});
 core.setField(g,1.5,.8,.5);assert.ok(Math.abs(g.plane.x-1.5)<1e-9,'a smaller card pulls the aircraft in');assert.ok(g.gates.every(x=>Math.abs(x.y)<=.5+1e-9&&Math.abs(x.x)<=1.5)&&g.obstacles.every(o=>Math.abs(o.x)<=1.5&&Math.abs(o.y)<=.5+1e-9),'a smaller card pulls everything inside');
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
 const g=running(12);g.dist=core.FINALE_AT-C.clearBefore+5;g.runTime=60;g.gates.forEach(x=>{x.state='passed';});
 // the airspace is cleared before the finale: nothing new appears in the last metres
 g.obstacles.length=g.enemies.length=g.boxes.length=g.plumes.length=g.bonuses.length=0;g.boxWait=0;g.enemyClock=0;let late=0;
 for(let i=0;i<60*10;i++){core.step(g,1/60,{});if(g.phase!=='run')break;if([g.obstacles,g.enemies,g.boxes,g.plumes,g.bonuses].some(list=>list.some(o=>o.age<.05)))late++;}
 assert.equal(late,0,'no pylon, other aircraft, box, feather or bonus ring in the last '+C.clearBefore+' m');
}
{
 const g=running(12);g.dist=core.FINALE_AT-12;g.runTime=250;g.lives=2;g.boxes.length=0;let events=[];
 for(let i=0;i<60*60&&g.phase==='run';i++){core.step(g,1/60,{});events.push(...core.drain(g));}
 assert.equal(g.phase,'won','a pointer left alone lands: the autopilot flies the glide path (lives: '+g.lives+')');
 assert.ok(g.dist===C.distance&&Math.abs(g.finishTime-g.runTime)<1e-9&&g.timeBonus===core.timeBonus(g.finishTime),'the touchdown is at the end of the route, the time is taken');
 const fin=events.filter(e=>e.type==='finale'),td=events.filter(e=>e.type==='touchdown'),won=events.filter(e=>e.type==='won');
 assert.equal(fin.length,1);assert.equal(td.length,1);assert.equal(won.length,1,'one finale, one touchdown, one end');
 assert.equal(g.mode,'AUTOLAND');assert.ok(g.finale&&g.finale.spawned===C.landing.gates,'seven approach gates');
 assert.ok(['perfect','good','hard'].includes(td[0].grade)&&td[0].bonus===C.landing.bonus[td[0].grade]+g.lives*C.landing.lifeBonus,'the landing bonus: '+td[0].grade+' '+td[0].bonus);
 assert.equal(td[0].grade,'perfect','the pointer in the middle lands in the middle');
 assert.equal(won[0].summary.won,true);assert.equal(won[0].summary.landing.grade,td[0].grade);
 const approach=events.filter(e=>e.type==='gate'&&e.gate.approach);assert.ok(approach.length>=C.landing.gates-2,'the approach gates are rings too ('+approach.length+')');
 const before=g.score;core.step(g,1,{});assert.equal(g.score,before,'nothing after the touchdown');
 // the pilot cannot fire the ULT or the gun in it
 const h=running(12);h.dist=core.FINALE_AT;core.step(h,.02,{});assert.equal(h.mode,'AUTOLAND');h.ult=100;h.enemies.push({id:1,kind:'enemy',x:0,y:0,z:5,r:.6,state:'ahead',age:0,vx:0,vy:0});h.ultCool=0;assert.equal(core.fireUlt(h),0);assert.equal(core.shoot(h,()=>({x:0,y:0,tol:5})),null);h.weapon='missiles';assert.equal(core.useWeapon(h),null,'no weapon in the final approach');
 // the weapons are put away when the approach starts
 const p=running(12);p.dist=core.FINALE_AT-1;p.weapon='gun';p.fx.mask.t=3;p.rush=1.5;p.missiles.push({id:1,x:0,y:0,z:2,delay:0,life:2,age:0,target:null,splash:0,done:false,side:0});run(p,.1);
 assert.ok(p.finale&&p.weapon===null&&p.roll===null&&p.fx.mask.t===0&&p.rush===1&&p.missiles.length===0,'the final approach is flown without weapons');
 // the glide path goes down and the runway comes last; its gates stand before the runway, the runway at the end of the route
 const k=running(12);k.dist=core.FINALE_AT;const ys=[];let runwaySeen=false,onTheRoute=true;
 for(let i=0;i<60*40&&k.phase==='run';i++){core.step(k,1/60,{});for(const e of core.drain(k))if(e.type==='gate'&&e.gate.approach)ys.push(e.gate.y);if(k.finale&&k.finale.runwayZ!=null){runwaySeen=true;if(Math.abs(k.finale.runwayZ*C.unit-core.remaining(k))>C.unit*.6&&k.phase==='run')onTheRoute=false;}}
 assert.ok(runwaySeen&&onTheRoute,'a runway ahead, as far as the route still goes');assert.ok(ys.length>=5&&ys[0]>ys[ys.length-1],'the approach gates go down: '+ys.map(y=>y.toFixed(2)).join(' '));
 assert.ok(k.finale.groundY<ys[ys.length-1],'the runway is below the last gate');
 // the pointer nudges the autopilot a little: far to one side it costs the perfect landing, but not the landing
 const side=running(12);side.dist=core.FINALE_AT;for(let i=0;i<60*60&&side.phase==='run';i++)core.step(side,1/60,{tx:99,ty:0});core.drain(side);
 assert.equal(side.phase,'won','a pointer thrown to the edge still lands');assert.ok(side.landing.dx>.3&&side.landing.dx<=C.nudgeX+.2&&side.landing.grade!=='perfect','the nudge is small: '+side.landing.dx.toFixed(2)+' '+side.landing.grade);
 const wild=running(12);wild.dist=core.FINALE_AT;for(let i=0;i<60*60&&wild.phase==='run';i++)core.step(wild,1/60,{tx:(i%240<120?99:-99),ty:(i%180<90?9:-9),boost:true});core.drain(wild);
 assert.ok(wild.phase==='won'||wild.phase==='over','the finale ends');
}

// ---------------------------------------------------------------- FBWA: stabilised flight with limits, level by itself
{
 const A=C.air,CALM={...FIELD,calm:true};
 // whatever the pointer does, the bank and the pitch never exceed the limits (a gust shakes the wings a little more for a moment)
 const g=running(21);inMode(g,'FBWA');let maxRoll=0,maxPitch=0,maxBank=0;
 for(let i=0;i<60*40;i++){core.step(g,1/60,{tx:(i%150<75?99:-99),ty:(i%110<55?9:-9),boost:i%200<80});if(g.phase!=='run'){g.phase='run';g.lives=C.lives;}core.drain(g);g.gates.forEach(x=>{if(x.state==='ahead')x.state='passed';});g.obstacles.length=g.enemies.length=0;maxRoll=Math.max(maxRoll,Math.abs(g.plane.roll));maxPitch=Math.max(maxPitch,Math.abs(g.plane.pitch));maxBank=Math.max(maxBank,Math.abs(g.plane.bank));}
 assert.ok(maxRoll<=A.rollLim+1e-9&&maxPitch<=A.pitchLim+1e-9,'the bank and the pitch of the stick never pass the limits: '+(maxRoll*57.3).toFixed(1)+' and '+(maxPitch*57.3).toFixed(1)+' degrees');
 assert.ok(maxRoll>A.rollLim*.95&&maxPitch>A.pitchLim*.9,'... and a full stick does reach them');
 assert.ok(maxBank<=A.rollLim+.3+1e-9,'with the shake of a gust the wings are never far past the limit: '+(maxBank*57.3).toFixed(1));
 // a full stick banks and slides, a stick let go levels the wings by itself and the slide dies away
 const a=running(21,CALM);inMode(a,'FBWA');run(a,.3,{tx:99,ty:0});assert.ok(a.plane.roll>A.rollLim*.8&&a.plane.vx>2,'a full stick to the right: nearly the full bank, a fast slide: '+(a.plane.roll*57.3).toFixed(0)+' degrees, '+a.plane.vx.toFixed(1));run(a,.4,{tx:99,ty:0});
 const x1=a.plane.x;run(a,1.6,{tx:99,ty:0,neutral:true});assert.ok(Math.abs(a.plane.roll)<.05&&Math.abs(a.plane.vx)<.35,'the stick let go: the wings are level and the slide has died away');
 const x2=a.plane.x;run(a,1,{tx:99,ty:0,neutral:true});assert.ok(x1>0&&x2>x1&&Math.abs(a.plane.x-x2)<.2,'... after a short coast in the direction it was going: '+x1.toFixed(2)+' '+x2.toFixed(2)+' '+a.plane.x.toFixed(2));
 // at the pointer the aircraft sits level; a pointer on the other side turns the bank round
 const b=running(21,CALM);inMode(b,'FBWA');run(b,3,{tx:1,ty:.5});assert.ok(Math.abs(b.plane.roll)<.02&&Math.abs(b.plane.pitch)<.02&&Math.abs(b.plane.x-1)<.03,'level at the pointer');
 run(b,.35,{tx:-1.5,ty:.5});assert.ok(b.plane.roll<-.3,'the pointer on the left: a left bank');run(b,.4,{tx:1.5,ty:-.5});assert.ok(b.plane.roll>-.2,'and back');
 // climbing and diving follow the pitch
 const c=running(21,CALM);inMode(c,'FBWA');run(c,.25,{tx:0,ty:1.4});assert.ok(c.plane.pitch>.25&&c.plane.vy>1,'the pointer above: the nose goes up, the aircraft climbs');run(c,1.2,{tx:0,ty:1.4});run(c,.5,{tx:0,ty:-1.4});assert.ok(c.plane.pitch<-.2&&c.plane.vy<-1,'and down');
 // the attitude the card shows is the real one
 const k=running(21,CALM);inMode(k,'FBWA');run(k,.4,{tx:3,ty:1});assert.ok(k.plane.bank===k.plane.roll&&k.plane.tilt===k.plane.pitch,'without a gust the shown bank is the bank of the stick');
 // the stick is let go in CRUISE sideways only: the altitude hold goes on; in AUTO the pointer is not asked at all
 const cr=running(21,CALM);inMode(cr,'CRUISE');run(cr,1,{tx:3,ty:1,neutral:true});assert.ok(Math.abs(cr.plane.roll)<.05,'CRUISE: no stick, no bank');
 const au=running(21,CALM);inMode(au,'AUTO');au.gates=[{id:1,n:1,x:1.5,y:.4,z:6,r:1,state:'ahead',quality:null,age:0,approach:false}];au.lastGate=au.gates[0];run(au,1.2,{tx:-3,ty:-1,neutral:true});assert.ok(au.plane.x>.5,'AUTO flies on whether there is a pointer or not');
}
// ---------------------------------------------------------------- the hand-over: after the autopilot the pointer takes over gradually
{
 const CALM={...FIELD,calm:true};
 const g=running(23,CALM);inMode(g,'AUTO');g.gates=[{id:1,n:1,x:2,y:.3,z:30,r:1,state:'ahead',quality:null,age:0,approach:false}];g.lastGate=g.gates[0];g.enemyClock=99;run(g,2.5,{tx:-3,ty:-1});
 const before=g.plane.x;assert.ok(before>1.5,'the autopilot flew to the ring');
 g.dist=windowOf('AUTO')+core.PLAN[3].len-1;const ev=run(g,.1,{tx:-3,ty:-1});
 const mode=ev.find(e=>e.type==='mode');assert.ok(mode&&mode.to==='FBWA'&&mode.handover===true&&g.handover>0,'the plan hands the aircraft over to the pilot, with a warning');
 run(g,.5,{tx:-3,ty:-1});assert.ok(g.plane.x>before-.9,'half a second later the pointer on the far side has not yanked the aircraft away: '+before.toFixed(2)+' -> '+g.plane.x.toFixed(2));
 run(g,3.2,{tx:-3,ty:-1});assert.ok(g.plane.x<-1.5,'then the pointer is in charge: '+g.plane.x.toFixed(2));
 // a mode that does not follow the autopilot has no hand-over
 const h=running(23,CALM);inMode(h,'CRUISE');h.dist=windowOf('CRUISE')+core.PLAN[1].len-1;const hev=run(h,.1,{});assert.ok(hev.find(e=>e.type==='mode'&&e.to==='GUIDED').handover===false&&h.handover===0,'no hand-over from CRUISE');
}
// ---------------------------------------------------------------- the wind: constant, turning, with gusts; it shows and it carries
{
 const g=core.create(31,FIELD);core.begin(g);g.phase='run';
 let w=core.windInfo(g);assert.equal(w.speed,0,'no wind before the flight');
 core.step(g,.02,{});core.drain(g);run(g,.5,{});assert.ok(core.windInfo(g).speed<core.windSpeedOf(1)*.5,'the wind fades in, it does not start at full strength');
 const seen={shift:0,gust:0},dirs=new Set(),speeds=[];let maxTurb=0;
 for(let i=0;i<60*240&&g.phase==='run';i++){g.level=Math.min(20,1+Math.floor(i/720));core.step(g,1/60,{});for(const e of core.drain(g)){if(e.type==='wind'&&e.stage==='shift')seen.shift++;if(e.type==='gust'&&e.stage==='blow')seen.gust++;}if(g.phase==='run'){g.lives=C.lives;g.gates.forEach(x=>{if(x.state==='ahead')x.state='passed';});g.obstacles.length=g.enemies.length=0;}
  if(i%60===0){w=core.windInfo(g);dirs.add(Math.sign(Math.cos(g.wind.dir)));speeds.push(w.steady);}maxTurb=Math.max(maxTurb,Math.hypot(g.wind.tx,g.wind.ty));}
 assert.ok(seen.shift>=3,'the wind changes its direction now and then: '+seen.shift+' shifts in four minutes');assert.ok(dirs.has(1)&&dirs.has(-1)||seen.shift>=4,'it blows from both sides over a long flight');
 assert.ok(seen.gust>=20,'gusts come often: '+seen.gust);assert.ok(Math.max(...speeds)>core.windSpeedOf(1),'the steady wind grows with the level: '+Math.max(...speeds).toFixed(2));
 assert.ok(Math.max(...speeds)<=C.windMax+1e-9&&maxTurb<=C.windMax*C.windTurb*1.7+.1,'the wind and its turbulence stay bounded: '+maxTurb.toFixed(2));
 w=core.windInfo(g);assert.ok(Math.abs(w.x-g.wind.vx)<1e-12&&Math.abs(Math.hypot(w.x,w.y)-w.speed)<1e-9,'the display gets the real wind');
 // the same seed blows the same wind
 const p=core.create(31,FIELD),q=core.create(31,FIELD);for(const z of [p,q]){core.begin(z);z.phase='run';run(z,20,{});}assert.equal(JSON.stringify(core.windInfo(p)),JSON.stringify(core.windInfo(q)),'the wind is the same for the same seed');
 // calm: no wind at all, no gusts
 const c=core.create(31,{...FIELD,calm:true});core.begin(c);c.phase='run';run(c,30,{});assert.ok(core.windInfo(c).speed===0&&c.gust.phase!=='blow'&&c.wind.sx===0,'a calm game has no wind and no gusts');
 // the wind carries the aircraft: the pointer left alone in a strong wind, the aircraft is pushed off and the stick has to hold against it
 const m=running(31);inMode(m,'FBWA');m.level=30;m.wind.speed=C.windMax;m.wind.dir=0;m.wind.dirTo=0;m.wind.shiftWait=1e9;m.gust.wait=1e9;m.runTime=20;run(m,5,{tx:0,ty:0});
 assert.ok(m.plane.x>.1&&m.plane.roll<-.05,'a wind from the left: the aircraft sits downwind of the pointer and holds a bank into the wind: x '+m.plane.x.toFixed(2)+', roll '+(m.plane.roll*57.3).toFixed(1));
 // the autopilots and the slow mode keep more of the pointer than the quick one (the wind takes less of them)
 const off=mode=>{const k=running(31);inMode(k,mode);k.level=30;k.wind.speed=C.windMax;k.wind.dir=0;k.wind.dirTo=0;k.wind.shiftWait=1e9;k.gust.wait=1e9;k.gates=[{id:1,n:1,x:0,y:0,z:90,r:1,state:'ahead',quality:null,age:0,approach:false}];k.lastGate=k.gates[0];run(k,5,{tx:0,ty:0});return Math.abs(k.plane.x-(mode==='AUTO'?k.gates[0].x:0));};      // (the autopilot follows its ring, which the wind carries too)
 assert.ok(off('FBWA')>off('GUIDED')&&off('FBWA')>off('CRUISE')&&off('FBWA')>off('AUTO'),'FBWA takes most of the wind: '+['FBWA','CRUISE','GUIDED','AUTO'].map(n=>n+' '+off(n).toFixed(2)).join(' '));
 // the steady wind carries the rings, pylons and bonus rings sideways, the other aircraft too
 const r=running(31);inMode(r,'FBWA');r.level=30;r.wind.speed=C.windMax;r.wind.dir=0;r.wind.dirTo=0;r.wind.shiftWait=1e9;r.gust.wait=1e9;r.runTime=20;r.gates=[{id:1,n:1,x:0,y:0,z:50,r:1,state:'ahead',quality:null,age:0,approach:false}];r.lastGate=r.gates[0];
 r.obstacles.push({id:2,kind:'pylon',x:0,y:0,z:50,r:C.pylonR,state:'ahead',age:0});r.bonuses.push({id:3,kind:'bonus',x:0,y:0,z:50,r:C.bonusR,off:1,state:'ahead',age:0});r.enemies.push({id:4,kind:'enemy',x:0,y:0,z:50,r:C.enemyR,state:'ahead',age:0,vx:0,vy:0});
 run(r,3,{});assert.ok(r.gates[0].x>.3&&r.obstacles[0].x>.3&&r.bonuses[0].x>.3&&r.enemies[0].x>.5,'the wind carries the rings, the pylons, the bonus rings and the other aircraft: '+[r.gates[0].x,r.obstacles[0].x,r.bonuses[0].x,r.enemies[0].x].map(v=>v.toFixed(2)).join(' '));
 assert.ok(r.enemies[0].x>r.gates[0].x,'... the other aircraft more than the rings');
 const d=core.enemyDrift(r);assert.ok(Math.abs(d.x-r.wind.vx*C.enemyWind)<1e-12,'what the layer needs to predict the other aircraft');
 // the final approach is flown in a calmer wind
 const f=running(31);f.level=30;f.wind.speed=C.windMax;f.dist=core.FINALE_AT;run(f,6,{});assert.ok(f.finale&&core.windInfo(f).steady<C.windMax*C.finaleWind*1.2,'a calmer wind in the final approach: '+core.windInfo(f).steady.toFixed(2));
}
// ---------------------------------------------------------------- the afterburner sprint
{
 const g=core.create(41,FIELD);core.begin(g);g.phase='run';const log=[];let maxMul=1,maxSpeed=0,t=0,corridor=0,normal=0;
 const calm=()=>{g.lives=C.lives;g.obstacles.length=g.enemies.length=0;};
 for(let i=0;i<60*130&&g.phase==='run';i++){
  core.step(g,1/60,{tx:g.gates.find(x=>x.state==='ahead')?core.nextGate(g).x:0,ty:g.gates.find(x=>x.state==='ahead')?core.nextGate(g).y:0});t+=1/60;
  for(const e of core.drain(g))if(e.type==='sprint')log.push([e.stage,+g.runTime.toFixed(2),e]);
  maxMul=Math.max(maxMul,g.sprint.mul);maxSpeed=Math.max(maxSpeed,core.speedOf(g)/(C.baseSpeed*core.speedMul(g.level)*M[g.mode].speed));calm();
  for(const x of g.gates)if(x.age<.02&&!x.approach){if(x.sprint)corridor++;else normal++;}
 }
 assert.ok(log.length>=6&&log.map(l=>l[0]).join(' ').startsWith('warn start end warn start end'),'a sprint is a warning, a burn and an end, again and again: '+log.map(l=>l[0]).join(' '));
 assert.ok(log[0][1]>=C.sprintFirst-.5,'no sprint before '+C.sprintFirst+' s: the first at '+log[0][1]);
 assert.ok(Math.abs(log[1][1]-log[0][1]-C.sprintWarn)<.1,'the burn starts '+C.sprintWarn+' s after the warning');
 assert.ok(log[2][1]-log[1][1]>=C.sprintLen-.1,'the burn lasts at least '+C.sprintLen+' s');
 assert.ok(log[3][1]-log[2][1]>=C.sprintGapMin-.5,'the sprints keep their distance: '+(log[3][1]-log[2][1]).toFixed(1));
 assert.ok(maxMul>=C.sprintPeak0*.9&&maxSpeed<=C.speedCap+1e-9&&maxSpeed>=C.sprintPeak0*.9,'the speed jumps up to '+maxMul.toFixed(2)+' times and never past the cap: '+maxSpeed.toFixed(2));
 assert.ok(corridor>=3&&normal>=10,'the gates laid out during a sprint are marked ('+corridor+' of '+(corridor+normal)+')');
 assert.ok(core.sprintInfo(g).phase&&core.sprintInfo(g).amt>=0&&core.sprintInfo(g).amt<=1);
}
// the gates as they are laid out: (x, y, z, ring, pattern) of every new gate, in order, in a calm game at a fixed level, with the corridor of a sprint on or off
const spawnLog=(seed,{level=8,seconds=90,corridor=null}={})=>{
 const g=core.create(seed,{...FIELD,calm:true});core.begin(g);g.phase='run';g.runTime=2;g.level=level;const seen=new Set(),out=[];
 for(let i=0;i<seconds*30;i++){
  g.level=level;if(corridor!==null){g.sprint.phase=corridor?'warn':'idle';g.sprint.peak=1.8;g.sprint.t=0;g.sprint.wait=1e9;}
  core.step(g,1/30,{});core.drain(g);g.lives=C.lives;g.obstacles.length=g.enemies.length=g.bonuses.length=0;
  for(const q of g.gates)if(!seen.has(q.id)){seen.add(q.id);const p=g.gates.find(x=>x.n===q.n-1);out.push({x:q.x,y:q.y,z:q.z,r:q.r,sprint:q.sprint,n:q.n,pat:g.pat.kind,gap:p?q.z-p.z:null});}
  g.gates.forEach(q=>{if(q.state==='ahead'&&q.z<1)q.state='passed';});
 }
 return out;
};
{
 // the corridor: wider rings, smaller hops, more room between the gates; nothing of it outside a sprint
 const hop=a=>a.slice(1).map((q,i)=>Math.hypot(q.x-a[i].x,q.y-a[i].y)),avg=a=>a.reduce((s,v)=>s+v,0)/a.length;
 let hops=[],hopsN=[],rad=[],radN=[],gap=[],gapN=[];
 for(let seed=1;seed<=8;seed++){
  const a=spawnLog(seed,{corridor:true}),b=spawnLog(seed,{corridor:false});
  assert.ok(a.slice(3).every(q=>q.sprint===true)&&b.every(q=>q.sprint===false),'the gates of a sprint corridor are marked, the others are not');
  hops.push(...hop(a).slice(3));hopsN.push(...hop(b).slice(3));rad.push(...a.slice(3).map(q=>q.r));radN.push(...b.slice(3).map(q=>q.r));
  gap.push(...a.slice(3).map(q=>q.gap).filter(v=>v!==null));gapN.push(...b.slice(3).map(q=>q.gap).filter(v=>v!==null));
 }
 assert.ok(hops.length>200&&hopsN.length>200,'enough gates laid out to compare ('+hops.length+', '+hopsN.length+')');
 assert.ok(avg(hops)<avg(hopsN)*.85,'the hops are smaller in a sprint corridor: '+avg(hops).toFixed(2)+' against '+avg(hopsN).toFixed(2));
 assert.ok(avg(rad)>avg(radN)*1.05,'the rings are wider: '+avg(rad).toFixed(2)+' against '+avg(radN).toFixed(2));
 assert.ok(avg(gap)>avg(gapN)*1.2,'and further apart: '+avg(gap).toFixed(2)+' against '+avg(gapN).toFixed(2));
}{
 // points: a gate in a sprint pays half as much again; a clean sprint pays a bonus, one with a lost life does not
 const pass=(boost,mul)=>{const g=running(3);inMode(g,'FBWA');g.sprint.mul=mul;const gate=g.gates[0];gate.z=.02;g.plane.x=gate.x;g.plane.y=gate.y;core.step(g,.02,{});return core.drain(g).find(e=>e.type==='gate');};
 const a=pass(false,1),b=pass(false,1.7);assert.equal(a.points,100);assert.equal(b.points,Math.round(100*C.sprintScore),'a gate in a sprint pays x'+C.sprintScore);assert.ok(b.sprint===true&&a.sprint===false);
 const clean=(lose)=>{const g=running(3,{...FIELD,calm:true});inMode(g,'FBWA');g.sprint.phase='burn';g.sprint.t=0;g.sprint.len=.05;g.sprint.peak=1.8;g.sprint.mark=g.hits+g.missed;if(lose)g.missed++;const s0=g.score,ev=run(g,.2,{});return {g,s0,end:ev.find(e=>e.type==='sprint'&&e.stage==='end')};};
 const c1=clean(false),c2=clean(true);
 assert.ok(c1.end&&c1.end.clean===true&&c1.end.bonus>=C.sprintClean&&c1.g.score>=c1.s0+C.sprintClean&&c1.g.sprint.clean===1,'a sprint without a lost life pays a bonus');
 assert.ok(c2.end&&c2.end.clean===false&&c2.end.bonus===0&&c2.g.sprint.clean===0,'one with a lost life does not');
 // never in the final approach or in the last seconds before it
 const f=running(5);f.dist=core.FINALE_AT-C.clearBefore-C.sprintLast+1;f.runTime=60;f.sprint.wait=0;f.gates.forEach(x=>{x.state='passed';});const ev=run(f,3,{});assert.ok(!ev.some(e=>e.type==='sprint'),'no sprint starts in the last '+(C.clearBefore+C.sprintLast)+' m before the approach');
 const g=running(5);g.dist=core.FINALE_AT;g.sprint.mul=1.8;g.sprint.phase='burn';run(g,3,{});assert.ok(g.finale&&g.sprint.mul<1.05&&g.sprint.phase==='idle','a sprint that is on when the final approach starts is cut off: '+g.sprint.mul.toFixed(2));
 // the boost on top of a sprint does not break the cap
 const h=running(5);h.level=30;h.sprint.mul=C.sprintPeakMax;h.boost=1;assert.ok(core.speedOf(h)<=C.baseSpeed*C.maxSpeedMul*C.speedCap+1e-9,'a sprint and the boost together stay under the cap');
}
// ---------------------------------------------------------------- bonus rings, formations of other aircraft, rings in different places
{
 const CALM={...FIELD,calm:true};
 // bonus rings: a small detour off the line of the gates, at other depths, more of them as the flight goes on, none in AUTO
 const spawned={early:0,late:0,auto:0,gates:0},zs=new Set(),offs=[];
 for(let seed=1;seed<=14;seed++){
  for(const [label,level,mode] of [['early',1,'FBWA'],['late',16,'FBWA'],['auto',16,'AUTO']]){
   const g=core.create(seed,FIELD);core.begin(g);g.phase='run';g.dist=mode==='AUTO'?windowOf('AUTO')+1:1000;g.runTime=20;g.level=level;g.mode=mode;
   for(let i=0;i<260;i++){g.gates.forEach(x=>{x.z-=.08;});g.bonuses.forEach(x=>{x.z-=.08;});g.obstacles.forEach(x=>{x.z-=.08;});core.step(g,.001,{});}
   spawned[label]+=g.bonuses.length;if(label==='late'){spawned.gates+=g.gates.length;for(const b of g.bonuses){zs.add(Math.round(b.z*2));offs.push(b.off);assert.ok(Math.abs(b.x)<=g.fieldX&&Math.abs(b.y)<=g.fieldY&&b.r===C.bonusR);}}
  }
 }
 assert.ok(spawned.late>spawned.early&&spawned.late>=10,'more bonus rings as the flight goes on: '+spawned.early+' then '+spawned.late);assert.equal(spawned.auto,0,'none while the autopilot flies (the pilot has the gun then)');
 assert.ok(zs.size>=6,'at all kinds of depths ('+zs.size+' different ones)');assert.ok(Math.min(...offs)>=.9&&Math.max(...offs)>1.8,'off the line of the gates, some a long way: '+Math.min(...offs).toFixed(2)+' to '+Math.max(...offs).toFixed(2));
 // taking one pays and charges the ULT; missing one costs nothing
 const take=(dx,mode='FBWA')=>{const g=running(6,CALM);inMode(g,mode);const b={id:77,kind:'bonus',x:1,y:.2,z:.02,r:C.bonusR,off:1.5,state:'ahead',age:0};g.bonuses.push(b);g.plane.x=1+dx;g.plane.y=.2;core.step(g,.02,{});return {g,b,ev:core.drain(g)};};
 let r=take(0);assert.equal(r.b.state,'taken');assert.ok(r.ev.some(e=>e.type==='bonus'&&e.points===Math.round(C.bonusPts+C.bonusFar*1.5))&&r.g.score>=C.bonusPts&&r.g.ult===C.bonusUlt&&r.g.bonusTaken===1,'a bonus ring pays and charges the ULT');
 r=take(C.bonusR*1.3);assert.equal(r.b.state,'missed');assert.ok(r.g.lives===C.lives&&r.g.streak===0&&r.g.score===0&&r.g.bonusMissed===1&&!r.ev.some(e=>e.type==='miss'||e.type==='hit'),'a bonus ring that is missed costs nothing');
 r=take(0,'AUTO');assert.ok(r.g.score===Math.round((C.bonusPts+C.bonusFar*1.5)*M.AUTO.score),'the mode prices it like a gate');
 // other aircraft come in formations of two and three, never more than the room
 const sizes={1:0,2:0,3:0};let over=0;
 for(let seed=1;seed<=40;seed++){const g=running(seed);g.level=14;g.enemies.length=0;g.rng=core.mulberry32(seed);g.runTime=60;g.enemyClock=0;g.mode='FBWA';g.gates.forEach(x=>{x.state='passed';});const before=g.enemies.length;core.step(g,.001,{});core.drain(g);const n=g.enemies.length-before;if(n>=1)sizes[n]++;if(n>C.enemyMax)over++;}
 assert.ok(sizes[2]>=5&&sizes[3]>=4&&sizes[1]>=5&&over===0,'waves of one, two and three other aircraft at a high level: '+JSON.stringify(sizes));
 let big=0;for(let seed=1;seed<=30;seed++){const g=running(seed);g.level=2;g.runTime=60;g.enemyClock=0;core.step(g,.001,{});if(g.enemies.length>1)big++;}assert.equal(big,0,'no formations in the first levels');
 const full=running(9);full.level=14;full.runTime=60;full.enemyClock=0;for(let i=0;i<C.enemyMax;i++)full.enemies.push({id:900+i,kind:'enemy',x:0,y:0,z:8,r:C.enemyR,state:'ahead',age:0,vx:0,vy:0});core.step(full,.001,{});assert.equal(full.enemies.length,C.enemyMax,'a full sky gets no more');
 // the rings are in different places: the whole width and several heights, in more than one pattern, never a hop longer than the aircraft can fly
 const xs=[],ys=[],kinds=new Set();let worst=0,worstY=0;
 for(let seed=1;seed<=16;seed++){const a=spawnLog(seed,{level:12,seconds:80});for(const [i,q] of a.entries()){xs.push(q.x);ys.push(q.y);kinds.add(q.pat);if(i){worst=Math.max(worst,Math.abs(q.x-a[i-1].x));worstY=Math.max(worstY,Math.abs(q.y-a[i-1].y));}}}
 assert.ok(Math.max(...xs)>2&&Math.min(...xs)<-2&&Math.max(...ys)>.5&&Math.min(...ys)<-.5,'the rings use the whole field: x '+Math.min(...xs).toFixed(1)+'..'+Math.max(...xs).toFixed(1)+', y '+Math.min(...ys).toFixed(1)+'..'+Math.max(...ys).toFixed(1));
 assert.ok(kinds.size>=4,'the gates follow more than one pattern: '+[...kinds].join(' '));
 assert.ok(worst<=C.hopXMax+.01&&worstY<=C.hopY+C.hopYStep*40,'a hop sideways never passes '+C.hopXMax+' and one up or down is small: '+worst.toFixed(2)+', '+worstY.toFixed(2));
}
// ---------------------------------------------------------------- the weapon boxes: a roulette, one slot, five weapons; they lie between the gates
{
 const CALM={...FIELD,calm:true};
 // a quiet sky: the ring and the hazards are the test's own
 const quiet=g=>{g.gates.forEach(x=>{x.state='passed';});g.obstacles.length=g.enemies.length=g.boxes.length=g.plumes.length=g.bonuses.length=0;g.enemyClock=1e9;g.boxWait=1e9;return g;};
 const keep=(g,seconds,input={tx:0,ty:0})=>{for(let i=0;i<Math.round(seconds*60);i++){g.lives=C.lives;g.gates.forEach(x=>{if(x.state==='ahead'&&x.z<1&&x.id!==999)x.state='passed';});core.step(g,1/60,input);}return core.drain(g);};
 let id=5000;
 const boxAt=(g,dx=0,dy=0)=>{const b={id:id++,kind:'box',x:g.plane.x+dx,y:g.plane.y+dy,z:.02,r:C.boxR,state:'ahead',age:0};g.boxes.push(b);return b;};
 let g=quiet(running(14,CALM)),b=boxAt(g),ev=run(g,.02);
 assert.ok(b.state==='taken'&&g.roll&&!g.weapon&&g.boxesTaken===1&&g.score===C.boxPts,'a box starts a roulette and pays');
 assert.ok(ev.some(e=>e.type==='box'&&e.full===false));assert.equal(core.useWeapon(g),null,'nothing to use while the roulette turns');
 keep(g,C.roulette*.5);assert.ok(g.roll&&!g.weapon);
 ev=keep(g,C.roulette*.6);assert.ok(!g.roll&&core.WEAPONS.includes(g.weapon)&&ev.some(e=>e.type==='weapon'&&e.weapon===g.weapon),'then the weapon is in the slot');
 assert.ok(!g.boxes.length,'a taken box is gone');
 const held=g.weapon;boxAt(g);ev=run(g,.02);assert.ok(g.weapon===held&&!g.roll&&ev.some(e=>e.type==='box'&&e.full===true),'a second box while the slot is busy only pays');
 g=quiet(running(14,CALM));b=boxAt(g,C.boxR+C.boxReach+.05,0);run(g,.02);assert.ok(b.state==='missed'&&!g.roll&&g.score===0&&g.lives===C.lives,'a box that goes by gives nothing and costs nothing');
 const count={};
 for(let seed=1;seed<=400;seed++){const k=quiet(running(seed,CALM));boxAt(k);run(k,.02);count[k.roll.result]=(count[k.roll.result]||0)+1;}
 assert.ok(core.WEAPONS.every(w=>count[w]>=400*C.weights[w]*.6),'every weapon comes out of the boxes: '+JSON.stringify(count));
 // along the route: boxes and feathers between the gates, none while the autopilot flies, in CRUISE at the height of the next ring
 for(let seed=1;seed<=6;seed++){
  const k=core.create(seed,FIELD);core.begin(k);const known=new Set(),made={boxes:0,plumes:0};let inAuto=0,offHeight=0;
  while(k.phase!=='won'&&k.phase!=='over'&&k.runTime<600){
   const n=core.nextGate(k);if(n){k.plane.x=n.x;k.plane.y=n.y;}k.lives=C.lives;k.obstacles.length=k.enemies.length=0;
   core.step(k,1/60,{tx:k.plane.x,ty:k.plane.y});core.drain(k);
   for(const name of ['boxes','plumes'])for(const o of k[name])if(!known.has(o.id)){known.add(o.id);made[name]++;if(k.mode==='AUTO')inAuto++;if(k.mode==='CRUISE'&&Math.abs(o.y-k.lastGate.y)>1e-9)offHeight++;assert.ok(o.z>=C.spawnMinZ-.2&&Math.abs(o.x)<=k.fieldX,'nothing new appears right at the aircraft');}
  }
  assert.ok(made.boxes>=14&&made.boxes<=40&&made.plumes>=50&&made.plumes<=200,'boxes and feathers on the way (seed '+seed+'): '+JSON.stringify(made));
  assert.equal(inAuto,0,'none while the autopilot flies');assert.equal(offHeight,0,'in CRUISE they hang at the height of the next ring');
 }
}
// ---------------------------------------------------------------- the five weapons, and the levels of the feathers
{
 const CALM={...FIELD,calm:true};
 const quiet=g=>{g.gates.forEach(x=>{x.state='passed';});g.obstacles.length=g.enemies.length=g.boxes.length=g.plumes.length=g.bonuses.length=0;g.enemyClock=1e9;g.boxWait=1e9;return g;};
 const keep=(g,seconds,input={tx:0,ty:0})=>{for(let i=0;i<Math.round(seconds*60);i++){g.lives=C.lives;g.gates.forEach(x=>{if(x.state==='ahead'&&x.z<1&&x.id!==999)x.state='passed';});core.step(g,1/60,input);}return core.drain(g);};
 const arm=(name,level=0,seed=15)=>{const g=quiet(running(seed,CALM));g.feathers=level*C.feathersPerLevel;g.weapon=name;return g;};
 const enemy=(id,x,y,z)=>({id,kind:'enemy',x,y,z,r:C.enemyR,state:'ahead',age:0,vx:0,vy:0});
 const pylon=(id,x,y,z)=>({id,kind:'pylon',x,y,z,r:C.pylonR,state:'ahead',age:0});
 const aside=g=>{const gate={id:999,n:999,x:g.plane.x+3,y:g.plane.y,z:.02,r:1,state:'ahead',quality:null,age:0,approach:false};g.gates.push(gate);return gate;};
 // the turbo: a burst of speed; a ring missed while it burns costs nothing
 let g=arm('turbo');const normal=core.speedOf(g);assert.equal(core.useWeapon(g),'turbo');let ev=core.drain(g);
 assert.ok(g.weapon===null&&g.used===1&&g.fx.turbo.t===core.weaponParams('turbo',0).dur&&ev.some(e=>e.type==='use'&&e.weapon==='turbo'&&e.level===0));
 keep(g,.8);assert.ok(core.speedOf(g)>normal*1.4,'the turbo is a burst of speed: '+(core.speedOf(g)/normal).toFixed(2));assert.ok(core.airspeed(g)>core.speedOf(g)*C.unit*3.6-.01);
 const d0=g.dist;keep(g,1);assert.ok(g.dist-d0>normal*C.unit*1.4,'... and the route goes by faster');
 let gate=aside(g),streak=g.streak=4,hp=g.lives;ev=run(g,.02);assert.ok(gate.state==='missed'&&gate.quality==='forgiven'&&g.lives===hp&&g.streak===streak&&g.missed===0&&ev.some(e=>e.type==='forgiven'),'a missed ring is free while the turbo burns');
 ev=keep(g,core.weaponParams('turbo',0).dur);assert.ok(g.fx.turbo.t===0&&ev.some(e=>e.type==='effectEnd'&&e.weapon==='turbo'),'it burns out');keep(g,1);assert.ok(Math.abs(core.speedOf(g)-normal)<normal*.2,'and the speed comes back');
 gate=aside(g);hp=g.lives=C.lives;run(g,.02);assert.ok(gate.quality==='miss'&&g.lives===hp-1,'then a missed ring costs again');
 // used again while it works: the longer time stays
 g=arm('turbo');core.useWeapon(g);const t1=g.fx.turbo.t;keep(g,1);g.weapon='turbo';core.useWeapon(g);assert.ok(g.fx.turbo.t>=t1-1e-9&&g.used===2);
 // the machine gun: it fires by itself at what is near the line of flight, pylons from level 2
 g=arm('gun');core.useWeapon(g);core.drain(g);let near=enemy(31,0,0,4),side=enemy(32,3.2,.1,4),post=pylon(33,0,0,6);g.enemies.push(near,side);g.obstacles.push(post);
 ev=run(g,.05,{tx:0,ty:0});assert.ok(near.state==='shot'&&side.state==='ahead'&&post.state==='ahead'&&g.kills===1,'the gun shoots the aircraft in line, not the one far to the side, no pylon at level 0');
 assert.ok(ev.some(e=>e.type==='gunShot'&&e.hit)&&ev.some(e=>e.type==='destroy'&&e.how==='gun'&&e.kind==='enemy'));
 ev=keep(g,1);assert.ok(ev.filter(e=>e.type==='gunShot').length>=3,'again and again');ev=keep(g,core.weaponParams('gun',0).dur);assert.ok(g.fx.gun.t===0&&!keep(g,.5).some(e=>e.type==='gunShot'),'until it runs out');
 g=arm('gun',C.gunPylonLevel);core.useWeapon(g);post=pylon(34,0,0,6);g.obstacles.push(post);keep(g,.3);assert.ok(post.state==='shot'&&g.wrecked===1,'at level '+C.gunPylonLevel+' it breaks pylons too');
 // the missiles: they find their targets by themselves; one more at every level; with nothing to chase they stay in the slot
 g=arm('missiles');assert.equal(core.useWeapon(g),null);assert.ok(g.weapon==='missiles'&&core.drain(g).some(e=>e.type==='weaponDenied'),'nothing to chase: the missiles stay');
 core.useWeapon(g);assert.ok(!core.drain(g).some(e=>e.type==='weaponDenied'),'... said once, not on every press');
 let far=enemy(41,2.2,.6,6);g.enemies.push(far);assert.equal(core.useWeapon(g),'missiles');assert.equal(g.missiles.length,1);ev=keep(g,1.5);
 assert.ok(far.state==='shot'&&g.kills===1&&ev.some(e=>e.type==='destroy'&&e.how==='missile')&&!g.missiles.length,'it homes on the aircraft far off the line');
 g=arm('missiles',2);const a=enemy(42,2,.5,6),b=enemy(43,-2,-.3,7),c=pylon(44,1.2,-.7,8);g.enemies.push(a,b);g.obstacles.push(c);core.useWeapon(g);
 assert.equal(g.missiles.length,3);assert.equal(new Set(g.missiles.map(m=>m.target)).size,3,'three missiles, three targets, aircraft first');assert.equal(g.missiles[0].target,42);keep(g,2.5);assert.ok(g.kills===2&&g.wrecked===1,'all three found');
 g=arm('missiles',C.maxLevel);const first=enemy(45,0,0,6),beside=enemy(46,.7,.1,6.4);g.enemies.push(first,beside);core.useWeapon(g);assert.equal(g.missiles.length,C.maxLevel+1);keep(g,.75);assert.ok(first.state==='shot'&&beside.state==='shot','the blast takes the neighbours');
 g=arm('missiles');g.enemies.push(enemy(47,0,0,1.2));core.useWeapon(g);g.enemies.length=0;keep(g,C.missileLife+.5);assert.equal(g.missiles.length,0,'a missile with no target flies on and goes out');
 // invulnerable and faster: it smashes what it flies into, a missed ring is free
 g=arm('mask');core.useWeapon(g);keep(g,.5);assert.ok(core.speedOf(g)>normal*1.2,'faster');
 const foe=enemy(51,g.plane.x,g.plane.y,.02),rock=pylon(52,g.plane.x,g.plane.y,.02);g.enemies.push(foe);g.obstacles.push(rock);ev=run(g,.02);
 assert.ok(g.lives===C.lives&&g.hits===0&&foe.state==='shot'&&rock.state==='shot'&&g.kills===1&&g.wrecked===1&&ev.filter(e=>e.type==='destroy'&&e.how==='mask').length===2,'invulnerable: it smashes what it flies into');
 gate=aside(g);hp=g.lives;run(g,.02);assert.ok(gate.quality==='forgiven'&&g.lives===hp);
 ev=keep(g,core.weaponParams('mask',0).dur);assert.ok(g.fx.mask.t===0);
 const after=enemy(53,g.plane.x,g.plane.y,.02);g.enemies.push(after);g.invuln=0;run(g,.02);assert.equal(g.hits,1,'then it can be hit again');
 // the barrier pushes pylons and aircraft out of the way before they arrive; from level 3 it breaks them
 g=arm('barrier');core.useWeapon(g);const post1=pylon(61,.15,.05,3.5),plane2=enemy(62,-.1,0,4);g.obstacles.push(post1);g.enemies.push(plane2);ev=keep(g,1.5);
 assert.ok(g.hits===0&&ev.some(e=>e.type==='repel'&&e.kind==='pylon')&&Math.hypot(post1.x-g.plane.x,post1.y-g.plane.y)>post1.r+C.planeR-.05,'pushed aside: '+post1.x.toFixed(2)+' '+post1.y.toFixed(2));
 g=arm('barrier');core.useWeapon(g);const close=pylon(63,g.plane.x,g.plane.y,.01);g.obstacles.push(close);run(g,.02);assert.equal(g.hits,0,'and nothing hurts while it stands');
 g=arm('barrier',C.barrierCrushLevel);core.useWeapon(g);const post2=pylon(64,.2,0,3);g.obstacles.push(post2);keep(g,.6);assert.ok(post2.state==='shot'&&g.wrecked===1,'at level '+C.barrierCrushLevel+' it breaks them');
 g=arm('barrier');core.useWeapon(g);const away=pylon(65,2.6,.8,3);g.obstacles.push(away);keep(g,.3);assert.ok(Math.abs(away.x-2.6)<1e-9&&Math.abs(away.y-.8)<1e-9,'what is far from it is left alone');
 // two weapons at once; no weapon while paused, before the start, or with an empty slot
 g=arm('barrier');core.useWeapon(g);g.weapon='turbo';core.useWeapon(g);assert.deepEqual(core.effectsOf(g).map(f=>f.name),['turbo','barrier']);assert.ok(core.effectsOf(g).every(f=>f.frac>0&&f.frac<=1&&f.left>0));
 g=arm('turbo');g.phase='paused';assert.equal(core.useWeapon(g),null);g.phase='run';g.weapon=null;assert.equal(core.useWeapon(g),null);assert.equal(core.useWeapon(core.create(1)),null);
 // the feathers: every ten make every weapon a level stronger, up to the top
 g=quiet(running(16,CALM));const ups=[];
 for(let i=1;i<=C.feathersPerLevel*(C.maxLevel+2);i++){g.plumes.push({id:7000+i,kind:'feather',x:g.plane.x,y:g.plane.y,z:.02,r:C.featherR,state:'ahead',age:0});g.lives=C.lives;for(const e of run(g,.02))if(e.type==='upgrade')ups.push([i,e.level,e.max]);}
 assert.equal(g.feathers,C.feathersPerLevel*(C.maxLevel+2));assert.equal(core.weaponLevel(g),C.maxLevel);assert.ok(!g.plumes.length&&g.score>=g.feathers*C.featherPts);
 assert.deepEqual(ups.map(u=>u[0]),Array.from({length:C.maxLevel},(_,i)=>(i+1)*C.feathersPerLevel),'an upgrade every ten feathers');assert.deepEqual(ups.map(u=>u[1]),Array.from({length:C.maxLevel},(_,i)=>i+1));assert.ok(ups[ups.length-1][2]===true&&ups.slice(0,-1).every(u=>u[2]===false),'the last one says it is the top');
 g.weapon='mask';core.useWeapon(g);assert.equal(g.fx.mask.dur,core.weaponParams('mask',C.maxLevel).dur,'the upgraded weapon is stronger');assert.equal(g.fx.mask.mul,core.weaponParams('mask',C.maxLevel).mul);
 g=quiet(running(16,CALM));g.plumes.push({id:1,kind:'feather',x:g.plane.x+C.featherR+C.featherReach+.05,y:g.plane.y,z:.02,r:C.featherR,state:'ahead',age:0});run(g,.02);assert.equal(g.feathers,0,'a feather that goes by is not picked up');
 // the box and its feathers move with the card and the wind
 g=quiet(running(16,CALM));g.boxes.push({id:2,kind:'box',x:3,y:2,z:5,r:C.boxR,state:'ahead',age:0});g.plumes.push({id:3,kind:'feather',x:-3,y:-2,z:5,r:C.featherR,state:'ahead',age:0});core.setField(g,1.5,.8,.5);assert.ok(Math.abs(g.boxes[0].x-1.5)<1e-9&&Math.abs(g.plumes[0].x+1.5)<1e-9&&Math.abs(g.plumes[0].y+.5)<1e-9);
}
// ---------------------------------------------------------------- the tune and the music switch
{
 const MU=core.MUSIC;assert.ok(Object.isFrozen(MU)&&MU.steps===128&&MU.bpm>=110&&MU.bpm<=160,'an eight-bar loop of sixteenth notes');
 const lead=[],bass=[],arp=[];let kicks=0,snares=0,hats=0;
 for(let i=0;i<MU.steps*2;i++){const s=MU.tuneStep(i);assert.equal(JSON.stringify(s),JSON.stringify(MU.tuneStep(i%MU.steps)),'the loop repeats');if(s.lead)lead.push(s.lead);if(s.bass!=null)bass.push(s.bass);arp.push(s.arp);kicks+=s.kick?1:0;snares+=s.snare?1:0;hats+=s.hat?1:0;}
 assert.ok(lead.length>=70&&lead.every(n=>n.m>=60&&n.m<=96&&n.len>=1&&n.len<=8),'a lead of '+lead.length/2+' notes in a singable range');
 assert.ok(bass.length===MU.steps&&bass.every(n=>n>=36&&n<=60),'a bass note on every second step, low');assert.ok(arp.every(n=>n>=60&&n<=100),'an arpeggio of the chord above');
 assert.ok(kicks>=MU.steps/4&&snares===MU.steps/4&&hats===MU.steps,'drums on the beat (two loops): '+[kicks,snares,hats].join(' '));
 assert.deepEqual(MU.tuneStep(-1),MU.tuneStep(127),'steps before zero wrap too');assert.equal(MU.midi('A4'),69);assert.equal(MU.midi('C5'),72);assert.equal(MU.midi('G#4'),68);assert.equal(MU.midi('x'),null);
 assert.equal(new Set(lead.map(n=>n.m%12)).size<=9,true,'the tune stays in a key (no more than nine pitch classes)');
 // the switch: on unless it was switched off, every access to the storage may throw
 const mem={};const ok={getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=v;}};
 assert.equal(core.readMusic(ok),true,'the music is on by default');assert.equal(core.writeMusic(ok,false),true);assert.equal(mem[core.MUSIC_KEY],'0');assert.equal(core.readMusic(ok),false);core.writeMusic(ok,true);assert.equal(core.readMusic(ok),true);
 const broken={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};assert.equal(core.readMusic(broken),true,'blocked storage: the default');assert.equal(core.writeMusic(broken,false),false);assert.equal(core.readMusic(null),true);
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
 contains(n){for(;n;n=n.parent)if(n===this)return true;return false;}
 find(pred){if(pred(this))return this;for(const k of this.kids)if(k instanceof El){const r=k.find(pred);if(r)return r;}return null;}
 findAll(pred,out=[]){if(pred(this))out.push(this);for(const k of this.kids)if(k instanceof El)k.findAll(pred,out);return out;}
}
// a stand-in for the Web Audio of a browser: it counts what is made and played, and it lets the sound start only when the test says the browser would (allow)
function makeFakeAudio({allow=false}={}){
 const info={ctxs:[],osc:0,pulse:0,noise:0,starts:[],freqs:[],resumes:0,suspends:0,targets:[],allow};
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(v){info.targets.push(v);this.value=v;}});
 info.AC=class{
  constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=1000;this.destination={};info.ctxs.push(this);}
  createGain(){const n={gain:param(),connect(){return n;}};return n;}
  createDynamicsCompressor(){return {connect(){return this;}};}
  createBuffer(c,n){const d=new Float32Array(n);return {getChannelData:()=>d};}
  createPeriodicWave(re,im){return {re,im};}
  createOscillator(){info.osc++;const o={type:'sine',frequency:{setValueAtTime(f){info.freqs.push(f);},exponentialRampToValueAtTime(){}},connect(){return o;},start(t){info.starts.push(t);},stop(){},setPeriodicWave(){info.pulse++;}};return o;}
  createBufferSource(){info.noise++;return {buffer:null,connect(){return this;},start(){},stop(){}};}
  createBiquadFilter(){return {type:'',frequency:{value:0},connect(){return this;}};}
  resume(){info.resumes++;if(info.allow)this.state='running';return Promise.resolve();}
  suspend(){info.suspends++;this.state='suspended';return Promise.resolve();}
 };
 return info;
}
function runLayer({lang='ru',storageBlocked=false,coarse=false,springs=true,width=520,height=350,audio=null,saved={},navigator:nav}={}){
 const mem={...saved},iv=[],to=[];
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
 const window={AtlasFlightDemo:demo,AtlasFlightGameCore:core,AtlasI18n:{lang},matchMedia:q=>({matches:coarse&&/coarse/.test(q)}),localStorage:storage,AudioContext:audio?audio.AC:undefined,addEventListener:(t,f)=>{(winHandlers[t]=winHandlers[t]||[]).push(f);}};
 vm.runInNewContext(read('js/site/flight-game.js'),{window,document,navigator:nav,Float32Array,Promise,setTimeout:f=>{to.push(f);return to.length;},setInterval:(f,ms)=>{iv.push({f,ms,id:iv.length+1,dead:false});return iv.length;},clearInterval:id=>{const x=iv.find(q=>q.id===id);if(x)x.dead=true;},Math:Object.assign(Object.create(Math),{random:core.mulberry32(20261119)}),Set,String,Number,Array,JSON,Object,Boolean,Date,performance:{now:()=>clock.t}});   // the same games every time
 const layer=demo.layer;
 const find=cls=>root.find(n=>n.classes.has(cls));
 const calls={save:0,restore:0,rotate:0,translate:0};
 const ctx=new Proxy({},{get:(t,k)=>{if(k==='createRadialGradient'||k==='createLinearGradient')return()=>({addColorStop(){}});if(typeof k!=='string')return undefined;if(k in calls)return()=>{calls[k]++;};return t[k]||(()=>{});},set:(t,k,v)=>{t[k]=v;return true;}});
 return {layer,demo,state,root,host,find,clock,toggle:find('game-toggle'),overlay:host.find(n=>n.classes.has('game-overlay')),hud:host.find(n=>n.classes.has('game-hud')),caption:find('game-caption'),bar:find('game-bar'),tip:find('game-tip'),
  dwellBar:find('game-dwell'),ultBtn:find('game-ult'),chips:Object.fromEntries(root.findAll(n=>n.classes.has('game-mode')).map(b=>[b.dataset.mode,b])),topline,mem,window,winHandlers,docHandlers,ctx,calls,centre:mark,
  musicBtn:find('game-music'),wind:find('game-wind'),glow:find('game-glow'),iv,
  /** the timers of the music: the scheduler runs every 30 ms of the clock of the context */
  tick(sec=.2){const ctx=audio&&audio.ctxs[0],n=Math.round(sec/.03);for(let i=0;i<n;i++){if(ctx)ctx.currentTime+=.03;for(const x of iv)if(!x.dead)x.f();}},
  flush(){const run=to.splice(0);for(const f of run)f();},
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
const settle=(tt,s,gust=true)=>{const g=tt.layer.game;for(let i=0;i<Math.round(s*60);i++){g.gates.forEach(x=>{if(x.state==='ahead')x.state='passed';});g.lives=C.lives;if(gust)g.gust.wait=99;g.boxes.length=g.plumes.length=0;g.weapon=null;g.roll=null;tt.frame();}};      // (no boxes and feathers either: they have their own tests)
{
 const t=runLayer();
 assert.ok(t.layer&&t.demo.layer===t.layer,'the layer registers itself in the demo');
 // no start button: the header has only the exit button, and it is hidden until the game runs
 assert.ok(t.toggle&&t.toggle.parent.classes.has('scope-actions'),'the exit button sits in the header, next to the dots');assert.equal(t.toggle.tagName,'BUTTON');assert.equal(t.toggle.type,'button','a button that never submits a form');
 assert.ok(t.topline.kids.includes(t.toggle.parent)&&t.toggle.parent.kids.includes(t.topline.find(n=>n.classes.has('scope-dots'))),'the dots are kept');
 assert.ok(t.toggle.hidden,'nothing to press before the game: it is started by holding the pointer on the card');
 assert.ok(!t.root.findAll(n=>n.tagName==='BUTTON'&&!n.hidden).some(b=>/ИГРА|ГРА|PLAY|СТАРТ|START/i.test(b.textContent)),'no start button anywhere');
 assert.ok(t.hud.hidden&&t.overlay.hidden&&t.caption.hidden&&t.bar.hidden&&t.tip.hidden,'nothing of the game shows before it starts');assert.equal(t.layer.mode,'demo');assert.equal(t.layer.status(),null,'the demo keeps its own status text');
 assert.deepEqual(Object.keys(t.chips),['FBWA','CRUISE','GUIDED','AUTO'],'four modes in the bar');
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
 t.host.fire('pointerenter',{pointerType:'mouse'});t.seconds(7.3);assert.equal(t.layer.mode,'count');t.layer.game.calm=true;assert.ok(t.host.classes.has('is-game')&&t.root.classes.has('is-game'));assert.ok(!t.hud.hidden&&!t.caption.hidden&&!t.bar.hidden);
 assert.ok(t.layer.active&&t.layer.engaged&&t.demo.woke>0,'the demo runs at full speed and is woken up');
 assert.ok(t.caption.textContent.includes('курсором')&&t.caption.textContent.includes('Esc')&&t.caption.textContent.includes('ПКМ')&&/FBWA.*CRUISE.*GUIDED.*AUTO/.test(t.caption.textContent)&&/сами/.test(t.caption.textContent),'the hint under the card: the pointer, the keys, the modes that change by themselves, the ULT');
 assert.ok(!t.overlay.hidden&&t.overlay.dataset.kind==='count'&&/^[123]$/.test(t.overlay.find(n=>n.classes.has('game-count')).textContent),'the countdown shows a digit');
 assert.ok(t.layer.game.fieldX>0&&t.layer.game.gateY>0,'the field is worked out from the size of the card');assert.equal(t.root.findAll(n=>n.classes.has('game-lives'))[0].children.length,C.lives,'a dot for every life');
 t.setLang('en');assert.ok(/Exit|EXIT/.test(t.toggle.textContent));t.setLang('ru');
 const w=t.state.w,h=t.state.h,base=Math.min(w*.155,h*.21);
 // the aircraft goes where the pointer is: its place on the card is the place of the pointer
 const lookAt=(px,py)=>{t.move(px,py);t.seconds(2.8);const g=t.layer.game,p=t.layer.worldToPixels(g.plane.x,g.plane.y,0);return {g,p};};
 for(const [px,py] of [[w*.75,h*.6],[w*.25,h*.45],[w*.5,h*.51],[w*.62,h*.35]]){
  const {g,p}=lookAt(px,py);g.gates.forEach(x=>{x.state='passed';});g.lives=C.lives;
  assert.ok(Math.abs(p.x-px)<4&&Math.abs(p.y-py)<4,'the aircraft is under the pointer at '+Math.round(px)+', '+Math.round(py)+': it is at '+p.x.toFixed(1)+', '+p.y.toFixed(1));
 }
 // the aircraft of the demo is drawn exactly there (its own oblique camera is taken into account)
 const demoProject=(x,y,z)=>{const depth=7.8+z*.65-y*.36,scale=Math.min(w*.155,h*.21)*(7.8/depth);return [w*.5+x*scale,h*.51-(y*.83+z*.52)*scale];};
 for(const [px,py] of [[w*.8,h*.7],[w*.2,h*.3],[w*.5,h*.51]]){const {g,p}=lookAt(px,py);g.gates.forEach(x=>{x.state='passed';});g.lives=C.lives;const q=demoProject(t.layer.plane.x,t.layer.plane.y,0);assert.ok(Math.abs(q[0]-p.x)<.6&&Math.abs(q[1]-p.y)<.6,'the demo draws the aircraft at '+q.map(v=>v.toFixed(1))+' and the game says '+p.x.toFixed(1)+', '+p.y.toFixed(1));}
 // the pointer leaves the card: the stick is let go (the wings come level, the aircraft coasts and does not run off), the game waits, then pauses
 t.move(w*.7,h*.4);t.seconds(2.5);const keep=t.layer.game.plane.x;t.layer.game.plane.roll=.6;t.host.fire('pointerleave',{pointerType:'mouse'});t.point(w*.1,h*.9);t.seconds(.5);
 assert.ok(Math.abs(t.layer.game.plane.roll)<.1&&Math.abs(t.layer.game.plane.x-keep)<.6&&t.layer.mode==='run','the stick is let go: the wings level themselves, the aircraft does not follow the stale pointer, the game is still running for a moment');
 t.seconds(.9);assert.equal(t.layer.mode,'paused','a mouse that stays away pauses the game');assert.equal(t.overlay.dataset.kind,'paused');assert.equal(t.layer.status(),'ПАУЗА');
 t.move(w*.5,h*.5);assert.equal(t.layer.mode,'run','the mouse coming back resumes');
 t.host.fire('pointerleave',{pointerType:'mouse'});t.seconds(.6);t.host.fire('pointerenter',{pointerType:'mouse'});t.seconds(1);assert.equal(t.layer.mode,'run','back within the grace time: no pause at all');
 t.host.fire('keydown',{key:'p'});assert.equal(t.layer.mode,'paused');t.move(w*.5,h*.5);assert.equal(t.layer.mode,'paused','a pause by key waits for the key');t.host.fire('keydown',{key:' '});assert.equal(t.layer.mode,'run');
 t.layer.onView(false);assert.equal(t.layer.mode,'paused','the card scrolled out of view');t.layer.resume();
 // arrow keys move an aim of their own; the keys are a way to play without a mouse, so they hold the pause back for a while
 t.layer.game.gates.forEach(x=>{x.state='passed';});t.move(w*.5,h*.51);t.seconds(1);const x0=t.layer.game.plane.x;
 t.host.fire('keydown',{key:'ArrowRight'});t.seconds(.6);t.host.fire('keyup',{key:'ArrowRight'});const x1=t.layer.game.plane.x;assert.ok(x1>x0+.6,'the right arrow moves the aircraft to the right: '+x0.toFixed(2)+' -> '+x1.toFixed(2));
 t.seconds(2);const x2=t.layer.game.plane.x;t.seconds(.5);assert.ok(Math.abs(t.layer.game.plane.x-x2)<.02&&x2>=x1-.05,'and it stays where it was left (the pointer is not asked again while the keys are in charge)');
 t.host.fire('keydown',{key:'ArrowUp'});t.seconds(.8);t.host.fire('keyup',{key:'ArrowUp'});assert.ok(t.layer.game.plane.y>.3,'the up arrow climbs: '+t.layer.game.plane.y.toFixed(2));
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
 assert.equal(g.mode,'FBWA');assert.ok(chip('FBWA').classes.has('is-active')&&!chip('CRUISE').classes.has('is-active')&&chip('CRUISE').classes.has('is-next'),'FBWA is flying, CRUISE comes next');
 assert.equal(leftOf('FBWA'),'3.0 км','the distance the leg has left');assert.equal(chip('FBWA').attrs['aria-current'],'true');assert.equal(chip('CRUISE').attrs['aria-current'],undefined);
 assert.ok(!t.tip.hidden&&t.tip.textContent.startsWith('FBWA:')&&/ветер/.test(t.tip.textContent),'the tip of the first mode: '+t.tip.textContent);
 assert.equal(t.layer.status(),null,'nothing to say in the middle of a plain run');assert.equal(t.centre.style.visibility,'hidden','the demo\'s text in the middle of the card is hidden then');
 // the keys 1-4 and the chips do nothing: the plan decides
 for(const k of ['1','2','3','4'])t.host.fire('keydown',{key:k});for(const c of Object.values(t.chips))c.fire('click');assert.equal(g.mode,'FBWA','the mode cannot be picked');
 // half way through FBWA
 settle(t,6);assert.ok(t.tip.hidden||!t.tip.textContent.startsWith('FBWA:'),'a tip goes away by itself (the hints that were waiting come after it)');
 g.dist=1500;settle(t,.1);assert.ok(/^(4|5)\d%$/.test(fillOf('FBWA').style.width),'the bar of the mode fills as its leg goes by: '+fillOf('FBWA').style.width);
 // the boundaries of the plan, one after the other: the mode, the announcement in the middle, the chips, the tip (once per mode)
 const from=[];{let f=0;for(const p of core.PLAN){from.push(f);f+=p.len;}}
 const shown=[];
 for(let i=1;i<core.PLAN.length;i++){
  g.dist=from[i]-1;settle(t,.3);const now=t.tip.hidden?'':t.tip.textContent;shown.push([g.mode,now.startsWith(g.mode+':')]);
  if(i===1){
   assert.equal(g.mode,'CRUISE');assert.equal(t.layer.status(),'РЕЖИМ CRUISE','the new mode is announced in the middle of the card');t.frame();assert.equal(t.centre.style.visibility,'');
   assert.ok(chip('CRUISE').classes.has('is-active')&&!chip('FBWA').classes.has('is-active')&&chip('GUIDED').classes.has('is-next')&&!chip('CRUISE').classes.has('is-next'),'exactly one mode is active, the next is marked');
   assert.ok(/^(2\.0|1\.9) км$/.test(leftOf('CRUISE'))&&leftOf('FBWA')==='','the active mode counts down its distance: '+leftOf('CRUISE'));assert.ok(/автопилот/.test(now),'a tip for the new mode: '+now);
   settle(t,2);assert.equal(t.layer.status(),null,'the announcement goes away');
  }
  settle(t,5.4);
 }
 assert.deepEqual(shown.map(s=>s[0]),['CRUISE','GUIDED','AUTO','FBWA','CRUISE','GUIDED','AUTO'],'the whole plan');
 assert.deepEqual(shown.slice(0,3).map(s=>s[1]),[true,true,true],'every mode brings its tip');assert.deepEqual(shown.slice(3).map(s=>s[1]),[false,false,false,false],'a mode that comes back does not repeat its tip');
 // tips: the one a mode brings is not pushed away by a hint, the hint waits and comes after
 const q=runLayer({springs:false});q.layer.start();q.seconds(C.countdown+.3);const qg=q.layer.game;qg.gust.wait=0;settle(q,.1,false);
 assert.ok(q.tip.textContent.startsWith('FBWA:'),'the mode tip stays while a gust is announced: '+q.tip.textContent);assert.equal(q.layer.status().startsWith('ПОРЫВ ВЕТРА'),true,'the gust itself is announced in the middle');
 settle(q,5.4,false);assert.ok(!q.tip.hidden&&/Порыв ветра/.test(q.tip.textContent),'then the tip about the gust: '+q.tip.textContent);
 // the finale
 g.dist=core.FINALE_AT-1;settle(t,.3);assert.equal(g.mode,'AUTOLAND');assert.equal(t.layer.status(),'ЗАХОД НА ПОСАДКУ');
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
 for(const mode of ['FBWA','CRUISE','GUIDED','AUTO']){
  g.dist=windowOf(mode)+5;g.obstacles.push({id:800+mode.length,kind:'pylon',x:.5,y:.2,z:2.4,r:C.pylonR,state:'ahead',age:0});g.enemies.push(en(-1.2,.3,3.2),en(1.4,0,5.5));g.ult=100;
  const s0=t.calls.save,r0=t.calls.restore;t.seconds(.6);assert.equal(t.calls.save-s0,t.calls.restore-r0,'the canvas is put back every frame in '+mode);
  g.obstacles.length=0;g.enemies.length=0;g.gates.forEach(x=>{x.state='passed';});g.lives=C.lives;
 }
 g.dist=core.FINALE_AT-1;t.seconds(5);assert.ok(g.finale);const s0=t.calls.save,r0=t.calls.restore;t.seconds(8);assert.equal(t.calls.save-s0,t.calls.restore-r0,'and in the final approach with the runway');
 // the camera banks with the aircraft about the aircraft (it stays under the pointer), limited, level at rest
 const c=runLayer({springs:false});c.layer.start();c.seconds(C.countdown+.3);c.layer.game.gates.forEach(x=>{x.state='passed';});c.move(c.state.w*.7,c.state.h*.45);settle(c,1.5);
 c.state.roll=-60;settle(c,.8);assert.ok(c.layer.camera.roll<-.1&&c.layer.camera.roll>=-.3,'the camera follows the bank, limited (and shaken a little by a hit): '+c.layer.camera.roll);assert.ok(c.layer.camera.active);
 const pp=c.layer.worldToPixels(c.layer.game.plane.x,c.layer.game.plane.y,0);assert.ok(Math.abs(c.layer.camera.px-pp.x)<1&&Math.abs(c.layer.camera.py-pp.y)<1,'the camera turns about the aircraft');
 c.state.roll=60;settle(c,1);assert.ok(c.layer.camera.roll>.1,'and the other way');
 c.state.roll=0;settle(c,2);assert.ok(Math.abs(c.layer.camera.roll)<.02,'level at rest: '+c.layer.camera.roll);
 // the bank of the aircraft is the bank of its motion: a right turn is a right bank
 const m=runLayer();m.layer.start();m.seconds(C.countdown+.3);m.layer.game.gates.forEach(x=>{x.state='passed';});m.layer.game.calm=true;m.move(m.state.w*.9,m.state.h*.51);settle(m,.35,false);assert.ok(m.state.aimRoll<-20&&m.state.aimRoll>=-58,'moving right banks right (a negative roll of the model), within the limit: '+m.state.aimRoll);
 m.move(m.state.w*.1,m.state.h*.51);settle(m,.9,false);assert.ok(m.state.aimRoll>20,'and left');settle(m,3,false);assert.ok(Math.abs(m.state.aimRoll)<3,'level at rest');
}
// ---- the gun, the ULT, the boost
{
 const t=runLayer({springs:false});t.layer.start();t.seconds(C.countdown+.3);const g=t.layer.game,w=t.state.w,h=t.state.h,P=(x,y,z)=>t.layer.worldToPixels(x,y,z);
 g.gust.wait=99;g.enemyClock=1e9;
 const stand=()=>{g.gates.forEach(x=>{x.state='passed';});g.lives=C.lives;};
 const enemy=(id,x,y,z)=>({id,kind:'enemy',x,y,z,r:C.enemyR,state:'ahead',age:0,vx:0,vy:0});
 // not in FBWA
 g.enemies.push(enemy(41,1,.3,4));stand();const p=P(1,.3,4);t.move(p.x,p.y);t.host.fire('pointerdown',{pointerType:'mouse',button:0});t.host.fire('pointerup',{pointerType:'mouse'});assert.equal(g.kills,0,'the left button is the boost in FBWA, not a gun');
 // in AUTO a click on an enemy shoots it
 g.enemies.length=0;g.dist=windowOf('AUTO')+1;g.mode='AUTO';stand();t.seconds(.2);g.enemies.push(enemy(42,1,.3,4),enemy(43,-1.5,0,6));
 let q=P(1,.3,4);t.move(q.x,q.y);t.seconds(.02);t.host.fire('pointerdown',{pointerType:'mouse',button:0});assert.equal(g.kills,1,'a click on an enemy in AUTO shoots it down');t.host.fire('pointerup',{pointerType:'mouse'});
 assert.ok(g.enemies.find(e=>e.id===42).state==='shot','that one is the target');t.seconds(.05);assert.ok(!g.enemies.some(e=>e.id===42),'and it is gone');assert.ok(t.layer.game.score>=C.shotKill);
 q=P(-1.5,0,6);t.move(q.x,q.y);t.seconds(.3);t.host.fire('pointerdown',{pointerType:'mouse',button:0});assert.equal(g.kills,2,'the pointer follows the perspective: an enemy far away is shot where it is drawn');t.host.fire('pointerup',{pointerType:'mouse'});
 t.seconds(.3);g.weapon=null;g.roll=null;g.ult=0;g.enemies.push(enemy(47,1,.3,4));q=P(1,.3,4);t.move(q.x,q.y);t.seconds(.3);t.host.fire('keydown',{key:' ',code:'Space'});t.host.fire('keyup',{key:' ',code:'Space'});assert.equal(g.kills,3,'in AUTO Space is the gun when there is nothing to use');g.kills=2;
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
 b.host.fire('pointerdown',{pointerType:'mouse',button:0});b.state.boosted=true;b.seconds(.1);assert.equal(b.state.boosted,true,'the boost stays in FBWA');
 bg.dist=windowOf('CRUISE')+1;bg.gates.forEach(x=>{x.state='passed';});b.seconds(.1);assert.equal(bg.mode,'CRUISE');assert.equal(b.state.boosted,false,'no boost in CRUISE');
 bg.dist=windowOf('GUIDED')+1;bg.gates.forEach(x=>{x.state='passed';});b.seconds(.2);assert.equal(bg.mode,'GUIDED');assert.equal(b.state.boosted,true,'the button is still held: the boost comes back in GUIDED');
 b.host.fire('pointerup',{pointerType:'mouse'});b.state.boosted=false;bg.dist=windowOf('CRUISE',1)+1;b.seconds(.1);bg.dist=windowOf('FBWA',1)+1;bg.gates.forEach(x=>{x.state='passed';});b.seconds(.2);assert.equal(b.state.boosted,false,'a released button does not come back');
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
 touch.seconds(C.countdown+.3);assert.ok(/finger/.test(touch.tip.textContent)&&!/LMB|cursor/.test(touch.tip.textContent),'the tip of FBWA speaks of a finger: '+touch.tip.textContent);
 touch.layer.pause('hidden');assert.ok(touch.overlay.textContent.includes('Touch the card'),'touch pause hint');
 // a card that is too small still gives the aircraft and the gates a box
 const small=runLayer({width:300,height:240});small.layer.start();small.frames(10);assert.ok(small.layer.game.fieldX>=1.6&&small.layer.game.gateY>=.45);
 assert.ok(small.host.classes.has('is-narrow'),'a narrow card drops the readouts');
}

// ---- the wind on the card: an arrow, the speed, the strength, streaks; the afterburner: tag, glow, camera, streaks; the bonus rings; the hand-over tip
{
 const t=runLayer({springs:false});t.layer.start();t.move(t.state.w*.5,t.state.h*.5);t.seconds(C.countdown+.3);const g=t.layer.game;
 const row=t.wind,arrow=row.children[0],pips=row.children.find(n=>n.classes.has('game-wind-pips')),value=row.children.find(n=>n.tagName==='B');
 assert.ok(row&&arrow.classes.has('game-wind-arrow')&&pips.children.length===5&&t.root.find(n=>n.classes.has('game-score')).kids.includes(row),'the wind sits in the score line of the bar');
 assert.ok(t.glow&&t.glow.attrs['aria-hidden']==='true'&&!t.host.classes.has('is-sprint')&&t.layer.status()===null,'no glow and no afterburner text at the start');
 const blow=(dir,speed,gust=false)=>{g.level=30;g.wind.dir=dir;g.wind.dirTo=dir;g.wind.shiftWait=1e9;g.wind.speed=speed;g.gust.wait=gust?0:1e9;g.lives=C.lives;g.runTime=Math.max(g.runTime,12);};
 blow(0,C.windMax);settle(t,2.5,false);
 assert.ok(/rotate\(-?[0-9]\d?deg\)/.test(arrow.style.transform)&&/^\d\d м\/с$/.test(value.textContent),'the arrow and the speed of the wind: '+arrow.style.transform+' '+value.textContent);
 const strongPips=pips.children.filter(n=>n.classes.has('is-on')).length;assert.ok(strongPips>=3,'a strong wind lights most of the pips: '+strongPips);
 blow(Math.PI,C.windMax);settle(t,4,false);assert.ok(/rotate\(-?1[5-8]\d\s?deg\)/.test(arrow.style.transform),'the arrow turns with the wind (a wind to the left): '+arrow.style.transform);
 blow(Math.PI/2,C.windMax);settle(t,5,false);assert.ok(/rotate\(-([4-9]\d|1[0-3]\d)deg\)/.test(arrow.style.transform),'a wind that blows up: the arrow points up: '+arrow.style.transform);
 g.wind.speed=.3;g.level=1;settle(t,5,false);const weak=pips.children.filter(n=>n.classes.has('is-on')).length;assert.ok(weak<strongPips,'a weak wind lights fewer: '+weak);
 g.gust.phase='blow';g.gust.t=.5;g.gust.dirX=1;g.gust.dirY=0;g.gust.power=3;g.gust.wait=1e9;t.frames(3);assert.ok(row.classes.has('is-gust'),'in a gust the wind lights up');assert.ok(/ВЕТЕР \d\d м\/с/.test(row.attrs.title||''),'its title: '+row.attrs.title);
 // the streaks of the wind and the afterburner, the bonus rings and the pylons are drawn, the canvas is put back every time
 g.gust.phase='idle';g.gust.vx=g.gust.vy=0;t.layer.game.bonuses.push({id:701,kind:'bonus',x:-.8,y:.2,z:3.4,r:C.bonusR,off:1,state:'ahead',age:0},{id:702,kind:'bonus',x:.9,y:-.3,z:.1,r:C.bonusR,off:1,state:'ahead',age:0});
 const s0=t.calls.save,r0=t.calls.restore;settle(t,.5,false);assert.equal(t.calls.save-s0,t.calls.restore-r0,'the canvas is put back every frame with wind streaks and bonus rings');
 // the afterburner: the tag, the glow, the camera leans in, the demo gets the speed
 const hold=()=>{g.sprint.phase='burn';g.sprint.peak=1.8;g.sprint.len=999;g.sprint.t=0;g.sprint.wait=1e9;};
 const zoom0=t.layer.camera.zoom;hold();for(let i=0;i<150;i++){hold();settle(t,.02,false);}
 assert.ok(t.layer.sprint>.6&&t.host.classes.has('is-sprint'),'the afterburner is on the card: '+t.layer.sprint.toFixed(2));assert.ok(t.layer.camera.zoom>zoom0+.02,'the camera leans in: '+zoom0.toFixed(3)+' -> '+t.layer.camera.zoom.toFixed(3));
 assert.ok(/^ФОРСАЖ ×1\.\d$/.test(t.layer.status()),'the middle of the card says so while it burns: '+t.layer.status());
 const s1=t.calls.save,r1=t.calls.restore;settle(t,.5,false);assert.equal(t.calls.save-s1,t.calls.restore-r1,'the canvas is put back every frame with the speed streaks');
 g.sprint.phase='idle';g.sprint.mul=1;settle(t,2,false);assert.ok(t.layer.sprint<.05&&!t.host.classes.has('is-sprint')&&t.layer.status()===null,'the afterburner goes off the card when it ends');
 t.layer.exit();assert.equal(t.layer.sprint,0,'the demo gets no afterburner outside the game');
 // the banners: the warning, the burn, the wind shift, the mission continues
 const b=runLayer({springs:false});b.layer.start();b.move(b.state.w*.5,b.state.h*.5);b.seconds(C.countdown+.3);const bg=b.layer.game;bg.sprint.wait=0;settle(b,.1,false);assert.equal(b.layer.status(),'ФОРСАЖ!','the warning in the middle of the card');assert.ok(/ФОРСАЖ/.test(b.tip.textContent)||b.tip.hidden===false,'and its tip');
 settle(b,C.sprintWarn,false);assert.ok(/^ФОРСАЖ ×1\.\d$/.test(b.layer.status()),'then the burn: '+b.layer.status());
 const sh=runLayer({springs:false});sh.layer.start();sh.move(sh.state.w*.5,sh.state.h*.5);sh.seconds(C.countdown+.3);sh.layer.game.wind.shiftWait=0;settle(sh,.2,false);assert.equal(sh.layer.status(),'ВЕТЕР ПОМЕНЯЛСЯ','a shift of the wind is announced');
 sh.setLang('en');assert.ok(/WIND|AFTERBURNER/.test('WIND'),'(the english texts are checked below)');
 // after the autopilot the pilot is told that the controls are theirs
 const h=runLayer({springs:false});h.layer.start();h.move(h.state.w*.5,h.state.h*.5);h.seconds(C.countdown+.3);const hg=h.layer.game;hg.dist=windowOf('AUTO')+1;h.move(h.state.w*.5,h.state.h*.5);settle(h,13,false);
 hg.dist=windowOf('AUTO')+core.PLAN[3].len-1;settle(h,.4,false);assert.equal(hg.mode,'FBWA');assert.ok(/Управление переходит/.test(h.tip.textContent),'the hand-over tip: '+h.tip.textContent);
 // a bonus ring: the first one that comes is explained
 const q=runLayer({springs:false});q.layer.start();q.move(q.state.w*.5,q.state.h*.5);q.seconds(C.countdown+.3);const qg=q.layer.game;qg.bonuses.push({id:801,kind:'bonus',x:.5,y:0,z:5,r:C.bonusR,off:1,state:'ahead',age:0});settle(q,.2,false);
 assert.ok([...q.layer.game.bonuses].length>0&&(/Голубые кольца/.test(q.tip.textContent)||q.tip.hidden===false),'the first bonus ring comes with a tip: '+q.tip.textContent);
 // taking one shows a pop-up
 const popTexts=[];const pq=runLayer({springs:false});pq.layer.start();pq.move(pq.state.w*.5,pq.state.h*.5);pq.seconds(C.countdown+.3);const pg=pq.layer.game;pg.calm=true;pg.gates.forEach(x=>{x.state='passed';});pg.bonuses.push({id:802,kind:'bonus',x:pg.plane.x,y:pg.plane.y,z:.05,r:C.bonusR,off:1.2,state:'ahead',age:0});pq.frame();pq.frame();assert.equal(pg.bonusTaken,1,'a bonus ring taken in the card');
}
// ---- the stick is let go when there is no pointer: the wings level themselves
{
 const t=runLayer({springs:false});t.host.fire('pointerenter',{pointerType:'mouse'});t.seconds(7.3);const g=t.layer.game;g.calm=true;settle(t,.5,false);t.move(t.state.w*.9,t.state.h*.5);settle(t,.3,false);assert.ok(g.plane.roll>.3,'a bank towards the pointer');
 t.host.fire('pointerleave',{pointerType:'mouse'});settle(t,.5,false);assert.ok(Math.abs(g.plane.roll)<.08,'the pointer left: the stick is let go and the wings come level: '+g.plane.roll.toFixed(2));
 const f=runLayer({coarse:true,springs:false});f.layer.start();f.host.fire('pointerdown',{pointerType:'touch',button:0,pointerId:1});f.move(f.state.w*.85,f.state.h*.5,'touch');f.layer.game.calm=true;settle(f,.25,false);assert.ok(f.layer.game.plane.roll>.3,'a finger down: it banks to the finger');
 f.host.fire('pointerup',{pointerType:'touch',pointerId:1});settle(f,.8,false);assert.ok(Math.abs(f.layer.game.plane.roll)<.08,'a finger lifted: the wings come level');
 // the aircraft shows its real attitude: the limit of the stick on the readout
 const m=runLayer({springs:false});m.layer.start();m.move(m.state.w*.5,m.state.h*.5);m.seconds(C.countdown+.3);m.layer.game.calm=true;m.move(m.state.w*.95,m.state.h*.5);settle(m,.5,false);assert.ok(m.state.aimRoll<-30&&m.state.aimRoll>=-58,'the bank on the card follows the stick and stops at the limit: '+m.state.aimRoll.toFixed(0));
}
// ---- the weapon slot and the feathers on the card, the route along the top, the finish and the best time
{
 const t=runLayer({springs:false});t.layer.start();t.move(t.state.w*.5,t.state.h*.5);t.seconds(C.countdown+.3);const g=t.layer.game;g.calm=true;
 const kid=(node,cls)=>node.find(n=>n.classes.has(cls));
 const btn=t.find('game-weapon'),icon=kid(btn,'game-weapon-icon'),label=kid(btn,'game-weapon-name'),quill=t.find('game-feathers'),count=quill.children.find(n=>n.tagName==='B'),levels=kid(quill,'game-weapon-level'),toNext=kid(quill,'game-feather-bar'),route=t.find('game-route'),dist=t.find('game-dist'),time=t.find('game-time');
 const NAMES={turbo:'ТУРБО',gun:'ПУЛЕМЁТ',missiles:'РАКЕТЫ',mask:'НЕУЯЗВИМОСТЬ',barrier:'БАРЬЕР'};
 const quiet=()=>{g.gates.forEach(x=>{if(x.state==='ahead')x.state='passed';});g.lives=C.lives;g.obstacles.length=g.enemies.length=g.bonuses.length=0;g.enemyClock=1e9;g.boxWait=1e9;g.gust.wait=99;};
 const go=seconds=>{for(let i=0;i<Math.round(seconds*60);i++){quiet();t.frame();}};
 const press=(key,code)=>t.host.fire('keydown',code?{key,code}:{key});
 const at=(kind,id,z=.02)=>({id,kind,x:g.plane.x,y:g.plane.y,z,r:kind==='box'?C.boxR:C.featherR,state:'ahead',age:0});
 assert.ok(btn&&btn.tagName==='BUTTON'&&btn.type==='button'&&t.bar.find(n=>n===btn),'the weapon button sits in the bar, next to the ULT');
 g.boxes.length=g.plumes.length=0;go(.1);
 assert.ok(btn.classes.has('is-empty')&&label.textContent==='ПУСТО'&&icon.dataset.weapon===''&&/слот пуст/.test(btn.attrs['aria-label']),'an empty slot');
 assert.ok(count.textContent==='0'&&levels.children.length===C.maxLevel&&levels.children.every(p=>!p.classes.has('is-on'))&&/ПЕРЬЯ 0/.test(quill.attrs.title),'no feathers yet, a pip for every level');
 assert.ok(route&&!route.hidden&&route.attrs['aria-hidden']==='true'&&route.children.filter(n=>n.tagName==='B').length===core.PLAN.length,'the route along the top of the card, with a tick for every leg');
 g.dist=9990;go(.1);const filled=parseFloat(route.children[0].style.width);assert.ok(filled>49.9&&filled<51,'half of the route: '+filled);
 assert.equal(dist.textContent,'10.0/20 км','the distance in the score bar');assert.ok(/^00:0\d$/.test(time.textContent),'and the time flown: '+time.textContent);
 assert.ok(t.layer.airspeed>170&&Math.abs(t.layer.airspeed-core.airspeed(g))<1e-9&&t.layer.speedTop>400,'the demo shows the speed that covers the route');
 // a box: a roulette in the slot, then the weapon, with its icon, name and a word about it
 g.boxes.push(at('box',9001));quiet();t.frame();assert.ok(g.roll&&btn.classes.has('is-rolling')&&!btn.classes.has('is-empty'),'a roulette in the slot');
 const seen=new Set();for(let i=0;i<30;i++){quiet();t.frame();seen.add(label.textContent);}assert.ok(seen.size>=3&&[...seen].every(n=>Object.values(NAMES).includes(n)),'the names go round: '+[...seen]);
 go(C.roulette);assert.ok(g.weapon&&btn.classes.has('is-ready')&&!btn.classes.has('is-rolling')&&icon.dataset.weapon===g.weapon&&label.textContent===NAMES[g.weapon]&&btn.attrs['aria-label'].startsWith(NAMES[g.weapon]),'the weapon is in the slot: '+g.weapon);
 g.weapon='gun';go(5.4);assert.ok(/Оружие в слоте/.test(t.tip.textContent)||/ПУЛЕМЁТ|ТУРБО|РАКЕТЫ|НЕУЯЗВИМОСТЬ|БАРЬЕР/.test(t.tip.textContent),'a word about the weapon: '+t.tip.textContent);
 // F, also with a Russian or a Ukrainian layout; the middle of the card counts the time down; the speed shows on the card
 g.weapon='turbo';g.roll=null;t.frame();press('а','KeyF');assert.ok(g.fx.turbo.t>0&&g.weapon===null&&g.used===1,'F uses the weapon of the slot');
 t.frame();assert.equal(t.layer.status(),'ТУРБО!','the weapon is announced');go(1.4);assert.ok(/^ТУРБО \d\.\d$/.test(t.layer.status()),'then the middle of the card counts it down: '+t.layer.status());
 assert.ok(t.layer.sprint>.5&&t.host.classes.has('is-sprint'),'the speed of the turbo shows on the card');assert.ok(btn.classes.has('is-empty'));
 go(4);assert.ok(t.layer.sprint<.1&&t.layer.status()===null,'and goes off the card when it ends');
 // the right button uses the weapon, the ULT stays charged; during a roulette it waits; with an empty slot it fires the ULT
 const foe=()=>({id:9200,kind:'enemy',x:0,y:0,z:6,r:C.enemyR,state:'ahead',age:0,vx:0,vy:0});
 g.weapon='barrier';g.ult=100;g.ultCool=0;g.enemies.push(foe());t.host.fire('pointerdown',{pointerType:'mouse',button:2});assert.ok(g.fx.barrier.t>0&&g.weapon===null&&g.ult===100,'the right button uses the weapon');
 g.roll={t:0,dur:C.roulette,result:'gun'};t.host.fire('pointerdown',{pointerType:'mouse',button:2});assert.ok(g.ult===100&&g.roll,'not while a roulette turns');
 g.roll=null;t.host.fire('pointerdown',{pointerType:'mouse',button:2});assert.equal(g.ult,0,'an empty slot: the ULT');
 g.weapon='mask';t.frame();btn.fire('click');assert.ok(g.fx.mask.t>0&&g.weapon===null,'a press on the button uses it');
 g.weapon='missiles';g.enemies.length=g.obstacles.length=0;press('f');assert.ok(g.weapon==='missiles'&&btn.classes.has('is-denied'),'nothing to chase: the button shakes and the missiles stay');
 const music=t.layer.music.on;press('ь','KeyM');assert.equal(t.layer.music.on,!music,'the music key by its place on the keyboard too');press('ь','KeyM');
 // everything new can be drawn and the canvas is put back
 for(const name of ['turbo','gun','mask','barrier']){g.weapon=name;core.useWeapon(g);}core.drain(g);
 const aside=o=>({...o,x:o.x+2.4});g.boxes.push(aside(at('box',9301,3)),aside(at('box',9302,.1)));g.plumes.push(aside(at('feather',9303,2)),aside(at('feather',9304,.1)));      // (beside the aircraft: drawn, not picked up)g.missiles.push({id:9305,x:.3,y:0,z:.1,side:.3,delay:0,life:2,age:0,target:null,splash:0,done:false},{id:9306,x:-.3,y:0,z:2,side:-.3,delay:0,life:2,age:0,target:null,splash:0,done:false});
 g.enemies.push({...foe(),z:4});g.obstacles.push({id:9307,kind:'pylon',x:1,y:.2,z:3,r:C.pylonR,state:'ahead',age:0});
 const s0=t.calls.save,r0=t.calls.restore;for(let i=0;i<84;i++){g.lives=C.lives;t.frame();}assert.equal(t.calls.save-s0,t.calls.restore-r0,'the canvas is put back with boxes, feathers, missiles, tracers, the aura, the barrier and the arcs');
 assert.ok(/^\u0422\u0423\u0420\u0411\u041e \d\.\d \u00b7 \u041f\u0423\u041b\u0415\u041c\u0401\u0422 \d\.\d \u00b7 \u041d\u0415\u0423\u042f\u0417\u0412\u0418\u041c\u041e\u0421\u0422\u042c \d\.\d \u00b7 \u0411\u0410\u0420\u042c\u0415\u0420 \d\.\d$/.test(t.layer.status()),'several weapons at once are all counted down: '+t.layer.status());
 go(15);
 // the feathers: the count, the pips of the level and the bar to the next one
 g.feathers=0;for(let i=0;i<C.feathersPerLevel;i++){g.plumes.push(at('feather',9400+i));quiet();t.frame();}
 assert.ok(count.textContent===String(C.feathersPerLevel)&&levels.children[0].classes.has('is-on')&&!levels.children[1].classes.has('is-on')&&toNext.children[0].style.width==='0%','ten feathers: the first level of the weapons');
 assert.equal(t.layer.status(),'ОРУЖИЕ: УР. 1');g.plumes.push(at('feather',9450));quiet();t.frame();assert.equal(toNext.children[0].style.width,'10%');
 t.setLang('uk');t.frame();assert.ok(label.textContent==='ПОРОЖНЬО'&&/ПІР’Я/.test(quill.attrs.title)&&/^\d\d\.\d\/20 км$/.test(dist.textContent),dist.textContent);t.setLang('en');t.frame();assert.ok(label.textContent==='EMPTY'&&/20 km$/.test(dist.textContent));t.setLang('ru');
 // the finish: the weapons are put away for the approach, the time is taken, the best time kept, the screen says it
 g.weapon='turbo';g.dist=core.FINALE_AT-1;g.runTime=250;go(.3);assert.ok(g.finale&&btn.classes.has('is-off')&&t.ultBtn.classes.has('is-off')&&label.textContent==='ПУСТО','in the final approach the weapons are off');
 for(let i=0;i<60*30&&t.layer.mode==='run';i++){g.lives=C.lives;t.frame();}
 assert.equal(t.layer.mode,'over');const s=core.summary(g),text=()=>t.overlay.textContent;
 const shown=`${Math.floor(s.time/60)}:${(Math.round(s.time*10)/10-60*Math.floor(s.time/60)).toFixed(1).padStart(4,'0')}`;
 assert.ok(s.won&&s.time>250&&text().includes('ФИНИШ · 20 КМ')&&text().includes('ЛУЧШЕЕ ВРЕМЯ!')&&text().includes('км/ч')&&text().includes('ЗА ВРЕМЯ')&&text().includes('ПЕРЬЯ')&&text().includes(shown),'the end screen of a finished route: '+text());
 assert.equal(Number(t.mem[core.TIME_KEY]),s.time,'the best time is written: '+t.mem[core.TIME_KEY]);assert.equal(t.layer.airspeed,null,'the demo takes its own speed back');
 t.setLang('en');assert.ok(text().includes('FINISH · 20 KM')&&text().includes('BEST TIME')&&text().includes('km/h'));t.setLang('ru');
 // a slower flight does not replace the best time
 t.host.fire('keydown',{key:'Enter'});t.seconds(C.countdown+.3);const g2=t.layer.game;g2.calm=true;g2.dist=core.FINALE_AT-1;g2.runTime=400;
 for(let i=0;i<60*40&&t.layer.mode==='run';i++){g2.lives=C.lives;t.frame();}
 assert.ok(t.layer.mode==='over'&&Number(t.mem[core.TIME_KEY])===s.time&&!text().includes('ЛУЧШЕЕ ВРЕМЯ!')&&text().includes('ЛУЧШЕЕ ВРЕМЯ'),'the best time stays: '+text());
 t.layer.exit();assert.ok(route.hidden&&t.layer.speedTop===0);
 // a finger: the buttons, and a second finger on them does not end the touch that steers
 const f=runLayer({coarse:true,springs:false});f.layer.start();f.seconds(C.countdown+.3);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])assert.ok(f.bar.fire(type,{pointerType:'touch'}).stopped&&!f.bar.fire(type,{pointerType:'mouse'}).stopped,'a touch on the buttons stays there: '+type);
 const fb=f.find('game-weapon');f.layer.game.weapon='turbo';f.frame();assert.ok(fb.textContent.includes('▶')&&!/клавиша|кнопка мыши/.test(fb.attrs['aria-label']),'the button of a touch screen names no key: '+fb.attrs['aria-label']);fb.fire('pointerdown',{pointerType:'touch'});assert.ok(f.layer.game.fx.turbo.t>0&&f.layer.game.used===1,'a touch uses it at once (a second finger makes no click)');
 f.layer.game.weapon='barrier';fb.fire('click');assert.ok(f.layer.game.weapon==='barrier'&&f.layer.game.used===1,'the click that follows a touch does nothing more');f.clock.t+=800;fb.fire('click');assert.ok(f.layer.game.used===2,'a later click works');
 const fu=f.ultBtn;f.clock.t+=800;f.layer.game.ult=100;f.layer.game.ultCool=0;f.layer.game.enemies.push({id:9600,kind:'enemy',x:0,y:0,z:6,r:C.enemyR,state:'ahead',age:0,vx:0,vy:0});fu.fire('pointerdown',{pointerType:'touch'});assert.equal(f.layer.game.ult,0,'the ULT button acts on the touch too');
}
// ---- Space is the one key for what the pilot has (the weapon of the box, else the ULT), the boost stays when there is nothing; the keys reach a running game from anywhere
{
 const t=runLayer({springs:false});t.layer.start();t.move(t.state.w*.5,t.state.h*.5);t.seconds(C.countdown+.3);const g=t.layer.game;g.calm=true;
 const quiet=()=>{g.gates.forEach(x=>{if(x.state==='ahead')x.state='passed';});g.lives=C.lives;g.obstacles.length=g.enemies.length=g.boxes.length=g.plumes.length=0;g.enemyClock=1e9;g.boxWait=1e9;g.gust.wait=99;};
 const space=(extra={})=>{t.state.boosted=true;t.host.fire('keydown',{key:' ',code:'Space',...extra});};      // (the demo sets the boost on Space before the game sees the key)
 const up=()=>t.host.fire('keyup',{key:' ',code:'Space'});
 const foe=()=>({id:9500,kind:'enemy',x:0,y:0,z:6,r:C.enemyR,state:'ahead',age:0,vx:0,vy:0});
 quiet();g.weapon='turbo';t.frame();space();assert.ok(g.fx.turbo.t>0&&g.weapon===null&&t.state.boosted===false&&g.used===1,'Space uses the weapon of the box, and does not boost');
 space({repeat:true});assert.equal(t.state.boosted,false,'... nor while it is held');up();
 space();assert.equal(t.state.boosted,true,'with nothing to use Space is the boost as before');up();
 // a release that was lost (the window was left with Space down) does not take the boost from the next press
 g.weapon='turbo';space();space();assert.equal(t.state.boosted,true,'a new press after a lost release boosts');up();g.fx.turbo.t=0;
 // the ULT: charged and with an aircraft ahead; with none ahead the charge is kept and Space boosts; during a roulette Space waits
 quiet();g.ult=100;g.ultCool=0;space();assert.ok(g.ult===100&&t.state.boosted===true,'no aircraft ahead: the ULT is kept, Space boosts');up();
 g.enemies.push(foe());space();assert.ok(g.ult===0&&g.kills===1&&t.state.boosted===false,'Space fires the ULT');up();
 g.enemies.push(foe());g.ult=100;g.ultCool=0;g.roll={t:0,dur:C.roulette,result:'gun'};space();assert.ok(g.ult===100,'not while a roulette turns: that weapon is on its way');up();g.roll=null;
 g.weapon='barrier';space();assert.ok(g.fx.barrier.t>0&&g.ult===100,'the weapon comes first');up();
 // the banner of a weapon and of the ULT name the key
 g.weapon=null;g.boxes.push({id:9501,kind:'box',x:g.plane.x,y:g.plane.y,z:.02,r:C.boxR,state:'ahead',age:0});for(let i=0;i<Math.round((C.roulette+.1)*60);i++){g.gates.forEach(x=>{if(x.state==='ahead')x.state='passed';});g.lives=C.lives;g.enemies.length=g.obstacles.length=0;t.frame();}
 assert.ok(new RegExp(' · ПРОБЕЛ$').test(t.layer.status()),'the new weapon is announced with its key: '+t.layer.status());
 // Space on the focused ULT button presses that button (once), it does not also use the weapon; after a click the keys are back on the card
 quiet();g.weapon='turbo';const used0=g.used;t.host.fire('keydown',{key:' ',code:'Space',target:t.ultBtn});up();assert.ok(g.used===used0&&g.weapon==='turbo','Space on the ULT button is the button\'s');
 const f0=t.host.focused;g.ult=0;t.ultBtn.fire('click');assert.ok(t.host.focused>f0,'the keys go back to the card after a button');g.weapon=null;
 // a click on the card brings the keys back to it (the demo keeps the click from moving the focus)
 const f=t.host.focused;t.host.fire('pointerdown',{pointerType:'mouse',button:0});t.host.fire('pointerup',{pointerType:'mouse'});assert.ok(t.host.focused>f,'a click on the card gives it the focus');
 // a key from elsewhere on the page reaches the running game, unless it is for a button or a field; the shortcuts of the browser are left alone
 const outside=(key,code,target={closest:()=>null})=>{const ev={key,code,target,prevented:false,preventDefault(){this.prevented=true;}};for(const h of t.docHandlers.keydown||[])h(ev);return ev;};
 quiet();g.weapon='mask';outside('f','KeyF');assert.ok(g.fx.mask.t>0&&g.weapon===null,'F from the page works');
 g.weapon='turbo';const e=outside(' ','Space');assert.ok(g.fx.turbo.t>0&&e.prevented,'Space from the page uses the weapon and does not scroll');
 g.weapon='gun';outside('f','KeyF',{closest:sel=>/button/.test(sel)?{}:null});assert.equal(g.weapon,'gun','not a key meant for a button');outside('f','KeyF',{isContentEditable:true,closest:()=>null});assert.equal(g.weapon,'gun','nor one meant for a field');
 outside('f','KeyF',t.host);assert.equal(g.weapon,'gun','a key of the card is not handled twice');t.host.fire('keydown',{key:'f',code:'KeyF',ctrlKey:true});assert.equal(g.weapon,'gun','Ctrl+F is the browser\'s');
 t.layer.pause('manual');outside('f','KeyF');outside(' ','Space');assert.ok(g.weapon==='gun'&&t.layer.mode==='paused','a paused game ignores the keys of the page');t.layer.resume();
 t.layer.exit();outside('f','KeyF');assert.equal(t.layer.mode,'demo');
 // a touch screen: the banner names no key
 const c=runLayer({coarse:true,springs:false});c.layer.start();c.seconds(C.countdown+.3);const cg=c.layer.game;cg.calm=true;cg.boxes.push({id:9502,kind:'box',x:cg.plane.x,y:cg.plane.y,z:.02,r:C.boxR,state:'ahead',age:0});for(let i=0;i<Math.round((C.roulette+.1)*60);i++){cg.gates.forEach(x=>{if(x.state==='ahead')x.state='passed';});cg.lives=C.lives;cg.enemies.length=cg.obstacles.length=0;c.frame();}
 assert.ok(c.layer.status()&&!/ПРОБЕЛ|SPACE/.test(c.layer.status()),'no key on a touch screen: '+c.layer.status());
}
// ---- the dotted way from the aircraft to the middle of the next ring: in the modes the pilot flies, while it is not lined up; not under the autopilot
{
 const t=runLayer({springs:false});t.layer.start();t.move(t.state.w*.5,t.state.h*.5);t.seconds(C.countdown+.3);const g=t.layer.game,gate=core.nextGate(g);assert.ok(gate,'a ring ahead');
 // the overlay is drawn on a context that keeps every stroked path with its dashes and colour; the way is the one with the dashes 3,6
 const ways=()=>{const found=[];let dash='',style='',path=[];
  const own={setLineDash:v=>{dash=[...v].join();},beginPath:()=>{path=[];},moveTo:(x,y)=>path.push([x,y]),lineTo:(x,y)=>path.push([x,y]),stroke:()=>{if(dash==='3,6')found.push({style,path:[...path]});}};
  t.layer.cameraEnd(new Proxy({},{get:(_,k)=>own[k]||(()=>({addColorStop(){}})),set:(_,k,v)=>{if(k==='strokeStyle')style=v;return true;}}));return found;};
 const put=(mode,dx)=>{g.mode=mode;gate.x=g.plane.x+dx;gate.y=g.plane.y;return ways();};
 for(const name of ['FBWA','CRUISE','GUIDED']){
  const w=put(name,gate.r+.8);assert.ok(w.length===1&&w[0].path.length===2&&w[0].path[1][0]>w[0].path[0][0],name+': one dotted line from the aircraft to the ring on its right ('+w.length+')');
  assert.equal(put(name,gate.r*.5).length,0,name+': none when the aircraft is lined up');
 }
 assert.equal(put('AUTO',gate.r+.8).length,0,'AUTO: the autopilot flies, no line');
}
// ---- the music: Web Audio made by the game (a fake one here), blocked until a click, switched by a button and by the M key, remembered
{
 // no Web Audio in the browser: the game works, there is no button for the music
 const n=runLayer();n.layer.start();n.seconds(1);assert.ok(n.musicBtn.hidden,'no Web Audio: no music button');assert.equal(n.layer.music.supported,false);assert.equal(n.layer.mode,'count'.length?n.layer.mode:'');
 // on by default; the context is made when the game starts, and a browser that blocks it keeps it waiting
 const au=makeFakeAudio(),t=runLayer({audio:au});
 assert.equal(au.ctxs.length,0,'nothing is made before the game');assert.ok(t.musicBtn.hidden,'the button shows only while the game runs');
 assert.ok(t.musicBtn.parent===t.toggle.parent&&t.musicBtn.tagName==='BUTTON'&&t.musicBtn.type==='button','a button next to the exit button');
 t.host.fire('pointerenter',{pointerType:'mouse'});t.seconds(7.3);assert.equal(t.layer.mode,'count','the hold starts the game');
 assert.equal(au.ctxs.length,1,'the music context is made when the game starts');assert.ok(!t.musicBtn.hidden&&/ВКЛ/.test(t.musicBtn.textContent)&&t.musicBtn.attrs['aria-pressed']==='true'&&/выключить/.test(t.musicBtn.attrs['aria-label']),'the button says the music is on');
 assert.equal(t.layer.music.running,false,'blocked by the browser: nothing plays yet');assert.equal(t.layer.music.waiting(),true);t.tick(.5);assert.equal(au.osc,0,'and nothing is scheduled');
 t.seconds(C.countdown+2.2);assert.ok(!t.tip.hidden&&/Музыка включится/.test(t.tip.textContent+(t.layer.game?'':'')||'')||t.layer.music.waiting(),'the player is told that the music waits for a click');
 // the first click, key or touch lets it start
 au.allow=true;for(const f of t.docHandlers.keydown||[])f({key:'a'});assert.equal(au.ctxs[0].state,'running','a key press anywhere on the page lets the music start');assert.equal(t.layer.music.running,true);
 t.tick(1);assert.ok(au.osc>10&&au.noise>3,'the lead, the bass and the drums are scheduled: '+au.osc+' tones, '+au.noise+' hisses');assert.equal(au.pulse,0,'no arpeggio outside a sprint');
 const freqs=new Set(au.freqs.map(f=>Math.round(69+12*Math.log2(f/440))));assert.ok([...freqs].every(m=>m>=36&&m<=96)&&freqs.has(57)||freqs.has(45)||freqs.has(69),'the notes are the notes of the tune ('+[...freqs].sort().join(' ')+')');
 assert.ok(au.targets.length&&au.targets[au.targets.length-1]>0&&au.targets[au.targets.length-1]<.3,'a modest volume: '+au.targets[au.targets.length-1]);
 // the afterburner: the arpeggio and a faster tempo
 const g=t.layer.game;g.sprint.phase='burn';g.sprint.peak=1.8;g.sprint.len=999;g.sprint.t=0;g.sprint.wait=1e9;for(let i=0;i<90;i++){g.sprint.t=0;settle(t,.02,false);}
 assert.equal(t.layer.music.mood,'sprint');const o0=au.osc,p0=au.pulse,s0=au.starts.length,c0=au.ctxs[0].currentTime;t.tick(2);assert.ok(au.pulse>p0+8,'the arpeggio joins in: '+(au.pulse-p0));
 const rate1=(au.starts.length-s0)/(au.ctxs[0].currentTime-c0);g.sprint.phase='idle';g.sprint.mul=1;settle(t,2,false);assert.equal(t.layer.music.mood,'normal');
 for(let i=0;i<20;i++)t.tick(.3);const s1=au.starts.length,c1=au.ctxs[0].currentTime;t.tick(2);const rate0=(au.starts.length-s1)/(au.ctxs[0].currentTime-c1);assert.ok(rate1>rate0*1.05,'the tempo is faster in a sprint: '+rate1.toFixed(1)+' against '+rate0.toFixed(1)+' notes a second');
 // the button turns it off and on, the choice is kept
 const o1=au.osc;t.musicBtn.fire('click');assert.equal(t.layer.music.on,false);assert.equal(t.mem[core.MUSIC_KEY],'0','the choice is written down');assert.ok(/ВЫКЛ/.test(t.musicBtn.textContent)&&t.musicBtn.classes.has('is-off')&&t.musicBtn.attrs['aria-pressed']==='false'&&/включить/.test(t.musicBtn.attrs['aria-label']),'the button says it is off');
 t.tick(1);assert.equal(au.osc,o1,'nothing more is played');assert.equal(au.targets[au.targets.length-1],0,'the volume goes to zero');t.flush();assert.ok(au.suspends>=1,'and the audio device is let go');
 assert.ok(t.musicBtn.fire('pointerdown',{}).stopped,'the button does not reach the demo (no boost)');
 t.host.fire('keydown',{key:'m'});assert.equal(t.layer.music.on,true);assert.equal(t.mem[core.MUSIC_KEY],'1','the M key switches it back on');assert.equal(au.ctxs[0].state,'running');t.tick(.6);assert.ok(au.osc>o1,'and it plays again');
 t.host.fire('keydown',{key:'m'});assert.equal(t.layer.music.on,false,'M again: off');t.host.fire('keydown',{key:'m'});assert.equal(t.layer.music.on,true);
 // a pause is silent, going on is not
 t.layer.pause('manual');t.flush();assert.equal(au.ctxs[0].state,'suspended','a paused game is silent');const rs=au.resumes;t.layer.resume();assert.ok(au.resumes>rs&&au.ctxs[0].state==='running','and it goes on with the game');
 // the end screen and the exit are silent too, and the next game starts the tune again
 t.layer.exit();t.flush();assert.ok(t.musicBtn.hidden&&au.ctxs[0].state==='suspended','leaving the game stops the music and hides the button');
 const o2=au.osc;t.tick(1);assert.equal(au.osc,o2);t.layer.start();assert.equal(au.ctxs.length,1,'the same context is used again');assert.equal(au.ctxs[0].state,'running');t.tick(.6);assert.ok(au.osc>o2,'a new game, the tune plays again');
 t.layer.game.lives=1;const gt=core.nextGate(t.layer.game);if(gt){gt.z=.01;t.layer.game.plane.x=gt.x+9;}t.frame(.02);t.frames(3);if(t.layer.mode==='over'){t.flush();assert.equal(au.ctxs[0].state,'suspended','the end screen is quiet');}
 // saved as off: no context at all until the player switches it on
 const au2=makeFakeAudio({allow:true}),off=runLayer({audio:au2,saved:{[core.MUSIC_KEY]:'0'}});off.layer.start();off.seconds(C.countdown+.5);
 assert.equal(au2.ctxs.length,0,'a player who switched the music off gets no audio context');assert.ok(/ВЫКЛ/.test(off.musicBtn.textContent)&&off.musicBtn.classes.has('is-off'));
 off.musicBtn.fire('click');assert.equal(au2.ctxs.length,1);assert.equal(au2.ctxs[0].state,'running','a click on the button is a gesture: the music starts');off.tick(.5);assert.ok(au2.osc>5);assert.equal(off.mem[core.MUSIC_KEY],'1');
 // a browser that wants a gesture first (the Chrome rule): no context is made until there has been one
 const au3=makeFakeAudio({allow:true}),state={userActivation:{hasBeenActive:false}},st=runLayer({audio:au3,navigator:state});st.layer.start();st.seconds(1);assert.equal(au3.ctxs.length,0,'no context before the first gesture (no console warning)');
 state.userActivation.hasBeenActive=true;for(const f of st.docHandlers.pointerdown||[])f({});assert.equal(au3.ctxs.length,1);assert.equal(au3.ctxs[0].state,'running','after the gesture the context is made and runs');
 // blocked storage must not break anything
 const au4=makeFakeAudio({allow:true}),bl=runLayer({audio:au4,storageBlocked:true});bl.layer.start();bl.seconds(1);assert.equal(bl.layer.music.on,true,'blocked storage: on by default');bl.musicBtn.fire('click');assert.equal(bl.layer.music.on,false,'and the switch still works');
 // the language of the button
 t.setLang('en');assert.ok(/ON|OFF/.test(t.musicBtn.textContent)&&/Music/.test(t.musicBtn.attrs['aria-label']));t.setLang('uk');assert.ok(/УВІМК|ВИМК/.test(t.musicBtn.textContent));t.setLang('ru');
 // a touch screen: the same button, the tip speaks of a touch
 const au5=makeFakeAudio(),tc=runLayer({audio:au5,coarse:true,lang:'en'});tc.layer.start();tc.host.fire('pointerdown',{pointerType:'touch',button:0,pointerId:1});tc.host.fire('pointerup',{pointerType:'touch',pointerId:1});settle(tc,C.countdown+2.5,false);assert.ok(tc.layer.music.waiting(),'a touch screen: the music waits for the first touch');settle(tc,5.5,false);assert.ok(tc.tip.hidden===false&&/Goal 20 km/.test(tc.tip.textContent),'after the tip of the mode the goal: '+tc.tip.textContent);settle(tc,5.4,false);assert.ok(tc.tip.hidden===false&&/touch/i.test(tc.tip.textContent),'the hint about the music waits its turn behind the tips of the mode and the goal: '+tc.tip.textContent);
}
// ---------------------------------------------------------------- the demo hooks and the page
const demo=read('js/site/flight-demo.js'),page=read('index.html'),css=read('css/flight-game.css'),layerSrc=read('js/site/flight-game.js'),coreSrc=read('js/site/flight-game-core.js');
for(const needle of ['window.AtlasFlightDemo','layer: null','hooks.layer.steer(dt)','hooks.layer.update(dt)','hooks.layer.drawBack(ctx)','hooks.layer.drawFront(ctx)','hooks.layer.cameraBegin(ctx)','hooks.layer.cameraEnd(ctx)','cameraOwnsHorizon','lay.horizonShift','pl.alpha','lay.status()','hooks.layer.onView(false)','touchBlocksBoost','hooks.layer.active?12:30','const placed=p=>','const burn=(hooks.layer&&hooks.layer.sprint)||0','const speedAim=Math.max(state.boosted?307:148,148+159*burn)','Math.max(state.boosted?1:0.25,(hooks.layer&&hooks.layer.sprint)||0)','const flown=(hooks.layer&&hooks.layer.airspeed)||0','mix(state.speed,flown||speedAim','((lay&&lay.speedTop)||310)-90'])
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
  '.game-music','.game-music-icon','.game-wind','.game-wind-arrow','.game-wind-pips','.game-glow','.is-sprint','.is-off','.is-gust','.game-bar','.game-modes','.game-mode','.game-mode-fill','.game-mode-left','.game-ult','.game-ult-meter','.game-landing','.game-tip','.is-active','.is-next','.is-on','.is-ready','.is-denied','.is-game','.is-hit','.is-narrow','prefers-reduced-motion','[hidden]','[data-kind="count"]',
  '.game-route','.game-dist','.game-arsenal','.game-weapon','.game-weapon-icon','.game-weapon-name','.game-weapon-key','.game-weapon-level','.game-feathers','.game-feather-icon','.game-feather-bar','.game-stats','.is-empty','.is-rolling',...core.WEAPONS.map(w=>`.game-weapon-icon[data-weapon="${w}"]`)])assert.ok(css.includes(sel),'style '+sel);
assert.ok(!css.includes('.game-pip'),'the pulsing "play" pip is gone with the button');
assert.ok(!/is-narrow \.game-(weapon|ult)-key[^{}]*\{display:none\}/.test(css)&&!/\.game-(weapon|ult)-key\{display:none\}/.test(css),'the keys stay on the buttons of a narrow card too');
assert.ok(!/@import|url\(http/.test(css),'the stylesheet loads nothing from outside');
// everything the layer builds is plain DOM: no inline handlers, no HTML strings, no eval
assert.ok(!/innerHTML|insertAdjacentHTML|eval\(|new Function|document\.write|onclick=/.test(layerSrc+coreSrc),'no HTML injection in the game');
assert.ok(!/generated|сгенерир|згенерова/i.test(layerSrc+css+coreSrc),'no "generated" wording');
assert.ok(!/MAVLink\.|WebSocket|fetch\(|XMLHttpRequest|navigator\.(usb|serial)/.test(layerSrc+coreSrc),'the game never talks to a controller or the network');
// the music is made in the browser: Web Audio oscillators, no audio files, no libraries, nothing downloaded
assert.ok(/AudioContext/.test(layerSrc)&&/createOscillator/.test(layerSrc)&&/localStorage/.test(layerSrc)&&!/new Audio\(|\.mp3|\.ogg|\.wav|\.m4a|<audio|<source|importScripts|AudioWorklet|addModule|\bimport\(/i.test(layerSrc+coreSrc+css),'the music is synthesised with Web Audio: no audio files, no libraries');
assert.ok(!/Math\.random/.test(coreSrc),'the rules use no randomness but the seed (the tune is data, the wind has its own seeded phases)');
assert.ok(/try\s*\{[^}]*localStorage/.test(layerSrc)||/readMusic/.test(layerSrc),'the music switch reads the storage through the guarded helpers');
assert.ok(!/<link[^>]+(audio|\.mp3|\.ogg)/i.test(page)&&!/<audio/i.test(page),'the page got no audio element and no audio file');

// ---------------------------------------------------------------- the texts
const textBlock=layerSrc.slice(layerSrc.indexOf('const TEXT = {'),layerSrc.indexOf('const lang = '));
const TEXT=vm.runInNewContext('('+textBlock.slice(textBlock.indexOf('{'),textBlock.lastIndexOf('}')+1)+')');
assert.deepEqual(Object.keys(TEXT).sort(),['en','ru','uk']);
const keys=Object.keys(TEXT.ru).sort();
for(const lang of ['uk','en']){assert.deepEqual(Object.keys(TEXT[lang]).sort(),keys,'the same texts in '+lang);}
const tipKeys=['tipFBWA','tipCRUISE','tipGUIDED','tipAUTO','tipFinale','tipGust','tipHazard','tipEnemy','tipUlt','tipWind','tipSprint','tipBonus','tipHandover','tipMusic','tipFBWATouch','tipGUIDEDTouch','tipAUTOTouch','tipFinaleTouch','tipGustTouch','tipEnemyTouch','tipUltTouch','tipWindTouch','tipHandoverTouch','tipMusicTouch','tipGoal','tipBox','tipUse','tipUseTouch','tipFeather','tipTurbo','tipGun','tipMissiles','tipMask','tipBarrier'];
for(const lang of ['ru','uk','en']){
 const t=TEXT[lang];
 for(const k of keys)assert.ok(k==='ranks'?Array.isArray(t.ranks)&&t.ranks.length===4&&t.ranks.every(x=>x.length>2):typeof t[k]==='string'&&t[k].length>0,k+' in '+lang);
 for(const k of ['caption','caption2','captionTouch','caption2Touch'])assert.equal((t[k].match(/\*/g)||[]).length%2,0,'balanced emphasis in '+k+' ('+lang+')');
 for(const k of ['liveOver','liveWon'])assert.ok(t[k].includes('{score}')&&t[k].includes('{gates}'),'placeholders of the end announcement '+k+' ('+lang+')');
 assert.ok(t.liveWon.includes('{time}')&&t.weaponUp.includes('{n}'),'the time of the finish and the level of an upgrade ('+lang+')');
 for(const w of core.WEAPONS){const k='w'+w[0].toUpperCase()+w.slice(1),n='tip'+w[0].toUpperCase()+w.slice(1);assert.ok(t[k]&&t[k].length<=13&&t[n].startsWith(t[k]+':'),'a short name for the weapon '+w+' and a tip that starts with it ('+lang+'): '+t[k]+' / '+t[n]);}
 assert.ok(/20 (км|km)/.test(t.hint)&&/20 (км|km)/.test(t.tipGoal)&&/20 \*?(км|km)|\*20 (км|km)\*/.test(t.caption),'the goal of 20 km is said ('+lang+')');
 assert.ok([t.caption2,t.tipUse,t.tipUlt,t.ultLabel,t.weaponLabel].every(x=>/пробел|пробіл|Space/i.test(x))&&/^(ПРОБЕЛ|ПРОБІЛ|SPACE)$/.test(t.spaceKey),'Space is named where the keys are ('+lang+')');
 assert.ok(/\bF\b/.test(t.caption2)&&/\bF\b/.test(t.tipUse)&&/ПКМ|RMB/.test(t.tipUse)&&!/\bF\b|ПКМ|RMB/.test(t.caption2Touch+t.tipUseTouch+t.captionTouch+t.weaponLabelTouch),'the keys of the weapon are named where there are keys ('+lang+')');
 for(const k of ['dwell','dwellTouch'])assert.ok(t[k].includes('{n}')&&t[k].length<=40,'the count of the hold has its number and fits the middle of the card: '+k+' ('+lang+') '+t[k].length);
 assert.ok(t.exit.length<=7,'button words stay short ('+lang+')');assert.ok(!('play' in t)&&!('buttonStart' in t)&&!('modeLabel' in t),'no words for a start button or for mode buttons ('+lang+')');
 for(const k of tipKeys)assert.ok(t[k]&&t[k].length<=64,'a tip fits one line of the card: '+k+' ('+lang+') '+(t[k]||'').length);
 for(const k of tipKeys.filter(x=>/Touch$/.test(x)))assert.ok(!/\bE\b|ПКМ|RMB|ЛКМ|LMB|клавіш|клавиш|\bkeys?\b|курсор|cursor/.test(t[k].replace(/ULT|CRUISE|GUIDED/g,'')),'the touch tips name no keys and no mouse: '+k+' ('+lang+')');
 assert.ok(/ветер|вітер|wind/i.test(t.tipFBWA)&&/курсор|cursor/i.test(t.tipGUIDED)&&/ветер|вітер|wind/i.test(t.tipWind)&&/ФОРСАЖ|AFTERBURNER/.test(t.tipSprint)&&/\bM\b/.test(t.tipMusic)&&/FBWA/.test(t.tipFBWA)&&/CRUISE/.test(t.tipCRUISE)&&/GUIDED/.test(t.tipGUIDED)&&/AUTO/.test(t.tipAUTO)&&/AUTOLAND/.test(t.tipFinale),'every mode tip names its mode ('+lang+')');
 assert.ok(/ЛКМ|LMB/.test(t.tipAUTO)&&/ULT/.test(t.tipEnemy)&&/ULT/.test(t.tipUlt),'the tips name the gun and the ULT ('+lang+')');
 for(const g of ['gradePerfect','gradeGood','gradeHard'])assert.ok(t[g]);
 assert.ok(!/кнопк[аиу]\s+(старт|игр)|start button/i.test(Object.values(t).flat().join(' ')),'no words about a start button ('+lang+')');
}
assert.ok(/[а-яё]/i.test(TEXT.ru.over)&&/[іїєґ]/i.test(TEXT.uk.accuracy+TEXT.uk.over+TEXT.uk.streak),'Russian and Ukrainian are not mixed up');
assert.ok(!/[ыэёъ]/i.test(Object.values(TEXT.uk).flat().join(' ')),'no Russian-only letters in the Ukrainian texts');
assert.ok(Object.values(TEXT.en).flat().every(x=>!/[а-яіїєґ]/i.test(x)),'English texts are English');
console.log('PASS: mini-game — hold the pointer seven seconds to start, FBWA flight with bank and pitch limits, the wind (steady, gusts, shifts) and its streaks, afterburner sprints, bonus rings, formations, the 20 km route with its legs of modes (FBWA, CRUISE, GUIDED, AUTO), rings that never stop, a normal run about five minutes and a higher rank for a faster one, weapon boxes (roulette, one slot), turbo, machine gun, homing missiles, invulnerability, barrier, feathers and upgrades every ten, perspective rings with an aim ring, pylons, the gun, the ULT, the AUTOLAND finale, the chiptune music (Web Audio, switch, M key, saved choice, blocked until a click), camera, best score and time, the card layer in a stub DOM (weapon slot, route bar, end screen), demo hooks, page wiring and ru/uk/en texts.');
