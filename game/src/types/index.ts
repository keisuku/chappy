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
