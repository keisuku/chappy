// ============================================
// Market Simulation Engine
// Random candlestick generation with volatility clustering,
// market regimes, and random events
// HOOK: Replace with Binance WebSocket for live data
// ============================================

import { Candlestick, MarketEvent, MarketRegime, ForceEvent } from "@/types";
import { MarketForceEngine } from "./market-forces";

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

const MARKET_EVENTS: Omit<MarketEvent, "tick" | "magnitude">[] = [
  { type: "flash_crash", name: "Flash Crash", nameJa: "フラッシュクラッシュ" },
  { type: "pump", name: "Whale Pump", nameJa: "鯨の噴水" },
  { type: "liquidation_cascade", name: "Liquidation Cascade", nameJa: "連鎖清算" },
  { type: "whale_entry", name: "Whale Entry", nameJa: "鯨の参入" },
  { type: "news_spike", name: "Breaking News", nameJa: "速報スパイク" },
  { type: "regime_shift", name: "Regime Shift", nameJa: "相場転換" },
];

export class MarketSimulator {
  private rng: () => number;
  private price: number;
  private vol: number;
  private tick: number;
  private _regime: MarketRegime;
  private regimeTicks: number;
  private trendBias: number;
  public candles: Candlestick[] = [];
  public events: MarketEvent[] = [];
  public forceEngine: MarketForceEngine | null = null;
  public forceEvents: ForceEvent[] = [];

  constructor(seed = 42, startPrice = 4500000, enableForces = false) {
    this.rng = sfc32(seed, seed * 13, seed * 7, seed * 31);
    this.price = startPrice;
    this.vol = 5000;
    this.tick = 0;
    this._regime = "calm";
    this.regimeTicks = 0;
    this.trendBias = 0;
    if (enableForces) {
      this.forceEngine = new MarketForceEngine(seed);
    }
  }

  step(): Candlestick {
    this.tick++;
    this.regimeTicks++;

    // Regime transitions
    this.updateRegime();

    const open = this.price;

    // Market event generation (5% chance per tick)
    let eventImpact = 0;
    if (this.rng() < 0.05) {
      const event = this.generateEvent();
      this.events.push(event);
      eventImpact = event.magnitude;
    }

    // ── Market Forces influence ──
    let forcePriceBias = 0;
    let forceVolMultiplier = 1.0;
    if (this.forceEngine) {
      this.forceEngine.setRegime(this._regime);
      const forceResult = this.forceEngine.step();
      forcePriceBias = forceResult.priceModifier * this.vol * 0.5;
      forceVolMultiplier = forceResult.volatilityModifier;
      this.forceEvents = this.forceEngine.state.events;
    }

    // Generate intra-candle movement influenced by regime
    const regimeMultiplier = this.getRegimeVolMultiplier() * forceVolMultiplier;
    const spikeChance = this._regime === "volatile" ? 0.06 : 0.02;
    const spike =
      this.rng() < spikeChance
        ? (this.rng() < 0.5 ? -1 : 1) * (20000 + this.rng() * 80000)
        : 0;

    // Trend bias from regime + market forces
    const trendComponent = this.trendBias * this.vol * 0.3 + forcePriceBias;

    const bodySize = (this.rng() - 0.5) * this.vol * 0.6 * regimeMultiplier + spike + trendComponent + eventImpact;
    const wickUp = this.rng() * this.vol * 0.3 * regimeMultiplier;
    const wickDown = this.rng() * this.vol * 0.3 * regimeMultiplier;

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

  private updateRegime(): void {
    // Regime change every 5-15 ticks
    if (this.regimeTicks > 5 + this.rng() * 10) {
      const roll = this.rng();
      const prevRegime = this._regime;
      if (roll < 0.25) {
        this._regime = "trending";
        this.trendBias = this.rng() < 0.5 ? -0.4 : 0.4;
      } else if (roll < 0.45) {
        this._regime = "volatile";
        this.trendBias = 0;
      } else if (roll < 0.70) {
        this._regime = "ranging";
        this.trendBias = 0;
      } else {
        this._regime = "calm";
        this.trendBias = 0;
      }
      this.regimeTicks = 0;

      if (prevRegime !== this._regime) {
        this.events.push({
          type: "regime_shift",
          name: `Regime: ${this._regime}`,
          nameJa: `相場: ${this._regime}`,
          magnitude: 0,
          tick: this.tick,
        });
      }
    }
  }

  private getRegimeVolMultiplier(): number {
    switch (this._regime) {
      case "calm": return 0.6;
      case "ranging": return 0.8;
      case "trending": return 1.2;
      case "volatile": return 1.8;
    }
  }

  private generateEvent(): MarketEvent {
    const templates = MARKET_EVENTS.filter(e => e.type !== "regime_shift");
    const template = templates[Math.floor(this.rng() * templates.length)];
    const direction = this.rng() < 0.5 ? -1 : 1;

    let magnitude: number;
    switch (template.type) {
      case "flash_crash":
        magnitude = -Math.abs(this.vol * (2 + this.rng() * 4));
        break;
      case "pump":
        magnitude = Math.abs(this.vol * (2 + this.rng() * 4));
        break;
      case "liquidation_cascade":
        magnitude = direction * this.vol * (3 + this.rng() * 5);
        break;
      case "whale_entry":
        magnitude = direction * this.vol * (1 + this.rng() * 3);
        break;
      case "news_spike":
        magnitude = direction * this.vol * (1.5 + this.rng() * 3);
        break;
      default:
        magnitude = 0;
    }

    return { ...template, magnitude, tick: this.tick };
  }

  getPrice(): number {
    return this.price;
  }

  getVolatility(): number {
    return this.vol;
  }

  getRegime(): MarketRegime {
    return this._regime;
  }

  getRecentEvents(lookback = 5): MarketEvent[] {
    return this.events.filter(e => e.tick >= this.tick - lookback);
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
