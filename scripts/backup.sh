#!/bin/bash

# ============================================================
# Backup Script for Production Data
# ============================================================
# This script creates backups of critical data
# Usage: ./scripts/backup.sh [backup-name]
# ============================================================

set -e  # Exit on error

# ============================================================
# Configuration
# ============================================================

BACKUP_NAME="${1:-manual-$(date +%Y%m%d_%H%M%S)}"
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
# Create Backup on VPS
# ============================================================

log_info "Creating backup: ${BACKUP_NAME}"

ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
set -e

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Create backup archive
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

cd ${VPS_PATH}

echo "Backing up..."
tar -czf "\${BACKUP_FILE}" \
    .env \
    .env.production \
    public/breeds \
    docker-compose.yml \
    logs 2>/dev/null || true

# Get backup size
BACKUP_SIZE=\$(du -h "\${BACKUP_FILE}" | cut -f1)

echo "✅ Backup created: \${BACKUP_FILE} (\${BACKUP_SIZE})"

# List all backups
echo ""
echo "Available backups:"
ls -lh ${BACKUP_DIR}/*.tar.gz 2>/dev/null || echo "No backups found"

# Cleanup old backups (keep last 10)
echo ""
echo "Cleaning up old backups (keeping last 10)..."
ls -t ${BACKUP_DIR}/*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm

ENDSSH

if [ $? -ne 0 ]; then
    log_error "Backup failed!"
    exit 1
fi

log_info "✅ Backup completed successfully!"

exit 0
