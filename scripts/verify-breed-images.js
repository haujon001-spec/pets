#!/usr/bin/env node

/**
 * Breed Image Verification Test Script
 * 
 * This script tests the image verification system by:
 * 1. Scanning all local breed images
 * 2. Making API calls to verify each image matches the breed
 * 3. Reporting mismatches and verification scores
 * 4. Suggesting corrective actions
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  console.clear();
  log('╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         Breed Image Verification Test Script                    ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');
  console.log();
  
  const breedsDir = path.join(process.cwd(), 'public', 'breeds');
  
  if (!fs.existsSync(breedsDir)) {
    log('❌ public/breeds directory not found', 'red');
    process.exit(1);
  }
  
  // Load breed data to map IDs to names
  const breedDataPath = path.join(process.cwd(), 'src', 'models', 'breedData.ts');
  let breedMap = {};
  
  if (fs.existsSync(breedDataPath)) {
    const content = fs.readFileSync(breedDataPath, 'utf8');
    
    // Parse breed IDs and names (simple regex extraction)
    const idMatches = content.matchAll(/id:\s*["']([^"']+)["']/g);
    const nameMatches = content.matchAll(/name:\s*["']([^"']+)["']/g);
    
    const ids = Array.from(idMatches).map(m => m[1]);
    const names = Array.from(nameMatches).map(m => m[1]);
    
    ids.forEach((id, i) => {
      breedMap[id] = names[i] || id;
    });
    
    log(`✅ Loaded ${Object.keys(breedMap).length} breeds from breedData.ts`, 'green');
  } else {
    log('⚠️  Could not load breed data, using filename as breed name', 'yellow');
  }
  
  // Scan breed images
  const files = fs.readdirSync(breedsDir);
  const imageFiles = files.filter(f => 
    f.match(/\.(jpg|jpeg|png|webp)$/i) && 
    !f.includes('placeholder')
  );
  
  log(`\nFound ${imageFiles.length} breed images to verify\n`, 'cyan');
  console.log('='.repeat(70) + '\n');
  
  const results = {
    verified: [],
    incorrect: [],
    errors: [],
    skipped: []
  };
  
  for (let i = 0; i < imageFiles.length; i++) {
    const filename = imageFiles[i];
    const breedId = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const breedName = breedMap[breedId] || breedId;
    
    log(`[${i + 1}/${imageFiles.length}] Verifying: ${breedName} (${filename})`, 'blue');
    
    // Check if server is running
    try {
      const response = await fetch(`http://localhost:3000/api/breed-image?breedId=${breedId}&petType=dog&breedName=${encodeURIComponent(breedName)}`);
      
      if (!response.ok) {
        log(`   ⚠️  API error: ${response.status}`, 'yellow');
        results.errors.push({ breed: breedName, error: `API returned ${response.status}` });
        continue;
      }
      
      const data = await response.json();
      
      if (data.verified !== undefined) {
        if (data.verified === true) {
          const score = data.verificationScore || 'N/A';
          log(`   ✅ VERIFIED (${score}% confidence)`, 'green');
          results.verified.push({ breed: breedName, score });
        } else if (data.verified === false) {
          const score = data.verificationScore || 'N/A';
          const reasoning = data.verificationReasoning || 'No reason provided';
          log(`   ❌ INCORRECT (${score}% confidence)`, 'red');
          log(`   💭 Reason: ${reasoning}`, 'yellow');
          results.incorrect.push({ breed: breedName, score, reasoning });
        } else {
          log(`   ⏭️  Not verified (may be newly cached)`, 'cyan');
          results.skipped.push({ breed: breedName, reason: 'Not verified yet' });
        }
      } else {
        log(`   ⏭️  No verification data`, 'cyan');
        results.skipped.push({ breed: breedName, reason: 'No verification data' });
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log(`   ❌ Server not running at localhost:3000`, 'red');
        log(`   💡 Please start the dev server with: npm run dev`, 'yellow');
        process.exit(1);
      } else {
        log(`   ❌ Error: ${error.message}`, 'red');
        results.errors.push({ breed: breedName, error: error.message });
      }
    }
    
    console.log();
  }
  
  // Summary
  console.log('='.repeat(70));
  log('\n📊 VERIFICATION SUMMARY\n', 'bold');
  
  log(`✅ Verified Correct: ${results.verified.length}`, 'green');
  log(`❌ Verified Incorrect: ${results.incorrect.length}`, 'red');
  log(`⏭️  Skipped/Not Verified: ${results.skipped.length}`, 'cyan');
  log(`🔴 Errors: ${results.errors.length}`, 'red');
  
  if (results.incorrect.length > 0) {
    console.log('\n' + '='.repeat(70));
    log('\n❌ INCORRECT IMAGES FOUND:\n', 'red');
    
    results.incorrect.forEach(item => {
      log(`   • ${item.breed}`, 'red');
      log(`     Confidence: ${item.score}%`, 'yellow');
      log(`     Reason: ${item.reasoning}`, 'yellow');
      console.log();
    });
    
    log('💡 RECOMMENDED ACTIONS:', 'cyan');
    log('   1. Delete the incorrect images from public/breeds/', 'white');
    log('   2. Clear the cache: rm .next/cache/breed-images.json', 'white');
    log('   3. Restart the server - images will be re-fetched', 'white');
  }
  
  if (results.errors.length > 0) {
    console.log('\n' + '='.repeat(70));
    log('\n🔴 ERRORS ENCOUNTERED:\n', 'red');
    
    results.errors.forEach(item => {
      log(`   • ${item.breed}: ${item.error}`, 'red');
    });
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (results.incorrect.length > 0) {
    log('\n⚠️  Some images failed verification - review required', 'yellow');
    process.exit(1);
  } else if (results.errors.length > 0) {
    log('\n⚠️  Errors occurred during verification', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ All verifiable images are correct!', 'green');
    process.exit(0);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
