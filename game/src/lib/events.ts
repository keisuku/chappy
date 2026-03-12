// ============================================
// Visual Event Engine
// Detects signal events from battle state changes
// and maps them to visual battle events
// ============================================

import {
  BattleState,
  SignalEvent,
  SignalStrength,
  SignalSource,
  VisualBattleEvent,
  VisualEffect,
  CameraMovement,
  BotAnimation,
  ResultProbability,
} from "@/types";

// ============================================
// Signal Detection Thresholds
// ============================================

const THRESHOLDS = {
  price_move: { weak: 0.002, medium: 0.005, strong: 0.01, jackpot: 0.025 },
  pnl_change: { weak: 5, medium: 20, strong: 50, jackpot: 150 },
  power_shift: { weak: 3, medium: 8, strong: 15, jackpot: 25 },
  volatility: { weak: 5000, medium: 10000, strong: 20000, jackpot: 40000 },
} as const;

// ============================================
// Signal Detector
// Compares previous and current battle state
// to produce raw signal events
// ============================================

export function detectSignals(
  prev: BattleState,
  curr: BattleState
): SignalEvent[] {
  const signals: SignalEvent[] = [];
  const tick = curr.tick;

  // --- Price movement ---
  if (prev.currentPrice > 0) {
    const priceChange = Math.abs(curr.currentPrice - prev.currentPrice) / prev.currentPrice;
    const direction = curr.currentPrice > prev.currentPrice ? "long" : "short";
    const strength = classifyStrength(priceChange, THRESHOLDS.price_move);
    if (strength) {
      signals.push({
        source: "price_move",
        strength,
        tick,
        side: "both",
        value: priceChange,
        description: `Price ${direction === "long" ? "surged" : "dropped"} ${(priceChange * 100).toFixed(2)}%`,
      });
    }
  }

  // --- Volatility spike ---
  if (curr.volatility > prev.volatility) {
    const volDelta = curr.volatility - prev.volatility;
    const strength = classifyStrength(curr.volatility, THRESHOLDS.volatility);
    if (strength && volDelta > 1000) {
      signals.push({
        source: "volatility_spike",
        strength,
        tick,
        side: "both",
        value: curr.volatility,
        description: `Volatility surged to ${curr.volatility.toFixed(0)}`,
      });
    }
  }

  // --- Stage change ---
  if (curr.stage !== prev.stage) {
    const jump = curr.stage - prev.stage;
    let strength: SignalStrength;
    if (curr.stage >= 7) strength = "jackpot";
    else if (jump >= 2) strength = "strong";
    else if (curr.stage >= 5) strength = "medium";
    else strength = "weak";
    signals.push({
      source: "stage_change",
      strength,
      tick,
      side: "both",
      value: curr.stage,
      description: `Stage escalated to S${curr.stage}`,
    });
  }

  // --- Per-bot signals ---
  for (const side of ["left", "right"] as const) {
    const prevBot = side === "left" ? prev.leftBot : prev.rightBot;
    const currBot = side === "left" ? curr.leftBot : curr.rightBot;

    // Trade entry
    if (!prevBot.position && currBot.position) {
      const strength: SignalStrength = curr.stage >= 6 ? "medium" : "weak";
      signals.push({
        source: "trade_entry",
        strength,
        tick,
        side,
        value: currBot.position.entryPrice,
        description: `${currBot.character.name} entered ${currBot.position.direction}`,
      });
    }

    // Trade exit
    if (prevBot.position && !currBot.position) {
      signals.push({
        source: "trade_exit",
        strength: "weak",
        tick,
        side,
        value: 0,
        description: `${currBot.character.name} exited position`,
      });
    }

    // Position flip (long→short or short→long)
    if (
      prevBot.position && currBot.position &&
      prevBot.position.direction !== currBot.position.direction
    ) {
      signals.push({
        source: "position_flip",
        strength: "medium",
        tick,
        side,
        value: 0,
        description: `${currBot.character.name} flipped to ${currBot.position.direction}`,
      });
    }

    // PnL surge (positive)
    const pnlDelta = currBot.pnl - prevBot.pnl;
    if (pnlDelta > 0) {
      const strength = classifyStrength(pnlDelta, THRESHOLDS.pnl_change);
      if (strength) {
        signals.push({
          source: "pnl_surge",
          strength,
          tick,
          side,
          value: pnlDelta,
          description: `${currBot.character.name} gained +${pnlDelta.toFixed(0)} P&L`,
        });
      }
    }

    // Drawdown (negative PnL movement)
    if (pnlDelta < 0 && Math.abs(pnlDelta) > THRESHOLDS.pnl_change.weak) {
      const absDelta = Math.abs(pnlDelta);
      const strength = classifyStrength(absDelta, THRESHOLDS.pnl_change);
      if (strength) {
        signals.push({
          source: "drawdown",
          strength,
          tick,
          side,
          value: pnlDelta,
          description: `${currBot.character.name} took ${pnlDelta.toFixed(0)} drawdown`,
        });
      }
    }

    // Comeback (was losing, now gaining rapidly)
    if (prevBot.pnl < 0 && currBot.pnl > prevBot.pnl && pnlDelta > THRESHOLDS.pnl_change.medium) {
      signals.push({
        source: "comeback",
        strength: currBot.pnl > 0 ? "strong" : "medium",
        tick,
        side,
        value: pnlDelta,
        description: `${currBot.character.name} comeback! +${pnlDelta.toFixed(0)}`,
      });
    }

    // Perfect trade detection (entered and exited with profit on same tick transition)
    if (
      prevBot.position && !currBot.position &&
      pnlDelta > THRESHOLDS.pnl_change.strong
    ) {
      signals.push({
        source: "perfect_trade",
        strength: "jackpot",
        tick,
        side,
        value: pnlDelta,
        description: `${currBot.character.name} PERFECT TRADE! +${pnlDelta.toFixed(0)}`,
      });
    }
  }

  // --- Power shift ---
  const powerDelta = Math.abs(curr.leftBot.power - prev.leftBot.power);
  if (powerDelta > 0) {
    const strength = classifyStrength(powerDelta, THRESHOLDS.power_shift);
    if (strength) {
      const shifted = curr.leftBot.power > prev.leftBot.power ? "left" : "right";
      signals.push({
        source: "power_shift",
        strength,
        tick,
        side: shifted,
        value: powerDelta,
        description: `Power swung ${powerDelta.toFixed(1)} points toward ${shifted}`,
      });
    }
  }

  // --- Combo chain (5+ consecutive profitable ticks) ---
  // Detected by checking if a bot's trade count is climbing while PnL is positive
  for (const side of ["left", "right"] as const) {
    const currBot = side === "left" ? curr.leftBot : curr.rightBot;
    const prevBot = side === "left" ? prev.leftBot : prev.rightBot;
    if (
      currBot.trades >= 5 &&
      currBot.pnl > 0 &&
      currBot.pnl > prevBot.pnl &&
      currBot.trades > prevBot.trades
    ) {
      signals.push({
        source: "combo_chain",
        strength: currBot.trades >= 8 ? "strong" : "medium",
        tick,
        side,
        value: currBot.trades,
        description: `${currBot.character.name} combo chain ×${currBot.trades}!`,
      });
    }
  }

  return signals;
}

// ============================================
// Visual Event Mapping
// Maps signal events to full visual battle events
// ============================================

const VISUAL_PRESETS: Record<SignalStrength, {
  visual: Omit<VisualEffect, "color">;
  camera: CameraMovement;
  animation: Omit<BotAnimation, "side">;
}> = {
  weak: {
    visual: { type: "none", intensity: 0.2, duration: 1, radius: 1 },
    camera: { type: "none", intensity: 0.1, duration: 1, target: "center" },
    animation: { type: "idle", intensity: 0.2, duration: 1 },
  },
  medium: {
    visual: { type: "aura_flare", intensity: 0.5, duration: 2, radius: 3 },
    camera: { type: "zoom_in", intensity: 0.4, duration: 2, target: "center" },
    animation: { type: "power_up", intensity: 0.5, duration: 2 },
  },
  strong: {
    visual: { type: "shockwave", intensity: 0.8, duration: 3, radius: 6 },
    camera: { type: "slam", intensity: 0.7, duration: 2, target: "center" },
    animation: { type: "attack_lunge", intensity: 0.8, duration: 2 },
  },
  jackpot: {
    visual: { type: "gold_rain", intensity: 1.0, duration: 5, radius: 10 },
    camera: { type: "orbit_fast", intensity: 1.0, duration: 3, target: "center" },
    animation: { type: "celebrate", intensity: 1.0, duration: 4 },
  },
};

// Source-specific visual overrides
const SOURCE_VISUALS: Partial<Record<SignalSource, Partial<{
  visual_type: VisualEffect["type"];
  camera_type: CameraMovement["type"];
  animation_type: BotAnimation["type"];
}>>> = {
  price_move:       { visual_type: "screen_flash" },
  trade_entry:      { animation_type: "charge", camera_type: "zoom_in" },
  trade_exit:       { animation_type: "dodge" },
  position_flip:    { visual_type: "glitch", animation_type: "dodge" },
  pnl_surge:        { visual_type: "particle_burst", animation_type: "attack_lunge" },
  drawdown:         { visual_type: "screen_flash", animation_type: "stagger" },
  comeback:         { visual_type: "aura_flare", animation_type: "power_up" },
  stage_change:     { visual_type: "shockwave", camera_type: "shake" },
  power_shift:      { visual_type: "trail_blaze" },
  volatility_spike: { visual_type: "glitch", camera_type: "shake" },
  perfect_trade:    { visual_type: "gold_rain", animation_type: "celebrate" },
  combo_chain:      { visual_type: "trail_blaze", animation_type: "attack_lunge" },
};

export function mapSignalToVisualEvent(
  signal: SignalEvent,
  state: BattleState
): VisualBattleEvent {
  const preset = VISUAL_PRESETS[signal.strength];
  const sourceOverride = SOURCE_VISUALS[signal.source] ?? {};

  // Determine color from the triggering bot or stage
  let color: string;
  if (signal.side === "left") {
    color = state.leftBot.character.primaryColor;
  } else if (signal.side === "right") {
    color = state.rightBot.character.primaryColor;
  } else {
    color = signal.source === "price_move" && signal.value > 0 ? "#00ff88" : "#ff2d55";
  }

  // Jackpot signals always gold
  if (signal.strength === "jackpot") {
    color = "#ffd700";
  }

  const visual: VisualEffect = {
    type: sourceOverride.visual_type ?? preset.visual.type,
    color,
    intensity: preset.visual.intensity,
    duration: preset.visual.duration,
    radius: preset.visual.radius,
  };

  const camera: CameraMovement = {
    type: sourceOverride.camera_type ?? preset.camera.type,
    intensity: preset.camera.intensity,
    duration: preset.camera.duration,
    target: signal.side === "both" ? "center" : signal.side,
  };

  const animation: BotAnimation = {
    type: sourceOverride.animation_type ?? preset.animation.type,
    intensity: preset.animation.intensity,
    duration: preset.animation.duration,
    side: signal.side,
  };

  const probability = computeProbability(signal, state);

  return {
    id: `${signal.source}-${signal.tick}-${signal.side}`,
    signal,
    visual,
    camera,
    animation,
    probability,
  };
}

// ============================================
// Result Probability Calculator
// Estimates how each event shifts the battle outcome
// ============================================

function computeProbability(
  signal: SignalEvent,
  state: BattleState
): ResultProbability {
  const strengthMultiplier: Record<SignalStrength, number> = {
    weak: 0.05,
    medium: 0.15,
    strong: 0.35,
    jackpot: 0.60,
  };

  const mult = strengthMultiplier[signal.strength];

  // Win chance shift: positive = favors the signal side
  let winShift = 0;
  if (signal.side !== "both") {
    switch (signal.source) {
      case "pnl_surge":
      case "perfect_trade":
      case "combo_chain":
      case "comeback":
        winShift = mult;
        break;
      case "drawdown":
        winShift = -mult;
        break;
      case "power_shift":
        winShift = mult * 0.8;
        break;
      case "trade_entry":
      case "position_flip":
        winShift = mult * 0.3;
        break;
      default:
        winShift = mult * 0.1;
    }
  }

  // PnL impact estimation
  let pnlImpact = signal.value;
  if (signal.source === "price_move") {
    pnlImpact = signal.value * state.currentPrice * 0.01; // rough BTC position estimate
  }

  // Momentum: are things getting better or worse for the triggering side?
  let momentum = 0;
  if (signal.side !== "both") {
    const bot = signal.side === "left" ? state.leftBot : state.rightBot;
    momentum = bot.power > 50 ? Math.min(1, (bot.power - 50) / 40) : Math.max(-1, (bot.power - 50) / 40);
    if (signal.source === "drawdown") momentum *= -1;
  }

  // Excitement: spectacle value for the audience
  const excitementBase: Record<SignalStrength, number> = {
    weak: 0.1,
    medium: 0.35,
    strong: 0.7,
    jackpot: 1.0,
  };
  let excitement = excitementBase[signal.strength];

  // Bonus excitement for specific sources
  if (signal.source === "perfect_trade") excitement = 1.0;
  if (signal.source === "comeback") excitement = Math.min(1, excitement + 0.2);
  if (signal.source === "stage_change" && state.stage >= 7) excitement = Math.min(1, excitement + 0.3);

  return {
    win_chance_shift: clamp(winShift, -1, 1),
    pnl_impact: pnlImpact,
    momentum: clamp(momentum, -1, 1),
    excitement: clamp(excitement, 0, 1),
  };
}

// ============================================
// Event Engine — Main Entry Point
// Call once per battle tick with prev + curr state
// Returns sorted visual battle events (highest excitement first)
// ============================================

export function processEvents(
  prev: BattleState,
  curr: BattleState
): VisualBattleEvent[] {
  if (!curr.isActive && !prev.isActive) return [];

  const signals = detectSignals(prev, curr);
  const events = signals.map((s) => mapSignalToVisualEvent(s, curr));

  // Sort: highest excitement first (most impactful event drives the visuals)
  events.sort((a, b) => b.probability.excitement - a.probability.excitement);

  return events;
}

/**
 * Returns the single most impactful event for the current tick.
 * Use this when only one visual event can play at a time.
 */
export function getDominantEvent(
  prev: BattleState,
  curr: BattleState
): VisualBattleEvent | null {
  const events = processEvents(prev, curr);
  return events.length > 0 ? events[0] : null;
}

// ============================================
// Utilities
// ============================================

function classifyStrength(
  value: number,
  thresholds: { weak: number; medium: number; strong: number; jackpot: number }
): SignalStrength | null {
  if (value >= thresholds.jackpot) return "jackpot";
  if (value >= thresholds.strong) return "strong";
  if (value >= thresholds.medium) return "medium";
  if (value >= thresholds.weak) return "weak";
  return null;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
