# CoinBattle Saki

AI trading robots battle using real market strategies. Inspired by Astro Boy, Saint Seiya, Street Fighter II, and JoJo Stands.

## Quick Start — Next.js App (3D Battle Arena)

```bash
cd game
npm install
npm run dev
# Open http://localhost:3000
```

Click **"Push Encounter"** to trigger a 30-tick simulated battle with S1-S8 stage escalation, 3D particle VFX, dynamic camera, and strategy-vs-strategy combat.

**Asset Upload**: Visit `http://localhost:3000/asset-upload` for mobile-friendly image upload.

## Quick Start — Vanilla Prototype (No Build)

```bash
cd web
open index.html   # Just open in browser, no server needed
```

## Deploy to Vercel

```bash
cd game
npx vercel
```

Or connect the repo to Vercel and set the root directory to `game/`.

## Repository Structure

```
/game/                  Next.js + Three.js + Tailwind + TypeScript app
  src/app/              Pages (battle arena, asset upload)
  src/components/three/ 3D scene (arena, heroes, candlesticks, particles)
  src/components/ui/    HUD overlay, battle UI
  src/lib/              Market sim, strategies, battle engine, characters
  src/types/            TypeScript type definitions

/web/                   Vanilla HTML/CSS/JS prototype (no build needed)

/world/                 AI League — 12 elite characters + tournament structure
/characters/            Character roster JSON + archetype system
/art/prompts/           Image generation prompts (SD/Midjourney/ChatGPT)
/ai-lab/                Autonomous improvement system (research, experiments, logs)

/assets/                Asset pipeline (raw -> processed)
/prompts/               Legacy image prompts
/scripts/               ImageMagick resize scripts
/runs/                  Daily agent run reports
/.github/workflows/     CI/CD + daily agent cron
```

## Characters

| Name | Style | Archetype | Region |
|------|-------|-----------|--------|
| Saki サキ | Mean Reversion | Commander | Tokyo |
| Raiko 雷狐 | High Frequency | Assassin | Osaka |
| Musashi ムサシ | Momentum | Berserker | Kyoto |
| Malik マリク | Capital Force | Titan | Dubai |
| Vector ベクトル | Quant Multi-factor | Oracle | New York |
| Sterling スターリング | Event-driven | Oracle | London |
| Long 龍 | Adaptive Trend | Shapeshifter | Shanghai |
| Nexus ネクサス | Correlation Arb | Commander | Singapore |
| Karma カルマ | Stat Arb | Commander | Mumbai |
| Fuego フエゴ | Momentum+Sentiment | Berserker | São Paulo |
| Ori オリ | Risk Management | Fortress | Lagos |
| Frost フロスト | Contrarian | Trickster | Reykjavik |
| ZERO ゼロ | Adversarial Mirror | Final Boss | Unknown |

## Swapping in Live Binance Data

In `game/src/lib/market.ts`, replace the `MarketSimulator` class with a Binance WebSocket connection:

```typescript
// In market.ts — replace step() with live feed:
const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  this.price = parseFloat(data.p) * 150; // USD -> JPY approx
};
```

## AI Self-Improvement Loop

See `daily_agent_prompt.txt` and `/ai-lab/` for the autonomous development system. The agent:
1. Runs simulation parameter sweeps
2. Analyzes metrics and proposes improvements
3. Auto-implements low-risk changes
4. Generates new image prompts for new characters

GitHub Actions workflow runs daily at 23:00 UTC (08:00 JST).

## Visual Rules

- Characters occupy minimum 40% of viewport
- Camera always low-angle cinematic
- Candlestick charts rendered at massive background scale
- Particles scale with battle stage intensity
- Battle must feel epic at all times
