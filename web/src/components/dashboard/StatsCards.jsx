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
import { Skeleton } from '@douyinfe/semi-ui';
import { VChart } from '@visactor/react-vchart';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const StatsCards = ({
  groupedStatsData,
  loading,
  getTrendSpec,
  CARD_PROPS,
  CHART_CONFIG,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className='mb-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {groupedStatsData.map((group, idx) => (
          <div
            key={idx}
            style={{
              background: '#fff',
              border: '1.5px solid #e5e7eb',
              borderRadius: '18px',
              padding: '16px 20px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {group.title}
            </div>
            <div className='space-y-4'>
              {group.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className='flex items-center justify-between cursor-pointer'
                  onClick={item.onClick}
                >
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{item.title}</div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', lineHeight: 1.2 }}>
                      <Skeleton
                        loading={loading}
                        active
                        placeholder={
                          <Skeleton.Paragraph
                            active
                            rows={1}
                            style={{
                              width: '65px',
                              height: '24px',
                              marginTop: '4px',
                            }}
                          />
                        }
                      >
                        {item.value}
                      </Skeleton>
                    </div>
                  </div>
                  {item.title === t('当前余额') ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/console/topup');
                      }}
                      style={{
                        padding: '5px 14px',
                        borderRadius: '9999px',
                        background: '#000',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {t('充值')}
                    </button>
                  ) : (
                    (loading ||
                      (item.trendData && item.trendData.length > 0)) && (
                      <div className='w-24 h-10'>
                        <VChart
                          spec={getTrendSpec(item.trendData, item.trendColor)}
                          option={CHART_CONFIG}
                        />
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsCards;
