import type { EvolutionOption } from "@/types";

const POOL: EvolutionOption[] = [
  // Common
  { id: "sharpen", name: "Sharpen Signals", nameJa: "信号研磨", description: "+5 Precision", statChanges: { precision: 5 }, rarity: "common", color: "#8899aa" },
  { id: "overclock", name: "Overclock CPU", nameJa: "CPU加速", description: "+5 Speed", statChanges: { speed: 5 }, rarity: "common", color: "#8899aa" },
  { id: "reinforce", name: "Reinforce Core", nameJa: "コア強化", description: "+5 Resilience", statChanges: { resilience: 5 }, rarity: "common", color: "#8899aa" },
  { id: "amplify", name: "Amplify Output", nameJa: "出力増幅", description: "+5 Aggression", statChanges: { aggression: 5 }, rarity: "common", color: "#8899aa" },
  // Rare
  { id: "neural-boost", name: "Neural Boost", nameJa: "神経強化", description: "+10 Precision, -3 Speed", statChanges: { precision: 10, speed: -3 }, rarity: "rare", color: "#00d4ff" },
  { id: "turbo-engine", name: "Turbo Engine", nameJa: "ターボ", description: "+10 Speed, -3 Resilience", statChanges: { speed: 10, resilience: -3 }, rarity: "rare", color: "#00d4ff" },
  { id: "iron-wall", name: "Iron Wall", nameJa: "鉄壁", description: "+10 Resilience, -3 Aggression", statChanges: { resilience: 10, aggression: -3 }, rarity: "rare", color: "#00d4ff" },
  { id: "berserker-chip", name: "Berserker Chip", nameJa: "狂戦士", description: "+10 Aggression, -3 Precision", statChanges: { aggression: 10, precision: -3 }, rarity: "rare", color: "#00d4ff" },
  // Epic
  { id: "quantum-core", name: "Quantum Core", nameJa: "量子コア", description: "+8 All Stats", statChanges: { aggression: 8, precision: 8, resilience: 8, speed: 8 }, rarity: "epic", color: "#aa00ff" },
  { id: "alpha-hunter", name: "Alpha Hunter", nameJa: "α狩人", description: "+15 Aggression, +10 Precision", statChanges: { aggression: 15, precision: 10 }, rarity: "epic", color: "#aa00ff" },
  // Legendary
  { id: "singularity", name: "Singularity", nameJa: "特異点", description: "+15 All Stats", statChanges: { aggression: 15, precision: 15, resilience: 15, speed: 15 }, rarity: "legendary", color: "#ffd700" },
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
