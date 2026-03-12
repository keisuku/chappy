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

    // Start ticking at 1s intervals
    intervalRef.current = setInterval(() => {
      setBattleState((prev) => {
        if (!prev || !prev.isActive) return prev;
        const next = stepBattle(prev, market);

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

  const handleEncounter = useCallback(() => {
    if (battleState && battleState.isActive) return;
    startNewBattle();
  }, [battleState, startNewBattle]);

  if (!battleState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-bold" style={{ color: "#00d4ff" }}>
          Loading CoinBattle Saki...
        </div>
      </div>
    );
  }

  const stageConfig = STAGES[battleState.stage - 1];

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
    </main>
  );
}
