# Quick Start Guide - LLM Multi-Provider Setup

⚡ **Get your chatbot working in 5 minutes**

---

## Step 1: Get a Free API Key (Choose One)

### Option A: Groq (Recommended for HK) ⭐
1. Visit: https://console.groq.com/keys
2. Sign up (free, no credit card)
3. Click "Create API Key"
4. Copy the key (starts with `gsk_`)

### Option B: Together AI
1. Visit: https://api.together.xyz/signup
2. Sign up
3. Go to Settings → API Keys
4. Copy the key

### Option C: Hugging Face
1. Visit: https://huggingface.co/join
2. Sign up
3. Go to Settings → Access Tokens
4. Create token (read permission)
5. Copy the token (starts with `hf_`)

---

## Step 2: Configure Your Environment

### Create `.env.local`:
```bash
cp .env.example .env.local
```

### Edit `.env.local`:
```env
# Add your API key (choose one to start):
GROQ_API_KEY=gsk_your_key_here
# TOGETHER_API_KEY=your_key_here
# HUGGINGFACE_API_KEY=hf_your_key_here

# Optional: Customize provider order
LLM_PROVIDER_ORDER=groq,together,huggingface,cohere,openrouter
```

**Important:** Replace `gsk_your_key_here` with your actual key!

---

## Step 3: Start the Server

```bash
npm run dev
```

Look for this in the logs:
```
✅ LLM Router initialized with 1 providers:
   1. Groq
```

---

## Step 4: Test the Chatbot

1. Open http://localhost:3000
2. Select "Dog" or "Cat"
3. Choose a breed (e.g., "Golden Retriever")
4. Select a question or type your own
5. Click "Ask"

### Watch the server logs for:
```
🤖 Attempting LLM call with Groq...
✅ Success with Groq (650ms)
```

---

## Step 5: Verify It's Working

✅ **Success signs:**
- Answer appears in the UI
- Server logs show "✅ Success with [Provider]"
- Response time is reasonable (< 2 seconds)
- Answer quality is good

❌ **Failure signs:**
- "No LLM providers configured" error
- "All LLM providers failed" error
- No logs showing provider attempts

---

## Troubleshooting

### "No LLM providers configured"
**Fix:** Add at least one API key to `.env.local` and restart server

### "All LLM providers failed"
**Possible causes:**
- API key is incorrect (check for typos)
- API key is invalid (regenerate on provider website)
- Provider is blocked in your region (try different provider)
- No internet connection

**Debug:**
1. Check `.env.local` has correct format
2. No extra spaces in the API key
3. Restart server: `Ctrl+C` then `npm run dev`
4. Try a different provider

### Still not working?
1. Check full error message in server logs
2. Verify API key is active on provider dashboard
3. Test API key with curl:
   ```bash
   curl https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

---

## Add More Providers (Optional)

For better reliability, add 2-3 providers:

```env
# Primary
GROQ_API_KEY=gsk_your_groq_key

# Backup 1
TOGETHER_API_KEY=your_together_key

# Backup 2
HUGGINGFACE_API_KEY=hf_your_hf_token

# Order (free providers first)
LLM_PROVIDER_ORDER=groq,together,huggingface
```

System automatically falls back if one fails!

---

## For Hong Kong Users 🇭🇰

### ✅ These work well in HK:
- Groq (recommended)
- Together AI
- Hugging Face

### ⚠️ These may be blocked:
- OpenRouter (OpenAI/Claude models specifically)
- Direct OpenAI API
- Direct Claude API

### Recommended config for HK:
```env
GROQ_API_KEY=your_key_here
TOGETHER_API_KEY=your_key_here
LLM_PROVIDER_ORDER=groq,together
```

---

## Next Steps

Once working locally:
1. ✅ Test with different questions
2. ✅ Try different breeds
3. ✅ Monitor response times
4. 📚 Read full guide: `docs/llm-providers-guide.md`
5. 🚀 Deploy to VPS (see Phase 3 in `projectplan.md`)

---

## Quick Reference

| Provider | Free Tier | Speed | HK Status |
|----------|-----------|-------|-----------|
| Groq | ✅ 14.4K/day | ⚡ Fast | ✅ Works |
| Together AI | ✅ Yes | 🔸 Medium | ✅ Works |
| Hugging Face | ✅ Yes | 🔸 Slower | ✅ Works |
| Cohere | ⏰ Trial | 🔸 Medium | ✅ Works |
| OpenRouter | ❌ Paid | 🔸 Medium | ⚠️ Varies |

---

**Need more help?** See:
- Detailed guide: `docs/llm-providers-guide.md`
- Full README: `README.md`
- Project plan: `projectplan.md`

**Ready to deploy?** See Phase 3 in `projectplan.md` for VPS deployment strategy.
