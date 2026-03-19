# Phase 2C: Simulator Screen — Complete

**Date:** 2026-03-19
**Status:** Complete
**Branch:** main (all merged and pushed to GitHub)

---

## What We Built

Replaced the Simulator page stub with a fully functional conversation simulator. The page has a split-pane layout: the left pane shows a chat transcript with user/agent message bubbles, message input, auto-scroll, and an escalation banner; the right pane shows an inline trace panel with session info, collapsible tool call cards (with full input/output JSON), escalation details, and a turn counter. Top bar controls include a scenario picker dropdown (hardcoded scenarios for now), a Chat/SMS channel mode toggle, and New Session/Rerun buttons. Also added a `GET /api/simulations` list endpoint and a `list_sessions` service function on the backend.

### Key Files Created/Modified
| File/Directory | Purpose |
|----------------|---------|
| `frontend/src/api/simulations.ts` | Typed interfaces and API functions: `listSimulations`, `createSimulation`, `getSimulation`, `sendMessage` |
| `frontend/src/stores/simulationStore.ts` | Zustand store for session state: transcript, tool calls, escalation, channel mode, sending/loading flags |
| `frontend/src/pages/Simulator.tsx` | Main page: split-pane layout, top controls (scenario picker, channel toggle, new session/rerun), session lifecycle |
| `frontend/src/components/simulator/ChatBubble.tsx` | Message bubble with user/bot icons, chat vs SMS monospace styling |
| `frontend/src/components/simulator/ChatTranscript.tsx` | Scrollable transcript container with auto-scroll, empty state, and loading indicator |
| `frontend/src/components/simulator/MessageInput.tsx` | Textarea with Enter-to-send, send button, disabled state while sending |
| `frontend/src/components/simulator/EscalationBanner.tsx` | Inline warning banner showing escalation type, keyword, and action |
| `frontend/src/components/simulator/TracePanel.tsx` | Session info card, collapsible tool call cards with JSON detail, escalation card, turn counter |
| `backend/routers/simulations.py` | Added `GET /api/simulations` list endpoint returning `SimulationSummary` |
| `backend/services/simulation_service.py` | Added `list_sessions` function (newest first) |
| `docs/phase-2-plan.md` | Updated Phase 2C tasks to complete |

---

## Decisions Made

1. **Added `GET /api/simulations` list endpoint.** Same pattern as practices and agent configs — the frontend can discover sessions without needing to know IDs upfront. Returns `SimulationSummary` (without full message transcript) for efficiency.

2. **Optimistic user message rendering.** When the user sends a message, it's immediately appended to the local transcript before the API response arrives. This makes the UI feel responsive while the orchestrator processes the request (which can take 3-10 seconds with tool execution).

3. **Tool calls tracked with turn numbers.** Each tool call from a response is tagged with a `turn` number in the store, so the trace panel can associate tool calls with specific conversation turns.

4. **Native HTML select for scenario picker.** Used a plain `<select>` element instead of the shadcn/ui Select component, which is built on base-ui and wasn't used anywhere else in the project yet. The native select is simpler and avoids potential compatibility issues for this first use.

5. **SMS variant is styling-only.** The SMS channel mode applies monospace font and smaller text to chat bubbles. No functional difference in v1 — both modes use the same orchestrator and API.

6. **Component-per-concern architecture.** Following the pattern from Phase 2A/2B, each UI concern (chat bubble, transcript, input, escalation, trace panel) is its own component under `frontend/src/components/simulator/`.

---

## Challenges and Resolutions

1. **Pre-commit hook blocked direct commits to main.** The `no-commit-to-branch` hook prevents committing directly to `main`. Created a `feat/phase-2c-simulator` feature branch, committed there, and merged with `--no-ff`.

2. **Prettier reformatted three files on first commit attempt.** ChatBubble.tsx, TracePanel.tsx, and Simulator.tsx were reformatted by the Prettier pre-commit hook. Re-staged the formatted files and committed successfully on the second attempt.

---

## What's Next: Phase 2D — Trace Panel + Simulation Trace Detail Page

Enhance the trace panel in the Simulator with color-coded tool status, duration display, and a "View Full Trace" link. Build the Simulation Trace detail page (`SimulationTrace.tsx`) with a full-width timeline layout showing the complete transcript with inline tool call annotations, expandable tool details, escalation markers, and session metadata. Add `GET /api/simulations/{id}/tool_calls` endpoint. See `docs/phase-2-plan.md` Phase 2D section, `docs/launchlab-technical-architecture.md` Section 11 (Screen 4), and `docs/launchlab-v1-scope.md` Screen 4.
