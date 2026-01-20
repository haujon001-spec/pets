#!/bin/bash

# ============================================================
# Version Tagging Script
# ============================================================
# This script creates a git tag with version and changelog
# Usage: ./scripts/version-tag.sh [major|minor|patch]
# Default: patch
# ============================================================

set -e  # Exit on error

# ============================================================
# Configuration
# ============================================================

VERSION_BUMP="${1:-patch}"
CURRENT_VERSION=$(node -p "require('./package.json').version")

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

log_highlight() {
    echo -e "${BLUE}[VERSION]${NC} $1"
}

# ============================================================
# Calculate New Version
# ============================================================

IFS='.' read -r -a version_parts <<< "$CURRENT_VERSION"
MAJOR="${version_parts[0]}"
MINOR="${version_parts[1]}"
PATCH="${version_parts[2]}"

case "$VERSION_BUMP" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
    *)
        log_error "Invalid version bump type: $VERSION_BUMP"
        echo "Usage: ./scripts/version-tag.sh [major|minor|patch]"
        exit 1
        ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

# ============================================================
# Display Changes
# ============================================================

log_highlight "Current version: ${CURRENT_VERSION}"
log_highlight "New version: ${NEW_VERSION}"
echo ""

# Get commits since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -n "$LAST_TAG" ]; then
    log_info "Changes since ${LAST_TAG}:"
    git log ${LAST_TAG}..HEAD --oneline --pretty=format:"  - %s" || true
    echo ""
else
    log_info "No previous tags found. This will be the first tag."
fi

echo ""
read -p "Create tag v${NEW_VERSION}? (yes/no): " -n 3 -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_warning "Tagging cancelled."
    exit 0
fi

# ============================================================
# Update package.json
# ============================================================

log_info "Updating package.json..."
if command -v jq &> /dev/null; then
    # Use jq if available
    jq ".version = \"${NEW_VERSION}\"" package.json > package.json.tmp
    mv package.json.tmp package.json
else
    # Fallback to sed
    sed -i.bak "s/\"version\": \".*\"/\"version\": \"${NEW_VERSION}\"/" package.json
    rm package.json.bak 2>/dev/null || true
fi

# ============================================================
# Create Git Tag
# ============================================================

log_info "Committing version bump..."
git add package.json
git commit -m "chore: bump version to ${NEW_VERSION}" || log_warning "No changes to commit"

log_info "Creating git tag..."

# Generate tag message
TAG_MESSAGE="Release v${NEW_VERSION}

Changes:
$(git log ${LAST_TAG}..HEAD --oneline --pretty=format:"- %s" 2>/dev/null || echo "- Initial release")
"

git tag -a "v${NEW_VERSION}" -m "$TAG_MESSAGE"

# ============================================================
# Success
# ============================================================

log_info "✅ Version tagged successfully!"
log_highlight "Tag: v${NEW_VERSION}"
echo ""
log_info "To push the tag to remote:"
log_info "  git push origin v${NEW_VERSION}"
log_info ""
log_info "Or push all tags:"
log_info "  git push --tags"

exit 0
