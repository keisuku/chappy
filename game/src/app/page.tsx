"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { BattleHUD } from "@/components/ui/BattleHUD";
import { CHARACTERS } from "@/lib/characters";
import { createBattle, stepBattle, STAGES } from "@/lib/battle";
import { processEvents } from "@/lib/events";
import { MarketSimulator } from "@/lib/market";
import type { BattleState, VisualBattleEvent } from "@/types";

// Dynamic import for Three.js (no SSR)
const BattleArena = dynamic(
  () => import("@/components/three/BattleArena").then((m) => m.BattleArena),
  { ssr: false }
);

export default function HomePage() {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [activeEvents, setActiveEvents] = useState<VisualBattleEvent[]>([]);
  const marketRef = useRef<MarketSimulator | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStateRef = useRef<BattleState | null>(null);

  // Initialize first battle
  useEffect(() => {
    startNewBattle();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNewBattle = useCallback(() => {
    // Stop previous
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Pick characters: random pairing from roster
    const left = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    let right = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    while (right.id === left.id) {
      right = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    }

    const { state, market } = createBattle(left, right);
    marketRef.current = market;
    prevStateRef.current = state;
    setBattleState(state);
    setActiveEvents([]);
import Link from "next/link";
import { useGame } from "@/lib/game-context";

export default function HomePage() {
  const { state, selectedBot } = useGame();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background grid effect */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orb */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle, #00d4ff, transparent 70%)" }}
      />

        // Log battle summary
        if (!next.isActive && next.winner) {
          const summary = getBattleSummary(next);
          if (summary) {
            console.log("[Cryptarena Battle Summary]", JSON.stringify({
              winner: summary.winner.name,
              loser: summary.loser.name,
              winnerPnl: summary.winnerPnl.toFixed(0),
              loserPnl: summary.loserPnl.toFixed(0),
              maxStage: summary.maxStage,
              totalTicks: summary.totalTicks,
              criticalMoments: summary.criticalMoments.length,
              marketEvents: summary.marketEvents.length,
              signals: summary.signalStats,
            }, null, 2));
        // Process visual events
        const events = processEvents(prev, next);
        if (events.length > 0) {
          setActiveEvents(events);
          // Log significant events
          const dominant = events[0];
          if (dominant.signal.strength !== "weak") {
            console.log("[Event]", dominant.signal.strength.toUpperCase(),
              dominant.signal.description,
              `| excitement: ${dominant.probability.excitement.toFixed(2)}`,
              `| visual: ${dominant.visual.type}`,
              `| camera: ${dominant.camera.type}`);
          }
        } else {
          setActiveEvents([]);
        }

        // Log metrics to console
        if (!next.isActive && next.winner) {
          const w = next.winner === "left" ? next.leftBot : next.rightBot;
          console.log("[CoinBattle Metrics]", JSON.stringify({
            winner: w.character.name,
            profit: w.pnl.toFixed(0),
            maxDrawdown: w.maxDrawdown.toFixed(0),
            trades: w.trades,
            duration: next.tick,
          }, null, 2));
        }

        prevStateRef.current = next;
        return next;
      });
    }, 1000);
  }, []);
      <div className="relative z-10 text-center max-w-2xl">
        {/* Title */}
        <h1
          className="text-7xl font-black tracking-tighter mb-2"
          style={{
            background: "linear-gradient(135deg, #00d4ff, #00ff88, #ffd700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          CRYPTARENA
        </h1>
        <p className="text-sm tracking-[0.3em] uppercase opacity-50 mb-12">
          AI Trading Battle Arena
        </p>

        {/* Player stats bar */}
        <div
          className="flex items-center justify-center gap-8 mb-10 px-6 py-3 rounded-xl mx-auto w-fit"
          style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}
        >
          <div className="text-center">
            <div className="text-xs opacity-40 uppercase">Bots</div>
            <div className="text-lg font-bold" style={{ color: "#00d4ff" }}>
              {state.playerBots.length}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-xs opacity-40 uppercase">Gold</div>
            <div className="text-lg font-bold" style={{ color: "#ffd700" }}>
              {state.gold.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-xs opacity-40 uppercase">Battles</div>
            <div className="text-lg font-bold" style={{ color: "#00ff88" }}>
              {state.battleHistory.length}
            </div>
          </div>
        </div>

        {/* Selected bot preview */}
        {selectedBot && (
          <div
            className="mb-10 px-6 py-4 rounded-xl mx-auto w-fit"
            style={{
              background: `linear-gradient(135deg, ${selectedBot.character.secondaryColor}40, rgba(0,0,0,0.3))`,
              border: `1px solid ${selectedBot.character.primaryColor}30`,
            }}
          >
            <div className="text-xs opacity-40 uppercase mb-1">Active Bot</div>
            <div className="text-xl font-bold" style={{ color: selectedBot.character.primaryColor }}>
              {selectedBot.name}
            </div>
            <div className="text-xs opacity-50 mt-1">
              Lv.{selectedBot.level} {selectedBot.rank}-Rank &middot; {selectedBot.character.tradingStyle.replace("_", " ")}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/battle"
            className="w-72 py-4 rounded-xl text-center font-extrabold text-lg uppercase tracking-wide transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #00d4ff, #0090cc)",
              color: "#011",
              boxShadow: "0 4px 30px rgba(0,212,255,0.3)",
            }}
          >
            Enter Battle
          </Link>
          <Link
            href="/bots"
            className="w-72 py-3 rounded-xl text-center font-bold uppercase tracking-wide transition-all hover:scale-105"
            style={{
              background: "rgba(0,255,136,0.1)",
              border: "1px solid rgba(0,255,136,0.3)",
              color: "#00ff88",
            }}
          >
            My Bots
          </Link>
          <Link
            href="/evolution"
            className="w-72 py-3 rounded-xl text-center font-bold uppercase tracking-wide transition-all hover:scale-105"
            style={{
              background: "rgba(170,0,255,0.1)",
              border: "1px solid rgba(170,0,255,0.3)",
              color: "#aa00ff",
            }}
          >
            Evolution Lab
          </Link>
          <Link
            href="/admin"
            className="w-72 py-2 rounded-xl text-center text-xs font-semibold uppercase tracking-wide transition-all hover:scale-105 opacity-40 hover:opacity-70"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#d0eaff",
            }}
          >
            Admin Panel
          </Link>
        </div>
      </div>

  return (
    <main className="relative w-full h-screen overflow-hidden">
      <BattleArena
        battleState={battleState}
        stageConfig={stageConfig}
        activeEvents={activeEvents}
      />
      <BattleHUD
        battleState={battleState}
        stageConfig={stageConfig}
        onEncounter={handleEncounter}
        activeEvents={activeEvents}
      />
      {/* Version */}
      <div className="absolute bottom-4 text-xs opacity-20">
        Cryptarena v0.1.0 — Prototype
      </div>
    </main>
  );
}
