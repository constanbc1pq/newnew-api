import { useActualTheme } from '../../context/Theme';

export default function GameOfLifeBackground() {
  const theme = useActualTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className='absolute inset-0 pointer-events-none'
      style={{
        backgroundImage: `
          linear-gradient(${isDark ? 'rgba(250,250,250,0.03)' : 'rgba(9,9,11,0.04)'} 1px, transparent 1px),
          linear-gradient(90deg, ${isDark ? 'rgba(250,250,250,0.03)' : 'rgba(9,9,11,0.04)'} 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}
    >
      <div
        className='absolute inset-0'
        style={{
          background: `radial-gradient(circle at 30% 40%, ${isDark ? 'rgba(167,139,250,0.06)' : 'rgba(124,58,237,0.04)'} 0%, transparent 50%),
                       radial-gradient(circle at 70% 60%, ${isDark ? 'rgba(167,139,250,0.04)' : 'rgba(124,58,237,0.03)'} 0%, transparent 50%)`,
        }}
      />
    </div>
  );
}
