import axios from 'axios';
import { config } from '../config';

export interface PaymentResponse {
  success: boolean;
  data?: {
    checkoutRequestId?: string;
    merchantRequestId?: string;
    responseCode?: string;
    responseDescription?: string;
    customerMessage?: string;
    status?: string;
  };
  message?: string;
}

export class MpesaService {
  private static darajaBaseUrl = 'https://sandbox.safaricom.co.ke';
  private static timeout = 30000;
  private static accessToken: string = '';
  private static tokenExpiry: number = 0;

  /**
   * Gets the OAuth access token from Safaricom
   */
  private static async getAccessToken(): Promise<string> {
    // Check if we have a valid token that hasn't expired
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Basic auth with consumer key and secret
      const auth = Buffer.from(
        `${config.MPESA_CONSUMER_KEY}:${config.MPESA_CONSUMER_SECRET}`
      ).toString('base64');

      // Make the request
      const response = await axios({
        method: 'get',
        url: `${this.darajaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        headers: {
          'Authorization': `Basic ${auth}`
        },
        timeout: this.timeout
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        // Token expires in 1 hour (3600 seconds), we'll set it to expire in 50 minutes to be safe
        this.tokenExpiry = now + (50 * 60 * 1000);
        return this.accessToken;
      }

      throw new Error('Failed to get access token from Safaricom');
    } catch (error: any) {
      console.error('Error getting access token:', {
        message: error.message,
        response: error.response?.data,
        config: error.config,
        stack: error.stack
      });
      throw new Error(error.message || 'Failed to get access token');
    }
  }

  /**
   * Generates a timestamp in the format YYYYMMDDHHmmss
   */
  private static generateTimestamp(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Generates a base64 encoded password for the STK push
   * Format: Shortcode + Passkey + Timestamp
   */
  private static generatePassword(timestamp: string): string {
    const password = `${config.MPESA_SHORTCODE}${config.MPESA_PASSKEY}${timestamp}`;
    return Buffer.from(password).toString('base64');
  }

  /**
   * Initiates an STK push to the user's phone number using Safaricom's Daraja API
   */
  static async initiateSTKPush(
    phoneNumber: string,
    amount: number
  ): Promise<PaymentResponse> {
    try {
      // Validate M-Pesa credentials
      if (!config.MPESA_CONSUMER_KEY || !config.MPESA_CONSUMER_SECRET || 
          !config.MPESA_SHORTCODE || !config.MPESA_PASSKEY || 
          !config.MPESA_CALLBACK_URL) {
        console.error('Missing M-Pesa credentials:', {
          hasConsumerKey: !!config.MPESA_CONSUMER_KEY,
          hasConsumerSecret: !!config.MPESA_CONSUMER_SECRET,
          hasShortcode: !!config.MPESA_SHORTCODE,
          hasPasskey: !!config.MPESA_PASSKEY,
          hasCallbackUrl: !!config.MPESA_CALLBACK_URL
        });
        throw new Error('Missing M-Pesa credentials. Please check your environment variables.');
      }
      // Format the phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Get access token
      const accessToken = await this.getAccessToken();
      
      // Generate timestamp
      const timestamp = this.generateTimestamp();
      
      // Generate password
      const password = this.generatePassword(timestamp);
      
      // Round amount to whole number (M-Pesa doesn't accept decimals)
      const roundedAmount = Math.round(amount);
      
      // Prepare request body
      const requestBody = {
        BusinessShortCode: config.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: roundedAmount,
        PartyA: formattedPhone,
        PartyB: config.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: config.MPESA_CALLBACK_URL,
        AccountReference: 'FieldScore',
        TransactionDesc: 'Insurance Premium Payment'
      };
      
      console.log('Initiating STK push with Daraja API:', requestBody);
      
      // Make the request
      const response = await axios({
        method: 'post',
        url: `${this.darajaBaseUrl}/mpesa/stkpush/v1/processrequest`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: requestBody,
        timeout: this.timeout
      });
      
      console.log('Daraja API STK push response:', response.data);
      
      // Validate response data
      if (!response.data.CheckoutRequestID || !response.data.MerchantRequestID) {
        console.error('Invalid response from Daraja API:', response.data);
        throw new Error('Invalid response from M-Pesa. Missing required fields.');
      }
      
      return {
        success: true,
        data: {
          checkoutRequestId: response.data.CheckoutRequestID || '',
          merchantRequestId: response.data.MerchantRequestID || '',
          responseCode: response.data.ResponseCode || '',
          responseDescription: response.data.ResponseDescription || '',
          customerMessage: response.data.CustomerMessage || '',
          status: 'pending'
        },
        message: 'STK push initiated successfully'
      };
    } catch (error: any) {
      console.error('Error initiating STK push with Daraja API:', error);
      
      // Extract more detailed error information if available
      let errorMessage = 'Failed to initiate payment';
      if (error.response && error.response.data) {
        console.error('Daraja API error response:', error.response.data);
        errorMessage = error.response.data.errorMessage || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Checks the status of a transaction using Safaricom's Daraja API
   */
  static async checkTransactionStatus(checkoutRequestId: string): Promise<PaymentResponse> {
    try {
      // Get access token
      const accessToken = await this.getAccessToken();
      
      // Generate timestamp
      const timestamp = this.generateTimestamp();
      
      // Generate password
      const password = this.generatePassword(timestamp);
      
      // Prepare request body
      const requestBody = {
        BusinessShortCode: config.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };
      
      console.log('Checking transaction status with Daraja API:', { checkoutRequestId });
      
      // Make the request
      const response = await axios({
        method: 'post',
        url: `${this.darajaBaseUrl}/mpesa/stkpushquery/v1/query`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: requestBody,
        timeout: this.timeout
      });
      
      console.log('Daraja API transaction status response:', response.data);
      
      // ResultCode 0 means success, anything else is an error
      const resultCode = response.data.ResultCode?.toString() || '';
      const isSuccessful = resultCode === '0';
      
      return {
        success: isSuccessful,
        data: {
          checkoutRequestId,
          responseCode: resultCode,
          responseDescription: response.data.ResultDesc || '',
          status: isSuccessful ? 'completed' : 'failed'
        },
        message: isSuccessful ? 'Payment completed successfully' : (response.data.ResultDesc || 'Payment failed')
      };
    } catch (error: any) {
      console.error('Error checking transaction status with Daraja API:', error);
      
      // Extract more detailed error information if available
      let errorMessage = 'Failed to check payment status';
      if (error.response && error.response.data) {
        console.error('Daraja API error response:', error.response.data);
        errorMessage = error.response.data.errorMessage || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Formats a phone number to ensure it's in the correct format for M-Pesa
   * @param phone The phone number to format
   * @returns The formatted phone number
   */
  private static formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Remove leading zeros
    const withoutLeadingZeros = digits.replace(/^0+/, '');
    
    // Add 254 prefix if not present
    return withoutLeadingZeros.startsWith('254')
      ? withoutLeadingZeros
      : `254${withoutLeadingZeros}`;
  }
}
