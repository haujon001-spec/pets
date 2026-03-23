#!/usr/bin/env node
/**
 * Comprehensive VPS LLM Validation Test
 * Tests Together AI, OpenRouter, and chat API endpoint
 */

const https = require('https');
const http = require('http');

// API Keys from environment
const TOGETHER_KEY = process.env.TOGETHER_API_KEY || 'ec41214373c0da02905e9356b232c4964388c30d82126dcf8f203514799012c5';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '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';

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  🧪 VPS LLM VALIDATION TEST SUITE                         ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

Testing at: ${new Date().toISOString()}
`);

/**
 * Test 1: Together AI Direct API
 */
async function testTogetherAI() {
  return new Promise((resolve) => {
    console.log('📝 TEST 1: Together AI Direct API');
    console.log('───────────────────────────────────────────────────────────');

    const data = JSON.stringify({
      model: 'ServiceNow-AI/Apriel-1.5-15b-Thinker',
      messages: [{ role: 'user', content: 'What is a Golden Retriever?' }],
      max_tokens: 150
    });

    const options = {
      hostname: 'api.together.xyz',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(body);
            const content = json.choices?.[0]?.message?.content || 'No content';
            console.log(`✅ SUCCESS (HTTP ${res.statusCode})`);
            console.log(`📄 Response preview: "${content.substring(0, 80)}..."`);
            console.log(`📊 Tokens used: ${json.usage?.total_tokens || 'N/A'}`);
            resolve(true);
          } catch (e) {
            console.log(`✅ SUCCESS (HTTP ${res.statusCode})`);
            console.log(`📄 Response received (JSON parse issue)`);
            resolve(true);
          }
        } else {
          console.log(`❌ FAILED (HTTP ${res.statusCode})`);
          console.log(`📄 Error: ${body.substring(0, 150)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ FAILED: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`❌ TIMEOUT (>15s)`);
      req.destroy();
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Test 2: OpenRouter Direct API
 */
async function testOpenRouter() {
  return new Promise((resolve) => {
    console.log('\n📝 TEST 2: OpenRouter Direct API');
    console.log('───────────────────────────────────────────────────────────');

    const data = JSON.stringify({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'What is a Labrador?' }],
      max_tokens: 150
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(body);
            const content = json.choices?.[0]?.message?.content || 'No content';
            console.log(`✅ SUCCESS (HTTP ${res.statusCode})`);
            console.log(`📄 Response preview: "${content.substring(0, 80)}..."`);
            console.log(`📊 Tokens used: ${json.usage?.total_tokens || 'N/A'}`);
            resolve(true);
          } catch (e) {
            console.log(`✅ SUCCESS (HTTP ${res.statusCode})`);
            console.log(`📄 Response received`);
            resolve(true);
          }
        } else {
          console.log(`❌ FAILED (HTTP ${res.statusCode})`);
          console.log(`📄 Error: ${body.substring(0, 150)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ FAILED: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`❌ TIMEOUT (>15s)`);
      req.destroy();
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Test 3: Chat API Endpoint
 */
async function testChatAPI() {
  return new Promise((resolve) => {
    console.log('\n📝 TEST 3: Local Chat API Endpoint');
    console.log('───────────────────────────────────────────────────────────');

    const data = JSON.stringify({
      breed: 'Golden Retriever',
      question: 'Tell me about this breed'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 20000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(body);
            const content = json.response || json.message || 'No response field';
            console.log(`✅ SUCCESS (HTTP ${res.statusCode})`);
            console.log(`📄 Response: "${typeof content === 'string' ? content.substring(0, 100) : JSON.stringify(content).substring(0, 100)}..."`);
            resolve(true);
          } catch (e) {
            console.log(`✅ SUCCESS (HTTP ${res.statusCode})`);
            console.log(`📄 Response received: "${body.substring(0, 100)}..."`);
            resolve(true);
          }
        } else {
          console.log(`❌ FAILED (HTTP ${res.statusCode})`);
          console.log(`📄 Error: ${body.substring(0, 150)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ FAILED: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`❌ TIMEOUT (>20s)`);
      req.destroy();
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  const results = {
    together: await testTogetherAI(),
    openrouter: await testOpenRouter(),
    chatAPI: await testChatAPI()
  };

  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                            📊 TEST RESULTS                                ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  console.log(`Together AI API:       ${results.together ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`OpenRouter API:        ${results.openrouter ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Chat API Endpoint:     ${results.chatAPI ? '✅ PASSED' : '❌ FAILED'}`);

  console.log(`\n📈 Overall: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! System is working correctly.\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${total - passed} test(s) failed. Check configuration.\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
