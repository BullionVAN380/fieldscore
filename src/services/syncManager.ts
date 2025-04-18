import { ApiService } from './api';
import { SyncQueueService, SyncItem } from './syncQueue';
import NetInfo from '@react-native-community/netinfo';

export class SyncManager {
  private static instance: SyncManager;
  private isRunning: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private networkUnsubscribe: (() => void) | null = null;
  private onSyncStatusChange: ((status: 'idle' | 'syncing' | 'completed' | 'failed') => void) | null = null;
  private onSyncProgress: ((progress: { total: number; completed: number; failed: number }) => void) | null = null;

  private constructor() {
    // Private constructor to enforce singleton
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize the sync manager
   */
  public initialize(
    onSyncStatusChange?: (status: 'idle' | 'syncing' | 'completed' | 'failed') => void,
    onSyncProgress?: (progress: { total: number; completed: number; failed: number }) => void
  ): void {
    this.onSyncStatusChange = onSyncStatusChange || null;
    this.onSyncProgress = onSyncProgress || null;

    // Start listening for network changes
    this.startNetworkListener();

    // Start the periodic sync check
    this.startPeriodicSync();

    console.log('SyncManager initialized');
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }

    console.log('SyncManager disposed');
  }

  /**
   * Start listening for network changes
   */
  private startNetworkListener(): void {
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('Network connected, checking for pending items to sync');
        this.attemptSync();
      }
    });
  }

  /**
   * Start periodic sync check
   */
  private startPeriodicSync(): void {
    // Check every 5 minutes
    this.syncInterval = setInterval(() => {
      this.attemptSync();
    }, 5 * 60 * 1000);
  }

  /**
   * Attempt to sync pending items
   */
  public async attemptSync(forceSync: boolean = false): Promise<boolean> {
    // Don't run multiple sync processes at once
    if (this.isRunning) {
      console.log('Sync already in progress, skipping');
      return false;
    }

    try {
      this.isRunning = true;
      
      // Check if we should attempt a sync
      const shouldSync = forceSync || await SyncQueueService.shouldAttemptSync();
      if (!shouldSync) {
        console.log('No need to sync at this time');
        this.isRunning = false;
        return false;
      }

      // Update the last sync attempt timestamp
      await SyncQueueService.updateLastSyncAttempt();
      
      // Notify of sync start
      if (this.onSyncStatusChange) {
        this.onSyncStatusChange('syncing');
      }

      // Get items ready for retry
      const itemsToSync = await SyncQueueService.getItemsReadyForRetry();
      
      if (itemsToSync.length === 0) {
        console.log('No items to sync');
        if (this.onSyncStatusChange) {
          this.onSyncStatusChange('completed');
        }
        this.isRunning = false;
        return true;
      }

      console.log(`Starting sync of ${itemsToSync.length} items`);
      
      // Track progress
      let completed = 0;
      let failed = 0;
      const total = itemsToSync.length;
      
      // Process each item
      for (const item of itemsToSync) {
        try {
          // Mark item as processing
          await SyncQueueService.updateQueueItem(item.id, {
            status: 'processing',
            timestamp: Date.now()
          });
          
          // Attempt to sync with the server
          const result = await this.syncItem(item);
          
          if (result) {
            // Success - mark as completed
            await SyncQueueService.updateQueueItem(item.id, {
              status: 'success',
              timestamp: Date.now()
            });
            completed++;
          } else {
            // Failed - increment retry count
            await SyncQueueService.updateQueueItem(item.id, {
              status: 'failed',
              retryCount: item.retryCount + 1,
              timestamp: Date.now(),
              lastError: 'Sync failed'
            });
            failed++;
          }
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);
          
          // Update the item with the error
          await SyncQueueService.updateQueueItem(item.id, {
            status: 'failed',
            retryCount: item.retryCount + 1,
            timestamp: Date.now(),
            lastError: error instanceof Error ? error.message : 'Unknown error'
          });
          
          failed++;
        }
        
        // Report progress
        if (this.onSyncProgress) {
          this.onSyncProgress({
            total,
            completed,
            failed
          });
        }
      }

      // Update stats
      await SyncQueueService.updateStats();
      
      // If we had any successful syncs, update the last successful sync timestamp
      if (completed > 0) {
        await SyncQueueService.updateLastSuccessfulSync();
      }
      
      // Notify of sync completion
      if (this.onSyncStatusChange) {
        this.onSyncStatusChange(failed === total ? 'failed' : 'completed');
      }
      
      console.log(`Sync completed: ${completed} successful, ${failed} failed`);
      
      this.isRunning = false;
      return completed > 0;
    } catch (error) {
      console.error('Error during sync attempt:', error);
      
      // Notify of sync failure
      if (this.onSyncStatusChange) {
        this.onSyncStatusChange('failed');
      }
      
      this.isRunning = false;
      return false;
    }
  }

  /**
   * Sync a single item with the server
   */
  private async syncItem(item: SyncItem): Promise<boolean> {
    try {
      console.log(`Syncing item ${item.id}`);
      
      // Attempt to register the farmer with the server
      const response = await ApiService.registerFarmer(item.data);
      
      // Check if the response indicates success
      if (response && response.success) {
        console.log(`Successfully synced item ${item.id}`);
        return true;
      }
      
      console.log(`Failed to sync item ${item.id}: ${response?.message || 'Unknown error'}`);
      return false;
    } catch (error) {
      console.error(`Error syncing item ${item.id}:`, error);
      throw error;
    }
  }

  /**
   * Force a sync attempt
   */
  public async forceSync(): Promise<boolean> {
    return this.attemptSync(true);
  }

  /**
   * Get the current sync status
   */
  public async getSyncStatus(): Promise<{
    pendingItems: number;
    failedItems: number;
    totalItems: number;
    lastSyncAttempt: number | null;
    lastSuccessfulSync: number | null;
    isRunning: boolean;
  }> {
    const stats = await SyncQueueService.getStats();
    
    return {
      pendingItems: stats.pendingItems,
      failedItems: stats.failedItems,
      totalItems: stats.totalItems,
      lastSyncAttempt: stats.lastSyncAttempt,
      lastSuccessfulSync: stats.lastSuccessfulSync,
      isRunning: this.isRunning
    };
  }

  /**
   * Clear all failed items from the queue
   */
  public async clearFailedItems(): Promise<void> {
    try {
      const queue = await SyncQueueService.getQueue();
      
      // Find all failed items
      const failedItems = queue.filter(item => 
        item.status === 'failed' && item.retryCount >= 5
      );
      
      // Remove each failed item
      for (const item of failedItems) {
        await SyncQueueService.removeFromQueue(item.id);
      }
      
      console.log(`Cleared ${failedItems.length} failed items from the queue`);
    } catch (error) {
      console.error('Error clearing failed items:', error);
      throw error;
    }
  }

  /**
   * Get all items in the queue
   */
  public async getQueueItems(): Promise<SyncItem[]> {
    return SyncQueueService.getQueue();
  }
}
