/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

// All supported locale codes. Each must have a matching locales/<code>.json file.
export const supportedLanguages = [
  'zh-CN',   // 简体中文
  'zh-TW',   // 繁體中文
  'en',      // English
  'ja',      // 日本語
  'ko',      // 한국어
  'fr',      // Français
  'de',      // Deutsch
  'es',      // Español
  'pt-BR',   // Português (Brasil)
  'ru',      // Русский
  'ar',      // العربية
  'hi',      // हिन्दी
  'id',      // Bahasa Indonesia
  'tr',      // Türkçe
  'vi',      // Tiếng Việt
];

// Human-readable label for each language, written in that language
export const LANG_LABELS = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en':    'English',
  'ja':    '日本語',
  'ko':    '한국어',
  'fr':    'Français',
  'de':    'Deutsch',
  'es':    'Español',
  'pt-BR': 'Português',
  'ru':    'Русский',
  'ar':    'العربية',
  'hi':    'हिन्दी',
  'id':    'Bahasa Indonesia',
  'tr':    'Türkçe',
  'vi':    'Tiếng Việt',
};

// Whether a language is RTL
export const RTL_LANGS = new Set(['ar']);

export const normalizeLanguage = (language) => {
  if (!language) return language;

  const normalized = language.trim().replace(/_/g, '-');
  const lower = normalized.toLowerCase();

  // Chinese Simplified
  if (
    lower === 'zh' ||
    lower === 'zh-cn' ||
    lower === 'zh-sg' ||
    lower.startsWith('zh-hans')
  ) return 'zh-CN';

  // Chinese Traditional
  if (
    lower === 'zh-tw' ||
    lower === 'zh-hk' ||
    lower === 'zh-mo' ||
    lower.startsWith('zh-hant')
  ) return 'zh-TW';

  // Portuguese Brazil (pt-br) vs Portugal (pt) → both map to pt-BR for now
  if (lower === 'pt' || lower === 'pt-br' || lower === 'pt-pt') return 'pt-BR';

  // Norwegian variants → no → closest is English fallback
  if (lower.startsWith('no')) return 'en';

  // Exact match against supported list (case-insensitive)
  const match = supportedLanguages.find(
    (l) => l.toLowerCase() === lower,
  );
  if (match) return match;

  // Prefix match: e.g. 'fr-CA' → 'fr', 'ko-KR' → 'ko'
  const prefix = lower.split('-')[0];
  const prefixMatch = supportedLanguages.find(
    (l) => l.toLowerCase() === prefix,
  );
  return prefixMatch || normalized;
};
