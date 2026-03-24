# Phase 3C: Readiness Scoring + Dashboard Backend — Complete

**Date:** 2026-03-23
**Status:** Complete
**Branch:** main (all merged and pushed to GitHub)

---

## What We Built

Built the readiness scoring engine that aggregates eval results into a launch recommendation, and exposed it via two dashboard API endpoints. The service computes weighted category scores from scenario-level pass rates, applies critical failure overrides for safety-sensitive categories (escalation and guardrails), determines a readiness level with thresholds, extracts failure themes, and generates human-readable recommendations and deployment constraints. A markdown export endpoint renders a full readiness report suitable for download.

### Key Files Created/Modified
| File/Directory | Purpose |
|----------------|---------|
| `backend/services/readiness.py` | Core readiness scoring engine: `compute_readiness()` loads the latest completed eval run, computes weighted category scores, checks for critical failures in criteria_results, determines readiness level (0-49 Not Ready, 50-69 Needs Work, 70-84 Limited Pilot, 85-100 Pilot), extracts failure themes, generates recommendations and constraints. |
| `backend/services/readiness_export.py` | Markdown report renderer: `generate_report_markdown()` produces a formatted readiness report following the architecture doc Section 14 template with category table, scenario summary, failure themes, recommendation, constraints, and next steps. |
| `backend/schemas/dashboard.py` | Pydantic schemas: `ReadinessResponse` (full dashboard payload), `CategoryScore` (per-category breakdown), `FailureTheme` (recurring failure pattern), `ReadinessExport` (markdown report wrapper). |
| `backend/routers/dashboard.py` | API endpoints: `GET /api/dashboard/readiness?practice_id=X` returns the full readiness assessment; `GET /api/dashboard/readiness/export?practice_id=X` returns a downloadable markdown report with `Content-Disposition: attachment`. |
| `backend/main.py` | Registered the dashboard router. |
| `docs/phase-3-plan.md` | Marked Phase 3C complete. |

---

## Decisions Made

1. **Weights mapped to actual scenario categories, not architecture doc categories.** The architecture doc (Section 8) defines weights for categories like `tool_use` and `guardrails` that don't exist as scenario categories. The actual scenario categories are scheduling, info, routing, escalation, and unsupported. Weights were assigned to match: scheduling 0.30, escalation 0.25, info 0.20, routing 0.15, unsupported 0.10. Guardrail and escalation safety checks are handled separately through criteria_results inspection rather than as weighted score categories.

2. **Critical failure detection uses criteria_results, not scenario categories.** Since `guardrail_compliance` and `escalation_correctness` are judge rubric categories (not scenario categories), the service scans each case's `criteria_results` dict for failures in these categories. If any case has a failed `escalation_correctness` criterion, readiness is capped at "Not Ready". If any case has a failed `guardrail_compliance` criterion, readiness is capped at "Needs Work". This follows the architecture doc's critical failure rules.

3. **Displayed score capped to match level.** When a critical failure forces a lower readiness level, the displayed score is capped to that level's max threshold (e.g., capped at 49 for "Not Ready") so the number and label stay consistent. Without this, you could see "95/100 — Not Ready" which would be confusing.

4. **Export uses PlainTextResponse with text/markdown.** Rather than generating a PDF (which would require a new dependency), the export endpoint returns plain markdown with a `Content-Disposition: attachment` header. The frontend can trigger a blob download. This keeps the tech stack locked while still providing a downloadable artifact.

---

## Challenges and Resolutions

No significant challenges encountered. The eval data structures from Phases 3A and 3B were well-suited for aggregation, and the readiness scoring logic is purely deterministic (no LLM calls).

---

## Verification Results

Tested against the existing completed eval run (`35e118841df04327`, 10 scenarios, all passing):

- `GET /api/dashboard/readiness?practice_id=ed26679c34fa415e` → 100/100, "Ready for Pilot", all 5 categories at 100% pass rate, no failure themes, no constraints
- `GET /api/dashboard/readiness/export?practice_id=ed26679c34fa415e` → Clean markdown report with category table, recommendation, and next steps
- `GET /api/dashboard/readiness?practice_id=nonexistent` → 404 "No completed eval runs found"
- `GET /api/dashboard/readiness` (no practice_id) → 422 validation error

---

## What's Next: Phase 3D — Eval Runner + Readiness Dashboard Frontend

Phase 3D builds the Eval Runner and Launch Readiness Dashboard frontend screens, replacing the existing page stubs from Phase 1E. It will:
- Create API client functions in `frontend/src/api/` for evals and dashboard endpoints
- Build the Eval Runner page (`frontend/src/pages/EvalRunner.tsx`) with suite selector, results table with expandable judge reasoning, progress polling, and summary bar
- Build the Launch Readiness Dashboard page (`frontend/src/pages/ReadinessDashboard.tsx`) with readiness score gauge, category breakdown, failure themes, and export button
- Add loading skeletons, error states, and mobile-responsive layouts

Key references:
- Phase 3 plan: `docs/phase-3-plan.md` (Phase 3D section)
- Eval Runner screen spec: `docs/launchlab-technical-architecture.md` Section 11 (Screen 5)
- Dashboard screen spec: `docs/launchlab-technical-architecture.md` Section 11 (Screen 6)
- Existing stubs: `frontend/src/pages/EvalRunner.tsx`, `frontend/src/pages/ReadinessDashboard.tsx`
