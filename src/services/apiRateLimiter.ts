/**
 * API Rate Limiter
 * 
 * Implements rate limiting for API requests to prevent abuse and ensure
 * fair usage of resources. This helps protect both the client app and
 * the backend services from excessive traffic.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorReporting, ErrorSeverity } from './errorReporting';

// Rate limit storage key prefix
const RATE_LIMIT_KEY_PREFIX = '@fieldscore_rate_limit_';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  timeWindow: number;
  /** Optional group key for grouping related endpoints */
  group?: string;
}

/**
 * Rate limit tracking data
 */
interface RateLimitData {
  /** Timestamps of recent requests */
  timestamps: number[];
  /** Last reset time */
  lastReset: number;
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const DefaultRateLimits: Record<string, RateLimitConfig> = {
  // Standard API endpoints
  default: {
    maxRequests: 60,
    timeWindow: 60 * 1000, // 1 minute
  },
  
  // Authentication endpoints
  auth: {
    maxRequests: 5,
    timeWindow: 60 * 1000, // 1 minute
    group: 'auth'
  },
  
  // Payment endpoints
  payment: {
    maxRequests: 10,
    timeWindow: 60 * 1000, // 1 minute
    group: 'payment'
  },
  
  // Sync endpoints
  sync: {
    maxRequests: 30,
    timeWindow: 60 * 1000, // 1 minute
    group: 'sync'
  }
};

/**
 * API Rate Limiter Service
 */
class ApiRateLimiter {
  private rateLimits: Record<string, RateLimitData> = {};
  private initialized = false;
  
  /**
   * Initialize the rate limiter
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Load rate limit data from storage
      await this.loadRateLimitData();
      this.initialized = true;
    } catch (error) {
      ErrorReporting.logError(
        ErrorSeverity.WARNING,
        'Failed to initialize rate limiter',
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Check if a request is allowed based on rate limits
   * @param endpoint API endpoint
   * @param config Rate limit configuration
   * @returns Whether the request is allowed
   */
  async isRequestAllowed(endpoint: string, config?: RateLimitConfig): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Get rate limit configuration
      const limitConfig = config || this.getLimitConfigForEndpoint(endpoint);
      
      // Get or create rate limit data
      const key = this.getRateLimitKey(endpoint, limitConfig);
      let limitData = this.rateLimits[key];
      
      if (!limitData) {
        limitData = {
          timestamps: [],
          lastReset: Date.now()
        };
        this.rateLimits[key] = limitData;
      }
      
      // Clean up old timestamps
      this.cleanupTimestamps(limitData, limitConfig.timeWindow);
      
      // Check if rate limit is exceeded
      if (limitData.timestamps.length >= limitConfig.maxRequests) {
        ErrorReporting.logWarning(
          `Rate limit exceeded for endpoint: ${endpoint}`,
          { 
            endpoint,
            maxRequests: limitConfig.maxRequests,
            timeWindow: limitConfig.timeWindow,
            currentCount: limitData.timestamps.length
          }
        );
        return false;
      }
      
      // Add current timestamp
      limitData.timestamps.push(Date.now());
      
      // Save rate limit data
      await this.saveRateLimitData();
      
      return true;
    } catch (error) {
      ErrorReporting.logError(
        ErrorSeverity.WARNING,
        'Error checking rate limit',
        error instanceof Error ? error : undefined,
        { endpoint }
      );
      
      // Allow the request if there's an error checking the rate limit
      return true;
    }
  }
  
  /**
   * Track a request that was made
   * @param endpoint API endpoint
   * @param config Rate limit configuration
   */
  async trackRequest(endpoint: string, config?: RateLimitConfig): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Get rate limit configuration
      const limitConfig = config || this.getLimitConfigForEndpoint(endpoint);
      
      // Get or create rate limit data
      const key = this.getRateLimitKey(endpoint, limitConfig);
      let limitData = this.rateLimits[key];
      
      if (!limitData) {
        limitData = {
          timestamps: [],
          lastReset: Date.now()
        };
        this.rateLimits[key] = limitData;
      }
      
      // Clean up old timestamps
      this.cleanupTimestamps(limitData, limitConfig.timeWindow);
      
      // Add current timestamp
      limitData.timestamps.push(Date.now());
      
      // Save rate limit data
      await this.saveRateLimitData();
    } catch (error) {
      ErrorReporting.logError(
        ErrorSeverity.WARNING,
        'Error tracking request for rate limiting',
        error instanceof Error ? error : undefined,
        { endpoint }
      );
    }
  }
  
  /**
   * Get the time until the next request is allowed
   * @param endpoint API endpoint
   * @param config Rate limit configuration
   * @returns Time in milliseconds until the next request is allowed, or 0 if allowed now
   */
  async getTimeUntilNextRequest(endpoint: string, config?: RateLimitConfig): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Get rate limit configuration
      const limitConfig = config || this.getLimitConfigForEndpoint(endpoint);
      
      // Get rate limit data
      const key = this.getRateLimitKey(endpoint, limitConfig);
      const limitData = this.rateLimits[key];
      
      if (!limitData || limitData.timestamps.length === 0) {
        return 0;
      }
      
      // Clean up old timestamps
      this.cleanupTimestamps(limitData, limitConfig.timeWindow);
      
      // Check if rate limit is exceeded
      if (limitData.timestamps.length < limitConfig.maxRequests) {
        return 0;
      }
      
      // Calculate time until oldest timestamp expires
      const oldestTimestamp = limitData.timestamps[0];
      const expiryTime = oldestTimestamp + limitConfig.timeWindow;
      const now = Date.now();
      
      return Math.max(0, expiryTime - now);
    } catch (error) {
      ErrorReporting.logError(
        ErrorSeverity.WARNING,
        'Error calculating time until next request',
        error instanceof Error ? error : undefined,
        { endpoint }
      );
      
      return 0;
    }
  }
  
  /**
   * Reset rate limit for an endpoint
   * @param endpoint API endpoint
   * @param config Rate limit configuration
   */
  async resetRateLimit(endpoint: string, config?: RateLimitConfig): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Get rate limit configuration
      const limitConfig = config || this.getLimitConfigForEndpoint(endpoint);
      
      // Reset rate limit data
      const key = this.getRateLimitKey(endpoint, limitConfig);
      this.rateLimits[key] = {
        timestamps: [],
        lastReset: Date.now()
      };
      
      // Save rate limit data
      await this.saveRateLimitData();
    } catch (error) {
      ErrorReporting.logError(
        ErrorSeverity.WARNING,
        'Error resetting rate limit',
        error instanceof Error ? error : undefined,
        { endpoint }
      );
    }
  }
  
  /**
   * Get rate limit configuration for an endpoint
   * @param endpoint API endpoint
   * @returns Rate limit configuration
   */
  private getLimitConfigForEndpoint(endpoint: string): RateLimitConfig {
    // Check for specific endpoint configurations
    if (endpoint.includes('/auth') || endpoint.includes('/login') || endpoint.includes('/register')) {
      return DefaultRateLimits.auth;
    }
    
    if (endpoint.includes('/payment') || endpoint.includes('/mpesa')) {
      return DefaultRateLimits.payment;
    }
    
    if (endpoint.includes('/sync')) {
      return DefaultRateLimits.sync;
    }
    
    // Default configuration
    return DefaultRateLimits.default;
  }
  
  /**
   * Get rate limit key for storage
   * @param endpoint API endpoint
   * @param config Rate limit configuration
   * @returns Rate limit key
   */
  private getRateLimitKey(endpoint: string, config: RateLimitConfig): string {
    // If a group is specified, use that as the key
    if (config.group) {
      return config.group;
    }
    
    // Otherwise, use the endpoint as the key
    return endpoint;
  }
  
  /**
   * Clean up old timestamps
   * @param limitData Rate limit data
   * @param timeWindow Time window in milliseconds
   */
  private cleanupTimestamps(limitData: RateLimitData, timeWindow: number): void {
    const now = Date.now();
    const cutoff = now - timeWindow;
    
    // Remove timestamps older than the time window
    limitData.timestamps = limitData.timestamps.filter(timestamp => timestamp >= cutoff);
    
    // Update last reset time if necessary
    if (limitData.lastReset < cutoff) {
      limitData.lastReset = now;
    }
  }
  
  /**
   * Load rate limit data from storage
   */
  private async loadRateLimitData(): Promise<void> {
    try {
      // Get all keys with the rate limit prefix
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter(key => key.startsWith(RATE_LIMIT_KEY_PREFIX));
      
      if (rateLimitKeys.length === 0) {
        return;
      }
      
      // Get all rate limit data
      const rateLimitItems = await AsyncStorage.multiGet(rateLimitKeys);
      
      // Parse and store rate limit data
      for (const [key, value] of rateLimitItems) {
        if (value) {
          const endpoint = key.substring(RATE_LIMIT_KEY_PREFIX.length);
          this.rateLimits[endpoint] = JSON.parse(value);
        }
      }
    } catch (error) {
      ErrorReporting.logError(
        ErrorSeverity.WARNING,
        'Failed to load rate limit data',
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Save rate limit data to storage
   */
  private async saveRateLimitData(): Promise<void> {
    try {
      const rateLimitItems: [string, string][] = [];
      
      // Prepare rate limit data for storage
      for (const [endpoint, limitData] of Object.entries(this.rateLimits)) {
        rateLimitItems.push([
          `${RATE_LIMIT_KEY_PREFIX}${endpoint}`,
          JSON.stringify(limitData)
        ]);
      }
      
      // Save all rate limit data
      if (rateLimitItems.length > 0) {
        await AsyncStorage.multiSet(rateLimitItems);
      }
    } catch (error) {
      ErrorReporting.logError(
        ErrorSeverity.WARNING,
        'Failed to save rate limit data',
        error instanceof Error ? error : undefined
      );
    }
  }
}

// Export a singleton instance
export const ApiRateLimit = new ApiRateLimiter();

// Initialize rate limiter on import
ApiRateLimit.initialize();

export default ApiRateLimit;
