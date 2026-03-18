import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class EvalCase(Base):
    __tablename__ = "eval_cases"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: uuid.uuid4().hex[:16]
    )
    eval_run_id: Mapped[str] = mapped_column(
        String, ForeignKey("eval_runs.id"), nullable=False
    )
    scenario_name: Mapped[str] = mapped_column(String, nullable=False)
    session_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("simulation_sessions.id"), nullable=True
    )
    expected_behavior: Mapped[dict] = mapped_column(JSON, nullable=False)
    actual_behavior: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    criteria_results: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    passed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    failure_reasons: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    judged_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
