"""API routes for simulation sessions."""

from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from schemas.simulation import (
    AutoRespondResponse,
    MessageResponse,
    MessageSend,
    SimulationCreate,
    SimulationResponse,
    SimulationSummary,
)
from schemas.tool_call import ToolCallResponse
from services import simulation_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/simulations", tags=["simulations"])


@router.get("", response_model=list[SimulationSummary])
async def list_simulations(
    db: AsyncSession = Depends(get_db),
) -> list[SimulationSummary]:
    """List all simulation sessions (newest first)."""
    sessions = await simulation_service.list_sessions(db)
    return [SimulationSummary.model_validate(s) for s in sessions]


@router.post("", response_model=SimulationResponse, status_code=201)
async def create_simulation(
    data: SimulationCreate, db: AsyncSession = Depends(get_db)
) -> SimulationResponse:
    """Create a new simulation session."""
    session = await simulation_service.create_session(db, data)
    return SimulationResponse.model_validate(session)


@router.get("/{simulation_id}", response_model=SimulationResponse)
async def get_simulation(
    simulation_id: str, db: AsyncSession = Depends(get_db)
) -> SimulationResponse:
    """Fetch a simulation session with full transcript."""
    session = await simulation_service.get_session(db, simulation_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return SimulationResponse.model_validate(session)


@router.get(
    "/{simulation_id}/tool_calls",
    response_model=list[ToolCallResponse],
)
async def get_tool_calls(
    simulation_id: str, db: AsyncSession = Depends(get_db)
) -> list[ToolCallResponse]:
    """Fetch all tool calls for a simulation session."""
    session = await simulation_service.get_session(db, simulation_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    calls = await simulation_service.get_tool_calls(db, simulation_id)
    return [ToolCallResponse.model_validate(c) for c in calls]


@router.post(
    "/{simulation_id}/messages",
    response_model=MessageResponse,
)
async def send_message(
    simulation_id: str,
    data: MessageSend,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Send a user message and get the agent's response."""
    session = await simulation_service.get_session(db, simulation_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")

    response = await simulation_service.process_message(db, session, data.content)

    return MessageResponse(
        agent_message=response.agent_message,
        tool_calls=[tc for tc in response.tool_calls],
        escalation=response.escalation,
        stop_reason=response.stop_reason,
    )


@router.post(
    "/{simulation_id}/auto_responses",
    response_model=AutoRespondResponse,
)
async def auto_respond(
    simulation_id: str,
    db: AsyncSession = Depends(get_db),
) -> AutoRespondResponse:
    """Patient simulator generates a message, then the agent responds."""
    session = await simulation_service.get_session(db, simulation_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")

    if not session.scenario_name:
        raise HTTPException(
            status_code=400,
            detail="Auto-respond requires a session with a scenario.",
        )

    patient_message, response = await simulation_service.auto_respond(db, session)

    return AutoRespondResponse(
        patient_message=patient_message,
        agent_message=response.agent_message,
        tool_calls=[tc for tc in response.tool_calls],
        escalation=response.escalation,
        stop_reason=response.stop_reason,
    )
