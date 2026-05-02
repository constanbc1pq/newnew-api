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
import { RefreshCw, Search } from 'lucide-react';

const DashboardHeader = ({
  getGreeting,
  greetingVisible,
  showSearchModal,
  refresh,
  loading,
  t,
}) => {
  return (
    <div className='flex items-center justify-between mb-4'>
      <h2
        style={{ fontSize: '20px', fontWeight: 600, color: 'var(--mr-text-primary)', opacity: greetingVisible ? 1 : 0, transition: 'opacity 1s ease-in-out', margin: 0 }}
      >
        {getGreeting}
      </h2>
      <div className='flex gap-2'>
        <button
          onClick={showSearchModal}
          style={{ width: 34, height: 34, borderRadius: '9999px', border: '1px solid var(--mr-border-default)', background: 'var(--mr-bg-surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--mr-text-secondary)' }}
        >
          <Search size={15} />
        </button>
        <button
          onClick={refresh}
          disabled={loading}
          style={{ width: 34, height: 34, borderRadius: '9999px', border: '1px solid var(--mr-border-default)', background: 'var(--mr-bg-surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--mr-text-secondary)', opacity: loading ? 0.5 : 1 }}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
