import { FarmerDetails, UAI } from '../types';
import { format } from 'date-fns';
import i18n from 'i18next';

// Document types (same as in documentGenerator.ts)
export enum DocumentType {
  POLICY = 'policy',
  RECEIPT = 'receipt',
  CLAIM = 'claim'
}

// Document metadata interface (same as in documentGenerator.ts)
export interface DocumentMetadata {
  id: string;
  type: DocumentType;
  farmerId: string;
  farmerName: string;
  nationalId: string;
  createdAt: string;
  filePath: string;
  qrCodeData: string;
  additionalData?: any;
}

// Mock document data for web demo
const MOCK_DOCUMENTS: DocumentMetadata[] = [
  {
    id: 'policy-123456',
    type: DocumentType.POLICY,
    farmerId: 'farmer-001',
    farmerName: 'John Doe',
    nationalId: '12345678',
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    filePath: 'web-mock-path/policy-123456.pdf',
    qrCodeData: JSON.stringify({
      id: 'policy-123456',
      type: 'policy',
      farmerId: 'farmer-001',
      verified: true
    })
  },
  {
    id: 'receipt-789012',
    type: DocumentType.RECEIPT,
    farmerId: 'farmer-001',
    farmerName: 'John Doe',
    nationalId: '12345678',
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    filePath: 'web-mock-path/receipt-789012.pdf',
    qrCodeData: JSON.stringify({
      id: 'receipt-789012',
      type: 'receipt',
      farmerId: 'farmer-001',
      verified: true
    })
  },
  {
    id: 'claim-345678',
    type: DocumentType.CLAIM,
    farmerId: 'farmer-002',
    farmerName: 'Jane Smith',
    nationalId: '87654321',
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    filePath: 'web-mock-path/claim-345678.pdf',
    qrCodeData: JSON.stringify({
      id: 'claim-345678',
      type: 'claim',
      farmerId: 'farmer-002',
      verified: true
    })
  }
];

// Local translation helper function
const getTranslation = (language: string) => {
  return (key: string, defaultValue?: string) => {
    // Handle the case where defaultValue is undefined
    if (defaultValue === undefined) {
      return i18n.getFixedT(language)(key);
    }
    return i18n.getFixedT(language)(key, { defaultValue });
  };
};

// Web-compatible mock implementations of document generator functions
export const generatePolicyDocument = async (
  farmer: FarmerDetails,
  uai: UAI,
  paymentId: string,
  premium: number,
  language = 'en'
): Promise<DocumentMetadata> => {
  console.log('Web mock: generatePolicyDocument called');
  return MOCK_DOCUMENTS[0];
};

export const generatePaymentReceipt = async (
  farmer: FarmerDetails,
  paymentId: string,
  amount: number,
  transactionId: string,
  language = 'en'
): Promise<DocumentMetadata> => {
  console.log('Web mock: generatePaymentReceipt called');
  return MOCK_DOCUMENTS[1];
};

export const generateClaimDocument = async (
  farmer: FarmerDetails,
  claimId: string,
  claimDetails: any,
  language = 'en'
): Promise<DocumentMetadata> => {
  console.log('Web mock: generateClaimDocument called');
  return MOCK_DOCUMENTS[2];
};

export const shareDocument = async (
  documentPath: string,
  title: string
): Promise<any> => {
  console.log('Web mock: shareDocument called', { documentPath, title });
  alert('Document sharing is not available in the web version');
  return { success: false, message: 'Not available in web version' };
};

export const getAllDocuments = async (): Promise<DocumentMetadata[]> => {
  console.log('Web mock: getAllDocuments called');
  return MOCK_DOCUMENTS;
};

export const getDocumentsForFarmer = async (
  farmerId: string
): Promise<DocumentMetadata[]> => {
  console.log('Web mock: getDocumentsForFarmer called', { farmerId });
  return MOCK_DOCUMENTS.filter(doc => doc.farmerId === farmerId);
};

export const getDocumentsByType = async (
  type: DocumentType
): Promise<DocumentMetadata[]> => {
  console.log('Web mock: getDocumentsByType called', { type });
  return MOCK_DOCUMENTS.filter(doc => doc.type === type);
};

export const deleteDocument = async (
  documentId: string
): Promise<boolean> => {
  console.log('Web mock: deleteDocument called', { documentId });
  return true;
};

export default {
  generatePolicyDocument,
  generatePaymentReceipt,
  generateClaimDocument,
  shareDocument,
  getAllDocuments,
  getDocumentsForFarmer,
  getDocumentsByType,
  deleteDocument,
  DocumentType
};
