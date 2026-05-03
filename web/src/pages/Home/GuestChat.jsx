import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../../helpers';
import { useTranslation } from 'react-i18next';

const MAX_MESSAGES = 3; // mirrors backend default; status API overrides this

export default function GuestChat() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ used: 0, max: MAX_MESSAGES, exhausted: false });
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch initial status
  useEffect(() => {
    API.get('/api/guest/status').then(res => {
      if (res?.data) setStatus(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || status.exhausted) return;

    const userMsg = { role: 'user', content: text };
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/api/guest/chat', {
        message: text,
        history,
      });
      const data = res?.data;

      if (data?.error === 'trial_exhausted') {
        setStatus(s => ({ ...s, exhausted: true }));
        return;
      }
      if (data?.error === 'guest_trial_not_configured') {
        setError(t('guest_not_configured', '试用功能暂未开放，请注册后使用。'));
        return;
      }
      if (data?.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        setStatus({ used: data.used, max: data.max, remaining: data.remaining, exhausted: data.remaining <= 0 });
      }
    } catch (e) {
      setError(t('guest_error', '请求失败，请稍后再试。'));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const remaining = status.max - status.used;
  const showExhausted = status.exhausted || remaining <= 0;

  return (
    <div className='guest-chat-root' style={{ width: '100%', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', isolation: 'isolate' }}>

      {/* Messages */}
      {messages.length > 0 && (
        <div style={{
          border: '1px solid var(--lr-fg-10)',
          borderBottom: 'none',
          borderRadius: '12px 12px 0 0',
          maxHeight: 360,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: 'var(--lr-bg)',
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '82%',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: m.role === 'user' ? 'var(--lr-fg)' : 'var(--lr-fg-10)',
                color: m.role === 'user' ? 'var(--lr-bg)' : 'var(--lr-fg)',
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '10px 16px',
                borderRadius: '12px 12px 12px 2px',
                background: 'var(--lr-fg-10)',
                fontSize: 14,
                color: 'var(--lr-fg-40)',
                display: 'flex', gap: 4, alignItems: 'center',
              }}>
                <span style={{ animation: 'pulse 1.2s ease-in-out infinite' }}>●</span>
                <span style={{ animation: 'pulse 1.2s ease-in-out infinite 0.2s' }}>●</span>
                <span style={{ animation: 'pulse 1.2s ease-in-out infinite 0.4s' }}>●</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Exhausted state */}
      {showExhausted ? (
        <div style={{
          border: '1px solid var(--lr-fg-10)',
          borderRadius: messages.length > 0 ? '0 0 12px 12px' : 12,
          padding: '24px 24px',
          textAlign: 'center',
          background: 'var(--lr-fg-10)',
        }}>
          <p className='font-heading text-sm mb-1' style={{ color: 'var(--lr-fg)' }}>
            {t('guest_exhausted_title', '免费体验已用完')}
          </p>
          <p className='text-xs mb-5' style={{ color: 'var(--lr-text-secondary)' }}>
            {t('guest_exhausted_desc', '注册后获得更多额度，首充 $10 享双倍 token')}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link to='/register'>
              <button style={{
                background: 'var(--lr-fg)', color: 'var(--lr-bg)',
                border: 'none', borderRadius: 9999,
                padding: '10px 28px', fontSize: 14, fontWeight: 500,
                cursor: 'pointer',
              }}>
                {t('guest_cta_register', '免费注册')}
              </button>
            </Link>
            <Link to='/login'>
              <button style={{
                background: 'transparent', color: 'var(--lr-fg)',
                border: '1px solid var(--lr-fg-20)', borderRadius: 9999,
                padding: '10px 28px', fontSize: 14,
                cursor: 'pointer',
              }}>
                {t('guest_cta_login', '已有账号')}
              </button>
            </Link>
          </div>
        </div>
      ) : (
        /* Input box */
        <div style={{
          border: '1px solid var(--lr-fg-20)',
          borderRadius: messages.length > 0 ? '0 0 12px 12px' : 12,
          background: 'var(--lr-bg)',
          overflow: 'hidden',
        }}>
          <textarea
            ref={inputRef}
            className='guest-chat-textarea'
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={messages.length === 0
              ? t('guest_placeholder', '问我任何问题——无需注册，直接开始……')
              : t('guest_placeholder_cont', '继续对话…')}
            rows={3}
            style={{
              width: '100%',
              padding: '16px 20px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 15,
              lineHeight: 1.6,
              color: 'var(--lr-fg)',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px 12px',
            borderTop: '1px solid var(--lr-fg-10)',
          }}>
            {error ? (
              <span style={{ fontSize: 12, color: '#e53e3e' }}>{error}</span>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--lr-text-tertiary)', fontFamily: 'monospace' }}>
                {remaining > 0
                  ? t('guest_remaining', `还剩 ${remaining} 次免费体验`, { n: remaining })
                  : ''}
              </span>
            )}
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? 'var(--lr-fg-20)' : 'var(--lr-fg)',
                color: loading || !input.trim() ? 'var(--lr-text-tertiary)' : 'var(--lr-bg)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 500,
                cursor: loading || !input.trim() ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {loading ? '…' : t('guest_send', '发送')}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .guest-chat-textarea::placeholder {
          color: var(--lr-text-tertiary);
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
