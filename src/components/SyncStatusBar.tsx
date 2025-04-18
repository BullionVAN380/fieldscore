import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useApp } from '../hooks/useApp';

interface SyncStatusBarProps {
  onPress?: () => void;
}

const SyncStatusBar: React.FC<SyncStatusBarProps> = ({ onPress }) => {
  const { 
    isOnline, 
    syncStatus, 
    syncPendingRegistrations, 
    isSyncing 
  } = useApp();
  
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never');
  
  useEffect(() => {
    if (syncStatus.lastSuccessfulSync) {
      const date = new Date(syncStatus.lastSuccessfulSync);
      setLastSyncTime(date.toLocaleTimeString());
    }
  }, [syncStatus.lastSuccessfulSync]);
  
  const handleSyncPress = async () => {
    if (onPress) {
      onPress();
    } else {
      await syncPendingRegistrations();
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
      
      <View style={styles.syncInfoContainer}>
        <Text style={styles.syncInfoText}>
          {syncStatus.pendingItems > 0 ? 
            `${syncStatus.pendingItems} item${syncStatus.pendingItems !== 1 ? 's' : ''} pending` : 
            'All data synced'}
        </Text>
        <Text style={styles.lastSyncText}>
          Last sync: {lastSyncTime}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.syncButton, 
          (!isOnline || isSyncing) && styles.syncButtonDisabled
        ]} 
        onPress={handleSyncPress}
        disabled={!isOnline || isSyncing}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.syncButtonText}>Sync Now</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  syncInfoContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  syncInfoText: {
    fontSize: 14,
    color: '#555',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#777',
  },
  syncButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SyncStatusBar;
