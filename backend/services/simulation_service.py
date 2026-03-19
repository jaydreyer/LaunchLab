"""Service layer for simulation session operations."""

import json
import logging
from typing import Any

from models.agent_config import AgentConfig
from models.practice import PracticeProfile
from models.simulation import SimulationSession
from models.tool_call import ToolCall
from scenarios.definitions import get_scenario
from schemas.simulation import SimulationCreate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.orchestrator import Orchestrator, OrchestratorResponse
from services.patient_simulator import PatientSimulator

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


async def list_sessions(db: AsyncSession) -> list[SimulationSession]:
    """List all simulation sessions (newest first)."""
    result = await db.execute(
        select(SimulationSession).order_by(SimulationSession.started_at.desc())
    )
    return list(result.scalars().all())


async def get_tool_calls(db: AsyncSession, session_id: str) -> list[ToolCall]:
    """Fetch all tool calls for a simulation session (oldest first)."""
    result = await db.execute(
        select(ToolCall)
        .where(ToolCall.session_id == session_id)
        .order_by(ToolCall.created_at.asc())
    )
    return list(result.scalars().all())


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


async def auto_respond(
    db: AsyncSession,
    session: SimulationSession,
) -> tuple[str, OrchestratorResponse]:
    """Use the patient simulator to generate a message, then process it.

    Returns a tuple of (patient_message, orchestrator_response).
    """
    scenario = get_scenario(session.scenario_name) if session.scenario_name else None
    if not scenario:
        raise ValueError(
            f"No scenario found for '{session.scenario_name}'. "
            "Auto-respond requires a scenario with a patient persona."
        )

    simulator = PatientSimulator(
        persona_prompt=scenario.patient_persona,
        channel_mode=session.channel_mode,
    )

    messages = list(session.messages)

    # If conversation is empty, generate the patient's opening message.
    # Otherwise, generate a reply based on the conversation so far.
    if not messages:
        patient_message = await simulator.generate_opening()
    else:
        patient_message = await simulator.generate_message(messages)

    # Now process the patient message through the orchestrator (same as
    # a manual user message) with scenario tool overrides.
    practice = await _load_practice(db, session.practice_id)
    practice_config = _practice_to_dict(practice)

    agent_config = await _load_agent_config(db, session.config_id)
    agent_config_dict = _agent_config_to_dict(agent_config)

    orchestrator = Orchestrator(
        practice_config=practice_config,
        agent_config=agent_config_dict,
    )

    messages_copy = list(session.messages)
    response, updated_messages = await orchestrator.process_message(
        db=db,
        session_id=session.id,
        messages=messages_copy,
        user_message=patient_message,
        scenario_overrides=scenario.tool_overrides or None,
    )

    # Handle escalation
    if response.escalation:
        session.outcome = json.dumps(
            {
                "status": "escalated",
                "escalation": response.escalation,
            }
        )

    # Persist
    session.messages = updated_messages
    await db.commit()
    await db.refresh(session)

    return patient_message, response


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
