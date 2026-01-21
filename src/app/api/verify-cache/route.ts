import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const breedsDir = path.join(process.cwd(), 'public', 'breeds');
const cacheMetadataFile = path.join(breedsDir, '.cache-metadata.json');

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

interface VerificationResult {
  filename: string;
  breedName: string;
  petType: string;
  verified: boolean;
  confidence: number;
  reasoning: string;
  status: 'verified' | 'failed' | 'skipped';
}

/**
 * Verify all cached breed images using LLM vision
 * This endpoint can be called periodically to ensure image quality
 */
export async function POST(request: NextRequest) {
  try {
    const { forceRecheck } = await request.json().catch(() => ({ forceRecheck: false }));
    
    console.log('[verify-cache] Starting cache verification...');
    
    // Load cache metadata
    if (!fs.existsSync(cacheMetadataFile)) {
      return NextResponse.json({ 
        error: 'No cache metadata found',
        results: [] 
      }, { status: 404 });
    }
    
    const metadataContent = fs.readFileSync(cacheMetadataFile, 'utf-8');
    const metadata: CacheMetadata = JSON.parse(metadataContent);
    
    const results: VerificationResult[] = [];
    const imagesToVerify = Object.entries(metadata).filter(([filename, data]) => {
      // Skip if already verified and not forcing recheck
      if (!forceRecheck && data.verified !== undefined) {
        return false;
      }
      // Skip placeholder images
      if (filename.includes('placeholder') || filename.includes('custom')) {
        return false;
      }
      return true;
    });
    
    console.log(`[verify-cache] Found ${imagesToVerify.length} images to verify`);
    
    for (const [filename, data] of imagesToVerify) {
      // Extract breed name and pet type from filename
      const breedId = filename.replace('.jpg', '').replace('.jpeg', '').replace('.png', '');
      
      // Determine pet type from breed ID or filename patterns
      const isDog = ['beagle', 'bulldog', 'chihuahua', 'dachshund', 'doberman', 'germanshepherd', 
                     'goldenretriever', 'greatdane', 'jackrussell', 'labrador', 'pug', 'schnauzer',
                     'bordercollie', 'boxer', 'cavalier', 'frenchbulldog', 'papillon', 'poodle',
                     'bernese', 'husky', 'maltese'].some(breed => breedId.includes(breed));
      
      const petType = isDog ? 'dog' : 'cat';
      
      // Convert breedId to readable name (simple capitalization)
      const breedName = breedId
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      
      const imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/breeds/${filename}`;
      
      try {
        // Call vision verification
        const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/chatbot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: `You are an expert pet breed identifier. Analyze this image and determine if it shows a ${breedName} ${petType}.\n\nRespond with ONLY a JSON object in this exact format:\n{\n  "isCorrect": true or false,\n  "confidence": 0-100,\n  "reasoning": "brief explanation"\n}\n\nBe strict - only return true if you're confident this is actually a ${breedName}.`,
            imageUrl,
            useVision: true,
          }),
          signal: AbortSignal.timeout(20000),
        });
        
        if (!verifyResponse.ok) {
          throw new Error(`Vision API failed: ${verifyResponse.status}`);
        }
        
        const verifyData = await verifyResponse.json() as { answer: string };
        const answer = verifyData.answer;
        
        // Parse JSON from response
        const jsonMatch = answer.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          results.push({
            filename,
            breedName,
            petType,
            verified: true,
            confidence: 50,
            reasoning: 'Could not parse verification response',
            status: 'skipped'
          });
          continue;
        }
        
        const result = JSON.parse(jsonMatch[0]);
        
        results.push({
          filename,
          breedName,
          petType,
          verified: result.isCorrect,
          confidence: result.confidence,
          reasoning: result.reasoning,
          status: result.isCorrect ? 'verified' : 'failed'
        });
        
        // Update metadata with verification result
        metadata[filename].verified = result.isCorrect;
        metadata[filename].verifiedAt = new Date().toISOString();
        metadata[filename].verificationScore = result.confidence;
        
        // If image failed verification with high confidence, delete it
        if (!result.isCorrect && result.confidence > 70) {
          const imagePath = path.join(breedsDir, filename);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`[verify-cache] Deleted incorrect image: ${filename}`);
          }
        }
        
        console.log(`[verify-cache] ${filename}: ${result.isCorrect ? '✅ VERIFIED' : '❌ FAILED'} (${result.confidence}%)`);
        
      } catch (err) {
        console.error(`[verify-cache] Error verifying ${filename}:`, err);
        results.push({
          filename,
          breedName,
          petType,
          verified: false,
          confidence: 0,
          reasoning: err instanceof Error ? err.message : 'Unknown error',
          status: 'skipped'
        });
      }
    }
    
    // Save updated metadata
    fs.writeFileSync(cacheMetadataFile, JSON.stringify(metadata, null, 2));
    
    const summary = {
      total: results.length,
      verified: results.filter(r => r.status === 'verified').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
    };
    
    console.log('[verify-cache] Verification complete:', summary);
    
    return NextResponse.json({
      success: true,
      summary,
      results,
    });
    
  } catch (err) {
    console.error('[verify-cache] Cache verification failed:', err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Get verification status of all cached images
 */
export async function GET(request: NextRequest) {
  try {
    if (!fs.existsSync(cacheMetadataFile)) {
      return NextResponse.json({ 
        error: 'No cache metadata found',
        images: [] 
      }, { status: 404 });
    }
    
    const metadataContent = fs.readFileSync(cacheMetadataFile, 'utf-8');
    const metadata: CacheMetadata = JSON.parse(metadataContent);
    
    const images = Object.entries(metadata).map(([filename, data]) => ({
      filename,
      verified: data.verified,
      verifiedAt: data.verifiedAt,
      confidence: data.verificationScore,
      sourceUrl: data.sourceUrl,
      expiresAt: data.expiresAt,
    }));
    
    const summary = {
      total: images.length,
      verified: images.filter(i => i.verified === true).length,
      unverified: images.filter(i => i.verified === false).length,
      pending: images.filter(i => i.verified === undefined).length,
    };
    
    return NextResponse.json({
      summary,
      images,
    });
    
  } catch (err) {
    console.error('[verify-cache] Failed to get verification status:', err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
