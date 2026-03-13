// ============================================
// Cryptarena — Type Definitions
// ============================================

export type TradingStyle =
  | "scalper"
  | "momentum"
  | "mean_reversion"
  | "breakout"
  | "market_maker"
  | "news_hunter"
  | "whale_tracker"
  | "hybrid_ai";
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
  signals: SignalEngineState;
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

// ── Signal Engine Types ──

export type SignalType =
  | "trend_break"         // Price breaks key trendline
  | "volume_spike"        // Abnormal volume surge
  | "pattern_formation"   // Chart pattern detected (triangle, head-shoulders, etc.)
  | "divergence"          // Price/momentum divergence
  | "support_test"        // Price tests support level
  | "resistance_test"     // Price tests resistance level
  | "whale_alert"         // Large order detected
  | "liquidation_zone"    // Mass liquidation price level nearby
  | "golden_cross"        // Short MA crosses above long MA
  | "death_cross"         // Short MA crosses below long MA
  | "fakeout"             // False breakout trap
  | "squeeze_alert";      // Volatility squeeze about to break

export type SignalStrength = "noise" | "weak" | "moderate" | "strong" | "legendary";

export type BotReaction = "ignore" | "scan" | "hesitate" | "engage" | "dodge" | "all_in";

export interface Signal {
  id: string;
  type: SignalType;
  tick: number;
  // Core attributes
  confidence: number;        // 0-1 — how likely the signal is real (most are <0.3)
  strength: SignalStrength;
  direction: TradeDirection;  // suggested direction
  // Outcome
  isTrap: boolean;           // true = signal will fail (fakeout)
  trapSeverity: number;      // 0-1 — how badly the trap punishes
  // Visual output for UI
  visual: SignalVisual;
  // Lifecycle
  decayRate: number;         // confidence drops per tick (0.05-0.5)
  ttl: number;               // ticks remaining before signal expires
  expired: boolean;
  // Context
  priceLevel: number;        // price at which signal appeared
  reason: string;            // human-readable explanation
}

export interface SignalVisual {
  intensity: number;         // 0-1 — controls particle count, glow, screen effects
  color: string;             // hex color for the signal flash
  icon: string;              // emoji or icon name for UI
  screenEffect: "none" | "flash" | "pulse" | "ripple" | "shake" | "glitch";
  particleBurst: number;     // number of particles to spawn (0-50)
  soundCue: "none" | "blip" | "chime" | "alarm" | "thunder" | "shatter";
}

export interface BotSignalReaction {
  botSide: "left" | "right";
  signal: Signal;
  reaction: BotReaction;
  reactionReason: string;
  confidenceAfterFilter: number;  // bot's filtered confidence (precision stat)
  acted: boolean;                 // did the bot take a position from this signal?
  profited: boolean | null;       // null = pending, true/false after resolution
}

export interface SignalEngineState {
  activeSignals: Signal[];          // currently live signals on the battlefield
  resolvedSignals: Signal[];        // signals that have expired or been acted on
  reactions: BotSignalReaction[];   // how each bot reacted to each signal
  signalsGenerated: number;         // total count
  trapsTriggered: number;           // how many bots fell for traps
  legendaryCount: number;           // rare strong signals seen
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
  signalStats: {
    total: number;
    trapsTriggered: number;
    legendary: number;
  };
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
// Trading Engine — DNA, Leverage, Liquidation
// ============================================

/** Bot DNA: 8 genes that define trading behavior (0-100 each) */
export interface BotDNA {
  aggression: number;      // position size tendency (high = bigger bets)
  conviction: number;      // hold duration (high = diamond hands, low = paper hands)
  fearIndex: number;       // stop-loss tightness (high = scared, cuts fast)
  greedIndex: number;      // take-profit greed (high = holds for bigger wins)
  leverageBias: number;    // preferred leverage level (maps to 1x-1000x)
  adaptSpeed: number;      // how fast bot changes strategy in regime shifts
  contrarian: number;      // tendency to fade the crowd (high = counter-trend)
  clutchFactor: number;    // performance under pressure (high = better at high stages)
}

/** Leverage tier with risk/reward characteristics */
export interface LeverageTier {
  label: string;
  labelJa: string;
  multiplier: number;       // 1-1000
  liquidationDistance: number; // % price move to get liquidated
  feeRate: number;           // funding rate per tick
  color: string;
}

/** A leveraged position in the trading engine */
export interface LeveragedPosition {
  direction: TradeDirection;
  entryPrice: number;
  size: number;              // base position size in BTC
  leverage: number;          // effective leverage multiplier
  liquidationPrice: number;  // price at which position is force-closed
  margin: number;            // collateral locked
  unrealizedPnl: number;    // current floating PnL
  maxUnrealizedPnl: number; // peak floating PnL (for trailing)
  ticksHeld: number;        // how long position has been open
  fundingPaid: number;      // cumulative funding fees
}

/** Per-bot state in the trading engine */
export interface TradingBotState {
  botId: string;
  dna: BotDNA;
  balance: number;          // current account balance (starts at margin)
  startBalance: number;     // initial balance for ROI calc
  position: LeveragedPosition | null;
  isLiquidated: boolean;
  liquidationTick: number | null;
  trades: TradeLog[];
  roi: number;              // running return on investment (%)
  maxRoi: number;           // peak ROI
  maxDrawdownPct: number;   // worst drawdown as %
  totalFeesPaid: number;
}

export interface TradeLog {
  tick: number;
  action: "open_long" | "open_short" | "close" | "liquidated" | "stop_loss" | "take_profit" | "flip";
  price: number;
  leverage: number;
  size: number;
  pnl: number;
  roi: number;              // ROI of this individual trade
  reason: string;
}

/** Full trading session state */
export interface TradingSession {
  tick: number;
  maxTicks: number;          // short sessions: 15-30 ticks
  leftTrader: TradingBotState;
  rightTrader: TradingBotState;
  candles: Candlestick[];
  currentPrice: number;
  volatility: number;
  regime: MarketRegime;
  stage: number;
  isActive: boolean;
  winner: "left" | "right" | null;
  events: TradingEvent[];
}

export interface TradingEvent {
  tick: number;
  actor: "left" | "right" | "market";
  type: "leverage_up" | "leverage_down" | "liquidation" | "margin_call" | "take_profit" | "stop_loss" | "flip" | "open" | "close" | "funding";
  description: string;
  magnitude: number;         // for visual intensity scaling
}

/** Result of fusing two bots */
export interface FusionResult {
  dna: BotDNA;
  mutationName: string;
  mutationNameJa: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  bonusGene: keyof BotDNA | null;   // which gene got a random boost
  description: string;
}

export interface TradingSessionSummary {
  winner: TradingBotState;
  loser: TradingBotState;
  winnerRoi: number;
  loserRoi: number;
  liquidationOccurred: boolean;
  maxLeverage: number;
  totalTrades: number;
  maxStage: number;
  events: TradingEvent[];
}
