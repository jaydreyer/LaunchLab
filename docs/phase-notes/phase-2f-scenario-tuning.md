# Phase 2F: Scenarios + Secondary Intents (Workflow Routing, Billing, Escalation) — Complete

**Date:** 2026-03-20
**Status:** Complete
**Branch:** main (all merged and pushed to GitHub)

---

## What We Built

Ran all 8 original scenarios via auto-respond and verified agent behavior end-to-end. Found and fixed three bugs: the `no_slots_available` scenario's `force_empty` override was ignored because the appointment slots tool only had `force_failure` support, the `tool_failure_slot_lookup` scenario used `force_error` instead of the tool's `force_failure` parameter, and the agent wasn't requiring DOB verification before scheduling changes. Added two new scenarios (`insurance_question` and `unsupported_request`) bringing the total to 10. Fixed patient persona prompts that referenced a non-existent "Riverside" location. Added `evaluation_criteria` to the scenario list endpoint for Phase 3 eval readiness.

### Key Files Created/Modified
| File/Directory | Purpose |
|----------------|---------|
| `backend/tools/appointment_slots.py` | Added `force_empty` parameter support — returns empty slots list when enabled |
| `backend/scenarios/definitions.py` | Fixed `force_error` → `force_failure` override key, fixed "Riverside" → "Northside" in 3 personas, added `insurance_question` and `unsupported_request` scenarios |
| `backend/seed/agent_defaults.py` | Added identity verification requirement (name + DOB) to default system prompt |
| `backend/schemas/scenario.py` | Added `evaluation_criteria` field to `ScenarioSummary` schema |
| `backend/routers/scenarios.py` | Updated list endpoint to include `evaluation_criteria` in response |
| `docs/phase-2-plan.md` | Marked Phase 2F tasks complete, updated overall status to complete |

---

## Decisions Made

1. **Identity verification added to system prompt, not workflow steps.** The agent was skipping DOB collection during rescheduling. Rather than restructuring the workflow steps config, the fix was adding an explicit instruction in the default system prompt: "you MUST collect the patient's full name AND date of birth for identity verification before proceeding with any appointment changes." This is more direct and reliable for the LLM to follow.

2. **`force_empty` returns success with zero slots, not an error.** The `no_slots_available` scenario needed to simulate legitimate empty availability (not a system failure). The tool returns `status: "success"` with an empty `slots` array and a human-readable `message` field. This lets the agent distinguish "no availability" from "system down."

3. **Scenario personas updated to use real locations only.** Three personas referenced a "Riverside" location that doesn't exist in BrightCare data. While the agent handled this gracefully (correcting the patient), it wasted conversation turns and made evaluation harder. Updated to "Northside" to keep scenarios focused on their intended test cases.

4. **10 scenarios covering 5 categories.** The final scenario suite covers: scheduling (5), info (2), routing (1), escalation (1), unsupported (1). This maps directly to the v1 scope's 10-case eval suite.

5. **`evaluation_criteria` exposed on list endpoint.** Originally only available on the detail endpoint, the eval criteria were added to `ScenarioSummary` so the Phase 3 eval runner can fetch all scenario metadata in a single API call.

---

## Challenges and Resolutions

1. **Tool override parameter naming mismatch.** The scenario definitions used `force_error` and `force_empty` as override keys, but the appointment slots tool parameter was `force_failure`. Since `**kwargs` absorbed unknown parameters silently, the overrides were ignored without any error. Fixed by adding `force_empty` to the tool and changing the scenario's `force_error` to `force_failure`.

2. **Agent config reset creates new IDs.** Resetting the agent config via `POST /api/agent_config_resets` deletes the old config and creates a new one with a different ID. Existing simulation sessions that reference the old config ID then fail with 500 errors. This is acceptable for a testing/tuning phase but may need a migration strategy for Phase 3 if configs are reset during eval runs.

3. **Agent skipping identity verification.** The original system prompt didn't explicitly require DOB collection. The agent would proceed after getting just the patient's name in some scenarios. Adding the explicit instruction in the system prompt fixed the behavior across all scheduling scenarios.

---

## Scenario Test Results Summary

| Scenario | Category | Status | Key Behaviors Verified |
|----------|----------|--------|----------------------|
| `reschedule_appointment` | scheduling | Pass | Info collection, slot lookup, confirmation |
| `book_annual_physical` | scheduling | Pass | New patient handling, insurance check, booking |
| `missing_info_reschedule` | scheduling | Pass | DOB verification before proceeding |
| `no_slots_available` | scheduling | Pass | Empty result handling, callback offer |
| `tool_failure_slot_lookup` | scheduling | Pass | Error handling, no data fabrication, callback |
| `ask_clinic_hours` | info | Pass | Tool use, accurate hours/address |
| `billing_question` | routing | Pass | Route to billing, no specifics answered |
| `urgent_symptom` | escalation | Pass | Stopped scheduling, immediate escalation |
| `insurance_question` | info | Pass | Uncertain result communicated honestly |
| `unsupported_request` | unsupported | Pass | Recognized scope boundary, offered alternative |

---

## What's Next: Phase 3 — Evals + Readiness

Phase 3 builds the eval runner (third LLM subsystem — LLM-as-Judge) and the launch readiness dashboard. The eval runner will execute the 10 scenarios automatically, score agent behavior against `evaluation_criteria`, and produce pass/fail results. The readiness dashboard will aggregate eval results into category pass rates, failure themes, and a launch recommendation.

Key references:
- Eval runner design: `docs/launchlab-technical-architecture.md` Section 7 (LLM-as-Judge)
- Eval models: `docs/launchlab-implementation-checklist.md` Epic 8
- Readiness dashboard: `docs/launchlab-implementation-checklist.md` Epic 9
- Phase 3 plan: `docs/phase-3-plan.md` (if it exists, otherwise create during Phase 3 kickoff)
- Scenario suite: `backend/scenarios/definitions.py` (10 scenarios with eval criteria ready)
