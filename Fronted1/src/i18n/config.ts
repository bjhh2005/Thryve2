import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation';
import zhTranslation from './locales/zh/translation';

// 获取用户之前设置的语言，如果没有则默认使用英语
const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';

// 创建一个函数来注入节点的翻译到现有的表单组件中
export const injectNodeTranslations = (nodeType: string, translations: any) => {
  const currentLang = i18n.language;
  const resources = i18n.getResourceBundle(currentLang, 'translation');
  
  i18n.addResourceBundle(
    currentLang,
    'translation',
    {
      ...resources,
      [nodeType]: translations
    },
    true,
    true
  );
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      zh: {
        translation: zhTranslation
      }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// 动态加载翻译文件的函数
export const loadTranslations = async (language: string) => {
  try {
    const translations = await import(`./locales/${language}/translation.ts`);
    i18n.addResourceBundle(language, 'translation', translations.default, true, true);
  } catch (error) {
    console.error(`Failed to load ${language} translations:`, error);
  }
};

// 初始加载默认语言的翻译
loadTranslations(savedLanguage);

export default i18n; 