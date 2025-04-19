import { Platform } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { FarmerDetails, UAI } from '../types';
import { format } from 'date-fns';
import i18n from 'i18next';

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

// Base directory for storing documents
const DOCUMENTS_DIR = `${RNFS.DocumentDirectoryPath}/fieldscore_documents`;

// Ensure the documents directory exists
const ensureDirectoryExists = async (): Promise<void> => {
  const exists = await RNFS.exists(DOCUMENTS_DIR);
  if (!exists) {
    await RNFS.mkdir(DOCUMENTS_DIR);
  }
};

// Document types
export enum DocumentType {
  POLICY = 'policy',
  RECEIPT = 'receipt',
  CLAIM = 'claim'
}

// Document metadata interface
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

/**
 * Generate a policy document for a farmer
 * @param farmer Farmer details
 * @param uai UAI details
 * @param paymentId Payment ID
 * @param premium Premium amount
 * @param language Language code (en, sw)
 * @returns Document metadata
 */
export const generatePolicyDocument = async (
  farmer: FarmerDetails,
  uai: UAI,
  paymentId: string,
  premium: number,
  language = 'en'
): Promise<DocumentMetadata> => {
  await ensureDirectoryExists();
  
  const t = getTranslation(language);
  const today = new Date();
  const formattedDate = format(today, 'yyyy-MM-dd');
  const policyNumber = `POL-${farmer.nationalId}-${format(today, 'yyyyMMdd')}`;
  const expiryDate = format(new Date(today.setFullYear(today.getFullYear() + 1)), 'yyyy-MM-dd');
  
  // QR code data for verification
  const qrCodeData = JSON.stringify({
    type: 'policy',
    policyNumber,
    farmerId: farmer.id,
    nationalId: farmer.nationalId,
    name: farmer.name,
    issuedDate: formattedDate,
    expiryDate,
    premium
  });
  
  // Generate HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${t('documents.policyTitle')}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            max-width: 150px;
            margin-bottom: 10px;
          }
          h1 {
            color: #2e7d32;
            margin-bottom: 5px;
          }
          .policy-number {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            width: 180px;
          }
          .info-value {
            flex: 1;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .qr-placeholder {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            border: 1px dashed #ccc;
          }
          .terms {
            font-size: 12px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fieldscore Agricultural Insurance</h1>
          <div class="policy-number">${t('documents.policyNumber')}: ${policyNumber}</div>
        </div>
        
        <div class="section">
          <div class="section-title">${t('documents.farmerDetails')}</div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.name')}:</div>
            <div class="info-value">${farmer.name}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.nationalId')}:</div>
            <div class="info-value">${farmer.nationalId}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.mobileNumber')}:</div>
            <div class="info-value">${farmer.mobileNumber}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.gender')}:</div>
            <div class="info-value">${farmer.gender}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">${t('documents.insuranceDetails')}</div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.county')}:</div>
            <div class="info-value">${farmer.county}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.ward')}:</div>
            <div class="info-value">${farmer.ward}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.crop')}:</div>
            <div class="info-value">${farmer.crop}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.acres')}:</div>
            <div class="info-value">${farmer.acres}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.uai')}:</div>
            <div class="info-value">${uai.id}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.premium')}:</div>
            <div class="info-value">KES ${premium.toLocaleString()}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">${t('documents.policyDetails')}</div>
          <div class="info-row">
            <div class="info-label">${t('documents.issuedDate')}:</div>
            <div class="info-value">${formattedDate}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('documents.expiryDate')}:</div>
            <div class="info-value">${expiryDate}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('documents.paymentReference')}:</div>
            <div class="info-value">${paymentId}</div>
          </div>
        </div>
        
        <div class="qr-placeholder">
          ${t('documents.scanQrVerify')}
        </div>
        
        <div class="terms">
          <p><strong>${t('documents.termsAndConditions')}:</strong></p>
          <ol>
            <li>${t('documents.term1')}</li>
            <li>${t('documents.term2')}</li>
            <li>${t('documents.term3')}</li>
            <li>${t('documents.term4')}</li>
          </ol>
        </div>
        
        <div class="footer">
          <p>${t('documents.contactInfo')}</p>
          <p>${t('documents.generatedOn')}: ${formattedDate}</p>
        </div>
      </body>
    </html>
  `;
  
  // Generate PDF
  const fileName = `policy_${farmer.nationalId}_${format(today, 'yyyyMMdd')}.pdf`;
  const filePath = `${DOCUMENTS_DIR}/${fileName}`;
  
  const options = {
    html: htmlContent,
    fileName,
    directory: 'Documents',
    base64: false
  };
  
  try {
    const pdf = await RNHTMLtoPDF.convert(options);
    
    // Move the file to our app's documents directory for better management
    if (pdf.filePath && pdf.filePath !== filePath) {
      await RNFS.moveFile(pdf.filePath, filePath);
    }
    
    // Create document metadata
    const metadata: DocumentMetadata = {
      id: policyNumber,
      type: DocumentType.POLICY,
      farmerId: farmer.id || '',
      farmerName: farmer.name,
      nationalId: farmer.nationalId,
      createdAt: formattedDate,
      filePath,
      qrCodeData,
      additionalData: {
        uaiId: uai.id,
        premium,
        acres: farmer.acres,
        crop: farmer.crop,
        expiryDate
      }
    };
    
    // Save metadata to storage
    await saveDocumentMetadata(metadata);
    
    return metadata;
  } catch (error) {
    console.error('Error generating policy document:', error);
    throw error;
  }
};

/**
 * Generate a payment receipt
 * @param farmer Farmer details
 * @param paymentId Payment ID
 * @param amount Payment amount
 * @param transactionId M-Pesa transaction ID
 * @param language Language code (en, sw)
 * @returns Document metadata
 */
export const generatePaymentReceipt = async (
  farmer: FarmerDetails,
  paymentId: string,
  amount: number,
  transactionId: string,
  language = 'en'
): Promise<DocumentMetadata> => {
  await ensureDirectoryExists();
  
  const t = getTranslation(language);
  const today = new Date();
  const formattedDate = format(today, 'yyyy-MM-dd HH:mm:ss');
  const receiptNumber = `REC-${transactionId.substring(0, 8)}`;
  
  // QR code data for verification
  const qrCodeData = JSON.stringify({
    type: 'receipt',
    receiptNumber,
    farmerId: farmer.id,
    nationalId: farmer.nationalId,
    name: farmer.name,
    amount,
    paymentId,
    transactionId,
    date: formattedDate
  });
  
  // Generate HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${t('documents.receiptTitle')}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            max-width: 150px;
            margin-bottom: 10px;
          }
          h1 {
            color: #2e7d32;
            margin-bottom: 5px;
          }
          .receipt-number {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            width: 180px;
          }
          .info-value {
            flex: 1;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            color: #2e7d32;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .qr-placeholder {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            border: 1px dashed #ccc;
          }
          .thank-you {
            text-align: center;
            margin-top: 30px;
            font-size: 16px;
            color: #2e7d32;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fieldscore Agricultural Insurance</h1>
          <div class="receipt-number">${t('documents.receiptNumber')}: ${receiptNumber}</div>
        </div>
        
        <div class="section">
          <div class="section-title">${t('documents.paymentDetails')}</div>
          <div class="info-row">
            <div class="info-label">${t('documents.date')}:</div>
            <div class="info-value">${formattedDate}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('documents.paymentMethod')}:</div>
            <div class="info-value">M-Pesa</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('documents.transactionId')}:</div>
            <div class="info-value">${transactionId}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('documents.paymentId')}:</div>
            <div class="info-value">${paymentId}</div>
          </div>
        </div>
        
        <div class="amount">
          KES ${amount.toLocaleString()}
        </div>
        
        <div class="section">
          <div class="section-title">${t('documents.farmerDetails')}</div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.name')}:</div>
            <div class="info-value">${farmer.name}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.nationalId')}:</div>
            <div class="info-value">${farmer.nationalId}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.mobileNumber')}:</div>
            <div class="info-value">${farmer.mobileNumber}</div>
          </div>
        </div>
        
        <div class="qr-placeholder">
          ${t('documents.scanQrVerify')}
        </div>
        
        <div class="thank-you">
          ${t('documents.thankYou')}
        </div>
        
        <div class="footer">
          <p>${t('documents.contactInfo')}</p>
          <p>${t('documents.generatedOn')}: ${formattedDate}</p>
        </div>
      </body>
    </html>
  `;
  
  // Generate PDF
  const fileName = `receipt_${transactionId}_${format(today, 'yyyyMMdd')}.pdf`;
  const filePath = `${DOCUMENTS_DIR}/${fileName}`;
  
  const options = {
    html: htmlContent,
    fileName,
    directory: 'Documents',
    base64: false
  };
  
  try {
    const pdf = await RNHTMLtoPDF.convert(options);
    
    // Move the file to our app's documents directory for better management
    if (pdf.filePath && pdf.filePath !== filePath) {
      await RNFS.moveFile(pdf.filePath, filePath);
    }
    
    // Create document metadata
    const metadata: DocumentMetadata = {
      id: receiptNumber,
      type: DocumentType.RECEIPT,
      farmerId: farmer.id || '',
      farmerName: farmer.name,
      nationalId: farmer.nationalId,
      createdAt: formattedDate,
      filePath,
      qrCodeData,
      additionalData: {
        amount,
        paymentId,
        transactionId
      }
    };
    
    // Save metadata to storage
    await saveDocumentMetadata(metadata);
    
    return metadata;
  } catch (error) {
    console.error('Error generating payment receipt:', error);
    throw error;
  }
};

/**
 * Generate a claim document
 * @param farmer Farmer details
 * @param claimId Claim ID
 * @param claimDetails Claim details
 * @param language Language code (en, sw)
 * @returns Document metadata
 */
export const generateClaimDocument = async (
  farmer: FarmerDetails,
  claimId: string,
  claimDetails: any,
  language = 'en'
): Promise<DocumentMetadata> => {
  await ensureDirectoryExists();
  
  const t = getTranslation(language);
  const today = new Date();
  const formattedDate = format(today, 'yyyy-MM-dd');
  const claimNumber = `CLM-${claimId.substring(0, 8)}`;
  
  // QR code data for verification
  const qrCodeData = JSON.stringify({
    type: 'claim',
    claimNumber,
    farmerId: farmer.id,
    nationalId: farmer.nationalId,
    name: farmer.name,
    claimId,
    date: formattedDate,
    reason: claimDetails.reason
  });
  
  // Generate HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${t('documents.claimTitle')}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            max-width: 150px;
            margin-bottom: 10px;
          }
          h1 {
            color: #2e7d32;
            margin-bottom: 5px;
          }
          .claim-number {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            width: 180px;
          }
          .info-value {
            flex: 1;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .qr-placeholder {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            border: 1px dashed #ccc;
          }
          .status {
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 5px;
          }
          .status-pending {
            background-color: #fff9c4;
            color: #fbc02d;
          }
          .status-approved {
            background-color: #c8e6c9;
            color: #2e7d32;
          }
          .status-rejected {
            background-color: #ffcdd2;
            color: #c62828;
          }
          .reason {
            margin-top: 20px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fieldscore Agricultural Insurance</h1>
          <div class="claim-number">${t('documents.claimNumber')}: ${claimNumber}</div>
        </div>
        
        <div class="section">
          <div class="section-title">${t('documents.claimDetails')}</div>
          <div class="info-row">
            <div class="info-label">${t('documents.date')}:</div>
            <div class="info-value">${formattedDate}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('documents.claimId')}:</div>
            <div class="info-value">${claimId}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('documents.claimType')}:</div>
            <div class="info-value">${claimDetails.type || t('documents.cropDamage')}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('documents.affectedArea')}:</div>
            <div class="info-value">${claimDetails.affectedArea || farmer.acres} ${t('farmerRegistration.acres')}</div>
          </div>
        </div>
        
        <div class="status status-${claimDetails.status || 'pending'}">
          ${t(`documents.status${(claimDetails.status || 'pending').charAt(0).toUpperCase() + (claimDetails.status || 'pending').slice(1)}`)}
        </div>
        
        <div class="section">
          <div class="section-title">${t('documents.farmerDetails')}</div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.name')}:</div>
            <div class="info-value">${farmer.name}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.nationalId')}:</div>
            <div class="info-value">${farmer.nationalId}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.mobileNumber')}:</div>
            <div class="info-value">${farmer.mobileNumber}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.county')}:</div>
            <div class="info-value">${farmer.county}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.ward')}:</div>
            <div class="info-value">${farmer.ward}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t('farmerRegistration.crop')}:</div>
            <div class="info-value">${farmer.crop}</div>
          </div>
        </div>
        
        <div class="reason">
          <div class="section-title">${t('documents.claimReason')}</div>
          <p>${claimDetails.reason || t('documents.noReasonProvided')}</p>
        </div>
        
        <div class="qr-placeholder">
          ${t('documents.scanQrVerify')}
        </div>
        
        <div class="footer">
          <p>${t('documents.contactInfo')}</p>
          <p>${t('documents.generatedOn')}: ${formattedDate}</p>
        </div>
      </body>
    </html>
  `;
  
  // Generate PDF
  const fileName = `claim_${claimId}_${format(today, 'yyyyMMdd')}.pdf`;
  const filePath = `${DOCUMENTS_DIR}/${fileName}`;
  
  const options = {
    html: htmlContent,
    fileName,
    directory: 'Documents',
    base64: false
  };
  
  try {
    const pdf = await RNHTMLtoPDF.convert(options);
    
    // Move the file to our app's documents directory for better management
    if (pdf.filePath && pdf.filePath !== filePath) {
      await RNFS.moveFile(pdf.filePath, filePath);
    }
    
    // Create document metadata
    const metadata: DocumentMetadata = {
      id: claimNumber,
      type: DocumentType.CLAIM,
      farmerId: farmer.id || '',
      farmerName: farmer.name,
      nationalId: farmer.nationalId,
      createdAt: formattedDate,
      filePath,
      qrCodeData,
      additionalData: {
        claimId,
        reason: claimDetails.reason,
        status: claimDetails.status || 'pending',
        type: claimDetails.type || 'cropDamage',
        affectedArea: claimDetails.affectedArea || farmer.acres
      }
    };
    
    // Save metadata to storage
    await saveDocumentMetadata(metadata);
    
    return metadata;
  } catch (error) {
    console.error('Error generating claim document:', error);
    throw error;
  }
};

/**
 * Share a document
 * @param documentPath Path to the document
 * @param title Title for the share dialog
 * @returns Result of the share operation
 */
export const shareDocument = async (documentPath: string, title: string): Promise<any> => {
  try {
    const shareOptions = {
      title,
      url: Platform.OS === 'android' ? `file://${documentPath}` : documentPath,
      type: 'application/pdf',
    };
    
    return await Share.open(shareOptions);
  } catch (error) {
    console.error('Error sharing document:', error);
    throw error;
  }
};

/**
 * Save document metadata to storage
 * @param metadata Document metadata
 */
const saveDocumentMetadata = async (metadata: DocumentMetadata): Promise<void> => {
  try {
    // Get existing metadata
    const existingMetadataString = await RNFS.exists(`${DOCUMENTS_DIR}/metadata.json`) 
      ? await RNFS.readFile(`${DOCUMENTS_DIR}/metadata.json`, 'utf8')
      : '[]';
    
    const existingMetadata: DocumentMetadata[] = JSON.parse(existingMetadataString);
    
    // Add new metadata
    existingMetadata.push(metadata);
    
    // Save updated metadata
    await RNFS.writeFile(
      `${DOCUMENTS_DIR}/metadata.json`,
      JSON.stringify(existingMetadata),
      'utf8'
    );
  } catch (error) {
    console.error('Error saving document metadata:', error);
    throw error;
  }
};

/**
 * Get all document metadata
 * @returns Array of document metadata
 */
export const getAllDocuments = async (): Promise<DocumentMetadata[]> => {
  try {
    await ensureDirectoryExists();
    
    // Check if metadata file exists
    const exists = await RNFS.exists(`${DOCUMENTS_DIR}/metadata.json`);
    if (!exists) {
      return [];
    }
    
    // Read metadata file
    const metadataString = await RNFS.readFile(`${DOCUMENTS_DIR}/metadata.json`, 'utf8');
    return JSON.parse(metadataString);
  } catch (error) {
    console.error('Error getting document metadata:', error);
    return [];
  }
};

/**
 * Get documents for a specific farmer
 * @param farmerId Farmer ID
 * @returns Array of document metadata
 */
export const getDocumentsForFarmer = async (farmerId: string): Promise<DocumentMetadata[]> => {
  try {
    const allDocuments = await getAllDocuments();
    return allDocuments.filter(doc => doc.farmerId === farmerId);
  } catch (error) {
    console.error('Error getting documents for farmer:', error);
    return [];
  }
};

/**
 * Get documents by type
 * @param type Document type
 * @returns Array of document metadata
 */
export const getDocumentsByType = async (type: DocumentType): Promise<DocumentMetadata[]> => {
  try {
    const allDocuments = await getAllDocuments();
    return allDocuments.filter(doc => doc.type === type);
  } catch (error) {
    console.error('Error getting documents by type:', error);
    return [];
  }
};

/**
 * Delete a document
 * @param documentId Document ID
 * @returns Success status
 */
export const deleteDocument = async (documentId: string): Promise<boolean> => {
  try {
    // Get all documents
    const allDocuments = await getAllDocuments();
    
    // Find the document to delete
    const documentIndex = allDocuments.findIndex(doc => doc.id === documentId);
    if (documentIndex === -1) {
      return false;
    }
    
    const document = allDocuments[documentIndex];
    
    // Delete the file
    if (await RNFS.exists(document.filePath)) {
      await RNFS.unlink(document.filePath);
    }
    
    // Remove from metadata
    allDocuments.splice(documentIndex, 1);
    
    // Save updated metadata
    await RNFS.writeFile(
      `${DOCUMENTS_DIR}/metadata.json`,
      JSON.stringify(allDocuments),
      'utf8'
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};
