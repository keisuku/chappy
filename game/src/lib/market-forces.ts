// ============================================
// Market Force Engine
// Forces (Whale, Bull, Bear, Shark, Retail)
// compete for market dominance, influencing
// price movement probability and volatility.
// Outputs visualizable ForceEvents.
// ============================================

import {
  MarketForce,
  MarketForceType,
  ForceState,
  ForceEvent,
  ForceEventType,
  ForceBattleState,
  MarketRegime,
} from "@/types";

// ── Force Definitions ──

const FORCE_DEFS: MarketForce[] = [
  {
    type: "whale",
    name: "Whale",
    nameJa: "鯨",
    description: "Massive capital that moves markets with single orders. Slow but devastating.",
    color: "#4488ff",
    power: 0,
    basePower: 75,
    bias: 0,               // neutral — whales move both directions
    volatilityImpact: 1.8,  // huge vol spikes
    momentum: 0,            // no inherent trend
    icon: "W",
  },
  {
    type: "bull",
    name: "Bull",
    nameJa: "牛",
    description: "Relentless buying pressure. Pushes price higher through conviction.",
    color: "#00ff88",
    power: 0,
    basePower: 60,
    bias: 0.7,              // strongly bullish
    volatilityImpact: 1.2,
    momentum: 0.4,          // accelerates uptrends
    icon: "B",
  },
  {
    type: "bear",
    name: "Bear",
    nameJa: "熊",
    description: "Crushing selling pressure. Drives price down through fear and liquidation.",
    color: "#ff2d55",
    power: 0,
    basePower: 60,
    bias: -0.7,             // strongly bearish
    volatilityImpact: 1.4,  // bears create more panic
    momentum: -0.4,         // accelerates downtrends
    icon: "R",
  },
  {
    type: "shark",
    name: "Shark",
    nameJa: "鮫",
    description: "Predatory force that hunts stop losses and liquidates weak positions.",
    color: "#ffd700",
    power: 0,
    basePower: 55,
    bias: 0,                // hunts both directions
    volatilityImpact: 2.0,  // max volatility — stop hunts create spikes
    momentum: 0,
    icon: "S",
  },
  {
    type: "retail",
    name: "Retail",
    nameJa: "個人",
    description: "Crowd sentiment. Often late to trends and vulnerable to manipulation.",
    color: "#aa88ff",
    power: 0,
    basePower: 40,
    bias: 0.2,              // slight bullish bias (FOMO)
    volatilityImpact: 0.8,  // retail smooths volatility
    momentum: 0.6,          // strong trend-following (herd behavior)
    icon: "P",
  },
];

export function getForceDefinition(type: MarketForceType): MarketForce {
  return FORCE_DEFS.find((f) => f.type === type)!;
}

export function getAllForceDefinitions(): MarketForce[] {
  return [...FORCE_DEFS];
}

// ── Force Matchup Matrix ──
// Defines which forces beat which in direct confrontation
// Returns power multiplier for attacker (>1 = advantage)
const FORCE_MATCHUPS: Record<MarketForceType, Partial<Record<MarketForceType, number>>> = {
  whale: { retail: 1.8, shark: 1.3, bear: 0.9, bull: 0.9 },   // whales crush retail, outsize sharks
  bull:  { bear: 1.4, retail: 1.1, shark: 0.8, whale: 0.9 },   // bulls overpower bears in rallies
  bear:  { bull: 1.4, retail: 1.3, shark: 0.9, whale: 0.9 },   // bears crush bulls in panics
  shark: { retail: 1.6, bull: 1.2, bear: 1.1, whale: 0.7 },    // sharks eat retail, struggle vs whales
  retail:{ whale: 0.5, shark: 0.6, bull: 0.9, bear: 0.7 },     // retail is food for everyone
};

function getForceAdvantage(attacker: MarketForceType, defender: MarketForceType): number {
  return FORCE_MATCHUPS[attacker]?.[defender] ?? 1.0;
}

// ── Regime Affinity ──
// How much each force benefits from each market regime
const REGIME_AFFINITY: Record<MarketForceType, Record<MarketRegime, number>> = {
  whale:  { calm: 1.4, ranging: 1.0, trending: 0.8, volatile: 1.3 },
  bull:   { calm: 0.8, ranging: 0.7, trending: 1.5, volatile: 1.0 },
  bear:   { calm: 0.7, ranging: 0.8, trending: 1.3, volatile: 1.5 },
  shark:  { calm: 0.6, ranging: 1.3, trending: 0.9, volatile: 1.5 },
  retail: { calm: 1.2, ranging: 1.0, trending: 1.3, volatile: 0.5 },
};

// ── Special Abilities ──

interface ForceAbility {
  name: string;
  nameJa: string;
  description: string;
  cooldown: number;
  triggerThreshold: number; // energy threshold to activate
  priceImpact: number;
  volatilityImpact: number;
  powerCost: number;       // energy cost
}

const FORCE_ABILITIES: Record<MarketForceType, ForceAbility> = {
  whale: {
    name: "Market Maker Slam",
    nameJa: "板砕き",
    description: "Whale drops massive limit order, slamming price through all resistance",
    cooldown: 8,
    triggerThreshold: 60,
    priceImpact: 3.0,
    volatilityImpact: 2.5,
    powerCost: 40,
  },
  bull: {
    name: "FOMO Rally",
    nameJa: "上昇狂騒",
    description: "Bull triggers cascading buy orders as fear-of-missing-out spreads",
    cooldown: 6,
    triggerThreshold: 50,
    priceImpact: 2.0,
    volatilityImpact: 1.5,
    powerCost: 30,
  },
  bear: {
    name: "Liquidation Cascade",
    nameJa: "連鎖清算",
    description: "Bear triggers cascading liquidations, each one feeding the next",
    cooldown: 6,
    triggerThreshold: 50,
    priceImpact: -2.5,
    volatilityImpact: 2.0,
    powerCost: 30,
  },
  shark: {
    name: "Stop Hunt",
    nameJa: "ストップ狩り",
    description: "Shark spikes price to trigger stop losses, then reverses for profit",
    cooldown: 5,
    triggerThreshold: 40,
    priceImpact: 0,  // net zero — spike then reverse
    volatilityImpact: 3.0,
    powerCost: 25,
  },
  retail: {
    name: "Herd Stampede",
    nameJa: "群衆暴走",
    description: "Retail crowd piles in simultaneously, creating a short-lived momentum burst",
    cooldown: 10,
    triggerThreshold: 70,
    priceImpact: 1.5,
    volatilityImpact: 1.2,
    powerCost: 50,
  },
};

// ── Seeded RNG ──
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

// ── Market Force Engine ──

export class MarketForceEngine {
  private rng: () => number;
  private _state: ForceBattleState;
  private regime: MarketRegime;

  constructor(seed = 42) {
    this.rng = sfc32(seed * 3, seed * 17, seed * 11, seed * 37);
    this.regime = "calm";

    const forces: Record<MarketForceType, ForceState> = {} as Record<MarketForceType, ForceState>;
    for (const def of FORCE_DEFS) {
      const force = { ...def, power: def.basePower * (0.8 + this.rng() * 0.4) };
      forces[def.type] = {
        force,
        energy: 50 + this.rng() * 30,
        cooldown: 0,
        streak: 0,
        totalInfluence: 0,
      };
    }

    this._state = {
      forces,
      dominantForce: null,
      tension: 0.3,
      events: [],
      tick: 0,
    };
  }

  get state(): ForceBattleState {
    return this._state;
  }

  setRegime(regime: MarketRegime): void {
    this.regime = regime;
  }

  /** Advance one tick. Returns events generated and net price/vol modifiers. */
  step(): { priceModifier: number; volatilityModifier: number; events: ForceEvent[] } {
    this._state.tick++;
    const tick = this._state.tick;
    const tickEvents: ForceEvent[] = [];

    const types: MarketForceType[] = ["whale", "bull", "bear", "shark", "retail"];

    // ── Phase 1: Energy regeneration ──
    for (const t of types) {
      const fs = this._state.forces[t];
      fs.energy = Math.min(100, fs.energy + 3 + this.rng() * 5);
      if (fs.cooldown > 0) fs.cooldown--;
    }

    // ── Phase 2: Power fluctuation based on regime ──
    for (const t of types) {
      const fs = this._state.forces[t];
      const affinity = REGIME_AFFINITY[t][this.regime];
      const drift = (this.rng() - 0.5) * 8 * affinity;
      fs.force.power = clamp(fs.force.power + drift, 5, 100);
    }

    // ── Phase 3: Force clashes (pair-wise interactions) ──
    // Pick 1-2 random clash pairs per tick
    const clashCount = this.rng() < 0.4 ? 2 : 1;
    for (let c = 0; c < clashCount; c++) {
      const i = Math.floor(this.rng() * types.length);
      let j = Math.floor(this.rng() * (types.length - 1));
      if (j >= i) j++;

      const attacker = types[i];
      const defender = types[j];
      const attackerState = this._state.forces[attacker];
      const defenderState = this._state.forces[defender];

      const advantage = getForceAdvantage(attacker, defender);
      const attackPower = attackerState.force.power * advantage;
      const defendPower = defenderState.force.power;

      if (attackPower > defendPower * 1.3) {
        // Attacker dominates
        const damage = (attackPower - defendPower) * 0.15;
        defenderState.force.power = Math.max(5, defenderState.force.power - damage);
        attackerState.force.power = Math.min(100, attackerState.force.power + damage * 0.3);

        tickEvents.push({
          tick,
          type: "force_clash",
          actorForce: attacker,
          targetForce: defender,
          name: `${attackerState.force.name} overpowers ${defenderState.force.name}`,
          nameJa: `${attackerState.force.nameJa}が${defenderState.force.nameJa}を圧倒`,
          description: `${attackerState.force.name} crushes ${defenderState.force.name} — power shift!`,
          priceImpact: attackerState.force.bias * damage * 0.01,
          volatilityImpact: 1.1,
          magnitude: damage / 30,
        });
      } else if (Math.abs(attackPower - defendPower) < defendPower * 0.2) {
        // Contested — tension rises
        this._state.tension = Math.min(1, this._state.tension + 0.08);
      }
    }

    // ── Phase 4: Special ability triggers ──
    for (const t of types) {
      const fs = this._state.forces[t];
      const ability = FORCE_ABILITIES[t];

      if (
        fs.cooldown <= 0 &&
        fs.energy >= ability.triggerThreshold &&
        fs.force.power > 50 &&
        this.rng() < 0.15  // 15% chance when conditions met
      ) {
        fs.energy -= ability.powerCost;
        fs.cooldown = ability.cooldown;

        tickEvents.push({
          tick,
          type: "force_special",
          actorForce: t,
          name: ability.name,
          nameJa: ability.nameJa,
          description: ability.description,
          priceImpact: ability.priceImpact,
          volatilityImpact: ability.volatilityImpact,
          magnitude: 0.8 + this.rng() * 0.2,
        });

        // Shark stop hunt: spike then reverse — creates wild wick
        if (t === "shark") {
          const spikeDir = this.rng() < 0.5 ? 1 : -1;
          tickEvents.push({
            tick,
            type: "force_special",
            actorForce: "shark",
            name: "Reversal Snap",
            nameJa: "反転",
            description: "Price reverses violently after stop hunt completes",
            priceImpact: -spikeDir * 1.5,
            volatilityImpact: 1.5,
            magnitude: 0.6,
          });
        }
      }
    }

    // ── Phase 5: Force surges (random power spikes) ──
    if (this.rng() < 0.08) {
      const surgeForce = types[Math.floor(this.rng() * types.length)];
      const fs = this._state.forces[surgeForce];
      const surgeAmount = 15 + this.rng() * 25;
      fs.force.power = Math.min(100, fs.force.power + surgeAmount);
      fs.energy = Math.min(100, fs.energy + 20);

      tickEvents.push({
        tick,
        type: "force_surge",
        actorForce: surgeForce,
        name: `${fs.force.name} Surge`,
        nameJa: `${fs.force.nameJa}急騰`,
        description: `${fs.force.name} power surges by ${surgeAmount.toFixed(0)}!`,
        priceImpact: fs.force.bias * surgeAmount * 0.02,
        volatilityImpact: 1.3,
        magnitude: surgeAmount / 40,
      });
    }

    // ── Phase 6: Retreats (weak forces fade) ──
    for (const t of types) {
      const fs = this._state.forces[t];
      if (fs.force.power < 15 && this.rng() < 0.3) {
        tickEvents.push({
          tick,
          type: "force_retreat",
          actorForce: t,
          name: `${fs.force.name} Retreats`,
          nameJa: `${fs.force.nameJa}撤退`,
          description: `${fs.force.name} withdraws from the arena — power too low`,
          priceImpact: -fs.force.bias * 0.5,
          volatilityImpact: 0.9,
          magnitude: 0.3,
        });
        // Gradually recover after retreat
        fs.force.power += 10;
        fs.energy = Math.min(100, fs.energy + 15);
      }
    }

    // ── Phase 7: Determine dominant force ──
    let maxPower = 0;
    let secondPower = 0;
    let dominant: MarketForceType | null = null;

    for (const t of types) {
      const p = this._state.forces[t].force.power;
      if (p > maxPower) {
        secondPower = maxPower;
        maxPower = p;
        dominant = t;
      } else if (p > secondPower) {
        secondPower = p;
      }
    }

    // Only dominant if clearly ahead
    if (maxPower > secondPower * 1.3 && dominant) {
      if (this._state.dominantForce !== dominant) {
        const prev = this._state.dominantForce;
        this._state.dominantForce = dominant;
        const fs = this._state.forces[dominant];

        tickEvents.push({
          tick,
          type: "force_shift",
          actorForce: dominant,
          targetForce: prev ?? undefined,
          name: `${fs.force.name} Takes Control`,
          nameJa: `${fs.force.nameJa}が支配`,
          description: prev
            ? `${fs.force.name} wrests control from ${this._state.forces[prev].force.name}!`
            : `${fs.force.name} seizes market dominance!`,
          priceImpact: fs.force.bias * 1.0,
          volatilityImpact: 1.4,
          magnitude: 0.7,
        });

        // Reset streak
        for (const t2 of types) this._state.forces[t2].streak = 0;
      }
      // Increment dominant streak
      if (dominant) {
        this._state.forces[dominant].streak++;
      }
    } else {
      // No clear dominant — contested market
      this._state.dominantForce = null;
      this._state.tension = Math.min(1, this._state.tension + 0.03);
    }

    // ── Phase 8: Tension decay ──
    if (this._state.dominantForce) {
      this._state.tension = Math.max(0, this._state.tension - 0.05);
    }

    // ── Phase 9: Track cumulative influence ──
    for (const t of types) {
      const fs = this._state.forces[t];
      fs.totalInfluence += fs.force.power * 0.01;
    }

    // ── Aggregate outputs ──
    let priceModifier = 0;
    let volatilityModifier = 1.0;

    // Base force contribution: weighted by power
    let totalPower = 0;
    for (const t of types) totalPower += this._state.forces[t].force.power;

    for (const t of types) {
      const fs = this._state.forces[t];
      const weight = fs.force.power / Math.max(1, totalPower);
      priceModifier += fs.force.bias * weight;
      volatilityModifier *= 1 + (fs.force.volatilityImpact - 1) * weight;

      // Momentum contribution
      if (fs.force.momentum !== 0) {
        priceModifier += fs.force.momentum * weight * 0.3;
      }
    }

    // Event impacts
    for (const ev of tickEvents) {
      priceModifier += ev.priceImpact * 0.1;
      volatilityModifier *= ev.volatilityImpact;
    }

    // Tension increases volatility
    volatilityModifier *= 1 + this._state.tension * 0.5;

    // Store events
    this._state.events.push(...tickEvents);
    // Keep last 100 events
    if (this._state.events.length > 100) {
      this._state.events = this._state.events.slice(-100);
    }

    return {
      priceModifier: clamp(priceModifier, -1, 1),
      volatilityModifier: clamp(volatilityModifier, 0.3, 4.0),
      events: tickEvents,
    };
  }

  /** Get the current power ranking of all forces */
  getPowerRanking(): { type: MarketForceType; power: number; energy: number }[] {
    const types: MarketForceType[] = ["whale", "bull", "bear", "shark", "retail"];
    return types
      .map((t) => ({
        type: t,
        power: this._state.forces[t].force.power,
        energy: this._state.forces[t].energy,
      }))
      .sort((a, b) => b.power - a.power);
  }

  /** Get the net market bias from all forces combined */
  getNetBias(): number {
    const types: MarketForceType[] = ["whale", "bull", "bear", "shark", "retail"];
    let totalPower = 0;
    let weightedBias = 0;
    for (const t of types) {
      const fs = this._state.forces[t];
      totalPower += fs.force.power;
      weightedBias += fs.force.bias * fs.force.power;
    }
    return totalPower > 0 ? weightedBias / totalPower : 0;
  }

  /** Get recent events within a lookback window */
  getRecentEvents(lookback = 3): ForceEvent[] {
    return this._state.events.filter((e) => e.tick >= this._state.tick - lookback);
  }

  /** Get a snapshot summary suitable for rendering */
  getSummary(): {
    dominant: MarketForceType | null;
    tension: number;
    netBias: number;
    ranking: { type: MarketForceType; power: number }[];
  } {
    return {
      dominant: this._state.dominantForce,
      tension: this._state.tension,
      netBias: this.getNetBias(),
      ranking: this.getPowerRanking(),
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
