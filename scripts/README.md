# Scripts Directory - AIBreeds Portal

This directory contains automated scripts for deployment, health checks, cache management, and maintenance.

**Last Updated**: January 23, 2026

---

## 🚀 Deployment Scripts

### 1. Master Deployment Script (`deploy-master.sh`) ⭐ **RECOMMENDED**

Complete automated deployment with validation, backup, and rollback.

**Usage:**
```bash
./scripts/deploy-master.sh
```

**Features:**
- ✅ Pre-deployment validation (health checks, image tests)
- ✅ Environment file validation
- ✅ API key verification
- ✅ Automated Docker build
- ✅ Automatic backup creation
- ✅ Post-deployment verification
- ✅ Auto-rollback on failure
- ✅ Comprehensive error handling

**When to use**: For all production deployments (standardized process)

---

### 2. Production Standard Deployment (`deploy-production-standard.sh`)

Simplified deployment with essential validations.

**Usage:**
```bash
./scripts/deploy-production-standard.sh
```

**Features:**
- Environment file validation
- API key checks
- Docker build and deploy
- Health endpoint verification
- LLM router validation

**When to use**: Quick production deployments when master script unavailable

---

### 3. Quick Deploy (`quick-deploy.sh`)

Fast deployment for minor updates (use with caution).

**Usage:**
```bash
bash scripts/quick-deploy.sh
```

**Features:**
- Git push to GitHub
- Pull on VPS
- Docker compose restart
- Basic health check

**When to use**: Small fixes, urgent hotfixes (skips comprehensive validation)

---

## 🏥 Health Check Scripts

### 1. Phase 6 Comprehensive Health Check (`phase6-comprehensive-health-check.js`) ⭐

Complete system validation - 66 automated checks.

**Usage:**
```bash
npm run health:phase6
```

**Checks:**
- ✅ Language configuration (12 languages)
- ✅ Breed data integrity
- ✅ Image system (placeholders, cache, verification)
- ✅ Translation system (LLM integration)
- ✅ API endpoints (chatbot, breed-image, verify-cache)
- ✅ LLM provider configuration
- ✅ Component validation
- ✅ Configuration files
- ✅ Documentation
- ✅ Security & best practices

**When to run**: Before every deployment, weekly maintenance

---

### 2. Breed Image Verification (`verify-breed-images.js`)

Tests all breed images for availability and validity.

**Usage:**
```bash
npm run test:images
```

**Features:**
- Tests both dog and cat breeds
- Pet type detection from breedData.ts
- Vision AI verification (when available)
- Detailed error reporting

**When to run**: After adding new breeds, after cache cleanup

---

### 3. Language Health Check (`health-check-languages.js`)

Validates all translation files.

**Usage:**
```bash
npm run health:languages
```

**Checks:**
- JSON syntax validation
- Required keys present
- Encoding issues
- Translation completeness

---

## 🗂️ Cache Management Scripts

### 1. Fetch Missing Cat Images (`fetch-missing-cat-images.js`)

Automatically fetches missing cat breed images from TheCatAPI.

**Usage:**
```bash
npm run fetch:cat-images
```

**Features:**
- Fetches Himalayan and Maine Coon images
- Color-coded progress logging
- Validation of fetched images
- Updates cache metadata

**When to run**: After initial setup, when cat images are missing

---

### 2. Cache Cleanup (`cleanup-cache.ts`)

Removes expired breed images from the cache based on metadata.

**Usage:**

```bash
# Preview what will be deleted (dry run)
npm run cache:cleanup -- --dry-run

# Actually delete expired images
npm run cache:cleanup

# Force delete ALL cached images
npm run cache:cleanup -- --force
```

**Features:**
- Removes images older than 7 days (configurable via `CACHE_TTL_DAYS`)
- Removes orphaned files (no metadata entry)
- Shows summary of space freed
- Safe dry-run mode for testing

**When to run:**
- Weekly via cron job on VPS
- After deployment to clean up old images
- When storage space is running low

---

### 3. Pre-cache Popular Breeds (`precache-breeds.ts`)

Fetches and caches images for the top 20 most popular dog and cat breeds.

**Usage:**

```bash
# Make sure dev server is running first
npm run dev

# In a new terminal, run:
npm run cache:precache
```

**Features:**
- Pre-caches 40 breeds (20 dogs + 20 cats)
- Shows progress and success rate
- Prevents slow first-time loads for popular breeds
- Validates images (skips if placeholder returned)

**When to run:**
- After initial deployment
- After running cache cleanup
- Before major traffic events
- As part of build/deployment pipeline

---

## 🔄 Backup & Rollback Scripts

### 1. Rollback (`rollback-vps.sh`)

Restore previous deployment state.

**Usage:**
```bash
./scripts/rollback-vps.sh [timestamp]
```

**Features:**
- Restores environment file from backup
- Restarts containers with previous config
- Validates health after rollback
- Auto-recovery if rollback fails

**Example:**
```bash
./scripts/rollback-vps.sh 20260123_104500
```

---

### 2. Backup (`backup.sh`)

Create manual backup of current state.

**Usage:**
```bash
npm run backup
```

**Backs up:**
- Environment files
- Database (if applicable)
- Configuration files
- Docker images

---

### 3. Restore (`restore.sh`)

Restore from backup.

**Usage:**
```bash
npm run restore [backup-timestamp]
```

---

## 🛠️ Utility Scripts

### 1. Version Tagging (`version-tag.sh`)

Creates git tags for releases.

**Usage:**
```bash
npm run version:tag
```

---

### 2. Setup Production Environment (`setup-production-env.sh`)

One-time VPS setup for production environment.

**Usage (on VPS):**
```bash
cd /root/pets
./scripts/setup-production-env.sh
```

**Features:**
- Interactive API key input
- Creates `.env` file with real keys
- Validates Docker configuration
- Sets up required directories

**When to run**: First-time VPS setup only

---

## 📋 NPM Script Quick Reference

```bash
# Development
npm run dev                    # Start Next.js dev server
npm run dev:health             # Start dev server with health monitoring

# Health Checks
npm run health:phase6          # Run comprehensive health check (66 checks)
npm run health:languages       # Validate translation files
npm run test:images            # Verify all breed images

# Cache Management
npm run fetch:cat-images       # Fetch missing cat breed images
npm run cache:cleanup          # Clean up expired images
npm run cache:precache         # Pre-cache popular breeds

# Deployment (LOCAL MACHINE)
./scripts/deploy-master.sh     # ⭐ RECOMMENDED: Full deployment with validation
./scripts/deploy-production-standard.sh  # Standard deployment
bash scripts/quick-deploy.sh   # Quick deployment (use with caution)

# Backup & Recovery
npm run backup                 # Create backup
npm run restore                # Restore from backup
./scripts/rollback-vps.sh      # Rollback to previous deployment

# Build
npm run build                  # Build for production
npm run start                  # Start production server locally
```

---

## 🎯 Recommended Workflow

### For Production Deployment:

1. **Pre-deployment** (Local):
   ```bash
   npm run health:phase6        # Run health checks
   npm run test:images          # Verify images
   git add . && git commit -m "..."
   ```

2. **Deploy**:
   ```bash
   ./scripts/deploy-master.sh   # Automated deployment
   ```

3. **Post-deployment** (Automatic):
   - Health check validation
   - API key verification
   - LLM router check
   - Image accessibility test

4. **If Issues Occur**:
   ```bash
   ./scripts/rollback-vps.sh <timestamp>
   ```

---

## 🔐 Security Notes

- **NEVER commit `.env.local`** - contains real API keys
- VPS `.env` file is the **single source of truth** for production
- Deployment scripts always use `--env-file .env` flag
- Backups include environment files (stored securely on VPS)

---

## 📖 Documentation

For more details, see:
- [DEPLOYMENT-STANDARD-PROCESS.md](../DEPLOYMENT-STANDARD-PROCESS.md) - Complete deployment guide
- [DEPLOYMENT-JAN24-2026.md](../DEPLOYMENT-JAN24-2026.md) - Latest deployment notes
- [phase6-implementation.md](../docs/phase6-implementation.md) - Technical implementation details

---

**Maintained by**: AIBreeds Development Team  
**Last Audit**: January 23, 2026
npm run cache:cleanup
```

### Production (VPS)
Add to crontab:
```bash
# Clean expired images every Sunday at 3 AM
0 3 * * 0 cd /path/to/project && npm run cache:cleanup

# Pre-cache popular breeds after cleanup
0 4 * * 0 cd /path/to/project && npm run cache:precache
```

---

## Troubleshooting

**"Server not running" error with precache:**
- Make sure `npm run dev` or `npm start` is running
- The precache script needs the API endpoints to be available

**Permission errors:**
- Ensure the `public/breeds/` directory is writable
- Check file ownership: `chown -R $USER:$USER public/breeds/`

**Out of memory during precache:**
- Reduce the number of breeds in `precache-breeds.ts`
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run cache:precache`
