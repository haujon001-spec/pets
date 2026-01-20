#!/bin/bash

# ============================================================
# Restore Script for Production Data
# ============================================================
# This script restores from a backup
# Usage: ./scripts/restore.sh [backup-name]
# ============================================================

set -e  # Exit on error

# ============================================================
# Configuration
# ============================================================

BACKUP_NAME="${1}"
BACKUP_DIR="/opt/aibreeds/backups"
VPS_HOST="${VPS_HOST:-your-vps-ip-or-domain}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="/opt/aibreeds"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

if [ -z "$BACKUP_NAME" ]; then
    log_error "Backup name is required!"
    echo "Usage: ./scripts/restore.sh [backup-name]"
    echo ""
    echo "Available backups:"
    ssh ${VPS_USER}@${VPS_HOST} "ls -lh ${BACKUP_DIR}/*.tar.gz 2>/dev/null || echo 'No backups found'"
    exit 1
fi

log_warning "⚠️  This will restore data from backup: ${BACKUP_NAME}"
log_warning "⚠️  Current data will be backed up before restore"
echo ""
read -p "Continue with restore? (yes/no): " -n 3 -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_warning "Restore cancelled."
    exit 0
fi

# ============================================================
# Restore on VPS
# ============================================================

log_info "Restoring from backup: ${BACKUP_NAME}"

ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
set -e

BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Check if backup exists
if [ ! -f "\${BACKUP_FILE}" ]; then
    echo "❌ Backup not found: \${BACKUP_FILE}"
    echo "Available backups:"
    ls -lh ${BACKUP_DIR}/*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

cd ${VPS_PATH}

# Create safety backup before restore
SAFETY_BACKUP="pre-restore-\$(date +%Y%m%d_%H%M%S)"
echo "Creating safety backup: \${SAFETY_BACKUP}"
tar -czf "${BACKUP_DIR}/\${SAFETY_BACKUP}.tar.gz" \
    .env \
    .env.production \
    public/breeds \
    docker-compose.yml 2>/dev/null || true

# Stop containers
echo "Stopping containers..."
docker-compose down || true

# Extract backup
echo "Extracting backup..."
tar -xzf "\${BACKUP_FILE}"

# Restart containers
echo "Restarting containers..."
docker-compose up -d

# Wait for health check
echo "Waiting for application..."
sleep 15

# Verify health
HEALTH_CHECK=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "\$HEALTH_CHECK" = "200" ]; then
    echo "✅ Health check passed! Restore successful."
else
    echo "❌ Health check failed (HTTP \$HEALTH_CHECK)"
    echo "Rolling back to safety backup..."
    tar -xzf "${BACKUP_DIR}/\${SAFETY_BACKUP}.tar.gz"
    docker-compose down
    docker-compose up -d
    exit 1
fi

echo "✅ Restore completed successfully!"

ENDSSH

if [ $? -ne 0 ]; then
    log_error "Restore failed!"
    exit 1
fi

log_info "✅ Restore completed successfully!"

exit 0
