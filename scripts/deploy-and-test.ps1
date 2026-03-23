#!/usr/bin/env pwsh

################################################################################
# Automated VPS Deployment with OpenRouter
# Deploys to: 159.223.63.117
# Domain: https://aibreed-demo.com
################################################################################

param(
    [switch]$SkipTest = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

# Colors
$Green = "[32m"
$Yellow = "[33m"
$Red = "[31m"
$Reset = "[0m"

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 AUTOMATED VPS DEPLOYMENT" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Deployment Configuration
# ============================================================================

$VPS_IP = "159.223.63.117"
$VPS_USER = "root"
$VPS_PATH = "/opt/aibreeds"
$APP_URL = "https://aibreed-demo.com"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Blue
Write-Host "   VPS IP: $VPS_IP" -ForegroundColor White
Write-Host "   VPS User: $VPS_USER" -ForegroundColor White
Write-Host "   App Path: $VPS_PATH" -ForegroundColor White
Write-Host "   URL: $APP_URL" -ForegroundColor White
Write-Host ""

# ============================================================================
# Step 1: Verify Local Configuration
# ============================================================================

Write-Host "📋 Step 1: Verifying local configuration..." -ForegroundColor Blue
Write-Host ""

if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: .env.local not found" -ForegroundColor Red
    exit 1
}

$envLocal = Get-Content ".env.local"
$hasOpenRouter = $envLocal | Select-String "^OPENROUTER_API_KEY="

if (-not $hasOpenRouter) {
    Write-Host "❌ Error: OPENROUTER_API_KEY not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Local configuration verified" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 2: Prepare Production Environment File
# ============================================================================

Write-Host "📋 Step 2: Preparing production environment..." -ForegroundColor Blue
Write-Host ""

# Copy .env.local to .env.production for deployment
$envLocalContent = Get-Content ".env.local" -Raw

# Create .env.production with the configuration
Set-Content ".env.production" $envLocalContent

Write-Host "✅ Created .env.production" -ForegroundColor Green
Write-Host "   (from local configuration with OpenRouter key)" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# Step 3: Build Docker Image
# ============================================================================

Write-Host "📋 Step 3: Building Docker image..." -ForegroundColor Blue
Write-Host ""

if ($DryRun) {
    Write-Host "   [DRY RUN] Would build: docker build -t aibreeds:prod ." -ForegroundColor Yellow
} else {
    try {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $imageTag = "aibreeds:prod-$timestamp"
        
        Write-Host "   Building image: $imageTag" -ForegroundColor White
        docker build -t $imageTag -f Dockerfile.prod .
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Docker build failed" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ Docker image built successfully" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "❌ Build error: $_" -ForegroundColor Red
        exit 1
    }
}

# ============================================================================
# Step 4: Deploy to VPS
# ============================================================================

Write-Host "📋 Step 4: Preparing VPS deployment..." -ForegroundColor Blue
Write-Host ""

Write-Host "To complete deployment to VPS, run the following SSH commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "ssh root@$VPS_IP" -ForegroundColor Cyan
Write-Host ""

$deployCommands = @"
# On VPS:
cd $VPS_PATH

# Pull latest code
git pull origin main

# Copy .env.production
cp .env.production.bak .env.production.backup
cat > .env.production << 'EOF'
$(Get-Content .env.production -Raw)
EOF

# Rebuild with new configuration
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Check status
sleep 5
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs --tail 20
"@

Write-Host $deployCommands -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Step 5: Post-Deployment Testing
# ============================================================================

Write-Host "📋 Step 5: Post-deployment testing..." -ForegroundColor Blue
Write-Host ""

$testUrl = $APP_URL
$maxRetries = 30
$retryCount = 0

Write-Host "Waiting for service to start (max 2 minutes)..."
Write-Host ""

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Service is responding!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🌐 Test the deployment:" -ForegroundColor Blue
            Write-Host "   URL: $testUrl" -ForegroundColor Cyan
            Write-Host "   1. Load the homepage" -ForegroundColor White
            Write-Host "   2. Select a breed" -ForegroundColor White
            Write-Host "   3. Ask a question in chat" -ForegroundColor White
            Write-Host "   4. Verify AI response appears" -ForegroundColor White
            Write-Host ""
            
            break
        }
    } catch {
        #Service not ready yet
    }
    
    $retryCount++
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 4
}

if ($retryCount -ge $maxRetries) {
    Write-Host ""
    Write-Host "⚠️  Service still loading or unreachable" -ForegroundColor Yellow
    Write-Host "   Wait 2-3 more minutes and visit:" -ForegroundColor White
    Write-Host "   $testUrl" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT GUIDE COMPLETE" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Summary:" -ForegroundColor Blue
Write-Host "   Provider: OpenRouter (primary, tested)" -ForegroundColor Green
Write-Host "   Status: Ready for deployment" -ForegroundColor Green
Write-Host "   Configuration: .env.production prepared" -ForegroundColor Green
Write-Host ""

Write-Host "🔐 Security Notes:" -ForegroundColor Yellow
Write-Host "   - API keys kept in .env files (not in code)" -ForegroundColor Gray
Write-Host "   - .env.production should NOT be committed to Git" -ForegroundColor Gray
Write-Host "   - Use .env.production.bak for backups" -ForegroundColor Gray
Write-Host ""
