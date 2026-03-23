#!/usr/bin/env node
/**
 * COMPLETE VPS FIX - COPY/PASTE GUIDE
 * Exact commands to run on your VPS
 */

console.log(`

╔════════════════════════════════════════════════════════════════════════════╗
║            🚀 COMPLETE VPS FIX GUIDE - COPY & PASTE COMMANDS             ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

📋 STEP 1: Connect to VPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run this in your terminal (on your local machine):

    ssh root@159.223.63.117

(Enter your VPS root password)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 STEP 2: Run Diagnostic (Optional - to see current status)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copy and paste this into your VPS terminal:

    cd /app
    bash -c '
    echo "Checking API keys..."
    grep -E "TOGETHER_API_KEY|OPENROUTER_API_KEY" /app/.env.production | head -2
    echo ""
    echo "Checking Docker container..."
    docker ps | grep pets-app
    echo ""
    echo "Checking keys in running container..."
    docker exec pets-app sh -c "echo Together key: \${TOGETHER_API_KEY:0:20}... && echo OpenRouter key: \${OPENROUTER_API_KEY:0:20}..."
    '

Expected output:
    ✅ If keys show up = Good
    ❌ If "NOT_FOUND" or empty = Need to fix

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 STEP 3: Fix the Issue (Main Fix)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copy and paste THIS ENTIRE BLOCK into your VPS terminal:

    cd /app && cat > .env.production << 'EOF'
# Production Environment Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://aibreed-demo.com

# Together AI (FREE - Fallback Provider)
TOGETHER_API_KEY=ec41214373c0da02905e9356b232c4964388c30d82126dcf8f203514799012c5

# OpenRouter (PRIMARY - Step 3.5 Flash FREE)
OPENROUTER_API_KEY=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

# LLM Configuration
LLM_PROVIDER_ORDER=openrouter,together

# IMAGE API KEYS
CAT_API_KEY=your_cat_api_key_here
UNSPLASH_ACCESS_KEY=your_unsplash_key_here
PEXELS_API_KEY=your_pexels_key_here

# Cache
CACHE_EXPIRATION_DAYS=7
EOF
    
    echo "✅ .env.production created/updated"

    # Restart containers
    echo "Restarting Docker containers..."
    docker-compose down
    sleep 2
    docker-compose pull
    docker-compose up -d
    sleep 3
    
    echo "✅ Containers restarted"
    echo ""
    
    # Verify keys loaded
    echo "Verifying keys loaded in container..."
    docker exec pets-app sh -c "echo 'Together key (should show 64 chars): '\${#TOGETHER_API_KEY} && echo 'OpenRouter key (should show 73 chars): '\${#OPENROUTER_API_KEY}"

After this runs successfully, you should see:
    Together key (should show 64 chars): 64
    OpenRouter key (should show 73 chars): 73

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 STEP 4: Final Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copy and paste this to verify:

    cd /app && docker-compose logs --tail=30 app | grep -i "llm\|error\|ready"

Expected: Should show application logs without "401" errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ STEP 5: Test in Browser
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(Exit SSH first by typing: exit)

1. Open browser and go to: https://aibreed-demo.com

2. You should see the website load

3. Select a dog breed (e.g., Golden Retriever)

4. Ask a question: "Tell me about this breed"

5. Wait 2-4 seconds for AI response

Expected response:
    "Golden Retrievers are friendly, intelligent, and devoted family dogs..."

If you see this:
    ✅ LLM is working! System fixed!

If you see error:
    ❌ Check docker logs: docker-compose logs -f

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆘 TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If still seeing 401 after fix:

    1. Check keys are in file:
       cat /app/.env.production

    2. Check keys in container:
       docker exec pets-app node -e "console.log(process.env.TOGETHER_API_KEY?.length)"

    3. View full logs:
       docker-compose logs app

    4. Restart fresh:
       docker-compose down
       docker-compose rm -f
       docker-compose up -d

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 QUICK REFERENCE - Common VPS Commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Connect to VPS:
    ssh root@159.223.63.117

View live logs:
    docker-compose -f /app/docker-compose.yml logs -f app

Restart containers:
    cd /app && docker-compose restart

Check container status:
    docker-compose ps

View environment in container:
    docker exec pets-app printenv | grep API_KEY

Fix and restart (all in one):
    cd /app && docker-compose down && docker-compose up -d && sleep 3 && docker-compose logs --tail=10 app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Summary:
1. SSH to VPS
2. Copy/paste Step 3 fix script
3. Check output shows correct key lengths
4. Test browser at https://aibreed-demo.com
5. Done! ✅

╔════════════════════════════════════════════════════════════════════════════╗
║                     Ready to fix! Copy and paste away 🚀                  ║
╚════════════════════════════════════════════════════════════════════════════╝

`);
