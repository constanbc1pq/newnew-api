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

import React, { useEffect, useRef, useState } from 'react';
import { Typography, Banner, Form, Spin, Tabs, TabPane } from '@douyinfe/semi-ui';
import { SiAlipay, SiWechat, SiBitcoin } from 'react-icons/si';
import { ShieldCheck } from 'lucide-react';
import { IconGift } from '@douyinfe/semi-icons';
import { useMinimumLoadingTime } from '../../hooks/common/useMinimumLoadingTime';
import { getCurrencyConfig } from '../../helpers/render';
import SubscriptionPlansCard from './SubscriptionPlansCard';

const { Text } = Typography;

// ─── Chain configs for crypto selector ───────────────────────────────────────
const CHAINS = [
  { id: 'tron',     name: 'TRON',      color: '#FF060A' },
  { id: 'bnb',      name: 'BNB Chain', color: '#F3BA2F' },
  { id: 'eth',      name: 'Ethereum',  color: '#627EEA' },
  { id: 'base',     name: 'Base',      color: '#0052FF' },
  { id: 'arb',      name: 'Arbitrum',  color: '#28A0F0' },
  { id: 'op',       name: 'Optimism',  color: '#FF0420' },
  { id: 'polygon',  name: 'Polygon',   color: '#8247E5' },
];

// ─── Pill button ─────────────────────────────────────────────────────────────
const Pill = ({ selected, onClick, children, style = {} }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 20px',
      borderRadius: '9999px',
      border: selected ? '2px solid var(--mr-accent)' : '1px solid var(--mr-border-strong)',
      background: selected ? 'var(--mr-accent)' : 'var(--mr-bg-surface-1)',
      color: selected ? 'var(--mr-accent-fg)' : 'var(--mr-text-primary)',
      fontWeight: selected ? 600 : 400,
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.12s',
      outline: 'none',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </button>
);

// ─── Big CTA button ───────────────────────────────────────────────────────────
const CtaButton = ({ onClick, disabled, loading, children, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: '100%',
      padding: '15px',
      borderRadius: '9999px',
      background: disabled || loading ? 'var(--mr-text-disabled)' : 'var(--mr-accent)',
      color: 'var(--mr-accent-fg)',
      fontWeight: 600,
      fontSize: '16px',
      border: 'none',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'background 0.12s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      ...style,
    }}
  >
    {children}
  </button>
);

// ─── Section label ────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--mr-text-secondary)', marginBottom: '10px' }}>
    {children}
  </div>
);

// ─── Payment icons row ────────────────────────────────────────────────────────
const PaymentIcons = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
    {/* VISA */}
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <rect width="36" height="22" rx="3" fill="#1A1F71"/>
      <text x="5" y="15" fontFamily="Arial" fontSize="11" fontWeight="bold" fill="white">VISA</text>
    </svg>
    {/* Mastercard */}
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <rect width="36" height="22" rx="3" fill="#252525"/>
      <circle cx="14" cy="11" r="6" fill="#EB001B"/>
      <circle cx="22" cy="11" r="6" fill="#F79E1B"/>
      <path d="M18 6.5a6 6 0 0 1 0 9 6 6 0 0 1 0-9z" fill="#FF5F00"/>
    </svg>
    {/* Alipay */}
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <rect width="36" height="22" rx="3" fill="#1677FF"/>
      <text x="5" y="15" fontFamily="Arial" fontSize="9" fontWeight="bold" fill="white">支付宝</text>
    </svg>
    {/* WeChat */}
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <rect width="36" height="22" rx="3" fill="#07C160"/>
      <text x="5" y="15" fontFamily="Arial" fontSize="9" fontWeight="bold" fill="white">微信</text>
    </svg>
    {/* GPay */}
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <rect width="36" height="22" rx="3" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
      <text x="4" y="15" fontFamily="Arial" fontSize="9" fontWeight="500" fill="#5f6368">G Pay</text>
    </svg>
    {/* APay */}
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <rect width="36" height="22" rx="3" fill="black"/>
      <text x="3" y="15" fontFamily="Arial" fontSize="9" fontWeight="500" fill="white"> Pay</text>
    </svg>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const RechargeCard = ({
  t,
  stripePublicKey,
  enableOnlineTopUp,
  enableStripeTopUp,
  enableCreemTopUp,
  creemProducts,
  creemPreTopUp,
  presetAmounts,
  selectedPreset,
  selectPresetAmount,
  formatLargeNumber,
  priceRatio,
  topUpCount,
  minTopUp,
  renderQuotaWithAmount,
  getAmount,
  setTopUpCount,
  setSelectedPreset,
  renderAmount,
  amountLoading,
  payMethods,
  preTopUp,
  paymentLoading,
  payWay,
  redemptionCode,
  setRedemptionCode,
  topUp,
  isSubmitting,
  topUpLink,
  openTopUpLink,
  userState,
  renderQuota,
  statusLoading,
  topupInfo,
  onOpenHistory,
  enableWaffoTopUp,
  waffoTopUp,
  waffoPayMethods,
  enableCoinbaseTopUp = false,
  coinbaseTopUp,
  enableNowPaymentsTopUp = false,
  nowPaymentsTopUp,
  isNewUserPromo = false,
  promoInfo = { limit_usd: 10, multiplier: 2.0 },
  priceQuote = null,
  subscriptionLoading = false,
  subscriptionPlans = [],
  billingPreference,
  onChangeBillingPreference,
  activeSubscriptions = [],
  allSubscriptions = [],
  reloadSubscriptionSelf,
}) => {
  useEffect(() => {
    if (stripePublicKey) window.__STRIPE_PUBLIC_KEY__ = stripePublicKey;
  }, [stripePublicKey]);

  const redeemFormApiRef = useRef(null);
  const initialTabSetRef = useRef(false);
  const showAmountSkeleton = useMinimumLoadingTime(amountLoading);

  const [paymentType, setPaymentType] = useState('fiat'); // 'fiat' | 'crypto'
  const [subscriptionTab, setSubscriptionTab] = useState('topup');
  const [selectedChain, setSelectedChain] = useState('tron');

  const shouldShowSubscription = !subscriptionLoading && subscriptionPlans.length > 0;
  const hasCrypto = enableCoinbaseTopUp || enableNowPaymentsTopUp;
  const hasFiat = enableOnlineTopUp || enableStripeTopUp || enableCreemTopUp || enableWaffoTopUp;

  useEffect(() => {
    if (initialTabSetRef.current) return;
    if (subscriptionLoading) return;
    setSubscriptionTab(shouldShowSubscription ? 'subscription' : 'topup');
    initialTabSetRef.current = true;
  }, [shouldShowSubscription, subscriptionLoading]);

  // ── Currency helpers ──────────────────────────────────────────────────────
  const { symbol, rate: fxRate, type: currencyType } = getCurrencyConfig();
  let usdRate = 7;
  try {
    const s = JSON.parse(localStorage.getItem('status') || '{}');
    usdRate = s?.usd_exchange_rate || 7;
  } catch (_) {}

  // Total amount the user will pay (in display currency)
  const totalDisplay = (() => {
    if (priceQuote?.final_amount_usd) {
      const usd = priceQuote.final_amount_usd;
      if (currencyType === 'USD') return usd;
      if (currencyType === 'CNY') return usd * usdRate;
      return usd * fxRate;
    }
    const discount = topupInfo?.discount?.[topUpCount] || 1.0;
    const rawCNY = topUpCount * priceRatio * discount;
    if (currencyType === 'USD') return rawCNY / usdRate;
    if (currencyType === 'CNY') return rawCNY;
    return (rawCNY / usdRate) * fxRate;
  })();

  const bonusCredits =
    isNewUserPromo && priceQuote?.promo_saving_usd > 0
      ? Math.round((priceQuote.promo_saving_usd * usdRate) / (priceRatio || 1))
      : 0;

  // Stripe is the primary fiat method; independent alipay/wechat gateways if present
  const stripeMethod = (payMethods || []).find(m => m.type === 'stripe');
  const altFiatMethods = (payMethods || []).filter(
    m => m.type !== 'stripe' && m.type !== 'waffo',
  );

  const handleStripeCheckout = () => {
    if (stripeMethod) preTopUp('stripe');
    else if (hasFiat) preTopUp((payMethods || [])[0]?.type || '');
  };

  // ── Crypto USD presets ────────────────────────────────────────────────────
  const CRYPTO_PRESETS_USD = [5, 10, 100];
  const usdToQuota = (usd) => Math.round((usd * usdRate) / (priceRatio || 1));

  // ── Fiat section ──────────────────────────────────────────────────────────
  const fiatSection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Security notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--mr-text-tertiary)', fontSize: '13px' }}>
        <ShieldCheck size={14} />
        <span>{t('您的支付受银行级技术加密，平台不保留任何信用卡信息')}</span>
      </div>

      {/* First-time promo banner */}
      {isNewUserPromo && (
        <div
          style={{
            background: 'var(--mr-info-soft)',
            borderRadius: '12px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--mr-info)',
          }}
        >
          🎁 {t('首次充值专属福利')}：{t('首充')} ${promoInfo.limit_usd} {t('或以上，立赠')} ${promoInfo.limit_usd}
        </div>
      )}

      {statusLoading ? (
        <div style={{ padding: '32px 0', display: 'flex', justifyContent: 'center' }}>
          <Spin size='large' />
        </div>
      ) : hasFiat ? (
        <>
          {/* Amount preset pills */}
          {presetAmounts && presetAmounts.length > 0 && (
            <div>
              <SectionLabel>{t('选择积分包')}</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {presetAmounts.map((preset, idx) => (
                  <Pill
                    key={idx}
                    selected={selectedPreset === preset.value}
                    onClick={() => selectPresetAmount(preset)}
                  >
                    {formatLargeNumber(preset.value)}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          {/* Summary card */}
          {(selectedPreset != null || topUpCount > minTopUp) && (
            <div
              style={{
                border: '1px solid var(--mr-border-default)',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'var(--mr-bg-surface-1)',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--mr-text-tertiary)', marginBottom: '4px' }}>{t('支付总计')}</div>
                {showAmountSkeleton ? (
                  <div style={{ height: '36px', background: 'var(--mr-bg-surface-2)', borderRadius: '6px', width: '100px', animation: 'pulse 1.5s infinite' }} />
                ) : (
                  <div className='mr-tabular' style={{ fontSize: '28px', fontWeight: 700, color: 'var(--mr-text-primary)' }}>
                    {symbol}{typeof totalDisplay === 'number' ? totalDisplay.toFixed(2) : renderAmount()}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span
                  style={{
                    fontSize: '12px',
                    background: 'var(--mr-bg-surface-2)',
                    color: 'var(--mr-text-tertiary)',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                  }}
                >
                  $1 = {Math.round(1 / (priceRatio || 0.001)).toLocaleString()} ⊕
                </span>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--mr-text-tertiary)', marginBottom: '4px' }}>{t('获得积分')}</div>
                <div className='mr-tabular' style={{ fontSize: '18px', fontWeight: 600, color: 'var(--mr-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{(topUpCount || 0).toLocaleString()} ⊕</span>
                  {bonusCredits > 0 && (
                    <>
                      <span style={{ color: 'var(--mr-text-disabled)' }}>+</span>
                      <span style={{ color: 'var(--mr-warning)' }}>{bonusCredits.toLocaleString()} 🎁</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fee notice */}
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--mr-text-tertiary)' }}>
            {t('最终结账金额将包含由支付网关收取的动态处理费')}
          </div>

          {/* Primary CTA — Stripe (handles card + alipay + wechat internally) */}
          {(enableStripeTopUp || stripeMethod) && (
            <CtaButton
              onClick={handleStripeCheckout}
              disabled={selectedPreset == null && topUpCount <= minTopUp}
              loading={paymentLoading && payWay === 'stripe'}
            >
              {paymentLoading && payWay === 'stripe' ? t('处理中...') : t('前往结账')}
            </CtaButton>
          )}

          {/* Independent Alipay / WeChat gateways (if not handled by Stripe) */}
          {altFiatMethods.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {altFiatMethods.map(m => (
                <CtaButton
                  key={m.type}
                  onClick={() => preTopUp(m.type)}
                  loading={paymentLoading && payWay === m.type}
                  disabled={selectedPreset == null && topUpCount <= minTopUp}
                  style={{ flex: 1 }}
                >
                  {m.type === 'alipay' && <SiAlipay size={18} />}
                  {m.type === 'wxpay' && <SiWechat size={18} />}
                  {m.name}
                </CtaButton>
              ))}
            </div>
          )}

          {/* Waffo */}
          {enableWaffoTopUp && waffoPayMethods?.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {waffoPayMethods.map((method, idx) => (
                <CtaButton
                  key={idx}
                  onClick={() => waffoTopUp(idx)}
                  loading={paymentLoading}
                  style={{ flex: 1 }}
                >
                  {method.name}
                </CtaButton>
              ))}
            </div>
          )}

          {/* Creem products */}
          {enableCreemTopUp && creemProducts?.length > 0 && (
            <div>
              <SectionLabel>Creem</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {creemProducts.map((product, idx) => (
                  <Pill key={idx} selected={false} onClick={() => creemPreTopUp(product)}>
                    {product.name} · {product.currency === 'EUR' ? '€' : '$'}{product.price}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          {/* Payment icons — decorative */}
          <PaymentIcons />
        </>
      ) : (
        <Banner
          type='info'
          description={t('管理员未开启在线充值功能，请联系管理员开启或使用兑换码充值。')}
          className='!rounded-xl'
          closeIcon={null}
        />
      )}
    </div>
  );

  // ── Crypto section ────────────────────────────────────────────────────────
  const cryptoSection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '13px', color: 'var(--mr-text-tertiary)' }}>
        {t('我们目前支持 TRON、BNB Chain、Ethereum、Base、Arbitrum、Optimism、Polygon 充值')}
      </div>

      {/* Chain selector */}
      <div>
        <SectionLabel>{t('区块链')}</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CHAINS.map(chain => (
            <button
              key={chain.id}
              onClick={() => setSelectedChain(chain.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '9999px',
                border: selectedChain === chain.id
                  ? `2px solid ${chain.color}`
                  : '1px solid var(--mr-border-default)',
                background: selectedChain === chain.id ? `${chain.color}18` : 'var(--mr-bg-surface-1)',
                color: selectedChain === chain.id ? chain.color : 'var(--mr-text-secondary)',
                fontWeight: selectedChain === chain.id ? 600 : 400,
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.12s',
              }}
            >
              {chain.name}
            </button>
          ))}
        </div>
      </div>

      {/* Amount presets */}
      <div>
        <SectionLabel>{t('数额')}</SectionLabel>
        {isNewUserPromo && (
          <div
            style={{
              background: 'var(--mr-info-soft)',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--mr-info)',
              marginBottom: '10px',
            }}
          >
            🎁 {t('首次充值专属福利')}：{t('首充')} ${promoInfo.limit_usd} {t('或以上，立赠')} ${promoInfo.limit_usd}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          {CRYPTO_PRESETS_USD.map(usd => {
            const qVal = usdToQuota(usd);
            const isSelected = selectedPreset === qVal;
            return (
              <Pill
                key={usd}
                selected={isSelected}
                onClick={() => { setTopUpCount(qVal); setSelectedPreset(qVal); }}
                style={{ flex: 1, padding: '10px 8px', textAlign: 'center' }}
              >
                ${usd}
              </Pill>
            );
          })}
          <Pill
            selected={false}
            onClick={() => {}}
            style={{ flex: 1, padding: '10px 8px', textAlign: 'center', color: 'var(--mr-text-tertiary)' }}
          >
            {t('自定义')}
          </Pill>
        </div>
      </div>

      {/* Crypto CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {enableCoinbaseTopUp && (
          <CtaButton onClick={coinbaseTopUp} disabled={paymentLoading}>
            <SiBitcoin size={18} color='#F7931A' />
            Coinbase · BTC / ETH / USDC
          </CtaButton>
        )}
        {enableNowPaymentsTopUp && (
          <CtaButton onClick={nowPaymentsTopUp} disabled={paymentLoading}>
            <SiBitcoin size={18} color='#00B67A' />
            NowPayments · USDT / {t('多币种')}
          </CtaButton>
        )}
      </div>
    </div>
  );

  // ── Redemption code ───────────────────────────────────────────────────────
  const redemptionSection = (
    <div style={{ paddingTop: '8px' }}>
      <SectionLabel>{t('兑换码充值')}</SectionLabel>
      <Form
        getFormApi={(api) => (redeemFormApiRef.current = api)}
        initValues={{ redemptionCode }}
      >
        <Form.Input
          field='redemptionCode'
          noLabel
          placeholder={t('请输入兑换码')}
          value={redemptionCode}
          onChange={(v) => setRedemptionCode(v)}
          prefix={<IconGift />}
          suffix={
            <button
              onClick={topUp}
              disabled={isSubmitting}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                background: 'var(--mr-accent)',
                color: 'var(--mr-accent-fg)',
                border: 'none',
                fontSize: '13px',
                fontWeight: 500,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {t('兑换额度')}
            </button>
          }
          showClear
          style={{ width: '100%' }}
          extraText={
            topUpLink && (
              <Text type='tertiary'>
                {t('在找兑换码？')}
                <Text type='secondary' underline style={{ cursor: 'pointer' }} onClick={openTopUpLink}>
                  {t('购买兑换码')}
                </Text>
              </Text>
            )
          }
        />
      </Form>
    </div>
  );

  // ── Main topup content ────────────────────────────────────────────────────
  const topupContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Crypto / Fiat toggle — only show when both are available */}
      {hasCrypto && hasFiat && (
        <div
          style={{
            display: 'inline-flex',
            padding: '4px',
            borderRadius: '12px',
            background: 'var(--mr-bg-surface-2)',
            alignSelf: 'flex-start',
          }}
        >
          {[
            { key: 'fiat',   label: t('法币支付') },
            { key: 'crypto', label: t('加密货币') },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPaymentType(key)}
              style={{
                padding: '6px 16px',
                borderRadius: '9px',
                background: paymentType === key ? 'var(--mr-bg-surface-1)' : 'transparent',
                color: paymentType === key ? 'var(--mr-text-primary)' : 'var(--mr-text-tertiary)',
                fontWeight: paymentType === key ? 600 : 400,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: paymentType === key ? 'var(--mr-shadow-sm)' : 'none',
                transition: 'all 0.12s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Show only fiat when no crypto */}
      {!hasCrypto && fiatSection}

      {/* Show based on toggle when both exist */}
      {hasCrypto && hasFiat && (paymentType === 'fiat' ? fiatSection : cryptoSection)}

      {/* Show only crypto when no fiat */}
      {hasCrypto && !hasFiat && cryptoSection}

      {/* Divider + redemption code */}
      <div style={{ borderTop: '1px solid var(--mr-border-subtle)' }} />
      {redemptionSection}
    </div>
  );

  // ── Subscription content ──────────────────────────────────────────────────
  const subscriptionContent = (
    <SubscriptionPlansCard
      t={t}
      loading={subscriptionLoading}
      plans={subscriptionPlans}
      payMethods={payMethods}
      enableOnlineTopUp={enableOnlineTopUp}
      enableStripeTopUp={enableStripeTopUp}
      enableCreemTopUp={enableCreemTopUp}
      billingPreference={billingPreference}
      onChangeBillingPreference={onChangeBillingPreference}
      activeSubscriptions={activeSubscriptions}
      allSubscriptions={allSubscriptions}
      reloadSubscriptionSelf={reloadSubscriptionSelf}
      withCard={false}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: 'var(--mr-bg-surface-1)',
        border: '1px solid var(--mr-border-default)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Top tab bar: 充值 | 账单 */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          padding: '0 24px',
          borderBottom: '1px solid var(--mr-border-subtle)',
        }}
      >
        {[
          { key: 'topup',   label: t('充值') },
          { key: 'billing', label: t('账单') },
        ].map(({ key, label }) => {
          const isActive = key === 'topup'; // billing just opens modal, always show topup as active
          return (
            <button
              key={key}
              onClick={() => key === 'billing' && onOpenHistory()}
              style={{
                padding: '16px 0',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--mr-text-primary)' : '2px solid transparent',
                color: isActive ? 'var(--mr-text-primary)' : 'var(--mr-text-tertiary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '15px',
                cursor: 'pointer',
                marginBottom: '-1px',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div style={{ padding: '24px' }}>
        {shouldShowSubscription ? (
          <Tabs
            type='line'
            activeKey={subscriptionTab}
            onChange={setSubscriptionTab}
          >
            <TabPane tab={t('订阅套餐')} itemKey='subscription'>
              <div style={{ paddingTop: '16px' }}>{subscriptionContent}</div>
            </TabPane>
            <TabPane tab={t('额度充值')} itemKey='topup'>
              <div style={{ paddingTop: '16px' }}>{topupContent}</div>
            </TabPane>
          </Tabs>
        ) : (
          topupContent
        )}
      </div>
    </div>
  );
};

export default RechargeCard;
