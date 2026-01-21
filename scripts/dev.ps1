# Health Check - Start Dev Server with Monitoring
# Automatically detects and logs issues to TODO.md

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🏥 Dev Server with Health Check" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# Kill existing processes
Write-Host "Stopping existing Node processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null | Out-Null
Start-Sleep -Seconds 2

# Run dev server and let it run normally
Write-Host "Starting dev server...`n" -ForegroundColor Green

npm run dev
