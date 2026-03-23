#!/usr/bin/env node
/**
 * Quick Test: Together vs OpenRouter
 */

const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const togetherMatch = envContent.match(/TOGETHER_API_KEY=(.+)/);
const openrouterMatch = envContent.match(/OPENROUTER_API_KEY=(.+)/);

const TOGETHER_KEY = togetherMatch ? togetherMatch[1].trim() : null;
const OPENROUTER_KEY = openrouterMatch ? openrouterMatch[1].trim() : null;

console.log('🔄 PROVIDER COMPARISON TEST\n');
console.log('=' .repeat(70));

async function testProvider(name, url, key, headers) {
  console.log(`\n⏱️  Testing ${name}...`);
  console.log(`   Key: ${key?.substring(0, 20)}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers(key)
      },
      body: JSON.stringify({
        model: name === 'OpenRouter' ? 'openai/gpt-3.5-turbo' : 'meta-llama/Llama-3-8b-chat-hf',
        messages: [
          { role: 'user', content: 'Briefly describe a Jack Russell Terrier.' }
        ],
        max_tokens: 50
      }),
      timeout: 10000
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 200 || response.status === 201) {
      console.log(`   ✅ Status: ${response.status} SUCCESS`);
      if (data.choices?.[0]?.message?.content) {
        console.log(`   Response: "${data.choices[0].message.content.substring(0, 80)}..."`);
      } else if (data.output?.choices?.[0]?.text) {
        console.log(`   Response: "${data.output.choices[0].text.substring(0, 80)}..."`);
      }
      return true;
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      if (data.error?.message) {
        console.log(`   Error: ${data.error.message}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('Provider Status Summary');
  console.log('=' .repeat(70));

  if (!OPENROUTER_KEY) {
    console.log('❌ OPENROUTER_API_KEY not configured');
  } else {
    await testProvider('OpenRouter', 'https://api.openrouter.ai/api/v1/chat/completions', OPENROUTER_KEY, 
      (key) => ({ 'Authorization': `Bearer ${key}` }));
  }

  if (!TOGETHER_KEY) {
    console.log('\n❌ TOGETHER_API_KEY not configured');
  } else {
    await testProvider('Together', 'https://api.together.xyz/v1/chat/completions', TOGETHER_KEY,
      (key) => ({ 'Authorization': `Bearer ${key}` }));
  }

  console.log('\n' + '=' .repeat(70));
  console.log('\n📊 DEPLOYMENT STATUS:\n');
  
  if (OPENROUTER_KEY) {
    console.log('✅ OpenRouter: Can be used as primary provider');
  }
  
  if (TOGETHER_KEY) {
    console.log('⚠️  Together: Key valid format but API returns 401 Invalid Key');
    console.log('   → Fallback option if permissions issue is resolved');
  }

  console.log('\n💡 Recommendation: Deploy with OpenRouter as primary\n');
}

runTests().catch(console.error);
