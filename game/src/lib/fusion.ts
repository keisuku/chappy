// ============================================
// Bot Fusion System — Evolution Through Merging
//
// Fuse two bots to create a new DNA by combining genes.
// Each fusion has a chance for mutations (bonus/penalty).
// Rarer mutations create more powerful (or dangerous) DNA.
//
// Fusion rules:
// - Each gene = weighted average of parents + mutation roll
// - Dominant parent (higher stat) contributes 60%, recessive 40%
// - Mutation chance: 70% common, 20% rare, 8% epic, 2% legendary
// - Mutations can boost one gene dramatically or rebalance all genes
// ============================================

import { BotDNA, FusionResult } from "@/types";

// ── Mutation Templates ──

interface MutationTemplate {
  name: string;
  nameJa: string;
  rarity: FusionResult["rarity"];
  description: string;
  apply: (dna: BotDNA) => { dna: BotDNA; bonusGene: keyof BotDNA | null };
}

const MUTATIONS: MutationTemplate[] = [
  // ── Common (subtle tweaks) ──
  {
    name: "Stable Splice",
    nameJa: "安定結合",
    rarity: "common",
    description: "Clean fusion — no mutation, balanced DNA",
    apply: (dna) => ({ dna, bonusGene: null }),
  },
  {
    name: "Aggression Drift",
    nameJa: "攻撃性偏移",
    rarity: "common",
    description: "Aggression +8, Fear -5",
    apply: (dna) => ({
      dna: { ...dna, aggression: clamp(dna.aggression + 8, 0, 100), fearIndex: clamp(dna.fearIndex - 5, 0, 100) },
      bonusGene: "aggression",
    }),
  },
  {
    name: "Caution Drift",
    nameJa: "慎重偏移",
    rarity: "common",
    description: "Fear +8, Aggression -5",
    apply: (dna) => ({
      dna: { ...dna, fearIndex: clamp(dna.fearIndex + 8, 0, 100), aggression: clamp(dna.aggression - 5, 0, 100) },
      bonusGene: "fearIndex",
    }),
  },
  {
    name: "Speed Burst",
    nameJa: "速度爆発",
    rarity: "common",
    description: "AdaptSpeed +8, Conviction -5",
    apply: (dna) => ({
      dna: { ...dna, adaptSpeed: clamp(dna.adaptSpeed + 8, 0, 100), conviction: clamp(dna.conviction - 5, 0, 100) },
      bonusGene: "adaptSpeed",
    }),
  },
  {
    name: "Diamond Hands",
    nameJa: "ダイヤモンドハンド",
    rarity: "common",
    description: "Conviction +10",
    apply: (dna) => ({
      dna: { ...dna, conviction: clamp(dna.conviction + 10, 0, 100) },
      bonusGene: "conviction",
    }),
  },

  // ── Rare (meaningful shifts) ──
  {
    name: "Leverage Amplifier",
    nameJa: "レバレッジ増幅",
    rarity: "rare",
    description: "LeverageBias +15, Fear -8 — born to gamble",
    apply: (dna) => ({
      dna: { ...dna, leverageBias: clamp(dna.leverageBias + 15, 0, 100), fearIndex: clamp(dna.fearIndex - 8, 0, 100) },
      bonusGene: "leverageBias",
    }),
  },
  {
    name: "Counter-Signal",
    nameJa: "逆張り覚醒",
    rarity: "rare",
    description: "Contrarian +20, Aggression +5 — fade everything",
    apply: (dna) => ({
      dna: { ...dna, contrarian: clamp(dna.contrarian + 20, 0, 100), aggression: clamp(dna.aggression + 5, 0, 100) },
      bonusGene: "contrarian",
    }),
  },
  {
    name: "Greed Engine",
    nameJa: "貪欲エンジン",
    rarity: "rare",
    description: "Greed +15, Conviction +10 — holds for massive wins",
    apply: (dna) => ({
      dna: { ...dna, greedIndex: clamp(dna.greedIndex + 15, 0, 100), conviction: clamp(dna.conviction + 10, 0, 100) },
      bonusGene: "greedIndex",
    }),
  },
  {
    name: "Survival Instinct",
    nameJa: "生存本能",
    rarity: "rare",
    description: "Fear +12, ClutchFactor +10, LeverageBias -10 — hard to kill",
    apply: (dna) => ({
      dna: {
        ...dna,
        fearIndex: clamp(dna.fearIndex + 12, 0, 100),
        clutchFactor: clamp(dna.clutchFactor + 10, 0, 100),
        leverageBias: clamp(dna.leverageBias - 10, 0, 100),
      },
      bonusGene: "clutchFactor",
    }),
  },
  {
    name: "Adaptive Core",
    nameJa: "適応核",
    rarity: "rare",
    description: "AdaptSpeed +18 — switches strategy on a dime",
    apply: (dna) => ({
      dna: { ...dna, adaptSpeed: clamp(dna.adaptSpeed + 18, 0, 100) },
      bonusGene: "adaptSpeed",
    }),
  },

  // ── Epic (dramatic DNA shifts) ──
  {
    name: "Berserker Protocol",
    nameJa: "狂戦士プロトコル",
    rarity: "epic",
    description: "Aggression +25, LeverageBias +15, Fear -20 — maximum violence",
    apply: (dna) => ({
      dna: {
        ...dna,
        aggression: clamp(dna.aggression + 25, 0, 100),
        leverageBias: clamp(dna.leverageBias + 15, 0, 100),
        fearIndex: clamp(dna.fearIndex - 20, 0, 100),
      },
      bonusGene: "aggression",
    }),
  },
  {
    name: "Fortress Mind",
    nameJa: "要塞精神",
    rarity: "epic",
    description: "Fear +20, Conviction +20, ClutchFactor +15, Aggression -15",
    apply: (dna) => ({
      dna: {
        ...dna,
        fearIndex: clamp(dna.fearIndex + 20, 0, 100),
        conviction: clamp(dna.conviction + 20, 0, 100),
        clutchFactor: clamp(dna.clutchFactor + 15, 0, 100),
        aggression: clamp(dna.aggression - 15, 0, 100),
      },
      bonusGene: "conviction",
    }),
  },
  {
    name: "Quantum Splice",
    nameJa: "量子結合",
    rarity: "epic",
    description: "All genes +10 — perfectly balanced evolution",
    apply: (dna) => ({
      dna: {
        aggression: clamp(dna.aggression + 10, 0, 100),
        conviction: clamp(dna.conviction + 10, 0, 100),
        fearIndex: clamp(dna.fearIndex + 10, 0, 100),
        greedIndex: clamp(dna.greedIndex + 10, 0, 100),
        leverageBias: clamp(dna.leverageBias + 10, 0, 100),
        adaptSpeed: clamp(dna.adaptSpeed + 10, 0, 100),
        contrarian: clamp(dna.contrarian + 10, 0, 100),
        clutchFactor: clamp(dna.clutchFactor + 10, 0, 100),
      },
      bonusGene: null,
    }),
  },

  // ── Legendary (game-changing mutations) ──
  {
    name: "Singularity",
    nameJa: "特異点",
    rarity: "legendary",
    description: "All genes +20 — transcendent DNA",
    apply: (dna) => ({
      dna: {
        aggression: clamp(dna.aggression + 20, 0, 100),
        conviction: clamp(dna.conviction + 20, 0, 100),
        fearIndex: clamp(dna.fearIndex + 20, 0, 100),
        greedIndex: clamp(dna.greedIndex + 20, 0, 100),
        leverageBias: clamp(dna.leverageBias + 20, 0, 100),
        adaptSpeed: clamp(dna.adaptSpeed + 20, 0, 100),
        contrarian: clamp(dna.contrarian + 20, 0, 100),
        clutchFactor: clamp(dna.clutchFactor + 20, 0, 100),
      },
      bonusGene: null,
    }),
  },
  {
    name: "ZERO Protocol",
    nameJa: "ゼロプロトコル",
    rarity: "legendary",
    description: "One random gene → 99, all others +5 — specialized ascension",
    apply: (dna) => {
      const genes: (keyof BotDNA)[] = ["aggression", "conviction", "fearIndex", "greedIndex", "leverageBias", "adaptSpeed", "contrarian", "clutchFactor"];
      const chosen = genes[Math.floor(Math.random() * genes.length)];
      const newDna = { ...dna };
      for (const g of genes) {
        newDna[g] = clamp(newDna[g] + 5, 0, 100);
      }
      newDna[chosen] = 99;
      return { dna: newDna, bonusGene: chosen };
    },
  },
];

// ── Rarity Weights ──
const RARITY_WEIGHTS: Record<FusionResult["rarity"], number> = {
  common: 70,
  rare: 20,
  epic: 8,
  legendary: 2,
};

// ── Core Fusion Function ──

/**
 * Fuse two bot DNAs to create a new evolved DNA.
 * Dominant parent (higher total stats) contributes 60%.
 * A random mutation is then applied.
 */
export function fuseBots(parentA: BotDNA, parentB: BotDNA): FusionResult {
  // Determine dominant parent
  const totalA = sumDNA(parentA);
  const totalB = sumDNA(parentB);
  const dominant = totalA >= totalB ? parentA : parentB;
  const recessive = totalA >= totalB ? parentB : parentA;

  // Blend genes: 60% dominant, 40% recessive + small random variance
  const genes: (keyof BotDNA)[] = ["aggression", "conviction", "fearIndex", "greedIndex", "leverageBias", "adaptSpeed", "contrarian", "clutchFactor"];
  const blended: BotDNA = {} as BotDNA;

  for (const gene of genes) {
    const domVal = dominant[gene];
    const recVal = recessive[gene];
    const blendedVal = domVal * 0.6 + recVal * 0.4;
    const variance = (Math.random() - 0.5) * 10; // ±5 random drift
    blended[gene] = clamp(blendedVal + variance, 0, 100);
  }

  // Roll for mutation
  const mutation = rollMutation();
  const { dna: mutatedDna, bonusGene } = mutation.apply(blended);

  return {
    dna: mutatedDna,
    mutationName: mutation.name,
    mutationNameJa: mutation.nameJa,
    rarity: mutation.rarity,
    bonusGene,
    description: mutation.description,
  };
}

function rollMutation(): MutationTemplate {
  // Build weighted pool
  const pool: MutationTemplate[] = [];
  for (const m of MUTATIONS) {
    const weight = RARITY_WEIGHTS[m.rarity];
    for (let i = 0; i < weight; i++) pool.push(m);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── DNA Utilities ──

export function sumDNA(dna: BotDNA): number {
  return dna.aggression + dna.conviction + dna.fearIndex + dna.greedIndex +
    dna.leverageBias + dna.adaptSpeed + dna.contrarian + dna.clutchFactor;
}

export function averageDNA(dna: BotDNA): number {
  return sumDNA(dna) / 8;
}

/** Get a text label for DNA quality */
export function dnaGrade(dna: BotDNA): { grade: string; gradeJa: string; color: string } {
  const avg = averageDNA(dna);
  if (avg >= 85) return { grade: "SSS", gradeJa: "神", color: "#ffd700" };
  if (avg >= 75) return { grade: "SS",  gradeJa: "極", color: "#ff6600" };
  if (avg >= 65) return { grade: "S",   gradeJa: "超", color: "#ff2d55" };
  if (avg >= 55) return { grade: "A",   gradeJa: "優", color: "#aa00ff" };
  if (avg >= 45) return { grade: "B",   gradeJa: "良", color: "#00d4ff" };
  if (avg >= 35) return { grade: "C",   gradeJa: "凡", color: "#44cc88" };
  return { grade: "D", gradeJa: "弱", color: "#888888" };
}

/** Format DNA as a readable string for debug/display */
export function formatDNA(dna: BotDNA): string {
  return [
    `AGG:${dna.aggression.toFixed(0)}`,
    `CON:${dna.conviction.toFixed(0)}`,
    `FER:${dna.fearIndex.toFixed(0)}`,
    `GRD:${dna.greedIndex.toFixed(0)}`,
    `LEV:${dna.leverageBias.toFixed(0)}`,
    `ADP:${dna.adaptSpeed.toFixed(0)}`,
    `CTR:${dna.contrarian.toFixed(0)}`,
    `CLT:${dna.clutchFactor.toFixed(0)}`,
  ].join(" | ");
}

// ── Utility ──
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Fusion cost in gold (scales with parent DNA quality) */
export function fusionCost(parentA: BotDNA, parentB: BotDNA): number {
  const avgQuality = (averageDNA(parentA) + averageDNA(parentB)) / 2;
  return Math.floor(100 + avgQuality * 3); // 100-400 gold
}
