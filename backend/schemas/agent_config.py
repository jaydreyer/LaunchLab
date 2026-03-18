"""Pydantic schemas for agent config endpoints."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AgentConfigUpdate(BaseModel):
    """Request body for partially updating an agent config."""

    system_prompt: str | None = None
    workflow_config: dict[str, Any] | None = None
    guardrails: dict[str, Any] | None = None
    escalation_triggers: dict[str, Any] | None = None
    tool_policy: dict[str, Any] | None = None
    tone_guidelines: dict[str, Any] | None = None


class AgentConfigResponse(BaseModel):
    """Response schema for an agent config."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    practice_id: str
    version: int
    system_prompt: str
    workflow_config: dict[str, Any]
    guardrails: dict[str, Any]
    escalation_triggers: dict[str, Any]
    tool_policy: dict[str, Any]
    tone_guidelines: dict[str, Any]
    created_at: datetime
    updated_at: datetime
