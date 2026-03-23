/**
 * LLM Provider Complete Test Suite
 * Tests all available providers including Hugging Face
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
console.log('🧪 LLM PROVIDER FULL TEST SUITE');
console.log('=============================================================================\n');

// Test Hugging Face
async function testHuggingFace() {
  console.log('📋 Testing Hugging Face Provider');
  console.log('─────────────────────────────────');
  
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    console.log('❌ HUGGINGFACE_API_KEY not configured\n');
    return false;
  }

  try {
    console.log('🔗 Connecting to: Hugging Face Inference API');
    console.log('📤 Model: meta-llama/Llama-3.2-3B-Instruct');
    console.log('');

    const response = await fetch(
      'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            messages: [
              { role: 'system', content: 'You are a helpful assistant for pet breed information.' },
              { role: 'user', content: 'What is the Jack Russell Terrier breed known for? Answer in one sentence.' }
            ]
          },
          parameters: {
            max_new_tokens: 100,
            temperature: 0.7,
          }
        }),
      }
    );

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Error:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      return false;
    }

    console.log('✅ SUCCESS - Hugging Face is working!');
    
    // Handle various response formats from HF
    let content = '';
    if (Array.isArray(data)) {
      content = data[0]?.generated_text || data[0]?.text || '';
    } else if (data.generated_text) {
      content = data.generated_text;
    }

    if (content) {
      console.log(`📝 Response: ${content.substring(0, 150)}...`);
    }
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Error testing Hugging Face:');
    console.log(`   ${error.message}\n`);
    return false;
  }
}

// Test Together AI with a simple fallback
async function testTogetherAIStatus() {
  console.log('📋 Testing Together AI Account Status');
  console.log('─────────────────────────────────────');
  
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    console.log('❌ API key not configured\n');
    return;
  }

  try {
    // Try to list available models to see account status
    const response = await fetch('https://api.together.xyz/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 HTTP Status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.ok && data.data && Array.isArray(data.data)) {
      const serverlessModels = data.data.filter(m => m.type === 'text-generation');
      console.log(`✅ Account is valid - Found ${serverlessModels.length} available models`);
      console.log(`   Available models: ${serverlessModels.slice(0, 3).map(m => m.id).join(', ')}...`);
    } else if (response.status === 400) {
      console.log('❌ Account restriction: All models require dedicated endpoints');
      console.log('   💡 The free tier may have been limited or account needs upgrade');
    } else {
      console.log('❌ Error checking account:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Connection error:');
    console.log(`   ${error.message}`);
  }
  console.log('');
}

// Test OpenRouter status
async function testOpenRouterStatus() {
  console.log('📋 Testing OpenRouter Account Status');
  console.log('────────────────────────────────────');
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log('❌ API key not configured\n');
    return;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    console.log(`📊 HTTP Status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('❌ Authentication Failed: User not found');
      console.log('   💡 Possible causes:');
      console.log('      • API key is invalid or expired');
      console.log('      • Account has been deleted');
      console.log('      • API key belongs to a different account');
      console.log('');
      console.log('   🔧 Action: Visit https://openrouter.ai/keys and regenerate API key');
    } else {
      console.log('Error response:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Connection error:');
    console.log(`   ${error.message}`);
  }
  console.log('');
}

// Summary and recommendations
async function printSummaryAndFix() {
  console.log('\n=============================================================================');
  console.log('📊 SUMMARY & DIAGNOSIS');
  console.log('=============================================================================\n');

  const huggingFaceWorking = await testHuggingFace();
  await testTogetherAIStatus();
  await testOpenRouterStatus();

  console.log('\n=============================================================================');
  console.log('🔧 RECOMMENDED FIXES');
  console.log('=============================================================================\n');

  console.log('1️⃣  IMMEDIATE FIX (Use Hugging Face):');
  console.log('   Update your .env.local or .env:');
  console.log('   ```');
  console.log('   # Change this:');
  console.log('   LLM_PROVIDER_ORDER=together,openrouter');
  console.log('');
  console.log('   # To this (prioritize HuggingFace):');
  console.log('   LLM_PROVIDER_ORDER=huggingface');
  console.log('   ```');
  console.log('');

  console.log('2️⃣  FIX TOGETHER AI:');
  console.log('   Visit: https://api.together.ai/');
  console.log('   • Check account tier and limits');
  console.log('   • Verify if serverless models are available');
  console.log('   • Consider upgrading account or changing provider');
  console.log('');

  console.log('3️⃣  FIX OPENROUTER:');
  console.log('   Visit: https://openrouter.ai/keys');
  console.log('   • Verify you are logged in');
  console.log('   • Check if account has active credits');
  console.log('   • Regenerate API key if needed');
  console.log('   • Copy the new key to .env.local');
  console.log('');

  console.log('4️⃣  ADD BACKUP PROVIDERS:');
  console.log('   Consider adding Groq or Cohere for better reliability:');
  console.log('   • Groq: https://console.groq.com/keys');
  console.log('   • Cohere: https://dashboard.cohere.com/api-keys');
  console.log('');

  console.log('=============================================================================');
  console.log('✅ Test Complete');
  console.log('=============================================================================\n');
}

printSummaryAndFix().catch(console.error);
