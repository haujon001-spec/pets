# AI Pet Breeds Portal 🐕🐈

A modern, production-ready Next.js web portal for dog and cat breeds with **AI-powered chatbot**, **12-language support**, **LLM-powered translation**, and **mobile-first design**.

**Live Site**: https://aibreeds-demo.com  
**Last Updated**: March 23, 2026  
**Status**: ✅ Phase 6 Complete & Deployed | 🎉 Governance Finalized (soul.md) | 📦 VPS Infrastructure Established

## ✨ Features

### Core Features
- **🤖 AI Chatbot**: Multi-provider LLM system with intelligent fallback (Groq → Together AI → Hugging Face → Cohere → OpenRouter)
- **🖼️ AI Image Generation**: Stable Diffusion XL via Replicate API for custom/rare breed images
- **🌍 12 Languages**: Full internationalization - English, Spanish, French, German, Chinese (Simplified & Traditional), Vietnamese, Portuguese, Arabic, Japanese, Russian, Italian
- **🔤 LLM-Powered Translation**: Dynamic breed info translation using AI with client-side caching
- **👁️ Vision Verification**: LLaVA-1.5 vision model validates breed images for accuracy
- **📱 Mobile-First**: Responsive design with touch-optimized UI (min 44px tap targets)
- **🗂️ 61 Breeds**: Comprehensive profiles for 31 dog + 30 cat breeds
- **🖼️ Smart Images**: Automatic breed image fetching with AI generation fallback, caching and compression
- **⚡ Production-Ready**: Docker deployment with health checks, rollback, and monitoring

### Technical Features
- **Multi-Provider LLM**: Automatic fallback chain with 5 free-tier providers
  - Primary: Groq (Llama-3.3-70B-Versatile)
  - Fallback 1: Together AI (ServiceNow Apriel-1.5-15B-Thinker + LLaVA-1.5 vision)
  - Fallback 2: Hugging Face (Llama-3.2-3B-Instruct)
  - Fallback 3: Cohere (Command-R-Plus)
  - Fallback 4: OpenRouter (Step-3.5-Flash)
- **Vision AI**: Image verification using LLaVA-1.5-7B via Together AI
- **Dynamic Translation**: Real-time breed content translation with caching
- **RTL Support**: Right-to-left layout for Arabic
- **Cookie Persistence**: Language preference saved across sessions
- **Comprehensive Health Checks**: 10-category validation system (66 automated checks)
- **Image Verification System**: Automated breed image validation
- **Zero-Downtime Deployment**: Blue-green deployment strategy with health validation
- **Environment Segregation**: Separate dev, staging, production configs

## 📋 Project Governance (soul.md)

This project follows a **Universal Project Constitution** (`[soul.md](soul.md)`) that establishes:

- **Folder Structure**: Standardized organization for data, models, dashboards, QA, and documentation
- **Naming Conventions**: Consistent snake_case for scripts, dated formats for files (e.g., `DDMMMYYYY`)
- **QA Requirements**: Mandatory testing before merge (zero unhandled exceptions, AI behavior validation, state persistence)
- **Security Policy**: All API keys stored in `/secrets/` (gitignored), never in tracked files
- **Universal Principles**: 
  - ✅ Reproducibility over convenience
  - ✅ Structure over improvisation  
  - ✅ QA over speed
  - ✅ Security over shortcuts

**Updated March 23, 2026**: Governance structure finalized with LLM diagnostic system, dashboard framework, data processing pipeline, and comprehensive VPS infrastructure.

## 🏗️ Project Structure

```
vscode_2/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chatbot/route.ts      # LLM router with vision support
│   │   │   ├── breed-image/route.ts  # Image fetching with vision verification
│   │   │   ├── verify-cache/route.ts # Batch image verification endpoint
│   │   │   └── health/route.ts       # Health check endpoint
│   │   ├── layout.tsx                # Root layout with i18n provider
│   │   └── page.tsx                  # Main UI with translation system
│   ├── components/
│   │   └── LanguageSwitcher.tsx     # Globe icon language selector (12 languages)
│   ├── models/
│   │   ├── breed.ts                  # TypeScript interfaces
│   │   └── breedData.ts             # 61 breed definitions
│   ├── lib/
│   │   ├── llm-providers.ts         # LLM providers with vision support
│   │   └── llm-router.ts            # Intelligent routing & fallback
│   └── i18n/
│       └── request.ts                # Server-side locale detection
├── messages/                         # Translation files (12 languages)
│   ├── en.json, es.json, fr.json, de.json, zh.json, zh-tw.json
│   ├── pt.json, ar.json, ja.json, ru.json, it.json, vi.json
├── scripts/                          # Automation & validation
│   ├── deploy-production.sh         # Production deployment with health checks
│   ├── phase6-comprehensive-health-check.js  # 10-category validation (66 checks)
│   ├── verify-breed-images.js       # Image verification test suite
│   ├── health-check-languages.js    # Language configuration validation
│   ├── rollback-vps.sh              # One-command rollback
│   ├── backup.sh, restore.sh        # Backup automation
│   └── setup-production-env.sh      # Environment setup
├── docs/                             # Comprehensive documentation
│   ├── phase1-implementation-summary.md
│   ├── phase2-implementation-complete.md
│   ├── phase3-implementation.md
│   ├── phase4-implementation.md
│   ├── phase6-implementation.md     # Translation & verification system
│   ├── IMAGE-VERIFICATION.md        # LLM vision documentation
│   └── DEPLOYMENT.md
├── docker-compose.yml               # Production orchestration
├── docker-compose.staging.yml       # Staging configuration
├── Dockerfile.prod                  # Multi-stage optimized build
└── Caddyfile                        # HTTPS reverse proxy config
```

**Key Technologies**:
- **Framework**: Next.js 16.1.3, React 19, TypeScript
- **Styling**: Tailwind CSS with mobile breakpoints
- **i18n**: next-intl v4.7 with cookie persistence + LLM translation
- **LLM Providers**: Groq, Together AI, Hugging Face, Cohere, OpenRouter (free tier chain)
- **Vision AI**: LLaVA-1.5-7B via Together AI for image verification
- **Deployment**: Docker, Caddy, Let's Encrypt SSL
- **Validation**: Comprehensive health checks (66 automated tests)
- **Monitoring**: Health checks, automated rollback, image verification

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (required for Next.js 16)
- npm or yarn
- Free LLM API key (Groq recommended, or Together AI/Hugging Face backup)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env.local

# Get free API keys from (in priority order):
# 1. Groq: https://console.groq.com/keys (RECOMMENDED - Fastest)
# 2. Together AI: https://api.together.xyz/settings/api-keys
# 3. Hugging Face: https://huggingface.co/settings/tokens
# 4. Cohere: https://cohere.com/
# 5. OpenRouter: https://openrouter.ai/ (fallback)

# Add at least one key to .env.local:
# GROQ_API_KEY=your_key_here
# OR
# TOGETHER_API_KEY=your_key_here
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Test the Application
- Open http://localhost:3000
- Select a language from globe icon 🌐
- Choose a pet type and breed
- Ask questions in the chatbot!

**Detailed Setup**: See [docs/QUICKSTART.md](docs/QUICKSTART.md) for complete guide

## 📊 Project Status

**Progress**: 4/6 Phases Complete (67%)

| Phase | Status | Completion Date | Documentation |
|-------|--------|----------------|---------------|
| Phase 1: LLM Multi-Provider | ✅ Complete | Jan 20, 2026 | [docs/phase1-implementation-summary.md](docs/phase1-implementation-summary.md) |
| Phase 2: Image Search & Cache | ✅ Complete | Jan 20, 2026 | [docs/phase2-implementation-complete.md](docs/phase2-implementation-complete.md) |
| Phase 3: Deployment & Rollback | ✅ Complete | Jan 20, 2026 | [docs/phase3-implementation.md](docs/phase3-implementation.md) |
| Phase 4: i18n & Mobile | ✅ Complete | Jan 21, 2026 | [docs/phase4-implementation.md](docs/phase4-implementation.md) |
| Phase 5: Automated Deployment | 🔄 In Planning | - | [projectplan.md](projectplan.md#phase-5) |
| Phase 6: GitHub Workflow | ⏳ Pending | - | [projectplan.md](projectplan.md#phase-6) |

**Recent Updates**:
- ✅ HTTPS enabled with Let's Encrypt SSL
- ✅ Git workflow fixed (develop → staging → main)
- ✅ Environment variable deployment strategy documented
- ✅ All branches synced and ready for Phase 3 workflow

**Production Site**: https://aibreeds-demo.com (Live with 10 languages, HTTPS, mobile-optimized)

## 🌍 Internationalization

The application supports **10 languages** with full translation coverage:

- 🇺🇸 **English** (en) - Default
- 🇪🇸 **Spanish** (es) - Español
- 🇫🇷 **French** (fr) - Français
- 🇩🇪 **German** (de) - Deutsch
- 🇨🇳 **Chinese** (zh) - 中文
- 🇵🇹 **Portuguese** (pt) - Português
- 🇸🇦 **Arabic** (ar) - العربية (RTL support)
- 🇯🇵 **Japanese** (ja) - 日本語
- 🇷🇺 **Russian** (ru) - Русский
- 🇮🇹 **Italian** (it) - Italiano

**What's Translated**:
- All UI labels and buttons
- 61 breed names (31 dogs + 30 cats)
- 10 predefined questions
- Error messages and feedback
- Metadata (title, description)

**Global Reach**: 1.15+ billion native speakers across 6 continents

**Usage**: Click the 🌐 globe icon in the top-right corner to switch languages. Your preference is saved via cookies.

## 🔒 Security & Environment

**Environment Variables Management**:
- `.env` files are **never** committed to Git (blocked by `.gitignore`)
- `.env.production.template` provides structure with placeholders for Git commits
- Real API keys deployed separately to VPS via secure methods (scp, manual creation)
- See [DEPLOYMENT-WORKFLOW.md](DEPLOYMENT-WORKFLOW.md) for complete environment deployment strategy

**API Keys Required**:
- `TOGETHER_API_KEY` - Together AI (primary LLM provider, free tier)
- `OPENROUTER_API_KEY` - OpenRouter (fallback LLM provider, paid)
- `HUGGINGFACE_API_KEY` - HuggingFace (image generation, optional)

---

## 🚀 Deployment

**Production**: [https://aibreeds-demo.com](https://aibreeds-demo.com)

**Infrastructure**:
- VPS: DigitalOcean Ubuntu (159.223.63.117)
- Docker: Multi-container setup (Next.js app + Caddy reverse proxy)
- SSL: Let's Encrypt (auto-renewal via Caddy)
- Node.js: 20.20.0 (required for Next.js 16+)

**Deployment Workflow**:
1. **Development**: Work on `develop` branch at localhost:3000
2. **Staging**: Merge to `staging` branch, test on VPS via IP
3. **Production**: Merge to `main` branch, deploy to https://aibreeds-demo.com

For complete deployment guide, see:
- [DEPLOYMENT-WORKFLOW.md](DEPLOYMENT-WORKFLOW.md) - Environment variable strategy
- [GIT-WORKFLOW.md](GIT-WORKFLOW.md) - Branch workflow (develop → staging → main)
- [scripts/setup-production-env.sh](scripts/setup-production-env.sh) - One-time VPS setup

---

## 📚 Documentation

- [TODO.md](TODO.md) - Current development tasks
- [docs/plan-projectRecapAndNextSteps.md](docs/plan-projectRecapAndNextSteps.md) - Project planning
- [docs/phase4-implementation.md](docs/phase4-implementation.md) - Internationalization & Mobile optimization details
- [DEPLOYMENT-WORKFLOW.md](DEPLOYMENT-WORKFLOW.md) - Environment deployment strategy
- [GIT-WORKFLOW.md](GIT-WORKFLOW.md) - Git branch workflow guide

---

## 🤝 Contributing

This project follows a three-tier branch strategy:

1. **develop**: Local development (localhost:3000)
2. **staging**: VPS testing (IP access)
3. **main**: Production (https://aibreeds-demo.com)

See [GIT-WORKFLOW.md](GIT-WORKFLOW.md) for detailed workflow instructions.

---

## 📄 License

This project is for demonstration purposes.

---

**Last Updated**: January 21, 2025  
**Current Phase**: Phase 4 Complete (Internationalization & Mobile) | Phase 5 In Planning (Automated Deployment)

📱 Mobile Optimization

**Mobile-First Responsive Design**:
- Touch targets: Minimum 44x44px (WCAG 2.1 Level AA)
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- No horizontal scrolling on any device
- Optimized font sizes (16px minimum for readability)
- Scrollable dropdowns for mobile
- RTL layout support for Arabic

**Tested On**:
- iPhone SE (4.7"), iPhone 15 Pro (6.1")
- Android Pixel 7 (6.3")
- iPad (10.2")
- Desktop browsers (Chrome, Firefox, Safari, Edge)

---
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
