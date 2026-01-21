# Environment Variables Deployment Strategy

## 🎯 The Problem You Identified

You're absolutely right! The current approach violates the Phase 3 principle of **Dev → Staging → Production** consistency. Manually configuring `.env` files on the VPS defeats the purpose of automated deployment.

## 🔧 The Solution: Two Approaches

### **Approach 1: Commit Environment Templates (Recommended for your setup)**

Since you have a **private GitHub repository**, you can safely commit environment files with placeholder values.

**How it works:**
1. `.env.production` and `.env.staging` are committed to GitHub (with placeholder keys)
2. On deployment, you run a **one-time setup** to add real API keys
3. After that, all deployments are automatic

**Steps:**

#### 1. Update `.gitignore` to allow production env files:
```gitignore
# env files
.env              # Local development (never commit)
.env.local        # Local overrides (never commit)
.env*.local       # Any local variants (never commit)

# Allow production env files (private repo only!)
!.env.production  # Commit with placeholders
!.env.staging     # Commit with placeholders
```

#### 2. Update `.env.production` with placeholders:
```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://aibreeds-demo.com

# LLM API Keys - REPLACE THESE ON FIRST DEPLOYMENT
TOGETHER_API_KEY=${TOGETHER_API_KEY:-your_together_api_key_here}
OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-your_openrouter_api_key_here}

# Image API Keys (Optional)
CAT_API_KEY=${CAT_API_KEY:-}
UNSPLASH_ACCESS_KEY=${UNSPLASH_ACCESS_KEY:-}
PEXELS_API_KEY=${PEXELS_API_KEY:-}
```

#### 3. One-time VPS setup script:
```bash
# scripts/setup-production-env.sh
#!/bin/bash
echo "Setting up production environment variables..."
echo "Enter your Together AI API key:"
read -s TOGETHER_KEY
echo "Enter your OpenRouter API key (optional, press Enter to skip):"
read -s OPENROUTER_KEY

cd /root/pets
sed -i "s/your_together_api_key_here/$TOGETHER_KEY/g" .env.production
sed -i "s/your_openrouter_api_key_here/$OPENROUTER_KEY/g" .env.production
cp .env.production .env

echo "✓ Production environment configured!"
```

#### 4. Deployment workflow:
```bash
# First deployment (one-time):
ssh root@159.223.63.117
cd /root/pets
git pull origin main
bash scripts/setup-production-env.sh
docker compose -f docker-compose.production.yml up -d --build

# All subsequent deployments (fully automated):
ssh root@159.223.63.117
cd /root/pets
git pull origin main
docker compose -f docker-compose.production.yml up -d --build
```

---

### **Approach 2: GitHub Secrets + CI/CD (Enterprise approach)**

Use GitHub Actions to inject secrets during deployment.

**How it works:**
1. Store API keys as GitHub Secrets
2. GitHub Actions builds Docker image with secrets
3. Deploy to VPS automatically on push to main

**Workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create .env.production
        run: |
          echo "NODE_ENV=production" > .env.production
          echo "TOGETHER_API_KEY=${{ secrets.TOGETHER_API_KEY }}" >> .env.production
          echo "OPENROUTER_API_KEY=${{ secrets.OPENROUTER_API_KEY }}" >> .env.production
          
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: 159.223.63.117
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /root/pets
            git pull origin main
            docker compose -f docker-compose.production.yml up -d --build
```

---

## 🎯 Recommended Approach for Your Project

**Use Approach 1** because:
- ✅ Private repository (safe to commit env files)
- ✅ Simple one-time setup
- ✅ Fully automated after initial config
- ✅ Consistent across all environments
- ✅ No complex CI/CD pipeline needed

## 📝 Implementation Steps

### Step 1: Update local files
```bash
# Update .gitignore
# Update .env.production with placeholders
# Commit and push
git add .gitignore .env.production
git commit -m "feat: Add production env file for consistent deployment"
git push origin main
```

### Step 2: One-time VPS setup
```bash
ssh root@159.223.63.117
cd /root/pets
git pull origin main

# Edit .env.production with real API keys
nano .env.production
# Replace placeholders with actual keys
# Save (Ctrl+X, Y, Enter)

# Copy to .env
cp .env.production .env

# Restart containers
docker compose restart app
```

### Step 3: All future deployments
```bash
# From your laptop:
git push origin main

# On VPS (or automate this):
ssh root@159.223.63.117 "cd /root/pets && git pull && docker compose up -d --build"
```

---

## 🔒 Security Best Practices

### If using Approach 1 (committing env files):
- ✅ Keep repository **private**
- ✅ Use placeholders, not real keys in the committed file
- ✅ Add real keys during first deployment
- ✅ Never commit `.env` or `.env.local`
- ✅ Rotate keys if repository becomes public

### Alternative (more secure):
- Store keys in GitHub Secrets
- Use deployment script that pulls secrets
- Keep `.env.production` in `.gitignore`
- Use environment variable substitution

---

## 🚀 Full Automated Deployment Script

```bash
#!/bin/bash
# scripts/deploy.sh
# Usage: ./scripts/deploy.sh production

ENVIRONMENT=${1:-production}
VPS_HOST="159.223.63.117"
VPS_USER="root"
VPS_PATH="/root/pets"

echo "🚀 Deploying to $ENVIRONMENT..."

# Push latest code to GitHub
git push origin main

# Deploy to VPS
ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
  cd ${VPS_PATH}
  
  # Pull latest code
  git pull origin main
  
  # Use environment-specific compose file
  docker compose -f docker-compose.${ENVIRONMENT}.yml down
  docker compose -f docker-compose.${ENVIRONMENT}.yml up -d --build
  
  # Wait for health check
  sleep 10
  curl -f http://localhost:3000/api/health || echo "❌ Health check failed"
  
  echo "✅ Deployment complete!"
ENDSSH

echo "🎉 Deployed to https://aibreeds-demo.com"
```

Make executable:
```bash
chmod +x scripts/deploy.sh
```

Use:
```bash
./scripts/deploy.sh production
```

---

## ✅ What This Achieves

- **Consistency**: Same code, same config across Dev → Staging → Production
- **Automation**: One command deployment after initial setup
- **Security**: API keys never in public commits
- **Simplicity**: No complex CI/CD for small projects
- **Phase 3 Compliant**: Follows the deployment strategy exactly

This is the proper way to handle environment variables in a professional deployment pipeline! 🎯
