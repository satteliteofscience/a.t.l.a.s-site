@echo off
setlocal
title A.T.L.A.S. TCP Connector - 127.0.0.1:5760
set "ATLAS_SELF=%~f0"
powershell.exe -NoLogo -NoProfile -Command "$ErrorActionPreference = 'Stop'; $source = [System.IO.File]::ReadAllText($env:ATLAS_SELF, [System.Text.Encoding]::UTF8); $marker = ':: ATLAS_POWERSHELL_START'; $index = $source.LastIndexOf($marker, [StringComparison]::Ordinal); if ($index -lt 0) { throw 'Launcher source marker missing' }; & ([ScriptBlock]::Create($source.Substring($index + $marker.Length)))"
if errorlevel 1 (
  echo.
  echo A.T.L.A.S. TCP Connector failed. Read the error above.
  pause
  exit /b 1
)
exit /b 0
:: ATLAS_POWERSHELL_START
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# No administrator privileges or persistent Node.js installation are needed.
# A verified portable Node.js executable is cached in the user's LocalAppData
# if a supported system Node.js is unavailable.
$nodeVersion = 'v24.22.2'
$nodeBase = 'https://nodejs.org/dist/' + $nodeVersion + '/'
$nodeChecksums = @{
 'win-x64' = '1c331340fa6cac5e4294725959070a143fa0507195a78ad77eed7943f719aac9'
 'win-arm64' = 'e2d6e75a0bfe4c176316d7c732eb8def9d94570c759eaeab335473a015abb7ea'
}
$bridgeUrl = 'https://raw.githubusercontent.com/satteliteofscience/a.t.l.a.s-site/7450a4eeb9cc333865292b7b1850233291d7b383/tools/mavlink-bridge.cjs'
$bridgeGitSha = '6f349f597c4ca5a72d2385d6443cc86f6dc3788a'
$site = 'https://satteliteofscience.github.io/a.t.l.a.s-site/configurator.html'
$workDir = Join-Path $env:LOCALAPPDATA 'ATLAS-TCP-Connector'
New-Item -ItemType Directory -Path $workDir -Force | Out-Null

function Get-GitBlobHash([string]$file) {
 $bytes = [System.IO.File]::ReadAllBytes($file)
 $prefix = [System.Text.Encoding]::ASCII.GetBytes(('blob ' + $bytes.Length + [char]0))
 $blob = New-Object byte[] ($prefix.Length + $bytes.Length)
 [System.Buffer]::BlockCopy($prefix,0,$blob,0,$prefix.Length)
 [System.Buffer]::BlockCopy($bytes,0,$blob,$prefix.Length,$bytes.Length)
 $sha = [System.Security.Cryptography.SHA1]::Create()
 try { return ([BitConverter]::ToString($sha.ComputeHash($blob))).Replace('-','').ToLowerInvariant() }
 finally { $sha.Dispose() }
}
function Download-Checked([string]$url,[string]$target,[string]$expected,[string]$kind) {
 $check = if ($kind -eq 'sha256') { (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant() } else { Get-GitBlobHash $target }
 if($check -ne $expected) { throw ('Integrity check failed for ' + $target + '. Expected ' + $expected + ', got ' + $check) }
}
# Windows cannot reliably use directory components ending in a period.
# Cleanup must never obscure the original download or integrity error.
function Remove-DownloadedFile([string]$path) {
 if([System.IO.File]::Exists($path)) { [System.IO.File]::Delete($path) }
}
function Fetch-OfficialFile([string]$url,[string]$target,[string]$hash,[string]$kind) {
 if([System.IO.File]::Exists($target)) {
  try { Download-Checked $url $target $hash $kind; return }
  catch { Remove-DownloadedFile $target }
 }
 $downloadPath = $target + '.download'
 Remove-DownloadedFile $downloadPath
 try {
  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
  Write-Host ('Downloading verified component from ' + $url)
  Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $downloadPath -MaximumRedirection 3 -TimeoutSec 120
  Download-Checked $url $downloadPath $hash $kind
  Move-Item -LiteralPath $downloadPath -Destination $target -Force
 } catch {
  $message = $_.Exception.Message
  throw ('Unable to download or verify ' + $url + ': ' + $message)
 } finally {
  Remove-DownloadedFile $downloadPath
 }
}
Write-Host ''
Write-Host 'A.T.L.A.S. TCP Connector - one-click launcher' -ForegroundColor Green
Write-Host 'Station TCP: 127.0.0.1:5760'
Write-Host 'Bridge WebSocket: 127.0.0.1:8765 (localhost only)'
Write-Host 'Keep this window open while using A.T.L.A.S.'
Write-Host ''

$node = $null
$existing = Get-Command node.exe -ErrorAction SilentlyContinue
if($existing) {
 try {
  $versionText = (& $existing.Source --version 2>$null | Select-Object -First 1)
  if($versionText -match '^v([0-9]+)\.' -and [int]$Matches[1] -ge 20) { $node = $existing.Source }
 } catch {}
}
if(!$node) {
 $architecture = $env:PROCESSOR_ARCHITECTURE
 $platform = if($architecture -eq 'ARM64') {'win-arm64'} else {'win-x64'}
 if($architecture -notin @('AMD64','ARM64')) { throw ('Windows architecture ' + $architecture + ' is not supported. Requires 64-bit Windows.') }
 $node = Join-Path $workDir ('node-' + $nodeVersion + '-' + $platform + '.exe')
 Fetch-OfficialFile ($nodeBase + $platform + '/node.exe') $node $nodeChecksums[$platform] 'sha256'
 Write-Host 'Portable Node.js verified with the official SHA-256 checksum.'
} else { Write-Host ('Using installed Node.js: ' + $node) }

$bridge = Join-Path $workDir 'mavlink-bridge.cjs'
Fetch-OfficialFile $bridgeUrl $bridge $bridgeGitSha 'gitblob'
Write-Host 'A.T.L.A.S. MAVLink bridge verified against pinned Git source.'
# Test-mode exercises the actual first-launch download and checksum verification
# on Windows CI without opening a browser or a TCP endpoint.
if($env:ATLAS_CONNECTOR_SELFTEST -eq '1') {
 Write-Host 'PASS: Portable Node download/cache, official SHA-256 and verified MAVLink bridge.'
 return
}

# Prevent unintentionally opening a browser attached to an unrelated process on 8765.
$probe = New-Object System.Net.Sockets.TcpClient
try {
 try { $probe.Connect([System.Net.IPAddress]::Parse('127.0.0.1'),8765) } catch {}
 if($probe.Connected) { throw 'Port 8765 is already in use. Close the previous A.T.L.A.S. Connector window and run this file again.' }
} finally { $probe.Dispose() }

$randomBytes = New-Object byte[] 20
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($randomBytes) } finally { $rng.Dispose() }
$token = ([BitConverter]::ToString($randomBytes)).Replace('-','').ToLowerInvariant()
$env:ATLAS_BRIDGE_TOKEN = $token
$env:ATLAS_BRIDGE_PORT = '8765'
$child = Start-Process -FilePath $node -ArgumentList ('"' + $bridge + '"') -PassThru -NoNewWindow
Remove-Item Env:ATLAS_BRIDGE_TOKEN -ErrorAction SilentlyContinue
$ready = $false
for($i=0;$i -lt 50;$i++) {
 if($child.HasExited) { throw ('Local connector exited with code ' + $child.ExitCode) }
 $check = New-Object System.Net.Sockets.TcpClient
 try {
  try { $check.Connect([System.Net.IPAddress]::Parse('127.0.0.1'),8765);$ready=$check.Connected } catch {}
 } finally { $check.Dispose() }
 if($ready) { break }
 Start-Sleep -Milliseconds 200
}
if(!$ready) { try{$child.Kill()}catch{};throw 'Local connector did not open port 8765 within 10 seconds.' }

# The random secret is carried in the URL fragment, which is not sent to GitHub.
# The configurator immediately removes the fragment from browser history.
$url = $site + '#atlas-tcp=' + $token
Write-Host 'Opening A.T.L.A.S. and connecting to TCP 127.0.0.1:5760...' -ForegroundColor Cyan
try { Start-Process $url } catch {
 Write-Warning ('Could not launch browser: ' + $_.Exception.Message)
 Write-Host 'Open the official A.T.L.A.S. site and connect via the manual UDP/TCP fields.'
}
Write-Host 'If the browser asks for local-network access, select Allow.' -ForegroundColor Yellow
Write-Host 'Closing this window stops the local connector.' -ForegroundColor Yellow
try { $child.WaitForExit() } finally { if(!$child.HasExited){try{$child.Kill()}catch{}} }
if($child.ExitCode -ne 0) { throw ('Connector exited with code ' + $child.ExitCode) }
