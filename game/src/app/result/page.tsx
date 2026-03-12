"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/lib/game-context";
import { Suspense } from "react";

function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, selectedBot } = useGame();

  const won = params.get("won") === "true";
  const pnl = Number(params.get("pnl") ?? 0);
  const oppPnl = Number(params.get("oppPnl") ?? 0);
  const maxStage = Number(params.get("stage") ?? 1);
  const ticks = Number(params.get("ticks") ?? 30);

  const lastBattle = state.battleHistory[0];
  const expGained = lastBattle?.expGained ?? 0;
  const goldGained = lastBattle?.rewardGold ?? 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background pulse */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: won
            ? "radial-gradient(circle at 50% 40%, #00ff88, transparent 60%)"
            : "radial-gradient(circle at 50% 40%, #ff2d55, transparent 60%)",
        }}
      />

      <div className="relative z-10 text-center max-w-md w-full">
        {/* Result */}
        <div
          className="text-6xl font-black mb-2"
          style={{
            color: won ? "#00ff88" : "#ff2d55",
            textShadow: won ? "0 0 40px rgba(0,255,136,0.5)" : "0 0 40px rgba(255,45,85,0.5)",
          }}
        >
          {won ? "VICTORY" : "DEFEAT"}
        </div>
        <div className="text-sm opacity-40 mb-8">
          {won ? "利確 TAKE PROFIT" : "損切り STOP LOSS"}
        </div>

        {/* Stats card */}
        <div
          className="p-6 rounded-2xl mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(10,22,40,0.9), rgba(0,0,0,0.8))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {selectedBot && (
            <div className="mb-4 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-lg font-bold" style={{ color: selectedBot.character.primaryColor }}>
                {selectedBot.name}
              </div>
              <div className="text-xs opacity-40">
                Lv.{selectedBot.level} {selectedBot.rank}-Rank
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs opacity-40 uppercase">Your P&L</div>
              <div className="text-xl font-bold" style={{ color: pnl >= 0 ? "#00ff88" : "#ff2d55" }}>
                {pnl >= 0 ? "+" : ""}{pnl.toLocaleString()} JPY
              </div>
            </div>
            <div>
              <div className="text-xs opacity-40 uppercase">Opponent P&L</div>
              <div className="text-xl font-bold" style={{ color: oppPnl >= 0 ? "#00ff88" : "#ff2d55" }}>
                {oppPnl >= 0 ? "+" : ""}{oppPnl.toLocaleString()} JPY
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs opacity-40">Max Stage</div>
              <div className="text-lg font-bold" style={{ color: "#ffd700" }}>{maxStage}</div>
            </div>
            <div>
              <div className="text-xs opacity-40">Ticks</div>
              <div className="text-lg font-bold">{ticks}</div>
            </div>
            <div>
              <div className="text-xs opacity-40">Duration</div>
              <div className="text-lg font-bold">{ticks}s</div>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div
          className="p-4 rounded-xl mb-8 flex items-center justify-center gap-8"
          style={{
            background: "rgba(255,215,0,0.05)",
            border: "1px solid rgba(255,215,0,0.15)",
          }}
        >
          <div className="text-center">
            <div className="text-xs opacity-40">EXP Gained</div>
            <div className="text-lg font-bold" style={{ color: "#00d4ff" }}>+{expGained}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-xs opacity-40">Gold Earned</div>
            <div className="text-lg font-bold" style={{ color: "#ffd700" }}>+{goldGained}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => router.push("/battle")}
            className="w-64 py-3 rounded-xl font-extrabold uppercase tracking-wide text-sm transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #00d4ff, #0090cc)",
              color: "#011",
              boxShadow: "0 4px 30px rgba(0,212,255,0.3)",
            }}
          >
            Battle Again
          </button>
          <Link
            href="/evolution"
            className="w-64 py-3 rounded-xl text-center font-bold uppercase tracking-wide text-sm transition-all hover:scale-105"
            style={{
              background: "rgba(170,0,255,0.1)",
              border: "1px solid rgba(170,0,255,0.3)",
              color: "#aa00ff",
            }}
          >
            Evolve Bot
          </Link>
          <Link
            href="/"
            className="text-xs opacity-30 hover:opacity-60 transition-opacity mt-2"
          >
            Return to Lobby
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center opacity-50">Loading...</div>}>
      <ResultContent />
    </Suspense>
  );
}
