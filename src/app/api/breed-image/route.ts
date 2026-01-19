import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const breedsDir = path.join(process.cwd(), 'public', 'breeds');

// Mapping from common breed names/ids to Dog CEO API keys
const dogCeoBreedMap: Record<string, string> = {
  // Main breeds
  beagle: 'beagle',
  boxer: 'boxer',
  labrador: 'labrador',
  dachshund: 'dachshund',
  poodle: 'poodle',
  bulldog: 'bulldog',
  husky: 'husky',
  pug: 'pug',
  samoyed: 'samoyed',
  shiba: 'shiba',
  // Sub-breeds (format: main/sub)
  'bernese mountain dog': 'mountain/bernese',
  bernese: 'mountain/bernese',
  'border collie': 'collie/border',
  bordercollie: 'collie/border',
  'golden retriever': 'retriever/golden',
  goldenretriever: 'retriever/golden',
  'labrador retriever': 'retriever/labrador',
  labradorretriever: 'retriever/labrador',
  'australian shepherd': 'australianshepherd',
  // Add more as needed
};

function getDogCeoKey(breed: string, breedName: string) {
  // Try id, then name (case-insensitive)
  const key = dogCeoBreedMap[breed?.toLowerCase?.()] || dogCeoBreedMap[breedName?.toLowerCase?.()];
  return key || breed?.toLowerCase?.();
}

async function fetchImageUrl(breed: string, type: string, breedName: string): Promise<string | null> {
  // Try Dog CEO for dogs
  if (type === 'dog') {
    try {
      const dogCeoKey = getDogCeoKey(breed, breedName);
      const res = await fetch(`https://dog.ceo/api/breed/${dogCeoKey}/images/random`);
      type DogCeoResponse = { status: string; message?: string };
      const data = await res.json() as DogCeoResponse;
      if (data.status === 'success' && data.message) return data.message;
    } catch {}
  }
  // Try TheCatAPI for cats
  if (type === 'cat') {
    try {
      const res = await fetch(`https://api.thecatapi.com/v1/images/search?breed_ids=${breed}`);
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.url) return data[0].url;
    } catch {}
  }
  // Fallback to Unsplash
  try {
    const query = encodeURIComponent(`${breed} ${type}`);
    const res = await fetch(`https://source.unsplash.com/400x400/?${query}`);
    if (res.url) return res.url;
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // Accept both new and old param names for compatibility
  const breed = searchParams.get('breedId') || searchParams.get('breed');
  const type = searchParams.get('petType') || searchParams.get('type');
  const breedName = searchParams.get('breedName') || breed;
  if (!breed || !type) {
    return NextResponse.json({ error: 'Missing breed or type' }, { status: 400 });
  }
  const localPath = path.join(breedsDir, `${breed}.jpg`);
  const publicPath = `/breeds/${breed}.jpg`;
  // If file exists locally, return its path
  if (fs.existsSync(localPath)) {
    console.log(`[breed-image] Found local image for ${breed}: ${publicPath}`);
    return NextResponse.json({ imageUrl: publicPath });
  }
  // Otherwise, fetch and save
  const imageUrl = await fetchImageUrl(breed, type, breedName);
  if (imageUrl !== null) {
    try {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error('Image fetch failed');
      const arrayBuffer = await imgRes.arrayBuffer();
      fs.writeFileSync(localPath, Buffer.from(arrayBuffer));
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
