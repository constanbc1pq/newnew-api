import { useState } from 'react';

export default function ScenarioCard({ index, title, tags, savings, code }) {
  const [hovered, setHovered] = useState(false);
  const active = hovered;

  return (
    <div
      className='border-b border-r'
      style={{ borderColor: 'var(--lr-fg-10)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Golden ratio visual area */}
      <div className='relative overflow-hidden' style={{ aspectRatio: '1.618 / 1', background: 'var(--lr-bg)' }}>
        {/* Default: radial glow + rotated square */}
        <div className='absolute inset-0 transition-opacity duration-500' style={{ opacity: active ? 0 : 1 }}>
          <div className='absolute inset-0 radial-glow' />
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='w-10 h-10 border rotate-45' style={{ borderColor: 'var(--lr-fg-10)' }} />
          </div>
        </div>
        {/* Hover: show code snippet */}
        <div className='absolute inset-0 flex items-center justify-center px-6 transition-opacity duration-500' style={{ opacity: active ? 1 : 0 }}>
          <pre className='font-heading text-xs md:text-sm whitespace-pre-wrap break-all' style={{ color: 'var(--lr-primary)' }}>
            {code}
          </pre>
        </div>
      </div>
      {/* Card info */}
      <div className='flex flex-col transition-colors' style={{ background: active ? 'var(--lr-primary-5)' : 'transparent' }}>
        <div className='h-8 flex items-center px-3 border-t' style={{ borderColor: 'var(--lr-fg-10)' }}>
          <span className='font-heading text-[9px] tracking-widest' style={{ color: active ? 'var(--lr-primary)' : 'var(--lr-fg-20)' }}>
            use[{index}]
          </span>
        </div>
        <div className='px-3 pb-2'>
          <h3 className='text-sm font-light font-heading' style={{ color: active ? 'var(--lr-primary)' : 'var(--lr-fg)' }}>
            {title}
          </h3>
        </div>
        <div className='h-8 flex items-center justify-between px-3 border-t' style={{ borderColor: 'var(--lr-fg-10)' }}>
          <span className='font-heading text-[8px] tracking-widest truncate mr-2' style={{ color: 'var(--lr-fg-40)' }}>
            ["{tags.join('", "')}"]
          </span>
          {savings && (
            <span className='font-heading text-[9px] whitespace-nowrap' style={{ color: 'var(--lr-fg-20)' }}>
              ~{savings}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
