// ============================================
// Market Simulation Engine
// Random candlestick generation with volatility clustering
// HOOK: Replace with Binance WebSocket for live data
// ============================================

import { Candlestick } from "@/types";

// Seeded RNG for deterministic results
function sfc32(a: number, b: number, c: number, d: number) {
  return function (): number {
    a |= 0; b |= 0; c |= 0; d |= 0;
    const t = ((a + b) | 0) + (d = (d + 1) | 0) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    return ((c = (c + t) | 0) >>> 0) / 4294967296;
  };
}

export class MarketSimulator {
  private rng: () => number;
  private price: number;
  private vol: number;
  private tick: number;
  public candles: Candlestick[] = [];

  constructor(seed = 42, startPrice = 4500000) {
    this.rng = sfc32(seed, seed * 13, seed * 7, seed * 31);
    this.price = startPrice;
    this.vol = 5000;
    this.tick = 0;
  }

  step(): Candlestick {
    this.tick++;
    const open = this.price;

    // Generate intra-candle movement
    const spikeChance = 0.02;
    const spike =
      this.rng() < spikeChance
        ? (this.rng() < 0.5 ? -1 : 1) * (20000 + this.rng() * 80000)
        : 0;

    const bodySize = (this.rng() - 0.5) * this.vol * 0.6 + spike;
    const wickUp = this.rng() * this.vol * 0.3;
    const wickDown = this.rng() * this.vol * 0.3;

    const close = Math.max(100000, open + bodySize);
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;

    // Volatility clustering
    this.vol = Math.max(2000, Math.abs(bodySize) * 0.3 + this.vol * 0.92);
    this.price = close;

    const candle: Candlestick = {
      time: this.tick,
      open,
      high: Math.max(high, Math.max(open, close)),
      low: Math.max(1000, Math.min(low, Math.min(open, close))),
      close,
      volume: Math.abs(bodySize) * (50 + this.rng() * 200),
    };

    this.candles.push(candle);
    if (this.candles.length > 120) this.candles.shift();

    return candle;
  }

  getPrice(): number {
    return this.price;
  }

  getVolatility(): number {
    return this.vol;
  }

  getATR(period = 14): number {
    if (this.candles.length < 2) return this.vol;
    const recent = this.candles.slice(-period);
    let atr = 0;
    for (let i = 1; i < recent.length; i++) {
      const tr = Math.max(
        recent[i].high - recent[i].low,
        Math.abs(recent[i].high - recent[i - 1].close),
        Math.abs(recent[i].low - recent[i - 1].close)
      );
      atr += tr;
    }
    return atr / Math.max(1, recent.length - 1);
  }

  /** Sigma stage 1-8 based on ATR */
  getStage(): number {
    const atr = this.getATR();
    return Math.max(1, Math.min(8, Math.floor(atr / 8000) + 1));
  }
}
