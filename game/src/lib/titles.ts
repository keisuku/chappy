// ============================================
// Trader Title System
// Detects trading patterns and evaluates title conditions
// ============================================

import {
  TraderTitle,
  TitleCondition,
  StylePattern,
  TraderProfile,
  DailyStats,
  LifetimeStats,
  PatternHistory,
  TradeRecord,
  BattleState,
  BotState,
} from "@/types";

// ============================================
// Pattern Detector
// Analyzes trade history to identify style patterns
// ============================================

export function detectPatterns(history: PatternHistory): StylePattern[] {
  const detected: StylePattern[] = [];

  // Momentum dominant: >70% trend-following trades
  if (history.trendFollowRatio > 0.7) {
    detected.push("momentum_dominant");
  }

  // Contrarian: >70% counter-trend trades
  if (history.trendFollowRatio < 0.3) {
    detected.push("contrarian");
  }

  // Scalper: avg hold < 3 ticks
  if (history.avgHoldTime < 3 && history.avgHoldTime > 0) {
    detected.push("scalper");
  }

  // Swing trader: avg hold > 10 ticks
  if (history.avgHoldTime > 10) {
    detected.push("swing_trader");
  }

  // Long biased: >80% long
  if (history.longRatio > 0.8) {
    detected.push("long_biased");
  }

  // Short biased: >80% short
  if (history.shortRatio > 0.8) {
    detected.push("short_biased");
  }

  // High frequency: >20 trades/battle avg
  if (history.avgTradesPerBattle > 20) {
    detected.push("high_frequency");
  }

  // Sniper: <5 trades/battle, high win ratio
  if (history.avgTradesPerBattle < 5 && history.recentTrades.length >= 10) {
    const wins = history.recentTrades.filter((t) => t.pnl > 0).length;
    if (wins / history.recentTrades.length > 0.7) {
      detected.push("sniper");
    }
  }

  // Dip buyer: enters long after drawdowns
  if (history.recentTrades.length >= 10) {
    const dipBuys = history.recentTrades.filter(
      (t) => t.direction === "long" && t.pnl > 0 && t.stage >= 3
    );
    if (dipBuys.length / Math.max(1, history.recentTrades.length) > 0.4) {
      detected.push("dip_buyer");
    }
  }

  // Top seller: enters short after surges
  if (history.recentTrades.length >= 10) {
    const topSells = history.recentTrades.filter(
      (t) => t.direction === "short" && t.pnl > 0 && t.stage >= 3
    );
    if (topSells.length / Math.max(1, history.recentTrades.length) > 0.4) {
      detected.push("top_seller");
    }
  }

  // Volatility hunter: higher trade frequency in S5+
  if (history.highVolTradeRatio > 0.6) {
    detected.push("volatility_hunter");
  }

  // Calm trader: consistent PnL, low drawdown
  if (history.drawdownRecoveryRate > 0.8 && history.recentTrades.length >= 20) {
    const pnls = history.recentTrades.map((t) => t.pnl);
    const avg = pnls.reduce((a, b) => a + b, 0) / pnls.length;
    const variance = pnls.reduce((s, p) => s + (p - avg) ** 2, 0) / pnls.length;
    const stddev = Math.sqrt(variance);
    if (stddev < Math.abs(avg) * 0.5) {
      detected.push("calm_trader");
    }
  }

  // Comeback king: 3+ recoveries from negative
  if (history.drawdownRecoveryRate > 0.6) {
    const comebacks = countComebacks(history.recentTrades);
    if (comebacks >= 3) {
      detected.push("comeback_king");
    }
  }

  // Iron hands: holds through deep drawdown
  if (history.recentTrades.length >= 10) {
    const longHolds = history.recentTrades.filter(
      (t) => (t.exitTick - t.entryTick) > 8 && t.pnl > 0
    );
    if (longHolds.length >= 3) {
      detected.push("iron_hands");
    }
  }

  // First mover: enters within first 3 ticks
  if (history.avgEntryTick < 3 && history.recentTrades.length >= 10) {
    detected.push("first_mover");
  }

  // Closer: wins in final 5 ticks
  if (history.recentTrades.length >= 10) {
    const lateWins = history.recentTrades.filter(
      (t) => t.pnl > 0 && t.exitTick >= 25
    );
    const wins = history.recentTrades.filter((t) => t.pnl > 0);
    if (wins.length > 0 && lateWins.length / wins.length > 0.5) {
      detected.push("closer");
    }
  }

  // Multi-strategy: 3+ unique bots
  const uniqueBots = new Set(history.recentTrades.map((t) => t.botId));
  if (uniqueBots.size >= 3) {
    detected.push("multi_strategy");
  }

  // One-trick: >80% same bot
  if (history.recentTrades.length >= 10) {
    const botCounts = new Map<string, number>();
    for (const t of history.recentTrades) {
      botCounts.set(t.botId, (botCounts.get(t.botId) ?? 0) + 1);
    }
    const maxBotCount = Math.max(...botCounts.values());
    if (maxBotCount / history.recentTrades.length > 0.8) {
      detected.push("one_trick");
    }
  }

  // Perfectionist: 3+ perfect trades (PnL > threshold in single tick)
  const perfects = history.recentTrades.filter(
    (t) => t.exitTick - t.entryTick <= 1 && t.pnl > 50
  );
  if (perfects.length >= 3) {
    detected.push("perfectionist");
  }

  // Survivor: wins with thin margins
  if (history.avgPnlMargin > 0 && history.avgPnlMargin < 10) {
    detected.push("survivor");
  }

  return detected;
}

// ============================================
// Title Evaluator
// Checks which titles a player has earned
// ============================================

export function evaluateTitles(
  profile: TraderProfile,
  allTitles: TraderTitle[]
): string[] {
  const earned: string[] = [];

  for (const title of allTitles) {
    if (profile.activeTitles.includes(title.id)) continue;
    if (checkCondition(title.condition, profile)) {
      earned.push(title.id);
    }
  }

  return earned;
}

function checkCondition(
  condition: TitleCondition,
  profile: TraderProfile
): boolean {
  const daily = profile.dailyStats;
  const lifetime = profile.lifetimeStats;
  const patterns = profile.patternHistory;

  switch (condition.type) {
    case "daily_profit":
      return daily.profit >= condition.min;
    case "daily_profit_negative":
      return daily.profit <= condition.max;
    case "daily_trades":
      return daily.trades >= condition.min;
    case "daily_win_rate":
      return daily.trades >= condition.min_trades &&
        daily.wins / Math.max(1, daily.trades) >= condition.min;
    case "daily_max_drawdown":
      return daily.trades >= condition.min_trades &&
        daily.maxDrawdown <= condition.max;
    case "daily_perfect_trades":
      return daily.perfectTrades >= condition.min;
    case "daily_stage_reached":
      return daily.highestStage >= condition.stage;
    case "daily_jackpots":
      return daily.jackpots >= condition.min;
    case "daily_comebacks":
      return daily.comebacks >= condition.min;
    case "daily_battles":
      return daily.battles >= condition.min;
    case "total_profit":
      return lifetime.totalProfit >= condition.min;
    case "total_trades":
      return lifetime.totalTrades >= condition.min;
    case "total_wins":
      return lifetime.totalWins >= condition.min;
    case "total_battles":
      return lifetime.totalBattles >= condition.min;
    case "total_jackpots":
      return lifetime.totalJackpots >= condition.min;
    case "total_perfect_trades":
      return lifetime.totalPerfectTrades >= condition.min;
    case "total_max_streak":
      return lifetime.maxWinStreak >= condition.min;
    case "total_unique_bots":
      return lifetime.uniqueBotsUsed.length >= condition.min;
    case "total_s8_battles":
      return lifetime.totalS8Battles >= condition.min;
    case "total_comebacks":
      return lifetime.totalComebacks >= condition.min;
    case "style_pattern": {
      const detected = detectPatterns(patterns);
      return detected.includes(condition.pattern);
    }
    default:
      return false;
  }
}

// ============================================
// Profile Updater
// Updates trader profile after each battle
// ============================================

export function updateProfileFromBattle(
  profile: TraderProfile,
  battleState: BattleState,
  playerSide: "left" | "right"
): TraderProfile {
  const bot = playerSide === "left" ? battleState.leftBot : battleState.rightBot;
  const opponent = playerSide === "left" ? battleState.rightBot : battleState.leftBot;
  const won = battleState.winner === playerSide;
  const pnl = bot.pnl;

  const updated = structuredClone(profile);

  // Daily stats
  updated.dailyStats.profit += pnl;
  updated.dailyStats.trades += bot.trades;
  updated.dailyStats.battles++;
  if (won) updated.dailyStats.wins++;
  else updated.dailyStats.losses++;
  updated.dailyStats.maxDrawdown = Math.max(updated.dailyStats.maxDrawdown, bot.maxDrawdown);
  updated.dailyStats.highestStage = Math.max(updated.dailyStats.highestStage, battleState.stage);

  // Lifetime stats
  updated.lifetimeStats.totalProfit += pnl;
  updated.lifetimeStats.totalTrades += bot.trades;
  updated.lifetimeStats.totalBattles++;
  if (won) {
    updated.lifetimeStats.totalWins++;
    updated.lifetimeStats.currentWinStreak++;
    updated.lifetimeStats.maxWinStreak = Math.max(
      updated.lifetimeStats.maxWinStreak,
      updated.lifetimeStats.currentWinStreak
    );
  } else {
    updated.lifetimeStats.currentWinStreak = 0;
  }

  if (battleState.stage >= 8) {
    updated.lifetimeStats.totalS8Battles++;
  }

  if (!updated.lifetimeStats.uniqueBotsUsed.includes(bot.character.id)) {
    updated.lifetimeStats.uniqueBotsUsed.push(bot.character.id);
  }

  // Build trade records from this battle
  const record: TradeRecord = {
    direction: bot.position?.direction ?? "long",
    entryTick: Math.max(1, battleState.tick - (bot.trades > 0 ? Math.floor(30 / bot.trades) : 15)),
    exitTick: battleState.tick,
    pnl,
    stage: battleState.stage,
    botId: bot.character.id,
    followedTrend: estimateTrendFollow(bot, battleState),
  };

  updated.patternHistory.recentTrades.push(record);
  // Keep last 100
  if (updated.patternHistory.recentTrades.length > 100) {
    updated.patternHistory.recentTrades = updated.patternHistory.recentTrades.slice(-100);
  }

  // Recalculate pattern aggregates
  recalculatePatternAggregates(updated.patternHistory);

  return updated;
}

// ============================================
// Factory
// ============================================

export function createEmptyProfile(playerId: string): TraderProfile {
  const today = new Date().toISOString().split("T")[0];
  return {
    playerId,
    dailyStats: {
      date: today,
      profit: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      battles: 0,
      maxDrawdown: 0,
      perfectTrades: 0,
      jackpots: 0,
      comebacks: 0,
      highestStage: 1,
    },
    lifetimeStats: {
      totalProfit: 0,
      totalTrades: 0,
      totalWins: 0,
      totalBattles: 0,
      totalJackpots: 0,
      totalPerfectTrades: 0,
      maxWinStreak: 0,
      currentWinStreak: 0,
      uniqueBotsUsed: [],
      totalS8Battles: 0,
      totalComebacks: 0,
    },
    patternHistory: {
      recentTrades: [],
      avgHoldTime: 0,
      avgTradesPerBattle: 0,
      longRatio: 0,
      shortRatio: 0,
      trendFollowRatio: 0,
      avgEntryTick: 0,
      avgExitTick: 0,
      highVolTradeRatio: 0,
      drawdownRecoveryRate: 0,
      avgPnlMargin: 0,
    },
    activeTitles: [],
    equippedTitle: null,
  };
}

export function resetDailyStats(profile: TraderProfile): TraderProfile {
  const updated = structuredClone(profile);
  const today = new Date().toISOString().split("T")[0];
  updated.dailyStats = {
    date: today,
    profit: 0,
    trades: 0,
    wins: 0,
    losses: 0,
    battles: 0,
    maxDrawdown: 0,
    perfectTrades: 0,
    jackpots: 0,
    comebacks: 0,
    highestStage: 1,
  };
  return updated;
}

// ============================================
// Utilities
// ============================================

function countComebacks(trades: TradeRecord[]): number {
  let comebacks = 0;
  let runningPnl = 0;
  let wasNegative = false;

  for (const t of trades) {
    runningPnl += t.pnl;
    if (runningPnl < 0) wasNegative = true;
    if (wasNegative && runningPnl > 0) {
      comebacks++;
      wasNegative = false;
    }
  }

  return comebacks;
}

function estimateTrendFollow(bot: BotState, state: BattleState): boolean {
  if (!bot.position || state.candles.length < 5) return false;
  const recent = state.candles.slice(-5);
  const bullish = recent.filter((c) => c.close > c.open).length;
  const trend = bullish >= 3 ? "long" : "short";
  return bot.position.direction === trend;
}

function recalculatePatternAggregates(history: PatternHistory): void {
  const trades = history.recentTrades;
  if (trades.length === 0) return;

  const holdTimes = trades.map((t) => t.exitTick - t.entryTick);
  history.avgHoldTime = holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length;

  const longs = trades.filter((t) => t.direction === "long").length;
  const shorts = trades.filter((t) => t.direction === "short").length;
  history.longRatio = longs / trades.length;
  history.shortRatio = shorts / trades.length;

  const trendFollows = trades.filter((t) => t.followedTrend).length;
  history.trendFollowRatio = trendFollows / trades.length;

  history.avgEntryTick = trades.reduce((s, t) => s + t.entryTick, 0) / trades.length;
  history.avgExitTick = trades.reduce((s, t) => s + t.exitTick, 0) / trades.length;

  const highVolTrades = trades.filter((t) => t.stage >= 5).length;
  history.highVolTradeRatio = highVolTrades / trades.length;

  // Drawdown recovery rate: % of losing streaks recovered from
  let negativeRuns = 0;
  let recoveredRuns = 0;
  let inNegRun = false;
  let runPnl = 0;
  for (const t of trades) {
    runPnl += t.pnl;
    if (runPnl < 0 && !inNegRun) { negativeRuns++; inNegRun = true; }
    if (runPnl >= 0 && inNegRun) { recoveredRuns++; inNegRun = false; }
  }
  history.drawdownRecoveryRate = negativeRuns > 0 ? recoveredRuns / negativeRuns : 1;

  const wins = trades.filter((t) => t.pnl > 0);
  history.avgPnlMargin = wins.length > 0
    ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length
    : 0;

  // Compute avg trades per battle (estimate from unique exit ticks as proxy for battles)
  const uniqueExitTicks = new Set(trades.map((t) => `${t.botId}-${t.exitTick}`));
  history.avgTradesPerBattle = trades.length / Math.max(1, uniqueExitTicks.size);
}
