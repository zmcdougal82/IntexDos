# PowerShell script to restart the recommendation service and regenerate recommendations

Write-Host "Stopping any running recommendation service instances..." -ForegroundColor Cyan
Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*app.py*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Existing processes stopped or none were running." -ForegroundColor Green

Write-Host "Starting recommendation service..." -ForegroundColor Cyan
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
$pythonProcess = Start-Process -FilePath "python" -ArgumentList "app.py --port 8001" -WindowStyle Hidden -PassThru
Write-Host "Recommendation service started in the background (PID: $($pythonProcess.Id))" -ForegroundColor Green

Write-Host "Waiting for service to initialize (5 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "Triggering recommendation file generation..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "http://localhost:8001/recommendations/generate-file" -Method Post
    Write-Host "Recommendations file generation request sent successfully." -ForegroundColor Green
} catch {
    Write-Host "Failed to send recommendation file generation request: $_" -ForegroundColor Red
}

Write-Host "`nDone! The recommendations have been updated with the new quality filtering." -ForegroundColor Green
Write-Host "Movies with average ratings below 3.5 will no longer appear in recommendations." -ForegroundColor Green
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
