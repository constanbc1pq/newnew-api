/**
 * LanguageSuggestionBanner
 *
 * Shown on landing/login pages when we detect the user's browser language
 * preference list includes a supported language different from the current UI.
 *
 * Typical case: Chinese user on VPN (IP=US, navigator.language='en-US')
 * but navigator.languages includes 'zh-CN' → "切换到中文？"
 */
import React from 'react';
import { Button } from '@douyinfe/semi-ui';
import { Globe, X } from 'lucide-react';
import { useLanguageSuggestion } from '../../hooks/common/useLanguageSuggestion';

const LanguageSuggestionBanner = () => {
  const { suggestedLang, suggestedLabel, currentLabel, dismiss, accept } =
    useLanguageSuggestion();

  if (!suggestedLang) return null;

  // Build the suggestion message based on which language is being suggested
  const messages = {
    'zh-CN': `检测到您可能偏好中文 — 切换到中文？`,
    'en': `Detected you may prefer English — switch to English?`,
    'ja': `日本語を希望されているようです — 日本語に切り替えますか？`,
  };
  const msg = messages[suggestedLang] || `Switch to ${suggestedLabel}?`;

  return (
    <div
      className='flex items-center justify-between gap-3 px-4 py-2 w-full'
      style={{
        background: 'rgba(37,99,235,0.08)',
        borderBottom: '1px solid rgba(37,99,235,0.15)',
        fontSize: '13px',
        position: 'relative',
        zIndex: 110,
      }}
    >
      <div className='flex items-center gap-2' style={{ color: 'var(--semi-color-text-1)' }}>
        <Globe size={14} style={{ flexShrink: 0 }} />
        <span>{msg}</span>
      </div>
      <div className='flex items-center gap-2 flex-shrink-0'>
        <Button
          size='small'
          theme='solid'
          type='primary'
          onClick={accept}
          className='!rounded-lg !text-xs !h-6 !px-3'
        >
          {suggestedLabel === 'zh-CN' ? '切换' : suggestedLabel === 'en' ? 'Switch' : '切替える'}
        </Button>
        <button
          onClick={dismiss}
          className='opacity-40 hover:opacity-80 transition-opacity'
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
          aria-label='Dismiss'
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default LanguageSuggestionBanner;
