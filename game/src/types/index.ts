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
