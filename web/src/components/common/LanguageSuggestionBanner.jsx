/**
 * LanguageSuggestionBanner
 *
 * Shown only in Tier-2 situations: the user's secondary browser language
 * suggests they might prefer a different language from the current UI.
 *
 * The banner message is written in the TARGET language — so a Polish
 * speaker whose browser lists English as secondary sees this in English.
 * A Chinese speaker on a VPN (primary = en-US, secondary = zh-CN) sees
 * the banner in Chinese.
 */
import React from 'react';
import { Button } from '@douyinfe/semi-ui';
import { Globe, X } from 'lucide-react';
import { useLanguageSuggestion } from '../../hooks/common/useLanguageSuggestion';

// Messages written in the SUGGESTED language, not the current one.
// Key = the lang code we're suggesting.
const MESSAGES = {
  'zh-CN': { prompt: '切换到中文？', action: '切换' },
  'en':    { prompt: 'Switch to English?', action: 'Switch' },
  'ja':    { prompt: '日本語に切り替えますか？', action: '切替' },
};

const LanguageSuggestionBanner = () => {
  const { suggestedLang, dismiss, accept } = useLanguageSuggestion();

  if (!suggestedLang) return null;

  const { prompt, action } = MESSAGES[suggestedLang] ?? {
    prompt: `Switch language?`,
    action: 'Switch',
  };

  return (
    <div
      className='flex items-center justify-between gap-3 px-4 py-2 w-full'
      style={{
        background: 'rgba(37,99,235,0.07)',
        borderBottom: '1px solid rgba(37,99,235,0.12)',
        fontSize: '13px',
      }}
    >
      <div className='flex items-center gap-2' style={{ color: 'var(--semi-color-text-1)' }}>
        <Globe size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
        <span>{prompt}</span>
      </div>
      <div className='flex items-center gap-2 flex-shrink-0'>
        <Button
          size='small'
          theme='solid'
          type='primary'
          onClick={accept}
          style={{ height: 24, fontSize: 12, padding: '0 12px', borderRadius: 6 }}
        >
          {action}
        </Button>
        <button
          onClick={dismiss}
          className='opacity-40 hover:opacity-70 transition-opacity'
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
          aria-label='Dismiss'
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

export default LanguageSuggestionBanner;
