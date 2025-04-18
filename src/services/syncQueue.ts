import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { FarmerDetails } from '../types';

export interface SyncItem {
  id: string;
  data: FarmerDetails;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'success';
  lastError?: string;
}

export interface SyncStats {
  totalItems: number;
  pendingItems: number;
  failedItems: number;
  successItems: number;
  processingItems: number;
  lastSyncAttempt: number | null;
  lastSuccessfulSync: number | null;
}

export class SyncQueueService {
  private static readonly SYNC_QUEUE_KEY = 'syncQueue';
  private static readonly SYNC_STATS_KEY = 'syncStats';
  private static readonly MAX_RETRY_COUNT = 5;
  private static readonly RETRY_DELAY_MS = 60000; // 1 minute between retries

  /**
   * Add a new item to the sync queue
   */
  static async addToQueue(data: FarmerDetails): Promise<string> {
    try {
      const queue = await this.getQueue();
      
      // Generate a unique ID for this queue item
      const id = `farmer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create the queue item
      const queueItem: SyncItem = {
        id,
        data,
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending'
      };
      
      // Add to queue
      queue.push(queueItem);
      
      // Save updated queue
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
      
      // Update stats
      await this.updateStats();
      
      return id;
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  }

  /**
   * Get the current sync queue
   */
  static async getQueue(): Promise<SyncItem[]> {
    try {
      const data = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Update an item in the queue
   */
  static async updateQueueItem(id: string, updates: Partial<SyncItem>): Promise<boolean> {
    try {
      const queue = await this.getQueue();
      const index = queue.findIndex(item => item.id === id);
      
      if (index === -1) {
        return false;
      }
      
      // Update the item
      queue[index] = {
        ...queue[index],
        ...updates
      };
      
      // Save updated queue
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
      
      // Update stats
      await this.updateStats();
      
      return true;
    } catch (error) {
      console.error('Error updating queue item:', error);
      return false;
    }
  }

  /**
   * Remove an item from the queue
   */
  static async removeFromQueue(id: string): Promise<boolean> {
    try {
      const queue = await this.getQueue();
      const newQueue = queue.filter(item => item.id !== id);
      
      if (newQueue.length === queue.length) {
        return false; // Item not found
      }
      
      // Save updated queue
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(newQueue));
      
      // Update stats
      await this.updateStats();
      
      return true;
    } catch (error) {
      console.error('Error removing from sync queue:', error);
      return false;
    }
  }

  /**
   * Clear the entire sync queue
   */
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SYNC_QUEUE_KEY);
      await this.resetStats();
    } catch (error) {
      console.error('Error clearing sync queue:', error);
      throw error;
    }
  }

  /**
   * Get the current sync statistics
   */
  static async getStats(): Promise<SyncStats> {
    try {
      const data = await AsyncStorage.getItem(this.SYNC_STATS_KEY);
      const defaultStats: SyncStats = {
        totalItems: 0,
        pendingItems: 0,
        failedItems: 0,
        successItems: 0,
        processingItems: 0,
        lastSyncAttempt: null,
        lastSuccessfulSync: null
      };
      
      return data ? JSON.parse(data) : defaultStats;
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return {
        totalItems: 0,
        pendingItems: 0,
        failedItems: 0,
        successItems: 0,
        processingItems: 0,
        lastSyncAttempt: null,
        lastSuccessfulSync: null
      };
    }
  }

  /**
   * Update the sync statistics based on the current queue
   */
  static async updateStats(): Promise<void> {
    try {
      const queue = await this.getQueue();
      const stats = await this.getStats();
      
      stats.totalItems = queue.length;
      stats.pendingItems = queue.filter(item => item.status === 'pending').length;
      stats.failedItems = queue.filter(item => item.status === 'failed').length;
      stats.successItems = queue.filter(item => item.status === 'success').length;
      stats.processingItems = queue.filter(item => item.status === 'processing').length;
      
      await AsyncStorage.setItem(this.SYNC_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating sync stats:', error);
    }
  }

  /**
   * Reset the sync statistics
   */
  static async resetStats(): Promise<void> {
    try {
      const defaultStats: SyncStats = {
        totalItems: 0,
        pendingItems: 0,
        failedItems: 0,
        successItems: 0,
        processingItems: 0,
        lastSyncAttempt: null,
        lastSuccessfulSync: null
      };
      
      await AsyncStorage.setItem(this.SYNC_STATS_KEY, JSON.stringify(defaultStats));
    } catch (error) {
      console.error('Error resetting sync stats:', error);
    }
  }

  /**
   * Check if there are items that need to be synced
   */
  static async hasPendingItems(): Promise<boolean> {
    try {
      const queue = await this.getQueue();
      return queue.some(item => item.status === 'pending' || item.status === 'failed');
    } catch (error) {
      console.error('Error checking for pending items:', error);
      return false;
    }
  }

  /**
   * Check if the device is currently online
   */
  static async isOnline(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected === true;
    } catch (error) {
      console.error('Error checking online status:', error);
      return false;
    }
  }

  /**
   * Update the timestamp of the last sync attempt
   */
  static async updateLastSyncAttempt(): Promise<void> {
    try {
      const stats = await this.getStats();
      stats.lastSyncAttempt = Date.now();
      await AsyncStorage.setItem(this.SYNC_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating last sync attempt:', error);
    }
  }

  /**
   * Update the timestamp of the last successful sync
   */
  static async updateLastSuccessfulSync(): Promise<void> {
    try {
      const stats = await this.getStats();
      stats.lastSuccessfulSync = Date.now();
      await AsyncStorage.setItem(this.SYNC_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating last successful sync:', error);
    }
  }

  /**
   * Get items that are ready to be retried
   */
  static async getItemsReadyForRetry(): Promise<SyncItem[]> {
    try {
      const queue = await this.getQueue();
      const now = Date.now();
      
      return queue.filter(item => {
        // Include items that are pending
        if (item.status === 'pending') {
          return true;
        }
        
        // Include failed items that have not exceeded max retry count and are past the retry delay
        if (item.status === 'failed' && 
            item.retryCount < this.MAX_RETRY_COUNT && 
            (now - item.timestamp) > this.RETRY_DELAY_MS * Math.pow(2, item.retryCount)) {
          return true;
        }
        
        return false;
      });
    } catch (error) {
      console.error('Error getting items ready for retry:', error);
      return [];
    }
  }

  /**
   * Should we attempt a sync now?
   */
  static async shouldAttemptSync(): Promise<boolean> {
    try {
      // Check if we're online
      const online = await this.isOnline();
      if (!online) {
        return false;
      }
      
      // Check if we have items to sync
      const hasItems = await this.hasPendingItems();
      if (!hasItems) {
        return false;
      }
      
      // Check when we last attempted a sync
      const stats = await this.getStats();
      const now = Date.now();
      
      // If we've never attempted a sync, or it's been more than 1 minute since the last attempt
      if (!stats.lastSyncAttempt || (now - stats.lastSyncAttempt) > 60000) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error determining if sync should be attempted:', error);
      return false;
    }
  }
}
