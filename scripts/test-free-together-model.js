#!/usr/bin/env node
/**
 * Test Together AI with Free ServiceNow Model
 */

const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const keyMatch = envContent.match(/TOGETHER_API_KEY=(.+)/);
const API_KEY = keyMatch ? keyMatch[1].trim() : null;

const MODEL = 'ServiceNow-AI/Apriel-1.5-15b-Thinker';

console.log('🧪 TESTING TOGETHER AI WITH FREE MODEL\n');
console.log('=' .repeat(70));
console.log(`Model: ${MODEL}`);
console.log(`Pricing: $0.00 / $0.00 (FREE! 🎉)`);
console.log(`API Key: ${API_KEY?.substring(0, 20)}...`);
console.log('=' .repeat(70) + '\n');

async function testTogether() {
  if (!API_KEY) {
    console.error('❌ TOGETHER_API_KEY not found');
    process.exit(1);
  }

  try {
    console.log('🔄 Sending request to Together AI...\n');
    
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: 'What is a Jack Russell Terrier? (2 sentences)' }
        ],
        max_tokens: 100,
        temperature: 0.7
      }),
      timeout: 15000
    });

    const data = await response.json();

    console.log(`📊 Response Status: ${response.status}\n`);

    if (response.status === 200 || response.status === 201) {
      console.log('✅ SUCCESS - Free model works!\n');
      if (data.choices?.[0]?.message?.content) {
        const content = data.choices[0].message.content;
        console.log('📝 Response:\n');
        console.log(content);
        console.log('\n✨ TOGETHER AI IS NOW WORKING WITH FREE MODEL! ✨');
        console.log('\n💰 Cost: FREE ($0/$0 pricing)');
        console.log('🚀 Ready to deploy!\n');
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

testTogether();
