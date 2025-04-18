import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import enTranslation from './locales/en.json';
import swTranslation from './locales/sw.json';

// Safe function to get device language that won't cause null reference errors
const getDeviceLanguage = (): string => {
  try {
    // Default to English
    const defaultLang = 'en';
    
    // Skip native module checks in development/testing environments
    if (__DEV__) {
      return defaultLang;
    }
    
    if (Platform.OS === 'ios') {
      // Safe access with optional chaining for iOS
      return (
        NativeModules?.SettingsManager?.settings?.AppleLocale ||
        NativeModules?.SettingsManager?.settings?.AppleLanguages?.[0] ||
        defaultLang
      );
    } else if (Platform.OS === 'android') {
      // Safe access with optional chaining for Android
      // Try multiple possible locations for the locale
      return (
        NativeModules?.I18nManager?.localeIdentifier ||
        NativeModules?.DeviceInfo?.locale ||
        NativeModules?.DeviceInfo?.getConstants?.()?.locale ||
        defaultLang
      );
    }
    
    return defaultLang;
  } catch (error) {
    console.warn('Error detecting device language:', error);
    return 'en';
  }
};

// Default language
const DEFAULT_LANGUAGE = getDeviceLanguage().split('-')[0] || 'en';

// Language storage key
const LANGUAGE_STORAGE_KEY = '@fieldscore_language';

// Function to get the stored language preference
const getStoredLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.warn('Error getting stored language:', error);
    return null;
  }
};

// Function to set the language preference
export const setLanguagePreference = async (language: string): Promise<void> => {
  try {
    // First save the preference
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    
    // Then change the language
    await i18n.changeLanguage(language);
    
    // Force immediate language change
    if (Platform.OS !== 'web') {
      // On mobile, we may need additional steps to ensure the change is applied
      setTimeout(() => {
        // This helps trigger UI updates on some React Native versions
        i18n.emit('languageChanged');
      }, 50);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error setting language preference:', error);
  }
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      sw: {
        translation: swTranslation
      }
    },
    lng: DEFAULT_LANGUAGE, // Default to English
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false, // Prevents issues with SSR and React Native
      bindI18n: 'languageChanged loaded', // React to language changes
    },
    compatibilityJSON: 'v4' as const, // Ensures compatibility with all React Native versions
    returnNull: false, // Return empty string instead of null for missing translations
  });

// Load stored language preference
getStoredLanguage().then(language => {
  if (language) {
    i18n.changeLanguage(language);
  }
});

export default i18n;
