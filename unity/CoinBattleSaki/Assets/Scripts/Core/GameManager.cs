// ============================================
// CoinBattle Saki — Game Manager
// Central orchestrator for all game systems
// ============================================

using System;
using System.Collections.Generic;
using UnityEngine;
using CoinBattleSaki.Core;
using CoinBattleSaki.Market;
using CoinBattleSaki.Network;
using CoinBattleSaki.Animation;

namespace CoinBattleSaki.Core
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("References")]
        [SerializeField] private UIManager uiManager;
        [SerializeField] private CharacterAnimator characterAnimator;
        [SerializeField] private ChartRenderer chartRenderer;

        [Header("Settings")]
        [SerializeField] private float tickInterval = 1f;
        [SerializeField] private int maxBattleTicks = 30;

        // State
        public BattleState CurrentBattle { get; private set; }
        public float CurrentPrice { get; private set; }
        public List<Candlestick> LiveCandles { get; private set; } = new();
        public CharacterState PlayerCharState { get; private set; } = CharacterState.Idle;

        // Player position
        public TradePosition PlayerPosition { get; private set; }
        public float PlayerPnL { get; private set; }
        public int PlayerLeverage { get; set; } = 2;
        public float TpPercent { get; set; } = 3f;
        public float SlPercent { get; set; } = 1.5f;
        public int ProfitStreak { get; private set; }
        public bool IsAwakening { get; private set; }

        // Events
        public event Action<float> OnPriceUpdated;
        public event Action<Candlestick> OnCandleUpdated;
        public event Action<float> OnPnLChanged;
        public event Action<CharacterState> OnCharacterStateChanged;
        public event Action<string> OnSignalEvent;
        public event Action OnAwakeningTriggered;
        public event Action OnAwakeningEnded;
        public event Action<bool> OnPositionClosed; // true = profit

        private BinanceWebSocket _ws;
        private float _tickTimer;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            _ws = gameObject.AddComponent<BinanceWebSocket>();
            _ws.OnKlineReceived += HandleKline;
            _ws.Connect("btcusdt", "5m");
        }

        private void Update()
        {
            if (PlayerPosition != null)
            {
                UpdatePlayerPnL();
            }
        }

        // ── Price Feed ──

        private void HandleKline(Candlestick candle)
        {
            CurrentPrice = candle.close;

            // Update candle list
            if (LiveCandles.Count > 0 && LiveCandles[^1].time == candle.time)
            {
                LiveCandles[^1] = candle;
            }
            else
            {
                LiveCandles.Add(candle);
                if (LiveCandles.Count > 120) LiveCandles.RemoveAt(0);
            }

            OnPriceUpdated?.Invoke(CurrentPrice);
            OnCandleUpdated?.Invoke(candle);

            // Check signals
            CheckSignalEvents(candle);
        }

        // ── Trading ──

        public void OpenLong()
        {
            if (PlayerPosition != null || CurrentPrice <= 0) return;
            OpenPosition(TradeDirection.Long);
        }

        public void OpenShort()
        {
            if (PlayerPosition != null || CurrentPrice <= 0) return;
            OpenPosition(TradeDirection.Short);
        }

        private void OpenPosition(TradeDirection direction)
        {
            float size = 100f; // $100 notional

            PlayerPosition = new TradePosition
            {
                direction = direction,
                entryPrice = CurrentPrice,
                size = size,
                stopLoss = direction == TradeDirection.Long
                    ? CurrentPrice * (1f - SlPercent / 100f)
                    : CurrentPrice * (1f + SlPercent / 100f),
                takeProfit = direction == TradeDirection.Long
                    ? CurrentPrice * (1f + TpPercent / 100f)
                    : CurrentPrice * (1f - TpPercent / 100f),
            };

            PlayerPnL = 0f;
            SetCharacterState(direction == TradeDirection.Long ? CharacterState.Long : CharacterState.Short);

            uiManager?.LogEvent("trade", $"Opened {direction} @ {CurrentPrice:F2} ({PlayerLeverage}x)");
            uiManager?.UpdatePositionUI(PlayerPosition, PlayerLeverage);
        }

        public void ClosePosition()
        {
            if (PlayerPosition == null) return;
            ClosePositionInternal("Manual close");
        }

        private void ClosePositionInternal(string reason)
        {
            bool isProfit = PlayerPnL >= 0;
            string label = $"Closed {PlayerPosition.direction} — P&L: {(isProfit ? "+" : "")}{PlayerPnL:F2} ({reason})";
            uiManager?.LogEvent(isProfit ? "win" : "loss", label);

            if (isProfit)
            {
                ProfitStreak++;
                CheckAwakeningMode();
            }
            else
            {
                ProfitStreak = 0;
                EndAwakening();
            }

            OnPositionClosed?.Invoke(isProfit);
            PlayerPosition = null;
            PlayerPnL = 0f;
            SetCharacterState(CharacterState.Idle);

            uiManager?.ClearPositionUI();
        }

        private void UpdatePlayerPnL()
        {
            if (PlayerPosition == null || CurrentPrice <= 0) return;

            float move = (CurrentPrice - PlayerPosition.entryPrice) / PlayerPosition.entryPrice;
            float directional = PlayerPosition.direction == TradeDirection.Long ? move : -move;
            PlayerPnL = directional * PlayerPosition.size * PlayerLeverage;

            OnPnLChanged?.Invoke(PlayerPnL);

            // Check TP/SL
            float pctMove = directional * 100f;
            if (pctMove >= TpPercent)
            {
                SetCharacterState(CharacterState.Victory);
                characterAnimator?.TriggerVictory();
                ClosePositionInternal("TP hit");
                return;
            }

            if (pctMove <= -SlPercent)
            {
                SetCharacterState(CharacterState.Defeat);
                characterAnimator?.TriggerDefeat();
                ClosePositionInternal("SL hit");
                return;
            }

            // Approaching TP → attack animation
            if (pctMove > 0 && pctMove >= TpPercent * 0.5f)
            {
                characterAnimator?.TriggerAttack();
            }
            // Approaching SL → damage animation
            else if (pctMove < 0 && pctMove <= -SlPercent * 0.5f)
            {
                characterAnimator?.TriggerDamage();
            }
        }

        // ── Awakening Mode ──

        private void CheckAwakeningMode()
        {
            if (ProfitStreak >= 3 && !IsAwakening)
            {
                TriggerAwakening();
            }
        }

        private void TriggerAwakening()
        {
            IsAwakening = true;
            SetCharacterState(CharacterState.Awakening);
            OnAwakeningTriggered?.Invoke();
            uiManager?.LogEvent("signal", "AWAKENING MODE ACTIVATED!");
            characterAnimator?.TriggerAwakening();
        }

        private void EndAwakening()
        {
            if (!IsAwakening) return;
            IsAwakening = false;
            OnAwakeningEnded?.Invoke();
        }

        // ── Signal Detection ──

        private void CheckSignalEvents(Candlestick candle)
        {
            if (!candle.closed || LiveCandles.Count < 5) return;

            float avgRange = 0f;
            int count = Mathf.Min(20, LiveCandles.Count);
            for (int i = LiveCandles.Count - count; i < LiveCandles.Count; i++)
            {
                avgRange += LiveCandles[i].Body;
            }
            avgRange /= count;

            float thisRange = candle.Body;

            if (thisRange > avgRange * 3f)
            {
                OnSignalEvent?.Invoke("EXTREME SIGNAL");
                uiManager?.LogEvent("signal", $"EXTREME: Range {thisRange:F2} vs avg {avgRange:F2}");
                characterAnimator?.TriggerSignalFlash();
            }
            else if (thisRange > avgRange * 2f)
            {
                OnSignalEvent?.Invoke("SIGNAL");
                uiManager?.LogEvent("signal", $"Signal: Large move detected");
            }

            // RSI signal
            if (LiveCandles.Count >= 14)
            {
                float rsi = CalculateRSI(14);
                if (rsi < 25f)
                {
                    OnSignalEvent?.Invoke("RSI OVERSOLD");
                    uiManager?.ShowSignalIcon("RSI", Color.green);
                }
                else if (rsi > 75f)
                {
                    OnSignalEvent?.Invoke("RSI OVERBOUGHT");
                    uiManager?.ShowSignalIcon("RSI", Color.red);
                }
            }

            // MACD signal
            if (LiveCandles.Count >= 26)
            {
                var (macd, signal) = CalculateMACD();
                if (Mathf.Abs(macd - signal) > avgRange * 0.5f)
                {
                    bool bullish = macd > signal;
                    OnSignalEvent?.Invoke(bullish ? "MACD BUY" : "MACD SELL");
                    uiManager?.ShowSignalIcon("MACD", bullish ? Color.green : Color.red);
                }
            }
        }

        private float CalculateRSI(int period)
        {
            if (LiveCandles.Count < period + 1) return 50f;

            float gains = 0f, losses = 0f;
            for (int i = LiveCandles.Count - period; i < LiveCandles.Count; i++)
            {
                float diff = LiveCandles[i].close - LiveCandles[i - 1].close;
                if (diff > 0) gains += diff;
                else losses -= diff;
            }

            float avgGain = gains / period;
            float avgLoss = losses / period;
            if (avgLoss == 0) return 100f;
            float rs = avgGain / avgLoss;
            return 100f - 100f / (1f + rs);
        }

        private (float macd, float signal) CalculateMACD()
        {
            float ema12 = EMA(12);
            float ema26 = EMA(26);
            float macd = ema12 - ema26;
            // Simplified signal line (use 9-period SMA of recent closes as proxy)
            float signal = 0f;
            int signalPeriod = Mathf.Min(9, LiveCandles.Count);
            for (int i = LiveCandles.Count - signalPeriod; i < LiveCandles.Count; i++)
            {
                signal += LiveCandles[i].close;
            }
            signal /= signalPeriod;
            signal = ema12 - signal; // approximate
            return (macd, signal);
        }

        private float EMA(int period)
        {
            if (LiveCandles.Count < period) return LiveCandles[^1].close;
            float k = 2f / (period + 1);
            float ema = LiveCandles[LiveCandles.Count - period].close;
            for (int i = LiveCandles.Count - period + 1; i < LiveCandles.Count; i++)
            {
                ema = LiveCandles[i].close * k + ema * (1f - k);
            }
            return ema;
        }

        // ── Character State ──

        private void SetCharacterState(CharacterState state)
        {
            PlayerCharState = state;
            OnCharacterStateChanged?.Invoke(state);
        }

        // ── Cleanup ──

        private void OnDestroy()
        {
            if (_ws != null) _ws.OnKlineReceived -= HandleKline;
        }
    }
}
