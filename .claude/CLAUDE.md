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

## Current Work
**Active:** Phase 1 — Foundation (see `docs/internal/phase-1-plan.md` for sub-phase breakdown and progress)

Check the plan file for which sub-phase is current, what's done, and any handoff notes.

## Phase Completion Notes
After each phase, check `docs/internal/phase-notes/` for context on what was built, decisions made, and challenges resolved.
Use `/phase-complete` to generate the phase note automatically at the end of a phase.

## Custom Skills
- `/phase-complete` — generates a structured phase completion doc, commits, and pushes it
- `/rest-standards` — enforces Jay's REST API conventions (snake_case paths, PATCH over PUT, no verbs, etc.)

## How to Use the Docs
The architecture doc, scope doc, and implementation checklist describe **intent, not rigid contracts**.
Pseudocode is directional — adapt it to what works in practice. If an implementation detail in the
docs doesn't hold up against real code (e.g., a data flow is awkward, an API shape doesn't fit),
**flag the deviation to Jay, explain why, and update the doc** so it stays accurate. The docs should
always reflect the actual state of the project, not an outdated plan.

What IS rigid: the tech stack, the three-LLM-subsystem separation, and the REST API standards.
Everything else can flex.

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
