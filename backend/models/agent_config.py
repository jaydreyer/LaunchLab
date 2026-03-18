import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class AgentConfig(Base):
    __tablename__ = "agent_configs"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: uuid.uuid4().hex[:16]
    )
    practice_id: Mapped[str] = mapped_column(
        String, ForeignKey("practice_profiles.id"), nullable=False
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    workflow_config: Mapped[dict] = mapped_column(JSON, nullable=False)
    guardrails: Mapped[dict] = mapped_column(JSON, nullable=False)
    escalation_triggers: Mapped[dict] = mapped_column(JSON, nullable=False)
    tool_policy: Mapped[dict] = mapped_column(JSON, nullable=False)
    tone_guidelines: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
