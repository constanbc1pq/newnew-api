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

import React, { useMemo } from 'react';
import { Empty, Button, Typography } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import { Key, Wallet } from 'lucide-react';
import CardTable from '../../common/ui/CardTable';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
  IllustrationIdle,
  IllustrationIdleDark,
} from '@douyinfe/semi-illustrations';
import { getTokensColumns } from './TokensColumnDefs';

// Empty state for brand-new users with no tokens
const EmptyTokensState = ({ t, setEditingToken, setShowEdit }) => {
  const navigate = useNavigate();
  return (
    <Empty
      image={<IllustrationIdle style={{ width: 150, height: 150 }} />}
      darkModeImage={<IllustrationIdleDark style={{ width: 150, height: 150 }} />}
      title={t('还没有 API Key')}
      description={
        <Typography.Text type='secondary' style={{ fontSize: '13px' }}>
          {t('创建第一个 API Key 即可接入 AI 服务，兼容 OpenAI SDK')}
        </Typography.Text>
      }
      style={{ padding: '40px 30px' }}
    >
      <div className='flex gap-2 justify-center flex-wrap'>
        <Button
          type='primary'
          theme='solid'
          icon={<Key size={15} />}
          onClick={() => {
            setEditingToken({ id: 0 });
            setShowEdit(true);
          }}
          className='!rounded-lg'
        >
          {t('创建 API Key')}
        </Button>
        <Button
          theme='outline'
          type='tertiary'
          icon={<Wallet size={15} />}
          onClick={() => navigate('/console/topup')}
          className='!rounded-lg'
        >
          {t('先去充值')}
        </Button>
      </div>
    </Empty>
  );
};

const TokensTable = (tokensData) => {
  const {
    tokens,
    loading,
    activePage,
    pageSize,
    tokenCount,
    compactMode,
    searching,
    handlePageChange,
    handlePageSizeChange,
    rowSelection,
    handleRow,
    showKeys,
    resolvedTokenKeys,
    loadingTokenKeys,
    toggleTokenVisibility,
    copyTokenKey,
    copyTokenConnectionString,
    manageToken,
    onOpenLink,
    setEditingToken,
    setShowEdit,
    refresh,
    t,
  } = tokensData;

  // Get all columns
  const columns = useMemo(() => {
    return getTokensColumns({
      t,
      showKeys,
      resolvedTokenKeys,
      loadingTokenKeys,
      toggleTokenVisibility,
      copyTokenKey,
      copyTokenConnectionString,
      manageToken,
      onOpenLink,
      setEditingToken,
      setShowEdit,
      refresh,
    });
  }, [
    t,
    showKeys,
    resolvedTokenKeys,
    loadingTokenKeys,
    toggleTokenVisibility,
    copyTokenKey,
    copyTokenConnectionString,
    manageToken,
    onOpenLink,
    setEditingToken,
    setShowEdit,
    refresh,
  ]);

  // Handle compact mode by removing fixed positioning
  const tableColumns = useMemo(() => {
    return compactMode
      ? columns.map((col) => {
          if (col.dataIndex === 'operate') {
            const { fixed, ...rest } = col;
            return rest;
          }
          return col;
        })
      : columns;
  }, [compactMode, columns]);

  return (
    <CardTable
      columns={tableColumns}
      dataSource={tokens}
      scroll={compactMode ? undefined : { x: 'max-content' }}
      pagination={{
        currentPage: activePage,
        pageSize: pageSize,
        total: tokenCount,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        onPageSizeChange: handlePageSizeChange,
        onPageChange: handlePageChange,
      }}
      hidePagination={true}
      loading={loading}
      rowSelection={rowSelection}
      onRow={handleRow}
      empty={
        !loading && tokenCount === 0 && !searching ? (
          <EmptyTokensState
            t={t}
            setEditingToken={setEditingToken}
            setShowEdit={setShowEdit}
          />
        ) : (
          <Empty
            image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
            darkModeImage={
              <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
            }
            description={t('搜索无结果')}
            style={{ padding: 30 }}
          />
        )
      }
      className='rounded-xl overflow-hidden'
      size='middle'
    />
  );
};

export default TokensTable;
