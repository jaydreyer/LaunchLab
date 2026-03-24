# Phase 2E: Patient Simulator (LLM-Powered Auto-Respond) — Complete

**Date:** 2026-03-19
**Status:** Complete
**Branch:** main (PR #8 merged)

---

## What We Built

Added the patient simulator — the second of three LLM subsystems. Created 8 scenario definitions with patient persona prompts, expected outcomes, evaluation criteria, and tool overrides. Built the patient simulator service that generates realistic patient messages via a separate Claude API call with its own system prompt. Added scenario listing endpoints and an auto-respond endpoint that chains patient simulator output through the healthcare agent orchestrator. Updated the Simulator UI to populate the scenario picker dynamically from the API and show an Auto-respond button when a scenario-based session is active.

### Key Files Created/Modified
| File/Directory | Purpose |
|----------------|---------|
| `backend/scenarios/__init__.py` | Package init for scenario definitions |
| `backend/scenarios/definitions.py` | 8 scenario definitions with persona prompts, expected outcomes, categories, eval criteria, and tool overrides |
| `backend/services/patient_simulator.py` | `PatientSimulator` class — second LLM subsystem with role-flipping logic and opening message generation |
| `backend/routers/scenarios.py` | `GET /api/scenarios` and `GET /api/scenarios/{name}` endpoints |
| `backend/schemas/scenario.py` | `ScenarioResponse` and `ScenarioSummary` Pydantic schemas |
| `backend/routers/simulations.py` | Added `POST /api/simulations/{id}/auto_responses` endpoint |
| `backend/schemas/simulation.py` | Added `AutoRespondResponse` schema (includes `patient_message` + agent response) |
| `backend/services/simulation_service.py` | Added `auto_respond()` function — loads scenario, generates patient message, processes through orchestrator with tool overrides |
| `backend/main.py` | Registered `scenarios_router` |
| `frontend/src/api/scenarios.ts` | New API hooks for `listScenarios()` and `getScenario()` |
| `frontend/src/api/simulations.ts` | Added `autoRespond()` API function and `AutoRespondResponse` type |
| `frontend/src/stores/simulationStore.ts` | Added `autoRespond` action that appends both patient and agent messages to transcript |
| `frontend/src/pages/Simulator.tsx` | Dynamic scenario picker from API, Auto-respond button (visible only with scenario-based sessions) |
| `docs/phase-2-plan.md` | Updated Phase 2E tasks to complete |

---

## Decisions Made

1. **Patient simulator uses role-flipping for conversation history.** The orchestrator stores messages from the Healthcare Agent's perspective (patient = "user", agent = "assistant"). The patient simulator flips these roles so from its perspective the patient is the "assistant" generating responses. A prefix "user" message is injected if the flipped conversation starts with an "assistant" message to satisfy Claude API requirements.

2. **Scenario definitions are in-memory, not database-backed.** Scenarios are defined as frozen dataclasses in `backend/scenarios/definitions.py` and registered in a module-level dict. This keeps them simple and versionable in code. They serve double duty: powering auto-respond in the Simulator and (in Phase 3) feeding the eval runner.

3. **Auto-respond returns both patient message and agent response.** The `AutoRespondResponse` schema includes the `patient_message` field alongside the standard agent response fields. This lets the frontend append both messages to the transcript in a single round-trip.

4. **Tool overrides passed through for edge case scenarios.** Scenarios like "No Slots Available" and "Tool Failure During Slot Lookup" include `tool_overrides` dicts (e.g., `{"force_empty": True}`, `{"force_error": True}`) that are forwarded to the orchestrator's `scenario_overrides` parameter and ultimately to `tool_executor.py`.

5. **Auto-respond button conditionally rendered.** The button only appears when the active session has a `scenario_name`, since free conversations have no patient persona to simulate. This avoids confusion about what Auto-respond would do without a scenario.

---

## Challenges and Resolutions

1. **Pre-commit hook line length violations.** Several scenario description strings exceeded the 88-character ruff limit. Fixed by converting to parenthesized string concatenation. Black then reformatted these on the second commit attempt.

2. **Branch protection hook blocked direct commit to main.** The `no-commit-to-branch` pre-commit hook prevented committing directly to main. Created `feat/phase-2e-patient-simulator` branch and committed there.

---

## What's Next: Phase 2F — Scenarios + Secondary Intents (Workflow Routing, Billing, Escalation)

Phase 2F is primarily a testing and tuning phase, not a feature-building phase. The goal is to run each of the 8 built-in scenarios via auto-respond and verify correct agent behavior: intent detection, tool usage, escalation, and routing. Prompt tuning may be needed in `backend/seed/agent_defaults.py` (default agent config) and `backend/prompts/agent_system.py` (prompt assembly). Scenario definitions in `backend/scenarios/definitions.py` may also need adjustments based on observed behavior. See `docs/phase-2-plan.md` Phase 2F section, `docs/launchlab-v1-scope.md` Sections 5-6 (workflow specs), and `docs/launchlab-technical-architecture.md` Section 12 (scenario suite).
