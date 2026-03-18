# CLAUDE_CODE_INSTRUCTIONS.md
## Project-Specific Instructions for Claude Code

**Project:** LaunchLab — Healthcare Agent Launch Simulator
**Owner:** Jay Dreyer
**Last Updated:** 2026-03-17

---

## What This Project Is

LaunchLab is a full-stack application that simulates deploying a healthcare scheduling agent. A user configures a fake medical practice, defines agent behavior (prompts, guardrails, tools), runs simulated patient conversations, and evaluates whether the agent is ready for launch.

This is a portfolio project targeting Solutions Engineer and AI-focused roles. It must feel like a real internal deployment tool — polished, functional, and demonstrating deep understanding of agent systems.

---

## Tech Stack (Locked — Do Not Deviate)

### Backend
- **Python 3.12+**
- **FastAPI** with async endpoints
- **SQLAlchemy 2.0** with async support (aiosqlite)
- **SQLite** for persistence (single file at `data/launchlab.db`)
- **Pydantic v2** for all request/response schemas
- **Anthropic Python SDK** for all LLM calls
- **Alembic** for database migrations
- **pytest + pytest-asyncio** for testing

### Frontend
- **React 18** with TypeScript (strict mode)
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components (install via CLI as needed)
- **Radix UI** primitives (comes with shadcn)
- **Zustand** for state management
- **React Router v7** for routing
- **Axios** for HTTP client

### Infrastructure
- FastAPI serves the React production build as static files
- Cloudflare Tunnel for public exposure (configured separately)
- Environment variables via `.env` file (python-dotenv)

---

## Repository Structure

Follow the structure defined in `docs/launchlab-technical-architecture.md` Section 3. Key points:

- Monorepo: `backend/` and `frontend/` at root level
- Backend follows service-oriented architecture: `routers/` → `services/` → `models/`
- Frontend follows page-based organization: `pages/` for routes, `components/` grouped by feature
- Shared types in `frontend/src/types/index.ts`
- All docs in `docs/`
- Utility scripts in `scripts/`

---

## Coding Conventions

### Python (Backend)

- **Formatting:** Use `black` defaults (line length 88)
- **Imports:** Group as stdlib → third-party → local, separated by blank lines
- **Type hints:** Required on all function signatures
- **Async:** All database operations and LLM calls must be async
- **Validation:** Every API endpoint uses Pydantic schemas for request and response
- **Naming:**
  - Files: `snake_case.py`
  - Classes: `PascalCase`
  - Functions/variables: `snake_case`
  - Constants: `UPPER_SNAKE_CASE`
- **Error handling:** Use FastAPI's `HTTPException` for API errors. Use structured error responses, not raw strings.
- **Docstrings:** Required on all service methods and non-trivial functions. Keep them concise — one line for simple functions, a short paragraph for complex ones.

### TypeScript (Frontend)

- **Strict mode:** `"strict": true` in tsconfig
- **Components:** Functional components with hooks only. No class components.
- **Naming:**
  - Files: `PascalCase.tsx` for components, `camelCase.ts` for utilities
  - Components: `PascalCase`
  - Hooks: `useCamelCase`
  - Stores: `camelCaseStore.ts`
- **Props:** Define interfaces for all component props. No `any` types.
- **Styling:** Tailwind utility classes only. No inline styles. No CSS modules. No styled-components.
- **shadcn/ui:** Always prefer a shadcn/ui component over building custom. Check if one exists before creating a custom component.
- **State:**
  - Zustand for global/shared state (practice config, agent config, simulation state, eval results)
  - React useState/useReducer for component-local state
  - No Redux, no Context API for state management
- **Data fetching:** Axios with a shared client instance in `api/client.ts`. No React Query or SWR — keep it simple.

### General

- **No comments that restate the code.** Comments should explain WHY, not WHAT.
- **Keep files focused.** If a file exceeds ~200 lines, consider splitting.
- **No premature abstraction.** Build the concrete thing first. Extract shared patterns only when there are three or more instances.

---

## Architecture Rules

### Three LLM Subsystems

This project has three distinct Claude API call patterns. Keep them clearly separated:

1. **Healthcare Agent** (`services/orchestrator.py`)
   - Model: configurable via `ANTHROPIC_MODEL` env var (default: `claude-sonnet-4-5-20250929`)
   - Uses tool definitions (Anthropic native tool use)
   - System prompt is dynamically assembled from practice config + agent config
   - Runs in a loop: message → tool call → tool result → message (until text response)

2. **Patient Simulator** (`services/patient_simulator.py`)
   - Model: configurable via `ANTHROPIC_MODEL` env var (default: `claude-sonnet-4-5-20250929`)
   - No tools — text generation only
   - System prompt is the patient persona (varies per scenario)
   - Generates one patient message at a time based on conversation history

3. **LLM-as-Judge** (`services/eval_judge.py`)
   - Model: configurable via `ANTHROPIC_MODEL` env var (default: `claude-sonnet-4-5-20250929`)
   - No tools — structured JSON output only
   - System prompt defines evaluation rubric
   - Called once per completed scenario with full transcript

**Never mix these roles in a single API call.** They are architecturally separate even though they use the same model.

### Dynamic System Prompt Assembly

The agent's system prompt MUST be assembled at runtime from:
- `agent_config.system_prompt` (base instructions)
- Practice context (formatted from `practice_profile`)
- Workflow steps (from `agent_config.workflow_config`)
- Guardrails (from `agent_config.guardrails`)
- Escalation rules (from `agent_config.escalation_triggers`)
- Tool policy (from `agent_config.tool_policy`)

This is a core architectural feature. Changing config in the UI must change agent behavior without any code changes.

### Tool Execution

- Tools are defined using Anthropic's native tool use format
- Tool implementations live in `backend/tools/` with one file per tool
- All tools inherit from a `BaseTool` class with a consistent interface
- Tool dispatch happens in `services/tool_executor.py`
- Every tool call is logged to the `tool_calls` table
- Tools return structured `ToolResult` objects, never raw dicts
- Tools have conditional logic based on mock data — they are NOT hardcoded JSON responses
- Some scenarios flag tools for forced failure mode

### Mocked Data

- All mock data lives in `backend/tools/mock_data.py`
- Data is structured and queryable (dicts with provider schedules, insurance lists, etc.)
- Tools query this data with real filtering logic (e.g., "find slots for dr_smith on Tuesday")
- Scenarios can override tool behavior (e.g., force failure, force empty results)

---

## What NOT To Build

Do not add any of the following — they are explicitly out of scope for v1:

- **Authentication or user accounts** — there is one implicit user
- **Multi-tenancy** — there is one practice (BrightCare)
- **Real EMR/EHR integration** — all tools are mocked
- **Real telephony or SMS** — simulator only
- **WebSocket for real-time chat** — polling or simple request/response is fine for v1
- **Complex database migrations** — SQLite with a clean schema is sufficient
- **Caching layer** — not needed at this scale
- **Rate limiting** — single user, not needed
- **CI/CD pipeline** — manual deployment is fine
- **Docker containers** — run directly on the server
- **Multiple LLM providers** — Anthropic only
- **Voice/audio processing** — text-based simulation only
- **HIPAA compliance** — this is a simulator with fake data

---

## When In Doubt

- **Prefer simplicity over abstraction.** If you're creating a base class that only has one subclass, just write the concrete implementation.
- **Prefer shadcn/ui components.** Check the shadcn/ui docs before building custom UI.
- **Prefer Pydantic for validation.** Don't write manual validation logic when a Pydantic model will do.
- **Prefer explicit over clever.** Code should be readable to a hiring manager skimming the repo.
- **Prefer working over perfect.** Get the feature functional, then polish.
- **When a design decision is ambiguous, check `docs/launchlab-technical-architecture.md`.** It has pseudocode, schemas, and API specs for all major components.

---

## Build Phases

Work in this order. Complete each phase before moving to the next.

### Phase 1: Foundation (Days 1-2)
Scaffold both apps, set up all database models, seed BrightCare data, implement all 6 mocked tools with conditional logic, build the orchestrator with dynamic system prompt assembly and tool execution loop. Validate with a curl-based conversation.

### Phase 2: Config + Simulator UI (Days 3-5)
Build Practice Setup page, Agent Config page, and Conversation Simulator page. Wire simulator to backend. Implement scenario picker, tool trace panel, patient simulator, and auto-respond mode.

### Phase 3: Eval Suite + Judge (Days 6-8)
Define all scenario criteria and patient personas. Build eval runner, LLM-as-Judge evaluator, Eval Runner page, and Simulation Trace Detail page.

### Phase 4: Dashboard + Export + Polish (Days 9-12)
Build readiness scoring, dashboard page, report export. UI polish pass. Deploy via Cloudflare Tunnel. Write README.

---

## Testing Strategy

- **Backend:** pytest with async fixtures. Test services and API endpoints. Mock Anthropic API calls in tests (don't burn API credits on unit tests).
- **Frontend:** Manual testing is acceptable for v1. No unit test requirement for React components.
- **Integration:** The eval suite itself serves as the integration test. A passing eval run means the full stack works.

---

## Key Files Reference

When working on a specific area, consult these files:

| Area | Primary Reference |
|------|------------------|
| Overall architecture | `docs/launchlab-technical-architecture.md` |
| Screens and UX | `docs/launchlab-v1-scope.md` |
| Tickets and acceptance criteria | `docs/launchlab-implementation-checklist.md` |
| Database schema | Architecture doc, Section 10 |
| API specification | Architecture doc, Section 9 |
| Orchestrator design | Architecture doc, Section 4 |
| Patient simulator design | Architecture doc, Section 5 |
| Tool implementation | Architecture doc, Section 6 |
| LLM-as-Judge design | Architecture doc, Section 7 |
| Readiness scoring | Architecture doc, Section 8 |
| Eval scenario suite | Architecture doc, Section 12 |
| Frontend screens | Architecture doc, Section 11 |
| Design direction | Architecture doc, Section 16 |

---

## Design Direction

**"Clinical Precision"** — professional, clean, operational dashboard feel.

- Cool grays + sharp teal accent
- Inter or Geist Sans font
- Subtle borders, minimal shadows, generous whitespace
- Dark editor theme for code/config editing areas
- Green/amber/red status indicators
- No gratuitous animations
- Should feel like an internal tool built by a competent team, not a consumer app

---

## Environment Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add ANTHROPIC_API_KEY
python -m scripts.seed_db  # Initialize database with BrightCare data
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Runs on port 5173, proxied to backend
```

### .env Required Variables
```
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=sqlite+aiosqlite:///./data/launchlab.db
ENVIRONMENT=development
LOG_LEVEL=DEBUG
CORS_ORIGINS=http://localhost:5173
```
