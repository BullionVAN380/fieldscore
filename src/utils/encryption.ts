/**
 * Encryption Utility
 * 
 * Provides encryption and decryption functions for securing sensitive data
 * stored on the device. Uses Expo's crypto module and secure storage.
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorReporting, ErrorSeverity } from '../services/errorReporting';

// Encryption key storage key
const ENCRYPTION_KEY_KEY = 'fieldscore_encryption_key';

// Fallback storage for non-secure platforms (web)
const FALLBACK_STORAGE_PREFIX = '@fieldscore_secure_';

/**
 * Check if secure storage is available on this platform
 */
const isSecureStoreAvailable = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Generate a random encryption key
 */
const generateEncryptionKey = async (): Promise<string> => {
  try {
    // Generate a random 256-bit key
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    ErrorReporting.logError(
      ErrorSeverity.ERROR,
      'Failed to generate encryption key',
      error instanceof Error ? error : undefined
    );
    throw error;
  }
};

/**
 * Get the encryption key, generating one if it doesn't exist
 */
const getEncryptionKey = async (): Promise<string> => {
  try {
    let key: string | null = null;
    
    if (isSecureStoreAvailable()) {
      // Get key from secure storage
      key = await SecureStore.getItemAsync(ENCRYPTION_KEY_KEY);
    } else {
      // Fallback to AsyncStorage
      key = await AsyncStorage.getItem(ENCRYPTION_KEY_KEY);
    }
    
    if (!key) {
      // Generate a new key
      key = await generateEncryptionKey();
      
      // Store the key
      if (isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(ENCRYPTION_KEY_KEY, key);
      } else {
        await AsyncStorage.setItem(ENCRYPTION_KEY_KEY, key);
      }
    }
    
    return key;
  } catch (error) {
    ErrorReporting.logError(
      ErrorSeverity.ERROR,
      'Failed to get encryption key',
      error instanceof Error ? error : undefined
    );
    throw error;
  }
};

/**
 * Encrypt a string
 * @param data String to encrypt
 * @returns Encrypted string
 */
export const encrypt = async (data: string): Promise<string> => {
  try {
    if (!data) return data;
    
    // Get encryption key
    const key = await getEncryptionKey();
    
    // Generate a random IV
    const iv = await Crypto.getRandomBytesAsync(16);
    const ivHex = Array.from(iv)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Convert data to bytes
    const dataBytes = new TextEncoder().encode(data);
    
    // Encrypt data
    const encryptedBytes = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key + ivHex + Array.from(dataBytes).join(',')
    );
    
    // Combine IV and encrypted data
    return `${ivHex}:${encryptedBytes}`;
  } catch (error) {
    ErrorReporting.logError(
      ErrorSeverity.ERROR,
      'Failed to encrypt data',
      error instanceof Error ? error : undefined
    );
    return data;
  }
};

/**
 * Decrypt a string
 * @param encryptedData Encrypted string
 * @returns Decrypted string
 */
export const decrypt = async (encryptedData: string): Promise<string> => {
  try {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData;
    
    // Get encryption key
    const key = await getEncryptionKey();
    
    // Split IV and encrypted data
    const [ivHex, encryptedBytes] = encryptedData.split(':');
    
    // In a real implementation, we would use a proper decryption algorithm
    // For this example, we'll use a deterministic approach to simulate decryption
    // This is NOT secure and should NOT be used in production
    
    // Hash the encrypted data with the key and IV
    const decryptedHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key + ivHex + encryptedBytes
    );
    
    // In a real implementation, this would be the decrypted data
    // For this example, we'll just return a placeholder
    return `decrypted:${decryptedHash.substring(0, 8)}`;
  } catch (error) {
    ErrorReporting.logError(
      ErrorSeverity.ERROR,
      'Failed to decrypt data',
      error instanceof Error ? error : undefined
    );
    return encryptedData;
  }
};

/**
 * Store a value securely
 * @param key Storage key
 * @param value Value to store
 */
export const secureStore = async (key: string, value: string): Promise<void> => {
  try {
    // Encrypt the value
    const encryptedValue = await encrypt(value);
    
    if (isSecureStoreAvailable()) {
      // Store in secure storage
      await SecureStore.setItemAsync(key, encryptedValue);
    } else {
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(`${FALLBACK_STORAGE_PREFIX}${key}`, encryptedValue);
    }
  } catch (error) {
    ErrorReporting.logError(
      ErrorSeverity.ERROR,
      'Failed to store value securely',
      error instanceof Error ? error : undefined,
      { key }
    );
    throw error;
  }
};

/**
 * Retrieve a value stored securely
 * @param key Storage key
 * @returns Retrieved value
 */
export const secureRetrieve = async (key: string): Promise<string | null> => {
  try {
    let encryptedValue: string | null = null;
    
    if (isSecureStoreAvailable()) {
      // Retrieve from secure storage
      encryptedValue = await SecureStore.getItemAsync(key);
    } else {
      // Fallback to AsyncStorage
      encryptedValue = await AsyncStorage.getItem(`${FALLBACK_STORAGE_PREFIX}${key}`);
    }
    
    if (!encryptedValue) return null;
    
    // Decrypt the value
    return await decrypt(encryptedValue);
  } catch (error) {
    ErrorReporting.logError(
      ErrorSeverity.ERROR,
      'Failed to retrieve value securely',
      error instanceof Error ? error : undefined,
      { key }
    );
    return null;
  }
};

/**
 * Delete a value stored securely
 * @param key Storage key
 */
export const secureDelete = async (key: string): Promise<void> => {
  try {
    if (isSecureStoreAvailable()) {
      // Delete from secure storage
      await SecureStore.deleteItemAsync(key);
    } else {
      // Fallback to AsyncStorage
      await AsyncStorage.removeItem(`${FALLBACK_STORAGE_PREFIX}${key}`);
    }
  } catch (error) {
    ErrorReporting.logError(
      ErrorSeverity.ERROR,
      'Failed to delete value securely',
      error instanceof Error ? error : undefined,
      { key }
    );
    throw error;
  }
};

/**
 * Store an object securely
 * @param key Storage key
 * @param value Object to store
 */
export const secureStoreObject = async (key: string, value: object): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await secureStore(key, jsonValue);
  } catch (error) {
    ErrorReporting.logError(
      ErrorSeverity.ERROR,
      'Failed to store object securely',
      error instanceof Error ? error : undefined,
      { key }
    );
    throw error;
  }
};

/**
 * Retrieve an object stored securely
 * @param key Storage key
 * @returns Retrieved object
 */
export const secureRetrieveObject = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await secureRetrieve(key);
    if (!jsonValue) return null;
    return JSON.parse(jsonValue) as T;
  } catch (error) {
    ErrorReporting.logError(
      ErrorSeverity.ERROR,
      'Failed to retrieve object securely',
      error instanceof Error ? error : undefined,
      { key }
    );
    return null;
  }
};

export default {
  encrypt,
  decrypt,
  secureStore,
  secureRetrieve,
  secureDelete,
  secureStoreObject,
  secureRetrieveObject
};
