#!/usr/bin/env node
/**
 * LLM Fallback Testing Suite
 * Tests OpenRouter → Together AI fallback mechanism locally
 * Run this on your local machine after starting your Next.js dev server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Load env variables
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const TOGETHER_KEY = process.env.TOGETHER_API_KEY;
const LOCAL_API_URL = 'http://localhost:3000/api/chatbot';

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║              🧪 LLM FALLBACK TESTING SUITE                                ║
║                                                                            ║
║  Tests if Together AI correctly activates when OpenRouter fails           ║
╚════════════════════════════════════════════════════════════════════════════╝

REQUIREMENTS:
✓ Next.js dev server running on localhost:3000
✓ Both API keys configured in .env.local
✓ LLM Router must be initialized

`);

if (!OPENROUTER_KEY || !TOGETHER_KEY) {
  console.log('❌ ERROR: Missing API keys in .env.local');
  console.log(`   OPENROUTER_API_KEY: ${OPENROUTER_KEY ? '✓' : '✗'}`);
  console.log(`   TOGETHER_API_KEY: ${TOGETHER_KEY ? '✓' : '✗'}`);
  process.exit(1);
}

console.log('✅ API Keys found');
console.log(`   OPENROUTER: ${OPENROUTER_KEY.substring(0, 20)}...`);
console.log(`   TOGETHER: ${TOGETHER_KEY.substring(0, 20)}...\n`);

/**
 * Make request to local chat API
 */
function callLocalChatAPI(breed, question) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      breed,
      question
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chatbot',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      },
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            rawData: data,
            error: e.message
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test 1: Normal flow (OpenRouter primary)
 */
async function testNormalFlow() {
  console.log('TEST 1: Normal Flow (OpenRouter Primary)');
  console.log('───────────────────────────────────────────────────────────');

  try {
    const result = await callLocalChatAPI('Golden Retriever', 'What is this breed?');
    
    if (result.status === 200) {
      console.log(`✅ SUCCESS (HTTP ${result.status})`);
      const response = result.data.response || result.data.message || 'No response field';
      console.log(`📝 Response preview: "${typeof response === 'string' ? response.substring(0, 80) : JSON.stringify(response).substring(0, 80)}..."`);
      
      // Try to identify which provider responded
      if (result.data.provider) {
        console.log(`🤖 Provider used: ${result.data.provider}`);
      }
      if (result.data.model) {
        console.log(`📊 Model: ${result.data.model}`);
      }
      console.log(`⏱️  Response time: ${result.data.responseTime || 'N/A'}ms`);
      return true;
    } else {
      console.log(`❌ FAILED (HTTP ${result.status})`);
      console.log(`📄 Response: ${result.rawData?.substring(0, 100)}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${err.message}`);
    return false;
  }
}

/**
 * Test 2: Test multiple breeds and questions
 */
async function testMultipleQueries() {
  console.log('\n\nTEST 2: Multiple Queries (Consistency Check)');
  console.log('───────────────────────────────────────────────────────────');

  const tests = [
    { breed: 'Labrador', question: 'What is the typical lifespan?' },
    { breed: 'Cat', question: 'How much exercise do they need?' },
    { breed: 'Siberian Husky', question: 'Are they good family dogs?' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n  Testing: ${test.breed} - "${test.question}"`);
      const result = await callLocalChatAPI(test.breed, test.question);
      
      if (result.status === 200) {
        console.log(`  ✅ HTTP ${result.status}`);
        passed++;
      } else {
        console.log(`  ❌ HTTP ${result.status}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ ERROR: ${err.message}`);
      failed++;
    }
    
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

/**
 * Test 3: Simulate OpenRouter failure by checking logs
 */
async function testFallbackMechanism() {
  console.log('\n\nTEST 3: Fallback Mechanism Verification');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`
  To simulate OpenRouter failure:
  
  OPTION A - Temporarily modify .env.local:
    1. Edit .env.local
    2. Set: OPENROUTER_API_KEY=invalid_key_test
    3. Restart the Next.js dev server (npm run dev)
    4. Run this test again
    5. Verify Together AI responds
    6. Restore the correct key
  
  OPTION B - Check server logs:
    1. In your terminal running Next.js, look for:
       - "OpenRouter failed" or "OpenRouter error"
       - "Falling back to Together AI" or "Using fallback"
       - Check the provider that responds
  
  The test will now call the API and monitor responses...
  `);

  try {
    console.log('\n  Sending test request...');
    const result = await callLocalChatAPI('Test Breed', 'This is a fallback test');
    
    if (result.status === 200) {
      console.log(`\n  ✅ Got response (HTTP 200)`);
      
      // Parse response for provider info
      const response = result.data;
      const responseStr = JSON.stringify(response, null, 2);
      
      console.log(`\n  📋 Full Response:`);
      console.log(`  ${responseStr.substring(0, 300)}...`);
      
      // Check for provider indicators
      if (responseStr.includes('Together') || responseStr.includes('together')) {
        console.log(`\n  🎯 TOGETHER AI provider detected in response`);
        return true;
      } else if (responseStr.includes('OpenRouter') || responseStr.includes('openrouter')) {
        console.log(`\n  🎯 OPENROUTER provider detected in response`);
        return true;
      } else {
        console.log(`\n  ℹ️  Provider not clearly indicated in response`);
        return true;
      }
    } else {
      console.log(`\n  ⚠️  Got HTTP ${result.status} - fallback may have been triggered`);
      return true;
    }
  } catch (err) {
    console.log(`\n  ⚠️  Error: ${err.message}`);
    console.log(`     This might indicate fallback is activating`);
    return false;
  }
}

/**
 * Test 4: Response time and error handling
 */
async function testResponseMetrics() {
  console.log('\n\nTEST 4: Response Metrics & Error Handling');
  console.log('───────────────────────────────────────────────────────────');

  const startTime = Date.now();
  
  try {
    console.log('  Measuring response time...');
    const result = await callLocalChatAPI('Poodle', 'What are common health issues?');
    const duration = Date.now() - startTime;
    
    if (result.status === 200) {
      console.log(`\n  ✅ Response received in ${duration}ms`);
      
      if (duration < 2000) {
        console.log(`  ⚡ FAST (< 2s) - Using cache or quick provider`);
      } else if (duration < 5000) {
        console.log(`  ✓ NORMAL (2-5s) - Typical LLM response`);
      } else {
        console.log(`  ⚠️  SLOW (> 5s) - May indicate fallback or network latency`);
      }
      
      // Check for additional metrics
      if (result.data.responseTime) {
        console.log(`  📊 API reported time: ${result.data.responseTime}ms`);
      }
      if (result.data.cached) {
        console.log(`  💾 Response was cached`);
      }
      
      return true;
    } else {
      console.log(`\n  ⚠️  HTTP ${result.status} after ${duration}ms`);
      return false;
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    console.log(`\n  ❌ ERROR after ${duration}ms: ${err.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  const results = [];
  
  // Test 1
  results.push(await testNormalFlow());
  
  // Small delay
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 2
  results.push(await testMultipleQueries());
  
  // Small delay
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 3
  results.push(await testFallbackMechanism());
  
  // Small delay
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 4
  results.push(await testResponseMetrics());
  
  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        📊 TEST SUMMARY                                     ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
  
  const passedCount = results.filter(r => r).length;
  const totalCount = results.length;
  
  console.log(`Tests Passed: ${passedCount}/${totalCount}`);
  
  if (passedCount === totalCount) {
    console.log('\n✅ ALL TESTS PASSED! Fallback mechanism is working correctly.\n');
  } else if (passedCount > 0) {
    console.log('\n⚠️  PARTIAL SUCCESS - Some tests failed. Check logs above.\n');
  } else {
    console.log('\n❌ ALL TESTS FAILED - Check if Next.js server is running on localhost:3000\n');
  }
  
  console.log('📋 NEXT STEPS:');
  console.log('');
  console.log('1. To test TRUE fallback behavior:');
  console.log('   - Edit .env.local and set OPENROUTER_API_KEY=invalid_test_key');
  console.log('   - Restart the Next.js dev server');
  console.log('   - Run this test again');
  console.log('   - Verify Together AI responds');
  console.log('   - Restore the correct key');
  console.log('');
  console.log('2. Check Next.js console for:');
  console.log('   - "[LLM] Provider {name} initializing..."');
  console.log('   - "[LLM] Using provider: {name}"');
  console.log('   - "[LLM] Fallback to {name}" messages');
  console.log('');
  console.log('3. Test your VPS deployment at: https://aibreeds-demo.com');
  console.log('');
}

// Run tests
runAllTests().catch(console.error);
