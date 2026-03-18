"""API routes for agent configurations."""

from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from prompts.agent_system import assemble_system_prompt
from schemas.agent_config import AgentConfigResponse, AgentConfigUpdate
from schemas.agent_config_preview import (
    AgentConfigPreviewRequest,
    AgentConfigPreviewResponse,
)
from services import agent_config_service, practice_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/agent_configs", tags=["agent_configs"])


@router.get("", response_model=list[AgentConfigResponse])
async def list_agent_configs(
    db: AsyncSession = Depends(get_db),
) -> list[AgentConfigResponse]:
    """List all agent configs."""
    configs = await agent_config_service.list_agent_configs(db)
    return [AgentConfigResponse.model_validate(c) for c in configs]


@router.get("/{agent_config_id}", response_model=AgentConfigResponse)
async def get_agent_config(
    agent_config_id: str, db: AsyncSession = Depends(get_db)
) -> AgentConfigResponse:
    """Fetch a single agent config by ID."""
    config = await agent_config_service.get_agent_config(db, agent_config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Agent config not found")
    return AgentConfigResponse.model_validate(config)


@router.patch("/{agent_config_id}", response_model=AgentConfigResponse)
async def update_agent_config(
    agent_config_id: str,
    data: AgentConfigUpdate,
    db: AsyncSession = Depends(get_db),
) -> AgentConfigResponse:
    """Partially update an agent config (bumps version)."""
    config = await agent_config_service.get_agent_config(db, agent_config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Agent config not found")
    updated = await agent_config_service.update_agent_config(db, config, data)
    return AgentConfigResponse.model_validate(updated)


# Reset modeled as a noun resource per REST standards
reset_router = APIRouter(prefix="/api/agent_config_resets", tags=["agent_configs"])


@reset_router.post("", response_model=AgentConfigResponse, status_code=201)
async def reset_agent_config(
    practice_id: str, db: AsyncSession = Depends(get_db)
) -> AgentConfigResponse:
    """Reset agent config to defaults for a given practice."""
    config = await agent_config_service.reset_agent_config_to_defaults(db, practice_id)
    return AgentConfigResponse.model_validate(config)


# Preview modeled as a noun resource per REST standards
preview_router = APIRouter(prefix="/api/agent_config_previews", tags=["agent_configs"])


@preview_router.post("", response_model=AgentConfigPreviewResponse)
async def preview_agent_config(
    data: AgentConfigPreviewRequest,
    db: AsyncSession = Depends(get_db),
) -> AgentConfigPreviewResponse:
    """Assemble the full system prompt from agent config + practice data."""
    practice = await practice_service.get_practice(db, data.practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")

    practice_config = {
        "name": practice.name,
        "locations": practice.locations,
        "providers": practice.providers,
        "hours": practice.hours,
        "appointment_types": practice.appointment_types,
        "insurance_rules": practice.insurance_rules,
        "escalation_rules": practice.escalation_rules,
    }

    agent_config = {
        "system_prompt": data.system_prompt,
        "workflow_config": data.workflow_config,
        "guardrails": data.guardrails,
        "escalation_triggers": data.escalation_triggers,
        "tool_policy": data.tool_policy,
        "tone_guidelines": data.tone_guidelines,
    }

    assembled = assemble_system_prompt(agent_config, practice_config)
    return AgentConfigPreviewResponse(assembled_prompt=assembled)
