/**
 * useLanguageSuggestion — Two-tier language detection
 *
 * Tier 1 — HIGH CONFIDENCE (silent auto-switch, no banner):
 *   navigator.language (the browser's PRIMARY language) maps to a
 *   supported language AND the user has no saved preference yet.
 *   → Just switch. No questions asked.
 *
 * Tier 2 — MEDIUM CONFIDENCE (show suggestion banner):
 *   The primary language is NOT supported, but a secondary language
 *   in navigator.languages IS supported and differs from current UI.
 *   → Show a subtle "Switch to X?" banner in the target language.
 *   Example: Polish user whose browser also lists English as secondary
 *            → banner in English "Switch to English?"
 *
 * The user's EXPLICIT choice (localStorage 'i18nextLng') always wins
 * and suppresses both tiers — we never override a deliberate pick.
 */

import { useEffect, useState } from 'react';
import i18n from '../../i18n/i18n';
import { normalizeLanguage, supportedLanguages } from '../../i18n/language';

const DISMISSED_KEY = 'lang_suggestion_dismissed_v1';

// Labels shown in the TARGET language (not the current UI language)
export const LANG_LABELS = {
  'zh-CN': '中文',
  'en': 'English',
  'ja': '日本語',
};

// ─────────────────────────────────────────────────────────
// Detect from navigator.language (primary = high confidence)
// ─────────────────────────────────────────────────────────
function detectPrimaryLang() {
  const raw = navigator.language || '';
  const normalized = normalizeLanguage(raw);
  return supportedLanguages.includes(normalized) ? normalized : null;
}

// ─────────────────────────────────────────────────────────
// Detect from navigator.languages[1..] (secondary = lower confidence)
// ─────────────────────────────────────────────────────────
function detectSecondaryLang() {
  const langs = Array.from(navigator.languages || []);
  // Skip index 0 (= primary, already handled above)
  for (const raw of langs.slice(1)) {
    const normalized = normalizeLanguage(raw);
    if (supportedLanguages.includes(normalized)) {
      return normalized;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────
// Has the user explicitly picked a language before?
// ─────────────────────────────────────────────────────────
function hasExplicitPreference() {
  return !!localStorage.getItem('i18nextLng');
}

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────
export function useLanguageSuggestion() {
  const [suggestedLang, setSuggestedLang] = useState(null);

  useEffect(() => {
    const current = normalizeLanguage(i18n.language) || 'zh-CN';

    // ── Tier 1: primary language — auto-switch silently ──────────────
    // Only fire on first visit (no stored preference).
    if (!hasExplicitPreference()) {
      const primary = detectPrimaryLang();
      if (primary && primary !== current) {
        // Silent switch — write to localStorage so PageLayout's effect
        // picks it up AND i18n-browser-languagedetector won't fight us.
        localStorage.setItem('i18nextLng', primary);
        i18n.changeLanguage(primary);
        return; // Nothing to show in the banner
      }
    }

    // ── Tier 2: secondary language — show banner (once per session) ──
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const secondary = detectSecondaryLang();
    if (!secondary) return;
    if (secondary === current) return;

    setSuggestedLang(secondary);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setSuggestedLang(null);
  };

  const accept = () => {
    if (suggestedLang) {
      localStorage.setItem('i18nextLng', suggestedLang);
      i18n.changeLanguage(suggestedLang);
    }
    dismiss();
  };

  return {
    suggestedLang,
    suggestedLabel: suggestedLang ? LANG_LABELS[suggestedLang] : null,
    currentLabel: LANG_LABELS[normalizeLanguage(i18n.language)] || i18n.language,
    dismiss,
    accept,
  };
}
