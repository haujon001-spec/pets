#!/usr/bin/env node
/**
 * Complete LLM Diagnostic & Testing Script
 * Tests both providers and verifies API keys
 */

const fs = require('fs');
const path = require('path');

console.log(`

╔══════════════════════════════════════════════════════════════════════════════╗
║                   🔍 LLM PROVIDER DIAGNOSTIC & TEST                         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

`);

// Read environment
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const togetherMatch = envContent.match(/TOGETHER_API_KEY=(.+)/);
const openrouterMatch = envContent.match(/OPENROUTER_API_KEY=(.+)/);

const TOGETHER_KEY = togetherMatch ? togetherMatch[1].trim() : null;
const OPENROUTER_KEY = openrouterMatch ? openrouterMatch[1].trim() : null;

console.log('📋 CONFIGURATION CHECK\n');
console.log('=' .repeat(70));

// Verify keys exist
if (TOGETHER_KEY) {
  console.log(`✅ Together Key found: ${TOGETHER_KEY.substring(0, 20)}...`);
  console.log(`   Length: ${TOGETHER_KEY.length} characters`);
} else {
  console.log('❌ Together Key NOT found');
}

if (OPENROUTER_KEY) {
  console.log(`✅ OpenRouter Key found: ${OPENROUTER_KEY.substring(0, 20)}...`);
  console.log(`   Prefix: ${OPENROUTER_KEY.startsWith('sk-or-v1-') ? '✅ sk-or-v1-' : '❌ Wrong prefix'}`);
  console.log(`   Length: ${OPENROUTER_KEY.length} characters`);
} else {
  console.log('❌ OpenRouter Key NOT found');
}

console.log('=' .repeat(70) + '\n');

// Test functions
async function testOpenRouter() {
  console.log('🧪 TEST 1: OpenRouter (Step 3.5 Flash)\n');
  console.log('-' .repeat(70));

  try {
    const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': 'https://aibreed-demo.com'
      },
      body: JSON.stringify({
        model: 'stepfun/step-3.5-flash:free',
        messages: [
          { role: 'user', content: 'What is a dog?' }
        ],
        max_tokens: 50
      })
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ SUCCESS\n');
      if (data.choices?.[0]?.message?.content) {
        console.log(`Response: "${data.choices[0].message.content.substring(0, 100)}..."`);
      }
      console.log('✅ OpenRouter is working!\n');
      return true;
    } else {
      console.log('❌ FAILED\n');
      if (data.error?.message) {
        console.log(`Error: ${data.error.message}`);
      }
      console.log();
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`);
    return false;
  }
}

async function testTogether() {
  console.log('🧪 TEST 2: Together AI (ServiceNow Apriel)\n');
  console.log('-' .repeat(70));

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOGETHER_KEY}`,
        'HTTP-Referer': 'https://aibreed-demo.com'
      },
      body: JSON.stringify({
        model: 'ServiceNow-AI/Apriel-1.5-15b-Thinker',
        messages: [
          { role: 'user', content: 'What is a dog?' }
        ],
        max_tokens: 50
      })
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ SUCCESS\n');
      if (data.choices?.[0]?.message?.content) {
        console.log(`Response: "${data.choices[0].message.content.substring(0, 100)}..."`);
      }
      console.log('✅ Together AI is working!\n');
      return true;
    } else {
      console.log('❌ FAILED\n');
      if (data.error?.message) {
        console.log(`Error: ${data.error.message}`);
      }
      console.log();
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`);
    return false;
  }
}

// Run tests
async function runTests() {
  if (!OPENROUTER_KEY || !TOGETHER_KEY) {
    console.log('❌ Missing API keys! Cannot run tests.\n');
    process.exit(1);
  }

  const or_works = await testOpenRouter();
  await new Promise(r => setTimeout(r, 500));
  const together_works = await testTogether();

  console.log('=' .repeat(70));
  console.log('\n📊 SUMMARY\n');
  
  if (or_works && together_works) {
    console.log('✅ Both providers working!');
  } else if (or_works) {
    console.log('⚠️  OpenRouter working, Together failing');
  } else if (together_works) {
    console.log('⚠️  Together working, OpenRouter failing');
  } else {
    console.log('❌ Both providers failing - check API keys and network');
  }

  console.log('\n💡 ACTION ITEMS:\n');
  
  if (!or_works) {
    console.log('1. OpenRouter 401 error - check:');
    console.log('   • API key is correct and not expired');
    console.log('   • Account has API access enabled');
    console.log('   • Model stepfun/step-3.5-flash:free exists');
  }
  
  if (!together_works) {
    console.log('2. Together AI 401 error - check:');
    console.log('   • API key is correct and active');
    console.log('   • Account is in good standing');
    console.log('   • Model ServiceNow-AI/Apriel-1.5-15b-Thinker is available');
  }

  console.log('\n');
}

runTests().catch(console.error);
