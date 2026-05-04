import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, Typography } from '@douyinfe/semi-ui';
import { getSystemName } from '../../helpers/utils';
import { getServerAddress } from '../../helpers/token';

const { Title, Paragraph } = Typography;

const CodeBlock = ({ code, lang = '' }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ position: 'relative', margin: '12px 0' }}>
      <pre style={{
        background: 'var(--mr-bg-surface-2)',
        border: '1px solid var(--mr-border-default)',
        borderRadius: '14px',
        padding: '16px',
        fontSize: '13px',
        fontFamily: 'var(--font-mono, monospace)',
        overflowX: 'auto',
        color: 'var(--mr-text-primary)',
        lineHeight: 1.6,
      }}>
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '3px 10px',
          borderRadius: '9999px',
          border: '1px solid var(--mr-border-strong)',
          background: 'var(--mr-bg-surface-1)',
          fontSize: '11px',
          cursor: 'pointer',
          color: 'var(--mr-text-secondary)',
        }}
      >
        {copied ? t('已复制') : t('复制')}
      </button>
    </div>
  );
};

const Section = ({ id, title, children }) => (
  <section id={id} style={{ marginBottom: '40px', scrollMarginTop: '76px' }}>
    <h2 style={{
      fontSize: '18px',
      fontWeight: 600,
      color: 'var(--mr-text-primary)',
      marginBottom: '12px',
      paddingBottom: '8px',
      borderBottom: '1px solid var(--mr-border-default)',
    }}>
      {title}
    </h2>
    {children}
  </section>
);

const DocsPage = () => {
  const { t } = useTranslation();
  const systemName = getSystemName() || 'Market Router';
  const baseUrl = (getServerAddress() || window.location.origin).replace(/\/+$/, '');

  const containerRef = useRef(null);
  const [, force] = useState(0);
  useEffect(() => { force((x) => x + 1); }, []);

  return (
    <div
      ref={containerRef}
      className='mt-[60px] px-2'
      style={{
        height: 'calc(100dvh - 60px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{
        maxWidth: '1080px',
        margin: '0 auto',
        padding: '48px 24px 80px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 200px',
        gap: 32,
      }}>
        <main style={{ minWidth: 0 }}>
          <header style={{ marginBottom: '48px' }}>
            <Title heading={2} style={{ margin: 0, fontWeight: 700 }}>
              {t('API 文档')}
            </Title>
            <Paragraph type='secondary' style={{ marginTop: 8, lineHeight: 1.6 }}>
              {t('docs_intro', { systemName })}
            </Paragraph>
          </header>

          <Section id='base-url' title={t('Base URL')}>
            <p style={{ fontSize: '14px', color: 'var(--mr-text-secondary)', marginBottom: '8px' }}>
              {t('所有 API 请求均发送到以下地址：')}
            </p>
            <CodeBlock code={`${baseUrl}/v1`} />
          </Section>

          <Section id='auth' title={t('认证')}>
            <p style={{ fontSize: '14px', color: 'var(--mr-text-secondary)', marginBottom: '8px' }}>
              {t('在请求头中携带你的 API Key，格式与 OpenAI 完全一致：')}
            </p>
            <CodeBlock code={`Authorization: Bearer YOUR_API_KEY`} />
            <p style={{ fontSize: '13px', color: 'var(--mr-text-tertiary)', marginTop: '8px' }}>
              {t('在控制台 → API 页面创建和管理你的 API Key。')}
            </p>
          </Section>

          <Section id='quick-start' title={t('快速开始')}>
            <p style={{ fontSize: '14px', color: 'var(--mr-text-secondary)', marginBottom: '8px' }}>
              {t('向任何支持 OpenAI 接口的 AI 工具（Cursor、Cline、Claude Code、Continue 等）传入以下参数：')}
            </p>
            <CodeBlock lang='json' code={`{
  "base_url": "${baseUrl}/v1",
  "api_key": "YOUR_API_KEY",
  "model": "gpt-4o"
}`} />
          </Section>

          <Section id='chat-completions' title='Chat Completions'>
            <p style={{ fontSize: '14px', color: 'var(--mr-text-secondary)', marginBottom: '8px' }}>
              {t('标准聊天接口，完全兼容 OpenAI')}{' '}
              <code style={{ background: 'var(--mr-bg-surface-2)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>
                chat/completions
              </code>{' '}
              {t('格式：')}
            </p>
            <CodeBlock lang='bash' code={`curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'`} />
          </Section>

          <Section id='streaming' title={t('流式输出')}>
            <p style={{ fontSize: '14px', color: 'var(--mr-text-secondary)', marginBottom: '8px' }}>
              {t('添加')}{' '}
              <code style={{ background: 'var(--mr-bg-surface-2)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>
                stream: true
              </code>{' '}
              {t('开启流式响应：')}
            </p>
            <CodeBlock lang='bash' code={`curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "stream": true,
    "messages": [
      {"role": "user", "content": "Write a short poem"}
    ]
  }'`} />
          </Section>

          <Section id='models' title={t('查询可用模型')}>
            <CodeBlock lang='bash' code={`curl ${baseUrl}/v1/models \\
  -H "Authorization: Bearer YOUR_API_KEY"`} />
          </Section>

          <Section id='python-sdk' title='Python SDK'>
            <CodeBlock lang='python' code={`from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}/v1",
    api_key="YOUR_API_KEY",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
print(response.choices[0].message.content)`} />
          </Section>

          <Section id='ai-tools' title={t('给 AI 工具配置')}>
            <p style={{ fontSize: '14px', color: 'var(--mr-text-secondary)', marginBottom: '12px' }}>
              {t('以下是常见 AI 编程工具的配置方式：')}
            </p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--mr-text-primary)', marginBottom: '6px' }}>
              Cursor
            </p>
            <CodeBlock code={`Settings → Models → OpenAI API Key → ${t('填入')} YOUR_API_KEY
OpenAI Base URL → ${baseUrl}/v1`} />
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--mr-text-primary)', marginBottom: '6px', marginTop: '16px' }}>
              Claude Code / Cline
            </p>
            <CodeBlock lang='json' code={`{
  "apiProvider": "openai",
  "openAiBaseUrl": "${baseUrl}/v1",
  "openAiApiKey": "YOUR_API_KEY"
}`} />
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--mr-text-primary)', marginBottom: '6px', marginTop: '16px' }}>
              OpenAI Node.js SDK
            </p>
            <CodeBlock lang='javascript' code={`import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: '${baseUrl}/v1',
  apiKey: 'YOUR_API_KEY',
});`} />
          </Section>

          <div style={{
            padding: '20px',
            background: 'var(--mr-bg-surface-2)',
            borderRadius: '14px',
            fontSize: '13px',
            color: 'var(--mr-text-secondary)',
          }}>
            {t('如有问题，可在控制台提交工单或联系管理员。')}
          </div>
        </main>

        <aside
          style={{
            position: 'sticky',
            top: 80,
            alignSelf: 'start',
            display: 'block',
          }}
          className='hidden lg:block'
        >
          {containerRef.current && (
            <Anchor
              autoCollapse
              targetOffset={76}
              showTooltip={false}
              scrollMotion={false}
              maxHeight={'calc(100dvh - 140px)'}
              style={{ width: 200 }}
              container={() => containerRef.current}
            >
              <Anchor.Link href='#base-url' title={t('Base URL')} />
              <Anchor.Link href='#auth' title={t('认证')} />
              <Anchor.Link href='#quick-start' title={t('快速开始')} />
              <Anchor.Link href='#chat-completions' title='Chat Completions' />
              <Anchor.Link href='#streaming' title={t('流式输出')} />
              <Anchor.Link href='#models' title={t('查询可用模型')} />
              <Anchor.Link href='#python-sdk' title='Python SDK' />
              <Anchor.Link href='#ai-tools' title={t('给 AI 工具配置')} />
            </Anchor>
          )}
        </aside>
      </div>
    </div>
  );
};

export default DocsPage;
