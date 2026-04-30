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
  Input,
  Select,
  Switch,
  Spin,
  Typography,
  Tag,
  Popconfirm,
  Toast,
  Badge,
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
import { API, showError, showSuccess } from '../../helpers';

const { Title, Text } = Typography;

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

const ROTATION_MODES = [
  { label: '轮询 (Round Robin)', value: 'round_robin' },
  { label: '加权随机', value: 'weighted' },
  { label: '随机', value: 'random' },
];

const DEFAULT_POOL = { name: '', description: '', rotation_mode: 'round_robin', enabled: true };
const DEFAULT_ENTRY = { name: '', key: '', provider: '', weight: 1, enabled: true };

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function rotationBadge(mode) {
  const map = {
    round_robin: { color: 'blue', label: '轮询' },
    weighted: { color: 'purple', label: '加权' },
    random: { color: 'teal', label: '随机' },
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
        background: enabled ? '#1CB55A' : '#C9CDD4',
        marginRight: 6,
        flexShrink: 0,
      }}
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PoolCard — renders one pool + its entries
// ────────────────────────────────────────────────────────────────────────────

function PoolCard({ pool, onUpdated, onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [addingKey, setAddingKey] = useState(false);
  const [newEntry, setNewEntry] = useState(DEFAULT_ENTRY);
  const [editingPool, setEditingPool] = useState(false);
  const [poolDraft, setPoolDraft] = useState({ name: pool.name, description: pool.description, rotation_mode: pool.rotation_mode });
  const [saving, setSaving] = useState(false);
  const keyInputRef = useRef(null);

  async function loadEntries() {
    setLoadingEntries(true);
    try {
      const res = await API.get(`/api/admin/key_pools/${pool.id}/entries`);
      if (res.data.success) {
        setEntries(res.data.data || []);
      }
    } catch (e) {
      showError('加载失败');
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
      showError('操作失败');
    }
  }

  async function savePoolEdits() {
    setSaving(true);
    try {
      const res = await API.put(`/api/admin/key_pools/${pool.id}`, {
        ...pool,
        ...poolDraft,
      });
      if (res.data.success) {
        onUpdated({ ...pool, ...poolDraft });
        setEditingPool(false);
        showSuccess('保存成功');
      }
    } catch (e) {
      showError('保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function addEntry() {
    if (!newEntry.key.trim()) {
      showError('请输入 API Key');
      return;
    }
    setSaving(true);
    try {
      const res = await API.post(`/api/admin/key_pools/${pool.id}/entries`, newEntry);
      if (res.data.success) {
        setEntries((prev) => [...prev, res.data.data]);
        setNewEntry(DEFAULT_ENTRY);
        setAddingKey(false);
        showSuccess('Key 已添加');
      }
    } catch (e) {
      showError('添加失败');
    } finally {
      setSaving(false);
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
      showError('操作失败');
    }
  }

  async function deleteEntry(entryId) {
    try {
      const res = await API.delete(`/api/admin/key_pools/${pool.id}/entries/${entryId}`);
      if (res.data.success) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
        showSuccess('已删除');
      }
    } catch (e) {
      showError('删除失败');
    }
  }

  // Focus the key input when addingKey panel opens
  useEffect(() => {
    if (addingKey && keyInputRef.current) {
      setTimeout(() => keyInputRef.current?.focus(), 50);
    }
  }, [addingKey]);

  return (
    <div
      style={{
        border: '1px solid var(--semi-color-border)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--semi-color-bg-0)',
      }}
    >
      {/* Pool Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          cursor: 'pointer',
          userSelect: 'none',
          background: expanded ? 'var(--semi-color-fill-0)' : 'transparent',
          transition: 'background 0.15s',
        }}
        onClick={handleExpand}
      >
        <span style={{ color: 'var(--semi-color-text-2)', flexShrink: 0 }}>
          {expanded ? <IconChevronDown /> : <IconChevronRight />}
        </span>
        <StatusDot enabled={pool.enabled} />
        <Text strong style={{ flex: 1, fontSize: 14 }}>
          {editingPool ? (
            <Input
              value={poolDraft.name}
              size='small'
              onClick={(e) => e.stopPropagation()}
              onChange={(v) => setPoolDraft((d) => ({ ...d, name: v }))}
              style={{ width: 200 }}
            />
          ) : (
            pool.name
          )}
        </Text>

        {/* rotation mode */}
        {rotationBadge(pool.rotation_mode)}

        {/* entry count badge */}
        <Badge count={pool.entry_count ?? entries.length} overflowCount={99} type='primary' />

        {/* Actions */}
        <span
          style={{ display: 'flex', gap: 6, marginLeft: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          {editingPool ? (
            <>
              <Button size='small' theme='solid' type='primary' loading={saving} onClick={savePoolEdits}>
                保存
              </Button>
              <Button size='small' onClick={() => { setEditingPool(false); setPoolDraft({ name: pool.name, description: pool.description, rotation_mode: pool.rotation_mode }); }}>
                取消
              </Button>
            </>
          ) : (
            <Button size='small' icon={<IconEdit />} onClick={() => setEditingPool(true)} />
          )}
          <Switch
            size='small'
            checked={pool.enabled}
            onChange={togglePoolEnabled}
          />
          <Popconfirm
            title='确认删除这个 Key Pool？'
            content='同时删除所有关联 Key'
            onConfirm={() => onDeleted(pool.id)}
            okText='删除'
            cancelText='取消'
          >
            <Button size='small' type='danger' icon={<IconDelete />} />
          </Popconfirm>
        </span>
      </div>

      {/* Pool Body — entries */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--semi-color-border)', padding: '12px 16px' }}>
          {/* Edit pool metadata */}
          {editingPool && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Select
                value={poolDraft.rotation_mode}
                onChange={(v) => setPoolDraft((d) => ({ ...d, rotation_mode: v }))}
                optionList={ROTATION_MODES}
                size='small'
                style={{ width: 180 }}
                prefix='轮换模式'
              />
              <Input
                value={poolDraft.description}
                placeholder='备注（可选）'
                size='small'
                onChange={(v) => setPoolDraft((d) => ({ ...d, description: v }))}
                style={{ flex: 1, minWidth: 200 }}
              />
            </div>
          )}

          {/* Entry list */}
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
              {entries.length === 0 && !addingKey && (
                <Text type='tertiary' style={{ padding: '4px 0' }}>
                  暂无 Key，点击「添加 Key」开始
                </Text>
              )}
            </div>
          )}

          {/* Inline add-key form */}
          {addingKey ? (
            <div
              style={{
                marginTop: 10,
                padding: '10px 12px',
                background: 'var(--semi-color-fill-0)',
                borderRadius: 8,
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              <Input
                ref={keyInputRef}
                value={newEntry.key}
                placeholder='API Key *'
                onChange={(v) => setNewEntry((e) => ({ ...e, key: v }))}
                style={{ flex: 2, minWidth: 220 }}
                size='small'
              />
              <Input
                value={newEntry.name}
                placeholder='备注名（可选）'
                onChange={(v) => setNewEntry((e) => ({ ...e, name: v }))}
                style={{ flex: 1, minWidth: 140 }}
                size='small'
              />
              <Input
                value={newEntry.provider}
                placeholder='提供商（可选）'
                onChange={(v) => setNewEntry((e) => ({ ...e, provider: v }))}
                style={{ width: 120 }}
                size='small'
              />
              <Input
                type='number'
                value={newEntry.weight}
                placeholder='权重'
                onChange={(v) => setNewEntry((e) => ({ ...e, weight: parseInt(v) || 1 }))}
                style={{ width: 70 }}
                size='small'
              />
              <Button size='small' theme='solid' type='primary' loading={saving} onClick={addEntry}>
                确认
              </Button>
              <Button size='small' onClick={() => { setAddingKey(false); setNewEntry(DEFAULT_ENTRY); }}>
                取消
              </Button>
            </div>
          ) : (
            <Button
              size='small'
              icon={<IconPlus />}
              style={{ marginTop: 10 }}
              onClick={() => setAddingKey(true)}
            >
              添加 Key
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// EntryRow — single key entry
// ────────────────────────────────────────────────────────────────────────────

function EntryRow({ entry, onToggle, onDelete }) {
  function copyKey() {
    navigator.clipboard.writeText(entry.masked_key || entry.encrypted_key || '').then(() => {
      Toast.info('已复制（掩码版本）');
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 8px',
        borderRadius: 6,
        background: 'var(--semi-color-bg-1)',
        opacity: entry.enabled ? 1 : 0.45,
      }}
    >
      <StatusDot enabled={entry.enabled} />
      <Text
        style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
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
      <Text type='tertiary' style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
        {entry.total_calls?.toLocaleString() ?? 0} 次
      </Text>
      <Switch size='small' checked={entry.enabled} onChange={onToggle} />
      <Button size='small' icon={<IconCopy />} onClick={copyKey} />
      <Popconfirm
        title='删除这个 Key？'
        onConfirm={onDelete}
        okText='删除'
        cancelText='取消'
      >
        <Button size='small' type='danger' icon={<IconDelete />} />
      </Popconfirm>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CreatePoolInline — inline form to create a new pool
// ────────────────────────────────────────────────────────────────────────────

function CreatePoolInline({ onCreated }) {
  const [draft, setDraft] = useState(DEFAULT_POOL);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!draft.name.trim()) { showError('请输入 Pool 名称'); return; }
    setSaving(true);
    try {
      const res = await API.post('/api/admin/key_pools', draft);
      if (res.data.success) {
        onCreated(res.data.data);
        setDraft(DEFAULT_POOL);
        showSuccess('Pool 已创建');
      }
    } catch (e) {
      showError('创建失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--semi-color-fill-0)',
        borderRadius: 10,
        border: '1px dashed var(--semi-color-border)',
      }}
    >
      <Input
        value={draft.name}
        placeholder='Pool 名称 *'
        onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
        style={{ flex: 1, minWidth: 160 }}
        size='small'
        onEnterPress={handleCreate}
      />
      <Input
        value={draft.description}
        placeholder='备注（可选）'
        onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
        style={{ flex: 1, minWidth: 160 }}
        size='small'
      />
      <Select
        value={draft.rotation_mode}
        onChange={(v) => setDraft((d) => ({ ...d, rotation_mode: v }))}
        optionList={ROTATION_MODES}
        size='small'
        style={{ width: 160 }}
      />
      <Button
        size='small'
        theme='solid'
        type='primary'
        icon={<IconPlus />}
        loading={saving}
        onClick={handleCreate}
      >
        创建 Pool
      </Button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// KeyPoolPage — main page
// ────────────────────────────────────────────────────────────────────────────

export default function KeyPoolPage() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadPools() {
    setLoading(true);
    try {
      const res = await API.get('/api/admin/key_pools');
      if (res.data.success) {
        setPools(res.data.data || []);
      }
    } catch (e) {
      showError('加载失败');
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
        showSuccess('Pool 已删除');
      }
    } catch (e) {
      showError('删除失败');
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Title heading={4} style={{ margin: 0 }}>Key Pool 管理</Title>
          <Text type='tertiary' style={{ fontSize: 13 }}>
            为订阅套餐绑定轮换 Key Pool，系统自动分发给用户
          </Text>
        </div>
        <Button
          icon={<IconRefresh />}
          onClick={loadPools}
          loading={loading}
          size='small'
        >
          刷新
        </Button>
      </div>

      {/* Create new pool */}
      <CreatePoolInline onCreated={(p) => setPools((prev) => [p, ...prev])} />

      {/* Pool list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size='large' />
          </div>
        ) : pools.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 48,
              border: '1px dashed var(--semi-color-border)',
              borderRadius: 10,
            }}
          >
            <Text type='tertiary'>还没有 Key Pool，创建第一个吧</Text>
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
  );
}
