import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text,
  SafeAreaView,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../utils/colors';
import { DocumentType } from '../utils/documentGenerator';

// Import platform-specific components
const DocumentViewer = Platform.OS === 'web' 
  ? require('../components/DocumentViewerWeb').default 
  : require('../components/DocumentViewer').default;

type RootStackParamList = {
  Documents: undefined;
  Home: undefined;
  FarmerRegistration: undefined;
  SyncManagement: undefined;
  DocumentVerification: undefined;
};

type DocumentsScreenProps = NativeStackScreenProps<RootStackParamList, 'Documents'>;

const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<DocumentType | 'all'>('all');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('documents.title')}</Text>
        <TouchableOpacity 
          style={styles.verifyButton}
          onPress={() => navigation.navigate('DocumentVerification')}
        >
          <Text style={styles.verifyButtonText}>{t('documents.verifyDocument')}</Text>
        </TouchableOpacity>
      </View>

      <DocumentViewer 
        documentType={activeTab !== 'all' ? activeTab : undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  verifyButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  verifyButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  }
});

export default DocumentsScreen;
