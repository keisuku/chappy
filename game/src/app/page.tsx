"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { BattleHUD } from "@/components/ui/BattleHUD";
import { CHARACTERS } from "@/lib/characters";
import { createBattle, stepBattle, getBattleSummary, STAGES } from "@/lib/battle";
import { MarketSimulator } from "@/lib/market";
import type { BattleState } from "@/types";

// Dynamic import for Three.js (no SSR)
const BattleArena = dynamic(
  () => import("@/components/three/BattleArena").then((m) => m.BattleArena),
  { ssr: false }
);

export default function HomePage() {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const marketRef = useRef<MarketSimulator | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setBattleState(state);

    // Start ticking at 1s intervals
    intervalRef.current = setInterval(() => {
      setBattleState((prev) => {
        if (!prev || !prev.isActive) return prev;
        const next = stepBattle(prev, market);

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
            }, null, 2));
          }
        }

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
      <BattleArena battleState={battleState} stageConfig={stageConfig} />
      <BattleHUD
        battleState={battleState}
        stageConfig={stageConfig}
        onEncounter={handleEncounter}
      />
    </main>
  );
}
