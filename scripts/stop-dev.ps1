# CreatorForge — stop stale Next.js dev servers (ports 3000-3007).
# Used by dev:clean and prebuild to avoid corrupting .next while building.

$ErrorActionPreference = "SilentlyContinue"

Write-Host "Stopping Node/Next dev processes..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
  $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
  if ($cmd -match "next(\.cmd)?\s+dev") {
    Write-Host "  Killing PID $($_.Id) (next dev)"
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "Stopping dev servers on ports 3000-3007..." -ForegroundColor Cyan
foreach ($port in 3000..3007) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    ForEach-Object {
      $procId = $_.OwningProcess
      if ($procId -gt 0) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        Write-Host "  Killing PID $procId ($($proc.ProcessName)) on port $port"
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      }
    }
}

Start-Sleep -Seconds 2
