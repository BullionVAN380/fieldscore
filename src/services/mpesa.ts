import axios from 'axios';

interface MpesaPaymentResponse {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
}

export interface PaymentResponse {
  success: boolean;
  data?: {
    checkoutRequestId?: string;
    merchantRequestId?: string;
    responseCode?: string;
    responseDescription?: string;
    customerMessage?: string;
    status?: string;
    transactionId?: string;
  };
  message?: string;
}

export class MpesaService {
  private static readonly API_URL = 'http://10.0.2.2:3001/api/mpesa';
  private static readonly TIMEOUT = 30000;

  static async initiateSTKPush(phoneNumber: string, amount: number): Promise<PaymentResponse> {
    try {
      // Format phone number for M-Pesa
      const formattedPhone = MpesaService.formatPhoneNumber(phoneNumber);

      const response = await axios.post(
        `${MpesaService.API_URL}/stk-push`,
        { phoneNumber: formattedPhone, amount },
        { timeout: MpesaService.TIMEOUT }
      );

      return response.data;
    } catch (error: unknown) {
      console.error('Error initiating STK push:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initiate payment',
      };
    }
  }

  static async checkTransactionStatus(checkoutRequestId: string): Promise<PaymentResponse> {
    try {
      const response = await axios.get(
        `${MpesaService.API_URL}/status/${checkoutRequestId}`,
        { timeout: MpesaService.TIMEOUT }
      );

      return response.data;
    } catch (error: unknown) {
      console.error('Error checking transaction status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check payment status',
      };
    }
  }

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
