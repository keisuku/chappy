// ============================================
// Mini Chart Renderer
// Draws candlestick chart on a RawImage texture
// Top-left of screen in portrait mode
// ============================================

using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using CoinBattleSaki.Core;

namespace CoinBattleSaki.Market
{
    public class ChartRenderer : MonoBehaviour
    {
        [Header("Display")]
        [SerializeField] private RawImage chartImage;
        [SerializeField] private int textureWidth = 512;
        [SerializeField] private int textureHeight = 256;
        [SerializeField] private int maxCandles = 60;

        [Header("Colors")]
        [SerializeField] private Color backgroundColor = new(0.04f, 0.06f, 0.09f, 1f);
        [SerializeField] private Color bullColor = new(0f, 1f, 0.53f, 1f);      // #00ff88
        [SerializeField] private Color bearColor = new(1f, 0.18f, 0.33f, 1f);   // #ff2d55
        [SerializeField] private Color gridColor = new(1f, 1f, 1f, 0.03f);
        [SerializeField] private Color priceLineColor = new(0f, 0.83f, 1f, 0.7f); // #00d4ff
        [SerializeField] private Color tpColor = new(0f, 1f, 0.53f, 0.5f);
        [SerializeField] private Color slColor = new(1f, 0.18f, 0.33f, 0.5f);

        private Texture2D _texture;
        private Color[] _clearPixels;

        private void Awake()
        {
            _texture = new Texture2D(textureWidth, textureHeight, TextureFormat.RGBA32, false)
            {
                filterMode = FilterMode.Point,
                wrapMode = TextureWrapMode.Clamp
            };
            _clearPixels = new Color[textureWidth * textureHeight];
            for (int i = 0; i < _clearPixels.Length; i++)
                _clearPixels[i] = backgroundColor;

            if (chartImage != null)
                chartImage.texture = _texture;
        }

        public void Render(List<Candlestick> candles, float currentPrice, TradePosition position, float tp, float sl)
        {
            if (candles == null || candles.Count == 0) return;

            // Clear
            _texture.SetPixels(_clearPixels);

            int displayCount = Mathf.Min(maxCandles, candles.Count);
            int startIdx = candles.Count - displayCount;

            // Find price range
            float high = float.MinValue, low = float.MaxValue;
            for (int i = startIdx; i < candles.Count; i++)
            {
                if (candles[i].high > high) high = candles[i].high;
                if (candles[i].low < low) low = candles[i].low;
            }

            float padding = (high - low) * 0.1f;
            high += padding;
            low -= padding;
            float range = high - low;
            if (range <= 0) range = 1;

            int candleWidth = Mathf.Max(2, (textureWidth - 20) / displayCount);
            int gap = Mathf.Max(1, candleWidth / 5);
            int bodyWidth = candleWidth - gap;

            // Grid
            DrawHorizontalLine(textureHeight / 4, gridColor);
            DrawHorizontalLine(textureHeight / 2, gridColor);
            DrawHorizontalLine(textureHeight * 3 / 4, gridColor);

            // Candles
            for (int i = 0; i < displayCount; i++)
            {
                var c = candles[startIdx + i];
                int x = i * candleWidth + gap / 2;
                bool bull = c.IsBullish;
                Color col = bull ? bullColor : bearColor;

                // Wick
                int wickX = x + bodyWidth / 2;
                int wickTop = PriceToY(c.high, high, low);
                int wickBot = PriceToY(c.low, high, low);
                DrawVerticalLine(wickX, wickBot, wickTop, col);

                // Body
                int bodyTop = PriceToY(Mathf.Max(c.open, c.close), high, low);
                int bodyBot = PriceToY(Mathf.Min(c.open, c.close), high, low);
                int bodyH = Mathf.Max(1, bodyTop - bodyBot);
                DrawFilledRect(x, bodyBot, bodyWidth, bodyH, col);
            }

            // Current price line
            if (currentPrice > 0)
            {
                int y = PriceToY(currentPrice, high, low);
                DrawDashedLine(y, priceLineColor, 4, 4);
            }

            // TP/SL lines
            if (position != null)
            {
                float dir = position.direction == TradeDirection.Long ? 1f : -1f;
                float tpPrice = position.entryPrice * (1f + dir * tp / 100f);
                float slPrice = position.entryPrice * (1f - dir * sl / 100f);

                int tpY = PriceToY(tpPrice, high, low);
                int slY = PriceToY(slPrice, high, low);
                DrawDashedLine(tpY, tpColor, 3, 3);
                DrawDashedLine(slY, slColor, 3, 3);

                // Entry line
                int entryY = PriceToY(position.entryPrice, high, low);
                DrawDashedLine(entryY, new Color(1, 1, 1, 0.2f), 2, 6);
            }

            _texture.Apply();
        }

        private int PriceToY(float price, float high, float low)
        {
            float range = high - low;
            if (range <= 0) return textureHeight / 2;
            return Mathf.Clamp((int)((price - low) / range * (textureHeight - 10)) + 5, 0, textureHeight - 1);
        }

        private void DrawVerticalLine(int x, int yFrom, int yTo, Color color)
        {
            if (x < 0 || x >= textureWidth) return;
            int minY = Mathf.Max(0, Mathf.Min(yFrom, yTo));
            int maxY = Mathf.Min(textureHeight - 1, Mathf.Max(yFrom, yTo));
            for (int y = minY; y <= maxY; y++)
                _texture.SetPixel(x, y, color);
        }

        private void DrawHorizontalLine(int y, Color color)
        {
            if (y < 0 || y >= textureHeight) return;
            for (int x = 0; x < textureWidth; x++)
                _texture.SetPixel(x, y, color);
        }

        private void DrawDashedLine(int y, Color color, int dashLen, int gapLen)
        {
            if (y < 0 || y >= textureHeight) return;
            int cycle = dashLen + gapLen;
            for (int x = 0; x < textureWidth; x++)
            {
                if (x % cycle < dashLen)
                    _texture.SetPixel(x, y, color);
            }
        }

        private void DrawFilledRect(int rx, int ry, int w, int h, Color color)
        {
            for (int y = ry; y < ry + h && y < textureHeight; y++)
            {
                if (y < 0) continue;
                for (int x = rx; x < rx + w && x < textureWidth; x++)
                {
                    if (x < 0) continue;
                    _texture.SetPixel(x, y, color);
                }
            }
        }
    }
}
