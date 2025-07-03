import React from 'react';
import { useTranslation } from 'react-i18next';
import IconEnglish from '../../assets/icon-english.svg';
import IconChinese from '../../assets/icon-chinese.svg';
import i18n from '../../i18n/config';

export const LanguageSwitcher: React.FC = () => {
  const { i18n: i18nHook } = useTranslation();

  const handleLanguageChange = () => {
    const nextLang = i18nHook.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('preferredLanguage', nextLang);

    // 触发编辑器重新渲染所有节点
    const playground = document.querySelector('.playground');
    if (playground) {
      // 触发playground的重新渲染
      playground.dispatchEvent(new Event('forceUpdate', { bubbles: true }));
      
      // 触发所有节点的重新渲染
      const nodes = playground.querySelectorAll('.node-wrapper');
      nodes.forEach(node => {
        node.dispatchEvent(new Event('forceUpdate', { bubbles: true }));
      });
    }
  };

  return (
    <div className="language-switcher-floating" onClick={handleLanguageChange}>
      <img 
        src={i18nHook.language === 'en' ? IconEnglish : IconChinese} 
        style={{ width: '24px', height: '24px', cursor: 'pointer' }}
      />
    </div>
  );
}; 