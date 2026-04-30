import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  TextArea,
  Select,
  Switch,
  Toast,
  Typography,
  Badge,
  Popconfirm,
  Spin,
  Empty,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconSend,
  IconDelete,
  IconEdit,
  IconEyeOpened,
  IconPause,
  IconRefresh,
} from '@douyinfe/semi-icons';
import { API, showError, showSuccess } from '../../helpers';

const { Title, Text } = Typography;

// ─── Status badge ───────────────────────────────────────────────────────────

const STATUS_MAP = {
  draft:     { color: 'grey',   label: 'Draft' },
  scheduled: { color: 'blue',   label: 'Scheduled' },
  sending:   { color: 'orange', label: 'Sending' },
  sent:      { color: 'green',  label: 'Sent' },
  paused:    { color: 'red',    label: 'Paused' },
};

function StatusTag({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.draft;
  return <Tag color={s.color}>{s.label}</Tag>;
}

// ─── Campaign Form Modal ─────────────────────────────────────────────────────

function CampaignModal({ visible, onClose, onSaved, initial }) {
  const [form, setForm] = useState({
    name: '',
    subject: '',
    from_name: '',
    body_html: '',
    body_text: '',
    segment_json: '{}',
    // segment UI fields
    min_quota: 0,
    max_quota: 0,
    inactive_days: 0,
    registered_within_days: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      const seg = (() => {
        try { return JSON.parse(initial.segment_json || '{}'); } catch { return {}; }
      })();
      setForm({
        name: initial.name || '',
        subject: initial.subject || '',
        from_name: initial.from_name || '',
        body_html: initial.body_html || '',
        body_text: initial.body_text || '',
        segment_json: initial.segment_json || '{}',
        min_quota: seg.min_quota || 0,
        max_quota: seg.max_quota || 0,
        inactive_days: seg.inactive_days || 0,
        registered_within_days: seg.registered_within_days || 0,
      });
    } else {
      setForm({
        name: '', subject: '', from_name: '', body_html: '', body_text: '',
        segment_json: '{}', min_quota: 0, max_quota: 0, inactive_days: 0, registered_within_days: 0,
      });
    }
  }, [initial, visible]);

  const buildSegmentJSON = (f) => JSON.stringify({
    min_quota:               f.min_quota || 0,
    max_quota:               f.max_quota || 0,
    inactive_days:           f.inactive_days || 0,
    registered_within_days:  f.registered_within_days || 0,
  });

  const handleSave = async () => {
    if (!form.name.trim()) return Toast.error('Campaign name is required');
    if (!form.subject.trim()) return Toast.error('Email subject is required');
    setSaving(true);
    try {
      const payload = {
        name:         form.name,
        subject:      form.subject,
        from_name:    form.from_name,
        body_html:    form.body_html,
        body_text:    form.body_text,
        segment_json: buildSegmentJSON(form),
      };
      let res;
      if (initial?.id) {
        res = await API.put(`/api/admin/campaigns/${initial.id}`, payload);
      } else {
        res = await API.post('/api/admin/campaigns/', payload);
      }
      if (res.data.success) {
        showSuccess(initial?.id ? 'Campaign updated' : 'Campaign created');
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

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Modal
      title={initial?.id ? 'Edit Campaign' : 'New Campaign'}
      visible={visible}
      onCancel={onClose}
      width={720}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button theme="solid" loading={saving} onClick={handleSave}>
            {initial?.id ? 'Save Changes' : 'Create Campaign'}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Basic info */}
        <Form.Section text="Campaign Info">
          <Form.Input
            field="name"
            label="Campaign Name (internal)"
            placeholder="e.g. Promo April 2025"
            value={form.name}
            onChange={v => set('name', v)}
          />
          <Form.Input
            field="subject"
            label="Email Subject"
            placeholder="e.g. 🎉 Get 20% more credits this week!"
            value={form.subject}
            onChange={v => set('subject', v)}
          />
          <Form.Input
            field="from_name"
            label="From Name (optional, overrides system name)"
            placeholder="e.g. Market Router Team"
            value={form.from_name}
            onChange={v => set('from_name', v)}
          />
        </Form.Section>

        {/* Email body */}
        <Form.Section text="Email Body">
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>HTML Body</label>
            <TextArea
              rows={8}
              placeholder="<h1>Hello {{username}},</h1><p>We have a special offer...</p>"
              value={form.body_html}
              onChange={v => set('body_html', v)}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
            <Text type="tertiary" size="small">
              Supported template variable: <code>{'{{username}}'}</code>
            </Text>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Plain-text Fallback</label>
            <TextArea
              rows={3}
              placeholder="Hello, we have a special offer for you..."
              value={form.body_text}
              onChange={v => set('body_text', v)}
            />
          </div>
        </Form.Section>

        {/* Audience segment */}
        <Form.Section text="Audience Filter (leave 0 = no filter)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Min Quota (tokens)</label>
              <InputNumber value={form.min_quota} onChange={v => set('min_quota', v)} min={0} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Max Quota (tokens)</label>
              <InputNumber value={form.max_quota} onChange={v => set('max_quota', v)} min={0} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Inactive for N days</label>
              <InputNumber value={form.inactive_days} onChange={v => set('inactive_days', v)} min={0} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Registered within N days</label>
              <InputNumber value={form.registered_within_days} onChange={v => set('registered_within_days', v)} min={0} style={{ width: '100%' }} />
            </div>
          </div>
        </Form.Section>
      </div>
    </Modal>
  );
}

// ─── Recipients Preview Modal ────────────────────────────────────────────────

function RecipientsModal({ visible, campaignId, onClose }) {
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
    }
  }, [visible, campaignId]);

  return (
    <Modal title="Preview Recipients" visible={visible} onCancel={onClose} width={600} footer={null}>
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}
      {!loading && data && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue" size="large">Total matching: {data.total} users</Tag>
          </div>
          {data.preview?.length > 0 ? (
            <>
              <Text type="tertiary" size="small">Showing first 20:</Text>
              <Table
                size="small"
                dataSource={data.preview}
                columns={[
                  { title: 'Username', dataIndex: 'Username' },
                  { title: 'Email', dataIndex: 'Email' },
                ]}
                pagination={false}
                style={{ marginTop: 8 }}
              />
            </>
          ) : (
            <Empty description="No users match these filters" />
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [recipientsModal, setRecipientsModal] = useState({ open: false, id: null });
  const [sendingId, setSendingId] = useState(null);

  const loadCampaigns = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await API.get(`/api/admin/campaigns/?page=${p}&size=20`);
      if (res.data.success) {
        setCampaigns(res.data.data || []);
        setTotal(res.data.total || 0);
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCampaigns(page); }, [page, loadCampaigns]);

  const handleDelete = async (id) => {
    try {
      const res = await API.delete(`/api/admin/campaigns/${id}`);
      if (res.data.success) {
        showSuccess('Campaign deleted');
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
        showSuccess(res.data.message);
        loadCampaigns(page);
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
    setModalOpen(false);
    setEditItem(null);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name, row) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="tertiary" size="small">{row.subject}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: s => <StatusTag status={s} />,
    },
    {
      title: 'Recipients',
      width: 120,
      render: (_, row) => (
        row.status === 'sent'
          ? <span>
              <Text style={{ color: 'var(--semi-color-success)' }}>✓ {row.sent_count}</Text>
              {row.failed_count > 0 && <Text type="danger"> / ✗ {row.failed_count}</Text>}
            </span>
          : <Text type="tertiary">{row.total_recipients || '—'}</Text>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      width: 140,
      render: ts => ts ? new Date(ts * 1000).toLocaleDateString() : '—',
    },
    {
      title: 'Actions',
      width: 200,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Button
            size="small"
            icon={<IconEyeOpened />}
            onClick={() => setRecipientsModal({ open: true, id: row.id })}
          >
            Preview
          </Button>
          {(row.status === 'draft' || row.status === 'paused') && (
            <Button
              size="small"
              icon={<IconEdit />}
              onClick={() => { setEditItem(row); setModalOpen(true); }}
            >
              Edit
            </Button>
          )}
          {(row.status === 'draft' || row.status === 'scheduled' || row.status === 'paused') && (
            <Popconfirm
              title={`Send to ${row.total_recipients || '?'} recipients?`}
              onConfirm={() => handleSend(row.id)}
            >
              <Button
                size="small"
                theme="solid"
                type="primary"
                icon={<IconSend />}
                loading={sendingId === row.id}
              >
                Send
              </Button>
            </Popconfirm>
          )}
          {row.status !== 'sent' && row.status !== 'sending' && (
            <Popconfirm title="Delete this campaign?" onConfirm={() => handleDelete(row.id)}>
              <Button size="small" type="danger" icon={<IconDelete />} />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title heading={4} style={{ margin: 0 }}>Email Campaigns</Title>
          <Text type="tertiary">Send targeted marketing emails to user segments</Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<IconRefresh />} onClick={() => loadCampaigns(page)}>Refresh</Button>
          <Button
            icon={<IconPlus />}
            theme="solid"
            onClick={() => { setEditItem(null); setModalOpen(true); }}
          >
            New Campaign
          </Button>
        </div>
      </div>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={campaigns}
          columns={columns}
          loading={loading}
          pagination={{
            total,
            pageSize: 20,
            currentPage: page,
            onPageChange: setPage,
          }}
          empty={<Empty description="No campaigns yet. Create your first one!" style={{ padding: 40 }} />}
        />
      </Card>

      <CampaignModal
        visible={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSaved={handleSaved}
        initial={editItem}
      />

      <RecipientsModal
        visible={recipientsModal.open}
        campaignId={recipientsModal.id}
        onClose={() => setRecipientsModal({ open: false, id: null })}
      />
    </div>
  );
}
