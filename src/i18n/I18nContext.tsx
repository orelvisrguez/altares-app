import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from './dictionary';

type Language = 'es' | 'en';
type Translations = typeof translations.es;

interface I18nContextType {
  language: Language;
  t: (keyPath: string) => any;
  toggleLanguage: () => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en'); // Default to English as per request

  const t = (keyPath: string) => {
    return keyPath.split('.').reduce((obj: any, key: string) => obj && obj[key], translations[language]) || keyPath;
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'es' ? 'en' : 'es'));
  };

  return (
    <I18nContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
};
