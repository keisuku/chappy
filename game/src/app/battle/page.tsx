"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { BattleHUD } from "@/components/ui/BattleHUD";
import { useGame } from "@/lib/game-context";
import { CHARACTERS } from "@/lib/characters";
import { createBattle, stepBattle, STAGES } from "@/lib/battle";
import { MarketSimulator } from "@/lib/market";
import { createPlayerBot } from "@/lib/game-context";
import type { BattleState, PlayerBot } from "@/types";

const BattleArena = dynamic(
  () => import("@/components/three/BattleArena").then((m) => m.BattleArena),
  { ssr: false }
);

export default function BattlePage() {
  const router = useRouter();
  const { state, selectedBot, dispatch } = useGame();
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [opponent, setOpponent] = useState<PlayerBot | null>(null);
  const [phase, setPhase] = useState<"select" | "battle" | "done">("select");
  const marketRef = useRef<MarketSimulator | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxStageRef = useRef(1);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startBattle = useCallback(
    (opp: PlayerBot) => {
      if (!selectedBot) return;
      if (intervalRef.current) clearInterval(intervalRef.current);

      setOpponent(opp);
      maxStageRef.current = 1;

      const { state: bs, market } = createBattle(selectedBot.character, opp.character);
      marketRef.current = market;
      setBattleState(bs);
      setPhase("battle");

      intervalRef.current = setInterval(() => {
        setBattleState((prev) => {
          if (!prev || !prev.isActive) return prev;
          const next = stepBattle(prev, market);
          if (next.stage > maxStageRef.current) maxStageRef.current = next.stage;

          if (!next.isActive && next.winner) {
            setPhase("done");
            // Record battle result
            const playerWon = next.winner === "left";
            const expGained = playerWon ? 30 + maxStageRef.current * 5 : 10 + maxStageRef.current * 2;
            const rewardGold = playerWon ? 50 + maxStageRef.current * 20 : 10;

            const record = {
              id: `${Date.now()}`,
              playerBotId: selectedBot!.id,
              opponentBotId: opp.id,
              playerBot: selectedBot!,
              opponentBot: opp,
              playerPnl: next.leftBot.pnl,
              opponentPnl: next.rightBot.pnl,
              playerWon,
              totalTicks: next.tick,
              maxStage: maxStageRef.current,
              timestamp: Date.now(),
              expGained,
              rewardGold,
            };

            dispatch({ type: "RECORD_BATTLE", record });
            dispatch({ type: "ADD_EXP", botId: selectedBot!.id, exp: expGained });
          }

          return next;
        });
      }, 1000);
    },
    [selectedBot, dispatch]
  );

  // Generate NPC opponents
  const opponents = CHARACTERS.filter((c) => c.id !== selectedBot?.character.id).map((c) => createPlayerBot(c));

  if (!selectedBot) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-lg opacity-50 mb-4">No bot selected</p>
        <button
          onClick={() => router.push("/bots")}
          className="px-6 py-2 rounded-lg font-bold text-sm"
          style={{ background: "linear-gradient(135deg, #00d4ff, #0090cc)", color: "#011" }}
        >
          Select a Bot
        </button>
      </main>
    );
  }

  // Opponent selection phase
  if (phase === "select") {
    return (
      <main className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <button onClick={() => router.push("/")} className="text-xs opacity-30 hover:opacity-60 transition-opacity">
            &larr; Back to Lobby
          </button>
          <h1 className="text-3xl font-black mt-1" style={{ color: "#00d4ff" }}>
            Choose Opponent
          </h1>
          <p className="text-xs opacity-40 mt-1">
            Fighting as <span style={{ color: selectedBot.character.primaryColor }}>{selectedBot.name}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opponents.map((opp) => (
            <button
              key={opp.id}
              onClick={() => startBattle(opp)}
              className="p-5 rounded-xl text-left transition-all hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${opp.character.secondaryColor}30, rgba(0,0,0,0.3))`,
                border: `1px solid ${opp.character.primaryColor}30`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-lg font-bold" style={{ color: opp.character.primaryColor }}>
                    {opp.character.nameJa}
                  </div>
                  <div className="text-xs opacity-40">{opp.character.name}</div>
                </div>
                <div
                  className="text-xs font-bold px-2 py-1 rounded"
                  style={{ background: `${opp.character.primaryColor}20`, color: opp.character.primaryColor }}
                >
                  {opp.character.tradingStyle.replace("_", " ")}
                </div>
              </div>
              <p className="text-xs opacity-30 italic">&ldquo;{opp.character.philosophy}&rdquo;</p>
            </button>
          ))}
        </div>
      </main>
    );
  }

  // Battle / Done phase
  if (!battleState) return null;
  const stageConfig = STAGES[battleState.stage - 1];

  return (
    <main className="relative w-full h-screen overflow-hidden">
      <BattleArena battleState={battleState} stageConfig={stageConfig} />
      <BattleHUD
        battleState={battleState}
        stageConfig={stageConfig}
        onEncounter={() => {
          if (phase === "done") {
            router.push(
              `/result?won=${battleState.winner === "left"}&pnl=${battleState.leftBot.pnl.toFixed(0)}&oppPnl=${battleState.rightBot.pnl.toFixed(0)}&stage=${maxStageRef.current}&ticks=${battleState.tick}`
            );
          }
        }}
      />
    </main>
  );
}
