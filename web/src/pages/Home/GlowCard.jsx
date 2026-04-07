export default function GlowCard({ children, className = '' }) {
  return (
    <div
      className={`
        p-6 md:p-8 rounded-2xl
        bg-semi-color-bg-0 border border-semi-color-border
        transition-all duration-300
        hover:border-semi-color-primary hover:shadow-[0_0_24px_rgba(124,58,237,0.15)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}
