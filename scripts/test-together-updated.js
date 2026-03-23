#!/usr/bin/env node
/**
 * Test Together AI with Updated API Key
 * Tests the new raw hash format
 */

const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const keyMatch = envContent.match(/TOGETHER_API_KEY=(.+)/);
const TOGETHER_API_KEY = keyMatch ? keyMatch[1].trim() : null;
const MODEL = 'meta-llama/Llama-3-8b-chat-hf';

if (!TOGETHER_API_KEY) {
  console.error('❌ TOGETHER_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('🧪 TESTING TOGETHER AI (Updated Key Format)\n');
console.log('=' .repeat(60));
console.log(`API Key: ${TOGETHER_API_KEY.substring(0, 20)}...${TOGETHER_API_KEY.substring(-10)}`);
console.log(`Key Length: ${TOGETHER_API_KEY.length} characters`);
console.log(`Key Format: ${TOGETHER_API_KEY.startsWith('tgp_v1_') ? 'tgp_v1_ prefix' : 'Raw hash (no prefix)'}`);
console.log(`Model: ${MODEL}`);
console.log('=' .repeat(60) + '\n');

async function testTogether() {
  try {
    console.log('🔄 Sending request to Together AI...\n');
    
    const response = await fetch('https://api.together.ai/inference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOGETHER_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: 'What is a Jack Russell Terrier?',
        max_tokens: 256,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    const data = await response.json();

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);

    if (response.status === 200) {
      console.log('✅ SUCCESS - Together AI is working!\n');
      console.log('📝 Response:\n');
      if (data.output && data.output.choices && data.output.choices[0]) {
        console.log(data.output.choices[0].text.substring(0, 300) + '...\n');
        console.log('✅ Together AI chat response received successfully!');
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
    } else {
      console.log(`❌ FAILED - Status ${response.status}\n`);
      console.log('Error Details:\n');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.error && data.error.message) {
        console.log(`\n💡 Issue: ${data.error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testTogether();
