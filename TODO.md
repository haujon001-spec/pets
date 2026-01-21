# TODO List

## ✅ Recently Completed (Phase 6 - January 21, 2026)

### LLM Translation System
- ✅ **Dynamic Breed Info Translation**: LLM-powered translation of temperament, description, origin, traits
- ✅ **Client-Side Caching**: Prevents redundant LLM API calls with `translatedBreedInfo` state
- ✅ **Vietnamese Support**: Full translation system with proper re-rendering via useEffect
- ✅ **Chinese Traditional Support**: Added zh-tw with 143 lines of translations
- ✅ **Translation Prompt Engineering**: Fixed LLM translating JSON keys issue
- ✅ **Auto-Translation Trigger**: useEffect hook for proper state updates and re-renders

### Image Verification System
- ✅ **Vision AI Integration**: Llama-3.2-11B-Vision-Instruct-Turbo for image validation
- ✅ **Automatic Verification**: Verifies images when fetched from Dog CEO API
- ✅ **Confidence Scoring**: 0-100% confidence with mismatch detection
- ✅ **Fallback Strategy**: OpenRouter fallback when Together AI vision unavailable
- ✅ **German Shepherd Fix**: Deleted incorrect image for re-fetch with verification

### Comprehensive Health Check System
- ✅ **Phase 6 Health Check**: 10-category validation with 66 automated checks
- ✅ **Image Verification Script**: Test suite for validating all breed images
- ✅ **Language Validation**: Automated checks for all 12 translation files
- ✅ **NPM Scripts**: `health:phase6` and `test:images` commands
- ✅ **Security Validation**: API key detection, .gitignore verification

### Bug Fixes
- ✅ **Vietnamese Translation Display**: Fixed state update not triggering re-render
- ✅ **JSON Syntax Errors**: Fixed ar.json, ru.json, it.json duplicate closing braces
- ✅ **Translation Field Names**: LLM now keeps English keys, only translates values
- ✅ **Language Mapping**: All 12 languages properly mapped in page.tsx

---

## Known Issues - To Be Addressed Later

### Missing Placeholder Images (404 Errors)
- **Status**: Non-critical - UI cosmetic issue
- **Issue**: Decorative background images referenced in page.tsx don't exist
  - `/breeds/labrador.jpg` - 404 error (referenced in background)
  - `/breeds/mainecoon.jpg` - 404 error (referenced in background)
  - `/breeds/siamese.jpg` - 404 error (referenced in background)
- **Impact**: Console shows 404 errors and "not a valid image" warnings, but app functions normally
- **Root Cause**: Background decoration images in `page.tsx` reference local files that were never created
- **Action Needed**:
  1. Either remove the decorative Image components from page.tsx
  2. Or create/download placeholder images for these breeds
  3. Or fetch them dynamically using the breed-image API on initial load
- **Priority**: Low (doesn't affect functionality, only creates console noise)
- **Detected**: January 21, 2026 - Phase 4 Mobile Optimization testing

### Hugging Face LLM Provider Not Working
- **Status**: Blocked - API deprecated
- **Issue**: Hugging Face deprecated their old Inference API endpoint
  - Old endpoint: `https://api-inference.huggingface.co` returns 410 Gone
  - New endpoint: `https://router.huggingface.co` returns 404 Not Found
- **Impact**: Currently removed from provider chain (using Together AI + OpenRouter)
- **Action Needed**: 
  1. Research Hugging Face's new Serverless Inference API documentation
  2. Update `HuggingFaceProvider` implementation in `src/lib/llm-providers.ts`
  3. Test with API key and re-enable in provider order
- **Priority**: Low (Together AI provides free tier as alternative)

---

## Deployment Tasks

### VPS/Caddy/Next.js Deployment Troubleshooting

1. Identify which process is using port 80 and stop it.
2. Restart the docker compose stack cleanly.
3. Verify the Caddy container is exposing ports 80 and 443.
4. Check Caddy logs for SSL/certificate errors.
5. Test public access to https://aibreeds-demo.com.
6. Document and automate recovery steps for future deployments.

_Resume from here next session to resolve port conflicts and ensure public access is working._
