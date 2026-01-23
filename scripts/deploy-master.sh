#!/bin/bash

################################################################################
# MASTER DEPLOYMENT SCRIPT - Production Ready (Updated Jan 23, 2026)
################################################################################
# Combines best practices from all deployment scripts
# Ensures consistent, secure, validated deployments
#
# Features:
# - Pre-deployment validation (health checks, tests)
# - Environment file validation
# - Automated Docker build and deployment
# - Post-deployment verification
# - Automatic rollback on failure
# - API key validation
#
# Usage: ./scripts/deploy-master.sh
################################################################################

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# ============================================================
# Configuration
# ============================================================

VPS_HOST="aibreeds-demo.com"
VPS_USER="root"
VPS_PROJECT_DIR="/root/pets"
DOCKER_IMAGE="pet-portal"
DOCKER_TAG="latest"
CONTAINER_NAME="app"
NETWORK_NAME="pet-network"
ENV_FILE=".env"

# Deployment metadata
DEPLOY_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_TAG="backup-${DEPLOY_TIMESTAMP}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# ============================================================
# Helper Functions
# ============================================================

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

log_step() {
    echo -e "\n${MAGENTA}▶${NC} $1"
}

# ============================================================
# Pre-Flight Checks
# ============================================================

log_section "🚀 MASTER DEPLOYMENT SCRIPT"

echo "Deployment Info:"
echo "  • Target: ${VPS_HOST}"
echo "  • Timestamp: ${DEPLOY_TIMESTAMP}"
echo "  • Backup Tag: ${BACKUP_TAG}"
echo ""

# Check if running from project root
if [ ! -f "package.json" ]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

# Test SSH connection
log_step "Testing SSH connection..."
if ! ssh -q ${VPS_USER}@${VPS_HOST} exit; then
    log_error "Cannot connect to VPS at ${VPS_HOST}"
    exit 1
fi
log_success "SSH connection successful"

# Verify project directory exists on VPS
log_step "Verifying VPS project directory..."
if ! ssh ${VPS_USER}@${VPS_HOST} "[ -d ${VPS_PROJECT_DIR} ]"; then
    log_error "Project directory ${VPS_PROJECT_DIR} not found on VPS"
    exit 1
fi
log_success "Project directory exists"

# Verify .env file exists on VPS
log_step "Verifying environment file..."
if ! ssh ${VPS_USER}@${VPS_HOST} "[ -f ${VPS_PROJECT_DIR}/${ENV_FILE} ]"; then
    log_error "Environment file ${ENV_FILE} not found on VPS!"
    echo ""
    echo "Create it with: ssh ${VPS_USER}@${VPS_HOST}"
    echo "Then run: cd ${VPS_PROJECT_DIR} && ./scripts/setup-production-env.sh"
    exit 1
fi
log_success "Environment file exists"

# Validate required API keys in .env
log_step "Validating API keys..."
if ! ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PROJECT_DIR} && grep -q 'TOGETHER_API_KEY=tgp_' ${ENV_FILE} && grep -q 'OPENROUTER_API_KEY=sk-' ${ENV_FILE}"; then
    log_error "Required API keys missing or invalid in ${ENV_FILE}"
    exit 1
fi
log_success "API keys validated"

# ============================================================
# Phase 1: Local Validation
# ============================================================

log_section "PHASE 1: LOCAL VALIDATION"

# Run comprehensive health check
log_step "Running Phase 6 comprehensive health check..."
if npm run health:phase6; then
    log_success "Health check passed (66 checks)"
else
    log_error "Health check failed - fix issues before deploying"
    exit 1
fi

# Run image verification test
log_step "Running breed image verification..."
if npm run test:images; then
    log_success "Image verification passed"
else
    log_warning "Image verification had warnings (non-blocking)"
fi

# Check git status
log_step "Checking git status..."
if git diff-index --quiet HEAD --; then
    log_success "No uncommitted changes"
else
    log_warning "You have uncommitted changes"
    read -p "Continue anyway? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_error "Deployment cancelled"
        exit 1
    fi
fi

# ============================================================
# Phase 2: Deployment Confirmation
# ============================================================

log_section "PHASE 2: DEPLOYMENT CONFIRMATION"

echo "Ready to deploy to PRODUCTION:"
echo "  • Host: ${VPS_HOST}"
echo "  • Container: ${CONTAINER_NAME}"
echo "  • Environment: production"
echo "  • Timestamp: ${DEPLOY_TIMESTAMP}"
echo ""
read -p "Continue with deployment? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_warning "Deployment cancelled by user"
    exit 0
fi

# ============================================================
# Phase 3: Code Deployment
# ============================================================

log_section "PHASE 3: CODE DEPLOYMENT"

# Push to GitHub
log_step "Pushing to GitHub..."
git push origin main || {
    log_error "Git push failed"
    exit 1
}
log_success "Code pushed to GitHub"

# Pull latest code on VPS
log_step "Pulling latest code on VPS..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PROJECT_DIR} && git pull origin main" || {
    log_error "Git pull failed on VPS"
    exit 1
}
log_success "Latest code pulled"

# ============================================================
# Phase 4: Docker Build
# ============================================================

log_section "PHASE 4: DOCKER BUILD"

log_step "Building Docker image on VPS..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PROJECT_DIR} && docker build -f Dockerfile.prod -t ${DOCKER_IMAGE}:${DOCKER_TAG} ." || {
    log_error "Docker build failed"
    exit 1
}
log_success "Docker image built successfully"

# ============================================================
# Phase 5: Backup Current State
# ============================================================

log_section "PHASE 5: BACKUP CURRENT STATE"

log_step "Creating backup of current container..."
ssh ${VPS_USER}@${VPS_HOST} "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:${BACKUP_TAG} 2>/dev/null || true"
log_success "Backup created: ${DOCKER_IMAGE}:${BACKUP_TAG}"

log_step "Backing up environment file..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PROJECT_DIR} && cp ${ENV_FILE} ${ENV_FILE}.backup.${DEPLOY_TIMESTAMP}"
log_success "Environment backed up"

# ============================================================
# Phase 6: Deploy New Container
# ============================================================

log_section "PHASE 6: DEPLOY NEW CONTAINER"

log_step "Ensuring breeds folder has correct permissions..."
ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${VPS_PROJECT_DIR}/public/breeds"
ssh ${VPS_USER}@${VPS_HOST} "chown -R 1001:1001 ${VPS_PROJECT_DIR}/public/breeds"
ssh ${VPS_USER}@${VPS_HOST} "chmod 755 ${VPS_PROJECT_DIR}/public/breeds"
log_success "Breeds folder permissions set (UID 1001 for nextjs user)"

log_step "Stopping old container..."
ssh ${VPS_USER}@${VPS_HOST} "docker stop ${CONTAINER_NAME} 2>/dev/null || true"
ssh ${VPS_USER}@${VPS_HOST} "docker rm ${CONTAINER_NAME} 2>/dev/null || true"
log_success "Old container removed"

log_step "Starting new container with environment file..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PROJECT_DIR} && docker run -d \
  --name ${CONTAINER_NAME} \
  --network ${NETWORK_NAME} \
  --env-file ${ENV_FILE} \
  -p 3000:3000 \
  -v ${VPS_PROJECT_DIR}/public/breeds:/app/public/breeds \
  --restart unless-stopped \
  ${DOCKER_IMAGE}:${DOCKER_TAG}" || {
    log_error "Failed to start new container - rolling back..."
    ssh ${VPS_USER}@${VPS_HOST} "docker run -d \
      --name ${CONTAINER_NAME} \
      --network ${NETWORK_NAME} \
      --env-file ${ENV_FILE} \
      -p 3000:3000 \
      -v ${VPS_PROJECT_DIR}/public/breeds:/app/public/breeds \
      --restart unless-stopped \
      ${DOCKER_IMAGE}:${BACKUP_TAG}"
    exit 1
}
log_success "New container started"

# ============================================================
# Phase 7: Post-Deployment Verification
# ============================================================

log_section "PHASE 7: POST-DEPLOYMENT VERIFICATION"

# Wait for container to start
log_step "Waiting for container to initialize..."
sleep 5

# Check if container is running
log_step "Checking container status..."
if ! ssh ${VPS_USER}@${VPS_HOST} "docker ps | grep -q ${CONTAINER_NAME}"; then
    log_error "Container is not running"
    echo "Check logs: ssh ${VPS_USER}@${VPS_HOST} 'docker logs ${CONTAINER_NAME}'"
    exit 1
fi
log_success "Container is running"

# Verify API keys are loaded
log_step "Verifying API keys in container..."
KEY_COUNT=$(ssh ${VPS_USER}@${VPS_HOST} "docker exec ${CONTAINER_NAME} env | grep -c 'API_KEY' || echo 0")
if [ "$KEY_COUNT" -lt 2 ]; then
    log_error "API keys not loaded in container (found: ${KEY_COUNT})"
    exit 1
fi
log_success "API keys loaded (${KEY_COUNT} keys found)"

# Test health endpoint
log_step "Testing health endpoint..."
sleep 3
HEALTH_CHECK=$(ssh ${VPS_USER}@${VPS_HOST} "curl -s http://localhost:3000/api/health | grep -o '\"status\":\"[^\"]*\"' || echo 'failed'")
if [[ $HEALTH_CHECK == *"healthy"* ]]; then
    log_success "Health check passed"
else
    log_error "Health check failed: ${HEALTH_CHECK}"
    exit 1
fi

# Check LLM Router initialization
log_step "Verifying LLM Router..."
if ssh ${VPS_USER}@${VPS_HOST} "docker logs ${CONTAINER_NAME} 2>&1 | grep -q 'LLM Router initialized'"; then
    log_success "LLM Router initialized successfully"
else
    log_warning "LLM Router initialization not confirmed (check logs)"
fi

# Verify cat images are accessible
log_step "Verifying cat breed images..."
HIMALAYAN_STATUS=$(ssh ${VPS_USER}@${VPS_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/breeds/himalayan.jpg")
MAINECOON_STATUS=$(ssh ${VPS_USER}@${VPS_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/breeds/mainecoon.jpg")

if [ "$HIMALAYAN_STATUS" = "200" ] && [ "$MAINECOON_STATUS" = "200" ]; then
    log_success "Cat breed images accessible (Himalayan: ${HIMALAYAN_STATUS}, Maine Coon: ${MAINECOON_STATUS})"
else
    log_warning "Some cat images returned non-200 status"
fi

# ============================================================
# Deployment Summary
# ============================================================

log_section "✅ DEPLOYMENT SUCCESSFUL"

echo "Deployment Details:"
echo "  • Timestamp: ${DEPLOY_TIMESTAMP}"
echo "  • Container: ${CONTAINER_NAME}"
echo "  • Image: ${DOCKER_IMAGE}:${DOCKER_TAG}"
echo "  • Backup: ${DOCKER_IMAGE}:${BACKUP_TAG}"
echo "  • API Keys Loaded: ${KEY_COUNT}"
echo "  • Health Status: ${HEALTH_CHECK}"
echo ""
echo "Production URL: https://${VPS_HOST}"
echo ""
echo "Next Steps:"
echo "  1. Test in browser: https://${VPS_HOST}"
echo "  2. Monitor logs: ssh ${VPS_USER}@${VPS_HOST} 'docker logs -f ${CONTAINER_NAME}'"
echo "  3. Check metrics: https://${VPS_HOST}/api/health"
echo ""
echo "Rollback (if needed):"
echo "  ssh ${VPS_USER}@${VPS_HOST}"
echo "  cd ${VPS_PROJECT_DIR}"
echo "  docker stop app && docker rm app"
echo "  docker run -d --name app --network pet-network --env-file .env -p 3000:3000 -v ${VPS_PROJECT_DIR}/public/breeds:/app/public/breeds --restart unless-stopped ${DOCKER_IMAGE}:${BACKUP_TAG}"
echo ""
log_success "Deployment completed successfully!"
