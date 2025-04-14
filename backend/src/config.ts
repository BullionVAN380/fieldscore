// Configuration file to load environment variables
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Export configuration object
export const config = {
  PORT: process.env.PORT || 3001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/fieldscore',
  
  // M-Pesa configuration
  MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || '',
  MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || '',
  MPESA_SHORTCODE: process.env.MPESA_SHORTCODE || '',
  MPESA_PASSKEY: process.env.MPESA_PASSKEY || '',
  MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL || '',
  
  // Intasend configuration
  INTASEND_PUBLISHABLE_KEY: process.env.INTASEND_PUBLISHABLE_KEY || '',
  INTASEND_SECRET_KEY: process.env.INTASEND_SECRET_KEY || '',
  INTASEND_TEST_MODE: process.env.INTASEND_TEST_MODE === 'false' ? false : true,
};
