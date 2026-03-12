import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Battle(Base):
    __tablename__ = "battles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    left_bot_id: Mapped[str] = mapped_column(String, ForeignKey("bots.id"), nullable=False)
    right_bot_id: Mapped[str] = mapped_column(String, ForeignKey("bots.id"), nullable=False)
    winner_bot_id: Mapped[str | None] = mapped_column(String, ForeignKey("bots.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="pending")  # pending | running | completed

    # Results
    left_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    right_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    left_trades: Mapped[int] = mapped_column(Integer, default=0)
    right_trades: Mapped[int] = mapped_column(Integer, default=0)
    left_max_drawdown: Mapped[float] = mapped_column(Float, default=0.0)
    right_max_drawdown: Mapped[float] = mapped_column(Float, default=0.0)
    total_ticks: Mapped[int] = mapped_column(Integer, default=0)
    max_stage: Mapped[int] = mapped_column(Integer, default=1)
    seed: Mapped[int] = mapped_column(Integer, default=0)

    # Tick-by-tick log stored as JSON text
    tick_log: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
