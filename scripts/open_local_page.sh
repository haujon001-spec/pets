#!/bin/bash
# scripts/open_local_page.sh
# Opens the latest generated HTML dashboard in a browser and prompts
# for manual human-style visual QA confirmation.
# Part of soul.md Section 14 — Human-Style Visual Verification.
# Created: 2026-03-17

set -e

HTML_FILE="${1:-reports_html/latest_dashboard.html}"

if [ ! -f "$HTML_FILE" ]; then
    # Try fallback locations
    HTML_FILE=$(find dashboards/ reports_html/ visualizations/ -name "*.html" 2>/dev/null | sort | tail -1)
    if [ -z "$HTML_FILE" ]; then
        echo "❌ No HTML file found. Run dashboard generation first."
        exit 1
    fi
fi

echo "Opening: $HTML_FILE"
xdg-open "$HTML_FILE" 2>/dev/null || open "$HTML_FILE" 2>/dev/null || start "$HTML_FILE" 2>/dev/null || {
    echo "⚠  Could not auto-open. Please open manually: $HTML_FILE"
}

echo ""
echo "⚠  Manually verify the following:"
echo "  1. Data is present and correct (no empty tables)"
echo "  2. Charts and narratives render properly"
echo "  3. No layout shifts or missing elements"
echo "  4. Numbers are human-readable (K/M/B/T — no raw integers)"
echo "  5. Timestamp is present and correct"
echo "  6. AI narrative panel is present"
echo ""
read -p "Type 'yes' to confirm visual QA passed: " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Visual QA not confirmed — aborting."
    exit 1
fi

echo "✔ Visual QA confirmed."
