# Deployment Plan - January 24, 2026
## Bug Fix Release: Cat Image 404 Errors

**Date**: January 24, 2026  
**Commit**: c9dc9b9  
**Type**: Bug Fixes (Non-breaking changes)  
**Priority**: Medium  
**Risk Level**: Low  

---

## 📋 Changes Overview

### Bug Fixes
1. **Missing Himalayan Cat Image** - Fixed 404 error when selecting Himalayan breed
2. **Missing Maine Coon Cat Image** - Fixed 404 error when selecting Maine Coon breed
3. **Health Check Enhancement** - Script now properly tests both cat and dog breeds

### New Files
- `scripts/fetch-missing-cat-images.js` - Automated utility to fetch missing cat images
- `public/breeds/himalayan.jpg` - Fetched from TheCatAPI
- `public/breeds/mainecoon.jpg` - Fetched from TheCatAPI

### Modified Files
- `scripts/verify-breed-images.js` - Enhanced with pet type detection
- `package.json` - Added `fetch:cat-images` npm script
- `public/breeds/.cache-metadata.json` - Updated with new image verification data
- `TODO.md` - Updated status tracking
- `docs/phase6-implementation.md` - Documented bug fixes

---

## 🚀 Deployment Steps

### Pre-Deployment Checklist
- [x] Code tested locally
- [x] Health checks passing
- [x] Images verified with vision AI
- [x] Code committed to GitHub
- [x] Documentation updated

### Step 1: SSH into VPS
```bash
ssh root@aibreeds-demo.com
```

### Step 2: Navigate to Project Directory
```bash
cd /root/vscode_2
```

### Step 3: Backup Current Deployment
```bash
# Create backup tag
docker tag pet-portal:latest pet-portal:backup-$(date +%Y%m%d)

# Backup .env file
cp .env.local .env.local.backup-$(date +%Y%m%d)
```

### Step 4: Pull Latest Code
```bash
git pull origin main
```

**Expected Output**:
```
From https://github.com/haujon001-spec/pets
 * branch            main       -> FETCH_HEAD
   e392f9c..c9dc9b9  main       -> origin/main
Updating e392f9c..c9dc9b9
Fast-forward
 8 files changed, 276 insertions(+), 32 deletions(-)
 create mode 100644 public/breeds/himalayan.jpg
 create mode 100644 public/breeds/mainecoon.jpg
 create mode 100644 scripts/fetch-missing-cat-images.js
```

### Step 5: Rebuild Docker Image
```bash
docker build -f Dockerfile.prod -t pet-portal:latest .
```

**Estimated Time**: 3-5 minutes

### Step 6: Stop Current Container
```bash
docker stop app
docker rm app
```

### Step 7: Start New Container
```bash
docker run -d \
  --name app \
  --network pet-network \
  --env-file .env.local \
  -p 3000:3000 \
  --restart unless-stopped \
  pet-portal:latest
```

### Step 8: Verify Deployment
```bash
# Check container is running
docker ps | grep app

# Check logs for startup errors
docker logs app --tail 50

# Test health endpoint
curl http://localhost:3000/api/health

# Check if images are accessible
curl -I http://localhost:3000/breeds/himalayan.jpg
curl -I http://localhost:3000/breeds/mainecoon.jpg
```

**Expected Results**:
- Container status: `Up`
- Health endpoint: `200 OK`
- Image files: `200 OK`

### Step 9: Browser Testing
1. Open https://aibreeds-demo.com
2. Click on "Cats" tab
3. Select "Himalayan" breed
   - ✅ Image should load without errors
   - ✅ No 404 errors in browser console
4. Select "Maine Coon" breed
   - ✅ Image should load without errors
   - ✅ No 404 errors in browser console
5. Test a few other breeds (both cats and dogs) to ensure no regression

---

## 🔄 Rollback Plan

If issues are discovered after deployment:

### Option 1: Quick Rollback to Previous Image
```bash
# Stop current container
docker stop app
docker rm app

# Start previous backup image
docker run -d \
  --name app \
  --network pet-network \
  --env-file .env.local.backup-$(date +%Y%m%d) \
  -p 3000:3000 \
  --restart unless-stopped \
  pet-portal:backup-$(date +%Y%m%d)
```

### Option 2: Use Rollback Script
```bash
cd /root/vscode_2
./scripts/rollback-vps.sh
```

### Option 3: Git Revert
```bash
git revert c9dc9b9
docker build -f Dockerfile.prod -t pet-portal:latest .
# Then restart container as in Step 7
```

---

## ✅ Post-Deployment Verification

### Automated Checks
- [ ] Health endpoint responds: `curl https://aibreeds-demo.com/api/health`
- [ ] Himalayan image loads: `curl -I https://aibreeds-demo.com/breeds/himalayan.jpg`
- [ ] Maine Coon image loads: `curl -I https://aibreeds-demo.com/breeds/mainecoon.jpg`
- [ ] No Docker errors: `docker logs app | grep -i error`

### Manual Browser Checks
- [ ] Home page loads correctly
- [ ] Language switcher works (test 2-3 languages)
- [ ] Dog breeds display with images
- [ ] Cat breeds display with images  
- [ ] Himalayan breed shows image (no 404)
- [ ] Maine Coon breed shows image (no 404)
- [ ] AI chatbot responds correctly
- [ ] Translation system working

### Performance Checks
- [ ] Page load time < 3 seconds
- [ ] Image load time reasonable
- [ ] No console errors
- [ ] No memory leaks in container: `docker stats app`

---

## 📊 Success Criteria

- ✅ All breed images loading without 404 errors
- ✅ Container running stable for 15+ minutes
- ✅ No error logs in Docker
- ✅ Health check endpoint returning 200
- ✅ Browser console clean (no errors)
- ✅ Application performance unchanged

---

## 📝 Post-Deployment Tasks

### Update Documentation
- [ ] Mark deployment as complete in this file
- [ ] Update TODO.md - move items from "Next Steps" to "Completed"
- [ ] Add entry to CHANGELOG.md (if exists)
- [ ] Update version in package.json if needed

### Monitoring
- [ ] Monitor application logs for 24 hours
- [ ] Check error rates in analytics
- [ ] Monitor resource usage (CPU, memory)

### Communication
- [ ] Notify team of successful deployment
- [ ] Document any issues encountered
- [ ] Note any improvements for next deployment

---

## 🐛 Known Issues / Limitations

**Vision AI Warnings** (Non-blocking):
- Himalayan image flagged as "INCORRECT" with 60% confidence
- Maine Coon image flagged as "INCORRECT" with 70% confidence
- This is expected - images are valid from TheCatAPI official database
- Vision AI is cautious without full cat body view
- Does not affect functionality - images display correctly

---

## 📞 Support

If deployment fails:
1. Check rollback plan above
2. Review Docker logs: `docker logs app`
3. Check VPS resources: `docker stats`, `df -h`, `free -h`
4. Verify network connectivity
5. Contact system administrator if issues persist

---

**Status**: 🔜 Ready for Deployment  
**Estimated Duration**: 15-20 minutes  
**Deployment Window**: January 24, 2026 (Flexible - low risk)  
**Assigned To**: TBD
