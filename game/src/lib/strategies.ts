// ============================================
// Trading Strategy Engine
// Each character runs a distinct strategy
// ============================================

import { Candlestick, TradeDirection, TradingStyle } from "@/types";

export interface StrategySignal {
  direction: TradeDirection;
  confidence: number; // 0-1
  reason: string;
}

/** Momentum: follow the trend — if recent candles are up, go long */
function momentumStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 5) return { direction: "flat", confidence: 0, reason: "insufficient data" };

  const recent = candles.slice(-5);
  let bullCount = 0;
  for (const c of recent) {
    if (c.close > c.open) bullCount++;
  }

  const trend = bullCount / recent.length;
  if (trend >= 0.6) return { direction: "long", confidence: trend, reason: `${bullCount}/5 bullish candles` };
  if (trend <= 0.4) return { direction: "short", confidence: 1 - trend, reason: `${5 - bullCount}/5 bearish candles` };
  return { direction: "flat", confidence: 0.3, reason: "no clear trend" };
}

/** Mean Reversion: fade extreme moves — buy dips, sell rips */
function meanReversionStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 10) return { direction: "flat", confidence: 0, reason: "insufficient data" };

  const recent = candles.slice(-10);
  const avg = recent.reduce((s, c) => s + c.close, 0) / recent.length;
  const current = candles[candles.length - 1].close;
  const deviation = (current - avg) / avg;

  if (deviation > 0.005) return { direction: "short", confidence: Math.min(1, Math.abs(deviation) * 50), reason: `price ${(deviation * 100).toFixed(2)}% above mean` };
  if (deviation < -0.005) return { direction: "long", confidence: Math.min(1, Math.abs(deviation) * 50), reason: `price ${(deviation * 100).toFixed(2)}% below mean` };
  return { direction: "flat", confidence: 0.2, reason: "near mean" };
}

/** High Frequency: rapid scalps — enter on any small move */
function highFrequencyStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 2) return { direction: "flat", confidence: 0, reason: "need data" };

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const move = (last.close - prev.close) / prev.close;

  // HFT takes any micro-move
  if (move > 0.0005) return { direction: "long", confidence: 0.7, reason: "micro-up detected" };
  if (move < -0.0005) return { direction: "short", confidence: 0.7, reason: "micro-down detected" };
  return { direction: "long", confidence: 0.5, reason: "scalp default long" };
}

export function runStrategy(
  style: TradingStyle,
  candles: Candlestick[]
): StrategySignal {
  switch (style) {
    case "momentum":
      return momentumStrategy(candles);
    case "mean_reversion":
      return meanReversionStrategy(candles);
    case "high_frequency":
      return highFrequencyStrategy(candles);
  }
}
