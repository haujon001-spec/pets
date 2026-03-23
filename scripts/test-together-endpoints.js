#!/usr/bin/env node
/**
 * Test Together AI with Different Endpoints
 */

const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const keyMatch = envContent.match(/TOGETHER_API_KEY=(.+)/);
const API_KEY = keyMatch ? keyMatch[1].trim() : null;

console.log('🧪 TESTING TOGETHER AI API ENDPOINTS\n');
console.log('=' .repeat(60));
console.log(`API Key: ${API_KEY?.substring(0, 20)}...`);
console.log('=' .repeat(60) + '\n');

const endpoints = [
  {
    name: 'v1/chat/completions',
    url: 'https://api.together.xyz/v1/chat/completions',
    body: {
      model: 'meta-llama/Llama-3-8b-chat-hf',
      messages: [
        { role: 'user', content: 'What is a Jack Russell Terrier?' }
      ],
      max_tokens: 100
    }
  },
  {
    name: 'v1/completions',
    url: 'https://api.together.xyz/v1/completions',
    body: {
      model: 'meta-llama/Llama-3-8b-chat-hf',
      prompt: 'What is a Jack Russell Terrier?',
      max_tokens: 100
    }
  },
  {
    name: 'inference (old)',
    url: 'https://api.together.ai/inference',
    body: {
      model: 'meta-llama/Llama-3-8b-chat-hf',
      prompt: 'What is a Jack Russell Terrier?',
      max_tokens: 100
    }
  }
];

async function testEndpoint(ep) {
  console.log(`\n📌 Testing: ${ep.name}`);
  console.log(`URL: ${ep.url}`);

  try {
    const response = await fetch(ep.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(ep.body),
      timeout: 10000
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType?.includes('application/json')) {
      data = await response.json();
      if (response.status === 200 || response.status === 201) {
        console.log('✅ SUCCESS!\n');
        console.log('Response (first 300 chars):\n');
        console.log(JSON.stringify(data, null, 2).substring(0, 300));
      } else {
        console.log('Error details:\n');
        console.log(JSON.stringify(data, null, 2).substring(0, 300));
      }
    } else {
      const text = await response.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        console.log('❌ HTML error page (endpoint may not exist or service is down)');
      } else {
        console.log('Response:', text.substring(0, 200));
      }
    }

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

async function runTests() {
  if (!API_KEY) {
    console.error('❌ TOGETHER_API_KEY not found');
    process.exit(1);
  }

  for (const ep of endpoints) {
    await testEndpoint(ep);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n' + '=' .repeat(60));
  console.log('\nTest complete!');
}

runTests().catch(console.error);
