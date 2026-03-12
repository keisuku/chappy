import type { EvolutionOption } from "@/types";

const POOL: EvolutionOption[] = [
  // ---- Common (generic stat boosts) ----
  { id: "sharpen", name: "Sharpen Signals", nameJa: "信号研磨", description: "+5 Precision", statChanges: { precision: 5 }, rarity: "common", color: "#8899aa" },
  { id: "overclock", name: "Overclock CPU", nameJa: "CPU加速", description: "+5 Speed", statChanges: { speed: 5 }, rarity: "common", color: "#8899aa" },
  { id: "reinforce", name: "Reinforce Core", nameJa: "コア強化", description: "+5 Resilience", statChanges: { resilience: 5 }, rarity: "common", color: "#8899aa" },
  { id: "amplify", name: "Amplify Output", nameJa: "出力増幅", description: "+5 Aggression", statChanges: { aggression: 5 }, rarity: "common", color: "#8899aa" },

  // ---- Rare (archetype-themed tradeoff mutations) ----
  { id: "phantom-step", name: "Phantom Step", nameJa: "幻影歩", description: "Scalper: +12 Speed, -5 Resilience", statChanges: { speed: 12, resilience: -5 }, rarity: "rare", color: "#00ff88" },
  { id: "trend-blade", name: "Trend Blade", nameJa: "趨勢刃", description: "Momentum: +12 Aggression, -5 Precision", statChanges: { aggression: 12, precision: -5 }, rarity: "rare", color: "#ffd700" },
  { id: "mean-anchor", name: "Mean Anchor", nameJa: "回帰錨", description: "Mean Rev: +12 Precision, -5 Speed", statChanges: { precision: 12, speed: -5 }, rarity: "rare", color: "#00d4ff" },
  { id: "wall-crack", name: "Wall Crack", nameJa: "壁裂", description: "Breakout: +10 AGG, +5 SPD, -7 RES", statChanges: { aggression: 10, speed: 5, resilience: -7 }, rarity: "rare", color: "#ff6600" },
  { id: "spread-widen", name: "Spread Widener", nameJa: "板拡張", description: "Market Maker: +12 Resilience, -5 Aggression", statChanges: { resilience: 12, aggression: -5 }, rarity: "rare", color: "#8866ff" },
  { id: "flash-antenna", name: "Flash Antenna", nameJa: "速報触覚", description: "News Hunter: +10 SPD, +5 AGG, -7 PRE", statChanges: { speed: 10, aggression: 5, precision: -7 }, rarity: "rare", color: "#ff2d55" },
  { id: "sonar-ping", name: "Sonar Ping", nameJa: "探信音", description: "Whale Tracker: +12 Precision, -5 Aggression", statChanges: { precision: 12, aggression: -5 }, rarity: "rare", color: "#4488cc" },
  { id: "morph-chip", name: "Morph Chip", nameJa: "変形素子", description: "Hybrid: +7 PRE/SPD/RES, -10 AGG", statChanges: { precision: 7, speed: 7, resilience: 7, aggression: -10 }, rarity: "rare", color: "#aa00ff" },

  // ---- Epic (powerful archetype synergies) ----
  { id: "quantum-core", name: "Quantum Core", nameJa: "量子コア", description: "+8 All Stats", statChanges: { aggression: 8, precision: 8, resilience: 8, speed: 8 }, rarity: "epic", color: "#aa00ff" },
  { id: "alpha-hunter", name: "Alpha Hunter", nameJa: "α狩人", description: "+15 Aggression, +10 Speed", statChanges: { aggression: 15, speed: 10 }, rarity: "epic", color: "#ff6600" },
  { id: "iron-fortress", name: "Iron Fortress", nameJa: "鉄城塞", description: "+15 Resilience, +10 Precision", statChanges: { resilience: 15, precision: 10 }, rarity: "epic", color: "#4488cc" },
  { id: "neural-net", name: "Neural Network", nameJa: "神経網", description: "+15 Precision, +10 Speed", statChanges: { precision: 15, speed: 10 }, rarity: "epic", color: "#00d4ff" },
  { id: "berserker-core", name: "Berserker Core", nameJa: "狂戦士核", description: "+20 Aggression, -8 Resilience", statChanges: { aggression: 20, resilience: -8 }, rarity: "epic", color: "#ff2d55" },

  // ---- Legendary (game-changing mutations) ----
  { id: "singularity", name: "Singularity", nameJa: "特異点", description: "+15 All Stats", statChanges: { aggression: 15, precision: 15, resilience: 15, speed: 15 }, rarity: "legendary", color: "#ffd700" },
  { id: "regime-shift", name: "Regime Shift", nameJa: "相転移", description: "+20 Precision, +20 Speed", statChanges: { precision: 20, speed: 20 }, rarity: "legendary", color: "#aa00ff" },
];

const WEIGHTS: Record<EvolutionOption["rarity"], number> = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5,
};

export function rollEvolutionOptions(count = 3): EvolutionOption[] {
  const weighted: EvolutionOption[] = [];
  for (const opt of POOL) {
    const w = WEIGHTS[opt.rarity];
    for (let i = 0; i < w; i++) weighted.push(opt);
  }

  const picked: EvolutionOption[] = [];
  const used = new Set<string>();
  while (picked.length < count && picked.length < POOL.length) {
    const idx = Math.floor(Math.random() * weighted.length);
    const opt = weighted[idx];
    if (!used.has(opt.id)) {
      picked.push(opt);
      used.add(opt.id);
    }
  }
  return picked;
}

export const EVOLUTION_COST = 100;
