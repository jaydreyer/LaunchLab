# Phase 2D: Trace Panel + Simulation Trace Detail Page — Complete

**Date:** 2026-03-19
**Status:** Complete
**Branch:** main (all merged and pushed to GitHub)

---

## What We Built

Added a `GET /api/simulations/{id}/tool_calls` endpoint to retrieve persisted tool call records from the database. Enhanced the Simulator's inline trace panel with color-coded status badges (green for success, red for error), tool call duration display, and a "View Full Trace" button that navigates to the detail page. Built the full SimulationTrace detail page replacing the stub, with a timeline that interleaves chat messages and tool call annotations in the correct conversational order, plus escalation and outcome cards at the bottom.

### Key Files Created/Modified
| File/Directory | Purpose |
|----------------|---------|
| `backend/schemas/tool_call.py` | New `ToolCallResponse` Pydantic schema for the tool calls endpoint |
| `backend/routers/simulations.py` | Added `GET /api/simulations/{id}/tool_calls` endpoint |
| `backend/services/simulation_service.py` | Added `get_tool_calls()` service function querying ToolCall table |
| `frontend/src/api/simulations.ts` | Added `ToolCallRecord` interface and `getToolCalls()` API function; widened `ChatMessage.content` type to handle content block arrays |
| `frontend/src/stores/simulationStore.ts` | Added `duration_ms` to `TrackedToolCall` interface |
| `frontend/src/components/simulator/TracePanel.tsx` | Enhanced with green/red status badges, duration display, and "View Full Trace" nav button; accepts new `sessionId` prop |
| `frontend/src/pages/Simulator.tsx` | Passes `sessionId` to TracePanel |
| `frontend/src/pages/SimulationTrace.tsx` | Full replacement of stub — timeline page with session metadata, interleaved messages and tool calls, escalation card, outcome card |
| `frontend/src/components/simulator/ChatBubble.tsx` | Added `extractText()` helper to handle non-string content blocks without crashing |
| `.claude/launch.json` | Preview server config for Claude Code |
| `docs/phase-2-plan.md` | Updated Phase 2D tasks to complete |

---

## Decisions Made

1. **Tool call timeline placement uses content block structure.** Messages from the Claude API can contain arrays of content blocks (tool_use, tool_result, text) instead of plain strings. The timeline builder walks the message array and uses tool_result blocks as markers to associate DB tool call records with the correct assistant response. This is more reliable than timestamp-based heuristics.

2. **Non-string message content handled defensively.** The orchestrator stores raw Claude API messages in the DB, which include tool_use and tool_result content blocks as arrays. Both `ChatBubble` and `SimulationTrace` now use `extractText()` / `extractTextContent()` helpers that extract displayable text from any content format and return `null` for internal-only messages. This prevents React rendering crashes.

3. **Tool call records served from dedicated endpoint.** Rather than embedding tool calls in the simulation response (which would change the existing contract), a separate `GET /api/simulations/{id}/tool_calls` endpoint returns the full `ToolCall` records including `duration_ms` and `created_at` — data not available in the inline `ToolCallOut` returned by the message endpoint.

4. **Outcome parsed from JSON string.** The `SimulationSession.outcome` field stores a JSON string (e.g., `{"status": "escalated", "escalation": {...}}`). The trace page parses this to render the appropriate outcome badge and escalation card.

---

## Challenges and Resolutions

1. **React crash from non-string message content.** The SimulationTrace page crashed with a React error in `<p>` components because some messages had `content` as an array of objects (Claude API tool_use/tool_result blocks) rather than strings. Fixed by adding content extraction helpers that filter for text blocks and skip internal messages.

2. **Tool calls placed before wrong assistant messages.** The initial timeline builder greedily inserted all tool calls before the first assistant message, causing `lookup_appointment_slots` to appear at the top of the conversation. Rewrote the builder to use the content block structure (tool_use in assistant messages, tool_result in user messages) to correctly associate each tool call with its corresponding turn.

3. **Prettier reformatted files on commit.** Two files were reformatted by the Prettier pre-commit hook. Re-staged the formatted files and committed successfully on the second attempt.

---

## What's Next: Phase 2E — Patient Simulator (LLM-Powered Auto-Respond)

Build the patient simulator — the second LLM subsystem. Create scenario definitions in `backend/scenarios/` with persona prompts and expected outcomes. Implement `backend/services/patient_simulator.py` to generate realistic patient messages using a separate Claude API call. Add `GET /api/scenarios` and `POST /api/simulations/{id}/auto_responses` endpoints. Update the Simulator frontend to populate the scenario picker from the API and add an "Auto-respond" button. See `docs/phase-2-plan.md` Phase 2E section, `docs/launchlab-technical-architecture.md` Section 5 (Patient Simulator) and Section 9 (Scenario Endpoints).
