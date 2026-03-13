// ============================================
// Character Animator
// Anime heroine display + awakening mode
// Drives sprite animation, aura, and screen layout
// ============================================

using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using CoinBattleSaki.Core;

namespace CoinBattleSaki.Animation
{
    public class CharacterAnimator : MonoBehaviour
    {
        [Header("Character Display")]
        [SerializeField] private RectTransform characterContainer;
        [SerializeField] private Image characterImage;
        [SerializeField] private Image auraImage;
        [SerializeField] private Image eyeGlowImage;

        [Header("Awakening")]
        [SerializeField] private CanvasGroup awakeningOverlay;
        [SerializeField] private ParticleSystem awakeningParticles;
        [SerializeField] private ParticleSystem goldenAuraParticles;

        [Header("Effects")]
        [SerializeField] private ParticleSystem victoryParticles;
        [SerializeField] private ParticleSystem defeatParticles;
        [SerializeField] private Image screenFlash;
        [SerializeField] private Image damageVignette;

        [Header("Layout References")]
        [SerializeField] private RectTransform chartContainer;
        [SerializeField] private RectTransform signalBar;

        [Header("Animation Settings")]
        [SerializeField] private float idleBreathSpeed = 1.2f;
        [SerializeField] private float idleBreathAmount = 5f;
        [SerializeField] private float attackLungeSpeed = 8f;
        [SerializeField] private float attackLungeAmount = 30f;
        [SerializeField] private float awakeningTransitionTime = 0.8f;

        // State
        private CharacterState _state = CharacterState.Idle;
        private bool _isAwakened;
        private Vector2 _normalCharSize;  // 30% screen
        private Vector2 _awakenCharSize;  // 70% screen
        private Vector2 _normalCharPos;
        private Vector2 _awakenCharPos;
        private float _phase;
        private Coroutine _currentAnim;

        // Cached colors
        private static readonly Color GoldenAura = new(1f, 0.84f, 0f, 0.4f);
        private static readonly Color IdleAura = new(0f, 0.83f, 1f, 0.15f);
        private static readonly Color LongAura = new(0f, 1f, 0.53f, 0.2f);
        private static readonly Color ShortAura = new(1f, 0.18f, 0.33f, 0.2f);

        private void Start()
        {
            // Calculate portrait layout sizes
            float screenH = Screen.height;
            float screenW = Screen.width;

            // Normal: character occupies 30% of screen center
            _normalCharSize = new Vector2(screenW * 0.6f, screenH * 0.3f);
            _normalCharPos = new Vector2(0, -screenH * 0.05f); // slightly below center

            // Awakening: character fills 70% of screen
            _awakenCharSize = new Vector2(screenW * 0.9f, screenH * 0.7f);
            _awakenCharPos = new Vector2(0, -screenH * 0.05f);

            if (characterContainer != null)
            {
                characterContainer.sizeDelta = _normalCharSize;
                characterContainer.anchoredPosition = _normalCharPos;
            }

            // Initialize overlay
            if (awakeningOverlay != null) awakeningOverlay.alpha = 0f;
            if (screenFlash != null) screenFlash.color = Color.clear;
            if (damageVignette != null) damageVignette.color = Color.clear;
        }

        private void Update()
        {
            _phase += Time.deltaTime;
            AnimateIdle();
            AnimateAura();
        }

        // ── Idle Animation ──

        private void AnimateIdle()
        {
            if (characterContainer == null) return;

            // Breathing bob
            float breathe = Mathf.Sin(_phase * idleBreathSpeed) * idleBreathAmount;

            // State-based additions
            float extraY = 0f;
            float extraX = 0f;

            switch (_state)
            {
                case CharacterState.Long:
                    // Slight forward lean
                    extraY = Mathf.Abs(Mathf.Sin(_phase * 2f)) * 3f;
                    break;
                case CharacterState.Short:
                    extraY = -Mathf.Abs(Mathf.Sin(_phase * 2f)) * 3f;
                    break;
                case CharacterState.Awakening:
                    // Powerful floating
                    extraY = Mathf.Sin(_phase * 0.8f) * 15f;
                    extraX = Mathf.Sin(_phase * 0.5f) * 5f;
                    break;
            }

            Vector2 basePos = _isAwakened ? _awakenCharPos : _normalCharPos;
            characterContainer.anchoredPosition = basePos + new Vector2(extraX, breathe + extraY);
        }

        // ── Aura Animation ──

        private void AnimateAura()
        {
            if (auraImage == null) return;

            Color targetColor;
            float pulseSpeed;
            float pulseMin, pulseMax;

            switch (_state)
            {
                case CharacterState.Long:
                    targetColor = LongAura;
                    pulseSpeed = 2f;
                    pulseMin = 0.1f; pulseMax = 0.3f;
                    break;
                case CharacterState.Short:
                    targetColor = ShortAura;
                    pulseSpeed = 2f;
                    pulseMin = 0.1f; pulseMax = 0.3f;
                    break;
                case CharacterState.Awakening:
                    targetColor = GoldenAura;
                    pulseSpeed = 3f;
                    pulseMin = 0.2f; pulseMax = 0.6f;
                    break;
                case CharacterState.Victory:
                    targetColor = GoldenAura;
                    pulseSpeed = 4f;
                    pulseMin = 0.3f; pulseMax = 0.7f;
                    break;
                default:
                    targetColor = IdleAura;
                    pulseSpeed = 1f;
                    pulseMin = 0.05f; pulseMax = 0.15f;
                    break;
            }

            float pulse = Mathf.Lerp(pulseMin, pulseMax, (Mathf.Sin(_phase * pulseSpeed) + 1f) * 0.5f);
            targetColor.a = pulse;
            auraImage.color = Color.Lerp(auraImage.color, targetColor, Time.deltaTime * 5f);

            // Scale pulse
            float scaleBase = _isAwakened ? 1.2f : 1f;
            float scalePulse = scaleBase + Mathf.Sin(_phase * pulseSpeed * 0.5f) * 0.05f;
            auraImage.rectTransform.localScale = Vector3.one * scalePulse;
        }

        // ── State Changes ──

        public void SetState(CharacterState state)
        {
            _state = state;

            // Eye glow color
            if (eyeGlowImage != null)
            {
                eyeGlowImage.color = state switch
                {
                    CharacterState.Long => new Color(0, 1, 0.5f, 0.8f),
                    CharacterState.Short => new Color(1, 0.2f, 0.3f, 0.8f),
                    CharacterState.Awakening => new Color(1, 0.84f, 0, 1f),
                    CharacterState.Victory => new Color(1, 0.84f, 0, 1f),
                    CharacterState.Defeat => new Color(1, 0, 0, 0.5f),
                    _ => new Color(0, 0.83f, 1, 0.5f),
                };
            }
        }

        // ── Awakening Mode ──

        public void TriggerAwakening()
        {
            if (_isAwakened) return;
            _isAwakened = true;
            _state = CharacterState.Awakening;

            if (_currentAnim != null) StopCoroutine(_currentAnim);
            _currentAnim = StartCoroutine(AwakeningTransition(true));
        }

        public void EndAwakening()
        {
            if (!_isAwakened) return;
            _isAwakened = false;
            _state = CharacterState.Idle;

            if (_currentAnim != null) StopCoroutine(_currentAnim);
            _currentAnim = StartCoroutine(AwakeningTransition(false));
        }

        private IEnumerator AwakeningTransition(bool entering)
        {
            float elapsed = 0f;

            Vector2 fromSize = entering ? _normalCharSize : _awakenCharSize;
            Vector2 toSize = entering ? _awakenCharSize : _normalCharSize;

            // Flash
            if (entering)
            {
                yield return StartCoroutine(ScreenFlashCoroutine(GoldenAura, 0.3f));
                awakeningParticles?.Play();
                goldenAuraParticles?.Play();
            }

            // Transition character size and chart layout
            while (elapsed < awakeningTransitionTime)
            {
                float t = elapsed / awakeningTransitionTime;
                float smooth = t * t * (3f - 2f * t); // smoothstep

                // Character grows/shrinks
                if (characterContainer != null)
                    characterContainer.sizeDelta = Vector2.Lerp(fromSize, toSize, smooth);

                // Chart shrinks to top-left corner during awakening
                if (chartContainer != null)
                {
                    float chartScale = entering ? Mathf.Lerp(1f, 0.4f, smooth) : Mathf.Lerp(0.4f, 1f, smooth);
                    chartContainer.localScale = Vector3.one * chartScale;

                    // Move chart to top-left
                    float anchorX = entering ? Mathf.Lerp(0.5f, 0.1f, smooth) : Mathf.Lerp(0.1f, 0.5f, smooth);
                    float anchorY = entering ? Mathf.Lerp(0.75f, 0.92f, smooth) : Mathf.Lerp(0.92f, 0.75f, smooth);
                    chartContainer.anchorMin = new Vector2(anchorX - 0.15f, anchorY - 0.08f);
                    chartContainer.anchorMax = new Vector2(anchorX + 0.15f, anchorY + 0.08f);
                }

                // Overlay alpha
                if (awakeningOverlay != null)
                    awakeningOverlay.alpha = entering ? smooth * 0.3f : (1f - smooth) * 0.3f;

                elapsed += Time.deltaTime;
                yield return null;
            }

            // Finalize
            if (characterContainer != null)
                characterContainer.sizeDelta = toSize;

            if (!entering)
            {
                awakeningParticles?.Stop();
                goldenAuraParticles?.Stop();
                if (awakeningOverlay != null) awakeningOverlay.alpha = 0f;
            }
        }

        // ── Combat Animations ──

        public void TriggerAttack()
        {
            if (_currentAnim != null) StopCoroutine(_currentAnim);
            _currentAnim = StartCoroutine(AttackCoroutine());
        }

        private IEnumerator AttackCoroutine()
        {
            if (characterContainer == null) yield break;

            Vector2 basePos = characterContainer.anchoredPosition;
            float elapsed = 0f;
            float duration = 0.3f;

            while (elapsed < duration)
            {
                float t = elapsed / duration;
                float lunge = Mathf.Sin(t * Mathf.PI) * attackLungeAmount;
                characterContainer.anchoredPosition = basePos + new Vector2(0, lunge);
                elapsed += Time.deltaTime;
                yield return null;
            }

            characterContainer.anchoredPosition = basePos;
        }

        public void TriggerDamage()
        {
            StartCoroutine(DamageCoroutine());
        }

        private IEnumerator DamageCoroutine()
        {
            // Red vignette flash
            if (damageVignette != null)
            {
                damageVignette.color = new Color(1, 0, 0, 0.3f);
                float elapsed = 0f;
                while (elapsed < 0.4f)
                {
                    damageVignette.color = Color.Lerp(new Color(1, 0, 0, 0.3f), Color.clear, elapsed / 0.4f);
                    elapsed += Time.deltaTime;
                    yield return null;
                }
                damageVignette.color = Color.clear;
            }

            // Shake
            if (characterContainer != null)
            {
                Vector2 basePos = characterContainer.anchoredPosition;
                for (int i = 0; i < 6; i++)
                {
                    float shake = (i % 2 == 0 ? 1 : -1) * (8f - i);
                    characterContainer.anchoredPosition = basePos + new Vector2(shake, 0);
                    yield return new WaitForSeconds(0.03f);
                }
                characterContainer.anchoredPosition = basePos;
            }
        }

        public void TriggerVictory()
        {
            victoryParticles?.Play();
            StartCoroutine(ScreenFlashCoroutine(new Color(1, 0.84f, 0, 0.5f), 0.5f));
        }

        public void TriggerDefeat()
        {
            defeatParticles?.Play();
            StartCoroutine(ScreenFlashCoroutine(new Color(1, 0, 0, 0.4f), 0.4f));
            TriggerDamage();
        }

        public void TriggerSignalFlash()
        {
            StartCoroutine(ScreenFlashCoroutine(new Color(0, 0.83f, 1, 0.3f), 0.3f));
        }

        private IEnumerator ScreenFlashCoroutine(Color color, float duration)
        {
            if (screenFlash == null) yield break;

            screenFlash.color = color;
            float elapsed = 0f;
            while (elapsed < duration)
            {
                screenFlash.color = Color.Lerp(color, Color.clear, elapsed / duration);
                elapsed += Time.deltaTime;
                yield return null;
            }
            screenFlash.color = Color.clear;
        }
    }
}
