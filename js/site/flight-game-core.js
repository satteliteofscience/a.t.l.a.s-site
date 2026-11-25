/* A.T.L.A.S. mini-game on the attitude card of the home page: a flight of 20 km in which waypoint gates fly at the aircraft, the aircraft follows the pointer in a
   stabilised (FBWA) way, the flight mode changes by itself along the route (FBWA, CRUISE, GUIDED, AUTO, then once more), the wind carries the aircraft off, pylons
   and other aircraft come at it, afterburner sprints make everything fly much faster for a few seconds, every gate charges an ULT. The goal is a distance, not a
   time: the faster the aircraft flies, the sooner it is there and the higher the rank. Weapon boxes ("?", a roulette, one weapon at a time) give a turbo, a machine gun,
   homing missiles, invulnerability with more speed or a repelling barrier, and every ten feathers picked up on the way make the weapons stronger. The route ends with
   an AUTOLAND approach.
   The flight moves to its music (TRACK): the rings, the runway and with them the whole world speed up or slow down a little so that each ring arrives on a beat; a
   manoeuvre on the beat (a barrel roll or a shot) is asked for every few bars; a press that does something pays extra when it falls on a beat; at the end of every
   loop of the music the picture breaks up and the flight turns inverted, or back. A fallback chiptune is data here too; the card layer plays the music.
   Pure game logic: no DOM, no timers, no randomness except the seed. The card layer (flight-game.js) feeds it the pointer position every frame.
   Units: world units of the card's own camera (the demo aircraft is about 6 of them wide), seconds; the route is in metres. Nothing here is real flight data. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasFlightGameCore=api;})(globalThis,()=>{
 'use strict';
 // what each flight mode does to the aircraft and to the points. k: how hard the stick follows the distance to the target (1 / world unit), kd: how much of the
 // ground speed the stick takes out again (s), lag: how late the aircraft hears the target (s), gust: how much of the wind reaches it, speed: how fast the gates come,
 // score / ult: multipliers of the points and of the ULT charge, boost: whether the button boost works (in AUTO the button is the gun).
 // In every mode the aircraft is stabilised: the stick asks for a bank and a pitch (never more than the limits of CFG.air), the aircraft levels out by itself.
 const MODES=Object.freeze({
  FBWA:Object.freeze({score:1,ult:1,gust:1,speed:1,boost:true,k:1.7,kd:.6,lag:.08}),
  CRUISE:Object.freeze({score:.8,ult:.8,gust:.4,speed:.85,boost:false,k:1.4,kd:.55,lag:.15}),
  GUIDED:Object.freeze({score:1.2,ult:1,gust:.25,speed:1,boost:true,k:1.45,kd:.6,lag:.2}),
  AUTO:Object.freeze({score:.5,ult:1.3,gust:.3,speed:1,boost:false,k:1.8,kd:.6,lag:.1}),
  AUTOLAND:Object.freeze({score:1,ult:0,gust:.35,speed:.8,boost:false,k:1.3,kd:.55,lag:.15})
 });
 // The plan of the route: which mode flies for how long (metres of the route). After the plan FBWA goes on until the final approach.
 const PLAN=Object.freeze([['FBWA',3000],['CRUISE',2000],['GUIDED',2300],['AUTO',1700],['FBWA',2700],['CRUISE',2000],['GUIDED',2300],['AUTO',1700]]
  .map(([mode,len])=>Object.freeze({mode,len})));
 // the five weapons of the boxes
 const WEAPONS=Object.freeze(['turbo','gun','missiles','mask','barrier']);
 // the music of the game: the main track, 100 beats a minute from offset; it loops whole bars (loopBars of four beats) from there
 const TRACK=Object.freeze({src:'assets/music/pixelated-dreamscape.mp3',title:'Pixelated Dreamscape Journey',by:'StockTune',bpm:100,offset:.135,loopBars:47});
 const BEAT=60/TRACK.bpm,BAR=4*BEAT,LOOP=TRACK.loopBars*BAR;
 // A music is a list of pieces: {beat (s), offset (the first bar start), end (the end of its whole bars)}. One piece plays once and then loops from its first bar;
 // two play one after the other, then again. The main music of the game is the main track alone.
 const MAIN_MUSIC=Object.freeze([Object.freeze({beat:BEAT,offset:TRACK.offset,end:TRACK.offset+LOOP})]);
 /** The part of the music that plays at its time t: {k (how many parts came before), i (the piece), start (when the part starts), from (where in the piece), len}. */
 function segmentAt(music,t){
  const m=music.length,time=Math.max(0,t);
  if(m===1){
   const a=music[0];if(time<a.end)return {k:0,i:0,start:0,from:0,len:a.end};
   const L=a.end-a.offset,n=Math.floor((time-a.end)/L);return {k:n+1,i:0,start:a.end+n*L,from:a.offset,len:L};
  }
  const total=music.reduce((s,a)=>s+a.end,0),c=Math.floor(time/total);let start=c*total,i=0;
  while(i<m-1&&time>=start+music[i].end){start+=music[i].end;i++;}
  return {k:c*m+i,i,start,from:0,len:music[i].end};
 }
 /** The beat grid that holds at t: the time of one of its bar starts and the length of a beat. */
 function gridAt(music,t){const s=segmentAt(music,t),a=music[s.i];return {anchor:s.start+a.offset-s.from,beat:a.beat};}
 const CFG=Object.freeze({
  fieldX:4,fieldY:1.85,                 // the box the aircraft can reach (the layer shrinks it to the size of the card)
  zFar:9.4,zGone:-1.8,firstGate:6.2,    // things appear at zFar, fly at the aircraft (z = 0) and are dropped at zGone
  spawnMinZ:3.5,                        // nothing new appears closer than this (the gates of a long gap are still far behind when the next one is laid out)
  baseSpeed:3.1,levelSpeed:.03,maxSpeedMul:1.42,boostSpeed:.4,
  speedCap:2.3,                         // the most the approach speed may be multiplied by the sprint and the boost together
  weaponCap:2.7,rushRate:7,             // ... and with the speed of a weapon on top; rushRate: how fast that speed comes and goes
  maxSpeed:6.5,                         // about the fastest the aircraft slides sideways, world units per second (the layer leans the camera in by it)
  // the route: the goal is a distance. unit: how many metres of the route one world unit is. A run without the button boost and without the speed weapons takes about five minutes.
  distance:20000,unit:16.4,
  // the rank at the end is the time: within grades[0] seconds PILOT, within grades[1] COMMANDER, within grades[2] ACE; the score gets timePts for every second under timeRef
  grades:Object.freeze([320,285,250]),timeRef:420,timePts:100,
  // the airframe: roll and pitch limits (rad), how fast the attitude follows the stick (tau, rate limit), how much sideways / vertical pull a full bank / pitch gives
  // (world units per s^2) and the drag that stops the slide when the stick is let go; a gust shakes the wings by rollKick / pitchKick rad per unit of its speed
  air:Object.freeze({rollLim:.78,pitchLim:.44,rollTau:.13,pitchTau:.15,rollRate:3.6,pitchRate:3,ax:23,ay:15,dragX:2.9,dragY:3.1,rollKick:.07,pitchKick:.05}),
  radius0:1.12,radiusMin:.76,radiusStep:.03,perfect:.36,
  spacing:5.4,gatesPerLevel:9,gapJitter:.18,hopX:2,hopXStep:.05,hopXMax:2.4,hopY:.9,hopYStep:.035,   // how far the next gate may be from the last one (sideways, up or down), by level
  lives:4,lifeEvery:12,
  countdown:2.4,freeze:.6,
  planeR:.42,invuln:1.3,handover:1.3,   // handover: after the autopilot the pointer takes over gradually, so a pointer far from the aircraft does not yank it
  // the wind: a steady part that turns now and then, a turbulence on top of it, and gusts (a warning, a bump) on top of that
  windBase:.9,windStep:.09,windMax:2.2,windRamp:8,windTurb:.14,ringWind:.08,windTurn:.55,windShift:Object.freeze([34,62]),windYshare:.45,finaleWind:.55,enemyWind:.5,
  gustFirst:5,gustWarn:.9,gustBlow:1.7,gustMin:2.8,gustBase:7,gustStep:.22,gustPower:2,gustPowerStep:.06,gustPowerMax:3.1,
  // the sprint (afterburner): a warning, then a few seconds at a much higher speed through a corridor of gates with small hops; every sprint is faster and longer
  sprintFirst:26,sprintWarn:1.5,sprintLen:5,sprintLenStep:.1,sprintLenMax:7.5,sprintPeak0:1.45,sprintPeakStep:.02,sprintPeakMax:1.85,sprintUp:2.4,sprintDown:3,
  sprintGapBase:30,sprintGapStep:.7,sprintGapMin:17,sprintScore:1.5,sprintClean:250,sprintHop:.5,sprintSpace:.75,sprintLast:900,
  clearBefore:600,                      // the airspace is cleared this many metres before the final approach (sprintLast: no sprint starts that much further back)
  obstacleFrom:10,obstacleBase:.2,obstacleStep:.024,obstacleMax:.66,pylonR:.62,dodgeZ:4.2,dodgeMargin:.3,pairFrom:7,
  enemyFrom:24,enemyEvery:11,enemyStep:.3,enemyMin:4.6,enemyMax:3,enemyMaxAuto:5,autoGapMul:.45,enemyR:.6,enemySpeed:.4,enemyDrift:1.1,pairEnemyFrom:5,tripleEnemyFrom:11,
  // the bonus rings: small rings off the line of the gates, at other depths; nothing is lost if one is missed
  bonusBase:.3,bonusStep:.03,bonusMax:.7,bonusR:.5,bonusPts:90,bonusFar:55,bonusUlt:7,
  // the weapon boxes: the first after boxFirst seconds, then about one every boxEvery; flying through one starts a roulette (roulette seconds) that ends with one of the
  // five weapons in the single slot (weights: how often each comes). A box taken while the slot is busy only pays points.
  boxFirst:7,boxEvery:8,boxR:.55,boxReach:.22,boxPts:60,roulette:1,weights:Object.freeze({turbo:.22,gun:.2,missiles:.2,mask:.16,barrier:.22}),
  // like a kart race: some of the obstacles are TNT crates (smaller), boost rings between the gates give speed for a moment
  tntFrom:14,tntShare:.35,tntR:.54,padChance:.16,padR:.62,padPts:40,padBoost:Object.freeze({dur:1.4,mul:1.35}),
  // the rivals: three other aircraft that race the same route; pace: their share of an ordinary pilot's speed; rubber: how much they ease off ahead or push behind (beyond rubberGap metres)
  rivals:Object.freeze([1.08,1.03,.98]),rivalSpeed:50.8,rivalRamp:.42,rivalRampTime:220,rivalSway:.07,rubber:.07,rubberGap:500,rivalSlow:3,rivalSlowBy:.7,rivalReach:150,
  // the feathers: trails between the gates; every feathersPerLevel of them make the weapons one level stronger, up to maxLevel
  featherChance:.16,featherLong:.3,featherR:.36,featherReach:.3,featherPts:15,feathersPerLevel:10,maxLevel:5,
  // the weapons: the numbers of each are in weaponParams below
  gunRange:8.5,gunPylonLevel:2,barrierReach:4.2,barrierCrushLevel:3,missileSpeed:9,missileLife:2.8,missileStagger:.1,pylonPts:90,denyCool:.5,
  ultPerfect:24,ultGood:13,ultKill:220,ultCooldown:.5,
  fireCooldown:.16,shotKill:160,shotRadius:1.7,   // the gun of the AUTO mode: one shot at the pointer, it hits what is within 1.7 radii of it
  nudgeX:.6,nudgeY:.3,                  // how far the pointer can shift the autopilot in the final approach
  // the rhythm: the world runs at rhythmMin..rhythmMax of its speed to bring the next ring on a beat (a ring of a sprint corridor may come on a half beat)
  rhythmMin:.72,rhythmMax:1.35,
  onBeat:.12,onBeatPts:50,onBeatMax:5,  // a press that does something within onBeat of a beat pays onBeatPts times the streak of such presses (up to onBeatMax)
  // the manoeuvres: every qteEvery bars from bar qteFirst, announced qteShow beats before; a press within qteGood of its beat counts (qtePerfect: right on it)
  qteFirst:4,qteEvery:4,qteShow:4,qteGood:.15,qtePerfect:.07,rollPts:300,killPts:500,rollSafe:1.4,rollBoost:Object.freeze({dur:1.6,mul:1.25}),killUlt:12,
  glitch:1.8,                           // the static at the end of a loop of the music (seconds)
  // the final approach: it starts run world units before the end of the route; its gates and the runway are laid out so that the touchdown is at the very end
  landing:Object.freeze({run:48,gates:7,spacing:5,radiusFrom:1.05,radiusTo:.7,touchPerfect:.3,touchGood:.75,bonus:Object.freeze({perfect:1500,good:800,hard:300}),lifeBonus:300})
 });
 const FINALE_AT=CFG.distance-CFG.landing.run*CFG.unit;      // metres of the route at which the final approach begins
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 const lerp=(a,b,t)=>a+(b-a)*t;
 function mulberry32(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const levelOf=passed=>1+Math.floor(passed/CFG.gatesPerLevel);
 const speedMul=level=>Math.min(CFG.maxSpeedMul,1+(level-1)*CFG.levelSpeed);
 const radiusOf=level=>Math.max(CFG.radiusMin,CFG.radius0-(level-1)*CFG.radiusStep);
 const spacingOf=level=>CFG.spacing*(.6+.4*speedMul(level));      // faster gates are further apart: the time between two gates stays above 1.2 s
 const gustWait=level=>Math.max(CFG.gustMin,CFG.gustBase-(level-1)*CFG.gustStep);
 const gustPowerOf=level=>Math.min(CFG.gustPowerMax,CFG.gustPower+(level-1)*CFG.gustPowerStep);
 const windSpeedOf=level=>Math.min(CFG.windMax,CFG.windBase+(level-1)*CFG.windStep);
 const obstacleChance=level=>Math.min(CFG.obstacleMax,CFG.obstacleBase+(level-1)*CFG.obstacleStep);
 const enemyGap=level=>Math.max(CFG.enemyMin,CFG.enemyEvery-(level-1)*CFG.enemyStep);
 const bonusChance=level=>Math.min(CFG.bonusMax,CFG.bonusBase+(level-1)*CFG.bonusStep);
 const sprintPeakOf=level=>Math.min(CFG.sprintPeakMax,CFG.sprintPeak0+(level-1)*CFG.sprintPeakStep);
 const sprintLenOf=level=>Math.min(CFG.sprintLenMax,CFG.sprintLen+(level-1)*CFG.sprintLenStep);
 const sprintGapOf=level=>Math.max(CFG.sprintGapMin,CFG.sprintGapBase-(level-1)*CFG.sprintGapStep);
 /** 0..3: the rank of a flight that finished in this many seconds (the faster, the higher). */
 const gradeOf=seconds=>CFG.grades.filter(limit=>seconds<=limit).length;
 /** The points for finishing early. */
 const timeBonus=seconds=>Math.max(0,Math.round((CFG.timeRef-seconds)*CFG.timePts));
 /** What a weapon does at the upgrade level 0..maxLevel: every level makes every weapon stronger. */
 function weaponParams(name,level=0){
  const L=clamp(Math.floor(level),0,CFG.maxLevel);
  if(name==='turbo')return {dur:2.6+.45*L,mul:1.55+.08*L};                                        // a burst of speed; a missed ring costs nothing while it burns
  if(name==='gun')return {dur:4+.8*L,every:.24-.03*L,reach:1+.18*L,pylons:L>=CFG.gunPylonLevel};   // fires by itself at what is near the line of flight
  if(name==='missiles')return {count:1+L,splash:L>=2?.55+.15*L:0};                                 // homing: one more at every level, a blast from level 2
  if(name==='mask')return {dur:4+.7*L,mul:1.3+.045*L};                                             // invulnerable and faster, smashes what it flies into
  if(name==='barrier')return {dur:6+L,r:1.35+.15*L,crush:L>=CFG.barrierCrushLevel};                // pushes pylons and other aircraft away; from level 3 breaks them
  return null;
 }
 /** The upgrade level of the weapons: one for every ten feathers. */
 const weaponLevel=g=>Math.min(CFG.maxLevel,Math.floor(g.feathers/CFG.feathersPerLevel));
 const freshFx=()=>({turbo:{t:0,dur:1,mul:1},gun:{t:0,dur:1,every:.2,reach:1,pylons:false,next:0},mask:{t:0,dur:1,mul:1},barrier:{t:0,dur:1,r:1.6,crush:false},pad:{t:0,dur:1,mul:1}});      // pad: the speed of a boost ring or of a barrel roll
 /** Which mode flies at this distance of the route: {mode, index (place in the plan), from, to}. After the plan FBWA goes on until the final approach. */
 function modeAt(d){
  let from=0;
  for(let i=0;i<PLAN.length;i++){const to=from+PLAN[i].len;if(d<to)return{mode:PLAN[i].mode,index:i,from,to};from=to;}
  return{mode:'FBWA',index:PLAN.length,from,to:Math.max(from,FINALE_AT)};
 }

 /** A new game in the 'ready' phase. field = {x, y, gateY}: how far the aircraft can go from the middle of the card, and how high or low a gate may be
    (the card is wide and low: the layer works out gateY from its size so that the rings stay clear of the score bar). */
 function create(seed=1,field={}){
  const rng=mulberry32(seed),dir=(rng()<.5?0:Math.PI)+(rng()-.5)*.8;
  return {seed:seed>>>0,rng,phase:'ready',time:0,runTime:0,dist:0,countdown:0,freeze:0,
   fieldX:field.x??CFG.fieldX,fieldY:field.y??CFG.fieldY,gateY:field.gateY??null,
   plane:{x:0,y:0,vx:0,vy:0,ux:0,uy:0,cx:0,cy:0,roll:0,pitch:0,bank:0,tilt:0},aim:{x:0,y:0},boost:0,rush:1,mode:'FBWA',handover:0,
   ult:0,ultCool:0,fireCool:0,invuln:0,
   weapon:null,roll:null,fx:freshFx(),denyCool:0,feathers:0,boxWait:CFG.boxFirst,boxes:[],plumes:[],missiles:[],
   gates:[],lastGate:null,gateCount:0,gap:0,pat:{kind:'walk',left:0,dir:1,angle:0},nextId:1,obstacles:[],enemies:[],bonuses:[],pads:[],enemyClock:0,
   rivals:CFG.rivals.map((pace,i)=>({id:i,pace,dist:0,slow:0,phase:i*2.1+rng()*1.5,finished:null})),place:1,
   score:0,lives:CFG.lives,streak:0,maxStreak:0,passed:0,missed:0,perfects:0,kills:0,wrecked:0,hits:0,bonusTaken:0,bonusMissed:0,boxesTaken:0,used:0,level:1,
   gust:{phase:'idle',t:0,wait:CFG.gustFirst,dirX:0,dirY:0,power:0,vx:0,vy:0},
   wind:{dir,dirTo:dir,speed:0,shiftWait:lerp(CFG.windShift[0],CFG.windShift[1],rng()),sx:0,sy:0,tx:0,ty:0,vx:0,vy:0,ph:[rng()*6.28,rng()*6.28,rng()*6.28,rng()*6.28]},
   sprint:{phase:'idle',t:0,wait:CFG.sprintFirst+rng()*6,mul:1,peak:1,len:0,count:0,clean:0,mark:0},
   calm:!!field.calm,finale:null,landing:null,finishTime:null,timeBonus:0,events:[],      // calm: a game without wind and gusts (for tests and demos)
   // the rhythm: the music, its time (as heard), the beat the next ring is brought to, the manoeuvre that is asked for, the part of the music and the inverted flight
   music:field.music&&field.music.length?field.music:MAIN_MUSIC,beatClock:0,target:null,qte:null,qteAt:null,qteCount:0,marked:null,moves:0,beats:{streak:0,count:0},loop:0,inverted:false,glitch:0};
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
  for(const list of [g.bonuses,g.boxes,g.plumes,g.pads])for(const b of list){b.x=clamp(b.x,-x,x);b.y=clamp(b.y,-box.y,box.y);}
 }
 const emit=(g,e)=>{g.events.push(e);return e;};
 /** The events since the last call (the layer plays them: popups, flashes, the end screen). */
 function drain(g){const e=g.events;g.events=[];return e;}
 const sprintOn=g=>g.sprint.mul>1.2;
 const multiplier=g=>(1+Math.min(Math.max(g.streak-1,0),12)*.1)*(g.boost>.6?2:1)*(sprintOn(g)?CFG.sprintScore:1);
 /** How fast the things come at the aircraft without the boost and without the sprint. */
 const baseSpeedOf=g=>CFG.baseSpeed*(g.finale?1:speedMul(g.level))*MODES[g.mode].speed;   // the final approach is flown at a calm, fixed speed
 /** The speed factor of the weapons that are on now (the turbo and the invulnerability; the greater of the two). */
 const effectMul=g=>Math.max(g.fx.turbo.t>0?g.fx.turbo.mul:1,g.fx.mask.t>0?g.fx.mask.mul:1,g.fx.pad.t>0?g.fx.pad.mul:1);
 /** How fast the things come at the aircraft right now (world units per second): the level, the mode, the sprint, the boost and the speed weapons. */
 const speedOf=g=>{const k=Math.min(CFG.speedCap,g.sprint.mul*(1+CFG.boostSpeed*g.boost));return baseSpeedOf(g)*(g.rush>1?Math.min(CFG.weaponCap,k*g.rush):k);};
 /** The speed of the flight as the card shows it, km/h: it is the speed that covers the route. */
 const airspeed=g=>speedOf(g)*CFG.unit*3.6;
 /** Metres of the route that are left. */
 const remaining=g=>Math.max(0,CFG.distance-g.dist);
 /** Pylons, other aircraft, boxes, feathers and bonus rings still appear: not once the final approach is near. */
 const isLive=g=>!g.finale&&remaining(g)>CFG.distance-FINALE_AT+CFG.clearBefore;
 /** The weapons that work now: [{name, left (seconds), frac (0..1 of its time)}]. */
 const effectsOf=g=>Object.keys(g.fx).filter(name=>g.fx[name].t>0).map(name=>({name,left:g.fx[name].t,frac:clamp(g.fx[name].t/g.fx[name].dur,0,1)}));
 /** Where the sprint is: {phase: idle | warn | burn | cool, mul (the speed factor now), amt (0..1, how much of the peak), left (seconds of the burn that remain)}. */
 function sprintInfo(g){
  const S=g.sprint;
  return {phase:S.phase,mul:S.mul,amt:S.peak>1.01?clamp((S.mul-1)/(S.peak-1),0,1):0,left:S.phase==='burn'?Math.max(0,S.len-S.t):S.phase==='warn'?CFG.sprintWarn-S.t:0,peak:S.peak,count:S.count};
 }
 /** The wind now: the arrow and the strength for the display. dir is the way it blows (radians, 0 = to the right), speed in world units per second. */
 function windInfo(g){
  const W=g.wind;
  return {x:W.vx,y:W.vy,speed:Math.hypot(W.vx,W.vy),dir:Math.atan2(W.vy,W.vx),steady:Math.hypot(W.sx,W.sy),gust:g.gust.phase==='blow'};
 }
 /** What the wind adds to the sideways and vertical speed of another aircraft. */
 const enemyDrift=g=>({x:g.wind.vx*CFG.enemyWind,y:g.wind.vy*CFG.enemyWind});

 // ---------------------------------------------------------------- things that fly at the aircraft
 const corridor=g=>g.sprint.phase==='warn'||g.sprint.phase==='burn';      // gates laid out while a sprint is on or coming: small hops, wider rings, more room
 const nextGap=g=>spacingOf(g.level)*(1+CFG.gapJitter*(g.rng()*2-1))*(corridor(g)?1+(g.sprint.peak-1)*CFG.sprintSpace:1);
 const PATTERNS=['walk','weave','orbit','stair'];
 /** Where the next gate goes. The gates follow a pattern for a few gates (a random walk, a weave from side to side, an orbit, a staircase up or down) and then another;
    the hop from one gate to the next never exceeds what the aircraft can fly in the time between two gates. */
 function nextPosition(g,last,box,hopX,hopY){
  const P=g.pat;
  if(--P.left<=0){
   const pool=g.gateCount<4?1:g.level<3?2:PATTERNS.length;
   P.kind=PATTERNS[Math.floor(g.rng()*pool)];P.left=3+Math.floor(g.rng()*4);P.dir=g.rng()<.5?-1:1;P.angle=g.rng()*6.28;
  }
  let x=last.x,y=last.y;
  if(P.kind==='weave'){x=clamp(P.dir*hopX*(.3+.12*g.rng())+(g.rng()*2-1)*.3,-box.x,box.x);P.dir=-P.dir;y=last.y+(g.rng()*2-1)*hopY*.6;}   // from side to side of the middle, within the hop
  else if(P.kind==='orbit'){P.angle+=P.dir*(.9+.5*g.rng());x=box.x*.64*Math.cos(P.angle);y=box.y*.7*Math.sin(P.angle);}
  else if(P.kind==='stair'){
   y=last.y+P.dir*(.3+.25*g.rng())*box.y*Math.min(1,hopY/.9);
   if(Math.abs(y)>=box.y*.9)P.dir=-Math.sign(y)||1;
   x=last.x+(g.rng()*2-1)*hopX*.55;
  }else{x=last.x+(g.rng()*2-1)*hopX;y=last.y+(g.rng()*2-1)*hopY;}
  let dx=x-last.x,dy=y-last.y;const d=Math.hypot(dx/hopX,dy/hopY);
  if(d>1){dx/=d;dy/=d;}
  return {x:clamp(last.x+dx,-box.x,box.x),y:clamp(last.y+dy,-box.y,box.y)};
 }
 function spawnGate(g,z){
  const level=g.level,box=gateBox(g),last=g.lastGate,hot=corridor(g),r=radiusOf(level)*(hot?1.1:1);
  let x=0,y=0;
  if(last){
   const soft=g.gateCount<3?.5:1,hop=hot?CFG.sprintHop:1;        // the first gates are gentle: the pilot is still finding out how the aircraft flies
   const hopX=hop*soft*Math.min(2*box.x,CFG.hopXMax,CFG.hopX+CFG.hopXStep*(level-1)),hopY=hop*soft*Math.min(2*box.y,CFG.hopY+CFG.hopYStep*(level-1));   // the height changes in small steps: easy to read
   for(let i=0;i<3;i++){
    const p=nextPosition(g,last,box,hopX,hopY);x=p.x;y=p.y;
    if(Math.hypot(x-last.x,y-last.y)>=.9)break;   // the next gate is never right behind the last one
   }
  }
  const gate={id:g.nextId++,n:++g.gateCount,x,y,z,r,state:'ahead',quality:null,age:0,approach:false,sprint:hot};
  g.gates.push(gate);g.lastGate=gate;return gate;
 }
 /** A pylon between two gates: half of them stand on the straight line between the gates (the autopilot has to fly around those), the rest anywhere. */
 function spawnObstacle(g,a,b){
  const box=gateBox(g),t=.5,z=a.z+(b.z-a.z)*t;      // half way between two rings that arrive on beats: on the half beat grid itself
  if(z<CFG.spawnMinZ)return false;
  for(let i=0;i<4;i++){
   const onPath=g.rng()<.55;
   const x=clamp(onPath?lerp(a.x,b.x,t)+(g.rng()*2-1)*.4:(g.rng()*2-1)*box.x,-box.x,box.x);
   const y=clamp(onPath?lerp(a.y,b.y,t)+(g.rng()*2-1)*.3:(g.rng()*2-1)*box.y,-box.y,box.y);
   if(Math.hypot(x-a.x,y-a.y)<a.r*.9+CFG.pylonR||Math.hypot(x-b.x,y-b.y)<b.r*.9+CFG.pylonR)continue;   // never inside a ring
   if(g.obstacles.some(o=>Math.abs(o.z-z)<1.4&&Math.hypot(o.x-x,o.y-y)<1.5))continue;                   // two pylons leave room between them
   const tnt=g.runTime>=CFG.tntFrom&&g.rng()<CFG.tntShare;
   g.obstacles.push({id:g.nextId++,kind:'pylon',tnt,x,y,z,r:tnt?CFG.tntR:CFG.pylonR,state:'ahead',age:0});
   return true;
  }
  return false;
 }
 /** A place between two gates, off the line of the gates by off world units in the direction phi (in CRUISE the altitude is held: only to the side, at the height of the next ring). */
 function besidePath(g,a,b,t,off,phi){
  const box=gateBox(g),cruise=g.mode==='CRUISE';
  return {x:clamp(lerp(a.x,b.x,t)+Math.cos(phi)*off,-box.x,box.x),y:cruise?b.y:clamp(lerp(a.y,b.y,t)+Math.sin(phi)*off*.55,-box.y,box.y),z:a.z+(b.z-a.z)*t};
 }
 /** Is the place taken: a thing of this list within the same depth and closer than its radius and the extra? */
 const crowded=(list,p,depth,extra)=>list.some(o=>Math.abs(o.z-p.z)<depth&&Math.hypot(o.x-p.x,o.y-p.y)<o.r+extra);
 /** A bonus ring between two gates, at its own depth and off the line of the gates: a small detour for a few points. Nothing is lost by missing it. */
 function spawnBonus(g,a,b){
  const box=gateBox(g),t=.5,z=a.z+(b.z-a.z)*t,cx=lerp(a.x,b.x,t),cy=lerp(a.y,b.y,t);
  if(z<CFG.spawnMinZ)return false;
  for(let i=0;i<4;i++){
   const far=g.rng()<.28,off=far?2+g.rng()*1.1:1+g.rng()*.9;
   let phi=g.rng()*6.28;if(g.mode==='CRUISE')phi=g.rng()<.5?0:Math.PI;           // in CRUISE the altitude is held: only a bonus to the side can be taken
   const x=clamp(cx+Math.cos(phi)*off,-box.x,box.x),y=clamp(cy+Math.sin(phi)*off*.55,-box.y,box.y),d=Math.hypot(x-cx,y-cy);
   if(d<.9)continue;
   if(crowded(g.obstacles,{x,y,z},1.2,CFG.bonusR+.25)||crowded(g.gates,{x,y,z},.6,CFG.bonusR)||crowded(g.boxes,{x,y,z},.9,CFG.bonusR))continue;
   g.bonuses.push({id:g.nextId++,kind:'bonus',x,y,z,r:CFG.bonusR,off:d,state:'ahead',age:0});
   return true;
  }
  return false;
 }
 /** A weapon box between two gates, a little off the line of the gates. */
 function spawnBox(g,a,b){
  const t=.5;
  if(a.z+(b.z-a.z)*t<CFG.spawnMinZ)return false;
  for(let i=0;i<4;i++){
   const off=.35+g.rng()*.9,phi=g.mode==='CRUISE'?(g.rng()<.5?0:Math.PI):g.rng()*6.28,p=besidePath(g,a,b,t,off,phi);
   if(crowded(g.obstacles,p,1.2,CFG.boxR+.3)||crowded(g.gates,p,.6,CFG.boxR))continue;
   g.boxes.push({id:g.nextId++,kind:'box',x:p.x,y:p.y,z:p.z,r:CFG.boxR,state:'ahead',age:0});
   return true;
  }
  return false;
 }
 /** A boost ring between two gates, a little off their line: flown through, it gives speed for a moment. */
 function spawnPad(g,a,b){
  if(a.z+(b.z-a.z)*.5<CFG.spawnMinZ)return false;
  for(let i=0;i<4;i++){
   const off=.3+g.rng()*.8,phi=g.mode==='CRUISE'?(g.rng()<.5?0:Math.PI):g.rng()*6.28,p=besidePath(g,a,b,.5,off,phi);
   if(crowded(g.obstacles,p,1.2,CFG.padR+.3)||crowded(g.gates,p,.6,CFG.padR)||crowded(g.boxes,p,.9,CFG.padR)||crowded(g.bonuses,p,.9,CFG.padR))continue;
   g.pads.push({id:g.nextId++,kind:'pad',x:p.x,y:p.y,z:p.z,r:CFG.padR,state:'ahead',age:0});
   return true;
  }
  return false;
 }
 /** A trail of three or five feathers between two gates, off the line at first and coming back to it. */
 function spawnFeathers(g,a,b){
  const n=g.rng()<CFG.featherLong?5:3,off=.35+g.rng()*.85,phi=g.mode==='CRUISE'?(g.rng()<.5?0:Math.PI):g.rng()*6.28;
  let made=0;
  for(let i=0;i<n;i++){
   const t=.14+.72*i/(n-1),p=besidePath(g,a,b,t,off*(1-.55*i/(n-1)),phi);
   if(p.z<CFG.spawnMinZ||crowded(g.obstacles,p,1,CFG.featherR+.2)||crowded(g.boxes,p,.9,CFG.featherR))continue;
   g.plumes.push({id:g.nextId++,kind:'feather',x:p.x,y:p.y,z:p.z,r:CFG.featherR,state:'ahead',age:0});made++;
  }
  return made;
 }
 /** Another aircraft. In AUTO it comes at the aircraft and at the next ring (the autopilot does not dodge it: the pilot's gun does); in the other modes it drifts anywhere.
    dx and dz put the members of a formation beside and behind the first. */
 function spawnEnemy(g,dx=0,dz=0){
  const box=gateBox(g),z=CFG.zFar+.8+dz;
  let x,y,vx,vy;
  if(g.mode==='AUTO'){
   const gate=nextGate(g),ax=gate?(g.plane.x+gate.x)/2:g.plane.x,ay=gate?(g.plane.y+gate.y)/2:g.plane.y;
   const T=z/(speedOf(g)*(1+CFG.enemySpeed));
   x=clamp(ax+dx+(g.rng()*2-1)*2.2,-box.x,box.x);y=clamp(ay+(g.rng()*2-1)*1,-box.y,box.y);
   vx=clamp((ax+(g.rng()*2-1)*.5-x)/T,-1.6,1.6);vy=clamp((ay+(g.rng()*2-1)*.3-y)/T,-.6,.6);
  }else{
   x=clamp((g.rng()*2-1)*box.x*.8+dx,-box.x,box.x);y=(g.rng()*2-1)*box.y;vx=(g.rng()*2-1)*CFG.enemyDrift;vy=(g.rng()*2-1)*.35;
  }
  const e={id:g.nextId++,kind:'enemy',x,y,z,r:CFG.enemyR,state:'ahead',age:0,vx,vy};
  g.enemies.push(e);emit(g,{type:'enemy',enemy:e});return e;
 }
 /** A wave of one, two (from level 5) or three (from level 11) aircraft: the others come beside and a little behind the first. */
 function spawnWave(g,room){
  const r=g.rng();
  let n=1;
  if(g.level>=CFG.tripleEnemyFrom&&r<.3)n=3;else if(g.level>=CFG.pairEnemyFrom&&r<.5)n=2;
  n=Math.min(n,room);
  const side=g.rng()<.5?-1:1;
  for(let i=0;i<n;i++)spawnEnemy(g,i?side*(1.9+g.rng()*.7)*(i%2?1:-1):0,i*(.7+g.rng()*.9));
  return n;
 }
 function spawnApproach(g,z,i){
  const L=CFG.landing,box=gateBox(g),t=L.gates>1?i/(L.gates-1):1;
  const gate={id:g.nextId++,n:++g.gateCount,x:0,y:box.y*(.85-1.55*t),z,r:lerp(L.radiusFrom,L.radiusTo,t),state:'ahead',quality:null,age:0,approach:true,index:i+1,sprint:false};
  g.gates.push(gate);g.lastGate=gate;return gate;
 }
 function ensureGates(g){
  if(g.finale){
   const L=CFG.landing,F=g.finale;       // the gates of the approach stand before the runway, one spacing apart
   while(F.spawned<L.gates&&F.runwayZ-L.spacing*(L.gates-F.spawned)<=CFG.zFar){spawnApproach(g,F.runwayZ-L.spacing*(L.gates-F.spawned),F.spawned);F.spawned++;}
   return;
  }
  if(!g.gap)g.gap=spacingOf(g.level);
  while(!g.lastGate||g.lastGate.z<=CFG.zFar-g.gap){
   const prev=g.lastGate,gate=spawnGate(g,prev?prev.z+g.gap:CFG.firstGate),live=isLive(g);
   if(prev&&live){
    if(g.runTime>=CFG.obstacleFrom){
     const chance=obstacleChance(g.level)*(gate.sprint?.4:1);
     if(g.rng()<chance){spawnObstacle(g,prev,gate);if(g.level>=CFG.pairFrom&&g.rng()<.45)spawnObstacle(g,prev,gate);}
    }
    if(g.mode!=='AUTO'){                      // while the autopilot flies there is nothing to steer to
     if(g.boxWait<=0&&spawnBox(g,prev,gate))g.boxWait=CFG.boxEvery*(.8+g.rng()*.4);
     if(g.rng()<bonusChance(g.level))spawnBonus(g,prev,gate);
     if(g.rng()<CFG.padChance)spawnPad(g,prev,gate);
     if(g.rng()<CFG.featherChance)spawnFeathers(g,prev,gate);
    }
   }
   g.gap=nextGap(g);
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
  const won=g.phase==='won';
  return {score:g.score,passed:g.passed,missed:g.missed,perfects:g.perfects,maxStreak:g.maxStreak,level:g.level,kills:g.kills,wrecked:g.wrecked,hits:g.hits,bonus:g.bonusTaken,sprints:g.sprint.clean,
   accuracy:g.passed?Math.round(100*g.perfects/g.passed):0,rank:won?gradeOf(g.finishTime):0,won,landing:g.landing,time:Math.round(g.runTime*10)/10,dist:Math.round(g.dist),
   avg:g.runTime>0?Math.round(g.dist/g.runTime*3.6):0,feathers:g.feathers,weaponLevel:weaponLevel(g),boxes:g.boxesTaken,used:g.used,timeBonus:g.timeBonus,moves:g.moves,onBeats:g.beats.count,
   place:g.place,racers:g.rivals.length+1};
 }
 function lose(g){
  if(g.lives>0)return false;
  g.phase='over';emit(g,{type:'over',summary:summary(g)});return true;
 }
 /** While the turbo or the invulnerability burns, a ring that is missed costs nothing. */
 const forgiving=g=>g.fx.turbo.t>0||g.fx.mask.t>0;
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
   emit(g,{type:'gate',gate,quality,points,mult,streak:g.streak,boosted:g.boost>.6,sprint:sprintOn(g),x:gate.x,y:gate.y,mode:g.mode,ult:g.ult});
   if(g.streak%CFG.lifeEvery===0&&g.lives<CFG.lives){g.lives++;emit(g,{type:'life',lives:g.lives});}
   const level=levelOf(g.passed);
   if(!g.finale&&level>g.level){g.level=level;emit(g,{type:'level',level});}   // the final approach has no levels
  }else if(forgiving(g)){
   gate.state='missed';gate.quality='forgiven';
   emit(g,{type:'forgiven',gate,x:gate.x,y:gate.y});
  }else{
   gate.state='missed';gate.quality='miss';
   g.lives--;g.streak=0;g.missed++;
   emit(g,{type:'miss',gate,dist:d,lives:g.lives,x:gate.x,y:gate.y});
   lose(g);
  }
 }
 /** A bonus ring reaches the aircraft: taken, or gone by. Nothing is lost either way. */
 function judgeBonus(g,b){
  const d=Math.hypot(g.plane.x-b.x,g.plane.y-b.y),M=MODES[g.mode];
  if(d>b.r){b.state='missed';g.bonusMissed++;return;}
  b.state='taken';g.bonusTaken++;
  const points=Math.round((CFG.bonusPts+CFG.bonusFar*b.off)*M.score*(sprintOn(g)?CFG.sprintScore:1));
  g.score+=points;
  if(!g.finale){const before=g.ult;g.ult=Math.min(100,g.ult+CFG.bonusUlt*M.ult);if(before<100&&g.ult>=100)emit(g,{type:'ultReady'});}
  emit(g,{type:'bonus',x:b.x,y:b.y,r:b.r,points,off:b.off});
 }
 /** Which weapon a box gives (by the weights). */
 function rollWeapon(g){let r=g.rng();for(const name of WEAPONS){r-=CFG.weights[name];if(r<0)return name;}return WEAPONS[WEAPONS.length-1];}
 /** A weapon box reaches the aircraft. An empty slot starts a roulette; a busy one only gets the points. */
 function judgeBox(g,b){
  if(Math.hypot(g.plane.x-b.x,g.plane.y-b.y)>b.r+CFG.boxReach){b.state='missed';return;}
  b.state='taken';g.boxesTaken++;
  const points=Math.round(CFG.boxPts*MODES[g.mode].score),full=!!(g.weapon||g.roll||g.finale);
  g.score+=points;
  if(!full)g.roll={t:0,dur:CFG.roulette,result:rollWeapon(g)};
  emit(g,{type:'box',x:b.x,y:b.y,full,points});
 }
 /** A feather reaches the aircraft; every tenth one makes the weapons a level stronger. */
 function judgeFeather(g,f){
  if(Math.hypot(g.plane.x-f.x,g.plane.y-f.y)>f.r+CFG.featherReach){f.state='missed';return;}
  f.state='taken';
  const before=weaponLevel(g),points=Math.round(CFG.featherPts*MODES[g.mode].score);
  g.feathers++;g.score+=points;
  emit(g,{type:'feather',x:f.x,y:f.y,total:g.feathers,points});
  const level=weaponLevel(g);
  if(level>before)emit(g,{type:'upgrade',level,max:level>=CFG.maxLevel});
 }
 /** A boost ring reaches the aircraft: flown through, it gives speed; nothing is lost by missing it. */
 function judgePad(g,p){
  if(Math.hypot(g.plane.x-p.x,g.plane.y-p.y)>p.r+CFG.planeR*.5){p.state='missed';return;}
  p.state='taken';const B=CFG.padBoost,F=g.fx.pad;
  g.fx.pad={t:Math.max(F.t,B.dur),dur:Math.max(F.t,B.dur),mul:Math.max(F.t>0?F.mul:1,B.mul)};
  const points=Math.round(CFG.padPts*MODES[g.mode].score);g.score+=points;
  emit(g,{type:'pad',x:p.x,y:p.y,r:p.r,points});
 }
 /** A pylon or another aircraft is destroyed by a weapon; it pays points. */
 function destroy(g,thing,how){
  if(thing.state!=='ahead')return 0;
  thing.state='shot';
  const enemy=thing.kind==='enemy',points=Math.round((enemy?CFG.shotKill:CFG.pylonPts)*MODES[g.mode].score);
  if(enemy)g.kills++;else g.wrecked++;
  g.score+=points;
  emit(g,{type:'destroy',how,kind:thing.kind,tnt:!!thing.tnt,x:thing.x,y:thing.y,z:thing.z,r:thing.r,points});
  return points;
 }
 /** An obstacle or an enemy reaches the aircraft. A hit costs a life; for 1.3 s afterwards the aircraft cannot be hit again. The invulnerability smashes it, the barrier
    turns it aside. */
 function collide(g,thing){
  const d=Math.hypot(g.plane.x-thing.x,g.plane.y-thing.y);
  if(d>thing.r+CFG.planeR){thing.state='passed';return;}
  if(g.fx.mask.t>0){destroy(g,thing,'mask');return;}
  thing.state='passed';
  if(g.fx.barrier.t>0){if(!thing.pushed){thing.pushed=true;emit(g,{type:'repel',x:thing.x,y:thing.y,z:thing.z,kind:thing.kind});}return;}
  if(g.invuln>0)return;
  thing.state=thing.kind==='enemy'?'crashed':'hit';
  g.lives--;g.streak=0;g.hits++;g.invuln=CFG.invuln;
  emit(g,{type:'hit',kind:thing.kind,thing,lives:g.lives,x:thing.x,y:thing.y});
  lose(g);
 }

 // ---------------------------------------------------------------- the weapons
 /** Everything a missile can chase: other aircraft first, then pylons, the nearest of each first. */
 const targetsAhead=(g,minZ,maxZ)=>[...g.enemies,...g.obstacles].filter(o=>o.state==='ahead'&&o.z>minZ&&o.z<maxZ).sort((a,b)=>(a.kind==='enemy'?0:1)-(b.kind==='enemy'?0:1)||a.z-b.z);
 function launch(g,P,list){
  const n=P.count;
  for(let i=0;i<n;i++){
   const side=(i-(n-1)/2)*.32;
   g.missiles.push({id:g.nextId++,x:g.plane.x+side,y:g.plane.y,z:.15,side,delay:i*CFG.missileStagger,life:CFG.missileLife,age:0,target:list[i%list.length].id,splash:P.splash,done:false});
  }
 }
 /** The weapon of the slot is used. Missiles with nothing to chase stay in the slot. Returns the name of the weapon, or null. */
 function useWeapon(g){
  if(g.phase!=='run'||g.finale||!g.weapon)return null;
  const name=g.weapon,level=weaponLevel(g),P=weaponParams(name,level);
  if(name==='missiles'){
   const list=targetsAhead(g,.8,CFG.zFar+1.5),rival=g.rivals.filter(r=>r.finished===null&&r.dist>g.dist&&r.dist-g.dist<=CFG.rivalReach).sort((a,b)=>a.dist-b.dist)[0];
   if(!list.length&&!rival){if(g.denyCool<=0){g.denyCool=CFG.denyCool;emit(g,{type:'weaponDenied',weapon:name});}return null;}
   if(list.length)launch(g,P,list);
   if(rival){rival.slow=CFG.rivalSlow;emit(g,{type:'rivalHit',id:rival.id});}      // like in a kart race: the rocket also finds the rival just ahead
  }else{
   const t=Math.max(g.fx[name].t,P.dur);      // used again while it still works: the longer time stays
   g.fx[name]={...P,t,dur:t,next:0};
  }
  g.weapon=null;g.used++;
  emit(g,{type:'use',weapon:name,level});
  return name;
 }
 function updateRoll(g,dt){
  const R=g.roll;if(!R)return;
  R.t+=dt;
  if(R.t>=R.dur){g.weapon=R.result;g.roll=null;emit(g,{type:'weapon',weapon:g.weapon,level:weaponLevel(g)});}
 }
 function updateEffects(g,dt){
  for(const name of Object.keys(g.fx)){const F=g.fx[name];if(F.t>0){F.t=Math.max(0,F.t-dt);if(!F.t)emit(g,{type:'effectEnd',weapon:name});}}
  const want=effectMul(g);
  g.rush+=(want-g.rush)*(1-Math.exp(-dt*CFG.rushRate));if(Math.abs(g.rush-want)<.005)g.rush=want;
 }
 /** The repelling barrier: pylons and other aircraft that come close are pushed out of the way before they arrive; from level 3 they break. */
 function updateBarrier(g,dt,speed){
  const F=g.fx.barrier;if(F.t<=0||g.finale)return;
  const P=g.plane;
  for(const o of [...g.obstacles,...g.enemies]){
   if(o.state!=='ahead'||o.z<=0||o.z>CFG.barrierReach)continue;
   const need=Math.max(F.r,o.r+CFG.planeR+.2),dx=o.x-P.x,dy=o.y-P.y,d=Math.hypot(dx,dy);
   if(d>=need)continue;
   if(F.crush){destroy(g,o,'barrier');continue;}
   const ux=d>1e-3?dx/d:(P.x>0?-1:1),uy=d>1e-3?dy/d:0,arrive=Math.max(.05,o.z/(speed*(o.kind==='enemy'?1+CFG.enemySpeed:1))),move=Math.min(need-d,((need-d)/arrive*1.4+1.5)*dt);
   o.x+=ux*move;o.y+=uy*move;
   if(!o.pushed){o.pushed=true;emit(g,{type:'repel',x:o.x,y:o.y,z:o.z,kind:o.kind});}
  }
 }
 /** The machine gun: it fires by itself, at the nearest thing close to the line of flight (the aircraft is pointed at it by flying there). */
 function updateGun(g,dt){
  const F=g.fx.gun;if(F.t<=0||g.finale)return;
  F.next-=dt;
  while(F.next<=0){
   F.next+=F.every;
   const P=g.plane;let best=null;
   for(const o of F.pylons?[...g.enemies,...g.obstacles]:g.enemies){
    if(o.state!=='ahead'||o.z<.3||o.z>CFG.gunRange||Math.hypot(o.x-P.x,o.y-P.y)>F.reach+o.r)continue;
    if(!best||o.z<best.z)best=o;
   }
   emit(g,{type:'gunShot',x:best?best.x:P.x,y:best?best.y:P.y,z:best?best.z:CFG.gunRange,hit:!!best});
   if(best)destroy(g,best,'gun');
  }
 }
 /** Homing missiles: they fly ahead and steer onto their target; a lost target is replaced by another; from level 2 the blast takes the neighbours too. */
 function updateMissiles(g,dt,speed){
  for(const m of g.missiles){
   if(m.delay>0){m.delay-=dt;m.x=g.plane.x+m.side;m.y=g.plane.y;continue;}
   m.life-=dt;m.age+=dt;
   const list=targetsAhead(g,m.z-.3,CFG.zFar+2);
   let t=list.find(o=>o.id===m.target)||null;
   if(!t){t=list.find(o=>!g.missiles.some(q=>q!==m&&q.target===o.id))||list[0]||null;m.target=t?t.id:null;}
   if(t){const eta=Math.max(.02,(t.z-m.z)/(CFG.missileSpeed+speed*(t.kind==='enemy'?1+CFG.enemySpeed:1))),k=Math.min(1,dt/eta);m.x+=(t.x-m.x)*k;m.y+=(t.y-m.y)*k;}
   m.z+=CFG.missileSpeed*dt;
   if(t&&m.z>=t.z-.3&&Math.hypot(m.x-t.x,m.y-t.y)<=t.r+.6){
    destroy(g,t,'missile');
    if(m.splash)for(const o of targetsAhead(g,0,CFG.zFar+2))if(Math.abs(o.z-t.z)<1.6&&Math.hypot(o.x-t.x,o.y-t.y)<=m.splash+o.r)destroy(g,o,'missile');
    m.done=true;
   }
  }
  g.missiles=g.missiles.filter(m=>!m.done&&m.life>0&&m.z<CFG.zFar+3);
 }

 // ---------------------------------------------------------------- the autopilot, the guns, the ULT, the wind, the sprint
 const nextGate=g=>g.gates.find(gate=>gate.state==='ahead')||null;
 /** Where the autopilot flies: the centre of the next ring (the glide path in the final approach), around the pylons that stand in the way. It does not see
    the other aircraft: that is what the gun of the pilot is for. */
 function autopilot(g){
  const gate=nextGate(g),P=g.plane,M=MODES[g.mode];
  let tx=P.x,ty=P.y;
  if(gate){tx=gate.x;ty=gate.y;}else if(g.finale&&g.finale.groundY!=null){tx=0;ty=g.finale.groundY+.3;}
  const tau=.16+.19/M.k+.5*M.lag,w=1/tau,speed=speedOf(g);      // the aircraft answers like a critically damped system with this time constant (a bank has to build up, then the slide)
  for(const o of g.obstacles){
   if(o.state!=='ahead'||o.z<=0||o.z>CFG.dodgeZ||(gate&&o.z>gate.z))continue;       // only the pylons between the aircraft and the next ring
   const t=o.z/speed,e=Math.exp(-w*t),f=Math.max(.3,1-(1+w*t)*e);
   const px=tx+((P.x-tx)+(P.vx+w*(P.x-tx))*t)*e,py=ty+((P.y-ty)+(P.vy+w*(P.y-ty))*t)*e;   // where the aircraft would be when it reaches the pylon (its speed now is taken into account)
   if(!o.way){const dx=px-o.x,dy=py-o.y,d=Math.hypot(dx,dy);o.way=d>1e-3?[dx/d,dy/d]:[1,0];}      // the side to pass on is chosen once, when the pylon comes into view (the aircraft is slow to turn: no changing of mind)
   const s=(px-o.x)*o.way[0]+(py-o.y)*o.way[1],clear=o.r+CFG.planeR+CFG.dodgeMargin;
   if(s<clear){const push=Math.min(2.4,(clear-s)/f);tx+=o.way[0]*push;ty+=o.way[1]*push;}
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
    const kind=g.rng(),sx=Math.sign(g.wind.sx)||1;
    if(kind<.2){G.dirX=0;G.dirY=g.rng()<.5?-.7:.7;}                                  // up or down
    else if(kind<.45){G.dirX=g.rng()<.65?sx:-sx;G.dirY=g.rng()<.5?-.5:.5;}             // slanting
    else{G.dirX=g.rng()<.65?sx:-sx;G.dirY=0;}                                         // mostly along the steady wind
    G.power=gustPowerOf(g.level)*(g.finale?.6:1);
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
 /** The wind: a steady part that grows with the level and turns now and then (a shift), a turbulence on top, and the gust. g.wind.vx / vy is what the air does to the aircraft. */
 function updateWind(g,dt){
  const W=g.wind,fin=g.finale?CFG.finaleWind:1,ramp=clamp(g.runTime/CFG.windRamp,0,1);
  W.shiftWait-=dt;
  if(W.shiftWait<=0){W.dirTo=W.dir+(g.rng()<.5?-1:1)*(1.6+g.rng()*1.5);W.shiftWait=lerp(CFG.windShift[0],CFG.windShift[1],g.rng());if(!g.finale)emit(g,{type:'wind',stage:'shift'});}
  W.dir+=clamp(W.dirTo-W.dir,-CFG.windTurn*dt,CFG.windTurn*dt);
  W.speed+=(windSpeedOf(g.level)*fin*ramp-W.speed)*(1-Math.exp(-dt*.8));
  W.sx=Math.cos(W.dir)*W.speed;W.sy=Math.sin(W.dir)*W.speed*CFG.windYshare;
  const amp=(CFG.windTurb*W.speed+.04)*ramp,t=g.time;
  W.tx=amp*(Math.sin(1.9*t+W.ph[0])+.6*Math.sin(3.7*t+W.ph[1]));W.ty=amp*.6*(Math.sin(2.3*t+W.ph[2])+.6*Math.sin(4.1*t+W.ph[3]));
  W.vx=W.sx+W.tx+g.gust.vx;W.vy=W.sy+W.ty+g.gust.vy;
 }
 /** The sprint: after a warning the speed climbs to a multiple of the normal one for a few seconds, then comes back. A sprint without a lost life or a missed ring pays a bonus. */
 function updateSprint(g,dt){
  const S=g.sprint;
  if(g.finale){S.phase='idle';S.mul=1+(S.mul-1)*Math.exp(-dt*6);if(S.mul<1.01)S.mul=1;return;}
  let target=1,rate=CFG.sprintUp;
  if(S.phase==='idle'){
   if(remaining(g)>CFG.distance-FINALE_AT+CFG.clearBefore+CFG.sprintLast){
    S.wait-=dt;
    if(S.wait<=0){S.phase='warn';S.t=0;S.peak=sprintPeakOf(g.level);S.len=sprintLenOf(g.level);emit(g,{type:'sprint',stage:'warn',peak:S.peak,len:S.len});}
   }
  }else if(S.phase==='warn'){
   S.t+=dt;
   if(S.t>=CFG.sprintWarn){S.phase='burn';S.t=0;S.mark=g.hits+g.missed;emit(g,{type:'sprint',stage:'start',peak:S.peak,len:S.len});}
  }else if(S.phase==='burn'){
   S.t+=dt;target=S.peak;
   if(S.t>=S.len){
    S.phase='cool';S.t=0;
    const clean=g.hits+g.missed===S.mark;let bonus=0;
    if(clean){S.clean++;bonus=Math.round(CFG.sprintClean*(1+Math.min(g.level,20)*.05));g.score+=bonus;}
    S.count++;emit(g,{type:'sprint',stage:'end',clean,bonus});
   }
  }else{
   rate=CFG.sprintDown;
   if(S.mul<1.03){S.phase='idle';S.mul=1;S.wait=sprintGapOf(g.level)*(.8+g.rng()*.4);}
  }
  S.mul+=(target-S.mul)*(1-Math.exp(-dt*rate));
 }
 /** Where the aircraft goes. input = {tx, ty, neutral}: the pointer on the plane of the aircraft, in world units, and whether there is a pointer at all (neutral: the stick is let go).
    The stick asks for a bank and a pitch (never more than the limits), the attitude follows with a lag, the bank pulls the aircraft sideways and the pitch up or down, drag
    stops the slide, and the wings come level by themselves when the stick is let go. The wind comes on top, as much of it as the mode lets through.
    FBWA: the aircraft follows the pointer. CRUISE: the altitude is held at the height of the next ring, the pointer only steers sideways. GUIDED: the aircraft flies
    to the pointer, but slowly: aim ahead. AUTO: the autopilot flies, the pointer is the gun. AUTOLAND: the autopilot follows the glide path, the pointer nudges it a little. */
 function control(g,dt,inp){
  const P=g.plane,M=MODES[g.mode],A=CFG.air,W=g.phase==='run'?g.wind:{vx:0,vy:0},G=g.phase==='run'?g.gust:{vx:0,vy:0};
  const cx=clamp(inp.tx,-g.fieldX,g.fieldX),cy=clamp(inp.ty,-g.fieldY,g.fieldY),free=inp.neutral;
  const auth=g.handover>0?clamp(1-g.handover/CFG.handover,0,1):1;           // right after the autopilot the pointer has only a part of the say: the autopilot flies on
  let tx=cx,ty=cy,holdX=free,holdY=free;       // holdX / holdY: the stick of that axis is let go
  if(auth<1&&g.mode!=='AUTO'&&g.mode!=='AUTOLAND'){const a=autopilot(g);tx=a.x+(cx-a.x)*auth;ty=a.y+(cy-a.y)*auth;holdX=holdY=false;}
  if(g.mode==='CRUISE'){const gate=nextGate(g);ty=gate?gate.y:P.y;holdY=false;}
  else if(g.mode==='AUTO'||g.mode==='AUTOLAND'){
   const a=autopilot(g);tx=a.x;ty=a.y;holdX=holdY=false;
   if(g.mode==='AUTOLAND'&&!free){tx+=clamp(cx/g.fieldX,-1,1)*CFG.nudgeX;ty+=clamp(cy/g.fieldY,-1,1)*CFG.nudgeY;}
  }
  g.aim.x=tx;g.aim.y=ty;
  const a=1-Math.exp(-dt/M.lag);
  P.cx+=(tx-P.cx)*a;P.cy+=(ty-P.cy)*a;
  const sx=holdX?0:clamp(M.k*(P.cx-P.x)-M.kd*P.vx,-1,1),sy=holdY?0:clamp(M.k*(P.cy-P.y)-M.kd*P.vy,-1,1);
  const step=(v,cmd,tau,rate)=>v+clamp((cmd-v)*(1-Math.exp(-dt/tau)),-rate*dt,rate*dt);
  P.roll=step(P.roll,sx*A.rollLim,A.rollTau,A.rollRate);P.pitch=step(P.pitch,sy*A.pitchLim,A.pitchTau,A.pitchRate);
  P.bank=P.roll+clamp(G.vx*A.rollKick,-.3,.3)*M.gust;P.tilt=P.pitch+clamp(G.vy*A.pitchKick,-.2,.2)*M.gust;       // a gust shakes the wings
  const ax=A.ax*Math.sin(clamp(P.bank,-1.1,1.1))/Math.sin(A.rollLim),ay=A.ay*Math.sin(clamp(P.tilt,-.7,.7))/Math.sin(A.pitchLim);
  P.ux+=(ax-A.dragX*P.ux)*dt;P.uy+=(ay-A.dragY*P.uy)*dt;
  P.vx=P.ux+W.vx*M.gust;P.vy=P.uy+W.vy*M.gust;
  const rx=P.x+P.vx*dt,ry=P.y+P.vy*dt;
  if((rx>g.fieldX&&P.ux>0)||(rx<-g.fieldX&&P.ux<0))P.ux=0;      // against the edge of the field the slide stops (it may still turn back at once)
  if((ry>g.fieldY&&P.uy>0)||(ry<-g.fieldY&&P.uy<0))P.uy=0;
  P.x=clamp(rx,-g.fieldX,g.fieldX);P.y=clamp(ry,-g.fieldY,g.fieldY);
 }
 /** The mode the plan asks for at this distance (the final approach has its own). */
 function updateMode(g){
  if(g.finale)return;
  const m=modeAt(g.dist);
  if(m.mode===g.mode)return;
  const from=g.mode;g.mode=m.mode;
  if(m.mode==='AUTO')g.enemyClock=clamp(g.enemyClock,1.5,3);   // the first intruder shows up soon after the autopilot takes over
  if(from==='AUTO')g.handover=CFG.handover;
  emit(g,{type:'mode',from,to:m.mode,index:m.index,handover:from==='AUTO'});
 }
 /** Where the plan is: {mode, index, t (metres into this mode), len (metres), left (metres), next (the mode after it)}. */
 function modeInfo(g){
  if(g.finale)return {mode:'AUTOLAND',index:-1,t:0,len:0,left:0,next:null};
  const m=modeAt(g.dist);
  return {mode:m.mode,index:m.index,t:g.dist-m.from,len:m.to-m.from,left:Math.max(0,m.to-g.dist),next:m.to>=FINALE_AT?'AUTOLAND':modeAt(m.to).mode};
 }

 // ---------------------------------------------------------------- the rhythm
 /** How far a time of the music is from the nearest beat (s). */
 const offBeat=(g,t)=>{const q=gridAt(g.music,t),p=(((t-q.anchor)%q.beat)+q.beat)%q.beat;return Math.min(p,q.beat-p);};
 /** The time on the grid (every so many beats) nearest to t, not before min. */
 function beatNear(g,t,min,beats){const q=gridAt(g.music,Math.max(t,min)),step=beats*q.beat;let at=q.anchor+Math.round((t-q.anchor)/step)*step;while(at<min-1e-9)at+=step;return at;}
 /** The speed of the world, near speed, that brings the next ring (in the final approach also the runway) to the aircraft on a beat. */
 function rhythmSpeed(g,speed){
  const next=nextGate(g),F=g.finale,now=g.beatClock,lo=speed*CFG.rhythmMin,hi=speed*CFG.rhythmMax;
  const thing=next&&next.z>0?{id:next.id,z:next.z,half:next.sprint}:F&&F.runwayZ>0?{id:'runway',z:F.runwayZ,half:false}:null;
  if(!thing){g.target=null;return speed;}
  const T=g.target,need=T&&T.id===thing.id?thing.z/Math.max(1e-3,T.at-now):0,beats=thing.half?.5:1,eta=now+thing.z/speed;
  // a new target when the thing is new, or when the speed changed enough for another beat to be nearer (a boost brings the ring on an earlier one); never in the last moment
  const keep=T&&T.id===thing.id&&(thing.z<speed*.2||(T.at>now&&need>=lo&&need<=hi&&Math.abs(eta-T.at)<=beats*gridAt(g.music,now).beat*.35));
  if(!keep)g.target={id:thing.id,at:beatNear(g,eta,now+thing.z/hi,beats)};
  return clamp(thing.z/Math.max(1e-3,g.target.at-now),lo,hi);
 }
 /** A press that did something (a weapon, the ULT, a shot): on a beat it pays extra, more for a streak of them. */
 function onBeat(g){
  if(g.phase!=='run')return 0;
  if(offBeat(g,g.beatClock)>CFG.onBeat){g.beats.streak=0;return 0;}
  g.beats.streak=Math.min(CFG.onBeatMax,g.beats.streak+1);g.beats.count++;
  const points=CFG.onBeatPts*g.beats.streak;g.score+=points;
  emit(g,{type:'onbeat',points,streak:g.beats.streak});return points;
 }
 /** The presses go to the manoeuvre from a little more than a beat before its first tap. */
 const qtePending=g=>!!g.qte&&g.phase==='run'&&g.beatClock>=g.qte.taps[0]-g.qte.beat*1.2;
 /** The press of the manoeuvre: 'perfect' or 'good' when it falls on one of its taps, else null (nothing is spent by a press that misses). */
 function pressQte(g){
  const Q=g.qte;if(!Q||g.phase!=='run')return null;
  let best=-1,d=CFG.qteGood+1e-9;
  Q.taps.forEach((t,i)=>{const x=Math.abs(g.beatClock-t);if(!Q.hits[i]&&x<=d){d=x;best=i;}});
  if(best<0)return null;
  const quality=d<=CFG.qtePerfect?'perfect':'good';Q.hits[best]=quality;
  emit(g,{type:'qteTap',move:Q.type,tap:best,quality,dir:Q.dir});
  if(Q.hits.every(Boolean))finishQte(g);
  return quality;
 }
 /** The manoeuvre is over: all taps on the beat (a barrel roll that keeps the aircraft safe for a moment, or the other aircraft shot down), or nothing. */
 function finishQte(g){
  const Q=g.qte,T=g.marked;g.qte=null;g.marked=null;
  const at=Q.type==='kill'&&T?{x:T.x,y:T.y,z:Math.max(.2,T.z)}:{x:g.plane.x,y:g.plane.y,z:0};
  if(!Q.hits.every(Boolean)){emit(g,Object.assign({type:'qte',move:Q.type,ok:false},at));return;}
  const perfect=Q.hits.every(h=>h==='perfect'),points=Math.round((Q.type==='roll'?CFG.rollPts:CFG.killPts)*(perfect?1:.6)*MODES[g.mode].score);
  g.score+=points;g.moves++;
  if(Q.type==='roll'){g.invuln=Math.max(g.invuln,CFG.rollSafe);g.fx.pad.t=CFG.rollBoost.dur;g.fx.pad.dur=CFG.rollBoost.dur;g.fx.pad.mul=CFG.rollBoost.mul;}      // like a drift boost: a roll on the beat gives speed
  else{g.kills++;const before=g.ult;g.ult=Math.min(100,g.ult+CFG.killUlt);if(before<100&&g.ult>=100)emit(g,{type:'ultReady'});}
  emit(g,Object.assign({type:'qte',move:Q.type,ok:true,perfect,points,dir:Q.dir},at));
 }
 /** The loop of the music and the manoeuvres: the static and the turn over at the end of a loop, a manoeuvre on every few bars while the route goes on. */
 function updateRhythm(g,speed){
  const now=g.beatClock,n=segmentAt(g.music,now).k;
  if(n!==g.loop){g.loop=n;if(!g.finale){g.glitch=CFG.glitch;g.inverted=n%2===1;emit(g,{type:'loop',n,inverted:g.inverted});}}
  if(g.qteAt===null){const q=gridAt(g.music,0);g.qteAt=q.anchor+CFG.qteFirst*4*q.beat;}
  if(g.qte){
   const Q=g.qte,T=g.marked;
   if(T)T.z=Math.max(.8,1.8+(Q.taps[0]-now)*speed*.8);      // the target comes closer and waits in front for its beat
   if(now>Q.taps[Q.taps.length-1]+CFG.qteGood)finishQte(g);
   return;
  }
  const beat=gridAt(g.music,g.qteAt).beat;
  if(now<g.qteAt-CFG.qteShow*beat)return;
  const at=g.qteAt;g.qteAt=beatNear(g,at+CFG.qteEvery*4*beat,at+beat*4,4);
  if(!isLive(g)||at-now<CFG.qteShow*beat*.5)return;      // none in the last part of the route, and none that would come at once
  const type=g.qteCount++%2?'roll':'kill';
  g.qte={type,beat,taps:type==='roll'?[at,at+beat/2]:[at],hits:type==='roll'?[null,null]:[null],from:now,dir:g.rng()<.5?-1:1};
  if(type==='kill'){const box=gateBox(g);g.marked={id:g.nextId++,kind:'enemy',x:(g.rng()*2-1)*box.x*.55,y:(g.rng()*2-1)*box.y*.6,z:CFG.zFar,r:CFG.enemyR,state:'ahead',age:0,vx:0,vy:0};}
  emit(g,{type:'qteAsk',move:type,beatTime:at});
 }

 // ---------------------------------------------------------------- the rivals
 /** The speed of a rival now, metres a second: an ordinary pilot's, a little sway of its own, easing off far ahead of the player and pushing far behind. */
 function rivalSpeed(g,r){
  const base=CFG.rivalSpeed*(1+CFG.rivalRamp*Math.min(1,g.runTime/CFG.rivalRampTime))*r.pace,lead=r.dist-g.dist;
  const rubber=lead>CFG.rubberGap?1-CFG.rubber:lead<-CFG.rubberGap?1+CFG.rubber:1;
  return base*(1+CFG.rivalSway*Math.sin(g.runTime*.23+r.phase))*rubber*(r.slow>0?CFG.rivalSlowBy:1);
 }
 /** The rivals fly on; a change of the player's place is told. */
 function updateRivals(g,dt){
  for(const r of g.rivals){
   if(r.finished!==null)continue;
   r.slow=Math.max(0,r.slow-dt);r.dist+=rivalSpeed(g,r)*dt;
   if(r.dist>=CFG.distance){r.dist=CFG.distance;r.finished=g.runTime;emit(g,{type:'rivalFinish',id:r.id});}
  }
  const place=placeOf(g);
  if(place!==g.place){const up=place<g.place;g.place=place;emit(g,{type:'place',place,up});}
 }
 /** 1: first. A rival that is at the finish, or further along the route, is ahead. */
 const placeOf=g=>1+g.rivals.filter(r=>r.finished!==null||r.dist>g.dist).length;

 // ---------------------------------------------------------------- the final approach
 function startFinale(g){
  const box=gateBox(g),L=CFG.landing;
  g.finale={spawned:0,runwayZ:Math.max(remaining(g)/CFG.unit,L.spacing*(L.gates+1)),groundY:Math.max(-g.fieldY+.1,-(box.y*.7+.3))};
  g.fx=freshFx();g.rush=1;g.weapon=null;g.roll=null;g.missiles=[];      // the weapons are put away for the landing
  g.qte=null;g.marked=null;g.target=null;g.glitch=0;if(g.inverted){g.inverted=false;emit(g,{type:'upright'});}      // ... and the aircraft lands the right way up
  const from=g.mode;g.mode='AUTOLAND';
  emit(g,{type:'mode',from,to:'AUTOLAND',index:-1});
  emit(g,{type:'finale'});
 }
 function touchdown(g){
  const L=CFG.landing,F=g.finale,P=g.plane;
  const dx=Math.abs(P.x),dy=Math.abs(P.y-(F.groundY+.3));
  const grade=dx<=L.touchPerfect&&dy<=L.touchPerfect?'perfect':dx<=L.touchGood&&dy<=L.touchGood*1.2?'good':'hard';
  const bonus=L.bonus[grade]+g.lives*L.lifeBonus;
  g.place=1+g.rivals.filter(r=>r.finished!==null).length;      // those still on the way come after
  g.finishTime=g.runTime;g.timeBonus=timeBonus(g.finishTime);g.dist=CFG.distance;
  g.score+=bonus+g.timeBonus;g.landing={grade,bonus,dx,dy};
  g.phase='won';
  emit(g,{type:'touchdown',grade,bonus,dx,dy});
  emit(g,{type:'won',summary:summary(g)});
 }

 /** One step. input = {tx, ty, boost, neutral, clock}: the pointer on the plane of the aircraft (world units), whether the boost button is held, whether the pointer
    is away (the stick is let go and the aircraft levels out), and the time of the music as heard (null: no music plays, the rhythm goes on by itself). */
 function step(g,dt,input){
  if(g.phase==='ready'||g.phase==='over'||g.phase==='won'||g.phase==='paused')return g;
  dt=clamp(dt,0,.05);
  g.time+=dt;
  // the rhythm follows the music gently (never backwards); the world moves by the time of the music, so the rings arrive on its beats
  const was=g.beatClock,heard=input&&Number.isFinite(input.clock)?input.clock:null;
  g.beatClock=heard===null?was+dt:Math.max(was,was+dt+(heard-was-dt)*.2);
  const beatDt=clamp(g.beatClock-was,0,.1);
  g.glitch=Math.max(0,g.glitch-dt);
  const P=g.plane,inp={tx:input&&Number.isFinite(input.tx)?input.tx:P.x,ty:input&&Number.isFinite(input.ty)?input.ty:P.y,boost:!!(input&&input.boost),neutral:!!(input&&input.neutral)};
  g.ultCool=Math.max(0,g.ultCool-dt);g.fireCool=Math.max(0,g.fireCool-dt);g.invuln=Math.max(0,g.invuln-dt);g.denyCool=Math.max(0,g.denyCool-dt);
  if(g.phase==='count'){
   control(g,dt,inp);
   g.countdown-=dt;
   if(g.countdown<=0){g.phase='run';emit(g,{type:'start'});emit(g,{type:'mode',from:null,to:g.mode,index:0});}
   return g;
  }
  if(g.freeze>0){control(g,dt,inp);g.freeze=Math.max(0,g.freeze-dt);return g;}
  const landing=!!g.finale;
  g.runTime+=dt;g.handover=Math.max(0,g.handover-dt);
  updateMode(g);
  if(g.calm){g.gust.vx=g.gust.vy=g.wind.vx=g.wind.vy=g.wind.sx=g.wind.sy=0;}else{updateGust(g,dt);updateWind(g,dt);}
  updateSprint(g,dt);
  updateEffects(g,dt);
  updateRoll(g,dt);
  if(!g.finale)g.boxWait-=dt;
  control(g,dt,inp);
  const M=MODES[g.mode];
  g.boost+=(((inp.boost&&M.boost)?1:0)-g.boost)*(1-Math.exp(-dt*4.5));
  const speed=rhythmSpeed(g,speedOf(g)),move=speed*beatDt,drift=enemyDrift(g),bx=gateBox(g).x,push=g.finale?0:g.wind.sx*CFG.ringWind*dt;      // the steady wind also carries the rings, pylons, boxes and feathers sideways
  // the next gate is laid out from the last one, also after that one has gone by and left the list: it keeps flying away behind the aircraft
  if(g.lastGate&&!g.gates.includes(g.lastGate))g.lastGate.z-=move;
  updateBarrier(g,dt,speed);
  for(const gate of g.gates){
   const before=gate.z;
   gate.z-=move;gate.age+=dt;if(!gate.approach)gate.x=clamp(gate.x+push,-bx,bx);
   if(gate.state==='ahead'&&before>0&&gate.z<=1e-6){gate.z=Math.min(gate.z,0);gate.beat=g.beatClock;judge(g,gate);if(g.phase==='over')return g;}
  }
  for(const [list,judgeIt] of [[g.bonuses,judgeBonus],[g.boxes,judgeBox],[g.plumes,judgeFeather],[g.pads,judgePad]])for(const b of list){
   const before=b.z;b.z-=move;b.age+=dt;b.x=clamp(b.x+push,-bx,bx);
   if(b.state==='ahead'&&before>0&&b.z<=0)judgeIt(g,b);
  }
  for(const o of g.obstacles){
   const before=o.z;o.z-=move;o.age+=dt;o.x=clamp(o.x+push,-bx,bx);
   if(o.state==='ahead'&&before>0&&o.z<=0){collide(g,o);if(g.phase==='over')return g;}
  }
  for(const e of g.enemies){
   const before=e.z,box=gateBox(g);
   e.z-=move*(1+CFG.enemySpeed);e.x=clamp(e.x+(e.vx+drift.x)*dt,-g.fieldX,g.fieldX);e.y=clamp(e.y+(e.vy+drift.y)*dt,-box.y,box.y);e.age+=dt;
   if(e.state==='ahead'&&before>0&&e.z<=0){collide(g,e);if(g.phase==='over')return g;}
  }
  updateGun(g,dt);updateMissiles(g,dt,speed);
  g.gates=g.gates.filter(gate=>gate.z>CFG.zGone);
  g.bonuses=g.bonuses.filter(b=>b.z>CFG.zGone);
  g.boxes=g.boxes.filter(b=>b.z>CFG.zGone&&b.state!=='taken');
  g.plumes=g.plumes.filter(f=>f.z>CFG.zGone&&f.state!=='taken');
  g.pads=g.pads.filter(p=>p.z>CFG.zGone&&p.state!=='taken');
  g.obstacles=g.obstacles.filter(o=>o.z>CFG.zGone&&o.state!=='shot');
  g.enemies=g.enemies.filter(e=>e.z>CFG.zGone&&e.state!=='shot'&&e.state!=='crashed');
  g.dist=Math.min(CFG.distance,g.dist+move*CFG.unit);      // the route that has been flown
  if(!g.finale&&g.dist>=FINALE_AT)startFinale(g);
  ensureGates(g);
  updateRhythm(g,speed);
  updateRivals(g,dt);
  if(g.runTime>=CFG.enemyFrom&&isLive(g)){
   const auto=g.mode==='AUTO';
   g.enemyClock-=dt;
   if(g.enemyClock<=0){
    const room=(auto?CFG.enemyMaxAuto:CFG.enemyMax)-g.enemies.filter(e=>e.state==='ahead').length;
    if(room>0)spawnWave(g,room);
    g.enemyClock=enemyGap(g.level)*(auto?CFG.autoGapMul:1)*(.8+g.rng()*.4);
   }
  }
  if(landing&&g.finale&&g.finale.runwayZ!=null){
   g.finale.runwayZ-=move;
   if(g.finale.runwayZ<=1e-6){g.finale.runwayZ=Math.min(0,g.finale.runwayZ);touchdown(g);}
  }
  return g;
 }
 /** The pilot left the card or the page: time stops. Coming back gives a short freeze before the gates move again. */
 function pause(g){if(g.phase==='run'||g.phase==='count'){g.resume=g.phase;g.phase='paused';}return g;}
 function resume(g){if(g.phase==='paused'){g.phase=g.resume||'run';g.resume=null;if(g.phase==='run')g.freeze=CFG.freeze;}return g;}

 // ---- the best score, the best time and the music switch live in localStorage; every access may throw (private windows, blocked storage)
 const BEST_KEY='atlas-flight-best',TIME_KEY='atlas-flight-time',MUSIC_KEY='atlas-flight-music';
 function readBest(storage){try{const v=Number(storage.getItem(BEST_KEY));return Number.isFinite(v)&&v>0?Math.floor(v):0;}catch{return 0;}}
 function writeBest(storage,score){try{storage.setItem(BEST_KEY,String(Math.floor(score)));return true;}catch{return false;}}
 /** The fastest whole flight, seconds (0: none yet). */
 function readTime(storage){try{const v=Number(storage.getItem(TIME_KEY));return Number.isFinite(v)&&v>0?v:0;}catch{return 0;}}
 function writeTime(storage,seconds){try{storage.setItem(TIME_KEY,String(Math.round(seconds*10)/10));return true;}catch{return false;}}
 /** The music is on unless the player switched it off ('0'). */
 function readMusic(storage){try{return storage.getItem(MUSIC_KEY)!=='0';}catch{return true;}}
 function writeMusic(storage,on){try{storage.setItem(MUSIC_KEY,on?'1':'0');return true;}catch{return false;}}

 // ---------------------------------------------------------------- the tune: an eight-bar chiptune loop in A minor (an original one), in sixteenth notes
 // The layer plays it with square, triangle and noise voices. lead: the tune, bass: octave bounce on the root of the chord, arp: arpeggio of the chord (the sprint),
 // drums: kick, snare, hat. A step is a sixteenth note; 16 steps are a bar.
 const NOTE_NAMES={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
 const midi=name=>{const m=/^([A-G])(#|b)?(\d)$/.exec(name);return m?12*(Number(m[3])+1)+NOTE_NAMES[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0):null;};
 const LEAD_TEXT=[
  'E5:3 D5:1 C5:2 A4:2  C5:2 D5:2 E5:4',   'A5:4 G5:2 E5:2  D5:4 .:2 E5:2',
  'F5:3 E5:1 C5:2 A4:2  C5:2 F5:2 E5:4',   'D5:2 G5:2 F5:2 D5:2  B4:2 D5:2 G5:4',
  'E5:3 D5:1 C5:2 A4:2  C5:2 D5:2 E5:4',   'A5:2 G5:2 E5:2 G5:2  A5:4 E5:2 .:2',
  'F5:2 E5:2 C5:2 E5:2  F5:4 A5:4',        'B4:2 G#4:2 B4:2 E5:2  G#5:4 E5:4'
 ];
 const CHORDS=[['A2','A4','C5','E5'],['A2','A4','C5','E5'],['F2','F4','A4','C5'],['G2','G4','B4','D5'],['A2','A4','C5','E5'],['A2','A4','C5','E5'],['F2','F4','A4','C5'],['E2','E4','G#4','B4']]
  .map(c=>Object.freeze(c.map(midi)));
 const MUSIC_STEPS=128,LEAD=(()=>{
  const out=new Array(MUSIC_STEPS).fill(null);let i=0;
  for(const bar of LEAD_TEXT)for(const tok of bar.trim().split(/\s+/)){const [n,l]=tok.split(':'),len=Number(l);if(n!=='.')out[i]=Object.freeze({m:midi(n),len});i+=len;}
  if(i!==MUSIC_STEPS)throw new Error('the tune has '+i+' steps, not '+MUSIC_STEPS);
  return Object.freeze(out);
 })();
 /** What plays at a sixteenth-note step of the loop (any whole number; it wraps): {lead: {m, len} | null, bass: midi | null, arp: midi | null, kick, snare, hat}. */
 function tuneStep(i){
  i=((Math.floor(i)%MUSIC_STEPS)+MUSIC_STEPS)%MUSIC_STEPS;
  const bar=i>>4,s=i&15,chord=CHORDS[bar];
  return {lead:LEAD[i],bass:s%2===0?chord[0]+(s%4===2?12:0):null,arp:chord[1+(i%3)]+((i>>2)&1?12:0),
   kick:s===0||s===8||(s===10&&(bar&1)===1),snare:s===4||s===12,hat:s%2===0};
 }
 const MUSIC=Object.freeze({steps:MUSIC_STEPS,bpm:134,tuneStep,midi});

 return Object.freeze({CFG,MODES,PLAN,WEAPONS,FINALE_AT,TRACK,BEAT,LOOP,MAIN_MUSIC,segmentAt,gridAt,offBeat,onBeat,pressQte,qtePending,placeOf,BEST_KEY,TIME_KEY,MUSIC_KEY,MUSIC,create,begin,step,drain,pause,resume,setField,shoot,fireUlt,useWeapon,summary,gradeOf,timeBonus,levelOf,speedMul,radiusOf,spacingOf,gustWait,gustPowerOf,
  windSpeedOf,obstacleChance,enemyGap,bonusChance,sprintPeakOf,sprintLenOf,sprintGapOf,weaponParams,weaponLevel,effectsOf,multiplier,nextGate,autopilot,modeAt,modeInfo,speedOf,airspeed,remaining,sprintInfo,windInfo,enemyDrift,
  readBest,writeBest,readTime,writeTime,readMusic,writeMusic,mulberry32});
});
