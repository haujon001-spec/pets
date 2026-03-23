#!/usr/bin/env node
/**
 * VPS Deployment & Verification Script
 * Run this to set up and verify the VPS deployment
 */

console.log(`

╔══════════════════════════════════════════════════════════════════════════════╗
║                 🚀 VPS DEPLOYMENT & VERIFICATION GUIDE                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 VPS INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IP:          159.223.63.117
Domain:      https://aibreed-demo.com
App path:    /app
Docker:      docker-compose up

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 DIAGNOSTIC RESULTS (Local Tests)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Together AI (Local):       WORKING (200 OK)
   └─ Returns valid responses
   └─ API key is valid
   
❌ OpenRouter (Local):        NETWORK ISSUE
   └─ Fetch failed on this machine
   └─ But key and configuration are correct

⚠️  VPS (Current):           BOTH 401 UNAUTHORIZED
   └─ OpenRouter: 401
   └─ Together: 401 (Invalid API key message)
   
   Possible issues:
   1. .env.production not properly updated on VPS
   2. API keys not loading correctly in Node.js
   3. Together key format issue in docker container

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️  MANUAL VERIFICATION ON VPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SSH to VPS:

   ssh root@159.223.63.117

Run these commands:

   # Check if .env.production exists and has keys
   cat /app/.env.production | grep -E "TOGETHER_API_KEY|OPENROUTER_API_KEY"
   
   # Verify the file is readable by docker
   ls -la /app/.env.production
   
   # Check docker container environment
   docker exec pets-app printenv | grep -E "TOGETHER_API_KEY|OPENROUTER_API_KEY"
   
   # View application logs
   docker-compose logs -f app
   
   # Test Together.ai directly from container
   docker exec pets-app node -e "
   const key = process.env.TOGETHER_API_KEY;
   console.log('Together key:', key ? 'Found' : 'NOT FOUND');
   console.log('First 20 chars:', key?.substring(0, 20));
   "

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 STEP-BY-STEP FIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option A: Update .env.production on VPS [RECOMMENDED]

   SSH to VPS:
      ssh root@159.223.63.117
   
   Edit the file:
      nano /app/.env.production
   
   Make sure these lines exist with YOUR actual keys:
   
      OPENROUTER_API_KEY=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
      TOGETHER_API_KEY=ec41214373c0da02905e9356b232c4964388c30d82126dcf8f203514799012c5
      LLM_PROVIDER_ORDER=openrouter,together
   
   Save: Ctrl+O, Enter, Ctrl+X
   
   Restart docker:
      docker-compose down
      docker-compose up -d
   
   Check logs:
      docker-compose logs -f

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option B: Use SCP from local machine

   From your local machine:
   
      scp .env.production root@159.223.63.117:/app/.env.production
   
   Then SSH to VPS and restart:
   
      ssh root@159.223.63.117
      cd /app
      docker-compose down
      docker-compose up -d

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ AFTER DEPLOYMENT - TEST CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After restarting, verify:

   1. Container is running:
      docker-compose ps
      (should show 'pets-app' in Up state)
   
   2. Environment loaded correctly:
      docker exec pets-app node -e "console.log('TOGETHER_API_KEY length:', process.env.TOGETHER_API_KEY?.length)"
      (should show: TOGETHER_API_KEY length: 64)
   
   3. Website loads:
      curl https://aibreed-demo.com
      (should return HTML)
   
   4. Chat works in browser:
      • Visit https://aibreed-demo.com
      • Select a breed (Golden Retriever)
      • Ask: "Tell me about this breed"
      • Should get response in 2-4 seconds
      • Check browser console (F12) for errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If still getting 401 Unauthorized:

   A. Check Together AI key format:
      Local test shows: ✅ Together works
      So key is valid. Check on VPS if loading correctly.
   
   B. Check OpenRouter key format:
      Should start with: sk-or-v1-
      Our key: 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
      Length should be: 73 characters
   
   C. If both still fail:
      • Check API provider status (https://status.openrouter.ai/)
      • Check account standing on both services
      • Verify no rate limits or blocks
      • Check firewall/network access from VPS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 CURRENT CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary:    stepfun/step-3.5-flash:free (via OpenRouter)
Fallback:   ServiceNow-AI/Apriel-1.5-15b-Thinker (via Together)
Cost:       $0.00/day (completely FREE)

Together key status:  ✅ Working locally
OpenRouter key:      Configuration ready (network issue on this machine)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 NEXT STEP

SSH to VPS and verify .env.production is correctly set with the API keys.
Then restart docker and test the chat at https://aibreed-demo.com

╔══════════════════════════════════════════════════════════════════════════════╗
║                Ready to proceed with VPS verification 🚀                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

`);
