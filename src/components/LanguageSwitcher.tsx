import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { languageApi } from '@/services/languageApi';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    // Set initial direction on component mount
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    
    // Update language on backend and set cookie
    await languageApi.updateLanguagePreference(newLang);
    
    // Change language in i18n
    i18n.changeLanguage(newLang);
    
    // Update document direction for RTL support
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 transition"
      title={i18n.language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
    >
      <Globe className="w-5 h-5 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">
        {i18n.language === 'en' ? 'العربية' : 'English'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
