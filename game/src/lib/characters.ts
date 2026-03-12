import { Character } from "@/types";

export const CHARACTERS: Character[] = [
  {
    id: "saki",
    name: "Saki",
    nameJa: "サキ",
    philosophy: "The calm mind sees the deepest pattern. Wait. Strike. Vanish.",
    tradingStyle: "mean_reversion",
    visualMotif: "White crystal android commander with flowing data streams",
    primaryColor: "#00d4ff",
    secondaryColor: "#0a2a4a",
    emissiveColor: "#0088cc",
    weapon: "Probability Matrix Shield",
    mythReference: "Athena — goddess of strategic warfare",
    personality: "Serene commander who calculates all outcomes before acting",
    battleCry: "すべては計算の内",
  },
  {
    id: "raiko",
    name: "Raiko",
    nameJa: "雷狐",
    philosophy: "Speed is truth. The market rewards the fastest.",
    tradingStyle: "high_frequency",
    visualMotif: "Lightning fox android with crackling electric circuits",
    primaryColor: "#00ff88",
    secondaryColor: "#0a3a1a",
    emissiveColor: "#00cc66",
    weapon: "Nanosecond Pulse Blades",
    mythReference: "Raijin — god of thunder and lightning",
    personality: "Hyperactive speed demon who executes thousands of micro-trades",
    battleCry: "光より速く",
  },
  {
    id: "musashi",
    name: "Musashi",
    nameJa: "ムサシ",
    philosophy: "Once the blade is drawn, there is no retreat. Commit fully.",
    tradingStyle: "momentum",
    visualMotif: "Samurai robot with heavy golden armor and twin katanas",
    primaryColor: "#ffd700",
    secondaryColor: "#3a2a0a",
    emissiveColor: "#cc9900",
    weapon: "Twin Trend Katanas — 二刀流",
    mythReference: "Miyamoto Musashi — undefeated swordsman",
    personality: "Stoic warrior who never exits a position once entered",
    battleCry: "退かぬ、媚びぬ、省みぬ",
  },
];

export function getCharacter(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
