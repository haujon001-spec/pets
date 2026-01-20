# LLM Provider Comparison & Setup Guide

This document provides detailed information about each LLM provider integrated into the Pet Breed Portal, including setup instructions, regional availability, and performance characteristics.

**Last Updated:** January 20, 2026

---

## Overview

The portal uses a cascading fallback system that tries multiple LLM providers in order until one succeeds. This ensures maximum uptime and regional availability, particularly important for users in Hong Kong where certain APIs may be blocked.

### Provider Priority (Default)

1. **Groq** - Primary (free, fast)
2. **Together AI** - Secondary (free)
3. **Hugging Face** - Tertiary (free)
4. **Cohere** - Quaternary (free trial)
5. **OpenRouter** - Last resort (paid)

---

## 1. Groq ⭐ RECOMMENDED

### Why Choose Groq?
- **Lightning fast** inference (sub-second responses)
- **Generous free tier** (30 req/min, 14,400/day)
- **High quality** Llama 3.3 70B model
- **Works in Hong Kong** ✅
- **No credit card required** for free tier

### Setup
1. Sign up at [console.groq.com](https://console.groq.com/keys)
2. Create an API key (instant approval)
3. Add to `.env.local`:
   ```env
   GROQ_API_KEY=gsk_...your_key_here...
   ```

### Technical Details
- **Model:** `llama-3.3-70b-versatile`
- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Format:** OpenAI-compatible API
- **Timeout:** 10 seconds
- **Rate Limit:** 30 requests/minute (free tier)

### Pros & Cons
✅ Extremely fast (500-1000ms typical)  
✅ High quality responses  
✅ Reliable uptime  
✅ No payment required  
❌ Rate limits on free tier (but very generous)

---

## 2. Together AI

### Why Choose Together AI?
- **Free tier available** with good limits
- **Multiple models** to choose from
- **Good performance** for most use cases
- **Works in Hong Kong** ✅

### Setup
1. Sign up at [api.together.xyz](https://api.together.xyz/signup)
2. Go to [Settings → API Keys](https://api.together.xyz/settings/api-keys)
3. Create new API key
4. Add to `.env.local`:
   ```env
   TOGETHER_API_KEY=...your_key_here...
   ```

### Technical Details
- **Model:** `meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo`
- **Endpoint:** `https://api.together.xyz/v1/chat/completions`
- **Format:** OpenAI-compatible API
- **Timeout:** 10 seconds
- **Rate Limit:** Varies by plan

### Pros & Cons
✅ Good free tier  
✅ Multiple model options  
✅ Reliable performance  
❌ Slightly slower than Groq  
❌ Free tier limits lower than Groq

---

## 3. Hugging Face Inference API

### Why Choose Hugging Face?
- **Free tier** for hobbyists
- **Many models** available
- **Flexible** - can switch models easily
- **Works in Hong Kong** ✅

### Setup
1. Sign up at [huggingface.co](https://huggingface.co/join)
2. Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
3. Create new token (read permission sufficient)
4. Add to `.env.local`:
   ```env
   HUGGINGFACE_API_KEY=hf_...your_token_here...
   ```

### Technical Details
- **Model:** `meta-llama/Llama-3.2-3B-Instruct`
- **Endpoint:** `https://api-inference.huggingface.co/models/{model}/v1/chat/completions`
- **Format:** OpenAI-compatible API
- **Timeout:** 15 seconds (can be slower on cold start)
- **Rate Limit:** Rate limited but generous

### Pros & Cons
✅ Free access to many models  
✅ No payment required  
✅ Good for experimentation  
❌ Can be slow on cold starts (model loading)  
❌ Quality varies by model  
⚠️ Rate limiting can be aggressive

---

## 4. Cohere

### Why Choose Cohere?
- **Free trial** available
- **Command models** with good quality
- **Easy to use** API
- **Works in Hong Kong** ✅

### Setup
1. Sign up at [cohere.com](https://dashboard.cohere.com/welcome/register)
2. Go to [API Keys](https://dashboard.cohere.com/api-keys)
3. Copy your trial API key
4. Add to `.env.local`:
   ```env
   COHERE_API_KEY=...your_key_here...
   ```

### Technical Details
- **Model:** `command-r-plus`
- **Endpoint:** `https://api.cohere.com/v2/chat`
- **Format:** Cohere-specific API (adapted to OpenAI format)
- **Timeout:** 10 seconds
- **Rate Limit:** 100 req/min (trial)

### Pros & Cons
✅ Good quality responses  
✅ Fast inference  
✅ 100 req/min on trial  
❌ Trial expires eventually  
❌ Requires payment for continued use  
⚠️ API format slightly different (handled by adapter)

---

## 5. OpenRouter (Fallback Only)

### Why Use OpenRouter?
- **Access to many models** (GPT-4, Claude, etc.)
- **Pay-per-use** pricing
- **Reliable** infrastructure
- **Last resort** when free options exhausted

### Setup
1. Sign up at [openrouter.ai](https://openrouter.ai/)
2. Add credits to your account
3. Get API key from [Keys](https://openrouter.ai/keys)
4. Add to `.env.local`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-...your_key_here...
   ```

### Technical Details
- **Model:** `openai/gpt-3.5-turbo` (configurable)
- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Format:** OpenAI-compatible API
- **Timeout:** 10 seconds
- **Cost:** ~$0.0005-0.002 per request (model dependent)

### Pros & Cons
✅ Access to premium models (GPT-4, Claude)  
✅ Very reliable  
✅ Good quality  
❌ **Costs money** (not free)  
⚠️ May be blocked in Hong Kong  
⚠️ OpenAI/Claude specifically unavailable in HK

---

## Regional Availability (Hong Kong Focus)

| Provider | Hong Kong Status | Notes |
|----------|------------------|-------|
| **Groq** | ✅ Works | Recommended primary choice |
| **Together AI** | ✅ Works | Good secondary option |
| **Hugging Face** | ✅ Works | Reliable fallback |
| **Cohere** | ✅ Works | Trial available |
| **OpenRouter** | ⚠️ Varies | OpenAI/Claude blocked, other models may work |

### Recommendation for HK Users:
```env
LLM_PROVIDER_ORDER=groq,together,huggingface,cohere
# Omit OpenRouter if blocked in your location
```

---

## Performance Comparison

Based on testing with the question: "What is the temperament of a Golden Retriever?"

| Provider | Avg Latency | Quality | Free Tier | HK Access |
|----------|-------------|---------|-----------|-----------|
| Groq | 600-800ms | ⭐⭐⭐⭐⭐ | 14.4K/day | ✅ |
| Together AI | 1-2s | ⭐⭐⭐⭐ | Good | ✅ |
| Hugging Face | 2-5s* | ⭐⭐⭐ | Limited | ✅ |
| Cohere | 1-1.5s | ⭐⭐⭐⭐ | 100/min trial | ✅ |
| OpenRouter | 1-2s | ⭐⭐⭐⭐⭐ | None (paid) | ⚠️ |

*Cold starts can be 10-20s for Hugging Face

---

## Best Practices

### For Development
- Start with **Groq only** (fastest setup)
- Add 1-2 backup providers for redundancy
- Test fallback behavior by temporarily removing keys

### For Production (VPS)
- Configure **at least 3 providers** for reliability
- Use **Groq → Together AI → Hugging Face** sequence
- Monitor which providers are being used (check logs)
- Set up alerts if all providers start failing

### For Cost Optimization
- Use **only free providers** (Groq, Together, HF, Cohere trial)
- Configure OpenRouter only if you need 99.99% uptime
- Monitor usage to avoid exceeding free tier limits

### For Hong Kong Deployment
- **Test each provider** from your VPS first
- Use VPN if needed to test blocked providers
- Remove blocked providers from `LLM_PROVIDER_ORDER`
- Primary recommendation: `groq,together,huggingface`

---

## Troubleshooting

### "No LLM providers configured"
**Cause:** No valid API keys in `.env.local`  
**Fix:** Add at least one API key and restart server

### "All LLM providers failed"
**Causes:**
- Network connectivity issues
- Invalid API keys
- Region blocks
- Rate limits exceeded

**Debug Steps:**
1. Check server logs for specific error messages
2. Test API key directly via curl/Postman
3. Verify provider is accessible from your region
4. Check rate limit status on provider dashboard

### Slow Responses
**Causes:**
- Using Hugging Face with cold model
- Network latency
- Provider under heavy load

**Solutions:**
- Prioritize Groq in provider order
- Increase timeout if needed
- Switch to different provider temporarily

### Provider-Specific Errors

**Groq 429 Error:**
- Rate limit exceeded (30/min)
- Wait 1 minute or add backup provider

**Hugging Face 503:**
- Model loading (cold start)
- Wait 10-20s and retry
- Consider using smaller model

**Cohere "Trial Expired":**
- Free trial ended
- Add payment method or remove from config

---

## Monitoring & Logging

### Server Logs
The system logs each LLM call:
```
🤖 Attempting LLM call with Groq...
✅ Success with Groq (650ms)
```

Or if fallback occurs:
```
🤖 Attempting LLM call with Groq...
❌ Groq failed: Rate limit exceeded
🤖 Attempting LLM call with Together AI...
✅ Success with Together AI (1200ms)
```

### HTTP Headers
Check which provider served your request:
```
X-LLM-Provider: Groq
X-Response-Time: 650ms
```

### Future Enhancements
- [ ] Add Sentry/logging service integration
- [ ] Track provider success rates
- [ ] Automatic provider health checks
- [ ] Cost tracking for paid providers
- [ ] Response quality comparison

---

## FAQ

**Q: Do I need to configure all providers?**  
A: No! You only need one. But more providers = better reliability.

**Q: Which provider is fastest?**  
A: Groq is consistently the fastest (500-1000ms).

**Q: Which is cheapest?**  
A: Groq, Together AI, and Hugging Face are all free. Groq has the most generous free tier.

**Q: What if I run out of free tier quota?**  
A: The system automatically falls back to the next provider. Configure multiple providers to avoid downtime.

**Q: Can I use my own models?**  
A: Yes! You can modify `src/lib/llm-providers.ts` to add custom providers (e.g., local Ollama, custom API endpoint).

**Q: How do I switch provider order?**  
A: Change `LLM_PROVIDER_ORDER` in `.env.local` and restart the server.

**Q: Is my API key secure?**  
A: Yes, if you follow best practices:
- Never commit `.env.local` to Git
- Use different keys for dev/production
- Rotate keys regularly
- Set up rate limiting on production

---

## Getting Help

- **LLM Router Code:** [src/lib/llm-router.ts](../src/lib/llm-router.ts)
- **Provider Code:** [src/lib/llm-providers.ts](../src/lib/llm-providers.ts)
- **Chatbot API:** [src/app/api/chatbot/route.ts](../src/app/api/chatbot/route.ts)
- **Environment Template:** [.env.example](../.env.example)

For issues, check the GitHub Issues tab or create a new issue with:
- Error message from server logs
- Which providers you've configured
- Your region/location
- Steps to reproduce

---

*This document will be updated as new providers are added or API changes occur.*
