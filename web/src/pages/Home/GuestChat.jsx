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
  const [showModal, setShowModal] = useState(true);
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
        setShowModal(true);
        return;
      }
      if (data?.error === 'guest_trial_not_configured') {
        setError(t('guest_not_configured', '试用功能暂未开放，请注册后使用。'));
        return;
      }
      if (data?.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        setStatus({ used: data.used, max: data.max, remaining: data.remaining, exhausted: data.remaining <= 0 });
        if (data.remaining <= 0) setShowModal(true);
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

  const showExhausted = status.exhausted || (status.max - status.used) <= 0;

  return (
    <div className='guest-chat-root' style={{ width: '100%', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', isolation: 'isolate' }}>

      {/* Full-screen exhausted modal */}
      {showExhausted && showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: 'var(--lr-bg)',
            borderRadius: 16,
            padding: '40px 32px',
            maxWidth: 460,
            width: '100%',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 22, fontWeight: 500, marginBottom: 8, color: 'var(--lr-fg)' }}>
              {t('guest_exhausted_title', '体验结束了')}
            </p>
            <p style={{ fontSize: 14, color: 'var(--lr-text-secondary)', marginBottom: 28 }}>
              {t('guest_exhausted_subtitle', '选一个适合你的方案，解锁无限次对话')}
            </p>

            {/* Plan cards */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
              {/* Card 1: 日常使用 */}
              <div style={{
                flex: '1 1 120px',
                border: '1px solid var(--lr-fg-20)',
                borderRadius: 12,
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--lr-fg)' }}>日常使用</span>
                <span style={{ fontSize: 12, color: 'var(--lr-text-secondary)', lineHeight: 1.5 }}>按量计费，用多少付多少</span>
                <Link to='/register' style={{ marginTop: 8, width: '100%' }}>
                  <button style={{
                    width: '100%',
                    background: 'transparent',
                    color: 'var(--lr-fg)',
                    border: '1px solid var(--lr-fg-20)',
                    borderRadius: 9999,
                    padding: '7px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}>
                    立即注册
                  </button>
                </Link>
              </div>

              {/* Card 2: 开发者 (highlighted) */}
              <div style={{
                flex: '1 1 120px',
                border: '2px solid #000',
                borderRadius: 12,
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                alignItems: 'center',
                background: 'rgba(0,0,0,0.03)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--lr-fg)' }}>开发者</span>
                <span style={{ fontSize: 12, color: 'var(--lr-text-secondary)', lineHeight: 1.5 }}>订阅套餐 · 更低单价</span>
                <Link to='/console/subscription' style={{ marginTop: 8, width: '100%' }}>
                  <button style={{
                    width: '100%',
                    background: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 9999,
                    padding: '7px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}>
                    查看套餐
                  </button>
                </Link>
              </div>

              {/* Card 3: 团队/企业 */}
              <div style={{
                flex: '1 1 120px',
                border: '1px solid var(--lr-fg-20)',
                borderRadius: 12,
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--lr-fg)' }}>团队/企业</span>
                <span style={{ fontSize: 12, color: 'var(--lr-text-secondary)', lineHeight: 1.5 }}>高并发 · 专属支持</span>
                <a href='mailto:support@marketrouter.ai' style={{ marginTop: 8, width: '100%' }}>
                  <button style={{
                    width: '100%',
                    background: 'transparent',
                    color: 'var(--lr-fg)',
                    border: '1px solid var(--lr-fg-20)',
                    borderRadius: 9999,
                    padding: '7px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}>
                    联系我们
                  </button>
                </a>
              </div>
            </div>

            {/* Dismiss link */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 12,
                color: 'var(--lr-text-tertiary)',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              {t('guest_dismiss', '继续体验限制版')}
            </button>
          </div>
        </div>
      )}

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

      {/* Input box — always shown, disabled when exhausted */}
      <div style={{
        border: '1px solid var(--lr-fg-20)',
        borderRadius: messages.length > 0 ? '0 0 12px 12px' : 12,
        background: 'var(--lr-bg)',
        overflow: 'hidden',
        opacity: showExhausted ? 0.6 : 1,
      }}>
        <textarea
          ref={inputRef}
          className='guest-chat-textarea'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={showExhausted
            ? '已用完免费体验次数'
            : messages.length === 0
              ? t('guest_placeholder', '问我任何问题——无需注册，直接开始……')
              : t('guest_placeholder_cont', '继续对话…')}
          rows={3}
          disabled={showExhausted}
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
            cursor: showExhausted ? 'not-allowed' : 'text',
          }}
        />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: error ? 'space-between' : 'flex-end',
          padding: '8px 16px 12px',
          borderTop: '1px solid var(--lr-fg-10)',
        }}>
          {error && (
            <span style={{ fontSize: 12, color: '#e53e3e' }}>{error}</span>
          )}
          <button
            onClick={send}
            disabled={loading || !input.trim() || showExhausted}
            style={{
              background: loading || !input.trim() || showExhausted ? 'var(--lr-fg-20)' : 'var(--lr-fg)',
              color: loading || !input.trim() || showExhausted ? 'var(--lr-text-tertiary)' : 'var(--lr-bg)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 500,
              cursor: loading || !input.trim() || showExhausted ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {loading ? '…' : t('guest_send', '发送')}
          </button>
        </div>
      </div>

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
