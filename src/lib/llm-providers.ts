/**
 * LLM Provider Abstraction Layer
 * 
 * This module provides a unified interface for multiple LLM providers,
 * enabling seamless switching and fallback between different AI services.
 * 
 * Supported Providers:
 * - Groq (free tier, fast inference)
 * - Together AI (free tier, multiple models)
 * - Hugging Face Inference API (free tier)
 * - Cohere (free tier)
 * - OpenRouter (paid fallback)
 */

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  context?: {
    breedName?: string;
    petType?: 'dog' | 'cat';
    imageUrl?: string;
    useVision?: boolean;
  };
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
  latencyMs: number;
}

export interface LLMProvider {
  name: string;
  isConfigured: () => boolean;
  callAPI: (request: LLMRequest) => Promise<LLMResponse>;
}

/**
 * Groq Provider
 * Fast inference with Llama models, generous free tier
 * API: https://console.groq.com/
 */
export class GroqProvider implements LLMProvider {
  name = 'Groq';
  private apiKey: string;
  private model = 'llama-3.3-70b-versatile'; // Fast and high quality
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== '';
  }

  async callAPI(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    const systemPrompt = request.systemPrompt || 
      'You are a helpful assistant for pet breed information. Answer concisely and accurately.';

    const userPrompt = request.context?.breedName
      ? `Question about ${request.context.breedName} (${request.context.petType}): ${request.prompt}`
      : request.prompt;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: request.maxTokens || 256,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.choices[0].message.content,
      provider: this.name,
      model: this.model,
      tokensUsed: data.usage?.total_tokens,
      latencyMs,
    };
  }
}

/**
 * Together AI Provider
 * Multiple open-source models, good free tier
 * API: https://api.together.xyz/
 */
export class TogetherProvider implements LLMProvider {
  name = 'Together AI';
  private apiKey: string;
  private textModel = 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';
  private visionModel = 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo';
  private baseUrl = 'https://api.together.xyz/v1/chat/completions';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TOGETHER_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== '';
  }

  async callAPI(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    const useVision = request.context?.useVision && request.context?.imageUrl;
    const model = useVision ? this.visionModel : this.textModel;

    const systemPrompt = request.systemPrompt || 
      'You are a helpful assistant for pet breed information. Answer concisely and accurately.';

    const userPrompt = request.context?.breedName
      ? `Question about ${request.context.breedName} (${request.context.petType}): ${request.prompt}`
      : request.prompt;

    // Build messages with vision support
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (useVision && request.context?.imageUrl) {
      // For vision models, include image in user message
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: request.context.imageUrl } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: userPrompt });
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(20000), // Vision models may need more time
      body: JSON.stringify({
        model,
        messages,
        max_tokens: request.maxTokens || 256,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Together AI error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.choices[0].message.content,
      provider: this.name,
      model,
      tokensUsed: data.usage?.total_tokens,
      latencyMs,
    };
  }
}

/**
 * Hugging Face Provider
 * Access to many models via Inference API
 * API: https://huggingface.co/inference-api
 */
export class HuggingFaceProvider implements LLMProvider {
  name = 'Hugging Face';
  private apiKey: string;
  private model = 'meta-llama/Llama-3.2-3B-Instruct';
  private baseUrl = 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== '';
  }

  async callAPI(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    const systemPrompt = request.systemPrompt || 
      'You are a helpful assistant for pet breed information. Answer concisely and accurately.';

    const userPrompt = request.context?.breedName
      ? `Question about ${request.context.breedName} (${request.context.petType}): ${request.prompt}`
      : request.prompt;

    // Hugging Face uses messages format for chat models
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(20000), // HF can be slower with cold starts
      body: JSON.stringify({
        inputs: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        },
        parameters: {
          max_new_tokens: request.maxTokens || 256,
          temperature: request.temperature || 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    // Handle various HF response formats
    let content = '';
    if (Array.isArray(data)) {
      content = data[0]?.generated_text || data[0]?.text || '';
    } else if (data.generated_text) {
      content = data.generated_text;
    } else if (data[0]?.generated_text) {
      content = data[0].generated_text;
    }

    return {
      content: content.trim(),
      provider: this.name,
      model: this.model,
      tokensUsed: data.usage?.total_tokens,
      latencyMs,
    };
  }
}

/**
 * Cohere Provider
 * Command models with good free tier
 * API: https://cohere.com/
 */
export class CohereProvider implements LLMProvider {
  name = 'Cohere';
  private apiKey: string;
  private model = 'command-r-plus';
  private baseUrl = 'https://api.cohere.com/v2/chat';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.COHERE_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== '';
  }

  async callAPI(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    const systemPrompt = request.systemPrompt || 
      'You are a helpful assistant for pet breed information. Answer concisely and accurately.';

    const userPrompt = request.context?.breedName
      ? `Question about ${request.context.breedName} (${request.context.petType}): ${request.prompt}`
      : request.prompt;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: request.maxTokens || 256,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cohere error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.message?.content?.[0]?.text || data.text,
      provider: this.name,
      model: this.model,
      latencyMs,
    };
  }
}

/**
 * OpenRouter Provider (Fallback)
 * Paid service, used as last resort
 * API: https://openrouter.ai/
 */
export class OpenRouterProvider implements LLMProvider {
  name = 'OpenRouter';
  private apiKey: string;
  private model = 'openai/gpt-3.5-turbo';
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== '';
  }

  async callAPI(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    const systemPrompt = request.systemPrompt || 
      'You are a helpful assistant for pet breed information. Answer concisely and accurately.';

    const userPrompt = request.context?.breedName
      ? `Question about ${request.context.breedName} (${request.context.petType}): ${request.prompt}`
      : request.prompt;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aibreeds-demo.com',
        'X-Title': 'AI Pet Breeds Portal',
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: request.maxTokens || 256,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.choices[0].message.content,
      provider: this.name,
      model: this.model,
      tokensUsed: data.usage?.total_tokens,
      latencyMs,
    };
  }
}
