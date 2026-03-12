import { Character } from "@/types";

export const CHARACTERS: Character[] = [
  // ---- Scalper ----
  {
    id: "raiko",
    name: "Raiko",
    nameJa: "雷狐",
    philosophy: "Speed is truth. The market rewards the fastest.",
    tradingStyle: "scalper",
    visualMotif: "Lightning fox android with crackling electric circuits",
    primaryColor: "#00ff88",
    secondaryColor: "#0a3a1a",
    emissiveColor: "#00cc66",
    weapon: "Nanosecond Pulse Blades",
    mythReference: "Raijin — god of thunder and lightning",
    personality: "Hyperactive speed demon who executes thousands of micro-trades",
    battleCry: "光より速く",
  },

  // ---- Momentum ----
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

  // ---- Mean Reversion ----
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

  // ---- Breakout ----
  {
    id: "kaguya",
    name: "Kaguya",
    nameJa: "カグヤ",
    philosophy: "Pressure builds. Walls form. I am the force that shatters them.",
    tradingStyle: "breakout",
    visualMotif: "Explosive demolition android with cracked obsidian armor and magma veins",
    primaryColor: "#ff6600",
    secondaryColor: "#3a1a0a",
    emissiveColor: "#cc4400",
    weapon: "Tectonic Hammer — 地殻砕",
    mythReference: "Kagutsuchi — god of fire and destruction",
    personality: "Patient until the moment strikes, then absolutely devastating",
    battleCry: "壁は砕けるためにある",
  },

  // ---- Market Maker ----
  {
    id: "libra",
    name: "Libra",
    nameJa: "リブラ",
    philosophy: "I am the market. Both sides of every trade flow through me.",
    tradingStyle: "market_maker",
    visualMotif: "Dual-faced android with split blue/red symmetry and floating scales",
    primaryColor: "#8866ff",
    secondaryColor: "#1a1a3a",
    emissiveColor: "#6644cc",
    weapon: "Equilibrium Scales — 天秤",
    mythReference: "Themis — titan of divine law and balance",
    personality: "Impartial arbiter who profits from chaos by providing order",
    battleCry: "秩序は利益なり",
  },

  // ---- News Hunter ----
  {
    id: "cipher",
    name: "Cipher",
    nameJa: "サイファー",
    philosophy: "Information is alpha. By the time you read the headline, I've already traded it.",
    tradingStyle: "news_hunter",
    visualMotif: "Sleek recon android with radar arrays and holographic news feeds",
    primaryColor: "#ff2d55",
    secondaryColor: "#3a0a1a",
    emissiveColor: "#cc0033",
    weapon: "Signal Intercept Array — 傍受網",
    mythReference: "Hermes — messenger of the gods",
    personality: "Paranoid intelligence operative who sees patterns in noise",
    battleCry: "情報を制す者が市場を制す",
  },

  // ---- Whale Tracker ----
  {
    id: "tidal",
    name: "Tidal",
    nameJa: "タイダル",
    philosophy: "Follow the giants. Where the deep money flows, the tide follows.",
    tradingStyle: "whale_tracker",
    visualMotif: "Deep-sea android with bioluminescent markings and sonar arrays",
    primaryColor: "#4488cc",
    secondaryColor: "#0a1a2a",
    emissiveColor: "#2266aa",
    weapon: "Depth Sonar Lance — 深淵探",
    mythReference: "Ryujin — dragon god of the sea",
    personality: "Patient observer who reads the ocean floor before acting",
    battleCry: "巨鯨の影を追え",
  },

  // ---- Hybrid AI ----
  {
    id: "nexus",
    name: "Nexus",
    nameJa: "ネクサス",
    philosophy: "Adaptation is the ultimate strategy. The market changes — so do I.",
    tradingStyle: "hybrid_ai",
    visualMotif: "Shapeshifting chrome android with prismatic core and morphing limbs",
    primaryColor: "#aa00ff",
    secondaryColor: "#1a0a2a",
    emissiveColor: "#8800cc",
    weapon: "Polymorphic Core — 万華鏡",
    mythReference: "Proteus — the shapeshifting old man of the sea",
    personality: "Enigmatic entity that becomes whatever the market demands",
    battleCry: "形なきものは倒せない",
  },
];

export function getCharacter(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
