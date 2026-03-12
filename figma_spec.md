# CoinBattle Saki — Figma Design Specification

## Master Frame

- **Frame name**: `BattleScreen-HD`
- **Size**: 1440 x 900 px
- **Background**: Linear gradient #050d1a -> #020810 (180deg)

---

## Layer Structure (top to bottom)

### 1. Overlay Effects (top)
- **Layer**: `FX_Bloom` — Rectangle 1440x900, fill radial gradient center-top, rgba(0,212,255,0.06) -> transparent, blend: Screen
- **Layer**: `FX_Vignette` — Rectangle 1440x900, fill radial gradient center, transparent -> rgba(0,0,0,0.4), blend: Multiply

### 2. HUD Header Group — `Header`
- **Position**: top 0, full width, height 56px
- **Background**: Linear gradient rgba(5,13,26,0.95) -> transparent
- **Children**:
  - `Logo_Text` — "CoinBattle Saki" — Inter Bold 14px, #00d4ff, uppercase, tracking 1px
  - `Volatility_Badge` — Rounded rect 80x28 rx6, stroke rgba(0,212,255,0.2), fill rgba(0,212,255,0.1)
    - Text "VOL: 12345" Inter SemiBold 13px #00d4ff
  - `Stage_Badge` — Rounded rect 44x28 rx6, stroke rgba(255,45,85,0.3), fill rgba(255,45,85,0.15)
    - Text "S5" Inter Bold 13px #ff2d55
  - `Encounter_Button` — Rounded rect 140x36 rx8, gradient fill #00d4ff -> #0090cc
    - Text "PUSH ENCOUNTER" Inter ExtraBold 14px #011, uppercase
    - Shadow: 0 4px 20px rgba(0,212,255,0.3)

### 3. Left Hero Group — `LeftHero`
- **Frame**: 540 x 810 px, positioned left 40px, center vertical
- **Children**:
  - `Hero_Glow` — Ellipse 432x486, fill rgba(0,212,255,0.3), blur 80px, opacity 40%
  - `Hero_Image` — 540x810 image frame (place hero_raiko_base_1200x1800.png, fit)
    - Drop shadow: 0 40px 60px rgba(0,0,0,0.8)
  - `Name_Tag` — Pill shape 200x32, fill rgba(255,255,255,0.04), border rgba(255,255,255,0.06)
    - Text "Left Bot — 雷狐 Raiko (HFT)" Inter SemiBold 13px #d0eaff
  - `PnL_Display` — Rounded rect 120x28 rx6, fill rgba(0,0,0,0.4)
    - Text "P&L: +12,345 JPY" Inter Bold 14px #00ff88

### 4. Right Hero Group — `RightHero`
- **Frame**: 540 x 810 px, positioned right 40px, center vertical
- **Children**: (mirror of LeftHero with Dubai Prince assets)
  - `Hero_Glow` — Ellipse, fill rgba(255,209,79,0.3)
  - `Hero_Image` — hero_dubai_base_1200x1800.png
  - Color scheme: gold (#ffd700) instead of cyan

### 5. Center Overlay Group — `CenterOverlay`
- **Position**: centered horizontally, top 10% to bottom 10%
- **Children**:
  - `Stage_Label` — Text frame with backdrop blur
    - Text "S5 激アツ" Inter Black 52px, white
    - Shadow: 0 0 40px rgba(0,212,255,0.5), 0 10px 40px rgba(0,0,0,0.8)
    - Background: linear gradient rgba(0,0,0,0.4) -> rgba(255,255,255,0.02)
    - Backdrop blur: 8px
  - `Dominance_Bar` — Rounded rect 400x28 rx8
    - Background: rgba(255,255,255,0.03), border rgba(255,255,255,0.06)
    - `Left_Fill` — Left-aligned rect, gradient #00d4ff -> rgba(0,212,255,0.4)
    - `Right_Fill` — Right-aligned rect, gradient #ffd700 -> rgba(255,215,0,0.4)
    - `Center_Line` — 3px white line with glow
  - `Ticker_Text` — "BTC/JPY: 4,523,100" Inter Bold 18px #d0eaff
  - `Battle_Timer` — "Battle: 15s" Inter SemiBold 14px #00d4ff
  - `Trade_Count` — "Trades: 12" Inter Regular 12px #6a8aaa

### 6. Log Panel — `LogPanel`
- **Position**: bottom-right, 360x240
- **Background**: rgba(0,0,0,0.55), backdrop blur 6px, border rx12
- **Children**:
  - `Log_Header` — "Battle Log" Inter Bold 11px #6a8aaa, uppercase
  - `Log_Content` — Scrollable text frame, SF Mono 11px #6a8aaa

### 7. Result Overlay — `ResultOverlay` (hidden by default)
- **Size**: Full frame 1440x900
- **Background**: rgba(0,0,0,0.7), backdrop blur 6px
- **Children**:
  - `Result_Card` — Centered 480x300, gradient fill, border rx20
    - `Result_Title` — "利確 TAKE PROFIT" Inter Black 48px, #00ff88, glow
    - `Result_Stats` — Multi-line stats, Inter Regular 16px #6a8aaa

---

## Export Presets

| Name | Size | Format | Usage |
|------|------|--------|-------|
| Hero Card | 1200x1800 | PNG @2x | Battle screen hero |
| Banner | 1600x900 | PNG @2x | Social share, OG image |
| Avatar | 800x800 | PNG @2x | Profile, thumbnail |
| Full Screen | 2880x1800 | PNG @2x | Marketing material |

## Naming Convention
```
fig_hero_{character}_{variant}.png
fig_ui_{component}_{state}.png
fig_screen_{name}_{resolution}.png
```

## Color Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| bg | #050d1a | Main background |
| panel | #0a1628 | Panel backgrounds |
| accent | #00d4ff | Primary accent (Raiko) |
| accent2 | #00ff88 | Win / positive |
| danger | #ff2d55 | KO / negative |
| gold | #ffd700 | Dubai Prince accent |
| text | #d0eaff | Primary text |
| text-dim | #6a8aaa | Secondary text |

## Typography
- **Primary**: Inter (Google Fonts)
- **Monospace**: SF Mono / Fira Code / Consolas
- **Japanese**: System default (Noto Sans JP recommended)
