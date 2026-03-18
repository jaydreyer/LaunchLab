import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class SimulationSession(Base):
    __tablename__ = "simulation_sessions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: uuid.uuid4().hex[:16]
    )
    practice_id: Mapped[str] = mapped_column(
        String, ForeignKey("practice_profiles.id"), nullable=False
    )
    config_id: Mapped[str] = mapped_column(
        String, ForeignKey("agent_configs.id"), nullable=False
    )
    scenario_name: Mapped[str | None] = mapped_column(String, nullable=True)
    channel_mode: Mapped[str] = mapped_column(String, nullable=False, default="chat")
    messages: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    outcome: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
