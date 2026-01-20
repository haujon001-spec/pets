#!/bin/bash

# ============================================================
# VPS Deployment Script
# ============================================================
# This script automates deployment to your VPS server
# Usage: ./scripts/deploy-vps.sh [environment]
# Environments: staging, production (default: staging)
# ============================================================

set -e  # Exit on error

# ============================================================
# Configuration
# ============================================================

ENVIRONMENT="${1:-staging}"
VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_TAG="${VERSION}-${TIMESTAMP}"

# VPS Configuration
VPS_HOST="${VPS_HOST:-your-vps-ip-or-domain}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="/opt/aibreeds"
DOCKER_IMAGE="aibreeds:${DEPLOY_TAG}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================
# Helper Functions
# ============================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================
# Pre-Deployment Checks
# ============================================================

log_info "Starting deployment to ${ENVIRONMENT}..."
log_info "Version: ${VERSION}"
log_info "Deploy Tag: ${DEPLOY_TAG}"

# Check if environment file exists
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    log_error "Environment file .env.${ENVIRONMENT} not found!"
    exit 1
fi

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running!"
    exit 1
fi

# Confirm deployment
echo ""
read -p "Deploy to ${ENVIRONMENT} environment? (yes/no): " -n 3 -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_warning "Deployment cancelled."
    exit 0
fi

# ============================================================
# Build Docker Image
# ============================================================

log_info "Building Docker image..."
docker build -f Dockerfile.prod -t ${DOCKER_IMAGE} \
    --build-arg NODE_ENV=${ENVIRONMENT} \
    .

if [ $? -ne 0 ]; then
    log_error "Docker build failed!"
    exit 1
fi

log_info "Docker image built successfully: ${DOCKER_IMAGE}"

# ============================================================
# Tag Image
# ============================================================

log_info "Tagging image..."
docker tag ${DOCKER_IMAGE} aibreeds:${ENVIRONMENT}-latest
docker tag ${DOCKER_IMAGE} aibreeds:latest

# ============================================================
# Save Image for Transfer
# ============================================================

log_info "Saving Docker image to tarball..."
docker save ${DOCKER_IMAGE} | gzip > /tmp/aibreeds-${DEPLOY_TAG}.tar.gz

if [ $? -ne 0 ]; then
    log_error "Failed to save Docker image!"
    exit 1
fi

# ============================================================
# Transfer to VPS
# ============================================================

log_info "Transferring image to VPS..."
scp /tmp/aibreeds-${DEPLOY_TAG}.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

if [ $? -ne 0 ]; then
    log_error "Failed to transfer image to VPS!"
    rm /tmp/aibreeds-${DEPLOY_TAG}.tar.gz
    exit 1
fi

# Transfer environment file
log_info "Transferring environment configuration..."
scp .env.${ENVIRONMENT} ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/.env.${ENVIRONMENT}

# Transfer docker-compose file
scp docker-compose.${ENVIRONMENT}.yml ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/docker-compose.yml

# ============================================================
# Deploy on VPS
# ============================================================

log_info "Deploying on VPS..."

ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
set -e

cd ${VPS_PATH}

# Load the image
echo "Loading Docker image..."
docker load -i /tmp/aibreeds-${DEPLOY_TAG}.tar.gz

# Create backup of current deployment
if [ -f .env ]; then
    echo "Creating backup..."
    cp .env .env.backup.${TIMESTAMP}
fi

# Update environment
cp .env.${ENVIRONMENT} .env

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down || true

# Remove old port 80 conflicts
echo "Checking for port conflicts..."
PROCESS_ON_80=\$(lsof -ti:80 || true)
if [ -n "\$PROCESS_ON_80" ]; then
    echo "Killing process on port 80: \$PROCESS_ON_80"
    kill -9 \$PROCESS_ON_80 || true
fi

# Start new containers
echo "Starting new containers..."
docker-compose up -d

# Wait for health check
echo "Waiting for application to be healthy..."
sleep 10

# Check health endpoint
HEALTH_CHECK=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "\$HEALTH_CHECK" = "200" ]; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed (HTTP \$HEALTH_CHECK)"
    echo "Rolling back..."
    docker-compose down
    exit 1
fi

# Cleanup old images (keep last 3)
echo "Cleaning up old images..."
docker images aibreeds --format "{{.ID}}" | tail -n +4 | xargs -r docker rmi || true

# Cleanup transferred tarball
rm /tmp/aibreeds-${DEPLOY_TAG}.tar.gz

echo "✅ Deployment completed successfully!"

ENDSSH

if [ $? -ne 0 ]; then
    log_error "Deployment failed on VPS!"
    exit 1
fi

# ============================================================
# Cleanup Local Files
# ============================================================

log_info "Cleaning up local files..."
rm /tmp/aibreeds-${DEPLOY_TAG}.tar.gz

# ============================================================
# Post-Deployment
# ============================================================

log_info "=================================="
log_info "✅ Deployment Successful!"
log_info "=================================="
log_info "Environment: ${ENVIRONMENT}"
log_info "Version: ${VERSION}"
log_info "Deploy Tag: ${DEPLOY_TAG}"
log_info "Timestamp: ${TIMESTAMP}"
echo ""
log_info "Application should be available at:"
if [ "${ENVIRONMENT}" = "production" ]; then
    log_info "  https://aibreeds-demo.com"
else
    log_info "  https://staging.aibreeds-demo.com"
fi
echo ""
log_info "To check logs: ssh ${VPS_USER}@${VPS_HOST} 'cd ${VPS_PATH} && docker-compose logs -f'"
log_info "To rollback: ./scripts/rollback-vps.sh ${TIMESTAMP}"

exit 0
