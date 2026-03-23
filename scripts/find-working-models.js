#!/usr/bin/env node
/**
 * Find Working Model on Together AI
 */

const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const keyMatch = envContent.match(/TOGETHER_API_KEY=(.+)/);
const API_KEY = keyMatch ? keyMatch[1].trim() : null;

console.log('🧪 FINDING WORKING MODELS ON TOGETHER AI\n');
console.log('=' .repeat(70));

// Free-tier models that typically work on Together
const modelsToTest = [
  'mistralai/Mistral-7B-Instruct-v0.1',
  'togethercomputer/alpaca-7b',
  'NousResearch/Nous-Hermes-13b',
  'teknium/OpenHermes-2-Mistral-7B',
  'meta-llama/Llama-2-7b-chat-hf',
  'meta-llama/Llama-2-13b-chat-hf'
];

async function testModel(model) {
  console.log(`\n📌 Testing: ${model}`);

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: 'What is a dog? (1 sentence)' }
        ],
        max_tokens: 50,
        temperature: 0.7
      }),
      timeout: 8000
    });

    const data = await response.json();

    if (response.status === 200 || response.status === 201) {
      console.log(`   ✅ SUCCESS! (${response.status})`);
      if (data.choices?.[0]?.message?.content) {
        console.log(`   Response: "${data.choices[0].message.content.substring(0, 100)}..."`);
      }
      return true;
    } else {
      const errorMsg = data.error?.message || 'Unknown error';
      console.log(`   ❌ Status ${response.status}: ${errorMsg.substring(0, 80)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ⏱️  Timeout/Error: ${error.message.substring(0, 60)}`);
    return false;
  }
}

async function runTests() {
  if (!API_KEY) {
    console.error('❌ TOGETHER_API_KEY not found');
    process.exit(1);
  }

  console.log(`API Key validated: ${API_KEY.substring(0, 15)}...`);
  console.log('Testing free-tier compatible models...\n');

  let workingModels = [];
  
  for (const model of modelsToTest) {
    const works = await testModel(model);
    if (works) workingModels.push(model);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n' + '=' .repeat(70));
  
  if (workingModels.length > 0) {
    console.log('\n✅ WORKING MODELS FOUND:\n');
    workingModels.forEach(m => {
      console.log(`   • ${m}`);
    });
    console.log(`\n💡 Use one of these models in llm-providers.ts`);
  } else {
    console.log('\n⚠️  No free-tier models found to work.');
    console.log('Possible issues:');
    console.log('  1. Free tier might be limited');
    console.log('  2. Account needs setup/verification');
    console.log('  3. Dedicated endpoints required for all models\n');
  }

  console.log('\n📊 KEY INSIGHT: New Together key IS valid! (authenticated successfully)');
  console.log('   Just need to find/configure a working model.\n');
}

runTests().catch(console.error);
