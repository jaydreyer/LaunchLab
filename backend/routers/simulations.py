"""API routes for simulation sessions."""

from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from schemas.simulation import (
    MessageResponse,
    MessageSend,
    SimulationCreate,
    SimulationResponse,
)
from services import simulation_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/simulations", tags=["simulations"])


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
