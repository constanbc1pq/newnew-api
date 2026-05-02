/**
 * RedeemCodeBox — reusable redemption-code entry widget.
 *
 * Props:
 *   onSuccess(quota)  — called after a successful redeem; quota = tokens added
 *   compact           — smaller layout (for sidebar / dashboard cards)
 */
import React, { useState } from 'react';
import { Input, Button, Typography, Toast } from '@douyinfe/semi-ui';
import { IconTickCircle, IconGift } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { API } from '../../helpers';

const { Text } = Typography;

export default function RedeemCodeBox({ onSuccess, compact = false }) {
  const { t } = useTranslation();
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null); // quota gained

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await API.post('/api/user/redeem', { code: trimmed });
      if (res.data.success) {
        const quota = res.data.data;
        setSuccess(quota);
        setCode('');
        Toast.success(t('兑换成功！获得 {{count}} tokens', { count: quota.toLocaleString() }));
        onSuccess?.(quota);
      } else {
        Toast.error(res.data.message || t('兑换失败'));
      }
    } catch (e) {
      Toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success !== null) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: compact ? '8px 0' : '12px 0',
        color: 'var(--semi-color-success)',
      }}>
        <IconTickCircle size="large" />
        <Text style={{ color: 'var(--semi-color-success)' }}>
          {t('已兑换')} +{success.toLocaleString()} tokens
        </Text>
        <Button
          size="small"
          type="tertiary"
          onClick={() => setSuccess(null)}
          style={{ marginLeft: 'auto' }}
        >
          {t('再兑一张')}
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 10 }}>
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconGift style={{ color: 'var(--semi-color-primary)' }} />
          <Text strong>{t('兑换码')}</Text>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          value={code}
          onChange={setCode}
          placeholder={compact ? t('输入兑换码') : t('输入兑换码，例如 WELCOME2025')}
          style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          onEnterPress={handleRedeem}
          size={compact ? 'small' : 'default'}
        />
        <Button
          theme="solid"
          onClick={handleRedeem}
          loading={loading}
          disabled={!code.trim()}
          size={compact ? 'small' : 'default'}
        >
          {t('兑换')}
        </Button>
      </div>
      {!compact && (
        <Text type="tertiary" size="small">
          {t('兑换码区分大小写，每码只能使用一次')}
        </Text>
      )}
    </div>
  );
}
