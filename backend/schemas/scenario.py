"""Pydantic schemas for scenario endpoints."""

from typing import Any

from pydantic import BaseModel


class ScenarioResponse(BaseModel):
    """Response schema for a single scenario definition."""

    name: str
    label: str
    description: str
    category: str
    patient_persona: str
    expected_outcome: str
    evaluation_criteria: list[str] = []
    tool_overrides: dict[str, Any] = {}


class ScenarioSummary(BaseModel):
    """Lightweight summary for listing scenarios (excludes persona prompt)."""

    name: str
    label: str
    description: str
    category: str
    expected_outcome: str
    evaluation_criteria: list[str] = []
