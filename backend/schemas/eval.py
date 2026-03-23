"""Pydantic schemas for eval run endpoints."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class EvalRunCreate(BaseModel):
    """Request body for starting a new eval run."""

    practice_id: str
    config_id: str
    suite_name: str = "v1"


class EvalCaseResponse(BaseModel):
    """A single eval case with its scenario results."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    eval_run_id: str
    scenario_name: str
    session_id: str | None
    expected_behavior: dict[str, Any]
    actual_behavior: dict[str, Any] | None
    criteria_results: dict[str, Any] | None
    passed: bool | None
    score: float | None
    failure_reasons: dict[str, Any] | None
    judged_at: datetime | None


class EvalRunResponse(BaseModel):
    """Full eval run with all cases."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    practice_id: str
    config_id: str
    suite_name: str
    status: str
    summary: dict[str, Any] | None
    started_at: datetime
    completed_at: datetime | None
    cases: list[EvalCaseResponse] = []


class EvalRunSummary(BaseModel):
    """Lightweight list view of an eval run."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    practice_id: str
    config_id: str
    suite_name: str
    status: str
    summary: dict[str, Any] | None
    started_at: datetime
    completed_at: datetime | None
