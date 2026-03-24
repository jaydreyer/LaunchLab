# Phase 3A: Eval Runner Backend — Complete

**Date:** 2026-03-23
**Status:** Complete
**Branch:** main (all merged and pushed to GitHub)

---

## What We Built

Built the eval runner service that programmatically executes all 10 scenarios end-to-end using the patient simulator and orchestrator, capturing structured actual behavior for each case. Added `expected_behavior` dicts to all scenario definitions so the LLM-as-Judge (Phase 3B) can compare expected vs. actual. Created the eval API endpoints for triggering runs and retrieving results.

### Key Files Created/Modified
| File/Directory | Purpose |
|----------------|---------|
| `backend/services/eval_runner.py` | Core eval runner: `run_suite()` orchestrates all 10 scenarios, `_run_scenario()` loops patient simulator + orchestrator per scenario, `_extract_actual_behavior()` captures structured facts from conversations |
| `backend/routers/evals.py` | Three endpoints: `POST /api/eval_runs` (start run), `GET /api/eval_runs` (list), `GET /api/eval_runs/{id}` (detail with cases) |
| `backend/schemas/eval.py` | Pydantic schemas: `EvalRunCreate`, `EvalRunResponse`, `EvalRunSummary`, `EvalCaseResponse` |
| `backend/scenarios/definitions.py` | Added `expected_behavior` dict field to `ScenarioDefinition` dataclass; added structured expected behaviors to all 10 scenarios |
| `backend/schemas/scenario.py` | Added `expected_behavior` field to `ScenarioResponse` and `ScenarioSummary` |
| `backend/main.py` | Registered evals router |

---

## Decisions Made

1. **Synchronous eval execution on POST.** The `POST /api/eval_runs` endpoint runs the full suite synchronously and returns 202 when done. For 10 scenarios with up to 12 turns each, this is a long request. This is acceptable for a portfolio project — the frontend will poll `GET /api/eval_runs/{id}` during execution in Phase 3D. If needed, background task execution can be added later.

2. **`awaiting_judgment` status after execution.** Eval runs complete with status `awaiting_judgment` rather than `completed`, since cases don't have scores yet. Phase 3B's judge will update cases with scores and flip the run to `completed`.

3. **Conversation completion detection via farewell heuristics.** The eval runner detects conversation endings by checking for common farewell phrases ("goodbye", "have a great day", "all set", etc.) in both patient and agent messages. Combined with the 12-turn safety cap and escalation detection, this covers all completion scenarios.

4. **Reused simulation_service helper functions.** Rather than duplicating practice/config loading logic, the eval runner imports `_load_practice`, `_load_agent_config`, `_practice_to_dict`, and `_agent_config_to_dict` from `simulation_service`. These are prefixed with underscores (private convention) but stable enough for internal reuse.

5. **Error cases recorded, not skipped.** If a scenario fails with an exception, the eval runner creates an EvalCase with `actual_behavior: {"error": "Scenario execution failed"}` rather than skipping it. This ensures the run summary always accounts for all 10 scenarios.

6. **`expected_behavior` is a structured dict, not free text.** Each scenario's `expected_behavior` uses typed keys like `tools_used` (list), `escalation_triggered` (bool), `identity_collected` (bool). This gives the Phase 3B judge concrete facts to evaluate against, rather than relying solely on the string-based `evaluation_criteria`.

---

## Challenges and Resolutions

No significant challenges in this phase. The existing `auto_respond` pattern in `simulation_service.py` provided a clear template for the eval runner's per-scenario loop. The DB models (`EvalRun`, `EvalCase`) were already created in Phase 1A and required no changes.

---

## What's Next: Phase 3B — LLM-as-Judge Evaluator

Phase 3B builds the third LLM subsystem: the judge that evaluates completed conversations against criteria and produces structured pass/fail scores with reasoning. It will:
- Create the judge system prompt builder (`backend/prompts/judge.py`)
- Create the judge service (`backend/services/judge.py`) that calls Claude to evaluate each EvalCase
- Define rubrics with critical vs. non-critical criteria (`backend/services/judge_rubrics.py`)
- Update the eval runner to call the judge after scenario execution and compute run-level summaries

Key references:
- Phase 3 plan: `docs/phase-3-plan.md` (Phase 3B section)
- Judge architecture: `docs/launchlab-technical-architecture.md` Section 7
- Eval schemas: `backend/schemas/eval.py` (criteria_results, passed, score, failure_reasons fields ready)
- Note: `backend/prompts/judge.py` and `backend/services/judge_rubrics.py` already exist as uncommitted files from a prior session — review these as a starting point for 3B
