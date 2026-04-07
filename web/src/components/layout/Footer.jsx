import React, { useEffect, useState, useMemo } from 'react';
import { Typography } from '@douyinfe/semi-ui';
import { getFooterHTML, getSystemName } from '../../helpers';

const FooterBar = () => {
  const [footer, setFooter] = useState(getFooterHTML());
  const systemName = getSystemName();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const html = localStorage.getItem('footer_html');
    if (html) setFooter(html);
  }, []);

  const defaultFooter = useMemo(
    () => (
      <footer className='py-6 px-6 md:px-24 w-full flex items-center justify-center border-t border-semi-color-border'>
        <div className='flex flex-col md:flex-row items-center justify-between w-full max-w-[1110px] gap-4'>
          <Typography.Text className='text-sm !text-semi-color-text-2'>
            © {currentYear} {systemName}
          </Typography.Text>
          <Typography.Text className='text-sm !text-semi-color-text-2'>
            Powered by SuperRouter
          </Typography.Text>
        </div>
      </footer>
    ),
    [systemName, currentYear],
  );

  if (footer) {
    return (
      <footer className='py-4 px-6 md:px-24 w-full flex items-center justify-center border-t border-semi-color-border'>
        <div className='flex flex-col md:flex-row items-center justify-between w-full max-w-[1110px] gap-4'>
          <div
            className='text-sm !text-semi-color-text-2'
            dangerouslySetInnerHTML={{ __html: footer }}
          />
          <Typography.Text className='text-sm !text-semi-color-text-2'>
            Powered by SuperRouter
          </Typography.Text>
        </div>
      </footer>
    );
  }

  return defaultFooter;
};

export default FooterBar;
