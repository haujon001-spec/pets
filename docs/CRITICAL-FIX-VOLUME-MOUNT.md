# CRITICAL FIX: Docker Volume Mount for Breed Images

## Issue Summary

**Problem:** Custom breed images (Singapura, Savannah, etc.) were being successfully fetched from APIs and "cached" but weren't visible in the UI.

**Root Cause:** Docker containers have **ephemeral filesystems**. When the breed-image API saved images to `/app/public/breeds/` inside the container, they were lost whenever the container restarted. The images existed only in that specific container instance, not persisted to the host filesystem.

**Impact:** 
- Users saw placeholder images instead of actual breed photos
- Each container restart deleted all dynamically fetched breed images
- Only images baked into the Docker image at build time were available
- Logs showed "Successfully fetched and cached" but files didn't persist

## Technical Explanation

### Why It Failed

1. **Container Filesystem is Temporary:**
   ```bash
   # When API saves image inside container:
   /app/public/breeds/singapura.jpg ← Saved in container's filesystem
   # Container restart or rebuild → FILE DELETED
   ```

2. **No Volume Mount:**
   ```bash
   # Original docker run command:
   docker run -d --name app -p 3000:3000 pet-portal:latest
   # ❌ No persistence - images lost on restart
   ```

3. **Logs Were Misleading:**
   - API logs showed: "✅ Successfully fetched and cached"
   - Images were written to disk successfully
   - But they were written to **container disk**, not **host disk**
   - Container restart = fresh filesystem = images gone

### Why It Works Now

1. **Volume Mount Persists Data:**
   ```bash
   # Fixed docker run command:
   docker run -d --name app \
     -v /root/pets/public/breeds:/app/public/breeds \  # ← CRITICAL
     -p 3000:3000 pet-portal:latest
   ```

2. **Files Persist on Host:**
   ```
   Container                           Host
   /app/public/breeds/singapura.jpg → /root/pets/public/breeds/singapura.jpg
                                       ↑ This file survives container restarts
   ```

3. **Proper Permissions:**
   ```bash
   # Next.js container runs as UID 1001 (user 'nextjs')
   chown -R 1001:1001 /root/pets/public/breeds
   chmod 755 /root/pets/public/breeds
   ```

## The Fix

### Step 1: Stop Current Container
```bash
docker stop app && docker rm app
```

### Step 2: Ensure Breeds Folder Exists with Correct Permissions
```bash
mkdir -p /root/pets/public/breeds
chown -R 1001:1001 /root/pets/public/breeds
chmod 755 /root/pets/public/breeds
```

### Step 3: Start Container with Volume Mount
```bash
docker run -d \
  --name app \
  --network pet-network \
  --env-file /root/pets/.env \
  -p 3000:3000 \
  -v /root/pets/public/breeds:/app/public/breeds \  # ← CRITICAL FIX
  --restart unless-stopped \
  pet-portal:latest
```

### Step 4: Test Image Fetch
```bash
# Test Singapura cat
curl 'http://localhost:3000/api/breed-image?breedId=singapura&petType=cat&breedName=Singapura'
# Expected: {"imageUrl":"/breeds/singapura.jpg"}

# Verify file persists on host
ls -lh /root/pets/public/breeds/singapura.jpg
# Expected: -rw-r--r-- 1 1001 nogroup 67K Jan 23 03:23 /root/pets/public/breeds/singapura.jpg
```

## Updated Deployment Scripts

All deployment scripts have been updated to include the volume mount:

### deploy-master.sh
```bash
# Lines 250-258 now include:
-v ${VPS_PROJECT_DIR}/public/breeds:/app/public/breeds \
```

### deploy-production-standard.sh
```bash
# Lines 136-144 now include:
-v ${VPS_PROJECT_DIR}/public/breeds:/app/public/breeds \
```

### Manual Deployment
If deploying manually, **ALWAYS** include:
```bash
-v /root/pets/public/breeds:/app/public/breeds
```

## Verification Checklist

After any deployment, verify:

✅ **1. Container has volume mount:**
```bash
docker inspect app | grep -A 5 Mounts
# Should show: "Source": "/root/pets/public/breeds"
```

✅ **2. Permissions are correct:**
```bash
ls -ld /root/pets/public/breeds
# Should show: drwxr-xr-x 2 1001 1001
```

✅ **3. Images persist across restarts:**
```bash
# Fetch an image
curl 'http://localhost:3000/api/breed-image?breedId=singapura&petType=cat&breedName=Singapura'

# Restart container
docker restart app

# Image should still exist
ls /root/pets/public/breeds/singapura.jpg
# ✅ File still there!
```

✅ **4. Frontend displays images:**
- Visit https://aibreeds-demo.com
- Type "Singapura" as custom breed
- Image should load (not placeholder)

## Why This Wasn't Caught Earlier

1. **Build-time images worked fine:**
   - Images included in `/public/breeds/` at Docker build time were baked into the image
   - These images (beagle.jpg, labrador.jpg, etc.) worked perfectly
   - Only *dynamically fetched* images were affected

2. **Logs were confusing:**
   - API successfully wrote files to `/app/public/breeds/`
   - Sharp image processing worked
   - Vision AI verification worked
   - Everything appeared successful in logs
   - But container's filesystem was ephemeral

3. **Local development worked:**
   - In `npm run dev`, files save to local `public/breeds/` folder
   - No Docker, so no volume mount needed
   - Issue only appeared in production Docker deployment

## Prevention

### For Future Deployments

**ALWAYS include volume mounts for:**
- `/app/public/breeds` - Cached breed images
- `/app/logs` - Application logs (if implemented)
- Any other runtime-generated files that should persist

### Docker Compose

If using docker-compose, this is already handled:

```yaml
# docker-compose.production.yml
services:
  app:
    volumes:
      - ./public/breeds:/app/public/breeds  # ✅ Already configured
      - ./logs:/app/logs
```

### Manual Commands

Add to your notes/cheatsheet:
```bash
# Standard deployment command
docker run -d --name app \
  --network pet-network \
  --env-file .env \
  -p 3000:3000 \
  -v $(pwd)/public/breeds:/app/public/breeds \  # ← DON'T FORGET
  --restart unless-stopped \
  pet-portal:latest
```

## Related Issues

This fix resolves:
- ✅ Custom breed images not displaying (Singapura, Savannah)
- ✅ Images showing placeholder despite successful API fetch
- ✅ Cache not persisting across container restarts
- ✅ 404 errors for dynamically fetched breed images

## Testing

### Test Custom Breeds

1. **Singapura Cat:**
   - Navigate to https://aibreeds-demo.com
   - Select "Cat" and type "Singapura"
   - Should show actual Singapura image (not placeholder)

2. **Savannah Cat:**
   - Type "Savannah" as custom breed
   - Should show actual Savannah image

3. **Any Custom Breed:**
   - Try obscure breeds: "Toyger", "Sokoke", "Turkish Van"
   - Each should fetch and cache unique images

### Verify Persistence

```bash
# On VPS
ssh root@aibreeds-demo.com

# List all cached images
ls -lh /root/pets/public/breeds/

# Check when images were created
stat /root/pets/public/breeds/singapura.jpg

# Restart container
docker restart app

# Files should still exist
ls /root/pets/public/breeds/singapura.jpg
# ✅ Still there after restart!
```

## Lessons Learned

1. **Docker filesystems are ephemeral** - Always use volumes for persistent data
2. **Success logs don't guarantee persistence** - Verify files exist on host
3. **Test full lifecycle** - Container build, run, restart, and rebuild
4. **Permissions matter** - Match UID/GID of container user (1001 for nextjs)
5. **Local dev ≠ Production** - Docker introduces new failure modes

## Related Documentation

- [Docker Volumes Documentation](https://docs.docker.com/storage/volumes/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [DEPLOYMENT-STANDARD-PROCESS.md](./DEPLOYMENT-STANDARD-PROCESS.md)
- [scripts/README.md](../scripts/README.md)
- [AI Image Generation Guide](./ai-image-generation.md)

## Date Fixed

**January 23, 2025**

Fixed by identifying ephemeral container filesystem issue and adding volume mount: `-v /root/pets/public/breeds:/app/public/breeds`
