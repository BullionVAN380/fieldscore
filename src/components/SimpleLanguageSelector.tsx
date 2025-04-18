import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { setLanguagePreference } from '../i18n/i18n';
import { colors } from '../utils/colors';
import { getAccessibilityProps } from '../utils/accessibility';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' }
];

const SimpleLanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [showOptions, setShowOptions] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0]
  );

  useEffect(() => {
    // Update current language when i18n language changes
    const lang = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];
    setCurrentLanguage(lang);
  }, [i18n.language]);

  const handleLanguageChange = async (language: Language) => {
    try {
      // Use the language preference system
      await setLanguagePreference(language.code);
      setCurrentLanguage(language);
      setShowOptions(false);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Error', 'Could not change language');
    }
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.languageButton}
        onPress={toggleOptions}
        {...getAccessibilityProps({
          label: `Change language. Current language: ${currentLanguage.name}`,
          role: 'button'
        })}
      >
        <Text style={styles.languageButtonText}>{currentLanguage.code.toUpperCase()}</Text>
      </TouchableOpacity>

      {showOptions && (
        <View style={styles.optionsContainer}>
          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageOption,
                currentLanguage.code === language.code && styles.selectedLanguageOption
              ]}
              onPress={() => handleLanguageChange(language)}
              {...getAccessibilityProps({
                label: `${language.name}, ${language.nativeName}${currentLanguage.code === language.code ? ', selected' : ''}`,
                role: 'radio',
                state: { checked: currentLanguage.code === language.code }
              })}
            >
              <Text style={[
                styles.languageName,
                currentLanguage.code === language.code && styles.selectedLanguageText
              ]}>
                {language.name}
              </Text>
              {currentLanguage.code === language.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
    position: 'relative',
    zIndex: 1000,
  },
  languageButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    minWidth: 45,
  },
  languageButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  optionsContainer: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 5,
    backgroundColor: colors.white,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 150,
    zIndex: 1001,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  selectedLanguageOption: {
    backgroundColor: colors.lightPrimary,
  },
  languageName: {
    fontSize: 16,
    color: colors.text,
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  checkmark: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default SimpleLanguageSelector;
