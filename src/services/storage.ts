import AsyncStorage from '@react-native-async-storage/async-storage';
import { FarmerDetails } from '../types';

export class StorageService {
  private static readonly PENDING_REGISTRATIONS_KEY = 'pendingRegistrations';

  static async saveFarmerData(data: FarmerDetails): Promise<void> {
    try {
      const existingData = await this.getPendingRegistrations();
      existingData.push(data);
      await AsyncStorage.setItem(
        this.PENDING_REGISTRATIONS_KEY,
        JSON.stringify(existingData)
      );
    } catch (error) {
      console.error('Error saving farmer data:', error);
      throw error;
    }
  }

  static async getPendingRegistrations(): Promise<FarmerDetails[]> {
    try {
      const data = await AsyncStorage.getItem(this.PENDING_REGISTRATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending registrations:', error);
      return [];
    }
  }

  static async clearPendingRegistrations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.PENDING_REGISTRATIONS_KEY);
    } catch (error) {
      console.error('Error clearing pending registrations:', error);
      throw error;
    }
  }
}
