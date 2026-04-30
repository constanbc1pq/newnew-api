/**
 * useLanguageSuggestion
 *
 * Multi-signal language detection:
 *   1. i18next-browser-languagedetector already reads navigator.language
 *   2. BUT: Chinese user on VPN might have navigator.language = 'en-US'
 *      while navigator.languages = ['en-US', 'zh-CN', ...]
 *
 * Strategy:
 *   - Scan navigator.languages (all preferred languages, ordered by preference)
 *   - Find the FIRST one that matches a supported language
 *   - If that best match != current i18n.language AND user hasn't dismissed yet
 *     → suggest switching
 *
 * Returns: { suggestedLang, suggestedLabel, dismiss, accept }
 * suggestedLang = null means no suggestion needed
 */

import { useEffect, useState } from 'react';
import i18n from '../../i18n/i18n';
import { normalizeLanguage, supportedLanguages } from '../../i18n/language';

const DISMISSED_KEY = 'lang_suggestion_dismissed_v1';

const LANG_LABELS = {
  'zh-CN': '中文',
  'en': 'English',
  'ja': '日本語',
};

// Map a single navigator.language tag to our supported lang code
function detectBestLang() {
  const langs = navigator.languages || [navigator.language || 'en'];
  for (const raw of langs) {
    const normalized = normalizeLanguage(raw);
    if (supportedLanguages.includes(normalized)) {
      return normalized;
    }
  }
  return null;
}

export function useLanguageSuggestion() {
  const [suggestedLang, setSuggestedLang] = useState(null);

  useEffect(() => {
    // Only show once per session until dismissed
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const best = detectBestLang();
    if (!best) return;

    // Already on the right language? No suggestion needed
    const current = normalizeLanguage(i18n.language) || 'zh-CN';
    if (best === current) return;

    setSuggestedLang(best);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setSuggestedLang(null);
  };

  const accept = () => {
    if (suggestedLang) {
      i18n.changeLanguage(suggestedLang);
      // Persist the choice so page-reload keeps it
      localStorage.setItem('i18nextLng', suggestedLang);
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
