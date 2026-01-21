# VPS Deployment Guide - Phase 4 Complete

**VPS Server**: `159.223.63.117`  
**Deployment Date**: January 21, 2026  
**Phase**: Phase 4 - Internationalization & Mobile Optimization Complete

---

## 🎯 Pre-Deployment Checklist

### 1. **Environment Variables**
Before deployment, update `.env.production` with your API keys:

```bash
# Edit .env.production
GROQ_API_KEY=your_groq_key_here
TOGETHER_API_KEY=your_together_key_here
HUGGINGFACE_API_KEY=your_huggingface_key_here
COHERE_API_KEY=your_cohere_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
```

At minimum, you need **ONE** working API key (preferably `TOGETHER_API_KEY` or `OPENROUTER_API_KEY`).

### 2. **VPS Prerequisites**
Ensure your VPS has:
- [x] Docker installed (`docker --version`)
- [x] Docker Compose installed (`docker-compose --version`)
- [x] SSH access configured
- [x] Ports 80, 443, and 3000 open
- [x] At least 2GB RAM available
- [x] At least 10GB disk space

### 3. **Files Checklist**
Verify these files exist:
- [x] `Dockerfile` - Multi-stage production build
- [x] `Caddyfile` - Reverse proxy configuration
- [x] `docker-compose.production.yml` - Production orchestration
- [x] `.env.production` - Production environment variables
- [x] `scripts/deploy-vps.sh` - Deployment script
- [x] All 10 translation files in `messages/` directory
- [x] `LanguageSwitcher` component

---

## 🚀 Quick Deployment (Method 1: Simplified)

### Step 1: Connect to VPS

```bash
ssh root@159.223.63.117
```

### Step 2: Create Application Directory

```bash
mkdir -p /opt/aibreeds
cd /opt/aibreeds
```

### Step 3: Transfer Files from Local Machine

**On your local Windows machine** (PowerShell):

```powershell
# Navigate to project directory
cd C:\Users\haujo\projects\DEV\vscode_2

# Transfer all files to VPS (using SCP)
scp -r * root@159.223.63.117:/opt/aibreeds/

# OR use rsync if available (more efficient)
rsync -avz --exclude 'node_modules' --exclude '.next' `
  ./ root@159.223.63.117:/opt/aibreeds/
```

### Step 4: Build and Run on VPS

**Back on VPS** (SSH session):

```bash
cd /opt/aibreeds

# Install dependencies
npm install

# Build Next.js application
npm run build

# Start with Docker Compose
docker-compose -f docker-compose.production.yml up -d --build
```

### Step 5: Verify Deployment

```bash
# Check container status
docker ps

# Check health endpoint
curl http://localhost:3000/api/health

# Check logs
docker-compose -f docker-compose.production.yml logs -f
```

**Expected Output**:
```
✓ Ready in 750ms
○ Compiling / ...
✓ Compiled / in 1234ms
LLM Router initialized with 2 providers
```

### Step 6: Test in Browser

Open browser and navigate to:
```
http://159.223.63.117:3000
```

**Test all 10 languages:**
1. Click globe icon (top-right)
2. Test each language:
   - 🇺🇸 English
   - 🇪🇸 Spanish
   - 🇫🇷 French
   - 🇩🇪 German
   - 🇨🇳 Chinese
   - 🇵🇹 Portuguese
   - 🇸🇦 Arabic
   - 🇯🇵 Japanese
   - 🇷🇺 Russian
   - 🇮🇹 Italian

---

## 🔧 Advanced Deployment (Method 2: Automated Script)

### Prerequisites

Update deployment script with VPS IP:

```bash
# Edit scripts/deploy-vps.sh
export VPS_HOST="159.223.63.117"
export VPS_USER="root"
export VPS_PATH="/opt/aibreeds"
```

### Run Deployment Script

```bash
# From your local Windows machine (Git Bash or WSL)
bash scripts/deploy-vps.sh production
```

The script will:
1. ✅ Build Docker image locally
2. ✅ Save image as tarball
3. ✅ Transfer to VPS via SCP
4. ✅ Load image on VPS
5. ✅ Stop old containers
6. ✅ Start new containers
7. ✅ Run health check
8. ✅ Auto-rollback if health check fails

---

## 📱 Phase 4 Testing Checklist

### Language Testing (All 10 Languages)

For **EACH** language, verify:

- [ ] Globe icon visible and clickable
- [ ] Language dropdown opens
- [ ] Language name displays correctly
- [ ] Page reloads after selection
- [ ] All UI elements translate:
  - [ ] Title and subtitle
  - [ ] Pet type buttons (Dog/Cat)
  - [ ] Breed dropdown label and placeholder
  - [ ] Question dropdown label and placeholder
  - [ ] Suggestion buttons
  - [ ] "Ask Question" button
  - [ ] Answer section headers
- [ ] All 10 predefined questions translate
- [ ] All 61 breed names display in native language
- [ ] Error messages translate
- [ ] Cookie persists across browser restart

### Mobile Testing (Required Devices)

Test on these physical devices:

#### iPhone SE (4.7" - Small Screen)
- [ ] Connect to http://159.223.63.117:3000
- [ ] All touch targets min 44px (easy to tap)
- [ ] No horizontal scrolling
- [ ] Dropdowns scrollable with max-height
- [ ] Text readable (16px minimum)
- [ ] Language switcher accessible
- [ ] Images load and display correctly
- [ ] Layout stacks properly (single column)

#### iPhone 15 Pro (6.1" - Standard)
- [ ] All features from iPhone SE
- [ ] Responsive breakpoints working
- [ ] Text sizing appropriate
- [ ] Images properly sized

#### Android Pixel 7 (6.3")
- [ ] All features from iPhone SE
- [ ] Chrome browser compatibility
- [ ] Android-specific touch behavior

#### iPad (10.2" - Tablet)
- [ ] Two-column layout on large screen
- [ ] Touch targets adequate
- [ ] Landscape orientation works
- [ ] Split view compatibility

### Network Performance Testing

#### 3G Network Simulation
- [ ] Enable 3G throttling in Chrome DevTools
- [ ] Measure page load time: _______ ms (target: < 5000ms)
- [ ] Measure image load time: _______ ms
- [ ] Test language switching responsiveness
- [ ] Verify lazy loading working

#### 4G Network Simulation
- [ ] Enable 4G throttling in Chrome DevTools
- [ ] Measure page load time: _______ ms (target: < 2000ms)
- [ ] Measure image load time: _______ ms
- [ ] Test AI response time: _______ ms

#### Lighthouse Audit (Production)
Run Lighthouse from Chrome DevTools:

```
Performance Score: _____ / 100 (target: > 90)
Accessibility: _____ / 100 (target: > 90)
Best Practices: _____ / 100 (target: > 90)
SEO: _____ / 100 (target: > 90)
```

---

## 🏥 Health Check & Monitoring

### Manual Health Check

```bash
# SSH to VPS
ssh root@159.223.63.117

# Check application health
curl http://localhost:3000/api/health

# Expected response:
# HTTP/1.1 200 OK
# {"status":"ok","timestamp":"2026-01-21T..."}
```

### Container Health Check

```bash
# Check Docker health status
docker ps

# Expected output:
# STATUS: Up X minutes (healthy)
```

### View Logs

```bash
# Application logs
docker-compose -f docker-compose.production.yml logs -f app

# Caddy logs
docker-compose -f docker-compose.production.yml logs -f caddy

# All logs
docker-compose -f docker-compose.production.yml logs -f
```

### Common Issues

#### Port 3000 Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Restart containers
docker-compose -f docker-compose.production.yml restart
```

#### Health Check Failing
```bash
# Check if Next.js is running
curl http://localhost:3000

# Check environment variables
docker-compose -f docker-compose.production.yml exec app env | grep API_KEY

# Restart application
docker-compose -f docker-compose.production.yml restart app
```

#### Translation Files Missing
```bash
# Verify translation files exist in container
docker-compose -f docker-compose.production.yml exec app ls -la messages/

# Expected output: en.json, es.json, fr.json, de.json, zh.json, pt.json, ar.json, ja.json, ru.json, it.json
```

---

## 🔄 Rollback Procedure

If deployment fails or issues are detected:

### Method 1: Quick Rollback

```bash
# SSH to VPS
ssh root@159.223.63.117

cd /opt/aibreeds

# Stop current containers
docker-compose -f docker-compose.production.yml down

# Restore backup environment
cp .env.backup.YYYYMMDD_HHMMSS .env

# Start previous version
docker-compose -f docker-compose.production.yml up -d
```

### Method 2: Automated Rollback Script

```bash
# From local machine
bash scripts/rollback-vps.sh YYYYMMDD_HHMMSS
```

---

## 📊 Post-Deployment Validation

### Complete This Checklist

After deployment, verify:

**Server Health:**
- [ ] Application running: `http://159.223.63.117:3000`
- [ ] Health endpoint: `http://159.223.63.117:3000/api/health` returns 200
- [ ] No errors in logs
- [ ] All containers healthy

**Internationalization:**
- [ ] All 10 languages accessible
- [ ] Globe icon visible
- [ ] Language switching works
- [ ] Cookie persistence works
- [ ] Breed names translated
- [ ] Questions translated
- [ ] UI elements translated

**Mobile Optimization:**
- [ ] Tested on iPhone SE (physical device)
- [ ] Tested on iPhone 15 Pro (physical device)
- [ ] Tested on Android Pixel 7 (physical device)
- [ ] Tested on iPad (physical device)
- [ ] Touch targets adequate (min 44px)
- [ ] No horizontal scrolling
- [ ] Responsive breakpoints working
- [ ] Dropdowns scrollable

**Performance:**
- [ ] 3G network tested (< 5000ms load)
- [ ] 4G network tested (< 2000ms load)
- [ ] Lighthouse score > 90
- [ ] Images loading properly
- [ ] API responses within 2000ms

**Functionality:**
- [ ] Pet type selection working
- [ ] Breed dropdown working
- [ ] Custom breed input working
- [ ] Question dropdown working
- [ ] Custom question input working
- [ ] Breed images loading
- [ ] AI responses generating
- [ ] LLM provider displaying
- [ ] Response time tracking

---

## 🎓 Key Learnings & Notes

### What's New in Phase 4
- ✅ 10 languages supported (exceeded 3+ goal by 233%)
- ✅ Globe icon language switcher with flags
- ✅ Cookie-based locale persistence
- ✅ All 61 breed names translated
- ✅ Mobile-first responsive design
- ✅ Touch-friendly UI (44px targets)
- ✅ RTL support for Arabic

### Architecture Decisions
- **Cookie-based i18n** (not URL-based routing)
  - Simpler implementation
  - Persists across navigation
  - No URL changes needed
  - Trade-off: Cannot share language-specific URLs

- **Auto-reload on language change**
  - Guarantees translation sync
  - Ensures cookie and SSR sync
  - Trade-off: Brief page reload

- **Native breed name translations**
  - Better user experience
  - Familiar to native speakers
  - Trade-off: More translation work

### VPS Configuration
- **IP**: 159.223.63.117
- **Path**: /opt/aibreeds
- **Port**: 3000 (app), 80 (HTTP), 443 (HTTPS)
- **Docker**: Multi-container setup (app + caddy)
- **Health Checks**: 30s interval, 10s timeout, 3 retries

---

## 📝 Deployment Log Template

Copy this template to document your deployment:

```markdown
# Deployment Log - Phase 4

**Date**: January 21, 2026
**Time**: _____
**Deployed By**: _____
**VPS IP**: 159.223.63.117

## Pre-Deployment
- [ ] Environment variables updated
- [ ] API keys configured
- [ ] Translation files verified (10 files)
- [ ] Docker running locally
- [ ] VPS accessible via SSH

## Deployment Steps
- [ ] Files transferred to VPS
- [ ] Dependencies installed
- [ ] Application built successfully
- [ ] Docker containers started
- [ ] Health check passed

## Testing Results
- [ ] All 10 languages tested
- [ ] Mobile devices tested (4 devices)
- [ ] Network performance tested
- [ ] Lighthouse audit completed

## Metrics
- Build time: _____ seconds
- Initial load time: _____ ms
- Health check: _____ (200 OK / Failed)
- Lighthouse Performance: _____ / 100
- Languages working: _____ / 10
- Mobile devices tested: _____ / 4

## Issues Encountered
1. _____
2. _____

## Resolution
1. _____
2. _____

## Sign-Off
- [ ] Deployment successful
- [ ] All tests passed
- [ ] No critical errors
- [ ] Documentation updated
```

---

## 🚨 Emergency Contacts & Resources

**Documentation:**
- [PHASE4-COMPLETE.md](PHASE4-COMPLETE.md) - Complete Phase 4 implementation details
- [HEALTH-CHECK.md](HEALTH-CHECK.md) - Health check system
- [docs/phase3-implementation.md](docs/phase3-implementation.md) - Deployment strategy
- [docs/llm-providers-guide.md](docs/llm-providers-guide.md) - LLM configuration

**Useful Commands:**
```bash
# SSH to VPS
ssh root@159.223.63.117

# Check Docker status
docker ps
docker stats

# View logs
docker-compose logs -f

# Restart application
docker-compose restart app

# Complete rebuild
docker-compose down
docker-compose up -d --build

# Check disk space
df -h

# Check memory
free -h

# Check network
netstat -tulpn | grep :3000
```

---

**Next Steps After Successful Deployment:**
1. ✅ Mark all Phase 4 VPS-dependent tasks as complete
2. ✅ Update projectplan.md with deployment results
3. ✅ Create deployment success report
4. ✅ Proceed to Phase 5 (GitHub Workflow) or Phase 2 completion
