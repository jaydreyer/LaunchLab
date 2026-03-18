"""Service layer for practice profile CRUD operations."""

from datetime import UTC, datetime

from models.practice import PracticeProfile
from schemas.practice import PracticeCreate, PracticeUpdate
from seed.brightcare import BRIGHTCARE_PRACTICE
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_practice(db: AsyncSession, practice_id: str) -> PracticeProfile | None:
    """Fetch a single practice profile by ID."""
    result = await db.execute(
        select(PracticeProfile).where(PracticeProfile.id == practice_id)
    )
    return result.scalar_one_or_none()


async def create_practice(db: AsyncSession, data: PracticeCreate) -> PracticeProfile:
    """Create a new practice profile."""
    practice = PracticeProfile(
        name=data.name,
        locations=data.locations,
        providers=data.providers,
        hours=data.hours,
        appointment_types=data.appointment_types,
        insurance_rules=data.insurance_rules,
        escalation_rules=data.escalation_rules,
    )
    db.add(practice)
    await db.commit()
    await db.refresh(practice)
    return practice


async def update_practice(
    db: AsyncSession, practice: PracticeProfile, data: PracticeUpdate
) -> PracticeProfile:
    """Partially update a practice profile with only the provided fields."""
    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(practice, field, value)
    practice.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(practice)
    return practice


async def reset_practice_to_defaults(db: AsyncSession) -> PracticeProfile:
    """Delete all practices and re-seed with BrightCare defaults.

    Returns the newly created default practice.
    """
    result = await db.execute(select(PracticeProfile))
    for existing in result.scalars().all():
        await db.delete(existing)

    practice = PracticeProfile(**BRIGHTCARE_PRACTICE)
    db.add(practice)
    await db.commit()
    await db.refresh(practice)
    return practice
