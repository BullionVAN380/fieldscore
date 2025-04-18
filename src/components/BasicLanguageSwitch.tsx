import React, { useState, useEffect } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define a simple color palette
const colors = {
  primary: '#2E7D32',
  white: '#FFFFFF'
};

// Language storage key
const LANGUAGE_KEY = '@fieldscore_language_simple';

interface BasicLanguageSwitchProps {
  onLanguageChange?: (language: string) => void;
}

const BasicLanguageSwitch: React.FC<BasicLanguageSwitchProps> = ({ onLanguageChange }) => {
  const [language, setLanguage] = useState<string>('en');

  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
          setLanguage(savedLanguage);
          if (onLanguageChange) {
            onLanguageChange(savedLanguage);
          }
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadLanguage();
  }, [onLanguageChange]);

  const toggleLanguage = async () => {
    try {
      // Toggle between English and Swahili
      const newLanguage = language === 'en' ? 'sw' : 'en';
      
      // Save preference
      await AsyncStorage.setItem(LANGUAGE_KEY, newLanguage);
      
      // Update state
      setLanguage(newLanguage);
      
      // Notify parent component
      if (onLanguageChange) {
        onLanguageChange(newLanguage);
      }
      
      // Show confirmation
      Alert.alert(
        'Language Changed',
        `Language has been changed to ${newLanguage === 'en' ? 'English' : 'Swahili'}`
      );
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Error', 'Could not change language');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={toggleLanguage}>
      <Text style={styles.text}>{language.toUpperCase()}</Text>
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
    minWidth: 45,
  },
  text: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  }
});

export default BasicLanguageSwitch;
