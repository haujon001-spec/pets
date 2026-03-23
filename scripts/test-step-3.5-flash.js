#!/usr/bin/env node
/**
 * Test OpenRouter with Step 3.5 Flash (Free)
 */

const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const keyMatch = envContent.match(/OPENROUTER_API_KEY=(.+)/);
const API_KEY = keyMatch ? keyMatch[1].trim() : null;

const MODEL = 'stepfun/step-3.5-flash:free';

console.log('🧪 TESTING OPENROUTER WITH STEP 3.5 FLASH (FREE)\n');
console.log('=' .repeat(70));
console.log(`Model: ${MODEL}`);
console.log(`Pricing: FREE! 🎉`);
console.log(`API Key: ${API_KEY?.substring(0, 20)}...`);
console.log('=' .repeat(70) + '\n');

async function testOpenRouter() {
  if (!API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found');
    process.exit(1);
  }

  try {
    console.log('🔄 Sending request to OpenRouter...\n');
    
    const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://aibreed-demo.com'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: 'What are Jack Russell Terriers known for? (2-3 sentences)' }
        ],
        max_tokens: 150,
        temperature: 0.7
      }),
      timeout: 15000
    });

    const data = await response.json();

    console.log(`📊 Response Status: ${response.status}\n`);

    if (response.status === 200 || response.status === 201) {
      console.log('✅ SUCCESS - Step 3.5 Flash works!\n');
      if (data.choices?.[0]?.message?.content) {
        const content = data.choices[0].message.content;
        console.log('📝 Response:\n');
        console.log(content);
        
        const usage = data.usage;
        if (usage) {
          console.log('\n💰 Token Usage:');
          console.log(`   Input: ${usage.prompt_tokens} tokens`);
          console.log(`   Output: ${usage.completion_tokens} tokens`);
          console.log(`   Total: ${usage.total_tokens} tokens`);
        }
        
        console.log('\n✨ OPENROUTER WITH STEP 3.5 FLASH IS WORKING! ✨');
        console.log('💰 Cost: FREE!\n');
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
    } else {
      console.log(`❌ FAILED - Status ${response.status}\n`);
      if (data.error) {
        console.log('Error Details:\n');
        console.log(JSON.stringify(data.error, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testOpenRouter();
