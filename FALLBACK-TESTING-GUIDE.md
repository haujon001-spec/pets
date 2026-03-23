#!/bin/bash

# LLM Fallback Testing Guide
# How to properly test the fallback mechanism locally

cat << 'EOF'

╔════════════════════════════════════════════════════════════════════════════╗
║        🧪 LOCAL FALLBACK TESTING GUIDE (Step-by-Step)                    ║
╚════════════════════════════════════════════════════════════════════════════╝

PREREQUISITES:
==============
1. Next.js development server running:
   npm run dev
   (Should be on localhost:3000)

2. Valid API keys in .env.local:
   OPENROUTER_API_KEY=sk-or-v1-...
   TOGETHER_API_KEY=...

PHASE 1: TEST NORMAL OPERATION (OpenRouter Primary)
====================================================

Step 1: Start your Next.js dev server
  cd c:\Users\haujo\projects\DEV\pets
  npm run dev
  
  ✓ Should show "ready - started server on 0.0.0.0:3000"
  ✓ Look for message: "✅ LLM Router initialized with 2 providers"

Step 2: Run the automated test
  node test-fallback-local.js
  
  This will:
  - Query the chat API with multiple breeds
  - Display response times
  - Verify both providers are accessible
  
  Expected Output:
  ✅ SUCCESS (HTTP 200)
  📝 Response: "Golden Retriever is a popular breed..."
  ⏱️  Response time: 1200-3500ms


PHASE 2: FORCE FALLBACK BY BREAKING PRIMARY
==============================================

NOW comes the real test - verify Together AI kicks in when OpenRouter fails:

Step 1: Break OpenRouter temporarily
  
  Option A (Edit file):
    1. Open .env.local
    2. Change this line:
       FROM: OPENROUTER_API_KEY=sk-or-v1-8438daf2870e97...
       TO:   OPENROUTER_API_KEY=invalid_test_key_12345
    3. Save the file

Step 2: Restart the dev server
  
  Press Ctrl+C in the terminal running "npm run dev"
  Then run again:
    npm run dev
  
  ✓ Watch the server startup logs CAREFULLY:
    Look for:
    - "[LLM] OpenRouter initialization..."
    - "[LLM-Error] OpenRouter failed: 401 Unauthorized"
    - "[LLM] Falling back to Together AI"
    - Or similar fallback messages

Step 3: Run test again
  
  node test-fallback-local.js
  
  Expected behavior:
  ✅ Test still passes (HTTP 200)
  📝 Response: "Golden Retriever is..."
  🤖 Provider used: Together AI (should see this if logged)
  
  This PROVES Together AI fallback is working!


PHASE 3: MONITOR ACTUAL LOGS
=============================

To really see the fallback in action, watch your dev server logs:

While running "npm run dev", look for patterns like:

  [LLM] 🔄 Initializing LLM Router...
  [LLM] ✓ Provider 1: OpenRouter
  [LLM] ✓ Provider 2: Together AI
  [LLM] Provider order: openrouter,together
  
When you send a chat request with invalid OpenRouter key:
  
  [LLM] Using provider: openrouter
  [LLM-Error] OpenRouter request failed: 401 Unauthorized
  [LLM] ⚠️  Falling back to: together
  [LLM] Using provider: together
  [LLM] ✅ Response: "Golden Retriever is..."

If you see:
  [LLM] Using provider: together
  [LLM] ✅ Response: ...
  
Then FALLBACK IS WORKING! ✅


PHASE 4: RESTORE AND VERIFY
============================

Step 1: Restore the original OpenRouter key
  
  Edit .env.local:
    FROM: OPENROUTER_API_KEY=invalid_test_key_12345
    TO:   OPENROUTER_API_KEY=sk-or-v1-8438daf2870e97...
  
  Save the file

Step 2: Restart dev server
  
  Ctrl+C to stop
  npm run dev
  
  Should see initialization messages again

Step 3: Run final verification test
  
  node test-fallback-local.js
  
  Should be back to normal response times


PHASE 5: TEST ON VPS (BONUS)
=============================

Once local testing confirms fallback works, verify it's working on production:

1. Visit: https://aibreeds-demo.com
2. Open browser DevTools (F12)
3. Go to Console tab
4. Select a breed and ask a question
5. Watch the Network tab for:
   - Request to /api/chatbot
   - Response should have status 200
   - Response time 2-5 seconds
6. Watch Console for any errors:
   - Should NOT see "401 Unauthorized"
   - Should be clear responses


TESTING CHECKLIST
=================

Phase 1 (Normal):
  ☐ Dev server starts successfully
  ☐ "LLM Router initialized with 2 providers" message appears
  ☐ test-fallback-local.js runs and passes
  ☐ Response time is 2-5 seconds
  ☐ No errors in console

Phase 2 (Fallback Trigger):
  ☐ Changed OPENROUTER_API_KEY to invalid value
  ☐ Restarted dev server
  ☐ See "fallback" message in logs
  ☐ test-fallback-local.js still passes
  ☐ Response still comes through (from Together)

Phase 3 (Log Monitoring):
  ☐ Can read provider initialization in logs
  ☐ Can see "falling back" message when primary breaks
  ☐ Together AI responds successfully

Phase 4 (Restore):
  ☐ Restored original OpenRouter key
  ☐ Restarted dev server
  ☐ test-fallback-local.js passes again
  ☐ Response times and quality restored

Phase 5 (VPS):
  ☐ Website loads without errors
  ☐ Chat responds with breed information
  ☐ No 401 errors visible


WHAT SHOULD YOU SEE?
====================

GOOD SIGNS (Fallback Working):
✅ Response status: 200
✅ Response time: 2-5 seconds
✅ Contains breed information
✅ Console shows correct provider being used
✅ When primary breaks, still get responses
✅ Logs show "falling back to" message

BAD SIGNS (Problems):
❌ Response status: 401 (auth error)
❌ Response status: 502/503 (service down)
❌ Response time: > 30 seconds
❌ Empty or error responses
❌ No "fallback" message when primary broken
❌ Test fails after breaking OpenRouter


DEBUGGING IF ISSUES OCCUR
==========================

Issue: "Cannot connect to localhost:3000"
  → Make sure "npm run dev" is running in another terminal
  → Check port 3000 is not blocked by firewall

Issue: API keys not loading
  → Verify .env.local exists in project root
  → Keys should be on single lines (no line breaks)
  → Restart dev server after changing .env.local

Issue: "test-fallback-local.js" fails
  → Check Node.js is installed: node --version
  → Make sure dev server is running
  → Check console output for error messages

Issue: Fallback not triggering when OpenRouter is invalid
  → Check that LLM Router has both providers initialized
  → Verify Together AI key is valid
  → Check console logs for which provider fails
  → Ensure provider order is: openrouter,together

Issue: Together AI not working as fallback
  → Verify TOGETHER_API_KEY is set in .env.local
  → Check Together key is valid (64 characters)
  → Temporarily break both keys to see actual error


KEY FILES FOR REFERENCE
=======================

Main test script:
  test-fallback-local.js

Your local env:
  .env.local
  (Keep this file secret - don't commit to git)

LLM Router code (for reference):
  src/lib/llm-router.ts or similar
  Look for provider initialization and fallback logic

Next.js config:
  next.config.ts
  Look for LLM initialization code


QUICK COMMANDS
==============

Start dev server:
  npm run dev

Run fallback test:
  node test-fallback-local.js

View env variables:
  cat .env.local

Restart everything:
  Ctrl+C (stop dev server)
  npm run dev (start again)

Check API keys are loaded:
  In browser console while on localhost:3000:
  fetch('/api/chatbot', {method: 'POST', body: JSON.stringify({breed, question})})
    .then(r => r.json())
    .then(d => console.log(d))


EXPECTED SUCCESS OUTCOME
========================

After completing all phases:

✅ OpenRouter works as primary provider
✅ Together AI is available as fallback
✅ When OpenRouter breaks, Together handles requests
✅ Both provide valid breed information
✅ Response times are consistent (2-5s)
✅ No authentication errors
✅ Website is fully functional
✅ Ready for production deployment


Questions? Check the logs!
==========================

Your most important tool is the LOGS:

1. npm run dev console output:
   - Shows provider initialization
   - Shows which provider is used
   - Shows fallback messages
   - Shows errors if they occur

2. Browser console (F12):
   - Shows any frontend errors
   - Shows API response status
   - Shows response timing

3. Browser Network tab (F12):
   - Shows /api/chatbot request details
   - Shows response status code
   - Shows response time
   - Shows response body

Always check these THREE places when troubleshooting!

EOF
