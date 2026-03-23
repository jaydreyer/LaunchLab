"""Pydantic schemas for the readiness dashboard."""

from datetime import datetime

from pydantic import BaseModel


class CategoryScore(BaseModel):
    """Score breakdown for a single evaluation category."""

    category: str
    pass_rate: float
    avg_score: float
    case_count: int
    status: str  # "pass", "warn", "fail"


class FailureTheme(BaseModel):
    """A recurring failure pattern across eval cases."""

    theme: str
    count: int
    severity: str  # "critical", "high", "medium"
    affected_scenarios: list[str]


class ReadinessResponse(BaseModel):
    """Full readiness dashboard payload."""

    overall_score: int
    readiness_level: str
    recommendation: str
    category_scores: list[CategoryScore]
    failure_themes: list[FailureTheme]
    constraints: list[str]
    eval_run_id: str
    eval_run_date: datetime
    scenario_count: int
    pass_count: int


class ReadinessExport(BaseModel):
    """Markdown readiness report."""

    report: str
