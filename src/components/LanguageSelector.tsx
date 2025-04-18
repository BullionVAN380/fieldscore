import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  FlatList,
  Animated,
  Easing,
  Alert
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

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0]
  );
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Update current language when i18n language changes
    const lang = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];
    setCurrentLanguage(lang);
  }, [i18n.language]);

  const handleLanguageChange = async (language: Language) => {
    try {
      // Use the new language preference system
      await setLanguagePreference(language.code);
      setCurrentLanguage(language);
      setModalVisible(false);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const openModal = () => {
    // Simple approach - just show the modal
    console.log('Opening language selector modal');
    try {
      setModalVisible(true);
      // Reset animation
      animation.setValue(0);
      
      // Start animation after a short delay
      setTimeout(() => {
        Animated.timing(animation, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }).start();
      }, 50);
    } catch (error) {
      console.error('Error opening modal:', error);
      Alert.alert('Error', 'Could not open language selector');
    }
  };

  const closeModal = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true
    }).start(() => {
      setModalVisible(false);
    });
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  });

  const renderLanguageItem = ({ item }: { item: Language }) => {
    const isSelected = currentLanguage.code === item.code;
    
    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.selectedLanguageItem]}
        onPress={() => handleLanguageChange(item)}
        {...getAccessibilityProps({
          label: `${item.name}, ${item.nativeName}${isSelected ? ', selected' : ''}`,
          role: 'radio',
          state: { checked: isSelected }
        })}
      >
        <Text style={[styles.languageName, isSelected && styles.selectedLanguageText]}>
          {item.name}
        </Text>
        <Text style={[styles.nativeName, isSelected && styles.selectedLanguageText]}>
          {item.nativeName}
        </Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.languageButton}
        onPress={openModal}
        {...getAccessibilityProps({
          label: `Change language. Current language: ${currentLanguage.name}`,
          role: 'button'
        })}
      >
        <Text style={styles.languageButtonText}>{currentLanguage.code.toUpperCase()}</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
          {...getAccessibilityProps({
            label: 'Close language selector',
            role: 'button'
          })}
        >
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY }] }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.closeButton}
                {...getAccessibilityProps({
                  label: 'Close',
                  role: 'button'
                })}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGES}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              style={styles.languageList}
              {...getAccessibilityProps({
                label: 'Language list',
                role: 'radiogroup'
              })}
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.darkGrey,
  },
  languageList: {
    flex: 1,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  selectedLanguageItem: {
    backgroundColor: colors.lightPrimary,
  },
  languageName: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  nativeName: {
    fontSize: 16,
    color: colors.darkGrey,
    flex: 1,
    textAlign: 'right',
    marginRight: 10,
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default LanguageSelector;
