"""Pydantic schemas for practice profile endpoints."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class PracticeCreate(BaseModel):
    """Request body for creating a practice profile."""

    name: str
    locations: dict[str, Any]
    providers: dict[str, Any]
    hours: dict[str, Any]
    appointment_types: dict[str, Any]
    insurance_rules: dict[str, Any]
    escalation_rules: dict[str, Any]


class PracticeUpdate(BaseModel):
    """Request body for partially updating a practice profile."""

    name: str | None = None
    locations: dict[str, Any] | None = None
    providers: dict[str, Any] | None = None
    hours: dict[str, Any] | None = None
    appointment_types: dict[str, Any] | None = None
    insurance_rules: dict[str, Any] | None = None
    escalation_rules: dict[str, Any] | None = None


class PracticeResponse(BaseModel):
    """Response schema for a practice profile."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    locations: dict[str, Any]
    providers: dict[str, Any]
    hours: dict[str, Any]
    appointment_types: dict[str, Any]
    insurance_rules: dict[str, Any]
    escalation_rules: dict[str, Any]
    created_at: datetime
    updated_at: datetime
