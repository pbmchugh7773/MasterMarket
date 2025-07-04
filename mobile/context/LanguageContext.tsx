import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n, { getCurrentLanguage, setLanguage as setI18nLanguage, initializeI18n } from '@/lib/i18n';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => Promise<void>;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initializeI18n();
      const currentLang = await getCurrentLanguage();
      setLanguageState(currentLang);
      setIsInitialized(true);
    };
    initialize();
  }, []);

  const setLanguage = async (newLanguage: string) => {
    await setI18nLanguage(newLanguage);
    setLanguageState(newLanguage);
  };

  const t = (key: string, options?: any): string => {
    return i18n.t(key, options);
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};