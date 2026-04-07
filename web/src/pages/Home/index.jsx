import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Button, Typography } from '@douyinfe/semi-ui';
import { API, showError } from '../../helpers';
import { getServerAddress } from '../../helpers/token';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import { IconPlay } from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import {
  Moonshot, OpenAI, XAI, Zhipu, Volcengine, Cohere,
  Claude, Gemini, Suno, Minimax, Wenxin, Spark,
  Qingyan, DeepSeek, Qwen, Midjourney, Grok,
  AzureAI, Hunyuan, Xinference,
} from '@lobehub/icons';

const { Text } = Typography;

const ICON_CLS = 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center';

const PROVIDER_ICONS = [
  { key: 'openai', Icon: OpenAI },
  { key: 'claude', Icon: Claude, color: true },
  { key: 'gemini', Icon: Gemini, color: true },
  { key: 'deepseek', Icon: DeepSeek, color: true },
  { key: 'grok', Icon: Grok },
  { key: 'qwen', Icon: Qwen, color: true },
  { key: 'moonshot', Icon: Moonshot },
  { key: 'xai', Icon: XAI },
  { key: 'zhipu', Icon: Zhipu, color: true },
  { key: 'volcengine', Icon: Volcengine, color: true },
  { key: 'cohere', Icon: Cohere, color: true },
  { key: 'minimax', Icon: Minimax, color: true },
  { key: 'wenxin', Icon: Wenxin, color: true },
  { key: 'spark', Icon: Spark, color: true },
  { key: 'qingyan', Icon: Qingyan, color: true },
  { key: 'midjourney', Icon: Midjourney },
  { key: 'suno', Icon: Suno },
  { key: 'azure', Icon: AzureAI, color: true },
  { key: 'hunyuan', Icon: Hunyuan, color: true },
  { key: 'xinference', Icon: Xinference, color: true },
];

const SCENARIOS = [
  {
    key: 'agents',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="m2 14 4-4 4 4"/><path d="m14 14 4-4 4 4"/></svg>
    ),
  },
  {
    key: 'vibe_coding',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
    ),
  },
  {
    key: 'workflow',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M6 9v3a1 1 0 0 0 1 1h4"/><path d="M18 9v3a1 1 0 0 1-1 1h-4"/><path d="M12 13v2"/></svg>
    ),
  },
  {
    key: 'vibe_design',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
    ),
  },
  {
    key: 'enterprise',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
    ),
  },
  {
    key: 'developer',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7 11 2-2-2-2"/><path d="M11 13h4"/><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></svg>
    ),
  },
];

const ADVANTAGES = [
  { key: 'routing', icon: '⚡' },
  { key: 'cost', icon: '💰' },
  { key: 'reliability', icon: '🛡️' },
  { key: 'security', icon: '🔒' },
];

const STEPS = [
  { key: 'step1', num: '1' },
  { key: 'step2', num: '2' },
  { key: 'step3', num: '3' },
];

const Home = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
          };
        }
      }
    } else {
      showError(message);
    }
    setHomePageContentLoaded(true);
  };

  useEffect(() => {
    const checkNotice = async () => {
      const lastClose = localStorage.getItem('notice_close_date');
      if (lastClose === new Date().toDateString()) return;
      try {
        const res = await API.get('/api/notice');
        const { success, data } = res.data;
        if (success && data && data.trim() !== '') setNoticeVisible(true);
      } catch (_) { /* ignore */ }
    };
    checkNotice();
  }, []);

  useEffect(() => { displayHomePageContent(); }, []);

  const providerIcons = useMemo(() => (
    <div className='flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-5xl mx-auto px-4'>
      {PROVIDER_ICONS.map(({ key, Icon, color }) => (
        <div key={key} className={ICON_CLS}>
          {color ? <Icon.Color size={40} /> : <Icon size={40} />}
        </div>
      ))}
      <div className={ICON_CLS}>
        <Text className='!text-lg sm:!text-xl md:!text-2xl lg:!text-3xl font-bold'>40+</Text>
      </div>
    </div>
  ), []);

  if (!homePageContentLoaded) return null;

  if (homePageContent !== '') {
    return (
      <div className='w-full overflow-x-hidden'>
        <NoticeModal visible={noticeVisible} onClose={() => setNoticeVisible(false)} isMobile={isMobile} />
        {homePageContent.startsWith('https://') ? (
          <iframe src={homePageContent} className='w-full h-screen border-none' />
        ) : (
          <div className='mt-[60px]' dangerouslySetInnerHTML={{ __html: homePageContent }} />
        )}
      </div>
    );
  }

  return (
    <div className='w-full overflow-x-hidden'>
      <NoticeModal visible={noticeVisible} onClose={() => setNoticeVisible(false)} isMobile={isMobile} />

      {/* Hero Section */}
      <section className='w-full min-h-[560px] md:min-h-[640px] lg:min-h-[720px] relative overflow-hidden border-b border-semi-color-border'>
        <div className='blur-ball blur-ball-indigo' />
        <div className='blur-ball blur-ball-teal' />
        <div className='flex items-center justify-center h-full px-4 py-20 md:py-28 lg:py-36 mt-10'>
          <div className='flex flex-col items-center text-center max-w-4xl mx-auto'>
            <h1 className='text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-semi-color-text-0 leading-tight'>
              {t('landing_hero_title_1')}
              <br />
              <span className='shine-text'>{t('landing_hero_title_2')}</span>
            </h1>
            <p className='text-base md:text-lg lg:text-xl text-semi-color-text-1 mt-4 md:mt-6 max-w-2xl'>
              {t('landing_hero_subtitle')}
            </p>
            <div className='flex flex-row gap-4 mt-8 md:mt-10'>
              <Link to='/console'>
                <Button theme='solid' type='primary' size={isMobile ? 'default' : 'large'} className='!rounded-3xl px-8 py-2' icon={<IconPlay />}>
                  {t('landing_cta_start')}
                </Button>
              </Link>
              <Link to='/pricing'>
                <Button size={isMobile ? 'default' : 'large'} className='!rounded-3xl px-8 py-2'>
                  {t('landing_cta_pricing')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust - Provider Logos */}
      <section className='w-full py-12 md:py-16 lg:py-20 px-4'>
        <div className='max-w-5xl mx-auto text-center'>
          <Text type='tertiary' className='text-lg md:text-xl lg:text-2xl font-light'>
            {t('landing_providers_title')}
          </Text>
          <div className='mt-8 md:mt-10'>
            {providerIcons}
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className='w-full py-12 md:py-16 lg:py-20 px-4 bg-semi-color-fill-0'>
        <div className='max-w-6xl mx-auto'>
          <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-semi-color-text-0 text-center mb-4'>
            {t('landing_scenarios_title')}
          </h2>
          <p className='text-semi-color-text-1 text-center mb-10 md:mb-14 max-w-2xl mx-auto'>
            {t('landing_scenarios_subtitle')}
          </p>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'>
            {SCENARIOS.map(({ key, icon }) => (
              <div key={key} className='p-6 md:p-8 rounded-2xl bg-semi-color-bg-0 border border-semi-color-border hover:shadow-lg transition-shadow duration-200'>
                <div className='w-14 h-14 rounded-xl bg-semi-color-fill-0 flex items-center justify-center text-semi-color-primary mb-4'>
                  {icon}
                </div>
                <h3 className='text-lg md:text-xl font-semibold text-semi-color-text-0 mb-2'>
                  {t(`landing_scenario_${key}_title`)}
                </h3>
                <p className='text-semi-color-text-2 text-sm md:text-base leading-relaxed'>
                  {t(`landing_scenario_${key}_desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className='w-full py-12 md:py-16 lg:py-20 px-4'>
        <div className='max-w-6xl mx-auto'>
          <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-semi-color-text-0 text-center mb-10 md:mb-14'>
            {t('landing_advantages_title')}
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8'>
            {ADVANTAGES.map(({ key, icon }) => (
              <div key={key} className='text-center p-6'>
                <div className='text-4xl mb-4'>{icon}</div>
                <h3 className='text-lg font-semibold text-semi-color-text-0 mb-2'>
                  {t(`landing_advantage_${key}_title`)}
                </h3>
                <p className='text-semi-color-text-2 text-sm'>
                  {t(`landing_advantage_${key}_desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className='w-full py-12 md:py-16 lg:py-20 px-4 bg-semi-color-fill-0'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-semi-color-text-0 mb-10 md:mb-14'>
            {t('landing_quickstart_title')}
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {STEPS.map(({ key, num }) => (
              <div key={key} className='flex flex-col items-center'>
                <div className='w-12 h-12 rounded-full bg-semi-color-primary text-white flex items-center justify-center text-xl font-bold mb-4'>
                  {num}
                </div>
                <h3 className='text-lg font-semibold text-semi-color-text-0 mb-2'>
                  {t(`landing_${key}_title`)}
                </h3>
                <p className='text-semi-color-text-2 text-sm'>
                  {t(`landing_${key}_desc`)}
                </p>
              </div>
            ))}
          </div>
          <div className='mt-10'>
            <Link to='/register'>
              <Button theme='solid' type='primary' size='large' className='!rounded-3xl px-10 py-2'>
                {t('landing_cta_start')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
