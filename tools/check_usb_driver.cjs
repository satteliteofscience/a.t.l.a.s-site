/* USB driver package for boards in DFU mode: the files are the unmodified, Microsoft-signed STMicroelectronics package (checksums pinned in three places),
 * the installer verifies hash and signature before it installs that one package and touches no certificate store or Windows setting,
 * and the configurator offers it in three languages. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const dir='drivers/stm32-dfu/';
const files=['STM32Bootloader.inf','STM32Bootloader.cat','amd64/WdfCoInstaller01009.dll','amd64/WinUSBCoInstaller2.dll'];
// 1. SHA256SUMS lists exactly these files and they match (a text-mode conversion of the INF or the catalog would break the signature)
const sums=Object.fromEntries(fs.readFileSync(dir+'SHA256SUMS.txt','utf8').trim().split(/\r?\n/).map(l=>{const m=l.match(/^([0-9a-f]{64})  (.+)$/);assert.ok(m,'sum line: '+l);return [m[2],m[1]];}));
assert.deepEqual(Object.keys(sums).sort(),[...files].sort());
for(const f of files)assert.equal(sha(dir+f),sums[f],'checksum of '+f+' (the committed bytes must equal the signed package)');
// 2. the INF: UTF-16 with a byte-order mark (git treats it as binary and leaves it alone), the STM32 DFU id, WinUSB and the ST licence header; the catalog is real
const inf=fs.readFileSync(dir+'STM32Bootloader.inf');assert.equal(inf[0],0xFF);assert.equal(inf[1],0xFE);
const infText=inf.toString('utf16le');
assert.match(infText,/DeviceID\s*=\s*"VID_0483&PID_DF11"/);assert.match(infText,/Include\s*=\s*winusb\.inf/);assert.match(infText,/Provider\s*=\s*"STMicroelectronics"/);assert.match(infText,/SLA0048/);assert.match(infText,/CatalogFile\s*=\s*STM32Bootloader\.cat/);
assert.ok(fs.statSync(dir+'STM32Bootloader.cat').size>5000);
// 3. the licence and the readme travel with the files
const lic=fs.readFileSync(dir+'LICENSE-ST-SLA0048.txt','utf8');assert.match(lic,/SLA0048 Rev3/);assert.match(lic,/Redistributions in binary form/);assert.match(lic,/solely and exclusively on or in combination with a microcontroller/);
const readme=fs.readFileSync(dir+'README.txt','utf8');assert.match(readme,/unmodified/i);assert.match(readme,/installs no certificate/i);assert.match(readme,/pnputil \/add-driver STM32Bootloader\.inf \/install/);
// 4. the installer: pinned hashes equal the files, HTTPS only (a dry run may use another source), checksum and signature before pnputil, nothing else is changed
const cmd=fs.readFileSync('tools/A.T.L.A.S.-USB-Drivers.cmd','utf8').replace(/\r\n/g,'\n');
const mark=cmd.lastIndexOf(':: ATLAS_POWERSHELL_START'),ps=cmd.slice(mark);
for(const f of files)assert.ok(ps.includes("'"+f+"'")&&ps.includes(sums[f]),'the installer pins '+f);
assert.match(ps,/\$siteBase = 'https:\/\/satteliteofscience\.github\.io\/a\.t\.l\.a\.s-site\/drivers\/stm32-dfu\/'/);
assert.match(ps,/Refusing a source that is not HTTPS/);assert.match(ps,/\$dryRun -and \$env:ATLAS_USB_BASE/);
assert.match(ps,/Checksum mismatch/);assert.match(ps,/Microsoft Windows Hardware Compatibility Publisher/);assert.match(ps,/Get-AuthenticodeSignature/);
assert.ok(ps.indexOf('Get-AuthenticodeSignature')<ps.indexOf('pnputil.exe'),'the signature is checked before the install');
assert.ok(ps.indexOf('Checksum mismatch')<ps.indexOf('pnputil.exe'),'the checksums are checked before the install');
assert.match(ps,/pnputil\.exe'\) \/add-driver/);assert.match(ps,/Win32_Processor[^\n]*\.Architecture/);assert.match(ps,/\$arch -ne 9/);
for(const bad of [/Import-Certificate/i,/certutil/i,/Cert:\\/i,/TrustedPublisher/i,/Set-ItemProperty/i,/New-ItemProperty/i,/reg(\.exe)?\s+add/i,/bcdedit/i,/Set-ExecutionPolicy/i,/Disable-|Enable-/,/Add-MpPreference|Set-MpPreference/i,/netsh/i,/schtasks/i,/Invoke-Expression|\biex\b/i])assert.ok(!bad.test(ps),'the installer must not use '+bad);
assert.ok(!/[^\x00-\x7F]/.test(cmd),'the installer is plain ASCII (any console code page)');
assert.match(cmd,/^@echo off\nsetlocal\n/);assert.ok(!/^\s*:[A-Za-z]/m.test(cmd.slice(0,mark)),'no batch labels before the PowerShell part (safe with LF line endings)');
// 5. the configurator: link, download attribute and the three languages
const html=fs.readFileSync('configurator.html','utf8'),ui=fs.readFileSync('js/configurator/dfu-ui.js','utf8');
assert.match(html,/<a class="cc-button ghost" id="dfuDriverLink" href="\.\/tools\/A\.T\.L\.A\.S\.-USB-Drivers\.cmd" download="A\.T\.L\.A\.S\.-USB-Drivers\.cmd" data-dfu-t="driverBtn">/);assert.match(html,/data-dfu-t="driver"/);
assert.equal((ui.match(/driver:'/g)||[]).length,3);assert.equal((ui.match(/driverBtn:'/g)||[]).length,3);
for(const w of ['Драйвер DFU для Windows: если','Скачать установщик драйвера','Драйвер DFU для Windows: якщо','Завантажити інсталятор драйвера','DFU driver for Windows:','Download the driver installer'])assert.ok(ui.includes(w),'text: '+w);
console.log('PASS: STM32 DFU driver package is the unmodified signed ST package (4 files, checksums pinned in three places), the installer checks hash and signature and changes nothing else, and the configurator offers it in RU/UK/EN.');
