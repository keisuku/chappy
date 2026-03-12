# Cryptarena — Bot Generator Tool

## Purpose
Automatically generate new trading robot characters for the Cryptarena roster.

## Generation Template

When generating a new bot, fill all fields:

```yaml
id: [lowercase_underscore]
name: [Display Name]
name_ja: [カタカナ名]
archetype: [ARC-01 through ARC-08]
region: [Home city]
rank: [D/C/B/A/S/SS]
creator: [Origin story - who made this bot]

philosophy: [Core trading belief - one sentence]

strategy:
  timeframe: [scalp/intraday/swing/position]
  entry: [How it enters trades]
  exit: [How it exits trades]
  size: [Position sizing approach]
  trades_per_battle: [Expected range]

visual:
  body: [Overall design description]
  color_primary: [Hex]
  color_secondary: [Hex]
  inspiration: [What real-world thing does it look like]
  signature_detail: [One unique visual element]

personality: [2-3 sentence personality description]
battle_cry: [Japanese phrase with translation]

special_ability:
  name: [Ability Name]
  name_ja: [日本語名]
  description: [What it does in battle]

battle_record:
  win_rate: [X%]
  avg_pnl: [+/- USDT]
  best: [Best result + context]
  worst: [Worst result + context]

lore: [2-3 paragraph background story]
```

## Generation Rules

1. **No duplicate archetypes per region** — each region should have diverse bots
2. **Philosophy must match strategy** — a patient bot shouldn't be a scalper
3. **Visual must match personality** — aggressive bot should look aggressive
4. **Battle cry must be Japanese** — adds authenticity and identity
5. **Win rate should be realistic** — 40-70% for most bots
6. **Lore should connect to the world** — reference Cryptarena events, other bots, or DAEMON

## Quick Generator Prompt

Use this prompt to generate a new bot:

```
Generate a new Cryptarena trading bot:
- Archetype: [choose one]
- Region: [choose city]
- Personality trait: [choose adjective]
- Use the template from tools/bot-generator.md
```
