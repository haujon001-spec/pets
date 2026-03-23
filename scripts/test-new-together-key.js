#!/usr/bin/env node
/**
 * Test New Together AI API Key
 */

const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const keyMatch = envContent.match(/TOGETHER_API_KEY=(.+)/);
const API_KEY_RAW = keyMatch ? keyMatch[1].trim() : null;

console.log('🧪 TESTING NEW TOGETHER AI API KEY\n');
console.log('=' .repeat(70));
console.log(`Raw Key: ${API_KEY_RAW?.substring(0, 25)}...${API_KEY_RAW?.substring(-10)}`);
console.log(`Length: ${API_KEY_RAW?.length} characters`);
console.log('=' .repeat(70) + '\n');

async function testWithKey(key, description) {
  console.log(`\n📌 Testing: ${description}`);
  console.log(`   Key: ${key.substring(0, 20)}...${key.substring(-10)}`);

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3-8b-chat-hf',
        messages: [
          { role: 'user', content: 'What is a Jack Russell Terrier?' }
        ],
        max_tokens: 100,
        temperature: 0.7
      }),
      timeout: 10000
    });

    const data = await response.json();
    
    if (response.status === 200 || response.status === 201) {
      console.log(`   ✅ Status: ${response.status} SUCCESS!\n`);
      if (data.choices?.[0]?.message?.content) {
        const content = data.choices[0].message.content;
        console.log(`   Response: "${content.substring(0, 150)}${content.length > 150 ? '...' : ''}"`);
        console.log(`\n   ✨ TOGETHER AI IS NOW WORKING! ✨`);
        return true;
      } else if (data.output?.choices?.[0]?.text) {
        console.log(`   Response: "${data.output.choices[0].text.substring(0, 150)}..."`);
        return true;
      }
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      if (data.error?.message) {
        console.log(`   Error: ${data.error.message}`);
      }
      if (data.error?.code) {
        console.log(`   Code: ${data.error.code}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  if (!API_KEY_RAW) {
    console.error('❌ TOGETHER_API_KEY not found in .env.local');
    process.exit(1);
  }

  // Test with raw key
  let result1 = await testWithKey(API_KEY_RAW, 'RAW KEY (as-is from Together)');

  // Test with prefix if raw didn't work
  if (!result1) {
    const prefixedKey = `tgp_v1_${API_KEY_RAW}`;
    await new Promise(r => setTimeout(r, 500));
    let result2 = await testWithKey(prefixedKey, 'WITH tgp_v1_ PREFIX');
  }

  console.log('\n' + '=' .repeat(70));
  console.log('\n📊 TEST COMPLETE\n');
}

runTests().catch(console.error);
