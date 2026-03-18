"""Pydantic schemas for agent config preview endpoint."""

from typing import Any

from pydantic import BaseModel


class AgentConfigPreviewRequest(BaseModel):
    """Request body for previewing the assembled system prompt."""

    practice_id: str
    system_prompt: str
    workflow_config: dict[str, Any]
    guardrails: dict[str, Any]
    escalation_triggers: dict[str, Any]
    tool_policy: dict[str, Any]
    tone_guidelines: dict[str, Any]


class AgentConfigPreviewResponse(BaseModel):
    """Response schema for the assembled system prompt preview."""

    assembled_prompt: str
