"""Eval runner — orchestrates full eval suite runs.

Executes each scenario programmatically using the patient simulator and
orchestrator, captures actual behaviors, and stores results as EvalRun +
EvalCase records. Judging (scoring) happens separately in Phase 3B.
"""

import json
import logging
from datetime import UTC, datetime
from typing import Any

from models.eval_case import EvalCase
from models.eval_run import EvalRun
from models.simulation import SimulationSession
from scenarios.definitions import ScenarioDefinition, list_scenarios
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.orchestrator import Orchestrator
from services.patient_simulator import PatientSimulator
from services.simulation_service import (
    _agent_config_to_dict,
    _load_agent_config,
    _load_practice,
    _practice_to_dict,
)

logger = logging.getLogger(__name__)

MAX_TURNS = 12  # safety cap per scenario


async def run_suite(
    db: AsyncSession,
    practice_id: str,
    config_id: str,
    suite_name: str = "v1",
) -> EvalRun:
    """Orchestrate a full eval suite run.

    Creates an EvalRun, executes each scenario end-to-end using the
    patient simulator + orchestrator, and captures actual behavior for
    each case. Returns the EvalRun (cases are not yet judged).
    """
    # Load practice and agent config once for the whole run
    practice = await _load_practice(db, practice_id)
    practice_config = _practice_to_dict(practice)
    agent_config = await _load_agent_config(db, config_id)
    agent_config_dict = _agent_config_to_dict(agent_config)

    # Create the eval run record
    eval_run = EvalRun(
        practice_id=practice_id,
        config_id=config_id,
        suite_name=suite_name,
        status="running",
    )
    db.add(eval_run)
    await db.commit()
    await db.refresh(eval_run)

    logger.info("Starting eval run %s (suite=%s)", eval_run.id, suite_name)

    scenarios = list_scenarios()
    cases: list[EvalCase] = []

    for scenario in scenarios:
        try:
            case = await _run_scenario(
                db=db,
                eval_run_id=eval_run.id,
                scenario=scenario,
                practice_id=practice_id,
                config_id=config_id,
                practice_config=practice_config,
                agent_config_dict=agent_config_dict,
            )
            cases.append(case)
            msg_count = (
                len(case.actual_behavior.get("messages", []))
                if case.actual_behavior
                else 0
            )
            logger.info(
                "Scenario '%s' completed (%d messages)",
                scenario.name,
                msg_count,
            )
        except Exception:
            logger.exception("Scenario '%s' failed with error", scenario.name)
            # Create an error case so the run still has a record
            error_case = EvalCase(
                eval_run_id=eval_run.id,
                scenario_name=scenario.name,
                expected_behavior=scenario.expected_behavior,
                actual_behavior={"error": "Scenario execution failed"},
            )
            db.add(error_case)
            await db.commit()
            await db.refresh(error_case)
            cases.append(error_case)

    # Mark run as awaiting judgment (scoring happens in 3B)
    eval_run.status = "awaiting_judgment"
    eval_run.completed_at = datetime.now(UTC)
    eval_run.summary = {
        "total_scenarios": len(scenarios),
        "completed": sum(
            1 for c in cases if c.actual_behavior and "error" not in c.actual_behavior
        ),
        "errored": sum(
            1 for c in cases if c.actual_behavior and "error" in c.actual_behavior
        ),
    }
    await db.commit()
    await db.refresh(eval_run)

    logger.info("Eval run %s finished: %s", eval_run.id, eval_run.summary)
    return eval_run


async def get_eval_run(
    db: AsyncSession, eval_run_id: str
) -> tuple[EvalRun | None, list[EvalCase]]:
    """Fetch an eval run and its cases."""
    result = await db.execute(select(EvalRun).where(EvalRun.id == eval_run_id))
    eval_run = result.scalar_one_or_none()
    if not eval_run:
        return None, []

    cases_result = await db.execute(
        select(EvalCase)
        .where(EvalCase.eval_run_id == eval_run_id)
        .order_by(EvalCase.scenario_name)
    )
    cases = list(cases_result.scalars().all())
    return eval_run, cases


async def list_eval_runs(db: AsyncSession) -> list[EvalRun]:
    """List all eval runs, newest first."""
    result = await db.execute(select(EvalRun).order_by(EvalRun.started_at.desc()))
    return list(result.scalars().all())


async def _run_scenario(
    db: AsyncSession,
    eval_run_id: str,
    scenario: ScenarioDefinition,
    practice_id: str,
    config_id: str,
    practice_config: dict[str, Any],
    agent_config_dict: dict[str, Any],
) -> EvalCase:
    """Execute a single scenario and capture results as an EvalCase."""
    # Create a simulation session for this scenario
    sim_session = SimulationSession(
        practice_id=practice_id,
        config_id=config_id,
        scenario_name=scenario.name,
        channel_mode="chat",
        messages=[],
    )
    db.add(sim_session)
    await db.commit()
    await db.refresh(sim_session)

    # Set up orchestrator and patient simulator
    orchestrator = Orchestrator(
        practice_config=practice_config,
        agent_config=agent_config_dict,
    )
    simulator = PatientSimulator(
        persona_prompt=scenario.patient_persona,
        channel_mode="chat",
    )

    messages: list[dict[str, Any]] = []
    all_tool_calls: list[dict[str, Any]] = []
    escalation = None
    turn_count = 0

    # Generate the patient's opening message
    patient_message = await simulator.generate_opening()

    while turn_count < MAX_TURNS:
        turn_count += 1

        # Send patient message through the orchestrator
        response, messages = await orchestrator.process_message(
            db=db,
            session_id=sim_session.id,
            messages=messages,
            user_message=patient_message,
            scenario_overrides=scenario.tool_overrides or None,
        )

        all_tool_calls.extend(response.tool_calls)

        # Check for escalation
        if response.escalation:
            escalation = response.escalation
            break

        # Check if agent signaled conversation end
        if _is_conversation_complete(response.agent_message):
            break

        # Generate next patient message
        patient_message = await simulator.generate_message(messages)

        # Check if patient signaled end
        if _is_conversation_complete(patient_message):
            # Still need to process this final patient message
            turn_count += 1
            response, messages = await orchestrator.process_message(
                db=db,
                session_id=sim_session.id,
                messages=messages,
                user_message=patient_message,
                scenario_overrides=scenario.tool_overrides or None,
            )
            all_tool_calls.extend(response.tool_calls)
            if response.escalation:
                escalation = response.escalation
            break

    # Persist final session state
    sim_session.messages = messages
    sim_session.outcome = json.dumps(
        {"status": "escalated", "escalation": escalation}
        if escalation
        else {"status": "completed", "turns": turn_count}
    )
    sim_session.completed_at = datetime.now(UTC)
    await db.commit()

    # Extract actual behavior from the conversation
    actual_behavior = _extract_actual_behavior(
        messages=messages,
        tool_calls=all_tool_calls,
        escalation=escalation,
        turn_count=turn_count,
    )

    # Create the eval case
    eval_case = EvalCase(
        eval_run_id=eval_run_id,
        scenario_name=scenario.name,
        session_id=sim_session.id,
        expected_behavior=scenario.expected_behavior,
        actual_behavior=actual_behavior,
    )
    db.add(eval_case)
    await db.commit()
    await db.refresh(eval_case)

    return eval_case


def _extract_actual_behavior(
    messages: list[dict[str, Any]],
    tool_calls: list[dict[str, Any]],
    escalation: dict[str, Any] | None,
    turn_count: int,
) -> dict[str, Any]:
    """Pull structured facts from a completed conversation.

    Extracts which tools were called, whether escalation occurred,
    turn count, and the conversation transcript for the judge.
    """
    tools_used = list({tc["tool_name"] for tc in tool_calls})
    tool_statuses = {tc["tool_name"]: tc["status"] for tc in tool_calls}

    # Extract text-only transcript for readability
    transcript: list[dict[str, str]] = []
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if isinstance(content, str) and content.strip():
            transcript.append({"role": role, "content": content})
        elif isinstance(content, list):
            text_parts = [
                b.get("text", "")
                for b in content
                if isinstance(b, dict) and b.get("type") == "text"
            ]
            combined = " ".join(text_parts).strip()
            if combined:
                transcript.append({"role": role, "content": combined})

    return {
        "tools_used": tools_used,
        "tool_statuses": tool_statuses,
        "tool_calls": tool_calls,
        "escalation_triggered": escalation is not None,
        "escalation": escalation,
        "turn_count": turn_count,
        "max_turns_hit": turn_count >= MAX_TURNS,
        "transcript": transcript,
        "message_count": len(messages),
    }


def _is_conversation_complete(text: str) -> bool:
    """Heuristic check for conversation-ending signals.

    Looks for common farewell patterns that indicate the conversation
    has naturally concluded.
    """
    lower = text.lower().strip()
    farewell_signals = [
        "goodbye",
        "have a great day",
        "have a good day",
        "have a nice day",
        "take care",
        "thanks, bye",
        "thank you, bye",
        "that's all",
        "that is all",
        "nothing else",
        "all set",
    ]
    return any(signal in lower for signal in farewell_signals)
