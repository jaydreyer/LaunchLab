# Phase 3B: LLM-as-Judge Evaluator — Complete

**Date:** 2026-03-23
**Status:** Complete
**Branch:** main (all merged and pushed to GitHub)

---

## What We Built

Built the third LLM subsystem — the LLM-as-Judge — that evaluates completed conversation transcripts against scenario-defined criteria and produces structured pass/fail scores with reasoning. Updated the eval runner to call the judge after scenario execution, compute weighted scores, detect critical failures, and aggregate run-level summaries. All three LLM subsystems (Healthcare Agent, Patient Simulator, Judge) are now architecturally separate and working together.

### Key Files Created/Modified
| File/Directory | Purpose |
|----------------|---------|
| `backend/prompts/judge.py` | Judge system prompt and user message assembly. Uses `tool_use` pattern with a `submit_evaluation` tool to force structured JSON output from Claude. |
| `backend/services/judge.py` | Core judge service: `evaluate_case()` calls Claude, parses tool_use response, aligns evaluations to criteria, computes scores, and updates EvalCase records. Includes retry logic (1 retry) and `judge_error` fallback. |
| `backend/services/judge_rubrics.py` | Rubric engine: converts scenario `evaluation_criteria` strings into structured `Criterion` objects with auto-inferred categories, critical flags, and weights. Provides `compute_weighted_score()` and `check_critical_failures()`. |
| `backend/services/eval_runner.py` | Updated: added `"judging"` status phase, judge call loop for each case, `_compute_run_summary()` with overall_pass_rate, pass_rate_by_category, overall_score, and failed_scenarios list. Run now transitions to `"completed"` (was `"awaiting_judgment"`). |
| `docs/phase-3-plan.md` | Marked Phase 3B tasks complete |

---

## Decisions Made

1. **`tool_use` with `tool_choice` for structured output.** Rather than relying on JSON mode or text parsing, the judge is forced to call a `submit_evaluation` tool via `tool_choice: {"type": "tool", "name": "submit_evaluation"}`. This guarantees structured output with the exact schema needed — no regex parsing or JSON extraction required.

2. **Criteria auto-inferred from free-text descriptions.** Rather than requiring scenario authors to manually tag each criterion with a category and weight, `judge_rubrics.py` infers categories from keyword patterns in the criterion description (e.g., "escalat" → `escalation_correctness`, "fabricat" → `guardrail_compliance`). This keeps scenario definitions clean and human-readable while still producing structured rubrics for scoring.

3. **Critical categories: escalation_correctness and guardrail_compliance.** These are the two categories where failure means the agent is unsafe to deploy. Critical criteria get 2x weight and trigger automatic overall case failure regardless of other scores. This matches the architecture doc's requirement that safety failures override everything.

4. **Eval run status flow: running → judging → completed.** Added a `"judging"` intermediate status so the frontend (Phase 3D) can distinguish between "still executing scenarios" and "scenarios done, scoring in progress." Previously the run went straight from `"running"` to `"awaiting_judgment"`.

5. **Evaluation alignment by criterion ID.** The judge returns evaluations keyed by `criterion_id` (c0, c1, etc.). The `_align_evaluations()` function matches these back to criteria by ID, handling mismatches gracefully — if the judge skips a criterion, it's treated as failed with a "Judge did not evaluate this criterion" reason.

---

## Challenges and Resolutions

1. **Anthropic API `529 Overloaded` during verification.** The configured model (`claude-sonnet-4-5-20250929`) was returning 529 errors during the live eval run. Verified by testing a simple "say hello" prompt. Switched to `claude-sonnet-4-20250514` via `ANTHROPIC_MODEL` env var override and the full 10-scenario run completed successfully. This is a transient API issue, not a code bug.

2. **No code bugs encountered.** All three new files imported cleanly, the rubric smoke test produced correct category/weight assignments, and the full eval run (10 scenarios × judge calls) completed with proper per-criterion results, scores, and reasoning on the first attempt.

---

## Verification Results

Full eval run (`35e118841df04327`) completed 2026-03-23 with all 10 scenarios judged:

| Category | Scenarios | Pass Rate | Avg Score |
|----------|-----------|-----------|-----------|
| scheduling | 5 | 100% | 1.0 |
| info | 2 | 100% | 1.0 |
| routing | 1 | 100% | 1.0 |
| escalation | 1 | 100% | 1.0 |
| unsupported | 1 | 100% | 1.0 |

Every criterion across all 10 scenarios received clear, evidence-based reasoning from the judge (e.g., "The agent immediately detected and responded to the urgent symptom keywords when the user mentioned 'chest tightness since yesterday'").

---

## What's Next: Phase 3C — Readiness Scoring + Dashboard Backend

Phase 3C builds the readiness scoring engine that aggregates eval results into a launch recommendation, and exposes it via dashboard API endpoints. It will:
- Create `backend/services/readiness.py` with `compute_readiness()` — weighted category scores, critical failure overrides, readiness level thresholds (0-49 Not Ready, 50-69 Needs Work, 70-84 Limited Pilot, 85-100 Ready)
- Create `backend/services/readiness_export.py` for markdown report generation
- Create `backend/schemas/dashboard.py` and `backend/routers/dashboard.py` with `GET /api/dashboard/readiness` and `GET /api/dashboard/readiness/export`

Key references:
- Phase 3 plan: `docs/phase-3-plan.md` (Phase 3C section)
- Readiness score calculation: `docs/launchlab-technical-architecture.md` Section 8
- Readiness report format: `docs/launchlab-technical-architecture.md` Section 14
- Dashboard screen spec: `docs/launchlab-technical-architecture.md` Section 11 (Screen 6)
