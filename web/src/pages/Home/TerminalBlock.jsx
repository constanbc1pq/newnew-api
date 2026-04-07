import { useTranslation } from 'react-i18next';

const LINES = [
  { type: 'cmd', key: 'terminal_line_1' },
  { type: 'out', key: 'terminal_line_2' },
  { type: 'blank' },
  { type: 'cmd', key: 'terminal_line_3' },
  { type: 'out', key: 'terminal_line_4' },
  { type: 'blank' },
  { type: 'cmd', key: 'terminal_line_5' },
  { type: 'out', key: 'terminal_line_6' },
];

export default function TerminalBlock() {
  const { t } = useTranslation();

  return (
    <div className='w-full max-w-2xl mx-auto border' style={{ borderColor: 'var(--lr-fg-10)', background: 'var(--lr-bg)' }}>
      <div className='flex items-center px-4 py-2 border-b' style={{ borderColor: 'var(--lr-fg-10)' }}>
        <span className='font-heading text-[9px] tracking-widest' style={{ color: 'var(--lr-fg-20)' }}>
          // terminal
        </span>
      </div>
      <div className='px-5 py-4 font-heading text-sm leading-7 overflow-x-auto'>
        {LINES.map((line, i) => {
          if (line.type === 'blank') return <div key={i} className='h-2' />;
          if (line.type === 'cmd') {
            return (
              <div key={i} style={{ color: 'var(--lr-fg)' }}>
                <span style={{ color: 'var(--lr-primary)' }}>$</span>{' '}
                {t(line.key)}
              </div>
            );
          }
          return (
            <div key={i} className='pl-4' style={{ color: 'var(--lr-fg-40)' }}>
              {t(line.key)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
