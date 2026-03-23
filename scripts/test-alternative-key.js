/**
 * Test Alternative OpenRouter API Key
 * Using the ClaudeCodeTest key from the dashboard
 */

const fs = require('fs');
const path = require('path');

// Load environment
function loadEnv() {
  const envFiles = ['.env.local', '.env.vps', '.env'];
  for (const envFile of envFiles) {
    const fullPath = path.resolve(envFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key) {
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            process.env[key.trim()] = value;
          }
        }
      }
      break;
    }
  }
}

loadEnv();

console.log('\n=============================================================================');
console.log('🧪 Testing Alternative OpenRouter API Key');
console.log('=============================================================================\n');

// The key from the screenshot: ClaudeCodeTest
const alternativeKey = 'sk-or-v1-396dff5b3fa738c9e78f6ced26e0e2e6b2d54657ae429ce6fabd935e088c68c';

console.log('📋 Test Details:');
console.log('─'.repeat(80));
console.log(`Current Key: ${process.env.OPENROUTER_API_KEY?.substring(0, 30)}...`);
console.log(`Alternative Key: ${alternativeKey.substring(0, 30)}...`);
console.log('Alternative Key Name: ClaudeCodeTest');
console.log('Status: Never used / $0.000 usage / Unlimited limit');
console.log('');

async function testAlternativeKey() {
  try {
    console.log('📤 Sending test request to OpenRouter...\n');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${alternativeKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pets.demo.com',
        'X-Title': 'Pets Demo',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'What is a Jack Russell Terrier? Answer in one sentence.' }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('\n❌ Error Response:');
      console.log(JSON.stringify(data, null, 2));
      return false;
    }

    console.log('\n✅ SUCCESS! Alternative key works!');
    console.log(`📝 Response: "${data.choices[0].message.content}"`);
    console.log(`⏱️  Tokens used: ${data.usage?.total_tokens}`);
    console.log('\n💡 Recommendation: Use this key in .env.local\n');
    
    return true;
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}\n`);
    return false;
  }
}

async function testCurrentKey() {
  console.log('📤 Testing current key from .env.local...\n');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pets.demo.com',
        'X-Title': 'Pets Demo',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Hi' }
        ],
        max_tokens: 10,
      }),
    });

    console.log(`📊 Status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('❌ Still returns 401 - Invalid key');
      return false;
    } else if (response.ok) {
      console.log('✅ Current key is working now!');
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  const currentWorks = await testCurrentKey();
  
  console.log('\n' + '='.repeat(80));
  console.log('🔄 NOW TESTING ALTERNATIVE KEY');
  console.log('='.repeat(80) + '\n');
  
  const alternativeWorks = await testAlternativeKey();
  
  console.log('='.repeat(80));
  console.log('📊 RESULTS');
  console.log('='.repeat(80) + '\n');
  
  console.log('Current Key Status:');
  console.log(`  ${currentWorks ? '✅ WORKS' : '❌ FAILS'}`);
  
  console.log('\nAlternative Key (ClaudeCodeTest):');
  console.log(`  ${alternativeWorks ? '✅ WORKS' : '❌ FAILS'}`);
  
  if (alternativeWorks && !currentWorks) {
    console.log('\n🎯 ACTION: Replace current key with alternative\n');
    console.log('Edit .env.local and change:');
    console.log(`\nOPENROUTER_API_KEY=${alternativeKey}\n`);
    console.log('Then set provider order:');
    console.log('LLM_PROVIDER_ORDER=openrouter\n');
  }
  
  console.log('='.repeat(80) + '\n');
}

runTests().catch(console.error);
