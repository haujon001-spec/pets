# Simple Docker Hub Deployment Script

Write-Host ""
Write-Host "🚀 Docker Hub Deployment" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DockerHubUser = "haujon001"  # Change to your Docker Hub username
$ImageName = "aibreeds-portal"
$ImageTag = "${DockerHubUser}/${ImageName}:latest"

# Step 1: Check Docker login
Write-Host "Step 1: Checking Docker login..." -ForegroundColor Yellow
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green

# Step 2: Run health checks
Write-Host ""
Write-Host "Step 2: Running health checks..." -ForegroundColor Yellow
npm run health:phase6
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Health checks failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Health checks passed" -ForegroundColor Green

# Step 3: Build Next.js
Write-Host ""
Write-Host "Step 3: Building Next.js production bundle..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

# Step 4: Build Docker image
Write-Host ""
Write-Host "Step 4: Building Docker image: $ImageTag..." -ForegroundColor Yellow
docker build -f Dockerfile.prod -t $ImageTag .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker image built" -ForegroundColor Green

# Step 5: Login to Docker Hub
Write-Host ""
Write-Host "Step 5: Logging into Docker Hub..." -ForegroundColor Yellow
Write-Host "Please enter your Docker Hub credentials:" -ForegroundColor Cyan
docker login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker login failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Logged into Docker Hub" -ForegroundColor Green

# Step 6: Push to Docker Hub
Write-Host ""
Write-Host "Step 6: Pushing to Docker Hub..." -ForegroundColor Yellow
docker push $ImageTag
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Image pushed to Docker Hub successfully!" -ForegroundColor Green

# Generate VPS instructions
$vpsInstructions = @"
═══════════════════════════════════════════════════════════════
VPS DEPLOYMENT INSTRUCTIONS
═══════════════════════════════════════════════════════════════

Your Docker image is ready: $ImageTag

NOW RUN THESE COMMANDS ON YOUR VPS:

1. SSH to your VPS:
   ssh root@aibreeds-demo.com

2. Create deployment directory:
   mkdir -p /var/www/aibreeds && cd /var/www/aibreeds

3. Create docker-compose.yml:
   cat > docker-compose.yml <<'EOF'
version: '3.8'
services:
  app:
    image: $ImageTag
    container_name: aibreeds-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - TOGETHER_API_KEY=$`{TOGETHER_API_KEY}
      - OPENROUTER_API_KEY=$`{OPENROUTER_API_KEY}
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

4. Create Caddyfile:
   cat > Caddyfile <<'EOF'
aibreeds-demo.com {
    reverse_proxy app:3000
    encode gzip
    log {
        output file /var/log/caddy/access.log
    }
}
EOF

5. Create .env file (ADD YOUR API KEYS):
   nano .env
   
   Then add these lines:
   TOGETHER_API_KEY=your_together_ai_key
   OPENROUTER_API_KEY=your_openrouter_key
   
   Save with Ctrl+X, then Y, then Enter

6. Pull image and start containers:
   docker-compose pull
   docker-compose up -d

7. Check status:
   docker-compose ps
   docker-compose logs -f

8. Test your site:
   curl https://aibreeds-demo.com
   
═══════════════════════════════════════════════════════════════
QUICK COPY-PASTE VERSION:
═══════════════════════════════════════════════════════════════

mkdir -p /var/www/aibreeds && cd /var/www/aibreeds
# Now create the files above, then run:
docker-compose pull && docker-compose up -d

═══════════════════════════════════════════════════════════════
"@

Write-Host ""
Write-Host $vpsInstructions

# Save to file
$vpsInstructions | Out-File -FilePath "VPS-DEPLOYMENT-STEPS.txt" -Encoding UTF8

Write-Host ""
Write-Host "✅ Instructions saved to: VPS-DEPLOYMENT-STEPS.txt" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open VPS-DEPLOYMENT-STEPS.txt (opening now...)" -ForegroundColor White
Write-Host "2. SSH to your VPS server" -ForegroundColor White
Write-Host "3. Follow the instructions in the file" -ForegroundColor White
Write-Host ""

# Open the instructions file
Start-Process notepad "VPS-DEPLOYMENT-STEPS.txt"

Write-Host "🎉 Docker image ready for deployment!" -ForegroundColor Green
Write-Host ""
