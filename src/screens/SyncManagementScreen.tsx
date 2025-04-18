import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../hooks/useApp';
import { SyncItem } from '../services/syncQueue';

const formatDate = (timestamp: number | null) => {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

const SyncItemRow: React.FC<{ item: SyncItem }> = ({ item }) => {
  const getStatusColor = () => {
    switch (item.status) {
      case 'pending': return '#FFC107'; // Amber
      case 'processing': return '#2196F3'; // Blue
      case 'success': return '#4CAF50'; // Green
      case 'failed': return '#F44336'; // Red
      default: return '#9E9E9E'; // Grey
    }
  };

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.itemTitle}>
          {item.data.name} - {item.data.nationalId}
        </Text>
        <Text style={styles.itemStatus}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemDetailText}>
          Crop: {item.data.crop} | Acres: {item.data.acres}
        </Text>
        <Text style={styles.itemDetailText}>
          Premium: KES {item.data.premium.toLocaleString()}
        </Text>
        {item.status === 'failed' && (
          <Text style={styles.errorText}>
            Error: {item.lastError || 'Unknown error'}
          </Text>
        )}
        <Text style={styles.timestampText}>
          Last updated: {formatDate(item.timestamp)}
        </Text>
        {item.retryCount > 0 && (
          <Text style={styles.retryText}>
            Retry attempts: {item.retryCount}
          </Text>
        )}
      </View>
    </View>
  );
};

type RootStackParamList = {
  FarmerRegistration: undefined;
  SyncManagement: undefined;
};

type SyncManagementScreenProps = NativeStackScreenProps<RootStackParamList, 'SyncManagement'>;

const SyncManagementScreen: React.FC<SyncManagementScreenProps> = ({ navigation }) => {
  const { 
    isOnline, 
    syncItems, 
    syncStatus, 
    syncPendingRegistrations, 
    clearFailedItems, 
    retryFailedItems,
    isSyncing
  } = useApp();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  // Memoize filtered items to avoid unnecessary recalculations
  const filteredItems = useMemo(() => {
    console.log('Filtering sync items...');
    return filterStatus 
      ? syncItems.filter(item => item.status === filterStatus)
      : syncItems;
  }, [syncItems, filterStatus]);
    
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncPendingRegistrations();
    setRefreshing(false);
  }, [syncPendingRegistrations]);
  
  const handleClearFailed = useCallback(() => {
    Alert.alert(
      'Clear Failed Items',
      'Are you sure you want to clear all failed items? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: clearFailedItems
        }
      ]
    );
  }, [clearFailedItems]);
  
  const handleRetryFailed = useCallback(async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'You are currently offline. Please check your internet connection.');
      return;
    }
    
    await retryFailedItems();
  }, [isOnline, retryFailedItems]);
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No sync items to display</Text>
      {filterStatus && (
        <TouchableOpacity onPress={() => setFilterStatus(null)}>
          <Text style={styles.clearFilterText}>Clear filter</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sync Management</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.connectionIndicator, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.connectionStatus}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{syncStatus.totalItems}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{syncStatus.pendingItems}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{syncStatus.failedItems}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>
      
      <View style={styles.syncInfoContainer}>
        <Text style={styles.syncInfoText}>
          Last sync attempt: {formatDate(syncStatus.lastSyncAttempt)}
        </Text>
        <Text style={styles.syncInfoText}>
          Last successful sync: {formatDate(syncStatus.lastSuccessfulSync)}
        </Text>
      </View>
      
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === null && styles.filterButtonActive]} 
          onPress={() => setFilterStatus(null)}
        >
          <Text style={[styles.filterButtonText, filterStatus === null && styles.filterButtonTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'pending' && styles.filterButtonActive]} 
          onPress={() => setFilterStatus('pending')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'pending' && styles.filterButtonTextActive]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'processing' && styles.filterButtonActive]} 
          onPress={() => setFilterStatus('processing')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'processing' && styles.filterButtonTextActive]}>Processing</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'success' && styles.filterButtonActive]} 
          onPress={() => setFilterStatus('success')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'success' && styles.filterButtonTextActive]}>Success</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'failed' && styles.filterButtonActive]} 
          onPress={() => setFilterStatus('failed')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'failed' && styles.filterButtonTextActive]}>Failed</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => <SyncItemRow item={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2E7D32']}
            tintColor="#2E7D32"
          />
        }
      />
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.syncButton, (isSyncing || !isOnline) && styles.actionButtonDisabled]} 
          onPress={syncPendingRegistrations}
          disabled={isSyncing || !isOnline}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionButtonText}>Sync Now</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.retryButton, (isSyncing || !isOnline || syncStatus.failedItems === 0) && styles.actionButtonDisabled]} 
          onPress={handleRetryFailed}
          disabled={isSyncing || !isOnline || syncStatus.failedItems === 0}
        >
          <Text style={styles.actionButtonText}>Retry Failed</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.clearButton, syncStatus.failedItems === 0 && styles.actionButtonDisabled]} 
          onPress={handleClearFailed}
          disabled={syncStatus.failedItems === 0}
        >
          <Text style={styles.actionButtonText}>Clear Failed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  connectionStatus: {
    fontSize: 14,
    color: '#333333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
  },
  syncInfoContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  syncInfoText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#2E7D32',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#757575',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 8,
    paddingBottom: 80, // Extra padding at the bottom for the action buttons
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 8,
  },
  clearFilterText: {
    fontSize: 14,
    color: '#2E7D32',
    textDecorationLine: 'underline',
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  itemStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemDetails: {
    marginLeft: 20,
  },
  itemDetailText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
  },
  timestampText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  retryText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  syncButton: {
    backgroundColor: '#2E7D32',
  },
  retryButton: {
    backgroundColor: '#FFC107',
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default SyncManagementScreen;
