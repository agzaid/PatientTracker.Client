import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { languageApi } from '@/services/languageApi';

// Import translation files
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

const resources = {
  en: {
    translation: enTranslations
  },
  ar: {
    translation: arTranslations
  }
};

// Custom detector for session storage
const sessionDetector = {
  name: 'sessionStorage',
  lookup: () => {
    return languageApi.getStoredLanguage();
  },
  cacheUserLanguage: (lng: string) => {
    languageApi.setLanguageSession(lng);
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['sessionStorage', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['sessionStorage', 'localStorage']
    }
  });

export default i18n;
