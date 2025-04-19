import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../utils/colors';

type RootStackParamList = {
  Documents: undefined;
  DocumentVerification: undefined;
};

type DocumentVerificationScreenWebProps = NativeStackScreenProps<
  RootStackParamList,
  'DocumentVerification'
>;

/**
 * Web-compatible version of the DocumentVerificationScreen
 * This is a simplified version that shows a message about web limitations
 */
const DocumentVerificationScreenWeb: React.FC<DocumentVerificationScreenWebProps> = ({
  navigation
}) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <Text style={styles.title}>{t('verification.webLimitationsTitle') || 'QR Verification'}</Text>
          
          <View style={styles.imageContainer}>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>QR</Text>
            </View>
          </View>
          
          <Text style={styles.message}>
            {t('verification.webLimitationsMessage') || 
             'QR code verification requires camera access and is only available in the mobile app. Please use the Fieldscore mobile app to verify document authenticity.'}
          </Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>{t('common.goBack') || 'Go Back'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background as string,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    backgroundColor: Colors.white as string,
    borderRadius: 8,
    padding: 24,
    maxWidth: 500,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary as string,
    marginBottom: 24,
    textAlign: 'center',
  },
  imageContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    backgroundColor: Colors.lightGray as string,
    borderRadius: 8,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: Colors.lightGray as string,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.grey[300] as string,
    borderStyle: 'dashed',
  },
  qrPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.grey[500] as string,
  },
  message: {
    fontSize: 16,
    color: Colors.text as string,
    marginBottom: 24,
    lineHeight: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary as string,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.white as string,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DocumentVerificationScreenWeb;
