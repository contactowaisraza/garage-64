import React, { createContext, useState, useEffect } from 'react';
import { translations } from '@/utils/translations';

export const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  };

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (path) => {
    const keys = path.split('.');
    let value = translations[language];
    for (const key of keys) {
      value = value?.[key];
    }
    return value || path;
  };

  // Translate any raw database value (status, category, tier, condition, etc.)
  // Falls back to the original value if no mapping exists.
  const td = (value) => {
    if (value === null || value === undefined) return value;
    return translations[language]?.values?.[value] ?? value;
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    td,
    isRTL: language === 'ar'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};