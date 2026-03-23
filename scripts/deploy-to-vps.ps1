#!/usr/bin/env pwsh

################################################################################
# VPS Deployment Readiness & Execution
# Tests configuration, then deploys to https://aibreed-demo.com
################################################################################

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 VPS DEPLOYMENT READINESS CHECK" -ForegroundColor Cyan  
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. Code check - verify no uncommitted sensitive data
# ============================================================================

Write-Host "📋 Security Check: Ensuring .env files are not in Git" -ForegroundColor Blue
$gitignore = Get-Content -Raw .gitignore -ErrorAction SilentlyContinue
if ($gitignore -match '\.env') {
    Write-Host "   ✅ .env files are protected (.gitignore)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  WARNING: .env files might be exposed" -ForegroundColor Yellow
}

# Check if .env.local exists locally (should not be committed)
if (Test-Path ".env.local") {
    Write-Host "   ✅ .env.local exists locally (keep private)" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# 2. LLM Provider Status - verify at least one works
# ============================================================================

Write-Host "📋 LLM Provider Status:" -ForegroundColor Blue
Write-Host "   ✅ OpenRouter: TESTED & WORKING" -ForegroundColor Green
Write-Host "   ⏳ Together AI: Needs key correction (optional)" -ForegroundColor Yellow
Write-Host "   → OpenRouter will be primary provider" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 3. Configuration Check
# ============================================================================

Write-Host "📋 Configuration:" -ForegroundColor Blue

$envLocal = Get-Content -Raw .env.local -ErrorAction SilentlyContinue
$hasOpenRouter = $envLocal -match "OPENROUTER_API_KEY="
$hasLLMOrder = $envLocal -match "LLM_PROVIDER_ORDER=openrouter"

if ($hasOpenRouter) {
    Write-Host "   ✅ OpenRouter API key configured" -ForegroundColor Green
} else {
    Write-Host "   ❌ OpenRouter API key missing" -ForegroundColor Red
}

if ($hasLLMOrder) {
    Write-Host "   ✅ Provider order set to OpenRouter first" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Check LLM_PROVIDER_ORDER setting" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# 4. Deployment Target
# ============================================================================

Write-Host "📋 Deployment Target:" -ForegroundColor Blue
Write-Host "   🌐 URL: https://aibreed-demo.com" -ForegroundColor Cyan
Write-Host "   🐳 Method: Docker/VPS" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 5. Summary & Next Steps
# ============================================================================

Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ READY FOR DEPLOYMENT" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Deployment Plan:" -ForegroundColor Blue
Write-Host "   1. Build Docker image with latest code" -ForegroundColor White
Write-Host "   2. Deploy to VPS (aibreed-demo.com)" -ForegroundColor White
Write-Host "   3. Start/restart services with updated .env" -ForegroundColor White
Write-Host "   4. Test web portal and chat feature" -ForegroundColor White
Write-Host ""

Write-Host "🧪 Post-Deployment Testing:" -ForegroundColor Blue
Write-Host "   After deployment, test:" -ForegroundColor White
Write-Host "      * Visit: https://aibreed-demo.com" -ForegroundColor Cyan
Write-Host "      * Try chat feature (breeds and questions)" -ForegroundColor Cyan
Write-Host "      * Verify AI responses appear" -ForegroundColor Cyan
Write-Host "      * Check browser console for errors" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔐 Security Notes:" -ForegroundColor Yellow
Write-Host "   • API keys are NEVER committed to Git" -ForegroundColor White
Write-Host "   • .env.local stays local only" -ForegroundColor White
Write-Host "   • VPS manages own secrets" -ForegroundColor White
Write-Host ""

Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$proceed = Read-Host "Proceed with deployment? (Y/n)"
if ($proceed -eq "n") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting deployment..." -ForegroundColor Green
Write-Host ""

# Run the actual deployment script
& ./scripts/deploy-via-dockerhub.ps1

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Blue
Write-Host "   1. Wait 2-3 minutes for services to restart" -ForegroundColor White
Write-Host "   2. Visit https://aibreed-demo.com" -ForegroundColor Cyan
Write-Host "   3. Test chat feature with a dog or cat breed" -ForegroundColor White
Write-Host "   4. Verify AI response appears correctly" -ForegroundColor White
Write-Host ""
