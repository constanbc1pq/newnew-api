/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

import React, { useState } from 'react';
import { Typography, Toast } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import { Copy, CheckCircle2 } from 'lucide-react';

const { Text } = Typography;

const OnboardingCard = ({
  isNewUserPromo = false,
  promoInfo = { limit_usd: 10, multiplier: 2.0 },
  userQuota = 0,
  hasToken = false,
  t,
}) => {
  const navigate = useNavigate();
  const baseURL = window.location.origin;
  const [copied, setCopied] = useState(false);

  const hasFunds = userQuota > 0;

  const handleCopyBaseURL = () => {
    navigator.clipboard.writeText(`${baseURL}/v1`).then(() => {
      setCopied(true);
      Toast.success({ content: t('已复制'), duration: 2 });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const steps = [
    {
      num: 1,
      done: hasFunds,
      title: t('充值额度'),
      desc: isNewUserPromo
        ? `${t('首充前')} $${promoInfo.limit_usd} ${t('享')} ${promoInfo.multiplier}x ${t('额度')}`
        : t('选择适合自己的充值方案'),
      actionLabel: hasFunds ? t('查看余额') : t('立即充值'),
      onClick: () => navigate('/console/topup'),
    },
    {
      num: 2,
      done: hasToken,
      title: t('创建 API Key'),
      desc: t('用于调用 AI 接口，可随时新增或撤销'),
      actionLabel: hasToken ? t('管理 Key') : t('创建 Key'),
      onClick: () => navigate('/console/token'),
    },
    {
      num: 3,
      done: false,
      title: t('开始调用'),
      desc: (
        <span>
          {t('兼容 OpenAI SDK，把')} <code style={{ fontFamily: 'monospace', fontSize: '12px', background: '#f3f4f6', padding: '1px 4px', borderRadius: '3px' }}>base_url</code> {t('改为')} <code style={{ fontFamily: 'monospace', fontSize: '12px', background: '#f3f4f6', padding: '1px 4px', borderRadius: '3px' }}>{baseURL}/v1</code>
        </span>
      ),
      actionLabel: copied ? t('已复制!') : t('复制接入地址'),
      onClick: handleCopyBaseURL,
    },
  ];

  return (
    <div
      style={{
        border: '1.5px solid #e5e7eb',
        borderRadius: '18px',
        padding: '20px 24px',
        marginBottom: '16px',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px', color: '#111' }}>{t('快速开始')}</div>
          <Text type='secondary' style={{ fontSize: '13px' }}>
            {t('三步完成接入，5 分钟跑通第一个请求')}
          </Text>
        </div>
        {isNewUserPromo && (
          <span style={{
            padding: '3px 12px',
            borderRadius: '9999px',
            background: 'linear-gradient(90deg, #dbeafe 0%, #fce7d6 100%)',
            fontSize: '12px',
            fontWeight: 500,
            color: '#1e3a5f',
            whiteSpace: 'nowrap',
          }}>
            🎁 {t('新人')} {promoInfo.multiplier}x {t('额度')}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {steps.map((step) => (
          <div
            key={step.num}
            style={{
              border: step.done ? '1.5px solid #000' : '1.5px solid #e5e7eb',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: step.done ? '#fafafa' : '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px', height: '24px',
                borderRadius: '9999px',
                background: step.done ? '#000' : '#f3f4f6',
                color: step.done ? '#fff' : '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 600, flexShrink: 0,
              }}>
                {step.done ? <CheckCircle2 size={14} /> : step.num}
              </div>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{step.title}</span>
            </div>

            <Text type='secondary' style={{ fontSize: '12px', lineHeight: 1.5 }}>
              {step.desc}
            </Text>

            <button
              onClick={step.onClick}
              style={{
                padding: '7px 12px',
                borderRadius: '9999px',
                background: step.done ? '#fff' : '#000',
                color: step.done ? '#111' : '#fff',
                border: step.done ? '1.5px solid #d1d5db' : 'none',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              {step.num === 3 && <Copy size={12} />}
              {step.actionLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnboardingCard;
