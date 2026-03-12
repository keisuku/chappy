// ============================================
// Signal Engine — generates market signals for visual events
//
// Design philosophy: the market is NOISY.
// ~70% of signals are traps/noise that will fail.
// ~20% are weak-to-moderate with mixed results.
// ~8% are strong and actionable.
// ~2% are legendary — game-changing moments.
//
// Bots filter signals through their precision stat.
// High-precision bots ignore noise; low-precision bots chase fakeouts.
// ============================================

import {
  BotSignalReaction,
  BotState,
  BotReaction,
  Candlestick,
  MarketRegime,
  Signal,
  SignalEngineState,
  SignalStrength,
  SignalType,
  SignalVisual,
  TradeDirection,
} from "@/types";

// ── Signal Templates ──
// Each template defines how a signal type behaves visually and statistically

interface SignalTemplate {
  type: SignalType;
  baseConfidence: number;     // starting confidence before noise
  trapChance: number;         // probability this signal is a fakeout (0-1)
  icon: string;
  baseColor: string;
  soundCue: SignalVisual["soundCue"];
}

const SIGNAL_TEMPLATES: SignalTemplate[] = [
  // High-frequency noise signals (appear often, mostly traps)
  { type: "trend_break",       baseConfidence: 0.25, trapChance: 0.65, icon: "⚡", baseColor: "#ffaa00", soundCue: "blip" },
  { type: "volume_spike",      baseConfidence: 0.20, trapChance: 0.60, icon: "📊", baseColor: "#44aaff", soundCue: "blip" },
  { type: "support_test",      baseConfidence: 0.22, trapChance: 0.70, icon: "🛡️", baseColor: "#00ff88", soundCue: "blip" },
  { type: "resistance_test",   baseConfidence: 0.22, trapChance: 0.70, icon: "⚔️", baseColor: "#ff4444", soundCue: "blip" },
  { type: "fakeout",           baseConfidence: 0.30, trapChance: 0.90, icon: "💀", baseColor: "#ff2d55", soundCue: "chime" },

  // Medium-frequency signals (less common, better odds)
  { type: "pattern_formation",  baseConfidence: 0.40, trapChance: 0.50, icon: "🔺", baseColor: "#cc88ff", soundCue: "chime" },
  { type: "divergence",         baseConfidence: 0.45, trapChance: 0.45, icon: "↕️", baseColor: "#ff8844", soundCue: "chime" },
  { type: "squeeze_alert",      baseConfidence: 0.42, trapChance: 0.40, icon: "🔧", baseColor: "#ffdd00", soundCue: "alarm" },
  { type: "liquidation_zone",   baseConfidence: 0.35, trapChance: 0.55, icon: "💧", baseColor: "#ff6644", soundCue: "alarm" },

  // Rare signals (infrequent, high reliability)
  { type: "whale_alert",        baseConfidence: 0.65, trapChance: 0.25, icon: "🐋", baseColor: "#0088ff", soundCue: "thunder" },
  { type: "golden_cross",       baseConfidence: 0.70, trapChance: 0.20, icon: "✨", baseColor: "#ffd700", soundCue: "thunder" },
  { type: "death_cross",        baseConfidence: 0.70, trapChance: 0.20, icon: "💀", baseColor: "#aa00ff", soundCue: "shatter" },
];

// ── Signal Generation Weights by Regime ──
// Market regime affects which signals appear more often
const REGIME_WEIGHTS: Record<MarketRegime, Partial<Record<SignalType, number>>> = {
  trending: {
    trend_break: 2.0, golden_cross: 1.8, death_cross: 1.8,
    pattern_formation: 1.3, fakeout: 0.6, support_test: 0.7, resistance_test: 0.7,
  },
  ranging: {
    support_test: 2.0, resistance_test: 2.0, fakeout: 1.8,
    pattern_formation: 1.5, squeeze_alert: 1.5, trend_break: 0.5,
  },
  volatile: {
    volume_spike: 2.0, whale_alert: 1.8, liquidation_zone: 2.0,
    fakeout: 1.5, divergence: 1.3, squeeze_alert: 0.4,
  },
  calm: {
    squeeze_alert: 2.5, pattern_formation: 1.5, support_test: 1.2, resistance_test: 1.2,
    volume_spike: 0.4, whale_alert: 0.3, trend_break: 0.5,
  },
};

// ── Signal ID Counter ──
let signalIdCounter = 0;

// ── Core Signal Engine ──

export function createSignalEngineState(): SignalEngineState {
  return {
    activeSignals: [],
    resolvedSignals: [],
    reactions: [],
    signalsGenerated: 0,
    trapsTriggered: 0,
    legendaryCount: 0,
  };
}

/**
 * Generate signals for a single tick.
 * Produces 1-4 signals per tick: mostly noise, occasionally something real.
 */
export function generateSignals(
  candles: Candlestick[],
  regime: MarketRegime,
  volatility: number,
  stage: number,
  tick: number,
  rng: () => number
): Signal[] {
  if (candles.length < 10) return [];

  const signals: Signal[] = [];

  // How many signals this tick? Higher stages = more chaos
  const baseCount = 1 + Math.floor(rng() * 2); // 1-2 base
  const stageBonus = stage >= 5 ? Math.floor(rng() * 2) : 0; // 0-1 bonus at high stages
  const signalCount = Math.min(4, baseCount + stageBonus);

  for (let i = 0; i < signalCount; i++) {
    const signal = generateSingleSignal(candles, regime, volatility, stage, tick, rng);
    if (signal) signals.push(signal);
  }

  return signals;
}

function generateSingleSignal(
  candles: Candlestick[],
  regime: MarketRegime,
  volatility: number,
  stage: number,
  tick: number,
  rng: () => number
): Signal | null {
  // Pick signal type using weighted selection
  const template = pickWeightedTemplate(regime, rng);
  if (!template) return null;

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  // ── Determine if this signal is real or a trap ──
  let trapChance = template.trapChance;

  // Regime-specific trap adjustment
  if (regime === "volatile") trapChance += 0.1;  // more fakeouts in volatile markets
  if (regime === "calm") trapChance -= 0.05;      // slightly more reliable in calm

  const isTrap = rng() < trapChance;

  // ── Calculate confidence ──
  // Start from template base, add market-derived adjustments
  let confidence = template.baseConfidence;

  // Real signals: boost from market confirmation
  if (!isTrap) {
    confidence += analyzeMarketConfirmation(candles, template.type, rng) * 0.3;
  } else {
    // Traps: deceptively high confidence to lure bots
    confidence += rng() * 0.15;
  }

  // Stage amplification: higher stages produce more extreme signals
  confidence *= (0.8 + stage * 0.05);
  confidence = Math.min(1, Math.max(0, confidence));

  // ── Determine strength tier ──
  const strength = classifyStrength(confidence, isTrap, rng);

  // ── Direction ──
  const direction = determineDirection(candles, template.type, isTrap, rng);

  // ── Trap severity ──
  const trapSeverity = isTrap ? (0.2 + rng() * 0.8) : 0;

  // ── Visual properties ──
  const visual = computeVisual(template, strength, confidence, stage);

  // ── Decay and TTL ──
  const decayRate = strength === "legendary" ? 0.02
    : strength === "strong" ? 0.05
    : strength === "moderate" ? 0.1
    : strength === "weak" ? 0.2
    : 0.35; // noise decays fast

  const ttl = strength === "legendary" ? 8
    : strength === "strong" ? 5
    : strength === "moderate" ? 3
    : strength === "weak" ? 2
    : 1; // noise dies in 1 tick

  signalIdCounter++;

  return {
    id: `sig_${tick}_${signalIdCounter}`,
    type: template.type,
    tick,
    confidence,
    strength,
    direction,
    isTrap,
    trapSeverity,
    visual,
    decayRate,
    ttl,
    expired: false,
    priceLevel: last.close,
    reason: buildSignalReason(template.type, direction, confidence, isTrap),
  };
}

// ── Weighted Template Selection ──
function pickWeightedTemplate(regime: MarketRegime, rng: () => number): SignalTemplate | null {
  const regimeWeights = REGIME_WEIGHTS[regime];
  const weighted = SIGNAL_TEMPLATES.map(t => ({
    template: t,
    weight: regimeWeights[t.type] ?? 1.0,
  }));

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = rng() * totalWeight;

  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0) return w.template;
  }

  return weighted[weighted.length - 1].template;
}

// ── Market Confirmation Analysis ──
// Real signals get boosted when market data confirms them
function analyzeMarketConfirmation(
  candles: Candlestick[],
  type: SignalType,
  rng: () => number
): number {
  if (candles.length < 10) return 0;

  const recent = candles.slice(-10);
  const last = candles[candles.length - 1];

  switch (type) {
    case "trend_break": {
      // Confirm: consecutive candles in same direction
      let streak = 0;
      for (let i = recent.length - 1; i >= 0; i--) {
        if (recent[i].close > recent[i].open) streak++;
        else break;
      }
      return Math.min(1, streak / 5);
    }
    case "volume_spike": {
      const avgVol = recent.reduce((s, c) => s + c.volume, 0) / recent.length;
      return Math.min(1, last.volume / Math.max(1, avgVol) / 4);
    }
    case "support_test":
    case "resistance_test": {
      const lows = recent.map(c => c.low);
      const highs = recent.map(c => c.high);
      const supportLevel = Math.min(...lows);
      const resistLevel = Math.max(...highs);
      const distToSupport = Math.abs(last.close - supportLevel) / last.close;
      const distToResist = Math.abs(last.close - resistLevel) / last.close;
      return type === "support_test"
        ? Math.min(1, 1 - distToSupport * 100)
        : Math.min(1, 1 - distToResist * 100);
    }
    case "divergence": {
      // Price up but bodies shrinking = divergence
      const bodies = recent.map(c => Math.abs(c.close - c.open));
      const firstHalf = bodies.slice(0, 5).reduce((a, b) => a + b, 0);
      const secondHalf = bodies.slice(5).reduce((a, b) => a + b, 0);
      return secondHalf < firstHalf * 0.6 ? 0.8 : 0.2;
    }
    case "golden_cross":
    case "death_cross": {
      if (candles.length < 20) return 0;
      const short5 = candles.slice(-5).reduce((s, c) => s + c.close, 0) / 5;
      const long20 = candles.slice(-20).reduce((s, c) => s + c.close, 0) / 20;
      const crossUp = short5 > long20;
      return type === "golden_cross" ? (crossUp ? 0.9 : 0.1) : (crossUp ? 0.1 : 0.9);
    }
    case "whale_alert": {
      const avgVol = recent.reduce((s, c) => s + c.volume, 0) / recent.length;
      return Math.min(1, last.volume / Math.max(1, avgVol) / 3);
    }
    case "squeeze_alert": {
      const ranges = recent.map(c => c.high - c.low);
      const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
      const lastRange = last.high - last.low;
      return lastRange < avgRange * 0.5 ? 0.85 : 0.15;
    }
    default:
      return rng() * 0.5;
  }
}

// ── Strength Classification ──
// Distribution: ~40% noise, ~30% weak, ~18% moderate, ~10% strong, ~2% legendary
function classifyStrength(
  confidence: number,
  isTrap: boolean,
  rng: () => number
): SignalStrength {
  // Traps can look strong to fool bots
  const effectiveConf = isTrap ? confidence * (0.8 + rng() * 0.4) : confidence;

  if (effectiveConf >= 0.85 && rng() < 0.25) return "legendary";
  if (effectiveConf >= 0.60) return "strong";
  if (effectiveConf >= 0.40) return "moderate";
  if (effectiveConf >= 0.20) return "weak";
  return "noise";
}

// ── Direction Determination ──
function determineDirection(
  candles: Candlestick[],
  type: SignalType,
  isTrap: boolean,
  rng: () => number
): TradeDirection {
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const bullish = last.close > last.open;

  let direction: TradeDirection;

  switch (type) {
    case "trend_break":
    case "volume_spike":
    case "whale_alert":
      direction = bullish ? "long" : "short";
      break;
    case "golden_cross":
      direction = "long";
      break;
    case "death_cross":
      direction = "short";
      break;
    case "support_test":
      direction = "long"; // bounce expected
      break;
    case "resistance_test":
      direction = "short"; // rejection expected
      break;
    case "divergence":
    case "fakeout":
      // Opposite of recent direction
      direction = bullish ? "short" : "long";
      break;
    case "pattern_formation":
    case "squeeze_alert":
    case "liquidation_zone":
      direction = rng() < 0.5 ? "long" : "short";
      break;
    default:
      direction = "flat";
  }

  // Traps: signal points the WRONG direction
  if (isTrap && direction !== "flat") {
    direction = direction === "long" ? "short" : "long";
  }

  return direction;
}

// ── Visual Computation ──
function computeVisual(
  template: SignalTemplate,
  strength: SignalStrength,
  confidence: number,
  stage: number
): SignalVisual {
  const intensityByStrength: Record<SignalStrength, number> = {
    noise: 0.1,
    weak: 0.25,
    moderate: 0.5,
    strong: 0.8,
    legendary: 1.0,
  };

  let intensity = intensityByStrength[strength];
  // Stage amplifies visual drama
  intensity = Math.min(1, intensity * (0.8 + stage * 0.05));

  const screenEffect: SignalVisual["screenEffect"] =
    strength === "legendary" ? "glitch" :
    strength === "strong" ? "shake" :
    strength === "moderate" ? "pulse" :
    strength === "weak" ? "flash" :
    "none";

  const particleBurst =
    strength === "legendary" ? 40 + Math.floor(confidence * 10) :
    strength === "strong" ? 20 + Math.floor(confidence * 10) :
    strength === "moderate" ? 8 + Math.floor(confidence * 7) :
    strength === "weak" ? 2 + Math.floor(confidence * 3) :
    0;

  // Color: brighter/more saturated for stronger signals
  const color = strength === "legendary" ? "#ffffff" : template.baseColor;

  const soundCue: SignalVisual["soundCue"] =
    strength === "legendary" ? "shatter" :
    strength === "strong" ? template.soundCue :
    strength === "moderate" ? "chime" :
    strength === "weak" ? "blip" :
    "none";

  return {
    intensity,
    color,
    icon: template.icon,
    screenEffect,
    particleBurst,
    soundCue,
  };
}

// ── Signal Reason Builder ──
function buildSignalReason(
  type: SignalType,
  direction: TradeDirection,
  confidence: number,
  isTrap: boolean
): string {
  const dirLabel = direction === "long" ? "LONG" : direction === "short" ? "SHORT" : "NEUTRAL";
  const confLabel = `${(confidence * 100).toFixed(0)}%`;

  const descriptions: Record<SignalType, string> = {
    trend_break: `Trendline break detected — ${dirLabel}`,
    volume_spike: `Volume surge ${confLabel} — ${dirLabel} pressure`,
    pattern_formation: `Chart pattern forming — ${dirLabel} setup`,
    divergence: `Price-momentum divergence — ${dirLabel} reversal`,
    support_test: `Support level test — ${dirLabel} bounce`,
    resistance_test: `Resistance rejection — ${dirLabel} fade`,
    whale_alert: `Whale order detected — ${dirLabel} flow`,
    liquidation_zone: `Liquidation cluster nearby — ${dirLabel} sweep`,
    golden_cross: `Golden cross — bullish crossover`,
    death_cross: `Death cross — bearish crossover`,
    fakeout: `Breakout signal — ${dirLabel} momentum`,   // deceptive label
    squeeze_alert: `Volatility squeeze breaking — ${dirLabel} expansion`,
  };

  return descriptions[type] ?? `Signal: ${type} ${dirLabel}`;
}

// ── Tick Update: Decay Signals and Resolve ──

export function tickSignals(
  state: SignalEngineState,
  tick: number
): SignalEngineState {
  const updated: SignalEngineState = {
    ...state,
    activeSignals: [],
    resolvedSignals: [...state.resolvedSignals],
    reactions: [...state.reactions],
    signalsGenerated: state.signalsGenerated,
    trapsTriggered: state.trapsTriggered,
    legendaryCount: state.legendaryCount,
  };

  for (const signal of state.activeSignals) {
    const decayed: Signal = {
      ...signal,
      confidence: Math.max(0, signal.confidence - signal.decayRate),
      ttl: signal.ttl - 1,
      visual: {
        ...signal.visual,
        intensity: Math.max(0, signal.visual.intensity - signal.decayRate),
        particleBurst: Math.max(0, Math.floor(signal.visual.particleBurst * 0.6)),
      },
    };

    if (decayed.ttl <= 0 || decayed.confidence <= 0.02) {
      decayed.expired = true;
      updated.resolvedSignals.push(decayed);
    } else {
      updated.activeSignals.push(decayed);
    }
  }

  return updated;
}

// ── Bot Signal Filtering ──
// Each bot evaluates active signals through its precision stat.
// High precision = better at detecting traps.
// Low precision = chases noise.

export function evaluateSignalsForBot(
  bot: BotState,
  activeSignals: Signal[],
  rng: () => number
): BotSignalReaction[] {
  const reactions: BotSignalReaction[] = [];
  const precision = bot.character.stats.precision;
  const speed = bot.character.stats.speed;
  const adaptability = bot.character.stats.adaptability;

  for (const signal of activeSignals) {
    // ── Precision Filter ──
    // Precision determines how well the bot reads the signal
    // noise floor: low precision bots see confidence as higher than it is
    const noiseBoost = ((100 - precision) / 100) * 0.2; // up to +0.2 for low precision
    const precisionPenalty = (precision / 100) * 0.15;   // up to -0.15 for high precision on traps
    let filteredConfidence = signal.confidence + noiseBoost;

    // High precision bots detect traps
    if (signal.isTrap && rng() < precision / 120) {
      // Bot sees through the trap
      filteredConfidence *= 0.1;
    }

    // Adaptability helps in unfamiliar signal types
    const familiarityBonus = (adaptability / 100) * 0.1;
    filteredConfidence = Math.min(1, filteredConfidence + familiarityBonus);

    // ── Determine Reaction ──
    const reaction = determineBotReaction(filteredConfidence, signal, bot, speed, rng);

    // ── Did the bot act on this signal? ──
    const acted = reaction === "engage" || reaction === "all_in";

    reactions.push({
      botSide: "left", // will be set by caller
      signal,
      reaction,
      reactionReason: buildReactionReason(reaction, signal, bot.character.name, filteredConfidence),
      confidenceAfterFilter: filteredConfidence,
      acted,
      profited: null, // resolved later
    });
  }

  return reactions;
}

function determineBotReaction(
  filteredConfidence: number,
  signal: Signal,
  bot: BotState,
  speed: number,
  rng: () => number
): BotReaction {
  // Speed stat affects reaction threshold — fast bots react to weaker signals
  const speedMod = (speed - 50) * 0.002; // -0.1 to +0.1

  if (filteredConfidence < 0.15 + speedMod) return "ignore";
  if (filteredConfidence < 0.25 + speedMod) return "scan";
  if (filteredConfidence < 0.40 + speedMod) return "hesitate";

  // Strong signals: check archetype behavior
  if (filteredConfidence >= 0.75) {
    // Berserkers go all-in more easily
    if (bot.character.archetype === "berserker" && rng() < 0.6) return "all_in";
    // Fortresses hesitate even on strong signals
    if (bot.character.archetype === "fortress" && rng() < 0.4) return "hesitate";
    // Tricksters might dodge (they suspect traps)
    if (bot.character.archetype === "trickster" && rng() < 0.3) return "dodge";
    return "engage";
  }

  if (filteredConfidence >= 0.55) {
    // Assassins engage faster at moderate confidence
    if (bot.character.archetype === "assassin" && rng() < 0.5) return "engage";
    return "hesitate";
  }

  // Moderate confidence
  if (filteredConfidence >= 0.40) {
    return rng() < 0.3 ? "engage" : "hesitate";
  }

  return "scan";
}

function buildReactionReason(
  reaction: BotReaction,
  signal: Signal,
  botName: string,
  filteredConfidence: number
): string {
  const confStr = `${(filteredConfidence * 100).toFixed(0)}%`;
  switch (reaction) {
    case "ignore":
      return `${botName} ignores ${signal.type} — below threshold`;
    case "scan":
      return `${botName} scans ${signal.type} (${confStr}) — watching`;
    case "hesitate":
      return `${botName} hesitates on ${signal.type} (${confStr}) — uncertain`;
    case "engage":
      return `${botName} engages ${signal.type} (${confStr}) — entering ${signal.direction}`;
    case "dodge":
      return `${botName} dodges ${signal.type} (${confStr}) — suspects trap!`;
    case "all_in":
      return `${botName} ALL-IN on ${signal.type} (${confStr}) — maximum conviction!`;
  }
}

// ── Resolve Signal Outcomes ──
// After a signal's TTL expires, check if it was profitable or a trap

export function resolveSignalOutcome(
  signal: Signal,
  priceAtSignal: number,
  currentPrice: number
): boolean {
  if (signal.isTrap) {
    // Trap: the "suggested" direction was actually inverted from true direction
    // So the original direction (before trap inversion) was correct
    // Bot following the signal direction will lose
    return false;
  }

  // Real signal: check if price moved in suggested direction
  const priceChange = currentPrice - priceAtSignal;
  if (signal.direction === "long") return priceChange > 0;
  if (signal.direction === "short") return priceChange < 0;
  return false;
}
