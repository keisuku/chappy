# CoinBattle Saki — Ultra-Early Prototype

Real-time market-driven bot battle visualization. Bots fight based on simulated (or live) cryptocurrency volatility, with cinematic S1-S8 stage escalation.

## Quick Start

```bash
cd web
# Open in browser (no server needed)
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

Click **"Push Encounter"** to trigger a 20-second simulated battle with stage escalation, particle VFX, and audio cues.

## Repository Structure

```
/web/                   index.html, style.css, app.js (playable prototype)
/assets/raw/            Place generated hero images here
/assets/processed/      Auto-resized outputs (1200x1800, 800x800, 1600x900)
/assets/manifest.json   Asset manifest (filenames, tags, aspect ratios)
/prompts/               Midjourney/StableDiffusion image prompts (3 per character)
/scripts/               ImageMagick resize pipeline
/runs/                  Daily agent run reports (JSON)
/figma_spec.md          Figma design specification
/daily_agent_prompt.txt Claude Code daily self-improvement loop
/.github/workflows/     GitHub Actions cron for daily agent
```

## Swapping in Live Binance Data

In `web/app.js`, find the `updateMarket()` function. Replace the random-walk simulation with a Binance WebSocket connection:

```javascript
// Replace the random walk in updateMarket() with:
const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  price = parseFloat(data.p) * 150; // Approximate JPY conversion
  // The rest of the volatility calculation stays the same
};
```

For the full Binance API with authentication (for order data):
1. Get API keys from binance.com
2. Set `BINANCE_API_KEY` and `BINANCE_SECRET` environment variables
3. Use the REST API for historical data: `https://api.binance.com/api/v3/klines`

## Asset Pipeline

1. Generate hero images using prompts in `/prompts/hero_prompts.md`
2. Place raw PNGs in `/assets/raw/`
3. Run: `bash scripts/resize_assets.sh`
4. Resized outputs appear in `/assets/processed/`

Requires [ImageMagick](https://imagemagick.org/).

## Daily Self-Improvement Loop

The file `daily_agent_prompt.txt` contains instructions for Claude Code to:
- Run simulation parameter sweeps
- Analyze metrics and propose improvements
- Auto-implement low-risk changes
- Generate new image prompts for new characters

GitHub Actions workflow (`.github/workflows/daily-run.yml`) runs this on a cron schedule. Set `ANTHROPIC_API_KEY` in your repository secrets.

## Deterministic Mode

The prototype uses a seeded RNG (SFC32) for reproducible results. To enable true randomness, set `DETERMINISTIC = false` in `app.js` line 6.

## Key Features

- S1-S8 stage escalation with distinct cinematic effects per stage
- Particle burst VFX system
- Web Audio API synthesized sound cues
- Dominance meter and real-time P&L gauges
- Console metrics logging (profit, max drawdown, trades)
- Screen shake, bloom, and chromatic effects at high stages
