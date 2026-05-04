import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Tag,
  Form,
  SideSheet,
  Modal,
  Typography,
  Badge,
  Spin,
  Empty,
} from '@douyinfe/semi-ui';
import ConfirmModal from '../../components/common/modals/ConfirmModal';
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import {
  IconPlus,
  IconSend,
  IconDelete,
  IconEdit,
  IconEyeOpened,
  IconRefresh,
} from '@douyinfe/semi-icons';
import CardPro from '../../components/common/ui/CardPro';
import CardTable from '../../components/common/ui/CardTable';
import { API, showError, showSuccess } from '../../helpers';
import { createCardProPagination } from '../../helpers/utils';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const { Title, Text } = Typography;

const STATUS_KEY = {
  draft:     { color: 'grey',   labelKey: '草稿' },
  scheduled: { color: 'blue',   labelKey: '已计划' },
  sending:   { color: 'orange', labelKey: '发送中' },
  sent:      { color: 'green',  labelKey: '已发送' },
  paused:    { color: 'red',    labelKey: '已暂停' },
};

function StatusTag({ status, t }) {
  const s = STATUS_KEY[status] || STATUS_KEY.draft;
  return <Tag color={s.color} size='small'>{t(s.labelKey)}</Tag>;
}

const PAGE_SIZE = 20;

function CampaignSideSheet({ visible, onClose, onSaved, initial, t }) {
  const formApiRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const initValues = useMemo(() => {
    if (!initial) {
      return {
        name: '', subject: '', from_name: '', body_html: '', body_text: '',
        min_quota: 0, max_quota: 0, inactive_days: 0, registered_within_days: 0,
      };
    }
    let seg = {};
    try { seg = JSON.parse(initial.segment_json || '{}'); } catch { /* noop */ }
    return {
      name: initial.name || '',
      subject: initial.subject || '',
      from_name: initial.from_name || '',
      body_html: initial.body_html || '',
      body_text: initial.body_text || '',
      min_quota: seg.min_quota || 0,
      max_quota: seg.max_quota || 0,
      inactive_days: seg.inactive_days || 0,
      registered_within_days: seg.registered_within_days || 0,
    };
  }, [initial]);

  useEffect(() => {
    if (visible && formApiRef.current) {
      formApiRef.current.setValues(initValues);
    }
  }, [visible, initValues]);

  const handleSave = async () => {
    const values = await formApiRef.current?.validate().catch(() => null);
    if (!values) return;
    setSaving(true);
    try {
      const payload = {
        name:         values.name,
        subject:      values.subject,
        from_name:    values.from_name,
        body_html:    values.body_html,
        body_text:    values.body_text,
        segment_json: JSON.stringify({
          min_quota:               values.min_quota || 0,
          max_quota:               values.max_quota || 0,
          inactive_days:           values.inactive_days || 0,
          registered_within_days:  values.registered_within_days || 0,
        }),
      };
      const res = initial?.id
        ? await API.put(`/api/admin/campaigns/${initial.id}`, payload)
        : await API.post('/api/admin/campaigns/', payload);
      if (res.data.success) {
        showSuccess(initial?.id ? t('Campaign 已更新') : t('Campaign 已创建'));
        onSaved(res.data.data);
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideSheet
      title={initial?.id ? t('编辑 Campaign') : t('新建 Campaign')}
      visible={visible}
      onCancel={onClose}
      width={560}
      placement='right'
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>{t('取消')}</Button>
          <Button theme='solid' type='primary' loading={saving} onClick={handleSave}>
            {initial?.id ? t('保存修改') : t('创建')}
          </Button>
        </div>
      }
    >
      <Form
        getFormApi={(api) => (formApiRef.current = api)}
        initValues={initValues}
        layout='vertical'
      >
        <Form.Section text={t('基本信息')}>
          <Form.Input
            field='name'
            label={t('Campaign 名称（仅内部）')}
            placeholder='e.g. Promo April 2025'
            rules={[{ required: true, message: t('Campaign 名称必填') }]}
          />
          <Form.Input
            field='subject'
            label={t('邮件标题')}
            placeholder='🎉 Get 20% more credits this week!'
            rules={[{ required: true, message: t('邮件标题必填') }]}
          />
          <Form.Input
            field='from_name'
            label={t('发件人名称（可选，覆盖系统名）')}
            placeholder='Market Router Team'
          />
        </Form.Section>

        <Form.Section text={t('邮件内容')}>
          <Form.TextArea
            field='body_html'
            label={t('HTML 正文')}
            rows={8}
            placeholder='<h1>Hello {{username}},</h1><p>We have a special offer...</p>'
            style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}
            extraText={
              <span>
                {t('支持模板变量：')}<code>{'{{username}}'}</code>
              </span>
            }
          />
          <Form.TextArea
            field='body_text'
            label={t('纯文本回退')}
            rows={3}
            placeholder='Hello, we have a special offer for you...'
          />
        </Form.Section>

        <Form.Section text={t('用户筛选条件（0 表示不限制）')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.InputNumber field='min_quota' label={t('最低额度')} min={0} style={{ width: '100%' }} />
            <Form.InputNumber field='max_quota' label={t('最高额度')} min={0} style={{ width: '100%' }} />
            <Form.InputNumber field='inactive_days' label={t('已不活跃 N 天')} min={0} style={{ width: '100%' }} />
            <Form.InputNumber field='registered_within_days' label={t('注册时间在 N 天内')} min={0} style={{ width: '100%' }} />
          </div>
        </Form.Section>
      </Form>
    </SideSheet>
  );
}

function RecipientsPreviewModal({ visible, campaignId, onClose, t }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (visible && campaignId) {
      setLoading(true);
      API.get(`/api/admin/campaigns/${campaignId}/recipients`)
        .then(res => {
          if (res.data.success) setData(res.data);
          else showError(res.data.message);
        })
        .catch(e => showError(e.message))
        .finally(() => setLoading(false));
    } else if (!visible) {
      setData(null);
    }
  }, [visible, campaignId]);

  return (
    <Modal
      title={t('收件人预览')}
      visible={visible}
      onCancel={onClose}
      width={600}
      footer={null}
    >
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}
      {!loading && data && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text type='tertiary'>{t('匹配用户总数：')}</Text>
            <Badge count={data.total} overflowCount={9999} type='primary' />
          </div>
          {data.preview?.length > 0 ? (
            <>
              <Text type='tertiary' size='small'>{t('显示前 20 位：')}</Text>
              <div style={{ marginTop: 8, border: '1px solid var(--mr-border-default)', borderRadius: 14, overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: 13 }}>
                  <thead style={{ background: 'var(--mr-bg-surface-2)' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--mr-text-tertiary)', fontWeight: 500 }}>{t('用户名')}</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--mr-text-tertiary)', fontWeight: 500 }}>{t('邮箱')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.preview.map((u, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--mr-border-subtle)' }}>
                        <td style={{ padding: '8px 12px' }}>{u.Username || u.username}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--mr-text-secondary)' }}>{u.Email || u.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <Empty
              image={<IllustrationNoResult style={{ width: 100, height: 100 }} />}
              darkModeImage={<IllustrationNoResultDark style={{ width: 100, height: 100 }} />}
              description={t('没有用户匹配该筛选条件')}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

export default function EmailCampaignsPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [recipientsModal, setRecipientsModal] = useState({ open: false, id: null });
  const [sendingId, setSendingId] = useState(null);
  const [sendConfirmRow, setSendConfirmRow] = useState(null);
  const [deleteConfirmRow, setDeleteConfirmRow] = useState(null);

  const loadCampaigns = useCallback(async (p = 1, ps = PAGE_SIZE) => {
    setLoading(true);
    try {
      const res = await API.get(`/api/admin/campaigns/?page=${p}&size=${ps}`);
      if (res.data.success) {
        const payload = res.data.data || {};
        setCampaigns(Array.isArray(payload) ? payload : payload.items || []);
        setTotal(payload.total ?? res.data.total ?? 0);
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCampaigns(page, pageSize); }, [page, pageSize, loadCampaigns]);

  const handleDelete = async (id) => {
    try {
      const res = await API.delete(`/api/admin/campaigns/${id}`);
      if (res.data.success) {
        showSuccess(t('Campaign 已删除'));
        setCampaigns(cs => cs.filter(c => c.id !== id));
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    }
  };

  const handleSend = async (id) => {
    setSendingId(id);
    try {
      const res = await API.post(`/api/admin/campaigns/${id}/send`);
      if (res.data.success) {
        showSuccess(res.data.message || t('已发送'));
        loadCampaigns(page, pageSize);
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setSendingId(null);
    }
  };

  const handleSaved = (item) => {
    setCampaigns(cs => {
      const idx = cs.findIndex(c => c.id === item.id);
      if (idx >= 0) {
        const next = [...cs];
        next[idx] = item;
        return next;
      }
      return [item, ...cs];
    });
    setSheetOpen(false);
    setEditItem(null);
  };

  const columns = [
    {
      title: t('名称'),
      dataIndex: 'name',
      render: (name, row) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type='tertiary' size='small'>{row.subject}</Text>
        </div>
      ),
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 110,
      render: s => <StatusTag status={s} t={t} />,
    },
    {
      title: t('收件人'),
      width: 130,
      render: (_, row) => (
        row.status === 'sent'
          ? <span className='mr-tabular'>
              <Text style={{ color: 'var(--mr-success)' }}>✓ {row.sent_count}</Text>
              {row.failed_count > 0 && <Text type='danger'> / ✗ {row.failed_count}</Text>}
            </span>
          : <Text type='tertiary' className='mr-tabular'>{row.total_recipients ?? '—'}</Text>
      ),
    },
    {
      title: t('创建时间'),
      dataIndex: 'created_at',
      width: 140,
      render: ts => ts ? new Date(ts * 1000).toLocaleDateString() : '—',
    },
    {
      title: t('操作'),
      width: 240,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Button
            size='small'
            icon={<IconEyeOpened />}
            onClick={() => setRecipientsModal({ open: true, id: row.id })}
          >
            {t('预览')}
          </Button>
          {(row.status === 'draft' || row.status === 'paused') && (
            <Button
              size='small'
              icon={<IconEdit />}
              onClick={() => { setEditItem(row); setSheetOpen(true); }}
            >
              {t('编辑')}
            </Button>
          )}
          {(row.status === 'draft' || row.status === 'scheduled' || row.status === 'paused') && (
            <Button
              size='small'
              theme='solid'
              type='primary'
              icon={<IconSend />}
              loading={sendingId === row.id}
              onClick={() => setSendConfirmRow(row)}
            >
              {t('发送')}
            </Button>
          )}
          {row.status !== 'sent' && row.status !== 'sending' && (
            <Button
              size='small'
              type='danger'
              icon={<IconDelete />}
              onClick={() => setDeleteConfirmRow(row)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div
      className='mt-[60px] px-2'
      style={{
        height: 'calc(100dvh - 60px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '0 4px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
        <div>
          <Title heading={4} style={{ margin: 0 }}>{t('Email Campaigns')}</Title>
          <Text type='tertiary' size='small'>
            {t('向用户分群发送精准营销邮件')}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<IconRefresh />} onClick={() => loadCampaigns(page, pageSize)}>
            {t('刷新')}
          </Button>
          <Button
            icon={<IconPlus />}
            theme='solid'
            type='primary'
            onClick={() => { setEditItem(null); setSheetOpen(true); }}
          >
            {t('新建 Campaign')}
          </Button>
        </div>
      </div>

      <CardPro
        type='type1'
        paginationArea={createCardProPagination({
          currentPage: page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: (ps) => { setPageSize(ps); setPage(1); },
          isMobile,
          t,
        })}
        t={t}
      >
        <CardTable
          columns={columns}
          dataSource={campaigns}
          loading={loading}
          hidePagination
          empty={
            <Empty
              image={<IllustrationConstruction style={{ width: 120, height: 120 }} />}
              darkModeImage={<IllustrationConstructionDark style={{ width: 120, height: 120 }} />}
              title={t('还没有 Campaign')}
              description={t('点击右上角"新建 Campaign"创建你的第一个邮件活动')}
            />
          }
        />
      </CardPro>

      <CampaignSideSheet
        visible={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditItem(null); }}
        onSaved={handleSaved}
        initial={editItem}
        t={t}
      />

      <RecipientsPreviewModal
        visible={recipientsModal.open}
        campaignId={recipientsModal.id}
        onClose={() => setRecipientsModal({ open: false, id: null })}
        t={t}
      />

      <ConfirmModal
        visible={!!sendConfirmRow}
        type='warning'
        title={t('确认发送给 {{count}} 个收件人？', {
          count: sendConfirmRow?.total_recipients ?? '?',
        })}
        content={t('邮件一旦发出无法撤回，请确认后再继续。')}
        okText={t('立即发送')}
        onCancel={() => setSendConfirmRow(null)}
        onOk={async () => {
          const id = sendConfirmRow?.id;
          setSendConfirmRow(null);
          if (id != null) await handleSend(id);
        }}
      />

      <ConfirmModal
        visible={!!deleteConfirmRow}
        type='danger'
        title={t('删除该 Campaign？')}
        content={t('删除后该 Campaign 不再保留，此操作不可撤销。')}
        okText={t('删除')}
        onCancel={() => setDeleteConfirmRow(null)}
        onOk={async () => {
          const id = deleteConfirmRow?.id;
          setDeleteConfirmRow(null);
          if (id != null) await handleDelete(id);
        }}
      />
    </div>
  );
}
