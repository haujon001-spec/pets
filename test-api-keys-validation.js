#!/usr/bin/env node
/**
 * Test OpenRouter & Together AI API Keys
 * 
 * This script validates both OpenRouter and Together AI API keys before deployment
 * Tests with FREE serverless models to avoid "model not available" errors
 */

const fs = require('fs');
const https = require('https');

// Read .env.local directly
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envLines = envContent.split('\n');
let OPENROUTER_KEY = '';
let TOGETHER_KEY = '';

for (const line of envLines) {
  if (line.startsWith('OPENROUTER_API_KEY=')) {
    OPENROUTER_KEY = line.split('=')[1].trim();
  }
  if (line.startsWith('TOGETHER_API_KEY=')) {
    TOGETHER_KEY = line.split('=')[1].trim();
  }
}

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║         🧪 OPENROUTER & TOGETHER AI API VALIDATION TEST                   ║
║                                                                            ║
║      Test your API keys with FREE SERVERLESS MODELS before deployment    ║
╚════════════════════════════════════════════════════════════════════════════╝

Testing at: ${new Date().toISOString()}
`);

// Validate keys exist
console.log('🔑 CHECKING API KEYS');
console.log('──────────────────────────────────────────────────────────────');

if (!OPENROUTER_KEY) {
  console.error('❌ CRITICAL: OPENROUTER_API_KEY not found in .env.local');
  process.exit(1);
}

if (!TOGETHER_KEY) {
  console.error('❌ CRITICAL: TOGETHER_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ OpenRouter API Key found');
console.log(`   Key prefix: ${OPENROUTER_KEY.substring(0, 10)}...${OPENROUTER_KEY.substring(OPENROUTER_KEY.length - 5)}`);
console.log(`   Key length: ${OPENROUTER_KEY.length} characters`);
console.log('');

console.log('✅ Together API Key found');
console.log(`   Key prefix: ${TOGETHER_KEY.substring(0, 10)}...${TOGETHER_KEY.substring(TOGETHER_KEY.length - 5)}`);
console.log(`   Key length: ${TOGETHER_KEY.length} characters`);
console.log('');

/**
 * Test OpenRouter with Step 3.5 Flash (FREE via StepFun)
 */
async function testOpenRouter() {
  return new Promise((resolve) => {
    console.log('📝 Testing OpenRouter - Step 3.5 Flash (FREE)');
    console.log('──────────────────────────────────────────────────────────────');

    const requestData = JSON.stringify({
      model: 'stepfun/step-3.5-flash',
      messages: [
        {
          role: 'user',
          content: 'What is a Golden Retriever? Answer in one sentence.'
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': requestData.length,
        'HTTP-Referer': 'https://aibreeds-demo.com',
        'X-Title': 'AI Breeds Pet Portal'
      },
      timeout: 20000
    };

    const startTime = Date.now();

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const latency = Date.now() - startTime;

        console.log(`\n📊 Response (${latency}ms):`);

        if (res.statusCode === 200) {
          try {
            const responseJson = JSON.parse(data);
            const message = responseJson.choices?.[0]?.message?.content;

            if (message) {
              console.log('✅ OPENROUTER WORKING - Chat Completions Successful');
              console.log('');
              console.log('Response Content:');
              console.log(`"${message}"`);
              console.log('');
              resolve(true);
            } else {
              console.error('❌ No message in response');
              console.log('Full response:', JSON.stringify(responseJson, null, 2));
              resolve(false);
            }
          } catch (e) {
            console.error('❌ Failed to parse response:', e.message);
            console.log('Raw response:', data);
            resolve(false);
          }
        } else {
          console.error(`❌ API Error (${res.statusCode})`);
          console.log('Response:', data);

          // Detailed error analysis
          try {
            const errorJson = JSON.parse(data);
            if (errorJson.error?.message) {
              console.log(`Error message: ${errorJson.error.message}`);
            }
          } catch (e) {
            // Couldn't parse error
          }

          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Network error: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('❌ Request timeout (20s)');
      req.destroy();
      resolve(false);
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Test Together AI with ServiceNow Apriel 1.5 (FREE serverless)
 */
async function testTogetherAI() {
  return new Promise((resolve) => {
    console.log('\n📝 Testing Together AI - ServiceNow Apriel 1.5 (FREE Serverless)');
    console.log('──────────────────────────────────────────────────────────────');

    const requestData = JSON.stringify({
      model: 'ServiceNow-AI/Apriel-1.5-15b-Thinker',
      messages: [
        {
          role: 'user',
          content: 'What is a Golden Retriever? Answer in one sentence.'
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    const options = {
      hostname: 'api.together.xyz',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': requestData.length
      },
      timeout: 20000
    };

    const startTime = Date.now();

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const latency = Date.now() - startTime;

        console.log(`\n📊 Response (${latency}ms):`);

        if (res.statusCode === 200) {
          try {
            const responseJson = JSON.parse(data);
            const message = responseJson.choices?.[0]?.message?.content;

            if (message) {
              console.log('✅ TOGETHER AI WORKING - Chat Completions Successful');
              console.log('');
              console.log('Response Content:');
              console.log(`"${message}"`);
              console.log('');
              resolve(true);
            } else {
              console.error('❌ No message in response');
              console.log('Full response:', JSON.stringify(responseJson, null, 2));
              resolve(false);
            }
          } catch (e) {
            console.error('❌ Failed to parse response:', e.message);
            console.log('Raw response:', data);
            resolve(false);
          }
        } else {
          console.error(`❌ API Error (${res.statusCode})`);
          console.log('Response:', data);

          // Detailed error analysis
          try {
            const errorJson = JSON.parse(data);
            if (errorJson.error?.message) {
              console.log(`Error message: ${errorJson.error.message}`);
            }
          } catch (e) {
            // Couldn't parse error
          }

          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Network error: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('❌ Request timeout (20s)');
      req.destroy();
      resolve(false);
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  const openrouterResult = await testOpenRouter();
  const togetherResult = await testTogetherAI();

  console.log('\n\n');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('                        🧪 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');

  console.log('OpenRouter (Step 3.5 Flash):', openrouterResult ? '✅ PASS' : '❌ FAIL');
  console.log('Together AI (Apriel 1.5):    ', togetherResult ? '✅ PASS' : '❌ FAIL');
  console.log('');

  if (openrouterResult && togetherResult) {
    console.log('✅ ✅ ✅ BOTH PROVIDERS WORKING - READY FOR DEPLOYMENT ✅ ✅ ✅');
    process.exit(0);
  } else if (openrouterResult || togetherResult) {
    console.log('⚠️  ONE PROVIDER WORKING - Check configuration before deployment');
    process.exit(1);
  } else {
    console.log('❌ ❌ ❌ BOTH PROVIDERS FAILED - DO NOT DEPLOY ❌ ❌ ❌');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
