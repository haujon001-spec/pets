#!/bin/bash
# VPS Quick Fix Script
# Updates .env.production with correct API keys and restarts Docker
# Run on VPS: bash /app/fix-llm-keys.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     VPS LLM KEYS FIX SCRIPT                                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

cd /app

echo "Step 1: Backing up existing .env.production..."
cp /app/.env.production /app/.env.production.backup.$(date +%s)
echo "✅ Backup created"
echo ""

echo "Step 2: Updating .env.production with correct API keys..."

# Update Together key if different
sed -i 's/TOGETHER_API_KEY=.*/TOGETHER_API_KEY=ec41214373c0da02905e9356b232c4964388c30d82126dcf8f203514799012c5/' /app/.env.production

# Update OpenRouter key if different  
sed -i 's/OPENROUTER_API_KEY=.*/OPENROUTER_API_KEY=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/' /app/.env.production

# Update provider order
sed -i 's/LLM_PROVIDER_ORDER=.*/LLM_PROVIDER_ORDER=openrouter,together/' /app/.env.production

echo "✅ API keys updated"
echo ""

echo "Step 3: Verifying keys in file..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -E "TOGETHER_API_KEY|OPENROUTER_API_KEY|LLM_PROVIDER_ORDER" /app/.env.production
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Step 4: Restarting Docker containers..."
docker-compose down
sleep 2
docker-compose up -d
sleep 3
echo "✅ Containers restarted"
echo ""

echo "Step 5: Verifying keys are loaded in container..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOGETHER_LEN=$(docker exec pets-app sh -c 'echo ${#TOGETHER_API_KEY}' 2>/dev/null || echo "0")
OPENROUTER_LEN=$(docker exec pets-app sh -c 'echo ${#OPENROUTER_API_KEY}' 2>/dev/null || echo "0")

echo "Together key length in container: $TOGETHER_LEN (should be 64)"
echo "OpenRouter key length in container: $OPENROUTER_LEN (should be 73)"

if [ "$TOGETHER_LEN" = "64" ] && [ "$OPENROUTER_LEN" = "73" ]; then
    echo "✅ Keys loaded successfully!"
else
    echo "⚠️  Keys may not be loading correctly"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Step 6: Testing LLM connectivity..."
echo "Running test from inside container..."
docker exec pets-app node -e "
const http = require('https');
const data = JSON.stringify({model: 'ServiceNow-AI/Apriel-1.5-15b-Thinker', messages: [{role: 'user', content: 'test'}], max_tokens: 10});
const req = http.request({hostname: 'api.together.xyz', port: 443, path: '/v1/chat/completions', method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.TOGETHER_API_KEY, 'Content-Length': data.length}}, (res) => {
  console.log('Together AI Status:', res.statusCode);
  if(res.statusCode === 200) console.log('✅ Together AI responding');
  else console.log('⚠️  Status ' + res.statusCode);
});
req.write(data);
req.end();
" 2>&1 | head -5

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    FIX COMPLETE                                ║"
echo "║                                                                ║"
echo "║  Next: Visit https://aibreed-demo.com and test the chat       ║"
echo "║  Select a breed and ask a question                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
