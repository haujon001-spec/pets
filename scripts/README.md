# Cache Management Scripts

This directory contains scripts for managing the breed image cache.

## Scripts

### 1. Cache Cleanup (`cleanup-cache.ts`)

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

### 2. Pre-cache Popular Breeds (`precache-breeds.ts`)

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

## Cache Metadata Format

The cache uses a `.cache-metadata.json` file to track image freshness:

```json
{
  "labrador.jpg": {
    "fetchedAt": "2026-01-20T10:30:00.000Z",
    "sourceUrl": "https://images.dog.ceo/breeds/labrador/...",
    "expiresAt": "2026-01-27T10:30:00.000Z"
  }
}
```

- **fetchedAt**: When the image was originally downloaded
- **sourceUrl**: Original URL (for debugging/re-fetching)
- **expiresAt**: When the cache entry expires (7 days after fetch)

---

## Image Compression

All cached images are automatically compressed using Sharp:

- **Max dimensions**: 800x800px (maintains aspect ratio)
- **Format**: JPEG
- **Quality**: 85%
- **Result**: ~70-80% smaller file sizes with minimal quality loss

---

## Automation Recommendations

### Development
```bash
# Clean cache weekly during development
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
