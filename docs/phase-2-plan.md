# Phase 2: Simulation Core — Execution Plan

**Status:** In progress (Phase 2D complete)
**Last Updated:** 2026-03-18

---

## Overview

Phase 2 takes the scaffolded frontend and working backend (orchestrator, tools, APIs) from Phase 1
and connects them into a functional end-to-end simulation loop. By the end, a user can configure a
practice, tweak agent behavior, run conversations in the simulator, inspect tool traces, and see
the patient simulator auto-respond.

Phase 2 maps to checklist tickets 1.5, 2.5, 4.4, 4.5, 5.1–5.4, 6.1–6.5, and 7.1–7.4.

Phase 2 is split into sub-phases so work can span multiple sessions with clean context boundaries.

---

## Phase 2A — Practice Setup Screen

**Status:** Complete

### Tasks
- [x] Create API hooks in `frontend/src/api/`:
  - [x] `practices.ts` — `listPractices`, `getPractice`, `updatePractice`, `resetPractice`, `loadSamplePractice`
- [x] Create Zustand store `frontend/src/stores/practiceStore.ts` for practice state
- [x] Build Practice Setup page sections (replace stub in `PracticeSetup.tsx`):
  - [x] Practice name (text input with save)
  - [x] Locations section (editable card list — add/remove/edit name, address, same-day flags)
  - [x] Providers section (editable cards — name, title, locations, appointment types via badge toggles)
  - [x] Hours section (day-of-week grid with open/close time inputs per location)
  - [x] Appointment Types section (editable row — name, duration, new patient toggle)
  - [x] Insurance Rules section (accepted/not accepted/uncertain tag lists with add/remove)
  - [x] Escalation Rules section (trigger tag lists + editable action text)
- [x] Add action buttons: Save | Reset to Defaults | Load Sample (BrightCare)
- [x] "Load Sample" visually prominent on empty state
- [x] Add loading and error states
- [x] Add success toast/notification on save (sonner)
- [x] Added `GET /api/practices` list endpoint so frontend can auto-discover practice
- [x] Verify: build compiles, types check clean

### Done When
Practice Setup page is fully functional. Can load BrightCare defaults, view all sections, edit any field, save changes, and reset to defaults. Data round-trips through the backend API.

### Key References
- Screen spec: `docs/launchlab-technical-architecture.md` Section 11 (Screen 1)
- Feature list: `docs/launchlab-v1-scope.md` Screen 1
- Practice API: `backend/routers/practices.py` (already built)
- Schemas: `backend/schemas/practice.py` (already built)
- Checklist: Epic 1, ticket 1.5

---

## Phase 2B — Agent Config Screen

**Status:** Complete

### Tasks
- [x] Create API hooks in `frontend/src/api/`:
  - [x] `agentConfigs.ts` — `listAgentConfigs`, `getAgentConfig`, `updateAgentConfig`, `resetAgentConfig`, `previewAgentConfig`
- [x] Create Zustand store `frontend/src/stores/agentConfigStore.ts`
- [x] Build Agent Config page (replace stub in `AgentConfig.tsx`):
  - [x] Two-column layout: editor (left) + preview (right)
  - [x] System prompt editor (textarea)
  - [x] Workflow steps editor (ordered list — add/remove/reorder steps)
  - [x] Guardrails editor (editable list of rules)
  - [x] Escalation triggers editor (editable list with keywords and actions)
  - [x] Tool policy editor (toggle tools on/off, show tool names from config)
  - [x] Tone guidelines editor (tone input + style rules list)
- [x] Build live preview panel (right column):
  - [x] Read-only display of the assembled system prompt as Claude would receive it
  - [x] Call `POST /api/agent_config_previews` to assemble prompt from current config + practice data
- [x] Add action buttons: Save | Reset to Defaults
- [x] Add loading, error, and success states
- [x] Added `GET /api/agent_configs` list endpoint so frontend can auto-discover agent config
- [x] Added `POST /api/agent_config_previews` endpoint for live preview assembly
- [x] Installed shadcn/ui `textarea` component
- [x] Verify: build compiles, types check clean

### Done When
Agent Config page shows all config sections in editable form. Live preview shows the assembled system prompt. Save persists changes through the API. Reset restores defaults.

### Key References
- Screen spec: `docs/launchlab-technical-architecture.md` Section 11 (Screen 2)
- Feature list: `docs/launchlab-v1-scope.md` Screen 2
- Agent Config API: `backend/routers/agent_configs.py` (already built)
- System prompt assembly: `backend/prompts/agent_system.py` (already built)
- Checklist: Epic 2, ticket 2.5

### Notes
- The architecture doc mentions CodeMirror 6 for the prompt editor. If adding it requires a new dependency, flag it and use a plain textarea as fallback. Do not block on this.
- The "Run Quick Test" button and config diff view are nice-to-haves. Defer to Phase 2C or later if they add scope.

---

## Phase 2C — Simulator Screen (Chat UI + Session Management)

**Status:** Complete

### Tasks
- [x] Create API hooks in `frontend/src/api/`:
  - [x] `simulations.ts` — `createSimulation`, `getSimulation`, `sendMessage`, `listSimulations`
- [x] Create Zustand store `frontend/src/stores/simulationStore.ts` for active session state
- [x] Build Simulator page top bar controls:
  - [x] Scenario picker dropdown (hardcoded scenario list for now — names only)
  - [x] Channel mode toggle (Chat | SMS) — styling difference only for v1
  - [x] New Session button
  - [x] Rerun / Reset controls
- [x] Build left pane — chat transcript:
  - [x] Chat bubble UI (user messages on right, agent on left)
  - [x] Message input with send button
  - [x] Loading indicator while agent is responding
  - [x] Escalation banner (appears inline when `escalation` is returned)
  - [x] Outcome badge at conversation end
  - [x] Auto-scroll to latest message
- [x] Build right pane — inline trace panel (lightweight version):
  - [x] Scenario info card (name, description)
  - [x] Tool call log (collapsible cards showing tool name, input, output, status)
  - [x] Escalation marker with trigger reason
  - [x] Turn counter
- [x] Handle session lifecycle:
  - [x] Creating a session calls `POST /api/simulations`
  - [x] Each message calls `POST /api/simulations/{id}/messages`
  - [x] Reload session state on page revisit via `GET /api/simulations/{id}`
- [x] Add SMS-style transcript variant (alternate bubble styling, kept lightweight)
- [x] Mobile responsive: stack panes vertically on small screens
- [x] Added `GET /api/simulations` list endpoint for session discovery
- [x] Verify: build compiles, types check clean

### Done When
Can start a new simulation session, have a multi-turn conversation with the agent, see tool calls in the trace panel, see escalation banners, and switch between chat/SMS styling. The full conversation round-trips through the backend orchestrator.

### Key References
- Screen spec: `docs/launchlab-technical-architecture.md` Section 11 (Screen 3)
- Feature list: `docs/launchlab-v1-scope.md` Screen 3
- Simulation API: `backend/routers/simulations.py` (already built)
- Orchestrator: `backend/services/orchestrator.py` (already built)
- Checklist: Epic 4, tickets 4.4 and 4.5

---

## Phase 2D — Trace Panel + Simulation Trace Detail Page

**Status:** Complete

### Tasks
- [x] Add backend endpoint for tool calls:
  - [x] `GET /api/simulations/{simulation_id}/tool_calls` — returns tool calls for a session
  - [x] Create `backend/schemas/tool_call.py` for response schema
- [x] Add backend endpoint for listing sessions:
  - [x] `GET /api/simulations` — returns session summaries (latest first) *(already existed from Phase 2C)*
- [x] Enhance trace panel in Simulator (right pane):
  - [x] Tool call cards are expandable — show full input/output JSON
  - [x] Color-code tool status (success = green, error = red)
  - [x] Show tool call duration if available
  - [x] "View Full Trace" link to open Simulation Trace detail page
- [x] Build Simulation Trace detail page (`SimulationTrace.tsx`):
  - [x] Full-width timeline layout
  - [x] Full transcript with inline tool call annotations (tool calls shown between messages)
  - [x] Expandable tool call details (input/output JSON)
  - [x] Escalation event marker (if triggered)
  - [x] Final outcome card
  - [x] Session metadata (scenario name, channel mode, timestamps)
  - [x] Back link to Simulator
- [x] Route param support: `/simulator/:id/trace` *(already existed from Phase 1E scaffold)*
- [x] Verify: build compiles, types check clean

### Done When
Tool calls endpoint returns data. Trace panel in the Simulator shows tool calls with expandable detail. Simulation Trace page shows a full timeline view of a completed conversation with inline annotations, tool details, and outcome.

### Key References
- Screen spec: `docs/launchlab-technical-architecture.md` Section 11 (Screen 4)
- Feature list: `docs/launchlab-v1-scope.md` Screen 4
- Tool call model: `backend/models/tool_call.py` (already built)
- Tool executor logging: `backend/services/tool_executor.py` (already logs to DB)
- Checklist: Epic 5, tickets 5.1–5.4

### Notes
- Tool calls are already logged to the DB by `tool_executor.py`. This sub-phase mainly adds the API endpoint to retrieve them and the frontend to display them.

---

## Phase 2E — Patient Simulator (LLM-Powered Auto-Respond)

**Status:** Not started

### Tasks
- [ ] Create scenario definitions in `backend/scenarios/`:
  - [ ] `definitions.py` — scenario registry with name, description, patient persona prompt, expected outcome, tool overrides
  - [ ] Define initial scenarios:
    - [ ] Reschedule existing appointment (happy path)
    - [ ] Book annual physical (happy path)
    - [ ] Missing information during reschedule
    - [ ] No slots available
    - [ ] Tool failure during slot lookup
    - [ ] Ask clinic hours
    - [ ] Billing question
    - [ ] Urgent symptom escalation
- [ ] Create `backend/services/patient_simulator.py`:
  - [ ] Accept scenario persona prompt + conversation history
  - [ ] Call Claude with a separate system prompt (patient persona)
  - [ ] Return a realistic patient message
  - [ ] This is a distinct LLM subsystem — must use its own system prompt, never mixed with the Healthcare Agent call
- [ ] Create `backend/routers/scenarios.py`:
  - [ ] `GET /api/scenarios` — list all scenario definitions
  - [ ] `GET /api/scenarios/{scenario_name}` — get scenario details
- [ ] Add auto-respond endpoint:
  - [ ] `POST /api/simulations/{simulation_id}/auto_responses` — patient simulator generates next message, then sends it through the orchestrator
- [ ] Register new router in `main.py`
- [ ] Update frontend Simulator page:
  - [ ] Populate scenario picker dropdown from `GET /api/scenarios`
  - [ ] Add "Auto-respond" button that calls the auto-respond endpoint
  - [ ] Show patient simulator messages with a distinct visual style (auto-generated vs. manual)
  - [ ] When scenario is selected on new session, pass `scenario_name` to session creation
- [ ] Verify: select a scenario, click Auto-respond repeatedly, watch a full conversation play out automatically with tool calls and realistic patient behavior

### Done When
Scenario definitions exist in the backend and are served via API. Patient simulator generates realistic messages based on persona prompts. Auto-respond button in the Simulator drives the conversation forward. A reschedule scenario can run to completion automatically.

### Key References
- Patient simulator architecture: `docs/launchlab-technical-architecture.md` Section 5
- Scenario API spec: `docs/launchlab-technical-architecture.md` Section 9 (Scenario Endpoints)
- Auto-respond endpoint: `docs/launchlab-technical-architecture.md` Section 9 (Simulation Endpoints)
- Scenario suite: `docs/launchlab-technical-architecture.md` Section 12
- Checklist: Epic 6, tickets 6.1 and 6.5; Epic 7, ticket 7.4

### Notes
- The patient simulator is the second of the three LLM subsystems. It must be architecturally separate from the Healthcare Agent. Use a distinct system prompt and a separate Claude API call.
- Scenarios serve double duty: they power the auto-respond feature in the Simulator and will later be used by the eval runner in Phase 3.

---

## Phase 2F — Scenarios + Secondary Intents (Workflow Routing, Billing, Escalation)

**Status:** Not started

### Tasks
- [ ] Verify and tune primary workflow (rescheduling):
  - [ ] Run reschedule happy path end-to-end — confirm intent detection, info collection, tool use, confirmation
  - [ ] Run "missing info" scenario — confirm agent asks before acting
  - [ ] Run "no slots available" scenario — confirm graceful handling
  - [ ] Run "tool failure" scenario — confirm agent doesn't fabricate data
  - [ ] Tune system prompt and workflow steps if any scenario behaves poorly
- [ ] Verify and tune secondary intents:
  - [ ] Clinic hours / location intent — agent calls `get_clinic_hours` and responds clearly
  - [ ] Billing question — agent routes via `route_billing_question`, does not answer specifics
  - [ ] Insurance question — agent calls `check_insurance_acceptance`, handles uncertain result
  - [ ] Urgent symptom escalation — agent stops scheduling flow, escalates immediately
  - [ ] Unsupported request — agent declines cleanly, offers supported alternatives
- [ ] Update scenario definitions if needed (add/adjust persona prompts, tool overrides)
- [ ] Add scenario metadata for eval readiness:
  - [ ] `expected_outcome` field on each scenario
  - [ ] `category` field (scheduling, escalation, info, routing, unsupported)
  - [ ] `evaluation_criteria` stubs (will be fully implemented in Phase 3)
- [ ] Verify: each of the 8–10 built-in scenarios runs to a reasonable completion via auto-respond, with correct tool usage, escalation behavior, and routing

### Done When
All built-in scenarios produce reasonable agent behavior. Rescheduling works end-to-end. Billing routes correctly. Urgent symptoms escalate. Clinic hours queries return data. Each scenario has metadata ready for Phase 3 eval integration.

### Key References
- Workflow specs: `docs/launchlab-v1-scope.md` Section 5 (reschedule flow) and Section 6 (edge cases)
- Scenario suite: `docs/launchlab-technical-architecture.md` Section 12
- Escalation design: `backend/services/orchestrator.py` `_check_escalation` method
- Tool implementations: `backend/tools/` (all 6 tools already built)
- Checklist: Epic 6, tickets 6.1–6.5; Epic 7, tickets 7.1–7.4

### Notes
- This sub-phase is more about testing and tuning than building new features. The orchestrator, tools, and prompt assembly are already in place. The work here is making sure the scenarios actually produce good behavior and fixing any issues found.
- Prompt tuning may involve changes to `backend/seed/agent_defaults.py` (default agent config) and `backend/prompts/agent_system.py` (prompt assembly logic).
- Document any prompt engineering decisions or non-obvious tuning in the session handoff notes.

---

## Session Handoff Notes

_Use this section to leave notes for the next session if work is paused mid-sub-phase._

(none yet)
