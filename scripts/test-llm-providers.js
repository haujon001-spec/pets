/**
 * LLM Provider Diagnostic Test (Node.js)
 * Tests Together AI and OpenRouter with detailed error reporting
 */

const fs = require('fs');
const path = require('path');

// Load environment variables manually from .env files
function loadEnv() {
  const envFiles = [
    path.resolve('.env.local'),
    path.resolve('.env.vps'),
    path.resolve('.env'),
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      console.log(`📂 Loading environment from: ${envFile}`);
      const content = fs.readFileSync(envFile, 'utf-8');
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

// Log what we loaded
console.log('\n=============================================================================');
console.log('🔍 Environment Variables Loaded:');
console.log('=============================================================================');
console.log(`✓ TOGETHER_API_KEY: ${process.env.TOGETHER_API_KEY ? '✅ SET (' + process.env.TOGETHER_API_KEY.substring(0, 20) + '...)' : '❌ NOT SET'}`);
console.log(`✓ OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✅ SET (' + process.env.OPENROUTER_API_KEY.substring(0, 20) + '...)' : '❌ NOT SET'}`);
console.log(`✓ LLM_PROVIDER_ORDER: ${process.env.LLM_PROVIDER_ORDER || 'DEFAULT'}`);

// Test Together AI
async function testTogetherAI() {
  console.log('\n=============================================================================');
  console.log('🧪 Testing Together AI Provider');
  console.log('=============================================================================');
  
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    console.log('❌ TOGETHER_API_KEY not configured');
    return;
  }

  try {
    console.log('🔗 Connecting to: https://api.together.xyz/v1/chat/completions');
    console.log('🔑 API Key length:', apiKey.length, 'chars');
    console.log('📤 Sending request...');

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'What is a dog breed? Answer in one sentence.' }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ API Error:');
      console.log(JSON.stringify(data, null, 2));
      if (response.status === 401) {
        console.log('💡 Hint: 401 = Invalid API key or credentials');
      } else if (response.status === 403) {
        console.log('💡 Hint: 403 = Forbidden (may be region/account restriction)');
      }
      return;
    }

    console.log('✅ SUCCESS - Together AI is working!');
    console.log(`📝 Response: ${data.choices[0].message.content}`);
    console.log(`⏱️  Tokens used: ${data.usage?.total_tokens}`);
  } catch (error) {
    console.log('❌ Error testing Together AI:');
    console.log(`   ${error.message}`);
  }
}

// Test OpenRouter
async function testOpenRouter() {
  console.log('\n=============================================================================');
  console.log('🧪 Testing OpenRouter Provider');
  console.log('=============================================================================');
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log('❌ OPENROUTER_API_KEY not configured');
    return;
  }

  try {
    console.log('🔗 Connecting to: https://openrouter.ai/api/v1/chat/completions');
    console.log('🔑 API Key length:', apiKey.length, 'chars');
    console.log('📤 Sending request...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pets.demo.com',
        'X-Title': 'Pets Demo',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'What is a dog breed? Answer in one sentence.' }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ API Error:');
      console.log(JSON.stringify(data, null, 2));
      if (response.status === 401) {
        console.log('💡 Hint: 401 = Invalid API key or credentials');
      } else if (response.status === 403) {
        console.log('💡 Hint: 403 = Forbidden (may be region/account restriction)');
      }
      return;
    }

    console.log('✅ SUCCESS - OpenRouter is working!');
    console.log(`📝 Response: ${data.choices[0].message.content}`);
    console.log(`⏱️  Tokens used: ${data.usage?.total_tokens}`);
  } catch (error) {
    console.log('❌ Error testing OpenRouter:');
    console.log(`   ${error.message}`);
  }
}

// Test connectivity to APIs
async function testConnectivity() {
  console.log('\n=============================================================================');
  console.log('🌐 Testing API Connectivity');
  console.log('=============================================================================');

  const apis = [
    { name: 'Together AI', url: 'https://api.together.xyz/v1' },
    { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
  ];

  for (const api of apis) {
    try {
      const response = await fetch(api.url, { method: 'HEAD' });
      console.log(`✅ ${api.name}: ${response.status} (reachable)`);
    } catch (error) {
      console.log(`❌ ${api.name}: ${error.message}`);
    }
  }
}

// Run all tests
async function runAllTests() {
  await testConnectivity();
  await testTogetherAI();
  await testOpenRouter();

  console.log('\n=============================================================================');
  console.log('✅ Diagnostics Complete');
  console.log('=============================================================================\n');
}

runAllTests().catch(console.error);
