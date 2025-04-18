import AsyncStorage from '@react-native-async-storage/async-storage';
import { FarmerDetails } from '../types';
import { SyncQueueService } from './syncQueue';

export class StorageService {
  private static readonly PENDING_REGISTRATIONS_KEY = 'pendingRegistrations';
  private static readonly APP_SETTINGS_KEY = 'appSettings';

  /**
   * Save farmer data and add to sync queue
   */
  static async saveFarmerData(data: FarmerDetails): Promise<string> {
    try {
      // Add to the sync queue first
      const queueItemId = await SyncQueueService.addToQueue(data);
      
      // Also maintain backward compatibility with the old system
      const existingData = await this.getPendingRegistrations();
      existingData.push(data);
      await AsyncStorage.setItem(
        this.PENDING_REGISTRATIONS_KEY,
        JSON.stringify(existingData)
      );
      
      return queueItemId;
    } catch (error) {
      console.error('Error saving farmer data:', error);
      throw error;
    }
  }

  /**
   * Get pending registrations (legacy method)
   */
  static async getPendingRegistrations(): Promise<FarmerDetails[]> {
    try {
      const data = await AsyncStorage.getItem(this.PENDING_REGISTRATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending registrations:', error);
      return [];
    }
  }

  /**
   * Clear pending registrations (legacy method)
   */
  static async clearPendingRegistrations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.PENDING_REGISTRATIONS_KEY);
    } catch (error) {
      console.error('Error clearing pending registrations:', error);
      throw error;
    }
  }

  /**
   * Get all farmer data from the sync queue
   */
  static async getAllFarmerData(): Promise<FarmerDetails[]> {
    try {
      const queue = await SyncQueueService.getQueue();
      return queue.map(item => item.data);
    } catch (error) {
      console.error('Error getting all farmer data:', error);
      return [];
    }
  }

  /**
   * Save application settings
   */
  static async saveSettings(settings: Record<string, any>): Promise<void> {
    try {
      const existingSettings = await this.getSettings();
      const updatedSettings = { ...existingSettings, ...settings };
      await AsyncStorage.setItem(this.APP_SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Get application settings
   */
  static async getSettings(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(this.APP_SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  }

  /**
   * Get a specific setting value
   */
  static async getSetting(key: string, defaultValue: any = null): Promise<any> {
    try {
      const settings = await this.getSettings();
      return settings[key] !== undefined ? settings[key] : defaultValue;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Migrate data from the old storage format to the new sync queue
   */
  static async migrateToSyncQueue(): Promise<number> {
    try {
      // Get data from the old format
      const oldData = await this.getPendingRegistrations();
      
      if (oldData.length === 0) {
        return 0;
      }
      
      // Add each item to the sync queue
      let migratedCount = 0;
      for (const data of oldData) {
        await SyncQueueService.addToQueue(data);
        migratedCount++;
      }
      
      // Clear the old data
      await this.clearPendingRegistrations();
      
      console.log(`Migrated ${migratedCount} items to the sync queue`);
      return migratedCount;
    } catch (error) {
      console.error('Error migrating to sync queue:', error);
      return 0;
    }
  }
}
