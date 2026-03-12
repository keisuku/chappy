# Cryptarena — Evolution System

## Evolution Overview

Every bot earns **Evolution Points (EP)** from battles. EP is spent on upgrades that permanently improve the bot's ANC (Adaptive Neural Core).

EP Sources:
- Battle victory: 100 EP
- Battle defeat (survived): 30 EP
- Perfect trade: 50 EP bonus
- Jackpot trigger: 200 EP bonus
- Championship win: 1000 EP

## Evolution Tree

Each archetype has a unique evolution tree with 5 tiers.

### Universal Branches (All Archetypes)

```
CORE STATS (available to all)
├── Analysis Depth     [10 EP per level, max 50]
├── Execution Speed    [10 EP per level, max 50]
├── Risk Tolerance     [10 EP per level, max 50]
├── Pattern Memory     [15 EP per level, max 30]
└── Capital Efficiency [15 EP per level, max 30]
```

### Archetype-Specific Branches

#### Scalper Tree
```
├── Tick Sensitivity    [20 EP] — detect smaller price moves
├── Multi-Pair          [50 EP] — trade 2 pairs simultaneously
├── Ghost Orders        [100 EP] — hidden execution
├── Time Dilation       [200 EP] — 2x trade speed for 5 seconds
└── THOUSAND CUTS MASTERY [500 EP] — ultimate ability upgrade
```

#### Momentum Tree
```
├── Trend Strength      [20 EP] — stronger trend detection
├── Pyramid Master      [50 EP] — add to winning positions automatically
├── Iron Core           [100 EP] — ignore reversal signals for 3 trades
├── Unbreakable Will    [200 EP] — halve drawdown impact
└── TREND SLASH MASTERY [500 EP] — ultimate ability upgrade
```

#### Mean Reversion Tree
```
├── Band Width          [20 EP] — more precise deviation detection
├── Scale-In Protocol   [50 EP] — optimized averaging into positions
├── Regime Detector     [100 EP] — avoid trending markets automatically
├── Multi-Mean          [200 EP] — calculate mean at 3 timescales
└── EQUILIBRIUM MASTERY [500 EP] — ultimate ability upgrade
```

## Mutation System

When spending 500+ EP in a single upgrade, there's a chance of **Mutation**:

| Roll | Result | Rarity |
|------|--------|--------|
| 1-60 | Normal upgrade | Common |
| 61-80 | Enhanced upgrade (+20% bonus) | Uncommon |
| 81-92 | Super upgrade (+50% bonus) | Rare |
| 93-98 | Mutation — gain random ability from another archetype | Epic |
| 99 | Dual Core — run 2 strategies simultaneously | Legendary |
| 100 | Void Touch — temporary opponent strategy copy | Mythic |

## ANC Death & Rebirth

If a bot's drawdown exceeds its survival threshold during battle:
1. The ANC takes **permanent damage**
2. 3 strikes = ANC death (bot is permanently destroyed)
3. Damaged ANC can be repaired with Evolution Crystals (EC)

ANC Repair Costs:
- 1st damage: 1 EC
- 2nd damage: 3 EC
- 3rd damage: Cannot repair. Bot is dead.

### Rebirth System
A dead bot can be **reborn** at enormous cost:
- 10 EC + 5000 EP + 1 DAEMON Shard
- Reborn bot starts at Level 1 but retains one random evolved trait
- Visual design changes — shows "scars" from previous death
