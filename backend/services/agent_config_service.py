"""Service layer for agent config CRUD operations."""

from datetime import UTC, datetime

from models.agent_config import AgentConfig
from schemas.agent_config import AgentConfigUpdate
from seed.agent_defaults import DEFAULT_AGENT_CONFIG
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def list_agent_configs(db: AsyncSession) -> list[AgentConfig]:
    """List all agent configs (newest first)."""
    result = await db.execute(
        select(AgentConfig).order_by(AgentConfig.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_agent_config(
    db: AsyncSession, agent_config_id: str
) -> AgentConfig | None:
    """Fetch a single agent config by ID."""
    result = await db.execute(
        select(AgentConfig).where(AgentConfig.id == agent_config_id)
    )
    return result.scalar_one_or_none()


async def get_agent_config_by_practice(
    db: AsyncSession, practice_id: str
) -> AgentConfig | None:
    """Fetch the agent config for a given practice."""
    result = await db.execute(
        select(AgentConfig)
        .where(AgentConfig.practice_id == practice_id)
        .order_by(AgentConfig.version.desc())
    )
    return result.scalars().first()


async def update_agent_config(
    db: AsyncSession, config: AgentConfig, data: AgentConfigUpdate
) -> AgentConfig:
    """Partially update an agent config, bumping the version."""
    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(config, field, value)
    config.version += 1
    config.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(config)
    return config


async def reset_agent_config_to_defaults(
    db: AsyncSession, practice_id: str
) -> AgentConfig:
    """Delete all agent configs for a practice and re-seed defaults.

    Returns the newly created default config.
    """
    result = await db.execute(
        select(AgentConfig).where(AgentConfig.practice_id == practice_id)
    )
    for existing in result.scalars().all():
        await db.delete(existing)

    config = AgentConfig(practice_id=practice_id, **DEFAULT_AGENT_CONFIG)
    db.add(config)
    await db.commit()
    await db.refresh(config)
    return config
