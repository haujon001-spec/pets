#!/usr/bin/env node

/**
 * Fetch Missing Cat Breed Images
 * 
 * This script fetches missing cat breed images that are causing 404 errors.
 * It calls the breed-image API to fetch and cache the images.
 */

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

async function fetchCatImage(breedId, breedName) {
  try {
    log(`\n🐱 Fetching ${breedName} image...`, 'cyan');
    
    const params = new URLSearchParams({
      breedId: breedId,
      petType: 'cat',
      breedName: breedName
    });
    
    const response = await fetch(`http://localhost:3000/api/breed-image?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.imageUrl && !data.imageUrl.includes('placeholder')) {
      log(`✅ Successfully fetched and cached: ${data.imageUrl}`, 'green');
      return { success: true, imageUrl: data.imageUrl };
    } else if (data.imageUrl && data.imageUrl.includes('placeholder')) {
      log(`⚠️  Using placeholder image (source not available)`, 'yellow');
      return { success: false, reason: 'No source available' };
    } else {
      log(`❌ Failed to fetch image`, 'red');
      return { success: false, reason: 'Unknown error' };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`❌ Server not running at localhost:3000`, 'red');
      log(`💡 Please start the dev server with: npm run dev`, 'yellow');
      process.exit(1);
    } else {
      log(`❌ Error: ${error.message}`, 'red');
      return { success: false, reason: error.message };
    }
  }
}

async function main() {
  console.clear();
  log('╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         Fetch Missing Cat Breed Images                          ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');
  console.log();
  
  const missingCatBreeds = [
    { id: 'himalayan', name: 'Himalayan' },
    { id: 'mainecoon', name: 'Maine Coon' }
  ];
  
  log('📋 Missing cat breed images to fetch:', 'bold');
  missingCatBreeds.forEach(breed => {
    log(`   • ${breed.name} (${breed.id}.jpg)`, 'white');
  });
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  const results = [];
  
  for (const breed of missingCatBreeds) {
    const result = await fetchCatImage(breed.id, breed.name);
    results.push({ ...breed, ...result });
    
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  log('\n📊 SUMMARY\n', 'bold');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  log(`✅ Successfully fetched: ${successful.length}/${missingCatBreeds.length}`, successful.length === missingCatBreeds.length ? 'green' : 'yellow');
  
  if (successful.length > 0) {
    log('\n✅ FETCHED IMAGES:', 'green');
    successful.forEach(breed => {
      log(`   • ${breed.name}: ${breed.imageUrl}`, 'white');
    });
  }
  
  if (failed.length > 0) {
    log('\n❌ FAILED TO FETCH:', 'red');
    failed.forEach(breed => {
      log(`   • ${breed.name}: ${breed.reason}`, 'white');
    });
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (successful.length === missingCatBreeds.length) {
    log('\n✅ All missing cat images have been fetched!', 'green');
    log('💡 The 404 errors should now be resolved.', 'cyan');
    process.exit(0);
  } else {
    log('\n⚠️  Some images could not be fetched', 'yellow');
    log('💡 They may use placeholder images until a source is available.', 'cyan');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});

