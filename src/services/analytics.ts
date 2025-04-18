/**
 * Analytics Service
 * 
 * A lightweight analytics solution for tracking user behavior and app performance.
 * This implementation uses a simple event-based approach that can be connected to
 * various analytics providers (Firebase, Amplitude, etc.) in the future.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

// Analytics event types
export enum EventType {
  SCREEN_VIEW = 'screen_view',
  USER_ACTION = 'user_action',
  FORM_SUBMISSION = 'form_submission',
  API_REQUEST = 'api_request',
  ERROR = 'error',
  PERFORMANCE = 'performance',
  SYNC = 'sync'
}

// Analytics event interface
export interface AnalyticsEvent {
  type: EventType;
  name: string;
  timestamp: number;
  properties?: Record<string, any>;
}

// Queue for storing events when offline
const ANALYTICS_QUEUE_KEY = '@fieldscore_analytics_queue';

/**
 * Analytics Service for tracking user behavior and app performance
 */
class AnalyticsService {
  private isInitialized: boolean = false;
  private userId: string | null = null;
  private sessionId: string = '';
  private deviceInfo: Record<string, any> = {};
  private eventQueue: AnalyticsEvent[] = [];
  private MAX_QUEUE_SIZE = 100;
  private isOnline: boolean = true;

  /**
   * Initialize the analytics service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Generate a session ID
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Collect device information
      this.deviceInfo = await this.collectDeviceInfo();
      
      // Load queued events from storage
      await this.loadQueuedEvents();
      
      // Set up network listener
      NetInfo.addEventListener(state => {
        this.isOnline = state.isConnected ?? false;
        
        // If we're back online, try to send queued events
        if (this.isOnline && this.eventQueue.length > 0) {
          this.sendQueuedEvents();
        }
      });
      
      this.isInitialized = true;
      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
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
   * Track a screen view
   * @param screenName Name of the screen
   * @param properties Additional properties
   */
  trackScreen(screenName: string, properties: Record<string, any> = {}): void {
    this.trackEvent(EventType.SCREEN_VIEW, screenName, properties);
  }

  /**
   * Track a user action
   * @param actionName Name of the action
   * @param properties Additional properties
   */
  trackAction(actionName: string, properties: Record<string, any> = {}): void {
    this.trackEvent(EventType.USER_ACTION, actionName, properties);
  }

  /**
   * Track a form submission
   * @param formName Name of the form
   * @param properties Additional properties
   */
  trackFormSubmission(formName: string, properties: Record<string, any> = {}): void {
    this.trackEvent(EventType.FORM_SUBMISSION, formName, properties);
  }

  /**
   * Track an API request
   * @param endpoint API endpoint
   * @param properties Additional properties
   */
  trackApiRequest(endpoint: string, properties: Record<string, any> = {}): void {
    this.trackEvent(EventType.API_REQUEST, endpoint, properties);
  }

  /**
   * Track an error
   * @param errorName Name or type of error
   * @param properties Additional properties
   */
  trackError(errorName: string, properties: Record<string, any> = {}): void {
    this.trackEvent(EventType.ERROR, errorName, properties);
  }

  /**
   * Track a performance metric
   * @param metricName Name of the metric
   * @param properties Additional properties
   */
  trackPerformance(metricName: string, properties: Record<string, any> = {}): void {
    this.trackEvent(EventType.PERFORMANCE, metricName, properties);
  }

  /**
   * Track a sync event
   * @param syncAction Sync action (e.g., 'start', 'complete', 'fail')
   * @param properties Additional properties
   */
  trackSync(syncAction: string, properties: Record<string, any> = {}): void {
    this.trackEvent(EventType.SYNC, syncAction, properties);
  }

  /**
   * Track an event
   * @param type Event type
   * @param name Event name
   * @param properties Additional properties
   */
  private trackEvent(type: EventType, name: string, properties: Record<string, any> = {}): void {
    if (!this.isInitialized) {
      this.initialize().then(() => this.trackEvent(type, name, properties));
      return;
    }

    const event: AnalyticsEvent = {
      type,
      name,
      timestamp: Date.now(),
      properties: {
        ...properties,
        userId: this.userId,
        sessionId: this.sessionId,
        ...this.deviceInfo
      }
    };

    // In a real implementation, we would send this to an analytics service
    // For now, we'll just log it and queue it if offline
    console.log('Analytics event:', event);
    
    if (this.isOnline) {
      this.sendEvent(event);
    } else {
      this.queueEvent(event);
    }
  }

  /**
   * Send an event to the analytics service
   * @param event Analytics event
   */
  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // In a real implementation, this would send the event to an analytics service
      // For now, we'll just simulate a successful send
      console.log('Sending analytics event:', event);
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to send analytics event:', error);
      // If sending fails, queue the event for later
      this.queueEvent(event);
      return Promise.reject(error);
    }
  }

  /**
   * Queue an event for later sending
   * @param event Analytics event
   */
  private queueEvent(event: AnalyticsEvent): void {
    // Add to queue
    this.eventQueue.push(event);
    
    // Trim queue if it gets too large
    if (this.eventQueue.length > this.MAX_QUEUE_SIZE) {
      this.eventQueue = this.eventQueue.slice(-this.MAX_QUEUE_SIZE);
    }
    
    // Save queue to storage
    this.saveQueuedEvents();
  }

  /**
   * Save queued events to storage
   */
  private async saveQueuedEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Failed to save queued analytics events:', error);
    }
  }

  /**
   * Load queued events from storage
   */
  private async loadQueuedEvents(): Promise<void> {
    try {
      const queuedEvents = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
      if (queuedEvents) {
        this.eventQueue = JSON.parse(queuedEvents);
      }
    } catch (error) {
      console.error('Failed to load queued analytics events:', error);
    }
  }

  /**
   * Send queued events to the analytics service
   */
  private async sendQueuedEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      // Clone the queue
      const eventsToSend = [...this.eventQueue];
      
      // Clear the queue
      this.eventQueue = [];
      await this.saveQueuedEvents();
      
      // Send each event
      for (const event of eventsToSend) {
        await this.sendEvent(event);
      }
    } catch (error) {
      console.error('Failed to send queued analytics events:', error);
    }
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
      console.error('Failed to collect device info:', error);
      return {
        platform: Platform.OS,
        platformVersion: Platform.Version
      };
    }
  }
}

// Export a singleton instance
export const Analytics = new AnalyticsService();

// Initialize analytics on import
Analytics.initialize();

export default Analytics;
