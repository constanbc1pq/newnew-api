import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Empty,
  Spin,
} from '@douyinfe/semi-ui';
import { IconCreditCard, IconRefresh } from '@douyinfe/semi-icons';
import { API, showError, renderQuota } from '../../helpers';
import { UserContext } from '../../context/User';

const { Title, Text } = Typography;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  completed: 'green',
  pending:   'orange',
  failed:    'red',
  expired:   'grey',
};

const PROVIDER_LABEL = {
  stripe:       'Stripe',
  coinbase:     'Coinbase',
  nowpayments:  'NowPayments',
  creem:        'Creem',
  waffo:        'Waffo',
  epay:         'EPay',
};

function formatUSD(amount) {
  if (!amount) return '—';
  return `$${parseFloat(amount).toFixed(2)}`;
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString();
}

// ─── Discount Table (static, from PaymentSetting values) ─────────────────────

const VOLUME_TIERS = [
  { amount: '$6',   tokens: '~3M',   bonus: '0%',  badge: null },
  { amount: '$20',  tokens: '~10M',  bonus: '+5%', badge: null },
  { amount: '$100', tokens: '~50M',  bonus: '+10%', badge: 'Popular' },
  { amount: '$200', tokens: '~100M', bonus: '+20%', badge: null },
];

function DiscountTable() {
  return (
    <Card
      title={<Title heading={6} style={{ margin: 0 }}>Volume Discounts</Title>}
      style={{ marginBottom: 20 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {VOLUME_TIERS.map(tier => (
          <div
            key={tier.amount}
            style={{
              border: '1px solid var(--semi-color-border)',
              borderRadius: 8,
              padding: '12px 16px',
              textAlign: 'center',
              position: 'relative',
              background: tier.badge ? 'var(--semi-color-primary-light-default)' : undefined,
            }}
          >
            {tier.badge && (
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--semi-color-primary)', color: 'var(--semi-color-bg-0)',
                fontSize: 10, padding: '2px 8px', borderRadius: 10,
              }}>
                {tier.badge}
              </div>
            )}
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--semi-color-text-0)' }}>{tier.amount}</div>
            <div style={{ fontSize: 12, color: 'var(--semi-color-text-2)', margin: '4px 0' }}>{tier.tokens} tokens</div>
            {tier.bonus !== '0%' && (
              <Tag color="green" size="small">+{tier.bonus.replace('+', '')} bonus</Tag>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <Text type="tertiary" size="small">
          New users: first $10 gets <strong>2× tokens</strong>. Volume bonuses stack with your group multiplier.
        </Text>
      </div>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [userState] = useContext(UserContext);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const quota = userState?.user?.quota ?? 0;
  // Approx: 500,000 tokens = $1 at default rate
  const approxUSD = (quota / 500000).toFixed(2);

  const loadTransactions = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await API.get(`/api/user/transactions?page=${p}&size=20`);
      if (res.data.success) {
        const payload = res.data.data || {};
        setTransactions(Array.isArray(payload) ? payload : payload.items || []);
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

  useEffect(() => { loadTransactions(page); }, [page, loadTransactions]);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      width: 160,
      render: ts => <Text size="small">{formatDate(ts)}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 100,
      render: type => (
        <Tag color={type === 'topup' ? 'blue' : 'orange'} size="small">
          {type === 'topup' ? 'Top-up' : type}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 100,
      render: (amt, row) => (
        <Text>{formatUSD(amt)} {row.currency && row.currency !== 'USD' ? row.currency : ''}</Text>
      ),
    },
    {
      title: 'Tokens Added',
      dataIndex: 'quota',
      width: 130,
      render: q => q ? <Text style={{ color: 'var(--semi-color-success)' }}>+{renderQuota(q)}</Text> : '—',
    },
    {
      title: 'Provider',
      dataIndex: 'provider',
      width: 110,
      render: p => <Text type="tertiary" size="small">{PROVIDER_LABEL[p] || p || '—'}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: s => <Tag color={STATUS_COLOR[s] || 'grey'} size="small">{s || '—'}</Tag>,
    },
    {
      title: 'Trade No.',
      dataIndex: 'trade_no',
      render: t => <Text type="tertiary" size="small" style={{ fontFamily: 'monospace' }}>{t ? t.slice(0, 20) + '…' : '—'}</Text>,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title heading={4} style={{ margin: 0 }}>Billing &amp; Usage</Title>
        <Button icon={<IconRefresh />} onClick={() => loadTransactions(page)}>Refresh</Button>
      </div>

      {/* Balance card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <Card>
          <Text type="tertiary" size="small">Current Balance</Text>
          <Title heading={3} style={{ margin: '4px 0' }}>{renderQuota(quota)} tokens</Title>
          <Text type="tertiary" size="small">≈ ${approxUSD} USD at default rate</Text>
        </Card>
        <Card>
          <Text type="tertiary" size="small">Username</Text>
          <Title heading={3} style={{ margin: '4px 0' }}>{userState?.user?.username || '—'}</Title>
          <Text type="tertiary" size="small">Group: {userState?.user?.group || 'default'}</Text>
        </Card>
        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Button
            theme="solid"
            size="large"
            icon={<IconCreditCard />}
            onClick={() => window.location.href = '/console/topup'}
          >
            Top Up Now
          </Button>
        </Card>
      </div>

      {/* Discount tiers */}
      <DiscountTable />

      {/* Transaction history */}
      <Card
        title={<Title heading={6} style={{ margin: 0 }}>Top-up History</Title>}
        bodyStyle={{ padding: 0 }}
      >
        {loading && transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : (
          <Table
            dataSource={transactions}
            columns={columns}
            pagination={{
              total,
              pageSize: 20,
              currentPage: page,
              onPageChange: setPage,
            }}
            empty={
              <Empty
                description="No transactions yet"
                style={{ padding: 40 }}
              />
            }
          />
        )}
      </Card>
    </div>
  );
}
