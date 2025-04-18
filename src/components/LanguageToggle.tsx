import React, { useState, useEffect } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet,
  Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { setLanguagePreference } from '../i18n/i18n';
import { colors } from '../utils/colors';
import { getAccessibilityProps } from '../utils/accessibility';

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    // Update state when language changes
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const toggleLanguage = async () => {
    try {
      console.log('Language toggle pressed');
      console.log(`Current language before toggle: ${currentLanguage}`);
      
      // Simply toggle between English and Swahili
      const newLanguage = currentLanguage === 'en' ? 'sw' : 'en';
      console.log(`New language will be: ${newLanguage}`);
      
      // Direct approach - update i18n directly first
      const changeResult = await i18n.changeLanguage(newLanguage);
      console.log('Direct language change result:', changeResult);
      
      // Then update preferences for persistence
      await setLanguagePreference(newLanguage);
      
      // Update local state
      setCurrentLanguage(newLanguage);
      
      // Show alert for debugging
      Alert.alert(
        'Language Changed', 
        `Language has been changed to: ${newLanguage === 'en' ? 'English' : 'Swahili'}`,
        [{ text: 'OK' }]
      );
      
      console.log(`Language should now be: ${i18n.language}`);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Error', `Could not change language: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={toggleLanguage}
      {...getAccessibilityProps({
        label: `Change language. Current language: ${currentLanguage === 'en' ? 'English' : 'Swahili'}. Tap to switch to ${currentLanguage === 'en' ? 'Swahili' : 'English'}.`,
        role: 'button'
      })}
    >
      <Text style={styles.text}>
        {currentLanguage.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
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
  text: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  }
});

export default LanguageToggle;
