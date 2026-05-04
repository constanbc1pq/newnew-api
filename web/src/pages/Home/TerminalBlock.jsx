import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SNIPPET = `from openai import OpenAI

# One key — every model
client = OpenAI(
    base_url="https://api.marketrouter.ai/v1",
    api_key="sk-mr-xxxxxxxxxxxxxxxxxxxx",
)

# GPT-4o
client.chat.completions.create(model="gpt-4o", messages=[...])

# Claude 3.5 Sonnet  ← same key, just change model name
client.chat.completions.create(model="claude-3-5-sonnet", messages=[...])

# DeepSeek V3       ← same key, 10× cheaper
client.chat.completions.create(model="deepseek-v3", messages=[...])`;

const LINES = [
  { type: 'comment', text: '# One key — every model' },
  { type: 'blank' },
  { type: 'dim',  text: 'from openai import OpenAI' },
  { type: 'blank' },
  { type: 'dim',  text: 'client = OpenAI(' },
  { type: 'dim',  text: '    base_url="https://api.marketrouter.ai/v1",' },
  { type: 'key',  text: '    api_key="sk-mr-xxxxxxxxxxxxxxxxxxxx",' },
  { type: 'dim',  text: ')' },
  { type: 'blank' },
  { type: 'comment', text: '# GPT-4o' },
  { type: 'dim',  text: 'client.chat.completions.create(model="gpt-4o", ...)' },
  { type: 'blank' },
  { type: 'comment', text: '# Claude 3.5 Sonnet  ← same key, just change model name' },
  { type: 'dim',  text: 'client.chat.completions.create(model="claude-3-5-sonnet", ...)' },
  { type: 'blank' },
  { type: 'comment', text: '# DeepSeek V3        ← same key, 10× cheaper' },
  { type: 'dim',  text: 'client.chat.completions.create(model="deepseek-v3", ...)' },
];

export default function TerminalBlock() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SNIPPET).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className='w-full max-w-2xl mx-auto border' style={{ borderColor: 'var(--lr-fg-10)', background: 'var(--lr-bg)' }}>
      <div className='flex items-center justify-between px-4 py-2.5 border-b' style={{ borderColor: 'var(--lr-fg-10)' }}>
        <span className='font-heading text-[9px] tracking-widest' style={{ color: 'var(--lr-text-tertiary)' }}>
          // python · works with any OpenAI-compatible SDK
        </span>
        <button
          onClick={handleCopy}
          style={{
            fontSize: 10, padding: '3px 10px',
            border: '1px solid var(--lr-fg-20)',
            borderRadius: 4, background: 'transparent',
            color: copied ? 'var(--lr-fg)' : 'var(--lr-text-secondary)',
            cursor: 'pointer', transition: 'color 0.15s',
            fontFamily: 'inherit',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className='px-5 py-5 overflow-x-auto'>
        {LINES.map((line, i) => {
          if (line.type === 'blank') return <div key={i} className='h-2' />;
          if (line.type === 'comment') return (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: '1.8', color: 'var(--lr-text-tertiary)' }}>{line.text}</div>
          );
          if (line.type === 'key') return (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: '1.8', color: 'var(--lr-fg)' }}>{line.text}</div>
          );
          return (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: '1.8', color: 'var(--lr-text-secondary)' }}>{line.text}</div>
          );
        })}
      </div>
    </div>
  );
}
