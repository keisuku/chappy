# CoinBattle Saki — Improvement Log

## 2026-03-12 — Initial Prototype
- Created Next.js + Three.js + Tailwind prototype
- Implemented 3 characters: Saki, Raiko, Musashi
- Built market simulator with volatility clustering
- S1-S8 stage system with cinematic effects
- Particle field, dynamic camera, hero figures
- Mobile asset upload system
- Strategy battle: momentum vs mean_reversion vs HFT

### Metrics Baseline
- Battle duration: 30 ticks
- Characters: 3
- Strategies: 3
- Stage transitions: 8 levels
- Particle system: 50-800 particles based on stage

### Known Issues
- Hero figures are geometric boxes (need proper models)
- No sound system yet in Three.js version
- Strategy balance untested
- No persistent state between battles
