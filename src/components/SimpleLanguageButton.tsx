import React, { useState, useEffect } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { setLanguagePreference } from '../i18n/i18n';

const SimpleLanguageButton: React.FC = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    // Update state when language changes
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const toggleLanguage = async () => {
    try {
      // Toggle between English and Swahili
      const newLanguage = currentLanguage === 'en' ? 'sw' : 'en';
      
      // Update language
      await setLanguagePreference(newLanguage);
      
      // Force update local state even if i18n hasn't updated yet
      setCurrentLanguage(newLanguage);
      
      // On mobile, we may need to force a refresh
      if (Platform.OS !== 'web') {
        // Force a re-render by updating state
        setCurrentLanguage(prev => prev); // This triggers a re-render
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error changing language:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={toggleLanguage}>
      <Text style={styles.text}>{currentLanguage.toUpperCase()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    minWidth: 45,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  }
});

export default SimpleLanguageButton;
