param(
  [int]$Port = 3000,
  [string]$HostName = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

$existingListeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique

foreach ($processId in $existingListeners) {
  if ($processId) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
}

Start-Sleep -Seconds 1

$command = "npm start -- --hostname $HostName --port $Port"
Start-Process `
  -FilePath "cmd.exe" `
  -ArgumentList @("/d", "/s", "/c", $command) `
  -WorkingDirectory $repoRoot `
  -WindowStyle Hidden

$deadline = (Get-Date).AddSeconds(30)
do {
  Start-Sleep -Seconds 1
  $ready = Test-NetConnection $HostName -Port $Port -InformationLevel Quiet
} while (-not $ready -and (Get-Date) -lt $deadline)

if (-not $ready) {
  throw "Local production server did not become ready on http://$HostName`:$Port"
}

Write-Host "Local production server is ready on http://$HostName`:$Port"
