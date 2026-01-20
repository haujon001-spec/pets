#!/usr/bin/env ts-node
/**
 * Cache Cleanup Script
 * 
 * Removes expired breed images from the cache based on metadata.
 * Run this script periodically to prevent unbounded storage growth.
 * 
 * Usage:
 *   npm run cache:cleanup
 * 
 * Or with options:
 *   npm run cache:cleanup -- --dry-run  (preview only, don't delete)
 *   npm run cache:cleanup -- --force    (delete all cached images)
 */

import fs from 'fs';
import path from 'path';

const breedsDir = path.join(process.cwd(), 'public', 'breeds');
const cacheMetadataFile = path.join(breedsDir, '.cache-metadata.json');

interface CacheMetadata {
  [filename: string]: {
    fetchedAt: string;
    sourceUrl: string;
    expiresAt: string;
  };
}

function loadCacheMetadata(): CacheMetadata {
  try {
    if (fs.existsSync(cacheMetadataFile)) {
      const data = fs.readFileSync(cacheMetadataFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load cache metadata:', err);
  }
  return {};
}

function saveCacheMetadata(metadata: CacheMetadata): void {
  fs.writeFileSync(cacheMetadataFile, JSON.stringify(metadata, null, 2));
}

function cleanupCache(options: { dryRun?: boolean; force?: boolean } = {}) {
  const { dryRun = false, force = false } = options;
  
  console.log('🧹 Starting cache cleanup...\n');
  
  const metadata = loadCacheMetadata();
  const now = new Date();
  
  let deletedCount = 0;
  let keptCount = 0;
  let totalSize = 0;
  let freedSize = 0;
  
  // Iterate through all files in breeds directory
  const files = fs.readdirSync(breedsDir);
  
  for (const file of files) {
    // Skip metadata file and placeholder images
    if (file === '.cache-metadata.json' || file.startsWith('placeholder_')) {
      continue;
    }
    
    const filePath = path.join(breedsDir, file);
    const stats = fs.statSync(filePath);
    
    if (!stats.isFile()) continue;
    
    totalSize += stats.size;
    
    // Check if file should be deleted
    let shouldDelete = false;
    
    if (force) {
      shouldDelete = true;
    } else {
      const entry = metadata[file];
      if (!entry) {
        // No metadata = very old file, delete it
        shouldDelete = true;
        console.log(`⚠️  ${file} - No metadata (orphaned file)`);
      } else {
        const expiresAt = new Date(entry.expiresAt);
        if (expiresAt < now) {
          shouldDelete = true;
          const daysExpired = Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24));
          console.log(`🗑️  ${file} - Expired ${daysExpired} day(s) ago`);
        } else {
          const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          console.log(`✅ ${file} - Valid (expires in ${daysUntilExpiry} day(s))`);
        }
      }
    }
    
    if (shouldDelete) {
      freedSize += stats.size;
      deletedCount++;
      
      if (!dryRun) {
        fs.unlinkSync(filePath);
        delete metadata[file];
        console.log(`   → Deleted ${file}`);
      } else {
        console.log(`   → Would delete ${file}`);
      }
    } else {
      keptCount++;
    }
  }
  
  // Save updated metadata
  if (!dryRun && deletedCount > 0) {
    saveCacheMetadata(metadata);
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Total images scanned: ${deletedCount + keptCount}`);
  console.log(`   Images deleted: ${deletedCount}`);
  console.log(`   Images kept: ${keptCount}`);
  console.log(`   Total cache size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Space freed: ${(freedSize / 1024 / 1024).toFixed(2)} MB`);
  
  if (dryRun) {
    console.log('\n💡 This was a dry run. Re-run without --dry-run to actually delete files.');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force'),
};

if (options.force) {
  console.log('⚠️  WARNING: Force mode enabled. All cached images will be deleted!\n');
}

cleanupCache(options);
