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

// ============================================
// Visual Event Engine — Types
// ============================================

export type SignalStrength = "weak" | "medium" | "strong" | "jackpot";

export type SignalSource =
  | "price_move"
  | "trade_entry"
  | "trade_exit"
  | "position_flip"
  | "pnl_surge"
  | "drawdown"
  | "comeback"
  | "stage_change"
  | "power_shift"
  | "volatility_spike"
  | "perfect_trade"
  | "combo_chain";

export interface SignalEvent {
  source: SignalSource;
  strength: SignalStrength;
  tick: number;
  side: "left" | "right" | "both";
  value: number;
  description: string;
}

export interface CameraMovement {
  type: "shake" | "zoom_in" | "zoom_out" | "pan_to" | "slam" | "orbit_fast" | "none";
  intensity: number;        // 0-1
  duration: number;         // ticks
  target: "left" | "right" | "center";
}

export interface VisualEffect {
  type: "particle_burst" | "screen_flash" | "aura_flare" | "shockwave"
      | "trail_blaze" | "glitch" | "gold_rain" | "none";
  color: string;
  intensity: number;        // 0-1
  duration: number;         // ticks
  radius: number;           // world units
}

export interface BotAnimation {
  type: "attack_lunge" | "power_up" | "stagger" | "guard"
      | "celebrate" | "charge" | "dodge" | "idle";
  intensity: number;        // 0-1
  duration: number;         // ticks
  side: "left" | "right" | "both";
}

export interface ResultProbability {
  win_chance_shift: number;  // -1 to +1 (how much this event shifts win probability)
  pnl_impact: number;       // estimated P&L impact
  momentum: number;         // -1 (bearish) to +1 (bullish) for the triggering side
  excitement: number;       // 0-1 (audience excitement / spectacle value)
}

export interface VisualBattleEvent {
  id: string;
  signal: SignalEvent;
  visual: VisualEffect;
  camera: CameraMovement;
  animation: BotAnimation;
  probability: ResultProbability;
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
}

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

export interface Arena {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  volatilityMultiplier: number;
  eventFrequency: number;
  maxStages: number;
  tickCount: number;
  color: string;
  background: string;
  enabled: boolean;
}

// ============================================
// Market Force Engine Types
// ============================================

export type MarketForceType = "whale" | "bull" | "bear" | "shark" | "retail";

export interface MarketForce {
  type: MarketForceType;
  name: string;
  nameJa: string;
  description: string;
  color: string;
  power: number;           // 0-100, current influence strength
  basePower: number;       // starting power
  bias: number;            // -1 (bearish) to +1 (bullish) price bias
  volatilityImpact: number; // multiplier on volatility
  momentum: number;        // how much force accelerates trends (-1 to +1)
  icon: string;
}

export interface ForceState {
  force: MarketForce;
  energy: number;          // 0-100, depletes on actions, recharges over time
  cooldown: number;        // ticks until next special action
  streak: number;          // consecutive ticks of dominance
  totalInfluence: number;  // cumulative price impact this battle
}

export type ForceEventType =
  | "force_enter"        // force enters the arena
  | "force_clash"        // two forces collide
  | "force_dominate"     // one force overwhelms another
  | "force_retreat"      // force loses power and retreats
  | "force_surge"        // sudden power spike
  | "force_special"      // unique force ability triggered
  | "force_shift";       // dominant force changes

export interface ForceEvent {
  tick: number;
  type: ForceEventType;
  actorForce: MarketForceType;
  targetForce?: MarketForceType;
  name: string;
  nameJa: string;
  description: string;
  priceImpact: number;       // direct price change
  volatilityImpact: number;  // volatility modifier
  magnitude: number;         // visual intensity 0-1
}

export interface ForceBattleState {
  forces: Record<MarketForceType, ForceState>;
  dominantForce: MarketForceType | null;
  tension: number;            // 0-1, how contested the market is
  events: ForceEvent[];
  tick: number;
}

export interface GameState {
  playerBots: PlayerBot[];
  selectedBotId: string | null;
  gold: number;
  battleHistory: BattleRecord[];
  currentBattle: BattleState | null;
  currentBattleRecord: Partial<BattleRecord> | null;
  arenas: Arena[];
  botImages: Record<string, string>; // botId/characterId -> dataURL
}

// ============================================
// Trader Title System — Types
// ============================================

export type TitleCategory = "daily" | "lifetime" | "style";
export type TitleRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface TraderTitle {
  id: string;
  name: string;
  nameJa: string;
  category: TitleCategory;
  rarity: TitleRarity;
  description: string;
  condition: TitleCondition;
  reward_ac: number;
}

export type TitleCondition =
  | { type: "daily_profit"; min: number }
  | { type: "daily_profit_negative"; max: number }
  | { type: "daily_trades"; min: number }
  | { type: "daily_win_rate"; min: number; min_trades: number }
  | { type: "daily_max_drawdown"; max: number; min_trades: number }
  | { type: "daily_perfect_trades"; min: number }
  | { type: "daily_stage_reached"; stage: number }
  | { type: "daily_jackpots"; min: number }
  | { type: "daily_comebacks"; min: number }
  | { type: "daily_battles"; min: number }
  | { type: "total_profit"; min: number }
  | { type: "total_trades"; min: number }
  | { type: "total_wins"; min: number }
  | { type: "total_battles"; min: number }
  | { type: "total_jackpots"; min: number }
  | { type: "total_perfect_trades"; min: number }
  | { type: "total_max_streak"; min: number }
  | { type: "total_unique_bots"; min: number }
  | { type: "total_s8_battles"; min: number }
  | { type: "total_comebacks"; min: number }
  | { type: "style_pattern"; pattern: StylePattern };

export type StylePattern =
  | "momentum_dominant"     // >70% of trades follow trend
  | "contrarian"            // >70% of trades counter trend
  | "scalper"               // avg hold time < 3 ticks
  | "swing_trader"          // avg hold time > 10 ticks
  | "long_biased"           // >80% long positions
  | "short_biased"          // >80% short positions
  | "high_frequency"        // >20 trades per battle avg
  | "sniper"                // <5 trades per battle, >70% win rate
  | "dip_buyer"             // enters long after drawdowns
  | "top_seller"            // enters short after surges
  | "volatility_hunter"     // higher trade frequency in S5+ stages
  | "calm_trader"           // consistent PnL, low drawdown ratio
  | "comeback_king"         // >3 comebacks from negative PnL
  | "iron_hands"            // holds through >50% drawdown without exiting
  | "first_mover"           // enters within first 3 ticks consistently
  | "closer"                // wins in final 5 ticks consistently
  | "multi_strategy"        // uses 3+ different bots
  | "one_trick"             // uses same bot >80% of battles
  | "risk_taker"            // avg leverage > 5x
  | "conservative"          // avg leverage < 2x
  | "perfectionist"         // >3 perfect trades lifetime
  | "survivor";             // wins with <10% PnL margin

export interface TraderProfile {
  playerId: string;
  dailyStats: DailyStats;
  lifetimeStats: LifetimeStats;
  patternHistory: PatternHistory;
  activeTitles: string[];      // title IDs
  equippedTitle: string | null; // displayed title
}

export interface DailyStats {
  date: string;              // ISO date
  profit: number;
  trades: number;
  wins: number;
  losses: number;
  battles: number;
  maxDrawdown: number;
  perfectTrades: number;
  jackpots: number;
  comebacks: number;
  highestStage: number;
}

export interface LifetimeStats {
  totalProfit: number;
  totalTrades: number;
  totalWins: number;
  totalBattles: number;
  totalJackpots: number;
  totalPerfectTrades: number;
  maxWinStreak: number;
  currentWinStreak: number;
  uniqueBotsUsed: string[];
  totalS8Battles: number;
  totalComebacks: number;
}

export interface PatternHistory {
  recentTrades: TradeRecord[];  // last 100 trades
  avgHoldTime: number;          // ticks
  avgTradesPerBattle: number;
  longRatio: number;            // 0-1
  shortRatio: number;           // 0-1
  trendFollowRatio: number;     // 0-1
  avgEntryTick: number;
  avgExitTick: number;
  highVolTradeRatio: number;    // % of trades in S5+ stages
  drawdownRecoveryRate: number; // % of drawdowns recovered from
  avgPnlMargin: number;        // avg win margin
}

export interface TradeRecord {
  direction: TradeDirection;
  entryTick: number;
  exitTick: number;
  pnl: number;
  stage: number;
  botId: string;
  followedTrend: boolean;
}
