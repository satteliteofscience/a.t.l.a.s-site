/* A.T.L.A.S. FLIGHT DISPLAY — standalone visual simulation.
   These numbers are synthetic. No MAVLink, USB, or flight-controller connection. */
(() => {
  'use strict';
  const host = document.getElementById('flightPlayground');
  const canvas = document.getElementById('flightCanvas');
  if (!host || !canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const $ = id => document.getElementById(id);
  const ui = {
    roll: $('simRoll'), pitch: $('simPitch'), yaw: $('simYaw'),
    speed: $('simSpeed'), throttle: $('simThrottle'), speedbar: $('speedRailFill'),
    status: $('simMotionState')
  };
  const state = {
    roll: -5, pitch: 1.2, yaw: -8, rollVel: 0, pitchVel: 0, yawVel: 0,
    aimRoll: 0, aimPitch: 0, aimYaw: 0, heading: 0,
    speed: 148, throttle: 40, boosted: false, hovered: false,
    keyboard: false, targetX: 0, targetY: 0,
    w: 500, h: 350, last: 0, elapsed: 0, lastUi: 0,
    pointerId: null, running: true, inView: true, lastDraw: 0
  };
  const deg = Math.PI/180;
  const bound = (a, lo, hi) => Math.max(lo,Math.min(hi,a));
  const mix = (a,b,t) => a+(b-a)*t;
  const digits = (val, places=1) => `${val >= 0 ? '+' : '−'}${String(Math.abs(val).toFixed(places)).padStart(places ? 4 : 3,'0')}°`;
  function targetFromPointer(ev){
    const rect = host.getBoundingClientRect();
    state.targetX = bound((ev.clientX - rect.left)/rect.width*2-1,-1,1);
    state.targetY = bound(1-(ev.clientY - rect.top)/rect.height*2,-1,1);
    state.aimRoll = state.targetX*70;
    state.aimPitch = -state.targetY*32;
    state.aimYaw = state.targetX*22;
  }
  function enter(ev){state.hovered=true; if (ev) targetFromPointer(ev);host.classList.add('is-hovered');}
  host.addEventListener('pointerenter', ev=>{if(ev.pointerType==='mouse'||ev.pointerType==='pen')enter(ev);});
  host.addEventListener('pointermove', ev=>{
    if(ev.pointerType==='touch' && state.pointerId!==ev.pointerId)return;
    enter(ev);
    if (ev.pointerType==='touch' && state.pointerId===ev.pointerId)ev.preventDefault();
  });
  function release(){state.boosted=false;host.classList.remove('is-boosting');state.pointerId=null;}
  host.addEventListener('pointerdown', ev=>{
    if(ev.button!==0 && ev.pointerType!=='touch')return;
    enter(ev);
    state.pointerId=ev.pointerId;
    state.boosted=true;
    state.speed=Math.min(310,state.speed+11);
    host.classList.add('is-boosting');
    try { host.setPointerCapture(ev.pointerId); }catch{}
    if(ev.pointerType==='mouse') ev.preventDefault();
  });
  host.addEventListener('pointerup', release);
  host.addEventListener('pointercancel', release);
  host.addEventListener('lostpointercapture', release);
  host.addEventListener('pointerleave',()=>{
    if(state.pointerId!==null)return;
    state.hovered=false;host.classList.remove('is-hovered');
    state.aimRoll=0;state.aimPitch=0;state.aimYaw=0;
  });
  host.addEventListener('contextmenu', ev=>ev.preventDefault());
  host.addEventListener('keydown',ev=>{
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(ev.key))return;
    ev.preventDefault();state.hovered=true;state.keyboard=true;host.classList.add('is-hovered');
    if(ev.key==='ArrowLeft')state.aimRoll=bound(state.aimRoll-12,-70,70);
    if(ev.key==='ArrowRight')state.aimRoll=bound(state.aimRoll+12,-70,70);
    if(ev.key==='ArrowUp')state.aimPitch=bound(state.aimPitch-7,-32,32);
    if(ev.key==='ArrowDown')state.aimPitch=bound(state.aimPitch+7,-32,32);
    state.aimYaw=state.aimRoll*.35;
    if(ev.key===' '){state.boosted=true;host.classList.add('is-boosting');}
  });
  host.addEventListener('keyup',ev=>{if(ev.key===' '){release();}});
  host.addEventListener('blur',()=>{release();state.keyboard=false;state.hovered=false;state.aimRoll=0;state.aimPitch=0;state.aimYaw=0;host.classList.remove('is-hovered');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){state.last=0;release();}});

  const mesh = [
    {name:'left-wing',points:[[-.16,0,.56],[-2.74,-.015,-.08],[-3.12,-.015,-.40],[-2.88,-.015,-.55],[-.17,0,-.22]],fill:'rgba(181,178,70,.26)',line:'#b5be64',width:1.9},
    {name:'right-wing',points:[[.16,0,.56],[2.74,-.015,-.08],[3.12,-.015,-.40],[2.88,-.015,-.55],[.17,0,-.22]],fill:'rgba(221,201,92,.25)',line:'#e9d56b',width:1.9},
    {name:'left-aileron',points:[[-1.55,.008,-.38],[-2.86,.008,-.58],[-2.92,.008,-.44],[-1.55,.008,-.23]],fill:'rgba(222,216,94,.15)',line:'#8c9c46',width:1.0},
    {name:'right-aileron',points:[[1.55,.008,-.38],[2.86,.008,-.58],[2.92,.008,-.44],[1.55,.008,-.23]],fill:'rgba(222,216,94,.15)',line:'#8c9c46',width:1.0},
    {name:'left-flap',points:[[-.42,.009,-.28],[-1.42,.009,-.42],[-1.46,.009,-.30],[-.44,.009,-.16]],fill:'rgba(225,214,109,.12)',line:'#a5a94a',width:1.0},
    {name:'right-flap',points:[ [.42,.009,-.28],[1.42,.009,-.42],[1.46,.009,-.30],[.44,.009,-.16]],fill:'rgba(225,214,109,.12)',line:'#a5a94a',width:1.0},
    {name:'fuselage',points:[[0,.14,2.40],[.11,.14,1.69],[.20,.13,.4],[.16,.12,-1.25],[.12,.11,-2.13],[0,.12,-2.42],[-.12,.11,-2.13],[-.16,.12,-1.25],[-.20,.13,.4],[-.11,.14,1.69]],fill:'rgba(235,216,113,.25)',line:'#efe077',width:2.0},
    {name:'vtail-left',points:[[-.075,.08,-1.46],[-.78,.81,-1.85],[-1.00,.95,-2.36],[-.10,.12,-2.22]],fill:'rgba(134,162,79,.30)',line:'#b3c36b',width:1.7},
    {name:'vtail-right',points:[[.075,.08,-1.46],[.78,.81,-1.85],[1.00,.95,-2.36],[.10,.12,-2.22]],fill:'rgba(240,203,99,.30)',line:'#f3d875',width:1.7},
    {name:'cockpit',points:[[0,.16,1.52],[.095,.20,1.10],[.15,.23,.22],[0,.29,-.22],[-.15,.23,.22],[-.095,.20,1.10]],fill:'rgba(254,241,169,.30)',line:'#f9eca8',width:1.2}
  ];
  function planeRotation(){
    const r=state.roll*deg,pch=state.pitch*deg,yaw=state.yaw*deg;
    const cr=Math.cos(r),sr=Math.sin(r),cp=Math.cos(pch),sp=Math.sin(pch),cy=Math.cos(yaw),sy=Math.sin(yaw);
    return ([x,y,z])=>{
      [x,y]=[x*cr-y*sr,x*sr+y*cr];
      [y,z]=[y*cp+z*sp,-y*sp+z*cp];
      return [x*cy+z*sy,y,-x*sy+z*cy];
    };
  }
  function project(p){
    const [x,y,z]=p;
    const depth=7.8+z*.65-y*.36;
    const scale=Math.min(state.w*.155,state.h*.21)*(7.8/depth);
    return [state.w*.5+x*scale,state.h*.51-(y*.83+z*.52)*scale,depth];
  }
  function path(points,close=true){
    if(!points.length)return;
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    if(close)ctx.closePath();
  }
  function drawBackground(){
    const w=state.w,h=state.h;
    // Dynamic background horizon: follows simulated attitude, separate from the aircraft model.
    ctx.save();ctx.translate(w/2,h/2);ctx.rotate(state.roll*deg*.28);ctx.translate(0,state.pitch*.7);
    ctx.fillStyle='rgba(98,118,39,.055)';ctx.fillRect(-w*1.7,0,w*3.4,h*2.5);
    ctx.beginPath();ctx.moveTo(-w*1.7,0);ctx.lineTo(w*1.7,0);
    ctx.strokeStyle='rgba(211,204,98,.19)';ctx.lineWidth=1.2;ctx.stroke();
    ctx.setLineDash([6,10]);ctx.strokeStyle='rgba(177,181,80,.22)';
    for(const off of [-.32,.32]){const y=off*h;ctx.beginPath();ctx.moveTo(-w,y);ctx.lineTo(w,y);ctx.stroke();}
    ctx.setLineDash([]);ctx.restore();
    // Speed lines convey airspeed without pretending to be actual GPS/IMU data.
    const velocity=state.speed/310;
    for(let i=0;i<20;i++){
      const u=(Math.sin(i*37.19)*1234.77)%1;
      const v=(Math.sin(i*12.47+9)*1922.63)%1;
      const offset=(state.elapsed*(.08+velocity*.3)+(i/20)*.93)%1;
      const x=((u+1)%1)*w, y=((v+1+offset)%1)*h;
      ctx.strokeStyle=`rgba(221,207,96,${state.boosted?.13:.05})`;
      ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(x-w*.5)*velocity*.03,y+(y-h*.5)*velocity*.05);ctx.stroke();
    }
  }
  function drawPlane(){
    const rotate=planeRotation();
    const projected=mesh.map(s=>{
      const verts=s.points.map(rotate);
      return {s,pts:verts.map(project),depth:verts.reduce((a,p)=>a+p[2],0)/verts.length};
    }).sort((a,b)=>b.depth-a.depth);
    ctx.save();
    ctx.shadowColor='rgba(224,208,80,.36)';ctx.shadowBlur=13;
    for(const poly of projected){
      const {s,pts}=poly;
      path(pts);ctx.fillStyle=s.fill;ctx.fill();ctx.strokeStyle=s.line;ctx.lineWidth=s.width;ctx.lineJoin='round';ctx.stroke();
    }
    ctx.shadowBlur=0;
    function line(a,b,col,width,dash=[]){ctx.beginPath();const pa=project(rotate(a)),pb=project(rotate(b));ctx.moveTo(pa[0],pa[1]);ctx.lineTo(pb[0],pb[1]);ctx.strokeStyle=col;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
    line([0,.2,2.43],[0,.12,-2.38],'rgba(255,235,142,.51)',1.15,[3,6]);
    line([-2.78,.018,-.15],[2.78,.018,-.15],'rgba(252,236,144,.36)',1.1);
    line([-.76,.74,-1.96],[-.12,.1,-2.12],'rgba(196,223,124,.55)',.9);
    line([.76,.74,-1.96],[.12,.1,-2.12],'rgba(255,229,119,.55)',.9);
    const center=project(rotate([0,.22,.82]));
    const shade=ctx.createRadialGradient(center[0],center[1],1,center[0],center[1],26);
    shade.addColorStop(0,'rgba(249,238,161,.25)');shade.addColorStop(1,'rgba(230,193,74,0)');
    ctx.fillStyle=shade;ctx.beginPath();ctx.arc(center[0],center[1],26,0,Math.PI*2);ctx.fill();
    // Pusher propeller at the tail with a light blur so the aircraft reads as a rear-prop airframe.
    const propHub=project(rotate([0,.09,-2.48]));
    const propSpan=Math.max(14,Math.min(state.w,state.h)*0.052);
    const propGlow=ctx.createRadialGradient(propHub[0],propHub[1],1,propHub[0],propHub[1],propSpan*1.35);
    propGlow.addColorStop(0,'rgba(246,228,126,.28)');propGlow.addColorStop(1,'rgba(246,228,126,0)');
    ctx.fillStyle=propGlow;ctx.beginPath();ctx.arc(propHub[0],propHub[1],propSpan*1.15,0,Math.PI*2);ctx.fill();
    const spin=(state.elapsed*(state.boosted?34:20))%(Math.PI*2);
    ctx.save();ctx.translate(propHub[0],propHub[1]);ctx.rotate(spin);ctx.strokeStyle=state.boosted?'rgba(255,235,136,.58)':'rgba(205,205,132,.34)';ctx.lineWidth=state.boosted?3.2:2.1;ctx.beginPath();ctx.moveTo(-propSpan,0);ctx.lineTo(propSpan,0);ctx.moveTo(0,-propSpan*.78);ctx.lineTo(0,propSpan*.78);ctx.stroke();ctx.restore();
    ctx.fillStyle='rgba(255,238,149,.82)';ctx.beginPath();ctx.arc(propHub[0],propHub[1],3.6,0,Math.PI*2);ctx.fill();
    // Simplified engine trail increases when left mouse button is held.
    const engine=project(rotate([0,.07,-2.58]));
    const far=project(rotate([0,.06,-3.9-state.speed*.006]));
    const len=state.boosted?1:0.25;
    const grad=ctx.createLinearGradient(engine[0],engine[1],far[0],far[1]);
    grad.addColorStop(0,state.boosted?'rgba(255,236,126,.75)':'rgba(198,207,93,.25)');
    grad.addColorStop(1,'rgba(228,189,70,0)');
    ctx.strokeStyle=grad;ctx.lineWidth=state.boosted?4:1;
    ctx.beginPath();ctx.moveTo(engine[0],engine[1]);ctx.lineTo(mix(engine[0],far[0],len),mix(engine[1],far[1],len));ctx.stroke();
    ctx.restore();
  }
  function spring(v,vel,target,omega,dt){
    // stable critically damped spring discretization
    const f=1+2*dt*omega;
    const oo=omega*omega;
    const hoo=dt*oo;
    const hhoo=dt*hoo;
    const det=1/(f+hhoo);
    return [(f*v+dt*vel+hhoo*target)*det,(vel+hoo*(target-v))*det];
  }
  function physics(dt){
    state.elapsed+=dt;
    if(!state.hovered){
      state.aimRoll=Math.sin(state.elapsed*.5)*2.2;
      state.aimPitch=Math.sin(state.elapsed*.4)*1.5;
      state.aimYaw=Math.sin(state.elapsed*.25)*2;
    }
    [state.roll,state.rollVel]=spring(state.roll,state.rollVel,state.aimRoll,3.9,dt);
    [state.pitch,state.pitchVel]=spring(state.pitch,state.pitchVel,state.aimPitch,3.5,dt);
    [state.yaw,state.yawVel]=spring(state.yaw,state.yawVel,state.aimYaw,2.5,dt);
    // A visually suggestive, not aerodynamically accurate flight model.
    const speedAim=state.boosted?307:148;
    state.speed=mix(state.speed,speedAim,1-Math.exp(-dt*(state.boosted?1.05:.26)));
    state.throttle=mix(state.throttle,state.boosted?100:40,1-Math.exp(-dt*(state.boosted?3.5:2.2)));
    const rate=9.81*Math.tan(bound(state.roll,-68,68)*deg)/(state.speed/3.6)*180/Math.PI;
    state.heading=(state.heading+rate*dt+360)%360;
  }
  function setUi(){
    ui.roll.textContent=digits(state.roll);
    ui.pitch.textContent=digits(state.pitch);
    ui.yaw.textContent=`${state.heading.toFixed(1).padStart(5,'0')}°`;
    ui.speed.textContent=Math.round(state.speed);
    ui.throttle.textContent=`${Math.round(state.throttle)}%`;
    ui.speedbar.style.height=`${bound((state.speed-90)/(310-90)*100,10,100)}%`;
    ui.status.textContent=window.AtlasI18n?.t(state.boosted?'BOOST ACTIVE':state.hovered?'FLIGHT CONTROL':'HOVER TO CONTROL') ?? (state.boosted?'BOOST ACTIVE':state.hovered?'FLIGHT CONTROL':'HOVER TO CONTROL');
  }
  function resize(){
    const rect=host.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)return;
    state.w=rect.width;state.h=rect.height;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
    canvas.style.width=`${rect.width}px`;canvas.style.height=`${rect.height}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  let frameQueued = false;
  function scheduleFrame(){
    if(frameQueued || !state.running || !state.inView || document.hidden)return;
    frameQueued=true;requestAnimationFrame(frame);
  }
  function frame(t){
    frameQueued=false;
    if(!state.running || !state.inView || document.hidden){state.last=0;return;}
    if(!state.last)state.last=t;
    // The visual demo is intentionally capped at ~30 FPS to reduce mobile CPU/GPU load.
    if(t-state.lastDraw<30){scheduleFrame();return;}
    const dt=bound((t-state.last)/1000,0,.035);state.last=t;state.lastDraw=t;
    physics(dt);
    ctx.clearRect(0,0,state.w,state.h);
    drawBackground();drawPlane();
    if(t-state.lastUi>95){setUi();state.lastUi=t;}
    scheduleFrame();
  }
  resize();
  if('ResizeObserver' in window){new ResizeObserver(resize).observe(host);}
  else window.addEventListener('resize',resize,{passive:true});
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{const visible=entries.some(e=>e.isIntersecting);
      if(state.inView!==visible){state.inView=visible;state.last=0;}
      if(visible)scheduleFrame();
    },{threshold:0.04}).observe(host);
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){state.last=0;scheduleFrame();}});
  scheduleFrame();
})();
