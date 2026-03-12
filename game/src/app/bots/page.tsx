"use client";

import { useState } from "react";
import Link from "next/link";
import { useGame } from "@/lib/game-context";
import { CHARACTERS } from "@/lib/characters";
import type { Character, PlayerBot } from "@/types";

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-16 opacity-50">{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs w-8 text-right font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function BotCard({ bot, isSelected, onSelect }: { bot: PlayerBot; isSelected: boolean; onSelect: () => void }) {
  const winRate = bot.wins + bot.losses > 0 ? ((bot.wins / (bot.wins + bot.losses)) * 100).toFixed(0) : "—";

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-5 rounded-xl transition-all hover:scale-[1.02]"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${bot.character.secondaryColor}60, rgba(0,0,0,0.4))`
          : "rgba(255,255,255,0.02)",
        border: isSelected ? `2px solid ${bot.character.primaryColor}` : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-lg font-bold" style={{ color: bot.character.primaryColor }}>
            {bot.name}
          </div>
          <div className="text-xs opacity-40">
            {bot.character.nameJa} &middot; {bot.character.tradingStyle.replace("_", " ")}
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-sm font-black px-2 py-0.5 rounded"
            style={{
              background: `${bot.character.primaryColor}20`,
              color: bot.character.primaryColor,
            }}
          >
            {bot.rank}
          </div>
          <div className="text-xs opacity-40 mt-1">Lv.{bot.level}</div>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <StatBar label="AGG" value={bot.stats.aggression} color="#ff2d55" />
        <StatBar label="PRE" value={bot.stats.precision} color="#00d4ff" />
        <StatBar label="RES" value={bot.stats.resilience} color="#00ff88" />
        <StatBar label="SPD" value={bot.stats.speed} color="#ffd700" />
      </div>

      <div className="flex gap-4 text-xs opacity-50">
        <span>{bot.wins}W / {bot.losses}L</span>
        <span>WR: {winRate}%</span>
        <span>PnL: {bot.totalPnl >= 0 ? "+" : ""}{bot.totalPnl.toFixed(0)}</span>
      </div>

      {bot.mutations.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {bot.mutations.map((m, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 opacity-40">
              {m}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function CreateBotModal({ onClose, onCreate }: { onClose: () => void; onCreate: (char: Character, name: string) => void }) {
  const [selectedChar, setSelectedChar] = useState<Character>(CHARACTERS[0]);
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div
        className="w-full max-w-lg p-6 rounded-2xl"
        style={{ background: "linear-gradient(135deg, #0a1628, #050d1a)", border: "1px solid rgba(0,212,255,0.2)" }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: "#00d4ff" }}>
          Create New Bot
        </h2>

        <div className="mb-4">
          <label className="text-xs uppercase opacity-40 mb-2 block">Choose Base Character</label>
          <div className="grid grid-cols-3 gap-2">
            {CHARACTERS.map((char) => (
              <button
                key={char.id}
                onClick={() => {
                  setSelectedChar(char);
                  if (!name) setName(`${char.name}-${String(Date.now()).slice(-3)}`);
                }}
                className="p-3 rounded-lg text-left transition-all"
                style={{
                  background: selectedChar.id === char.id ? `${char.primaryColor}20` : "rgba(255,255,255,0.02)",
                  border: selectedChar.id === char.id ? `2px solid ${char.primaryColor}` : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="text-sm font-bold" style={{ color: char.primaryColor }}>{char.nameJa}</div>
                <div className="text-xs opacity-40">{char.name}</div>
                <div className="text-[10px] opacity-30 mt-1">{char.tradingStyle.replace("_", " ")}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs uppercase opacity-40 mb-2 block">Bot Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter bot name..."
            maxLength={20}
            className="w-full px-4 py-2 rounded-lg text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#d0eaff",
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.05)", color: "#d0eaff" }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const botName = name.trim() || `${selectedChar.name}-${String(Date.now()).slice(-3)}`;
              onCreate(selectedChar, botName);
              onClose();
            }}
            className="flex-1 py-2 rounded-lg text-sm font-bold"
            style={{
              background: "linear-gradient(135deg, #00d4ff, #0090cc)",
              color: "#011",
            }}
          >
            Create Bot
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BotsPage() {
  const { state, selectedBot, selectBot, createBot } = useGame();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <main className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-xs opacity-30 hover:opacity-60 transition-opacity">&larr; Back to Lobby</Link>
          <h1 className="text-3xl font-black mt-1" style={{ color: "#00ff88" }}>
            My Bots
          </h1>
          <p className="text-xs opacity-40 mt-1">{state.playerBots.length} bot{state.playerBots.length !== 1 ? "s" : ""} in roster</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #00ff88, #00cc66)",
            color: "#011",
          }}
        >
          + New Bot
        </button>
      </div>

      {/* Bot grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.playerBots.map((bot) => (
          <BotCard
            key={bot.id}
            bot={bot}
            isSelected={bot.id === state.selectedBotId}
            onSelect={() => selectBot(bot.id)}
          />
        ))}
      </div>

      {state.playerBots.length === 0 && (
        <div className="text-center py-20 opacity-30">
          <p className="text-lg">No bots yet</p>
          <p className="text-sm mt-1">Create your first trading bot to get started</p>
        </div>
      )}

      {/* Selected bot action */}
      {selectedBot && (
        <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center" style={{ background: "linear-gradient(0deg, rgba(5,13,26,0.95), transparent)" }}>
          <Link
            href="/battle"
            className="px-8 py-3 rounded-xl font-extrabold uppercase tracking-wide text-sm transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #00d4ff, #0090cc)",
              color: "#011",
              boxShadow: "0 4px 30px rgba(0,212,255,0.3)",
            }}
          >
            Battle with {selectedBot.name}
          </Link>
        </div>
      )}

      {showCreate && (
        <CreateBotModal
          onClose={() => setShowCreate(false)}
          onCreate={(char, name) => createBot(char, name)}
        />
      )}
    </main>
  );
}
