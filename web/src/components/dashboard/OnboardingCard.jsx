/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

import React, { useState } from 'react';
import { Card, Button, Tag, Typography, Toast } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import { Wallet, Key, Code2, CheckCircle2, ChevronRight, Copy } from 'lucide-react';

const { Text, Title } = Typography;

/**
 * OnboardingCard — shown to users who have never paid/used the platform.
 * Three-step quick-start: recharge → create API key → start calling.
 *
 * isNewUserPromo:  whether the new-user discount is active
 * promoInfo:       { limit_usd, multiplier } for the discount tooltip
 * userQuota:       current quota (0 for brand-new users)
 * hasToken:        whether user already has an API key
 * t:               i18n function
 */
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
    navigator.clipboard.writeText(baseURL).then(() => {
      setCopied(true);
      Toast.success({ content: t('已复制'), duration: 2 });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const steps = [
    {
      key: 'recharge',
      icon: <Wallet size={20} />,
      color: hasFunds ? 'green' : 'blue',
      done: hasFunds,
      title: t('充值额度'),
      desc: isNewUserPromo
        ? `${t('首充前')} $${promoInfo.limit_usd} ${t('享')} ${promoInfo.multiplier}x ${t('额度')}`
        : t('选择适合自己的充值方案'),
      action: () => navigate('/console/topup'),
      actionLabel: hasFunds ? t('查看余额') : t('立即充值'),
    },
    {
      key: 'token',
      icon: <Key size={20} />,
      color: hasToken ? 'green' : 'blue',
      done: hasToken,
      title: t('创建 API Key'),
      desc: t('用于调用 AI 接口，可随时新增或撤销'),
      action: () => navigate('/console/token'),
      actionLabel: hasToken ? t('管理 Key') : t('创建 Key'),
    },
    {
      key: 'code',
      icon: <Code2 size={20} />,
      color: 'blue',
      done: false,
      title: t('开始调用'),
      desc: (
        <span>
          {t('兼容 OpenAI SDK，把')}
          <code
            className='mx-1 px-1 py-0.5 rounded text-xs cursor-pointer hover:bg-blue-100 transition-colors'
            style={{
              background: 'var(--semi-color-fill-1)',
              fontFamily: 'monospace',
            }}
            onClick={handleCopyBaseURL}
          >
            base_url
          </code>
          {t('改为')}
          <code
            className='ml-1 px-1 py-0.5 rounded text-xs cursor-pointer hover:bg-blue-100 transition-colors'
            style={{
              background: 'var(--semi-color-fill-1)',
              fontFamily: 'monospace',
            }}
            onClick={handleCopyBaseURL}
          >
            {baseURL}/v1
          </code>
        </span>
      ),
      action: handleCopyBaseURL,
      actionLabel: copied ? t('已复制!') : t('复制接入地址'),
      actionIcon: <Copy size={14} />,
    },
  ];

  return (
    <Card
      className='!rounded-2xl mb-4 border-0'
      style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(147,51,234,0.05) 100%)',
        border: '1px solid rgba(37,99,235,0.12)',
      }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div className='flex items-center justify-between mb-4'>
        <div>
          <Title heading={5} style={{ margin: 0 }}>
            🚀 {t('快速开始')}
          </Title>
          <Text type='secondary' style={{ fontSize: '13px' }}>
            {t('三步完成接入，5 分钟跑通第一个请求')}
          </Text>
        </div>
        {isNewUserPromo && (
          <Tag color='green' size='large' shape='circle'>
            🎉 {t('新人')} {promoInfo.multiplier}x {t('额度')}
          </Tag>
        )}
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        {steps.map((step, idx) => (
          <div
            key={step.key}
            className='flex flex-col justify-between p-4 rounded-xl transition-all'
            style={{
              background: step.done
                ? 'rgba(34,197,94,0.06)'
                : 'var(--semi-color-bg-2)',
              border: step.done
                ? '1px solid rgba(34,197,94,0.2)'
                : '1px solid var(--semi-color-border)',
            }}
          >
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <div
                  className='flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0'
                  style={{
                    background: step.done
                      ? 'rgba(34,197,94,0.15)'
                      : 'rgba(37,99,235,0.1)',
                    color: step.done ? 'rgb(34,197,94)' : 'rgb(37,99,235)',
                  }}
                >
                  {step.done ? <CheckCircle2 size={18} /> : step.icon}
                </div>
                <Text strong style={{ fontSize: '14px' }}>
                  {idx + 1}. {step.title}
                </Text>
              </div>
              <Text
                type='secondary'
                style={{ fontSize: '12px', lineHeight: '1.5', display: 'block', marginBottom: '12px' }}
              >
                {step.desc}
              </Text>
            </div>
            <Button
              size='small'
              theme={step.done ? 'outline' : 'solid'}
              type={step.done ? 'tertiary' : 'primary'}
              icon={step.actionIcon}
              iconPosition='right'
              suffix={!step.actionIcon && <ChevronRight size={14} />}
              onClick={step.action}
              className='!rounded-lg w-full'
            >
              {step.actionLabel}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default OnboardingCard;
