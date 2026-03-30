# 🔒 Security Policy - API Keys & Secrets Management

**Last Updated**: March 23, 2026  
**Status**: CRITICAL - Mandatory Compliance Required

---

## Executive Summary

This project has experienced **multiple API key exposures** on GitHub. This document establishes non-negotiable security practices to prevent future breaches.

**Previous Incidents**:
- **2026-03-23**: Multiple API keys exposed in test files, documentation, and deployment scripts
- **Impact**: OpenRouter and Together AI keys compromised and revoked

---

## 1. Core Security Principles

### 1.1 Zero-Trust for Secrets
- Assume all code, documentation, and scripts could be exposed publicly
- NEVER trust `.gitignore` alone to protect secrets
- Enforce secrets protection at multiple levels:
  - Pre-commit hooks block commits with keys
  - `.gitignore` prevents accidental commits
  - Code review checklist specifically validates secret handling

### 1.2 Separation of Concerns
- **Development**: Keys in `/secrets/.env` (local computer only)
- **CI/CD**: Keys in GitHub Secrets (encrypted, not version controlled)
- **Production**: Keys set directly in VPS environment (manual setup)

### 1.3 Principle of Least Privilege
- Each environment has its own API keys
- Never share production keys across environments
- Rotate keys regularly (every 3 months minimum)
- Revoke keys immediately if exposure suspected

---

## 2. Where to Store API Keys

### 2.1 ✅ APPROVED: `/secrets/` Directory (Local Development)

**Location**: `/secrets/.env` (gitignored)

**Purpose**: Safe local development environment

**Usage**:
```bash
# Create /secrets/ directory
mkdir -p secrets

# Create /secrets/.env with your keys
cat > secrets/.env << 'EOF'
GROQ_API_KEY=your_actual_key_here
TOGETHER_API_KEY=your_actual_key_here
OPENROUTER_API_KEY=your_actual_key_here
EOF

# Code loads from this file
# It NEVER gets committed to Git
```

**Verification**:
```bash
# Confirm .gitignore protects /secrets/
grep "^/secrets/" .gitignore

# Verify no secrets in Git
git log -p --all -S "sk-or-v1-" -- "*.js" "*.json" "*.md"
```

### 2.2 ✅ APPROVED: GitHub Secrets (CI/CD Pipelines)

**Location**: Settings → Secrets and variables → Actions

**Purpose**: Secure deployment without committing keys

**Setup**:
```yaml
# .github/workflows/deploy.yml
- name: Deploy to VPS
  run: |
    echo "TOGETHER_API_KEY=${{ secrets.TOGETHER_API_KEY }}" >> .env.production
    echo "OPENROUTER_API_KEY=${{ secrets.OPENROUTER_API_KEY }}" >> .env.production
```

**Best Practices**:
- Rotate GitHub Secrets every 3 months
- Use different keys for staging vs. production
- Audit access logs regularly
- Add encryption in transit (HTTPS only)

### 2.3 ✅ APPROVED: VPS Environment Variables (Production)

**Location**: Production VPS only (not in version control)

**Setup** (one-time manual):
```bash
# SSH to VPS
ssh root@your-vps-ip

# Set environment variables
export TOGETHER_API_KEY="your_key"
export OPENROUTER_API_KEY="your_key"

# Add to systemd service or Docker environment
# Never store in plaintext files
```

---

## 3. What NOT to Do ❌

### 3.1 ❌ FORBIDDEN: Hardcoded Keys in Code

```javascript
// ❌ NEVER DO THIS
const API_KEY = 'sk-or-v1-8438daf2870e97...';  // BAD!
const fallback = process.env.API_KEY || 'sk-or-v1-...';  // BAD!
```

**Why**: Keys are visible in:
- GitHub repository history
- IDE autocomplete suggestions
- Error logs and stack traces
- Team member's local copies

### 3.2 ❌ FORBIDDEN: Real Keys in `.env.production`

```bash
# ❌ NEVER COMMIT THIS
.env.production with:
  OPENROUTER_API_KEY=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
```

**Why**: Version control history is permanent

### 3.3 ❌ FORBIDDEN: Keys in Documentation

```markdown
# ❌ NEVER DO THIS
Here's what to configure:
TOGETHER_API_KEY=ec41214373c0da02905e9356b232c4964388c30d82126dcf8f203514799012c5
```

**Why**: Documentation is often publicly visible

### 3.4 ❌ FORBIDDEN: Keys as Default Fallback Values

```javascript
// ❌ NEVER DO THIS
const TOGETHER_KEY = process.env.TOGETHER_API_KEY || 'ec41214373c0da...';

// ✅ DO THIS INSTEAD
const TOGETHER_KEY = process.env.TOGETHER_API_KEY;
if (!TOGETHER_KEY) {
  throw new Error('TOGETHER_API_KEY environment variable not set');
}
```

### 3.5 ❌ FORBIDDEN: Keys in Test Files

```javascript
// ❌ NEVER DO THIS in test-vps-llm.js
const testKey = 'sk-or-v1-8438daf2870e97...';  // BAD!

// ✅ DO THIS INSTEAD
// Fail loudly if key not set
if (!process.env.TOGETHER_API_KEY) {
  throw new Error('Env vars not configured. See /secrets/.env setup.');
}
```

---

## 4. Pre-Commit Protection

### 4.1 Automatic Key Detection

Pre-commit hooks automatically block commits containing:
- OpenRouter keys (pattern: `sk-or-v1-` + 56+ hex chars)
- Together AI keys (pattern: `ec41214373c0da...`)
- Hugging Face tokens (pattern: `hf_` + 20+ chars)
- Groq keys (pattern: `gsk_` + 20+ chars)

```bash
# Hooks run automatically before commit
# They block files containing detected keys

# If blocked, fix these files:
git reset HEAD <filename>
# Remove the secret
# Don't commit it
```

### 4.2 Setting Up Pre-Commit

```bash
# Install pre-commit (one-time)
pip install pre-commit

# Install hooks from repository
pre-commit install

# Verify installation
git hooks --list
```

### 4.3 Bypassing Hooks (NOT RECOMMENDED)

```bash
# ⚠️  Only use if absolutely necessary
git commit --no-verify -m "message"

# Then immediately revoke the key!
```

---

## 5. If You Accidentally Expose a Key

### 5.1 Immediate Response (First 5 Minutes)

1. **STOP**: Remove the exposed key from all places
2. **REVOKE**: Go to API provider website and revoke the compromised key
3. **DATABASE**: Update GitHub Secrets with new key
4. **LOCAL**: Update `/secrets/.env` with new key

### 5.2 Cleanup (Next 30 Minutes)

1. **FIX COMMITS**: Remove the exposed key from:
   - Code files (replace with env var reference)
   - Documentation (replace with `[REDACTED]`)
   - Test files (remove hardcoded keys)

2. **FORCE PUSH** (carefully!):
   ```bash
   # Nuclear option: rewrites history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch secrets-file.js" \
     --prune-empty --tag-name-filter cat -- --all
   
   git push --force --all
   git push --force --tags
   ```

3. **DOCUMENT**: Create `docs/INCIDENT-YYYYMMDD.md`:
   ```markdown
   # Security Incident - Date
   
   - Exposed key: [type and suffix only, e.g., "OpenRouter sk-or-v1-...b63b"]
   - Exposure time: X minutes
   - Discovery method: GitHub Secret Scanner
   - Key revoked: ✅ Yes
   - History cleaned: ✅ Yes
   - New key deployed: ✅ Yes
   ```

### 5.3 Prevention Review (Within 24 Hours)

- [ ] Was this caught by pre-commit hook? If not, why?
- [ ] Did `.gitignore` work correctly?
- [ ] Do we need additional tooling?
- [ ] Update team on incident & prevention

---

## 6. Environment File Strategy

### 6.1 `.env.example` (Template - COMMITTED)
```env
# Contains only placeholder values
GROQ_API_KEY=your_groq_api_key_here
TOGETHER_API_KEY=your_together_api_key_here
```

### 6.2 `.env.local` (Development - GITIGNORED)
```env
# Contains REAL development keys
# Only on your computer
# Never in version control
GROQ_API_KEY=gsk_abc123...  # ✅ Real key locally
TOGETHER_API_KEY=ec41214...  # ✅ Real key locally
```

### 6.3 `.env.production` (Production - GITIGNORED)
```env
# Created on VPS manually
# Or populated by CI/CD from GitHub Secrets
# Never committed to Git
GROQ_API_KEY=gsk_def456...  # ✅ Production key (different from dev)
TOGETHER_API_KEY=ec41215...  # ✅ Production key (different from dev)
```

### 6.4 GitHub Secrets
```
GROQ_API_KEY = gsk_gh789...   # ✅ CI/CD key (may be different)
TOGETHER_API_KEY = ec41216... # ✅ CI/CD key
```

**Key Points**:
- Each environment has DIFFERENT keys
- `.gitignore` blocks all `.env*` files
- Pre-commit hooks verify no secrets in commits
- Secrets injected at deploy time, not build time

---

## 7. Key Rotation Schedule

### 7.1 Rotation Frequency
- **Development keys**: Rotate every month
- **Production keys**: Rotate every 3 months
- **After any exposure**: Immediately
- **After team member leaves**: Immediately

### 7.2 Rotation Process
```bash
# 1. Generate new key on provider website
# 2. Update GitHub Secrets
# 3. Update /secrets/.env
# 4. Test in staging first
# 5. Deploy to production
# 6. Revoke old key (keep for 24h in case of rollback)
# 7. Document rotation in CHANGELOG
```

---

## 8. Monitoring & Auditing

### 8.1 Git History Scanning

```bash
# Check if any keys are in history
git log -p --all | grep -E "sk-or-v1-|TOGETHER_API|KOALAS_API"

# Use git-secrets tool
brew install git-secrets
git secrets --install
git secrets --add --global 'sk-or-v1-'
git secrets --scan -r
```

### 8.2 GitHub Secret Scanning

- Already enabled for this repository
- Automatically detects tokens and keys
- Alerts in Security tab if found

### 8.3 Review Audit Trail

```bash
# See what keys were used and when
# (if logging implemented)
docker logs pets-app | grep -i API_KEY

# Audit environment variable access
env | grep -E "API_KEY|TOKEN|SECRET"
```

---

## 9. Common Mistakes & How to Avoid

| Mistake | Why It Happens | Prevention |
|---------|---|---|
| Committing `.env.production` | Copy-paste error | pre-commit hook blocks |
| Using dev keys in prod | Environment config mismatch | Different keys per environment |
| Sharing key in Slack/Email | Quick troubleshooting | Use `/secrets/.env` only |
| Hardcoded fallback keys | "In case API call fails" | Throw error instead, handle gracefully |
| Pushing old `.env` from history | Forgot to clean history | Pre-commit hook catches |
| Using same key everywhere | Simpler to manage | Rotation becomes simpler actually |
| Storing keys in comments | "Just documenting here" | Use environment variables |

---

## 10. Developer Checklist

Before every commit:

- [ ] I have NOT committed any `.env*` files with real keys
- [ ] I have NOT hardcoded any API keys in code
- [ ] I have NOT added real keys to documentation
- [ ] All production keys are in GitHub Secrets
- [ ] All development keys are in `/secrets/.env` (local only)
- [ ] Pre-commit hooks passed
- [ ] I've reviewed my code for key exposure patterns
- [ ] If I'm sharing code with team, no keys are visible

Before deploying to production:

- [ ] GitHub Secrets contain production API keys
- [ ] `.env.production` was NOT committed to Git
- [ ] Deploy script pulls keys from GitHub Secrets or VPS vars
- [ ] I've tested in staging first
- [ ] Monitoring is enabled to detect issues

---

## 11. Getting Help

**If you have questions**:
- Read: `soul.md` section 4 (Security & Secrets)
- Read: `.env.example` (security notices at top)
- Ask: Create issue with `[SECURITY]` tag
- Escalate: Contact maintainer immediately if key exposed

**If key is exposed**:
- STOP work
- See section 5 (Incident Response)
- Contact team immediately
- Document incident

---

## Appendix: API Key Patterns

Patterns automatically detected by pre-commit hooks:

```regex
# OpenRouter
sk-or-v1-[a-f0-9]{56,}

# Hugging Face
hf_[a-zA-Z0-9]{20,}

# Groq
gsk_[a-zA-Z0-9]{20,}

# Cohere
co_[a-zA-Z0-9]{20,}

# Together AI (unfortunately less standard)
ec41214373c0da  # Specific exposed key fragment
str pattern-based detection
```

---

**Questions? Issues? See soul.md or contact the security team.**

🔒 Remember: **Security over shortcuts. Every. Single. Time.**
