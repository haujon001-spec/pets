# AI Image Generation for Custom Breeds

## Overview

When users ask about custom or rare breeds that aren't available in the Dog CEO API or Cat API, the system now supports **AI-generated images** as an intelligent fallback. This ensures every breed request gets a high-quality, accurate image.

## How It Works

The breed image API follows this waterfall strategy:

```
1. Dog CEO API (for dogs)
   ↓ (if fails)
2. TheCatAPI (for cats)
   ↓ (if fails)
3. Pexels (dogs only)
   ↓ (if fails)
4. Unsplash
   ↓ (if fails)
5. **AI Image Generation** ← NEW!
   - DALL-E 3 (OpenAI) - Best quality
   - Stable Diffusion XL (Replicate) - Cost-effective
   - Together AI SDXL - Alternative
```

## Supported AI Providers

### 1. OpenAI DALL-E 3 (Recommended)

**Best for:** Highest quality, most realistic images

**Pricing:**
- Standard quality: $0.040 per image
- HD quality: $0.080 per image

**Setup:**
```bash
# Get API key from https://platform.openai.com/api-keys
echo "OPENAI_API_KEY=sk-proj-..." >> .env
```

**Features:**
- 1024x1024 resolution
- Natural photographic style
- Excellent breed accuracy
- Fast generation (~10 seconds)

### 2. Replicate (Stable Diffusion XL)

**Best for:** Cost-effective, open-source alternative

**Pricing:**
- ~$0.0025 per image (100x cheaper than DALL-E!)

**Setup:**
```bash
# Get token from https://replicate.com/account/api-tokens
echo "REPLICATE_API_TOKEN=r8_..." >> .env
```

**Features:**
- 1024x1024 resolution
- Good quality (slightly less realistic than DALL-E)
- Slower (~30-60 seconds)
- Open-source model

### 3. Together AI (SDXL)

**Best for:** If you already have Together AI for LLM

**Pricing:**
- Check Together AI pricing (varies)

**Setup:**
```bash
# Uses your existing TOGETHER_API_KEY
# No additional setup needed!
```

**Features:**
- 1024x1024 resolution
- Good quality
- Fast generation

## Configuration

### Required Environment Variables

Add to your `.env` or VPS `.env` file:

```bash
# OPTION 1: Use DALL-E 3 (best quality)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# OPTION 2: Use Replicate (most affordable)
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxx

# OPTION 3: Use Together AI (if you already have it)
TOGETHER_API_KEY=xxxxxxxxxxxxx
```

**Note:** You only need ONE of these. The system will try them in order:
1. DALL-E 3 (if `OPENAI_API_KEY` is set)
2. Replicate (if `REPLICATE_API_TOKEN` is set)
3. Together AI (if `TOGETHER_API_KEY` is set)

### Deployment

#### Local Development

```bash
# Add to .env.local
echo "OPENAI_API_KEY=sk-proj-..." >> .env.local

# Restart dev server
npm run dev
```

#### VPS Production

```bash
# SSH to your VPS
ssh root@aibreeds-demo.com

# Add to /root/pets/.env
echo "OPENAI_API_KEY=sk-proj-..." >> /root/pets/.env

# Rebuild and restart container
cd /root/pets
docker build -f Dockerfile.prod -t pet-portal:latest .
docker stop app && docker rm app
docker run -d --name app --network pet-network --env-file .env -p 3000:3000 --restart unless-stopped pet-portal:latest
```

## Testing

### Test Custom Breed

1. Go to https://aibreeds-demo.com
2. Type: **"Tell me about a Singapura cat"** or **"Show me a Savannah cat"**
3. If Cat API doesn't have it, AI will generate a realistic image

### Check Logs

```bash
# On VPS
docker logs app -f | grep "breed-image"

# Look for:
# [breed-image] 🎨 Attempting AI image generation for Singapura (cat)
# [breed-image] Trying DALL-E 3...
# [breed-image] ✅ DALL-E 3 generated image successfully
```

### Verify Cached Images

```bash
# On VPS
ls -lh /root/pets/public/breeds/
# You should see AI-generated images saved
```

## Cost Considerations

### Expected Usage

- Most breeds are covered by free APIs (Dog CEO, Cat API)
- AI generation only triggers for rare/custom breeds
- Images are cached for 7 days (reduces repeat costs)

### Estimated Monthly Costs

Assuming 1000 unique chatbot sessions/month:

| Scenario | DALL-E 3 | Replicate | Together AI |
|----------|----------|-----------|-------------|
| 5% custom breeds (50 images) | $2.00 | $0.13 | ~$0.50 |
| 10% custom breeds (100 images) | $4.00 | $0.25 | ~$1.00 |
| 20% custom breeds (200 images) | $8.00 | $0.50 | ~$2.00 |

**Recommendation:** Start with Replicate for testing ($0.25/month), upgrade to DALL-E 3 for production quality.

## Technical Implementation

### Image Generation Prompt

```typescript
const prompt = `A professional high-quality photograph of a ${breedName} ${petType}, realistic, detailed, studio lighting, facing camera, full body visible, neutral background`;
```

### Quality Assurance

- AI-generated images skip vision verification (they're already correct)
- Images are optimized to 800x800 JPEG (85% quality)
- Cached for 7 days to prevent regeneration costs
- All images have metadata tracking in `.cache-metadata.json`

### Error Handling

If all AI providers fail:
- Falls back to generic placeholder (`placeholder_dog.jpg` or `placeholder_cat.jpg`)
- Logs detailed error for debugging
- User still gets response (just without breed-specific image)

## Troubleshooting

### "AI image generation failed"

**Check:**
1. API key is valid: `docker exec app env | grep API_KEY`
2. API key has credits: Check provider dashboard
3. Network connectivity: `docker logs app --tail 50`

### "Image still using placeholder"

**Debug:**
```bash
# Check logs for specific breed
docker logs app --tail 100 | grep -i "breedname"

# Verify AI provider tried
docker logs app | grep "Attempting AI image generation"
```

### Cost Concerns

**Solutions:**
1. Use Replicate instead of DALL-E (100x cheaper)
2. Increase cache TTL from 7 to 30 days (fewer regenerations)
3. Add usage monitoring in provider dashboard
4. Set spending limits in OpenAI/Replicate settings

## Future Enhancements

- [ ] Support for HuggingFace Inference API (free tier)
- [ ] Add retry logic for failed generations
- [ ] Implement image quality scoring
- [ ] Generate multiple variants and pick best
- [ ] User preference for AI style (realistic vs artistic)
- [ ] Generate images for all breeds proactively (pre-cache)

## References

- [OpenAI DALL-E 3 API](https://platform.openai.com/docs/guides/images)
- [Replicate SDXL Model](https://replicate.com/stability-ai/sdxl)
- [Together AI Image Models](https://docs.together.ai/docs/image-models)
- [Stable Diffusion Documentation](https://stability.ai/stable-diffusion)

## Support

Questions? Issues? Check:
1. `/docs/DEPLOYMENT-GUIDE.md` for deployment help
2. `/docs/HEALTH-CHECK.md` for diagnostic tools
3. Project logs: `docker logs app -f`
