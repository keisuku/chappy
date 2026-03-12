from datetime import datetime

from pydantic import BaseModel


class BattleCreate(BaseModel):
    left_bot_id: str
    right_bot_id: str
    seed: int | None = None


class TickEntry(BaseModel):
    tick: int
    stage: int
    price: float
    left_pnl: float
    right_pnl: float
    left_power: float
    right_power: float
    left_direction: str
    right_direction: str


class BattleResponse(BaseModel):
    id: str
    left_bot_id: str
    right_bot_id: str
    winner_bot_id: str | None
    status: str
    left_pnl: float
    right_pnl: float
    left_trades: int
    right_trades: int
    left_max_drawdown: float
    right_max_drawdown: float
    total_ticks: int
    max_stage: int
    seed: int
    created_at: datetime

    model_config = {"from_attributes": True}


class BattleDetailResponse(BattleResponse):
    tick_log: list[TickEntry]


class BattleListResponse(BaseModel):
    battles: list[BattleResponse]
    total: int


class LeaderboardEntry(BaseModel):
    bot_id: str
    bot_name: str
    win_count: int
    loss_count: int
    win_rate: float
    total_pnl: float
    level: int
    rank: str

    model_config = {"from_attributes": True}
