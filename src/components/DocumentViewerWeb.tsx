import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Colors } from '../utils/colors';
import { useTranslation } from 'react-i18next';
import { DocumentType, DocumentMetadata, getAllDocuments, getDocumentsByType } from '../utils/documentGeneratorWeb';

interface DocumentViewerWebProps {
  documentType?: DocumentType;
}

/**
 * Web-compatible version of the DocumentViewer component
 * This displays mock documents for demonstration purposes
 */
const DocumentViewerWeb: React.FC<DocumentViewerWebProps> = ({ documentType }) => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<DocumentType | 'all'>('all');
  
  // Load documents based on filter
  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      try {
        let docs;
        if (documentType) {
          // If documentType is provided as a prop, use that
          docs = await getDocumentsByType(documentType);
          setSelectedFilter(documentType);
        } else if (selectedFilter !== 'all') {
          // Otherwise use the selected filter
          docs = await getDocumentsByType(selectedFilter);
        } else {
          // Or get all documents
          docs = await getAllDocuments();
        }
        setDocuments(docs);
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDocuments();
  }, [documentType, selectedFilter]);
  
  // Render a document item
  const renderDocumentItem = ({ item }: { item: DocumentMetadata }) => {
    const getDocumentIcon = () => {
      switch (item.type) {
        case DocumentType.POLICY:
          return '📜';
        case DocumentType.RECEIPT:
          return '🧾';
        case DocumentType.CLAIM:
          return '📝';
        default:
          return '📄';
      }
    };
    
    return (
      <View style={styles.documentItem}>
        <View style={styles.documentIcon}>
          <Text style={styles.documentIconText}>{getDocumentIcon()}</Text>
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle}>
            {item.type === DocumentType.POLICY ? t('documents.policy') || 'Policy' : 
             item.type === DocumentType.RECEIPT ? t('documents.receipt') || 'Receipt' : 
             t('documents.claim') || 'Claim'}
          </Text>
          <Text style={styles.documentId}>{item.id}</Text>
          <Text style={styles.documentDate}>{item.createdAt}</Text>
          <Text style={styles.documentFarmer}>{item.farmerName} - {item.nationalId}</Text>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
            {t('documents.all') || 'All'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === DocumentType.POLICY && styles.filterButtonActive]}
          onPress={() => setSelectedFilter(DocumentType.POLICY)}
        >
          <Text style={[styles.filterButtonText, selectedFilter === DocumentType.POLICY && styles.filterButtonTextActive]}>
            {t('documents.policies') || 'Policies'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === DocumentType.RECEIPT && styles.filterButtonActive]}
          onPress={() => setSelectedFilter(DocumentType.RECEIPT)}
        >
          <Text style={[styles.filterButtonText, selectedFilter === DocumentType.RECEIPT && styles.filterButtonTextActive]}>
            {t('documents.receipts') || 'Receipts'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === DocumentType.CLAIM && styles.filterButtonActive]}
          onPress={() => setSelectedFilter(DocumentType.CLAIM)}
        >
          <Text style={[styles.filterButtonText, selectedFilter === DocumentType.CLAIM && styles.filterButtonTextActive]}>
            {t('documents.claims') || 'Claims'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('documents.loading') || 'Loading documents...'}</Text>
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('documents.noDocuments') || 'No documents found'}</Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocumentItem}
          keyExtractor={item => item.id}
          style={styles.documentList}
          contentContainerStyle={styles.documentListContent}
        />
      )}
      
      <View style={styles.webNoticeContainer}>
        <Text style={styles.webNoticeText}>
          {t('documents.webNotice') || 'Note: This is a simplified web preview. The mobile app provides full document viewing and verification capabilities.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background as string,
    padding: 20,
  },
  // Filter styles
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: Colors.lightGray as string,
    borderRadius: 8,
    padding: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary as string,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.text as string,
  },
  filterButtonTextActive: {
    color: Colors.white as string,
    fontWeight: 'bold',
  },
  // Loading and empty states
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text as string,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight as string,
    textAlign: 'center',
  },
  // Document list
  documentList: {
    width: '100%',
    flex: 1,
  },
  documentListContent: {
    paddingVertical: 8,
  },
  documentItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white as string,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
  // Web notice
  webNoticeContainer: {
    backgroundColor: Colors.lightGray as string,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  webNoticeText: {
    fontSize: 14,
    color: Colors.textLight as string,
    textAlign: 'center',
  },
  // Original message styles (kept for reference)
  messageContainer: {
    backgroundColor: Colors.white as string,
    borderRadius: 8,
    padding: 20,
    maxWidth: 500,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary as string,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.text as string,
    marginBottom: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  featureList: {
    backgroundColor: Colors.lightGray as string,
    padding: 16,
    borderRadius: 8,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text as string,
    marginBottom: 12,
  },
  feature: {
    fontSize: 16,
    color: Colors.text as string,
    marginBottom: 8,
    lineHeight: 22,
  },
});

export default DocumentViewerWeb;
