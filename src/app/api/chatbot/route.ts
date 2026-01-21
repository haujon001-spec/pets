
import { NextRequest, NextResponse } from 'next/server';
import { BreedInfo, UserQuestion } from '@/models/breed';
import { dogBreeds, catBreeds, breedFAQs } from '@/models/breedData';
import Fuse from 'fuse.js';
import { llmRouter } from '@/lib/llm-router';

/**
 * Get AI answer using multi-provider LLM router
 * Automatically falls back through configured providers
 */
async function getAIAnswer(
  question: string, 
  breedId?: string, 
  petType?: 'dog' | 'cat',
  customBreedName?: string,
  imageUrl?: string,
  useVision?: boolean
): Promise<{ answer: string; provider: string; latencyMs: number }> {
  // Find breed context if provided
  let breedName: string | undefined;
  
  // Use custom breed name if provided, otherwise look up from breedId
  if (customBreedName) {
    breedName = customBreedName;
  } else if (breedId && breedId !== 'other') {
    const breed = breeds.find(b => b.id === breedId);
    if (breed) {
      breedName = breed.name;
    }
  }

  try {
    const response = await llmRouter.route({
      prompt: question,
      systemPrompt: useVision 
        ? 'You are an expert pet breed identifier. Analyze images carefully and provide accurate assessments.'
        : 'You are a helpful assistant for pet breed information. Answer concisely and accurately.',
      maxTokens: useVision ? 512 : 256,
      temperature: useVision ? 0.3 : 0.7,
      context: {
        breedName,
        petType,
        imageUrl,
        useVision,
      },
    });

    console.log(`✅ LLM Response from ${response.provider} in ${response.latencyMs}ms`);
    console.log(`   Attempts: ${response.totalAttempts}, Providers tried: ${response.attempts.map(a => a.provider).join(' → ')}`);

    return {
      answer: response.content,
      provider: response.provider,
      latencyMs: response.latencyMs,
    };
  } catch (err: any) {
    console.error('❌ All LLM providers failed:', err.message);
    return {
      answer: `I apologize, but I'm temporarily unable to answer questions. Please try again later. (${err.message})`,
      provider: 'none',
      latencyMs: 0,
    };
  }
}


// Combine all breeds for search
const breeds: BreedInfo[] = [...dogBreeds, ...catBreeds];

// Fuzzy search for breed name correction
const fuse = new Fuse(breeds, { keys: ['name'], threshold: 0.3 });

export async function POST(request: NextRequest) {
  const { question, breedId, petType, breedName, imageUrl, useVision } = await request.json();
  let resolvedBreedId = breedId;
  
  // If breedId is not provided but breedName is, try to correct it with fuzzy search
  if (!breedId && breedName) {
    const result = fuse.search(breedName);
    if (result.length > 0) {
      resolvedBreedId = result[0].item.id;
    }
  }
  
  // Get AI answer using multi-provider router
  const { answer, provider, latencyMs } = await getAIAnswer(
    question, 
    resolvedBreedId, 
    petType, 
    breedName,
    imageUrl,
    useVision
  );
  
  const userQuestion: UserQuestion = {
    id: Date.now().toString(),
    breedId: resolvedBreedId,
    petType,
    question,
    answer,
    timestamp: new Date().toISOString(),
    answeredByAI: true,
  };
  
  // TODO: Save userQuestion to database or file
  
  return NextResponse.json({ 
    answer, 
    userQuestion,
    metadata: {
      provider,
      latencyMs,
    }
  }, {
    headers: {
      'X-LLM-Provider': provider,
      'X-Response-Time': `${latencyMs}ms`,
    }
  });
}

export async function GET() {
  return NextResponse.json({ breeds, breedFAQs });
}
