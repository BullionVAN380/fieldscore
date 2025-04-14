export type CropType = 'Maize' | 'Beans' | 'Sorghum' | 'Green grams' | 'Cowpeas' | 'Millet';

export interface FarmerDetails {
  name: string;
  gender: 'Male' | 'Female';
  nationalId: string;
  mobileNumber: string;
  county: string;
  ward: string;
  crop: CropType;
  uai: string;
  acres: number;
  premium: number;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  transactionCode?: string;
}

export interface MpesaCallback {
  Body: {
    stkCallback: {
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}
