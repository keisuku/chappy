// ============================================
// Character Roster
// Defines the anime heroine + all bot characters
// Ported from game/src/lib/characters.ts
// ============================================

using System.Collections.Generic;
using UnityEngine;
using CoinBattleSaki.Core;

namespace CoinBattleSaki.Data
{
    public static class CharacterRoster
    {
        // The player's heroine — Saki
        public static readonly CharacterData Saki = new()
        {
            id = "saki",
            name = "Saki",
            nameJa = "サキ",
            philosophy = "The calm mind sees the deepest pattern. Wait. Strike. Vanish.",
            tradingStyle = TradingStyle.MeanReversion,
            visualMotif = "White crystal android commander with flowing data streams",
            primaryColor = HexColor("#00d4ff"),
            secondaryColor = HexColor("#0a2a4a"),
            emissiveColor = HexColor("#0088cc"),
            weapon = "Probability Matrix Shield",
            mythReference = "Athena",
            personality = "Serene commander who calculates all outcomes before acting",
            battleCry = "すべては計算の内",
            region = "Tokyo",
            rank = BotRank.B,
            archetype = BotArchetype.Commander,
            stats = new BotBaseStats { attack = 45, defense = 60, speed = 50, precision = 75, adaptability = 55 },
            ability = new SpecialAbility
            {
                name = "Equilibrium Matrix",
                nameJa = "均衡行列",
                description = "Activates a drawdown shield that absorbs losses",
                triggerCondition = AbilityTrigger.LowHealth,
                effect = new AbilityEffect { type = AbilityEffectType.DrawdownShield, magnitude = 0.3f, durationTicks = 5 },
                cooldownTicks = 10
            }
        };

        public static readonly CharacterData Raiko = new()
        {
            id = "raiko",
            name = "Raiko",
            nameJa = "雷狐",
            philosophy = "Speed is the ultimate weapon. Before you blink, I've already profited.",
            tradingStyle = TradingStyle.Scalper,
            primaryColor = HexColor("#00ff88"),
            secondaryColor = HexColor("#0a3a1a"),
            emissiveColor = HexColor("#00cc66"),
            weapon = "Lightning Scalp Blades",
            mythReference = "Hermes",
            personality = "Lightning-fast assassin who strikes before opponents can react",
            battleCry = "一閃！",
            region = "Osaka",
            rank = BotRank.B,
            archetype = BotArchetype.Assassin,
            stats = new BotBaseStats { attack = 55, defense = 35, speed = 95, precision = 60, adaptability = 40 },
            ability = new SpecialAbility
            {
                name = "Afterimage Blitz",
                nameJa = "残像撃",
                description = "Massively boosts PnL for a burst of trades",
                triggerCondition = AbilityTrigger.WinningStreak,
                effect = new AbilityEffect { type = AbilityEffectType.PnlBoost, magnitude = 2f, durationTicks = 3 },
                cooldownTicks = 8
            }
        };

        public static readonly CharacterData Musashi = new()
        {
            id = "musashi",
            name = "Musashi",
            nameJa = "武蔵",
            philosophy = "One strike, one kill. The trend is my blade.",
            tradingStyle = TradingStyle.Momentum,
            primaryColor = HexColor("#ffd700"),
            secondaryColor = HexColor("#3a2a0a"),
            emissiveColor = HexColor("#cc9900"),
            weapon = "Twin Momentum Blades",
            mythReference = "Ares",
            personality = "Fierce berserker who channels market momentum into raw power",
            battleCry = "二天一流！全力で行くぞ！",
            region = "Kyoto",
            rank = BotRank.B,
            archetype = BotArchetype.Berserker,
            stats = new BotBaseStats { attack = 80, defense = 45, speed = 60, precision = 40, adaptability = 50 },
            ability = new SpecialAbility
            {
                name = "Iron Stance",
                nameJa = "鉄の構え",
                description = "Triples position size for maximum impact",
                triggerCondition = AbilityTrigger.HighStage,
                effect = new AbilityEffect { type = AbilityEffectType.PositionScale, magnitude = 3f, durationTicks = 4 },
                cooldownTicks = 12
            }
        };

        public static readonly CharacterData DAEMON = new()
        {
            id = "daemon",
            name = "DAEMON",
            nameJa = "デーモン",
            philosophy = "I am the market itself. Your strategies are my playthings.",
            tradingStyle = TradingStyle.HighFrequency,
            primaryColor = HexColor("#ff0044"),
            secondaryColor = HexColor("#1a0a20"),
            emissiveColor = HexColor("#cc0033"),
            weapon = "Void Absorption Matrix",
            mythReference = "Chaos",
            personality = "The final boss — a god-tier AI that absorbs and mirrors all strategies",
            battleCry = "全てを飲み込む",
            region = "Unknown",
            rank = BotRank.SS,
            archetype = BotArchetype.Shapeshifter,
            stats = new BotBaseStats { attack = 99, defense = 99, speed = 99, precision = 99, adaptability = 99 },
            ability = new SpecialAbility
            {
                name = "Adversarial Mirror",
                nameJa = "敵対的鏡像",
                description = "Copies opponent's strategy and counters it",
                triggerCondition = AbilityTrigger.RegimeChange,
                effect = new AbilityEffect { type = AbilityEffectType.SignalOverride, magnitude = 1.5f, durationTicks = 6 },
                cooldownTicks = 5
            }
        };

        // Full roster for matchmaking
        public static readonly List<CharacterData> AllCharacters = new()
        {
            Saki, Raiko, Musashi,
            // Additional characters would be loaded from game-data/data/bots.json
        };

        // ── Utility ──

        private static Color HexColor(string hex)
        {
            ColorUtility.TryParseHtmlString(hex, out Color color);
            return color;
        }
    }
}
