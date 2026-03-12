"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useGame } from "@/lib/game-context";
import { rollEvolutionOptions, EVOLUTION_COST } from "@/lib/evolution";
import type { EvolutionOption } from "@/types";

const RARITY_BG: Record<EvolutionOption["rarity"], string> = {
  common: "rgba(136,153,170,0.08)",
  rare: "rgba(0,212,255,0.08)",
  epic: "rgba(170,0,255,0.08)",
  legendary: "rgba(255,215,0,0.08)",
};

const RARITY_BORDER: Record<EvolutionOption["rarity"], string> = {
  common: "rgba(136,153,170,0.2)",
  rare: "rgba(0,212,255,0.3)",
  epic: "rgba(170,0,255,0.3)",
  legendary: "rgba(255,215,0,0.4)",
};

export default function EvolutionPage() {
  const { state, selectedBot, dispatch } = useGame();
  const [options, setOptions] = useState<EvolutionOption[] | null>(null);
  const [applied, setApplied] = useState<EvolutionOption | null>(null);

  const canAfford = state.gold >= EVOLUTION_COST;

  const roll = useCallback(() => {
    if (!canAfford) return;
    dispatch({ type: "SPEND_GOLD", amount: EVOLUTION_COST });
    setOptions(rollEvolutionOptions(3));
    setApplied(null);
  }, [canAfford, dispatch]);

  const applyMutation = useCallback(
    (opt: EvolutionOption) => {
      if (!selectedBot) return;
      dispatch({
        type: "EVOLVE_BOT",
        botId: selectedBot.id,
        statChanges: opt.statChanges,
        mutationName: opt.name,
      });
      setApplied(opt);
      setOptions(null);
    },
    [selectedBot, dispatch]
  );

  return (
    <main className="min-h-screen px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-xs opacity-30 hover:opacity-60 transition-opacity">
          &larr; Back to Lobby
        </Link>
        <h1 className="text-3xl font-black mt-1" style={{ color: "#aa00ff" }}>
          Evolution Lab
        </h1>
        <p className="text-xs opacity-40 mt-1">Mutate your bot&apos;s trading DNA</p>
      </div>

      {!selectedBot ? (
        <div className="text-center py-20">
          <p className="opacity-50 mb-4">No bot selected</p>
          <Link
            href="/bots"
            className="px-6 py-2 rounded-lg font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #00d4ff, #0090cc)", color: "#011" }}
          >
            Select a Bot
          </Link>
        </div>
      ) : (
        <>
          {/* Current bot stats */}
          <div
            className="p-5 rounded-xl mb-6"
            style={{
              background: `linear-gradient(135deg, ${selectedBot.character.secondaryColor}40, rgba(0,0,0,0.3))`,
              border: `1px solid ${selectedBot.character.primaryColor}30`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-bold" style={{ color: selectedBot.character.primaryColor }}>
                  {selectedBot.name}
                </div>
                <div className="text-xs opacity-40">
                  Lv.{selectedBot.level} {selectedBot.rank}-Rank
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-40">Gold</div>
                <div className="text-lg font-bold" style={{ color: "#ffd700" }}>
                  {state.gold.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {(["aggression", "precision", "resilience", "speed"] as const).map((stat) => {
                const colors = { aggression: "#ff2d55", precision: "#00d4ff", resilience: "#00ff88", speed: "#ffd700" };
                const labels = { aggression: "AGG", precision: "PRE", resilience: "RES", speed: "SPD" };
                return (
                  <div key={stat} className="text-center">
                    <div className="text-xs opacity-40">{labels[stat]}</div>
                    <div className="text-xl font-bold" style={{ color: colors[stat] }}>
                      {selectedBot.stats[stat]}
                    </div>
                    <div
                      className="h-1.5 rounded-full mt-1 mx-auto"
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.05)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${selectedBot.stats[stat]}%`, background: colors[stat] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedBot.mutations.length > 0 && (
              <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-xs opacity-30 mb-1">Mutations</div>
                <div className="flex flex-wrap gap-1">
                  {selectedBot.mutations.map((m, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(170,0,255,0.15)", color: "#cc88ff" }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Roll button */}
          {!options && !applied && (
            <div className="text-center mb-6">
              <button
                onClick={roll}
                disabled={!canAfford}
                className="px-8 py-4 rounded-xl font-extrabold uppercase tracking-wide text-lg transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
                style={{
                  background: canAfford
                    ? "linear-gradient(135deg, #aa00ff, #6600cc)"
                    : "rgba(255,255,255,0.05)",
                  color: canAfford ? "#fff" : "#888",
                  boxShadow: canAfford ? "0 4px 30px rgba(170,0,255,0.3)" : "none",
                }}
              >
                Roll Mutation — {EVOLUTION_COST}G
              </button>
              {!canAfford && (
                <p className="text-xs opacity-30 mt-2">Not enough gold. Win more battles!</p>
              )}
            </div>
          )}

          {/* Evolution options */}
          {options && (
            <div>
              <h2 className="text-sm font-bold uppercase opacity-50 mb-4 text-center">Choose a Mutation</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => applyMutation(opt)}
                    className="p-5 rounded-xl text-left transition-all hover:scale-105"
                    style={{
                      background: RARITY_BG[opt.rarity],
                      border: `1px solid ${RARITY_BORDER[opt.rarity]}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{ background: `${opt.color}20`, color: opt.color }}
                      >
                        {opt.rarity}
                      </span>
                    </div>
                    <div className="text-sm font-bold mb-1" style={{ color: opt.color }}>
                      {opt.nameJa}
                    </div>
                    <div className="text-xs opacity-60 mb-2">{opt.name}</div>
                    <div className="text-xs opacity-40">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Applied feedback */}
          {applied && (
            <div className="text-center py-8">
              <div className="text-4xl font-black mb-2" style={{ color: applied.color }}>
                {applied.nameJa}
              </div>
              <div className="text-sm opacity-50 mb-1">{applied.name} applied!</div>
              <div className="text-xs opacity-30 mb-6">{applied.description}</div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setApplied(null)}
                  className="px-6 py-2 rounded-lg font-bold text-sm"
                  style={{ background: "rgba(170,0,255,0.15)", color: "#aa00ff" }}
                >
                  Roll Again
                </button>
                <Link
                  href="/battle"
                  className="px-6 py-2 rounded-lg font-bold text-sm"
                  style={{ background: "linear-gradient(135deg, #00d4ff, #0090cc)", color: "#011" }}
                >
                  Go Battle
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
