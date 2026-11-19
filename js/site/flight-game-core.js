/* A.T.L.A.S. mini-game on the attitude card of the home page: a five-minute mission in which waypoint gates fly at the aircraft, the aircraft follows the
   pointer, the flight mode changes by itself as the mission goes on (MANUAL, CRUISE, GUIDED, AUTO, then once more), pylons and other aircraft come at it, every gate
   charges an ULT, and the last seconds end with an AUTOLAND approach.
   Pure game logic: no DOM, no timers, no randomness except the seed. The card layer (flight-game.js) feeds it the pointer position every frame.
   Units: world units of the card's own camera (the demo aircraft is about 6 of them wide), seconds. Nothing here is real flight data. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasFlightGameCore=api;})(globalThis,()=>{
 'use strict';
 // what each flight mode does to the aircraft and to the points. k: how hard the aircraft pulls toward its target (1/s), lag: how late it answers (s),
 // gust: how much of the wind reaches it, speed: how fast the gates come, score / ult: multipliers of the points and of the ULT charge, boost: whether the
 // button boost works (in AUTO the button is the gun).
 const MODES=Object.freeze({
  MANUAL:Object.freeze({score:1,ult:1,gust:1,speed:1,boost:true,k:4.6,lag:.08}),
  CRUISE:Object.freeze({score:.8,ult:.8,gust:.35,speed:.85,boost:false,k:3,lag:.18}),
  GUIDED:Object.freeze({score:1.2,ult:1,gust:.2,speed:1,boost:true,k:2.3,lag:.3}),
  AUTO:Object.freeze({score:.5,ult:1.3,gust:.3,speed:1,boost:false,k:2.6,lag:.2}),
  AUTOLAND:Object.freeze({score:1,ult:0,gust:.6,speed:.8,boost:false,k:2.2,lag:.22})
 });
 // The plan of the mission: which mode flies for how long (seconds of running time). After the plan MANUAL goes on until the final approach.
 const PLAN=Object.freeze([['MANUAL',45],['CRUISE',30],['GUIDED',35],['AUTO',25],['MANUAL',40],['CRUISE',30],['GUIDED',35],['AUTO',25]]
  .map(([mode,len])=>Object.freeze({mode,len})));
 const CFG=Object.freeze({
  fieldX:4,fieldY:1.85,                 // the box the aircraft can reach (the layer shrinks it to the size of the card)
  zFar:9.4,zGone:-1.8,firstGate:6.2,    // things appear at zFar, fly at the aircraft (z = 0) and are dropped at zGone
  baseSpeed:3,levelSpeed:.032,maxSpeedMul:1.7,boostSpeed:.42,
  maxSpeed:6.5,                         // the fastest the aircraft slides sideways or up and down, world units per second
  radius0:1.15,radiusMin:.55,radiusStep:.031,perfect:.36,
  spacing:6,gatesPerLevel:8,
  lives:4,lifeEvery:12,
  countdown:2.4,freeze:.6,
  planeR:.42,invuln:1.3,
  gustFirst:6,gustWarn:.9,gustBlow:1.8,gustMin:3.8,gustBase:8.5,gustStep:.24,gustPower:2,gustPowerStep:.085,gustPowerMax:3.4,
  missionTime:300,clearBefore:9,        // the final approach starts after five minutes; the airspace is cleared 9 s before
  obstacleFrom:16,obstacleBase:.12,obstacleStep:.018,obstacleMax:.5,pylonR:.62,dodgeZ:4.2,dodgeMargin:.3,
  enemyFrom:40,enemyEvery:16,enemyStep:.4,enemyMin:8,enemyMax:2,enemyMaxAuto:3,autoGapMul:.4,enemyR:.6,enemySpeed:.4,enemyDrift:1,
  ultPerfect:24,ultGood:13,ultKill:220,ultCooldown:.5,
  fireCooldown:.16,shotKill:160,shotRadius:1.7,   // the gun of the AUTO mode: one shot at the pointer, it hits what is within 1.7 radii of it
  nudgeX:.6,nudgeY:.3,                  // how far the pointer can shift the autopilot in the final approach
  landing:Object.freeze({gates:7,spacing:5,radiusFrom:1.05,radiusTo:.7,touchPerfect:.3,touchGood:.75,bonus:Object.freeze({perfect:1500,good:800,hard:300}),lifeBonus:300}),
  ranks:[0,1000,3000,6500]
 });
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 const lerp=(a,b,t)=>a+(b-a)*t;
 function mulberry32(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const levelOf=passed=>1+Math.floor(passed/CFG.gatesPerLevel);
 const speedMul=level=>Math.min(CFG.maxSpeedMul,1+(level-1)*CFG.levelSpeed);
 const radiusOf=level=>Math.max(CFG.radiusMin,CFG.radius0-(level-1)*CFG.radiusStep);
 const spacingOf=level=>CFG.spacing*(.6+.4*speedMul(level));      // faster gates are further apart: the time between two gates stays above 1.4 s
 const gustWait=level=>Math.max(CFG.gustMin,CFG.gustBase-(level-1)*CFG.gustStep);
 const gustPowerOf=level=>Math.min(CFG.gustPowerMax,CFG.gustPower+(level-1)*CFG.gustPowerStep);
 const obstacleChance=level=>Math.min(CFG.obstacleMax,CFG.obstacleBase+(level-1)*CFG.obstacleStep);
 const enemyGap=level=>Math.max(CFG.enemyMin,CFG.enemyEvery-(level-1)*CFG.enemyStep);
 /** 0..3: the rank that goes with a score */
 const rankOf=score=>CFG.ranks.reduce((r,min,i)=>score>=min?i:r,0);
 /** Which mode flies at this running time: {mode, index (place in the plan), from, to}. After the plan MANUAL goes on until the final approach. */
 function modeAt(t){
  let from=0;
  for(let i=0;i<PLAN.length;i++){const to=from+PLAN[i].len;if(t<to)return{mode:PLAN[i].mode,index:i,from,to};from=to;}
  return{mode:'MANUAL',index:PLAN.length,from,to:Math.max(from,CFG.missionTime)};
 }

 /** A new game in the 'ready' phase. field = {x, y, gateY}: how far the aircraft can go from the middle of the card, and how high or low a gate may be
    (the card is wide and low: the layer works out gateY from its size so that the rings stay clear of the score bar). */
 function create(seed=1,field={}){
  return {seed:seed>>>0,rng:mulberry32(seed),phase:'ready',time:0,runTime:0,countdown:0,freeze:0,
   fieldX:field.x??CFG.fieldX,fieldY:field.y??CFG.fieldY,gateY:field.gateY??null,
   plane:{x:0,y:0,vx:0,vy:0,cx:0,cy:0},aim:{x:0,y:0},boost:0,mode:'MANUAL',
   ult:0,ultCool:0,fireCool:0,invuln:0,
   gates:[],lastGate:null,gateCount:0,nextId:1,obstacles:[],enemies:[],enemyClock:0,
   score:0,lives:CFG.lives,streak:0,maxStreak:0,passed:0,missed:0,perfects:0,kills:0,hits:0,level:1,
   gust:{phase:'idle',t:0,wait:CFG.gustFirst,dirX:0,dirY:0,power:0,vx:0,vy:0},
   finale:null,landing:null,events:[]};
 }
 const gateBox=g=>({x:Math.max(1,g.fieldX-.5),y:g.gateY!=null?Math.max(.4,Math.min(g.gateY,g.fieldY)):Math.max(.6,g.fieldY-.45)});
 /** The card changed size: the aircraft and everything that flies at it stay inside the new box. */
 function setField(g,x,y,gateY){
  g.fieldX=x;g.fieldY=y;if(gateY!==undefined)g.gateY=gateY;
  const box=gateBox(g);
  g.plane.x=clamp(g.plane.x,-x,x);g.plane.y=clamp(g.plane.y,-y,y);
  for(const gate of g.gates){gate.x=clamp(gate.x,-box.x,box.x);if(!gate.approach)gate.y=clamp(gate.y,-box.y,box.y);}
  for(const o of g.obstacles){o.x=clamp(o.x,-x,x);o.y=clamp(o.y,-box.y,box.y);}
  for(const e of g.enemies){e.x=clamp(e.x,-x,x);e.y=clamp(e.y,-box.y,box.y);}
 }
 const emit=(g,e)=>{g.events.push(e);return e;};
 /** The events since the last call (the layer plays them: popups, flashes, the end screen). */
 function drain(g){const e=g.events;g.events=[];return e;}
 const multiplier=g=>(1+Math.min(Math.max(g.streak-1,0),12)*.1)*(g.boost>.6?2:1);
 /** How fast the things come at the aircraft without the boost. */
 const baseSpeedOf=g=>CFG.baseSpeed*(g.finale?1:speedMul(g.level))*MODES[g.mode].speed;   // the final approach is flown at a calm, fixed speed

 // ---------------------------------------------------------------- things that fly at the aircraft
 function spawnGate(g,z){
  const level=g.level,r=radiusOf(level),box=gateBox(g),last=g.lastGate;
  let x=0,y=0;
  if(last){
   const soft=g.gateCount<3?.5:1;        // the first gates are gentle: the pilot is still finding out how the aircraft follows the pointer
   const dx=soft*Math.min(2*box.x,3.4,2.2+.12*(level-1)),dy=soft*Math.min(2*box.y,.8+.04*(level-1));   // the height changes in small steps: easy to read
   for(let i=0;i<3;i++){
    x=clamp(last.x+(g.rng()*2-1)*dx,-box.x,box.x);
    y=clamp(last.y+(g.rng()*2-1)*dy,-box.y,box.y);
    if(Math.hypot(x-last.x,y-last.y)>=.9)break;   // the next gate is never right behind the last one
   }
  }
  const gate={id:g.nextId++,n:++g.gateCount,x,y,z,r,state:'ahead',quality:null,age:0,approach:false};
  g.gates.push(gate);g.lastGate=gate;return gate;
 }
 /** A pylon between two gates: half of them stand on the straight line between the gates (the autopilot has to fly around those), the rest anywhere. */
 function spawnObstacle(g,a,b){
  const box=gateBox(g),z=(a.z+b.z)/2;
  for(let i=0;i<4;i++){
   const onPath=g.rng()<.55;
   const x=clamp(onPath?(a.x+b.x)/2+(g.rng()*2-1)*.4:(g.rng()*2-1)*box.x,-box.x,box.x);
   const y=clamp(onPath?(a.y+b.y)/2+(g.rng()*2-1)*.3:(g.rng()*2-1)*box.y,-box.y,box.y);
   if(Math.hypot(x-a.x,y-a.y)<a.r*.9+CFG.pylonR||Math.hypot(x-b.x,y-b.y)<b.r*.9+CFG.pylonR)continue;   // never inside a ring
   g.obstacles.push({id:g.nextId++,kind:'pylon',x,y,z,r:CFG.pylonR,state:'ahead',age:0});
   return true;
  }
  return false;
 }
 /** Another aircraft. In AUTO it comes at the aircraft and at the next ring (the autopilot does not dodge it: the pilot's gun does); in the other modes it drifts anywhere. */
 function spawnEnemy(g){
  const box=gateBox(g),z=CFG.zFar+.8;
  let x,y,vx,vy;
  if(g.mode==='AUTO'){
   const gate=nextGate(g),ax=gate?(g.plane.x+gate.x)/2:g.plane.x,ay=gate?(g.plane.y+gate.y)/2:g.plane.y;
   const T=z/(baseSpeedOf(g)*(1+CFG.enemySpeed));
   x=clamp(ax+(g.rng()*2-1)*2.2,-box.x,box.x);y=clamp(ay+(g.rng()*2-1)*1,-box.y,box.y);
   vx=clamp((ax+(g.rng()*2-1)*.5-x)/T,-1.6,1.6);vy=clamp((ay+(g.rng()*2-1)*.3-y)/T,-.6,.6);
  }else{
   x=(g.rng()*2-1)*box.x*.8;y=(g.rng()*2-1)*box.y;vx=(g.rng()*2-1)*CFG.enemyDrift;vy=(g.rng()*2-1)*.35;
  }
  const e={id:g.nextId++,kind:'enemy',x,y,z,r:CFG.enemyR,state:'ahead',age:0,vx,vy};
  g.enemies.push(e);emit(g,{type:'enemy',enemy:e});return e;
 }
 function spawnApproach(g,z,i){
  const L=CFG.landing,box=gateBox(g),t=L.gates>1?i/(L.gates-1):1;
  const gate={id:g.nextId++,n:++g.gateCount,x:0,y:box.y*(.85-1.55*t),z,r:lerp(L.radiusFrom,L.radiusTo,t),state:'ahead',quality:null,age:0,approach:true,index:i+1};
  g.gates.push(gate);g.lastGate=gate;return gate;
 }
 function ensureGates(g){
  if(g.finale){
   const L=CFG.landing,F=g.finale;
   while(F.spawned<L.gates&&(!g.lastGate||g.lastGate.z<=CFG.zFar-L.spacing))spawnApproach(g,g.lastGate?g.lastGate.z+L.spacing:CFG.firstGate,F.spawned++);
   if(F.spawned>=L.gates&&F.runwayZ==null&&g.lastGate&&g.lastGate.z<=CFG.zFar-L.spacing)F.runwayZ=g.lastGate.z+L.spacing;
   return;
  }
  const gap=spacingOf(g.level);
  while(!g.lastGate||g.lastGate.z<=CFG.zFar-gap){
   const prev=g.lastGate,gate=spawnGate(g,prev?prev.z+gap:CFG.firstGate);
   if(prev&&g.runTime>=CFG.obstacleFrom&&g.runTime<CFG.missionTime-CFG.clearBefore&&g.rng()<obstacleChance(g.level))spawnObstacle(g,prev,gate);
  }
 }
 /** 'ready' -> 'count' (3 .. 1 .. go) -> 'run' */
 function begin(g){
  if(g.phase!=='ready')return g;
  g.phase='count';g.countdown=CFG.countdown;
  ensureGates(g);
  return g;
 }

 // ---------------------------------------------------------------- score
 function summary(g){
  return {score:g.score,passed:g.passed,missed:g.missed,perfects:g.perfects,maxStreak:g.maxStreak,level:g.level,kills:g.kills,hits:g.hits,
   accuracy:g.passed?Math.round(100*g.perfects/g.passed):0,rank:rankOf(g.score),won:g.phase==='won',landing:g.landing,time:Math.round(g.runTime)};
 }
 function lose(g){
  if(g.lives>0)return false;
  g.phase='over';emit(g,{type:'over',summary:summary(g)});return true;
 }
 function judge(g,gate){
  const d=Math.hypot(g.plane.x-gate.x,g.plane.y-gate.y),M=MODES[g.mode];
  if(d<=gate.r){
   const quality=d<=gate.r*CFG.perfect?'perfect':'good';
   gate.state='passed';gate.quality=quality;
   g.streak++;g.maxStreak=Math.max(g.maxStreak,g.streak);g.passed++;if(quality==='perfect')g.perfects++;
   const mult=multiplier(g)*M.score,points=Math.round((quality==='perfect'?100:50)*mult);
   g.score+=points;
   if(!g.finale){
    const before=g.ult;g.ult=Math.min(100,g.ult+(quality==='perfect'?CFG.ultPerfect:CFG.ultGood)*M.ult);
    if(before<100&&g.ult>=100)emit(g,{type:'ultReady'});
   }
   emit(g,{type:'gate',gate,quality,points,mult,streak:g.streak,boosted:g.boost>.6,x:gate.x,y:gate.y,mode:g.mode,ult:g.ult});
   if(g.streak%CFG.lifeEvery===0&&g.lives<CFG.lives){g.lives++;emit(g,{type:'life',lives:g.lives});}
   const level=levelOf(g.passed);
   if(!g.finale&&level>g.level){g.level=level;emit(g,{type:'level',level});}   // the final approach has no levels
  }else{
   gate.state='missed';gate.quality='miss';
   g.lives--;g.streak=0;g.missed++;
   emit(g,{type:'miss',gate,dist:d,lives:g.lives,x:gate.x,y:gate.y});
   lose(g);
  }
 }
 /** An obstacle or an enemy reaches the aircraft. A hit costs a life; for 1.3 s afterwards the aircraft cannot be hit again. */
 function collide(g,thing){
  const d=Math.hypot(g.plane.x-thing.x,g.plane.y-thing.y);
  thing.state='passed';
  if(d>thing.r+CFG.planeR||g.invuln>0)return;
  thing.state=thing.kind==='enemy'?'crashed':'hit';
  g.lives--;g.streak=0;g.hits++;g.invuln=CFG.invuln;
  emit(g,{type:'hit',kind:thing.kind,thing,lives:g.lives,x:thing.x,y:thing.y});
  lose(g);
 }

 // ---------------------------------------------------------------- the autopilot, the guns, the ULT, the wind
 const nextGate=g=>g.gates.find(gate=>gate.state==='ahead')||null;
 /** Where the autopilot flies: the centre of the next ring (the glide path in the final approach), around the pylons that stand in the way. It does not see
    the other aircraft: that is what the gun of the pilot is for. */
 function autopilot(g){
  const gate=nextGate(g),P=g.plane,M=MODES[g.mode];
  let tx=P.x,ty=P.y;
  if(gate){tx=gate.x;ty=gate.y;}else if(g.finale&&g.finale.groundY!=null){tx=0;ty=g.finale.groundY+.3;}
  const tau=1/M.k+M.lag,speed=baseSpeedOf(g);
  for(const o of g.obstacles){
   if(o.state!=='ahead'||o.z<=0||o.z>CFG.dodgeZ||(gate&&o.z>gate.z))continue;       // only the pylons between the aircraft and the next ring
   const f=Math.max(.3,1-Math.exp(-o.z/speed/tau)),px=P.x+(tx-P.x)*f,py=P.y+(ty-P.y)*f;   // where the aircraft would be when it reaches the pylon
   const dx=px-o.x,dy=py-o.y,d=Math.hypot(dx,dy),clear=o.r+CFG.planeR+CFG.dodgeMargin;
   if(d<clear){
    const push=Math.min(2.4,(clear-d)/f),nx=d>1e-3?dx/d:1,ny=d>1e-3?dy/d:0;
    tx+=nx*push;ty+=ny*push;
   }
  }
  return {x:clamp(tx,-g.fieldX,g.fieldX),y:clamp(ty,-g.fieldY,g.fieldY)};
 }
 /** The gun of the AUTO mode: one shot at the pointer. cursorAt(z) says where the pointer is in the world at the depth z: {x, y, tol}; tol is a little extra
    reach the layer adds for things far away (they are small on the screen). Hits the nearest enemy within shotRadius radii. Returns the enemy or null. */
 function shoot(g,cursorAt){
  if(g.phase!=='run'||g.finale||g.mode!=='AUTO'||g.fireCool>0)return null;
  g.fireCool=CFG.fireCooldown;
  let best=null;
  for(const e of g.enemies){
   if(e.state!=='ahead'||e.z<.35)continue;
   const c=cursorAt(e.z);
   if(Math.hypot(c.x-e.x,c.y-e.y)<=e.r*CFG.shotRadius+(c.tol||0)&&(!best||e.z<best.z))best=e;
  }
  if(!best){emit(g,{type:'shotMiss'});return null;}
  best.state='shot';g.kills++;g.score+=CFG.shotKill;
  emit(g,{type:'shot',x:best.x,y:best.y,z:best.z,r:best.r,points:CFG.shotKill});
  return best;
 }
 /** The ULT: every enemy in front of the aircraft is shot down. It needs a full charge and at least one enemy. Returns the number of enemies shot down. */
 function fireUlt(g){
  if(g.phase!=='run'||g.finale||g.ultCool>0||g.ult<100)return 0;
  const targets=g.enemies.filter(e=>e.state==='ahead'&&e.z>.15);
  if(!targets.length){g.ultCool=CFG.ultCooldown;emit(g,{type:'ultDenied'});return 0;}
  let points=0;
  for(const e of targets){e.state='shot';g.kills++;points+=Math.round(CFG.ultKill*MODES[g.mode].score);}
  g.score+=points;g.ult=0;g.ultCool=CFG.ultCooldown;
  emit(g,{type:'ult',targets:targets.map(e=>({x:e.x,y:e.y,z:e.z,r:e.r})),points});
  return targets.length;
 }
 function updateGust(g,dt){
  const G=g.gust;
  if(G.phase==='idle'){
   G.wait-=dt;
   if(G.wait<=0){
    G.phase='warn';G.t=0;
    const vertical=g.rng()<.22;
    G.dirX=vertical?0:(g.rng()<.5?-1:1);
    G.dirY=vertical?(g.rng()<.5?-.7:.7):0;
    G.power=gustPowerOf(g.level);
    emit(g,{type:'gust',stage:'warn',dirX:G.dirX,dirY:G.dirY});
   }
  }else if(G.phase==='warn'){
   G.t+=dt;
   if(G.t>=CFG.gustWarn){G.phase='blow';G.t=0;emit(g,{type:'gust',stage:'blow',dirX:G.dirX,dirY:G.dirY});}
  }else{
   G.t+=dt;
   const u=G.t/CFG.gustBlow;
   if(u>=1){G.phase='idle';G.t=0;G.vx=G.vy=0;G.wait=gustWait(g.level)+g.rng()*2;emit(g,{type:'gust',stage:'end'});}
   else{const env=Math.sin(Math.PI*u);G.vx=G.dirX*G.power*env;G.vy=G.dirY*G.power*env;}
  }
 }
 /** Where the aircraft goes. input = {tx, ty}: the pointer on the plane of the aircraft, in world units.
    MANUAL: the aircraft follows the pointer, quickly. CRUISE: the altitude is held at the height of the next ring, the pointer only steers sideways.
    GUIDED: the aircraft flies to the pointer, but slowly: aim ahead. AUTO: the autopilot flies, the pointer is the gun. AUTOLAND: the autopilot follows
    the glide path, the pointer nudges it a little. The wind comes on top, as much of it as the mode lets through. */
 function control(g,dt,inp){
  const P=g.plane,M=MODES[g.mode],wind=g.phase==='run'?g.gust:{vx:0,vy:0};
  const cx=clamp(inp.tx,-g.fieldX,g.fieldX),cy=clamp(inp.ty,-g.fieldY,g.fieldY);
  let tx=cx,ty=cy;
  if(g.mode==='CRUISE'){const gate=nextGate(g);ty=gate?gate.y:P.y;}
  else if(g.mode==='AUTO'||g.mode==='AUTOLAND'){
   const a=autopilot(g);tx=a.x;ty=a.y;
   if(g.mode==='AUTOLAND'){tx+=clamp(cx/g.fieldX,-1,1)*CFG.nudgeX;ty+=clamp(cy/g.fieldY,-1,1)*CFG.nudgeY;}
  }
  g.aim.x=tx;g.aim.y=ty;
  const a=1-Math.exp(-dt/M.lag);
  const dvx=clamp((tx-P.x)*M.k,-CFG.maxSpeed,CFG.maxSpeed),dvy=clamp((ty-P.y)*M.k,-CFG.maxSpeed,CFG.maxSpeed);
  P.cx+=(dvx-P.cx)*a;P.cy+=(dvy-P.cy)*a;
  P.vx=P.cx+wind.vx*M.gust;P.vy=P.cy+wind.vy*M.gust;
  P.x=clamp(P.x+P.vx*dt,-g.fieldX,g.fieldX);
  P.y=clamp(P.y+P.vy*dt,-g.fieldY,g.fieldY);
 }
 /** The mode the plan asks for at this running time (the final approach has its own). */
 function updateMode(g){
  if(g.finale)return;
  const m=modeAt(g.runTime);
  if(m.mode===g.mode)return;
  const from=g.mode;g.mode=m.mode;
  if(m.mode==='AUTO')g.enemyClock=clamp(g.enemyClock,1.5,3);   // the first intruder shows up soon after the autopilot takes over
  emit(g,{type:'mode',from,to:m.mode,index:m.index});
 }
 /** Where the plan is: {mode, index, t (seconds into this mode), len, left, next (the mode after it)}. */
 function modeInfo(g){
  if(g.finale)return {mode:'AUTOLAND',index:-1,t:0,len:0,left:0,next:null};
  const m=modeAt(g.runTime);
  return {mode:m.mode,index:m.index,t:g.runTime-m.from,len:m.to-m.from,left:Math.max(0,m.to-g.runTime),next:m.to>=CFG.missionTime?'AUTOLAND':modeAt(m.to).mode};
 }

 // ---------------------------------------------------------------- the final approach
 function startFinale(g){
  const box=gateBox(g);
  g.finale={spawned:0,runwayZ:null,groundY:Math.max(-g.fieldY+.1,-(box.y*.7+.3))};
  const from=g.mode;g.mode='AUTOLAND';
  emit(g,{type:'mode',from,to:'AUTOLAND',index:-1});
  emit(g,{type:'finale'});
 }
 function touchdown(g){
  const L=CFG.landing,F=g.finale,P=g.plane;
  const dx=Math.abs(P.x),dy=Math.abs(P.y-(F.groundY+.3));
  const grade=dx<=L.touchPerfect&&dy<=L.touchPerfect?'perfect':dx<=L.touchGood&&dy<=L.touchGood*1.2?'good':'hard';
  const bonus=L.bonus[grade]+g.lives*L.lifeBonus;
  g.score+=bonus;g.landing={grade,bonus,dx,dy};
  g.phase='won';
  emit(g,{type:'touchdown',grade,bonus,dx,dy});
  emit(g,{type:'won',summary:summary(g)});
 }

 /** One step. input = {tx, ty, boost}: the pointer on the plane of the aircraft (world units) and whether the boost button is held. */
 function step(g,dt,input){
  if(g.phase==='ready'||g.phase==='over'||g.phase==='won'||g.phase==='paused')return g;
  dt=clamp(dt,0,.05);
  g.time+=dt;
  const P=g.plane,inp={tx:input&&Number.isFinite(input.tx)?input.tx:P.x,ty:input&&Number.isFinite(input.ty)?input.ty:P.y,boost:!!(input&&input.boost)};
  g.ultCool=Math.max(0,g.ultCool-dt);g.fireCool=Math.max(0,g.fireCool-dt);g.invuln=Math.max(0,g.invuln-dt);
  if(g.phase==='count'){
   control(g,dt,inp);
   g.countdown-=dt;
   if(g.countdown<=0){g.phase='run';emit(g,{type:'start'});emit(g,{type:'mode',from:null,to:g.mode,index:0});}
   return g;
  }
  if(g.freeze>0){control(g,dt,inp);g.freeze=Math.max(0,g.freeze-dt);return g;}
  g.runTime+=dt;
  updateMode(g);
  control(g,dt,inp);
  const M=MODES[g.mode];
  g.boost+=(((inp.boost&&M.boost)?1:0)-g.boost)*(1-Math.exp(-dt*4.5));
  const speed=baseSpeedOf(g)*(1+CFG.boostSpeed*g.boost);
  for(const gate of g.gates){
   const before=gate.z;
   gate.z-=speed*dt;gate.age+=dt;
   if(gate.state==='ahead'&&before>0&&gate.z<=0){judge(g,gate);if(g.phase==='over')return g;}
  }
  for(const o of g.obstacles){
   const before=o.z;o.z-=speed*dt;o.age+=dt;
   if(o.state==='ahead'&&before>0&&o.z<=0){collide(g,o);if(g.phase==='over')return g;}
  }
  for(const e of g.enemies){
   const before=e.z,box=gateBox(g);
   e.z-=speed*dt*(1+CFG.enemySpeed);e.x=clamp(e.x+e.vx*dt,-g.fieldX,g.fieldX);e.y=clamp(e.y+e.vy*dt,-box.y,box.y);e.age+=dt;
   if(e.state==='ahead'&&before>0&&e.z<=0){collide(g,e);if(g.phase==='over')return g;}
  }
  g.gates=g.gates.filter(gate=>gate.z>CFG.zGone);
  g.obstacles=g.obstacles.filter(o=>o.z>CFG.zGone);
  g.enemies=g.enemies.filter(e=>e.z>CFG.zGone&&e.state!=='shot'&&e.state!=='crashed');
  if(!g.finale&&g.runTime>=CFG.missionTime)startFinale(g);
  ensureGates(g);
  if(!g.finale&&g.runTime>=CFG.enemyFrom&&g.runTime<CFG.missionTime-CFG.clearBefore){
   const auto=g.mode==='AUTO';
   g.enemyClock-=dt;
   if(g.enemyClock<=0){
    if(g.enemies.filter(e=>e.state==='ahead').length<(auto?CFG.enemyMaxAuto:CFG.enemyMax))spawnEnemy(g);
    g.enemyClock=enemyGap(g.level)*(auto?CFG.autoGapMul:1)*(.8+g.rng()*.4);
   }
  }
  updateGust(g,dt);
  if(g.finale&&g.finale.runwayZ!=null){
   g.finale.runwayZ-=speed*dt;
   if(g.finale.runwayZ<=0)touchdown(g);
  }
  return g;
 }
 /** The pilot left the card or the page: time stops. Coming back gives a short freeze before the gates move again. */
 function pause(g){if(g.phase==='run'||g.phase==='count'){g.resume=g.phase;g.phase='paused';}return g;}
 function resume(g){if(g.phase==='paused'){g.phase=g.resume||'run';g.resume=null;if(g.phase==='run')g.freeze=CFG.freeze;}return g;}

 // ---- the best score lives in localStorage; every access may throw (private windows, blocked storage)
 const BEST_KEY='atlas-flight-best';
 function readBest(storage){try{const v=Number(storage.getItem(BEST_KEY));return Number.isFinite(v)&&v>0?Math.floor(v):0;}catch{return 0;}}
 function writeBest(storage,score){try{storage.setItem(BEST_KEY,String(Math.floor(score)));return true;}catch{return false;}}

 return Object.freeze({CFG,MODES,PLAN,BEST_KEY,create,begin,step,drain,pause,resume,setField,shoot,fireUlt,summary,rankOf,levelOf,speedMul,radiusOf,spacingOf,gustWait,gustPowerOf,
  obstacleChance,enemyGap,multiplier,nextGate,autopilot,modeAt,modeInfo,readBest,writeBest,mulberry32});
});
