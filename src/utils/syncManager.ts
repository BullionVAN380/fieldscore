import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import { ApiService } from '../services/api';

// Sync item types
export enum SyncItemType {
  FARMER_REGISTRATION = 'FARMER_REGISTRATION',
  PAYMENT = 'PAYMENT',
  CLAIM = 'CLAIM'
}

// Sync item status
export enum SyncStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

// Sync item interface
export interface SyncItem {
  id: string;
  type: SyncItemType;
  data: any;
  status: SyncStatus;
  createdAt: string;
  lastAttempt?: string;
  errorMessage?: string;
  retryCount: number;
}

// Keys for storage
const SYNC_QUEUE_KEY = '@fieldscore:sync_queue';
const SYNC_STATS_KEY = '@fieldscore:sync_stats';
const LAST_SYNC_KEY = '@fieldscore:last_sync';

// Stats interface
interface SyncStats {
  total: number;
  pending: number;
  processing: number;
  success: number;
  failed: number;
  lastSyncAttempt: string | null;
  lastSuccessfulSync: string | null;
}

// Initial stats
const initialStats: SyncStats = {
  total: 0,
  pending: 0,
  processing: 0,
  success: 0,
  failed: 0,
  lastSyncAttempt: null,
  lastSuccessfulSync: null
};

/**
 * SyncManager class to handle offline data synchronization
 */
class SyncManager {
  // Add an item to the sync queue
  async addToQueue(type: SyncItemType, data: any): Promise<string> {
    try {
      // Generate a unique ID
      const id = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create sync item
      const syncItem: SyncItem = {
        id,
        type,
        data,
        status: SyncStatus.PENDING,
        createdAt: new Date().toISOString(),
        retryCount: 0
      };
      
      // Get current queue
      const queue = await this.getQueue();
      
      // Add item to queue
      queue.push(syncItem);
      
      // Save updated queue
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      
      // Update stats
      await this.updateStats();
      
      console.log(`Added item to sync queue: ${id}`);
      return id;
    } catch (error) {
      console.error('Error adding item to sync queue:', error);
      throw error;
    }
  }
  
  // Get the current sync queue
  async getQueue(): Promise<SyncItem[]> {
    try {
      const queueString = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return queueString ? JSON.parse(queueString) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }
  
  // Get sync stats
  async getStats(): Promise<SyncStats> {
    try {
      const statsString = await AsyncStorage.getItem(SYNC_STATS_KEY);
      return statsString ? JSON.parse(statsString) : initialStats;
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return initialStats;
    }
  }
  
  // Update sync stats based on current queue
  async updateStats(): Promise<SyncStats> {
    try {
      const queue = await this.getQueue();
      
      const stats: SyncStats = {
        total: queue.length,
        pending: queue.filter(item => item.status === SyncStatus.PENDING).length,
        processing: queue.filter(item => item.status === SyncStatus.PROCESSING).length,
        success: queue.filter(item => item.status === SyncStatus.SUCCESS).length,
        failed: queue.filter(item => item.status === SyncStatus.FAILED).length,
        lastSyncAttempt: await AsyncStorage.getItem(LAST_SYNC_KEY),
        lastSuccessfulSync: null // Will be updated during sync process
      };
      
      await AsyncStorage.setItem(SYNC_STATS_KEY, JSON.stringify(stats));
      return stats;
    } catch (error) {
      console.error('Error updating sync stats:', error);
      return initialStats;
    }
  }
  
  // Sync all pending items
  async syncAll(): Promise<{success: boolean, message: string}> {
    try {
      // Update last sync attempt timestamp
      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_SYNC_KEY, now);
      
      // Get current queue
      const queue = await this.getQueue();
      
      // Filter pending items
      const pendingItems = queue.filter(item => item.status === SyncStatus.PENDING);
      
      if (pendingItems.length === 0) {
        await this.updateStats();
        return { success: true, message: 'No pending items to sync' };
      }
      
      // Process each pending item
      let successCount = 0;
      let failCount = 0;
      
      for (const item of pendingItems) {
        try {
          // Update item status to processing
          item.status = SyncStatus.PROCESSING;
          item.lastAttempt = now;
          await this.updateItem(item);
          
          // Process based on item type
          let result;
          switch (item.type) {
            case SyncItemType.FARMER_REGISTRATION:
              result = await ApiService.post('/farmers', item.data);
              break;
            case SyncItemType.PAYMENT:
              result = await ApiService.post('/mpesa/stk-push', item.data);
              break;
            case SyncItemType.CLAIM:
              result = await ApiService.post('/claims', item.data);
              break;
            default:
              throw new Error(`Unknown sync item type: ${item.type}`);
          }
          
          // Update item status based on result
          if (result.data.success) {
            item.status = SyncStatus.SUCCESS;
            successCount++;
          } else {
            item.status = SyncStatus.FAILED;
            item.errorMessage = result.data.message || 'Unknown error';
            item.retryCount++;
            failCount++;
          }
        } catch (error) {
          // Handle error
          item.status = SyncStatus.FAILED;
          item.errorMessage = error instanceof Error ? error.message : 'Unknown error';
          item.retryCount++;
          failCount++;
        }
        
        // Update item in queue
        await this.updateItem(item);
      }
      
      // If any items were successful, update last successful sync
      if (successCount > 0) {
        await AsyncStorage.setItem('lastSuccessfulSync', now);
      }
      
      // Update stats
      await this.updateStats();
      
      return {
        success: true,
        message: `Sync completed. Success: ${successCount}, Failed: ${failCount}`
      };
    } catch (error) {
      console.error('Error syncing data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during sync'
      };
    }
  }
  
  // Retry failed items
  async retryFailed(): Promise<{success: boolean, message: string}> {
    try {
      // Get current queue
      const queue = await this.getQueue();
      
      // Filter failed items
      const failedItems = queue.filter(item => item.status === SyncStatus.FAILED);
      
      if (failedItems.length === 0) {
        return { success: true, message: 'No failed items to retry' };
      }
      
      // Reset failed items to pending
      for (const item of failedItems) {
        item.status = SyncStatus.PENDING;
        await this.updateItem(item);
      }
      
      // Update stats
      await this.updateStats();
      
      return {
        success: true,
        message: `${failedItems.length} failed items reset to pending`
      };
    } catch (error) {
      console.error('Error retrying failed items:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during retry'
      };
    }
  }
  
  // Clear all failed items
  async clearFailed(): Promise<{success: boolean, message: string}> {
    try {
      // Get current queue
      const queue = await this.getQueue();
      
      // Filter out failed items
      const updatedQueue = queue.filter(item => item.status !== SyncStatus.FAILED);
      
      // Save updated queue
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
      
      // Update stats
      await this.updateStats();
      
      return {
        success: true,
        message: `Cleared ${queue.length - updatedQueue.length} failed items`
      };
    } catch (error) {
      console.error('Error clearing failed items:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during clear'
      };
    }
  }
  
  // Update a specific item in the queue
  private async updateItem(updatedItem: SyncItem): Promise<void> {
    try {
      const queue = await this.getQueue();
      const index = queue.findIndex(item => item.id === updatedItem.id);
      
      if (index !== -1) {
        queue[index] = updatedItem;
        await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Error updating sync item:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
