"""Service layer for simulation session operations."""

import json
import logging
from typing import Any

from models.agent_config import AgentConfig
from models.practice import PracticeProfile
from models.simulation import SimulationSession
from schemas.simulation import SimulationCreate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.orchestrator import Orchestrator, OrchestratorResponse

logger = logging.getLogger(__name__)


async def create_session(db: AsyncSession, data: SimulationCreate) -> SimulationSession:
    """Create a new simulation session linked to a practice and agent config."""
    session = SimulationSession(
        practice_id=data.practice_id,
        config_id=data.config_id,
        scenario_name=data.scenario_name,
        channel_mode=data.channel_mode,
        messages=[],
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session(db: AsyncSession, session_id: str) -> SimulationSession | None:
    """Fetch a simulation session by ID."""
    result = await db.execute(
        select(SimulationSession).where(SimulationSession.id == session_id)
    )
    return result.scalar_one_or_none()


async def process_message(
    db: AsyncSession,
    session: SimulationSession,
    user_message: str,
) -> OrchestratorResponse:
    """Send a user message through the orchestrator and persist the result.

    Loads the practice config and agent config from DB, builds an
    Orchestrator, runs the agent loop, and saves the updated messages.
    """
    # Load practice config
    practice = await _load_practice(db, session.practice_id)
    practice_config = _practice_to_dict(practice)

    # Load agent config
    agent_config = await _load_agent_config(db, session.config_id)
    agent_config_dict = _agent_config_to_dict(agent_config)

    # Build orchestrator
    orchestrator = Orchestrator(
        practice_config=practice_config,
        agent_config=agent_config_dict,
    )

    # Run agent loop
    messages = list(session.messages)  # copy to avoid SQLAlchemy mutation issues
    response, updated_messages = await orchestrator.process_message(
        db=db,
        session_id=session.id,
        messages=messages,
        user_message=user_message,
    )

    # Handle escalation — mark session outcome
    if response.escalation:
        session.outcome = json.dumps(
            {
                "status": "escalated",
                "escalation": response.escalation,
            }
        )

    # Persist updated messages
    session.messages = updated_messages
    await db.commit()
    await db.refresh(session)

    return response


async def _load_practice(db: AsyncSession, practice_id: str) -> PracticeProfile:
    result = await db.execute(
        select(PracticeProfile).where(PracticeProfile.id == practice_id)
    )
    practice = result.scalar_one_or_none()
    if not practice:
        raise ValueError(f"Practice '{practice_id}' not found")
    return practice


async def _load_agent_config(db: AsyncSession, config_id: str) -> AgentConfig:
    result = await db.execute(select(AgentConfig).where(AgentConfig.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise ValueError(f"Agent config '{config_id}' not found")
    return config


def _practice_to_dict(practice: PracticeProfile) -> dict[str, Any]:
    return {
        "name": practice.name,
        "locations": practice.locations,
        "providers": practice.providers,
        "hours": practice.hours,
        "appointment_types": practice.appointment_types,
        "insurance_rules": practice.insurance_rules,
        "escalation_rules": practice.escalation_rules,
    }


def _agent_config_to_dict(config: AgentConfig) -> dict[str, Any]:
    return {
        "system_prompt": config.system_prompt,
        "workflow_config": config.workflow_config,
        "guardrails": config.guardrails,
        "escalation_triggers": config.escalation_triggers,
        "tool_policy": config.tool_policy,
        "tone_guidelines": config.tone_guidelines,
    }
