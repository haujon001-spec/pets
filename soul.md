# soul.md — Universal Project Constitution (Pet Game AI)
**Author:** John Hau
**Purpose:** Universal rules, structure, naming conventions, QA requirements, security policies, VS Code templates, and automation scripts for the AI-driven pet game.
**Scope:** Applies to all game logic, AI behavior, and backend code.
**Created:** 2026-03-17

---

## 1. Universal Folder Structure

```
/pets (project root)
  soul.md
  /data_raw            ← raw game events, player interactions
  /data_processed      ← processed game state, analytics
  /etl                 ← event processing scripts
  /models              ← trained AI behavior models
  /dashboards          ← player stats and pet behavior dashboards
  /reports_html        ← game balance and AI performance reports
  /qa                  ← game test cases, behavior validation
  /scripts             ← game automation and utilities
  /logs                ← game logs (gitignored)
  /config              ← game configurations, balancing parameters
  /docs                ← documentation
    /docs/setup        ← game build and deployment guides
    /docs/guides       ← gameplay mechanics runbooks
    /docs/status       ← player stats, balance reports
    /docs/architecture ← game architecture, AI behavior flows
    /docs/api          ← game API contracts
    /docs/project      ← project README
  /secrets             ← API credentials (gitignored)
  .gitignore
  .pre-commit-config.yaml
  .vscode/
```

---

## 2. Naming Conventions

- Scripts: `snake_case`
- Dashboards: `dashboard_<metric>_YYYYMMDD.html`
- AI models: `model_<behavior>_YYYYMMDD.pkl`
- Test cases: `test_<scenario>_YYYYMMDD.json`
- Docs: `DOCUMENTNAME_DDMMMYYYY.md`

---

## 3. QA & Testing Required

Before merging:
1. Game logic runs without errors
2. AI behavior generation passes tests
3. Game state persists correctly
4. Player dashboard renders
5. AI performance metrics generated
6. Zero unhandled exceptions in logs

---

## 4. Security & Secrets - CRITICAL POLICY

**This section is NON-NEGOTIABLE. Violations constitute critical security breaches.**

### 4.1 API Key Storage Rules (MANDATORY)
- ✅ DO: Store real API keys ONLY in:
  - `/secrets/` directory (gitignored) - for local development
  - GitHub Secrets - for CI/CD pipelines
  - VPS environment variables - set manually on production server
- ❌ DO NOT:
  - Hardcode API keys in code (even as fallback defaults)
  - Commit `.env`, `.env.production`, `.env.staging` with real keys
  - Paste real keys in documentation, guides, or test files
  - Use real keys in example configurations shown in files
  - Log or print API keys to console
  - Store keys in notebooks, markdown files, or scripts

### 4.2 Environment File Policy
- All `.env*` files are gitignored - exceptions require security review
- `.env.example` (template only) shows placeholder structure:
  ```env
  TOGETHER_API_KEY=your_together_api_key_here
  OPENROUTER_API_KEY=your_openrouter_api_key_here
  GROQ_API_KEY=your_groq_api_key_here
  ```
- Real files use either `/secrets/.env` or GitHub Actions secrets
- NO `.env.production` or `.env.staging` committed with real values

### 4.3 Code-Level Protection
- All scripts checking code must BLOCK patterns like:
  - `sk-or-v1-` followed by hex characters (OpenRouter keys)
  - `hf_` followed by alphanumerics (Hugging Face tokens)
  - Email patterns with API prefixes
  - Any hardcoded string matching API key formats
- Use pre-commit hooks to validate before commit
- CI/CD automatically scans for leaked credentials

### 4.4 If Credentials Are Exposed
1. Immediately revoke compromised API keys on provider websites
2. Rotate all keys in GitHub Secrets
3. Update `/secrets/.env` with new keys
4. Create new keys if existing ones were hardcoded
5. Force-push cleanup commit (after code fixes)
6. Document incident and preventive measures

### 4.5 Documentation Standards
- All guides/examples use PLACEHOLDER values
- Example files clearly marked: `[REDACTED - See /secrets/.env]`
- Quick-fix scripts must NOT contain working credentials
- Historical scripts showing real keys must be updated retroactively

---

## 5. Peacock Color

**Red** — `#FF1744`

---

## 9. Universal Principles

- Reproducibility over convenience
- Structure over improvisation
- QA over speed
- Security over shortcuts
- Fun and engagement over optimization premature

---

## 10. Amendments

| Date | Change |
|------|--------|
| 2026-03-17 | Initial soul.md created |
