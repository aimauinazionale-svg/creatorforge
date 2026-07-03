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
  Write-Output "${k}: local_len=$($map[$k].Length)"
  foreach ($target in @('production','preview')) {
    # Write to temp file and redirect stdin — avoids empty values from broken pipes.
    $tmp = [System.IO.Path]::GetTempFileName()
    try {
      [System.IO.File]::WriteAllText($tmp, $map[$k], [System.Text.UTF8Encoding]::new($false))
      Get-Content -Raw -Encoding UTF8 $tmp | npx vercel env add $k $target --force --yes --sensitive
      if ($LASTEXITCODE -ne 0) {
        throw "Failed to sync $k to $target (exit $LASTEXITCODE)"
      }
    } finally {
      Remove-Item -Force $tmp -ErrorAction SilentlyContinue
    }
  }
  $synced += $k
}
Write-Output "SYNCED: $($synced -join ', ')"
if ($missing.Count) { Write-Output "MISSING: $($missing -join ', ')" }

Write-Output "`nVerifying non-sensitive IDs via production pull..."
$verify = Join-Path $env:TEMP "vercel-ls-verify.env"
npx vercel env pull $verify --environment=production --yes
if ($LASTEXITCODE -ne 0) { throw "Pull verification failed" }
$pulled = Get-Content -Raw $verify
foreach ($k in @('LEMONSQUEEZY_STORE_ID','LEMONSQUEEZY_VARIANT_ID')) {
  $localLen = $map[$k].Length
  if ($pulled -match "(?m)^$k=`"(.*)`"$") {
    $pulledLen = $Matches[1].Length
    Write-Output "${k}: local_len=$localLen pulled_len=$pulledLen"
    if ($pulledLen -ne $localLen) { throw "Verification failed: $k mismatch on Vercel" }
  } else {
    throw "Verification failed: $k not found in pull"
  }
}
Remove-Item -Force $verify -ErrorAction SilentlyContinue
Write-Output "`nNumeric IDs verified. Redeploy production, then check /api/billing/config-status."
