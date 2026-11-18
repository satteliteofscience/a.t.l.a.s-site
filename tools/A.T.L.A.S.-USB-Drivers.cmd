@echo off
setlocal
title A.T.L.A.S. USB drivers (STM32 DFU)
set "ATLAS_SELF=%~f0"
set "ATLAS_USB_ARG=%~1"
powershell.exe -NoLogo -NoProfile -Command "$ErrorActionPreference = 'Stop'; $source = [System.IO.File]::ReadAllText($env:ATLAS_SELF, [System.Text.Encoding]::UTF8); $marker = ':: ATLAS_POWERSHELL_START'; $index = $source.LastIndexOf($marker, [StringComparison]::Ordinal); if ($index -lt 0) { throw 'Installer source marker missing' }; & ([ScriptBlock]::Create($source.Substring($index + $marker.Length)))"
set "ATLAS_EXIT=%errorlevel%"
echo.
if not defined ATLAS_NOPAUSE pause
exit /b %ATLAS_EXIT%
:: ATLAS_POWERSHELL_START
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# A.T.L.A.S. USB drivers.
#  1  installs ONE driver package: the signed STMicroelectronics "STM32 Bootloader" (WinUSB) driver for a board in DFU mode;
#  2  checks, read-only, how Windows sees the flight controller (COM port, DFU driver, paging file).
# It installs no certificate and changes no Windows setting. Boards in normal mode need no driver: Windows 10 and 11 ship the USB serial driver.
# The package is hosted next to the site (drivers/stm32-dfu/); every file is checked against the SHA-256 below and the catalog signature
# must be valid and issued to "Microsoft Windows Hardware Compatibility Publisher" before anything is installed.
$siteBase = 'https://satteliteofscience.github.io/a.t.l.a.s-site/drivers/stm32-dfu/'
$packageHashes = [ordered]@{
  'STM32Bootloader.inf'           = 'e57fac78c1caee0d3a671410d083047fbbaa1f92b41a794a734f33c78ef377ce'
  'STM32Bootloader.cat'           = '2f597c783b5e169acb426f13da0107a020ab1e2084fd63e94c953e30c3aade38'
  'amd64/WdfCoInstaller01009.dll' = '56af50768ee1095db0fec866a8e545d13e2e43ef108f0a4dbd12aff1de962f11'
  'amd64/WinUSBCoInstaller2.dll'  = '6a3cdfd1c28a5e7c242b6824ed6f4281519079c632453734c4ac03d387048f3f'
}
# ATLAS_USB_DRYRUN=1 downloads and verifies but never starts pnputil; only then may ATLAS_USB_BASE point somewhere else (tests).
$dryRun = ($env:ATLAS_USB_DRYRUN -eq '1')
$base = $siteBase
if ($dryRun -and $env:ATLAS_USB_BASE) { $base = $env:ATLAS_USB_BASE.TrimEnd('/') + '/' }

function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  return ([Security.Principal.WindowsPrincipal]$id).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Invoke-Check {
  Write-Host ''
  $os = Get-CimInstance Win32_OperatingSystem
  Write-Host ('Windows: ' + $os.Caption + ', build ' + $os.BuildNumber)
  $pageFiles = @(Get-CimInstance Win32_PageFileUsage -ErrorAction SilentlyContinue)
  if ($pageFiles.Count -eq 0) {
    Write-Host 'WARNING: the paging file is off. When memory runs short, Windows can fail to give a new USB device its COM port (setup error 1455).'
    Write-Host '         Turn on "Automatically manage paging file size": System Properties > Advanced > Performance > Advanced > Virtual memory.'
  } else {
    Write-Host ('Paging file: ' + (($pageFiles | ForEach-Object { $_.Name + ' ' + $_.AllocatedBaseSize + ' MB' }) -join '; '))
  }
  $dfuInf = $null
  foreach ($f in Get-ChildItem (Join-Path $env:windir 'INF') -Filter 'oem*.inf' -ErrorAction SilentlyContinue) {
    if (Select-String -Path $f.FullName -Pattern 'VID_0483&PID_DF11' -Quiet -ErrorAction SilentlyContinue) { $dfuInf = $f.Name; break }
  }
  if ($dfuInf) { Write-Host ('STM32 DFU driver: installed (' + $dfuInf + ')') } else { Write-Host 'STM32 DFU driver: not installed (option 1 installs it)' }
  $devices = @(Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | Where-Object { $_.InstanceId -match '^USB\\VID_(1209|2DAE|0483|26AC)&' })
  if ($devices.Count -eq 0) {
    Write-Host 'No ArduPilot, CubePilot or STM32 USB device is connected now. Plug the board in (DFU mode: hold BOOT while connecting USB) and run the check again.'
    return
  }
  foreach ($d in $devices) {
    $name = if ($d.FriendlyName) { $d.FriendlyName } else { '(no name)' }
    Write-Host ''
    Write-Host ($name + '   [' + $d.Class + ', status ' + $d.Status + ']')
    Write-Host ('  ' + $d.InstanceId)
    if ($d.InstanceId -match 'VID_0483&PID_DF11') {
      if ($d.Status -eq 'OK' -and $d.Service -eq 'WinUSB') { Write-Host '  OK: the board is in DFU mode and WinUSB is attached, the DFU flasher can open it.' }
      else { Write-Host '  PROBLEM: a board in DFU mode has no working driver. Run option 1 of this installer, then reconnect the board.' }
    } elseif ($d.Class -eq 'Ports') {
      if ($name -match '\(COM\d+\)') { Write-Host '  OK: a COM port is assigned.' }
      else { Write-Host '  PROBLEM: the driver is attached but Windows gave no COM number. See the paging file warning above; unplug the board and plug it in again.' }
    } elseif ($d.Status -ne 'OK') {
      Write-Host '  PROBLEM: Windows reports an error for this device. Try another USB cable or port, then plug it in again.'
    }
  }
}

function Invoke-Install {
  $arch = (Get-CimInstance Win32_Processor | Select-Object -First 1).Architecture
  if ($arch -ne 9) { throw 'This driver package is for 64-bit (x64) Windows 10 and 11 only.' }
  if (-not $dryRun -and -not (Test-Admin)) {
    Write-Host 'Asking for administrator approval, a new window opens...'
    Start-Process -FilePath $env:ATLAS_SELF -ArgumentList 'install' -Verb RunAs
    return
  }
  if (-not $dryRun -and -not $base.StartsWith('https://')) { throw 'Refusing a source that is not HTTPS.' }
  $work = Join-Path ([IO.Path]::GetTempPath()) ('ATLAS-USB-' + [Guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $work | Out-Null
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    foreach ($name in $packageHashes.Keys) {
      $target = Join-Path $work ($name -replace '/', '\')
      New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
      Write-Host ('Downloading ' + $name)
      Invoke-WebRequest -UseBasicParsing -Uri ($base + $name) -OutFile $target
      $actual = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLower()
      if ($actual -ne $packageHashes[$name]) { throw ('Checksum mismatch for ' + $name + '. The download is not the expected file; nothing was installed.') }
    }
    Write-Host 'All four checksums match.'
    $catalog = Join-Path $work 'STM32Bootloader.cat'
    $signature = Get-AuthenticodeSignature -FilePath $catalog
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Microsoft Windows Hardware Compatibility Publisher') {
      throw ('The driver catalog is not signed as expected (' + $signature.Status + '); nothing was installed.')
    }
    Write-Host 'Catalog signature: valid, issued to Microsoft Windows Hardware Compatibility Publisher.'
    if ($dryRun) { Write-Host 'DRY RUN: pnputil was not started and nothing was installed.'; return }
    Write-Host 'Installing the driver package...'
    $ErrorActionPreference = 'Continue'
    & (Join-Path $env:windir 'System32\pnputil.exe') /add-driver (Join-Path $work 'STM32Bootloader.inf') /install
    $code = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($code -ne 0 -and $code -ne 3010) { throw ('pnputil failed with exit code ' + $code + '. If its message mentions a signature or a policy, this PC blocks third-party drivers.') }
    Write-Host ''
    Write-Host 'Done. Put the board in DFU mode (hold BOOT while connecting USB). Device Manager should list "STM32 Bootloader" under "Universal Serial Bus devices".'
    if ($code -eq 3010) { Write-Host 'Windows asks for a restart to finish the installation.' }
  } finally {
    Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
  }
}

try {
  $choice = $env:ATLAS_USB_ARG
  if (-not $choice) {
    Write-Host ''
    Write-Host 'A.T.L.A.S. USB drivers'
    Write-Host '  1  Install the STM32 DFU driver (asks for administrator approval)'
    Write-Host '  2  Check how Windows sees the flight controller (read-only)'
    Write-Host '  0  Exit'
    $choice = Read-Host 'Choose 1, 2 or 0'
  }
  switch -Regex (([string]$choice).Trim().ToLower()) {
    '^(1|install)$' { Invoke-Install }
    '^(2|check)$' { Invoke-Check }
    default { Write-Host 'Nothing to do.' }
  }
} catch {
  Write-Host ''
  Write-Host ('ERROR: ' + $_.Exception.Message)
  exit 1
}
