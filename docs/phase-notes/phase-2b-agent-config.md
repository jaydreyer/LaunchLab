# Phase 2B: Agent Config Screen — Complete

**Date:** 2026-03-18
**Status:** Complete
**Branch:** main (all merged and pushed to GitHub)

---

## What We Built

Replaced the Agent Config page stub with a fully functional two-column configuration screen. The left column contains editable sections for all six agent config fields (system prompt, workflow steps, guardrails, escalation triggers, tool policy, tone guidelines). The right column shows a live preview of the assembled system prompt as Claude would receive it at runtime, fetched from a new backend preview endpoint. Also added a `GET /api/agent_configs` list endpoint and a `POST /api/agent_config_previews` endpoint, following the same patterns established in Phase 2A.

### Key Files Created/Modified
| File/Directory | Purpose |
|----------------|---------|
| `frontend/src/api/agentConfigs.ts` | Typed interfaces and API functions: `listAgentConfigs`, `getAgentConfig`, `updateAgentConfig`, `resetAgentConfig`, `previewAgentConfig` |
| `frontend/src/stores/agentConfigStore.ts` | Zustand store for agent config state: fetch, save, reset, preview with loading/saving/error flags |
| `frontend/src/pages/AgentConfig.tsx` | Main page: two-column layout (editor left, preview right), Save/Reset buttons, loading/error states |
| `frontend/src/components/agent-config/SystemPromptSection.tsx` | Textarea editor for the agent's core system prompt |
| `frontend/src/components/agent-config/WorkflowStepsSection.tsx` | Ordered list editor with add/remove/reorder (up/down arrows) |
| `frontend/src/components/agent-config/GuardrailsSection.tsx` | Editable rule list with numbered badges, add/remove |
| `frontend/src/components/agent-config/EscalationTriggersSection.tsx` | Cards with type, action inputs, and keyword badge lists with add/remove |
| `frontend/src/components/agent-config/ToolPolicySection.tsx` | Toggle switches per tool with constraint labels (required_before, use_when) |
| `frontend/src/components/agent-config/ToneGuidelinesSection.tsx` | Tone text input + numbered style rules list with add/remove |
| `frontend/src/components/agent-config/PromptPreviewPanel.tsx` | Sticky right-column panel showing assembled prompt in a monospace `<pre>` block |
| `frontend/src/components/ui/textarea.tsx` | New shadcn/ui textarea component |
| `backend/routers/agent_configs.py` | Added `GET /api/agent_configs` list endpoint and `POST /api/agent_config_previews` preview endpoint |
| `backend/schemas/agent_config_preview.py` | Pydantic request/response schemas for the preview endpoint |
| `backend/services/agent_config_service.py` | Added `list_agent_configs` service function |
| `backend/main.py` | Registered `preview_router` |
| `docs/phase-2-plan.md` | Updated Phase 2B tasks to complete |

---

## Decisions Made

1. **Added `GET /api/agent_configs` list endpoint.** Same pattern as practices — the frontend auto-discovers the agent config on page load without needing to know the ID upfront. Since v1 has one practice and one config, the frontend takes the first result.

2. **Server-side prompt preview via `POST /api/agent_config_previews`.** Rather than duplicating the `assemble_system_prompt` logic in JavaScript, the frontend POSTs the current config fields + practice_id to the backend, which fetches the practice data and runs the Python assembly function. This keeps prompt assembly logic in one place and ensures the preview matches exactly what the orchestrator would use.

3. **Plain textarea for system prompt editor.** The architecture doc mentions CodeMirror 6 for the prompt editor, but adding it would require a new dependency. Used a plain textarea with monospace font — sufficient for v1 and avoids dependency approval overhead.

4. **Component-per-section architecture.** Following the Phase 2A pattern, each config section is its own component under `frontend/src/components/agent-config/`. The parent page owns full config state and passes slices + onChange callbacks.

5. **Preview refreshes on save, not on every keystroke.** The preview calls the backend endpoint after save completes and on initial load. This avoids excessive API calls during editing while still showing the assembled prompt.

---

## Challenges and Resolutions

1. **Pre-commit formatting.** Black reformatted two backend files and Prettier reformatted three frontend files on the first commit attempt. Re-staged the formatted files and committed successfully on the second attempt.

---

## What's Next: Phase 2C — Simulator Screen (Chat UI + Session Management)

Build the Simulator page with chat transcript UI, message input, inline trace panel, session lifecycle management, and scenario picker. This is the core simulation experience where users run conversations with the healthcare agent. See `docs/phase-2-plan.md` Phase 2C section, `docs/launchlab-technical-architecture.md` Section 11 (Screen 3), and `docs/launchlab-v1-scope.md` Screen 3.
