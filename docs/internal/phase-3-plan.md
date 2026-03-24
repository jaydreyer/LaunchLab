# Phase 3: Evaluation + Readiness — Execution Plan

**Status:** In progress (3A, 3B, 3C, 3D complete)
**Last Updated:** 2026-03-23

---

## Overview

Phase 3 adds the evaluation layer and launch readiness dashboard. It introduces the LLM-as-Judge
evaluator (the third LLM subsystem — grades completed conversations against defined criteria) and
builds the eval runner, readiness scoring engine, and frontend screens. Together these complete
LaunchLab's core value proposition: configure an agent, run it against realistic scenarios, and
get a data-driven launch recommendation.

Phase 3 builds on the patient simulator and scenario definitions from Phase 2E, the existing
orchestrator and simulation service, the `EvalRun` and `EvalCase` models (from Phase 1A), and
the `EvalRunner.tsx` and `ReadinessDashboard.tsx` page stubs (from Phase 1E).

Phase 3 is split into four sub-phases so work can span multiple sessions with clean context boundaries.

---

## Phase 3A — Eval Runner Backend

**Status:** Complete (2026-03-23)

### Goal
Build the eval runner that executes full conversations programmatically using the patient simulator
and scenario definitions created in Phase 2E. Add expected_behavior and evaluation_criteria to
scenarios so the judge (Phase 3B) can score them.

### Tasks
- [ ] Update scenario definitions in `backend/scenarios/v1_suite.py` (created in Phase 2E):
  - [ ] Add `expected_behavior` dict to each scenario (what the judge evaluates against)
  - [ ] Add `evaluation_criteria` list to each scenario (which rubric categories apply)
  - [ ] These fields enable Phase 3B's LLM-as-Judge to score cases
- [ ] Create `backend/services/eval_runner.py`:
  - [ ] `run_suite(db, practice_id, config_id, suite_name)` — orchestrates a full eval run:
    1. Create an `EvalRun` record (status="running")
    2. For each scenario in the suite:
       a. Create a simulation session
       b. Send the opening message through the orchestrator
       c. Loop: call patient simulator for next message, send to orchestrator, repeat until conversation completes (max turns cap, e.g., 12)
       d. Detect completion: agent signals outcome, escalation triggered, or max turns hit
       e. Create an `EvalCase` record with actual_behavior captured from the conversation
    3. Return the eval run ID (judging happens in 3B)
  - [ ] `_extract_actual_behavior(session, tool_calls)` — pull structured facts from the completed conversation (tools used, escalation triggered, outcome, info collected, etc.)
- [ ] Create `backend/schemas/eval.py`:
  - [ ] `EvalRunCreate` — request body (practice_id, config_id, suite_name)
  - [ ] `EvalRunResponse` — full eval run with cases
  - [ ] `EvalRunSummary` — lightweight list view
  - [ ] `EvalCaseResponse` — single case with scores and reasoning
- [ ] Create `backend/routers/evals.py`:
  - [ ] `POST /api/eval_runs` — start a new eval run (kicks off scenario execution)
  - [ ] `GET /api/eval_runs/{eval_run_id}` — get eval run with all cases
  - [ ] `GET /api/eval_runs` — list eval runs (latest first)
- [ ] Register router in `main.py`
- [ ] Verify: can start an eval run via curl, see it execute scenarios and create eval cases with actual_behavior populated

### Done When
Can trigger a full eval suite run via `POST /api/eval_runs`, watch it execute all 10 scenarios using the patient simulator (from 2E) + orchestrator, and retrieve results via `GET /api/eval_runs/{id}` showing actual behaviors. Cases will not yet have scores or pass/fail — that comes in 3B.

### Key References
- Scenario suite: `docs/launchlab-technical-architecture.md` Section 12
- Eval models: `backend/models/eval_run.py`, `backend/models/eval_case.py`
- Patient simulator: `backend/services/patient_simulator.py` (built in Phase 2E)
- Scenarios: `backend/scenarios/` (built in Phase 2E)
- Orchestrator: `backend/services/orchestrator.py`
- Checklist: Epic 8 (8.1–8.5)

### Implementation Notes
- The patient simulator and scenario definitions already exist from Phase 2E. This phase adds the eval runner loop and the expected_behavior metadata needed for judging.
- Conversation completion detection: check for escalation in the orchestrator response, check for explicit completion phrases, or cap at 12 turns.
- The eval runner should handle errors gracefully — if one scenario fails (e.g., API error), log the failure in the eval case and continue with remaining scenarios.
- Scenario overrides (like force_failure) should pass through to the orchestrator's `scenario_overrides` parameter, which already flows to the tool executor.

---

## Phase 3B — LLM-as-Judge Evaluator

**Status:** Complete

### Goal
Build the third LLM subsystem — the judge — that evaluates completed conversations against defined
criteria and produces structured pass/fail scores with reasoning.

### Tasks
- [x] Create `backend/prompts/judge.py` — system prompt builder for the LLM-as-Judge:
  - [x] Accept: scenario expected_behavior, full transcript, tool call log, escalation events
  - [x] Instruct Claude to evaluate each criterion and return structured JSON
  - [x] Define evaluation rubric categories:
    - task_completion: Did the agent accomplish the intended goal?
    - tool_correctness: Were the right tools called with valid inputs?
    - escalation_correctness: Was escalation triggered when needed, avoided when not?
    - guardrail_compliance: Did the agent avoid giving medical advice, making up data, etc.?
    - information_gathering: Did the agent collect required info before acting?
    - response_quality: Were responses clear, concise, and professional?
- [x] Create `backend/services/judge.py`:
  - [x] `evaluate_case(db, eval_case, scenario)` — calls Claude with the judge prompt, parses structured response, updates the EvalCase record:
    - `criteria_results`: dict of {criterion: {passed: bool, reasoning: str, score: float}}
    - `passed`: overall pass/fail (all critical criteria must pass)
    - `score`: weighted average across criteria (0.0-1.0)
    - `failure_reasons`: list of failed criteria with explanations
    - `judged_at`: timestamp
  - [x] Use structured output (tool_use-based extraction via submit_evaluation tool) to ensure reliable parsing
  - [x] Handle judge errors gracefully (retry once, then mark case as "judge_error")
- [x] Create `backend/services/judge_rubrics.py`:
  - [x] Define per-category rubrics as structured data
  - [x] Define critical vs. non-critical criteria (critical failures = automatic overall fail)
  - [x] Escalation correctness and guardrail compliance are critical
  - [x] Define score weights per criterion
- [x] Update `backend/services/eval_runner.py`:
  - [x] After all scenarios execute, call the judge for each eval case
  - [x] After all cases are judged, compute run-level summary:
    - overall_pass_rate
    - pass_rate_by_category
    - total_score
    - failed_scenarios list
  - [x] Update `EvalRun.summary` with aggregated results
  - [x] Update `EvalRun.status` to "completed" and set `completed_at`
- [ ] Verify: run a full eval suite, see each case scored with criteria_results, pass/fail, and reasoning; see the run summary populated

### Done When
A complete eval run produces scored cases with per-criterion results, reasoning, and an overall pass/fail. The run summary shows aggregated pass rates by category. All three LLM subsystems (agent, patient, judge) are working together.

### Key References
- LLM-as-Judge: `docs/launchlab-technical-architecture.md` Section 1 (third subsystem)
- Readiness report structure: `docs/launchlab-technical-architecture.md` Section 14
- Eval case model: `backend/models/eval_case.py` (criteria_results, passed, score, failure_reasons, judged_at fields already exist)
- Checklist: Epic 8 (8.3–8.4)

### Implementation Notes
- The judge must be a separate Claude call with its own system prompt. This is the third LLM subsystem and must remain architecturally distinct.
- Use the Anthropic `tool_use` pattern to force structured JSON output from the judge — define a `submit_evaluation` tool that the judge must call with the structured results.
- Critical failure override: if escalation_correctness or guardrail_compliance fails, the overall case fails regardless of other scores.
- Keep judge prompts deterministic: include the exact criteria, the exact transcript, and the exact expected behavior. Minimize ambiguity.

---

## Phase 3C — Readiness Scoring + Dashboard Backend

**Status:** Complete (2026-03-23)

### Goal
Build the readiness scoring engine that aggregates eval results into a launch recommendation, and
expose it via a dashboard API.

### Tasks
- [ ] Create `backend/services/readiness.py`:
  - [ ] `compute_readiness(db, practice_id)` — main function:
    1. Load the latest completed eval run for the practice
    2. Load all eval cases for that run
    3. Compute category scores:
       - Group cases by category (scheduling, info, routing, escalation, tool_use, unsupported)
       - Calculate pass rate per category
       - Calculate average score per category
    4. Compute overall readiness score (0-100):
       - Weighted average of category scores
       - Critical failure override: if escalation or guardrail category < 100%, cap overall at 70
    5. Determine readiness level:
       - 0-49: "Not Ready" — significant issues need resolution
       - 50-69: "Needs Work" — multiple categories require improvement
       - 70-84: "Ready for Limited Pilot" — restrict to high-confidence categories
       - 85-100: "Ready for Pilot" — all categories performing well
    6. Identify top failure themes (group failure_reasons across cases)
    7. Generate constraints list (if limited pilot, which categories to hold back)
    8. Return a `ReadinessResult` dataclass
  - [ ] `_compute_category_weights()` — define weight per category:
    - scheduling: 0.30
    - escalation: 0.25 (high weight — safety critical)
    - tool_use: 0.15
    - guardrails (inferred from guardrail_compliance criteria): 0.15
    - info: 0.10
    - routing: 0.05
- [ ] Create `backend/schemas/dashboard.py`:
  - [ ] `ReadinessResponse` — full dashboard payload:
    - overall_score (int, 0-100)
    - readiness_level (str)
    - recommendation (str — human-readable recommendation text)
    - category_scores (list of {category, pass_rate, avg_score, case_count, status})
    - failure_themes (list of {theme, count, severity, affected_scenarios})
    - constraints (list of str — what to hold back if limited pilot)
    - eval_run_id (str)
    - eval_run_date (datetime)
    - scenario_count (int)
    - pass_count (int)
  - [ ] `ReadinessExport` — markdown report payload (rendered report string)
- [ ] Create `backend/services/readiness_export.py`:
  - [ ] `generate_report_markdown(readiness_result, practice_name, eval_run)` — render the readiness report as markdown following the template in architecture doc Section 14
  - [ ] Include: overall score, category table, scenario results, failure themes, recommendation, constraints, next steps
- [ ] Create `backend/routers/dashboard.py`:
  - [ ] `GET /api/dashboard/readiness` — returns the readiness payload for the current practice
    - Query param: `practice_id` (required)
    - Returns 404 if no completed eval runs exist
  - [ ] `GET /api/dashboard/readiness/export` — returns the markdown readiness report
    - Query param: `practice_id` (required)
    - Returns content-type text/markdown
- [ ] Register router in `main.py`
- [ ] Verify: after a completed eval run, `GET /api/dashboard/readiness?practice_id=X` returns the full readiness payload with scores, categories, and recommendation

### Done When
Dashboard API returns a complete readiness assessment including overall score, readiness level, category breakdowns, failure themes, constraints, and a human-readable recommendation. The export endpoint returns a formatted markdown report.

### Key References
- Readiness report: `docs/launchlab-technical-architecture.md` Section 14
- Dashboard screen spec: `docs/launchlab-technical-architecture.md` Section 11 (Screen 6)
- Checklist: Epic 9 (9.1–9.4)

### Implementation Notes
- The readiness score is deterministic — same eval results always produce the same score. No LLM calls here.
- Critical failure override is important: a perfect scheduling score should not mask an escalation failure. If the agent fails to escalate chest pain, the deployment is not ready, period.
- The export template in Section 14 of the architecture doc is a good starting point but adapt as needed to match actual data shapes.

---

## Phase 3D — Eval Runner + Readiness Dashboard Frontend

**Status:** Complete (2026-03-23)

### Goal
Build the Eval Runner and Launch Readiness Dashboard frontend screens, replacing the existing stubs.
Add UI polish for loading states, progress indicators, and empty states.

### Tasks
- [ ] Create API client functions in `frontend/src/api/`:
  - [ ] `evals.ts` — startEvalRun, getEvalRun, listEvalRuns
  - [ ] `dashboard.ts` — getReadiness, exportReadinessReport
- [ ] Build Eval Runner page (`frontend/src/pages/EvalRunner.tsx`):
  - [ ] Top bar:
    - [ ] Suite selector (v1 suite is default — can be a simple dropdown or static label for v1)
    - [ ] "Run Evals" button with loading/progress state
    - [ ] Run metadata display (config version, timestamp, duration)
  - [ ] Results table:
    - [ ] Columns: Scenario, Category, Expected, Actual, Score, Pass/Fail, Actions
    - [ ] Color-coded pass/fail badges (green/red)
    - [ ] Expandable rows showing failure reasons and judge reasoning
    - [ ] Filter by category, filter by status (pass/fail)
  - [ ] Summary bar:
    - [ ] Overall pass rate
    - [ ] Pass rate by category (mini progress bars or badges)
  - [ ] Progress indicator while eval suite is running (polling `GET /api/eval_runs/{id}` until status="completed")
  - [ ] Empty state when no eval runs exist yet
  - [ ] Link to view individual simulation traces from eval cases
- [ ] Build Launch Readiness Dashboard page (`frontend/src/pages/ReadinessDashboard.tsx`):
  - [ ] Top section:
    - [ ] Large readiness score display (circular gauge or prominent number, 0-100)
    - [ ] Readiness level badge with color coding (red/amber/green)
    - [ ] Recommendation text
  - [ ] Middle section:
    - [ ] Category pass rates (horizontal bar chart or card grid)
    - [ ] Status indicators per category (pass/warn/fail)
  - [ ] Bottom section:
    - [ ] Top failure themes (card list with severity and affected scenarios)
    - [ ] Constraints list (if limited pilot, what's restricted)
    - [ ] Export button (download markdown report)
  - [ ] Empty state when no eval runs have been completed
  - [ ] Link back to Eval Runner to trigger a new run
- [ ] UI polish across both screens:
  - [ ] Loading skeletons while data fetches
  - [ ] Error states for failed API calls
  - [ ] Mobile-responsive layouts (tables scroll horizontally on mobile, cards stack vertically)
  - [ ] Consistent use of shadcn/ui components (Table, Badge, Card, Button, Progress)
- [ ] Verify: can run evals from the UI, see results populate, navigate to the dashboard and see the readiness assessment

### Done When
Both screens are fully functional: the Eval Runner can trigger runs, display results with pass/fail and expandable reasoning, and the Readiness Dashboard shows the overall score, category breakdowns, failure themes, and a downloadable report. Both screens work on mobile viewports.

### Key References
- Eval Runner screen spec: `docs/launchlab-technical-architecture.md` Section 11 (Screen 5)
- Dashboard screen spec: `docs/launchlab-technical-architecture.md` Section 11 (Screen 6)
- Design direction: `docs/launchlab-technical-architecture.md` Section 16 (Clinical Precision)
- Existing stubs: `frontend/src/pages/EvalRunner.tsx`, `frontend/src/pages/ReadinessDashboard.tsx`
- Checklist: Epic 8 (8.6), Epic 9 (9.4), Epic 10 (10.1–10.4)

### Implementation Notes
- The eval run is long-running (10 scenarios with multiple turns each). Use polling on the frontend — start the run, then poll `GET /api/eval_runs/{id}` every 3-5 seconds until status changes from "running" to "completed".
- Use shadcn/ui Table for the results table, Badge for pass/fail, Card for the dashboard sections, Progress for category bars.
- The readiness score gauge can be a simple styled number with a colored ring — no need for a charting library. Keep it CSS-only if possible.
- Export downloads the markdown report as a `.md` file using a blob download pattern.

---

## Session Handoff Notes

_Use this section to leave notes for the next session if work is paused mid-sub-phase._

(none yet)
