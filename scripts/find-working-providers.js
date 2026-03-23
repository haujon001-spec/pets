/**
 * Advanced Provider Testing - Find Working Models
 */

const fs = require('fs');
const path = require('path');

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
console.log('🔍 FINDING WORKING PROVIDERS & MODELS');
console.log('='.repeat(80) + '\n');

// Test Groq (shouldn't need endpoint setup)
async function testGroq() {
  console.log('📋 Testing Groq Provider');
  console.log('─'.repeat(80));
  
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log('❌ GROQ_API_KEY not configured');
    console.log('   Get key at: https://console.groq.com/\n');
    return null;
  }

  try {
    console.log('🔧 Model: llama-3.3-70b-versatile');
    console.log('   Status: Testing...\n');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: 'What is a dog?' }
        ],
        max_tokens: 50,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS - Groq is working perfectly!\n');
      return { name: 'Groq', model: 'llama-3.3-70b-versatile', working: true };
    } else {
      const data = await response.json();
      console.log(`❌ Error ${response.status}:`);
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      return null;
    }
  } catch (error) {
    console.log(`❌ ${error.message}\n`);
    return null;
  }
}

// List Together models and find free ones
async function testTogetherFreeModels() {
  console.log('📋 Checking Together AI Available Models');
  console.log('─'.repeat(80));
  
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    console.log('❌ No API key\n');
    return null;
  }

  try {
    const response = await fetch('https://api.together.xyz/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.log(`❌ Error ${response.status}\n`);
      return null;
    }

    const data = await response.json();
    const models = data.data || [];
    
    // Filter to text generation models
    const textModels = models
      .filter(m => m.type === 'text-generation' && m.pricing && !m.pricing.base)
      .slice(0, 5);

    if (textModels.length === 0) {
      console.log('❌ No free text-generation models found');
      console.log('   All available models require dedicated endpoints\n');
      return null;
    }

    console.log(`✅ Found ${textModels.length} free models:\n`);
    
    // Test first few models
    for (let i = 0; i < Math.min(2, textModels.length); i++) {
      const model = textModels[i];
      console.log(`   Testing: ${model.id}`);
      
      try {
        const testResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model.id,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 10,
          }),
        });

        if (testResponse.ok) {
          console.log(`      ✅ WORKS!\n`);
          return { name: 'Together', model: model.id, working: true };
        } else {
          const errData = await testResponse.json();
          if (errData.error?.message?.includes('Unable to access')) {
            console.log(`      ❌ Requires endpoint\n`);
          } else {
            console.log(`      ❌ Error: ${testResponse.status}\n`);
          }
        }
      } catch (e) {
        console.log(`      ❌ ${e.message}\n`);
      }
    }

    return null;
  } catch (error) {
    console.log(`❌ ${error.message}\n`);
    return null;
  }
}

// Test Cohere
async function testCohere() {
  console.log('📋 Testing Cohere Provider');
  console.log('─'.repeat(80));
  
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    console.log('❌ COHERE_API_KEY not configured');
    console.log('   Get key at: https://dashboard.cohere.com/\n');
    return null;
  }

  try {
    console.log('🔧 Model: command-r-plus');
    console.log('   Status: Testing...\n');

    const response = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-r-plus',
        messages: [
          { role: 'user', content: 'What is a dog?' }
        ],
      }),
    });

    if (response.ok) {
      console.log('✅ SUCCESS - Cohere is working!\n');
      return { name: 'Cohere', model: 'command-r-plus', working: true };
    } else {
      const data = await response.json();
      console.log(`❌ Error ${response.status}:`);
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      return null;
    }
  } catch (error) {
    console.log(`❌ ${error.message}\n`);
    return null;
  }
}

// Summary and recommendations
async function runAllTests() {
  const results = [];
  
  results.push(await testGroq());
  results.push(await testCohere());
  results.push(await testTogetherFreeModels());

  const working = results.filter(r => r && r.working);

  console.log('='.repeat(80));
  console.log('📊 SUMMARY - RECOMMENDED ACTIONS');
  console.log('='.repeat(80) + '\n');

  if (working.length > 0) {
    console.log('✅ WORKING PROVIDER FOUND:\n');
    for (const result of working) {
      console.log(`   🔹 ${result.name}`);
      console.log(`      Model: ${result.model}`);
    }
    console.log('');
    console.log('ACTION: Update .env.local with:\n');
    console.log(`   LLM_PROVIDER_ORDER=${working.map(r => r.name.toLowerCase()).join(',')}`);
    console.log('');
  } else {
    console.log('❌ NO WORKING PROVIDERS\n');
    console.log('REQUIRED ACTIONS:\n');
    console.log('   1. Get Groq API Key:');
    console.log('      - Visit: https://console.groq.com/');
    console.log('      - Create account/login');
    console.log('      - Generate API key');
    console.log('      - Add to .env.local: GROQ_API_KEY=...\n');
    console.log('   2. Alternative - Get Cohere API Key:');
    console.log('      - Visit: https://dashboard.cohere.com/');
    console.log('      - Create account/login');
    console.log('      - Generate API key to .env.local: COHERE_API_KEY=...\n');
  }

  console.log('OPTIONAL FIX FOR TOGETHER AI:\n');
  console.log('   If you want to keep Together as primary:');
  console.log('   - Go to: https://api.together.ai/');
  console.log('   - Create dedicated endpoints for required models');
  console.log('   - This requires paid account\n');

  console.log('='.repeat(80) + '\n');
}

runAllTests().catch(console.error);
