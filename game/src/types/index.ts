// ============================================
// CoinBattle Saki — Type Definitions
// ============================================

export type TradingStyle = "momentum" | "mean_reversion" | "high_frequency";
export type BattleResult = "win" | "lose" | "draw";
export type TradeDirection = "long" | "short" | "flat";

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
}

export interface BotState {
  character: Character;
  position: TradePosition | null;
  pnl: number;
  power: number;
  trades: number;
  maxDrawdown: number;
  peakPnl: number;
}

export interface BattleState {
  tick: number;
  stage: number; // 1-8
  leftBot: BotState;
  rightBot: BotState;
  candles: Candlestick[];
  currentPrice: number;
  volatility: number;
  isActive: boolean;
  winner: "left" | "right" | null;
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
}
