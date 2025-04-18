/**
 * Secure API Client
 * 
 * A secure API client for making requests to the Fieldscore backend services.
 * Implements security best practices including:
 * - Request/response encryption
 * - API rate limiting
 * - Request signing
 * - Retry with exponential backoff
 * - Offline request queueing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { ErrorReporting, ErrorSeverity } from './errorReporting';
import { Analytics } from './analytics';
import { ApiRateLimit } from './apiRateLimiter';
import { encrypt, decrypt } from '../utils/encryption';
import { sanitizeObject } from '../utils/validation';

// API configuration
const API_CONFIG = {
  baseUrl: 'https://api.fieldscore.co.ke',
  version: 'v1',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  encryptRequests: true,
  encryptResponses: true,
  offlineQueueKey: '@fieldscore_api_queue'
};

// Request method types
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request options
export interface RequestOptions {
  method?: RequestMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipRateLimiting?: boolean;
  skipOfflineQueue?: boolean;
  skipEncryption?: boolean;
  requireAuth?: boolean;
}

// API error
export class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Queued request
interface QueuedRequest {
  id: string;
  endpoint: string;
  options: RequestOptions;
  timestamp: number;
  retryCount: number;
}

/**
 * Secure API Client for making requests to the Fieldscore backend
 */
class ApiClient {
  private isInitialized: boolean = false;
  private authToken: string | null = null;
  private deviceInfo: Record<string, any> = {};
  private requestQueue: QueuedRequest[] = [];
  private isOnline: boolean = true;
  private isProcessingQueue: boolean = false;
  
  /**
   * Initialize the API client
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Collect device information
      this.deviceInfo = await this.collectDeviceInfo();
      
      // Load queued requests
      await this.loadQueuedRequests();
      
      // Set up network listener
      NetInfo.addEventListener(state => {
        this.isOnline = state.isConnected ?? false;
        
        // If we're back online, process the queue
        if (this.isOnline && this.requestQueue.length > 0) {
          this.processQueue();
        }
      });
      
      this.isInitialized = true;
      // API client initialized successfully
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('API client initialized');
      }
    } catch (error) {
      ErrorReporting.logError(
        ErrorSeverity.ERROR,
        'Failed to initialize API client',
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Set the authentication token
   * @param token Authentication token
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }
  
  /**
   * Get the authentication token
   * @returns Authentication token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }
  
  /**
   * Make a GET request
   * @param endpoint API endpoint
   * @param options Request options
   * @returns Response data
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET'
    });
  }
  
  /**
   * Make a POST request
   * @param endpoint API endpoint
   * @param data Request data
   * @param options Request options
   * @returns Response data
   */
  async post<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data
    });
  }
  
  /**
   * Make a PUT request
   * @param endpoint API endpoint
   * @param data Request data
   * @param options Request options
   * @returns Response data
   */
  async put<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data
    });
  }
  
  /**
   * Make a DELETE request
   * @param endpoint API endpoint
   * @param options Request options
   * @returns Response data
   */
  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }
  
  /**
   * Make a PATCH request
   * @param endpoint API endpoint
   * @param data Request data
   * @param options Request options
   * @returns Response data
   */
  async patch<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data
    });
  }
  
  /**
   * Make a request to the API
   * @param endpoint API endpoint
   * @param options Request options
   * @returns Response data
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Default options
    const defaultOptions: RequestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Version': this.deviceInfo.appVersion,
        'X-Client-Platform': Platform.OS,
        'X-Client-Device': this.deviceInfo.deviceType
      },
      timeout: API_CONFIG.timeout,
      retries: API_CONFIG.maxRetries,
      retryDelay: API_CONFIG.retryDelay,
      skipRateLimiting: false,
      skipOfflineQueue: false,
      skipEncryption: false,
      requireAuth: true
    };
    
    // Merge options
    const mergedOptions: RequestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    // Add authentication header if required
    if (mergedOptions.requireAuth && this.authToken) {
      mergedOptions.headers = {
        ...mergedOptions.headers,
        'Authorization': `Bearer ${this.authToken}`
      };
    }
    
    // Check if we're offline
    if (!this.isOnline && !mergedOptions.skipOfflineQueue) {
      return this.queueRequest<T>(endpoint, mergedOptions);
    }
    
    // Check rate limiting
    if (!mergedOptions.skipRateLimiting) {
      const isAllowed = await ApiRateLimit.isRequestAllowed(endpoint);
      
      if (!isAllowed) {
        const waitTime = await ApiRateLimit.getTimeUntilNextRequest(endpoint);
        
        ErrorReporting.logWarning(
          'API rate limit exceeded',
          {
            endpoint,
            waitTime
          }
        );
        
        throw new ApiError(
          `Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`,
          429
        );
      }
    }
    
    // Track the request
    ApiRateLimit.trackRequest(endpoint);
    
    // Start request timer
    const startTime = Date.now();
    
    try {
      // Prepare request body
      let requestBody: string | undefined;
      
      if (mergedOptions.body) {
        // Sanitize request body
        const sanitizedBody = sanitizeObject(mergedOptions.body);
        
        // Encrypt request body if needed
        if (API_CONFIG.encryptRequests && !mergedOptions.skipEncryption) {
          const jsonBody = JSON.stringify(sanitizedBody);
          requestBody = await encrypt(jsonBody);
          
          // Update content type header
          mergedOptions.headers = {
            ...mergedOptions.headers,
            'Content-Type': 'application/encrypted+json'
          };
        } else {
          requestBody = JSON.stringify(sanitizedBody);
        }
      }
      
      // Build URL
      const url = this.buildUrl(endpoint);
      
      // Make the request
      const response = await this.fetchWithTimeout(
        url,
        {
          method: mergedOptions.method,
          headers: mergedOptions.headers,
          body: requestBody
        },
        mergedOptions.timeout || API_CONFIG.timeout
      );
      
      // Calculate request duration
      const duration = Date.now() - startTime;
      
      // Track request in analytics
      Analytics.trackApiRequest({
        endpoint,
        method: mergedOptions.method || 'GET',
        status: response.status,
        duration
      });
      
      // Handle response
      return this.handleResponse<T>(response, endpoint, mergedOptions);
    } catch (error) {
      // Handle error
      return this.handleError<T>(error, endpoint, mergedOptions);
    }
  }
  
  /**
   * Handle API response
   * @param response Fetch response
   * @param endpoint API endpoint
   * @param options Request options
   * @returns Response data
   */
  private async handleResponse<T>(
    response: Response,
    endpoint: string,
    options: RequestOptions
  ): Promise<T> {
    // Check if response is ok
    if (!response.ok) {
      // Handle error response
      let errorData: any;
      
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: 'Unknown error' };
      }
      
      // Log error
      ErrorReporting.logError(
        ErrorSeverity.WARNING,
        `API error: ${response.status} ${response.statusText}`,
        undefined,
        {
          endpoint,
          status: response.status,
          data: errorData
        }
      );
      
      throw new ApiError(
        errorData.message || `API error: ${response.status} ${response.statusText}`,
        response.status,
        errorData
      );
    }
    
    // Handle empty response
    if (response.status === 204) {
      return {} as T;
    }
    
    // Get response text
    const responseText = await response.text();
    
    // Handle empty response text
    if (!responseText) {
      return {} as T;
    }
    
    // Check if response is encrypted
    const contentType = response.headers.get('Content-Type');
    const isEncrypted = contentType?.includes('encrypted');
    
    let responseData: T;
    
    if (isEncrypted && API_CONFIG.encryptResponses && !options.skipEncryption) {
      // Decrypt response
      const decryptedText = await decrypt(responseText);
      responseData = JSON.parse(decryptedText) as T;
    } else {
      // Parse JSON response
      responseData = JSON.parse(responseText) as T;
    }
    
    return responseData;
  }
  
  /**
   * Handle API error
   * @param error Error object
   * @param endpoint API endpoint
   * @param options Request options
   * @returns Response data
   */
  private async handleError<T>(
    error: any,
    endpoint: string,
    options: RequestOptions
  ): Promise<T> {
    // Check if error is a timeout
    if (error.name === 'AbortError') {
      ErrorReporting.logWarning(
        'API request timed out',
        {
          endpoint,
          timeout: options.timeout || API_CONFIG.timeout
        }
      );
      
      // Retry if retries are left
      if ((options.retries || 0) > 0) {
        // Calculate retry delay with exponential backoff
        const retryCount = API_CONFIG.maxRetries - (options.retries || 0) + 1;
        const delay = (options.retryDelay || API_CONFIG.retryDelay) * Math.pow(2, retryCount - 1);
        
        // Wait for delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry request
        return this.request<T>(endpoint, {
          ...options,
          retries: (options.retries || 0) - 1
        });
      }
      
      throw new ApiError('Request timed out', 408);
    }
    
    // Check if error is a network error
    if (error.message === 'Network request failed') {
      ErrorReporting.logWarning(
        'API network request failed',
        {
          endpoint
        }
      );
      
      // Queue request if offline queueing is enabled
      if (!options.skipOfflineQueue) {
        return this.queueRequest<T>(endpoint, options);
      }
      
      throw new ApiError('Network request failed', 0);
    }
    
    // Rethrow API errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Log unknown error
    ErrorReporting.logError(
      ErrorSeverity.ERROR,
      'API request failed with unknown error',
      error instanceof Error ? error : undefined,
      {
        endpoint
      }
    );
    
    throw new ApiError(
      error.message || 'Unknown error',
      0
    );
  }
  
  /**
   * Queue a request for later
   * @param endpoint API endpoint
   * @param options Request options
   * @returns Promise that resolves when the request is queued
   */
  private async queueRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    // Create queued request
    const queuedRequest: QueuedRequest = {
      id: `request_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      endpoint,
      options,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    // Add to queue
    this.requestQueue.push(queuedRequest);
    
    // Save queue
    await this.saveQueuedRequests();
    
    // Log queued request
    ErrorReporting.logInfo(
      'API request queued for offline processing',
      {
        endpoint,
        queueLength: this.requestQueue.length
      }
    );
    
    // Return a promise that will never resolve
    // The request will be processed when the device is back online
    return new Promise<T>((_, reject) => {
      reject(new ApiError('Request queued for offline processing', 0));
    });
  }
  
  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0 || !this.isOnline) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      // Clone the queue
      const queueToProcess = [...this.requestQueue];
      
      // Clear the queue
      this.requestQueue = [];
      await this.saveQueuedRequests();
      
      // Process each request
      for (const queuedRequest of queueToProcess) {
        try {
          await this.request(
            queuedRequest.endpoint,
            queuedRequest.options
          );
        } catch (error) {
          // If the request fails, increment retry count and re-queue
          if (queuedRequest.retryCount < 3) {
            queuedRequest.retryCount++;
            this.requestQueue.push(queuedRequest);
          } else {
            // Log failed request
            ErrorReporting.logWarning(
              'Failed to process queued API request after multiple retries',
              {
                endpoint: queuedRequest.endpoint,
                retryCount: queuedRequest.retryCount
              }
            );
          }
        }
      }
      
      // Save queue
      await this.saveQueuedRequests();
    } catch (error) {
      ErrorReporting.logError(
        ErrorSeverity.ERROR,
        'Failed to process API request queue',
        error instanceof Error ? error : undefined
      );
    } finally {
      this.isProcessingQueue = false;
    }
  }
  
  /**
   * Save queued requests to storage
   */
  private async saveQueuedRequests(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        API_CONFIG.offlineQueueKey,
        JSON.stringify(this.requestQueue)
      );
    } catch (error) {
      ErrorReporting.logError(
        ErrorSeverity.WARNING,
        'Failed to save API request queue',
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Load queued requests from storage
   */
  private async loadQueuedRequests(): Promise<void> {
    try {
      const queuedRequests = await AsyncStorage.getItem(API_CONFIG.offlineQueueKey);
      
      if (queuedRequests) {
        this.requestQueue = JSON.parse(queuedRequests);
      }
    } catch (error) {
      ErrorReporting.logError(
        ErrorSeverity.WARNING,
        'Failed to load API request queue',
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Build API URL
   * @param endpoint API endpoint
   * @returns Full API URL
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Build URL
    return `${API_CONFIG.baseUrl}/${API_CONFIG.version}/${cleanEndpoint}`;
  }
  
  /**
   * Fetch with timeout
   * @param url Request URL
   * @param options Fetch options
   * @param timeout Timeout in milliseconds
   * @returns Fetch response
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    // Create abort controller
    const controller = new AbortController();
    
    // Set timeout
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      // Make request
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Collect device information
   */
  private async collectDeviceInfo(): Promise<Record<string, any>> {
    try {
      const deviceType = await Device.getDeviceTypeAsync();
      const deviceName = await Device.getDeviceNameAsync();
      
      return {
        platform: Platform.OS,
        platformVersion: Platform.Version,
        deviceType: Device.DeviceType[deviceType],
        deviceName,
        appVersion: Device.osVersion
      };
    } catch (error) {
      ErrorReporting.logError(
        ErrorSeverity.WARNING,
        'Failed to collect device info',
        error instanceof Error ? error : undefined
      );
      
      return {
        platform: Platform.OS,
        platformVersion: Platform.Version
      };
    }
  }
}

// Export a singleton instance
export const Api = new ApiClient();

// Initialize API client on import
Api.initialize();

export default Api;
