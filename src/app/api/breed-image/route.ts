import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import Fuse from 'fuse.js';
import sharp from 'sharp';

const breedsDir = path.join(process.cwd(), 'public', 'breeds');
const cacheMetadataFile = path.join(process.cwd(), 'public', 'breeds', '.cache-metadata.json');
const CACHE_TTL_DAYS = 7; // Cache images for 7 days

// Cache for API breed lists (to avoid repeated fetches)
let dogCeoBreedsCache: string[] | null = null;
let catApiBreedsCache: { id: string; name: string }[] | null = null;

// Cache metadata structure
interface CacheMetadata {
  [filename: string]: {
    fetchedAt: string;
    sourceUrl: string;
    expiresAt: string;
  };
}

/**
 * Load cache metadata from file
 */
function loadCacheMetadata(): CacheMetadata {
  try {
    if (fs.existsSync(cacheMetadataFile)) {
      const data = fs.readFileSync(cacheMetadataFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[breed-image] Failed to load cache metadata:', err);
  }
  return {};
}

/**
 * Save cache metadata to file
 */
function saveCacheMetadata(metadata: CacheMetadata): void {
  try {
    fs.writeFileSync(cacheMetadataFile, JSON.stringify(metadata, null, 2));
  } catch (err) {
    console.error('[breed-image] Failed to save cache metadata:', err);
  }
}

/**
 * Check if cached image is expired
 */
function isCacheExpired(filename: string): boolean {
  const metadata = loadCacheMetadata();
  const entry = metadata[filename];
  
  if (!entry) return true;
  
  const expiresAt = new Date(entry.expiresAt);
  return expiresAt < new Date();
}

/**
 * Update cache metadata for a file
 */
function updateCacheMetadata(filename: string, sourceUrl: string): void {
  const metadata = loadCacheMetadata();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
  
  metadata[filename] = {
    fetchedAt: now.toISOString(),
    sourceUrl,
    expiresAt: expiresAt.toISOString(),
  };
  
  saveCacheMetadata(metadata);
}

/**
 * Fetch all available breeds from Dog CEO API
 * Returns array of breed keys (e.g., ['beagle', 'retriever/golden', 'bulldog/french'])
 */
async function fetchDogCeoBreeds(): Promise<string[]> {
  if (dogCeoBreedsCache) return dogCeoBreedsCache;
  
  try {
    const res = await fetch('https://dog.ceo/api/breeds/list/all', {
      signal: AbortSignal.timeout(5000),
    });
    const data: any = await res.json();
    
    if (data.status === 'success' && data.message) {
      const breeds: string[] = [];
      const breedMap = data.message;
      
      // Convert the breed map to flat list
      for (const [mainBreed, subBreeds] of Object.entries(breedMap) as [string, string[]][]) {
        if (subBreeds.length === 0) {
          breeds.push(mainBreed);
        } else {
          // Add all sub-breed combinations
          for (const subBreed of subBreeds) {
            breeds.push(`${mainBreed}/${subBreed}`);
          }
        }
      }
      
      dogCeoBreedsCache = breeds;
      console.log(`[breed-image] Loaded ${breeds.length} breeds from Dog CEO API`);
      return breeds;
    }
  } catch (err) {
    console.error('[breed-image] Failed to fetch Dog CEO breeds:', err);
  }
  
  return [];
}

/**
 * Fetch all available breeds from The Cat API
 */
async function fetchCatApiBreeds(): Promise<{ id: string; name: string }[]> {
  if (catApiBreedsCache) return catApiBreedsCache;
  
  try {
    const res = await fetch('https://api.thecatapi.com/v1/breeds', {
      signal: AbortSignal.timeout(5000),
    });
    const data: any = await res.json();
    
    if (Array.isArray(data)) {
      const breeds = data.map((b: any) => ({ id: b.id, name: b.name }));
      catApiBreedsCache = breeds;
      console.log(`[breed-image] Loaded ${breeds.length} breeds from Cat API`);
      return breeds;
    }
  } catch (err) {
    console.error('[breed-image] Failed to fetch Cat API breeds:', err);
  }
  
  return [];
}

/**
 * Create searchable name variations for better matching
 */
function createNameVariations(name: string): string[] {
  const variations: string[] = [];
  const lower = name.toLowerCase();
  
  variations.push(lower);
  variations.push(lower.replace(/[^a-z]/g, '')); // Remove non-letters
  variations.push(lower.replace(/\s+/g, '')); // Remove spaces
  
  // Handle common patterns
  if (lower.includes(' dog')) variations.push(lower.replace(' dog', ''));
  if (lower.includes(' cat')) variations.push(lower.replace(' cat', ''));
  if (lower.includes('-')) variations.push(lower.replace(/-/g, ' '));
  if (lower.includes('_')) variations.push(lower.replace(/_/g, ' '));
  
  // Add individual words for multi-word breed names
  const words = lower.split(/\s+/);
  if (words.length > 1) {
    variations.push(...words);
    // Add first and last word combinations
    variations.push(`${words[0]} ${words[words.length - 1]}`);
    // Add all consecutive pairs
    for (let i = 0; i < words.length - 1; i++) {
      variations.push(`${words[i]} ${words[i + 1]}`);
    }
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Dynamically find the best matching Dog CEO breed key using fuzzy search
 */
async function getDogCeoKey(breedName: string): Promise<string | null> {
  const availableBreeds = await fetchDogCeoBreeds();
  if (availableBreeds.length === 0) return null;
  
  // Create searchable list with both the key and readable name
  const searchableBreeds = availableBreeds.map(key => {
    // Convert 'retriever/golden' to 'golden retriever'
    const parts = key.split('/');
    const readableName = parts.length > 1 
      ? `${parts[1]} ${parts[0]}` 
      : parts[0];
    
    return {
      key,
      name: readableName,
      searchTerms: createNameVariations(readableName).concat(createNameVariations(key))
    };
  });
  
  // Create Fuse instance for fuzzy searching
  const fuse = new Fuse(searchableBreeds, {
    keys: ['name', 'key', 'searchTerms'],
    threshold: 0.4, // More lenient matching
    includeScore: true,
  });
  
  // Search with the breed name
  const nameVariations = createNameVariations(breedName);
  let bestMatch: any = null;
  let bestScore = 1;
  
  for (const variation of nameVariations) {
    const results = fuse.search(variation);
    if (results.length > 0 && results[0].score! < bestScore) {
      bestMatch = results[0].item;
      bestScore = results[0].score!;
    }
  }
  
  if (bestMatch) {
    console.log(`[breed-image] Matched "${breedName}" to Dog CEO key: "${bestMatch.key}" (confidence: ${(1 - bestScore) * 100}%)`);
    return bestMatch.key;
  }
  
  console.log(`[breed-image] No Dog CEO match found for "${breedName}"`);
  return null;
}

/**
 * Dynamically find the best matching Cat API breed ID using fuzzy search
 */
async function getCatApiId(breedName: string): Promise<string | null> {
  const availableBreeds = await fetchCatApiBreeds();
  if (availableBreeds.length === 0) return null;
  
  // Create Fuse instance
  const fuse = new Fuse(availableBreeds, {
    keys: ['name', 'id'],
    threshold: 0.4,
    includeScore: true,
  });
  
  // Search with name variations
  const nameVariations = createNameVariations(breedName);
  let bestMatch: any = null;
  let bestScore = 1;
  
  for (const variation of nameVariations) {
    const results = fuse.search(variation);
    if (results.length > 0 && results[0].score! < bestScore) {
      bestMatch = results[0].item;
      bestScore = results[0].score!;
    }
  }
  
  if (bestMatch) {
    console.log(`[breed-image] Matched "${breedName}" to Cat API: "${bestMatch.name}" (${bestMatch.id}) (confidence: ${(1 - bestScore) * 100}%)`);
    return bestMatch.id;
  }
  
  console.log(`[breed-image] No Cat API match found for "${breedName}"`);
  return null;
}

async function fetchImageUrl(breed: string, type: string, breedName: string): Promise<string | null> {
  console.log(`[breed-image] Fetching image for: ${breedName} (${type}), breed ID: ${breed}`);
  
  // Try Dog CEO for dogs with dynamic matching
  if (type === 'dog') {
    try {
      const dogCeoKey = await getDogCeoKey(breedName);
      if (dogCeoKey) {
        console.log(`[breed-image] Trying Dog CEO with key: ${dogCeoKey}`);
        const res = await fetch(`https://dog.ceo/api/breed/${dogCeoKey}/images/random`, {
          signal: AbortSignal.timeout(5000),
        });
        type DogCeoResponse = { status: string; message?: string };
        const data = await res.json() as DogCeoResponse;
        if (data.status === 'success' && data.message) {
          console.log(`[breed-image] ✅ Dog CEO success: ${data.message}`);
          return data.message;
        }
      } else {
        console.log(`[breed-image] No Dog CEO mapping found for ${breedName}`);
      }
    } catch (err) {
      console.error(`[breed-image] Dog CEO failed:`, err);
    }
    
    // Secondary source: Pexels (via direct image URL)
    try {
      console.log(`[breed-image] Trying Pexels for ${breedName}`);
      const query = encodeURIComponent(`${breedName} dog portrait`);
      const pexelsRes = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
        headers: {
          'Authorization': process.env.PEXELS_API_KEY || '',
        },
        signal: AbortSignal.timeout(5000),
      });
      
      if (pexelsRes.ok && process.env.PEXELS_API_KEY) {
        const pexelsData: any = await pexelsRes.json();
        if (pexelsData.photos && pexelsData.photos[0]?.src?.medium) {
          console.log(`[breed-image] ✅ Pexels success`);
          return pexelsData.photos[0].src.medium;
        }
      }
    } catch (err) {
      console.log(`[breed-image] Pexels not available (API key needed)`);
    }
  }
  
  // Try TheCatAPI for cats with dynamic matching
  if (type === 'cat') {
    try {
      const catApiId = await getCatApiId(breedName);
      if (catApiId) {
        console.log(`[breed-image] Trying TheCatAPI with ID: ${catApiId}`);
        const res = await fetch(`https://api.thecatapi.com/v1/images/search?breed_ids=${catApiId}`, {
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.url) {
          console.log(`[breed-image] ✅ TheCatAPI success`);
          return data[0].url;
        }
      }
    } catch (err) {
      console.error(`[breed-image] TheCatAPI failed:`, err);
    }
    
    // Secondary source for cats: Unsplash
    try {
      console.log(`[breed-image] Trying Unsplash for ${breedName} cat`);
      const query = encodeURIComponent(`${breedName} cat`);
      const res = await fetch(`https://source.unsplash.com/400x400/?${query}`, {
        redirect: 'follow',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok && res.url) {
        console.log(`[breed-image] ✅ Unsplash success`);
        return res.url;
      }
    } catch (err) {
      console.log(`[breed-image] Unsplash failed:`, err);
    }
  }
  
  // Final fallback: Generic Unsplash for dogs
  if (type === 'dog') {
    try {
      console.log(`[breed-image] Final fallback: Unsplash for ${breedName}`);
      const query = encodeURIComponent(`${breedName} dog`);
      const res = await fetch(`https://source.unsplash.com/400x400/?${query}`, {
        redirect: 'follow',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok && res.url) {
        console.log(`[breed-image] ✅ Unsplash fallback success`);
        return res.url;
      }
    } catch (err) {
      console.log(`[breed-image] Unsplash fallback failed:`, err);
    }
  }
  
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // Accept both new and old param names for compatibility
  const breed = searchParams.get('breedId') || searchParams.get('breed');
  const type = searchParams.get('petType') || searchParams.get('type');
  const breedName = searchParams.get('breedName') || breed || '';
  
  if (!breed || !type) {
    return NextResponse.json({ error: 'Missing breed or type' }, { status: 400 });
  }
  
  // Include pet type in filename for custom breeds to prevent cat/dog mixup
  const filenameBase = breed === 'custom' ? `custom-${type}` : breed;
  const localPath = path.join(breedsDir, `${filenameBase}.jpg`);
  const publicPath = `/breeds/${filenameBase}.jpg`;
  const filename = `${filenameBase}.jpg`;
  
  // Check if file exists locally and is not expired
  if (fs.existsSync(localPath)) {
    if (!isCacheExpired(filename)) {
      console.log(`[breed-image] Found local image for ${breed}: ${publicPath}`);
      return NextResponse.json({ imageUrl: publicPath });
    } else {
      console.log(`[breed-image] Cache expired for ${breed}, refetching...`);
      // Remove expired file
      fs.unlinkSync(localPath);
    }
  }
  
  // Otherwise, fetch and save
  const imageUrl = await fetchImageUrl(breed, type, breedName);
  if (imageUrl !== null) {
    try {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error('Image fetch failed');
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Compress and optimize image using sharp
      await sharp(buffer)
        .resize(800, 800, { // Resize to max 800x800 while maintaining aspect ratio
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 }) // Convert to JPEG with 85% quality
        .toFile(localPath);
      
      // Update cache metadata
      updateCacheMetadata(filename, imageUrl);
      
      console.log(`[breed-image] Successfully fetched and cached image for ${breedName} (${type}): ${imageUrl}`);
      return NextResponse.json({ imageUrl: publicPath });
    } catch (err) {
      console.error(`[breed-image] Error saving image for ${breedName} (${type}):`, err);
      const placeholder = type === 'dog' ? '/breeds/placeholder_dog.jpg' : '/breeds/placeholder_cat.jpg';
      return NextResponse.json({ imageUrl: placeholder });
    }
  } else {
    console.warn(`[breed-image] No image found for ${breedName} (${type}), using placeholder.`);
    const placeholder = type === 'dog' ? '/breeds/placeholder_dog.jpg' : '/breeds/placeholder_cat.jpg';
    return NextResponse.json({ imageUrl: placeholder });
  }
}
