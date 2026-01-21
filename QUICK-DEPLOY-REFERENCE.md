# Quick Deployment Reference

## ✅ Current Working State (January 21, 2026)

**Production Site**: https://aibreeds-demo.com  
**VPS IP**: 159.223.63.117  
**SSL Certificate**: Valid until April 21, 2026 (Let's Encrypt)  
**Docker Containers**: pet-portal (app) + caddy (reverse proxy)

---

## 🚀 Standard Deployment Process

### **One-Time Setup (ALREADY DONE ✓)**
```bash
# 1. VPS has .env file with real API keys ✓
# 2. docker-compose.yml loads env_file: .env ✓
# 3. Caddy configured with HTTPS ✓
```

### **Regular Deployment (Future Updates)**
```bash
# 1. On DEV Laptop - Make changes
npm run dev          # Test locally
git add .
git commit -m "Your feature description"
git push origin main

# 2. On VPS - Deploy (single SSH command)
ssh root@159.223.63.117 'cd /root/pets && git pull origin main && docker compose up -d --build'

# 3. Verify deployment
curl https://aibreeds-demo.com/api/health
```

**That's it!** No manual .env editing, no configuration changes needed.

---

## 🔧 Current Files Synced to GitHub

| File | Purpose | Git Status |
|------|---------|-----------|
| `.env.local` | DEV with real keys | ❌ Blocked by .gitignore |
| `.env.production.template` | Template with placeholders | ✅ In Git |
| `docker-compose.yml` | Container orchestration | ✅ In Git (loads .env) |
| `Dockerfile` | Multi-stage build | ✅ In Git |
| `Caddyfile` | HTTPS + reverse proxy | ✅ In Git |
| `DEPLOYMENT-WORKFLOW.md` | Full workflow guide | ✅ In Git |
| `scripts/setup-production-env.sh` | One-time setup | ✅ In Git |

---

## 🎯 What We Fixed Today

### Issue 1: Environment Variables Not Syncing
**Problem**: `.env.local` blocked by `.gitignore`, so API keys didn't sync to VPS  
**Solution**: 
- Created `.env.production.template` with placeholders (safe for Git)
- VPS uses `.env` file created once with real keys
- Template ensures structure consistency across environments

### Issue 2: LLM 401 Unauthorized Errors
**Problem**: `docker-compose.yml` wasn't loading `.env` file  
**Solution**: Added `env_file: .env` to app service in docker-compose.yml

### Issue 3: HTTPS Not Working
**Problem**: 
- `www.aibreeds-demo.com` DNS record doesn't exist
- Auto HTTPS was disabled in Caddyfile  

**Solution**:
- Removed www subdomain from Caddyfile
- Re-enabled automatic HTTPS for aibreeds-demo.com
- Let's Encrypt SSL certificate obtained successfully

---

## 📋 Phase 5 Goals (Next Work)

Will implement:
1. **Pre-deployment validation** - Catch errors before deploying
2. **Automated health checks** - Verify deployment succeeded
3. **Auto-rollback** - Revert automatically if deployment fails
4. **Better error detection** - Know immediately what broke
5. **One-command deployment** - Even simpler than current process

**Benefits**:
- Deployment time: < 5 minutes
- Auto-rollback: < 2 minutes
- 90% less troubleshooting
- Zero downtime deployments

---

## 🔐 Security Notes

**Safe to commit to Git:**
- ✅ `.env.production.template` (placeholders only)
- ✅ All source code files
- ✅ Configuration files (docker-compose.yml, Dockerfile, Caddyfile)

**NEVER commit:**
- ❌ `.env` or `.env.local` (real API keys)
- ❌ Any file with actual API credentials

**Current .gitignore configuration:**
```gitignore
.env                # Blocked
.env.local          # Blocked
.env*.local         # Blocked
!.env.production.template  # Allowed (placeholders)
```

---

## 📞 Quick Troubleshooting

### If LLM stops working:
```bash
# Check environment variables loaded
ssh root@159.223.63.117 "docker compose exec app printenv | grep API_KEY"

# Restart app container
ssh root@159.223.63.117 "cd /root/pets && docker compose restart app"
```

### If HTTPS certificate expires:
```bash
# Check certificate expiration
ssh root@159.223.63.117 "openssl s_client -connect aibreeds-demo.com:443 -servername aibreeds-demo.com < /dev/null 2>/dev/null | openssl x509 -noout -dates"

# Restart Caddy to renew
ssh root@159.223.63.117 "cd /root/pets && docker compose restart caddy"
```

### If Docker containers stop:
```bash
# Check container status
ssh root@159.223.63.117 "cd /root/pets && docker compose ps"

# Restart all containers
ssh root@159.223.63.117 "cd /root/pets && docker compose up -d"

# Check logs
ssh root@159.223.63.117 "cd /root/pets && docker compose logs --tail 50"
```

---

## 📚 Documentation Links

- **Full Deployment Workflow**: [DEPLOYMENT-WORKFLOW.md](DEPLOYMENT-WORKFLOW.md)
- **Project Plan (All Phases)**: [projectplan.md](projectplan.md)
- **VPS Deployment Guide**: [VPS-DEPLOYMENT-GUIDE.md](VPS-DEPLOYMENT-GUIDE.md)
- **Environment Strategy**: [DEPLOYMENT-ENV-STRATEGY.md](DEPLOYMENT-ENV-STRATEGY.md)

---

**Last Updated**: January 21, 2026  
**Status**: ✅ Production site running successfully with HTTPS
