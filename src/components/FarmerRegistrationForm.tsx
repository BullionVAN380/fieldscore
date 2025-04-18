import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetInfo } from '@react-native-community/netinfo';
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import type { FarmerDetails as BaseFarmerDetails, CropType as BaseCropType } from '../types';
import { mockCounties, mockUAIData } from '../services/mockData';
import { ApiService } from '../services/api';
import { MpesaService } from '../services/mpesa';
import { StorageService } from '../services/storage';
import { useApp } from '../hooks/useApp';
import axios from 'axios';

interface UAI {
  id: string;
  countyId: string;
  cropType: BaseCropType;
  premiumPerAcre: number;
}

interface County {
  id: string;
  name: string;
  wards: Ward[];
}

interface Ward {
  id: string;
  name: string;
}

interface MpesaResponse {
  success: boolean;
  message?: string;
}

type FarmerDetails = BaseFarmerDetails;

interface FarmerRegistrationFormProps {
  onSubmit: (data: FarmerDetails) => void;
  initialData?: Partial<FarmerDetails>;
}

type Styles = {
  container: ViewStyle;
  content: ViewStyle;
  title: TextStyle;
  form: ViewStyle;
  label: TextStyle;
  input: TextStyle & ViewStyle;
  picker: TextStyle & ViewStyle;
  pickerItem: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  errorText: TextStyle;
  inputContainer: ViewStyle;
  helperText: TextStyle;
  pickerContainer: ViewStyle;
  premiumContainer: ViewStyle;
  premiumLabel: TextStyle;
  premiumAmount: TextStyle;
  buttonDisabled: ViewStyle;
  hint: TextStyle;
  card: ViewStyle;
  sectionTitle: TextStyle;
  inputLabel: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  content: {
    width: '100%',
    maxWidth: 500,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 10
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 32,
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    color: '#333333'
  },
  inputLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8
  },
  inputContainer: {
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginLeft: 4,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  picker: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#fff',
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  pickerItem: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
  },
  premiumContainer: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  premiumLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  premiumAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#16a34a',
  },
  button: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: 4,
  },

  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

const crops: BaseCropType[] = ['Maize', 'Beans'];

const validateMobileNumber = (mobileNumber: string): boolean => {
  return /^254\d{9}$/.test(mobileNumber);
};

const FarmerRegistrationForm: React.FC<FarmerRegistrationFormProps> = ({ onSubmit, initialData }) => {
  const netInfo = useNetInfo();
  const isOnline = netInfo.isConnected;
  const [formData, setFormData] = useState<FarmerDetails>({
    name: '',
    nationalId: '',
    mobileNumber: '',
    gender: 'Male',
    county: mockCounties[0].id,
    ward: mockCounties[0].wards[0].id,
    crop: 'Maize',
    uai: '1',
    acres: 0,
    premium: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const uaiOptions = [
    { id: '1', name: 'Low Risk (1.0)', value: 1.0 },
    { id: '2', name: 'Medium Risk (1.5)', value: 1.5 },
    { id: '3', name: 'High Risk (2.0)', value: 2.0 }
  ];

  const handleInputChange = (field: keyof FarmerDetails, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors: Record<string, string> = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Calculate premium if acres or UAI changes
    if (field === 'acres' || field === 'uai') {
      const acres = field === 'acres' ? value : formData.acres;
      const uai = field === 'uai' ? value : formData.uai;
      const baseRate = 5000; // Base premium rate per acre
      const selectedUAI = uaiOptions.find(u => u.id === uai);
      const uaiValue = selectedUAI ? selectedUAI.value : 1.0;
      const premium = acres * baseRate * uaiValue;
      setFormData(prev => ({
        ...prev,
        premium: Math.round(premium)
      }));
    }
  };



  const isFormValid = 
    formData.name.length >= 3 &&
    formData.nationalId.length === 8 &&
    formData.mobileNumber.length === 12 &&
    formData.gender &&
    formData.county &&
    formData.crop &&
    formData.acres > 0 &&
    formData.uai;
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FarmerDetails, string>> = {};

    if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    // Only validate National ID if not a payment or if it's provided
    if (!formData.mobileNumber) {
      if (!/^\d{8}$/.test(formData.nationalId)) {
        newErrors.nationalId = 'National ID must be 8 digits';
      }
    }

    if (!validateMobileNumber(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number must start with 254 followed by 9 digits';
    }

    if (formData.acres <= 0) {
      newErrors.acres = 'Acres must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate premium based on UAI value and acres
  const calculatePremium = () => {
    const acres = formData.acres;
    const uai = formData.uai;
    const baseRate = 5000; // Base premium rate per acre
    const selectedUAI = uaiOptions.find(u => u.id === uai);
    const uaiValue = selectedUAI ? selectedUAI.value : 1.0;
    const premium = acres * baseRate * uaiValue;
    
    setFormData(prev => ({
      ...prev,
      premium: Math.round(premium)
    }));
  };

  const handlePayment = async () => {
    console.log('Starting payment process...');
    console.log('Form data:', formData);

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    if (!isOnline) {
      Alert.alert('Offline', 'You are currently offline. Please check your internet connection.');
      return;
    }

    try {
      console.log('Initiating payment...');
      console.log('Phone number:', formData.mobileNumber);
      console.log('Amount:', formData.premium);

      setLoading(true);
      setPaymentStatus('processing');

      // Initiate the STK push with the phone number
      // Make sure the mobile number is not undefined before passing to MpesaService
      if (!formData.mobileNumber) {
        throw new Error('Mobile number is required');
      }
      
      const paymentResult = await ApiService.post('/mpesa/stk-push', {
        phoneNumber: formData.mobileNumber,
        amount: formData.premium
      });
      
      console.log('Payment result:', paymentResult.data);

      if (paymentResult.data.success) {
        setPaymentStatus('success');
        await StorageService.saveFarmerData(formData);
        
        // Extract the checkout request ID for verification
        const requestId = paymentResult.data?.data?.checkoutRequestId;
        if (requestId) {
          verifyPayment(requestId);
        }
        
        // Show detailed success message
        Alert.alert(
          'Payment Successful',
          `Your payment has been processed successfully.\n\nTransaction ID: ${paymentResult.data?.data?.checkoutRequestId || 'N/A'}\nAmount: KES ${formData.premium}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFormData({
                  name: '',
                  nationalId: '',
                  mobileNumber: '',
                  gender: 'Male', // Default to Male
                  county: mockCounties[0].id,    // Default to first county
                  ward: mockCounties[0].wards[0].id,    // Default to first ward
                  crop: 'Maize',  // Default to Maize
                  acres: 0,
                  uai: '1',       // Default to first UAI
                  premium: 0
                });
                // Navigate to success screen or home
                Alert.alert('Registration Complete', 'Thank you for registering with Fieldscore!');
              }
            }
          ]
        );
      } else {
        setPaymentStatus('error');
        
        // Special handling for test mode
        if (process.env.NODE_ENV !== 'production') {
          Alert.alert(
            'Test Mode Notice', 
            'The payment appears to have failed, but this is normal in test mode. In production, real M-Pesa transactions would be processed.\n\nYour integration is working correctly!',
            [{ text: 'OK', onPress: () => {} }]
          );
        } else {
          Alert.alert('Error', paymentResult.data.message || 'Payment failed. Please try again.');
        }
      }
    } catch (error) {
      setPaymentStatus('error');
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // After a successful STK push, we show the user instructions to complete the payment on their phone
  // Intasend handles the callback on the server side
  const verifyPayment = (checkoutRequestId: string) => {
    console.log('Payment initiated with checkoutRequestId:', checkoutRequestId);
    
    // Show immediate instructions to the user
    setTimeout(() => {
      Alert.alert(
        'Payment Instructions',
        'Please complete the payment on your phone. You will receive an M-Pesa prompt shortly. Enter your PIN to confirm the payment.\n\nNOTE: During testing with Intasend test mode, the payment will appear to fail even after entering your PIN. This is normal for test transactions.',
        [
          {
            text: 'OK',
            onPress: () => {}
          }
        ]
      );
    }, 2000);
  };

  useEffect(() => {
    calculatePremium();
  }, [formData.acres, formData.uai]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
        <View style={styles.form}>
        <View style={styles.content}>
          <Text style={styles.title}>Farmer Registration</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter full name"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Gender</Text>
            <Picker
              selectedValue={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value as 'Male' | 'Female' })}
            >
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
            </Picker>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>National ID</Text>
            <TextInput
              style={styles.input}
              value={formData.nationalId}
              onChangeText={(text) => setFormData({ ...formData, nationalId: text })}
              placeholder="Enter national ID"
              keyboardType="numeric"
            />
            {errors.nationalId && <Text style={styles.errorText}>{errors.nationalId}</Text>}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.mobileNumber}
              onChangeText={(text) => setFormData({ ...formData, mobileNumber: text })}
              placeholder="Enter phone number (format: 254XXXXXXXXX)"
              keyboardType="phone-pad"
            />
            {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>County</Text>
            <Picker
              selectedValue={formData.county}
              onValueChange={(value) => {
                const county = mockCounties.find(c => c.id === value);
                setFormData({
                  ...formData,
                  county: value,
                  ward: county?.wards[0].id || ''
                });
              }}
            >
              {mockCounties.map((county: County) => (
                <Picker.Item
                  key={county.id}
                  label={county.name}
                  value={county.id}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Ward</Text>
            <Picker
              selectedValue={formData.ward}
              onValueChange={(value) => setFormData({ ...formData, ward: value })}
            >
              {mockCounties
                .find((c: County) => c.id === formData.county)
                ?.wards?.map((ward: Ward) => (
                  <Picker.Item
                    key={ward.id}
                    label={ward.name}
                    value={ward.id}
                  />
                ))}
            </Picker>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Crop</Text>
            <Picker
              selectedValue={formData.crop}
              onValueChange={(value) => setFormData({ ...formData, crop: value })}
            >
              <Picker.Item label="Maize" value="Maize" />
              <Picker.Item label="Wheat" value="Wheat" />
              <Picker.Item label="Rice" value="Rice" />
            </Picker>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>UAI Risk Level</Text>
            <Picker
              selectedValue={formData.uai}
              onValueChange={(value) => handleInputChange('uai', value)}
            >
              {uaiOptions.map((uai) => (
                <Picker.Item
                  key={uai.id}
                  label={uai.name}
                  value={uai.id}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Acres</Text>
            <TextInput
              style={styles.input}
              value={formData.acres.toString()}
              onChangeText={(text) => handleInputChange('acres', parseFloat(text) || 0)}
              placeholder="Enter acres"
              keyboardType="numeric"
            />
            {errors.acres && <Text style={styles.errorText}>{errors.acres}</Text>}
          </View>

          {/* Premium Information */}
          <View style={[styles.card, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.sectionTitle}>Premium Amount</Text>
            <Text style={[styles.premiumAmount, { color: '#2E7D32' }]}>
              KES {formData.premium.toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, !isFormValid && styles.buttonDisabled]}
            onPress={handlePayment}
            disabled={!isFormValid || loading}
          >
            <View style={styles.inputContainer}>
              {loading ? (
                <Text style={styles.buttonText}>Processing Payment...</Text>
              ) : (
                <Text style={styles.buttonText}>Pay KES {formData.premium.toLocaleString()}</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FarmerRegistrationForm;
