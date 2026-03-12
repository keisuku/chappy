"""Battle Engine — ported from game/src/lib/battle.ts"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field

from app.engine.market import Candlestick, MarketSimulator
from app.engine.strategies import TradeDirection, run_strategy

TOTAL_TICKS = 30


@dataclass
class TradePosition:
    direction: TradeDirection
    entry_price: float
    size: float = 0.01  # 0.01 BTC


@dataclass
class BotState:
    bot_id: str
    trading_style: str
    position: TradePosition | None = None
    pnl: float = 0.0
    power: float = 50.0
    trades: int = 0
    max_drawdown: float = 0.0
    peak_pnl: float = 0.0


@dataclass
class TickRecord:
    tick: int
    stage: int
    price: float
    left_pnl: float
    right_pnl: float
    left_power: float
    right_power: float
    left_direction: str
    right_direction: str


@dataclass
class BattleResult:
    winner_bot_id: str | None
    left_pnl: float
    right_pnl: float
    left_trades: int
    right_trades: int
    left_max_drawdown: float
    right_max_drawdown: float
    total_ticks: int
    max_stage: int
    seed: int
    tick_log: list[TickRecord]


def _update_bot(
    bot: BotState, direction: TradeDirection, current_price: float, prev_price: float
) -> None:
    """Mutates bot state in place for perf."""
    # Calculate PnL from existing position
    if bot.position is not None:
        move = current_price - prev_price
        position_pnl = move if bot.position.direction == "long" else -move
        bot.pnl += position_pnl * bot.position.size
        bot.peak_pnl = max(bot.peak_pnl, bot.pnl)
        bot.max_drawdown = max(bot.max_drawdown, bot.peak_pnl - bot.pnl)

    # Update position
    if direction != "flat" and (bot.position is None or bot.position.direction != direction):
        bot.position = TradePosition(direction=direction, entry_price=current_price)
        bot.trades += 1
    elif direction == "flat":
        bot.position = None


def run_battle(
    left_bot_id: str,
    left_style: str,
    right_bot_id: str,
    right_style: str,
    seed: int | None = None,
) -> BattleResult:
    """Execute a full 30-tick battle and return the result."""
    if seed is None:
        seed = int(time.time() * 1000) % 100000

    market = MarketSimulator(seed)
    # Generate initial candles
    for _ in range(20):
        market.step()

    left = BotState(bot_id=left_bot_id, trading_style=left_style)
    right = BotState(bot_id=right_bot_id, trading_style=right_style)

    tick_log: list[TickRecord] = []
    max_stage = 1

    for tick in range(1, TOTAL_TICKS + 1):
        candle = market.step()
        stage = market.get_stage()
        max_stage = max(max_stage, stage)

        left_signal = run_strategy(left.trading_style, market.candles)
        right_signal = run_strategy(right.trading_style, market.candles)

        _update_bot(left, left_signal.direction, candle.close, candle.open)
        _update_bot(right, right_signal.direction, candle.close, candle.open)

        # Power calculation
        total_pnl = abs(left.pnl) + abs(right.pnl) + 1
        left.power = 50 + ((left.pnl - right.pnl) / total_pnl) * 40
        right.power = 100 - left.power

        tick_log.append(
            TickRecord(
                tick=tick,
                stage=stage,
                price=candle.close,
                left_pnl=round(left.pnl, 2),
                right_pnl=round(right.pnl, 2),
                left_power=round(left.power, 2),
                right_power=round(right.power, 2),
                left_direction=left_signal.direction,
                right_direction=right_signal.direction,
            )
        )

    # Determine winner
    if left.pnl > right.pnl:
        winner_id = left_bot_id
    elif right.pnl > left.pnl:
        winner_id = right_bot_id
    else:
        winner_id = None  # draw

    return BattleResult(
        winner_bot_id=winner_id,
        left_pnl=round(left.pnl, 2),
        right_pnl=round(right.pnl, 2),
        left_trades=left.trades,
        right_trades=right.trades,
        left_max_drawdown=round(left.max_drawdown, 2),
        right_max_drawdown=round(right.max_drawdown, 2),
        total_ticks=TOTAL_TICKS,
        max_stage=max_stage,
        seed=seed,
        tick_log=tick_log,
    )


def tick_log_to_json(tick_log: list[TickRecord]) -> str:
    return json.dumps([vars(t) for t in tick_log])
