/**
 * Error Reporting Service
 * 
 * A service for logging and reporting errors to help identify issues in production.
 * This implementation provides structured error logging with severity levels,
 * context capture, and offline support.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Analytics } from './analytics';

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error log interface
export interface ErrorLog {
  id: string;
  timestamp: number;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  stack?: string;
  componentStack?: string;
  context?: Record<string, any>;
  deviceInfo?: Record<string, any>;
  userInfo?: Record<string, any>;
}

// Queue for storing errors when offline
const ERROR_QUEUE_KEY = '@fieldscore_error_queue';

/**
 * Error Reporting Service for logging and reporting errors
 */
class ErrorReportingService {
  private isInitialized: boolean = false;
  private userId: string | null = null;
  private deviceInfo: Record<string, any> = {};
  private errorQueue: ErrorLog[] = [];
  private MAX_QUEUE_SIZE = 50;
  private isOnline: boolean = true;

  /**
   * Initialize the error reporting service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Collect device information
      this.deviceInfo = await this.collectDeviceInfo();
      
      // Load queued errors from storage
      await this.loadQueuedErrors();
      
      // Set up network listener
      NetInfo.addEventListener(state => {
        this.isOnline = state.isConnected ?? false;
        
        // If we're back online, try to send queued errors
        if (this.isOnline && this.errorQueue.length > 0) {
          this.sendQueuedErrors();
        }
      });
      
      // Set up global error handler
      this.setupGlobalErrorHandler();
      
      this.isInitialized = true;
      // Service initialized successfully
    } catch (_error) {
      // Cannot log initialization failure as the service itself failed to initialize
    }
  }

  /**
   * Set the user ID for tracking
   * @param id User ID
   */
  setUserId(id: string): void {
    this.userId = id;
  }

  /**
   * Log an info message
   * @param message Info message
   * @param context Additional context
   */
  logInfo(message: string, context: Record<string, any> = {}): void {
    this.logError(ErrorSeverity.INFO, message, undefined, context);
  }

  /**
   * Log a warning message
   * @param message Warning message
   * @param context Additional context
   */
  logWarning(message: string, context: Record<string, any> = {}): void {
    this.logError(ErrorSeverity.WARNING, message, undefined, context);
  }

  /**
   * Log an error
   * @param error Error object or message
   * @param context Additional context
   */
  logError(error: Error | string, context?: Record<string, any>): void;
  logError(severity: ErrorSeverity, message: string, error?: Error, context?: Record<string, any>): void;
  logError(
    errorOrSeverity: Error | string | ErrorSeverity,
    contextOrMessage: Record<string, any> | string = {},
    errorOrUndefined?: Error,
    contextOrEmpty: Record<string, any> = {}
  ): void {
    if (!this.isInitialized) {
      this.initialize().then(() => 
        this.logError(
          errorOrSeverity as any, 
          contextOrMessage as any, 
          errorOrUndefined, 
          contextOrEmpty
        )
      );
      return;
    }

    let severity: ErrorSeverity;
    let message: string;
    let error: Error | undefined;
    let context: Record<string, any> = {};

    // Handle different overloads
    if (typeof errorOrSeverity === 'string') {
      severity = ErrorSeverity.ERROR;
      message = errorOrSeverity;
      context = contextOrMessage as Record<string, any>;
    } else if (errorOrSeverity instanceof Error) {
      severity = ErrorSeverity.ERROR;
      message = errorOrSeverity.message;
      error = errorOrSeverity;
      context = contextOrMessage as Record<string, any>;
    } else {
      severity = errorOrSeverity;
      message = contextOrMessage as string;
      error = errorOrUndefined;
      context = contextOrEmpty || {};
    }

    const errorLog: ErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      severity,
      message,
      code: error?.name,
      stack: error?.stack,
      context,
      deviceInfo: this.deviceInfo,
      userInfo: this.userId ? { userId: this.userId } : undefined
    };

    // Log to console for development
    this.logToConsole(errorLog);
    
    // Track in analytics
    if (severity === ErrorSeverity.ERROR || severity === ErrorSeverity.CRITICAL) {
      Analytics.trackError(message, {
        severity,
        code: error?.name,
        ...context
      });
    }
    
    // Send or queue the error
    if (this.isOnline) {
      this.sendError(errorLog);
    } else {
      this.queueError(errorLog);
    }
  }

  /**
   * Log a critical error
   * @param error Error object or message
   * @param context Additional context
   */
  logCritical(error: Error | string, context: Record<string, any> = {}): void {
    if (typeof error === 'string') {
      this.logError(ErrorSeverity.CRITICAL, error, undefined, context);
    } else {
      this.logError(ErrorSeverity.CRITICAL, error.message, error, context);
    }
  }

  /**
   * Log to console for development
   * @param errorLog Error log
   */
  private logToConsole(errorLog: ErrorLog): void {
    const { severity, message, code, stack } = errorLog;
    
    switch (severity) {
      case ErrorSeverity.INFO:
        // Log info message to console
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info(`[INFO] ${message}`, code ? `(${code})` : '');
    }
        break;
      case ErrorSeverity.WARNING:
        // Log warning message to console
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`[WARNING] ${message}`, code ? `(${code})` : '');
    }
        break;
      case ErrorSeverity.ERROR:
        // Log error message to console
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, code ? `(${code})` : '');
      if (stack) {
        // eslint-disable-next-line no-console
        console.error(stack);
      }
    }
        break;
      case ErrorSeverity.CRITICAL:
        // Log critical error message to console
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error(`[CRITICAL] ${message}`, code ? `(${code})` : '');
      if (stack) {
        // eslint-disable-next-line no-console
        console.error(stack);
      }
    }
        break;
    }
  }

  /**
   * Send an error to the error reporting service
   * @param errorLog Error log
   */
  private async sendError(errorLog: ErrorLog): Promise<void> {
    try {
      // In a real implementation, this would send the error to a reporting service
      // For now, we'll just simulate a successful send
      // In a real implementation, send the error report to a server
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('Sending error report:', errorLog);
      }
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return Promise.resolve();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to send error report:', error);
      }
      // If sending fails, queue the error for later
      this.queueError(errorLog);
      return Promise.reject(error);
    }
  }

  /**
   * Queue an error for later sending
   * @param errorLog Error log
   */
  private queueError(errorLog: ErrorLog): void {
    // Add to queue
    this.errorQueue.push(errorLog);
    
    // Trim queue if it gets too large
    if (this.errorQueue.length > this.MAX_QUEUE_SIZE) {
      this.errorQueue = this.errorQueue.slice(-this.MAX_QUEUE_SIZE);
    }
    
    // Save queue to storage
    this.saveQueuedErrors();
  }

  /**
   * Save queued errors to storage
   */
  private async saveQueuedErrors(): Promise<void> {
    try {
      await AsyncStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(this.errorQueue));
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to save queued error reports:', error);
      }
    }
  }

  /**
   * Load queued errors from storage
   */
  private async loadQueuedErrors(): Promise<void> {
    try {
      const queuedErrors = await AsyncStorage.getItem(ERROR_QUEUE_KEY);
      if (queuedErrors) {
        this.errorQueue = JSON.parse(queuedErrors);
      }
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to load queued error reports:', error);
      }
    }
  }

  /**
   * Send queued errors to the error reporting service
   */
  private async sendQueuedErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    try {
      // Clone the queue
      const errorsToSend = [...this.errorQueue];
      
      // Clear the queue
      this.errorQueue = [];
      await this.saveQueuedErrors();
      
      // Send each error
      for (const errorLog of errorsToSend) {
        await this.sendError(errorLog);
      }
    } catch (error) {
      console.error('Failed to send queued error reports:', error);
    }
  }

  /**
   * Set up global error handler
   */
  private setupGlobalErrorHandler(): void {
    // Save original error handler
    const originalErrorHandler = ErrorUtils.getGlobalHandler();
    
    // Set custom error handler
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // Log the error
      this.logError(
        isFatal ? ErrorSeverity.CRITICAL : ErrorSeverity.ERROR,
        error.message,
        error,
        { isFatal }
      );
      
      // Call original handler
      originalErrorHandler(error, isFatal);
    });
  }

  /**
   * Collect device information
   */
  private async collectDeviceInfo(): Promise<Record<string, any>> {
    try {
      const deviceType = await Device.getDeviceTypeAsync();
      const deviceName = await Device.getDeviceNameAsync();
      const appVersion = await Application.getApplicationName();
      
      return {
        platform: Platform.OS,
        platformVersion: Platform.Version,
        deviceType: Device.DeviceType[deviceType],
        deviceName,
        appVersion,
        appBuildNumber: Application.nativeBuildVersion,
        appBundleId: Application.applicationId
      };
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to collect device info:', error);
      }
      return {
        platform: Platform.OS,
        platformVersion: Platform.Version
      };
    }
  }
}

// Export a singleton instance
export const ErrorReporting = new ErrorReportingService();

// Initialize error reporting on import
ErrorReporting.initialize();

export default ErrorReporting;
