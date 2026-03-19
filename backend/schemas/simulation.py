"""Pydantic schemas for simulation session endpoints."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class SimulationCreate(BaseModel):
    """Request body for creating a new simulation session."""

    practice_id: str
    config_id: str
    scenario_name: str | None = None
    channel_mode: str = "chat"


class MessageSend(BaseModel):
    """Request body for sending a message in a simulation."""

    content: str


class ToolCallOut(BaseModel):
    """A single tool call within a message response."""

    tool_name: str
    tool_input: dict[str, Any]
    status: str
    output: dict[str, Any]


class EscalationOut(BaseModel):
    """Escalation info if triggered."""

    type: str
    keyword: str
    action: str


class MessageResponse(BaseModel):
    """Response from sending a message to the simulation."""

    agent_message: str
    tool_calls: list[ToolCallOut] = []
    escalation: EscalationOut | None = None
    stop_reason: str = ""


class AutoRespondResponse(BaseModel):
    """Response from the auto-respond endpoint (patient simulator + agent)."""

    patient_message: str
    agent_message: str
    tool_calls: list[ToolCallOut] = []
    escalation: EscalationOut | None = None
    stop_reason: str = ""


class SimulationResponse(BaseModel):
    """Response schema for a simulation session."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    practice_id: str
    config_id: str
    scenario_name: str | None
    channel_mode: str
    messages: list[Any]
    outcome: str | None
    started_at: datetime
    completed_at: datetime | None


class SimulationSummary(BaseModel):
    """Lightweight summary for listing sessions."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    practice_id: str
    config_id: str
    scenario_name: str | None
    channel_mode: str
    outcome: str | None
    started_at: datetime
    completed_at: datetime | None
