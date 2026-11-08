/* A.T.L.A.S. STM32 ROM DFU / DfuSe transport — experimental pre-release.
 * Based on STM32 AN3156. Full-chip erase is destructive. Hardware validation required.
 * No requests are made until the user explicitly starts a flashing transaction.
 */
(() => {
  'use strict';
  const FLASH_BASE=0x08000000, FLASH_END=0x08200000, WORD=32;
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const hexAddress=n=>'0x'+n.toString(16).toUpperCase().padStart(8,'0');

  function parseIntelHex(text) {
    if(typeof text!=='string'||text.length>16*1024*1024)throw Error('Invalid/oversized Intel HEX');
    let base=0, first=null, next=null, eof=false, total=0, lines=0;
    const image=new Uint8Array(FLASH_END-FLASH_BASE);image.fill(0xff);
    for(const original of text.split(/\r?\n/)) {
      const line=original.trim();if(!line)continue;lines++;
      if(eof)throw Error(`Data found after EOF (line ${lines})`);
      if(!/^:[\dA-Fa-f]+$/.test(line)||line.length<11||(line.length%2)!==1)throw Error(`Invalid HEX syntax at line ${lines}`);
      const raw=new Uint8Array((line.length-1)/2);
      for(let i=0;i<raw.length;i++)raw[i]=parseInt(line.slice(1+i*2,3+i*2),16);
      const n=raw[0],type=raw[3],off=(raw[1]<<8)|raw[2];
      if(raw.length!==n+5||raw.reduce((sum,b)=>(sum+b)&255,0)!==0)throw Error(`Intel HEX checksum/length failed at line ${lines}`);
      if(type===0) {
        if(!n)continue;
        const pos=base+off;
        if(first===null)first=pos;
        if(next!==null&&pos!==next)throw Error(`Discontinuous/overlapping flash image at line ${lines}: ${hexAddress(pos)}`);
        if(pos<FLASH_BASE||pos+n>FLASH_END)throw Error(`Image outside STM32H743 2 MiB internal flash: ${hexAddress(pos)}`);
        image.set(raw.subarray(4,4+n),pos-FLASH_BASE);next=pos+n;total+=n;
      } else if(type===4&&n===2&&off===0) {
        base=((raw[4]<<8)|raw[5])*65536;
      } else if(type===1&&n===0&&off===0) {
        eof=true;
      } else if(type===5&&n===4) {
        // Optional start linear address, unused because boot mode is controlled manually.
      } else throw Error(`Unsupported HEX record type ${type} at line ${lines}`);
    }
    if(!eof)throw Error('Intel HEX is missing EOF record');
    if(first!==FLASH_BASE||!next||total<65536)throw Error('Expected a full contiguous image starting at 0x08000000 (bootloader included)');
    const length=Math.ceil((next-FLASH_BASE)/WORD)*WORD;
    return {bytes:image.slice(0,length),dataBytes:total,flashStart:first,flashEndExclusive:next,paddedBytes:length,lines};
  }

  function supportsH743FlashMap(name) {
    if(typeof name!=='string'||!/@Internal Flash/i.test(name)||!/0x08000000/i.test(name))return false;
    const parts=[...name.matchAll(/(\d+)\s*\*\s*(\d+)\s*K[g\w]?/gi)];
    return parts.length>0&&parts.reduce((sum,m)=>sum+Number(m[1])*Number(m[2]),0)===2048&&parts.every(m=>Number(m[2])===128);
  }

  class STM32DfuDevice {
    constructor(device, callback=()=>{}) {
      this.device=device;this.onProgress=callback;this.interfaceNumber=null;this.altSetting=null;this.interfaceName='';this.flashMapVerified=false;this.opened=false;this.transferSize=null;
    }
    progress(stage,completed,total,message) {this.onProgress({stage,completed,total,message});}
    req(request,value=0) {return {requestType:'class',recipient:'interface',request,value,index:this.interfaceNumber};}
    async out(request,value,data=new Uint8Array()) {
      const r=await this.device.controlTransferOut(this.req(request,value),data);
      if(r.status!=='ok'||(r.bytesWritten!==undefined&&r.bytesWritten!==data.length))throw Error(`DFU OUT ${request}: ${r.status||'partial transfer'}`);
    }
    async input(request,value,length) {
      const r=await this.device.controlTransferIn(this.req(request,value),length);
      if(r.status!=='ok'||!r.data)throw Error(`DFU IN ${request}: ${r.status}`);
      return new Uint8Array(r.data.buffer,r.data.byteOffset,r.data.byteLength);
    }
    async getStatus() {
      const s=await this.input(3,0,6);
      if(s.length!==6)throw Error('Malformed DFU_GETSTATUS response');
      return {status:s[0],poll:s[1]|(s[2]<<8)|(s[3]<<16),state:s[4],iString:s[5]};
    }
    async ready(maxMs=10000) {
      const until=Date.now()+maxMs;
      for(;;) {
        const status=await this.getStatus();
        if(status.status!==0||status.state===10)throw Error(`DFU error: status=${status.status}, state=${status.state}`);
        if(status.state===2||status.state===5)return status;
        if(status.state!==4&&status.state!==3)throw Error(`Unexpected DFU state ${status.state}`);
        if(Date.now()>until)throw Error(`DFU operation timed out after ${maxMs} ms`);
        await delay(Math.min(2000,Math.max(10,status.poll||10)));
      }
    }
    async idle() {
      let s=await this.getStatus();
      if(s.state===10||s.status!==0){await this.out(4);s=await this.getStatus();}
      if(s.state===4||s.state===3){await this.ready(120000);s=await this.getStatus();}
      if(s.state===5||s.state===9){await this.out(6);s=await this.getStatus();}
      if(s.state!==2||s.status!==0)throw Error(`Cannot enter DFU idle state (${s.state}/${s.status})`);
    }
    // A single DFU functional descriptor belongs to a DFU INTERFACE, not
    // necessarily to its alt=0 setting. The STM32 ROM can put it after the
    // LAST alternate descriptor. Parsing only the selected alt silently
    // misses a valid wTransferSize on some devices.
    async getUsbDescriptor(type, descriptorIndex, lang, length, recipient='device') {
      const r=await this.device.controlTransferIn({
        requestType:'standard',recipient,request:6,
        value:(type<<8)|descriptorIndex,index:lang
      },length);
      if(r.status!=='ok'||!r.data)throw Error(`USB descriptor ${type}/${descriptorIndex} not accessible (${r.status})`);
      return new Uint8Array(r.data.buffer,r.data.byteOffset,r.data.byteLength);
    }
    async readConfigurationTree() {
      const header=await this.getUsbDescriptor(2,0,0,9);
      if(header.length<9||header[0]!==9||header[1]!==2)throw Error('Malformed configuration descriptor header');
      const size=header[2]|(header[3]<<8);
      if(size<18||size>4096)throw Error(`Unexpected configuration descriptor size ${size}`);
      const raw=await this.getUsbDescriptor(2,0,0,size);
      if(raw.length<size)throw Error(`Truncated configuration descriptor (${raw.length}/${size})`);
      return raw;
    }
    static parseDfuDescriptors(raw,interfaceNumber) {
      let current=null,transferSize=null;
      const strings=[];
      for(let pos=0;pos+2<=raw.length;){
        const len=raw[pos],type=raw[pos+1];
        if(len<2||pos+len>raw.length)throw Error('Malformed configuration descriptor element');
        if(type===4&&len>=9){
          current={number:raw[pos+2],alt:raw[pos+3],classCode:raw[pos+5],subclass:raw[pos+6]};
          if(current.number===interfaceNumber&&current.classCode===0xfe&&current.subclass===1&&raw[pos+8]){
            strings.push({alt:current.alt,index:raw[pos+8]});
          }
        } else if(type===0x21&&len>=9&&current?.number===interfaceNumber&&current.classCode===0xfe&&current.subclass===1){
          const found=raw[pos+5]|(raw[pos+6]<<8);
          if(transferSize!==null&&found!==transferSize)throw Error('Conflicting DFU functional descriptors');
          transferSize=found;
        }
        pos+=len;
      }
      return {transferSize,strings};
    }
    async readUsbString(index) {
      if(!index)return '';
      let languages=[0x0409];
      try {
        const lang=await this.getUsbDescriptor(3,0,0,255);
        if(lang.length>=4&&lang[1]===3){
          for(let i=2;i+1<lang.length&&i<lang[0];i+=2){
            const id=lang[i]|lang[i+1]<<8;
            if(!languages.includes(id))languages.push(id);
          }
        }
      } catch(_) { /* Windows may hide the language list, try English */ }
      for(const lang of languages){
        try{
          const bytes=await this.getUsbDescriptor(3,index,lang,255);
          if(bytes.length<4||bytes[1]!==3||bytes[0]>bytes.length||bytes[0]%2!==0)continue;
          const name=new TextDecoder('utf-16le').decode(bytes.subarray(2,bytes[0]));
          if(name.trim())return name;
        }catch(_) { /* try the next language */ }
      }
      return '';
    }
    async discoverTransferSize() {
      const errors=[];
      let parsed=null;
      try{
        parsed=STM32DfuDevice.parseDfuDescriptors(await this.readConfigurationTree(),this.interfaceNumber);
      }catch(err){errors.push(`configuration: ${err.message}`);}
      if(parsed){
        if(parsed.transferSize!==null){
          const n=parsed.transferSize;
          if(n<32||n>4096||n%32!==0)throw Error(`Unsupported DFU wTransferSize ${n}`);
          this.transferSize=n;
        }
        if(!supportsH743FlashMap(this.interfaceName)){
          const selected=parsed.strings.find(s=>s.alt===this.altSetting);
          const others=parsed.strings.filter(s=>s.alt!==this.altSetting);
          for(const entry of [selected,...others].filter(Boolean)){
            const name=await this.readUsbString(entry.index);
            if(supportsH743FlashMap(name)){
              if(entry.alt!==this.altSetting)throw Error('Flash map belongs to another USB DFU alternate setting; reopen with that target');
              this.interfaceName=name;this.flashMapVerified=true;break;
            }
          }
        }
      }
      if(!this.transferSize){
        // Some host stacks expose class descriptor separately from the USB
        // configuration tree. This fallback never invents a transfer size.
        try{
          const d=await this.getUsbDescriptor(0x21,0,this.interfaceNumber,9,'interface');
          if(d.length<9||d[1]!==0x21)throw Error('Invalid functional descriptor');
          const n=d[5]|(d[6]<<8);
          if(n<32||n>4096||n%32!==0)throw Error(`Unsupported DFU wTransferSize ${n}`);
          this.transferSize=n;
        }catch(err){errors.push(`functional: ${err.message}`);}
      }
      if(!this.transferSize)throw Error(`DFU functional descriptor missing; ${errors.join('; ')||'not present in configuration'}`);
      if(!this.flashMapVerified)this.progress('warning',0,1,'wTransferSize detected, but the @Internal Flash map string is not accessible; write protection remains enabled.');
      else this.progress('descriptor',1,1,`Verified DFU map ${this.interfaceName}; transfer ${this.transferSize}`);
    }
    async open() {
      if(this.opened)return;
      const usb=this.device;
      if(usb.vendorId!==0x0483||usb.productId!==0xdf11)throw Error('Not an STM32 ROM DFU USB device (0483:DF11 required)');
      await usb.open();
      try {
        if(!usb.configuration)await usb.selectConfiguration(1);
        const options=[];
        for(const iface of usb.configuration.interfaces)for(const alt of iface.alternates){
          if(alt.interfaceClass===0xfe&&alt.interfaceSubclass===1)options.push({iface,alt});
        }
        const flash=options.find(o=>/@Internal Flash/i.test(o.alt.interfaceName||''));
        const selected=flash||options.find(o=>o.alt.alternateSetting===0);
        if(!selected)throw Error('No USB DFU interface found');
        this.interfaceNumber=selected.iface.interfaceNumber;
        this.altSetting=selected.alt.alternateSetting;
        this.interfaceName=selected.alt.interfaceName||'@Unknown DFU memory target';
        this.flashMapVerified=supportsH743FlashMap(this.interfaceName);
        await usb.claimInterface(this.interfaceNumber);
        await usb.selectAlternateInterface(this.interfaceNumber,this.altSetting);
        try{await this.discoverTransferSize();}catch(e){this.progress('warning',0,1,`Read-only DFU detection: ${e.message}`);}
        await this.idle();
        this.opened=true;
        this.progress('connected',0,1,`0483:DF11 · alt ${this.altSetting} · transfer ${this.transferSize??'UNKNOWN'} · ${this.interfaceName}`);
      } catch(error) {try{await usb.close();}catch{}throw error;}
    }
    async close() {this.opened=false;if(this.device.opened)await this.device.close();}
    async command(bytes,maxMs=120000) {
      await this.idle();
      await this.out(1,0,bytes);
      await this.ready(maxMs);
    }
    async setAddress(addr) {
      if(addr<FLASH_BASE||addr>=FLASH_END||addr%WORD!==0)throw Error(`Unsafe DFU pointer ${hexAddress(addr)}`);
      const b=new Uint8Array(5);b[0]=0x21;new DataView(b.buffer).setUint32(1,addr,true);
      await this.command(b,30000);
    }
    async readAt(address,length) {
      if(length<1||length>FLASH_END-address||address<FLASH_BASE)throw Error('Read range outside internal flash');
      await this.setAddress(address);
      await this.idle();
      const result=new Uint8Array(length);
      for(let offset=0;offset<length;offset+=this.transferSize){
        const chunk=await this.input(2,2+offset/this.transferSize,Math.min(this.transferSize,length-offset));
        if(chunk.length!==Math.min(this.transferSize,length-offset))throw Error(`Short DFU_UPLOAD at ${hexAddress(address+offset)}`);
        result.set(chunk,offset);
      }
      return result;
    }
    async massErase() {
      if(!this.flashMapVerified)throw Error('H743 flash memory map not confirmed by DFU descriptor');
      this.progress('erase',0,1,'Mass erase: 0x41 (full 2 MiB flash → FF)');
      await this.command(Uint8Array.of(0x41),120000);
      this.progress('erase',1,1,'Mass erase finished');
    }
    async checkBlank() {
      // Test physically separated sectors across both banks after mass erase.
      const spots=[FLASH_BASE,0x080E0000,0x08100000,0x081E0000];
      for(let i=0;i<spots.length;i++){
        const a=spots[i],read=await this.readAt(a,this.transferSize);
        if(read.some(b=>b!==0xff))throw Error(`Erase check failed: ${hexAddress(a)} not all FF`);
        this.progress('blank',i+1,spots.length,`Blank flash ${hexAddress(a)} OK`);
      }
    }
    async write(image) {
      if(image.flashStart!==FLASH_BASE||image.flashEndExclusive>FLASH_END||image.bytes.length%WORD!==0)throw Error('Firmware image range/alignment invalid');
      await this.setAddress(FLASH_BASE);
      const bytes=image.bytes;
      for(let offset=0;offset<bytes.length;offset+=this.transferSize){
        const chunk=bytes.subarray(offset,Math.min(offset+this.transferSize,bytes.length));
        await this.out(1,2+offset/this.transferSize,chunk);
        await this.ready(30000);
        if(offset===0||(Math.floor(offset/this.transferSize)%24)===0||offset+this.transferSize>=bytes.length)this.progress('write',Math.min(offset+chunk.length,bytes.length),bytes.length,`Writing ${hexAddress(FLASH_BASE+offset)}`);
      }
    }
    async verify(image) {
      await this.setAddress(FLASH_BASE);
      await this.idle();
      const bytes=image.bytes;
      for(let offset=0;offset<bytes.length;offset+=this.transferSize){
        const len=Math.min(this.transferSize,bytes.length-offset);
        const received=await this.input(2,2+offset/this.transferSize,len);
        if(received.length!==len)throw Error(`Short verify read at ${hexAddress(FLASH_BASE+offset)}`);
        for(let i=0;i<len;i++)if(received[i]!==bytes[offset+i])throw Error(`VERIFY FAILED at ${hexAddress(FLASH_BASE+offset+i)}: expected ${bytes[offset+i].toString(16)}, got ${received[i].toString(16)}`);
        if(offset===0||(Math.floor(offset/this.transferSize)%24)===0||offset+this.transferSize>=bytes.length)this.progress('verify',offset+len,bytes.length,`Verified ${hexAddress(FLASH_BASE+offset)}`);
      }
      this.progress('done',1,1,'Byte-by-byte flash readback: PASS');
    }
    async flash(image) {
      if(!this.opened||!this.flashMapVerified||!this.transferSize)throw Error('Need 2MiB H743 flash map AND DFU transfer size before flashing');
      await this.massErase();
      await this.checkBlank();
      await this.write(image);
      await this.verify(image);
      // Do not automatically jump or reset the target: remain in ROM DFU for recovery.
    }
  }
  window.AtlasDFU={STM32DfuDevice,parseIntelHex,supportsH743FlashMap,FLASH_BASE,FLASH_END};
})();
