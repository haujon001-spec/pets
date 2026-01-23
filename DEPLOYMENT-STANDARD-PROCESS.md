# Standardized Deployment Process

## 🎯 Problem Statement

**Issue**: Inconsistent deployments due to missing/incorrect environment variables in production
- `.env.local` contains real API keys (NEVER commit to git)
- `.env.production` in git has placeholders (correct for security)
- Docker containers not getting API keys during deployment
- Manual, error-prone process each deployment

## ✅ Solution: Standardized Deployment Workflow

### Core Principles

1. **NEVER commit real API keys to git** - even in private repos
2. **Keep one source of truth for production secrets** - on VPS only
3. **Automate deployment** - consistent, repeatable process
4. **Use --env-file flag** - Docker reads from VPS `.env` file

---

## 📋 One-Time VPS Setup (Already Done ✅)

The VPS already has `/root/pets/.env` with real API keys:
```bash
TOGETHER_API_KEY=tgp_v1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxx
NODE_ENV=production
```

**Location**: `/root/pets/.env` (persistent, not in git)

---

## 🚀 Standard Deployment Process

### Every Deployment

Use this script for **every** production deployment:

```bash
# On your local machine
./scripts/deploy-vps.sh
```

Or manual steps:

```bash
# 1. SSH into VPS
ssh root@aibreeds-demo.com

# 2. Navigate to project
cd /root/pets

# 3. Pull latest code
git pull origin main

# 4. Rebuild Docker image
docker build -f Dockerfile.prod -t pet-portal:latest .

# 5. Stop old container
docker stop app && docker rm app

# 6. Start new container WITH ENV FILE
docker run -d \
  --name app \
  --network pet-network \
  --env-file /root/pets/.env \
  -p 3000:3000 \
  --restart unless-stopped \
  pet-portal:latest

# 7. Verify deployment
docker logs app --tail 20
curl http://localhost:3000/api/health
```

**Key Change**: `--env-file /root/pets/.env` (line 6 above)

---

## 🔧 Automated Deployment Script

I'll create an improved deployment script that:
1. ✅ Always uses the VPS `.env` file
2. ✅ Validates env file exists before deploying
3. ✅ Tests API keys are loaded in container
4. ✅ Provides clear error messages
5. ✅ Has automatic rollback on failure

---

## 📂 File Structure

### On VPS (`/root/pets/`)
```
/root/pets/
├── .env                    # ✅ Real API keys (NOT in git)
├── .env.production         # ❌ Placeholders (committed to git)
├── .env.example            # ℹ️  Template (committed to git)
├── Dockerfile.prod
├── (rest of code from git)
```

### In Git Repository
```
vscode_2/
├── .env.local              # ❌ Ignored (your dev keys)
├── .env.production         # ✅ Committed (placeholders only)
├── .env.example            # ✅ Committed (template)
├── .gitignore              # ✅ Blocks .env.local
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Keep real API keys in `/root/pets/.env` on VPS only
- Commit `.env.example` with placeholders for documentation
- Use `.gitignore` to block `.env.local`
- Use `--env-file` flag when running Docker containers
- Back up VPS `.env` file separately (not in git)

### ❌ DON'T:
- Commit `.env.local` to git
- Put real API keys in `.env.production` in git
- Pass API keys as command-line arguments (visible in `ps` output)
- Store secrets in Docker images

---

## 🐛 Troubleshooting

### Issue: "401 Unauthorized" errors from LLM providers

**Cause**: Container doesn't have API keys

**Fix**:
```bash
# Check if container has keys
ssh root@aibreeds-demo.com "docker exec app env | grep -i api"

# If no keys shown, restart with --env-file
cd /root/pets
docker stop app && docker rm app
docker run -d --name app --network pet-network --env-file .env -p 3000:3000 pet-portal:latest
```

### Issue: "No such file: .env.local" during deployment

**Cause**: Docker trying to use `.env.local` (doesn't exist on VPS)

**Fix**: Use `--env-file /root/pets/.env` instead (absolute path)

### Issue: Different behavior local vs production

**Cause**: Different environment variables

**Check**:
```bash
# Local
cat .env.local | grep TOGETHER_API_KEY

# Production
ssh root@aibreeds-demo.com "cat /root/pets/.env | grep TOGETHER_API_KEY"
```

---

## 📊 Deployment Checklist

Before every deployment:

- [ ] Code changes committed and pushed to GitHub
- [ ] Local testing complete
- [ ] Health checks passing locally
- [ ] VPS `/root/pets/.env` file exists and has valid keys
- [ ] Using `--env-file /root/pets/.env` in docker run command
- [ ] Container logs show "LLM Router initialized"
- [ ] Health endpoint returns 200 OK
- [ ] No 401 errors in production logs

---

## 🎓 Why This Approach?

**Problem with current approach**:
- `.env.production` in git has placeholders
- Deploying from git = placeholders deployed = 401 errors
- Manual env file creation each time = inconsistent

**Solution**:
- VPS has ONE persistent `.env` file with real keys
- Git has template/placeholder files for documentation
- Every deployment uses same `.env` file via `--env-file`
- Consistent, secure, automated

---

## 📝 Next Steps

1. Update `scripts/deploy-vps.sh` to always use `--env-file`
2. Create env file validation in deployment script
3. Document this process in main README.md
4. Add pre-deployment checks
5. Create rollback procedure that preserves `.env`

---

**Last Updated**: January 23, 2026  
**Status**: Active deployment standard
