# Start all flarelette-demo services in separate PowerShell windows
# Each service runs on its own port without service bindings for local dev

$PS_EXE = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"

Write-Host "Starting flarelette-demo local development stack..." -ForegroundColor Cyan
Write-Host ""

# 1. Content Service (port 8788)
Start-Process $PS_EXE `
  -ArgumentList '-NoExit','-Command','$Host.UI.RawUI.WindowTitle = ''Content''; cd workers\content-service; $Host.UI.RawUI.ForegroundColor = ''Blue''; $Host.UI.RawUI.BackgroundColor = ''White''; Write-Host ''Content Service starting on port 8788...''; npm run dev -- --port 8788' `
  -WorkingDirectory $PSScriptRoot `
  -WindowStyle Normal

Start-Sleep -Seconds 2

# 2. Forms Service (port 8789)
Start-Process $PS_EXE `
  -ArgumentList '-NoExit','-Command','$Host.UI.RawUI.WindowTitle = ''Forms''; cd workers\forms-service; $Host.UI.RawUI.ForegroundColor = ''Magenta''; $Host.UI.RawUI.BackgroundColor = ''White''; Write-Host ''Forms Service starting on port 8789...''; npm run dev -- --port 8789' `
  -WorkingDirectory $PSScriptRoot `
  -WindowStyle Normal

Start-Sleep -Seconds 2

# 3. Image Service (port 8790)
Start-Process $PS_EXE `
  -ArgumentList '-NoExit','-Command','$Host.UI.RawUI.WindowTitle = ''Images''; cd workers\image-service; $Host.UI.RawUI.ForegroundColor = ''Yellow''; $Host.UI.RawUI.BackgroundColor = ''DarkBlue''; Write-Host ''Image Service starting on port 8790...''; npm run dev -- --port 8790' `
  -WorkingDirectory $PSScriptRoot `
  -WindowStyle Normal

Start-Sleep -Seconds 2

# 4. Gateway (port 8787)
Start-Process $PS_EXE `
  -ArgumentList '-NoExit','-Command','$Host.UI.RawUI.WindowTitle = ''Gateway''; cd workers\gateway; $Host.UI.RawUI.ForegroundColor = ''Green''; $Host.UI.RawUI.BackgroundColor = ''Black''; Write-Host ''Gateway starting on port 8787...''; npm run dev -- --port 8787' `
  -WorkingDirectory $PSScriptRoot `
  -WindowStyle Normal

Start-Sleep -Seconds 2

# 5. UI (port 4321)
Start-Process $PS_EXE `
  -ArgumentList '-NoExit','-Command','$Host.UI.RawUI.WindowTitle = ''UI''; cd ui; $Host.UI.RawUI.ForegroundColor = ''Cyan''; $Host.UI.RawUI.BackgroundColor = ''DarkGray''; Write-Host ''UI starting on port 4321...''; npm run dev' `
  -WorkingDirectory $PSScriptRoot `
  -WindowStyle Normal

Write-Host ""
Write-Host "Local Development Stack Started!" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Yellow
Write-Host "  Content Service  -> http://localhost:8788" -ForegroundColor White
Write-Host "  Forms Service    -> http://localhost:8789" -ForegroundColor White
Write-Host "  Image Service    -> http://localhost:8790" -ForegroundColor White
Write-Host "  Gateway          -> http://localhost:8787" -ForegroundColor White
Write-Host "  UI               -> http://localhost:4321" -ForegroundColor Cyan
Write-Host ""
Write-Host "Gateway will proxy to services via HTTP instead of service bindings" -ForegroundColor Gray
Write-Host ""
