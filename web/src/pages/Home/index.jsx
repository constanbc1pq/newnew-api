import React, { useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Button, Typography, Tag } from '@douyinfe/semi-ui';
import { API, showError } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import OrganicBackground from './OrganicBackground';
import SectionHeader from './SectionHeader';
import ScenarioCard from './ScenarioCard';
import TerminalBlock from './TerminalBlock';
import CountUp from './CountUp';
import {
  SiAlipay, SiWechat, SiStripe, SiBitcoin, SiTether,
  SiPaypal, SiGooglepay, SiApplepay, SiVisa, SiMastercard,
  SiAmericanexpress, SiEthereum,
} from 'react-icons/si';
import { CreditCard, Zap, Globe, Link as LinkIcon, Smartphone } from 'lucide-react';
import {
  Moonshot, OpenAI, XAI, Zhipu, Volcengine, Cohere,
  Claude, Gemini, Suno, Minimax, Wenxin, Spark,
  Qingyan, DeepSeek, Qwen, Midjourney, Grok,
  AzureAI, Hunyuan, Xinference,
} from '@lobehub/icons';

const { Text } = Typography;
const ICON_CLS = 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center';

// Reusable payment method card for the landing page
const PaymentCard = ({ icon, label, sub, color, border }) => (
  <div
    className='flex flex-col items-center gap-1.5 p-3 rounded-xl text-center'
    style={{ background: color, border: `1px solid ${border}` }}
  >
    <div className='flex items-center justify-center h-7'>{icon}</div>
    <span className='font-heading text-xs font-medium leading-tight' style={{ color: 'var(--lr-fg)' }}>
      {label}
    </span>
    <span className='font-heading text-[10px] leading-tight' style={{ color: 'var(--lr-fg-40)' }}>
      {sub}
    </span>
  </div>
);

const PROVIDERS = [
  { key: 'openai', I: OpenAI }, { key: 'claude', I: Claude, c: 1 },
  { key: 'gemini', I: Gemini, c: 1 }, { key: 'deepseek', I: DeepSeek, c: 1 },
  { key: 'grok', I: Grok }, { key: 'qwen', I: Qwen, c: 1 },
  { key: 'moonshot', I: Moonshot }, { key: 'xai', I: XAI },
  { key: 'zhipu', I: Zhipu, c: 1 }, { key: 'volcengine', I: Volcengine, c: 1 },
  { key: 'cohere', I: Cohere, c: 1 }, { key: 'minimax', I: Minimax, c: 1 },
  { key: 'wenxin', I: Wenxin, c: 1 }, { key: 'spark', I: Spark, c: 1 },
  { key: 'qingyan', I: Qingyan, c: 1 }, { key: 'midjourney', I: Midjourney },
  { key: 'suno', I: Suno }, { key: 'azure', I: AzureAI, c: 1 },
  { key: 'hunyuan', I: Hunyuan, c: 1 }, { key: 'xinference', I: Xinference, c: 1 },
];

const SCENARIOS = [
  { key: 'agents', tags: ['agent', 'langchain'], code: 'const agent = router.create({\n  model: "auto",\n  budget: "$10"\n})' },
  { key: 'vibe_coding', tags: ['ide', 'cursor'], code: '{\n  "base_url":\n  "https://api.marketrouter.ai/v1"\n}' },
  { key: 'workflow', tags: ['n8n', 'automation'], code: 'n8n.addNode("AI", {\n  provider: "market-router"\n})' },
  { key: 'vibe_design', tags: ['image', 'midjourney'], code: 'router.images.generate({\n  model: "dall-e-3",\n  prompt: "..."\n})' },
  { key: 'enterprise', tags: ['compliance', 'rbac'], code: 'router.config({\n  region: "asia",\n  audit: true\n})' },
  { key: 'developer', tags: ['openai-sdk', 'rest'], code: 'curl /v1/chat/completions \\\n  -H "Authorization: Bearer sk-..."' },
];

const ADVANTAGES = [
  { key: 'routing' }, { key: 'cost' }, { key: 'reliability' }, { key: 'security' },
];

const STATS = [
  { value: 40, suffix: '+', key: 'providers' },
  { value: 99.9, suffix: '%', key: 'uptime' },
  { value: 50, suffix: 'ms', key: 'latency', prefix: '<' },
  { value: 60, suffix: '%', key: 'savings' },
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = '' }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

const Home = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [loaded, setLoaded] = useState(false);
  const [content, setContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [activeScenario, setActiveScenario] = useState(0);
  const isMobile = useIsMobile();

  const loadContent = useCallback(async () => {
    setContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, data } = res.data;
    if (success) {
      const c = data.startsWith('https://') ? data : marked.parse(data);
      setContent(c);
      localStorage.setItem('home_page_content', c);
    }
    setLoaded(true);
  }, []);

  useEffect(() => { loadContent(); }, [loadContent]);

  useEffect(() => {
    document.documentElement.classList.add('landing-page');
    document.body.classList.add('landing-page');
    return () => {
      document.documentElement.classList.remove('landing-page');
      document.body.classList.remove('landing-page');
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScenario(prev => (prev + 1) % SCENARIOS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      if (localStorage.getItem('notice_close_date') === new Date().toDateString()) return;
      try {
        const res = await API.get('/api/notice');
        if (res.data.success && res.data.data?.trim()) setNoticeVisible(true);
      } catch (_) {}
    })();
  }, []);

  const providerIcons = useMemo(() => (
    <div className='flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-5xl mx-auto px-4'>
      {PROVIDERS.map(({ key, I, c }) => (
        <div key={key} className={ICON_CLS}>{c ? <I.Color size={40} /> : <I size={40} />}</div>
      ))}
      <div className={ICON_CLS}>
        <Text className='!text-lg sm:!text-xl md:!text-2xl lg:!text-3xl font-bold'>40+</Text>
      </div>
    </div>
  ), []);

  if (!loaded) return null;

  if (content) {
    return (
      <div className='w-full overflow-x-hidden'>
        <NoticeModal visible={noticeVisible} onClose={() => setNoticeVisible(false)} isMobile={isMobile} />
        {content.startsWith('https://') ? (
          <iframe src={content} className='w-full h-screen border-none' />
        ) : (
          <div className='mt-[60px]' dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
    );
  }

  return (
    <div className='landing w-full' style={{ background: 'var(--lr-bg)', color: 'var(--lr-fg)', overflowX: 'clip' }}>
      <NoticeModal visible={noticeVisible} onClose={() => setNoticeVisible(false)} isMobile={isMobile} />

      {/* ===== HERO ===== */}
      <section className='w-full relative border-b' style={{ borderColor: 'var(--lr-fg-10)', minHeight: 'min(600px, 70vh)' }}>
        <OrganicBackground />
        <div className='relative z-10 flex flex-col items-center justify-center px-4 py-20 md:py-28 lg:py-32'>
            {/* Eyebrow */}
            <span
              className='font-heading text-[10px] tracking-[0.35em] mb-10 uppercase'
              style={{ color: 'var(--lr-fg-40)' }}
            >
              Market Router
            </span>

            {/* Main headline — large, black, no color accent */}
            <h1
              style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                fontSize: 'clamp(2.6rem, 7vw, 5.5rem)',
                fontWeight: 300,
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                textAlign: 'center',
                color: 'var(--lr-fg)',
                maxWidth: 780,
              }}
            >
              {t('landing_hero_line1')}<br />
              {t('landing_hero_line2')}<br />
              <em style={{ fontStyle: 'italic' }}>{t('landing_hero_line3')}</em>
            </h1>

            {/* Sub-tagline */}
            <p
              className='text-sm md:text-base mt-8 text-center max-w-lg leading-relaxed'
              style={{ color: 'var(--lr-fg-40)', fontFamily: '"Inter", system-ui, sans-serif' }}
            >
              {t('landing_hero_tagline')}
            </p>

            {/* CTAs — black pill primary, ghost secondary */}
            <div className='flex flex-row items-center gap-3 mt-10'>
              <Link to='/register'>
                <button
                  style={{
                    background: 'var(--lr-fg)',
                    color: 'var(--lr-bg)',
                    border: 'none',
                    borderRadius: 9999,
                    padding: isMobile ? '10px 24px' : '12px 32px',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    letterSpacing: '0.01em',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {t('landing_cta_start')}
                </button>
              </Link>
              <Link to='/pricing'>
                <button
                  style={{
                    background: 'transparent',
                    color: 'var(--lr-fg)',
                    border: '1px solid var(--lr-fg-20)',
                    borderRadius: 9999,
                    padding: isMobile ? '10px 24px' : '12px 32px',
                    fontSize: 14,
                    fontWeight: 400,
                    cursor: 'pointer',
                    letterSpacing: '0.01em',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--lr-fg-60)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--lr-fg-20)'}
                >
                  {t('landing_cta_pricing')}
                </button>
              </Link>
            </div>

            {/* Payment pills — subtle, small */}
            <div className='flex flex-wrap items-center justify-center gap-2 mt-8'>
              {[
                { icon: <SiVisa size={14} />, label: 'Visa / MC' },
                { icon: <SiAlipay size={14} />, label: '支付宝' },
                { icon: <SiWechat size={14} />, label: '微信' },
                { icon: <SiBitcoin size={14} />, label: 'Crypto' },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className='flex items-center gap-1.5 font-heading text-[10px] tracking-wide px-3 py-1 rounded-full'
                  style={{ border: '1px solid var(--lr-fg-10)', color: 'var(--lr-fg-40)' }}
                >
                  {icon} {label}
                </span>
              ))}
            </div>
        </div>
        {/* Stats bar */}
        <div className='grid grid-cols-2 md:grid-cols-4 border-t' style={{ borderColor: 'var(--lr-fg-10)' }}>
          {STATS.map(({ value, suffix, key, prefix }, i) => (
            <div key={key} className='flex flex-col items-center py-4 border-r' style={{ borderColor: i < (isMobile ? 1 : 3) ? 'var(--lr-fg-10)' : 'transparent' }}>
              <span className='font-heading text-xl md:text-2xl font-light'>
                {prefix}<CountUp end={value} suffix={suffix} />
              </span>
              <span className='font-heading text-[9px] tracking-widest mt-1' style={{ color: 'var(--lr-fg-40)' }}>
                {t(`landing_stat_${key}`)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PROVIDERS ===== */}
      <Reveal>
        <section className='border-b' style={{ borderColor: 'var(--lr-fg-10)' }}>
          <SectionHeader
            number='01'
            slug='providers'
            importLine={<><span style={{ color: 'var(--lr-fg-60)' }}>import</span>{' { providers } '}<span style={{ color: 'var(--lr-fg-40)' }}>from</span> <span style={{ color: 'var(--lr-fg-60)' }}>"./ecosystem"</span></>}
          />
          <div className='py-12 md:py-16'>{providerIcons}</div>
        </section>
      </Reveal>

      {/* ===== SCENARIOS ===== */}
      <Reveal>
        <section className='border-b' style={{ borderColor: 'var(--lr-fg-10)' }}>
          <SectionHeader
            number='02'
            slug='use-cases'
            importLine={<><span style={{ color: 'var(--lr-fg-60)' }}>import</span>{' { scenarios } '}<span style={{ color: 'var(--lr-fg-40)' }}>from</span> <span style={{ color: 'var(--lr-fg-60)' }}>"./market-router"</span></>}
            actionLabel='scenarios.list()'
          />
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
            {SCENARIOS.map((s, i) => (
              <ScenarioCard key={i} index={i} title={t(`landing_scenario_${s.key}_title`)} tags={s.tags} savings={t(`landing_scenario_${s.key}_savings`)} code={s.code} active={activeScenario === i} />
            ))}
          </div>
        </section>
      </Reveal>

      {/* ===== ADVANTAGES ===== */}
      <Reveal>
        <section className='border-b' style={{ borderColor: 'var(--lr-fg-10)' }}>
          <SectionHeader
            number='03'
            slug='advantages'
            importLine={<><span style={{ color: 'var(--lr-fg-60)' }}>export</span>{' { features }'}</>}
          />
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
            {ADVANTAGES.map(({ key }, i) => (
              <div key={key} className='px-6 py-8 border-r border-b' style={{ borderColor: 'var(--lr-fg-10)' }}>
                <span className='font-heading text-[9px] tracking-widest' style={{ color: 'var(--lr-fg-20)' }}>
                  feature[{i}]
                </span>
                <h3 className='text-base font-light font-heading mt-3 mb-2'>
                  {t(`landing_advantage_${key}_title`)}
                </h3>
                <p className='text-sm leading-relaxed' style={{ color: 'var(--lr-fg-40)' }}>
                  {t(`landing_advantage_${key}_desc`)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ===== GLOBAL PAYMENT ===== */}
      <Reveal>
        <section className='border-b' style={{ borderColor: 'var(--lr-fg-10)' }}>
          <SectionHeader
            number='04'
            slug='payment'
            importLine={<><span style={{ color: 'var(--lr-fg-60)' }}>import</span>{' { pay } '}<span style={{ color: 'var(--lr-fg-40)' }}>from</span> <span style={{ color: 'var(--lr-fg-60)' }}>"./global-checkout"</span></>}
          />
          <div className='py-12 md:py-16 px-4 md:px-12'>
            <div className='max-w-5xl mx-auto'>

              <div className='text-center mb-10'>
                <h2 className='font-heading text-xl md:text-2xl font-light mb-2'>
                  {t('landing_payment_title')}
                </h2>
                <p className='font-heading text-sm' style={{ color: 'var(--lr-fg-40)' }}>
                  {t('landing_payment_subtitle')}
                </p>
              </div>

              {/* ── Row 1: Global cards & digital wallets ── */}
              <div className='mb-3'>
                <p className='font-heading text-[10px] uppercase tracking-widest mb-2' style={{ color: 'var(--lr-fg-30)' }}>
                  {t('landing_payment_group_cards', 'Cards & Digital Wallets')}
                </p>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  {[
                    {
                      icon: <div className='flex items-center gap-1.5'>
                        <SiVisa size={22} color='#1A1F71' />
                        <SiMastercard size={22} />
                        <SiAmericanexpress size={22} color='#007BC1' />
                      </div>,
                      label: 'Credit / Debit',
                      sub: 'Visa · MC · Amex · UnionPay',
                      color: 'rgba(99,91,255,0.07)',
                      border: 'rgba(99,91,255,0.18)',
                    },
                    {
                      icon: <div className='flex items-center gap-1.5'>
                        <SiApplepay size={28} />
                      </div>,
                      label: 'Apple Pay',
                      sub: 'One-tap on Apple devices',
                      color: 'rgba(0,0,0,0.05)',
                      border: 'rgba(0,0,0,0.12)',
                    },
                    {
                      icon: <SiGooglepay size={32} />,
                      label: 'Google Pay',
                      sub: 'One-tap on Android & Chrome',
                      color: 'rgba(66,133,244,0.07)',
                      border: 'rgba(66,133,244,0.18)',
                    },
                    {
                      icon: <div className='flex items-center gap-1.5'>
                        <LinkIcon size={18} style={{ color: '#635BFF' }} />
                        <SiStripe size={18} style={{ color: '#635BFF' }} />
                      </div>,
                      label: 'Stripe Link',
                      sub: 'One-click returning checkout',
                      color: 'rgba(99,91,255,0.07)',
                      border: 'rgba(99,91,255,0.18)',
                    },
                  ].map((m, i) => <PaymentCard key={i} {...m} />)}
                </div>
              </div>

              {/* ── Row 2: Chinese & Asian e-wallets ── */}
              <div className='mb-3'>
                <p className='font-heading text-[10px] uppercase tracking-widest mb-2' style={{ color: 'var(--lr-fg-30)' }}>
                  {t('landing_payment_group_asia', 'Asian E-Wallets')}
                </p>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  {[
                    {
                      icon: <SiAlipay size={26} color='#1677FF' />,
                      label: t('landing_payment_alipay'),
                      sub: 'CNY · HKD · Global',
                      color: 'rgba(22,119,255,0.07)',
                      border: 'rgba(22,119,255,0.18)',
                    },
                    {
                      icon: <SiWechat size={26} color='#07C160' />,
                      label: t('landing_payment_wechat'),
                      sub: 'CNY · WeChat users',
                      color: 'rgba(7,193,96,0.07)',
                      border: 'rgba(7,193,96,0.18)',
                    },
                    {
                      icon: <Smartphone size={22} style={{ color: '#FF6B00' }} />,
                      label: 'GrabPay',
                      sub: 'SE Asia',
                      color: 'rgba(255,107,0,0.07)',
                      border: 'rgba(255,107,0,0.18)',
                    },
                    {
                      icon: <Smartphone size={22} style={{ color: '#E2001A' }} />,
                      label: 'PromptPay · FPX · PayNow',
                      sub: 'TH · MY · SG',
                      color: 'rgba(226,0,26,0.07)',
                      border: 'rgba(226,0,26,0.18)',
                    },
                  ].map((m, i) => <PaymentCard key={i} {...m} />)}
                </div>
              </div>

              {/* ── Row 3: Crypto ── */}
              <div className='mb-8'>
                <p className='font-heading text-[10px] uppercase tracking-widest mb-2' style={{ color: 'var(--lr-fg-30)' }}>
                  {t('landing_payment_group_crypto', 'Cryptocurrency')}
                </p>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  {[
                    {
                      icon: <SiBitcoin size={26} color='#F7931A' />,
                      label: 'Bitcoin',
                      sub: 'BTC on-chain',
                      color: 'rgba(247,147,26,0.07)',
                      border: 'rgba(247,147,26,0.18)',
                    },
                    {
                      icon: <SiEthereum size={26} color='#627EEA' />,
                      label: 'Ethereum',
                      sub: 'ETH · USDC · DAI',
                      color: 'rgba(98,126,234,0.07)',
                      border: 'rgba(98,126,234,0.18)',
                    },
                    {
                      icon: <SiTether size={26} color='#26A17B' />,
                      label: 'Tether',
                      sub: 'USDT TRC-20 · ERC-20',
                      color: 'rgba(38,161,123,0.07)',
                      border: 'rgba(38,161,123,0.18)',
                    },
                    {
                      icon: <div className='font-mono text-xs font-bold' style={{ color: 'var(--lr-fg-50)' }}>300+</div>,
                      label: t('landing_payment_more_crypto', 'More Coins'),
                      sub: 'via NowPayments',
                      color: 'rgba(0,0,0,0.03)',
                      border: 'rgba(0,0,0,0.08)',
                    },
                  ].map((m, i) => <PaymentCard key={i} {...m} />)}
                </div>
              </div>

              {/* Highlights strip */}
              <div className='flex flex-wrap justify-center gap-6'>
                {[
                  { icon: <Zap size={13} />, text: t('landing_payment_instant') },
                  { icon: <Globe size={13} />, text: t('landing_payment_nocache') },
                  { icon: <CreditCard size={13} />, text: t('landing_payment_currencies', '40+ currencies') },
                  { icon: <LinkIcon size={13} />, text: t('landing_payment_newuser_promo', 'First $10 at 2× quota') },
                ].map(({ icon, text }, i) => (
                  <div key={i} className='flex items-center gap-2 font-heading text-xs' style={{ color: 'var(--lr-fg-40)' }}>
                    {icon}<span>{text}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>
      </Reveal>

      {/* ===== QUICK START ===== */}
      <Reveal>
        <section className='border-b' style={{ borderColor: 'var(--lr-fg-10)' }}>
          <SectionHeader
            number='05'
            slug='quickstart'
            importLine={<><span style={{ color: 'var(--lr-fg-60)' }}>await</span>{' router.start()'}</>}
          />
          <div className='py-12 md:py-16 px-4'>
            <TerminalBlock />
          </div>
        </section>
      </Reveal>

      {/* ===== CTA ===== */}
      <Reveal>
        <section className='py-20 md:py-28 text-center px-4'>
          <h2 className='font-heading text-2xl md:text-3xl font-light mb-8'>
            <span style={{ color: 'var(--lr-fg-60)' }}>router</span>.start()
          </h2>
          <Link to='/register'>
            <Button theme='solid' type='primary' size='large' className='!rounded-none px-10 py-3'>
              {t('landing_cta_start')}
            </Button>
          </Link>
        </section>
      </Reveal>
    </div>
  );
};

export default Home;
