#!/bin/bash
# Quick Deployment Script
# Usage: bash scripts/quick-deploy.sh

set -e

VPS_HOST="159.223.63.117"
VPS_USER="root"
VPS_PATH="/root/pets"

echo "=========================================="
echo "  Quick Deploy to Production VPS"
echo "=========================================="
echo ""

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

# Deploy to VPS
echo "🚀 Deploying to VPS..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
  cd /root/pets
  
  echo "📥 Pulling latest code..."
  git pull origin main
  
  echo "🐳 Restarting containers..."
  docker compose down
  docker compose up -d --build
  
  echo "⏳ Waiting for application to start..."
  sleep 10
  
  echo "🏥 Checking health..."
  curl -f http://localhost:3000/api/health && echo "" || echo "❌ Health check failed"
  
  echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "=========================================="
echo "  Deployment Successful!"
echo "=========================================="
echo ""
echo "🌐 Test at: https://aibreeds-demo.com"
echo "📊 Health: https://aibreeds-demo.com/api/health"
echo ""
