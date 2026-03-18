# Phase 1D: Orchestrator + Conversation Test — Complete

**Date:** 2026-03-18
**Status:** Complete
**Branch:** feat/phase-1e-frontend-scaffold (includes 1D commit, branched from feat/phase-1d-orchestrator)

---

## What We Built

The core orchestrator — the agent loop that receives a user message, assembles a dynamic system prompt from practice config + agent config, calls Claude with tool definitions, handles tool_use responses in a loop, checks escalation triggers, and returns the final response. Also built the simulation session APIs to create and interact with conversations via REST.

### Key Files Created/Modified
| File/Directory | Purpose |
|----------------|---------|
| `backend/prompts/__init__.py` | Package init for prompts module |
| `backend/prompts/agent_system.py` | Dynamic system prompt assembly from practice + agent config |
| `backend/services/orchestrator.py` | Core agent loop: Claude API calls, tool dispatch, escalation checking |
| `backend/services/simulation_service.py` | Session management: create sessions, process messages, build transcripts |
| `backend/schemas/simulation.py` | Pydantic schemas for simulation requests/responses |
| `backend/routers/simulations.py` | REST endpoints: POST /api/simulations, POST /api/simulations/{id}/messages, GET /api/simulations/{id} |
| `backend/config.py` | Added ANTHROPIC_MODEL setting |
| `backend/main.py` | Registered simulations router |

---

## Decisions Made

1. **System prompt is assembled at call time, not stored.** The prompt is built fresh from the current practice config + agent config on every message. This means config changes take effect immediately without restarting sessions.

2. **Orchestrator returns structured OrchestratorResponse.** Includes the agent's text reply, all tool calls made during the turn, whether escalation was triggered, and the escalation reason. This gives the frontend everything it needs for the trace panel.

3. **Simulation sessions store transcript as JSON.** The full message history (user + assistant + tool results) is stored in a JSON column on the SimulationSession model, rebuilt on each turn from the conversation history.

---

## Challenges and Resolutions

1. **Tool loop termination** — The agent loop needed clear exit conditions: stop on a text-only response (no tool_use blocks), or after a maximum number of iterations to prevent runaway loops. Set max iterations to 10.

2. **Escalation detection timing** — Escalation triggers are checked against the agent's response text after each Claude call, not just at the end. This ensures escalation is caught even if the agent continues with tool calls afterward.

---

## What's Next: Phase 1E — Frontend Scaffold

React + Vite + TypeScript scaffold with Tailwind, shadcn/ui, routing, and page stubs. See `docs/phase-1-plan.md` Phase 1E section.
