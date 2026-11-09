#!/usr/bin/env node
/* A.T.L.A.S. LOCAL MAVLink bridge: WebSocket ↔ UDP/TCP.
 * Standard Node.js only. One authenticated loopback browser session; no internet server.
 * Run: node tools/mavlink-bridge.cjs
 * UI: https://satteliteofscience.github.io/a.t.l.a.s-site/configurator.html
 * WARNING: remote MAVLink is not encrypted/authenticated by UDP or TCP; use a trusted VPN.
 */
'use strict';
const http=require('node:http'),crypto=require('node:crypto'),dgram=require('node:dgram'),net=require('node:net');
const WS_HOST='127.0.0.1',WS_PORT=Number(process.env.ATLAS_BRIDGE_PORT||8765);
const TOKEN=process.env.ATLAS_BRIDGE_TOKEN||crypto.randomBytes(20).toString('hex');
const ORIGINS=new Set([
 'https://satteliteofscience.github.io',
 'http://127.0.0.1:8000','http://localhost:8000','http://127.0.0.1:8080','http://localhost:8080',
 ...(process.env.ATLAS_BRIDGE_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)
]);
if(!Number.isInteger(WS_PORT)||WS_PORT<1024||WS_PORT>65535)throw Error('Invalid ATLAS_BRIDGE_PORT');
let active=null;
function makeFrame(opcode,payload){
 const data=Buffer.isBuffer(payload)?payload:Buffer.from(payload);
 if(data.length>1024*1024)throw Error('Frame too large');
 const h=data.length<126?Buffer.from([0x80|opcode,data.length]):
  data.length<65536?Buffer.from([0x80|opcode,126,data.length>>8,data.length&255]):
  Buffer.from([0x80|opcode,127,0,0,0,0,(data.length>>>24)&255,(data.length>>>16)&255,(data.length>>>8)&255,data.length&255]);
 return Buffer.concat([h,data]);
}
function parseFrames(session,chunk){
 session.input=Buffer.concat([session.input,chunk]);
 if(session.input.length>1048576+100)throw Error('WS input too large');
 while(session.input.length>=2){
  const h=session.input[0],b=session.input[1],masked=(b&128)!==0,fragment=(h&0x70)!==0;
  const opcode=h&15;if(fragment||!masked)throw Error('Unsupported/unmasked browser frame');
  let length=b&127,offset=2;
  if(length===126){if(session.input.length<4)return;length=session.input.readUInt16BE(2);offset=4;}
  else if(length===127){if(session.input.length<10)return;const high=session.input.readUInt32BE(2);if(high!==0)throw Error('Frame too large');length=session.input.readUInt32BE(6);offset=10;}
  if(length>65536)throw Error('Frame too large');
  if(session.input.length<offset+4+length)return;
  const key=session.input.subarray(offset,offset+4);offset+=4;
  const data=Buffer.from(session.input.subarray(offset,offset+length));
  for(let i=0;i<data.length;i++)data[i]^=key[i%4];
  session.input=session.input.subarray(offset+length);
  if(opcode===8){session.close();return;}
  if(opcode===9){session.send(10,data);continue;}
  if(opcode===10)continue;
  if(opcode===1){let config;try{config=JSON.parse(data.toString('utf8'));}catch{session.send(1,JSON.stringify({type:'error',message:'Invalid configuration JSON'}));continue;}configure(session,config);continue;}
  if(opcode===2){if(session.ready&&session.transport&&data.length)session.sendRemote(data);continue;}
  throw Error('Unsupported opcode');
 }
}
function configure(s,c){
 if(s.ready||s.configuring){s.send(1,JSON.stringify({type:'error',message:'Already configured'}));return;}
 const mode=String(c.mode||''),host=String(c.host||''),port=Number(c.port);
 if(!['udp-listen','udp-target','tcp-client'].includes(mode)||!Number.isInteger(port)||port<1||port>65535||host.length>253||!/^[-.a-zA-Z0-9:]+$/.test(host)){
  s.send(1,JSON.stringify({type:'error',message:'Invalid UDP/TCP endpoint'}));return;
 }
 s.configuring=true;
 const fail=e=>{if(s.closed)return;s.send(1,JSON.stringify({type:'error',message:String(e.message||e).slice(0,300)}));s.close();};
 if(mode==='tcp-client'){
  const socket=net.createConnection({host,port});
  s.transport=socket;
  socket.setTimeout(15000,()=>socket.destroy(Error('TCP connection timed out')));
  socket.once('connect',()=>{
   socket.setTimeout(0);
   s.ready=true;s.configuring=false;s.sendRemote=data=>socket.write(data);
   s.send(1,JSON.stringify({type:'ready',mode,host,port}));
  });
  socket.on('data',data=>s.send(2,data));
  socket.on('error',fail);socket.on('close',()=>s.close());
 }else{
  const udp=dgram.createSocket('udp4');s.transport=udp;
  let peer=null;
  udp.on('message',(data,rinfo)=>{
   if(mode==='udp-target'&&host.match(/^\d+\.\d+\.\d+\.\d+$/)&&rinfo.address!==host)return;
   peer={address:rinfo.address,port:rinfo.port};s.send(2,data);
  });
  udp.on('error',fail);
  udp.once('listening',()=>{
   s.ready=true;s.configuring=false;
   s.sendRemote=data=>{
    const destination=mode==='udp-listen'?peer:{address:host,port};
    if(destination)udp.send(data,destination.port,destination.address,err=>{if(err)fail(err);});
   };
   s.send(1,JSON.stringify({type:'ready',mode,host,port}));
  });
  try{udp.bind(mode==='udp-listen'?port:0,mode==='udp-listen'?host:'127.0.0.1');}
  catch(e){fail(e);}
 }
}
function serve(req,res){
 res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'null'});
 res.end('A.T.L.A.S. local MAVLink bridge. Use the authenticated WebSocket connection from the official configurator.\n');
}
const server=http.createServer(serve);
server.on('upgrade',(req,socket,head)=>{
 let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{socket.destroy();return;}
 const origin=req.headers.origin||'';
 if(active||!ORIGINS.has(origin)||url.pathname!=='/mavlink'||url.searchParams.get('token')!==TOKEN||req.headers.upgrade?.toLowerCase()!=='websocket'||!/^[-A-Za-z0-9+/]{22}==$/.test(String(req.headers['sec-websocket-key']||''))){
  socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');socket.destroy();return;
 }
 const accept=crypto.createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
 socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
 const session={socket,closed:false,ready:false,configuring:false,input:Buffer.alloc(0),transport:null,
  send(op,data){if(!this.closed&&socket.writable)socket.write(makeFrame(op,data));},
  sendRemote(){},
  close(){if(this.closed)return;this.closed=true;const t=this.transport;this.transport=null;if(t){if(typeof t.destroy==='function')t.destroy();else t.close();}socket.destroy();if(active===this)active=null;}
 };
 active=session;
 socket.on('data',data=>{try{parseFrames(session,data);}catch(e){console.error('[bridge]',e.message);session.close();}});
 socket.on('error',()=>session.close());socket.on('close',()=>session.close());
 if(head.length)try{parseFrames(session,head);}catch{session.close();}
});
server.listen(WS_PORT,WS_HOST,()=>{
 console.log('A.T.L.A.S. MAVLink bridge listening on ws://'+WS_HOST+':'+WS_PORT+'/mavlink');
 console.log('Bridge session token: '+TOKEN);
 console.log('UDP listen default: 0.0.0.0:14550; TCP client default: 127.0.0.1:5760');
 console.log('Only one authorized localhost browser client is allowed. Keep token private.');
});
