$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$backendScript = {
  param($repoRoot)
  Set-Location $repoRoot
  python -m uvicorn main:app --reload --app-dir (Join-Path $repoRoot "modules\atlas\backend")
}

$frontendScript = {
  param($repoRoot)
  Set-Location (Join-Path $repoRoot "frontend")
  npm run dev
}

$backend = Start-Job -Name "ousemg-backend" -ScriptBlock $backendScript -ArgumentList $root
$frontend = Start-Job -Name "ousemg-frontend" -ScriptBlock $frontendScript -ArgumentList $root

Write-Host "Backend Job: $($backend.Id)  (http://127.0.0.1:8000)"
Write-Host "Frontend Job: $($frontend.Id)  (http://localhost:5173)"
Write-Host "Press Ctrl+C to stop both."

try {
  while ($true) {
    Receive-Job -Job $backend, $frontend -ErrorAction Continue

    $failed = @($backend, $frontend) | Where-Object {
      $_.State -in @("Failed", "Stopped", "Completed")
    }

    if ($failed.Count -gt 0) {
      Receive-Job -Job $failed -ErrorAction Continue
      throw "Dev process stopped: $($failed.Name -join ', ')"
    }

    Start-Sleep -Seconds 1
  }
} finally {
  Stop-Job -Job $backend, $frontend -ErrorAction SilentlyContinue
  Remove-Job -Job $backend, $frontend -Force -ErrorAction SilentlyContinue
}
