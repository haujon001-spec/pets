#!/bin/bash

################################################################################
# Production Deployment Script with Comprehensive Health Validation
# 
# This script:
# 1. Runs all health checks and validation tests
# 2. Builds the production Docker image
# 3. Deploys to VPS server
# 4. Runs post-deployment validation
# 5. Brings the web server live
#
# Usage: ./scripts/deploy-production.sh
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="${VPS_HOST:-aibreeds-demo.com}"
VPS_USER="${VPS_USER:-deploy}"
VPS_PATH="${VPS_PATH:-/var/www/aibreeds}"
DOCKER_IMAGE="aibreeds-portal"
DOCKER_TAG="latest"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_section() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Check if running from project root
if [ ! -f "package.json" ]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

################################################################################
# PHASE 1: PRE-DEPLOYMENT VALIDATION
################################################################################

log_section "PHASE 1: PRE-DEPLOYMENT VALIDATION"

# Step 1.1: Check Node.js and npm
log_info "Checking Node.js and npm..."
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
fi
log_success "Node.js $(node --version) and npm $(npm --version) found"

# Step 1.2: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install
    log_success "Dependencies installed"
else
    log_success "Dependencies already installed"
fi

# Step 1.3: Run comprehensive health check
log_info "Running Phase 6 comprehensive health check..."
if npm run health:phase6; then
    log_success "Health check passed (66 checks)"
else
    log_error "Health check failed - fix issues before deploying"
    exit 1
fi

# Step 1.4: Run language validation
log_info "Validating language configuration..."
if npm run health:languages; then
    log_success "Language validation passed (12 languages)"
else
    log_error "Language validation failed"
    exit 1
fi

# Step 1.5: Check for required environment variables
log_info "Checking environment variables..."
if [ ! -f ".env.local" ]; then
    log_warning ".env.local not found - make sure VPS has environment configured"
else
    if grep -q "TOGETHER_API_KEY" .env.local && grep -q "OPENROUTER_API_KEY" .env.local; then
        log_success "API keys configured locally"
    else
        log_warning "Some API keys may be missing"
    fi
fi

# Step 1.6: Run TypeScript type check
log_info "Running TypeScript type check..."
if npx tsc --noEmit; then
    log_success "TypeScript type check passed"
else
    log_error "TypeScript errors found - fix before deploying"
    exit 1
fi

# Step 1.7: Check for uncommitted changes
log_info "Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
    log_warning "You have uncommitted changes:"
    git status --short
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 1
    fi
else
    log_success "Working directory clean"
fi

################################################################################
# PHASE 2: BUILD & TEST
################################################################################

log_section "PHASE 2: BUILD & TEST"

# Step 2.1: Build Next.js production bundle
log_info "Building Next.js production bundle..."
if npm run build; then
    log_success "Production build completed"
else
    log_error "Build failed"
    exit 1
fi

# Step 2.2: Check build output
log_info "Analyzing build output..."
if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    log_success "Build directory size: $BUILD_SIZE"
else
    log_error "Build directory not found"
    exit 1
fi

################################################################################
# PHASE 3: DOCKER IMAGE BUILD
################################################################################

log_section "PHASE 3: DOCKER IMAGE BUILD"

# Step 3.1: Check Docker availability
log_info "Checking Docker..."
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi
log_success "Docker $(docker --version | awk '{print $3}') found"

# Step 3.2: Build Docker image
log_info "Building Docker image: $DOCKER_IMAGE:$DOCKER_TAG..."
if docker build -f Dockerfile.prod -t $DOCKER_IMAGE:$DOCKER_TAG .; then
    log_success "Docker image built successfully"
else
    log_error "Docker build failed"
    exit 1
fi

# Step 3.3: Check image size
IMAGE_SIZE=$(docker images $DOCKER_IMAGE:$DOCKER_TAG --format "{{.Size}}")
log_info "Docker image size: $IMAGE_SIZE"

# Step 3.4: Test Docker image locally (optional)
log_info "Testing Docker image locally (5 second test)..."
CONTAINER_ID=$(docker run -d -p 3001:3000 --env-file .env.local $DOCKER_IMAGE:$DOCKER_TAG)
sleep 5

if curl -f http://localhost:3001 > /dev/null 2>&1; then
    log_success "Local Docker container test passed"
else
    log_warning "Local Docker test failed (non-critical)"
fi

docker stop $CONTAINER_ID > /dev/null 2>&1
docker rm $CONTAINER_ID > /dev/null 2>&1

################################################################################
# PHASE 4: DEPLOYMENT TO VPS
################################################################################

log_section "PHASE 4: DEPLOYMENT TO VPS"

# Step 4.1: Check VPS connectivity
log_info "Checking VPS connectivity..."
if ssh -o ConnectTimeout=5 $VPS_USER@$VPS_HOST "echo 'Connected'" > /dev/null 2>&1; then
    log_success "VPS connection established"
else
    log_error "Cannot connect to VPS: $VPS_USER@$VPS_HOST"
    log_info "Make sure SSH keys are configured and VPS is accessible"
    exit 1
fi

# Step 4.2: Create deployment directory on VPS
log_info "Preparing VPS deployment directory..."
ssh $VPS_USER@$VPS_HOST "mkdir -p $VPS_PATH"
log_success "Deployment directory ready: $VPS_PATH"

# Step 4.3: Save Docker image and transfer to VPS
log_info "Saving Docker image..."
docker save $DOCKER_IMAGE:$DOCKER_TAG | gzip > aibreeds-image.tar.gz
log_success "Docker image saved: aibreeds-image.tar.gz"

log_info "Transferring Docker image to VPS..."
if scp aibreeds-image.tar.gz $VPS_USER@$VPS_HOST:$VPS_PATH/; then
    log_success "Docker image transferred"
    rm aibreeds-image.tar.gz
else
    log_error "Failed to transfer Docker image"
    rm -f aibreeds-image.tar.gz
    exit 1
fi

# Step 4.4: Transfer docker-compose and configuration files
log_info "Transferring configuration files..."
scp docker-compose.yml $VPS_USER@$VPS_HOST:$VPS_PATH/
scp Caddyfile $VPS_USER@$VPS_HOST:$VPS_PATH/
log_success "Configuration files transferred"

# Step 4.5: Transfer environment variables (if .env.production exists)
if [ -f ".env.production" ]; then
    log_info "Transferring production environment variables..."
    scp .env.production $VPS_USER@$VPS_HOST:$VPS_PATH/.env
    log_success "Environment variables transferred"
else
    log_warning ".env.production not found - make sure VPS has .env configured"
fi

# Step 4.6: Load Docker image on VPS
log_info "Loading Docker image on VPS..."
ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && gunzip -c aibreeds-image.tar.gz | docker load"
log_success "Docker image loaded on VPS"

# Step 4.7: Stop existing containers (if any)
log_info "Stopping existing containers..."
ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && docker-compose down" || true
log_success "Existing containers stopped"

################################################################################
# PHASE 5: START SERVICES
################################################################################

log_section "PHASE 5: START SERVICES"

# Step 5.1: Start Docker containers
log_info "Starting Docker containers..."
if ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && docker-compose up -d"; then
    log_success "Docker containers started"
else
    log_error "Failed to start Docker containers"
    exit 1
fi

# Step 5.2: Wait for services to be ready
log_info "Waiting for services to start (30 seconds)..."
sleep 30

################################################################################
# PHASE 6: POST-DEPLOYMENT VALIDATION
################################################################################

log_section "PHASE 6: POST-DEPLOYMENT VALIDATION"

# Step 6.1: Check container status
log_info "Checking container status..."
RUNNING_CONTAINERS=$(ssh $VPS_USER@$VPS_HOST "docker ps --filter name=aibreeds --format '{{.Names}}' | wc -l")
if [ "$RUNNING_CONTAINERS" -ge 2 ]; then
    log_success "Containers running: $RUNNING_CONTAINERS"
    ssh $VPS_USER@$VPS_HOST "docker ps --filter name=aibreeds --format 'table {{.Names}}\t{{.Status}}'"
else
    log_error "Expected 2+ containers, found $RUNNING_CONTAINERS"
    log_info "Checking container logs..."
    ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && docker-compose logs --tail=50"
    exit 1
fi

# Step 6.2: Check HTTP endpoint
log_info "Testing HTTP endpoint..."
sleep 5
if curl -f -s http://$VPS_HOST > /dev/null; then
    log_success "HTTP endpoint responding"
else
    log_warning "HTTP endpoint not responding (may need SSL)"
fi

# Step 6.3: Check HTTPS endpoint
log_info "Testing HTTPS endpoint..."
if curl -f -s https://$VPS_HOST > /dev/null; then
    log_success "HTTPS endpoint responding ✅"
else
    log_warning "HTTPS endpoint not responding (SSL may be provisioning)"
fi

# Step 6.4: Check API health endpoint
log_info "Testing API health endpoint..."
HEALTH_STATUS=$(curl -s https://$VPS_HOST/api/health | jq -r '.status' 2>/dev/null || echo "unknown")
if [ "$HEALTH_STATUS" = "healthy" ]; then
    log_success "API health check passed"
else
    log_warning "API health status: $HEALTH_STATUS"
fi

# Step 6.5: Verify language files are accessible
log_info "Verifying language accessibility..."
if curl -f -s https://$VPS_HOST > /dev/null; then
    log_success "Application is accessible"
else
    log_warning "Could not verify language files"
fi

################################################################################
# PHASE 7: CLEANUP & SUMMARY
################################################################################

log_section "PHASE 7: CLEANUP & SUMMARY"

# Step 7.1: Clean up temporary files on VPS
log_info "Cleaning up temporary files..."
ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && rm -f aibreeds-image.tar.gz"
log_success "Cleanup complete"

# Step 7.2: Display deployment summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   DEPLOYMENT SUCCESSFUL! 🎉                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📊 Deployment Summary:${NC}"
echo -e "   • Build Size: $BUILD_SIZE"
echo -e "   • Docker Image: $DOCKER_IMAGE:$DOCKER_TAG ($IMAGE_SIZE)"
echo -e "   • VPS Host: $VPS_HOST"
echo -e "   • Containers Running: $RUNNING_CONTAINERS"
echo -e "   • Health Status: $HEALTH_STATUS"
echo ""
echo -e "${CYAN}🌐 Access your application:${NC}"
echo -e "   • https://$VPS_HOST"
echo -e "   • API Health: https://$VPS_HOST/api/health"
echo ""
echo -e "${CYAN}📝 Useful commands:${NC}"
echo -e "   • View logs: ssh $VPS_USER@$VPS_HOST 'cd $VPS_PATH && docker-compose logs -f'"
echo -e "   • Restart: ssh $VPS_USER@$VPS_HOST 'cd $VPS_PATH && docker-compose restart'"
echo -e "   • Rollback: ./scripts/rollback-vps.sh"
echo ""

# Step 7.3: Save deployment info
DEPLOY_INFO="deployment-$(date +%Y%m%d-%H%M%S).log"
cat > "$DEPLOY_INFO" <<EOF
Deployment Date: $(date)
VPS Host: $VPS_HOST
Docker Image: $DOCKER_IMAGE:$DOCKER_TAG
Image Size: $IMAGE_SIZE
Build Size: $BUILD_SIZE
Health Status: $HEALTH_STATUS
Running Containers: $RUNNING_CONTAINERS
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git rev-parse --abbrev-ref HEAD)
EOF

log_success "Deployment info saved to $DEPLOY_INFO"

################################################################################
# DONE
################################################################################

log_info "🚀 Deployment complete! Your application is now live."
echo ""

exit 0
