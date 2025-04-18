import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import enTranslation from '../i18n/locales/en.json';
import swTranslation from '../i18n/locales/sw.json';

// Define the context type
interface LanguageContextType {
  language: string;
  translations: Record<string, any>;
  changeLanguage: (lang: string) => Promise<void>;
  t: (key: string, options?: any) => string;
}

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  translations: enTranslation,
  changeLanguage: async () => {},
  t: () => '',
});

// Language storage key
const LANGUAGE_KEY = '@fieldscore_language_direct';

// Available translations
const translations = {
  en: enTranslation,
  sw: swTranslation,
};

// Provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [currentTranslations, setCurrentTranslations] = useState(translations.en);

  // Load saved language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'sw')) {
          setLanguage(savedLanguage);
          setCurrentTranslations(translations[savedLanguage]);
          console.log(`Loaded saved language: ${savedLanguage}`);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };

    loadLanguage();
  }, []);

  // Function to change language
  const changeLanguage = async (lang: string) => {
    try {
      if (lang !== 'en' && lang !== 'sw') {
        console.error(`Invalid language: ${lang}`);
        return;
      }

      console.log(`Changing language to: ${lang}`);
      
      // Save to storage
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      
      // Update state
      setLanguage(lang);
      setCurrentTranslations(translations[lang]);
      
      console.log(`Language changed successfully to: ${lang}`);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Translation function that handles nested keys
  const t = (key: string, options?: Record<string, any>): string => {
    try {
      // Split the key by dots to handle nested objects
      const keys = key.split('.');
      let value: any = currentTranslations;
      
      // Navigate through the nested objects
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key; // Return the key itself if not found
        }
      }
      
      // Handle string interpolation if options are provided
      if (typeof value === 'string' && options) {
        return Object.entries(options).reduce((str: string, entry: [string, any]) => {
          const [optionKey, optionValue] = entry;
          return str.replace(new RegExp(`{{${optionKey}}}`, 'g'), String(optionValue));
        }, value);
      }
      
      return typeof value === 'string' ? value : key;
    } catch (error) {
      console.error(`Error translating key: ${key}`, error);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, translations: currentTranslations, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
