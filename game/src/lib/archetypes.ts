// ============================================
// Cryptarena — 8 Core AI Trading Archetypes
// ============================================

import type { TradingStyle } from "@/types";

export interface Archetype {
  id: TradingStyle;
  name: string;
  nameJa: string;
  philosophy: string;
  strength: string;
  weakness: string;
  marketCondition: string;
  battleStyle: string;
  signatureAbility: string;
  evolutionPaths: string[];
  icon: string;
  color: string;
}

export const ARCHETYPES: Record<TradingStyle, Archetype> = {
  scalper: {
    id: "scalper",
    name: "Scalper",
    nameJa: "スキャルパー",
    philosophy: "Death by a thousand cuts. Every micro-move is profit waiting to be harvested.",
    strength: "Extremely high trade frequency — accumulates small gains rapidly. Dominates low-volatility, range-bound markets where others sit idle.",
    weakness: "Crushed by sudden spikes and slippage. Each trade risks fees eating profits. Collapses when volatility explodes unpredictably.",
    marketCondition: "Low volatility, tight ranges, high liquidity. Thrives in the calm before the storm.",
    battleStyle: "Rapid-fire flurry of small attacks. Screen fills with dozens of micro-trade indicators. Visual: afterimage clones striking simultaneously.",
    signatureAbility: "Phantom Barrage (幻影連撃) — Executes 10 micro-trades in a single tick, each contributing small PnL. Visually creates afterimage swarm.",
    evolutionPaths: [
      "Stealth Scalper → reduces detection, enters/exits without moving price",
      "Turbo Scalper → doubles trade frequency but increases drawdown risk",
      "Precision Scalper → fewer trades but higher win rate per scalp",
    ],
    icon: "⚡",
    color: "#00ff88",
  },

  momentum: {
    id: "momentum",
    name: "Momentum",
    nameJa: "モメンタム",
    philosophy: "The trend is your blade. Once drawn, never sheathe it until the move is exhausted.",
    strength: "Massive gains in trending markets. Rides winners far longer than any other archetype. Compounds position as confidence grows.",
    weakness: "Destroyed by choppy, sideways markets. Late entries on false breakouts. Slow to reverse when trend dies.",
    marketCondition: "Strong directional trends with follow-through. Post-breakout continuation. News-driven sustained moves.",
    battleStyle: "Heavy, committed strikes that build in power. Each consecutive hit stronger than the last. Visual: growing energy aura that intensifies with trend duration.",
    signatureAbility: "Trend Breaker (趨勢断ち) — After 5+ consecutive same-direction candles, deals massive bonus damage proportional to trend length.",
    evolutionPaths: [
      "Avalanche Rider → exponentially scales position size during strong trends",
      "Trend Sentinel → earlier trend detection via multi-timeframe analysis",
      "Reversal Blade → gains ability to profit from trend exhaustion points",
    ],
    icon: "🔥",
    color: "#ffd700",
  },

  mean_reversion: {
    id: "mean_reversion",
    name: "Mean Reversion",
    nameJa: "回帰師",
    philosophy: "All things return to balance. The greater the deviation, the greater the opportunity.",
    strength: "Consistent profits in range-bound markets. Excellent risk management — always trades with defined targets. Profits when others panic.",
    weakness: "Catastrophic losses during regime changes. Keeps buying dips that never bounce. Fights the trend until destroyed.",
    marketCondition: "Range-bound, oscillating markets. Post-spike recovery periods. Oversold/overbought extremes.",
    battleStyle: "Defensive counter-attacker. Absorbs damage then returns it amplified. Visual: shield that glows brighter as it takes more hits, then releases stored energy.",
    signatureAbility: "Equilibrium Pulse (均衡波動) — When price deviates >1% from moving average, fires a powerful counter-trade that deals damage proportional to the deviation.",
    evolutionPaths: [
      "Deep Value Hunter → widens deviation threshold for bigger but rarer trades",
      "Adaptive Mean → dynamically adjusts mean calculation window to market regime",
      "Rubber Band → adds position scaling — more deviation = larger position",
    ],
    icon: "🔄",
    color: "#00d4ff",
  },

  breakout: {
    id: "breakout",
    name: "Breakout",
    nameJa: "突破者",
    philosophy: "Pressure builds. Walls form. And then — everything shatters. Be there when it does.",
    strength: "Captures explosive moves at the exact moment of range expansion. Best risk-reward ratio of any archetype. First mover advantage.",
    weakness: "Many false breakouts lead to whipsaws. Requires patience during consolidation. Stop losses trigger frequently in choppy markets.",
    marketCondition: "Compression zones, narrowing ranges, triangle formations. Pre-news consolidation. Support/resistance levels under pressure.",
    battleStyle: "Patient stalker that suddenly unleashes devastating single strikes. Long periods of stillness followed by explosive action. Visual: cracking ground/walls before detonation.",
    signatureAbility: "Barrier Shatter (壁破砕) — Detects when volatility compresses below threshold, then enters on expansion with 2x position size. Visual: shattering glass effect.",
    evolutionPaths: [
      "False Break Filter → AI learns to distinguish real vs fake breakouts",
      "Multi-Level Breaker → stacks entries across multiple breakout levels",
      "Volatility Bomber → adds timed entries based on volatility cycle prediction",
    ],
    icon: "💥",
    color: "#ff6600",
  },

  market_maker: {
    id: "market_maker",
    name: "Market Maker",
    nameJa: "板師",
    philosophy: "I am the market. Both sides of every trade flow through me. Spread is my kingdom.",
    strength: "Profits in any market condition by capturing bid-ask spread. Extremely consistent small gains. Provides liquidity and earns from both buyers and sellers.",
    weakness: "Inventory risk during directional moves. Gets run over by strong trends. Requires constant position management and rebalancing.",
    marketCondition: "Any market with sufficient volume. Best in moderate volatility with two-way flow. Worst in panic liquidation cascades.",
    battleStyle: "Dual-stance fighter that attacks and defends simultaneously. Places both long and short signals. Visual: split aura — buy side blue, sell side red, always in balance.",
    signatureAbility: "Spread Fortress (板城塞) — Simultaneously holds opposing positions, profiting from the spread. Reduces incoming damage by capturing volatility from both directions.",
    evolutionPaths: [
      "Toxic Flow Detector → identifies and avoids informed trader flow",
      "Dynamic Spread → widens spread during volatility, narrows during calm",
      "Inventory Hedge → auto-hedges directional exposure to survive trends",
    ],
    icon: "⚖️",
    color: "#8866ff",
  },

  news_hunter: {
    id: "news_hunter",
    name: "News Hunter",
    nameJa: "報道狩人",
    philosophy: "Information is alpha. By the time you read the headline, I've already traded it.",
    strength: "Captures massive moves from simulated news events. Fastest reaction to regime changes. Profits from volatility spikes that destroy other archetypes.",
    weakness: "Prone to overreacting to noise. False signals from non-events. Performance degrades in quiet, newsless markets.",
    marketCondition: "High-impact event windows. Earnings, regulatory announcements, liquidation cascades. Any sudden regime shift.",
    battleStyle: "Ambush predator. Dormant until event trigger, then strikes with overwhelming force. Visual: radar/scanner constantly sweeping, then laser-focused attack on detection.",
    signatureAbility: "Flash Intel (速報撃) — Simulates detecting a news event via volume spike detection. When volume exceeds 3x average, instantly enters with high conviction.",
    evolutionPaths: [
      "Sentiment Parser → reads candle patterns as proxy for market sentiment",
      "Event Predictor → anticipates volatility windows before they happen",
      "Fade the News → evolves to trade the post-news mean reversion instead",
    ],
    icon: "📡",
    color: "#ff2d55",
  },

  whale_tracker: {
    id: "whale_tracker",
    name: "Whale Tracker",
    nameJa: "鯨追い",
    philosophy: "Follow the giants. Where the deep money flows, the tide follows.",
    strength: "Rides large institutional moves by detecting unusual volume. Aligns with smart money. Avoids retail traps by following the biggest players.",
    weakness: "Whale signals can be deceptive (spoofing). Slow to act without whale confirmation. Useless in retail-driven, low-volume markets.",
    marketCondition: "Markets with clear institutional participation. Large block trades. Accumulation/distribution phases with volume anomalies.",
    battleStyle: "Shadow fighter that mirrors a larger invisible force. Attacks come from unexpected angles as if guided by something massive. Visual: ghostly whale silhouette behind the bot.",
    signatureAbility: "Leviathan Follow (巨鯨追従) — When candle volume exceeds 2x rolling average, copies the candle's direction with enhanced position size. Visual: tidal wave effect.",
    evolutionPaths: [
      "Spoof Detector → identifies and ignores fake whale signals",
      "Front Runner → enters slightly before detected whale accumulation completes",
      "Pod Tracker → tracks multiple whale signals for confluence confirmation",
    ],
    icon: "🐋",
    color: "#4488cc",
  },

  hybrid_ai: {
    id: "hybrid_ai",
    name: "Hybrid AI",
    nameJa: "混成体",
    philosophy: "Adaptation is the ultimate strategy. The market changes — so do I.",
    strength: "Dynamically switches between strategies based on market regime. No single weakness. Can exploit any market condition by selecting the optimal approach.",
    weakness: "Jack of all trades, master of none. Strategy switching has latency cost. Can get confused in transitional markets and switch too frequently.",
    marketCondition: "All conditions — adapts in real-time. Best when market regime shifts frequently, punishing specialists who can't adapt.",
    battleStyle: "Shapeshifter that visually transforms between fighting styles mid-battle. Unpredictable attack patterns. Visual: chromatic shifting aura, form changes with each strategy switch.",
    signatureAbility: "Regime Shift (相転移) — Analyzes last 10 candles to detect market regime, then switches to the optimal sub-strategy. Visual: full-body transformation with prismatic burst.",
    evolutionPaths: [
      "Meta Learner → faster regime detection with fewer data points",
      "Strategy Fusion → blends two strategies simultaneously instead of switching",
      "Adversarial Mirror → copies and counters the opponent's detected strategy",
    ],
    icon: "🧬",
    color: "#aa00ff",
  },
};

export function getArchetype(style: TradingStyle): Archetype {
  return ARCHETYPES[style];
}
