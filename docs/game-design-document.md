# Cryptarena — Game Design Document (GDD)

## One-Line Pitch
**AIトレード × ストリートファイター × パチンコ**
(AI Trading × Street Fighter × Pachinko)

## Core Fantasy
You are an Operator raising an AI trading bot. You dream of riches. Your bot fights in arenas using real market data. The battle is the trade. The trade is the battle.

## Target Audience
- Crypto-curious gamers (18-35)
- Trading enthusiasts who want gamified experience
- Competitive gamers who enjoy character-building
- Pachinko/gacha fans who enjoy jackpot mechanics

## Platform
- Web (primary) — Next.js + Three.js
- Mobile web (secondary) — responsive design
- Native mobile (future)

## Monetization Model (Future)
- Free to play core loop
- Premium bots with unique visual effects
- Seasonal battle pass
- Equipment gacha (cosmetic focus)
- Tournament entry fees (real crypto)

## Core Gameplay Loop

```
┌─────────────────────────────┐
│     SELECT BOT + GEAR       │
│            ↓                │
│     CHOOSE ARENA/OPPONENT   │
│            ↓                │
│     WATCH BATTLE (30s)      │  ← The Pachinko moment
│            ↓                │
│     COLLECT REWARDS         │  ← Jackpot / Item drops
│            ↓                │
│     EVOLVE BOT              │  ← Gacha mutation chance
│            ↓                │
│     (repeat)                │
└─────────────────────────────┘
```

## Session Length
- Single battle: 30-60 seconds
- Quick session: 5 minutes (3-5 battles)
- Deep session: 30+ minutes (evolution, strategy, tournament)

## Retention Hooks
1. **Daily battles** — bonus EP for first 3 battles per day
2. **Evolution chase** — always close to next upgrade
3. **Jackpot near-miss** — display how close you were to triggering
4. **Rival system** — AI rival progresses alongside you
5. **Seasonal tournaments** — limited-time championships
6. **Story chapters** — unlock new story with progression

## Key Metrics to Track
- Daily Active Operators (DAO)
- Battles Per Session (BPS)
- Time to First Evolution (TTFE)
- Jackpot Trigger Rate (JTR)
- Tournament Participation Rate (TPR)
- Bot Elimination Rate (BER)
- Strategy Distribution (which archetypes are most popular)

## Technical Architecture

```
Frontend:
  Next.js (React) + Three.js + Tailwind CSS + TypeScript

State Management:
  React Context (prototype) → Zustand (production)

Market Data:
  Simulated (prototype) → Binance WebSocket (production)

Backend (future):
  Next.js API Routes → separate Node.js service

Database (future):
  PostgreSQL (user data) + Redis (real-time state)

Deployment:
  Vercel (frontend) + Railway (backend)
```

## Development Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Vanilla HTML prototype | Done |
| 1 | Next.js + Three.js migration | Done |
| 2 | Game OS (lore, characters, stages) | Done |
| 3 | Playable campaign (5 chapters) | Planned |
| 4 | Online PvP battles | Planned |
| 5 | Mobile native app | Planned |
| 6 | Live market data integration | Planned |
| 7 | Token economy | Planned |
