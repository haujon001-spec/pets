/**
 * LLM Router with Cascading Fallback
 * 
 * Intelligently routes LLM requests through multiple providers with automatic
 * fallback on failure. Prioritizes free APIs before falling back to paid services.
 */

import {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  GroqProvider,
  TogetherProvider,
  HuggingFaceProvider,
  CohereProvider,
  OpenRouterProvider,
} from './llm-providers';

interface ProviderAttempt {
  provider: string;
  success: boolean;
  error?: string;
  latencyMs?: number;
}

export interface RouterResponse extends LLMResponse {
  attempts: ProviderAttempt[];
  totalAttempts: number;
}

export class LLMRouter {
  private providers: LLMProvider[];
  private providerOrder: string[];

  constructor() {
    // Initialize all providers
    const allProviders = [
      new GroqProvider(),
      new TogetherProvider(),
      new HuggingFaceProvider(),
      new CohereProvider(),
      new OpenRouterProvider(),
    ];

    // Get provider order from environment or use default
    const envOrder = process.env.LLM_PROVIDER_ORDER || 'groq,together,huggingface,cohere,openrouter';
    this.providerOrder = envOrder.split(',').map(p => p.trim().toLowerCase());

    // Sort providers according to the specified order and filter out unconfigured ones
    this.providers = this.providerOrder
      .map(name => {
        const normalizedName = name.toLowerCase().replace(/\s+/g, '');
        const provider = allProviders.find(p => {
          const providerName = p.name.toLowerCase().replace(/\s+/g, '');
          // Match both full name and common abbreviations
          return providerName.includes(normalizedName) || normalizedName.includes(providerName);
        });
        return provider;
      })
      .filter((p): p is typeof allProviders[number] => p !== undefined && p.isConfigured());

    // Log configured providers
    if (this.providers.length === 0) {
      console.warn('⚠️  No LLM providers configured! Please add API keys to .env');
    } else {
      console.log(`✅ LLM Router initialized with ${this.providers.length} providers:`);
      this.providers.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} ${i === this.providers.length - 1 ? '(fallback)' : ''}`);
      });
    }
  }

  /**
   * Route an LLM request through the provider chain with automatic fallback
   */
  async route(request: LLMRequest): Promise<RouterResponse> {
    if (this.providers.length === 0) {
      throw new Error('No LLM providers configured. Please add API keys to your .env file.');
    }

    const attempts: ProviderAttempt[] = [];
    let lastError: Error | null = null;

    // Try each provider in order
    for (const provider of this.providers) {
      try {
        console.log(`🤖 Attempting LLM call with ${provider.name}...`);
        
        const response = await provider.callAPI(request);
        
        attempts.push({
          provider: provider.name,
          success: true,
          latencyMs: response.latencyMs,
        });

        console.log(`✅ Success with ${provider.name} (${response.latencyMs}ms)`);

        return {
          ...response,
          attempts,
          totalAttempts: attempts.length,
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        attempts.push({
          provider: provider.name,
          success: false,
          error: errorMessage,
        });

        console.error(`❌ ${provider.name} failed:`, errorMessage);
        lastError = error instanceof Error ? error : new Error(errorMessage);

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    console.error('❌ All LLM providers failed');
    throw new Error(
      `All LLM providers failed. Last error: ${lastError?.message || 'Unknown error'}\n` +
      `Attempts: ${attempts.map(a => `${a.provider}: ${a.success ? 'OK' : a.error}`).join(', ')}`
    );
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): string[] {
    return this.providers.map(p => p.name);
  }

  /**
   * Check if any providers are configured
   */
  hasProviders(): boolean {
    return this.providers.length > 0;
  }

  /**
   * Get provider statistics (useful for monitoring)
   */
  getProviderStats(): { name: string; configured: boolean; priority: number }[] {
    const allProviderNames = ['groq', 'together', 'huggingface', 'cohere', 'openrouter'];
    
    return allProviderNames.map((name, index) => {
      const provider = this.providers.find(p => 
        p.name.toLowerCase().replace(/\s+/g, '') === name
      );
      
      return {
        name: this.formatProviderName(name),
        configured: !!provider,
        priority: this.providerOrder.indexOf(name) + 1,
      };
    });
  }

  private formatProviderName(name: string): string {
    const nameMap: Record<string, string> = {
      'groq': 'Groq',
      'together': 'Together AI',
      'huggingface': 'Hugging Face',
      'cohere': 'Cohere',
      'openrouter': 'OpenRouter',
    };
    return nameMap[name] || name;
  }
}

// Export singleton instance
export const llmRouter = new LLMRouter();
