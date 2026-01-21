#!/usr/bin/env pwsh

################################################################################
# Alternative Deployment - Using Docker Hub
#
# This deployment method:
# 1. Builds Docker image locally
# 2. Pushes to Docker Hub
# 3. VPS pulls from Docker Hub
# 
# Easier than direct SSH transfer for first-time setup
################################################################################

param(
    [string]$DockerHubUser = "haujon001",  # Change this to your Docker Hub username
    [string]$ImageName = "aibreeds-portal"
)

Write-Host ""
Write-Host "🚀 Docker Hub Deployment to VPS" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if logged into Docker Hub
Write-Host "📦 Checking Docker Hub login..." -ForegroundColor Blue
$dockerInfo = docker info 2>&1 | Select-String "Username"
if ($dockerInfo) {
    Write-Host "✅ Logged into Docker Hub" -ForegroundColor Green
} else {
    Write-Host "⚠️  Not logged into Docker Hub" -ForegroundColor Yellow
    Write-Host "Please run: docker login" -ForegroundColor Yellow
    Write-Host ""
    $login = Read-Host "Login now? (Y/n)"
    if ($login -ne "n") {
        docker login
    } else {
        Write-Host "❌ Cannot proceed without Docker Hub login" -ForegroundColor Red
        exit 1
    }
}

# Run health checks
Write-Host ""
Write-Host "🏥 Running health checks..." -ForegroundColor Blue
npm run health:phase6
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Health check failed" -ForegroundColor Red
    exit 1
}

# Build production bundle
Write-Host ""
Write-Host "🔨 Building production bundle..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Build Docker image
Write-Host ""
Write-Host "🐳 Building Docker image..." -ForegroundColor Blue
$imageTag = "${DockerHubUser}/${ImageName}:latest"
docker build -f Dockerfile.prod -t $imageTag .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built: $imageTag" -ForegroundColor Green

# Push to Docker Hub
Write-Host ""
Write-Host "☁️  Pushing to Docker Hub..." -ForegroundColor Blue
docker push $imageTag
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker push failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Image pushed to Docker Hub" -ForegroundColor Green

# Generate deployment instructions for VPS
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 VPS DEPLOYMENT INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run these commands on your VPS server:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# 1. Create deployment directory" -ForegroundColor Gray
Write-Host "mkdir -p /var/www/aibreeds && cd /var/www/aibreeds" -ForegroundColor White
Write-Host ""
Write-Host "# 2. Create docker-compose.yml" -ForegroundColor Gray
Write-Host @"
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    image: ${imageTag}
    container_name: aibreeds-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - TOGETHER_API_KEY=\${TOGETHER_API_KEY}
      - OPENROUTER_API_KEY=\${OPENROUTER_API_KEY}
    networks:
      - aibreeds-network

  caddy:
    image: caddy:latest
    container_name: aibreeds-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - aibreeds-network

networks:
  aibreeds-network:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
EOF
"@ -ForegroundColor White
Write-Host ""
Write-Host "# 3. Create Caddyfile" -ForegroundColor Gray
Write-Host @"
cat > Caddyfile << 'EOF'
aibreeds-demo.com {
    reverse_proxy app:3000
    encode gzip
    log {
        output file /var/log/caddy/access.log
    }
}
EOF
"@ -ForegroundColor White
Write-Host ""
Write-Host "# 4. Create .env file with your API keys" -ForegroundColor Gray
Write-Host @"
cat > .env << 'EOF'
TOGETHER_API_KEY=your_together_ai_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
EOF
"@ -ForegroundColor White
Write-Host ""
Write-Host "# 5. Start the containers" -ForegroundColor Gray
Write-Host "docker-compose pull && docker-compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "# 6. Check status" -ForegroundColor Gray
Write-Host "docker-compose ps" -ForegroundColor White
Write-Host "docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Image ready on Docker Hub!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Save these instructions to a file:" -ForegroundColor Yellow
$instructions = @"

VPS Deployment Commands
========================

1. SSH to your VPS:
   ssh root@your-vps-ip

2. Run these commands:

mkdir -p /var/www/aibreeds && cd /var/www/aibreeds

# Create docker-compose.yml
cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'
services:
  app:
    image: ${imageTag}
    container_name: aibreeds-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - TOGETHER_API_KEY=`${TOGETHER_API_KEY}
      - OPENROUTER_API_KEY=`${OPENROUTER_API_KEY}
    networks:
      - aibreeds-network
  caddy:
    image: caddy:latest
    container_name: aibreeds-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - aibreeds-network
networks:
  aibreeds-network:
    driver: bridge
volumes:
  caddy_data:
  caddy_config:
COMPOSE_EOF

# Create Caddyfile
cat > Caddyfile << 'CADDY_EOF'
aibreeds-demo.com {
    reverse_proxy app:3000
    encode gzip
    log {
        output file /var/log/caddy/access.log
    }
}
CADDY_EOF

# Create .env (EDIT WITH YOUR KEYS)
nano .env
# Add:
# TOGETHER_API_KEY=your_key
# OPENROUTER_API_KEY=your_key

# Pull and start
docker-compose pull
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
"@

$instructions | Out-File -FilePath "vps-deployment-instructions.txt" -Encoding UTF8
Write-Host "📄 Instructions saved to: vps-deployment-instructions.txt" -ForegroundColor Green
Write-Host ""

# Open the file
if (Test-Path "vps-deployment-instructions.txt") {
    Write-Host "Opening instructions file..." -ForegroundColor Blue
    Start-Process notepad "vps-deployment-instructions.txt"
}

Write-Host "🎉 Ready for VPS deployment!" -ForegroundColor Green
Write-Host ""
