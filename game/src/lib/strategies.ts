// ============================================
// Trading Strategy Engine
// Each character runs a distinct strategy
// 8 unique trading algorithms
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

  if (move > 0.0005) return { direction: "long", confidence: 0.7, reason: "micro-up detected" };
  if (move < -0.0005) return { direction: "short", confidence: 0.7, reason: "micro-down detected" };
  return { direction: "long", confidence: 0.5, reason: "scalp default long" };
}

/** Event Driven: waits for large volume spikes or price dislocations, then strikes */
function eventDrivenStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 10) return { direction: "flat", confidence: 0, reason: "insufficient data" };

  const recent = candles.slice(-10);
  const last = candles[candles.length - 1];

  // Calculate average volume and price range
  const avgVolume = recent.reduce((s, c) => s + c.volume, 0) / recent.length;
  const avgRange = recent.reduce((s, c) => s + (c.high - c.low), 0) / recent.length;
  const lastRange = last.high - last.low;

  // Volume spike detection
  const volumeRatio = last.volume / Math.max(1, avgVolume);
  const rangeRatio = lastRange / Math.max(1, avgRange);

  // Only trade when there's a significant event (volume or range spike)
  if (volumeRatio > 2.0 || rangeRatio > 2.0) {
    const direction: TradeDirection = last.close > last.open ? "long" : "short";
    const confidence = Math.min(1, (volumeRatio + rangeRatio) / 6);
    return { direction, confidence, reason: `event detected: vol ${volumeRatio.toFixed(1)}x, range ${rangeRatio.toFixed(1)}x` };
  }

  return { direction: "flat", confidence: 0.1, reason: "waiting for event catalyst" };
}

/** Arbitrage: exploits price inefficiencies by comparing short vs long-term averages */
function arbitrageStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 20) return { direction: "flat", confidence: 0, reason: "insufficient data" };

  const short5 = candles.slice(-5);
  const long20 = candles.slice(-20);

  const shortAvg = short5.reduce((s, c) => s + c.close, 0) / short5.length;
  const longAvg = long20.reduce((s, c) => s + c.close, 0) / long20.length;
  const spread = (shortAvg - longAvg) / longAvg;

  // Calculate spread volatility for dynamic thresholds
  const spreadHistory: number[] = [];
  for (let i = 5; i <= candles.length; i++) {
    const s5 = candles.slice(i - 5, i);
    const l20 = candles.slice(Math.max(0, i - 20), i);
    const sa = s5.reduce((s, c) => s + c.close, 0) / s5.length;
    const la = l20.reduce((s, c) => s + c.close, 0) / l20.length;
    spreadHistory.push((sa - la) / la);
  }
  const spreadMean = spreadHistory.reduce((a, b) => a + b, 0) / spreadHistory.length;
  const spreadStd = Math.sqrt(spreadHistory.reduce((s, v) => s + (v - spreadMean) ** 2, 0) / spreadHistory.length);
  const zScore = spreadStd > 0 ? (spread - spreadMean) / spreadStd : 0;

  // Trade when spread is extended (mean reversion of the spread itself)
  if (zScore > 1.5) return { direction: "short", confidence: Math.min(1, zScore / 3), reason: `spread z-score ${zScore.toFixed(2)} — converge short` };
  if (zScore < -1.5) return { direction: "long", confidence: Math.min(1, Math.abs(zScore) / 3), reason: `spread z-score ${zScore.toFixed(2)} — converge long` };
  return { direction: "flat", confidence: 0.15, reason: `spread neutral (z=${zScore.toFixed(2)})` };
}

/** Contrarian: buys extreme fear, sells extreme greed — anti-crowd */
function contrarianStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 14) return { direction: "flat", confidence: 0, reason: "insufficient data" };

  const recent = candles.slice(-14);

  // RSI calculation
  let gains = 0, losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i].close - recent[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / (recent.length - 1);
  const avgLoss = losses / (recent.length - 1);
  const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
  const rsi = 100 - 100 / (1 + rs);

  // Consecutive candle direction (crowd sentiment proxy)
  let streak = 0;
  for (let i = candles.length - 1; i >= Math.max(0, candles.length - 7); i--) {
    const bullish = candles[i].close > candles[i].open;
    if (i === candles.length - 1) {
      streak = bullish ? 1 : -1;
    } else {
      const sameSide = bullish ? streak > 0 : streak < 0;
      if (sameSide) streak += bullish ? 1 : -1;
      else break;
    }
  }

  // Buy fear (oversold + bearish streak), sell greed (overbought + bullish streak)
  if (rsi < 25 && streak <= -3) return { direction: "long", confidence: Math.min(1, (100 - rsi) / 100 + Math.abs(streak) / 10), reason: `extreme fear: RSI ${rsi.toFixed(0)}, ${Math.abs(streak)}-candle selloff` };
  if (rsi > 75 && streak >= 3) return { direction: "short", confidence: Math.min(1, rsi / 100 + streak / 10), reason: `extreme greed: RSI ${rsi.toFixed(0)}, ${streak}-candle rally` };
  if (rsi < 35) return { direction: "long", confidence: 0.4, reason: `oversold RSI ${rsi.toFixed(0)}` };
  if (rsi > 65) return { direction: "short", confidence: 0.4, reason: `overbought RSI ${rsi.toFixed(0)}` };
  return { direction: "flat", confidence: 0.1, reason: `neutral RSI ${rsi.toFixed(0)}` };
}

/** Scalper: ultra-tight entries with strict stop-loss discipline */
function scalperStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 5) return { direction: "flat", confidence: 0, reason: "need data" };

  const recent = candles.slice(-5);
  const last = candles[candles.length - 1];

  // Calculate ATR for dynamic thresholds
  let atr = 0;
  for (let i = 1; i < recent.length; i++) {
    atr += Math.max(
      recent[i].high - recent[i].low,
      Math.abs(recent[i].high - recent[i - 1].close),
      Math.abs(recent[i].low - recent[i - 1].close)
    );
  }
  atr /= recent.length - 1;

  // Look for wick rejection patterns (strong reversal signals)
  const bodySize = Math.abs(last.close - last.open);
  const upperWick = last.high - Math.max(last.close, last.open);
  const lowerWick = Math.min(last.close, last.open) - last.low;

  // Long wick = rejection = scalp opposite direction
  if (upperWick > bodySize * 2 && upperWick > atr * 0.3) {
    return { direction: "short", confidence: 0.8, reason: "upper wick rejection scalp" };
  }
  if (lowerWick > bodySize * 2 && lowerWick > atr * 0.3) {
    return { direction: "long", confidence: 0.8, reason: "lower wick rejection scalp" };
  }

  // Micro-breakout: price breaks above/below recent range
  const rangeHigh = Math.max(...recent.map(c => c.high));
  const rangeLow = Math.min(...recent.map(c => c.low));
  if (last.close >= rangeHigh) return { direction: "long", confidence: 0.65, reason: "micro-breakout high" };
  if (last.close <= rangeLow) return { direction: "short", confidence: 0.65, reason: "micro-breakout low" };

  return { direction: "flat", confidence: 0.3, reason: "no scalp setup" };
}

/** Volatility Breaker: profits from volatility expansion/contraction cycles */
function volatilityBreakerStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 20) return { direction: "flat", confidence: 0, reason: "insufficient data" };

  const recent = candles.slice(-20);

  // Calculate Bollinger Band width (volatility measure)
  const closes = recent.map(c => c.close);
  const sma = closes.reduce((a, b) => a + b, 0) / closes.length;
  const std = Math.sqrt(closes.reduce((s, c) => s + (c - sma) ** 2, 0) / closes.length);
  const bandWidth = (std * 2) / sma; // normalized band width

  // Compare current bandwidth to historical
  const recentBW: number[] = [];
  for (let i = 10; i <= candles.length; i++) {
    const slice = candles.slice(i - 10, i);
    const m = slice.reduce((s, c) => s + c.close, 0) / slice.length;
    const sd = Math.sqrt(slice.reduce((s, c) => s + (c.close - m) ** 2, 0) / slice.length);
    recentBW.push((sd * 2) / m);
  }
  const avgBW = recentBW.reduce((a, b) => a + b, 0) / recentBW.length;

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  // Squeeze breakout: bandwidth compressed then expanding
  if (bandWidth < avgBW * 0.6) {
    // Volatility compressed — prepare for breakout
    const breakDirection = last.close > sma ? "long" : "short";
    return { direction: breakDirection, confidence: 0.6, reason: `volatility squeeze — bandwidth ${(bandWidth * 100).toFixed(3)}% (avg ${(avgBW * 100).toFixed(3)}%)` };
  }

  // Volatility expansion: ride the move
  if (bandWidth > avgBW * 1.5) {
    const momentum = last.close - prev.close;
    const direction: TradeDirection = momentum > 0 ? "long" : "short";
    return { direction, confidence: 0.75, reason: `vol expansion — riding ${direction}` };
  }

  return { direction: "flat", confidence: 0.2, reason: "normal volatility" };
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
    case "event_driven":
      return eventDrivenStrategy(candles);
    case "arbitrage":
      return arbitrageStrategy(candles);
    case "contrarian":
      return contrarianStrategy(candles);
    case "scalper":
      return scalperStrategy(candles);
    case "volatility_breaker":
      return volatilityBreakerStrategy(candles);
  }
}
