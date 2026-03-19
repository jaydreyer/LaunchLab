"""Pydantic schemas for tool call endpoints."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ToolCallResponse(BaseModel):
    """A persisted tool call record from a simulation session."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    tool_name: str
    tool_input: dict[str, Any]
    tool_output: dict[str, Any]
    status: str
    duration_ms: int | None
    created_at: datetime
