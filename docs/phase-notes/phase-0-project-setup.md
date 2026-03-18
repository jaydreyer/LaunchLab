# Phase 0: Project Setup — Complete

**Date:** 2026-03-17
**Status:** Complete
**Branch:** main (all merged and pushed to GitHub)

---

## What We Built

Foundation files and tooling for the LaunchLab project. No application code yet.

### Files Created
| File | Purpose |
|------|---------|
| `.python-version` | Pins Python 3.12 for uv |
| `.gitignore` | Excludes secrets, build artifacts, OS junk, DB files |
| `.pre-commit-config.yaml` | Auto-formatting + security checks on every commit |
| `CLAUDE.md` | Auto-loaded context for every Claude Code session |
| `CLAUDE_CODE_INSTRUCTIONS.md` | Detailed coding conventions and architecture rules |
| `backend/.env.example` | Template for required env vars (no secrets) |
| `backend/pyproject.toml` | Dependencies, black, ruff, pytest config |
| `.vscode/settings.json` | Auto-format on save for Python and TypeScript |
| `.vscode/extensions.json` | Recommended VS Code extensions |
| `LICENSE` | MIT license |
| `docs/phase-notes/` | Phase completion docs (this directory) |

### Key Tooling Decisions
- **uv** for Python package management (not pyenv/pip)
- **ruff** for linting (replaces flake8 + isort + bandit)
- **black** for Python formatting
- **pre-commit** hooks enforce formatting and security on every commit
- **Conventional commits** (feat:, fix:, chore:, docs:, etc.)
- **Feature branch workflow** — no direct commits to main

---

## Decisions Made During Setup

### REST API Standards Alignment
The original architecture doc had several API anti-patterns. We corrected:
- **Paths:** All snake_case (`/api/simulations`, `/api/eval_runs`, `/api/agent_configs`)
- **Resource names:** All plural (`/practices`, `/simulations`, `/agent_configs`)
- **Path params:** Descriptive (`{practice_id}`, `{simulation_id}`, not `{id}`)
- **HTTP methods:** `PATCH` for partial updates (not `PUT`)
- **Verbs removed:** `POST /simulate/start` → `POST /simulations`
- **Collection responses:** Use `{ data, pagination }` envelope
- Jay's REST standards skill was updated: paths are snake_case (not kebab-case)

### Tech Stack Updates
- **Claude model:** Configurable via `ANTHROPIC_MODEL` env var, defaults to `claude-sonnet-4-5-20250929`
- **React Router:** v7 (not v6 — v7 has been stable since late 2024)
- **Code editor:** CodeMirror 6 (not Monaco — lighter weight, ~300KB vs 5-10MB)
- **HTTP client:** Axios (confirmed, staying with original choice)
- **Dependency floors tightened:** FastAPI >=0.135, Anthropic SDK >=0.84, SQLAlchemy >=2.0.36

### What Stayed the Same
- SQLAlchemy 2.0 + Alembic + aiosqlite (confirmed optimal)
- Zustand for frontend state (confirmed optimal)
- Pydantic v2 for validation (confirmed optimal)
- Axios for HTTP client (confirmed — simpler than switching to fetch)
- shadcn/ui for components (confirmed)

---

## Challenges and Resolutions

1. **Pre-commit + uv Python mismatch:** Homebrew's pre-commit uses Python 3.14 internally and couldn't find uv's Python 3.12. Fixed by removing `language_version` pin from the black hook config.

2. **VS Code JSONC vs strict JSON:** VS Code settings files use JSON with comments, which fails the `check-json` pre-commit hook. Fixed by excluding `.vscode/` from that hook.

3. **Git index.lock contention:** Occasional stale lock files from parallel operations. Resolved by removing the lock file when no process was holding it.

---

## What's Next: Phase 1 — Foundation

Phase 1 is the first real code. Refer to:
- `CLAUDE_CODE_INSTRUCTIONS.md` — Build Phases section
- `docs/launchlab-technical-architecture.md` — Section 15 (Phase 1 checklist)
- `docs/launchlab-implementation-checklist.md` — Epics 1-3

### Phase 1 scope:
1. Scaffold FastAPI backend with config, database, models
2. Set up SQLite + SQLAlchemy models (all 6 tables)
3. Seed BrightCare practice data
4. Implement 6 mocked tools with conditional logic
5. Build orchestrator with dynamic system prompt assembly
6. Build tool executor with logging
7. Test: single conversation via API (curl)
8. Scaffold React + Vite + shadcn/ui + Tailwind + React Router v7
9. Set up 6 page stubs

### Before starting Phase 1:
- Run `uv sync` in `backend/` to create virtualenv and install dependencies
- The `backend/` directory exists but only has `pyproject.toml` and `.env.example`
- The `frontend/` directory does not exist yet
