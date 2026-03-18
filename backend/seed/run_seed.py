"""Seed the database with BrightCare defaults.

Usage:
    cd backend && uv run python -m seed.run_seed
"""

import asyncio
import logging
import sys

from config import settings
from database import async_session, engine
from models import Base
from models.agent_config import AgentConfig
from models.practice import PracticeProfile
from sqlalchemy import select

from seed.agent_defaults import DEFAULT_AGENT_CONFIG
from seed.brightcare import BRIGHTCARE_PRACTICE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed() -> None:
    """Create tables (if needed) and insert BrightCare defaults."""
    logger.info("Database URL: %s", settings.database_url)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Tables ensured.")

    async with async_session() as db:
        # Check if practice already exists
        result = await db.execute(select(PracticeProfile))
        existing = result.scalars().first()
        if existing:
            logger.info("Practice already seeded (id=%s). Skipping.", existing.id)
            practice_id = existing.id
        else:
            practice = PracticeProfile(**BRIGHTCARE_PRACTICE)
            db.add(practice)
            await db.flush()
            practice_id = practice.id
            logger.info("Created practice: %s (id=%s)", practice.name, practice.id)

        # Check if agent config already exists
        result = await db.execute(
            select(AgentConfig).where(AgentConfig.practice_id == practice_id)
        )
        existing_config = result.scalars().first()
        if existing_config:
            logger.info(
                "Agent config already seeded (id=%s). Skipping.",
                existing_config.id,
            )
        else:
            config = AgentConfig(practice_id=practice_id, **DEFAULT_AGENT_CONFIG)
            db.add(config)
            logger.info("Created agent config for practice %s", practice_id)

        await db.commit()

    logger.info("Seed complete.")


if __name__ == "__main__":
    try:
        asyncio.run(seed())
    except KeyboardInterrupt:
        sys.exit(0)
