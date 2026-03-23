/**
 * Quick Decision Matrix - Which Provider to Use
 */

console.log('\n' + '='.repeat(80));
console.log('🎯 QUICK DECISION: Which Provider to Use');
console.log('='.repeat(80) + '\n');

const options = [
  {
    name: 'Groq ⭐ RECOMMENDED',
    time: '5 minutes',
    hassle: 'None (free tier, generous limits)',
    pros: [
      '✅ Super fast inference (70B models)',
      '✅ Free tier with no restrictions',
      '✅ Quick signup',
      '✅ No account verification needed',
    ],
    cons: [
      '⏳ 5 min to get key'
    ],
    link: 'https://console.groq.com/',
    steps: [
      '1. Go to https://console.groq.com/',
      '2. Sign up (free)',
      '3. Copy API key',
      '4. Add to .env.local: GROQ_API_KEY=key',
      '5. Set: LLM_PROVIDER_ORDER=groq',
      '6. Done! ✅'
    ]
  },
  {
    name: 'OpenRouter (Current)',
    time: '10+ minutes',
    hassle: 'Medium (account issues)',
    pros: [
      '✅ You already have dashboard access',
      '✅ Multiple models available',
      '✅ Both keys can list models',
    ],
    cons: [
      '❌ Chat requests blocked (401 error)',
      '❌ Billing/payment issue suspected',
      '❌ Need account troubleshooting',
      '❌ Slower to resolve',
    ],
    link: 'https://openrouter.ai/account',
    steps: [
      '1. Check account at https://openrouter.ai/account',
      '2. Verify payment method',
      '3. Look for warnings/blocks',
      '4. Contact support if needed',
      '5. Try new API key',
      '6. Test again'
    ]
  },
  {
    name: 'Cohere',
    time: '5 minutes',
    hassle: 'None (free tier)',
    pros: [
      '✅ Free tier available',
      '✅ Quick signup',
      '✅ Good reliability',
    ],
    cons: [
      '⏳ Need to create new account'
    ],
    link: 'https://dashboard.cohere.com/',
    steps: [
      '1. Go to https://dashboard.cohere.com/',
      '2. Sign up (free)',
      '3. Copy API key',
      '4. Add to .env.local: COHERE_API_KEY=key',
      '5. Set: LLM_PROVIDER_ORDER=cohere',
      '6. Done! ✅'
    ]
  }
];

for (const option of options) {
  console.log(`📌 ${option.name}`);
  console.log('─'.repeat(80));
  console.log(`   Time to setup: ${option.time}`);
  console.log(`   Hassle level: ${option.hassle}\n`);
  
  console.log('   ✅ Pros:');
  for (const pro of option.pros) {
    console.log(`      ${pro}`);
  }
  
  console.log('\n   ❌ Cons:');
  for (const con of option.cons) {
    console.log(`      ${con}`);
  }
  
  console.log('\n   🔗 Link: ' + option.link);
  
  console.log('\n   📋 Steps:');
  for (const step of option.steps) {
    console.log(`      ${step}`);
  }
  
  console.log('\n');
}

console.log('='.repeat(80));
console.log('🚀 RECOMMENDATION');
console.log('='.repeat(80) + '\n');

console.log('🥇 BEST: Groq');
console.log('   → Fastest setup (5 min)');
console.log('   → Most reliable');
console.log('   → Powerful models (70B llama)');
console.log('   → Start here!\n');

console.log('🥈 ALTERNATIVE: Cohere');
console.log('   → Also very quick');
console.log('   → Good quality models');
console.log('   → Use as backup\n');

console.log('🥉 OPTIONAL: Fix OpenRouter');
console.log('   → Account has issues');
console.log('   → Needs troubleshooting');
console.log('   → Try after Groq is working\n');

console.log('='.repeat(80));
console.log('⏱️  TOTAL TIME TO GET CHAT WORKING: ~5-10 minutes');
console.log('='.repeat(80) + '\n');
