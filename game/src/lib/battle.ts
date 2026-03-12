// ============================================
// Battle Engine — orchestrates market sim + strategies + state
// ============================================

import { BattleState, BotState, Character, StageConfig } from "@/types";
import { MarketSimulator } from "./market";
import { runStrategy } from "./strategies";

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

function createBotState(character: Character): BotState {
  return {
    character,
    position: null,
    pnl: 0,
    power: 50,
    trades: 0,
    maxDrawdown: 0,
    peakPnl: 0,
  };
}

export function createBattle(left: Character, right: Character): {
  state: BattleState;
  market: MarketSimulator;
} {
  const market = new MarketSimulator(Date.now() % 100000);
  // Generate initial candles
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
      isActive: true,
      winner: null,
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
  const newState = { ...state };
  newState.tick++;
  newState.candles = [...market.candles];
  newState.currentPrice = market.getPrice();
  newState.volatility = market.getVolatility();
  newState.stage = market.getStage();

  // Run strategies
  const leftSignal = runStrategy(state.leftBot.character.tradingStyle, newState.candles);
  const rightSignal = runStrategy(state.rightBot.character.tradingStyle, newState.candles);

  // Update left bot
  newState.leftBot = updateBot(state.leftBot, leftSignal.direction, candle.close, candle.open);
  newState.rightBot = updateBot(state.rightBot, rightSignal.direction, candle.close, candle.open);

  // Power is relative PnL advantage
  const totalPnl = Math.abs(newState.leftBot.pnl) + Math.abs(newState.rightBot.pnl) + 1;
  newState.leftBot.power = 50 + ((newState.leftBot.pnl - newState.rightBot.pnl) / totalPnl) * 40;
  newState.rightBot.power = 100 - newState.leftBot.power;

  // End condition: 30 ticks
  if (newState.tick >= 30) {
    newState.isActive = false;
    newState.winner = newState.leftBot.pnl >= newState.rightBot.pnl ? "left" : "right";
  }

  return newState;
}

function updateBot(
  bot: BotState,
  direction: "long" | "short" | "flat",
  currentPrice: number,
  prevPrice: number
): BotState {
  const updated = { ...bot };

  // Calculate PnL from existing position
  if (bot.position) {
    const move = currentPrice - prevPrice;
    const positionPnl = bot.position.direction === "long" ? move : -move;
    updated.pnl += positionPnl * bot.position.size;
    updated.peakPnl = Math.max(updated.peakPnl, updated.pnl);
    updated.maxDrawdown = Math.max(updated.maxDrawdown, updated.peakPnl - updated.pnl);
  }

  // Update position
  if (direction !== "flat" && (!bot.position || bot.position.direction !== direction)) {
    updated.position = {
      direction,
      entryPrice: currentPrice,
      entryTime: Date.now(),
      size: 0.01, // 0.01 BTC
    };
    updated.trades++;
  } else if (direction === "flat") {
    updated.position = null;
  }

  return updated;
}
