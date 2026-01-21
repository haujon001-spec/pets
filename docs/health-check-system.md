# Health Check System

Automated monitoring and issue tracking for the development server.

## Overview

The health check system automatically:
- Monitors server logs during development
- Detects common errors and issues
- Categorizes issues by severity (High/Medium/Low)
- Automatically logs issues to `TODO.md`
- Provides detailed reports with action items

## Quick Start

### Option 1: Start Server with Health Monitoring (Recommended)
```powershell
npm run dev:health
```

This starts the Next.js dev server with health check enabled. Server logs will be captured to `.health-check.log`.

### Option 2: Analyze Existing Logs
If the server is already running:
```powershell
npm run health:check
```

This analyzes the `.health-check.log` file and updates `TODO.md` with any detected issues.

### Option 3: Manual Analysis
Redirect server output to the log file manually:
```powershell
npm run dev > .health-check.log 2>&1
```

Then run the health check:
```powershell
npm run health:check
```

## What Gets Detected

### High Severity (Critical)
- **React Hydration Errors**: SSR/CSR mismatches
- **Compilation Errors**: TypeScript/JavaScript build failures
- **Impact**: App may break or render incorrectly
- **Action**: Fix immediately

### Medium Severity (API Issues)
- **API Errors**: Endpoints returning 4xx or 5xx status codes
- **Impact**: Features may not work correctly
- **Action**: Investigate endpoint logic

### Low Severity (Non-Critical)
- **Missing Placeholder Images**: 404 errors for decorative images
- **Invalid Image Resources**: Image loading failures
- **Impact**: Console noise, doesn't affect functionality
- **Action**: Address when convenient

## Issue Tracking

All detected issues are automatically added to `TODO.md` under the **Auto-Detected Issues** section with:

- **Status**: Current state (Critical, API Issue, Non-critical)
- **Severity**: Priority level (High, Medium, Low)
- **Resource**: Affected file or endpoint
- **Impact**: How it affects the application
- **Action Needed**: Specific steps to resolve
- **First Detected**: Timestamp of first occurrence
- **Occurrences**: Number of times detected
- **Auto-detected**: Flag indicating automated detection

## Example Report

```
════════════════════════════════════════
  HEALTH CHECK ANALYSIS
════════════════════════════════════════

Analyzed 247 log lines

Found 3 unique issues:

Low Severity Issues (3):
  • Missing Placeholder Image: /breeds/labrador.jpg
    Occurrences: 12
  • Missing Placeholder Image: /breeds/mainecoon.jpg
    Occurrences: 8
  • Missing Placeholder Image: /breeds/siamese.jpg
    Occurrences: 5

✓ Added 3 new issues to TODO.md

════════════════════════════════════════
```

## Files

### Scripts
- `scripts/dev.ps1` - Starts dev server with health monitoring
- `scripts/health-check-analyze.ps1` - Analyzes logs and updates TODO
- `scripts/health-check.js` - Node.js version (for Unix/cross-platform)

### Logs
- `.health-check.log` - Captured server output (git-ignored)

### Configuration
- `package.json` - npm scripts for easy access

## Workflow Integration

### During Development
1. Start server with: `npm run dev:health`
2. Develop and test as normal
3. Check terminal for real-time issue alerts
4. When finished, check `TODO.md` for logged issues

### Manual Checks
1. Run health check anytime: `npm run health:check`
2. Review issues in `TODO.md`
3. Prioritize based on severity
4. Fix critical issues first

### CI/CD Integration (Future)
The health check can be integrated into:
- Pre-commit hooks (detect critical errors before commit)
- GitHub Actions (automated testing and reporting)
- Docker health checks (monitor production servers)

## Customization

### Adding New Detection Patterns

Edit `scripts/health-check-analyze.ps1` and add patterns:

```powershell
# Example: Detect slow API responses
if ($line -match 'GET (\/api\/\S+) \d+ in (\d+)ms') {
    $endpoint = $matches[1]
    $duration = [int]$matches[2]
    
    if ($duration -gt 3000) {  # Slow if > 3s
        # Add to detectedIssues...
    }
}
```

### Adjusting Severity Levels

Modify the severity assignment in the detection logic:

```powershell
$detectedIssues[$issueKey] = @{
    Type = "Your Issue Type"
    Severity = "High"  # Change to High/Medium/Low
    # ...
}
```

## Troubleshooting

### Log file not found
- Make sure you started the server with `npm run dev:health`
- Or manually redirect output: `npm run dev > .health-check.log 2>&1`

### Issues not appearing in TODO.md
- Check if issue already exists (script deduplicates)
- Verify TODO.md has "## Known Issues - To Be Addressed Later" section
- Check PowerShell execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Script execution errors
- Ensure PowerShell 5.1 or higher: `$PSVersionTable.PSVersion`
- Run from project root directory
- Check file paths are correct

## Best Practices

1. **Run health checks regularly** - Catch issues early
2. **Review TODO.md weekly** - Prevent issue backlog
3. **Fix high severity issues immediately** - Avoid breaking changes
4. **Group similar low-priority issues** - Batch fixes efficiently
5. **Clear .health-check.log periodically** - Prevent false positives from old errors

## Future Enhancements

- [ ] Real-time dashboard (web UI)
- [ ] Email/Slack notifications for critical issues
- [ ] Performance metric tracking (response times, memory usage)
- [ ] Automatic issue closing when resolved
- [ ] Integration with GitHub Issues API
- [ ] Historical trend analysis
- [ ] Custom alert thresholds per environment

---

**Last Updated**: January 21, 2026  
**Version**: 1.0.0
