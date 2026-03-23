/**
 * Post-Fix LLM Provider Verification Test
 * Verifies that the corrected endpoints and models work
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnv() {
  const envFiles = [
    path.resolve('.env.local'),
    path.resolve('.env.vps'),
    path.resolve('.env'),
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
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

console.log('\n' + '='.repeat(80));
console.log('✅ POST-FIX VERIFICATION TEST');
console.log('='.repeat(80) + '\n');

// Test 1: Together AI with corrected model
async function testTogetherAICorrected() {
  console.log('📋 TEST 1: Together AI (with corrected model)');
  console.log('─'.repeat(80));
  
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    console.log('❌ TOGETHER_API_KEY not configured\n');
    return { success: false, provider: 'Together' };
  }

  try {
    console.log('🔧 Configuration:');
    console.log('   Model: meta-llama/Llama-3-8b-chat-hf (CORRECTED - free tier compatible)');
    console.log('   Previous model: meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo ❌');
    console.log('   API: https://api.together.xyz/v1/chat/completions');
    console.log('   Status: Sending request...\n');

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3-8b-chat-hf',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'What is a Jack Russell Terrier known for?' }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Error:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      return { success: false, provider: 'Together' };
    }

    console.log('✅ SUCCESS! Together AI is now working!\n');
    console.log(`📝 Response: "${data.choices[0].message.content.substring(0, 80)}..."\n`);
    return { success: true, provider: 'Together' };
  } catch (error) {
    console.log('❌ Error:');
    console.log(`   ${error.message}\n`);
    return { success: false, provider: 'Together' };
  }
}

// Test 2: Hugging Face with new endpoint
async function testHuggingFaceCorrected() {
  console.log('📋 TEST 2: Hugging Face (with new router endpoint)');
  console.log('─'.repeat(80));
  
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    console.log('❌ HUGGINGFACE_API_KEY not configured\n');
    return { success: false, provider: 'Hugging Face' };
  }

  try {
    console.log('🔧 Configuration:');
    console.log('   Previous endpoint: https://api-inference.huggingface.co ❌ (deprecated 410 Gone)');
    console.log('   New endpoint: https://router.huggingface.co ✅ (CORRECTED)');
    console.log('   Model: meta-llama/Llama-3.2-3B-Instruct');
    console.log('   Status: Sending request...\n');

    const response = await fetch('https://router.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'What is a Jack Russell Terrier known for?' }
          ]
        },
        parameters: {
          max_new_tokens: 100,
          temperature: 0.7,
        }
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Error:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      return { success: false, provider: 'Hugging Face' };
    }

    console.log('✅ SUCCESS! Hugging Face new endpoint is working!\n');
    
    let content = '';
    if (Array.isArray(data)) {
      content = data[0]?.generated_text || data[0]?.text || '';
    } else if (data.generated_text) {
      content = data.generated_text;
    }
    
    if (content) {
      console.log(`📝 Response: "${content.substring(0, 80)}..."\n`);
    }
    
    return { success: true, provider: 'Hugging Face' };
  } catch (error) {
    console.log('❌ Error:');
    console.log(`   ${error.message}\n`);
    return { success: false, provider: 'Hugging Face' };
  }
}

// Test 3: OpenRouter (if key is valid)
async function testOpenRouterStatus() {
  console.log('📋 TEST 3: OpenRouter (waiting for valid API key)');
  console.log('─'.repeat(80));
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log('❌ OPENROUTER_API_KEY not configured\n');
    return { success: false, provider: 'OpenRouter' };
  }

  console.log('⚠️  Status: API key is invalid (waiting for regeneration at https://openrouter.ai)\n');
  console.log('📋 Current API Key: ' + apiKey.substring(0, 20) + '...');
  console.log('⏳ Once you update with valid key, this will become the 3rd fallback provider\n');
  
  return { success: false, provider: 'OpenRouter' };
}

// Main test runner
async function runTests() {
  const results = [];
  
  results.push(await testTogetherAICorrected());
  results.push(await testHuggingFaceCorrected());
  results.push(await testOpenRouterStatus());

  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  const working = results.filter(r => r.success);
  const total = results.length;

  console.log(`Working Providers: ${working.length}/${total}\n`);

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${result.provider}`);
  }

  console.log('\n' + '='.repeat(80));
  
  if (working.length > 0) {
    console.log('✅ GOOD NEWS: At least one provider is working!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Update .env.local LLM_PROVIDER_ORDER to prioritize working providers');
    console.log('  2. Get valid OpenRouter API key from https://openrouter.ai/keys');
    console.log('  3. Run full application test to verify chat features work');
  } else {
    console.log('❌ NO PROVIDERS WORKING');
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Verify API keys are valid');
    console.log('  2. Check network connectivity');
    console.log('  3. Verify Hugging Face has router enabled for your account');
  }

  console.log('='.repeat(80) + '\n');
}

runTests().catch(console.error);
