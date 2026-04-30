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
import GameOfLifeBackground from './GameOfLifeBackground';
import SectionHeader from './SectionHeader';
import ScenarioCard from './ScenarioCard';
import TerminalBlock from './TerminalBlock';
import CountUp from './CountUp';
import { SiAlipay, SiWechat, SiStripe, SiBitcoin, SiTether } from 'react-icons/si';
import { CreditCard, Zap, Globe } from 'lucide-react';
import {
  Moonshot, OpenAI, XAI, Zhipu, Volcengine, Cohere,
  Claude, Gemini, Suno, Minimax, Wenxin, Spark,
  Qingyan, DeepSeek, Qwen, Midjourney, Grok,
  AzureAI, Hunyuan, Xinference,
} from '@lobehub/icons';

const { Text } = Typography;
const ICON_CLS = 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center';

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
        <GameOfLifeBackground />
        <div className='relative z-10 flex flex-col items-center justify-center px-4 py-20 md:py-28 lg:py-32'>
            <span className='font-heading text-[10px] tracking-[0.3em] mb-8' style={{ color: 'var(--lr-fg-40)' }}>
              // market-router
            </span>
            <h1 className='font-heading text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-center leading-tight'>
              {t('landing_hero_line1')}<br />
              <span style={{ color: 'var(--lr-primary)' }}>{t('landing_hero_line2')}</span><br />
              {t('landing_hero_line3')}
            </h1>
            {/* Direct tagline for non-tech users */}
            <p className='font-heading text-sm md:text-base mt-6 text-center max-w-xl' style={{ color: 'var(--lr-fg-60, var(--lr-fg-40))' }}>
              {t('landing_hero_tagline')}
            </p>
            {/* Payment methods mini-strip in hero */}
            <div className='flex items-center gap-3 mt-4 opacity-60'>
              <SiStripe size={18} /><SiAlipay size={18} color='#1677FF' /><SiWechat size={18} color='#07C160' /><SiBitcoin size={18} color='#F7931A' /><SiTether size={18} color='#26A17B' />
              <span className='font-heading text-[10px] tracking-wider' style={{ color: 'var(--lr-fg-40)' }}>
                {t('landing_payment_card')} · {t('landing_payment_alipay')} · {t('landing_payment_wechat')} · Crypto
              </span>
            </div>
            <div className='flex flex-row gap-4 mt-8'>
              <Link to='/register'>
                <Button theme='solid' type='primary' size={isMobile ? 'default' : 'large'} className='!rounded-none px-8 py-2'>
                  {t('landing_cta_start')}
                </Button>
              </Link>
              <Link to='/pricing'>
                <Button size={isMobile ? 'default' : 'large'} className='!rounded-none px-8 py-2' style={{ borderColor: 'var(--lr-fg-10)', color: 'var(--lr-fg)' }}>
                  {t('landing_cta_pricing')}
                </Button>
              </Link>
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
            importLine={<><span style={{ color: 'var(--lr-primary)' }}>import</span>{' { providers } '}<span style={{ color: 'var(--lr-fg-40)' }}>from</span> <span style={{ color: 'var(--lr-primary)' }}>"./ecosystem"</span></>}
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
            importLine={<><span style={{ color: 'var(--lr-primary)' }}>import</span>{' { scenarios } '}<span style={{ color: 'var(--lr-fg-40)' }}>from</span> <span style={{ color: 'var(--lr-primary)' }}>"./market-router"</span></>}
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
            importLine={<><span style={{ color: 'var(--lr-primary)' }}>export</span>{' { features }'}</>}
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
            importLine={<><span style={{ color: 'var(--lr-primary)' }}>import</span>{' { pay } '}<span style={{ color: 'var(--lr-fg-40)' }}>from</span> <span style={{ color: 'var(--lr-primary)' }}>"./global-checkout"</span></>}
          />
          <div className='py-12 md:py-16 px-4 md:px-12'>
            <div className='max-w-4xl mx-auto'>
              <div className='text-center mb-10'>
                <h2 className='font-heading text-xl md:text-2xl font-light mb-2'>
                  {t('landing_payment_title')}
                </h2>
                <p className='font-heading text-sm' style={{ color: 'var(--lr-fg-40)' }}>
                  {t('landing_payment_subtitle')}
                </p>
              </div>
              {/* Payment method grid */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
                {[
                  {
                    icon: <div className='flex gap-1'><SiStripe size={20} /><CreditCard size={20} /></div>,
                    label: t('landing_payment_card'),
                    tags: ['Visa', 'MC', 'Amex'],
                    color: 'rgba(99,91,255,0.1)',
                    border: 'rgba(99,91,255,0.2)',
                  },
                  {
                    icon: <SiAlipay size={28} color='#1677FF' />,
                    label: t('landing_payment_alipay'),
                    tags: ['CNY', 'HKD'],
                    color: 'rgba(22,119,255,0.08)',
                    border: 'rgba(22,119,255,0.2)',
                  },
                  {
                    icon: <SiWechat size={28} color='#07C160' />,
                    label: t('landing_payment_wechat'),
                    tags: ['CNY'],
                    color: 'rgba(7,193,96,0.08)',
                    border: 'rgba(7,193,96,0.2)',
                  },
                  {
                    icon: <div className='flex gap-1'><SiBitcoin size={22} color='#F7931A' /><SiTether size={22} color='#26A17B' /></div>,
                    label: t('landing_payment_crypto'),
                    tags: ['BTC', 'ETH', 'USDC', 'USDT'],
                    color: 'rgba(247,147,26,0.08)',
                    border: 'rgba(247,147,26,0.2)',
                  },
                ].map((method, i) => (
                  <div
                    key={i}
                    className='flex flex-col items-center gap-2 p-4 rounded-xl text-center'
                    style={{ background: method.color, border: `1px solid ${method.border}` }}
                  >
                    <div className='flex items-center justify-center h-8'>{method.icon}</div>
                    <span className='font-heading text-xs font-light' style={{ color: 'var(--lr-fg)' }}>
                      {method.label}
                    </span>
                    <div className='flex flex-wrap gap-1 justify-center'>
                      {method.tags.map(tag => (
                        <span key={tag} className='font-heading text-[10px] px-1.5 py-0.5 rounded' style={{ background: 'var(--lr-fg-10)', color: 'var(--lr-fg-40)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Highlights */}
              <div className='flex flex-wrap justify-center gap-6'>
                {[
                  { icon: <Zap size={14} />, text: t('landing_payment_instant') },
                  { icon: <Globe size={14} />, text: t('landing_payment_nocache') },
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
            importLine={<><span style={{ color: 'var(--lr-primary)' }}>await</span>{' router.start()'}</>}
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
            <span style={{ color: 'var(--lr-primary)' }}>router</span>.start()
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
