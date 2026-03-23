#!/bin/bash
# VPS Diagnostic & Fix Script
# Copy and paste this on your VPS (ssh root@159.223.63.117)

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     VPS DIAGNOSTIC & LLM FIX SCRIPT                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check if .env.production exists
echo "Step 1: Checking .env.production..."
if [ -f /app/.env.production ]; then
    echo "✅ .env.production exists"
    echo ""
    echo "Current API keys in .env.production:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    grep -E "TOGETHER_API_KEY|OPENROUTER_API_KEY" /app/.env.production || echo "⚠️  Keys not found!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ .env.production NOT found at /app/.env.production"
    echo "Creating it now..."
fi

echo ""
echo "Step 2: Checking Docker container..."

if docker ps | grep -q pets-app; then
    echo "✅ Docker container 'pets-app' is running"
    
    echo ""
    echo "Step 3: Checking environment variables in container..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    TOGETHER_KEY=$(docker exec pets-app sh -c 'echo $TOGETHER_API_KEY' 2>/dev/null || echo "NOT_FOUND")
    OPENROUTER_KEY=$(docker exec pets-app sh -c 'echo $OPENROUTER_API_KEY' 2>/dev/null || echo "NOT_FOUND")
    
    echo "Together key in container: $TOGETHER_KEY"
    echo "OpenRouter key in container: $OPENROUTER_KEY"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ "$TOGETHER_KEY" = "NOT_FOUND" ] || [ "$OPENROUTER_KEY" = "NOT_FOUND" ]; then
        echo ""
        echo "⚠️  API keys not loaded in container!"
        echo "This means .env.production is missing or not being read."
    fi
    
else
    echo "❌ Docker container 'pets-app' is NOT running"
    echo "Starting containers..."
    cd /app
    docker-compose up -d
fi

echo ""
echo "Step 4: Viewing application logs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose -f /app/docker-compose.yml logs --tail=20 app 2>/dev/null | grep -i "llm\|api\|error" || echo "No relevant logs found"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    DIAGNOSTIC COMPLETE                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
