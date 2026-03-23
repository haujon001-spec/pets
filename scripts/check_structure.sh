#!/bin/bash
# scripts/check_structure.sh
# Validates that all soul.md required directories exist.
# V2: also checks docs/ subdirectories and no .md files in project root.
# Created: 2026-03-17 | Updated: 2026-03-17 (V2)

set -e

REQUIRED_DIRS=("data_raw" "data_processed" "etl" "models" "dashboards" "reports_html" "qa" "scripts" "logs" "config" "secrets" "docs")
REQUIRED_DOCS_SUBDIRS=("docs/setup" "docs/guides" "docs/status" "docs/architecture" "docs/api" "docs/project")

PASSED=true

echo "Checking required top-level directories..."
for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "❌ Missing required directory: $dir"
    PASSED=false
  else
    echo "✔  $dir"
  fi
done

echo ""
echo "Checking docs/ subdirectories..."
for dir in "${REQUIRED_DOCS_SUBDIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "❌ Missing docs subdirectory: $dir"
    PASSED=false
  else
    echo "✔  $dir"
  fi
done

echo ""
echo "Checking for .md files in project root (not allowed except soul.md)..."
MD_IN_ROOT=$(find . -maxdepth 1 -name "*.md" ! -name "soul.md" 2>/dev/null)
if [ -n "$MD_IN_ROOT" ]; then
    echo "❌ .md files found in project root (move to docs/):"
    echo "$MD_IN_ROOT"
    PASSED=false
else
    echo "✔  No stray .md files in root"
fi

if [ "$PASSED" = false ]; then
  echo ""
  echo "❌ Folder structure check FAILED — see soul.md Section 1 for required structure."
  exit 1
fi

echo ""
echo "✔ Folder structure OK (soul.md V2 compliant)"
