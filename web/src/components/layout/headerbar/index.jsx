/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React from 'react';
import { useHeaderBar } from '../../../hooks/common/useHeaderBar';
import { useNotifications } from '../../../hooks/common/useNotifications';
import { useNavigation } from '../../../hooks/common/useNavigation';
import NoticeModal from '../NoticeModal';
import MobileMenuButton from './MobileMenuButton';
import HeaderLogo from './HeaderLogo';
import Navigation from './Navigation';
import ActionButtons from './ActionButtons';

const HeaderBar = ({ onMobileMenuToggle, drawerOpen, hideLogo = false, hideNav = false }) => {
  const {
    userState,
    statusState,
    isMobile,
    collapsed,
    logoLoaded,
    currentLang,
    isLoading,
    systemName,
    logo,
    isNewYear,
    isSelfUseMode,
    docsLink,
    isDemoSiteMode,
    isConsoleRoute,
    theme,
    headerNavModules,
    pricingRequireAuth,
    logout,
    handleLanguageChange,
    handleThemeToggle,
    handleMobileMenuToggle,
    navigate,
    t,
  } = useHeaderBar({ onMobileMenuToggle, drawerOpen });

  const {
    noticeVisible,
    unreadCount,
    handleNoticeOpen,
    handleNoticeClose,
    getUnreadKeys,
  } = useNotifications(statusState);

  const { mainNavLinks } = useNavigation(t, docsLink, headerNavModules);

  return (
    <header
      className='text-semi-color-text-0 transition-colors duration-300 backdrop-blur-md font-heading'
      style={hideLogo
        ? { background: 'transparent', border: 'none' }
        : isConsoleRoute
          ? { background: 'var(--semi-color-bg-0)', borderBottom: '1px solid var(--semi-color-border)' }
          : theme === 'dark'
            ? { background: 'rgba(29,29,31,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)' }
            : { background: 'rgba(245,245,247,0.85)', borderBottom: '1px solid rgba(0,0,0,0.07)' }
      }
    >
      <NoticeModal
        visible={noticeVisible}
        onClose={handleNoticeClose}
        isMobile={isMobile}
        defaultTab={unreadCount > 0 ? 'system' : 'inApp'}
        unreadKeys={getUnreadKeys()}
      />

      <div className='w-full px-2'>
        <div className='flex items-center justify-between h-16'>
          {!hideLogo && (
            <div className='flex items-center'>
              <MobileMenuButton
                isConsoleRoute={isConsoleRoute}
                isMobile={isMobile}
                drawerOpen={drawerOpen}
                collapsed={collapsed}
                onToggle={handleMobileMenuToggle}
                t={t}
              />

              <HeaderLogo
                isMobile={isMobile}
                isConsoleRoute={isConsoleRoute}
                logo={logo}
                logoLoaded={logoLoaded}
                isLoading={isLoading}
                systemName={systemName}
                isSelfUseMode={isSelfUseMode}
                isDemoSiteMode={isDemoSiteMode}
                t={t}
              />
            </div>
          )}

          {!hideNav && !isConsoleRoute && (
            <Navigation
              mainNavLinks={mainNavLinks}
              isMobile={isMobile}
              isLoading={isLoading}
              userState={userState}
              pricingRequireAuth={pricingRequireAuth}
            />
          )}
          {(hideLogo || isConsoleRoute) && <div className='flex-1' />}

          <ActionButtons
            isNewYear={isNewYear}
            unreadCount={unreadCount}
            onNoticeOpen={handleNoticeOpen}
            theme={theme}
            onThemeToggle={handleThemeToggle}
            currentLang={currentLang}
            onLanguageChange={handleLanguageChange}
            userState={userState}
            isLoading={isLoading}
            isMobile={isMobile}
            isSelfUseMode={isSelfUseMode}
            logout={logout}
            navigate={navigate}
            t={t}
          />
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
