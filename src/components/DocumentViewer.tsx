import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Image
} from 'react-native';
import Pdf from 'react-native-pdf';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import { format, parseISO } from 'date-fns';
import RNFS from 'react-native-fs';
import {
  getAllDocuments,
  getDocumentsForFarmer,
  getDocumentsByType,
  shareDocument,
  deleteDocument,
  DocumentType,
  DocumentMetadata
} from '../utils/documentGenerator';
import { Colors } from '../utils/colors';

interface DocumentViewerProps {
  farmerId?: string; // Optional - if provided, only show documents for this farmer
  documentType?: DocumentType; // Optional - if provided, only show documents of this type
  onClose?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  farmerId,
  documentType,
  onClose
}) => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [filter, setFilter] = useState<DocumentType | 'all'>('all');
  const qrRef = React.useRef<ViewShot>(null);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [farmerId, documentType, filter]);

  // Load documents based on props
  const loadDocuments = async () => {
    setLoading(true);
    try {
      let docs: DocumentMetadata[] = [];
      
      if (farmerId) {
        docs = await getDocumentsForFarmer(farmerId);
      } else if (documentType) {
        docs = await getDocumentsByType(documentType);
      } else {
        docs = await getAllDocuments();
      }
      
      // Apply filter if needed
      if (filter !== 'all') {
        docs = docs.filter(doc => doc.type === filter);
      }
      
      // Sort by date (newest first)
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert(t('common.error'), t('documents.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Handle document selection
  const handleDocumentPress = (document: DocumentMetadata) => {
    setSelectedDocument(document);
    setViewerVisible(true);
  };

  // Share document
  const handleShareDocument = async (document: DocumentMetadata) => {
    try {
      await shareDocument(
        document.filePath,
        `${t('documents.share')} - ${document.farmerName}`
      );
    } catch (error) {
      console.error('Error sharing document:', error);
      Alert.alert(t('common.error'), t('documents.shareError'));
    }
  };

  // Delete document
  const handleDeleteDocument = async (document: DocumentMetadata) => {
    Alert.alert(
      t('documents.deleteConfirmTitle'),
      t('documents.deleteConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteDocument(document.id);
              if (success) {
                // Remove from local state
                setDocuments(documents.filter(doc => doc.id !== document.id));
                Alert.alert(t('common.success'), t('documents.deleteSuccess'));
              } else {
                Alert.alert(t('common.error'), t('documents.deleteError'));
              }
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert(t('common.error'), t('documents.deleteError'));
            }
          }
        }
      ]
    );
  };

  // Show QR code
  const handleShowQR = (document: DocumentMetadata) => {
    setSelectedDocument(document);
    setQrModalVisible(true);
  };

  // Save QR code as image
  const handleSaveQR = async () => {
    if (qrRef.current && selectedDocument) {
      try {
        // Add a null check and type assertion for capture method
        const capture = qrRef.current.capture as (() => Promise<string>) | undefined;
        if (!capture) {
          throw new Error('Capture method not available');
        }
        
        const uri = await capture();
        const fileName = `qr_${selectedDocument.id}.png`;
        const filePath = `${RNFS.DocumentDirectoryPath}/fieldscore_documents/${fileName}`;
        
        // If the file exists, delete it
        if (await RNFS.exists(filePath)) {
          await RNFS.unlink(filePath);
        }
        
        // Copy the file
        await RNFS.copyFile(uri, filePath);
        
        Alert.alert(
          t('common.success'),
          t('documents.qrSaveSuccess'),
          [
            {
              text: t('common.ok'),
              onPress: () => setQrModalVisible(false)
            }
          ]
        );
      } catch (error) {
        console.error('Error saving QR code:', error);
        Alert.alert(t('common.error'), t('documents.qrSaveError'));
      }
    }
  };

  // Render document item
  const renderDocumentItem = ({ item }: { item: DocumentMetadata }) => {
    const documentDate = parseISO(item.createdAt);
    const formattedDate = format(documentDate, 'dd/MM/yyyy HH:mm');
    
    let documentTitle = '';
    let documentIcon = '';
    
    switch (item.type) {
      case DocumentType.POLICY:
        documentTitle = t('documents.policyDocument');
        documentIcon = '📋';
        break;
      case DocumentType.RECEIPT:
        documentTitle = t('documents.receiptDocument');
        documentIcon = '🧾';
        break;
      case DocumentType.CLAIM:
        documentTitle = t('documents.claimDocument');
        documentIcon = '📝';
        break;
    }
    
    return (
      <TouchableOpacity
        style={styles.documentItem}
        onPress={() => handleDocumentPress(item)}
      >
        <View style={styles.documentIcon}>
          <Text style={styles.documentIconText}>{documentIcon}</Text>
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle}>{documentTitle}</Text>
          <Text style={styles.documentId}>{item.id}</Text>
          <Text style={styles.documentDate}>{formattedDate}</Text>
          <Text style={styles.documentFarmer}>{item.farmerName}</Text>
        </View>
        <View style={styles.documentActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShareDocument(item)}
          >
            <Text style={styles.actionButtonText}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShowQR(item)}
          >
            <Text style={styles.actionButtonText}>📱</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteDocument(item)}
          >
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render filter buttons
  const renderFilterButtons = () => {
    return (
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive
            ]}
          >
            {t('documents.all')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === DocumentType.POLICY && styles.filterButtonActive
          ]}
          onPress={() => setFilter(DocumentType.POLICY)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === DocumentType.POLICY && styles.filterButtonTextActive
            ]}
          >
            {t('documents.policies')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === DocumentType.RECEIPT && styles.filterButtonActive
          ]}
          onPress={() => setFilter(DocumentType.RECEIPT)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === DocumentType.RECEIPT && styles.filterButtonTextActive
            ]}
          >
            {t('documents.receipts')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === DocumentType.CLAIM && styles.filterButtonActive
          ]}
          onPress={() => setFilter(DocumentType.CLAIM)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === DocumentType.CLAIM && styles.filterButtonTextActive
            ]}
          >
            {t('documents.claims')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('documents.title')}</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {renderFilterButtons()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary as string} />
          <Text style={styles.loadingText}>{t('documents.loading')}</Text>
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('documents.noDocuments')}</Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocumentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.documentList}
        />
      )}
      
      {/* PDF Viewer Modal */}
      <Modal
        visible={viewerVisible}
        animationType="slide"
        onRequestClose={() => setViewerVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedDocument?.id || t('documents.viewDocument')}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setViewerVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {selectedDocument && (
            <Pdf
              source={{ uri: `file://${selectedDocument.filePath}`, cache: true }}
              style={styles.pdf}
              onLoadComplete={(numberOfPages, filePath) => {
                console.log(`PDF loaded: ${numberOfPages} pages`);
              }}
              onPageChanged={(page, numberOfPages) => {
                console.log(`Current page: ${page}`);
              }}
              onError={(error) => {
                console.error('PDF error:', error);
                Alert.alert(t('common.error'), t('documents.pdfError'));
              }}
            />
          )}
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => {
                if (selectedDocument) {
                  handleShareDocument(selectedDocument);
                }
              }}
            >
              <Text style={styles.modalActionButtonText}>{t('documents.share')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => {
                setViewerVisible(false);
                if (selectedDocument) {
                  handleShowQR(selectedDocument);
                }
              }}
            >
              <Text style={styles.modalActionButtonText}>{t('documents.showQR')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.qrModalContainer}>
          <View style={styles.qrModalContent}>
            <Text style={styles.qrModalTitle}>{t('documents.scanQrVerify')}</Text>
            
            <ViewShot ref={qrRef} style={styles.qrContainer}>
              {selectedDocument && (
                <QRCode
                  value={selectedDocument.qrCodeData}
                  size={200}
                  color={Colors.text as string}
                  backgroundColor={Colors.white as string}
                />
              )}
            </ViewShot>
            
            <Text style={styles.qrModalDescription}>
              {t('documents.qrDescription')}
            </Text>
            
            <View style={styles.qrModalActions}>
              <TouchableOpacity
                style={styles.qrModalActionButton}
                onPress={handleSaveQR}
              >
                <Text style={styles.qrModalActionButtonText}>{t('documents.saveQR')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.qrModalActionButton}
                onPress={() => setQrModalVisible(false)}
              >
                <Text style={styles.qrModalActionButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background as string,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.primary as string,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white as string,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.white as string,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: Colors.lightGray as string,
  },
  filterButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary as string,
  },
  filterButtonText: {
    fontSize: 12,
    color: Colors.text as string,
  },
  filterButtonTextActive: {
    color: Colors.white as string,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text as string,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight as string,
    textAlign: 'center',
  },
  documentList: {
    padding: 16,
  },
  documentItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white as string,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray as string,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  documentIconText: {
    fontSize: 20,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text as string,
    marginBottom: 4,
  },
  documentId: {
    fontSize: 14,
    color: Colors.primary as string,
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    color: Colors.textLight as string,
    marginBottom: 4,
  },
  documentFarmer: {
    fontSize: 14,
    color: Colors.text as string,
  },
  documentActions: {
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightGray as string,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background as string,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.primary as string,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white as string,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: Colors.white as string,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray as string,
  },
  modalActionButton: {
    flex: 1,
    backgroundColor: Colors.primary as string,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalActionButtonText: {
    color: Colors.white as string,
    fontWeight: 'bold',
  },
  qrModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalContent: {
    backgroundColor: Colors.white as string,
    borderRadius: 8,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text as string,
    marginBottom: 16,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: Colors.white as string,
    borderRadius: 8,
    marginBottom: 16,
  },
  qrModalDescription: {
    fontSize: 14,
    color: Colors.textLight as string,
    textAlign: 'center',
    marginBottom: 16,
  },
  qrModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  qrModalActionButton: {
    flex: 1,
    backgroundColor: Colors.primary as string,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  qrModalActionButtonText: {
    color: Colors.white as string,
    fontWeight: 'bold',
  },
});

export default DocumentViewer;
