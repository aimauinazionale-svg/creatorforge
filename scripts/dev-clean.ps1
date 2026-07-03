# CreatorForge — clean dev server restart
# Kills stale Next.js dev servers, clears build cache, starts fresh on port 3000.

$ErrorActionPreference = "SilentlyContinue"

& "$PSScriptRoot/stop-dev.ps1"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (Test-Path ".next") {
  Write-Host "Removing .next cache..." -ForegroundColor Cyan
  Remove-Item -Recurse -Force ".next"
}

if (Test-Path "node_modules/.cache") {
  Write-Host "Removing node_modules/.cache..." -ForegroundColor Cyan
  Remove-Item -Recurse -Force "node_modules/.cache"
}

$missingDeps = @(
  "tailwind-merge",
  "clsx",
  "@radix-ui/react-accordion",
  "@radix-ui/react-avatar",
  "@radix-ui/react-dialog",
  "@radix-ui/react-dropdown-menu",
  "@radix-ui/react-slot",
  "@radix-ui/react-tabs",
  "@radix-ui/react-toast"
) | Where-Object { -not (Test-Path "node_modules/$_") }
if ($missingDeps.Count -gt 0) {
  Write-Host "Installing missing deps: $($missingDeps -join ', ')..." -ForegroundColor Yellow
  npm install @($missingDeps)
}

# Wait until port 3000 is free before starting
$deadline = (Get-Date).AddSeconds(10)
while ((Get-Date) -lt $deadline) {
  $busy = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
  if (-not $busy) { break }
  Start-Sleep -Milliseconds 500
}

Write-Host "Starting dev server on http://localhost:3000 ..." -ForegroundColor Green
npm run dev -- -p 3000
