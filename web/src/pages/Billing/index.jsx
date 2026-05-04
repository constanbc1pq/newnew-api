import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Tag,
  Button,
  Typography,
  Empty,
} from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import { IconCreditCard, IconRefresh } from '@douyinfe/semi-icons';
import CardPro from '../../components/common/ui/CardPro';
import CardTable from '../../components/common/ui/CardTable';
import { API, showError, renderQuota } from '../../helpers';
import { quotaToDisplayAmount } from '../../helpers/quota';
import { createCardProPagination } from '../../helpers/utils';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { UserContext } from '../../context/User';

const { Title, Text } = Typography;

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

const VOLUME_TIERS = [
  { amount: '$6',   tokens: '~3M',   bonus: '0%',  badgeKey: null },
  { amount: '$20',  tokens: '~10M',  bonus: '+5%', badgeKey: null },
  { amount: '$100', tokens: '~50M',  bonus: '+10%', badgeKey: 'Popular' },
  { amount: '$200', tokens: '~100M', bonus: '+20%', badgeKey: null },
];

function formatUSD(amount) {
  if (!amount) return '—';
  return `$${parseFloat(amount).toFixed(2)}`;
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString();
}

function DiscountTable({ t }) {
  return (
    <Card
      title={<Title heading={6} style={{ margin: 0 }}>{t('阶梯优惠')}</Title>}
      style={{ marginBottom: 20 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {VOLUME_TIERS.map(tier => (
          <div
            key={tier.amount}
            style={{
              border: '1px solid var(--mr-border-default)',
              borderRadius: 14,
              padding: '14px 16px',
              textAlign: 'center',
              position: 'relative',
              background: tier.badgeKey ? 'var(--semi-color-primary-light-default)' : 'transparent',
            }}
          >
            {tier.badgeKey && (
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--semi-color-primary)', color: 'var(--semi-color-bg-0)',
                fontSize: 10, padding: '2px 8px', borderRadius: 9999,
              }}>
                {t('热门')}
              </div>
            )}
            <div className='mr-tabular' style={{ fontSize: 20, fontWeight: 700, color: 'var(--mr-text-primary)' }}>{tier.amount}</div>
            <div style={{ fontSize: 12, color: 'var(--mr-text-tertiary)', margin: '4px 0' }}>{tier.tokens} tokens</div>
            {tier.bonus !== '0%' && (
              <Tag color="green" size="small">+{tier.bonus.replace('+', '')} {t('额度奖励')}</Tag>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <Text type="tertiary" size="small">
          {t('新用户首充 $10 享 2× 额度，叠加用户组倍率。')}
        </Text>
      </div>
    </Card>
  );
}

const PAGE_SIZE = 20;

export default function BillingPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [userState] = useContext(UserContext);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  const quota = userState?.user?.quota ?? 0;
  const approxUSD = quotaToDisplayAmount(quota).toFixed(2);

  const loadTransactions = useCallback(async (p = 1, ps = PAGE_SIZE) => {
    setLoading(true);
    try {
      const res = await API.get(`/api/user/transactions?page=${p}&size=${ps}`);
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

  useEffect(() => { loadTransactions(page, pageSize); }, [page, pageSize, loadTransactions]);

  const columns = [
    {
      title: t('日期'),
      dataIndex: 'created_at',
      width: 170,
      render: ts => <Text size="small">{formatDate(ts)}</Text>,
    },
    {
      title: t('类型'),
      dataIndex: 'type',
      width: 100,
      render: type => (
        <Tag color={type === 'topup' ? 'blue' : 'orange'} size="small">
          {type === 'topup' ? t('充值') : type}
        </Tag>
      ),
    },
    {
      title: t('金额'),
      dataIndex: 'amount',
      width: 110,
      render: (amt, row) => (
        <Text className='mr-tabular'>
          {formatUSD(amt)} {row.currency && row.currency !== 'USD' ? row.currency : ''}
        </Text>
      ),
    },
    {
      title: t('额度增加'),
      dataIndex: 'quota',
      width: 130,
      render: q => q
        ? <Text className='mr-tabular' style={{ color: 'var(--mr-success)' }}>+{renderQuota(q)}</Text>
        : '—',
    },
    {
      title: t('支付通道'),
      dataIndex: 'provider',
      width: 110,
      render: p => <Text type="tertiary" size="small">{PROVIDER_LABEL[p] || p || '—'}</Text>,
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 100,
      render: s => <Tag color={STATUS_COLOR[s] || 'grey'} size="small">{s ? t(s) : '—'}</Tag>,
    },
    {
      title: t('交易号'),
      dataIndex: 'trade_no',
      render: txt => (
        <Text type="tertiary" size="small" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
          {txt ? txt.slice(0, 20) + '…' : '—'}
        </Text>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title heading={4} style={{ margin: 0 }}>{t('账单与用量')}</Title>
        <Button icon={<IconRefresh />} onClick={() => loadTransactions(page, pageSize)}>
          {t('刷新')}
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <Card>
          <Text type="tertiary" size="small">{t('当前余额')}</Text>
          <Title heading={3} className='mr-tabular' style={{ margin: '4px 0' }}>{renderQuota(quota)}</Title>
          <Text type="tertiary" size="small">≈ ${approxUSD} USD</Text>
        </Card>
        <Card>
          <Text type="tertiary" size="small">{t('用户名')}</Text>
          <Title heading={3} style={{ margin: '4px 0' }}>{userState?.user?.username || '—'}</Title>
          <Text type="tertiary" size="small">
            {t('用户组')}: {userState?.user?.group || 'default'}
          </Text>
        </Card>
        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Button
            theme="solid"
            size="large"
            icon={<IconCreditCard />}
            onClick={() => window.location.href = '/console/topup'}
          >
            {t('立即充值')}
          </Button>
        </Card>
      </div>

      <DiscountTable t={t} />

      <CardPro
        type='type1'
        descriptionArea={
          <div style={{ padding: '4px 0' }}>
            <Title heading={6} style={{ margin: 0 }}>{t('充值历史')}</Title>
          </div>
        }
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
          dataSource={transactions}
          loading={loading}
          hidePagination
          empty={
            <Empty
              image={<IllustrationNoResult style={{ width: 120, height: 120 }} />}
              darkModeImage={<IllustrationNoResultDark style={{ width: 120, height: 120 }} />}
              title={t('暂无充值记录')}
              description={t('完成充值后这里会显示交易明细')}
            />
          }
        />
      </CardPro>
    </div>
  );
}
