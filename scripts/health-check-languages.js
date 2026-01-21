/**
 * Language Configuration Health Check
 * 
 * Validates that all languages are properly configured for:
 * - Translation files exist
 * - Language codes match between components and translation system
 * - LLM language mapping is complete
 */

const fs = require('fs');
const path = require('path');

// Expected languages from LanguageSwitcher component
const EXPECTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-tw', name: 'Chinese (Traditional)' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ru', name: 'Russian' },
  { code: 'it', name: 'Italian' },
  { code: 'vi', name: 'Vietnamese' },
];

// LLM language mapping from page.tsx
const LLM_LANGUAGE_MAP = {
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'zh': 'Chinese (Simplified)',
  'zh-tw': 'Chinese (Traditional)',
  'pt': 'Portuguese',
  'ar': 'Arabic',
  'ja': 'Japanese',
  'ru': 'Russian',
  'it': 'Italian',
  'vi': 'Vietnamese'
};

const messagesDir = path.join(__dirname, '../messages');
const errors = [];
const warnings = [];
const info = [];

console.log('🔍 Running Language Configuration Health Check...\n');

// Check 1: Verify all expected languages have translation files
console.log('📁 Checking translation files...');
EXPECTED_LANGUAGES.forEach(lang => {
  const filename = `${lang.code}.json`;
  const filepath = path.join(messagesDir, filename);
  
  if (!fs.existsSync(filepath)) {
    errors.push(`❌ Missing translation file for ${lang.name} (${lang.code}): ${filename}`);
  } else {
    // Validate JSON structure
    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      const json = JSON.parse(content);
      
      // Check required sections
      const requiredSections = ['app', 'petType', 'breed', 'question', 'breedInfo', 'breeds'];
      const missingSections = requiredSections.filter(section => !json[section]);
      
      if (missingSections.length > 0) {
        warnings.push(`⚠️  ${lang.name} (${filename}) missing sections: ${missingSections.join(', ')}`);
      } else {
        info.push(`✅ ${lang.name} (${filename}): Valid`);
      }
    } catch (err) {
      errors.push(`❌ Invalid JSON in ${filename}: ${err.message}`);
    }
  }
});

// Check 2: Verify LLM language mapping is complete
console.log('\n🤖 Checking LLM language mapping...');
EXPECTED_LANGUAGES.forEach(lang => {
  if (lang.code === 'en') {
    info.push(`✅ ${lang.name} (${lang.code}): English is default, no mapping needed`);
    return;
  }
  
  if (!LLM_LANGUAGE_MAP[lang.code]) {
    errors.push(`❌ Missing LLM language mapping for ${lang.name} (${lang.code})`);
  } else {
    const mappedName = LLM_LANGUAGE_MAP[lang.code];
    if (mappedName !== lang.name) {
      warnings.push(`⚠️  LLM mapping mismatch: ${lang.code} maps to "${mappedName}" but language name is "${lang.name}"`);
    } else {
      info.push(`✅ ${lang.name} (${lang.code}): Mapped to "${mappedName}"`);
    }
  }
});

// Check 3: Verify LanguageSwitcher.tsx has all languages
console.log('\n🔧 Checking LanguageSwitcher component...');
const languageSwitcherPath = path.join(__dirname, '../src/components/LanguageSwitcher.tsx');
if (fs.existsSync(languageSwitcherPath)) {
  const content = fs.readFileSync(languageSwitcherPath, 'utf-8');
  
  EXPECTED_LANGUAGES.forEach(lang => {
    const codePattern = new RegExp(`code:\\s*['"]${lang.code}['"]`, 'i');
    if (!codePattern.test(content)) {
      errors.push(`❌ LanguageSwitcher.tsx missing language: ${lang.name} (${lang.code})`);
    }
  });
  
  info.push(`✅ LanguageSwitcher.tsx contains all expected languages`);
} else {
  errors.push(`❌ LanguageSwitcher.tsx not found`);
}

// Check 4: Verify page.tsx has correct language mapping
console.log('\n📄 Checking page.tsx language mapping...');
const pagePath = path.join(__dirname, '../src/app/page.tsx');
if (fs.existsSync(pagePath)) {
  const content = fs.readFileSync(pagePath, 'utf-8');
  
  // Extract languageNames object - more flexible regex
  const languageNamesMatch = content.match(/const\s+languageNames[\s\S]*?{([\s\S]*?)};/);
  if (languageNamesMatch) {
    const languageNamesContent = languageNamesMatch[1];
    
    EXPECTED_LANGUAGES.forEach(lang => {
      if (lang.code === 'en') return; // Skip English
      
      // More flexible pattern to match both formats: 'code':'name' or "code":"name"
      const pattern = new RegExp(`['"]${lang.code.replace('-', '\\-')}['"]\\s*:\\s*['"]([^'"]+)['"]`);
      const match = languageNamesContent.match(pattern);
      
      if (!match) {
        errors.push(`❌ page.tsx languageNames missing: ${lang.name} (${lang.code})`);
      } else {
        const mappedValue = match[1];
        if (mappedValue !== LLM_LANGUAGE_MAP[lang.code]) {
          warnings.push(`⚠️  page.tsx mapping inconsistency for ${lang.code}: "${mappedValue}" vs expected "${LLM_LANGUAGE_MAP[lang.code]}"`);
        } else {
          info.push(`✅ ${lang.name} (${lang.code}): LLM mapping verified`);
        }
      }
    });
    
    info.push(`✅ page.tsx languageNames object validated`);
  } else {
    errors.push(`❌ Could not find languageNames object in page.tsx`);
  }
} else {
  errors.push(`❌ page.tsx not found`);
}

// Check 5: List all translation files to detect extra/orphaned files
console.log('\n🗂️  Checking for orphaned translation files...');
const translationFiles = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));
const expectedFiles = EXPECTED_LANGUAGES.map(l => `${l.code}.json`);

translationFiles.forEach(file => {
  if (!expectedFiles.includes(file)) {
    warnings.push(`⚠️  Orphaned translation file: ${file} (not in EXPECTED_LANGUAGES)`);
  }
});

// Check 6: Verify all translation files have required breed-related keys
console.log('\n🔑 Checking breed-related translation keys...');
const requiredBreedKeys = ['breedInfo.temperament', 'breedInfo.lifespan', 'breedInfo.description', 'breedInfo.origin', 'breedInfo.traits'];

EXPECTED_LANGUAGES.forEach(lang => {
  const filename = `${lang.code}.json`;
  const filepath = path.join(messagesDir, filename);
  
  if (fs.existsSync(filepath)) {
    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      const json = JSON.parse(content);
      
      const missingKeys = [];
      if (!json.breedInfo?.temperament) missingKeys.push('breedInfo.temperament');
      if (!json.breedInfo?.lifespan) missingKeys.push('breedInfo.lifespan');
      if (!json.breedInfo?.description) missingKeys.push('breedInfo.description');
      if (!json.breedInfo?.origin) missingKeys.push('breedInfo.origin');
      if (!json.breedInfo?.traits) missingKeys.push('breedInfo.traits');
      
      if (missingKeys.length > 0) {
        warnings.push(`⚠️  ${lang.name} missing breed info keys: ${missingKeys.join(', ')}`);
      } else {
        info.push(`✅ ${lang.name}: All breed info keys present`);
      }
    } catch (err) {
      // Already reported as invalid JSON in earlier check
    }
  }
});

// Check 7: Verify console logging is enabled for translation debugging
console.log('\n🐛 Checking translation debugging setup...');
if (fs.existsSync(pagePath)) {
  const content = fs.readFileSync(pagePath, 'utf-8');
  
  if (content.includes('console.log(`🌐 Translating')) {
    info.push(`✅ Translation debugging enabled in page.tsx`);
  } else {
    warnings.push(`⚠️  Translation debugging not found in page.tsx - add console.log for 🌐 Translating`);
  }
  
  if (content.includes('console.log(`🔄 Translation check:')) {
    info.push(`✅ Translation trigger logging enabled`);
  } else {
    warnings.push(`⚠️  Translation trigger logging not found - add console.log for 🔄 Translation check`);
  }
}


// Print Summary
console.log('\n' + '='.repeat(60));
console.log('📊 HEALTH CHECK SUMMARY');
console.log('='.repeat(60));

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(err => console.log(err));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warn => console.log(warn));
}

console.log('\n✅ PASSED CHECKS:');
info.forEach(i => console.log(i));

console.log('\n' + '='.repeat(60));
console.log(`Total Languages: ${EXPECTED_LANGUAGES.length}`);
console.log(`Translation Files: ${translationFiles.length}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log('='.repeat(60));

// Exit with error code if there are critical errors
if (errors.length > 0) {
  console.log('\n❌ Health check FAILED with errors');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Health check PASSED with warnings');
  process.exit(0);
} else {
  console.log('\n✅ Health check PASSED - All configurations are valid!');
  process.exit(0);
}
