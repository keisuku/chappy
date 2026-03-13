// ============================================
// CoinBattle Saki — Game Engine
// Chart + Battle Stage + Trading + Animations
// ============================================

// ── State ──
const state = {
  coin: "BTC",
  timeframe: "15m",
  leverage: 2,
  tp: 3,
  sl: 1.5,
  position: null,    // { direction, entryPrice, size, leverage }
  pnl: 0,
  candles: [],
  currentPrice: 0,
  ws: null,
  chartAnimId: null,
  charAnimId: null,
  // Character animation
  charPhase: 0,       // idle phase
  charState: "idle",  // idle | long | short | victory | defeat | boss
  bossActive: false,
  signalActive: false,
};

// ── Config ──
const COINS = {
  BTC: { pair: "btcusdt", label: "BTC/USDT", decimals: 2 },
  ETH: { pair: "ethusdt", label: "ETH/USDT", decimals: 2 },
  SOL: { pair: "solusdt", label: "SOL/USDT", decimals: 3 },
  XRP: { pair: "xrpusdt", label: "XRP/USDT", decimals: 4 },
};

const TF_MAP = {
  "5m": "5m", "15m": "15m", "1h": "1h", "4h": "4h", "1D": "1d",
};

const MAX_CANDLES = 120;

// ── DOM ──
const $ = (id) => document.getElementById(id);
const $chartCanvas = $("chartCanvas");
const $charCanvas = $("characterCanvas");
const chartCtx = $chartCanvas.getContext("2d");
const charCtx = $charCanvas.getContext("2d");

// ============================================
// WebSocket — Binance kline stream
// ============================================

function connectWebSocket() {
  if (state.ws) {
    state.ws.close();
    state.ws = null;
  }

  const coin = COINS[state.coin];
  const tf = TF_MAP[state.timeframe];
  const url = `wss://stream.binance.com:9443/ws/${coin.pair}@kline_${tf}`;

  addLog("system", `Connecting to ${coin.label} ${state.timeframe}...`);

  const ws = new WebSocket(url);
  state.ws = ws;

  ws.onopen = () => {
    addLog("system", `Connected. Streaming ${coin.label} ${state.timeframe}`);
    // Fetch initial candles via REST
    fetchInitialCandles();
  };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.k) {
      const k = msg.k;
      const candle = {
        time: k.t,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
        closed: k.x,
      };

      updatePrice(candle.close);
      updateCandle(candle);
      checkPosition(candle.close);
      checkSignalEvent(candle);
    }
  };

  ws.onerror = () => addLog("system", "WebSocket error. Retrying...");
  ws.onclose = () => {
    if (state.ws === ws) {
      setTimeout(connectWebSocket, 3000);
    }
  };
}

async function fetchInitialCandles() {
  const coin = COINS[state.coin];
  const tf = TF_MAP[state.timeframe];
  try {
    const resp = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${coin.pair.toUpperCase()}&interval=${tf}&limit=${MAX_CANDLES}`
    );
    const data = await resp.json();
    state.candles = data.map((d) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
      closed: true,
    }));
    if (state.candles.length > 0) {
      updatePrice(state.candles[state.candles.length - 1].close);
    }
  } catch (err) {
    addLog("system", "Failed to fetch candles, using stream only");
  }
}

function updateCandle(candle) {
  if (state.candles.length === 0) {
    state.candles.push(candle);
    return;
  }

  const last = state.candles[state.candles.length - 1];
  if (candle.time === last.time) {
    // Update current candle
    state.candles[state.candles.length - 1] = candle;
  } else {
    // New candle
    state.candles.push(candle);
    if (state.candles.length > MAX_CANDLES) {
      state.candles.shift();
    }
  }
}

// ============================================
// Price & Position
// ============================================

function updatePrice(price) {
  state.currentPrice = price;
  const coin = COINS[state.coin];
  $("pairLabel").textContent = coin.label;
  $("priceValue").textContent = price.toFixed(coin.decimals);

  // Change calculation
  if (state.candles.length >= 2) {
    const prevClose = state.candles[state.candles.length - 2].close;
    const change = ((price - prevClose) / prevClose) * 100;
    const el = $("priceChange");
    el.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
    el.className = "price-change " + (change >= 0 ? "up" : "down");
  }
}

function openPosition(direction) {
  if (state.position) return;
  if (state.currentPrice <= 0) return;

  const size = 100; // $100 notional
  state.position = {
    direction,
    entryPrice: state.currentPrice,
    size,
    leverage: state.leverage,
  };
  state.pnl = 0;

  // UI
  $("positionInfo").classList.remove("hidden");
  const dirEl = $("posDirection");
  dirEl.textContent = direction;
  dirEl.className = "pos-direction " + direction;
  $("posEntry").textContent = state.currentPrice.toFixed(COINS[state.coin].decimals);
  $("posSize").textContent = `$${size} @ ${state.leverage}x`;
  $("btnClose").classList.remove("hidden");
  $("btnLong").disabled = true;
  $("btnShort").disabled = true;

  // TP/SL lines
  updateTPSLLines();

  // Battle status
  setCharState(direction);
  addLog("trade", `Opened ${direction.toUpperCase()} @ ${state.currentPrice.toFixed(2)} (${state.leverage}x)`);
}

function closePosition(reason) {
  if (!state.position) return;

  const label = reason || "manual close";
  const pnl = state.pnl;
  addLog(pnl >= 0 ? "win" : "loss",
    `Closed ${state.position.direction.toUpperCase()} — P&L: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} (${label})`);

  state.position = null;
  state.pnl = 0;

  // UI
  $("positionInfo").classList.add("hidden");
  $("btnClose").classList.add("hidden");
  $("btnLong").disabled = false;
  $("btnShort").disabled = false;
  $("tpLine").classList.add("hidden");
  $("slLine").classList.add("hidden");
  updatePnLDisplay(0);

  setCharState("idle");
}

function checkPosition(price) {
  if (!state.position) return;

  const pos = state.position;
  const move = (price - pos.entryPrice) / pos.entryPrice;
  const directional = pos.direction === "long" ? move : -move;
  state.pnl = directional * pos.size * pos.leverage;

  updatePnLDisplay(state.pnl);

  // Check TP
  if (directional * 100 >= state.tp) {
    triggerVictory();
    closePosition("TP hit");
    return;
  }

  // Check SL
  if (directional * 100 <= -state.sl) {
    triggerDefeat();
    closePosition("SL hit");
    return;
  }

  // Approaching TP (within 30%) → pulse animation
  if (directional * 100 >= state.tp * 0.7) {
    $("battleStatus").className = "battle-status victory";
    $("battleStatus").querySelector(".status-label").textContent = "APPROACHING TP";
  }
  // Approaching SL (within 30%)
  else if (directional * 100 <= -state.sl * 0.7) {
    $("battleStatus").className = "battle-status defeat";
    $("battleStatus").querySelector(".status-label").textContent = "APPROACHING SL";
  }
}

function updatePnLDisplay(pnl) {
  const el = $("pnlDisplay");
  $("pnlValue").textContent = pnl.toFixed(2);
  el.className = "pnl-display " + (pnl >= 0 ? "positive" : "negative");
}

function updateTPSLLines() {
  // TP/SL lines are positioned on the chart via the render loop
  $("tpLine").classList.remove("hidden");
  $("slLine").classList.remove("hidden");
}

// ============================================
// Signal Events
// ============================================

function checkSignalEvent(candle) {
  if (!candle.closed) return;
  if (state.candles.length < 5) return;

  // Detect: large candle (>2x avg range)
  const recent = state.candles.slice(-20);
  const avgRange = recent.reduce((s, c) => s + Math.abs(c.close - c.open), 0) / recent.length;
  const thisRange = Math.abs(candle.close - candle.open);

  if (thisRange > avgRange * 3) {
    triggerSignalEvent();
    triggerBossAppearance();
    addLog("signal", `SIGNAL: Extreme candle detected! Range ${thisRange.toFixed(2)} vs avg ${avgRange.toFixed(2)}`);
  } else if (thisRange > avgRange * 2) {
    triggerSignalEvent();
    addLog("signal", `Signal: Large move detected`);
  }
}

function triggerSignalEvent() {
  state.signalActive = true;
  $("signalMarker").classList.remove("hidden");
  $("signalOverlay").classList.remove("hidden");
  setTimeout(() => {
    $("signalMarker").classList.add("hidden");
    $("signalOverlay").classList.add("hidden");
    state.signalActive = false;
  }, 2000);
}

function triggerBossAppearance() {
  state.bossActive = true;
  state.charState = "boss";
  $("bossOverlay").classList.remove("hidden");
  $("bossName").textContent = "DAEMON DETECTED";
  setTimeout(() => {
    $("bossOverlay").classList.add("hidden");
    state.bossActive = false;
    if (!state.position) state.charState = "idle";
    else state.charState = state.position.direction;
  }, 4000);
}

function triggerVictory() {
  state.charState = "victory";
  $("victoryOverlay").classList.remove("hidden");
  animateParticles($("victoryCanvas"), "#ffd700", 80);
  setTimeout(() => {
    $("victoryOverlay").classList.add("hidden");
  }, 2500);
}

function triggerDefeat() {
  state.charState = "defeat";
  $("defeatOverlay").classList.remove("hidden");
  animateParticles($("defeatCanvas"), "#ff2d55", 60);
  // Screen shake
  document.body.style.animation = "shake 0.4s ease-out";
  setTimeout(() => {
    document.body.style.animation = "";
    $("defeatOverlay").classList.add("hidden");
  }, 2500);
}

// ============================================
// Particle animation for overlays
// ============================================

function animateParticles(canvas, color, count) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  const particles = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 100,
      vx: (Math.random() - 0.5) * 4,
      vy: -(2 + Math.random() * 6),
      size: 2 + Math.random() * 4,
      alpha: 0.6 + Math.random() * 0.4,
      decay: 0.005 + Math.random() * 0.01,
    });
  }

  let frame = 0;
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.alpha <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.alpha -= p.decay;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    frame++;
    if (alive && frame < 150) requestAnimationFrame(tick);
  }
  tick();
}

// ============================================
// Chart Renderer (Canvas)
// ============================================

function renderChart() {
  const canvas = $chartCanvas;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  const ctx = chartCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const candles = state.candles;

  if (candles.length === 0) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#64748b";
    ctx.font = "14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Connecting...", W / 2, H / 2);
    state.chartAnimId = requestAnimationFrame(renderChart);
    return;
  }

  ctx.clearRect(0, 0, W, H);

  // Price range
  let high = -Infinity, low = Infinity;
  for (const c of candles) {
    if (c.high > high) high = c.high;
    if (c.low < low) low = c.low;
  }
  const padding = (high - low) * 0.1;
  high += padding;
  low -= padding;
  const range = high - low || 1;

  const candleW = Math.max(1, (W - 60) / candles.length);
  const gap = Math.max(1, candleW * 0.2);
  const bodyW = candleW - gap;

  const toY = (price) => H - ((price - low) / range) * (H - 20) - 10;

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  const gridSteps = 5;
  for (let i = 0; i <= gridSteps; i++) {
    const y = 10 + (i / gridSteps) * (H - 20);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();

    // Price label
    const price = high - (i / gridSteps) * range;
    ctx.fillStyle = "#334155";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(price.toFixed(COINS[state.coin].decimals), W - 4, y - 2);
  }

  // Candles
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const x = i * candleW + gap / 2;
    const bullish = c.close >= c.open;
    const color = bullish ? "#00ff88" : "#ff2d55";

    // Wick
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const wickX = x + bodyW / 2;
    ctx.beginPath();
    ctx.moveTo(wickX, toY(c.high));
    ctx.lineTo(wickX, toY(c.low));
    ctx.stroke();

    // Body
    const bodyTop = toY(Math.max(c.open, c.close));
    const bodyBot = toY(Math.min(c.open, c.close));
    const bodyH = Math.max(1, bodyBot - bodyTop);
    ctx.fillStyle = color;
    ctx.fillRect(x, bodyTop, bodyW, bodyH);
  }

  // Current price line
  if (state.currentPrice > 0) {
    const y = toY(state.currentPrice);
    ctx.strokeStyle = "#00d4ff";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price tag
    ctx.fillStyle = "#00d4ff";
    ctx.fillRect(W - 70, y - 8, 70, 16);
    ctx.fillStyle = "#000";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(state.currentPrice.toFixed(COINS[state.coin].decimals), W - 4, y + 3);
  }

  // TP/SL lines on chart
  if (state.position) {
    const entry = state.position.entryPrice;
    const dir = state.position.direction === "long" ? 1 : -1;
    const tpPrice = entry * (1 + dir * state.tp / 100);
    const slPrice = entry * (1 - dir * state.sl / 100);

    // TP line
    const tpY = toY(tpPrice);
    $("tpLine").style.top = `${(tpY / H) * 100}%`;

    // SL line
    const slY = toY(slPrice);
    $("slLine").style.top = `${(slY / H) * 100}%`;

    // Entry line
    const entryY = toY(entry);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(0, entryY);
    ctx.lineTo(W, entryY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  state.chartAnimId = requestAnimationFrame(renderChart);
}

// ============================================
// Character Renderer (Canvas — pixel style)
// ============================================

function renderCharacter() {
  const canvas = $charCanvas;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  const ctx = charCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  ctx.clearRect(0, 0, W, H);

  state.charPhase += 0.05;
  const t = state.charPhase;

  const cx = W / 2;
  const cy = H * 0.55;

  if (state.charState === "boss") {
    drawBoss(ctx, cx, cy, t, W, H);
  } else {
    drawCharacter(ctx, cx, cy, t, W, H);
  }

  state.charAnimId = requestAnimationFrame(renderCharacter);
}

function drawCharacter(ctx, cx, cy, t, W, H) {
  const scale = Math.min(W, H) / 300;
  const breathe = Math.sin(t * 1.2) * 2;
  const bobY = cy + breathe;

  // Pixel-style character
  ctx.save();
  ctx.translate(cx, bobY);
  ctx.scale(scale, scale);

  // Colors based on state
  let bodyColor, eyeColor, auraColor;
  switch (state.charState) {
    case "long":
      bodyColor = "#00cc66"; eyeColor = "#00ff88"; auraColor = "rgba(0,255,136,0.1)";
      break;
    case "short":
      bodyColor = "#cc2244"; eyeColor = "#ff2d55"; auraColor = "rgba(255,45,85,0.1)";
      break;
    case "victory":
      bodyColor = "#ccaa00"; eyeColor = "#ffd700"; auraColor = "rgba(255,215,0,0.15)";
      break;
    case "defeat":
      bodyColor = "#661122"; eyeColor = "#ff2d55"; auraColor = "rgba(255,45,85,0.05)";
      break;
    default:
      bodyColor = "#0088cc"; eyeColor = "#00d4ff"; auraColor = "rgba(0,212,255,0.08)";
  }

  // Aura
  ctx.fillStyle = auraColor;
  ctx.beginPath();
  ctx.arc(0, 0, 80 + Math.sin(t * 2) * 5, 0, Math.PI * 2);
  ctx.fill();

  // Body (pixel blocks)
  ctx.fillStyle = bodyColor;
  // Torso
  fillBlock(ctx, -20, -30, 40, 50);
  // Head
  fillBlock(ctx, -15, -55, 30, 25);
  // Legs
  fillBlock(ctx, -18, 20, 14, 30);
  fillBlock(ctx, 4, 20, 14, 30);
  // Arms
  const armSwing = state.charState === "victory" ? Math.sin(t * 6) * 15 : Math.sin(t * 1.5) * 3;
  fillBlock(ctx, -32, -25 + armSwing, 12, 35);
  fillBlock(ctx, 20, -25 - armSwing, 12, 35);

  // Eyes
  ctx.fillStyle = eyeColor;
  const blink = Math.sin(t * 3) > 0.95 ? 0 : 4;
  fillBlock(ctx, -10, -48, 6, blink);
  fillBlock(ctx, 4, -48, 6, blink);

  // Core (chest glow)
  const coreGlow = 0.5 + Math.sin(t * 2) * 0.3;
  ctx.globalAlpha = coreGlow;
  ctx.fillStyle = eyeColor;
  fillBlock(ctx, -5, -15, 10, 10);
  ctx.globalAlpha = 1;

  // Weapon/shield based on position
  if (state.charState === "long") {
    // Sword up
    ctx.fillStyle = "#00ff88";
    fillBlock(ctx, 28, -55 + armSwing, 4, 30);
    fillBlock(ctx, 26, -58 + armSwing, 8, 4);
  } else if (state.charState === "short") {
    // Sword down
    ctx.fillStyle = "#ff2d55";
    fillBlock(ctx, -36, -5 + armSwing, 4, 30);
    fillBlock(ctx, -38, -8 + armSwing, 8, 4);
  }

  ctx.restore();

  // Ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 60 * scale, 40 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBoss(ctx, cx, cy, t, W, H) {
  const scale = Math.min(W, H) / 250;
  const pulse = Math.sin(t * 3) * 3;
  const bobY = cy + pulse;

  ctx.save();
  ctx.translate(cx, bobY);
  ctx.scale(scale, scale);

  // Boss aura (red pulsing)
  const auraSize = 100 + Math.sin(t * 2) * 15;
  ctx.fillStyle = `rgba(255,0,40,${0.05 + Math.sin(t * 2) * 0.03})`;
  ctx.beginPath();
  ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
  ctx.fill();

  // Cyberpunk boss body — larger, angular
  ctx.fillStyle = "#1a0a20";
  // Torso (wider)
  fillBlock(ctx, -30, -40, 60, 65);
  // Head (angular)
  fillBlock(ctx, -20, -70, 40, 30);
  // Shoulders (extended)
  fillBlock(ctx, -45, -38, 15, 20);
  fillBlock(ctx, 30, -38, 15, 20);
  // Legs
  fillBlock(ctx, -25, 25, 18, 40);
  fillBlock(ctx, 7, 25, 18, 40);

  // Glowing accents
  ctx.fillStyle = "#ff0044";
  // Eye visor
  fillBlock(ctx, -16, -62, 32, 6);
  // Chest core
  const coreFlash = 0.4 + Math.sin(t * 4) * 0.4;
  ctx.globalAlpha = coreFlash;
  fillBlock(ctx, -10, -20, 20, 20);
  ctx.globalAlpha = 1;
  // Arm lines
  ctx.fillStyle = "#ff0044";
  fillBlock(ctx, -43, -30, 11, 3);
  fillBlock(ctx, 32, -30, 11, 3);
  // Leg accents
  fillBlock(ctx, -23, 35, 14, 3);
  fillBlock(ctx, 9, 35, 14, 3);

  // Horns
  ctx.fillStyle = "#440022";
  fillBlock(ctx, -24, -82, 6, 15);
  fillBlock(ctx, 18, -82, 6, 15);

  ctx.restore();
}

function fillBlock(ctx, x, y, w, h) {
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// ============================================
// Character state
// ============================================

function setCharState(s) {
  state.charState = s;
  const statusEl = $("battleStatus");
  const label = statusEl.querySelector(".status-label");

  switch (s) {
    case "idle":
      statusEl.className = "battle-status idle";
      label.textContent = "IDLE";
      break;
    case "long":
      statusEl.className = "battle-status long";
      label.textContent = "LONG POSITION";
      break;
    case "short":
      statusEl.className = "battle-status short";
      label.textContent = "SHORT POSITION";
      break;
    case "victory":
      statusEl.className = "battle-status victory";
      label.textContent = "TAKE PROFIT";
      break;
    case "defeat":
      statusEl.className = "battle-status defeat";
      label.textContent = "STOP LOSS";
      break;
  }
}

// ============================================
// Event Log
// ============================================

function addLog(type, msg) {
  const el = $("eventLog");
  const entry = document.createElement("div");
  entry.className = "log-entry " + type;
  const time = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  entry.textContent = `[${time}] ${msg}`;
  el.appendChild(entry);
  el.scrollTop = el.scrollHeight;

  // Keep last 100 entries
  while (el.children.length > 100) {
    el.removeChild(el.firstChild);
  }
}

// ============================================
// UI Bindings
// ============================================

function initUI() {
  // Coin tabs
  for (const btn of $("coinTabs").querySelectorAll(".coin-tab")) {
    btn.addEventListener("click", () => {
      if (state.position) {
        addLog("system", "Close position before switching coin");
        return;
      }
      $("coinTabs").querySelectorAll(".coin-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.coin = btn.dataset.coin;
      state.candles = [];
      connectWebSocket();
    });
  }

  // Timeframe tabs
  for (const btn of $("tfTabs").querySelectorAll(".tf-tab")) {
    btn.addEventListener("click", () => {
      $("tfTabs").querySelectorAll(".tf-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.timeframe = btn.dataset.tf;
      state.candles = [];
      connectWebSocket();
    });
  }

  // Leverage buttons
  for (const btn of $("leverageBtns").querySelectorAll(".lev-btn")) {
    btn.addEventListener("click", () => {
      if (state.position) return;
      $("leverageBtns").querySelectorAll(".lev-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.leverage = parseInt(btn.dataset.lev);
    });
  }

  // TP/SL inputs
  $("tpInput").addEventListener("change", (e) => {
    state.tp = parseFloat(e.target.value) || 3;
    if (state.position) updateTPSLLines();
  });
  $("slInput").addEventListener("change", (e) => {
    state.sl = parseFloat(e.target.value) || 1.5;
    if (state.position) updateTPSLLines();
  });

  // Trade buttons
  $("btnLong").addEventListener("click", () => openPosition("long"));
  $("btnShort").addEventListener("click", () => openPosition("short"));
  $("btnClose").addEventListener("click", () => closePosition("manual"));

  // Handle resize
  window.addEventListener("resize", () => {
    // Canvases will resize on next render frame
  });
}

// ============================================
// Init
// ============================================

function init() {
  initUI();
  connectWebSocket();
  renderChart();
  renderCharacter();
}

init();
