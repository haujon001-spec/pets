/**
 * Simpler OpenRouter Test - Check Account Status Directly
 */

const alternativeKey = 'sk-or-v1-396dff5b3fa738c9e78f6ced26e0e2e6b2d54657ae429ce6fabd935e088c68c';

console.log('\n' + '='.repeat(80));
console.log('🔍 OpenRouter Account Diagnostic');
console.log('='.repeat(80) + '\n');

async function checkAccountStatus() {
  console.log('Test 1: Simple account check\n');
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${alternativeKey}`,
      },
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return response.status;
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return null;
  }
}

async function checkModelsEndpoint() {
  console.log('\n\nTest 2: List models endpoint\n');
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${alternativeKey}`,
      },
    });

    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Got ${data.data?.length || 0} models`);
    } else {
      const data = await response.json();
      console.log('Error:', JSON.stringify(data, null, 2));
    }
    
    return response.status;
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return null;
  }
}

async function testWithMinimalHeaders() {
  console.log('\n\nTest 3: Chat with minimal headers\n');
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${alternativeKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      }),
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Response received!');
      console.log(data.choices[0].message.content);
    } else {
      console.log('Error:', JSON.stringify(data, null, 2));
    }
    
    return response.ok;
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return false;
  }
}

async function runDiagnostics() {
  const authStatus = await checkAccountStatus();
  const modelsStatus = await checkModelsEndpoint();
  const chatStatus = await testWithMinimalHeaders();

  console.log('\n' + '='.repeat(80));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log('Results:');
  console.log(`  Auth endpoint: ${authStatus === 401 ? '❌ 401 (User not found)' : authStatus}`);
  console.log(`  Models endpoint: ${modelsStatus === 401 ? '❌ 401 (User not found)' : modelsStatus}`);
  console.log(`  Chat endpoint: ${chatStatus ? '✅ Working' : '❌ Failed'}`);

  console.log('\n💡 Diagnosis:');
  if (authStatus === 401 && modelsStatus === 401) {
    console.log('  Account or API key issue with OpenRouter');
    console.log('  ');
    console.log('  Possible causes:');
    console.log('  1. Account suspended/deactivated');
    console.log('  2. API access disabled for this account');
    console.log('  3. Regional restrictions');
    console.log('  4. Account needs verification');
    console.log('');
    console.log('  Recommended actions:');
    console.log('  1. Check account status at https://openrouter.ai/account');
    console.log('  2. Verify billing/payment method is valid');
    console.log('  3. Contact OpenRouter support');
    console.log('  4. Try creating a new API key');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

runDiagnostics().catch(console.error);
