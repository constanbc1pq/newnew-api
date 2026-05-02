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
import { Link, useLocation } from 'react-router-dom';
import SkeletonWrapper from '../components/SkeletonWrapper';

const Navigation = ({
  mainNavLinks,
  isMobile,
  isLoading,
  userState,
  pricingRequireAuth,
}) => {
  const { pathname } = useLocation();

  const isLinkActive = (link, targetPath) => {
    if (link.isExternal) return false;
    if (targetPath === '/') return pathname === '/';
    return pathname === targetPath || pathname.startsWith(targetPath + '/');
  };

  const renderNavLinks = () => {
    const baseClasses =
      'flex-shrink-0 flex items-center gap-1 rounded-md transition-all duration-200 ease-in-out';
    const hoverClasses = 'hover:text-semi-color-primary';
    const spacingClasses = isMobile ? 'p-1' : 'p-2';

    const commonLinkClasses = `${baseClasses} ${spacingClasses} ${hoverClasses}`;

    return mainNavLinks.map((link) => {
      let targetPath = link.to;
      if (link.itemKey === 'console' && !userState.user) {
        targetPath = '/login';
      }
      if (link.itemKey === 'pricing' && pricingRequireAuth && !userState.user) {
        targetPath = '/login';
      }

      const active = isLinkActive(link, targetPath);

      const linkContent = (
        <span
          className='font-display relative inline-block'
          style={{
            fontWeight: active ? 600 : 400,
            letterSpacing: '-0.022em',
            color: active ? 'var(--semi-color-text-0)' : 'var(--semi-color-text-1)',
          }}
        >
          {link.text}
          {active && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -6,
                height: 2,
                borderRadius: 2,
                background: 'var(--semi-color-text-0)',
              }}
            />
          )}
        </span>
      );

      if (link.isExternal) {
        return (
          <a
            key={link.itemKey}
            href={link.externalLink}
            target='_blank'
            rel='noopener noreferrer'
            className={commonLinkClasses}
          >
            {linkContent}
          </a>
        );
      }

      return (
        <Link
          key={link.itemKey}
          to={targetPath}
          className={commonLinkClasses}
          aria-current={active ? 'page' : undefined}
        >
          {linkContent}
        </Link>
      );
    });
  };

  return (
    <nav className='flex flex-1 items-center gap-1 lg:gap-2 mx-2 md:mx-4 overflow-x-auto whitespace-nowrap scrollbar-hide'>
      <SkeletonWrapper
        loading={isLoading}
        type='navigation'
        count={4}
        width={60}
        height={16}
        isMobile={isMobile}
      >
        {renderNavLinks()}
      </SkeletonWrapper>
    </nav>
  );
};

export default Navigation;
