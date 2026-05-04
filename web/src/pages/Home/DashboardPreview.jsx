import React from 'react';

const BARS = [38, 62, 44, 78, 52, 94, 68];
const NAV = ['Dashboard', 'Models', 'API Keys', 'Usage', 'Billing'];
const MODELS = [
  { name: 'gpt-4o', latency: '42ms', cost: '$0.005' },
  { name: 'claude-3-5-sonnet', latency: '61ms', cost: '$0.003' },
  { name: 'deepseek-v3', latency: '38ms', cost: '$0.001' },
];

const S = {
  shell: {
    border: '1px solid var(--lr-fg-10)',
    borderRadius: 12,
    overflow: 'hidden',
    background: 'var(--lr-bg)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.07)',
    maxWidth: 880,
    margin: '0 auto',
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: 12,
    userSelect: 'none',
  },
  chrome: {
    background: 'var(--lr-fg-10)',
    borderBottom: '1px solid var(--lr-fg-10)',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.12)',
  },
  urlbar: {
    flex: 1, maxWidth: 260, marginLeft: 16,
    background: 'rgba(0,0,0,0.05)', borderRadius: 6,
    padding: '4px 10px', fontSize: 11, color: 'var(--lr-fg-40)',
  },
  layout: { display: 'flex', minHeight: 360 },
  sidebar: {
    width: 148, borderRight: '1px solid var(--lr-fg-10)',
    padding: '16px 0', flexShrink: 0,
  },
  sidebarLogo: {
    padding: '0 14px 14px',
    display: 'flex', alignItems: 'center', gap: 8,
    borderBottom: '1px solid var(--lr-fg-10)', marginBottom: 8,
  },
  main: { flex: 1, padding: '16px 20px', overflow: 'hidden' },
  card: {
    border: '1px solid var(--lr-fg-10)', borderRadius: 8,
    padding: '12px 14px', marginBottom: 10,
  },
  label: {
    fontSize: 9, color: 'var(--lr-fg-40)',
    textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4,
  },
  statValue: { fontSize: 20, fontWeight: 300, color: 'var(--lr-fg)' },
  pill: {
    display: 'inline-block', padding: '2px 8px',
    borderRadius: 4, fontSize: 10, fontWeight: 500,
  },
};

export default function DashboardPreview() {
  return (
    <div style={S.shell}>
      {/* Browser chrome */}
      <div style={S.chrome}>
        <div style={S.dot} /><div style={S.dot} /><div style={S.dot} />
        <div style={S.urlbar}>console.marketrouter.ai</div>
      </div>

      <div style={S.layout}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={S.sidebarLogo}>
            <svg width="20" height="20" viewBox="0 0 512 512" fill="none">
              <rect width="512" height="512" rx="96" fill="#0a0a0a"/>
              <path d="M124 376L124 144L256 272L388 144L388 376"
                stroke="white" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <span style={{ fontWeight: 500, fontSize: 11, color: 'var(--lr-fg)' }}>Market Router</span>
          </div>
          {NAV.map((item, i) => (
            <div key={item} style={{
              padding: '7px 14px',
              color: i === 0 ? 'var(--lr-fg)' : 'var(--lr-fg-40)',
              background: i === 0 ? 'var(--lr-fg-10)' : 'transparent',
              fontWeight: i === 0 ? 500 : 400,
              fontSize: 12,
            }}>
              {item}
            </div>
          ))}
        </div>

        {/* Main area */}
        <div style={S.main}>

          {/* Top row: key + 2 stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            {/* API key */}
            <div style={S.card}>
              <div style={S.label}>API Key</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--lr-fg-60)', letterSpacing: '0.04em' }}>
                  sk-mr-••••••••••••••••••2f
                </span>
                <span style={{
                  ...S.pill,
                  border: '1px solid var(--lr-fg-20)', color: 'var(--lr-fg-40)',
                }}>
                  Copy
                </span>
              </div>
            </div>
            {/* Balance */}
            <div style={S.card}>
              <div style={S.label}>Balance</div>
              <div style={S.statValue}>$24.80</div>
            </div>
            {/* Requests */}
            <div style={S.card}>
              <div style={S.label}>Today</div>
              <div style={S.statValue}>1,247</div>
            </div>
          </div>

          {/* Bottom row: chart + model table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Usage chart */}
            <div style={S.card}>
              <div style={S.label}>Usage · 7 days</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 52, marginTop: 8 }}>
                {BARS.map((h, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: `${h}%`,
                    background: i === 5 ? 'var(--lr-fg)' : 'var(--lr-fg-10)',
                    borderRadius: 3,
                  }} />
                ))}
              </div>
            </div>

            {/* Model table */}
            <div style={S.card}>
              <div style={S.label}>Top Models</div>
              <div style={{ marginTop: 6 }}>
                {MODELS.map(({ name, latency, cost }) => (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '4px 0',
                    borderBottom: '1px solid var(--lr-fg-10)',
                  }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--lr-fg)' }}>{name}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ ...S.pill, background: 'var(--lr-fg-10)', color: 'var(--lr-fg-40)' }}>{latency}</span>
                      <span style={{ ...S.pill, background: 'var(--lr-fg-10)', color: 'var(--lr-fg-40)' }}>{cost}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
