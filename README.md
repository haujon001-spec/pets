# Pet Breed Info Portal

This project is a modern Next.js web portal dedicated to dog and cat breeds, featuring an AI-powered chatbot for interactive Q&A. It is designed for scalability and future mobile app extension.

## Features
- **Breed Information:** Comprehensive profiles for dog and cat breeds (temperament, lifespan, description, origin, traits).
- **AI Chatbot:** Users can ask questions about breeds and receive AI-generated answers.
- **User Question Capture:** All questions and answers are structured for future analytics and content expansion.
- **Modern UI:** Built with Next.js, TypeScript, Tailwind CSS, and App Router.

## Project Structure
- `src/models/breed.ts`: Data models for pet breeds and user questions. 
  - `BreedInfo`: Interface for breed details.
  - `UserQuestion`: Interface for capturing user questions and answers.
- `src/app/api/chatbot/route.ts`: API route for chatbot interactions.
  - Handles GET (breed info) and POST (chatbot Q&A) requests.
  - Simulates AI response and structures user question data for analytics.
- `src/app/page.tsx`: Main portal UI.
  - Displays breed info, allows breed selection, and provides chatbot interface.
  - Handles user input and displays AI answers.

## Quick Start

**New to this project?** See [docs/QUICKSTART.md](docs/QUICKSTART.md) for 5-minute setup guide.

### Basic Setup
1. **Get a free API key** (Groq recommended):
   - Visit https://console.groq.com/keys
   - Sign up and create API key

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your API key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Test the chatbot:**
   - Open http://localhost:3000
   - Select a pet type and breed
   - Ask a question!

For detailed instructions, troubleshooting, and multiple provider setup, see [docs/QUICKSTART.md](docs/QUICKSTART.md) and [docs/llm-providers-guide.md](docs/llm-providers-guide.md).

## Comments & Code Documentation
- All major files include comments explaining their purpose and key logic.
- Data models and API logic are documented for clarity and future extension.

## Next Steps
- Implement persistent storage for user questions and analytics.
- Expand breed database and improve AI integration.
- Prepare for mobile app extension.

## Breed Data and FAQ

- The breed data is defined in `src/models/breedData.ts`.
- This file contains the top 30 dog and cat breeds, each with:
  - `id`, `name`, `petType`, `temperament`, `lifespan`, `description`, `origin`, `imageUrl`, `traits`.
- Breed images are stored in `/public/breeds/` and referenced by `imageUrl`.
- The `breedFAQs` array contains the most frequently asked questions, shown as quick-select buttons in the UI.
- The API and UI use this data for breed selection, FAQ display, and breed info cards.
- If a breed is not found, users can type a breed name and the system will suggest the closest match using fuzzy search (Fuse.js).

### Example Breed Entry
```ts
{
  id: 'labrador',
  name: 'Labrador Retriever',
  petType: 'dog',
  temperament: 'Gentle, Intelligent, Outgoing',
  lifespan: '10-12 years',
  description: 'Labradors are friendly, outgoing, and high-spirited companions.',
  origin: 'Canada',
  imageUrl: '/breeds/labrador.jpg',
  traits: ['Family-friendly', 'Active', 'Trainable'],
}
```

### FAQ Example
```ts
'What is the temperament of this breed?'
```

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## LLM Integration - Multi-Provider System

The chatbot uses an intelligent multi-provider LLM system with automatic fallback for maximum reliability, especially in regions where certain APIs may be blocked (e.g., Hong Kong).

### Supported Providers (in priority order):

1. **Groq** (FREE) - Fast Llama 3.3 70B inference, generous free tier
2. **Together AI** (FREE) - Multiple open-source models
3. **Hugging Face** (FREE) - Access to many models via Inference API
4. **Cohere** (FREE) - Command models with good performance
5. **OpenRouter** (PAID) - Fallback option, pay-per-use

### Quick Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Sign up for at least one provider** (Groq recommended for Hong Kong):
   - [Groq Console](https://console.groq.com/keys) - Get free API key
   - [Together AI](https://api.together.xyz/settings/api-keys)
   - [Hugging Face](https://huggingface.co/settings/tokens)
   - [Cohere](https://dashboard.cohere.com/api-keys)
   - [OpenRouter](https://openrouter.ai/keys) - Optional, paid

3. **Add your API key(s) to `.env.local`:**
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   TOGETHER_API_KEY=your_together_api_key_here
   # Add others as needed...
   ```

4. **Optional: Customize provider order:**
   ```env
   LLM_PROVIDER_ORDER=groq,together,huggingface,cohere,openrouter
   ```

### How It Works

- The system tries providers in order until one succeeds
- If a provider fails (network error, blocked, rate limit), it automatically tries the next
- Response headers indicate which provider was used: `X-LLM-Provider`
- Server logs show the fallback chain for debugging
- You only need ONE provider configured, but more = better reliability

### For Hong Kong Users

⚠️ **Important:** OpenAI and Claude APIs are often blocked or unavailable in Hong Kong.

✅ **Recommended providers that work well in HK:**
- Groq (primary choice)
- Together AI
- Hugging Face

The multi-provider system ensures your chatbot keeps working even if specific providers are blocked in your region.

### Testing Your Setup

1. Start the dev server: `npm run dev`
2. Open http://localhost:3000
3. Ask a question in the chatbot
4. Check the server console logs to see which provider answered
5. Look for: `✅ LLM Response from Groq in 850ms`

### Troubleshooting

**"No LLM providers configured"** error:
- Check that at least one API key is set in `.env.local`
- Verify the key is valid by testing at the provider's website
- Restart the dev server after adding keys

**All providers failing:**
- Check your internet connection
- Verify API keys are correct (no extra spaces)
- Test provider accessibility from your region
- Check server logs for specific error messages

---
