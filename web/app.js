// ============================================
// CoinBattle Saki — Prototype v0.1
// Real-time market-driven battle simulation
// ============================================
// Deterministic RNG for reproducibility (set DETERMINISTIC=false for live randomness)
const DETERMINISTIC = true;
const SEED = [0x12345678, 0x90abcdef, 0xcafebabe, 0xdeadbeef];

// --- Seeded RNG (SFC32) ---
function sfc32(a, b, c, d) {
  return function () {
    a |= 0; b |= 0; c |= 0; d |= 0;
    var t = (a + b) | 0; a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0; t = (t + d) | 0; c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

const rng = DETERMINISTIC
  ? sfc32(...SEED)
  : () => Math.random();

// ============================================
// DOM References
// ============================================
const $log = document.getElementById('log');
const $tickVal = document.getElementById('tickVal');
const $volVal = document.getElementById('volVal');
const $stageInd = document.getElementById('stageIndicator');
const $gaugeLeft = document.getElementById('gaugeLeft');
const $gaugeRight = document.getElementById('gaugeRight');
const $gaugeMid = document.getElementById('gaugeMid');
const $stageLabel = document.getElementById('stageLabel');
const $notification = document.getElementById('notification');
const $encounterBtn = document.getElementById('encounterBtn');
const $battleTimer = document.getElementById('battleTimer');
const $battleTime = document.getElementById('battleTime');
const $tradeNum = document.getElementById('tradeNum');
const $leftPnl = document.getElementById('leftPnl').querySelector('span');
const $rightPnl = document.getElementById('rightPnl').querySelector('span');
const $resultOverlay = document.getElementById('resultOverlay');
const $resultTitle = document.getElementById('resultTitle');
const $resultStats = document.getElementById('resultStats');
const $particleCanvas = document.getElementById('particleCanvas');
const particleCtx = $particleCanvas.getContext('2d');

// ============================================
// Audio Engine (Web Audio API synth)
// ============================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playStageCue(stage) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  // Higher stages = higher pitch + more intense
  const baseFreq = 220 + stage * 60;
  osc.type = stage >= 6 ? 'sawtooth' : stage >= 4 ? 'triangle' : 'sine';
  osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}

function playEncounterCue() {
  if (!audioCtx) return;
  [0, 0.1, 0.2].forEach((delay, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(440 + i * 110, audioCtx.currentTime + delay);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.15);
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + 0.15);
  });
}

function playFinishCue(isWin) {
  if (!audioCtx) return;
  const notes = isWin ? [523, 659, 784] : [330, 277, 220];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = isWin ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.2);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime + i * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.2 + 0.4);
    osc.start(audioCtx.currentTime + i * 0.2);
    osc.stop(audioCtx.currentTime + i * 0.2 + 0.4);
  });
}

// ============================================
// Particle System
// ============================================
const particles = [];

function resizeCanvas() {
  $particleCanvas.width = window.innerWidth;
  $particleCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function spawnParticles(x, y, count, color, speed) {
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const vel = speed * (0.5 + rng() * 0.5);
    particles.push({
      x, y,
      vx: Math.cos(angle) * vel,
      vy: Math.sin(angle) * vel,
      life: 1.0,
      decay: 0.01 + rng() * 0.03,
      size: 2 + rng() * 4,
      color
    });
  }
}

function spawnBurst(stage) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const colors = ['#00d4ff', '#00ff88', '#ffd700', '#ff2d55', '#aa44ff'];
  const count = Math.min(stage * 8, 64);
  const speed = 2 + stage * 1.5;
  spawnParticles(cx, cy, count, colors[stage % colors.length], speed);
}

function updateParticles() {
  particleCtx.clearRect(0, 0, $particleCanvas.width, $particleCanvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.05; // gravity
    p.life -= p.decay;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    particleCtx.globalAlpha = p.life;
    particleCtx.fillStyle = p.color;
    particleCtx.beginPath();
    particleCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    particleCtx.fill();
  }
  particleCtx.globalAlpha = 1;
}

// ============================================
// Logging
// ============================================
function log(s) {
  const time = new Date().toLocaleTimeString('ja-JP');
  $log.textContent = `[${time}] ${s}\n` + $log.textContent;
  if ($log.textContent.length > 5000) {
    $log.textContent = $log.textContent.slice(0, 4000);
  }
}

// ============================================
// Stage Configuration
// ============================================
const STAGES = [
  { id: 1, name: 'S1 凪',    nameEn: 'Calm',      color: '#4488aa' },
  { id: 2, name: 'S2 気配',   nameEn: 'Signal',    color: '#44aacc' },
  { id: 3, name: 'S3 胎動',   nameEn: 'Stir',      color: '#44ccaa' },
  { id: 4, name: 'S4 激突',   nameEn: 'Clash',     color: '#aacc44' },
  { id: 5, name: 'S5 激アツ', nameEn: 'Heat',      color: '#ffaa00' },
  { id: 6, name: 'S6 覚醒',   nameEn: 'Awakening', color: '#ff6600' },
  { id: 7, name: 'S7 臨界',   nameEn: 'Critical',  color: '#ff2d55' },
  { id: 8, name: 'S8 終焉',   nameEn: 'Finale',    color: '#aa00ff' },
];

// ============================================
// Market Simulation
// ============================================
// HOOK: Replace this section with Binance WebSocket for live data
// const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
// ws.onmessage = (e) => { const d = JSON.parse(e.data); price = parseFloat(d.p); }

let time = 0;
let price = 4500000; // BTC/JPY approx
let vol = 5000;
let priceHistory = [];
const HISTORY_LEN = 60;

function updateMarket() {
  time++;

  // Random walk with volatility clustering and occasional spikes
  const spikeChance = 0.015;
  const spike = (rng() < spikeChance)
    ? (rng() < 0.5 ? -1 : 1) * (20000 + rng() * 80000)
    : 0;

  const drift = (rng() - 0.5) * vol * 0.4 + spike;
  price = Math.max(1000000, price + drift);

  // Volatility clustering (GARCH-like)
  vol = Math.max(1000, Math.abs(drift) * 0.3 + vol * 0.95);

  // Track history for ATR proxy
  priceHistory.push(price);
  if (priceHistory.length > HISTORY_LEN) priceHistory.shift();

  // ATR-like volatility proxy
  let atr = 0;
  if (priceHistory.length > 1) {
    for (let i = 1; i < priceHistory.length; i++) {
      atr += Math.abs(priceHistory[i] - priceHistory[i - 1]);
    }
    atr /= (priceHistory.length - 1);
  }

  // Map volatility to stage (S1-S8)
  const sigma = Math.max(1, Math.min(8, Math.floor(atr / 8000) + 1));

  // Update HUD
  $tickVal.textContent = price.toLocaleString('ja-JP', {
    minimumFractionDigits: 0, maximumFractionDigits: 0
  });
  $volVal.textContent = atr.toFixed(0);
  $stageInd.textContent = 'S' + sigma;

  return { price, vol, sigma, atr, drift };
}

// ============================================
// Battle State
// ============================================
let inBattle = false;
let battleTick = 0;
let dominance = 0.5;
let leftPnl = 0, rightPnl = 0;
let entryPrice = 0;
let maxDrawdown = 0;
let peakPnl = 0;
let trades = 0;
let currentStage = 1;
let prevStage = 1;

// ============================================
// Battle Logic
// ============================================
function beginEncounter() {
  if (inBattle) return;
  initAudio();
  playEncounterCue();

  inBattle = true;
  battleTick = 0;
  dominance = 0.5;
  leftPnl = 0; rightPnl = 0;
  entryPrice = price;
  maxDrawdown = 0; peakPnl = 0; trades = 0;

  // Show notification
  $notification.classList.remove('hidden');
  setTimeout(() => $notification.classList.add('hidden'), 2200);

  // Show battle timer
  $battleTimer.classList.remove('hidden');
  $battleTime.textContent = '0';

  // Spawn initial particles
  spawnBurst(3);

  log('ENCOUNTER! Bots entering positions...');
  log(`Entry price: ¥${price.toLocaleString()}`);
}

function stepBattle(mkt) {
  battleTick++;
  $battleTime.textContent = battleTick;

  // Simulate trades
  if (rng() < 0.3) {
    trades++;
    $tradeNum.textContent = trades;
  }

  // Update dominance based on price movement
  const priceDelta = (mkt.price - entryPrice) / entryPrice;
  const volFactor = mkt.sigma / 4;
  const noise = (rng() - 0.48) * 0.03 * volFactor;
  dominance += priceDelta * 0.1 + noise;
  dominance = Math.max(0.02, Math.min(0.98, dominance));

  // Update gauge
  const leftPct = dominance * 100;
  $gaugeLeft.style.width = leftPct + '%';
  $gaugeRight.style.width = (100 - leftPct) + '%';
  $gaugeMid.style.left = leftPct + '%';

  // P&L simulation
  leftPnl = (dominance - 0.5) * 2 * mkt.atr * (battleTick / 10);
  rightPnl = -leftPnl;
  peakPnl = Math.max(peakPnl, Math.abs(leftPnl));
  maxDrawdown = Math.max(maxDrawdown, peakPnl - Math.abs(leftPnl));

  $leftPnl.textContent = (leftPnl >= 0 ? '+' : '') + leftPnl.toFixed(0);
  $leftPnl.parentElement.style.color = leftPnl >= 0 ? '#00ff88' : '#ff2d55';
  $rightPnl.textContent = (rightPnl >= 0 ? '+' : '') + rightPnl.toFixed(0);
  $rightPnl.parentElement.style.color = rightPnl >= 0 ? '#00ff88' : '#ff2d55';

  // Stage transitions with cinematic effects
  currentStage = mkt.sigma;
  if (currentStage !== prevStage) {
    onStageChange(currentStage, prevStage);
    prevStage = currentStage;
  }

  // Periodic particle bursts at high stages
  if (currentStage >= 5 && battleTick % 3 === 0) {
    spawnBurst(currentStage);
  }

  // Apply stage CSS classes
  document.body.className = '';
  if (currentStage >= 5) document.body.classList.add('stage-' + currentStage);
  if (currentStage >= 6) document.body.classList.add('bloom');

  // End condition: 20 ticks
  if (battleTick >= 20) {
    endBattle();
  }
}

function onStageChange(newStage, oldStage) {
  const stage = STAGES[newStage - 1];
  $stageLabel.textContent = stage.name;
  $stageLabel.classList.add('flash');
  setTimeout(() => $stageLabel.classList.remove('flash'), 500);

  playStageCue(newStage);
  spawnBurst(newStage);

  // Camera zoom effect at high stages
  const scale = 1 + (newStage - 4) * 0.01;
  if (newStage >= 4) {
    document.getElementById('battleScreen').style.transform = `scale(${scale})`;
  } else {
    document.getElementById('battleScreen').style.transform = 'none';
  }

  log(`Stage -> ${stage.name} (${stage.nameEn})`);
}

function endBattle() {
  inBattle = false;
  $battleTimer.classList.add('hidden');

  // Remove stage effects
  document.body.className = '';
  document.body.style.filter = 'none';
  document.getElementById('battleScreen').style.transform = 'none';

  const winner = dominance > 0.5 ? 'Left (雷狐)' : 'Right (ドバイ王子)';
  const isLeftWin = dominance > 0.5;
  const winnerPnl = Math.abs(isLeftWin ? leftPnl : rightPnl);
  const isProfit = true; // Winner always profits in sim

  // Result: 利確 (take profit) or ロスカ (stop-loss / KO)
  const resultType = winnerPnl > 5000 ? '利確 TAKE PROFIT' : 'ロスカ KO';
  const isFinish = winnerPnl > 5000;

  playFinishCue(isFinish);

  // Big particle burst
  for (let i = 0; i < 5; i++) {
    setTimeout(() => spawnBurst(8), i * 100);
  }

  // Show result overlay
  $resultOverlay.classList.remove('hidden');
  $resultTitle.className = isFinish ? 'result-win' : 'result-ko';
  $resultTitle.textContent = `${resultType}`;
  $resultStats.innerHTML = `
    Winner: ${winner}<br>
    P&L: ¥${winnerPnl.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}<br>
    Max Drawdown: ¥${maxDrawdown.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}<br>
    Trades: ${trades}<br>
    Duration: ${battleTick}s
  `;

  setTimeout(() => $resultOverlay.classList.add('hidden'), 4000);

  // Console metrics logging (for acceptance criteria)
  const metrics = {
    winner,
    profit: winnerPnl.toFixed(0),
    maxDrawdown: maxDrawdown.toFixed(0),
    trades,
    duration: battleTick,
    finalDominance: dominance.toFixed(3),
    entryPrice: entryPrice.toFixed(0),
    exitPrice: price.toFixed(0),
  };
  console.log('[CoinBattle Metrics]', JSON.stringify(metrics, null, 2));
  log(`RESULT: ${resultType} | Winner: ${winner} | P&L: ¥${winnerPnl.toFixed(0)} | DD: ¥${maxDrawdown.toFixed(0)} | Trades: ${trades}`);
}

// ============================================
// Hero SVG Generation (Cinematic Placeholders)
// ============================================
function drawHero(svgEl, config) {
  const { primary, secondary, name, symbol } = config;
  svgEl.innerHTML = `
    <defs>
      <linearGradient id="bg_${name}" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stop-color="${primary}" stop-opacity="0.9"/>
        <stop offset="50%" stop-color="${primary}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#050d1a" stop-opacity="1"/>
      </linearGradient>
      <radialGradient id="glow_${name}" cx="0.5" cy="0.4" r="0.5">
        <stop offset="0%" stop-color="${primary}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
      <filter id="shadow_${name}">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${primary}" flood-opacity="0.4"/>
      </filter>
      <clipPath id="heroClip_${name}">
        <rect x="10" y="10" width="380" height="580" rx="16"/>
      </clipPath>
    </defs>

    <!-- Background -->
    <rect x="10" y="10" width="380" height="580" rx="16"
          fill="url(#bg_${name})" stroke="${primary}" stroke-opacity="0.2" stroke-width="1"/>

    <!-- Inner glow -->
    <ellipse cx="200" cy="250" rx="180" ry="200" fill="url(#glow_${name})" clip-path="url(#heroClip_${name})"/>

    <!-- Hero silhouette (dramatic geometric) -->
    <g filter="url(#shadow_${name})" clip-path="url(#heroClip_${name})">
      <!-- Body -->
      <path d="M140,520 L160,320 C170,280 180,260 200,240 C220,260 230,280 240,320 L260,520 Z"
            fill="${primary}" fill-opacity="0.6"/>
      <!-- Shoulders -->
      <path d="M120,380 C140,340 180,300 200,290 C220,300 260,340 280,380 L260,400 L140,400 Z"
            fill="${primary}" fill-opacity="0.4"/>
      <!-- Head -->
      <ellipse cx="200" cy="220" rx="50" ry="60" fill="${secondary}" fill-opacity="0.5"/>
      <!-- Eyes (glowing) -->
      <ellipse cx="183" cy="215" rx="8" ry="4" fill="${primary}" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="217" cy="215" rx="8" ry="4" fill="${primary}" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite"/>
      </ellipse>
    </g>

    <!-- Symbol overlay (phoenix / dragon etc) -->
    <g opacity="0.12" transform="translate(200,200)">
      ${symbol}
    </g>

    <!-- Energy lines -->
    <line x1="40" y1="500" x2="200" y2="250" stroke="${primary}" stroke-opacity="0.08" stroke-width="1">
      <animate attributeName="stroke-opacity" values="0.08;0.2;0.08" dur="3s" repeatCount="indefinite"/>
    </line>
    <line x1="360" y1="500" x2="200" y2="250" stroke="${primary}" stroke-opacity="0.08" stroke-width="1">
      <animate attributeName="stroke-opacity" values="0.08;0.2;0.08" dur="3s" repeatCount="indefinite" begin="1.5s"/>
    </line>

    <!-- Name plate -->
    <rect x="60" y="540" width="280" height="36" rx="6" fill="rgba(0,0,0,0.5)"/>
    <text x="200" y="564" fill="${primary}" font-size="16" font-weight="700"
          text-anchor="middle" font-family="Inter, system-ui">${name}</text>

    <!-- Corner accents -->
    <path d="M20,30 L20,60" stroke="${primary}" stroke-opacity="0.3" stroke-width="2"/>
    <path d="M20,30 L50,30" stroke="${primary}" stroke-opacity="0.3" stroke-width="2"/>
    <path d="M380,570 L380,540" stroke="${primary}" stroke-opacity="0.3" stroke-width="2"/>
    <path d="M380,570 L350,570" stroke="${primary}" stroke-opacity="0.3" stroke-width="2"/>
  `;
}

// Phoenix symbol for left hero
const phoenixSVG = `
  <path d="M0,-80 C30,-60 40,-20 20,20 C40,0 60,-30 80,-50
           C60,-20 50,10 30,40 C50,20 70,10 90,0
           C70,20 40,50 0,70
           C-40,50 -70,20 -90,0
           C-70,10 -50,20 -30,40
           C-50,10 -60,-20 -80,-50
           C-60,-30 -40,0 -20,20
           C-40,-20 -30,-60 0,-80 Z"
        fill="currentColor"/>
`;

// Dragon symbol for right hero
const dragonSVG = `
  <path d="M0,-70 C20,-60 50,-40 60,-10 C65,10 55,30 40,45
           L50,35 C60,40 70,50 65,65
           C55,55 40,50 30,55 L20,70
           C10,60 0,50 -10,55
           C-20,50 -30,55 -40,65
           C-45,50 -35,40 -25,35
           L-15,45 C-30,30 -40,10 -35,-10
           C-25,-40 0,-60 0,-70 Z"
        fill="currentColor"/>
`;

drawHero(document.getElementById('leftSVG'), {
  primary: '#00d4ff',
  secondary: '#0a2a4a',
  name: '雷狐 RAIKO',
  symbol: phoenixSVG
});

drawHero(document.getElementById('rightSVG'), {
  primary: '#ffd700',
  secondary: '#3a2a0a',
  name: 'ドバイ王子 DUBAI PRINCE',
  symbol: dragonSVG
});

// ============================================
// Main Loop (1-second ticks)
// ============================================
let lastTick = 0;

function gameLoop(timestamp) {
  updateParticles();

  // 1-second market ticks
  if (timestamp - lastTick >= 1000) {
    lastTick = timestamp;
    const mkt = updateMarket();

    if (inBattle) {
      stepBattle(mkt);
    }

    // Auto-encounter at high volatility
    if (!inBattle && mkt.sigma >= 6 && rng() > 0.7) {
      beginEncounter();
    }

    // Update stage label when not in battle
    if (!inBattle) {
      const stage = STAGES[mkt.sigma - 1];
      $stageLabel.textContent = stage.name;
    }
  }

  requestAnimationFrame(gameLoop);
}

// ============================================
// Event Listeners
// ============================================
$encounterBtn.addEventListener('click', () => {
  initAudio();
  beginEncounter();
});

$resultOverlay.addEventListener('click', () => {
  $resultOverlay.classList.add('hidden');
});

// ============================================
// Boot
// ============================================
log('CoinBattle Saki Prototype v0.1 loaded.');
log('Press "Push Encounter" to simulate a battle.');
log('Market simulation running (deterministic seed).');
requestAnimationFrame(gameLoop);
