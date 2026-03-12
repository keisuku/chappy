"""Trading Strategy Engine — ported from game/src/lib/strategies.ts"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.engine.market import Candlestick

TradeDirection = Literal["long", "short", "flat"]


@dataclass
class StrategySignal:
    direction: TradeDirection
    confidence: float
    reason: str


def momentum_strategy(candles: list[Candlestick]) -> StrategySignal:
    if len(candles) < 5:
        return StrategySignal("flat", 0, "insufficient data")

    recent = candles[-5:]
    bull_count = sum(1 for c in recent if c.close > c.open)
    trend = bull_count / len(recent)

    if trend >= 0.6:
        return StrategySignal("long", trend, f"{bull_count}/5 bullish candles")
    if trend <= 0.4:
        return StrategySignal("short", 1 - trend, f"{5 - bull_count}/5 bearish candles")
    return StrategySignal("flat", 0.3, "no clear trend")


def mean_reversion_strategy(candles: list[Candlestick]) -> StrategySignal:
    if len(candles) < 10:
        return StrategySignal("flat", 0, "insufficient data")

    recent = candles[-10:]
    avg = sum(c.close for c in recent) / len(recent)
    current = candles[-1].close
    deviation = (current - avg) / avg

    if deviation > 0.005:
        return StrategySignal("short", min(1, abs(deviation) * 50), f"price {deviation * 100:.2f}% above mean")
    if deviation < -0.005:
        return StrategySignal("long", min(1, abs(deviation) * 50), f"price {deviation * 100:.2f}% below mean")
    return StrategySignal("flat", 0.2, "near mean")


def high_frequency_strategy(candles: list[Candlestick]) -> StrategySignal:
    if len(candles) < 2:
        return StrategySignal("flat", 0, "need data")

    last = candles[-1]
    prev = candles[-2]
    move = (last.close - prev.close) / prev.close

    if move > 0.0005:
        return StrategySignal("long", 0.7, "micro-up detected")
    if move < -0.0005:
        return StrategySignal("short", 0.7, "micro-down detected")
    return StrategySignal("long", 0.5, "scalp default long")


def run_strategy(style: str, candles: list[Candlestick]) -> StrategySignal:
    strategies = {
        "momentum": momentum_strategy,
        "mean_reversion": mean_reversion_strategy,
        "high_frequency": high_frequency_strategy,
    }
    fn = strategies.get(style, momentum_strategy)
    return fn(candles)
