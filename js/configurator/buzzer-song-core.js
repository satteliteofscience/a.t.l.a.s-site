/* Custom startup melody (BUZ_CSTM_SONG*): MML text <-> integer parameters, the write plan, and a reference interpreter of the controller's MML player.
 * No MAVLink and no aircraft outputs here; the card (buzzer-song-ui.js) and AtlasCC.writeBuzzerSong use it.
 *
 * ArduPilot parameters are numbers, so the text is kept in 48 INT32 parameters, three ASCII characters each:
 *   value = char0 + char1*256 + char2*65536   (at most 16777215, which a MAVLink float carries exactly)
 * BUZ_CSTM_SONG holds characters 1-3, BUZ_CSTM_SONG2 characters 4-6, ... BUZ_CSTM_SONG48 characters 142-144.
 * The text ends at the first zero byte. BUZ_CSTM_SONG = 0 means "no custom melody": the standard startup melody is played.
 * The interpreter follows libraries/AP_Notify/MMLPlayer.cpp; its note and rest sequence was compared with what the SITL build of the controller plays. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasBuzzerSong=api;})(globalThis,()=>{
 'use strict';
 const CHUNKS=48,PER=3,MAX=CHUNKS*PER,TOP=0xFFFFFF;
 const name=n=>n===1?'BUZ_CSTM_SONG':'BUZ_CSTM_SONG'+n;
 const NAMES=Object.freeze(Array.from({length:CHUNKS},(_,i)=>name(i+1)));
 const NAME_RE=/^BUZ_CSTM_SONG(?:[2-9]|[1-3]\d|4[0-8])?$/;
 /** The melody the controller plays when BUZ_CSTM_SONG is 0 (AP_NOTIFY_TONE_STARTUP of the firmware). */
 const STANDARD='T130O4L16F+AL8>C+L16<BABL8AL32P3L16F+AL8>C+L16<BABL8ABABL8>C+L16<AF+L8F+';
 /** An example melody (104 characters, 35 parameters). */
 const EXAMPLE='MFT200L4O6CD#8G.P8F#D#8C.P8CD#8GG#8GF#D#8C.P4FG#8O7C.P4O6A#G#8F.P4CD#8G.P8F#D#8CP8G#8G2P8F#8F#D#8FD#8C2.';
 const printable=code=>code>=0x20&&code<=0x7e;
 /** Parameter names and values the writer accepts: the 48 melody parameters, integers 0..16777215. */
 const valid=(n,value)=>NAME_RE.test(String(n))&&Number.isInteger(value)&&value>=0&&value<=TOP;
 const indexOf=n=>n==='BUZ_CSTM_SONG'?1:Number(String(n).slice(13));

 /** The melody parameters exist on the board (firmware with BUZ_CSTM_SONG): the first and the last one are enough. */
 const supported=params=>!!params&&params.has(NAMES[0])&&params.has(NAMES[CHUNKS-1]);
 const chunkValue=(params,n)=>{const p=params.get(name(n));return p&&Number.isFinite(p.value)?Math.trunc(p.value):0;};

 /** Text -> parameter values (three characters each). Throws for text the firmware could not play back unchanged. */
 function pack(text){
  const s=String(text??'');
  if(s.length>MAX)throw Error(`The melody has ${s.length} characters, at most ${MAX} fit`);
  for(let i=0;i<s.length;i++)if(!printable(s.charCodeAt(i)))throw Error(`Character ${i+1} is not printable ASCII`);
  const values=[];
  for(let i=0;i<s.length;i+=PER){let v=0;for(let k=0;k<PER&&i+k<s.length;k++)v+=s.charCodeAt(i+k)*256**k;values.push(v);}
  return values;
 }
 /** What the firmware reads from chunk values (index 0 = BUZ_CSTM_SONG): empty when BUZ_CSTM_SONG is 0 or holds no printable character first. */
 function unpack(values){
  if(!values.length||values[0]===0)return '';
  let text='';
  for(const raw of values.slice(0,CHUNKS)){
   const v=Math.trunc(raw)&TOP;
   for(let k=0;k<PER;k++){const c=(v>>(8*k))&0xff;if(c===0||!printable(c))return text;text+=String.fromCharCode(c);}
  }
  return text;
 }
 /** The melody stored on the board: 'unsupported' | 'standard' (BUZ_CSTM_SONG = 0, or nothing playable) | 'custom'. */
 function board(params){
  if(!supported(params))return {state:'unsupported',text:'',length:0};
  const text=unpack(Array.from({length:CHUNKS},(_,i)=>chunkValue(params,i+1)));
  return {state:text.length?'custom':'standard',text,length:text.length};
 }
 /**
  * The writes that put `text` on the board, in a safe order: [[name, value], ...], only what differs.
  * A melody that is active is switched off first (BUZ_CSTM_SONG = 0) and BUZ_CSTM_SONG is written last, so an interrupted write
  * leaves the standard melody instead of a half-new, half-old one. An empty text only switches the custom melody off.
  */
 function plan(text,params){
  const values=pack(text),current=n=>chunkValue(params,n);
  if(!values.length)return current(1)!==0?[[name(1),0]]:[];
  const others=[];
  for(let i=1;i<values.length;i++)if(current(i+1)!==values[i])others.push([name(i+1),values[i]]);
  // a text that fills its last parameter completely needs a zero parameter after it
  if(values.length<CHUNKS&&text.length%PER===0&&current(values.length+1)!==0)others.push([name(values.length+1),0]);
  if(!others.length&&current(1)===values[0])return [];
  const updates=[];
  if(current(1)!==0)updates.push([name(1),0]);
  updates.push(...others,[name(1),values[0]]);
  return updates;
 }

 const upper=c=>c>='a'&&c<='z'?String.fromCharCode(c.charCodeAt(0)-32):c;
 /**
  * The note and rest sequence of the controller's MML player: events [{kind:'note',hz,ms}|{kind:'rest',ms}], the point where it stops
  * early (stop = {index (0-based), char, reason}), warnings about things the player quietly changes, and whether the text asks for repetition.
  */
 function run(text){
  const s=String(text??''),st={nxt:0,tempo:120,dlen:4,mode:'N',octave:4,silence:0,repeat:false};
  const events=[],warnings=[];let stop=null;
  const peek=()=>{while(st.nxt<s.length&&/\s/.test(s[st.nxt]))st.nxt++;return st.nxt<s.length?upper(s[st.nxt]):'\0';};
  // the player reads numbers into 8 bits: 256 and more wrap around (T280 becomes T24, which stops the melody)
  const number=()=>{peek();const start=st.nxt;let n=0,raw=0;while(/[0-9]/.test(peek())){raw=raw*10+Number(peek());n=(n*10+Number(peek()))&0xff;st.nxt++;}if(raw>255)warnings.push({kind:'wrap',index:start});return n;};
  const dots=()=>{let n=0;while(peek()==='.'){n++;st.nxt++;}return n;};
  const rest=(length,d)=>{const whole=240/st.tempo;let period=whole/(length||1),ext=period*.5;for(let i=0;i<d;i++){period+=ext;ext*=.5;}return period;};
  const halt=(index,reason)=>{stop={index,char:s[index]??'',reason};return false;};
  function action(){
   if(st.silence>0){const ms=st.silence*1000;st.silence=0;events.push({kind:'rest',ms});return true;}
   let note=0,length=0;
   while(note===0){
    const c=peek();
    if(c==='\0'){if(st.repeat)warnings.push({kind:'repeat',index:s.length});return false;}
    const at=st.nxt;st.nxt++;
    if(c==='V'){number();}
    else if(c==='L'){st.dlen=number();if(st.dlen===0)return halt(at,'length');}
    else if(c==='O'){const o=number();if(o>6)warnings.push({kind:'octave',index:at});st.octave=Math.min(o,6);}
    else if(c==='<'){if(st.octave>0)st.octave--;}
    else if(c==='>'){if(st.octave<6)st.octave++;}
    else if(c==='M'){
     const m=peek();if(m==='\0')return halt(at,'mode');st.nxt++;
     if(m==='N'||m==='L'||m==='S')st.mode=m;else if(m==='F')st.repeat=false;else if(m==='B')st.repeat=true;else return halt(at,'mode');
    }
    else if(c==='R'||c==='P'){const n=number(),d=dots();events.push({kind:'rest',ms:rest(n,d)*1000});return true;}
    else if(c==='T'){st.tempo=number();if(st.tempo<32)return halt(at,'tempo');}
    else if(c==='N'){
     note=number();length=st.dlen;
     if(note>84)return halt(at,'number');
     if(note===0){const n=number(),d=dots();events.push({kind:'rest',ms:rest(n,d)*1000});return true;}
    }
    else if('ABCDEFG'.includes(c)){
     note=[9,11,0,2,4,5,7][c.charCodeAt(0)-65]+st.octave*12+1;
     const a=peek();
     if(a==='#'||a==='+'){if(note<84)note++;st.nxt++;}else if(a==='-'){if(note>1)note--;st.nxt++;}
     length=number();if(length===0)length=st.dlen;
    }
    else return halt(at,'unknown');
   }
   if(st.tempo===0||length===0)return halt(Math.max(0,st.nxt-1),'tempo');
   let period=240/st.tempo/length;
   st.silence=st.mode==='N'?period/8:st.mode==='S'?period/4:0;
   period-=st.silence;
   let ext=period*.5;for(let n=dots();n>0;n--){period+=ext;ext*=.5;}
   const hz=Math.min(22000,Math.max(10,880*Math.exp(Math.log(2)*(note-46)/12)));
   events.push({kind:'note',hz,ms:period*1000});return true;
  }
  for(let guard=0;guard<4000&&action();guard++);
  return {events,stop,warnings,repeats:st.repeat&&!stop};
 }
 /** Summary for the card: length, first character the controller would refuse, duration of one pass, early stop, warnings. */
 function describe(text){
  const s=String(text??''),bad=[...s].findIndex(ch=>!printable(ch.charCodeAt(0)));
  const r=run(s);
  return {length:s.length,tooLong:s.length>MAX,invalid:bad,notes:r.events.filter(e=>e.kind==='note').length,durationMs:r.events.reduce((a,e)=>a+e.ms,0),stop:r.stop,warnings:r.warnings,repeats:r.repeats,events:r.events};
 }
 /**
  * What the card shows and allows. `link` = {ready, canWrite} from the configurator, `busy` while a write runs.
  * can.write needs a different melody than the one on the board; can.reset needs a custom melody on the board.
  */
 function model({params,text,link={},busy=false}){
  const b=board(params||new Map()),ready=!!link.ready&&!!params&&params.size>0;
  const state=!ready?'noparams':b.state;
  const d=describe(text),textOk=!d.tooLong&&d.invalid<0;
  let changes=[];if(state==='standard'||state==='custom'){try{changes=textOk?plan(text,params):[];}catch{changes=[];}}
  const writable=state==='standard'||state==='custom'?!!link.canWrite&&!busy:false;
  return {state,board:b,check:d,textOk,changes,can:{
   preview:d.events.length>0&&!d.tooLong&&d.invalid<0,
   read:(state==='standard'||state==='custom')&&!busy,
   write:writable&&textOk&&String(text??'').length>0&&changes.length>0,
   reset:writable&&state==='custom'}};
 }
 return Object.freeze({CHUNKS,PER,MAX,TOP,NAMES,NAME_RE,STANDARD,EXAMPLE,name,indexOf,valid,supported,pack,unpack,board,plan,run,describe,model});
});
