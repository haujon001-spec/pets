import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const breedsDir = path.join(process.cwd(), 'public', 'breeds');

/**
 * API route to serve dynamically cached breed images
 * This solves the issue where Next.js can't serve files added after build
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');
  
  if (!filename) {
    return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
  }
  
  // Security: only allow alphanumeric, hyphens, and .jpg extension
  if (!/^[a-z0-9-]+\.jpg$/i.test(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }
  
  const filePath = path.join(breedsDir, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
  
  try {
    // Read file and stream it
    const imageBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable', // Cache for 7 days
      },
    });
  } catch (err) {
    console.error(`[serve-breed-image] Error reading file ${filename}:`, err);
    return NextResponse.json({ error: 'Failed to read image' }, { status: 500 });
  }
}
