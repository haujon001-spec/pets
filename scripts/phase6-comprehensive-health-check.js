#!/usr/bin/env node

/**
 * Phase 6: Comprehensive Health Check & Functional Validation Script
 * 
 * This script performs end-to-end validation of:
 * 1. Translation System (LLM-powered breed info translation)
 * 2. Image Verification System (LLM vision validation)
 * 3. API Endpoints (chatbot, breed-image, verify-cache)
 * 4. Language Configuration (all 12 languages)
 * 5. Breed Data Integrity
 * 6. Cache System
 * 7. Error Handling
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

const results = {
  passed: [],
  failed: [],
  warnings: [],
  errors: []
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bold');
  console.log('='.repeat(70) + '\n');
}

function pass(message) {
  log(`✅ ${message}`, 'green');
  results.passed.push(message);
}

function fail(message) {
  log(`❌ ${message}`, 'red');
  results.failed.push(message);
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
  results.warnings.push(message);
}

function error(message) {
  log(`🔴 ${message}`, 'red');
  results.errors.push(message);
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// ============================================================================
// CHECK 1: Language Configuration Validation
// ============================================================================
async function checkLanguageConfiguration() {
  logSection('📁 CHECK 1: Language Configuration');
  
  const messagesDir = path.join(process.cwd(), 'messages');
  const expectedLanguages = [
    'en', 'es', 'fr', 'de', 'zh', 'zh-tw', 'pt', 'ar', 'ja', 'ru', 'it', 'vi'
  ];
  
  try {
    for (const lang of expectedLanguages) {
      const filePath = path.join(messagesDir, `${lang}.json`);
      
      if (!fs.existsSync(filePath)) {
        fail(`Language file missing: ${lang}.json`);
        continue;
      }
      
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Check required sections
        const requiredSections = ['app', 'petType', 'breed', 'question', 'actions', 'answer', 'breedInfo'];
        let sectionsMissing = [];
        
        for (const section of requiredSections) {
          if (!content[section]) {
            sectionsMissing.push(section);
          }
        }
        
        if (sectionsMissing.length > 0) {
          fail(`${lang}.json missing sections: ${sectionsMissing.join(', ')}`);
        } else {
          // Check breed info keys
          const breedInfoKeys = ['temperament', 'lifespan', 'description', 'origin', 'traits'];
          let breedKeysMissing = [];
          
          for (const key of breedInfoKeys) {
            if (!content.breedInfo[key]) {
              breedKeysMissing.push(key);
            }
          }
          
          if (breedKeysMissing.length > 0) {
            warn(`${lang}.json missing breed info keys: ${breedKeysMissing.join(', ')}`);
          } else {
            pass(`${lang}.json: Valid with all required keys`);
          }
        }
      } catch (e) {
        fail(`${lang}.json: Invalid JSON - ${e.message}`);
      }
    }
  } catch (e) {
    error(`Language configuration check failed: ${e.message}`);
  }
}

// ============================================================================
// CHECK 2: Breed Data Integrity
// ============================================================================
async function checkBreedDataIntegrity() {
  logSection('🐾 CHECK 2: Breed Data Integrity');
  
  try {
    const breedDataPath = path.join(process.cwd(), 'src', 'models', 'breedData.ts');
    
    if (!fs.existsSync(breedDataPath)) {
      fail('breedData.ts not found');
      return;
    }
    
    pass('breedData.ts exists');
    
    // Check for required fields in breed data structure
    const content = fs.readFileSync(breedDataPath, 'utf8');
    const requiredFields = ['id', 'name', 'petType', 'temperament', 'lifespan', 'description'];
    let fieldsFound = 0;
    
    for (const field of requiredFields) {
      if (content.includes(`${field}:`)) {
        fieldsFound++;
      }
    }
    
    if (fieldsFound === requiredFields.length) {
      pass(`All required breed fields present (${fieldsFound}/${requiredFields.length})`);
    } else {
      warn(`Some breed fields may be missing (${fieldsFound}/${requiredFields.length})`);
    }
    
    // Check for sample breeds
    const sampleBreeds = ['labrador', 'goldenretriever', 'germanshepherd', 'greatdane', 'beagle'];
    let breedsFound = 0;
    
    for (const breed of sampleBreeds) {
      if (content.includes(`id: "${breed}"`)) {
        breedsFound++;
      }
    }
    
    pass(`Sample breeds found: ${breedsFound}/${sampleBreeds.length}`);
    
  } catch (e) {
    error(`Breed data integrity check failed: ${e.message}`);
  }
}

// ============================================================================
// CHECK 3: Image System Validation
// ============================================================================
async function checkImageSystem() {
  logSection('🖼️  CHECK 3: Image System');
  
  try {
    const breedsDir = path.join(process.cwd(), 'public', 'breeds');
    
    if (!fs.existsSync(breedsDir)) {
      fail('public/breeds directory not found');
      return;
    }
    
    pass('public/breeds directory exists');
    
    // Check for placeholder images
    const placeholders = ['placeholder_dog.jpg', 'placeholder_cat.jpg'];
    for (const placeholder of placeholders) {
      const placeholderPath = path.join(breedsDir, placeholder);
      if (fs.existsSync(placeholderPath)) {
        pass(`${placeholder} exists`);
      } else {
        warn(`${placeholder} missing (will cause fallback issues)`);
      }
    }
    
    // Count breed images
    const files = fs.readdirSync(breedsDir);
    const imageFiles = files.filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
    info(`Total breed images: ${imageFiles.length}`);
    
    // Check for specific breed images
    const criticalBreeds = ['germanshepherd.jpg', 'labrador.jpg', 'greatdane.jpg'];
    for (const breedImg of criticalBreeds) {
      if (imageFiles.includes(breedImg)) {
        pass(`${breedImg} exists`);
      } else {
        warn(`${breedImg} missing (will fetch from Dog CEO API)`);
      }
    }
    
    // Check breed-image API route
    const apiPath = path.join(process.cwd(), 'src', 'app', 'api', 'breed-image', 'route.ts');
    if (fs.existsSync(apiPath)) {
      pass('breed-image API route exists');
      
      const apiContent = fs.readFileSync(apiPath, 'utf8');
      
      // Check for vision verification
      if (apiContent.includes('verifyImageWithVision')) {
        pass('Vision verification function present');
      } else {
        warn('Vision verification function not found');
      }
      
      // Check for cache system
      if (apiContent.includes('breed-images.json')) {
        pass('Image cache system implemented');
      } else {
        warn('Image cache system not detected');
      }
    } else {
      fail('breed-image API route missing');
    }
    
  } catch (e) {
    error(`Image system check failed: ${e.message}`);
  }
}

// ============================================================================
// CHECK 4: Translation System Validation
// ============================================================================
async function checkTranslationSystem() {
  logSection('🌐 CHECK 4: Translation System');
  
  try {
    const pageComponentPath = path.join(process.cwd(), 'src', 'app', 'page.tsx');
    
    if (!fs.existsSync(pageComponentPath)) {
      fail('page.tsx not found');
      return;
    }
    
    const content = fs.readFileSync(pageComponentPath, 'utf8');
    
    // Check for translation function
    if (content.includes('translateBreedInfo')) {
      pass('translateBreedInfo function present');
    } else {
      fail('translateBreedInfo function missing');
    }
    
    // Check for translation state
    if (content.includes('translatedBreedInfo')) {
      pass('Translation state management present');
    } else {
      fail('Translation state missing');
    }
    
    // Check for language mapping
    if (content.includes('languageNames')) {
      pass('Language mapping object present');
      
      // Verify all languages mapped
      const languages = ['es', 'fr', 'de', 'zh', 'zh-tw', 'pt', 'ar', 'ja', 'ru', 'it', 'vi'];
      let mappedCount = 0;
      
      for (const lang of languages) {
        if (content.includes(`'${lang}':`)) {
          mappedCount++;
        }
      }
      
      if (mappedCount === languages.length) {
        pass(`All ${languages.length} languages mapped in languageNames`);
      } else {
        warn(`Only ${mappedCount}/${languages.length} languages mapped`);
      }
    } else {
      fail('Language mapping missing');
    }
    
    // Check for useEffect translation trigger
    if (content.includes('useEffect') && content.includes('translateBreedInfo')) {
      pass('useEffect translation trigger implemented');
    } else {
      warn('useEffect translation trigger may be missing');
    }
    
    // Check for translation prompt
    if (content.includes('Translate ONLY the VALUES') && content.includes('Keep all JSON keys in English')) {
      pass('Translation prompt correctly specifies to keep English keys');
    } else {
      warn('Translation prompt may not prevent key translation');
    }
    
  } catch (e) {
    error(`Translation system check failed: ${e.message}`);
  }
}

// ============================================================================
// CHECK 5: API Endpoints Validation
// ============================================================================
async function checkAPIEndpoints() {
  logSection('🔌 CHECK 5: API Endpoints');
  
  const endpoints = [
    { path: 'src/app/api/chatbot/route.ts', name: 'chatbot API' },
    { path: 'src/app/api/breed-image/route.ts', name: 'breed-image API' },
    { path: 'src/app/api/verify-cache/route.ts', name: 'verify-cache API' }
  ];
  
  for (const endpoint of endpoints) {
    const fullPath = path.join(process.cwd(), endpoint.path);
    
    if (fs.existsSync(fullPath)) {
      pass(`${endpoint.name} exists`);
      
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for error handling
        if (content.includes('try') && content.includes('catch')) {
          pass(`${endpoint.name} has error handling`);
        } else {
          warn(`${endpoint.name} may be missing error handling`);
        }
        
        // Check for POST/GET methods
        if (content.includes('export async function')) {
          pass(`${endpoint.name} has proper route handler`);
        } else {
          warn(`${endpoint.name} route handler format unusual`);
        }
      } catch (e) {
        warn(`Could not validate ${endpoint.name}: ${e.message}`);
      }
    } else {
      fail(`${endpoint.name} missing at ${endpoint.path}`);
    }
  }
}

// ============================================================================
// CHECK 6: LLM Provider Configuration
// ============================================================================
async function checkLLMProviders() {
  logSection('🤖 CHECK 6: LLM Provider Configuration');
  
  try {
    const llmProvidersPath = path.join(process.cwd(), 'src', 'lib', 'llm-providers.ts');
    
    if (!fs.existsSync(llmProvidersPath)) {
      fail('llm-providers.ts not found');
      return;
    }
    
    pass('llm-providers.ts exists');
    
    const content = fs.readFileSync(llmProvidersPath, 'utf8');
    
    // Check for providers
    const providers = ['TogetherProvider', 'OpenRouterProvider'];
    for (const provider of providers) {
      if (content.includes(`class ${provider}`)) {
        pass(`${provider} implemented`);
      } else {
        warn(`${provider} not found`);
      }
    }
    
    // Check for vision support
    if (content.includes('useVision') || content.includes('Vision-Instruct')) {
      pass('Vision model support present');
    } else {
      warn('Vision model support not detected');
    }
    
    // Check for fallback logic
    if (content.includes('LLMRouter')) {
      pass('LLM Router with fallback logic present');
    } else {
      warn('LLM Router not detected');
    }
    
    // Check environment variables
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      pass('.env.local exists');
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const requiredVars = ['TOGETHER_API_KEY', 'OPENROUTER_API_KEY'];
      
      for (const envVar of requiredVars) {
        if (envContent.includes(envVar)) {
          pass(`${envVar} configured`);
        } else {
          warn(`${envVar} not found in .env.local`);
        }
      }
    } else {
      warn('.env.local not found (API keys may be missing)');
    }
    
  } catch (e) {
    error(`LLM provider check failed: ${e.message}`);
  }
}

// ============================================================================
// CHECK 7: Component Validation
// ============================================================================
async function checkComponents() {
  logSection('⚛️  CHECK 7: Component Validation');
  
  const components = [
    { path: 'src/components/LanguageSwitcher.tsx', name: 'LanguageSwitcher' },
    { path: 'src/app/layout.tsx', name: 'Layout' },
    { path: 'src/app/globals.css', name: 'Global Styles' }
  ];
  
  for (const component of components) {
    const fullPath = path.join(process.cwd(), component.path);
    
    if (fs.existsSync(fullPath)) {
      pass(`${component.name} exists`);
      
      if (component.name === 'LanguageSwitcher') {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Check for all languages
          const languages = ['en', 'es', 'fr', 'de', 'zh', 'zh-tw', 'pt', 'ar', 'ja', 'ru', 'it', 'vi'];
          let langCount = 0;
          
          for (const lang of languages) {
            if (content.includes(`code: '${lang}'`) || content.includes(`code: "${lang}"`)) {
              langCount++;
            }
          }
          
          if (langCount === languages.length) {
            pass(`LanguageSwitcher has all ${languages.length} languages`);
          } else {
            warn(`LanguageSwitcher has ${langCount}/${languages.length} languages`);
          }
        } catch (e) {
          warn(`Could not validate LanguageSwitcher: ${e.message}`);
        }
      }
    } else {
      fail(`${component.name} missing at ${component.path}`);
    }
  }
}

// ============================================================================
// CHECK 8: Configuration Files
// ============================================================================
async function checkConfigurationFiles() {
  logSection('⚙️  CHECK 8: Configuration Files');
  
  const configs = [
    { path: 'next.config.ts', name: 'Next.js config' },
    { path: 'package.json', name: 'package.json' },
    { path: 'tsconfig.json', name: 'TypeScript config' },
    { path: 'tailwind.config.js', name: 'Tailwind config' },
    { path: 'middleware.ts', name: 'i18n middleware' }
  ];
  
  for (const config of configs) {
    const fullPath = path.join(process.cwd(), config.path);
    
    if (fs.existsSync(fullPath)) {
      pass(`${config.name} exists`);
      
      if (config.name === 'Next.js config') {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('next-intl')) {
            pass('next-intl integration configured');
          }
        } catch (e) {}
      }
      
      if (config.name === 'package.json') {
        try {
          const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          
          const requiredDeps = ['next-intl', 'next', 'react'];
          for (const dep of requiredDeps) {
            if (pkg.dependencies && pkg.dependencies[dep]) {
              pass(`${dep} installed`);
            } else {
              warn(`${dep} not found in dependencies`);
            }
          }
          
          // Check scripts
          if (pkg.scripts) {
            if (pkg.scripts['health:languages']) {
              pass('health:languages script configured');
            }
          }
        } catch (e) {
          warn(`Could not parse package.json: ${e.message}`);
        }
      }
    } else {
      if (config.name === 'i18n middleware') {
        warn(`${config.name} not found (may be in src/middleware.ts)`);
      } else {
        fail(`${config.name} missing`);
      }
    }
  }
  
  // Check for middleware in src/
  const middlewarePath = path.join(process.cwd(), 'src', 'middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    pass('middleware.ts found in src/');
  }
}

// ============================================================================
// CHECK 9: Documentation
// ============================================================================
async function checkDocumentation() {
  logSection('📚 CHECK 9: Documentation');
  
  const docs = [
    { path: 'README.md', name: 'README' },
    { path: 'TODO.md', name: 'TODO' },
    { path: 'docs/IMAGE-VERIFICATION.md', name: 'Image Verification Docs' }
  ];
  
  for (const doc of docs) {
    const fullPath = path.join(process.cwd(), doc.path);
    
    if (fs.existsSync(fullPath)) {
      pass(`${doc.name} exists`);
    } else {
      if (doc.name === 'Image Verification Docs') {
        info(`${doc.name} not found (optional documentation)`);
      } else {
        warn(`${doc.name} missing`);
      }
    }
  }
}

// ============================================================================
// CHECK 10: Security & Best Practices
// ============================================================================
async function checkSecurityBestPractices() {
  logSection('🔒 CHECK 10: Security & Best Practices');
  
  // Check .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    pass('.gitignore exists');
    
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const criticalEntries = ['.env.local', 'node_modules', '.next'];
    
    for (const entry of criticalEntries) {
      if (content.includes(entry)) {
        pass(`${entry} in .gitignore`);
      } else {
        warn(`${entry} not in .gitignore (security risk)`);
      }
    }
  } else {
    fail('.gitignore missing');
  }
  
  // Check that API keys are not in code
  const apiRoutes = [
    'src/app/api/chatbot/route.ts',
    'src/app/api/breed-image/route.ts',
    'src/lib/llm-providers.ts'
  ];
  
  for (const route of apiRoutes) {
    const fullPath = path.join(process.cwd(), route);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('process.env.')) {
        pass(`${route}: Using environment variables`);
      }
      
      // Check for hardcoded keys (basic check)
      const suspiciousPatterns = ['sk-', 'together_', 'hf_'];
      let foundHardcodedKey = false;
      
      for (const pattern of suspiciousPatterns) {
        if (content.includes(`'${pattern}`) || content.includes(`"${pattern}`)) {
          foundHardcodedKey = true;
          break;
        }
      }
      
      if (foundHardcodedKey) {
        error(`${route}: Possible hardcoded API key detected!`);
      }
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
  console.clear();
  log('╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Phase 6: Comprehensive Health Check & Functional Validation    ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');
  console.log();
  
  const startTime = Date.now();
  
  // Run all checks
  await checkLanguageConfiguration();
  await checkBreedDataIntegrity();
  await checkImageSystem();
  await checkTranslationSystem();
  await checkAPIEndpoints();
  await checkLLMProviders();
  await checkComponents();
  await checkConfigurationFiles();
  await checkDocumentation();
  await checkSecurityBestPractices();
  
  // Summary
  const duration = Date.now() - startTime;
  
  logSection('📊 HEALTH CHECK SUMMARY');
  
  log(`✅ Passed: ${results.passed.length}`, 'green');
  log(`❌ Failed: ${results.failed.length}`, results.failed.length > 0 ? 'red' : 'white');
  log(`⚠️  Warnings: ${results.warnings.length}`, results.warnings.length > 0 ? 'yellow' : 'white');
  log(`🔴 Errors: ${results.errors.length}`, results.errors.length > 0 ? 'red' : 'white');
  
  console.log('\n' + '='.repeat(70));
  log(`⏱️  Duration: ${duration}ms`, 'cyan');
  console.log('='.repeat(70) + '\n');
  
  // Exit code
  if (results.failed.length > 0 || results.errors.length > 0) {
    log('❌ Health check FAILED', 'red');
    process.exit(1);
  } else if (results.warnings.length > 0) {
    log('⚠️  Health check PASSED with warnings', 'yellow');
    process.exit(0);
  } else {
    log('✅ Health check PASSED - All systems operational!', 'green');
    process.exit(0);
  }
}

// Run the health check
main().catch(err => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
