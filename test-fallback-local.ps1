# LLM Fallback Testing for Windows (PowerShell)
# Simple test script to validate fallback mechanism

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "    LLM FALLBACK TEST (Windows PowerShell)   " -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if dev server is running
Write-Host "Checking if localhost:3000 is accessible..." -ForegroundColor Yellow

$devServerCheck = @{
    Uri = "http://localhost:3000"
    ErrorAction = "SilentlyContinue"
    UseBasicParsing = $true
}

try {
    $response = Invoke-WebRequest @devServerCheck -TimeoutSec 2
    Write-Host "✅ Dev server is running on localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to localhost:3000" -ForegroundColor Red
    Write-Host "`nMAKE SURE YOUR DEV SERVER IS RUNNING:`n" -ForegroundColor Yellow
    Write-Host "  1. Open PowerShell in your project directory"
    Write-Host "  2. Run: npm run dev"
    Write-Host "  3. Wait for 'ready - started server' message"
    Write-Host "  4. Then run this test again`n"
    exit 1
}

# Load .env.local
Write-Host "`nLoading environment variables from .env.local..." -ForegroundColor Yellow
$envLocal = "$PSScriptRoot\.env.local"

if (-not (Test-Path $envLocal)) {
    Write-Host "❌ .env.local not found" -ForegroundColor Red
    exit 1
}

$env_vars = @{}
Get-Content $envLocal | Where-Object { $_ -and -not $_.StartsWith('#') } | ForEach-Object {
    $key, $value = $_.Split('=', 2)
    if ($key -and $value) {
        $env_vars[$key.Trim()] = $value.Trim()
    }
}

$OPENROUTER_KEY = $env_vars['OPENROUTER_API_KEY']
$TOGETHER_KEY = $env_vars['TOGETHER_API_KEY']

if (-not $OPENROUTER_KEY -or -not $TOGETHER_KEY) {
    Write-Host "❌ Missing API keys in .env.local" -ForegroundColor Red
    Write-Host "   OPENROUTER_API_KEY: $(if ($OPENROUTER_KEY) { '✓' } else { '✗' })"
    Write-Host "   TOGETHER_API_KEY: $(if ($TOGETHER_KEY) { '✓' } else { '✗' })"
    exit 1
}

Write-Host "✅ API keys found:" -ForegroundColor Green
Write-Host "   OPENROUTER: $($OPENROUTER_KEY.Substring(0, 20))..." -ForegroundColor Green
Write-Host "   TOGETHER:   $($TOGETHER_KEY.Substring(0, 20))..." -ForegroundColor Green

# Test 1: Normal flow
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 1: Normal Flow (OpenRouter Primary)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$body = @{
    breed = "Golden Retriever"
    question = "What is this breed?"
} | ConvertTo-Json

$timer = [System.Diagnostics.Stopwatch]::StartNew()

try {
    $apiResponse = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/chatbot" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 30 `
        -UseBasicParsing

    $timer.Stop()
    $duration = $timer.ElapsedMilliseconds

    if ($apiResponse.StatusCode -eq 200) {
        Write-Host "✅ SUCCESS (HTTP 200)" -ForegroundColor Green
        Write-Host "⏱️  Response received in ${duration}ms" -ForegroundColor Green
        
        $responseData = $apiResponse.Content | ConvertFrom-Json
        if ($responseData.response) {
            $preview = $responseData.response.Substring(0, [Math]::Min(80, $responseData.response.Length))
            Write-Host "📝 Response: ""$preview...""" -ForegroundColor Green
        }
        
        if ($responseData.provider) {
            Write-Host "🤖 Provider: $($responseData.provider)" -ForegroundColor Green
        }
        if ($responseData.model) {
            Write-Host "📊 Model: $($responseData.model)" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  HTTP $($apiResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $timer.Stop()
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Multiple queries
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 2: Multiple Queries (Consistency)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$testQueries = @(
    @{ breed = "Labrador"; question = "What is the typical lifespan?" },
    @{ breed = "Pembroke Welsh Corgi"; question = "Are they good family dogs?" },
    @{ breed = "Siberian Husky"; question = "How much exercise do they need?" }
)

$passCount = 0
$failCount = 0

foreach ($test in $testQueries) {
    Write-Host "  Query: $($test.breed) - ""$($test.question)""" -ForegroundColor Yellow
    
    $body = $test | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest `
            -Uri "http://localhost:3000/api/chatbot" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 30 `
            -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Host "    ✅ HTTP 200" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "    ⚠️  HTTP $($response.StatusCode)" -ForegroundColor Yellow
            $failCount++
        }
    } catch {
        Write-Host "    ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host "`n  Summary: $passCount passed, $failCount failed" -ForegroundColor Cyan

# Test 3: Instructions for fallback testing
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 3: Test Real Fallback (Manual)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "To test the ACTUAL fallback behavior:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open $envLocal in your text editor" -ForegroundColor White
Write-Host ""
Write-Host "2. Find this line:" -ForegroundColor White
Write-Host "   OPENROUTER_API_KEY=sk-or-v1-..." -ForegroundColor Gray
Write-Host ""
Write-Host "3. Change it to:" -ForegroundColor White
Write-Host "   OPENROUTER_API_KEY=invalid_test_key" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Save the file, then RESTART your dev server:" -ForegroundColor White
Write-Host "   Press Ctrl+C in the dev server terminal" -ForegroundColor Gray
Write-Host "   Run: npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Look for messages like:" -ForegroundColor White
Write-Host "   '[LLM] Falling back to Together AI'" -ForegroundColor Gray
Write-Host "   '[LLM] Using provider: together'" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Run this test again:" -ForegroundColor White
Write-Host "   .\test-fallback-local.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "7. If it still works, FALLBACK IS WORKING! ✅" -ForegroundColor Green
Write-Host ""
Write-Host "8. Restore the original OpenRouter key and restart dev server" -ForegroundColor White

# Final summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "             TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($passCount -gt 0) {
    Write-Host "`n✅ SUCCESS! Your local fallback testing is ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Follow the manual test above to verify fallback behavior" -ForegroundColor White
    Write-Host "2. Watch the dev server logs for fallback messages" -ForegroundColor White
    Write-Host "3. After confirming locally, test on your VPS" -ForegroundColor White
    Write-Host "   Visit: https://aibreeds-demo.com" -ForegroundColor White
} else {
    Write-Host "`n⚠️  Tests failed. Check the dev server is running." -ForegroundColor Yellow
}

Write-Host "`n"
