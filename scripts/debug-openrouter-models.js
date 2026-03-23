#!/usr/bin/env node
/**
 * Debug Test: OpenRouter Models
 */

const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const keyMatch = envContent.match(/OPENROUTER_API_KEY=(.+)/);
const API_KEY = keyMatch ? keyMatch[1].trim() : null;

console.log('🧪 OPENROUTER MODEL TESTS\n');
console.log('=' .repeat(70));

async function testModel(modelName) {
  console.log(`\n📌 Testing: ${modelName}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://aibreed-demo.com'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'user', content: 'What are Jack Russell Terriers?' }
        ],
        max_tokens: 100
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    console.log(`   Status: ${response.status}`);
    const data = await response.json();

    if (response.status === 200) {
      console.log(`   ✅ SUCCESS`);
      if (data.choices?.[0]?.message?.content) {
        console.log(`   Response: "${data.choices[0].message.content.substring(0, 80)}..."`);
      }
      return true;
    } else {
      console.log(`   ❌ FAILED`);
      if (data.error?.message) {
        console.log(`   Error: ${data.error.message.substring(0, 100)}`);
      }
      return false;
    }

  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message.substring(0, 100)}`);
    return false;
  }
}

async function runTests() {
  const models = [
    'stepfun/step-3.5-flash:free',
    'stepfun/step-3.5-flash',
    'openai/gpt-3.5-turbo',
    'mistralai/mistral-small-2603'
  ];

  console.log(`API Key (first 20 chars): ${API_KEY?.substring(0, 20)}...`);
  console.log('Testing multiple models...\n');

  for (const model of models) {
    await testModel(model);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n' + '=' .repeat(70));
  console.log('\nTest complete!');
}

runTests().catch(console.error);
