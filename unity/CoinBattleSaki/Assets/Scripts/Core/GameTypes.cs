// ============================================
// CoinBattle Saki — Core Game Types
// Unity C# port of TypeScript type definitions
// ============================================

using System;
using System.Collections.Generic;
using UnityEngine;

namespace CoinBattleSaki.Core
{
    // ── Enums ──

    public enum TradingStyle
    {
        Momentum,
        MeanReversion,
        HighFrequency,
        EventDriven,
        Arbitrage,
        Contrarian,
        Scalper,
        VolatilityBreaker
    }

    public enum TradeDirection { Long, Short, Flat }
    public enum MarketRegime { Trending, Ranging, Volatile, Calm }
    public enum BotArchetype { Commander, Assassin, Berserker, Oracle, Titan, Shapeshifter, Fortress, Trickster }
    public enum BotRank { D, C, B, A, S, SS }

    public enum SignalStrength { Weak, Medium, Strong, Jackpot }
    public enum CharacterState { Idle, Long, Short, Victory, Defeat, Awakening, Boss }

    public enum AbilityTrigger { LowHealth, HighStage, LosingStreak, WinningStreak, RegimeChange }
    public enum AbilityEffectType { PnlBoost, DrawdownShield, SignalOverride, PositionScale, CounterTrade }

    // ── Data Structures ──

    [Serializable]
    public struct Candlestick
    {
        public long time;
        public float open;
        public float high;
        public float low;
        public float close;
        public float volume;
        public bool closed;

        public bool IsBullish => close >= open;
        public float Body => Mathf.Abs(close - open);
        public float Range => high - low;
        public float UpperWick => high - Mathf.Max(close, open);
        public float LowerWick => Mathf.Min(close, open) - low;
    }

    [Serializable]
    public class BotBaseStats
    {
        public int attack = 50;
        public int defense = 50;
        public int speed = 50;
        public int precision = 50;
        public int adaptability = 50;
    }

    [Serializable]
    public class AbilityEffect
    {
        public AbilityEffectType type;
        public float magnitude;
        public int durationTicks;
    }

    [Serializable]
    public class SpecialAbility
    {
        public string name;
        public string nameJa;
        public string description;
        public AbilityTrigger triggerCondition;
        public AbilityEffect effect;
        public int cooldownTicks;
    }

    [Serializable]
    public class CharacterData
    {
        public string id;
        public string name;
        public string nameJa;
        public string philosophy;
        public TradingStyle tradingStyle;
        public string visualMotif;
        public Color primaryColor;
        public Color secondaryColor;
        public Color emissiveColor;
        public string weapon;
        public string mythReference;
        public string personality;
        public string battleCry;
        public string region;
        public BotRank rank;
        public BotArchetype archetype;
        public BotBaseStats stats;
        public SpecialAbility ability;
    }

    [Serializable]
    public class TradePosition
    {
        public TradeDirection direction;
        public float entryPrice;
        public float size;
        public float stopLoss;
        public float takeProfit;
    }

    [Serializable]
    public class BotState
    {
        public CharacterData character;
        public TradePosition position;
        public float pnl;
        public float power = 50f;
        public int trades;
        public int wins;
        public int losses;
        public float maxDrawdown;
        public float peakPnl;
        public int currentStreak;
        public bool abilityActive;
        public int abilityTicksRemaining;
        public int abilityCooldown;
    }

    [Serializable]
    public class BattleState
    {
        public int tick;
        public int stage = 1;
        public BotState leftBot;
        public BotState rightBot;
        public List<Candlestick> candles = new();
        public float currentPrice;
        public float volatility;
        public MarketRegime regime = MarketRegime.Calm;
        public bool isActive;
        public string winner; // "left", "right", or null
    }

    // ── Signal / Event Types ──

    [Serializable]
    public struct StrategySignal
    {
        public TradeDirection direction;
        public float confidence;
        public string reason;
    }

    [Serializable]
    public struct SignalEvent
    {
        public string source;
        public SignalStrength strength;
        public int tick;
        public string side;
        public float value;
        public string description;
    }

    // ── Stage Config ──

    [Serializable]
    public class StageConfig
    {
        public int id;
        public string name;
        public string nameEn;
        public Color color;
        public float shakeIntensity;
        public float bloomStrength;
        public int particleCount;
    }
}
