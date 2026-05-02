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

import React, { useState } from 'react';
import { Button } from '@douyinfe/semi-ui';
import CompactModeToggle from '../../common/ui/CompactModeToggle';
import ConfirmModal from '../../common/modals/ConfirmModal';

const DeploymentsActions = ({
  selectedKeys,
  setSelectedKeys,
  setEditingDeployment,
  setShowEdit,
  batchDeleteDeployments,
  batchOperationsEnabled = true,
  compactMode,
  setCompactMode,
  showCreateModal,
  setShowCreateModal,
  t,
}) => {
  const hasSelected = batchOperationsEnabled && selectedKeys.length > 0;
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  const handleAddDeployment = () => {
    if (setShowCreateModal) {
      setShowCreateModal(true);
    } else {
      // Fallback to old behavior if setShowCreateModal is not provided
      setEditingDeployment({ id: undefined });
      setShowEdit(true);
    }
  };

  const handleBatchDelete = () => {
    batchDeleteDeployments();
  };

  const handleDeselectAll = () => {
    setSelectedKeys([]);
  };

  return (
    <div className='flex flex-wrap gap-2 w-full md:w-auto order-2 md:order-1'>
      <Button
        type='primary'
        className='flex-1 md:flex-initial'
        onClick={handleAddDeployment}
        size='small'
      >
        {t('新建容器')}
      </Button>

      {hasSelected && (
        <>
          <Button
            type='danger'
            className='flex-1 md:flex-initial'
            disabled={selectedKeys.length === 0}
            size='small'
            onClick={() => setBatchDeleteOpen(true)}
          >
            {t('批量删除')} ({selectedKeys.length})
          </Button>
          <ConfirmModal
            visible={batchDeleteOpen}
            type='danger'
            title={t('确认删除')}
            content={`${t('确定要删除选中的')} ${selectedKeys.length} ${t('个部署吗？此操作不可逆。')}`}
            okText={t('删除')}
            onCancel={() => setBatchDeleteOpen(false)}
            onOk={async () => {
              await handleBatchDelete();
              setBatchDeleteOpen(false);
            }}
          />

          <Button
            type='tertiary'
            className='flex-1 md:flex-initial'
            onClick={handleDeselectAll}
            size='small'
          >
            {t('取消选择')}
          </Button>
        </>
      )}

      {/* Compact Mode */}
      <CompactModeToggle
        compactMode={compactMode}
        setCompactMode={setCompactMode}
        t={t}
      />
    </div>
  );
};

export default DeploymentsActions;
