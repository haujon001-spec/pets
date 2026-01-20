#!/usr/bin/env ts-node
/**
 * Pre-cache Popular Breeds
 * 
 * Fetches and caches images for the top 20 most popular dog and cat breeds.
 * Run this during build or deployment to ensure fast initial page loads.
 * 
 * Usage:
 *   npm run cache:precache
 */

import fetch from 'node-fetch';

// Top 20 most popular dog breeds
const TOP_DOGS = [
  'labrador', 'goldenretriever', 'germanshepherd', 'bulldog', 'beagle',
  'poodle', 'rottweiler', 'yorkie', 'boxer', 'dachshund',
  'shihtzu', 'pomeranian', 'husky', 'greatdane', 'doberman',
  'bordercollie', 'australianshepherd', 'miniatureschnauzer', 'cavalier', 'shiba'
];

// Top 20 most popular cat breeds
const TOP_CATS = [
  'persian', 'mainecoon', 'siamese', 'ragdoll', 'bengal',
  'abyssinian', 'birman', 'orientalshorthair', 'sphynx', 'devon',
  'britishhair', 'americanshorthair', 'scottishfold', 'burmese', 'tonkinese',
  'russianblue', 'norwegianforest', 'cornishrex', 'chartreux', 'balinese'
];

async function precacheBreed(breedId: string, petType: 'dog' | 'cat', breedName: string) {
  try {
    const params = new URLSearchParams({
      breedId,
      petType,
      breedName,
    });
    
    console.log(`Fetching ${breedName} (${petType})...`);
    
    const response = await fetch(`http://localhost:3000/api/breed-image?${params.toString()}`);
    const data = await response.json() as { imageUrl?: string; error?: string };
    
    if (data.imageUrl && !data.imageUrl.includes('placeholder')) {
      console.log(`✅ ${breedName}: ${data.imageUrl}`);
      return true;
    } else {
      console.log(`⚠️  ${breedName}: No image found (using placeholder)`);
      return false;
    }
  } catch (err) {
    console.error(`❌ ${breedName}: Error -`, err instanceof Error ? err.message : err);
    return false;
  }
}

async function precacheAll() {
  console.log('🐶 Pre-caching Top 20 Dog Breeds\n');
  console.log('================================================\n');
  
  let dogSuccess = 0;
  for (const breedId of TOP_DOGS) {
    const breedName = breedId.charAt(0).toUpperCase() + breedId.slice(1);
    const success = await precacheBreed(breedId, 'dog', breedName);
    if (success) dogSuccess++;
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🐱 Pre-caching Top 20 Cat Breeds\n');
  console.log('================================================\n');
  
  let catSuccess = 0;
  for (const breedId of TOP_CATS) {
    const breedName = breedId.charAt(0).toUpperCase() + breedId.slice(1);
    const success = await precacheBreed(breedId, 'cat', breedName);
    if (success) catSuccess++;
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Dogs cached: ${dogSuccess}/${TOP_DOGS.length}`);
  console.log(`   Cats cached: ${catSuccess}/${TOP_CATS.length}`);
  console.log(`   Total: ${dogSuccess + catSuccess}/${TOP_DOGS.length + TOP_CATS.length}`);
  console.log(`   Success rate: ${((dogSuccess + catSuccess) / (TOP_DOGS.length + TOP_CATS.length) * 100).toFixed(1)}%`);
}

// Check if Next.js dev server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/chatbot');
    if (response.ok) {
      return true;
    }
  } catch (err) {
    return false;
  }
  return false;
}

async function main() {
  console.log('🚀 Pre-cache Script for Popular Breeds\n');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('❌ Error: Next.js dev server is not running!');
    console.log('\n💡 Please start the dev server first:');
    console.log('   npm run dev\n');
    process.exit(1);
  }
  
  console.log('✅ Server detected at http://localhost:3000\n');
  
  await precacheAll();
  
  console.log('\n✨ Pre-caching complete!\n');
}

main();
