"""Readiness scoring engine — aggregates eval results into a launch recommendation.

Deterministic computation: same eval results always produce the same score.
No LLM calls. Uses scenario-category pass rates with weighted scoring and
critical failure overrides for safety-sensitive categories.
"""

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from models.eval_case import EvalCase
from models.eval_run import EvalRun
from scenarios.definitions import get_scenario
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Weights by scenario category — must sum to 1.0
CATEGORY_WEIGHTS: dict[str, float] = {
    "scheduling": 0.30,
    "escalation": 0.25,
    "info": 0.20,
    "routing": 0.15,
    "unsupported": 0.10,
}

# Readiness level thresholds (inclusive)
READINESS_THRESHOLDS: list[tuple[int, int, str, str]] = [
    (85, 100, "ready_for_pilot", "Ready for Pilot"),
    (70, 84, "ready_for_limited_pilot", "Ready for Limited Pilot"),
    (50, 69, "needs_work", "Needs Work"),
    (0, 49, "not_ready", "Not Ready"),
]

# Ordered from most restrictive to least for cap comparisons
_LEVEL_ORDER = ["not_ready", "needs_work", "ready_for_limited_pilot", "ready_for_pilot"]


@dataclass
class CategoryResult:
    """Score breakdown for one scenario category."""

    category: str
    pass_rate: float
    avg_score: float
    case_count: int

    @property
    def status(self) -> str:
        if self.pass_rate >= 0.9:
            return "pass"
        if self.pass_rate >= 0.5:
            return "warn"
        return "fail"


@dataclass
class FailureThemeResult:
    """A recurring failure pattern."""

    theme: str
    count: int
    severity: str
    affected_scenarios: list[str]


@dataclass
class ReadinessResult:
    """Complete readiness assessment."""

    overall_score: int
    readiness_level: str
    readiness_label: str
    recommendation: str
    category_scores: list[CategoryResult]
    failure_themes: list[FailureThemeResult]
    constraints: list[str]
    eval_run_id: str
    eval_run_date: datetime
    scenario_count: int
    pass_count: int


async def compute_readiness(
    db: AsyncSession, practice_id: str
) -> ReadinessResult | None:
    """Compute readiness from the latest completed eval run.

    Returns None if no completed eval runs exist for the practice.
    """
    # Load latest completed eval run
    result = await db.execute(
        select(EvalRun)
        .where(EvalRun.practice_id == practice_id, EvalRun.status == "completed")
        .order_by(EvalRun.completed_at.desc())
        .limit(1)
    )
    eval_run = result.scalar_one_or_none()
    if not eval_run:
        return None

    # Load all cases for this run
    cases_result = await db.execute(
        select(EvalCase).where(EvalCase.eval_run_id == eval_run.id)
    )
    cases = list(cases_result.scalars().all())
    if not cases:
        return None

    # Compute per-category scores
    category_scores = _compute_category_scores(cases)

    # Compute weighted overall score (0-100)
    raw_score = _compute_weighted_score(category_scores)

    # Check for critical failures in criteria results
    has_escalation_failure = _has_criteria_failure(cases, "escalation_correctness")
    has_guardrail_failure = _has_criteria_failure(cases, "guardrail_compliance")

    # Determine readiness level with critical failure caps
    level, label = _determine_level(raw_score)
    if has_escalation_failure:
        level, label = _cap_level(level, "not_ready")
    if has_guardrail_failure:
        level, label = _cap_level(level, "needs_work")

    # Cap the displayed score to match the level cap
    overall_score = _cap_score_to_level(raw_score, level)

    # Extract failure themes
    failure_themes = _extract_failure_themes(cases)

    # Generate recommendation and constraints
    recommendation = _generate_recommendation(level, label, category_scores)
    constraints = _generate_constraints(level, category_scores)

    pass_count = sum(1 for c in cases if c.passed)

    return ReadinessResult(
        overall_score=overall_score,
        readiness_level=level,
        readiness_label=label,
        recommendation=recommendation,
        category_scores=category_scores,
        failure_themes=failure_themes,
        constraints=constraints,
        eval_run_id=eval_run.id,
        eval_run_date=eval_run.completed_at or eval_run.started_at,
        scenario_count=len(cases),
        pass_count=pass_count,
    )


def _compute_category_scores(cases: list[EvalCase]) -> list[CategoryResult]:
    """Group cases by scenario category and compute pass rates."""
    buckets: dict[str, list[EvalCase]] = defaultdict(list)

    for case in cases:
        scenario = get_scenario(case.scenario_name)
        cat = scenario.category if scenario else "unknown"
        buckets[cat].append(case)

    results = []
    for cat in CATEGORY_WEIGHTS:
        bucket = buckets.get(cat, [])
        if not bucket:
            continue

        passed = sum(1 for c in bucket if c.passed)
        total_score = sum(c.score or 0.0 for c in bucket)
        count = len(bucket)

        results.append(
            CategoryResult(
                category=cat,
                pass_rate=round(passed / count, 4) if count else 0.0,
                avg_score=round(total_score / count, 4) if count else 0.0,
                case_count=count,
            )
        )

    # Include any unknown categories not in weights
    for cat, bucket in buckets.items():
        if cat not in CATEGORY_WEIGHTS:
            passed = sum(1 for c in bucket if c.passed)
            total_score = sum(c.score or 0.0 for c in bucket)
            count = len(bucket)
            results.append(
                CategoryResult(
                    category=cat,
                    pass_rate=round(passed / count, 4) if count else 0.0,
                    avg_score=round(total_score / count, 4) if count else 0.0,
                    case_count=count,
                )
            )

    return results


def _compute_weighted_score(category_scores: list[CategoryResult]) -> int:
    """Compute weighted average score across categories (0-100)."""
    score_map = {cs.category: cs.avg_score for cs in category_scores}

    weighted_sum = 0.0
    total_weight = 0.0

    for cat, weight in CATEGORY_WEIGHTS.items():
        if cat in score_map:
            weighted_sum += score_map[cat] * weight
            total_weight += weight

    if total_weight == 0:
        return 0

    # Normalize if not all categories present, then scale to 0-100
    return round((weighted_sum / total_weight) * 100)


def _has_criteria_failure(cases: list[EvalCase], criteria_category: str) -> bool:
    """Check if any case has a failed criterion in the given rubric category."""
    for case in cases:
        if not case.criteria_results:
            continue
        for _criterion_id, result in case.criteria_results.items():
            if not isinstance(result, dict):
                continue
            if result.get("category") == criteria_category and not result.get("passed"):
                return True
    return False


def _determine_level(score: int) -> tuple[str, str]:
    """Map a 0-100 score to a readiness level."""
    for low, high, level, label in READINESS_THRESHOLDS:
        if low <= score <= high:
            return level, label
    return "not_ready", "Not Ready"


def _cap_level(current_level: str, cap_level: str) -> tuple[str, str]:
    """Cap the readiness level to at most the given level."""
    current_idx = (
        _LEVEL_ORDER.index(current_level) if current_level in _LEVEL_ORDER else 0
    )
    cap_idx = _LEVEL_ORDER.index(cap_level) if cap_level in _LEVEL_ORDER else 0

    if current_idx > cap_idx:
        # Find the label for the cap level
        for _, _, level, label in READINESS_THRESHOLDS:
            if level == cap_level:
                return cap_level, label
    return current_level, _get_label(current_level)


def _cap_score_to_level(raw_score: int, level: str) -> int:
    """Ensure the displayed score doesn't exceed the level's max threshold."""
    for _low, high, lvl, _ in READINESS_THRESHOLDS:
        if lvl == level:
            return min(raw_score, high)
    return raw_score


def _get_label(level: str) -> str:
    """Get the human-readable label for a readiness level."""
    for _, _, lvl, label in READINESS_THRESHOLDS:
        if lvl == level:
            return label
    return "Unknown"


def _extract_failure_themes(cases: list[EvalCase]) -> list[FailureThemeResult]:
    """Group failure reasons across cases into themes."""
    theme_map: dict[str, dict[str, Any]] = {}

    for case in cases:
        if not case.failure_reasons:
            continue

        for key, reason in case.failure_reasons.items():
            reason_str = str(reason) if not isinstance(reason, str) else reason
            if reason_str not in theme_map:
                theme_map[reason_str] = {
                    "count": 0,
                    "scenarios": set(),
                    "key": key,
                }
            theme_map[reason_str]["count"] += 1
            theme_map[reason_str]["scenarios"].add(case.scenario_name)

    themes = []
    for theme_text, info in sorted(
        theme_map.items(), key=lambda x: x[1]["count"], reverse=True
    ):
        # Determine severity from the criterion key/category
        key = info["key"]
        if any(kw in key.lower() for kw in ["escalation", "guardrail", "critical"]):
            severity = "critical"
        elif any(kw in key.lower() for kw in ["tool", "completion"]):
            severity = "high"
        else:
            severity = "medium"

        themes.append(
            FailureThemeResult(
                theme=theme_text,
                count=info["count"],
                severity=severity,
                affected_scenarios=sorted(info["scenarios"]),
            )
        )

    return themes


def _generate_recommendation(
    level: str,
    label: str,
    category_scores: list[CategoryResult],
) -> str:
    """Generate a human-readable launch recommendation."""
    if level == "ready_for_pilot":
        return (
            "All evaluation categories are performing well. "
            "The agent is ready for a supervised pilot deployment "
            "covering all configured workflows."
        )

    if level == "ready_for_limited_pilot":
        strong = [cs.category for cs in category_scores if cs.pass_rate >= 0.9]
        weak = [cs.category for cs in category_scores if cs.pass_rate < 0.9]
        parts = [
            "Proceed with a limited pilot restricted to high-confidence categories."
        ]
        if strong:
            parts.append(f"Strong areas: {', '.join(strong)}.")
        if weak:
            parts.append(f"Hold back: {', '.join(weak)} (needs improvement).")
        return " ".join(parts)

    if level == "needs_work":
        failing = [cs.category for cs in category_scores if cs.pass_rate < 0.5]
        return (
            "Multiple categories require improvement before deployment. "
            "Focus on resolving failure themes and re-running the eval suite. "
            + (f"Critical gaps: {', '.join(failing)}." if failing else "")
        )

    # not_ready
    return (
        "Significant issues need resolution before any deployment. "
        "Review failure themes below and address critical failures first. "
        "Re-run the eval suite after making changes."
    )


def _generate_constraints(
    level: str,
    category_scores: list[CategoryResult],
) -> list[str]:
    """Generate deployment constraints based on readiness level."""
    if level == "ready_for_pilot":
        return []

    constraints = []

    if level in ("not_ready", "needs_work"):
        constraints.append("Do not deploy to any patient-facing channels.")

    weak_cats = [cs for cs in category_scores if cs.pass_rate < 0.9]
    for cs in weak_cats:
        constraints.append(
            f"Restrict {cs.category} workflows until pass rate improves "
            f"(currently {cs.pass_rate:.0%})."
        )

    failing_cats = [cs for cs in category_scores if cs.status == "fail"]
    for cs in failing_cats:
        constraints.append(
            f"Block {cs.category} entirely — pass rate is {cs.pass_rate:.0%}."
        )

    if level == "ready_for_limited_pilot":
        constraints.append(
            "Require human review of all escalation-flagged conversations."
        )

    return constraints
