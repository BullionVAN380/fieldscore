import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { FarmerDetails } from '../types';
import { StorageService } from '../services/storage';

interface AppContextType {
  isOnline: boolean;
  pendingRegistrations: FarmerDetails[];
  syncPendingRegistrations: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  isOnline: true,
  pendingRegistrations: [],
  syncPendingRegistrations: async () => {},
});

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingRegistrations, setPendingRegistrations] = useState<FarmerDetails[]>(
    []
  );

  useEffect(() => {
    // Check initial network state
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? false);
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    loadPendingRegistrations();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadPendingRegistrations = async () => {
    const registrations = await StorageService.getPendingRegistrations();
    setPendingRegistrations(registrations);
  };

  const syncPendingRegistrations = async () => {
    if (!isOnline) return;

    try {
      // TODO: Implement syncing with backend
      await StorageService.clearPendingRegistrations();
      setPendingRegistrations([]);
    } catch (error) {
      console.error('Error syncing registrations:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isOnline,
        pendingRegistrations,
        syncPendingRegistrations,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
