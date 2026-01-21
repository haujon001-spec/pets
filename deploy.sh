#!/bin/bash

################################################################################
# QUICK START - Production Deployment
#
# This is a simplified wrapper that runs the full deployment script
# with pre-configured settings for aibreeds-demo.com
################################################################################

echo "🚀 Starting production deployment to aibreeds-demo.com..."
echo ""

# Set VPS configuration (edit these if needed)
export VPS_HOST="aibreeds-demo.com"
export VPS_USER="deploy"
export VPS_PATH="/var/www/aibreeds"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  WARNING: .env.production not found"
    echo ""
    echo "Please create .env.production with:"
    echo "  TOGETHER_API_KEY=your_together_ai_key"
    echo "  OPENROUTER_API_KEY=your_openrouter_key"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

echo "📋 Deployment Configuration:"
echo "   VPS Host: $VPS_HOST"
echo "   VPS User: $VPS_USER"
echo "   VPS Path: $VPS_PATH"
echo ""

read -p "Start deployment? (Y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Run the full deployment script
bash scripts/deploy-production.sh

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your site is live at: https://$VPS_HOST"
    echo "📊 Health check: https://$VPS_HOST/api/health"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test all languages: https://$VPS_HOST/?locale=vi"
    echo "   2. Monitor logs: ssh $VPS_USER@$VPS_HOST 'cd $VPS_PATH && docker-compose logs -f'"
    echo "   3. Check health: curl https://$VPS_HOST/api/health"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Check deployment logs in project directory"
    echo "   2. Run health check: npm run health:phase6"
    echo "   3. See docs/DEPLOYMENT-GUIDE.md for help"
    echo ""
    exit 1
fi
