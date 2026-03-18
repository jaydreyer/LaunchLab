"""API routes for agent configurations."""

from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from schemas.agent_config import AgentConfigResponse, AgentConfigUpdate
from services import agent_config_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/agent_configs", tags=["agent_configs"])


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
