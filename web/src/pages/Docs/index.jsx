import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSystemName } from '../../helpers/utils';

const CodeBlock = ({ code, lang = '' }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ position: 'relative', margin: '12px 0' }}>
      <pre style={{
        background: '#f5f5f7',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '16px',
        fontSize: '13px',
        fontFamily: "'JetBrains Mono', 'Menlo', monospace",
        overflowX: 'auto',
        color: '#1d1d1f',
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
          border: '1px solid #d2d2d7',
          background: '#fff',
          fontSize: '11px',
          cursor: 'pointer',
          color: '#6e6e73',
        }}
      >
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '40px' }}>
    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1f', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
      {title}
    </h2>
    {children}
  </div>
);

const DocsPage = () => {
  const { t } = useTranslation();
  const systemName = getSystemName() || 'Market Router';
  const baseUrl = window.location.origin;

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f', marginBottom: '8px' }}>
          API 文档
        </h1>
        <p style={{ fontSize: '15px', color: '#6e6e73', lineHeight: 1.6 }}>
          {systemName} 提供兼容 OpenAI 格式的 API 接口，接入即可调用 40+ 个 AI 模型提供商。
        </p>
      </div>

      <Section title="Base URL">
        <p style={{ fontSize: '14px', color: '#6e6e73', marginBottom: '8px' }}>
          所有 API 请求均发送到以下地址：
        </p>
        <CodeBlock code={`${baseUrl}/v1`} />
      </Section>

      <Section title="认证">
        <p style={{ fontSize: '14px', color: '#6e6e73', marginBottom: '8px' }}>
          在请求头中携带你的 API Key，格式与 OpenAI 完全一致：
        </p>
        <CodeBlock code={`Authorization: Bearer YOUR_API_KEY`} />
        <p style={{ fontSize: '13px', color: '#86868b', marginTop: '8px' }}>
          在控制台 → API 页面创建和管理你的 API Key。
        </p>
      </Section>

      <Section title="快速开始">
        <p style={{ fontSize: '14px', color: '#6e6e73', marginBottom: '8px' }}>
          向任何支持 OpenAI 接口的 AI 工具（Cursor、Cline、Claude Code、Continue 等）传入以下参数：
        </p>
        <CodeBlock lang="json" code={`{
  "base_url": "${baseUrl}/v1",
  "api_key": "YOUR_API_KEY",
  "model": "gpt-4o"   // 或其他支持的模型
}`} />
      </Section>

      <Section title="Chat Completions">
        <p style={{ fontSize: '14px', color: '#6e6e73', marginBottom: '8px' }}>
          标准聊天接口，完全兼容 OpenAI <code style={{ background: '#f5f5f7', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>chat/completions</code> 格式：
        </p>
        <CodeBlock lang="bash" code={`curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "你好"}
    ]
  }'`} />
      </Section>

      <Section title="流式输出">
        <p style={{ fontSize: '14px', color: '#6e6e73', marginBottom: '8px' }}>
          添加 <code style={{ background: '#f5f5f7', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>stream: true</code> 开启流式响应：
        </p>
        <CodeBlock lang="bash" code={`curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "stream": true,
    "messages": [
      {"role": "user", "content": "写一首短诗"}
    ]
  }'`} />
      </Section>

      <Section title="查询可用模型">
        <CodeBlock lang="bash" code={`curl ${baseUrl}/v1/models \\
  -H "Authorization: Bearer YOUR_API_KEY"`} />
      </Section>

      <Section title="Python SDK">
        <CodeBlock lang="python" code={`from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}/v1",
    api_key="YOUR_API_KEY",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "你好"}],
)
print(response.choices[0].message.content)`} />
      </Section>

      <Section title="给 AI 工具配置">
        <p style={{ fontSize: '14px', color: '#6e6e73', marginBottom: '12px' }}>
          以下是常见 AI 编程工具的配置方式：
        </p>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#1d1d1f', marginBottom: '6px' }}>Cursor</p>
        <CodeBlock code={`Settings → Models → OpenAI API Key → 填入 YOUR_API_KEY
OpenAI Base URL → ${baseUrl}/v1`} />
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#1d1d1f', marginBottom: '6px', marginTop: '16px' }}>Claude Code / Cline</p>
        <CodeBlock lang="json" code={`{
  "apiProvider": "openai",
  "openAiBaseUrl": "${baseUrl}/v1",
  "openAiApiKey": "YOUR_API_KEY"
}`} />
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#1d1d1f', marginBottom: '6px', marginTop: '16px' }}>OpenAI Node.js SDK</p>
        <CodeBlock lang="javascript" code={`import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: '${baseUrl}/v1',
  apiKey: 'YOUR_API_KEY',
});`} />
      </Section>

      <div style={{ padding: '20px', background: '#f5f5f7', borderRadius: '14px', fontSize: '13px', color: '#6e6e73' }}>
        如有问题，可在控制台提交工单或联系管理员。
      </div>
    </div>
  );
};

export default DocsPage;
