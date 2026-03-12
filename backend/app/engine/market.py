"""Market Simulation Engine — ported from game/src/lib/market.ts"""

from __future__ import annotations

import ctypes
from dataclasses import dataclass, field


@dataclass
class Candlestick:
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float


def _sfc32(a: int, b: int, c: int, d: int):
    """Seeded RNG matching the TypeScript sfc32 implementation."""
    # Use ctypes to simulate 32-bit integer overflow
    def _to_i32(x: int) -> int:
        return ctypes.c_int32(x).value

    def _to_u32(x: int) -> int:
        return ctypes.c_uint32(x).value

    state = [_to_i32(a), _to_i32(b), _to_i32(c), _to_i32(d)]

    def next_val() -> float:
        state[3] = _to_i32(state[3] + 1)
        t = _to_i32(_to_i32(state[0] + state[1]) + state[3])
        state[0] = state[1] ^ (_to_u32(state[1]) >> 9)
        state[1] = _to_i32(state[2] + _to_i32(state[2] << 3))
        state[2] = _to_i32(state[2] << 21) | (_to_u32(state[2]) >> 11)
        state[2] = _to_i32(state[2] + t)
        return _to_u32(state[2]) / 4294967296

    return next_val


class MarketSimulator:
    def __init__(self, seed: int = 42, start_price: float = 4_500_000):
        self.rng = _sfc32(seed, seed * 13, seed * 7, seed * 31)
        self.price = start_price
        self.vol = 5000.0
        self.tick = 0
        self.candles: list[Candlestick] = []

    def step(self) -> Candlestick:
        self.tick += 1
        open_price = self.price

        spike_chance = 0.02
        r = self.rng()
        if r < spike_chance:
            spike = (-1 if self.rng() < 0.5 else 1) * (20000 + self.rng() * 80000)
        else:
            spike = 0.0

        body_size = (self.rng() - 0.5) * self.vol * 0.6 + spike
        wick_up = self.rng() * self.vol * 0.3
        wick_down = self.rng() * self.vol * 0.3

        close = max(100000, open_price + body_size)
        high = max(open_price, close) + wick_up
        low = min(open_price, close) - wick_down

        self.vol = max(2000, abs(body_size) * 0.3 + self.vol * 0.92)
        self.price = close

        candle = Candlestick(
            time=self.tick,
            open=open_price,
            high=max(high, max(open_price, close)),
            low=max(1000, min(low, min(open_price, close))),
            close=close,
            volume=abs(body_size) * (50 + self.rng() * 200),
        )

        self.candles.append(candle)
        if len(self.candles) > 120:
            self.candles.pop(0)

        return candle

    def get_price(self) -> float:
        return self.price

    def get_volatility(self) -> float:
        return self.vol

    def get_atr(self, period: int = 14) -> float:
        if len(self.candles) < 2:
            return self.vol
        recent = self.candles[-period:]
        atr = 0.0
        for i in range(1, len(recent)):
            tr = max(
                recent[i].high - recent[i].low,
                abs(recent[i].high - recent[i - 1].close),
                abs(recent[i].low - recent[i - 1].close),
            )
            atr += tr
        return atr / max(1, len(recent) - 1)

    def get_stage(self) -> int:
        atr = self.get_atr()
        return max(1, min(8, int(atr / 8000) + 1))
