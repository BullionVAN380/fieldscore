import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiRateLimit, DefaultRateLimits } from '../apiRateLimiter';

// Add Jest type definitions
import '@types/jest';

// Mock ErrorReporting
jest.mock('../errorReporting', () => ({
  ErrorReporting: {
    logError: jest.fn(),
    logWarning: jest.fn(),
    ErrorSeverity: {
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
      CRITICAL: 'critical'
    }
  }
}));

describe('API Rate Limiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset service state
    (ApiRateLimit as any).rateLimits = {};
    (ApiRateLimit as any).initialized = false;
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await ApiRateLimit.initialize();
      expect((ApiRateLimit as any).initialized).toBe(true);
    });

    it('should load rate limit data from storage on initialization', async () => {
      // Mock stored rate limits
      const mockRateLimits = {
        'test-endpoint': {
          timestamps: [Date.now() - 30000],
          lastReset: Date.now() - 60000
        }
      };
      
      // Setup AsyncStorage mock
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce([
        '@fieldscore_rate_limit_test-endpoint'
      ]);
      
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValueOnce([
        ['@fieldscore_rate_limit_test-endpoint', JSON.stringify(mockRateLimits['test-endpoint'])]
      ]);
      
      await ApiRateLimit.initialize();
      
      expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(AsyncStorage.multiGet).toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    beforeEach(async () => {
      // Ensure service is initialized
      (ApiRateLimit as any).initialized = true;
    });

    it('should allow requests within rate limits', async () => {
      const endpoint = '/api/test';
      const config = {
        maxRequests: 5,
        timeWindow: 60000
      };
      
      // First request should be allowed
      const isAllowed = await ApiRateLimit.isRequestAllowed(endpoint, config);
      
      expect(isAllowed).toBe(true);
      
      // Check that the request was tracked
      const key = (ApiRateLimit as any).getRateLimitKey(endpoint, config);
      expect((ApiRateLimit as any).rateLimits[key].timestamps).toHaveLength(1);
    });

    it('should block requests that exceed rate limits', async () => {
      const endpoint = '/api/test';
      const config = {
        maxRequests: 2,
        timeWindow: 60000
      };
      
      // Setup rate limit data with max requests already used
      const key = (ApiRateLimit as any).getRateLimitKey(endpoint, config);
      (ApiRateLimit as any).rateLimits[key] = {
        timestamps: [Date.now() - 1000, Date.now() - 500],
        lastReset: Date.now() - 10000
      };
      
      // This request should be blocked
      const isAllowed = await ApiRateLimit.isRequestAllowed(endpoint, config);
      
      expect(isAllowed).toBe(false);
    });

    it('should track requests correctly', async () => {
      const endpoint = '/api/test';
      const config = {
        maxRequests: 10,
        timeWindow: 60000
      };
      
      // Track a request
      await ApiRateLimit.trackRequest(endpoint, config);
      
      // Check that the request was tracked
      const key = (ApiRateLimit as any).getRateLimitKey(endpoint, config);
      expect((ApiRateLimit as any).rateLimits[key].timestamps).toHaveLength(1);
      
      // Track another request
      await ApiRateLimit.trackRequest(endpoint, config);
      
      // Check that both requests were tracked
      expect((ApiRateLimit as any).rateLimits[key].timestamps).toHaveLength(2);
    });

    it('should clean up old timestamps', async () => {
      const endpoint = '/api/test';
      const config = {
        maxRequests: 5,
        timeWindow: 1000 // 1 second
      };
      
      const now = Date.now();
      
      // Setup rate limit data with old and new timestamps
      const key = (ApiRateLimit as any).getRateLimitKey(endpoint, config);
      (ApiRateLimit as any).rateLimits[key] = {
        timestamps: [
          now - 2000, // Old (should be removed)
          now - 1500, // Old (should be removed)
          now - 500,  // Recent (should be kept)
          now - 100   // Recent (should be kept)
        ],
        lastReset: now - 3000
      };
      
      // Check if request is allowed
      await ApiRateLimit.isRequestAllowed(endpoint, config);
      
      // Check that old timestamps were removed
      expect((ApiRateLimit as any).rateLimits[key].timestamps).toHaveLength(2);
      
      // Check that only recent timestamps remain
      expect((ApiRateLimit as any).rateLimits[key].timestamps[0]).toBeGreaterThan(now - 1000);
      expect((ApiRateLimit as any).rateLimits[key].timestamps[1]).toBeGreaterThan(now - 1000);
    });
  });

  describe('time until next request', () => {
    beforeEach(async () => {
      // Ensure service is initialized
      (ApiRateLimit as any).initialized = true;
    });

    it('should return 0 when rate limit is not reached', async () => {
      const endpoint = '/api/test';
      const config = {
        maxRequests: 5,
        timeWindow: 60000
      };
      
      // No requests yet
      const waitTime = await ApiRateLimit.getTimeUntilNextRequest(endpoint, config);
      
      expect(waitTime).toBe(0);
    });

    it('should calculate correct wait time when rate limit is reached', async () => {
      const endpoint = '/api/test';
      const config = {
        maxRequests: 2,
        timeWindow: 10000 // 10 seconds
      };
      
      const now = Date.now();
      
      // Setup rate limit data with max requests used
      const key = (ApiRateLimit as any).getRateLimitKey(endpoint, config);
      (ApiRateLimit as any).rateLimits[key] = {
        timestamps: [
          now - 5000, // 5 seconds ago
          now - 2000  // 2 seconds ago
        ],
        lastReset: now - 10000
      };
      
      // Get time until next request
      const waitTime = await ApiRateLimit.getTimeUntilNextRequest(endpoint, config);
      
      // The oldest timestamp will expire after 5 more seconds
      expect(waitTime).toBeGreaterThan(4000);
      expect(waitTime).toBeLessThan(6000);
    });
  });

  describe('reset rate limit', () => {
    beforeEach(async () => {
      // Ensure service is initialized
      (ApiRateLimit as any).initialized = true;
    });

    it('should reset rate limit for an endpoint', async () => {
      const endpoint = '/api/test';
      const config = {
        maxRequests: 5,
        timeWindow: 60000
      };
      
      // Setup rate limit data
      const key = (ApiRateLimit as any).getRateLimitKey(endpoint, config);
      (ApiRateLimit as any).rateLimits[key] = {
        timestamps: [Date.now() - 1000, Date.now() - 500],
        lastReset: Date.now() - 10000
      };
      
      // Reset rate limit
      await ApiRateLimit.resetRateLimit(endpoint, config);
      
      // Check that rate limit was reset
      expect((ApiRateLimit as any).rateLimits[key].timestamps).toHaveLength(0);
      expect((ApiRateLimit as any).rateLimits[key].lastReset).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('endpoint configuration', () => {
    it('should use auth config for auth endpoints', () => {
      const config = (ApiRateLimit as any).getLimitConfigForEndpoint('/auth/login');
      expect(config).toEqual(DefaultRateLimits.auth);
    });

    it('should use payment config for payment endpoints', () => {
      const config = (ApiRateLimit as any).getLimitConfigForEndpoint('/payment/process');
      expect(config).toEqual(DefaultRateLimits.payment);
    });

    it('should use sync config for sync endpoints', () => {
      const config = (ApiRateLimit as any).getLimitConfigForEndpoint('/sync/data');
      expect(config).toEqual(DefaultRateLimits.sync);
    });

    it('should use default config for other endpoints', () => {
      const config = (ApiRateLimit as any).getLimitConfigForEndpoint('/api/other');
      expect(config).toEqual(DefaultRateLimits.default);
    });
  });

  describe('storage operations', () => {
    beforeEach(async () => {
      // Ensure service is initialized
      (ApiRateLimit as any).initialized = true;
    });

    it('should save rate limit data to storage', async () => {
      // Setup rate limit data
      (ApiRateLimit as any).rateLimits = {
        'endpoint1': {
          timestamps: [Date.now()],
          lastReset: Date.now() - 10000
        },
        'endpoint2': {
          timestamps: [Date.now() - 1000, Date.now() - 500],
          lastReset: Date.now() - 20000
        }
      };
      
      await (ApiRateLimit as any).saveRateLimitData();
      
      expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
        ['@fieldscore_rate_limit_endpoint1', JSON.stringify((ApiRateLimit as any).rateLimits.endpoint1)],
        ['@fieldscore_rate_limit_endpoint2', JSON.stringify((ApiRateLimit as any).rateLimits.endpoint2)]
      ]);
    });
  });
});
