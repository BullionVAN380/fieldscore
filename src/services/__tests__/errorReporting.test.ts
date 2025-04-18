import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorReporting, ErrorSeverity } from '../errorReporting';

// Add Jest type definitions
import '@types/jest';

// Mock Analytics
jest.mock('../analytics', () => ({
  Analytics: {
    trackError: jest.fn()
  }
}));

describe('ErrorReporting Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset console spies
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      // Reset the service
      (ErrorReporting as any).isInitialized = false;
      
      // Mock successful initialization
      const spy = jest.spyOn(console, 'log').mockImplementation();
      
      await ErrorReporting.initialize();
      
      expect(spy).toHaveBeenCalledWith('Error reporting service initialized');
      expect((ErrorReporting as any).isInitialized).toBe(true);
      
      spy.mockRestore();
    });
  });

  describe('error logging methods', () => {
    beforeEach(async () => {
      // Ensure service is initialized
      (ErrorReporting as any).isInitialized = true;
      (ErrorReporting as any).deviceInfo = { platform: 'test' };
    });

    it('should log info messages', () => {
      const consoleSpy = jest.spyOn(console, 'info');
      
      ErrorReporting.logInfo('Test info message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[INFO] Test info message',
        ''
      );
    });

    it('should log warning messages', () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      
      ErrorReporting.logWarning('Test warning message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[WARNING] Test warning message',
        ''
      );
    });

    it('should log error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      
      ErrorReporting.logError('Test error message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        ''
      );
    });

    it('should log error objects', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const error = new Error('Test error');
      
      ErrorReporting.logError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ERROR] Test error',
        ''
      );
    });

    it('should log critical errors', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      
      ErrorReporting.logCritical('Critical error');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[CRITICAL] Critical error',
        ''
      );
    });

    it('should log critical error objects', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const error = new Error('Critical error');
      
      ErrorReporting.logCritical(error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[CRITICAL] Critical error',
        ''
      );
    });

    it('should include additional context in logs', () => {
      const sendSpy = jest.spyOn((ErrorReporting as any), 'sendError')
        .mockImplementation(() => Promise.resolve());
      
      ErrorReporting.logError('Error with context', { userId: '123', action: 'test' });
      
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error with context',
          context: { userId: '123', action: 'test' }
        })
      );
      
      sendSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      // Ensure service is initialized
      (ErrorReporting as any).isInitialized = true;
      (ErrorReporting as any).deviceInfo = { platform: 'test' };
      (ErrorReporting as any).isOnline = true;
    });

    it('should queue errors when offline', () => {
      // Set service to offline
      (ErrorReporting as any).isOnline = false;
      
      const queueSpy = jest.spyOn((ErrorReporting as any), 'queueError')
        .mockImplementation(() => {});
      
      ErrorReporting.logError('Offline error');
      
      expect(queueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Offline error'
        })
      );
      
      queueSpy.mockRestore();
    });

    it('should send errors when online', () => {
      const sendSpy = jest.spyOn((ErrorReporting as any), 'sendError')
        .mockImplementation(() => Promise.resolve());
      
      ErrorReporting.logError('Online error');
      
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Online error'
        })
      );
      
      sendSpy.mockRestore();
    });

    it('should handle send errors by queueing', async () => {
      const sendSpy = jest.spyOn((ErrorReporting as any), 'sendError')
        .mockImplementation(() => Promise.reject(new Error('Send failed')));
      
      const queueSpy = jest.spyOn((ErrorReporting as any), 'queueError')
        .mockImplementation(() => {});
      
      // This should attempt to send, fail, and then queue
      await (ErrorReporting as any).sendError({ message: 'Test error' });
      
      expect(queueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error'
        })
      );
      
      sendSpy.mockRestore();
      queueSpy.mockRestore();
    });
  });

  describe('queue management', () => {
    beforeEach(async () => {
      // Ensure service is initialized
      (ErrorReporting as any).isInitialized = true;
      (ErrorReporting as any).deviceInfo = { platform: 'test' };
    });

    it('should add errors to queue', () => {
      // Reset queue
      (ErrorReporting as any).errorQueue = [];
      
      const saveSpy = jest.spyOn((ErrorReporting as any), 'saveQueuedErrors')
        .mockImplementation(() => Promise.resolve());
      
      (ErrorReporting as any).queueError({ message: 'Queued error' });
      
      expect((ErrorReporting as any).errorQueue).toHaveLength(1);
      expect((ErrorReporting as any).errorQueue[0].message).toBe('Queued error');
      expect(saveSpy).toHaveBeenCalled();
      
      saveSpy.mockRestore();
    });

    it('should limit queue size', () => {
      // Reset queue and set max size
      (ErrorReporting as any).errorQueue = [];
      (ErrorReporting as any).MAX_QUEUE_SIZE = 2;
      
      const saveSpy = jest.spyOn((ErrorReporting as any), 'saveQueuedErrors')
        .mockImplementation(() => Promise.resolve());
      
      // Add 3 errors to queue
      (ErrorReporting as any).queueError({ id: '1', message: 'Error 1' });
      (ErrorReporting as any).queueError({ id: '2', message: 'Error 2' });
      (ErrorReporting as any).queueError({ id: '3', message: 'Error 3' });
      
      // Queue should be limited to 2 items
      expect((ErrorReporting as any).errorQueue).toHaveLength(2);
      
      // Should contain the most recent errors
      expect((ErrorReporting as any).errorQueue[0].id).toBe('2');
      expect((ErrorReporting as any).errorQueue[1].id).toBe('3');
      
      saveSpy.mockRestore();
    });

    it('should save queued errors to storage', async () => {
      // Reset queue
      (ErrorReporting as any).errorQueue = [
        { id: '1', message: 'Error 1' },
        { id: '2', message: 'Error 2' }
      ];
      
      await (ErrorReporting as any).saveQueuedErrors();
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@fieldscore_error_queue',
        JSON.stringify((ErrorReporting as any).errorQueue)
      );
    });

    it('should load queued errors from storage', async () => {
      // Mock stored queue
      const mockQueue = [
        { id: '1', message: 'Stored Error 1' },
        { id: '2', message: 'Stored Error 2' }
      ];
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockQueue));
      
      await (ErrorReporting as any).loadQueuedErrors();
      
      expect((ErrorReporting as any).errorQueue).toEqual(mockQueue);
    });
  });

  describe('user identification', () => {
    it('should set user ID', () => {
      ErrorReporting.setUserId('test-user-123');
      expect((ErrorReporting as any).userId).toBe('test-user-123');
    });

    it('should include user ID in error logs', () => {
      // Set user ID
      ErrorReporting.setUserId('test-user-123');
      
      const sendSpy = jest.spyOn((ErrorReporting as any), 'sendError')
        .mockImplementation(() => Promise.resolve());
      
      ErrorReporting.logError('Error with user ID');
      
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userInfo: { userId: 'test-user-123' }
        })
      );
      
      sendSpy.mockRestore();
    });
  });
});
