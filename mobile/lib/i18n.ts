import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from '../locales/en.json';
import es from '../locales/es.json';

const i18n = new I18n({
  en,
  es,
});

i18n.defaultLocale = 'en';
i18n.locale = Localization.getLocales()[0]?.languageCode || 'en';
i18n.enableFallback = true;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

export const getCurrentLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem('language');
    if (savedLanguage && ['en', 'es'].includes(savedLanguage)) {
      return savedLanguage;
    }
    
    const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
    if (['en', 'es'].includes(deviceLanguage)) {
      return deviceLanguage;
    }
    
    return 'en';
  } catch (error) {
    console.error('Error getting language:', error);
    return 'en';
  }
};

export const setLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('language', language);
    i18n.locale = language;
  } catch (error) {
    console.error('Error setting language:', error);
  }
};

export const initializeI18n = async (): Promise<void> => {
  const language = await getCurrentLanguage();
  i18n.locale = language;
};

export default i18n;