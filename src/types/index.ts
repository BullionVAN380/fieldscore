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

export interface County {
  id: string;
  name: string;
  wards: Ward[];
}

export interface Ward {
  id: string;
  name: string;
}

export interface UAI {
  id: string; // UAI code (e.g., 'TavUAI - 22', 'kilfUAI - 56')
  countyId: string;
  cropType: string;
  premiumPerAcre: number;
  value: number; // Multiplier for premium calculation
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
    ResponseCode?: string;
    ResponseDescription?: string;
    CustomerMessage?: string;
  };
  transactionCode?: string;
}
