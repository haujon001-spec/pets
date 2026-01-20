# Deployment Quick Start Guide

## Prerequisites

1. **VPS Server** with Docker and Docker Compose installed
2. **Domain names** configured:
   - Production: `aibreeds-demo.com` → VPS IP
   - Staging: `staging.aibreeds-demo.com` → VPS IP
3. **SSH access** to VPS configured
4. **API Keys** obtained for LLM providers

## Initial Setup (One-Time)

### 1. Configure VPS Access

Add to your shell profile (`~/.bashrc` or `~/.zshrc`):

```bash
export VPS_HOST="your-vps-ip-or-domain"
export VPS_USER="root"
```

Then reload:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

### 2. Create Application Directory on VPS

```bash
ssh $VPS_USER@$VPS_HOST "mkdir -p /opt/aibreeds/backups"
```

### 3. Configure Environment Files

#### For Staging (`.env.staging`):
```bash
# Update with real API keys
TOGETHER_API_KEY=your_actual_together_key
OPENROUTER_API_KEY=your_actual_openrouter_key
```

#### For Production (`.env.production`):
```bash
# Update with real API keys
TOGETHER_API_KEY=your_actual_together_key
OPENROUTER_API_KEY=your_actual_openrouter_key
```

### 4. Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

## Deployment Workflow

### Deploy to Staging

```bash
# 1. Create backup before deployment
npm run backup pre-staging-deploy

# 2. Deploy to staging
npm run deploy:staging

# 3. Verify deployment
curl https://staging.aibreeds-demo.com/api/health

# 4. Test application
open https://staging.aibreeds-demo.com
```

### Deploy to Production

```bash
# 1. Create version tag
npm run version:tag patch  # or minor, major

# 2. Push tag to GitHub
git push --tags

# 3. Create backup
npm run backup pre-production-v0.2.0

# 4. Deploy to production
npm run deploy:production

# 5. Verify deployment
curl https://aibreeds-demo.com/api/health

# 6. Monitor logs
ssh $VPS_USER@$VPS_HOST "cd /opt/aibreeds && docker-compose logs -f"
```

### Rollback (If Needed)

```bash
# 1. List available backups
ssh $VPS_USER@$VPS_HOST "ls -lh /opt/aibreeds/backups/"

# 2. Rollback to specific timestamp
npm run deploy:rollback 20260120_143000
```

## Common Commands

### Health Check
```bash
# Local
curl http://localhost:3000/api/health | jq

# Staging
curl https://staging.aibreeds-demo.com/api/health | jq

# Production
curl https://aibreeds-demo.com/api/health | jq
```

### View Logs
```bash
# SSH into VPS
ssh $VPS_USER@$VPS_HOST

# View all logs
cd /opt/aibreeds
docker-compose logs -f

# View app logs only
docker-compose logs -f app

# View Caddy logs only
docker-compose logs -f caddy
```

### Container Management
```bash
# SSH into VPS
ssh $VPS_USER@$VPS_HOST

cd /opt/aibreeds

# View running containers
docker-compose ps

# Restart containers
docker-compose restart

# Stop containers
docker-compose down

# Start containers
docker-compose up -d

# Rebuild and restart
docker-compose up -d --build
```

### Backup & Restore
```bash
# Create backup
npm run backup my-backup-name

# Restore from backup
npm run restore manual-20260120_143000
```

## Troubleshooting

### Port 80 Already in Use

```bash
# SSH into VPS
ssh $VPS_USER@$VPS_HOST

# Find process on port 80
lsof -ti:80

# Kill process
kill -9 $(lsof -ti:80)

# Restart containers
cd /opt/aibreeds
docker-compose down
docker-compose up -d
```

### Health Check Failing

```bash
# Check app logs
ssh $VPS_USER@$VPS_HOST "cd /opt/aibreeds && docker-compose logs app"

# Check if app is running
docker ps -a

# Test health endpoint inside container
docker exec aibreeds-app curl http://localhost:3000/api/health
```

### SSL Certificate Issues

```bash
# Check Caddy logs
ssh $VPS_USER@$VPS_HOST "cd /opt/aibreeds && docker-compose logs caddy"

# Verify DNS
dig aibreeds-demo.com

# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Environment Variables Reference

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `NODE_ENV` | development | staging | production |
| `NEXT_PUBLIC_API_URL` | http://localhost:3000 | https://staging.aibreeds-demo.com | https://aibreeds-demo.com |
| `CACHE_EXPIRATION_DAYS` | 7 | 7 | 7 |
| `MAX_CACHE_SIZE_MB` | 500 | 500 | 1000 |
| `RATE_LIMIT_RPM` | - | 60 | 60 |

## Next Steps

After successful deployment:

1. **Set up monitoring** (Phase 5):
   - Configure UptimeRobot or similar
   - Set up error tracking (Sentry)
   - Configure log aggregation

2. **Configure CI/CD** (Phase 5):
   - GitHub Actions for automated deployments
   - Automated testing before deployment

3. **Performance optimization**:
   - Configure CDN (CloudFlare)
   - Enable caching policies
   - Monitor performance metrics

4. **Security hardening**:
   - Configure rate limiting
   - Set up WAF rules
   - Regular security audits
