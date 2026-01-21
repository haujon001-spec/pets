# 🚀 Deployment Workflow - DEV → GitHub → Production

## The Problem We Solved Today

**Issue**: `.env.local` (with real API keys) was blocked by `.gitignore`, so it never synced from DEV → GitHub → VPS.

**Result**: VPS had placeholder keys → LLM returned 401 Unauthorized errors.

---

## ✅ The Correct Deployment Strategy

### Phase 3 Principles (from projectplan.md):
- ✅ Consistent workflow: **DEV → GitHub → Staging → Production**
- ✅ No manual VPS configuration after first setup
- ✅ Environment separation: `.env.local` (dev), `.env.production` (prod)

### The Solution: Environment Templates

**How It Works:**
1. **DEV**: Use `.env.local` with real API keys (NEVER commit)
2. **GitHub**: Commit `.env.production.template` with placeholders (safe to commit)
3. **VPS**: Run one-time setup script to create `.env` from template

---

## 📋 Standard Deployment Workflow

### **First Time Setup (ONE TIME ONLY)**

```bash
# 1. On DEV laptop: Push code to GitHub
git add .
git commit -m "feat: Add production environment template"
git push origin main

# 2. On VPS: Clone/pull code
ssh root@159.223.63.117
cd /root/pets
git pull origin main

# 3. On VPS: Run ONE-TIME setup script
bash scripts/setup-production-env.sh
# Enter your API keys when prompted
# This creates /root/pets/.env with real keys

# 4. Deploy containers
docker compose up -d --build

# 5. Verify
curl http://localhost:3000/api/health
docker compose logs app | grep "LLM Router initialized"
```

### **All Future Deployments (FULLY AUTOMATED)**

```bash
# On DEV laptop: Make changes, test locally
npm run dev  # Test with .env.local

# Commit and push
git add .
git commit -m "feat: Your feature description"
git push origin main

# On VPS: Deploy (single command!)
ssh root@159.223.63.117 'cd /root/pets && git pull origin main && docker compose up -d --build'

# That's it! No manual .env editing needed.
```

---

## 🔐 Security Best Practices

### What Gets Committed to GitHub:

✅ **SAFE to commit:**
- `.env.production.template` (placeholders only)
- `.env.staging.template` (placeholders only)
- `.env.example` (documentation)
- `docker-compose.yml`
- `Dockerfile`
- All source code

❌ **NEVER commit:**
- `.env` (actual environment file)
- `.env.local` (local development with real keys)
- `.env.production` (if it contains real API keys)
- Any file with real API keys

### .gitignore Configuration:

```gitignore
# Block all env files by default
.env
.env.local
.env*.local

# Allow templates (no real secrets)
!.env.production.template
!.env.staging.template
!.env.example
```

---

## 📂 File Structure

```
vscode_2/
├── .env.local                      # DEV only (real keys, NEVER commit)
├── .env.production.template        # COMMIT to GitHub (placeholders)
├── .env.staging.template           # COMMIT to GitHub (placeholders)
├── .env.example                    # COMMIT to GitHub (documentation)
├── docker-compose.yml              # References env_file: .env
├── scripts/
│   └── setup-production-env.sh    # One-time VPS setup
└── .gitignore                      # Blocks .env.local, allows templates
```

**On VPS after setup:**
```
/root/pets/
├── .env                            # Created by setup script (real keys)
├── .env.production.template        # Pulled from GitHub
├── docker-compose.yml              # Pulled from GitHub
└── all other files from GitHub
```

---

## 🎯 Why This Approach Works

| Requirement | Solution |
|------------|----------|
| **Consistent deployments** | Template syncs via Git, one-time setup creates .env |
| **Security** | Real API keys NEVER in Git, only on VPS filesystem |
| **No manual config** | After first setup, just `git pull && docker compose up` |
| **Dev/Prod separation** | `.env.local` (dev) vs `.env` (prod), never mixed |
| **GitHub compatibility** | Templates have placeholders, no Push Protection blocks |

---

## 🔧 Troubleshooting

### If LLM returns 401 Unauthorized:

```bash
# Check if .env exists on VPS
ssh root@159.223.63.117 'cat /root/pets/.env | grep API_KEY'

# If missing, run setup script again
ssh root@159.223.63.117
cd /root/pets
bash scripts/setup-production-env.sh
docker compose restart app
```

### If environment variables not loaded:

```bash
# Verify docker-compose.yml has env_file
grep -A5 "app:" docker-compose.yml | grep "env_file"

# Should output: env_file: .env

# If missing, add it and redeploy
docker compose up -d --force-recreate app
```

---

## 📝 Summary

**What We Fixed Today:**
1. ✅ `.env.local` blocked by `.gitignore` (by design for security)
2. ✅ Created `.env.production.template` with placeholders
3. ✅ Created `setup-production-env.sh` for one-time VPS setup
4. ✅ Updated `docker-compose.yml` to load `.env` file
5. ✅ Documented proper DEV → GitHub → Production workflow

**Going Forward:**
- Keep real API keys in `.env.local` (DEV)
- Commit code + templates to GitHub
- VPS uses `.env` created by setup script (already done)
- All future deployments: just `git pull && docker compose up`

**No more hours of troubleshooting!** 🎉
