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
    verified?: boolean;
    verifiedAt?: string;
    verificationScore?: number;
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
function updateCacheMetadata(filename: string, sourceUrl: string, verified?: boolean, verificationScore?: number): void {
  const metadata = loadCacheMetadata();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
  
  metadata[filename] = {
    fetchedAt: now.toISOString(),
    sourceUrl,
    expiresAt: expiresAt.toISOString(),
    ...(verified !== undefined && { verified, verifiedAt: now.toISOString(), verificationScore }),
  };
  
  saveCacheMetadata(metadata);
}

/**
 * Verify if an image matches the breed using LLM vision
 */
async function verifyImageWithVision(imageUrl: string, breedName: string, petType: string): Promise<{ isCorrect: boolean; confidence: number; reasoning: string }> {
  try {
    console.log(`[breed-image] 🔍 Verifying image for ${breedName} (${petType})...`);
    
    const prompt = `You are an expert pet breed identifier. Analyze this image and determine if it shows a ${breedName} ${petType}.

Respond with ONLY a JSON object in this exact format:
{
  "isCorrect": true or false,
  "confidence": 0-100,
  "reasoning": "brief explanation"
}

Be strict - only return true if you're confident this is actually a ${breedName}.`;

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: prompt,
        imageUrl: imageUrl,
        useVision: true,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Vision API failed: ${response.status}`);
    }

    const data = await response.json() as { answer: string };
    const answer = data.answer;
    
    // Parse JSON from response
    const jsonMatch = answer.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[breed-image] ⚠️ Vision response not in expected format');
      return { isCorrect: true, confidence: 50, reasoning: 'Could not parse verification response' };
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log(`[breed-image] ✅ Vision verification: ${result.isCorrect ? '✓ CORRECT' : '✗ INCORRECT'} (${result.confidence}% confidence)`);
    console.log(`[breed-image] 💭 Reasoning: ${result.reasoning}`);
    
    return result;
  } catch (err) {
    console.error('[breed-image] ❌ Vision verification failed:', err);
    // On error, assume image is correct (don't break functionality)
    return { isCorrect: true, confidence: 50, reasoning: 'Verification failed' };
  }
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
  
  const breedLower = breedName.toLowerCase();
  
  // First, try exact match with common formats
  const directFormats = [
    breedLower.replace(/\s+/g, ''),
    breedLower.replace(/\s+/g, '/'),
    breedLower.replace(/\s+/g, '-'),
  ];
  
  // Check for exact key matches or sub-breed matches
  for (const format of directFormats) {
    for (const key of availableBreeds) {
      // Check if the format matches the key exactly
      if (key === format || key.replace(/\//g, '') === format) {
        console.log(`[breed-image] Exact match "${breedName}" to "${key}"`);
        return key;
      }
      
      // For compound breeds like "Golden Retriever", check if sub-breed matches
      const parts = key.split('/');
      if (parts.length === 2) {
        const [mainBreed, subBreed] = parts;
        const readableName = `${subBreed} ${mainBreed}`.toLowerCase();
        const words = breedLower.split(/\s+/);
        
        // If breed name contains the sub-breed word, prioritize it
        if (words.includes(subBreed.toLowerCase())) {
          const allWordsMatch = words.every(word => 
            readableName.includes(word) || key.includes(word)
          );
          if (allWordsMatch) {
            console.log(`[breed-image] Sub-breed word match "${breedName}" to "${key}"`);
            return key;
          }
        }
      }
    }
  }
  
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
    console.log(`[breed-image] Fuzzy match "${breedName}" to Dog CEO key: "${bestMatch.key}" (confidence: ${(1 - bestScore) * 100}%)`);
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
  // Use breedName for searching, it's more reliable than breedId for custom breeds
  const searchName = breedName || breed;
  console.log(`[breed-image] Fetching image for: ${searchName} (${type}), breed ID: ${breed}`);
  
  // Try Dog CEO for dogs with dynamic matching
  if (type === 'dog') {
    try {
      const dogCeoKey = await getDogCeoKey(searchName);
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
        console.log(`[breed-image] No Dog CEO mapping found for ${searchName}`);
      }
    } catch (err) {
      console.error(`[breed-image] Dog CEO failed:`, err);
    }
    
    // Secondary source: Pexels (via direct image URL)
    try {
      console.log(`[breed-image] Trying Pexels for ${searchName}`);
      const query = encodeURIComponent(`${searchName} dog portrait`);
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
      const catApiId = await getCatApiId(searchName);
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
      console.log(`[breed-image] Trying Unsplash for ${searchName} cat`);
      const query = encodeURIComponent(`${searchName} cat`);
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
      console.log(`[breed-image] Final fallback: Unsplash for ${searchName}`);
      const query = encodeURIComponent(`${searchName} dog`);
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

/**
 * Generate AI image using DALL-E 3 or Stable Diffusion as ultimate fallback
 * Returns object with imageUrl, provider, and generation time
 */
async function generateAIImage(breedName: string, petType: string): Promise<{ imageUrl: string; provider: string; generationTime: number } | null> {
  console.log(`[breed-image] 🎨 Attempting AI image generation for ${breedName} (${petType})`);
  const startTime = Date.now();
  
  // Try OpenAI DALL-E 3 first (best quality)
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log(`[breed-image] Trying DALL-E 3...`);
      const prompt = `A professional high-quality photograph of a ${breedName} ${petType}, realistic, detailed, studio lighting, facing camera, full body visible, neutral background`;
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'natural',
        }),
        signal: AbortSignal.timeout(30000), // 30s timeout for image generation
      });
      
      if (response.ok) {
        const data: any = await response.json();
        if (data.data && data.data[0]?.url) {
          const generationTime = Date.now() - startTime;
          console.log(`[breed-image] ✅ DALL-E 3 generated image successfully in ${generationTime}ms`);
          return { imageUrl: data.data[0].url, provider: 'DALL-E 3 (OpenAI)', generationTime };
        }
      } else {
        console.log(`[breed-image] DALL-E 3 failed: ${response.status} ${await response.text()}`);
      }
    } catch (err) {
      console.log(`[breed-image] DALL-E 3 error:`, err);
    }
  }
  
  // Try Replicate Stable Diffusion XL as fallback
  if (process.env.REPLICATE_API_TOKEN) {
    try {
      console.log(`[breed-image] Trying Stable Diffusion XL...`);
      const prompt = `professional photograph of a ${breedName} ${petType}, high quality, realistic, detailed, studio lighting`;
      
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
        body: JSON.stringify({
          version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
          input: {
            prompt: prompt,
            negative_prompt: 'cartoon, anime, drawing, illustration, low quality, blurry',
            num_outputs: 1,
          },
        }),
        signal: AbortSignal.timeout(60000), // 60s for Stable Diffusion
      });
      
      if (response.ok) {
        const prediction: any = await response.json();
        // Poll for completion
        let attempts = 0;
        while (attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
          const statusRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` },
          });
          
          if (statusRes.ok) {
            const status: any = await statusRes.json();
            if (status.status === 'succeeded' && status.output?.[0]) {
              const generationTime = Date.now() - startTime;
              console.log(`[breed-image] ✅ Stable Diffusion generated image successfully in ${generationTime}ms`);
              return { imageUrl: status.output[0], provider: 'Stable Diffusion XL (Replicate)', generationTime };
            } else if (status.status === 'failed') {
              console.log(`[breed-image] Stable Diffusion failed:`, status.error);
              break;
            }
          }
          attempts++;
        }
      }
    } catch (err) {
      console.log(`[breed-image] Stable Diffusion error:`, err);
    }
  }
  
  // Try Together AI image models as final fallback
  if (process.env.TOGETHER_API_KEY) {
    try {
      console.log(`[breed-image] Trying Together AI SDXL...`);
      const prompt = `professional photograph of a ${breedName} ${petType}, high quality, realistic, detailed`;
      
      const response = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'stabilityai/stable-diffusion-xl-base-1.0',
          prompt: prompt,
          steps: 20,
          n: 1,
          width: 1024,
          height: 1024,
        }),
        signal: AbortSignal.timeout(30000),
      });
      
      if (response.ok) {
        const data: any = await response.json();
        if (data.data && data.data[0]?.url) {
          const generationTime = Date.now() - startTime;
          console.log(`[breed-image] ✅ Together AI generated image successfully in ${generationTime}ms`);
          return { imageUrl: data.data[0].url, provider: 'Stable Diffusion XL (Together AI)', generationTime };
        }
      } else {
        console.log(`[breed-image] Together AI image generation failed: ${response.status}`);
      }
    } catch (err) {
      console.log(`[breed-image] Together AI image error:`, err);
    }
  }
  
  console.log(`[breed-image] ❌ All AI image generation methods failed`);
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
  
  // For custom breeds, use the breedName for the filename to make it unique
  // This prevents conflicts between different custom cat/dog breeds
  const filenameBase = breed === 'custom' 
    ? `custom-${type}-${breedName.toLowerCase().replace(/[^a-z0-9]/g, '')}` 
    : breed;
  const localPath = path.join(breedsDir, `${filenameBase}.jpg`);
  const publicPath = `/api/serve-breed-image?filename=${filenameBase}.jpg`; // Use API route instead of static path
  const filename = `${filenameBase}.jpg`;
  
  // Check if file exists locally and is not expired
  if (fs.existsSync(localPath)) {
    if (!isCacheExpired(filename)) {
      console.log(`[breed-image] Found local image for ${breedName}: ${publicPath}`);
      return NextResponse.json({ imageUrl: publicPath });
    } else {
      console.log(`[breed-image] Cache expired for ${breedName}, refetching...`);
      // Remove expired file
      fs.unlinkSync(localPath);
    }
  }
  
  // Otherwise, fetch and save
  let imageUrl = await fetchImageUrl(breed, type, breedName);
  let aiMetadata: { provider: string; generationTime: number } | null = null;
  
  // If all standard APIs failed, try AI image generation
  if (imageUrl === null) {
    console.log(`[breed-image] Standard APIs failed, attempting AI generation...`);
    const aiResult = await generateAIImage(breedName, type);
    if (aiResult) {
      imageUrl = aiResult.imageUrl;
      aiMetadata = { provider: aiResult.provider, generationTime: aiResult.generationTime };
    }
  }
  
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
      
      // Verify image with vision AI (skip if it was AI-generated, as it's already correct)
      const verification = imageUrl.includes('openai.com') || imageUrl.includes('replicate.com') || imageUrl.includes('together.xyz')
        ? { isCorrect: true, confidence: 100, reasoning: 'AI-generated image' }
        : await verifyImageWithVision(imageUrl, breedName, type);
      
      // If image is incorrect with high confidence, delete it and use placeholder
      if (!verification.isCorrect && verification.confidence > 70) {
        console.warn(`[breed-image] ⚠️ Image verification failed for ${breedName}: ${verification.reasoning}`);
        console.warn(`[breed-image] 🗑️ Deleting incorrect image and using placeholder`);
        fs.unlinkSync(localPath);
        const placeholder = type === 'dog' ? '/breeds/placeholder_dog.jpg' : '/breeds/placeholder_cat.jpg';
        return NextResponse.json({ imageUrl: placeholder });
      }
      
      // Update cache metadata with verification
      updateCacheMetadata(filename, imageUrl, verification.isCorrect, verification.confidence);
      
      console.log(`[breed-image] Successfully fetched and cached image for ${breedName} (${type}): ${imageUrl}`);
      
      // Return image URL with AI metadata if available
      const response: any = { imageUrl: publicPath };
      if (aiMetadata) {
        response.aiGenerated = true;
        response.aiProvider = aiMetadata.provider;
        response.generationTime = aiMetadata.generationTime;
      }
      return NextResponse.json(response);
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
