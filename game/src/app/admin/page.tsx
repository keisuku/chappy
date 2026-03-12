"use client";

import { useState } from "react";
import Link from "next/link";
import { useGame } from "@/lib/game-context";
import { CHARACTERS } from "@/lib/characters";
import type { PlayerBot } from "@/types";

function StatInput({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-10 opacity-50">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-current"
        style={{ accentColor: color }}
      />
      <span className="text-xs w-8 text-right font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

export default function AdminPage() {
  const { state, dispatch } = useGame();
  const [editBot, setEditBot] = useState<PlayerBot | null>(null);
  const [editStats, setEditStats] = useState<PlayerBot["stats"]>({ aggression: 50, precision: 50, resilience: 50, speed: 50 });

  const openEdit = (bot: PlayerBot) => {
    setEditBot(bot);
    setEditStats({ ...bot.stats });
  };

  const saveEdit = () => {
    if (!editBot) return;
    const changes: Partial<PlayerBot["stats"]> = {};
    for (const key of ["aggression", "precision", "resilience", "speed"] as const) {
      changes[key] = editStats[key] - editBot.stats[key];
    }
    dispatch({ type: "EVOLVE_BOT", botId: editBot.id, statChanges: changes, mutationName: "Admin Override" });
    setEditBot(null);
  };

  return (
    <main className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-xs opacity-30 hover:opacity-60 transition-opacity">&larr; Back to Lobby</Link>
          <h1 className="text-3xl font-black mt-1 opacity-70">Admin Panel</h1>
          <p className="text-xs opacity-30 mt-1">Manage bots, game state, and data</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <button
          onClick={() => dispatch({ type: "ADD_GOLD", amount: 1000 })}
          className="p-3 rounded-lg text-sm font-semibold text-left transition-all hover:scale-105"
          style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", color: "#ffd700" }}
        >
          +1000 Gold
        </button>
        <button
          onClick={() => {
            if (state.selectedBotId) dispatch({ type: "ADD_EXP", botId: state.selectedBotId, exp: 100 });
          }}
          className="p-3 rounded-lg text-sm font-semibold text-left transition-all hover:scale-105"
          style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}
        >
          +100 EXP (selected)
        </button>
        <button
          onClick={() => {
            for (const char of CHARACTERS) {
              dispatch({ type: "CREATE_BOT", character: char, name: `${char.name}-${String(Date.now()).slice(-3)}` });
            }
          }}
          className="p-3 rounded-lg text-sm font-semibold text-left transition-all hover:scale-105"
          style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88" }}
        >
          Spawn All Bots
        </button>
        <button
          onClick={() => {
            if (confirm("Reset all game data?")) dispatch({ type: "RESET" });
          }}
          className="p-3 rounded-lg text-sm font-semibold text-left transition-all hover:scale-105"
          style={{ background: "rgba(255,45,85,0.08)", border: "1px solid rgba(255,45,85,0.2)", color: "#ff2d55" }}
        >
          Reset Game
        </button>
      </div>

      {/* Game state overview */}
      <div
        className="p-5 rounded-xl mb-8"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <h2 className="text-sm font-bold uppercase opacity-40 mb-3">Game State</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs opacity-40">Total Bots</div>
            <div className="text-2xl font-bold">{state.playerBots.length}</div>
          </div>
          <div>
            <div className="text-xs opacity-40">Gold</div>
            <div className="text-2xl font-bold" style={{ color: "#ffd700" }}>{state.gold.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs opacity-40">Battles Played</div>
            <div className="text-2xl font-bold" style={{ color: "#00d4ff" }}>{state.battleHistory.length}</div>
          </div>
          <div>
            <div className="text-xs opacity-40">Win Rate</div>
            <div className="text-2xl font-bold" style={{ color: "#00ff88" }}>
              {state.battleHistory.length > 0
                ? ((state.battleHistory.filter((b) => b.playerWon).length / state.battleHistory.length) * 100).toFixed(0)
                : "—"}%
            </div>
          </div>
        </div>
      </div>

      {/* Bot management table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="p-4 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)" }}>
          <h2 className="text-sm font-bold uppercase opacity-40">All Bots</h2>
        </div>
        <div className="divide-y divide-white/5">
          {state.playerBots.map((bot) => (
            <div key={bot.id} className="px-4 py-3 flex items-center gap-4 hover:bg-white/[0.02]">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: bot.character.primaryColor }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: bot.character.primaryColor }}>
                  {bot.name}
                </div>
                <div className="text-xs opacity-30">
                  {bot.character.nameJa} &middot; {bot.character.tradingStyle.replace("_", " ")}
                </div>
              </div>
              <div className="text-xs text-center w-12">
                <div className="opacity-30">Rank</div>
                <div className="font-bold">{bot.rank}</div>
              </div>
              <div className="text-xs text-center w-12">
                <div className="opacity-30">Lv</div>
                <div className="font-bold">{bot.level}</div>
              </div>
              <div className="text-xs text-center w-16">
                <div className="opacity-30">W/L</div>
                <div className="font-bold">{bot.wins}/{bot.losses}</div>
              </div>
              <div className="text-xs text-center w-20">
                <div className="opacity-30">PnL</div>
                <div className="font-bold" style={{ color: bot.totalPnl >= 0 ? "#00ff88" : "#ff2d55" }}>
                  {bot.totalPnl >= 0 ? "+" : ""}{bot.totalPnl.toFixed(0)}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(bot)}
                  className="px-3 py-1 rounded text-xs font-semibold"
                  style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${bot.name}?`)) dispatch({ type: "DELETE_BOT", botId: bot.id });
                  }}
                  className="px-3 py-1 rounded text-xs font-semibold"
                  style={{ background: "rgba(255,45,85,0.1)", color: "#ff2d55" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Battle history */}
      {state.battleHistory.length > 0 && (
        <div className="mt-8 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
            <h2 className="text-sm font-bold uppercase opacity-40">Battle History</h2>
          </div>
          <div className="divide-y divide-white/5">
            {state.battleHistory.slice(0, 20).map((rec) => (
              <div key={rec.id} className="px-4 py-3 flex items-center gap-4 text-xs">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: rec.playerWon ? "#00ff88" : "#ff2d55" }}
                />
                <div className="flex-1">
                  <span style={{ color: rec.playerBot.character.primaryColor }}>{rec.playerBot.name}</span>
                  <span className="opacity-30"> vs </span>
                  <span style={{ color: rec.opponentBot.character.primaryColor }}>{rec.opponentBot.name}</span>
                </div>
                <div style={{ color: rec.playerWon ? "#00ff88" : "#ff2d55" }}>
                  {rec.playerWon ? "WIN" : "LOSS"}
                </div>
                <div className="w-16 text-right opacity-40">
                  {rec.playerPnl >= 0 ? "+" : ""}{rec.playerPnl.toFixed(0)}
                </div>
                <div className="w-12 text-right opacity-30">S{rec.maxStage}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editBot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl"
            style={{ background: "linear-gradient(135deg, #0a1628, #050d1a)", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: "#00d4ff" }}>
              Edit {editBot.name}
            </h2>
            <div className="space-y-3 mb-6">
              <StatInput label="AGG" value={editStats.aggression} onChange={(v) => setEditStats({ ...editStats, aggression: v })} color="#ff2d55" />
              <StatInput label="PRE" value={editStats.precision} onChange={(v) => setEditStats({ ...editStats, precision: v })} color="#00d4ff" />
              <StatInput label="RES" value={editStats.resilience} onChange={(v) => setEditStats({ ...editStats, resilience: v })} color="#00ff88" />
              <StatInput label="SPD" value={editStats.speed} onChange={(v) => setEditStats({ ...editStats, speed: v })} color="#ffd700" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditBot(null)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.05)", color: "#d0eaff" }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 py-2 rounded-lg text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #00d4ff, #0090cc)", color: "#011" }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
