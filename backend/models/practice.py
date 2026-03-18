import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class PracticeProfile(Base):
    __tablename__ = "practice_profiles"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: uuid.uuid4().hex[:16]
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    locations: Mapped[dict] = mapped_column(JSON, nullable=False)
    providers: Mapped[dict] = mapped_column(JSON, nullable=False)
    hours: Mapped[dict] = mapped_column(JSON, nullable=False)
    appointment_types: Mapped[dict] = mapped_column(JSON, nullable=False)
    insurance_rules: Mapped[dict] = mapped_column(JSON, nullable=False)
    escalation_rules: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
