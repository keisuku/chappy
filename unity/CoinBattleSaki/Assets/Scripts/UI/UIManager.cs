// ============================================
// UI Manager
// Portrait mobile layout for CoinBattle Saki
//
// Layout (top to bottom):
//   [Mini Chart + Signal Icons]  ~25%
//   [Anime Character]            ~30%
//   [PnL + Position Info]        ~10%
//   [LONG | LEV | SHORT | CLOSE] ~15%
//   [Event Log]                  ~20%
// ============================================

using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using CoinBattleSaki.Core;
using CoinBattleSaki.Market;
using CoinBattleSaki.Animation;

namespace CoinBattleSaki.Core
{
    public class UIManager : MonoBehaviour
    {
        [Header("Top Bar")]
        [SerializeField] private TextMeshProUGUI priceLabel;
        [SerializeField] private TextMeshProUGUI priceChangeLabel;
        [SerializeField] private TextMeshProUGUI pairLabel;

        [Header("Chart")]
        [SerializeField] private ChartRenderer chartRenderer;

        [Header("Signal Icons")]
        [SerializeField] private RectTransform signalIconContainer;
        [SerializeField] private GameObject signalIconPrefab;

        [Header("PnL Display")]
        [SerializeField] private TextMeshProUGUI pnlLabel;
        [SerializeField] private Image pnlBackground;

        [Header("Position Info")]
        [SerializeField] private GameObject positionPanel;
        [SerializeField] private TextMeshProUGUI posDirectionLabel;
        [SerializeField] private TextMeshProUGUI posEntryLabel;
        [SerializeField] private TextMeshProUGUI posSizeLabel;

        [Header("Leverage")]
        [SerializeField] private TextMeshProUGUI leverageLabel;
        [SerializeField] private Button leverageUpBtn;
        [SerializeField] private Button leverageDownBtn;

        [Header("Action Buttons")]
        [SerializeField] private Button longButton;
        [SerializeField] private Button shortButton;
        [SerializeField] private Button closeButton;
        [SerializeField] private Button leverageButton;
        [SerializeField] private TextMeshProUGUI longBtnText;
        [SerializeField] private TextMeshProUGUI shortBtnText;

        [Header("Event Log")]
        [SerializeField] private ScrollRect eventLogScroll;
        [SerializeField] private TextMeshProUGUI eventLogText;

        [Header("Colors")]
        [SerializeField] private Color greenColor = new(0f, 1f, 0.53f);
        [SerializeField] private Color redColor = new(1f, 0.18f, 0.33f);
        [SerializeField] private Color goldColor = new(1f, 0.84f, 0f);
        [SerializeField] private Color accentColor = new(0f, 0.83f, 1f);

        private readonly int[] _leverageOptions = { 1, 2, 5, 10, 20 };
        private int _leverageIndex = 1; // starts at 2x
        private readonly List<string> _logEntries = new();
        private const int MaxLogEntries = 50;
        private readonly Dictionary<string, SignalIconUI> _activeSignals = new();

        private GameManager _gm;

        private void Start()
        {
            _gm = GameManager.Instance;

            // Button bindings
            longButton?.onClick.AddListener(() => _gm.OpenLong());
            shortButton?.onClick.AddListener(() => _gm.OpenShort());
            closeButton?.onClick.AddListener(() => _gm.ClosePosition());
            leverageButton?.onClick.AddListener(CycleLeverage);
            leverageUpBtn?.onClick.AddListener(LeverageUp);
            leverageDownBtn?.onClick.AddListener(LeverageDown);

            // Subscribe to events
            _gm.OnPriceUpdated += UpdatePrice;
            _gm.OnPnLChanged += UpdatePnL;
            _gm.OnCharacterStateChanged += OnStateChanged;
            _gm.OnCandleUpdated += OnCandle;
            _gm.OnAwakeningTriggered += OnAwakening;
            _gm.OnAwakeningEnded += OnAwakeningEnd;

            // Initial state
            UpdateLeverageDisplay();
            positionPanel?.SetActive(false);
            closeButton?.gameObject.SetActive(false);

            LogEvent("system", "CoinBattle Saki ready. Open a position!");
        }

        // ── Price ──

        private void UpdatePrice(float price)
        {
            if (priceLabel != null)
                priceLabel.text = price.ToString("F2");

            // Render chart each frame with current data
            chartRenderer?.Render(
                _gm.LiveCandles,
                _gm.CurrentPrice,
                _gm.PlayerPosition,
                _gm.TpPercent,
                _gm.SlPercent
            );
        }

        private void OnCandle(Candlestick candle)
        {
            // Price change display
            if (_gm.LiveCandles.Count >= 2 && priceChangeLabel != null)
            {
                var prev = _gm.LiveCandles[^2];
                float change = (candle.close - prev.close) / prev.close * 100f;
                priceChangeLabel.text = $"{(change >= 0 ? "+" : "")}{change:F2}%";
                priceChangeLabel.color = change >= 0 ? greenColor : redColor;
            }
        }

        // ── PnL ──

        private void UpdatePnL(float pnl)
        {
            if (pnlLabel != null)
            {
                pnlLabel.text = $"P&L: {(pnl >= 0 ? "+" : "")}{pnl:F2}";
                pnlLabel.color = pnl >= 0 ? greenColor : redColor;
            }

            if (pnlBackground != null)
            {
                Color bg = pnl >= 0
                    ? new Color(0, 1, 0.5f, 0.08f)
                    : new Color(1, 0, 0.3f, 0.08f);
                pnlBackground.color = bg;
            }
        }

        // ── Position ──

        public void UpdatePositionUI(TradePosition pos, int leverage)
        {
            if (positionPanel == null) return;

            positionPanel.SetActive(true);
            closeButton?.gameObject.SetActive(true);
            longButton.interactable = false;
            shortButton.interactable = false;

            if (posDirectionLabel != null)
            {
                posDirectionLabel.text = pos.direction.ToString().ToUpper();
                posDirectionLabel.color = pos.direction == TradeDirection.Long ? greenColor : redColor;
            }

            if (posEntryLabel != null)
                posEntryLabel.text = $"Entry: {pos.entryPrice:F2}";

            if (posSizeLabel != null)
                posSizeLabel.text = $"${pos.size:F0} @ {leverage}x";
        }

        public void ClearPositionUI()
        {
            positionPanel?.SetActive(false);
            closeButton?.gameObject.SetActive(false);
            longButton.interactable = true;
            shortButton.interactable = true;
            UpdatePnL(0);
        }

        // ── Leverage ──

        private void CycleLeverage()
        {
            _leverageIndex = (_leverageIndex + 1) % _leverageOptions.Length;
            ApplyLeverage();
        }

        private void LeverageUp()
        {
            if (_leverageIndex < _leverageOptions.Length - 1) _leverageIndex++;
            ApplyLeverage();
        }

        private void LeverageDown()
        {
            if (_leverageIndex > 0) _leverageIndex--;
            ApplyLeverage();
        }

        private void ApplyLeverage()
        {
            _gm.PlayerLeverage = _leverageOptions[_leverageIndex];
            UpdateLeverageDisplay();
        }

        private void UpdateLeverageDisplay()
        {
            if (leverageLabel != null)
                leverageLabel.text = $"{_leverageOptions[_leverageIndex]}x";
        }

        // ── Signal Icons ──

        public void ShowSignalIcon(string signalName, Color color)
        {
            if (signalIconContainer == null || signalIconPrefab == null) return;

            // Update existing or create new
            if (_activeSignals.TryGetValue(signalName, out var existing))
            {
                existing.Flash(color);
                return;
            }

            var go = Instantiate(signalIconPrefab, signalIconContainer);
            var icon = go.GetComponent<SignalIconUI>();
            if (icon != null)
            {
                icon.Setup(signalName, color);
                _activeSignals[signalName] = icon;

                // Auto-remove after 5s
                StartCoroutine(RemoveSignalAfter(signalName, 5f));
            }
        }

        private IEnumerator RemoveSignalAfter(string name, float delay)
        {
            yield return new WaitForSeconds(delay);
            if (_activeSignals.TryGetValue(name, out var icon))
            {
                _activeSignals.Remove(name);
                if (icon != null) Destroy(icon.gameObject);
            }
        }

        // ── Event Log ──

        public void LogEvent(string type, string message)
        {
            string color = type switch
            {
                "win" => "#00ff88",
                "loss" => "#ff2d55",
                "signal" => "#ffd700",
                "trade" => "#e2e8f0",
                _ => "#00d4ff",
            };

            string time = System.DateTime.Now.ToString("HH:mm:ss");
            _logEntries.Add($"<color={color}>[{time}] {message}</color>");

            while (_logEntries.Count > MaxLogEntries)
                _logEntries.RemoveAt(0);

            if (eventLogText != null)
            {
                eventLogText.text = string.Join("\n", _logEntries);
            }

            // Auto-scroll
            if (eventLogScroll != null)
            {
                Canvas.ForceUpdateCanvases();
                eventLogScroll.verticalNormalizedPosition = 0f;
            }
        }

        // ── State Changes ──

        private void OnStateChanged(CharacterState state)
        {
            // Button visual feedback
            if (longBtnText != null && shortBtnText != null)
            {
                longBtnText.text = state == CharacterState.Long ? "LONG ●" : "LONG";
                shortBtnText.text = state == CharacterState.Short ? "SHORT ●" : "SHORT";
            }
        }

        private void OnAwakening()
        {
            LogEvent("signal", "★ AWAKENING MODE ★");
        }

        private void OnAwakeningEnd()
        {
            LogEvent("system", "Awakening ended");
        }

        private void OnDestroy()
        {
            if (_gm != null)
            {
                _gm.OnPriceUpdated -= UpdatePrice;
                _gm.OnPnLChanged -= UpdatePnL;
                _gm.OnCharacterStateChanged -= OnStateChanged;
                _gm.OnCandleUpdated -= OnCandle;
                _gm.OnAwakeningTriggered -= OnAwakening;
                _gm.OnAwakeningEnded -= OnAwakeningEnd;
            }
        }
    }

    // ── Signal Icon Component ──

    public class SignalIconUI : MonoBehaviour
    {
        private TextMeshProUGUI _label;
        private Image _bg;

        public void Setup(string name, Color color)
        {
            _label = GetComponentInChildren<TextMeshProUGUI>();
            _bg = GetComponent<Image>();

            if (_label != null)
            {
                _label.text = name;
                _label.color = color;
            }

            if (_bg != null)
            {
                _bg.color = new Color(color.r, color.g, color.b, 0.15f);
            }
        }

        public void Flash(Color color)
        {
            if (_bg != null)
            {
                _bg.color = new Color(color.r, color.g, color.b, 0.4f);
                StartCoroutine(FadeBack(color));
            }
        }

        private IEnumerator FadeBack(Color color)
        {
            float elapsed = 0f;
            Color from = _bg.color;
            Color to = new Color(color.r, color.g, color.b, 0.15f);
            while (elapsed < 0.5f)
            {
                _bg.color = Color.Lerp(from, to, elapsed / 0.5f);
                elapsed += Time.deltaTime;
                yield return null;
            }
        }
    }
}
