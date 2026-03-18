# LaunchLab — Claude Code Context

## Quick Reference
- **Project:** Healthcare Agent Launch Simulator (portfolio project)
- **Stack:** FastAPI + React 18 + SQLite + Anthropic SDK
- **Python:** 3.12 via uv
- **Node:** 25.x
- **Package manager:** uv (Python), npm (Node)

## Required Reading
Before making any changes, read these documents:
1. `CLAUDE_CODE_INSTRUCTIONS.md` — coding conventions, architecture rules, tech stack, and what NOT to build
2. `docs/launchlab-technical-architecture.md` — full architecture spec with pseudocode and schemas
3. `docs/launchlab-v1-scope.md` — screens, features, and sample workflows
4. `docs/launchlab-implementation-checklist.md` — epics, tickets, and build order

## Phase Completion Notes
After each phase, check `docs/phase-notes/` for context on what was built, decisions made, and challenges resolved.

## Critical Rules
- **Tech stack is locked.** Do not introduce new dependencies without explicit approval.
- **Three LLM subsystems are architecturally separate.** Never mix Healthcare Agent, Patient Simulator, and LLM-as-Judge in a single API call.
- **Dynamic system prompt assembly is mandatory.** The agent's system prompt is built at runtime from practice config + agent config. This is the core architectural feature.
- **All API endpoints use Pydantic schemas** for request and response validation.
- **All database operations and LLM calls must be async.**
- **Conventional commits:** Use prefixes (feat:, fix:, chore:, docs:, refactor:, test:).
- **No secrets in code.** API keys via .env only. Never log or expose secrets.
- **Prefer shadcn/ui** components over custom. Check if one exists before building.
- **Keep files under ~200 lines.** Split if larger.

## Running the Project
```bash
# Backend
cd backend && uv run uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```
