// ============================================
// Trading Engine — Leveraged Futures Simulation
//
// Core mechanics:
// - Bot DNA determines behavior (8 genes, 0-100)
// - Leverage 1x-1000x with realistic liquidation
// - Funding fees drain over-leveraged positions
// - Short 15-30 tick sessions for fast battles
// - High variance: a 100x long can 10x your account or liquidate you
//
// Design: simple enough for a game, wild enough for crypto futures
// ============================================

import {
  BotDNA,
  Candlestick,
  LeveragedPosition,
  LeverageTier,
  MarketRegime,
  TradeDirection,
  TradeLog,
  TradingBotState,
  TradingEvent,
  TradingSession,
  TradingSessionSummary,
  Character,
  PlayerBot,
} from "@/types";
import { MarketSimulator } from "./market";
import { runStrategy } from "./strategies";

// ── Leverage Tiers ──
// Each tier has different liquidation distances and fee rates

export const LEVERAGE_TIERS: LeverageTier[] = [
  { label: "1x Safe",        labelJa: "1倍 安全",     multiplier: 1,    liquidationDistance: 1.00,   feeRate: 0,        color: "#4488aa" },
  { label: "3x Low",         labelJa: "3倍 低",       multiplier: 3,    liquidationDistance: 0.30,   feeRate: 0.0001,   color: "#44aacc" },
  { label: "10x Medium",     labelJa: "10倍 中",      multiplier: 10,   liquidationDistance: 0.09,   feeRate: 0.0003,   color: "#44cc88" },
  { label: "25x High",       labelJa: "25倍 高",      multiplier: 25,   liquidationDistance: 0.035,  feeRate: 0.0005,   color: "#aacc44" },
  { label: "50x Degen",      labelJa: "50倍 デジェン", multiplier: 50,   liquidationDistance: 0.017,  feeRate: 0.001,    color: "#ffaa00" },
  { label: "100x Ape",       labelJa: "100倍 猿",     multiplier: 100,  liquidationDistance: 0.008,  feeRate: 0.002,    color: "#ff6600" },
  { label: "250x Gamble",    labelJa: "250倍 賭博",   multiplier: 250,  liquidationDistance: 0.003,  feeRate: 0.005,    color: "#ff2d55" },
  { label: "500x Insane",    labelJa: "500倍 狂気",   multiplier: 500,  liquidationDistance: 0.0015, feeRate: 0.01,     color: "#cc00ff" },
  { label: "1000x God Mode", labelJa: "1000倍 神",    multiplier: 1000, liquidationDistance: 0.0007, feeRate: 0.02,     color: "#ffffff" },
];

// ── DNA Generation ──

/** Generate DNA from a Character's base stats and trading style */
export function generateDNA(character: Character, playerStats?: PlayerBot["stats"]): BotDNA {
  const s = character.stats;
  const ps = playerStats;

  return {
    aggression:   clamp(s.attack * 0.8 + (ps?.aggression ?? 50) * 0.2 + jitter(), 0, 100),
    conviction:   clamp(s.defense * 0.6 + s.adaptability * 0.2 + jitter(), 0, 100),
    fearIndex:    clamp((100 - s.attack) * 0.5 + s.defense * 0.3 + jitter(), 0, 100),
    greedIndex:   clamp(s.attack * 0.6 + (100 - s.defense) * 0.3 + jitter(), 0, 100),
    leverageBias: clamp(s.attack * 0.4 + (100 - s.defense) * 0.4 + jitter(), 0, 100),
    adaptSpeed:   clamp(s.adaptability * 0.7 + s.speed * 0.2 + jitter(), 0, 100),
    contrarian:   clamp(character.tradingStyle === "contrarian" ? 80 : character.tradingStyle === "mean_reversion" ? 60 : 30 + jitter(), 0, 100),
    clutchFactor: clamp(s.precision * 0.4 + s.attack * 0.3 + (ps?.resilience ?? 50) * 0.2 + jitter(), 0, 100),
  };
}

/** Random DNA for NPC/opponent bots */
export function randomDNA(rng: () => number): BotDNA {
  const r = () => 20 + rng() * 60; // 20-80 range
  return {
    aggression: r(),
    conviction: r(),
    fearIndex: r(),
    greedIndex: r(),
    leverageBias: r(),
    adaptSpeed: r(),
    contrarian: r(),
    clutchFactor: r(),
  };
}

function jitter(): number {
  return (Math.random() - 0.5) * 15;
}

// ── Leverage Selection ──
// DNA.leverageBias maps to a leverage multiplier
// Higher bias = higher leverage tendency, but also affected by market regime

function selectLeverage(dna: BotDNA, regime: MarketRegime, stage: number): number {
  // Base leverage from DNA bias (exponential curve: 0→1x, 50→25x, 100→1000x)
  const biasNorm = dna.leverageBias / 100;
  let baseLev = Math.pow(1000, biasNorm); // 1 to 1000

  // Regime adjustment
  const regimeMod: Record<MarketRegime, number> = {
    calm: 0.8,
    ranging: 0.9,
    trending: 1.2,
    volatile: 1.5,
  };
  baseLev *= regimeMod[regime];

  // Aggression amplifier
  baseLev *= 0.7 + (dna.aggression / 100) * 0.6;

  // Stage amplifier: higher stages push bots to gamble more
  const stageBoost = 1 + (stage - 1) * 0.08;
  baseLev *= stageBoost;

  // Clutch factor: at high stages, clutch bots get more controlled leverage
  if (stage >= 5) {
    const clutchMod = 0.8 + (dna.clutchFactor / 100) * 0.4;
    baseLev *= clutchMod;
  }

  // Fear dampening: scared bots reduce leverage
  const fearDamp = 1 - (dna.fearIndex / 100) * 0.4;
  baseLev *= fearDamp;

  // Snap to nearest tier
  return snapToLeverageTier(Math.max(1, Math.min(1000, baseLev)));
}

function snapToLeverageTier(raw: number): number {
  let closest = LEVERAGE_TIERS[0];
  for (const tier of LEVERAGE_TIERS) {
    if (Math.abs(tier.multiplier - raw) < Math.abs(closest.multiplier - raw)) {
      closest = tier;
    }
  }
  return closest.multiplier;
}

export function getLeverageTier(multiplier: number): LeverageTier {
  return LEVERAGE_TIERS.find(t => t.multiplier === multiplier) ?? LEVERAGE_TIERS[0];
}

// ── Position Sizing ──
// How much of their balance a bot risks per trade

function calculatePositionSize(dna: BotDNA, balance: number, leverage: number): number {
  // Aggression determines margin fraction (10%-80% of balance)
  const marginFraction = 0.1 + (dna.aggression / 100) * 0.7;
  const margin = balance * marginFraction;

  // Position = margin * leverage (in notional BTC value)
  // Normalize to BTC units (assume price ~4.5M JPY)
  const notional = margin * leverage;
  const btcSize = notional / 4500000;

  return Math.max(0.0001, btcSize);
}

// ── Liquidation Price Calculation ──

function calculateLiquidationPrice(
  direction: TradeDirection,
  entryPrice: number,
  leverage: number
): number {
  if (direction === "flat") return 0;
  const tier = getLeverageTier(leverage);
  const distance = entryPrice * tier.liquidationDistance;

  return direction === "long"
    ? entryPrice - distance
    : entryPrice + distance;
}

// ── Stop Loss / Take Profit from DNA ──

function calculateStopLoss(
  dna: BotDNA,
  direction: TradeDirection,
  entryPrice: number,
  leverage: number,
  atr: number
): number {
  // Fear index determines stop tightness
  // High fear = tight stop (0.3x ATR), Low fear = wide stop (2x ATR)
  const fearMult = 0.3 + (1 - dna.fearIndex / 100) * 1.7;
  const stopDistance = atr * fearMult / Math.sqrt(leverage); // tighter at high leverage

  return direction === "long"
    ? entryPrice - stopDistance
    : entryPrice + stopDistance;
}

function calculateTakeProfit(
  dna: BotDNA,
  direction: TradeDirection,
  entryPrice: number,
  leverage: number,
  atr: number
): number {
  // Greed index determines TP width
  // High greed = wide TP (3x ATR), Low greed = tight TP (0.5x ATR)
  const greedMult = 0.5 + (dna.greedIndex / 100) * 2.5;
  const tpDistance = atr * greedMult / Math.sqrt(leverage);

  return direction === "long"
    ? entryPrice + tpDistance
    : entryPrice - tpDistance;
}

// ── Core Trading Engine ──

/** Create a fresh trading session between two bots */
export function createTradingSession(
  leftChar: Character,
  rightChar: Character,
  leftPlayerBot?: PlayerBot,
  rightPlayerBot?: PlayerBot,
  sessionTicks = 20
): { session: TradingSession; market: MarketSimulator } {
  const market = new MarketSimulator(Date.now() % 100000);
  for (let i = 0; i < 20; i++) market.step(); // warm up candles

  const startBalance = 1000000; // 1M JPY margin each

  const session: TradingSession = {
    tick: 0,
    maxTicks: sessionTicks,
    leftTrader: createTraderState("left", leftChar, startBalance, leftPlayerBot),
    rightTrader: createTraderState("right", rightChar, startBalance, rightPlayerBot),
    candles: [...market.candles],
    currentPrice: market.getPrice(),
    volatility: market.getVolatility(),
    regime: market.getRegime(),
    stage: market.getStage(),
    isActive: true,
    winner: null,
    events: [],
  };

  return { session, market };
}

function createTraderState(
  id: string,
  character: Character,
  startBalance: number,
  playerBot?: PlayerBot
): TradingBotState {
  return {
    botId: id,
    dna: generateDNA(character, playerBot?.stats),
    balance: startBalance,
    startBalance,
    position: null,
    isLiquidated: false,
    liquidationTick: null,
    trades: [],
    roi: 0,
    maxRoi: 0,
    maxDrawdownPct: 0,
    totalFeesPaid: 0,
  };
}

/** Advance the trading session by one tick */
export function stepTradingSession(
  session: TradingSession,
  market: MarketSimulator,
  leftChar: Character,
  rightChar: Character
): TradingSession {
  if (!session.isActive) return session;

  const candle = market.step();
  const s: TradingSession = {
    ...session,
    tick: session.tick + 1,
    candles: [...market.candles],
    currentPrice: market.getPrice(),
    volatility: market.getVolatility(),
    regime: market.getRegime(),
    stage: market.getStage(),
    events: [...session.events],
    leftTrader: { ...session.leftTrader },
    rightTrader: { ...session.rightTrader },
  };

  // Get ATR for stop/TP calculations
  const atr = market.getATR();

  // ── Update existing positions (PnL, funding, liquidation) ──
  s.leftTrader = updatePosition(s.leftTrader, candle, s.tick, s.events);
  s.rightTrader = updatePosition(s.rightTrader, candle, s.tick, s.events);

  // ── Bot decision making ──
  if (!s.leftTrader.isLiquidated) {
    s.leftTrader = botDecision(s.leftTrader, leftChar, s.candles, s.regime, s.stage, atr, s.tick, s.events, "left");
  }
  if (!s.rightTrader.isLiquidated) {
    s.rightTrader = botDecision(s.rightTrader, rightChar, s.candles, s.regime, s.stage, atr, s.tick, s.events, "right");
  }

  // ── Update ROI ──
  s.leftTrader = updateROI(s.leftTrader);
  s.rightTrader = updateROI(s.rightTrader);

  // ── End conditions ──
  const bothLiquidated = s.leftTrader.isLiquidated && s.rightTrader.isLiquidated;
  const timeUp = s.tick >= s.maxTicks;

  if (bothLiquidated || timeUp) {
    s.isActive = false;

    if (s.leftTrader.isLiquidated && !s.rightTrader.isLiquidated) {
      s.winner = "right";
    } else if (s.rightTrader.isLiquidated && !s.leftTrader.isLiquidated) {
      s.winner = "left";
    } else {
      // Both alive or both dead — compare ROI
      s.winner = s.leftTrader.roi >= s.rightTrader.roi ? "left" : "right";
    }

    // Force close remaining positions for final accounting
    if (s.leftTrader.position) {
      s.leftTrader = closePosition(s.leftTrader, s.currentPrice, s.tick, "session_end", s.events, "left");
    }
    if (s.rightTrader.position) {
      s.rightTrader = closePosition(s.rightTrader, s.currentPrice, s.tick, "session_end", s.events, "right");
    }
  }

  return s;
}

// ── Position Update: PnL, Funding, Liquidation Check ──

function updatePosition(
  trader: TradingBotState,
  candle: Candlestick,
  tick: number,
  events: TradingEvent[]
): TradingBotState {
  if (!trader.position || trader.isLiquidated) return trader;

  const pos = trader.position;
  const updated = { ...trader, position: { ...pos } };
  const price = candle.close;

  // Calculate unrealized PnL
  const priceDelta = price - pos.entryPrice;
  const directionalPnl = pos.direction === "long" ? priceDelta : -priceDelta;
  const unrealizedPnl = directionalPnl * pos.size * pos.leverage;

  updated.position!.unrealizedPnl = unrealizedPnl;
  updated.position!.maxUnrealizedPnl = Math.max(pos.maxUnrealizedPnl, unrealizedPnl);
  updated.position!.ticksHeld++;

  // ── Funding Fee ──
  const tier = getLeverageTier(pos.leverage);
  const fundingFee = pos.margin * tier.feeRate;
  updated.position!.fundingPaid += fundingFee;
  updated.balance -= fundingFee;
  updated.totalFeesPaid += fundingFee;

  if (fundingFee > 0 && pos.leverage >= 100) {
    events.push({
      tick,
      actor: trader.botId as "left" | "right",
      type: "funding",
      description: `Funding fee: -${fundingFee.toFixed(0)} JPY (${pos.leverage}x)`,
      magnitude: fundingFee / trader.startBalance,
    });
  }

  // ── Liquidation Check ──
  // Check if price hit liquidation level at any point during the candle
  const hitLiquidation = pos.direction === "long"
    ? candle.low <= pos.liquidationPrice
    : candle.high >= pos.liquidationPrice;

  if (hitLiquidation) {
    updated.isLiquidated = true;
    updated.liquidationTick = tick;
    const lossAmount = updated.position!.margin; // lose entire margin
    updated.balance -= lossAmount;
    updated.balance = Math.max(0, updated.balance);

    updated.trades.push({
      tick,
      action: "liquidated",
      price: pos.liquidationPrice,
      leverage: pos.leverage,
      size: pos.size,
      pnl: -lossAmount,
      roi: -lossAmount / trader.startBalance * 100,
      reason: `LIQUIDATED at ${pos.leverage}x — price hit ${pos.liquidationPrice.toFixed(0)}`,
    });

    events.push({
      tick,
      actor: trader.botId as "left" | "right",
      type: "liquidation",
      description: `LIQUIDATED! ${pos.leverage}x ${pos.direction} wiped out — lost ${lossAmount.toFixed(0)} JPY`,
      magnitude: 1.0,
    });

    updated.position = null;
    return updated;
  }

  return updated;
}

// ── Bot Decision Making ──

function botDecision(
  trader: TradingBotState,
  character: Character,
  candles: Candlestick[],
  regime: MarketRegime,
  stage: number,
  atr: number,
  tick: number,
  events: TradingEvent[],
  side: "left" | "right"
): TradingBotState {
  const dna = trader.dna;
  const signal = runStrategy(character.tradingStyle, candles);
  const currentPrice = candles[candles.length - 1].close;

  // ── If we have a position: manage it ──
  if (trader.position) {
    return managePosition(trader, signal.direction, signal.confidence, currentPrice, atr, tick, events, side, regime, stage);
  }

  // ── No position: decide whether to enter ──

  // Skip if signal is flat or confidence too low
  if (signal.direction === "flat") return trader;

  // Conviction check: bot needs minimum confidence to enter
  const entryThreshold = 0.3 + (1 - dna.aggression / 100) * 0.4; // 0.3-0.7
  if (signal.confidence < entryThreshold) return trader;

  // Contrarian override: contrarian bots may flip the direction
  let direction = signal.direction;
  if (dna.contrarian > 60 && Math.random() < (dna.contrarian - 60) / 80) {
    direction = direction === "long" ? "short" : "long";
  }

  // ── Calculate leverage and position ──
  const leverage = selectLeverage(dna, regime, stage);
  const size = calculatePositionSize(dna, trader.balance, leverage);
  const margin = (size * currentPrice) / leverage;

  // Can't open if not enough balance for margin
  if (margin > trader.balance * 0.95) return trader;

  const liquidationPrice = calculateLiquidationPrice(direction, currentPrice, leverage);
  const stopLoss = calculateStopLoss(dna, direction, currentPrice, leverage, atr);
  const takeProfit = calculateTakeProfit(dna, direction, currentPrice, leverage, atr);

  const position: LeveragedPosition = {
    direction,
    entryPrice: currentPrice,
    size,
    leverage,
    liquidationPrice,
    margin,
    unrealizedPnl: 0,
    maxUnrealizedPnl: 0,
    ticksHeld: 0,
    fundingPaid: 0,
  };

  const updated = { ...trader, position };

  updated.trades.push({
    tick,
    action: direction === "long" ? "open_long" : "open_short",
    price: currentPrice,
    leverage,
    size,
    pnl: 0,
    roi: 0,
    reason: `${signal.reason} — ${leverage}x ${direction}`,
  });

  events.push({
    tick,
    actor: side,
    type: "open",
    description: `Opens ${leverage}x ${direction.toUpperCase()} (${signal.reason})`,
    magnitude: Math.min(1, leverage / 200),
  });

  if (leverage >= 100) {
    events.push({
      tick,
      actor: side,
      type: "leverage_up",
      description: `HIGH LEVERAGE: ${leverage}x — liq price: ${liquidationPrice.toFixed(0)}`,
      magnitude: Math.min(1, leverage / 500),
    });
  }

  return updated;
}

// ── Position Management ──

function managePosition(
  trader: TradingBotState,
  signalDirection: TradeDirection,
  signalConfidence: number,
  currentPrice: number,
  atr: number,
  tick: number,
  events: TradingEvent[],
  side: "left" | "right",
  regime: MarketRegime,
  stage: number
): TradingBotState {
  const pos = trader.position!;
  const dna = trader.dna;

  // ── Stop Loss Check (DNA-based) ──
  const stopLoss = calculateStopLoss(dna, pos.direction, pos.entryPrice, pos.leverage, atr);
  const hitSL = pos.direction === "long" ? currentPrice <= stopLoss : currentPrice >= stopLoss;

  if (hitSL) {
    return closePosition(trader, currentPrice, tick, "stop_loss", events, side);
  }

  // ── Take Profit Check (DNA-based) ──
  const takeProfit = calculateTakeProfit(dna, pos.direction, pos.entryPrice, pos.leverage, atr);
  const hitTP = pos.direction === "long" ? currentPrice >= takeProfit : currentPrice <= takeProfit;

  if (hitTP) {
    return closePosition(trader, currentPrice, tick, "take_profit", events, side);
  }

  // ── Conviction Check: paper hands vs diamond hands ──
  // Low conviction + held too long = exit
  const maxHold = 2 + Math.floor((dna.conviction / 100) * 15); // 2-17 ticks
  if (pos.ticksHeld >= maxHold) {
    return closePosition(trader, currentPrice, tick, "conviction_timeout", events, side);
  }

  // ── Trailing Stop: if unrealized PnL drops significantly from peak ──
  if (pos.maxUnrealizedPnl > 0 && pos.unrealizedPnl < pos.maxUnrealizedPnl * 0.3) {
    const trailChance = (1 - dna.greedIndex / 100) * 0.6; // low greed = more likely to trail out
    if (Math.random() < trailChance) {
      return closePosition(trader, currentPrice, tick, "trailing_stop", events, side);
    }
  }

  // ── Signal Flip: if strategy now says opposite direction ──
  if (signalDirection !== "flat" && signalDirection !== pos.direction && signalConfidence > 0.5) {
    const flipChance = (dna.adaptSpeed / 100) * 0.6;
    if (Math.random() < flipChance) {
      // Close current, open opposite
      let updated = closePosition(trader, currentPrice, tick, "signal_flip", events, side);
      // Re-enter in opposite direction on next tick
      return updated;
    }
  }

  return trader;
}

// ── Close Position ──

function closePosition(
  trader: TradingBotState,
  exitPrice: number,
  tick: number,
  reason: string,
  events: TradingEvent[],
  side: "left" | "right"
): TradingBotState {
  if (!trader.position) return trader;

  const pos = trader.position;
  const priceDelta = exitPrice - pos.entryPrice;
  const directionalPnl = pos.direction === "long" ? priceDelta : -priceDelta;
  const realizedPnl = directionalPnl * pos.size * pos.leverage - pos.fundingPaid;

  const updated = { ...trader };
  updated.balance += realizedPnl;
  updated.balance = Math.max(0, updated.balance);
  updated.position = null;

  const tradeRoi = (realizedPnl / trader.startBalance) * 100;

  const actionMap: Record<string, TradeLog["action"]> = {
    stop_loss: "stop_loss",
    take_profit: "take_profit",
    signal_flip: "flip",
    trailing_stop: "close",
    conviction_timeout: "close",
    session_end: "close",
  };

  updated.trades.push({
    tick,
    action: actionMap[reason] ?? "close",
    price: exitPrice,
    leverage: pos.leverage,
    size: pos.size,
    pnl: realizedPnl,
    roi: tradeRoi,
    reason: `${reason} — PnL: ${realizedPnl >= 0 ? "+" : ""}${realizedPnl.toFixed(0)} JPY (${tradeRoi >= 0 ? "+" : ""}${tradeRoi.toFixed(1)}% ROI)`,
  });

  const eventType = reason === "stop_loss" ? "stop_loss"
    : reason === "take_profit" ? "take_profit"
    : reason === "signal_flip" ? "flip"
    : "close";

  events.push({
    tick,
    actor: side,
    type: eventType as TradingEvent["type"],
    description: `${reason.toUpperCase()}: ${pos.leverage}x ${pos.direction} — ${realizedPnl >= 0 ? "+" : ""}${realizedPnl.toFixed(0)} JPY`,
    magnitude: Math.min(1, Math.abs(realizedPnl) / trader.startBalance),
  });

  return updated;
}

// ── ROI Tracking ──

function updateROI(trader: TradingBotState): TradingBotState {
  const effectiveBalance = trader.balance + (trader.position?.unrealizedPnl ?? 0);
  const roi = ((effectiveBalance - trader.startBalance) / trader.startBalance) * 100;
  const maxRoi = Math.max(trader.maxRoi, roi);
  const drawdown = maxRoi - roi;
  const maxDrawdownPct = Math.max(trader.maxDrawdownPct, drawdown);

  return { ...trader, roi, maxRoi, maxDrawdownPct };
}

// ── Session Summary ──

export function getTradingSessionSummary(session: TradingSession): TradingSessionSummary | null {
  if (session.isActive || !session.winner) return null;

  const winner = session.winner === "left" ? session.leftTrader : session.rightTrader;
  const loser = session.winner === "left" ? session.rightTrader : session.leftTrader;

  const allTrades = [...session.leftTrader.trades, ...session.rightTrader.trades];
  const maxLeverage = allTrades.reduce((max, t) => Math.max(max, t.leverage), 1);

  return {
    winner,
    loser,
    winnerRoi: winner.roi,
    loserRoi: loser.roi,
    liquidationOccurred: session.leftTrader.isLiquidated || session.rightTrader.isLiquidated,
    maxLeverage,
    totalTrades: allTrades.length,
    maxStage: session.stage,
    events: session.events,
  };
}

// ── Utility ──
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
