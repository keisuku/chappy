import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Bot(Base):
    __tablename__ = "bots"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name_ja: Mapped[str] = mapped_column(String(64), default="")
    trading_style: Mapped[str] = mapped_column(String(32), nullable=False)  # momentum | mean_reversion | high_frequency
    archetype: Mapped[str] = mapped_column(String(32), default="commander")
    philosophy: Mapped[str] = mapped_column(String(256), default="")
    primary_color: Mapped[str] = mapped_column(String(7), default="#00d4ff")
    region: Mapped[str] = mapped_column(String(64), default="Unknown")
    rank: Mapped[str] = mapped_column(String(2), default="C")  # C, B, A, S

    # Evolution stats
    level: Mapped[int] = mapped_column(Integer, default=1)
    experience: Mapped[int] = mapped_column(Integer, default=0)
    win_count: Mapped[int] = mapped_column(Integer, default=0)
    loss_count: Mapped[int] = mapped_column(Integer, default=0)
    total_pnl: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
