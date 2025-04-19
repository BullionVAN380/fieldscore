import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Colors } from '../utils/colors';
import { getAllDocuments, DocumentMetadata } from '../utils/documentGenerator';

type RootStackParamList = {
  Documents: undefined;
  DocumentVerification: undefined;
};

type DocumentVerificationScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'DocumentVerification'
>;

const DocumentVerificationScreen: React.FC<DocumentVerificationScreenProps> = ({
  navigation
}) => {
  const { t } = useTranslation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    document?: DocumentMetadata;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Request camera permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Handle barcode scan
  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanning(false);
    
    try {
      // Parse the QR code data
      const parsedData = JSON.parse(data);
      setScannedData(parsedData);
      
      // Verify the document
      await verifyDocument(parsedData);
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      setVerificationResult({
        verified: false,
        message: t('documents.verification.invalidQR')
      });
    }
  };

  // Verify document against stored documents
  const verifyDocument = async (data: any) => {
    setLoading(true);
    
    try {
      // Get all documents
      const allDocuments = await getAllDocuments();
      
      // Find matching document
      let matchingDocument: DocumentMetadata | undefined;
      
      if (data.type === 'policy' && data.policyNumber) {
        matchingDocument = allDocuments.find(doc => doc.id === data.policyNumber);
      } else if (data.type === 'receipt' && data.receiptNumber) {
        matchingDocument = allDocuments.find(doc => doc.id === data.receiptNumber);
      } else if (data.type === 'claim' && data.claimNumber) {
        matchingDocument = allDocuments.find(doc => doc.id === data.claimNumber);
      }
      
      if (matchingDocument) {
        // Verify the document data matches the QR code data
        const qrData = JSON.parse(matchingDocument.qrCodeData);
        
        // Check if essential fields match
        const verified = 
          qrData.nationalId === data.nationalId &&
          qrData.name === data.name;
        
        setVerificationResult({
          verified,
          document: matchingDocument,
          message: verified
            ? t('documents.verification.verified')
            : t('documents.verification.dataMismatch')
        });
      } else {
        setVerificationResult({
          verified: false,
          message: t('documents.verification.notFound')
        });
      }
    } catch (error) {
      console.error('Error verifying document:', error);
      setVerificationResult({
        verified: false,
        message: t('documents.verification.error')
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset verification
  const resetVerification = () => {
    setScannedData(null);
    setVerificationResult(null);
  };

  // Render document details
  const renderDocumentDetails = () => {
    if (!scannedData) return null;
    
    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>
          {t(`documents.verification.${scannedData.type}Title`)}
        </Text>
        
        <View style={styles.detailsRow}>
          <Text style={styles.detailsLabel}>
            {t('documents.verification.documentId')}:
          </Text>
          <Text style={styles.detailsValue}>
            {scannedData.policyNumber || scannedData.receiptNumber || scannedData.claimNumber}
          </Text>
        </View>
        
        <View style={styles.detailsRow}>
          <Text style={styles.detailsLabel}>
            {t('farmerRegistration.name')}:
          </Text>
          <Text style={styles.detailsValue}>{scannedData.name}</Text>
        </View>
        
        <View style={styles.detailsRow}>
          <Text style={styles.detailsLabel}>
            {t('farmerRegistration.nationalId')}:
          </Text>
          <Text style={styles.detailsValue}>{scannedData.nationalId}</Text>
        </View>
        
        {scannedData.type === 'policy' && (
          <>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>
                {t('documents.issuedDate')}:
              </Text>
              <Text style={styles.detailsValue}>{scannedData.issuedDate}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>
                {t('documents.expiryDate')}:
              </Text>
              <Text style={styles.detailsValue}>{scannedData.expiryDate}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>
                {t('farmerRegistration.premium')}:
              </Text>
              <Text style={styles.detailsValue}>
                KES {Number(scannedData.premium).toLocaleString()}
              </Text>
            </View>
          </>
        )}
        
        {scannedData.type === 'receipt' && (
          <>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>
                {t('documents.date')}:
              </Text>
              <Text style={styles.detailsValue}>{scannedData.date}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>
                {t('documents.amount')}:
              </Text>
              <Text style={styles.detailsValue}>
                KES {Number(scannedData.amount).toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>
                {t('documents.transactionId')}:
              </Text>
              <Text style={styles.detailsValue}>{scannedData.transactionId}</Text>
            </View>
          </>
        )}
        
        {scannedData.type === 'claim' && (
          <>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>
                {t('documents.date')}:
              </Text>
              <Text style={styles.detailsValue}>{scannedData.date}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>
                {t('documents.claimReason')}:
              </Text>
              <Text style={styles.detailsValue}>{scannedData.reason}</Text>
            </View>
          </>
        )}
      </View>
    );
  };

  // Render verification result
  const renderVerificationResult = () => {
    if (!verificationResult) return null;
    
    return (
      <View
        style={[
          styles.verificationResult,
          verificationResult.verified
            ? styles.verificationSuccess
            : styles.verificationFailure
        ]}
      >
        <Text
          style={[
            styles.verificationResultText,
            verificationResult.verified
              ? styles.verificationSuccessText
              : styles.verificationFailureText
          ]}
        >
          {verificationResult.message}
        </Text>
      </View>
    );
  };

  // If permission not granted
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('common.requestingPermission')}</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            {t('documents.verification.cameraPermissionRequired')}
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.permissionButtonText}>{t('common.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('documents.verification.title')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {scanning ? (
          <View style={styles.scannerContainer}>
            <BarCodeScanner
              onBarCodeScanned={handleBarCodeScanned}
              style={styles.scanner}
            />
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerTarget} />
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setScanning(false)}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>
              {t('documents.verification.instructions')}
            </Text>
            <Text style={styles.instructionsText}>
              {t('documents.verification.scanInstructions')}
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>{t('documents.verification.verifying')}</Text>
              </View>
            ) : (
              <>
                {renderDocumentDetails()}
                {renderVerificationResult()}
                
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => {
                    resetVerification();
                    setScanning(true);
                  }}
                >
                  <Text style={styles.scanButtonText}>
                    {scannedData
                      ? t('documents.verification.scanAgain')
                      : t('documents.verification.startScan')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
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
    padding: 16,
    backgroundColor: Colors.primary,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  instructionsContainer: {
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  scanButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  scannerContainer: {
    height: 400,
    position: 'relative',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTarget: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: 16,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailsLabel: {
    width: 120,
    fontWeight: 'bold',
    color: Colors.text,
  },
  detailsValue: {
    flex: 1,
    color: Colors.text,
  },
  verificationResult: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  verificationSuccess: {
    backgroundColor: '#c8e6c9',
  },
  verificationFailure: {
    backgroundColor: '#ffcdd2',
  },
  verificationResultText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  verificationSuccessText: {
    color: '#2e7d32',
  },
  verificationFailureText: {
    color: '#c62828',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default DocumentVerificationScreen;
