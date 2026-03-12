from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


TradingStyle = Literal["momentum", "mean_reversion", "high_frequency"]
Rank = Literal["C", "B", "A", "S"]


class BotCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    name_ja: str = ""
    trading_style: TradingStyle
    archetype: str = "commander"
    philosophy: str = ""
    primary_color: str = "#00d4ff"
    region: str = "Unknown"
    rank: Rank = "C"


class BotUpdate(BaseModel):
    name: str | None = None
    name_ja: str | None = None
    trading_style: TradingStyle | None = None
    archetype: str | None = None
    philosophy: str | None = None
    primary_color: str | None = None
    region: str | None = None
    rank: Rank | None = None


class BotResponse(BaseModel):
    id: str
    name: str
    name_ja: str
    trading_style: str
    archetype: str
    philosophy: str
    primary_color: str
    region: str
    rank: str
    level: int
    experience: int
    win_count: int
    loss_count: int
    total_pnl: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
