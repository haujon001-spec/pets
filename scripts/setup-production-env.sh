#!/bin/bash
# VPS Production Environment Setup Script
# Run this ONCE on first deployment to configure API keys

set -e

echo "================================================"
echo "🔐 Production Environment Setup"
echo "================================================"
echo ""
echo "This script will configure your production API keys."
echo "You only need to run this ONCE per VPS deployment."
echo ""

# Check if .env already exists
if [ -f "/root/pets/.env" ]; then
    echo "⚠️  Warning: /root/pets/.env already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

echo "Enter your API keys (press Enter to skip optional keys):"
echo ""

# Together AI (Required)
read -p "Together AI API Key (required): " TOGETHER_KEY
while [ -z "$TOGETHER_KEY" ]; do
    echo "❌ Together AI API key is required!"
    read -p "Together AI API Key: " TOGETHER_KEY
done

# OpenRouter (Optional but recommended)
read -p "OpenRouter API Key (recommended): " OPENROUTER_KEY

# Hugging Face (Optional)
read -p "Hugging Face Token (optional): " HUGGINGFACE_KEY

echo ""
echo "Creating production .env file..."

# Copy template and replace placeholders
cd /root/pets
cp .env.production.template .env

# Replace API keys using sed
sed -i "s|your_together_api_key_here|$TOGETHER_KEY|g" .env
sed -i "s|your_openrouter_api_key_here|${OPENROUTER_KEY:-your_openrouter_api_key_here}|g" .env
sed -i "s|your_huggingface_token_here|${HUGGINGFACE_KEY:-your_huggingface_token_here}|g" .env

# Update docker-compose.yml to use .env file (if not already configured)
if ! grep -q "env_file:" docker-compose.yml; then
    echo "⚠️  Warning: docker-compose.yml doesn't reference .env file"
    echo "You may need to manually add 'env_file: .env' to the app service"
fi

echo ""
echo "✅ Production environment configured successfully!"
echo ""
echo "API Keys Set:"
echo "  - Together AI: ✓"
[ -n "$OPENROUTER_KEY" ] && echo "  - OpenRouter: ✓" || echo "  - OpenRouter: (skipped)"
[ -n "$HUGGINGFACE_KEY" ] && echo "  - Hugging Face: ✓" || echo "  - Hugging Face: (skipped)"
echo ""
echo "Next steps:"
echo "  1. Run: docker compose up -d --force-recreate app"
echo "  2. Test: curl http://localhost:3000/api/health"
echo ""
echo "================================================"
