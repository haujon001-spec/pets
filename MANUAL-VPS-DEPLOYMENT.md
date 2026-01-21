# Manual VPS Deployment Guide (Without Docker locally)

Since Docker isn't installed on Windows, here's how to deploy manually:

## Option 1: Deploy Pre-Built Code via Git (EASIEST)

Your code is already on GitHub, so you can deploy directly from there!

### On your VPS server:

```bash
# 1. SSH to VPS
ssh root@aibreeds-demo.com

# 2. Install required software
apt update
apt install -y docker.io docker-compose git

# 3. Clone your repository
cd /var/www
git clone https://github.com/haujon001-spec/pets.git aibreeds
cd aibreeds

# 4. Create .env file
nano .env

# Add these lines (replace with your actual keys):
TOGETHER_API_KEY=your_together_ai_key
OPENROUTER_API_KEY=your_openrouter_key
# Save: Ctrl+X, Y, Enter

# 5. Build and start with Docker
docker build -f Dockerfile.prod -t aibreeds-portal:latest .
docker-compose up -d

# 6. Check status
docker-compose ps
docker-compose logs -f
```

## Option 2: Use Docker Hub (Someone else's build)

If you can't build Docker locally, you can use a pre-configured setup:

### On your VPS:

```bash
# 1. SSH to VPS
ssh root@aibreeds-demo.com

# 2. Create deployment directory
mkdir -p /var/www/aibreeds && cd /var/www/aibreeds

# 3. Create docker-compose.yml
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  app:
    image: node:20-alpine
    working_dir: /app
    container_name: aibreeds-app
    restart: unless-stopped
    command: sh -c "npm install && npm run build && npm start"
    environment:
      - NODE_ENV=production
      - TOGETHER_API_KEY=${TOGETHER_API_KEY}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
    ports:
      - "3000:3000"
    volumes:
      - ./:/app
    networks:
      - aibreeds-network

  caddy:
    image: caddy:latest
    container_name: aibreeds-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - aibreeds-network

networks:
  aibreeds-network:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
EOF

# 4. Create Caddyfile
cat > Caddyfile <<'EOF'
aibreeds-demo.com {
    reverse_proxy app:3000
    encode gzip
    log {
        output file /var/log/caddy/access.log
    }
}
EOF

# 5. Clone your code
git clone https://github.com/haujon001-spec/pets.git .

# 6. Create .env
nano .env
# Add your API keys:
# TOGETHER_API_KEY=your_key
# OPENROUTER_API_KEY=your_key

# 7. Start containers
docker-compose up -d

# 8. Monitor logs
docker-compose logs -f
```

## Option 3: Deploy Without Docker (Traditional Node.js)

### On your VPS:

```bash
# 1. SSH to VPS
ssh root@aibreeds-demo.com

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git

# 3. Install PM2 (process manager)
npm install -g pm2

# 4. Clone repository
cd /var/www
git clone https://github.com/haujon001-spec/pets.git aibreeds
cd aibreeds

# 5. Install dependencies
npm install

# 6. Create .env
nano .env
# Add:
# TOGETHER_API_KEY=your_key
# OPENROUTER_API_KEY=your_key

# 7. Build Next.js
npm run build

# 8. Start with PM2
pm2 start npm --name "aibreeds" -- start
pm2 save
pm2 startup

# 9. Install Caddy for HTTPS
apt install -y caddy

# 10. Configure Caddy
cat > /etc/caddy/Caddyfile <<'EOF'
aibreeds-demo.com {
    reverse_proxy localhost:3000
    encode gzip
}
EOF

# 11. Start Caddy
systemctl restart caddy
systemctl enable caddy

# 12. Check status
pm2 status
systemctl status caddy
curl https://aibreeds-demo.com
```

## Recommended: Option 1 (Git + Docker)

This is the easiest because:
- ✅ Your code is already on GitHub
- ✅ Docker handles all dependencies
- ✅ Easy to update (just git pull)
- ✅ Automated with docker-compose

## Quick Start Commands (Copy-Paste for VPS):

```bash
# Install everything
apt update && apt install -y docker.io docker-compose git

# Clone and setup
cd /var/www && git clone https://github.com/haujon001-spec/pets.git aibreeds && cd aibreeds

# Create environment file
cat > .env <<'EOF'
TOGETHER_API_KEY=paste_your_together_ai_key_here
OPENROUTER_API_KEY=paste_your_openrouter_key_here
EOF

# Build and run
docker build -f Dockerfile.prod -t aibreeds-portal:latest .
docker-compose up -d

# Check status
docker-compose ps && docker-compose logs --tail=50
```

## Verifying Deployment

After deployment, test these URLs:
- http://aibreeds-demo.com (should redirect to HTTPS)
- https://aibreeds-demo.com (main site)
- https://aibreeds-demo.com/api/health (should return {"status":"healthy"})

## Troubleshooting

### Port 80/443 in use:
```bash
netstat -tulpn | grep :80
netstat -tulpn | grep :443
# Kill any process using these ports
```

### Check logs:
```bash
docker-compose logs -f
# or without docker:
pm2 logs aibreeds
```

### Restart services:
```bash
docker-compose restart
# or without docker:
pm2 restart aibreeds
systemctl restart caddy
```

---

**Your GitHub Repository**: https://github.com/haujon001-spec/pets
**Latest Commit**: Phase 6 implementation with 12 languages

Just SSH to your VPS and run the commands above!
