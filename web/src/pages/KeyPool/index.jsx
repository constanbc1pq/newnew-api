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

import React, { useEffect, useState, useRef } from 'react';
import {
  Button,
  Switch,
  Spin,
  Typography,
  Tag,
  Popconfirm,
  Badge,
  SideSheet,
  Form,
  Empty,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconChevronDown,
  IconChevronRight,
  IconRefresh,
  IconCopy,
  IconEdit,
} from '@douyinfe/semi-icons';
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
} from '@douyinfe/semi-illustrations';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../helpers';

const { Title, Text } = Typography;

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

const getRotationModes = (t) => [
  { label: `${t('轮询')} (Round Robin)`, value: 'round_robin' },
  { label: t('加权随机'), value: 'weighted' },
  { label: t('随机'), value: 'random' },
];

const DEFAULT_POOL = { name: '', description: '', rotation_mode: 'round_robin', enabled: true };
const DEFAULT_ENTRY = { name: '', key: '', provider: '', weight: 1, enabled: true };

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function RotationBadge({ mode }) {
  const { t } = useTranslation();
  const map = {
    round_robin: { color: 'blue', label: t('轮询') },
    weighted: { color: 'purple', label: t('加权') },
    random: { color: 'teal', label: t('随机') },
  };
  const m = map[mode] || { color: 'grey', label: mode };
  return <Tag color={m.color} size='small'>{m.label}</Tag>;
}

function StatusDot({ enabled }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: enabled ? 'var(--mr-success)' : 'var(--mr-text-disabled)',
        marginRight: 6,
        flexShrink: 0,
      }}
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Pool 编辑 SideSheet
// ────────────────────────────────────────────────────────────────────────────

function PoolEditSheet({ visible, onClose, pool, onSaved }) {
  const { t } = useTranslation();
  const formApiRef = useRef(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && formApiRef.current && pool) {
      formApiRef.current.setValues({
        name: pool.name,
        description: pool.description,
        rotation_mode: pool.rotation_mode,
      });
    }
  }, [visible, pool]);

  const handleSave = async () => {
    const values = await formApiRef.current?.validate().catch(() => null);
    if (!values) return;
    setSaving(true);
    try {
      const res = await API.put(`/api/admin/key_pools/${pool.id}`, { ...pool, ...values });
      if (res.data.success) {
        onSaved({ ...pool, ...values });
        showSuccess(t('保存成功'));
        onClose();
      } else {
        showError(res.data.message || t('保存失败'));
      }
    } catch (e) {
      showError(t('保存失败'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideSheet
      title={t('编辑 Key Pool')}
      visible={visible}
      onCancel={onClose}
      width={420}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>{t('取消')}</Button>
          <Button theme='solid' type='primary' loading={saving} onClick={handleSave}>
            {t('保存')}
          </Button>
        </div>
      }
    >
      <Form
        getFormApi={(api) => (formApiRef.current = api)}
        layout='vertical'
        initValues={{
          name: pool?.name || '',
          description: pool?.description || '',
          rotation_mode: pool?.rotation_mode || 'round_robin',
        }}
      >
        <Form.Input
          field='name'
          label={t('Pool 名称')}
          rules={[{ required: true, message: t('请输入 Pool 名称') }]}
        />
        <Form.Input
          field='description'
          label={t('备注（可选）')}
          placeholder={t('备注（可选）')}
        />
        <Form.Select
          field='rotation_mode'
          label={t('轮换模式')}
          optionList={getRotationModes(t)}
          style={{ width: '100%' }}
        />
      </Form>
    </SideSheet>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 添加 Key SideSheet
// ────────────────────────────────────────────────────────────────────────────

function AddKeySheet({ visible, onClose, poolId, onCreated }) {
  const { t } = useTranslation();
  const formApiRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const values = await formApiRef.current?.validate().catch(() => null);
    if (!values) return;
    setSaving(true);
    try {
      const res = await API.post(`/api/admin/key_pools/${poolId}/entries`, {
        ...DEFAULT_ENTRY,
        ...values,
        weight: values.weight || 1,
      });
      if (res.data.success) {
        onCreated(res.data.data);
        showSuccess(t('Key 已添加'));
        formApiRef.current?.reset();
        onClose();
      } else {
        showError(res.data.message || t('添加失败'));
      }
    } catch (e) {
      showError(t('添加失败'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideSheet
      title={t('添加 Key')}
      visible={visible}
      onCancel={onClose}
      width={420}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>{t('取消')}</Button>
          <Button theme='solid' type='primary' loading={saving} onClick={handleSave}>
            {t('确认')}
          </Button>
        </div>
      }
    >
      <Form
        getFormApi={(api) => (formApiRef.current = api)}
        layout='vertical'
        initValues={DEFAULT_ENTRY}
      >
        <Form.Input
          field='key'
          label='API Key'
          placeholder='sk-...'
          rules={[{ required: true, message: t('请输入 API Key') }]}
        />
        <Form.Input field='name' label={t('备注名（可选）')} />
        <Form.Input field='provider' label={t('提供商（可选）')} />
        <Form.InputNumber
          field='weight'
          label={t('权重')}
          min={1}
          initValue={1}
          style={{ width: '100%' }}
        />
      </Form>
    </SideSheet>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PoolCard — renders one pool + its entries
// ────────────────────────────────────────────────────────────────────────────

function PoolCard({ pool, onUpdated, onDeleted }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [addKeySheetOpen, setAddKeySheetOpen] = useState(false);

  async function loadEntries() {
    setLoadingEntries(true);
    try {
      const res = await API.get(`/api/admin/key_pools/${pool.id}/entries`);
      if (res.data.success) {
        setEntries(res.data.data || []);
      }
    } catch (e) {
      showError(t('加载失败'));
    } finally {
      setLoadingEntries(false);
    }
  }

  function handleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next && entries.length === 0) {
      loadEntries();
    }
  }

  async function togglePoolEnabled() {
    try {
      const res = await API.put(`/api/admin/key_pools/${pool.id}`, {
        ...pool,
        enabled: !pool.enabled,
      });
      if (res.data.success) {
        onUpdated({ ...pool, enabled: !pool.enabled });
      }
    } catch (e) {
      showError(t('操作失败'));
    }
  }

  async function toggleEntry(entry) {
    try {
      const res = await API.put(`/api/admin/key_pools/${pool.id}/entries/${entry.id}`, {
        ...entry,
        enabled: !entry.enabled,
      });
      if (res.data.success) {
        setEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, enabled: !e.enabled } : e))
        );
      }
    } catch (e) {
      showError(t('操作失败'));
    }
  }

  async function deleteEntry(entryId) {
    try {
      const res = await API.delete(`/api/admin/key_pools/${pool.id}/entries/${entryId}`);
      if (res.data.success) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
        showSuccess(t('已删除'));
      }
    } catch (e) {
      showError(t('删除失败'));
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--mr-border-default)',
        borderRadius: 18,
        overflow: 'hidden',
        background: 'var(--mr-bg-surface-1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          cursor: 'pointer',
          userSelect: 'none',
          background: expanded ? 'var(--mr-bg-surface-2)' : 'transparent',
          transition: 'background 0.15s',
        }}
        onClick={handleExpand}
      >
        <span style={{ color: 'var(--mr-text-tertiary)', flexShrink: 0 }}>
          {expanded ? <IconChevronDown /> : <IconChevronRight />}
        </span>
        <StatusDot enabled={pool.enabled} />
        <Text strong style={{ flex: 1, fontSize: 14 }}>{pool.name}</Text>

        <RotationBadge mode={pool.rotation_mode} />

        <Badge count={pool.entry_count ?? entries.length} overflowCount={99} type='primary' />

        <span
          style={{ display: 'flex', gap: 6, marginLeft: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button size='small' icon={<IconEdit />} onClick={() => setEditSheetOpen(true)} />
          <Switch size='small' checked={pool.enabled} onChange={togglePoolEnabled} />
          <Popconfirm
            title={t('确认删除这个 Key Pool？')}
            content={t('同时删除所有关联 Key')}
            onConfirm={() => onDeleted(pool.id)}
            okText={t('删除')}
            cancelText={t('取消')}
          >
            <Button size='small' type='danger' icon={<IconDelete />} />
          </Popconfirm>
        </span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--mr-border-subtle)', padding: '12px 16px' }}>
          {loadingEntries ? (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Spin />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onToggle={() => toggleEntry(entry)}
                  onDelete={() => deleteEntry(entry.id)}
                />
              ))}
              {entries.length === 0 && (
                <Text type='tertiary' style={{ padding: '4px 0' }}>
                  {t('暂无 Key，点击「添加 Key」开始')}
                </Text>
              )}
            </div>
          )}

          <Button
            size='small'
            icon={<IconPlus />}
            style={{ marginTop: 10 }}
            onClick={() => setAddKeySheetOpen(true)}
          >
            {t('添加 Key')}
          </Button>
        </div>
      )}

      <PoolEditSheet
        visible={editSheetOpen}
        onClose={() => setEditSheetOpen(false)}
        pool={pool}
        onSaved={onUpdated}
      />

      <AddKeySheet
        visible={addKeySheetOpen}
        onClose={() => setAddKeySheetOpen(false)}
        poolId={pool.id}
        onCreated={(entry) => setEntries((prev) => [...prev, entry])}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// EntryRow — single key entry
// ────────────────────────────────────────────────────────────────────────────

function EntryRow({ entry, onToggle, onDelete }) {
  const { t } = useTranslation();
  function copyKey() {
    navigator.clipboard.writeText(entry.masked_key || entry.encrypted_key || '').then(() => {
      showSuccess(t('已复制（掩码版本）'));
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 10,
        background: 'var(--mr-bg-surface-2)',
        opacity: entry.enabled ? 1 : 0.45,
      }}
    >
      <StatusDot enabled={entry.enabled} />
      <Text
        style={{ flex: 1, fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }}
        ellipsis={{ showTooltip: true }}
      >
        {entry.masked_key || entry.encrypted_key || '•••'}
      </Text>
      {entry.name && (
        <Text type='tertiary' style={{ fontSize: 12, maxWidth: 120 }} ellipsis>
          {entry.name}
        </Text>
      )}
      {entry.provider && (
        <Tag size='small' color='grey'>{entry.provider}</Tag>
      )}
      <Text className='mr-tabular' type='tertiary' style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
        {entry.total_calls?.toLocaleString() ?? 0} {t('次')}
      </Text>
      <Switch size='small' checked={entry.enabled} onChange={onToggle} />
      <Button size='small' icon={<IconCopy />} onClick={copyKey} />
      <Popconfirm
        title={t('删除这个 Key？')}
        onConfirm={onDelete}
        okText={t('删除')}
        cancelText={t('取消')}
      >
        <Button size='small' type='danger' icon={<IconDelete />} />
      </Popconfirm>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 创建 Pool SideSheet
// ────────────────────────────────────────────────────────────────────────────

function CreatePoolSheet({ visible, onClose, onCreated }) {
  const { t } = useTranslation();
  const formApiRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const values = await formApiRef.current?.validate().catch(() => null);
    if (!values) return;
    setSaving(true);
    try {
      const res = await API.post('/api/admin/key_pools', { ...DEFAULT_POOL, ...values });
      if (res.data.success) {
        onCreated(res.data.data);
        showSuccess(t('Pool 已创建'));
        formApiRef.current?.reset();
        onClose();
      } else {
        showError(res.data.message || t('创建失败'));
      }
    } catch (e) {
      showError(t('创建失败'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideSheet
      title={t('新建 Key Pool')}
      visible={visible}
      onCancel={onClose}
      width={420}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>{t('取消')}</Button>
          <Button theme='solid' type='primary' loading={saving} onClick={handleCreate}>
            {t('创建 Pool')}
          </Button>
        </div>
      }
    >
      <Form
        getFormApi={(api) => (formApiRef.current = api)}
        layout='vertical'
        initValues={DEFAULT_POOL}
      >
        <Form.Input
          field='name'
          label={t('Pool 名称')}
          rules={[{ required: true, message: t('请输入 Pool 名称') }]}
        />
        <Form.Input field='description' label={t('备注（可选）')} />
        <Form.Select
          field='rotation_mode'
          label={t('轮换模式')}
          optionList={getRotationModes(t)}
          style={{ width: '100%' }}
        />
      </Form>
    </SideSheet>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// KeyPoolPage — main page
// ────────────────────────────────────────────────────────────────────────────

export default function KeyPoolPage() {
  const { t } = useTranslation();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  async function loadPools() {
    setLoading(true);
    try {
      const res = await API.get('/api/admin/key_pools');
      if (res.data.success) {
        setPools(res.data.data || []);
      }
    } catch (e) {
      showError(t('加载失败'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPools(); }, []);

  async function deletePool(poolId) {
    try {
      const res = await API.delete(`/api/admin/key_pools/${poolId}`);
      if (res.data.success) {
        setPools((prev) => prev.filter((p) => p.id !== poolId));
        showSuccess(t('Pool 已删除'));
      }
    } catch (e) {
      showError(t('删除失败'));
    }
  }

  return (
    <div
      className='mt-[60px] px-2'
      style={{
        height: 'calc(100dvh - 60px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ padding: '24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <Title heading={4} style={{ margin: 0 }}>{t('Key Pool 管理')}</Title>
            <Text type='tertiary' style={{ fontSize: 13 }}>
              {t('为订阅套餐绑定轮换 Key Pool，系统自动分发给用户')}
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              icon={<IconRefresh />}
              onClick={loadPools}
              loading={loading}
            >
              {t('刷新')}
            </Button>
            <Button
              icon={<IconPlus />}
              theme='solid'
              type='primary'
              onClick={() => setCreateSheetOpen(true)}
            >
              {t('新建 Pool')}
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size='large' />
            </div>
          ) : pools.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              border: '1px dashed var(--mr-border-default)',
              borderRadius: 18,
              background: 'var(--mr-bg-surface-1)',
            }}>
              <Empty
                image={<IllustrationConstruction style={{ width: 120, height: 120 }} />}
                darkModeImage={<IllustrationConstructionDark style={{ width: 120, height: 120 }} />}
                title={t('还没有 Key Pool')}
                description={t('点击右上角"新建 Pool"，把要轮换的 Key 都放进来')}
              />
            </div>
          ) : (
            pools.map((pool) => (
              <PoolCard
                key={pool.id}
                pool={pool}
                onUpdated={(updated) =>
                  setPools((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                }
                onDeleted={deletePool}
              />
            ))
          )}
        </div>
      </div>

      <CreatePoolSheet
        visible={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        onCreated={(p) => setPools((prev) => [p, ...prev])}
      />
    </div>
  );
}
