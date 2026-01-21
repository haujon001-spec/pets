# LLM Image Verification System

## Overview

The application now uses **LLM vision models** to automatically verify that cached breed images actually match the breed they're supposed to represent. This prevents incorrect images (like a Curly-Coated Retriever being shown for Golden Retriever).

## How It Works

### Automatic Verification on Fetch

When a new breed image is fetched and cached:

1. **Image is downloaded** from Dog CEO API or The Cat API
2. **LLM vision model analyzes** the image using `meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo`
3. **AI determines** if the image matches the breed with confidence score (0-100%)
4. **If incorrect** (confidence > 70%): Image is deleted, placeholder is used instead
5. **If correct**: Image is cached with verification metadata

### Cache Metadata Enhancement

Each cached image now includes verification data:

```json
{
  "goldenretriever.jpg": {
    "fetchedAt": "2026-01-21T12:00:00.000Z",
    "sourceUrl": "https://images.dog.ceo/breeds/retriever-golden/n02099712_123.jpg",
    "expiresAt": "2026-01-28T12:00:00.000Z",
    "verified": true,
    "verifiedAt": "2026-01-21T12:00:05.000Z",
    "verificationScore": 95
  }
}
```

### Verification Endpoints

#### **POST /api/verify-cache**

Verifies all cached images using LLM vision.

**Request Body:**
```json
{
  "forceRecheck": false  // Set to true to re-verify already verified images
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 25,
    "verified": 22,
    "failed": 2,
    "skipped": 1
  },
  "results": [
    {
      "filename": "goldenretriever.jpg",
      "breedName": "Golden Retriever",
      "petType": "dog",
      "verified": true,
      "confidence": 95,
      "reasoning": "Image clearly shows a Golden Retriever with characteristic golden coat and friendly expression",
      "status": "verified"
    }
  ]
}
```

#### **GET /api/verify-cache**

Get verification status of all cached images.

**Response:**
```json
{
  "summary": {
    "total": 30,
    "verified": 25,
    "unverified": 2,
    "pending": 3
  },
  "images": [...]
}
```

## Usage Examples

### Verify All Cached Images

```bash
# Using PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/verify-cache" -Method POST -ContentType "application/json" -Body '{"forceRecheck":false}'

# Using curl
curl -X POST http://localhost:3000/api/verify-cache -H "Content-Type: application/json" -d '{"forceRecheck":false}'
```

### Force Re-verification

```bash
curl -X POST http://localhost:3000/api/verify-cache -H "Content-Type: application/json" -d '{"forceRecheck":true}'
```

### Check Verification Status

```bash
curl http://localhost:3000/api/verify-cache
```

## Vision Model Details

**Model**: `meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo`
- **Provider**: Together AI
- **Capabilities**: Image analysis, breed identification
- **Accuracy**: High confidence (>90%) for common breeds
- **Latency**: ~2-5 seconds per image

**Prompt Template**:
```
You are an expert pet breed identifier. Analyze this image and determine if it shows a [BREED_NAME] [PET_TYPE].

Respond with ONLY a JSON object in this exact format:
{
  "isCorrect": true or false,
  "confidence": 0-100,
  "reasoning": "brief explanation"
}

Be strict - only return true if you're confident this is actually a [BREED_NAME].
```

## Benefits

✅ **Prevents incorrect images** - No more Curly Retrievers for Golden Retrievers
✅ **Automatic quality control** - AI validates every cached image
✅ **Confidence scoring** - Know how reliable each verification is
✅ **Audit trail** - Track when each image was verified
✅ **Periodic validation** - Run batch checks to ensure cache quality
✅ **Cost-effective** - Only verifies new images, skips already-verified

## Improved Breed Matching

The breed image fetching logic now includes:

1. **Exact sub-breed matching** - "Golden Retriever" prioritizes `retriever/golden` over `retriever/curly`
2. **Word-level verification** - All words in breed name must match API key
3. **Pre-fuzzy exact checks** - Try exact matches before fuzzy search
4. **Confidence logging** - See how well breed names match API keys

## Configuration

Set in `.env.local`:

```env
TOGETHER_API_KEY=your_together_ai_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # or your production URL
```

## Monitoring

Check terminal logs for verification results:

```
[breed-image] 🔍 Verifying image for Golden Retriever (dog)...
[breed-image] ✅ Vision verification: ✓ CORRECT (95% confidence)
[breed-image] 💭 Reasoning: Image clearly shows a Golden Retriever with characteristic golden coat
```

## Future Enhancements

- [ ] Scheduled periodic verification (daily/weekly cron job)
- [ ] Email alerts for failed verifications
- [ ] Admin dashboard to view verification status
- [ ] Multi-model consensus (use 2+ vision models for higher accuracy)
- [ ] User reporting system for incorrect images
