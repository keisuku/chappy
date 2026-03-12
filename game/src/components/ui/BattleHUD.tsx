"use client";

import { BattleState, StageConfig } from "@/types";

interface BattleHUDProps {
  battleState: BattleState;
  stageConfig: StageConfig;
  onEncounter: () => void;
}

export function BattleHUD({ battleState, stageConfig, onEncounter }: BattleHUDProps) {
  const { leftBot, rightBot, tick, isActive, winner, currentPrice } = battleState;
  const leftPower = Math.max(0, Math.min(100, leftBot.power));
  const rightPower = 100 - leftPower;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {/* Top HUD bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3"
           style={{ background: "linear-gradient(180deg, rgba(5,13,26,0.95) 0%, transparent 100%)" }}>
        <div className="text-sm font-bold tracking-widest uppercase" style={{ color: "#00d4ff" }}>
          CoinBattle Saki
        </div>
        <div className="flex gap-3 items-center">
          <span className="px-3 py-1 rounded-md text-xs font-semibold"
                style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}>
            VOL: {battleState.volatility.toFixed(0)}
          </span>
          <span className="px-3 py-1 rounded-md text-xs font-bold"
                style={{ background: `rgba(255,45,85,0.15)`, border: "1px solid rgba(255,45,85,0.3)", color: stageConfig.color }}>
            {stageConfig.name}
          </span>
          <span className="px-3 py-1 rounded-md text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.05)", color: "#d0eaff" }}>
            BTC/JPY: {currentPrice.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}
          </span>
        </div>
        <button
          onClick={onEncounter}
          disabled={isActive}
          className="pointer-events-auto px-5 py-2 rounded-lg text-sm font-extrabold uppercase tracking-wide disabled:opacity-40"
          style={{
            background: isActive ? "#333" : "linear-gradient(135deg, #00d4ff, #0090cc)",
            color: "#011",
            boxShadow: isActive ? "none" : "0 4px 20px rgba(0,212,255,0.3)",
          }}
        >
          {isActive ? `Battle ${tick}/30` : "Push Encounter"}
        </button>
      </div>

      {/* Left character info */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <div className="text-lg font-black" style={{ color: leftBot.character.primaryColor }}>
          {leftBot.character.nameJa}
        </div>
        <div className="text-xs opacity-60">{leftBot.character.name}</div>
        <div className="text-xs font-bold" style={{ color: leftBot.pnl >= 0 ? "#00ff88" : "#ff2d55" }}>
          P&L: {leftBot.pnl >= 0 ? "+" : ""}{leftBot.pnl.toFixed(0)} JPY
        </div>
        <div className="text-xs opacity-50">Trades: {leftBot.trades}</div>
        <div className="text-xs opacity-50">Style: {leftBot.character.tradingStyle}</div>
      </div>

      {/* Right character info */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-2 items-end">
        <div className="text-lg font-black" style={{ color: rightBot.character.primaryColor }}>
          {rightBot.character.nameJa}
        </div>
        <div className="text-xs opacity-60">{rightBot.character.name}</div>
        <div className="text-xs font-bold" style={{ color: rightBot.pnl >= 0 ? "#00ff88" : "#ff2d55" }}>
          P&L: {rightBot.pnl >= 0 ? "+" : ""}{rightBot.pnl.toFixed(0)} JPY
        </div>
        <div className="text-xs opacity-50">Trades: {rightBot.trades}</div>
        <div className="text-xs opacity-50">Style: {rightBot.character.tradingStyle}</div>
      </div>

      {/* Center stage label */}
      {isActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 text-center">
          <div className="text-5xl font-black"
               style={{
                 color: "white",
                 textShadow: `0 0 40px ${stageConfig.color}80, 0 10px 40px rgba(0,0,0,0.8)`,
               }}>
            {stageConfig.name}
          </div>
        </div>
      )}

      {/* Dominance bar */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-96">
        <div className="flex justify-between text-xs mb-1 opacity-60">
          <span>{leftBot.character.name}</span>
          <span>Dominance</span>
          <span>{rightBot.character.name}</span>
        </div>
        <div className="h-5 rounded-lg overflow-hidden flex" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${leftPower}%`,
              background: `linear-gradient(90deg, ${leftBot.character.primaryColor}, ${leftBot.character.primaryColor}66)`,
            }}
          />
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${rightPower}%`,
              background: `linear-gradient(270deg, ${rightBot.character.primaryColor}, ${rightBot.character.primaryColor}66)`,
            }}
          />
        </div>
      </div>

      {/* Winner overlay */}
      {winner && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto"
             style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
             onClick={onEncounter}>
          <div className="text-center p-10 rounded-2xl"
               style={{ background: "linear-gradient(135deg, rgba(10,22,40,0.95), rgba(0,0,0,0.9))", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="text-5xl font-black mb-4"
                 style={{
                   color: winner === "left" ? leftBot.character.primaryColor : rightBot.character.primaryColor,
                   textShadow: `0 0 30px ${winner === "left" ? leftBot.character.primaryColor : rightBot.character.primaryColor}80`,
                 }}>
              {winner === "left" ? "利確 TAKE PROFIT" : "利確 TAKE PROFIT"}
            </div>
            <div className="text-lg opacity-70 mb-2">
              Winner: {winner === "left" ? leftBot.character.nameJa : rightBot.character.nameJa}
            </div>
            <div className="text-sm opacity-50 space-y-1">
              <p>P&L: {(winner === "left" ? leftBot.pnl : rightBot.pnl).toFixed(0)} JPY</p>
              <p>Max DD: {(winner === "left" ? leftBot.maxDrawdown : rightBot.maxDrawdown).toFixed(0)} JPY</p>
              <p>Trades: {(winner === "left" ? leftBot : rightBot).trades}</p>
            </div>
            <div className="mt-4 text-xs opacity-40">Click to start new battle</div>
          </div>
        </div>
      )}

      {/* Bottom character philosophies */}
      <div className="absolute bottom-5 left-5 right-5 flex justify-between">
        <div className="text-xs italic opacity-30 max-w-xs">
          &ldquo;{leftBot.character.philosophy}&rdquo;
        </div>
        <div className="text-xs italic opacity-30 max-w-xs text-right">
          &ldquo;{rightBot.character.philosophy}&rdquo;
        </div>
      </div>
    </div>
  );
}
