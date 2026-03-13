// ============================================
// Binance WebSocket Client
// Streams kline data for real-time chart
// ============================================

using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using CoinBattleSaki.Core;

namespace CoinBattleSaki.Network
{
    public class BinanceWebSocket : MonoBehaviour
    {
        public event Action<Candlestick> OnKlineReceived;

        private string _pair;
        private string _interval;
        private bool _connected;
        private float _reconnectDelay = 3f;

#if !UNITY_WEBGL || UNITY_EDITOR
        private System.Net.WebSockets.ClientWebSocket _ws;
        private System.Threading.CancellationTokenSource _cts;
#endif

        public void Connect(string pair, string interval)
        {
            _pair = pair.ToLower();
            _interval = interval;
            StartCoroutine(FetchInitialCandles());
            StartCoroutine(ConnectLoop());
        }

        // ── REST: Fetch initial candles ──

        private IEnumerator FetchInitialCandles()
        {
            string url = $"https://api.binance.com/api/v3/klines?symbol={_pair.ToUpper()}&interval={_interval}&limit=120";
            using var req = UnityWebRequest.Get(url);
            yield return req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success)
            {
                ParseKlineArray(req.downloadHandler.text);
            }
            else
            {
                Debug.LogWarning($"[BinanceWS] Failed to fetch candles: {req.error}");
            }
        }

        private void ParseKlineArray(string json)
        {
            // Binance returns [[time,o,h,l,c,v,...], ...]
            // Simple JSON array parser without external dependency
            try
            {
                // Strip outer brackets
                json = json.Trim();
                if (!json.StartsWith("[[")) return;

                json = json.Substring(1, json.Length - 2); // remove outer []
                int depth = 0;
                int start = 0;

                for (int i = 0; i < json.Length; i++)
                {
                    if (json[i] == '[') depth++;
                    else if (json[i] == ']')
                    {
                        depth--;
                        if (depth == 0)
                        {
                            string item = json.Substring(start, i - start + 1);
                            ParseSingleKline(item);
                            start = i + 2; // skip "],["
                        }
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[BinanceWS] Parse error: {e.Message}");
            }
        }

        private void ParseSingleKline(string arrayStr)
        {
            // [time,o,h,l,c,v, ...]
            arrayStr = arrayStr.Trim('[', ']');
            var parts = arrayStr.Split(',');
            if (parts.Length < 6) return;

            var candle = new Candlestick
            {
                time = long.Parse(parts[0].Trim('"')),
                open = float.Parse(parts[1].Trim('"'), System.Globalization.CultureInfo.InvariantCulture),
                high = float.Parse(parts[2].Trim('"'), System.Globalization.CultureInfo.InvariantCulture),
                low = float.Parse(parts[3].Trim('"'), System.Globalization.CultureInfo.InvariantCulture),
                close = float.Parse(parts[4].Trim('"'), System.Globalization.CultureInfo.InvariantCulture),
                volume = float.Parse(parts[5].Trim('"'), System.Globalization.CultureInfo.InvariantCulture),
                closed = true,
            };

            OnKlineReceived?.Invoke(candle);
        }

        // ── WebSocket stream ──

        private IEnumerator ConnectLoop()
        {
            while (true)
            {
#if !UNITY_WEBGL || UNITY_EDITOR
                yield return StartCoroutine(ConnectNative());
#else
                // WebGL: Use JavaScript interop
                yield return StartCoroutine(ConnectWebGL());
#endif
                yield return new WaitForSeconds(_reconnectDelay);
            }
        }

#if !UNITY_WEBGL || UNITY_EDITOR
        private IEnumerator ConnectNative()
        {
            string url = $"wss://stream.binance.com:9443/ws/{_pair}@kline_{_interval}";
            _cts = new System.Threading.CancellationTokenSource();
            _ws = new System.Net.WebSockets.ClientWebSocket();

            var connectTask = _ws.ConnectAsync(new Uri(url), _cts.Token);

            while (!connectTask.IsCompleted)
                yield return null;

            if (connectTask.IsFaulted)
            {
                Debug.LogWarning($"[BinanceWS] Connect failed: {connectTask.Exception?.Message}");
                yield break;
            }

            _connected = true;
            Debug.Log("[BinanceWS] Connected");

            var buffer = new byte[4096];
            var sb = new StringBuilder();

            while (_ws.State == System.Net.WebSockets.WebSocketState.Open)
            {
                var segment = new ArraySegment<byte>(buffer);
                var receiveTask = _ws.ReceiveAsync(segment, _cts.Token);

                while (!receiveTask.IsCompleted)
                    yield return null;

                if (receiveTask.IsFaulted || receiveTask.Result.MessageType == System.Net.WebSockets.WebSocketMessageType.Close)
                    break;

                sb.Append(Encoding.UTF8.GetString(buffer, 0, receiveTask.Result.Count));

                if (receiveTask.Result.EndOfMessage)
                {
                    ProcessMessage(sb.ToString());
                    sb.Clear();
                }
            }

            _connected = false;
            Debug.Log("[BinanceWS] Disconnected");
        }
#endif

        private IEnumerator ConnectWebGL()
        {
            // WebGL placeholder — would use jslib plugin
            Debug.Log("[BinanceWS] WebGL mode — using REST polling fallback");
            while (true)
            {
                yield return FetchInitialCandles();
                yield return new WaitForSeconds(5f);
            }
        }

        private void ProcessMessage(string json)
        {
            // Parse Binance kline event: { "k": { "t":..., "o":"...", ... } }
            try
            {
                // Find "k" object
                int kIdx = json.IndexOf("\"k\"", StringComparison.Ordinal);
                if (kIdx < 0) return;

                float GetFloat(string key)
                {
                    int idx = json.IndexOf($"\"{key}\"", kIdx, StringComparison.Ordinal);
                    if (idx < 0) return 0;
                    int colonIdx = json.IndexOf(':', idx);
                    int start = json.IndexOf('"', colonIdx + 1) + 1;
                    int end = json.IndexOf('"', start);
                    return float.Parse(json.Substring(start, end - start), System.Globalization.CultureInfo.InvariantCulture);
                }

                long GetLong(string key)
                {
                    int idx = json.IndexOf($"\"{key}\"", kIdx, StringComparison.Ordinal);
                    if (idx < 0) return 0;
                    int colonIdx = json.IndexOf(':', idx);
                    int start = colonIdx + 1;
                    while (start < json.Length && !char.IsDigit(json[start])) start++;
                    int end = start;
                    while (end < json.Length && char.IsDigit(json[end])) end++;
                    return long.Parse(json.Substring(start, end - start));
                }

                bool GetBool(string key)
                {
                    int idx = json.IndexOf($"\"{key}\"", kIdx, StringComparison.Ordinal);
                    if (idx < 0) return false;
                    return json.IndexOf("true", idx, StringComparison.Ordinal) < json.IndexOf(',', idx);
                }

                var candle = new Candlestick
                {
                    time = GetLong("t"),
                    open = GetFloat("o"),
                    high = GetFloat("h"),
                    low = GetFloat("l"),
                    close = GetFloat("c"),
                    volume = GetFloat("v"),
                    closed = GetBool("x"),
                };

                // Dispatch to main thread
                MainThreadDispatcher.Enqueue(() => OnKlineReceived?.Invoke(candle));
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[BinanceWS] Parse error: {e.Message}");
            }
        }

        private void OnDestroy()
        {
#if !UNITY_WEBGL || UNITY_EDITOR
            _cts?.Cancel();
            _ws?.Dispose();
#endif
        }
    }

    // Simple main-thread dispatcher for WebSocket callbacks
    public class MainThreadDispatcher : MonoBehaviour
    {
        private static MainThreadDispatcher _instance;
        private readonly System.Collections.Concurrent.ConcurrentQueue<Action> _queue = new();

        public static void Enqueue(Action action)
        {
            if (_instance == null)
            {
                var go = new GameObject("MainThreadDispatcher");
                _instance = go.AddComponent<MainThreadDispatcher>();
                DontDestroyOnLoad(go);
            }
            _instance._queue.Enqueue(action);
        }

        private void Update()
        {
            while (_queue.TryDequeue(out var action))
                action?.Invoke();
        }
    }
}
