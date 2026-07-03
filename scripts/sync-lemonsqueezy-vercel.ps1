# Sync LemonSqueezy vars from .env.local to Vercel (Production + Preview)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path (Split-Path -Parent $root) '.env.local'
$keys = @(
  'LEMONSQUEEZY_API_KEY',
  'LEMONSQUEEZY_STORE_ID',
  'LEMONSQUEEZY_VARIANT_ID',
  'LEMONSQUEEZY_WEBHOOK_SECRET'
)
$map = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $p = $_ -split '=', 2
  $map[$p[0].Trim()] = $p[1].Trim().Trim('"').Trim("'")
}
Set-Location (Split-Path -Parent $root)
$synced = @()
$missing = @()
foreach ($k in $keys) {
  if (-not $map[$k]) { $missing += $k; continue }
  foreach ($target in @('production','preview')) {
    # Pipe value via stdin — --value truncates long JWT keys on Windows/PowerShell.
    $map[$k] | npx vercel env add $k $target --force --yes --sensitive
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to sync $k to $target (exit $LASTEXITCODE)"
    }
  }
  $synced += $k
}
Write-Output "SYNCED: $($synced -join ', ')"
if ($missing.Count) { Write-Output "MISSING: $($missing -join ', ')" }
