#!/usr/bin/env node
/**
 * Test Together AI API Key Validation
 * 
 * This script validates the new Together API key in .env.local
 * BEFORE deploying to production
 */

const fs = require('fs');
const https = require('https');

// Read .env.local directly
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envLines = envContent.split('\n');
let TOGETHER_KEY = '';

for (const line of envLines) {
  if (line.startsWith('TOGETHER_API_KEY=')) {
    TOGETHER_KEY = line.split('=')[1].trim();
    break;
  }
}

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║            🧪 TOGETHER AI API KEY VALIDATION TEST                         ║
║                                                                            ║
║  This script validates your new Together API key before deploying to VPS  ║
╚════════════════════════════════════════════════════════════════════════════╝

Testing at: ${new Date().toISOString()}
`);

if (!TOGETHER_KEY) {
  console.error('❌ CRITICAL: TOGETHER_API_KEY not found in .env.local');
  console.error('   Make sure you have set it correctly');
  process.exit(1);
}

console.log('✅ API Key found');
console.log(`   Key prefix: ${TOGETHER_KEY.substring(0, 10)}...${TOGETHER_KEY.substring(TOGETHER_KEY.length - 5)}`);
console.log(`   Key length: ${TOGETHER_KEY.length} characters`);
console.log('');

/**
 * Test Together AI Direct API Call
 */
async function testTogetherAPI() {
  return new Promise((resolve) => {
    console.log('📝 Testing Together AI Chat Completions API');
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
      timeout: 15000
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
              console.log('✅ API WORKING - Chat Completions Successful');
              console.log('');
              console.log('Response Content:');
              console.log(`"${message}"`);
              console.log('');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('✅ ✅ ✅ KEY IS VALID & WORKING ✅ ✅ ✅');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('');
              console.log('🎯 Ready for VPS deployment!');
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
      console.error('❌ Request timeout (15s)');
      req.destroy();
      resolve(false);
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Run test
 */
(async () => {
  const success = await testTogetherAPI();

  if (success) {
    console.log('');
    console.log('✅ All tests passed!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. ✅ New Together API key is working');
    console.log('  2. Back up existing VPS configuration');
    console.log('  3. Add key to GitHub Secrets');
    console.log('  4. Deploy to VPS');
    process.exit(0);
  } else {
    console.log('');
    console.log('❌ Tests failed!');
    console.log('');
    console.log('Troubleshooting:');
    console.log('  • Verify TOGETHER_API_KEY in .env.local');
    console.log('  • Check key is from https://api.together.xyz/settings/api-keys');
    console.log('  • Verify internet connection');
    console.log('  • Check with: curl -H "Authorization: Bearer $KEY" https://api.together.xyz/v1/models');
    process.exit(1);
  }
})();
