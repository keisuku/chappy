// ============================================
// Battle Engine — orchestrates market sim + strategies + state
// Features: matchup system, special abilities, dynamic sizing,
// battle event log, stat-based modifiers
// ============================================

import {
  BattleEvent,
  BattleState,
  BattleSummary,
  BotState,
  Character,
  MarketRegime,
  MatchupModifier,
  SignalEngineState,
  StageConfig,
  TradingStyle,
} from "@/types";
import { MarketSimulator } from "./market";
import { runStrategy, StrategySignal } from "./strategies";
import {
  createSignalEngineState,
  generateSignals,
  tickSignals,
  evaluateSignalsForBot,
  resolveSignalOutcome,
} from "./signals";

export const TOTAL_TICKS = 30;

export const STAGES: StageConfig[] = [
  { id: 1, name: "S1 凪",    nameEn: "Calm",      color: "#4488aa", shakeIntensity: 0,    bloomStrength: 0,   particleCount: 0  },
  { id: 2, name: "S2 気配",   nameEn: "Signal",    color: "#44aacc", shakeIntensity: 0,    bloomStrength: 0.1, particleCount: 2  },
  { id: 3, name: "S3 胎動",   nameEn: "Stir",      color: "#44ccaa", shakeIntensity: 0.01, bloomStrength: 0.2, particleCount: 5  },
  { id: 4, name: "S4 激突",   nameEn: "Clash",     color: "#aacc44", shakeIntensity: 0.02, bloomStrength: 0.3, particleCount: 10 },
  { id: 5, name: "S5 激アツ", nameEn: "Heat",      color: "#ffaa00", shakeIntensity: 0.04, bloomStrength: 0.5, particleCount: 20 },
  { id: 6, name: "S6 覚醒",   nameEn: "Awakening", color: "#ff6600", shakeIntensity: 0.06, bloomStrength: 0.7, particleCount: 30 },
  { id: 7, name: "S7 臨界",   nameEn: "Critical",  color: "#ff2d55", shakeIntensity: 0.10, bloomStrength: 0.9, particleCount: 50 },
  { id: 8, name: "S8 終焉",   nameEn: "Finale",    color: "#aa00ff", shakeIntensity: 0.15, bloomStrength: 1.0, particleCount: 80 },
];

// ── Matchup Matrix ──
// Rock-paper-scissors style advantages between trading styles
const MATCHUPS: MatchupModifier[] = [
  // Momentum beats HF (strong trends overwhelm scalps) and event_driven (already moving)
  { attacker: "momentum", defender: "high_frequency", advantage: 1.3 },
  { attacker: "momentum", defender: "event_driven", advantage: 1.2 },
  // Mean reversion beats momentum (fading trends) and volatility_breaker (stable = their weakness)
  { attacker: "mean_reversion", defender: "momentum", advantage: 1.25 },
  { attacker: "mean_reversion", defender: "volatility_breaker", advantage: 1.15 },
  // HF beats mean_reversion (too fast to fade) and scalper (speed advantage)
  { attacker: "high_frequency", defender: "mean_reversion", advantage: 1.2 },
  { attacker: "high_frequency", defender: "scalper", advantage: 1.15 },
  // Contrarian beats momentum (catches reversals) and HF (picks extreme turns)
  { attacker: "contrarian", defender: "momentum", advantage: 1.3 },
  { attacker: "contrarian", defender: "high_frequency", advantage: 1.15 },
  // Arbitrage beats contrarian (spread neutralizes contrarian) and mean_reversion (finds true value faster)
  { attacker: "arbitrage", defender: "contrarian", advantage: 1.2 },
  { attacker: "arbitrage", defender: "mean_reversion", advantage: 1.1 },
  // Event driven beats arbitrage (events break correlations) and scalper (big moves crush small stops)
  { attacker: "event_driven", defender: "arbitrage", advantage: 1.25 },
  { attacker: "event_driven", defender: "scalper", advantage: 1.2 },
  // Scalper beats mean_reversion (micro-structure edge) and event_driven (tight stops survive events)
  { attacker: "scalper", defender: "mean_reversion", advantage: 1.15 },
  { attacker: "scalper", defender: "event_driven", advantage: 1.1 },
  // Volatility breaker beats HF (vol spikes kill HFT) and contrarian (vol expansion = strong trends)
  { attacker: "volatility_breaker", defender: "high_frequency", advantage: 1.25 },
  { attacker: "volatility_breaker", defender: "contrarian", advantage: 1.15 },
];

function getMatchupAdvantage(attacker: TradingStyle, defender: TradingStyle): number {
  const matchup = MATCHUPS.find(m => m.attacker === attacker && m.defender === defender);
  return matchup?.advantage ?? 1.0;
}

// ── Regime Advantage ──
// Some strategies perform better in certain market conditions
function getRegimeBonus(style: TradingStyle, regime: MarketRegime): number {
  const bonuses: Record<TradingStyle, Partial<Record<MarketRegime, number>>> = {
    momentum:           { trending: 1.4, volatile: 1.1, ranging: 0.7, calm: 0.8 },
    mean_reversion:     { ranging: 1.3, calm: 1.2, trending: 0.6, volatile: 0.8 },
    high_frequency:     { volatile: 1.2, calm: 1.1, trending: 0.9, ranging: 1.0 },
    event_driven:       { volatile: 1.4, trending: 1.1, calm: 0.5, ranging: 0.6 },
    arbitrage:          { ranging: 1.3, calm: 1.2, volatile: 0.8, trending: 0.9 },
    contrarian:         { volatile: 1.3, trending: 1.1, calm: 0.7, ranging: 0.8 },
    scalper:            { ranging: 1.2, calm: 1.1, volatile: 0.9, trending: 1.0 },
    volatility_breaker: { volatile: 1.5, trending: 1.1, calm: 0.6, ranging: 0.7 },
  };
  return bonuses[style]?.[regime] ?? 1.0;
}

// ── Bot State Creation ──
function createBotState(character: Character): BotState {
  return {
    character,
    position: null,
    pnl: 0,
    power: 50,
    trades: 0,
    wins: 0,
    losses: 0,
    maxDrawdown: 0,
    peakPnl: 0,
    currentStreak: 0,
    abilityActive: false,
    abilityTicksRemaining: 0,
    abilityCooldown: 0,
  };
}

export function createBattle(left: Character, right: Character): {
  state: BattleState;
  market: MarketSimulator;
} {
  const market = new MarketSimulator(Date.now() % 100000);
  // Generate initial candles for strategy warm-up
  for (let i = 0; i < 20; i++) market.step();

  return {
    state: {
      tick: 0,
      stage: 1,
      leftBot: createBotState(left),
      rightBot: createBotState(right),
      candles: [...market.candles],
      currentPrice: market.getPrice(),
      volatility: market.getVolatility(),
      regime: market.getRegime(),
      isActive: true,
      winner: null,
      events: [],
      marketEvents: [],
      signals: createSignalEngineState(),
    },
    market,
  };
}

export function stepBattle(
  state: BattleState,
  market: MarketSimulator
): BattleState {
  if (!state.isActive) return state;

  const candle = market.step();
  const newState: BattleState = {
    ...state,
    tick: state.tick + 1,
    candles: [...market.candles],
    currentPrice: market.getPrice(),
    volatility: market.getVolatility(),
    regime: market.getRegime(),
    events: [...state.events],
    marketEvents: [...market.events],
    leftBot: { ...state.leftBot },
    rightBot: { ...state.rightBot },
  };

  const prevStage = state.stage;
  newState.stage = market.getStage();

  // Log stage change
  if (newState.stage !== prevStage) {
    newState.events.push({
      tick: newState.tick,
      type: "stage_change",
      actor: "market",
      description: `Stage ${prevStage} → ${newState.stage} (${STAGES[newState.stage - 1].nameEn})`,
    });
  }

  // Log market events from this tick
  const newMarketEvents = market.getRecentEvents(0);
  for (const me of newMarketEvents) {
    if (me.tick === market.candles[market.candles.length - 1]?.time) {
      newState.events.push({
        tick: newState.tick,
        type: "market_event",
        actor: "market",
        description: `${me.name} (${me.nameJa}) — impact: ${me.magnitude > 0 ? "+" : ""}${me.magnitude.toFixed(0)}`,
      });
    }
  }

  // ── Run Strategies ──
  const leftSignal = getStrategySignal(newState.leftBot, newState.rightBot, newState);
  const rightSignal = getStrategySignal(newState.rightBot, newState.leftBot, newState);

  // ── Update Bots ──
  newState.leftBot = updateBot(
    state.leftBot,
    leftSignal,
    candle.close,
    candle.open,
    newState.regime,
    state.rightBot.character.tradingStyle,
    newState.tick,
    newState.events,
    "left"
  );
  newState.rightBot = updateBot(
    state.rightBot,
    rightSignal,
    candle.close,
    candle.open,
    newState.regime,
    state.leftBot.character.tradingStyle,
    newState.tick,
    newState.events,
    "right"
  );

  // ── Check & Trigger Abilities ──
  newState.leftBot = checkAbility(newState.leftBot, newState, "left");
  newState.rightBot = checkAbility(newState.rightBot, newState, "right");

  // ── Signal Engine ──
  // 1. Decay existing signals
  newState.signals = tickSignals(state.signals, newState.tick);

  // 2. Generate new signals from market data
  // Use a simple seeded rng derived from tick + price for determinism
  const signalSeed = (newState.tick * 7919 + Math.floor(newState.currentPrice)) >>> 0;
  let signalRngState = signalSeed;
  const signalRng = () => {
    signalRngState = (signalRngState * 1664525 + 1013904223) >>> 0;
    return signalRngState / 4294967296;
  };

  const newSignals = generateSignals(
    newState.candles,
    newState.regime,
    newState.volatility,
    newState.stage,
    newState.tick,
    signalRng
  );

  // Track stats
  newState.signals = {
    ...newState.signals,
    activeSignals: [...newState.signals.activeSignals, ...newSignals],
    signalsGenerated: newState.signals.signalsGenerated + newSignals.length,
    legendaryCount: newState.signals.legendaryCount + newSignals.filter(s => s.strength === "legendary").length,
  };

  // 3. Bot reactions to active signals
  const leftReactions = evaluateSignalsForBot(newState.leftBot, newState.signals.activeSignals, signalRng)
    .map(r => ({ ...r, botSide: "left" as const }));
  const rightReactions = evaluateSignalsForBot(newState.rightBot, newState.signals.activeSignals, signalRng)
    .map(r => ({ ...r, botSide: "right" as const }));

  // Log notable reactions as battle events
  for (const r of [...leftReactions, ...rightReactions]) {
    if (r.reaction === "engage" || r.reaction === "all_in" || r.reaction === "dodge") {
      newState.events.push({
        tick: newState.tick,
        type: "trade",
        actor: r.botSide,
        description: r.reactionReason,
      });
    }
    // Track traps
    if (r.acted && r.signal.isTrap) {
      newState.signals = {
        ...newState.signals,
        trapsTriggered: newState.signals.trapsTriggered + 1,
      };
      newState.events.push({
        tick: newState.tick,
        type: "critical_hit",
        actor: r.botSide === "left" ? "right" : "left",
        description: `TRAP! ${r.signal.type} was a fakeout — ${r.botSide === "left" ? newState.leftBot.character.name : newState.rightBot.character.name} falls for it!`,
      });
    }
  }

  // 4. Resolve expired signals
  for (const signal of newState.signals.resolvedSignals) {
    const reactions = [...leftReactions, ...rightReactions].filter(r => r.signal.id === signal.id && r.acted);
    for (const r of reactions) {
      r.profited = resolveSignalOutcome(signal, signal.priceLevel, newState.currentPrice);
    }
  }

  newState.signals = {
    ...newState.signals,
    reactions: [...newState.signals.reactions, ...leftReactions, ...rightReactions],
  };

  // ── Power Calculation ──
  // Base: relative PnL advantage
  const totalPnl = Math.abs(newState.leftBot.pnl) + Math.abs(newState.rightBot.pnl) + 1;
  const pnlAdvantage = ((newState.leftBot.pnl - newState.rightBot.pnl) / totalPnl) * 35;

  // Stat bonus: precision and adaptability contribute to power
  const leftStatBonus = (newState.leftBot.character.stats.precision - 50) * 0.05;
  const rightStatBonus = (newState.rightBot.character.stats.precision - 50) * 0.05;

  newState.leftBot = { ...newState.leftBot, power: clamp(50 + pnlAdvantage + leftStatBonus, 10, 90) };
  newState.rightBot = { ...newState.rightBot, power: clamp(50 - pnlAdvantage + rightStatBonus, 10, 90) };

  // ── End Condition ──
  if (newState.tick >= TOTAL_TICKS) {
    newState.isActive = false;
    if (Math.abs(newState.leftBot.pnl - newState.rightBot.pnl) < 0.001) {
      // True draw — compare secondary metrics
      const leftScore = newState.leftBot.wins - newState.leftBot.losses - newState.leftBot.maxDrawdown * 0.001;
      const rightScore = newState.rightBot.wins - newState.rightBot.losses - newState.rightBot.maxDrawdown * 0.001;
      newState.winner = leftScore >= rightScore ? "left" : "right";
    } else {
      newState.winner = newState.leftBot.pnl >= newState.rightBot.pnl ? "left" : "right";
    }
  }

  return newState;
}

// ── Strategy Signal with ability modifiers ──
function getStrategySignal(
  bot: BotState,
  opponent: BotState,
  state: BattleState
): StrategySignal {
  // If ability overrides signal
  if (bot.abilityActive && bot.character.ability.effect.type === "signal_override") {
    // Use opponent's strategy instead (mimic/copy ability)
    return runStrategy(opponent.character.tradingStyle, state.candles);
  }

  // If counter_trade ability is active on THIS bot, invert opponent signal
  if (bot.abilityActive && bot.character.ability.effect.type === "counter_trade") {
    const oppSignal = runStrategy(opponent.character.tradingStyle, state.candles);
    return {
      ...oppSignal,
      direction: oppSignal.direction === "long" ? "short" : oppSignal.direction === "short" ? "long" : "flat",
      reason: `counter-trade: inverted ${oppSignal.reason}`,
    };
  }

  return runStrategy(bot.character.tradingStyle, state.candles);
}

// ── Bot Update with stat modifiers ──
function updateBot(
  bot: BotState,
  signal: StrategySignal,
  currentPrice: number,
  prevPrice: number,
  regime: MarketRegime,
  opponentStyle: TradingStyle,
  tick: number,
  events: BattleEvent[],
  side: "left" | "right"
): BotState {
  const updated = { ...bot };
  const stats = bot.character.stats;

  // Tick down ability
  if (updated.abilityActive) {
    updated.abilityTicksRemaining--;
    if (updated.abilityTicksRemaining <= 0) {
      updated.abilityActive = false;
    }
  }
  if (updated.abilityCooldown > 0) {
    updated.abilityCooldown--;
  }

  // ── Calculate PnL from existing position ──
  if (bot.position) {
    const move = currentPrice - prevPrice;
    let positionPnl = bot.position.direction === "long" ? move : -move;

    // Apply matchup advantage
    const matchupMod = getMatchupAdvantage(bot.character.tradingStyle, opponentStyle);
    positionPnl *= matchupMod;

    // Apply regime bonus
    const regimeBonus = getRegimeBonus(bot.character.tradingStyle, regime);
    positionPnl *= regimeBonus;

    // Apply stat modifiers
    const attackMod = 0.8 + (stats.attack / 100) * 0.4; // 0.8 - 1.2x
    positionPnl *= attackMod;

    // Apply ability effects
    if (updated.abilityActive) {
      const effect = bot.character.ability.effect;
      if (effect.type === "pnl_boost") {
        positionPnl *= effect.magnitude;
      }
      if (effect.type === "position_scale") {
        positionPnl *= effect.magnitude;
      }
    }

    // Apply defense (drawdown reduction)
    if (positionPnl < 0) {
      const defenseMod = 0.6 + (stats.defense / 100) * 0.4; // reduces loss by defense stat
      positionPnl *= (2 - defenseMod); // higher defense = less loss

      if (updated.abilityActive && bot.character.ability.effect.type === "drawdown_shield") {
        positionPnl *= bot.character.ability.effect.magnitude;
      }
    }

    const pnlChange = positionPnl * bot.position.size;
    updated.pnl += pnlChange;
    updated.peakPnl = Math.max(updated.peakPnl, updated.pnl);
    updated.maxDrawdown = Math.max(updated.maxDrawdown, updated.peakPnl - updated.pnl);

    // Track win/loss per candle
    if (pnlChange > 0) {
      updated.wins++;
      updated.currentStreak = Math.max(1, updated.currentStreak + 1);
    } else if (pnlChange < 0) {
      updated.losses++;
      updated.currentStreak = Math.min(-1, updated.currentStreak - 1);
    }

    // Critical hit: precision-based chance for 2x PnL on wins
    if (pnlChange > 0 && Math.random() * 100 < stats.precision * 0.15) {
      updated.pnl += pnlChange; // double the gain
      events.push({
        tick,
        type: "critical_hit",
        actor: side,
        description: `${bot.character.name} CRITICAL HIT — precision strike doubles gain!`,
      });
    }
  }

  // ── Dynamic Position Sizing ──
  // Base size scaled by attack stat, modified by confidence
  const baseSize = 0.005 + (stats.attack / 100) * 0.015; // 0.005 - 0.02 BTC
  const confidenceScale = 0.5 + signal.confidence * 0.5;
  const positionSize = baseSize * confidenceScale;

  // ── Position Management ──
  if (signal.direction !== "flat" && (!bot.position || bot.position.direction !== signal.direction)) {
    // Calculate stop loss and take profit based on volatility
    const atrEstimate = Math.abs(currentPrice - prevPrice) * 5;
    const stopDistance = atrEstimate * (1.5 - stats.defense * 0.005); // tighter for high defense
    const tpDistance = atrEstimate * (1 + stats.attack * 0.01); // wider for high attack

    updated.position = {
      direction: signal.direction,
      entryPrice: currentPrice,
      entryTime: Date.now(),
      size: positionSize,
      stopLoss: signal.direction === "long"
        ? currentPrice - stopDistance
        : currentPrice + stopDistance,
      takeProfit: signal.direction === "long"
        ? currentPrice + tpDistance
        : currentPrice - tpDistance,
    };
    updated.trades++;

    events.push({
      tick,
      type: "trade",
      actor: side,
      description: `${bot.character.name} enters ${signal.direction.toUpperCase()} (${signal.reason}) — size: ${positionSize.toFixed(4)} BTC`,
    });
  } else if (signal.direction === "flat") {
    if (bot.position) {
      events.push({
        tick,
        type: "trade",
        actor: side,
        description: `${bot.character.name} exits position — PnL: ${updated.pnl.toFixed(2)}`,
      });
    }
    updated.position = null;
  }

  // ── Stop Loss / Take Profit Check ──
  if (updated.position) {
    const pos = updated.position;
    if (pos.stopLoss && pos.takeProfit) {
      const hitSL = pos.direction === "long"
        ? currentPrice <= pos.stopLoss
        : currentPrice >= pos.stopLoss;
      const hitTP = pos.direction === "long"
        ? currentPrice >= pos.takeProfit
        : currentPrice <= pos.takeProfit;

      if (hitSL || hitTP) {
        events.push({
          tick,
          type: "trade",
          actor: side,
          description: `${bot.character.name} ${hitTP ? "TAKE PROFIT" : "STOP LOSS"} triggered!`,
        });
        updated.position = null;
      }
    }
  }

  return updated;
}

// ── Ability Trigger Check ──
function checkAbility(
  bot: BotState,
  state: BattleState,
  side: "left" | "right"
): BotState {
  // Don't trigger if already active or on cooldown
  if (bot.abilityActive || bot.abilityCooldown > 0) return bot;

  const ability = bot.character.ability;
  let shouldTrigger = false;

  switch (ability.triggerCondition) {
    case "low_health":
      shouldTrigger = bot.power < 35;
      break;
    case "high_stage":
      shouldTrigger = state.stage >= 5;
      break;
    case "losing_streak":
      shouldTrigger = bot.currentStreak <= -3;
      break;
    case "winning_streak":
      shouldTrigger = bot.currentStreak >= 3;
      break;
    case "regime_change":
      // Check if regime changed this tick
      shouldTrigger = state.events.some(
        e => e.tick === state.tick && e.type === "market_event" && e.description.includes("Regime")
      );
      break;
  }

  if (shouldTrigger) {
    const updated = { ...bot };
    updated.abilityActive = true;
    updated.abilityTicksRemaining = ability.effect.durationTicks;
    updated.abilityCooldown = ability.cooldownTicks;

    state.events.push({
      tick: state.tick,
      type: "ability_trigger",
      actor: side,
      description: `${bot.character.name} activates ${ability.name} (${ability.nameJa})! — ${ability.description}`,
    });

    return updated;
  }

  return bot;
}

// ── Battle Summary ──
export function getBattleSummary(state: BattleState): BattleSummary | null {
  if (state.isActive || !state.winner) return null;

  const winnerBot = state.winner === "left" ? state.leftBot : state.rightBot;
  const loserBot = state.winner === "left" ? state.rightBot : state.leftBot;

  const criticalMoments = state.events.filter(
    e => e.type === "ability_trigger" || e.type === "critical_hit" || e.type === "stage_change"
  );

  return {
    winner: winnerBot.character,
    loser: loserBot.character,
    winnerPnl: winnerBot.pnl,
    loserPnl: loserBot.pnl,
    totalTicks: state.tick,
    maxStage: state.stage,
    criticalMoments,
    marketEvents: state.marketEvents,
    signalStats: {
      total: state.signals.signalsGenerated,
      trapsTriggered: state.signals.trapsTriggered,
      legendary: state.signals.legendaryCount,
    },
  };
}

// ── Utility ──
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
