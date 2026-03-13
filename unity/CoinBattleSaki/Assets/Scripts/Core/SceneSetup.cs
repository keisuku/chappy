// ============================================
// Scene Setup
// Creates the full portrait UI hierarchy at runtime
// Use this when building from empty scene
// ============================================

using UnityEngine;
using UnityEngine.UI;
using TMPro;
using CoinBattleSaki.Market;
using CoinBattleSaki.Animation;

namespace CoinBattleSaki.Core
{
    /// <summary>
    /// Attach to an empty GameObject to auto-build the entire game UI.
    /// Portrait layout: chart → signals → character → buttons → log
    /// </summary>
    public class SceneSetup : MonoBehaviour
    {
        [Header("Optional: Assign existing references instead of auto-creating")]
        [SerializeField] private Canvas existingCanvas;

        // Colors
        private static readonly Color BG = new(0.04f, 0.055f, 0.09f);
        private static readonly Color Panel = new(0.067f, 0.094f, 0.153f);
        private static readonly Color PanelBorder = new(0.118f, 0.161f, 0.231f);
        private static readonly Color Accent = new(0f, 0.831f, 1f);
        private static readonly Color Green = new(0f, 1f, 0.533f);
        private static readonly Color Red = new(1f, 0.176f, 0.333f);
        private static readonly Color Gold = new(1f, 0.843f, 0f);
        private static readonly Color TextDim = new(0.392f, 0.455f, 0.545f);

        private void Start()
        {
            BuildScene();
        }

        private void BuildScene()
        {
            // ── Canvas ──
            Canvas canvas = existingCanvas;
            if (canvas == null)
            {
                var canvasGO = new GameObject("GameCanvas");
                canvas = canvasGO.AddComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvas.sortingOrder = 0;

                var scaler = canvasGO.AddComponent<CanvasScaler>();
                scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                scaler.referenceResolution = new Vector2(1080, 1920); // Portrait
                scaler.matchWidthOrHeight = 0.5f;

                canvasGO.AddComponent<GraphicRaycaster>();
            }

            var rt = canvas.GetComponent<RectTransform>();

            // ── Background ──
            var bgGO = CreatePanel(rt, "Background", BG);
            var bgRT = bgGO.GetComponent<RectTransform>();
            SetFullStretch(bgRT);

            // ── Layout: Vertical split ──
            // We use anchor-based positioning for the 5 sections

            // 1. TOP BAR (0% - 5%)
            var topBar = CreateSection(bgRT, "TopBar", Panel, 0.95f, 1f);
            CreateLabel(topBar.transform, "PairLabel", "BTC/USDT", 14, Accent,
                new Vector2(0, 0), new Vector2(0.3f, 1f));
            CreateLabel(topBar.transform, "PriceLabel", "--", 20, Color.white,
                new Vector2(0.35f, 0), new Vector2(0.7f, 1f));
            CreateLabel(topBar.transform, "ChangeLabel", "--", 12, Green,
                new Vector2(0.72f, 0), new Vector2(1f, 1f));

            // 2. CHART SECTION (65% - 95%)
            var chartSection = CreateSection(bgRT, "ChartSection", new Color(0.03f, 0.04f, 0.07f), 0.65f, 0.95f);
            var chartImg = chartSection.AddComponent<RawImage>();
            var chartRenderer = chartSection.AddComponent<ChartRenderer>();

            // 3. SIGNAL BAR (60% - 65%)
            var signalBar = CreateSection(bgRT, "SignalBar", Panel, 0.60f, 0.65f);
            var signalLayout = signalBar.AddComponent<HorizontalLayoutGroup>();
            signalLayout.spacing = 8;
            signalLayout.padding = new RectOffset(10, 10, 4, 4);
            signalLayout.childAlignment = TextAnchor.MiddleLeft;

            // Add default signal indicators
            CreateSignalChip(signalBar.transform, "RSI", TextDim);
            CreateSignalChip(signalBar.transform, "MACD", TextDim);
            CreateSignalChip(signalBar.transform, "VOL", TextDim);

            // 4. CHARACTER SECTION (25% - 60%)
            var charSection = CreateSection(bgRT, "CharacterSection", Color.clear, 0.25f, 0.60f);
            // Character container with animator
            var charContainer = new GameObject("CharacterContainer");
            charContainer.transform.SetParent(charSection.transform, false);
            var charRT = charContainer.AddComponent<RectTransform>();
            SetFullStretch(charRT);
            // Add character image (placeholder)
            var charImg = charContainer.AddComponent<Image>();
            charImg.color = new Color(1, 1, 1, 0); // transparent until sprite assigned
            // Aura
            var auraGO = new GameObject("Aura");
            auraGO.transform.SetParent(charContainer.transform, false);
            var auraRT = auraGO.AddComponent<RectTransform>();
            SetFullStretch(auraRT);
            var auraImg = auraGO.AddComponent<Image>();
            auraImg.color = new Color(Accent.r, Accent.g, Accent.b, 0.1f);

            // 5. PNL + POSITION (20% - 25%)
            var pnlBar = CreateSection(bgRT, "PnLBar", Panel, 0.20f, 0.25f);
            CreateLabel(pnlBar.transform, "PnLLabel", "P&L: 0.00", 16, Color.white,
                new Vector2(0, 0), new Vector2(0.5f, 1f));
            // Position info
            var posPanel = CreateSection(pnlBar.GetComponent<RectTransform>(), "PositionPanel",
                Color.clear, 0f, 1f);
            var posRT = posPanel.GetComponent<RectTransform>();
            posRT.anchorMin = new Vector2(0.5f, 0);
            posRT.anchorMax = new Vector2(1f, 1);
            posPanel.SetActive(false);

            // 6. BUTTON ROW (10% - 20%)
            var buttonRow = CreateSection(bgRT, "ButtonRow", Color.clear, 0.10f, 0.20f);
            var btnLayout = buttonRow.AddComponent<HorizontalLayoutGroup>();
            btnLayout.spacing = 12;
            btnLayout.padding = new RectOffset(16, 16, 8, 8);
            btnLayout.childForceExpandWidth = true;
            btnLayout.childForceExpandHeight = true;

            CreateActionButton(buttonRow.transform, "LongBtn", "LONG", Green, Color.black);
            CreateActionButton(buttonRow.transform, "LeverageBtn", "2x", Panel, Accent);
            CreateActionButton(buttonRow.transform, "ShortBtn", "SHORT", Red, Color.white);
            CreateActionButton(buttonRow.transform, "CloseBtn", "CLOSE", PanelBorder, Color.white);

            // 7. EVENT LOG (0% - 10%)
            var logSection = CreateSection(bgRT, "EventLog", new Color(0, 0, 0, 0.5f), 0f, 0.10f);
            var logText = CreateLabel(logSection.transform, "LogText", "", 10, TextDim,
                new Vector2(0, 0), new Vector2(1, 1));
            var scrollRect = logSection.AddComponent<ScrollRect>();
            var logTextTMP = logText.GetComponent<TextMeshProUGUI>();
            if (logTextTMP != null)
            {
                logTextTMP.alignment = TextAlignmentOptions.BottomLeft;
                logTextTMP.richText = true;
                logTextTMP.overflowMode = TextOverflowModes.Truncate;
            }

            // ── Screen Flash Overlay ──
            var flashGO = CreatePanel(rt, "ScreenFlash", Color.clear);
            SetFullStretch(flashGO.GetComponent<RectTransform>());
            flashGO.GetComponent<Image>().raycastTarget = false;

            // ── Damage Vignette ──
            var vignetteGO = CreatePanel(rt, "DamageVignette", Color.clear);
            SetFullStretch(vignetteGO.GetComponent<RectTransform>());
            vignetteGO.GetComponent<Image>().raycastTarget = false;

            // ── Wire up GameManager ──
            var gmGO = new GameObject("GameManager");
            var gm = gmGO.AddComponent<GameManager>();

            // Wire up CharacterAnimator
            var charAnimator = charContainer.AddComponent<CharacterAnimator>();

            Debug.Log("[SceneSetup] CoinBattle Saki UI built successfully");
        }

        // ── Builder Helpers ──

        private static GameObject CreateSection(RectTransform parent, string name, Color bg, float anchorYMin, float anchorYMax)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0, anchorYMin);
            rt.anchorMax = new Vector2(1, anchorYMax);
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            if (bg.a > 0)
            {
                var img = go.AddComponent<Image>();
                img.color = bg;
                img.raycastTarget = false;
            }

            return go;
        }

        private static GameObject CreatePanel(RectTransform parent, string name, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            var img = go.AddComponent<Image>();
            img.color = color;
            return go;
        }

        private static GameObject CreateLabel(Transform parent, string name, string text, int fontSize, Color color,
            Vector2 anchorMin, Vector2 anchorMax)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = new Vector2(10, 0);
            rt.offsetMax = new Vector2(-10, 0);

            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.color = color;
            tmp.alignment = TextAlignmentOptions.MidlineLeft;
            tmp.fontStyle = FontStyles.Bold;

            return go;
        }

        private static void CreateActionButton(Transform parent, string name, string label, Color bgColor, Color textColor)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);

            var img = go.AddComponent<Image>();
            img.color = bgColor;

            var btn = go.AddComponent<Button>();
            btn.targetGraphic = img;

            var textGO = new GameObject("Label");
            textGO.transform.SetParent(go.transform, false);
            var textRT = textGO.AddComponent<RectTransform>();
            SetFullStretch(textRT);

            var tmp = textGO.AddComponent<TextMeshProUGUI>();
            tmp.text = label;
            tmp.fontSize = 18;
            tmp.fontStyle = FontStyles.Bold;
            tmp.color = textColor;
            tmp.alignment = TextAlignmentOptions.Center;

            // Add layout element for equal sizing
            go.AddComponent<LayoutElement>();
        }

        private static void CreateSignalChip(Transform parent, string label, Color color)
        {
            var go = new GameObject($"Signal_{label}");
            go.transform.SetParent(parent, false);

            var img = go.AddComponent<Image>();
            img.color = new Color(color.r, color.g, color.b, 0.15f);

            var textGO = new GameObject("Label");
            textGO.transform.SetParent(go.transform, false);
            var textRT = textGO.AddComponent<RectTransform>();
            SetFullStretch(textRT);

            var tmp = textGO.AddComponent<TextMeshProUGUI>();
            tmp.text = label;
            tmp.fontSize = 11;
            tmp.color = color;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.fontStyle = FontStyles.Bold;

            go.AddComponent<LayoutElement>().preferredWidth = 60;
        }

        private static void SetFullStretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }
    }
}
