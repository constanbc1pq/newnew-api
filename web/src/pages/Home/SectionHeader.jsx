export default function SectionHeader({ number, slug, importLine, actionLabel, onAction }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-12 border-b min-h-[6rem] md:h-32' style={{ borderColor: 'var(--lr-fg-10)' }}>
      <div className='col-span-1 md:col-span-6 border-b md:border-b-0 md:border-r flex flex-col relative' style={{ borderColor: 'var(--lr-fg-10)' }}>
        <div className='absolute top-0 right-0 w-24 h-24 diagonal-pattern hidden md:block' />
        <div className='h-12 md:h-16 flex items-center px-4 md:px-6 border-b' style={{ borderColor: 'var(--lr-fg-10)' }}>
          <span className='font-heading text-[10px] tracking-[0.3em]' style={{ color: 'var(--lr-fg-40)' }}>
            {number} // {slug}
          </span>
        </div>
        <div className='flex-1 flex flex-col justify-end px-4 md:px-6 py-3 md:pb-4'>
          <h2 className='text-lg md:text-2xl font-light font-heading' style={{ color: 'var(--lr-fg)' }}>
            {importLine}
          </h2>
        </div>
      </div>
      <div className='col-span-1 md:col-span-6 flex flex-col justify-center md:justify-end px-4 md:px-6 py-3 md:pb-4'>
        {actionLabel && (
          <button
            onClick={onAction}
            className='group flex items-center gap-3 font-heading text-[10px] uppercase tracking-[0.2em] transition-colors'
            style={{ color: 'var(--lr-fg)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--lr-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--lr-fg)'}
          >
            <span>{actionLabel}</span>
            <svg className='w-4 h-4 transition-transform group-hover:translate-x-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='1' d='M17 8l4 4m0 0l-4 4m4-4H3' />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
