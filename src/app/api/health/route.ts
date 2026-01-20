import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * 
 * This endpoint is used by:
 * - Docker health checks
 * - Load balancers
 * - Monitoring systems
 * - Deployment verification scripts
 * 
 * Returns 200 OK with system status information
 */

export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      checks: {
        llm_providers: checkLLMProviders(),
        cache_directory: await checkCacheDirectory(),
      }
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}

/**
 * Check if LLM provider configuration is valid
 */
function checkLLMProviders() {
  const providerOrder = process.env.LLM_PROVIDER_ORDER || '';
  const providers = providerOrder.split(',').filter(p => p.trim());
  
  const hasTogetherAI = !!process.env.TOGETHER_API_KEY;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  
  return {
    configured: providers.length > 0,
    count: providers.length,
    providers: providers,
    keys_present: {
      together_ai: hasTogetherAI,
      openrouter: hasOpenRouter
    }
  };
}

/**
 * Check if cache directory exists and is writable
 */
async function checkCacheDirectory() {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const cacheDir = path.join(process.cwd(), 'public', 'breeds');
    
    // Check if directory exists
    await fs.access(cacheDir);
    
    // Try to get directory stats
    const stats = await fs.stat(cacheDir);
    
    // Count cached files
    const files = await fs.readdir(cacheDir);
    const imageFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    
    return {
      exists: true,
      writable: stats.isDirectory(),
      cached_images: imageFiles.length
    };
  } catch (error) {
    return {
      exists: false,
      writable: false,
      cached_images: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
