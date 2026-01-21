# Quick Start - Health Check System

## Start Server with Health Monitoring

```bash
npm run dev:health
```

**OR**

```bash
npm run dev *> .health-check.log
```

Then analyze:

```bash
npm run health:check
```

---

## What You Get

✅ **Automatic Issue Detection**
- 404 errors (missing files)
- API errors (4xx/5xx responses)
- Hydration mismatches
- Compilation failures

✅ **Severity Categorization**
- **High**: Critical issues (hydration, compilation)
- **Medium**: API problems
- **Low**: Cosmetic issues (missing decorations)

✅ **Auto-Documentation**
- All issues logged to `TODO.md`
- Includes: severity, impact, action items, occurrence count
- Deduplicates existing issues

---

## Files Created

| File | Purpose |
|------|---------|
| `scripts/dev.ps1` | Start server with monitoring |
| `scripts/health-check-analyze.ps1` | Analyze logs & update TODO |
| `docs/health-check-system.md` | Full documentation |
| `.health-check.log` | Server output (auto-generated) |

---

## NPM Commands

| Command | Description |
|---------|-------------|
| `npm run dev:health` | Start with health check enabled |
| `npm run health:check` | Analyze existing logs |

---

## Example Output

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
```

---

**Full Docs**: [docs/health-check-system.md](docs/health-check-system.md)
