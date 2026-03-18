# Phase 1: Foundation — Execution Plan

**Status:** In progress (1A complete)
**Last Updated:** 2026-03-17

---

## Overview

Phase 1 is the first real code. It scaffolds the full backend (FastAPI + SQLAlchemy + Alembic),
implements all 6 mocked tools, builds the orchestrator with dynamic system prompt assembly,
and scaffolds the React frontend with page stubs.

Phase 1 is split into sub-phases so work can span multiple sessions with clean context boundaries.

---

## Phase 1A — Backend Core + Models

**Status:** Complete

### Tasks
- [x] Run `uv sync` to create virtualenv and install dependencies
- [x] Create `backend/config.py` — app settings via pydantic-settings (loads .env)
- [x] Create `backend/database.py` — async SQLAlchemy engine + session factory
- [x] Create `backend/main.py` — FastAPI app entry with CORS, lifespan, health check
- [x] Create all 6 SQLAlchemy models in `backend/models/`:
  - [x] `base.py` — DeclarativeBase
  - [x] `practice.py` — PracticeProfile
  - [x] `agent_config.py` — AgentConfig
  - [x] `simulation.py` — SimulationSession
  - [x] `tool_call.py` — ToolCall
  - [x] `eval_run.py` — EvalRun
  - [x] `eval_case.py` — EvalCase
- [x] Create `backend/models/__init__.py` — re-export all models
- [x] Init Alembic (async config) and generate initial migration for all 6 tables
- [x] Verify: app starts on port 8000, health check returns 200, all 6 tables in SQLite

### Done When
App starts clean on port 8000 with all tables in SQLite. No seed data yet, no API endpoints beyond health check.

### Key References
- Database schema: `docs/launchlab-technical-architecture.md` Section 10
- Repository structure: `docs/launchlab-technical-architecture.md` Section 3
- Config vars: `backend/.env.example`

---

## Phase 1B — Seed Data + Practice/Agent Config APIs

**Status:** Not started

### Tasks
- [ ] Create `backend/seed/brightcare.py` — BrightCare practice profile data
  - 2 locations, 4 providers, clinic hours, appointment types, insurance rules, escalation rules
- [ ] Create `backend/seed/agent_defaults.py` — default agent config (system prompt, workflow steps, guardrails, escalation triggers, tool policy, tone guidelines)
- [ ] Create Pydantic schemas in `backend/schemas/`:
  - [ ] `practice.py` — create, update, response schemas
  - [ ] `agent_config.py` — update, response schemas
- [ ] Create `backend/services/practice_service.py` — CRUD + reset to defaults
- [ ] Create `backend/services/agent_config_service.py` — CRUD + reset to defaults
- [ ] Create `backend/routers/practices.py`:
  - [ ] `GET /api/practices/{practice_id}`
  - [ ] `POST /api/practices`
  - [ ] `PATCH /api/practices/{practice_id}`
  - [ ] `POST /api/practice_resets`
- [ ] Create `backend/routers/agent_configs.py`:
  - [ ] `GET /api/agent_configs/{agent_config_id}`
  - [ ] `PATCH /api/agent_configs/{agent_config_id}`
  - [ ] `POST /api/agent_config_resets`
- [ ] Create seed script (`backend/seed/run_seed.py` or CLI command) to populate DB with BrightCare defaults
- [ ] Register routers in `main.py`
- [ ] Verify: seed DB, then curl all endpoints successfully

### Done When
Can run seed script, then `GET /api/practices/{id}` returns full BrightCare config and `GET /api/agent_configs/{id}` returns default agent config.

### Key References
- BrightCare data: `docs/launchlab-technical-architecture.md` Section 6 (mock data store)
- API spec: `docs/launchlab-technical-architecture.md` Section 9
- Checklist tickets: Epic 1 (1.1–1.4) and Epic 2 (2.1–2.4)

---

## Phase 1C — Mocked Tools

**Status:** Not started

### Tasks
- [ ] Create `backend/tools/mock_data.py` — structured BRIGHTCARE_DATA dict (providers with schedules, locations, insurance lists, appointment types)
- [ ] Create `backend/tools/base.py` — BaseTool class + ToolResult dataclass + tool registry
- [ ] Implement 6 tools in `backend/tools/`:
  - [ ] `clinic_hours.py` — get_clinic_hours
  - [ ] `provider_availability.py` — lookup_provider_availability
  - [ ] `appointment_slots.py` — lookup_appointment_slots
  - [ ] `insurance_check.py` — check_insurance_acceptance
  - [ ] `callback_request.py` — create_staff_callback_request
  - [ ] `billing_route.py` — route_billing_question
- [ ] Each tool must have: conditional logic, proper error handling, force_failure support
- [ ] Create `backend/services/tool_executor.py` — dispatch by name, log to DB, return ToolResult
- [ ] Create Anthropic-format tool definitions (used by orchestrator)
- [ ] Verify: call each tool programmatically with sample inputs

### Done When
All 6 tools return realistic, conditional responses. Tool executor can dispatch by name and log calls. Tool definitions are ready for the Anthropic API.

### Key References
- Tool architecture: `docs/launchlab-technical-architecture.md` Section 6
- Tool contracts: checklist Epic 3 (3.1–3.4)
- Mock data shape: architecture doc Section 6 pseudocode

---

## Phase 1D — Orchestrator + Conversation Test

**Status:** Not started

### Tasks
- [ ] Create `backend/prompts/agent_system.py` — dynamic system prompt assembly from practice config + agent config
- [ ] Create `backend/services/orchestrator.py`:
  - [ ] Accept user message + session
  - [ ] Assemble system prompt dynamically
  - [ ] Build tool definitions from config
  - [ ] Run agent loop: call Claude → handle tool_use → execute tool → loop until text response
  - [ ] Check escalation triggers
  - [ ] Return OrchestratorResponse (agent message + tool calls + escalation info)
- [ ] Create `backend/schemas/simulation.py` — create session, send message, response schemas
- [ ] Create `backend/services/simulation_service.py` — create session, process message
- [ ] Create `backend/routers/simulations.py`:
  - [ ] `POST /api/simulations` (create session)
  - [ ] `POST /api/simulations/{simulation_id}/messages` (send message, get agent reply)
  - [ ] `GET /api/simulations/{simulation_id}` (get session with transcript)
- [ ] Register router in `main.py`
- [ ] Verify: multi-turn curl conversation with tool calls logged

### Done When
Can create a simulation session via curl, send messages, get agent responses with tool calls, and see tool calls logged in the DB. The dynamic system prompt correctly reflects practice + agent config.

### Key References
- Orchestrator design: `docs/launchlab-technical-architecture.md` Section 4
- Simulation API: `docs/launchlab-technical-architecture.md` Section 9
- Checklist: Epic 4 (4.1–4.3)

---

## Phase 1E — Frontend Scaffold

**Status:** Not started

### Tasks
- [ ] Scaffold React + Vite + TypeScript in `frontend/`
- [ ] Install and configure Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Install React Router v7, Axios, Zustand
- [ ] Create `frontend/src/api/client.ts` — Axios instance with base URL
- [ ] Create layout components:
  - [ ] `components/layout/AppShell.tsx` — main layout wrapper
  - [ ] `components/layout/Sidebar.tsx` — navigation sidebar
  - [ ] `components/layout/PageHeader.tsx` — page title + actions
- [ ] Create 6 page stubs in `frontend/src/pages/`:
  - [ ] `PracticeSetup.tsx`
  - [ ] `AgentConfig.tsx`
  - [ ] `Simulator.tsx`
  - [ ] `SimulationTrace.tsx`
  - [ ] `EvalRunner.tsx`
  - [ ] `ReadinessDashboard.tsx`
- [ ] Set up routing in `App.tsx` with all 6 routes
- [ ] Configure Vite proxy to backend (port 8000)
- [ ] Apply "Clinical Precision" design tokens (cool grays, teal accent, Inter font)
- [ ] Make layout mobile-responsive:
  - [ ] Sidebar collapses to hamburger menu on small screens
  - [ ] Pages use responsive Tailwind breakpoints
  - [ ] Split-pane layouts (used later in Simulator) will stack vertically on mobile
- [ ] Verify: `npm run dev` shows all 6 pages navigable via sidebar on desktop and mobile viewports

### Done When
Frontend runs on port 5173, all 6 pages are navigable via the sidebar (hamburger on mobile), layout looks clean with the Clinical Precision design direction. No data fetching yet — just stubs.

### Key References
- Frontend screens: `docs/launchlab-technical-architecture.md` Section 11
- Design direction: `docs/launchlab-technical-architecture.md` Section 16
- Component structure: `docs/launchlab-technical-architecture.md` Section 3

---

## Session Handoff Notes

_Use this section to leave notes for the next session if work is paused mid-sub-phase._

(none yet)
