#!/bin/bash

# ============================================================
# VPS Rollback Script
# ============================================================
# This script rolls back to a previous deployment
# Usage: ./scripts/rollback-vps.sh [timestamp]
# Example: ./scripts/rollback-vps.sh 20260120_143000
# ============================================================

set -e  # Exit on error

# ============================================================
# Configuration
# ============================================================

TIMESTAMP="${1}"
VPS_HOST="${VPS_HOST:-your-vps-ip-or-domain}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="/opt/aibreeds"

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
# Validation
# ============================================================

if [ -z "$TIMESTAMP" ]; then
    log_error "Timestamp is required!"
    echo "Usage: ./scripts/rollback-vps.sh [timestamp]"
    echo "Example: ./scripts/rollback-vps.sh 20260120_143000"
    echo ""
    echo "Available backups on VPS:"
    ssh ${VPS_USER}@${VPS_HOST} "ls -la ${VPS_PATH}/.env.backup.* 2>/dev/null || echo 'No backups found'"
    exit 1
fi

log_info "Starting rollback to ${TIMESTAMP}..."

# Confirm rollback
echo ""
read -p "Rollback to deployment ${TIMESTAMP}? (yes/no): " -n 3 -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_warning "Rollback cancelled."
    exit 0
fi

# ============================================================
# Execute Rollback on VPS
# ============================================================

log_info "Executing rollback on VPS..."

ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
set -e

cd ${VPS_PATH}

# Check if backup exists
if [ ! -f .env.backup.${TIMESTAMP} ]; then
    echo "❌ Backup not found: .env.backup.${TIMESTAMP}"
    echo "Available backups:"
    ls -la .env.backup.* 2>/dev/null || echo "No backups found"
    exit 1
fi

# Create backup of current state before rollback
ROLLBACK_TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
cp .env .env.before-rollback.\${ROLLBACK_TIMESTAMP}

# Restore backup
echo "Restoring environment from backup..."
cp .env.backup.${TIMESTAMP} .env

# Restart containers with restored config
echo "Restarting containers..."
docker-compose down
docker-compose up -d

# Wait for health check
echo "Waiting for application to be healthy..."
sleep 10

# Check health endpoint
HEALTH_CHECK=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "\$HEALTH_CHECK" = "200" ]; then
    echo "✅ Health check passed! Rollback successful."
else
    echo "❌ Health check failed (HTTP \$HEALTH_CHECK)"
    echo "Attempting to restore pre-rollback state..."
    cp .env.before-rollback.\${ROLLBACK_TIMESTAMP} .env
    docker-compose down
    docker-compose up -d
    exit 1
fi

echo "✅ Rollback completed successfully!"

ENDSSH

if [ $? -ne 0 ]; then
    log_error "Rollback failed!"
    exit 1
fi

# ============================================================
# Post-Rollback
# ============================================================

log_info "=================================="
log_info "✅ Rollback Successful!"
log_info "=================================="
log_info "Rolled back to: ${TIMESTAMP}"
echo ""
log_info "To check logs: ssh ${VPS_USER}@${VPS_HOST} 'cd ${VPS_PATH} && docker-compose logs -f'"
log_info "To verify: curl https://aibreeds-demo.com/api/health"

exit 0
