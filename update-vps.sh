#!/bin/bash

################################################################################
# VPS Update Script - Phase 6 Deployment
# Run this script on your VPS to update to Phase 6
################################################################################

echo "🚀 Starting Phase 6 Deployment on VPS..."
echo ""

# Go to pets directory
cd ~/pets || { echo "❌ pets directory not found"; exit 1; }

# Show current status
echo "📊 Current status:"
docker ps
echo ""

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker stop pet-portal caddy
docker rm pet-portal caddy
echo "✅ Old containers removed"
echo ""

# Rebuild Docker image
echo "🔨 Building new Docker image with Phase 6 features..."
echo "This may take 2-3 minutes..."
docker build -f Dockerfile.prod -t pet-portal:latest .
echo "✅ Docker image built"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo "Creating .env file - PLEASE EDIT WITH YOUR API KEYS:"
    cat > .env <<'EOF'
TOGETHER_API_KEY=your_together_ai_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
EOF
    echo "Run: nano .env"
    echo "Then restart this script"
    exit 1
fi

# Start new containers
echo "🚢 Starting new containers..."

# Start app container
docker run -d \
  --name pet-portal \
  --restart unless-stopped \
  --env-file .env \
  -e NODE_ENV=production \
  -p 3000:3000 \
  pet-portal:latest

# Start Caddy container  
docker run -d \
  --name caddy \
  --restart unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  -v caddy_config:/config \
  caddy:2

echo "✅ Containers started"
echo ""

# Wait a bit for containers to start
echo "⏳ Waiting for services to start..."
sleep 10

# Show status
echo "📊 New container status:"
docker ps
echo ""

# Test the application
echo "🧪 Testing application..."
sleep 5
curl -s http://localhost:3000 > /dev/null && echo "✅ App responding on port 3000" || echo "❌ App not responding"
curl -s http://localhost > /dev/null && echo "✅ Caddy responding on port 80" || echo "❌ Caddy not responding"

# Show logs
echo ""
echo "📋 Application logs (last 20 lines):"
docker logs --tail 20 pet-portal

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🎉 Phase 6 Deployment Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ New Features Deployed:"
echo "   • 12 languages (added Vietnamese & Chinese Traditional)"
echo "   • LLM-powered breed info translation"
echo "   • Vision AI image verification"
echo "   • 66 comprehensive health checks"
echo ""
echo "🌐 Test your site:"
echo "   • https://aibreeds-demo.com"
echo "   • https://aibreeds-demo.com/?locale=vi (Vietnamese)"
echo "   • https://aibreeds-demo.com/?locale=zh-tw (Chinese Traditional)"
echo "   • https://aibreeds-demo.com/api/health"
echo ""
echo "📝 View logs:"
echo "   docker logs -f pet-portal"
echo ""
echo "🔄 Restart if needed:"
echo "   docker restart pet-portal caddy"
echo ""
