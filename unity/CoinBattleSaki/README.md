# CoinBattle Saki — Unity Mobile

Portrait-mode crypto trading battle game.

## Setup

1. Open in Unity 2022.3+ (LTS)
2. Import TextMeshPro (Window → TextMeshPro → Import TMP Essential Resources)
3. Create an empty scene, add a GameObject with `SceneSetup` component
4. Press Play

## Architecture

```
Assets/Scripts/
├── Core/
│   ├── GameTypes.cs         — All enums, structs, data classes
│   ├── GameManager.cs       — Central orchestrator (singleton)
│   └── SceneSetup.cs        — Runtime UI builder (portrait layout)
├── Network/
│   └── BinanceWebSocket.cs  — Live crypto price stream
├── Market/
│   └── ChartRenderer.cs     — Candlestick chart on RawImage texture
├── Animation/
│   └── CharacterAnimator.cs — Heroine display + awakening mode
├── UI/
│   └── UIManager.cs         — HUD, buttons, PnL, event log
└── Data/
    └── CharacterRoster.cs   — Character definitions (Saki, Raiko, etc.)
```

## Portrait Layout (1080×1920)

```
┌──────────────────────┐
│ BTC/USDT  98,432  +2%│ ← Top bar (5%)
├──────────────────────┤
│                      │
│   ┌──────────────┐   │
│   │ Candlestick  │   │ ← Chart (30%)
│   │   Chart      │   │
│   └──────────────┘   │
│ [RSI] [MACD] [VOL]   │ ← Signal icons (5%)
├──────────────────────┤
│                      │
│     ╔══════════╗     │
│     ║  SAKI    ║     │ ← Character (35%)
│     ║  (hero)  ║     │    Normal: 30% screen
│     ╚══════════╝     │    Awakening: 70% screen
│                      │
├──────────────────────┤
│  P&L: +12.50         │ ← PnL bar (5%)
├──────────────────────┤
│ [LONG] [2x] [SHORT]  │ ← Buttons (10%)
│       [CLOSE]        │
├──────────────────────┤
│ [12:30] Opened LONG  │ ← Event log (10%)
│ [12:31] Signal: RSI  │
└──────────────────────┘
```

## Awakening Mode

Triggered after 3 consecutive profitable trades:

1. Screen flash (golden)
2. Character scales from 30% → 70% of screen
3. Chart shrinks to top-left mini overlay
4. Golden aura particles
5. Enhanced PnL display

Ends when a trade closes at a loss.

## Gameplay Loop

1. Watch real-time BTC chart
2. Read signal indicators (RSI, MACD, volume)
3. Tap LONG or SHORT with chosen leverage
4. Profit → character attacks (lunge animation)
5. Loss → enemy attacks (damage + shake)
6. TP hit → victory particles + golden flash
7. SL hit → defeat particles + red vignette
8. 3x profit streak → AWAKENING MODE

## Build

- **Android**: File → Build Settings → Android → Build
- **iOS**: File → Build Settings → iOS → Build
- Minimum: Android 8.0+ / iOS 14+
