# Deployment Checklist - Together AI API Key

**Status**: ✅ READY FOR VPS DEPLOYMENT  
**Date**: March 30, 2026  
**Key**: New Together API key validated and working

---

## ✅ Completed Steps

### 1. API Key Validation
- ✅ Test script ran successfully
- ✅ Together AI API responding correctly
- ✅ Chat completions working (1585ms latency)
- ✅ Key format verified: `tgp_v1_*` (64 characters)

### 2. Pre-Commit Hooks
- ✅ Pre-commit installed and active
- ✅ API key detection hooks enabled
- ✅ Will block any commit attempting to expose API keys

### 3. Security Verification
- ✅ `.env.local` properly gitignored
- ✅ No API keys in git status
- ✅ All sensitive files protected

---

## ▶️ Next: VPS Deployment

### Step 1: Back Up Current VPS Configuration
```bash
cd c:\Users\haujo\projects\DEV\pets

# Connect to VPS and verify current setup
ssh root@159.223.63.117 "docker-compose logs -f pet-portal" &

# Manual backup of current .env.production
scp root@159.223.63.117:/app/.env.production vps_backups/env.production.backup.20260330.txt
```

**Rollback Command (if needed)**:
```bash
scp vps_backups/env.production.backup.20260330.txt root@159.223.63.117:/app/.env.production
ssh root@159.223.63.117 "cd /app && docker-compose restart pet-portal"
```

---

### Step 2: Store New Key in GitHub Secrets

1. Go to: https://github.com/haujon001-spec/pets/settings/secrets/actions
2. Click "New repository secret"
3. Name: `TOGETHER_API_KEY`
4. Value: `tgp_v1_<redacted>`
5. Click "Add secret"

Also update `OPENROUTER_API_KEY` if needed (or leave as is if not using).

---

### Step 3: Deploy to VPS

**Option A: Via CI/CD (Recommended)**
```bash
# Commit your security fixes
git add -A
git commit -m "Security: Updated API key validation and pre-commit hooks"
git push origin main  # (or your deployment branch)
```

Then GitHub Actions will:
1. Pull new key from GitHub Secrets
2. SSH to VPS
3. Create new `.env.production` with secret
4. Restart Docker containers
5. Verify health checks

**Option B: Manual Deployment**
```bash
# SSH to VPS
ssh root@159.223.63.117

# Create new .env.production
cat > /app/.env.production << 'EOF'
NODE_ENV=production
TOGETHER_API_KEY=tgp_v1_<redacted>
OPENROUTER_API_KEY=sk-or-v1-<redacted>
LLM_PROVIDER_ORDER=openrouter,together
REPLICATE_API_TOKEN=r8_<redacted>
HUGGINGFACE_API_KEY=hf_<redacted>
NEXT_PUBLIC_API_URL=https://aibreeds-demo.com
NODE_ENV=production
EOF

# Restart Docker
cd /app && docker-compose down && docker-compose up -d --build pet-portal

# Wait 5 seconds
sleep 5

# Verify
docker-compose logs -f pet-portal
docker exec pets-app curl http://localhost:3000/api/health
```

---

### Step 4: Verify Deployment

Check these indicators:

```bash
# 1. Website loads
curl https://aibreeds-demo.com

# 2. API responds
curl https://aibreeds-demo.com/api/health

# 3. Chat works (test with browser or curl)
# Go to https://aibreeds-demo.com and test the chatbot

# 4. Logs show Together AI responses
ssh root@159.223.63.117 "docker-compose logs pet-portal | grep -i 'together\|llm\|provider'"
```

**Expected log output**:
```
✅ LLM Response from Together AI in 1234ms
✅ Model: ServiceNow-AI/Apriel-1.5-15b-Thinker
```

---

## 🚨 Rollback (If Deployment Fails)

```bash
# Restore previous .env.production
scp vps_backups/env.production.backup.20260330.txt root@159.223.63.117:/app/.env.production

# Restart services
ssh root@159.223.63.117 "cd /app && docker-compose restart pet-portal"

# Verify
curl https://aibreeds-demo.com
```

---

## ✅ Security Compliance

- ✅ `.env.local` contains real key (local only, gitignored)
- ✅ GitHub Secrets store production key (encrypted)
- ✅ `.env.production` created/updated at deploy time
- ✅ Pre-commit hooks prevent accidental commits
- ✅ NO API keys in any committed files
- ✅ Follows soul.md security policy

---

## 📋 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Key expired or revoked - get new key from Together AI |
| Network timeout | Check VPS firewall - allow outbound HTTPS |  
| Container fails to start | Check logs: `docker-compose logs pet-portal` |
| Old key still used | Verify .env.production updated - restart docker |

---

## 📞 Support

- Together AI Status: https://status.together.ai
- Together AI Docs: https://docs.together.ai
- GitHub Secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

**Ready to deploy?** 🚀

Next commands:
```bash
# 1. Back up current config
scp root@159.223.63.117:/app/.env.production vps_backups/env.production.`date +%s`.txt

# 2. Add new key to GitHub Secrets (web browser)

# 3. Deploy (via CI/CD or manual SSH)

# 4. Verify at https://aibreeds-demo.com
```
