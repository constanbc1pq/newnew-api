/*
Copyright (C) 2025 QuantumNous — AGPL-3.0
*/
import React, { useState } from 'react';
import { Card, Button, Tag, Typography, Badge } from '@douyinfe/semi-ui';
import { MessageSquare, Code2, BrainCircuit, ChevronRight, Sparkles } from 'lucide-react';

const { Text, Title } = Typography;

/**
 * UsageEstimator — shows 3 usage tiers (日常对话 / 开发代码 / AI即操作系统).
 * When user picks a tier, it calls onSelectTier({ quotaAmount, discountRate }) to:
 *   1. Pre-fill the topUpCount input
 *   2. Show the corresponding bulk-purchase discount
 *
 * Props:
 *   quotaPerUnit     — tokens per quota unit (from getQuotaPerUnit())
 *   onSelectTier     — ({ amount: int64, label: string }) => void
 *   t                — i18n function
 *   isNewUserPromo   — whether new-user promo is active
 */
const UsageEstimator = ({ quotaPerUnit = 500000, onSelectTier, t, isNewUserPromo = false }) => {
  const [selected, setSelected] = useState(null);

  // Token → quota unit conversion helper
  // quotaPerUnit is how many tokens = 1 quota unit
  const tokensToQuota = (tokens) => Math.ceil(tokens / quotaPerUnit);

  const TIERS = [
    {
      key: 'chat',
      icon: <MessageSquare size={22} />,
      color: 'rgba(59,130,246,0.12)',
      borderColor: 'rgba(59,130,246,0.25)',
      iconColor: 'rgb(59,130,246)',
      name: t('landing_tier_chat_name'),
      desc: t('landing_tier_chat_desc'),
      tokensLabel: t('landing_tier_chat_tokens'),
      priceLabel: t('landing_tier_chat_usd'),
      discountLabel: t('landing_tier_chat_discount'),
      discountRate: 0.05,   // 5% extra quota
      tokens: 3_000_000,    // 3M tokens
      examples: ['ChatGPT', t('写作润色'), t('日常问答')],
      highlight: false,
    },
    {
      key: 'dev',
      icon: <Code2 size={22} />,
      color: 'rgba(124,58,237,0.10)',
      borderColor: 'rgba(124,58,237,0.3)',
      iconColor: 'rgb(124,58,237)',
      name: t('landing_tier_dev_name'),
      desc: t('landing_tier_dev_desc'),
      tokensLabel: t('landing_tier_dev_tokens'),
      priceLabel: t('landing_tier_dev_usd'),
      discountLabel: t('landing_tier_dev_discount'),
      discountRate: 0.10,   // 10% extra quota
      tokens: 10_000_000,   // 10M tokens
      examples: ['Cursor', 'Copilot', 'Claude Code'],
      highlight: true,      // 推荐
    },
    {
      key: 'ai_os',
      icon: <BrainCircuit size={22} />,
      color: 'rgba(16,185,129,0.08)',
      borderColor: 'rgba(16,185,129,0.25)',
      iconColor: 'rgb(16,185,129)',
      name: t('landing_tier_ai_os_name'),
      desc: t('landing_tier_ai_os_desc'),
      tokensLabel: t('landing_tier_ai_os_tokens'),
      priceLabel: t('landing_tier_ai_os_usd'),
      discountLabel: t('landing_tier_ai_os_discount'),
      discountRate: 0.20,   // 20% extra quota
      tokens: 100_000_000,  // 100M tokens
      examples: ['AI Agent', 'n8n', 'AutoGen'],
      highlight: false,
    },
  ];

  const handleSelect = (tier) => {
    setSelected(tier.key);
    const quotaAmount = tokensToQuota(tier.tokens);
    if (onSelectTier) {
      onSelectTier({ amount: quotaAmount, label: tier.name, discountRate: tier.discountRate });
    }
  };

  return (
    <Card
      className='!rounded-2xl mb-4 border-0'
      style={{
        background: 'var(--semi-color-bg-1)',
        border: '1px solid var(--semi-color-border)',
      }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div className='flex items-center justify-between mb-1'>
        <Title heading={5} style={{ margin: 0 }}>
          {t('landing_tier_title')}
        </Title>
        {isNewUserPromo && (
          <Tag color='green' size='small'>
            <Sparkles size={12} className='mr-1' />
            {t('新人额外加成叠加')}
          </Tag>
        )}
      </div>
      <Text type='secondary' style={{ fontSize: '13px', display: 'block', marginBottom: '16px' }}>
        {t('landing_tier_subtitle')}
      </Text>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        {TIERS.map((tier) => {
          const isSelected = selected === tier.key;
          return (
            <div
              key={tier.key}
              className='relative flex flex-col justify-between p-4 rounded-xl cursor-pointer transition-all'
              style={{
                background: isSelected ? tier.color : 'var(--semi-color-bg-0)',
                border: isSelected
                  ? `2px solid ${tier.borderColor}`
                  : '1px solid var(--semi-color-border)',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
              }}
              onClick={() => handleSelect(tier)}
            >
              {/* Popular badge */}
              {tier.highlight && (
                <div
                  className='absolute -top-3 left-1/2 -translate-x-1/2'
                >
                  <Tag color='violet' size='small' shape='circle'>
                    <Sparkles size={11} className='mr-1' />
                    {t('landing_tier_badge_popular')}
                  </Tag>
                </div>
              )}

              <div>
                {/* Icon + name */}
                <div className='flex items-center gap-2 mb-3'>
                  <div
                    className='flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0'
                    style={{ background: tier.color, color: tier.iconColor }}
                  >
                    {tier.icon}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: '15px', display: 'block' }}>
                      {tier.name}
                    </Text>
                    <Text type='secondary' style={{ fontSize: '11px' }}>
                      {tier.desc}
                    </Text>
                  </div>
                </div>

                {/* Token estimate */}
                <div className='mb-3'>
                  <Text strong style={{ fontSize: '13px', display: 'block' }}>
                    {tier.tokensLabel}
                  </Text>
                  <Text type='secondary' style={{ fontSize: '12px' }}>
                    {tier.priceLabel}
                  </Text>
                </div>

                {/* Example use cases */}
                <div className='flex flex-wrap gap-1 mb-3'>
                  {tier.examples.map((ex) => (
                    <Tag key={ex} size='small' color='white' style={{ fontSize: '11px' }}>
                      {ex}
                    </Tag>
                  ))}
                </div>
              </div>

              {/* Discount badge + CTA */}
              <div className='flex items-center justify-between mt-2'>
                <Tag
                  color='green'
                  size='small'
                  style={{ fontSize: '11px', fontWeight: 600 }}
                >
                  {tier.discountLabel}
                </Tag>
                <Button
                  size='small'
                  theme={isSelected ? 'solid' : 'outline'}
                  type={isSelected ? 'primary' : 'tertiary'}
                  icon={<ChevronRight size={13} />}
                  iconPosition='right'
                  className='!rounded-lg !text-xs'
                  onClick={(e) => { e.stopPropagation(); handleSelect(tier); }}
                >
                  {isSelected ? t('已选择') : t('选这个')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription coming-soon teaser */}
      <div
        className='flex items-center justify-between mt-4 px-4 py-3 rounded-xl'
        style={{
          background: 'var(--semi-color-fill-0)',
          border: '1px dashed var(--semi-color-border)',
        }}
      >
        <div className='flex items-center gap-2'>
          <Sparkles size={15} style={{ color: 'var(--semi-color-text-2)' }} />
          <Text type='secondary' style={{ fontSize: '13px' }}>
            {t('landing_subscription_coming')} — {t('landing_subscription_save')}
          </Text>
        </div>
        <Tag color='orange' size='small'>{t('landing_subscription_coming_badge')}</Tag>
      </div>

      {selected && (
        <Text type='tertiary' style={{ fontSize: '11px', display: 'block', marginTop: '10px', textAlign: 'center' }}>
          {t('landing_tier_bulk_hint')}
        </Text>
      )}
    </Card>
  );
};

export default UsageEstimator;
