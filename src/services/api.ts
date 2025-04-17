import { FarmerDetails } from '../types';

// API URL configuration for different environments
const isWeb = typeof document !== 'undefined';
const LOCAL_IP_ADDRESS = '192.168.3.100'; // Your computer's IP address from ipconfig  
const getApiBaseUrl = () => {
  // For web, try to use the same hostname as the current page
  const url = isWeb 
    ? `http://${window.location.hostname}:3001`
    : `http://${LOCAL_IP_ADDRESS}:3001`;
  console.log('API Base URL:', url);
  return url;
};

const API_BASE_URL = getApiBaseUrl();

// Default fetch options with timeout
const defaultFetchOptions = {
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Test the API connection
const testApiConnection = async (): Promise<{ status: string; database: { status: string; readyState: number }; env: { mpesa: boolean; mongodb: boolean } }> => {
  try {
    const url = `${API_BASE_URL}/api/health`;
    console.log('Testing connection to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
    
    // Log the raw response for debugging
    const responseText = await response.text();
    console.log('Raw API Response:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('API Connection Test Result:', data);
      return data;
    } catch (parseError) {
      console.error('Failed to parse response as JSON. Response received:', responseText);
      throw new Error(`Server returned invalid JSON response. Status: ${response.status}`);
    }
  } catch (error: unknown) {
    console.error('API Connection Test Failed:', error instanceof Error ? error.message : error);
    throw error;
  }
};

// Run initial connection test
testApiConnection().catch((error: unknown) => {
  console.error('Initial API connection test failed:', error instanceof Error ? error.message : error);
});

export class ApiService {
  static async registerFarmer(farmer: FarmerDetails) {
    try {
      const url = `${API_BASE_URL}/farmers/register`;
      console.log('=== Starting Farmer Registration ===');
      console.log('Request URL:', url);
      console.log('Request Headers:', defaultFetchOptions.headers);
      console.log('Request Body:', JSON.stringify(farmer, null, 2));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('Request timed out after', defaultFetchOptions.timeout, 'ms');
      }, defaultFetchOptions.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: defaultFetchOptions.headers,
        signal: controller.signal,
        body: JSON.stringify(farmer),
      });
      
      clearTimeout(timeoutId);
      console.log('Response Status:', response.status);
      console.log('Response Headers:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('=== Server Error ===');
        console.error('Status:', response.status);
        console.error('Error Data:', errorData);
        console.error('=== End Server Error ===');
        throw new Error(`Server error: ${response.status} ${errorData}`);
      }
      console.log('=== Request Completed Successfully ===');

      return await response.json();
    } catch (error) {
      console.error('Error registering farmer:', error);
      throw error;
    }
  }

  static async syncOfflineData(farmers: FarmerDetails[]) {
    try {
      console.log('Attempting to connect to:', `${API_BASE_URL}/farmers/sync`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), defaultFetchOptions.timeout);

      const response = await fetch(`${API_BASE_URL}/farmers/sync`, {
        method: 'POST',
        ...defaultFetchOptions,
        signal: controller.signal,
        body: JSON.stringify(farmers),
      });
      
      clearTimeout(timeoutId);

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
      // Ensure endpoint starts with /api
      const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
      const url = `${API_BASE_URL}${apiEndpoint}`;
      
      console.log('Making API request:', {
        url,
        method: 'POST',
        data
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), defaultFetchOptions.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...defaultFetchOptions.headers,
          'Origin': window?.location?.origin || 'http://localhost:8082'
        },
        signal: controller.signal,
        body: JSON.stringify(data),
      });
      
      clearTimeout(timeoutId);

      // First check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('API Success Response:', {
        status: response.status,
        data: responseData
      });

      return responseData;
    } catch (error) {
      console.error(`Error posting to ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Initiate M-Pesa STK Push payment
   */
  static async initiatePayment(phoneNumber: string, amount: number) {
    try {
      console.log('Initiating M-Pesa payment:', { phoneNumber, amount });
      const response = await this.post('/api/mpesa/stk-push', {
        phoneNumber,
        amount
      });
      console.log('M-Pesa payment response:', response);
      return response;
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      throw error;
    }
  }
}
