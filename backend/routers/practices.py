"""API routes for practice profiles."""

from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from schemas.practice import PracticeCreate, PracticeResponse, PracticeUpdate
from services import practice_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/practices", tags=["practices"])


@router.get("/{practice_id}", response_model=PracticeResponse)
async def get_practice(
    practice_id: str, db: AsyncSession = Depends(get_db)
) -> PracticeResponse:
    """Fetch a single practice profile by ID."""
    practice = await practice_service.get_practice(db, practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    return PracticeResponse.model_validate(practice)


@router.post("", response_model=PracticeResponse, status_code=201)
async def create_practice(
    data: PracticeCreate, db: AsyncSession = Depends(get_db)
) -> PracticeResponse:
    """Create a new practice profile."""
    practice = await practice_service.create_practice(db, data)
    return PracticeResponse.model_validate(practice)


@router.patch("/{practice_id}", response_model=PracticeResponse)
async def update_practice(
    practice_id: str,
    data: PracticeUpdate,
    db: AsyncSession = Depends(get_db),
) -> PracticeResponse:
    """Partially update a practice profile."""
    practice = await practice_service.get_practice(db, practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    updated = await practice_service.update_practice(db, practice, data)
    return PracticeResponse.model_validate(updated)


# Reset modeled as a noun resource per REST standards
reset_router = APIRouter(prefix="/api/practice_resets", tags=["practices"])


@reset_router.post("", response_model=PracticeResponse, status_code=201)
async def reset_practice(
    db: AsyncSession = Depends(get_db),
) -> PracticeResponse:
    """Reset practice data to BrightCare defaults."""
    practice = await practice_service.reset_practice_to_defaults(db)
    return PracticeResponse.model_validate(practice)
