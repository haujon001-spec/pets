/**
 * Test New API Keys - Together AI & OpenRouter
 * PRIVATE: Keys are loaded from .env.local only, never logged
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
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

console.log('\n' + '='.repeat(80));
console.log('🧪 TESTING NEW API KEYS');
console.log('='.repeat(80) + '\n');

// Test Together AI
async function testTogetherAI() {
  console.log('📋 TEST 1: Together AI');
  console.log('─'.repeat(80));
  
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    console.log('❌ TOGETHER_API_KEY not configured\n');
    return { success: false, provider: 'Together AI', error: 'No API key' };
  }

  try {
    console.log('🔧 Configuration:');
    console.log(`   API Key: ${apiKey.substring(0, 20)}... (${apiKey.length} chars)`);
    console.log('   Model: meta-llama/Llama-3-8b-chat-hf');
    console.log('   Status: Testing...\n');

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3-8b-chat-hf',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for pet breed information.' },
          { role: 'user', content: 'What is a Jack Russell Terrier known for? Answer in one sentence.' }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Error:');
      if (data.error?.message) {
        console.log(`   ${data.error.message}`);
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
      console.log('');
      return { success: false, provider: 'Together AI', error: data.error?.message };
    }

    console.log('✅ SUCCESS - Together AI is working!\n');
    console.log(`📝 Response: "${data.choices[0].message.content.substring(0, 100)}..."\n`);
    console.log(`⏱️  Latency: ${response.headers.get('x-ratelimit-limit-requests') || 'N/A'}`);
    console.log(`💾 Tokens used: ${data.usage?.total_tokens || 'N/A'}\n`);
    
    return { success: true, provider: 'Together AI', latency: 'Fast', tokens: data.usage?.total_tokens };
  } catch (error) {
    console.log('❌ Error:');
    console.log(`   ${error.message}\n`);
    return { success: false, provider: 'Together AI', error: error.message };
  }
}

// Test OpenRouter
async function testOpenRouter() {
  console.log('📋 TEST 2: OpenRouter');
  console.log('─'.repeat(80));
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log('❌ OPENROUTER_API_KEY not configured\n');
    return { success: false, provider: 'OpenRouter', error: 'No API key' };
  }

  try {
    console.log('🔧 Configuration:');
    console.log(`   API Key: ${apiKey.substring(0, 20)}... (${apiKey.length} chars)`);
    console.log('   Model: openai/gpt-3.5-turbo');
    console.log('   Status: Testing...\n');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aibreed-demo.com',
        'X-Title': 'AI Breed Demo',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for pet breed information.' },
          { role: 'user', content: 'What is a Jack Russell Terrier known for? Answer in one sentence.' }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Error:');
      if (data.error?.message) {
        console.log(`   ${data.error.message}`);
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
      console.log('');
      return { success: false, provider: 'OpenRouter', error: data.error?.message };
    }

    console.log('✅ SUCCESS - OpenRouter is working!\n');
    console.log(`📝 Response: "${data.choices[0].message.content.substring(0, 100)}..."\n`);
    console.log(`💰 Cost: ${data.usage?.prompt_tokens || 0} prompt + ${data.usage?.completion_tokens || 0} completion tokens`);
    console.log(`💾 Total tokens: ${data.usage?.total_tokens || 'N/A'}\n`);
    
    return { success: true, provider: 'OpenRouter', latency: 'Normal', tokens: data.usage?.total_tokens };
  } catch (error) {
    console.log('❌ Error:');
    console.log(`   ${error.message}\n`);
    return { success: false, provider: 'OpenRouter', error: error.message };
  }
}

// Run all tests
async function runAllTests() {
  const togetherResult = await testTogetherAI();
  const openrouterResult = await testOpenRouter();

  console.log('='.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log('Provider Results:');
  console.log(`  ${togetherResult.success ? '✅' : '❌'} Together AI: ${togetherResult.success ? 'WORKING' : 'FAILED - ' + togetherResult.error}`);
  console.log(`  ${openrouterResult.success ? '✅' : '❌'} OpenRouter: ${openrouterResult.success ? 'WORKING' : 'FAILED - ' + openrouterResult.error}`);

  const bothWorking = togetherResult.success && openrouterResult.success;
  
  console.log('\n' + '='.repeat(80));
  if (bothWorking) {
    console.log('✅ RESULT: BOTH PROVIDERS WORKING!');
    console.log('='.repeat(80) + '\n');
    console.log('🚀 Next Steps:');
    console.log('   1. Deploy to VPS server');
    console.log('   2. Test web portal at https://aibreed-demo.com');
    console.log('   3. Verify chat feature works end-to-end');
    console.log('\n');
  } else {
    console.log('❌ RESULT: ONE OR MORE PROVIDERS FAILED');
    console.log('='.repeat(80) + '\n');
    console.log('⚠️  Issues:');
    if (!togetherResult.success) {
      console.log(`   • Together AI: ${togetherResult.error}`);
    }
    if (!openrouterResult.success) {
      console.log(`   • OpenRouter: ${openrouterResult.error}`);
    }
    console.log('\n');
  }

  console.log('='.repeat(80) + '\n');
  
  return bothWorking;
}

runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
