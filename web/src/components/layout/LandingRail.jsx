import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, LayoutDashboard, BookOpen, Info } from 'lucide-react';
import { getLogo } from '../../helpers';

const RAIL_W = 64; // px — icon-only rail

const RailItem = ({ to, icon: Icon, label, exact }) => {
  return (
    <NavLink
      to={to}
      end={exact}
      title={label}
      style={({ isActive }) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        width: 48,
        height: 48,
        borderRadius: 12,
        textDecoration: 'none',
        transition: 'background 0.15s',
        background: isActive ? 'var(--lr-fg-10)' : 'transparent',
        color: isActive ? 'var(--lr-fg)' : 'var(--lr-fg-40)',
      })}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--lr-fg-10)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '';
      }}
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
          <span style={{ fontSize: 9, letterSpacing: '0.04em', lineHeight: 1, fontFamily: 'var(--font-heading, system-ui)' }}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
};

const LandingRail = () => {
  const { t } = useTranslation();

  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: RAIL_W,
        background: 'var(--lr-rail-bg)',
        borderRight: '1px solid var(--lr-rail-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo */}
      <NavLink to='/' style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}>
        {(() => {
          const logo = getLogo();
          if (logo) return <img src={logo} alt='logo' style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />;
          return (
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--lr-logo-sq-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700,
              color: 'var(--lr-logo-sq-text)',
              fontFamily: 'var(--font-heading, system-ui)',
            }}>
              M
            </div>
          );
        })()}
      </NavLink>

      {/* Primary nav */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
        <RailItem to='/' exact icon={Home} label={t('首页')} />
        <RailItem to='/console' icon={LayoutDashboard} label={t('控制台')} />
      </div>

      {/* Secondary nav at bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingBottom: 8 }}>
        <RailItem to='/docs' icon={BookOpen} label={t('文档')} />
        <RailItem to='/about' icon={Info} label={t('关于')} />
      </div>
    </nav>
  );
};

export { RAIL_W };
export default LandingRail;
