import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { FarmerDetails } from '../types';
import { StorageService } from '../services/storage';
import { SyncManager } from '../services/syncManager';
import { SyncQueueService, SyncItem, SyncStats } from '../services/syncQueue';
import { Alert } from 'react-native';

interface AppContextType {
  isOnline: boolean;
  pendingRegistrations: FarmerDetails[];
  syncStatus: {
    pendingItems: number;
    failedItems: number;
    totalItems: number;
    lastSyncAttempt: number | null;
    lastSuccessfulSync: number | null;
    isRunning: boolean;
  };
  syncItems: SyncItem[];
  syncPendingRegistrations: () => Promise<boolean>;
  clearFailedItems: () => Promise<void>;
  retryFailedItems: () => Promise<boolean>;
  getSyncStats: () => Promise<SyncStats>;
  isSyncing: boolean;
}

export const AppContext = createContext<AppContextType>({
  isOnline: true,
  pendingRegistrations: [],
  syncStatus: {
    pendingItems: 0,
    failedItems: 0,
    totalItems: 0,
    lastSyncAttempt: null,
    lastSuccessfulSync: null,
    isRunning: false
  },
  syncItems: [],
  syncPendingRegistrations: async () => false,
  clearFailedItems: async () => {},
  retryFailedItems: async () => false,
  getSyncStats: async () => ({
    totalItems: 0,
    pendingItems: 0,
    failedItems: 0,
    successItems: 0,
    processingItems: 0,
    lastSyncAttempt: null,
    lastSuccessfulSync: null
  }),
  isSyncing: false
});

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingRegistrations, setPendingRegistrations] = useState<FarmerDetails[]>([]);
  const [syncItems, setSyncItems] = useState<SyncItem[]>([]);
  const [syncStatus, setSyncStatus] = useState({
    pendingItems: 0,
    failedItems: 0,
    totalItems: 0,
    lastSyncAttempt: null as number | null,
    lastSuccessfulSync: null as number | null,
    isRunning: false
  });
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Initialize the sync manager
  useEffect(() => {
    const syncManager = SyncManager.getInstance();
    
    // Initialize the sync manager with callbacks
    syncManager.initialize(
      // Status change callback
      (status) => {
        setIsSyncing(status === 'syncing');
        
        if (status === 'completed') {
          refreshSyncStatus();
          loadSyncItems();
        }
      },
      // Progress callback
      (progress) => {
        console.log(`Sync progress: ${progress.completed}/${progress.total} (${progress.failed} failed)`);
      }
    );
    
    // Migrate any existing data to the new sync queue
    StorageService.migrateToSyncQueue().then(count => {
      if (count > 0) {
        console.log(`Migrated ${count} items to the sync queue`);
        refreshSyncStatus();
        loadSyncItems();
      }
    });
    
    // Clean up on unmount
    return () => {
      syncManager.dispose();
    };
  }, []);

  useEffect(() => {
    // Check initial network state
    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected ?? false;
      setIsOnline(isConnected);
      
      // If we're online, try to sync
      if (isConnected) {
        SyncManager.getInstance().attemptSync();
      }
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;
      setIsOnline(isConnected);
      
      // If we just came online, try to sync
      if (isConnected) {
        SyncManager.getInstance().attemptSync();
      }
    });

    // Load initial data
    loadPendingRegistrations();
    refreshSyncStatus();
    loadSyncItems();

    return () => {
      unsubscribe();
    };
  }, []);

  // Refresh the sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSyncStatus();
      loadSyncItems();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadPendingRegistrations = async () => {
    try {
      // Load from both the old system and the new sync queue
      const oldRegistrations = await StorageService.getPendingRegistrations();
      const newRegistrations = await StorageService.getAllFarmerData();
      
      // Combine and deduplicate
      const allRegistrations = [...oldRegistrations, ...newRegistrations];
      const uniqueRegistrations = allRegistrations.filter((item, index, self) => 
        index === self.findIndex(t => t.nationalId === item.nationalId)
      );
      
      setPendingRegistrations(uniqueRegistrations);
    } catch (error) {
      console.error('Error loading pending registrations:', error);
    }
  };

  const loadSyncItems = async () => {
    try {
      const items = await SyncQueueService.getQueue();
      setSyncItems(items);
    } catch (error) {
      console.error('Error loading sync items:', error);
    }
  };

  const refreshSyncStatus = async () => {
    try {
      const status = await SyncManager.getInstance().getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error refreshing sync status:', error);
    }
  };

  const syncPendingRegistrations = async (): Promise<boolean> => {
    if (!isOnline) {
      Alert.alert('Offline', 'You are currently offline. Please check your internet connection.');
      return false;
    }

    try {
      setIsSyncing(true);
      const result = await SyncManager.getInstance().forceSync();
      
      // Refresh data after sync
      await refreshSyncStatus();
      await loadSyncItems();
      await loadPendingRegistrations();
      
      setIsSyncing(false);
      
      if (result) {
        Alert.alert('Sync Complete', 'Your data has been successfully synchronized with the server.');
      } else {
        Alert.alert('Sync Failed', 'Some items failed to sync. Please try again later.');
      }
      
      return result;
    } catch (error) {
      setIsSyncing(false);
      console.error('Error syncing registrations:', error);
      Alert.alert('Sync Error', 'An error occurred while trying to sync your data.');
      return false;
    }
  };

  const clearFailedItems = async (): Promise<void> => {
    try {
      await SyncManager.getInstance().clearFailedItems();
      await refreshSyncStatus();
      await loadSyncItems();
      await loadPendingRegistrations();
      
      Alert.alert('Cleared', 'Failed items have been cleared from the queue.');
    } catch (error) {
      console.error('Error clearing failed items:', error);
      Alert.alert('Error', 'An error occurred while trying to clear failed items.');
    }
  };

  const retryFailedItems = async (): Promise<boolean> => {
    if (!isOnline) {
      Alert.alert('Offline', 'You are currently offline. Please check your internet connection.');
      return false;
    }

    try {
      setIsSyncing(true);
      const result = await SyncManager.getInstance().forceSync();
      
      // Refresh data after sync
      await refreshSyncStatus();
      await loadSyncItems();
      
      setIsSyncing(false);
      return result;
    } catch (error) {
      setIsSyncing(false);
      console.error('Error retrying failed items:', error);
      return false;
    }
  };

  const getSyncStats = async (): Promise<SyncStats> => {
    return SyncQueueService.getStats();
  };

  return (
    <AppContext.Provider
      value={{
        isOnline,
        pendingRegistrations,
        syncStatus,
        syncItems,
        syncPendingRegistrations,
        clearFailedItems,
        retryFailedItems,
        getSyncStats,
        isSyncing
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
