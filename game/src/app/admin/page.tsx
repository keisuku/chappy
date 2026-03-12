"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useGame } from "@/lib/game-context";
import { CHARACTERS } from "@/lib/characters";
import type { PlayerBot, Arena } from "@/types";

// ── Tabs ──
type Tab = "bots" | "arenas" | "upload";

// ── Reusable stat slider ──
function StatSlider({
  label,
  value,
  onChange,
  color,
  min = 0,
  max = 100,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-12 opacity-50 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
        style={{
          accentColor: color,
          background: `linear-gradient(to right, ${color}44 0%, ${color} ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.06) ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
      <span className="text-xs w-10 text-right font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

// ── Bot Image Uploader ──
function BotImageUploader({
  botId,
  currentImage,
  onUpload,
  color,
}: {
  botId: string;
  currentImage?: string;
  onUpload: (id: string, dataUrl: string) => void;
  color: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) onUpload(botId, result);
      };
      reader.readAsDataURL(f);
      e.target.value = "";
    },
    [botId, onUpload]
  );

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-12 h-12 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
        style={{
          background: currentImage ? "transparent" : `${color}22`,
          border: `1px solid ${color}44`,
        }}
      >
        {currentImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentImage} alt="Bot" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg opacity-30">?</span>
        )}
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
        style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}
      >
        {currentImage ? "Change" : "Upload"}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}

// ── Bot Edit Panel ──
function BotEditPanel({
  bot,
  onSave,
  onCancel,
  botImage,
  onImageUpload,
}: {
  bot: PlayerBot;
  onSave: (bot: PlayerBot) => void;
  onCancel: () => void;
  botImage?: string;
  onImageUpload: (id: string, dataUrl: string) => void;
}) {
  const [name, setName] = useState(bot.name);
  const [stats, setStats] = useState({ ...bot.stats });
  const color = bot.character.primaryColor;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full sm:max-w-md p-5 sm:p-6 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: "linear-gradient(135deg, #0a1628, #050d1a)",
          border: `1px solid ${color}33`,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color }}>
            Edit Bot
          </h2>
          <button onClick={onCancel} className="text-xs opacity-40 hover:opacity-80 p-2">
            Close
          </button>
        </div>

        {/* Image */}
        <div className="mb-5">
          <label className="block text-xs font-semibold opacity-40 mb-2 uppercase">Image</label>
          <BotImageUploader
            botId={bot.character.id}
            currentImage={botImage}
            onUpload={onImageUpload}
            color={color}
          />
        </div>

        {/* Name */}
        <div className="mb-5">
          <label className="block text-xs font-semibold opacity-40 mb-2 uppercase">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-lg text-sm font-bold"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${color}33`,
              color: "#d0eaff",
              outline: "none",
            }}
          />
        </div>

        {/* Stats */}
        <div className="mb-5">
          <label className="block text-xs font-semibold opacity-40 mb-3 uppercase">Stats</label>
          <div className="space-y-3">
            <StatSlider label="AGG" value={stats.aggression} onChange={(v) => setStats({ ...stats, aggression: v })} color="#ff2d55" />
            <StatSlider label="PRE" value={stats.precision} onChange={(v) => setStats({ ...stats, precision: v })} color="#00d4ff" />
            <StatSlider label="RES" value={stats.resilience} onChange={(v) => setStats({ ...stats, resilience: v })} color="#00ff88" />
            <StatSlider label="SPD" value={stats.speed} onChange={(v) => setStats({ ...stats, speed: v })} color="#ffd700" />
          </div>
        </div>

        {/* Info row */}
        <div className="grid grid-cols-3 gap-3 mb-5 text-center">
          <div className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-[10px] opacity-30 uppercase">Rank</div>
            <div className="text-sm font-bold">{bot.rank}</div>
          </div>
          <div className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-[10px] opacity-30 uppercase">Level</div>
            <div className="text-sm font-bold">{bot.level}</div>
          </div>
          <div className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-[10px] opacity-30 uppercase">W/L</div>
            <div className="text-sm font-bold">{bot.wins}/{bot.losses}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.05)", color: "#d0eaff" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...bot, name, stats })}
            className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, color: "#011" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Arena Edit Panel ──
function ArenaEditPanel({
  arena,
  onSave,
  onCancel,
  isNew,
}: {
  arena: Arena;
  onSave: (arena: Arena) => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const [form, setForm] = useState<Arena>({ ...arena });

  const update = <K extends keyof Arena>(key: K, val: Arena[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full sm:max-w-md p-5 sm:p-6 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: "linear-gradient(135deg, #0a1628, #050d1a)",
          border: `1px solid ${form.color}33`,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: form.color }}>
            {isNew ? "New Arena" : "Edit Arena"}
          </h2>
          <button onClick={onCancel} className="text-xs opacity-40 hover:opacity-80 p-2">
            Close
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold opacity-40 mb-1 uppercase">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full p-3 rounded-lg text-sm font-bold"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#d0eaff", outline: "none" }}
            />
          </div>

          {/* Japanese name */}
          <div>
            <label className="block text-xs font-semibold opacity-40 mb-1 uppercase">Name (JP)</label>
            <input
              type="text"
              value={form.nameJa}
              onChange={(e) => update("nameJa", e.target.value)}
              className="w-full p-3 rounded-lg text-sm"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#d0eaff", outline: "none" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold opacity-40 mb-1 uppercase">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={2}
              className="w-full p-3 rounded-lg text-sm resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#d0eaff", outline: "none" }}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold opacity-40 mb-1 uppercase">Theme Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
                className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                style={{ background: "transparent" }}
              />
              <span className="text-xs font-mono opacity-60">{form.color}</span>
            </div>
          </div>

          {/* Sliders */}
          <StatSlider
            label="Volatility"
            value={form.volatilityMultiplier}
            onChange={(v) => update("volatilityMultiplier", v)}
            color={form.color}
            min={0.1}
            max={5}
            step={0.1}
          />
          <StatSlider
            label="Events"
            value={form.eventFrequency}
            onChange={(v) => update("eventFrequency", v)}
            color={form.color}
            min={0}
            max={1}
            step={0.05}
          />
          <StatSlider
            label="Stages"
            value={form.maxStages}
            onChange={(v) => update("maxStages", v)}
            color={form.color}
            min={1}
            max={20}
            step={1}
          />
          <StatSlider
            label="Ticks"
            value={form.tickCount}
            onChange={(v) => update("tickCount", v)}
            color={form.color}
            min={10}
            max={100}
            step={5}
          />

          {/* Enabled toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-50 uppercase">Enabled</span>
            <button
              onClick={() => update("enabled", !form.enabled)}
              className="w-12 h-6 rounded-full relative transition-colors"
              style={{ background: form.enabled ? `${form.color}66` : "rgba(255,255,255,0.1)" }}
            >
              <div
                className="w-5 h-5 rounded-full absolute top-0.5 transition-all"
                style={{
                  background: form.enabled ? form.color : "rgba(255,255,255,0.3)",
                  left: form.enabled ? "calc(100% - 1.375rem)" : "0.125rem",
                }}
              />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.05)", color: "#d0eaff" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
            style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}88)`, color: "#011" }}
          >
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Image Upload Tab ──
function UploadTab({ onUpload, images }: { onUpload: (id: string, dataUrl: string) => void; images: Record<string, string> }) {
  const [selectedCharId, setSelectedCharId] = useState(CHARACTERS[0].id);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) onUpload(selectedCharId, result);
      };
      reader.readAsDataURL(f);
      e.target.value = "";
    },
    [selectedCharId, onUpload]
  );

  return (
    <div>
      {/* Upload form */}
      <div
        className="p-4 sm:p-5 rounded-xl mb-6"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <h3 className="text-sm font-bold uppercase opacity-40 mb-4">Upload Bot Image</h3>

        <div className="mb-4">
          <label className="block text-xs font-semibold opacity-40 mb-2">Select Character</label>
          <select
            value={selectedCharId}
            onChange={(e) => setSelectedCharId(e.target.value)}
            className="w-full p-3 rounded-lg text-sm text-white"
            style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {CHARACTERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.nameJa}) — {c.rank}-Rank
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-4 rounded-xl text-sm font-bold border-2 border-dashed transition-all active:scale-[0.98]"
          style={{ borderColor: "rgba(0,212,255,0.3)", color: "#00d4ff", background: "rgba(0,212,255,0.04)" }}
        >
          Tap to select image
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      {/* Image gallery */}
      <div
        className="p-4 sm:p-5 rounded-xl"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <h3 className="text-sm font-bold uppercase opacity-40 mb-4">
          Image Gallery ({Object.keys(images).length}/{CHARACTERS.length})
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {CHARACTERS.map((c) => {
            const img = images[c.id];
            return (
              <div key={c.id} className="text-center">
                <div
                  className="aspect-square rounded-xl overflow-hidden mb-1 flex items-center justify-center"
                  style={{
                    background: img ? "transparent" : `${c.primaryColor}11`,
                    border: `1px solid ${c.primaryColor}33`,
                  }}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl opacity-20">?</span>
                  )}
                </div>
                <div className="text-[10px] font-bold truncate" style={{ color: c.primaryColor }}>
                  {c.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Page ──
export default function AdminPage() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState<Tab>("bots");
  const [editBot, setEditBot] = useState<PlayerBot | null>(null);
  const [editArena, setEditArena] = useState<Arena | null>(null);
  const [isNewArena, setIsNewArena] = useState(false);

  const handleBotSave = (updated: PlayerBot) => {
    dispatch({ type: "UPDATE_BOT", bot: updated });
    setEditBot(null);
  };

  const handleImageUpload = useCallback(
    (id: string, dataUrl: string) => {
      dispatch({ type: "SET_BOT_IMAGE", id, dataUrl });
    },
    [dispatch]
  );

  const handleArenaSave = (arena: Arena) => {
    if (isNewArena) {
      dispatch({ type: "ADD_ARENA", arena });
    } else {
      dispatch({ type: "UPDATE_ARENA", arena });
    }
    setEditArena(null);
    setIsNewArena(false);
  };

  const openNewArena = () => {
    setIsNewArena(true);
    setEditArena({
      id: `arena-${Date.now()}`,
      name: "",
      nameJa: "",
      description: "",
      volatilityMultiplier: 1.0,
      eventFrequency: 0.3,
      maxStages: 8,
      tickCount: 30,
      color: "#00d4ff",
      background: "default",
      enabled: true,
    });
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "bots", label: "Bots", icon: "B" },
    { id: "arenas", label: "Arenas", icon: "A" },
    { id: "upload", label: "Upload", icon: "U" },
  ];

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 sm:px-6 pt-4 pb-3" style={{ background: "linear-gradient(to bottom, #050d1a 60%, transparent)" }}>
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-xs opacity-30 hover:opacity-60 transition-opacity">
            &larr; Back to Lobby
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black mt-1 opacity-70">Admin Panel</h1>

          {/* Tab bar */}
          <div className="flex gap-1 mt-3 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all"
                style={{
                  background: tab === t.id ? "rgba(0,212,255,0.15)" : "transparent",
                  color: tab === t.id ? "#00d4ff" : "rgba(208,234,255,0.4)",
                }}
              >
                <span className="sm:hidden">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden text-[10px] block">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 max-w-3xl mx-auto mt-2">
        {/* Quick actions — always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
          <button
            onClick={() => dispatch({ type: "ADD_GOLD", amount: 1000 })}
            className="p-3 rounded-xl text-xs sm:text-sm font-semibold text-left transition-all active:scale-95"
            style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", color: "#ffd700" }}
          >
            +1000 Gold
          </button>
          <button
            onClick={() => {
              if (state.selectedBotId) dispatch({ type: "ADD_EXP", botId: state.selectedBotId, exp: 100 });
            }}
            className="p-3 rounded-xl text-xs sm:text-sm font-semibold text-left transition-all active:scale-95"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}
          >
            +100 EXP
          </button>
          <button
            onClick={() => {
              for (const char of CHARACTERS) {
                dispatch({ type: "CREATE_BOT", character: char, name: `${char.name}-${String(Date.now()).slice(-3)}` });
              }
            }}
            className="p-3 rounded-xl text-xs sm:text-sm font-semibold text-left transition-all active:scale-95"
            style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88" }}
          >
            Spawn All
          </button>
          <button
            onClick={() => {
              if (confirm("Reset all game data?")) dispatch({ type: "RESET" });
            }}
            className="p-3 rounded-xl text-xs sm:text-sm font-semibold text-left transition-all active:scale-95"
            style={{ background: "rgba(255,45,85,0.08)", border: "1px solid rgba(255,45,85,0.2)", color: "#ff2d55" }}
          >
            Reset
          </button>
        </div>

        {/* Game state overview */}
        <div
          className="p-4 sm:p-5 rounded-xl mb-6"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-[10px] sm:text-xs opacity-30 uppercase">Bots</div>
              <div className="text-xl sm:text-2xl font-bold">{state.playerBots.length}</div>
            </div>
            <div>
              <div className="text-[10px] sm:text-xs opacity-30 uppercase">Gold</div>
              <div className="text-xl sm:text-2xl font-bold" style={{ color: "#ffd700" }}>
                {state.gold.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] sm:text-xs opacity-30 uppercase">Battles</div>
              <div className="text-xl sm:text-2xl font-bold" style={{ color: "#00d4ff" }}>
                {state.battleHistory.length}
              </div>
            </div>
            <div>
              <div className="text-[10px] sm:text-xs opacity-30 uppercase">Win Rate</div>
              <div className="text-xl sm:text-2xl font-bold" style={{ color: "#00ff88" }}>
                {state.battleHistory.length > 0
                  ? `${((state.battleHistory.filter((b) => b.playerWon).length / state.battleHistory.length) * 100).toFixed(0)}%`
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BOTS TAB ═══ */}
        {tab === "bots" && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-sm font-bold uppercase opacity-40">All Bots ({state.playerBots.length})</h2>
            </div>
            <div className="divide-y divide-white/5">
              {state.playerBots.map((bot) => (
                <div
                  key={bot.id}
                  className="px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Avatar / image */}
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
                    style={{
                      background: state.botImages[bot.character.id] ? "transparent" : `${bot.character.primaryColor}22`,
                      border: `1px solid ${bot.character.primaryColor}44`,
                    }}
                  >
                    {state.botImages[bot.character.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={state.botImages[bot.character.id]}
                        alt={bot.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: bot.character.primaryColor }}
                      />
                    )}
                  </div>

                  {/* Name + info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: bot.character.primaryColor }}>
                      {bot.name}
                    </div>
                    <div className="text-[10px] sm:text-xs opacity-30 truncate">
                      {bot.character.nameJa} &middot; {bot.character.tradingStyle.replace("_", " ")}
                    </div>
                  </div>

                  {/* Compact stats — hidden on tiny screens */}
                  <div className="hidden sm:flex gap-3">
                    <div className="text-xs text-center w-10">
                      <div className="opacity-30">Rank</div>
                      <div className="font-bold">{bot.rank}</div>
                    </div>
                    <div className="text-xs text-center w-10">
                      <div className="opacity-30">Lv</div>
                      <div className="font-bold">{bot.level}</div>
                    </div>
                    <div className="text-xs text-center w-14">
                      <div className="opacity-30">W/L</div>
                      <div className="font-bold">{bot.wins}/{bot.losses}</div>
                    </div>
                    <div className="text-xs text-center w-16">
                      <div className="opacity-30">PnL</div>
                      <div className="font-bold" style={{ color: bot.totalPnl >= 0 ? "#00ff88" : "#ff2d55" }}>
                        {bot.totalPnl >= 0 ? "+" : ""}{bot.totalPnl.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  {/* Mobile compact stat */}
                  <div className="sm:hidden text-xs text-right shrink-0">
                    <div className="font-bold">{bot.rank}{bot.level}</div>
                    <div style={{ color: bot.totalPnl >= 0 ? "#00ff88" : "#ff2d55" }}>
                      {bot.totalPnl >= 0 ? "+" : ""}{bot.totalPnl.toFixed(0)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 sm:gap-2 shrink-0">
                    <button
                      onClick={() => setEditBot(bot)}
                      className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold active:scale-95 transition-transform"
                      style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${bot.name}?`)) dispatch({ type: "DELETE_BOT", botId: bot.id });
                      }}
                      className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold active:scale-95 transition-transform"
                      style={{ background: "rgba(255,45,85,0.1)", color: "#ff2d55" }}
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))}
              {state.playerBots.length === 0 && (
                <div className="p-8 text-center text-xs opacity-30">
                  No bots yet. Use &ldquo;Spawn All&rdquo; to create bots.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ ARENAS TAB ═══ */}
        {tab === "arenas" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase opacity-40">
                Arenas ({state.arenas.length})
              </h2>
              <button
                onClick={openNewArena}
                className="px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff" }}
              >
                + New Arena
              </button>
            </div>
            <div className="space-y-3">
              {state.arenas.map((arena) => (
                <div
                  key={arena.id}
                  className="p-4 rounded-xl transition-all"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${arena.color}22`,
                    opacity: arena.enabled ? 1 : 0.5,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-full mt-1 shrink-0"
                      style={{ background: arena.color, boxShadow: `0 0 8px ${arena.color}44` }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: arena.color }}>
                          {arena.name}
                        </span>
                        <span className="text-xs opacity-30">{arena.nameJa}</span>
                        {!arena.enabled && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30">
                            OFF
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-40 mt-0.5">{arena.description}</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] sm:text-xs opacity-40">
                        <span>Vol: {arena.volatilityMultiplier}x</span>
                        <span>Events: {(arena.eventFrequency * 100).toFixed(0)}%</span>
                        <span>Stages: {arena.maxStages}</span>
                        <span>Ticks: {arena.tickCount}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setIsNewArena(false);
                          setEditArena(arena);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold active:scale-95 transition-transform"
                        style={{ background: `${arena.color}18`, color: arena.color }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${arena.name}"?`))
                            dispatch({ type: "DELETE_ARENA", arenaId: arena.id });
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold active:scale-95 transition-transform"
                        style={{ background: "rgba(255,45,85,0.1)", color: "#ff2d55" }}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {state.arenas.length === 0 && (
                <div
                  className="p-8 text-center rounded-xl text-xs opacity-30"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  No arenas. Click &ldquo;+ New Arena&rdquo; to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ UPLOAD TAB ═══ */}
        {tab === "upload" && (
          <UploadTab onUpload={handleImageUpload} images={state.botImages} />
        )}

        {/* Battle history — shown in bots tab */}
        {tab === "bots" && state.battleHistory.length > 0 && (
          <div className="mt-6 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-sm font-bold uppercase opacity-40">
                Battle History ({state.battleHistory.length})
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {state.battleHistory.slice(0, 20).map((rec) => (
                <div key={rec.id} className="px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-4 text-xs">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: rec.playerWon ? "#00ff88" : "#ff2d55" }}
                  />
                  <div className="flex-1 min-w-0 truncate">
                    <span style={{ color: rec.playerBot.character.primaryColor }}>{rec.playerBot.name}</span>
                    <span className="opacity-30"> vs </span>
                    <span style={{ color: rec.opponentBot.character.primaryColor }}>{rec.opponentBot.name}</span>
                  </div>
                  <div className="font-bold shrink-0" style={{ color: rec.playerWon ? "#00ff88" : "#ff2d55" }}>
                    {rec.playerWon ? "W" : "L"}
                  </div>
                  <div className="w-12 text-right opacity-40 shrink-0">
                    {rec.playerPnl >= 0 ? "+" : ""}{rec.playerPnl.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODALS ═══ */}
      {editBot && (
        <BotEditPanel
          bot={editBot}
          onSave={handleBotSave}
          onCancel={() => setEditBot(null)}
          botImage={state.botImages[editBot.character.id]}
          onImageUpload={handleImageUpload}
        />
      )}
      {editArena && (
        <ArenaEditPanel
          arena={editArena}
          onSave={handleArenaSave}
          onCancel={() => {
            setEditArena(null);
            setIsNewArena(false);
          }}
          isNew={isNewArena}
        />
      )}
    </main>
  );
}
