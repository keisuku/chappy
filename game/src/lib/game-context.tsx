"use client";

import { createContext, useContext, useReducer, ReactNode, useCallback } from "react";
import type { GameState, PlayerBot, BattleRecord, Character, BotRank, Arena } from "@/types";
import { CHARACTERS } from "./characters";

// ---- helpers ----
let _id = 0;
function uid(): string {
  return `${Date.now()}-${++_id}`;
}

function baseStats(style: Character["tradingStyle"]): PlayerBot["stats"] {
  switch (style) {
    case "scalper":
      return { aggression: 60, precision: 55, resilience: 35, speed: 85 };
    case "momentum":
      return { aggression: 75, precision: 50, resilience: 60, speed: 40 };
    case "mean_reversion":
      return { aggression: 35, precision: 75, resilience: 70, speed: 45 };
    case "breakout":
      return { aggression: 80, precision: 45, resilience: 50, speed: 55 };
    case "market_maker":
      return { aggression: 30, precision: 65, resilience: 80, speed: 50 };
    case "news_hunter":
      return { aggression: 70, precision: 40, resilience: 45, speed: 75 };
    case "whale_tracker":
      return { aggression: 50, precision: 70, resilience: 60, speed: 35 };
    case "hybrid_ai":
      return { aggression: 55, precision: 60, resilience: 55, speed: 60 };
      return { aggression: 40, precision: 70, resilience: 65, speed: 45 };
    case "high_frequency":
      return { aggression: 60, precision: 55, resilience: 40, speed: 80 };
    case "event_driven":
      return { aggression: 50, precision: 75, resilience: 60, speed: 35 };
    case "arbitrage":
      return { aggression: 45, precision: 80, resilience: 55, speed: 65 };
    case "contrarian":
      return { aggression: 65, precision: 60, resilience: 70, speed: 45 };
    case "scalper":
      return { aggression: 55, precision: 65, resilience: 45, speed: 75 };
    case "volatility_breaker":
      return { aggression: 60, precision: 70, resilience: 50, speed: 50 };
  }
}

function expForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

function rankForLevel(level: number): BotRank {
  if (level >= 30) return "S";
  if (level >= 20) return "A";
  if (level >= 14) return "B";
  if (level >= 9) return "C";
  if (level >= 5) return "D";
  if (level >= 2) return "E";
  return "F";
}

export function createPlayerBot(character: Character, name?: string): PlayerBot {
  return {
    id: uid(),
    name: name ?? character.name,
    character,
    rank: "F",
    level: 1,
    exp: 0,
    expToNext: expForLevel(1),
    wins: 0,
    losses: 0,
    totalPnl: 0,
    stats: baseStats(character.tradingStyle),
    createdAt: Date.now(),
    mutations: [],
  };
}

// ---- actions ----
type Action =
  | { type: "CREATE_BOT"; character: Character; name?: string }
  | { type: "DELETE_BOT"; botId: string }
  | { type: "SELECT_BOT"; botId: string | null }
  | { type: "RECORD_BATTLE"; record: BattleRecord }
  | { type: "ADD_EXP"; botId: string; exp: number }
  | { type: "ADD_GOLD"; amount: number }
  | { type: "SPEND_GOLD"; amount: number }
  | { type: "EVOLVE_BOT"; botId: string; statChanges: Partial<PlayerBot["stats"]>; mutationName: string }
  | { type: "SET_BOT_IMAGE"; id: string; dataUrl: string }
  | { type: "ADD_ARENA"; arena: Arena }
  | { type: "UPDATE_ARENA"; arena: Arena }
  | { type: "DELETE_ARENA"; arenaId: string }
  | { type: "UPDATE_BOT"; bot: PlayerBot }
  | { type: "RESET" };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "CREATE_BOT": {
      const bot = createPlayerBot(action.character, action.name);
      return { ...state, playerBots: [...state.playerBots, bot] };
    }
    case "DELETE_BOT":
      return {
        ...state,
        playerBots: state.playerBots.filter((b) => b.id !== action.botId),
        selectedBotId: state.selectedBotId === action.botId ? null : state.selectedBotId,
      };
    case "SELECT_BOT":
      return { ...state, selectedBotId: action.botId };
    case "RECORD_BATTLE": {
      const rec = action.record;
      const bots = state.playerBots.map((b) => {
        if (b.id !== rec.playerBotId) return b;
        const updated = { ...b };
        if (rec.playerWon) updated.wins++;
        else updated.losses++;
        updated.totalPnl += rec.playerPnl;
        return updated;
      });
      return {
        ...state,
        playerBots: bots,
        battleHistory: [rec, ...state.battleHistory].slice(0, 50),
        gold: state.gold + rec.rewardGold,
      };
    }
    case "ADD_EXP": {
      const bots = state.playerBots.map((b) => {
        if (b.id !== action.botId) return b;
        let { exp, level, expToNext } = b;
        exp += action.exp;
        while (exp >= expToNext) {
          exp -= expToNext;
          level++;
          expToNext = expForLevel(level);
        }
        return { ...b, exp, level, expToNext, rank: rankForLevel(level) };
      });
      return { ...state, playerBots: bots };
    }
    case "ADD_GOLD":
      return { ...state, gold: state.gold + action.amount };
    case "SPEND_GOLD":
      return { ...state, gold: Math.max(0, state.gold - action.amount) };
    case "EVOLVE_BOT": {
      const bots = state.playerBots.map((b) => {
        if (b.id !== action.botId) return b;
        const stats = { ...b.stats };
        for (const [k, v] of Object.entries(action.statChanges)) {
          const key = k as keyof typeof stats;
          stats[key] = Math.max(0, Math.min(100, stats[key] + (v ?? 0)));
        }
        return { ...b, stats, mutations: [...b.mutations, action.mutationName] };
      });
      return { ...state, playerBots: bots };
    }
    case "SET_BOT_IMAGE":
      return { ...state, botImages: { ...state.botImages, [action.id]: action.dataUrl } };
    case "ADD_ARENA":
      return { ...state, arenas: [...state.arenas, action.arena] };
    case "UPDATE_ARENA":
      return { ...state, arenas: state.arenas.map((a) => (a.id === action.arena.id ? action.arena : a)) };
    case "DELETE_ARENA":
      return { ...state, arenas: state.arenas.filter((a) => a.id !== action.arenaId) };
    case "UPDATE_BOT":
      return { ...state, playerBots: state.playerBots.map((b) => (b.id === action.bot.id ? action.bot : b)) };
    case "RESET":
      return initialState();
    default:
      return state;
  }
}

const DEFAULT_ARENAS: Arena[] = [
  {
    id: "arena-tokyo",
    name: "Tokyo Exchange",
    nameJa: "東京取引所",
    description: "Standard volatility arena for beginners",
    volatilityMultiplier: 1.0,
    eventFrequency: 0.3,
    maxStages: 8,
    tickCount: 30,
    color: "#00d4ff",
    background: "tokyo",
    enabled: true,
  },
  {
    id: "arena-newyork",
    name: "Wall Street Pit",
    nameJa: "ウォール街",
    description: "High-volume arena with frequent market events",
    volatilityMultiplier: 1.5,
    eventFrequency: 0.6,
    maxStages: 8,
    tickCount: 30,
    color: "#ffd700",
    background: "newyork",
    enabled: true,
  },
  {
    id: "arena-void",
    name: "The Void",
    nameJa: "虚無",
    description: "Extreme volatility — only the strongest survive",
    volatilityMultiplier: 2.5,
    eventFrequency: 0.9,
    maxStages: 12,
    tickCount: 50,
    color: "#ff2d55",
    background: "void",
    enabled: false,
  },
];

function initialState(): GameState {
  // Start with one default bot
  const starterBot = createPlayerBot(CHARACTERS[0], "Saki-001");
  return {
    playerBots: [starterBot],
    selectedBotId: starterBot.id,
    gold: 500,
    battleHistory: [],
    currentBattle: null,
    currentBattleRecord: null,
    arenas: DEFAULT_ARENAS,
    botImages: {},
  };
}

// ---- context ----
interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  selectedBot: PlayerBot | null;
  createBot: (character: Character, name?: string) => void;
  deleteBot: (botId: string) => void;
  selectBot: (botId: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const selectedBot = state.playerBots.find((b) => b.id === state.selectedBotId) ?? null;

  const createBot = useCallback(
    (character: Character, name?: string) => dispatch({ type: "CREATE_BOT", character, name }),
    []
  );
  const deleteBot = useCallback(
    (botId: string) => dispatch({ type: "DELETE_BOT", botId }),
    []
  );
  const selectBot = useCallback(
    (botId: string) => dispatch({ type: "SELECT_BOT", botId }),
    []
  );

  return (
    <GameContext.Provider value={{ state, dispatch, selectedBot, createBot, deleteBot, selectBot }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
