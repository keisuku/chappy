// ============================================
// Trading Strategy Engine — 8 Core Archetypes
// Each archetype runs a distinct trading algorithm
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

// ---- Helpers ----

function avg(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr: number[]): number {
  const m = avg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

// ---- 1. Scalper ----
// Rapid micro-trades on any small price movement
function scalperStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 2) return { direction: "flat", confidence: 0, reason: "need data" };

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const move = (last.close - prev.close) / prev.close;

  // Scalper takes any micro-move aggressively
  if (move > 0.0003) return { direction: "long", confidence: 0.7, reason: "micro-up scalp" };
  if (move < -0.0003) return { direction: "short", confidence: 0.7, reason: "micro-down scalp" };
  return { direction: "long", confidence: 0.5, reason: "default long scalp" };
}

// ---- 2. Momentum ----
// Follows established trends — rides winners
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

// ---- 3. Mean Reversion ----
// Fades extreme moves — buy dips, sell rips
function meanReversionStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 10) return { direction: "flat", confidence: 0, reason: "insufficient data" };

  const recent = candles.slice(-10);
  const mean = avg(recent.map((c) => c.close));
  const current = candles[candles.length - 1].close;
  const deviation = (current - mean) / mean;

  if (deviation > 0.005) return { direction: "short", confidence: Math.min(1, Math.abs(deviation) * 50), reason: `${(deviation * 100).toFixed(2)}% above mean` };
  if (deviation < -0.005) return { direction: "long", confidence: Math.min(1, Math.abs(deviation) * 50), reason: `${(deviation * 100).toFixed(2)}% below mean` };
  return { direction: "flat", confidence: 0.2, reason: "near mean" };
}

// ---- 4. Breakout ----
// Detects range compression then trades the expansion
function breakoutStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 15) return { direction: "flat", confidence: 0, reason: "insufficient data" };

  const lookback = candles.slice(-15, -1); // previous 14 candles (excluding current)
  const current = candles[candles.length - 1];
  const highs = lookback.map((c) => c.high);
  const lows = lookback.map((c) => c.low);
  const rangeHigh = Math.max(...highs);
  const rangeLow = Math.min(...lows);
  const rangeSize = rangeHigh - rangeLow;

  // Check if recent range is compressing (last 5 vs previous 10)
  const recentRange = Math.max(...candles.slice(-5).map((c) => c.high)) - Math.min(...candles.slice(-5).map((c) => c.low));
  const compression = recentRange / rangeSize;

  // Breakout above or below range
  if (current.close > rangeHigh) {
    const strength = Math.min(1, (current.close - rangeHigh) / (rangeSize * 0.5));
    return { direction: "long", confidence: 0.6 + strength * 0.4, reason: `breakout above ${rangeHigh.toFixed(0)}` };
  }
  if (current.close < rangeLow) {
    const strength = Math.min(1, (rangeLow - current.close) / (rangeSize * 0.5));
    return { direction: "short", confidence: 0.6 + strength * 0.4, reason: `breakdown below ${rangeLow.toFixed(0)}` };
  }

  // Compressing — wait for breakout
  if (compression < 0.5) {
    return { direction: "flat", confidence: 0.1, reason: `range compressing (${(compression * 100).toFixed(0)}%)` };
  }

  return { direction: "flat", confidence: 0.2, reason: "inside range, waiting" };
}

// ---- 5. Market Maker ----
// Profits from spread by placing both sides, net position based on imbalance
function marketMakerStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 8) return { direction: "flat", confidence: 0, reason: "insufficient data" };

  const recent = candles.slice(-8);
  const closes = recent.map((c) => c.close);
  const mean = avg(closes);
  const sd = stddev(closes);
  const current = candles[candles.length - 1].close;
  const zScore = sd > 0 ? (current - mean) / sd : 0;

  // Market maker leans against extremes but with lower conviction
  // Profits from mean-reverting behavior with tighter bands
  if (zScore > 0.8) return { direction: "short", confidence: 0.5, reason: `lean short, z=${zScore.toFixed(2)}` };
  if (zScore < -0.8) return { direction: "long", confidence: 0.5, reason: `lean long, z=${zScore.toFixed(2)}` };

  // In balanced zone, take tiny directional bets based on last candle
  const lastMove = candles[candles.length - 1].close - candles[candles.length - 2].close;
  if (lastMove > 0) return { direction: "short", confidence: 0.35, reason: "spread capture — fade up" };
  if (lastMove < 0) return { direction: "long", confidence: 0.35, reason: "spread capture — fade down" };
  return { direction: "flat", confidence: 0.3, reason: "balanced spread" };
}

// ---- 6. News Hunter ----
// Detects volume/volatility spikes as proxy for news events
function newsHunterStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 10) return { direction: "flat", confidence: 0, reason: "insufficient data" };

  const recent = candles.slice(-10, -1);
  const current = candles[candles.length - 1];

  const avgVolume = avg(recent.map((c) => c.volume));
  const avgRange = avg(recent.map((c) => c.high - c.low));

  const volumeSpike = current.volume / avgVolume;
  const rangeSpike = (current.high - current.low) / avgRange;

  // Detect "news event" via volume + range spike
  if (volumeSpike > 2.0 || rangeSpike > 2.0) {
    const direction = current.close > current.open ? "long" : "short";
    const spike = Math.max(volumeSpike, rangeSpike);
    return {
      direction,
      confidence: Math.min(1, spike * 0.3),
      reason: `event detected! vol=${volumeSpike.toFixed(1)}x range=${rangeSpike.toFixed(1)}x`,
    };
  }

  // Dormant — scanning for events
  return { direction: "flat", confidence: 0.1, reason: "scanning for events..." };
}

// ---- 7. Whale Tracker ----
// Follows large volume candles as proxy for institutional flow
function whaleTrackerStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 12) return { direction: "flat", confidence: 0, reason: "insufficient data" };

  const lookback = candles.slice(-12, -1);
  const current = candles[candles.length - 1];
  const avgVolume = avg(lookback.map((c) => c.volume));

  // Detect whale activity via volume
  const volumeRatio = current.volume / avgVolume;

  if (volumeRatio > 1.8) {
    // Follow the whale's direction
    const direction = current.close > current.open ? "long" : "short";
    return {
      direction,
      confidence: Math.min(1, volumeRatio * 0.25),
      reason: `whale detected (${volumeRatio.toFixed(1)}x vol)`,
    };
  }

  // Check for accumulation pattern — multiple above-average volume candles in same direction
  const recentHigh = candles.slice(-4);
  const aboveAvgBull = recentHigh.filter((c) => c.volume > avgVolume * 1.2 && c.close > c.open).length;
  const aboveAvgBear = recentHigh.filter((c) => c.volume > avgVolume * 1.2 && c.close < c.open).length;

  if (aboveAvgBull >= 3) return { direction: "long", confidence: 0.6, reason: "whale accumulation pattern" };
  if (aboveAvgBear >= 3) return { direction: "short", confidence: 0.6, reason: "whale distribution pattern" };

  return { direction: "flat", confidence: 0.15, reason: "tracking whale flow..." };
}

// ---- 8. Hybrid AI ----
// Dynamically selects the best strategy based on market regime
function hybridAIStrategy(candles: Candlestick[]): StrategySignal {
  if (candles.length < 15) return { direction: "flat", confidence: 0, reason: "calibrating..." };

  const recent = candles.slice(-10);
  const closes = recent.map((c) => c.close);

  // Detect market regime
  const sd = stddev(closes);
  const mean = avg(closes);
  const cv = sd / mean; // coefficient of variation

  // Count trend direction
  let bullCount = 0;
  for (const c of recent) {
    if (c.close > c.open) bullCount++;
  }
  const trendStrength = Math.abs(bullCount - 5) / 5; // 0 = choppy, 1 = strong trend

  // High volatility + strong trend → use momentum
  if (cv > 0.003 && trendStrength > 0.4) {
    const signal = momentumStrategy(candles);
    return { ...signal, reason: `[HYBRID→MOM] ${signal.reason}` };
  }

  // Low volatility → use scalper
  if (cv < 0.001) {
    const signal = scalperStrategy(candles);
    return { ...signal, reason: `[HYBRID→SCA] ${signal.reason}` };
  }

  // Check for volume spikes → news hunter
  const avgVol = avg(recent.map((c) => c.volume));
  const currentVol = candles[candles.length - 1].volume;
  if (currentVol > avgVol * 2.5) {
    const signal = newsHunterStrategy(candles);
    return { ...signal, reason: `[HYBRID→NEWS] ${signal.reason}` };
  }

  // Check for range compression → breakout
  const rangeRecent = Math.max(...candles.slice(-5).map((c) => c.high)) - Math.min(...candles.slice(-5).map((c) => c.low));
  const rangePrev = Math.max(...candles.slice(-15, -5).map((c) => c.high)) - Math.min(...candles.slice(-15, -5).map((c) => c.low));
  if (rangeRecent / rangePrev < 0.4) {
    const signal = breakoutStrategy(candles);
    return { ...signal, reason: `[HYBRID→BRK] ${signal.reason}` };
  }

  // Default → mean reversion
  const signal = meanReversionStrategy(candles);
  return { ...signal, reason: `[HYBRID→MR] ${signal.reason}` };
}

// ---- Router ----

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
    case "scalper":
      return scalperStrategy(candles);
    case "momentum":
      return momentumStrategy(candles);
    case "mean_reversion":
      return meanReversionStrategy(candles);
    case "breakout":
      return breakoutStrategy(candles);
    case "market_maker":
      return marketMakerStrategy(candles);
    case "news_hunter":
      return newsHunterStrategy(candles);
    case "whale_tracker":
      return whaleTrackerStrategy(candles);
    case "hybrid_ai":
      return hybridAIStrategy(candles);
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
