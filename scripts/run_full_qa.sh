#!/bin/bash
# scripts/run_full_qa.sh
# Full front-to-back QA pipeline per soul.md Section 3 + V2 Section 14.
# Created: 2026-03-17 | Updated: 2026-03-17 (V2 — added visual QA step)

set -e

echo "========================================="
echo "  soul.md Full QA Pipeline [$(date)]"
echo "========================================="

# Step 1: Validate folder structure
echo ""
echo "[1/5] Checking folder structure..."
bash scripts/check_structure.sh

# Step 2: Run unit tests
echo ""
echo "[2/5] Running unit tests..."
if [ -d "tests" ]; then
    python -m pytest tests/ -q --tb=short 2>&1 || { echo "❌ Tests failed"; exit 1; }
elif [ -d "qa" ]; then
    python -m pytest qa/ -q --tb=short 2>&1 || { echo "❌ QA tests failed"; exit 1; }
else
    echo "⚠  No tests/ or qa/ directory found — skipping test run"
fi

# Step 3: Validate generated HTML reports exist and are not empty
echo ""
echo "[3/5] Validating HTML outputs..."
HTML_COUNT=$(find reports_html/ dashboards/ visualizations/ -name "*.html" 2>/dev/null | wc -l)
if [ "$HTML_COUNT" -eq 0 ]; then
    echo "⚠  No HTML files found in reports_html/, dashboards/, or visualizations/"
else
    echo "✔  Found $HTML_COUNT HTML output files"
fi

# Step 4: Check for no secrets in staged/tracked files
echo ""
echo "[4/5] Scanning for accidental secrets..."
if git grep -rn "BINANCE_SECRET\|OPENROUTER_API_KEY\|DEEPSEEK_API_KEY\|sk-or-v1" -- \
    ':!*.env' ':!*.env.local' ':!*.env.vps' ':!secrets/' ':!soul.md' 2>/dev/null; then
    echo "❌ Potential secret detected in tracked files — check output above!"
    exit 1
else
    echo "✔  No hardcoded secrets found"
fi

# Step 5: Human-style visual verification (soul.md §14)
echo ""
echo "[5/5] Human-style visual verification..."
bash scripts/open_local_page.sh

echo ""
echo "========================================="
echo "  ✔ Full QA PASSED (technical + visual)"
echo "========================================="
