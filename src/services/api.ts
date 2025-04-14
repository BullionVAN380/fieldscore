import { FarmerDetails } from '../types';

// API URL configuration for different environments
const isWeb = typeof document !== 'undefined';

// IMPORTANT: Replace this with your actual computer's IP address when testing on physical devices
// Example: 192.168.1.5 - this allows your phone to connect to your computer on the same WiFi network
const LOCAL_IP_ADDRESS = '192.168.0.119'; // Your computer's IP address from ipconfig

// This handles different environment cases:
// 1. Web browser: Use localhost
// 2. Android Emulator: Use 10.0.2.2 (special IP that points to host machine from Android emulator)
// 3. iOS Simulator: Use localhost
// 4. Physical devices: Use your computer's actual IP address on the local network
const getApiBaseUrl = () => {
  if (isWeb) {
    // Web browser
    return 'http://localhost:3001/api';
  }
  
  // React Native environment
  // You can include additional checks for specific platforms if needed
  // For physical devices, use the computer's IP address on the same WiFi network
  return `http://${LOCAL_IP_ADDRESS}:3001/api`;
};

const API_BASE_URL = getApiBaseUrl();

export class ApiService {
  static async registerFarmer(farmer: FarmerDetails) {
    try {
      const response = await fetch(`${API_BASE_URL}/farmers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(farmer),
      });

      return await response.json();
    } catch (error) {
      console.error('Error registering farmer:', error);
      throw error;
    }
  }

  static async syncOfflineData(farmers: FarmerDetails[]) {
    try {
      const response = await fetch(`${API_BASE_URL}/farmers/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(farmers),
      });

      return await response.json();
    } catch (error) {
      console.error('Error syncing offline data:', error);
      throw error;
    }
  }

  /**
   * Generic post method for any API endpoint
   * @param endpoint The API endpoint path (without the base URL)
   * @param data The data to send in the request body
   * @returns Promise with the response data
   */
  static async post(endpoint: string, data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error(`Error posting to ${endpoint}:`, error);
      throw error;
    }
  }
}
