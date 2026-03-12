// ============================================
// Cryptarena — Type Definitions
// ============================================

export type TradingStyle =
  | "momentum"
  | "mean_reversion"
  | "high_frequency"
  | "event_driven"
  | "arbitrage"
  | "contrarian"
  | "scalper"
  | "volatility_breaker";

export type BattleResult = "win" | "lose" | "draw";
export type TradeDirection = "long" | "short" | "flat";
export type MarketRegime = "trending" | "ranging" | "volatile" | "calm";
export type BotArchetype = "commander" | "assassin" | "berserker" | "oracle" | "titan" | "shapeshifter" | "fortress" | "trickster";

export interface Character {
  id: string;
  name: string;
  nameJa: string;
  philosophy: string;
  tradingStyle: TradingStyle;
  visualMotif: string;
  primaryColor: string;
  secondaryColor: string;
  emissiveColor: string;
  weapon: string;
  mythReference: string;
  personality: string;
  battleCry: string;
  region: string;
  rank: "S" | "A" | "B" | "C" | "D" | "E";
  archetype: BotArchetype;
  // Base stats (0-100 scale)
  stats: BotBaseStats;
  // Special ability
  ability: SpecialAbility;
}

export interface BotBaseStats {
  attack: number;      // PnL multiplier potential
  defense: number;     // Drawdown resistance
  speed: number;       // Trade frequency bonus
  precision: number;   // Signal accuracy
  adaptability: number; // Regime change resistance
}

export interface SpecialAbility {
  name: string;
  nameJa: string;
  description: string;
  triggerCondition: "low_health" | "high_stage" | "losing_streak" | "winning_streak" | "regime_change";
  effect: AbilityEffect;
  cooldownTicks: number;
}

export interface AbilityEffect {
  type: "pnl_boost" | "drawdown_shield" | "signal_override" | "position_scale" | "counter_trade";
  magnitude: number; // multiplier or flat bonus
  durationTicks: number;
}

export interface Candlestick {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradePosition {
  direction: TradeDirection;
  entryPrice: number;
  entryTime: number;
  size: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface BotState {
  character: Character;
  position: TradePosition | null;
  pnl: number;
  power: number;
  trades: number;
  wins: number;
  losses: number;
  maxDrawdown: number;
  peakPnl: number;
  currentStreak: number; // positive = wins, negative = losses
  // Ability state
  abilityActive: boolean;
  abilityTicksRemaining: number;
  abilityCooldown: number;
}

export interface MarketEvent {
  type: "flash_crash" | "pump" | "liquidation_cascade" | "whale_entry" | "news_spike" | "regime_shift";
  name: string;
  nameJa: string;
  magnitude: number; // price impact multiplier
  tick: number;
}

export interface BattleEvent {
  tick: number;
  type: "trade" | "pnl_change" | "ability_trigger" | "market_event" | "stage_change" | "critical_hit";
  actor: "left" | "right" | "market";
  description: string;
}

export interface BattleState {
  tick: number;
  stage: number; // 1-8
  leftBot: BotState;
  rightBot: BotState;
  candles: Candlestick[];
  currentPrice: number;
  volatility: number;
  regime: MarketRegime;
  isActive: boolean;
  winner: "left" | "right" | null;
  events: BattleEvent[];
  marketEvents: MarketEvent[];
}

export interface StageConfig {
  id: number;
  name: string;
  nameEn: string;
  color: string;
  shakeIntensity: number;
  bloomStrength: number;
  particleCount: number;
}

// Matchup advantage matrix: how well style A performs against style B
export interface MatchupModifier {
  attacker: TradingStyle;
  defender: TradingStyle;
  advantage: number; // multiplier: >1 = advantage, <1 = disadvantage
}

export interface BattleSummary {
  winner: Character;
  loser: Character;
  winnerPnl: number;
  loserPnl: number;
  totalTicks: number;
  maxStage: number;
  criticalMoments: BattleEvent[];
  marketEvents: MarketEvent[];
// ============================================
// Cryptarena — Player Bot & Game State Types
// ============================================

export type BotRank = "F" | "E" | "D" | "C" | "B" | "A" | "S";

export interface PlayerBot {
  id: string;
  name: string;
  character: Character;
  rank: BotRank;
  level: number;
  exp: number;
  expToNext: number;
  wins: number;
  losses: number;
  totalPnl: number;
  stats: {
    aggression: number;
    precision: number;
    resilience: number;
    speed: number;
  };
  createdAt: number;
  mutations: string[];
}

export interface BattleRecord {
  id: string;
  playerBotId: string;
  opponentBotId: string;
  playerBot: PlayerBot;
  opponentBot: PlayerBot;
  playerPnl: number;
  opponentPnl: number;
  playerWon: boolean;
  totalTicks: number;
  maxStage: number;
  timestamp: number;
  expGained: number;
  rewardGold: number;
}

export interface EvolutionOption {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  statChanges: Partial<PlayerBot["stats"]>;
  rarity: "common" | "rare" | "epic" | "legendary";
  color: string;
}

export interface GameState {
  playerBots: PlayerBot[];
  selectedBotId: string | null;
  gold: number;
  battleHistory: BattleRecord[];
  currentBattle: BattleState | null;
  currentBattleRecord: Partial<BattleRecord> | null;
}
