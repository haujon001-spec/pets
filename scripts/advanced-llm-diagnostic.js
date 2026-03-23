/**
 * Advanced LLM Provider Diagnostic
 * Tests alternative models and gathers detailed information
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

console.log('\n=============================================================================');
console.log('🔍 DIAGNOSTIC REPORT - LLM Provider Issues');
console.log('=============================================================================\n');

// Issue 1: Together AI
console.log('📋 ISSUE #1: Together AI Model Not Available');
console.log('─────────────────────────────────────────────────');
console.log('❌ Error: Unable to access non-serverless model');
console.log('   Model: meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo');
console.log('');
console.log('💡 Solution: This model requires a dedicated endpoint.');
console.log('   The free tier API only supports specific models.');
console.log('');
console.log('✅ Testing available Together models...\n');

async function testTogetherModels() {
  const apiKey = process.env.TOGETHER_API_KEY;
  const models = [
    'meta-llama/Llama-2-7b-chat-hf',
    'meta-llama/Llama-3-8b-chat-hf',
    'meta-llama/Meta-Llama-3-8B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.1',
    'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
  ];

  for (const model of models) {
    try {
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        console.log(`   ✅ ${model}`);
      } else {
        const data = await response.json();
        if (data.error?.message?.includes('Unable to access')) {
          console.log(`   ❌ ${model} (requires endpoint)`);
        } else {
          console.log(`   ⚠️  ${model} (${response.status})`);
        }
      }
    } catch (e) {
      console.log(`   ❌ ${model} (connection error)`);
    }
  }
}

// Issue 2: OpenRouter
async function testOpenRouterIssue() {
  console.log('\n\n📋 ISSUE #2: OpenRouter Authentication Failed');
  console.log('─────────────────────────────────────────────────');
  console.log('❌ Error: User not found (401 Unauthorized)');
  console.log('');
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log(`🔑 API Key Format Check:`);
  console.log(`   - Length: ${apiKey?.length} characters`);
  console.log(`   - Prefix: ${apiKey?.substring(0, 10)}...`);
  console.log(`   - Format: ${apiKey?.startsWith('sk-or-v1-') ? '✅ Correct prefix' : '❌ Incorrect prefix'}`);
  console.log('');
  
  console.log('💡 Troubleshooting steps:');
  console.log('   1. Check if API key is still valid at https://openrouter.ai/keys');
  console.log('   2. Verify account has active credits');
  console.log('   3. Check if account is in good standing (no blocks)');
  console.log('   4. Try regenerating the API key');
  console.log('');

  // Try to get more info
  console.log('🔍 Checking OpenRouter account access...');
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    console.log(`   Response Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log(`   Error:`, e.message);
  }
}

async function testOtherProviders() {
  console.log('\n\n📋 CHECKING OTHER CONFIGURED PROVIDERS');
  console.log('─────────────────────────────────────────────────');
  
  // Check Hugging Face
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  console.log(`\n🔹 Hugging Face:`);
  if (hfKey) {
    console.log(`   ✅ API Key configured (${hfKey.length} chars)`);
    console.log(`   Format: ${hfKey.startsWith('hf_') ? '✅ Correct' : '❌ Unusual format'}`);
  } else {
    console.log(`   ❌ Not configured`);
  }

  // Check Groq
  const groqKey = process.env.GROQ_API_KEY;
  console.log(`\n🔹 Groq:`);
  if (groqKey) {
    console.log(`   ✅ API Key configured`);
  } else {
    console.log(`   ❌ Not configured`);
  }

  // Check Cohere
  const cohereKey = process.env.COHERE_API_KEY;
  console.log(`\n🔹 Cohere:`);
  if (cohereKey) {
    console.log(`   ✅ API Key configured`);
  } else {
    console.log(`   ❌ Not configured`);
  }
}

async function showRecommendations() {
  console.log('\n\n📋 RECOMMENDATIONS');
  console.log('─────────────────────────────────────────────────');
  console.log('');
  console.log('🔧 To fix the Together AI issue:');
  console.log('   • Use a Llama 2 or 3 model instead of 3.1');
  console.log('   • Example: meta-llama/Llama-3-8b-chat-hf');
  console.log('   • Test model with: https://api.together.ai/documentation');
  console.log('');
  console.log('🔧 To fix the OpenRouter issue:');
  console.log('   • Log in to https://openrouter.ai/');
  console.log('   • Go to Settings > API Keys');
  console.log('   • Verify the key matches .env.local');
  console.log('   • Check account balance and status');
  console.log('   • If needed, regenerate the API key');
  console.log('');
  console.log('🔧 Fallback recommendation:');
  console.log('   • Use Hugging Face (already configured)');
  console.log('   • Or Groq (if API key added)');
  console.log('   • Update LLM_PROVIDER_ORDER in .env to prioritize working providers');
  console.log('');
}

async function runDiagnostics() {
  await testTogetherModels();
  await testOpenRouterIssue();
  await testOtherProviders();
  await showRecommendations();

  console.log('=============================================================================');
  console.log('✅ Diagnostic Complete');
  console.log('=============================================================================\n');
}

runDiagnostics().catch(console.error);
