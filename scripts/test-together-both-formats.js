#!/usr/bin/env node
/**
 * Test Together AI with Both Key Formats
 */

const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const keyMatch = envContent.match(/TOGETHER_API_KEY=(.+)/);
const RAW_KEY = keyMatch ? keyMatch[1].trim() : null;
const PREFIXED_KEY = `tgp_v1_${RAW_KEY}`;

const MODEL = 'meta-llama/Llama-3-8b-chat-hf';

console.log('🧪 TESTING TOGETHER AI WITH BOTH KEY FORMATS\n');
console.log('=' .repeat(60));

async function testWithKey(apiKey, format) {
  console.log(`\n📌 Testing with format: ${format}`);
  console.log(`Key: ${apiKey.substring(0, 25)}...${apiKey.substring(-10)}`);
  console.log(`Length: ${apiKey.length} chars\n`);

  try {
    const response = await fetch('https://api.together.ai/inference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: 'What is a Jack Russell Terrier? (Answer in 1-2 sentences)',
        max_tokens: 100,
        temperature: 0.7,
        top_p: 0.9
      }),
      timeout: 10000
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log(`Response type: ${contentType}`);
      if (text.includes('<!DOCTYPE')) {
        console.log('Received HTML error page (likely server error or blocked request)');
        return;
      }
      data = text;
    }

    if (response.status === 200) {
      console.log('✅ SUCCESS!\n');
      if (data.output && data.output.choices && data.output.choices[0]) {
        console.log('Response:', data.output.choices[0].text.substring(0, 200));
      } else {
        console.log('Data:', JSON.stringify(data, null, 2).substring(0, 200));
      }
    } else {
      console.log('❌ FAILED\n');
      if (typeof data === 'string') {
        console.log('Error:', data.substring(0, 200));
      } else {
        console.log('Error:', JSON.stringify(data, null, 2).substring(0, 200));
      }
    }

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

async function runTests() {
  if (!RAW_KEY) {
    console.error('❌ Could not read TOGETHER_API_KEY from .env.local');
    process.exit(1);
  }

  console.log(`Raw key in .env.local: ${RAW_KEY.substring(0, 20)}...`);
  console.log(`Prefixed version would be: tgp_v1_${RAW_KEY.substring(0, 20)}...`);
  console.log('=' .repeat(60));

  // Test format 1: Raw key as-is
  await testWithKey(RAW_KEY, 'RAW HASH (as in .env.local)');
  
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test format 2: With tgp_v1_ prefix
  await testWithKey(PREFIXED_KEY, 'WITH tgp_v1_ PREFIX');

  console.log('\n' + '=' .repeat(60));
  console.log('\n✅ Test complete!\n');
}

runTests().catch(console.error);
