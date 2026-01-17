
import { NextRequest, NextResponse } from 'next/server';
import { BreedInfo, UserQuestion } from '@/models/breed';
import { dogBreeds, catBreeds, breedFAQs } from '@/models/breedData';
import Fuse from 'fuse.js';

// Real AI integration using OpenRouter.ai
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '<YOUR_OPENROUTER_API_KEY_HERE>';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function getAIAnswer(question: string, breedId?: string): Promise<string> {
  // Compose a prompt for the LLM
  let prompt = question;
  if (breedId) {
    const breed = breeds.find(b => b.id === breedId);
    if (breed) {
      prompt = `About the breed ${breed.name}: ${question}`;
    }
  }
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for pet breed information. Answer concisely and accurately.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 256,
        temperature: 0.7,
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sorry, I could not find an answer.';
  } catch (err: any) {
    return `Error fetching AI answer: ${err.message}`;
  }
}


// Combine all breeds for search
const breeds: BreedInfo[] = [...dogBreeds, ...catBreeds];

// Fuzzy search for breed name correction
const fuse = new Fuse(breeds, { keys: ['name'], threshold: 0.3 });

export async function POST(request: NextRequest) {
  const { question, breedId, petType, breedName } = await request.json();
  let resolvedBreedId = breedId;
  // If breedId is not provided but breedName is, try to correct it
  if (!breedId && breedName) {
    const result = fuse.search(breedName);
    if (result.length > 0) {
      resolvedBreedId = result[0].item.id;
    }
  }
  const answer = await getAIAnswer(question, resolvedBreedId);
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
  return NextResponse.json({ answer, userQuestion });
}

export async function GET() {
  return NextResponse.json({ breeds, breedFAQs });
}
