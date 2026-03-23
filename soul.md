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

## 4. Security & Secrets

- Player data is sensitive — never log IDs
- Game API keys → `/secrets/` (gitignored)
- Use environment variables

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
