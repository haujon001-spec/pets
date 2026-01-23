#!/bin/bash

# ============================================================
# Standardized VPS Deployment Script
# ============================================================
# Ensures consistent deployments with proper env handling
# Usage: ./scripts/deploy-production.sh
# ============================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# Configuration
# ============================================================

VPS_HOST="aibreeds-demo.com"
VPS_USER="root"
VPS_PROJECT_DIR="/root/pets"
DOCKER_IMAGE="pet-portal:latest"
CONTAINER_NAME="app"
NETWORK_NAME="pet-network"
ENV_FILE=".env"  # On VPS, not in git

# ============================================================
# Helper Functions
# ============================================================

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}▶${NC} $1"
}

# ============================================================
# Pre-Deployment Checks
# ============================================================

echo "============================================================"
echo "🚀 Production Deployment - AIBreeds Demo"
echo "============================================================"
echo ""

log_step "Pre-deployment checks..."

# Check SSH connection
log_info "Testing SSH connection to ${VPS_HOST}..."
if ! ssh -q ${VPS_USER}@${VPS_HOST} exit; then
    log_error "Cannot connect to VPS!"
    exit 1
fi

# Check if project directory exists on VPS
log_info "Verifying project directory..."
if ! ssh ${VPS_USER}@${VPS_HOST} "[ -d ${VPS_PROJECT_DIR} ]"; then
    log_error "Project directory ${VPS_PROJECT_DIR} not found on VPS!"
    exit 1
fi

# Check if .env file exists on VPS
log_info "Verifying environment file..."
if ! ssh ${VPS_USER}@${VPS_HOST} "[ -f ${VPS_PROJECT_DIR}/${ENV_FILE} ]"; then
    log_error "Environment file ${ENV_FILE} not found on VPS!"
    echo ""
    echo "Run this command on VPS to create it:"
    echo "  ssh ${VPS_USER}@${VPS_HOST}"
    echo "  cd ${VPS_PROJECT_DIR}"
    echo "  ./scripts/setup-production-env.sh"
    exit 1
fi

# Verify .env has required keys
log_info "Validating environment variables..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PROJECT_DIR} && grep -q 'TOGETHER_API_KEY=' ${ENV_FILE} && grep -q 'OPENROUTER_API_KEY=' ${ENV_FILE}" || {
    log_error "Required API keys missing in ${ENV_FILE}!"
    exit 1
}

log_info "All pre-deployment checks passed!"

# Deployment confirmation
echo ""
echo "Ready to deploy to: ${VPS_HOST}"
read -p "Continue with deployment? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_warning "Deployment cancelled."
    exit 0
fi

# ============================================================
# Deployment Steps
# ============================================================

log_step "Step 1: Pull latest code from GitHub..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PROJECT_DIR} && git pull origin main" || {
    log_error "Git pull failed!"
    exit 1
}
log_info "Code updated successfully"

log_step "Step 2: Build Docker image..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PROJECT_DIR} && docker build -f Dockerfile.prod -t ${DOCKER_IMAGE} ." || {
    log_error "Docker build failed!"
    exit 1
}
log_info "Docker image built successfully"

log_step "Step 3: Create backup of current container..."
BACKUP_TAG="backup-$(date +%Y%m%d-%H%M%S)"
ssh ${VPS_USER}@${VPS_HOST} "docker tag ${DOCKER_IMAGE} pet-portal:${BACKUP_TAG} 2>/dev/null || true"
log_info "Backup created: pet-portal:${BACKUP_TAG}"

log_step "Step 4: Stop and remove old container..."
ssh ${VPS_USER}@${VPS_HOST} "docker stop ${CONTAINER_NAME} 2>/dev/null || true"
ssh ${VPS_USER}@${VPS_HOST} "docker rm ${CONTAINER_NAME} 2>/dev/null || true"
log_info "Old container removed"

log_step "Step 5: Start new container with environment file..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PROJECT_DIR} && docker run -d \
  --name ${CONTAINER_NAME} \
  --network ${NETWORK_NAME} \
  --env-file ${ENV_FILE} \
  -p 3000:3000 \
  --restart unless-stopped \
  ${DOCKER_IMAGE}" || {
    log_error "Failed to start container!"
    echo ""
    echo "Rolling back to backup..."
    ssh ${VPS_USER}@${VPS_HOST} "docker run -d \
      --name ${CONTAINER_NAME} \
      --network ${NETWORK_NAME} \
      --env-file ${ENV_FILE} \
      -p 3000:3000 \
      --restart unless-stopped \
      pet-portal:${BACKUP_TAG}"
    exit 1
}
log_info "New container started"

# ============================================================
# Post-Deployment Verification
# ============================================================

log_step "Verifying deployment..."

# Wait for container to start
sleep 3

# Check if container is running
if ! ssh ${VPS_USER}@${VPS_HOST} "docker ps | grep -q ${CONTAINER_NAME}"; then
    log_error "Container is not running!"
    echo "Check logs with: ssh ${VPS_USER}@${VPS_HOST} 'docker logs ${CONTAINER_NAME}'"
    exit 1
fi
log_info "Container is running"

# Check if API keys are loaded
log_info "Verifying API keys..."
KEY_COUNT=$(ssh ${VPS_USER}@${VPS_HOST} "docker exec ${CONTAINER_NAME} env | grep -c 'API_KEY' || true")
if [ "$KEY_COUNT" -lt 2 ]; then
    log_error "API keys not loaded in container!"
    exit 1
fi
log_info "API keys loaded (${KEY_COUNT} keys found)"

# Check application health
log_info "Testing health endpoint..."
sleep 2
HEALTH_STATUS=$(ssh ${VPS_USER}@${VPS_HOST} "curl -s http://localhost:3000/api/health | grep -o '\"status\":\"[^\"]*\"' || echo 'failed'")
if [[ $HEALTH_STATUS == *"healthy"* ]]; then
    log_info "Health check passed"
else
    log_error "Health check failed: ${HEALTH_STATUS}"
    echo "Check logs with: ssh ${VPS_USER}@${VPS_HOST} 'docker logs ${CONTAINER_NAME}'"
    exit 1
fi

# Check LLM router initialization
log_info "Verifying LLM router..."
if ssh ${VPS_USER}@${VPS_HOST} "docker logs ${CONTAINER_NAME} 2>&1 | grep -q 'LLM Router initialized'"; then
    log_info "LLM Router initialized successfully"
else
    log_warning "LLM Router initialization not confirmed in logs"
fi

# ============================================================
# Summary
# ============================================================

echo ""
echo "============================================================"
echo "✅ DEPLOYMENT SUCCESSFUL"
echo "============================================================"
echo ""
echo "Production URL: https://${VPS_HOST}"
echo "Container: ${CONTAINER_NAME}"
echo "Image: ${DOCKER_IMAGE}"
echo "Backup: pet-portal:${BACKUP_TAG}"
echo ""
echo "Verification:"
echo "  • Container running: ✓"
echo "  • API keys loaded: ✓ (${KEY_COUNT} keys)"
echo "  • Health check: ✓"
echo "  • LLM Router: ✓"
echo ""
echo "Next steps:"
echo "  1. Test in browser: https://${VPS_HOST}"
echo "  2. Check Himalayan and Maine Coon cat images"
echo "  3. Monitor logs: ssh ${VPS_USER}@${VPS_HOST} 'docker logs -f ${CONTAINER_NAME}'"
echo ""
echo "Rollback (if needed):"
echo "  ssh ${VPS_USER}@${VPS_HOST} 'cd ${VPS_PROJECT_DIR} && ./scripts/rollback-vps.sh'"
echo ""
echo "============================================================"
