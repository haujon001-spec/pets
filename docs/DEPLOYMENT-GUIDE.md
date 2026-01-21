# Quick Deployment Guide

## Prerequisites

Before deploying to production VPS:

1. **VPS Server Setup**
   - Ubuntu/Debian server with Docker installed
   - SSH access configured
   - Domain pointing to VPS IP (aibreeds-demo.com)

2. **Environment Variables**
   - Create `.env.production` file with:
     ```bash
     TOGETHER_API_KEY=your_together_ai_key
     OPENROUTER_API_KEY=your_openrouter_key
     ```

3. **SSH Configuration**
   - Set environment variables (or edit script):
     ```bash
     export VPS_HOST=aibreeds-demo.com
     export VPS_USER=deploy
     export VPS_PATH=/var/www/aibreeds
     ```

## Deploy to Production

### One-Command Deployment

```bash
npm run deploy:production
```

This script will:
1. ✅ Run comprehensive health checks (66 tests)
2. ✅ Validate all 12 language configurations
3. ✅ Run TypeScript type checking
4. ✅ Build Next.js production bundle
5. ✅ Build and test Docker image locally
6. ✅ Transfer image and configs to VPS
7. ✅ Start containers with docker-compose
8. ✅ Run post-deployment validation
9. ✅ Verify HTTPS endpoint and API health

### Manual Deployment Steps

If you prefer manual control:

```bash
# 1. Run health checks
npm run health:phase6
npm run health:languages

# 2. Build production bundle
npm run build

# 3. Build Docker image
docker build -f Dockerfile.prod -t aibreeds-portal:latest .

# 4. Save and transfer image
docker save aibreeds-portal:latest | gzip > image.tar.gz
scp image.tar.gz deploy@aibreeds-demo.com:/var/www/aibreeds/
scp docker-compose.yml deploy@aibreeds-demo.com:/var/www/aibreeds/
scp Caddyfile deploy@aibreeds-demo.com:/var/www/aibreeds/
scp .env.production deploy@aibreeds-demo.com:/var/www/aibreeds/.env

# 5. SSH to VPS and deploy
ssh deploy@aibreeds-demo.com
cd /var/www/aibreeds
gunzip -c image.tar.gz | docker load
docker-compose down
docker-compose up -d

# 6. Verify deployment
curl https://aibreeds-demo.com
curl https://aibreeds-demo.com/api/health
```

## Post-Deployment Verification

### Check Container Status
```bash
ssh deploy@aibreeds-demo.com "docker ps"
```

Expected output: 2+ containers (app + caddy)

### View Logs
```bash
ssh deploy@aibreeds-demo.com "cd /var/www/aibreeds && docker-compose logs -f"
```

### Test API Health
```bash
curl https://aibreeds-demo.com/api/health
```

Expected: `{"status":"healthy"}`

### Test Languages
Visit these URLs to verify all languages work:
- https://aibreeds-demo.com/?locale=en (English)
- https://aibreeds-demo.com/?locale=es (Spanish)
- https://aibreeds-demo.com/?locale=vi (Vietnamese)
- https://aibreeds-demo.com/?locale=zh-tw (Chinese Traditional)
- https://aibreeds-demo.com/?locale=ar (Arabic - RTL)

## Rollback

If deployment fails or issues occur:

```bash
npm run deploy:rollback
```

Or manually:
```bash
ssh deploy@aibreeds-demo.com "cd /var/www/aibreeds && docker-compose down && docker-compose up -d"
```

## Troubleshooting

### Port 80/443 Already in Use
```bash
ssh deploy@aibreeds-demo.com "sudo lsof -i :80"
ssh deploy@aibreeds-demo.com "sudo lsof -i :443"
# Stop conflicting services
ssh deploy@aibreeds-demo.com "sudo systemctl stop nginx"  # if nginx running
```

### SSL Certificate Issues
```bash
# Check Caddy logs
ssh deploy@aibreeds-demo.com "docker logs aibreeds-caddy"

# Caddy auto-provisions Let's Encrypt - may take 1-2 minutes
```

### Container Won't Start
```bash
# Check logs for errors
ssh deploy@aibreeds-demo.com "cd /var/www/aibreeds && docker-compose logs"

# Check environment variables
ssh deploy@aibreeds-demo.com "cat /var/www/aibreeds/.env"
```

### Translation Not Working
```bash
# Verify language files transferred
ssh deploy@aibreeds-demo.com "cd /var/www/aibreeds && docker exec -it aibreeds-app ls -la messages/"

# Should show: en.json, es.json, fr.json, de.json, zh.json, zh-tw.json, pt.json, ar.json, ja.json, ru.json, it.json, vi.json
```

### Image Verification Not Working
```bash
# Check API keys are set
ssh deploy@aibreeds-demo.com "docker exec -it aibreeds-app env | grep API_KEY"

# Test vision endpoint
curl -X POST https://aibreeds-demo.com/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{"question":"test","useVision":true,"imageUrl":"https://images.dog.ceo/breeds/retriever-golden/n02099712_1.jpg"}'
```

## Performance Monitoring

### Check Build Size
```bash
du -sh .next/
```
Expected: < 100MB

### Check Docker Image Size
```bash
docker images aibreeds-portal:latest
```
Expected: 200-500MB

### Check Memory Usage
```bash
ssh deploy@aibreeds-demo.com "docker stats --no-stream"
```

### Monitor Logs in Real-Time
```bash
ssh deploy@aibreeds-demo.com "cd /var/www/aibreeds && docker-compose logs -f --tail=100"
```

## Updating After Deployment

### Update Application Code
```bash
# Make your changes locally
git add .
git commit -m "Your changes"
git push origin main

# Deploy to production
npm run deploy:production
```

### Update Environment Variables
```bash
# Edit .env.production locally
# Re-run deployment
npm run deploy:production
```

### Update Only Configs (No Code Changes)
```bash
scp docker-compose.yml deploy@aibreeds-demo.com:/var/www/aibreeds/
scp Caddyfile deploy@aibreeds-demo.com:/var/www/aibreeds/
ssh deploy@aibreeds-demo.com "cd /var/www/aibreeds && docker-compose restart"
```

## Security Checklist

Before going live:

- [ ] ✅ API keys in environment variables (not in code)
- [ ] ✅ .env.local in .gitignore
- [ ] ✅ HTTPS enabled with valid SSL certificate
- [ ] ✅ Firewall configured (only ports 22, 80, 443 open)
- [ ] ✅ SSH key-based authentication (no password login)
- [ ] ✅ Docker containers running as non-root user
- [ ] ✅ Regular backups configured
- [ ] ✅ Health monitoring enabled

## Backup & Recovery

### Create Backup
```bash
npm run backup
```

### Restore from Backup
```bash
npm run restore
```

## Support

If deployment fails:

1. Check deployment logs: `deployment-YYYYMMDD-HHMMSS.log`
2. Run health checks: `npm run health:phase6`
3. Verify image: `npm run test:images`
4. Check VPS logs: `ssh deploy@aibreeds-demo.com "cd /var/www/aibreeds && docker-compose logs"`

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run deploy:production` | Deploy to production with health checks |
| `npm run health:phase6` | Run 66 comprehensive validation tests |
| `npm run health:languages` | Validate all 12 language files |
| `npm run test:images` | Verify breed images with vision AI |
| `npm run deploy:rollback` | Rollback to previous version |
| `npm run build` | Build production bundle |

---

**Last Updated**: January 21, 2026  
**Script Version**: deploy-production.sh v1.0
