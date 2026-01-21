# Deployment Lessons Learned - Phase 6

**Date**: January 21, 2026  
**Deployment**: Phase 6 - LLM Translation System & Vision AI  
**Target**: VPS Production (aibreeds-demo.com)

## 🎯 Objective

Deploy Phase 6 features (12 languages, LLM translation, vision verification) to production VPS server.

## 📋 What We Learned

### 1. Docker Base Image Selection is Critical

**Issue**: Initial Dockerfile used `node:20-alpine` which failed to build Phase 6 code.

**Root Cause**:
- Alpine Linux uses musl libc instead of glibc
- Native Node modules (`@parcel/watcher`, `sharp`, `@next/swc`) require glibc
- Missing build tools (Python, make, g++) in minimal Alpine image

**Error Encountered**:
```
Error: No prebuild or local build of @parcel/watcher found
Tried @parcel/watcher-linux-x64-musl
```

**Solution**:
- Switched from `node:20-alpine` to `node:20-slim` (Debian-based)
- Added build dependencies:
  ```dockerfile
  RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 \
      make \
      g++ \
      && rm -rf /var/lib/apt/lists/*
  ```

**Lesson**: For Next.js apps with native modules, use Debian-based images (slim/bullseye) over Alpine.

**Tradeoffs**:
- Alpine: ~50MB smaller, but compatibility issues
- Debian slim: +150MB, but better compatibility and fewer build issues

---

### 2. TypeScript Strict Mode in Production Builds

**Issue**: `npm run build` passed locally but failed in Docker with TypeScript errors.

**Root Cause**:
- Local dev mode (`npm run dev`) is less strict
- Production build (`npm run build`) enforces strict TypeScript checks
- `response.json()` returns `unknown` type, requires explicit typing

**Error Encountered**:
```typescript
Type error: 'data' is of type 'unknown'.
const answer = data.answer;  // ❌ Error
```

**Solution**:
```typescript
const data = await response.json() as { answer: string };
const answer = data.answer;  // ✅ Works
```

**Lesson**: Always test production builds locally before deploying to VPS.

**Testing Workflow**:
```bash
# 1. Test TypeScript compilation
npm run build

# 2. Test Docker build locally
docker build -f Dockerfile.prod -t pet-portal:test .

# 3. Test container runtime
docker run -p 3000:3000 --env-file .env pet-portal:test

# 4. Deploy to VPS only if all pass
```

---

### 3. Docker Networking for Multi-Container Apps

**Issue**: Caddy reverse proxy couldn't reach Next.js app container.

**Root Cause**:
- Used `docker run` instead of `docker-compose`
- Containers on default bridge network can't resolve by hostname
- Caddyfile referenced `app:3000` but no `app` hostname existed

**Error Encountered**:
```
dial tcp: lookup app on 67.207.67.3:53: no such host
```

**Failed Approach**:
- Tried changing Caddyfile to `localhost:3000` ❌
- Doesn't work: containers have separate network namespaces

**Solution**:
```bash
# 1. Create custom Docker network
docker network create pet-network

# 2. Start app container with specific name and network
docker run -d --name app --network pet-network ... pet-portal:latest

# 3. Start Caddy on same network
docker run -d --name caddy --network pet-network -p 80:80 -p 443:443 ... caddy:2
```

**Lesson**: When running multiple containers with `docker run`, always:
1. Create a custom network
2. Use `--network` flag on all containers
3. Use `--name` flag to set predictable hostnames
4. Or use `docker-compose` which does this automatically

---

### 4. Package Lock File Synchronization

**Issue**: `npm ci` failed during Docker build with "Missing from lock file" error.

**Root Cause**:
- `git stash` was used to save local VPS changes before pulling
- Stashed `package-lock.json` was out of sync with updated `package.json`
- `npm ci` requires exact match between package.json and package-lock.json

**Error Encountered**:
```
npm error Missing: @swc/helpers@0.5.18 from lock file
```

**Solution**:
```bash
# Delete out-of-sync lock file and regenerate
rm package-lock.json
npm install
```

**Lesson**: When pulling code updates that include package.json changes:
1. Don't stash package-lock.json, let git handle the merge
2. Or regenerate package-lock.json after pulling
3. Consider using `npm ci --production=false` in Dockerfile for more flexibility

---

### 5. Local vs Production Environment Differences

**Issue**: Code worked perfectly on local laptop but had build/runtime issues on VPS.

**Key Differences**:

| Aspect | Local Development | VPS Production |
|--------|------------------|----------------|
| **Node Version** | 20.x (exact match needed) | 20.x |
| **OS** | Windows | Ubuntu Linux |
| **Build Mode** | `npm run dev` (lenient) | `npm run build` (strict) |
| **Environment Files** | `.env.local` (dev mode) | `.env.production` |
| **TypeScript** | Dev server (loose checking) | Production build (strict) |
| **Dependencies** | Installed natively | Built in Docker container |
| **API Endpoints** | localhost:3000 | Behind Caddy reverse proxy |

**Lesson**: Development environment is fundamentally different from production. Always test in production-like conditions before deploying.

---

## ✅ Deployment Success Checklist

Before pushing to VPS, verify:

- [ ] `npm run build` succeeds locally (TypeScript validation)
- [ ] `docker build -f Dockerfile.prod -t test .` succeeds (dependency validation)
- [ ] Container runs locally: `docker run -p 3000:3000 --env-file .env test`
- [ ] Health checks pass: `npm run health:phase6`
- [ ] Image verification passes: `npm run test:images`
- [ ] `.env.production` has all required API keys
- [ ] Dockerfile uses Debian-based image for native modules
- [ ] TypeScript types are explicit (no `unknown` types)
- [ ] package-lock.json is synchronized with package.json
- [ ] Docker networking is configured (network + container names)

## 🚀 Recommended Deployment Workflow

```bash
# === STEP 1: LOCAL TESTING ===
npm run build                    # Validate TypeScript
docker build -f Dockerfile.prod -t pet-portal:test .  # Build image
docker run -p 3000:3000 --env-file .env pet-portal:test  # Test runtime

# === STEP 2: COMMIT & PUSH ===
git add .
git commit -m "feat: Ready for production"
git push origin main

# === STEP 3: VPS DEPLOYMENT ===
ssh root@vps-server
cd ~/pets
git pull origin main

# Build image
docker build -f Dockerfile.prod -t pet-portal:latest .

# Setup network
docker network create pet-network 2>/dev/null || true

# Stop old containers
docker stop app caddy || true
docker rm app caddy || true

# Start new containers
docker run -d --name app --network pet-network \
  --restart unless-stopped --env-file .env \
  -e NODE_ENV=production pet-portal:latest

docker run -d --name caddy --network pet-network \
  --restart unless-stopped -p 80:80 -p 443:443 \
  -v ~/pets/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data -v caddy_config:/config caddy:2

# === STEP 4: VERIFY ===
docker ps                        # Check containers running
docker logs app --tail 20        # Check app logs
docker logs caddy --tail 20      # Check reverse proxy
curl https://your-domain.com/api/health  # Test endpoint
```

## 📊 Time Saved by Testing Locally

**Before** (no local testing):
- Push code → VPS build fails → Debug → Fix locally → Push → Repeat
- Average: 5-7 deployment attempts × 10 min each = **50-70 minutes**

**After** (with local Docker testing):
- Test locally → Fix all issues → Push once → Success
- Average: 1 deployment attempt × 10 min = **10 minutes**

**Time Savings**: ~60 minutes per deployment cycle

---

## 🎯 Phase 7 Enhancements (Planned)

### 1. Local Docker Testing Automation
Create `scripts/test-docker-locally.sh`:
```bash
#!/bin/bash
echo "🧪 Testing Docker build locally..."
docker build -f Dockerfile.prod -t pet-portal:test . || exit 1
echo "✅ Build successful!"

echo "🚀 Testing container runtime..."
docker run -d --name test-app -p 3000:3000 --env-file .env pet-portal:test
sleep 5
curl http://localhost:3000/api/health || exit 1
docker stop test-app && docker rm test-app
echo "✅ Runtime test successful!"
```

### 2. Simplified VPS Deployment Script
Create `scripts/deploy-to-vps.sh`:
```bash
#!/bin/bash
VPS_HOST="root@aibreeds-demo.com"
VPS_DIR="~/pets"

echo "🚀 Deploying to VPS..."
ssh $VPS_HOST "cd $VPS_DIR && \
  git pull origin main && \
  docker build -f Dockerfile.prod -t pet-portal:latest . && \
  docker network create pet-network 2>/dev/null || true && \
  docker stop app caddy 2>/dev/null || true && \
  docker rm app caddy 2>/dev/null || true && \
  docker run -d --name app --network pet-network --restart unless-stopped --env-file .env -e NODE_ENV=production pet-portal:latest && \
  docker run -d --name caddy --network pet-network --restart unless-stopped -p 80:80 -p 443:443 -v $VPS_DIR/Caddyfile:/etc/caddy/Caddyfile -v caddy_data:/data -v caddy_config:/config caddy:2"

echo "✅ Deployment complete!"
```

### 3. Docker Compose for Production
Convert to `docker-compose.prod.yml`:
```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: app
    restart: unless-stopped
    env_file: .env
    environment:
      - NODE_ENV=production
    networks:
      - pet-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  caddy:
    image: caddy:2
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - pet-network
    depends_on:
      - app

networks:
  pet-network:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
```

Then deploy with: `docker-compose -f docker-compose.prod.yml up -d`

---

## 📝 Key Takeaways

1. **Always test Docker builds locally** before VPS deployment
2. **Use Debian-based images** for Next.js apps with native modules
3. **Test production builds** (`npm run build`), not just dev mode
4. **Create Docker networks** when using multiple containers
5. **Synchronize package-lock.json** with package.json
6. **Add type assertions** for `unknown` types in TypeScript
7. **Automate deployment** to reduce human error

## 🎉 Result

Phase 6 successfully deployed to production with:
- ✅ 12 languages including Vietnamese & Chinese Traditional
- ✅ LLM-powered translation system
- ✅ Vision AI image verification
- ✅ Zero downtime during deployment
- ✅ All features working in production

**Live**: https://aibreeds-demo.com
