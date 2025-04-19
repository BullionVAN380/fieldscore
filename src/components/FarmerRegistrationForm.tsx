import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetInfo } from '@react-native-community/netinfo';
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ViewStyle, TextStyle, AccessibilityInfo, findNodeHandle } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FarmerDetails as BaseFarmerDetails, CropType as BaseCropType } from '../types';
import { mockCounties } from '../services/mockData';
import { getUAIByCountyAndCrop, calculatePremium, initializeUAICache } from '../utils/uaiDataOptimizer';
import { ApiService } from '../services/api';
import { MpesaService } from '../services/mpesa';
import { StorageService } from '../services/storage';
import { useApp } from '../hooks/useApp';
import axios from 'axios';
import SyncStatusBar from './SyncStatusBar';
import { AccessibilityUtils } from '../utils/accessibility';
import { Colors } from '../utils/colors';

interface UAI {
  id: string;
  countyId: string;
  cropType: BaseCropType;
  premiumPerAcre: number;
  value: number; // Multiplier for premium calculation
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

type RootStackParamList = {
  FarmerRegistration: undefined;
  SyncManagement: undefined;
};

type FarmerRegistrationScreenProps = NativeStackScreenProps<RootStackParamList, 'FarmerRegistration'>;

interface FarmerRegistrationFormProps {
  navigation?: FarmerRegistrationScreenProps['navigation'];
  route?: FarmerRegistrationScreenProps['route'];
  onSubmit?: (data: FarmerDetails) => void;
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

// Updated styles with accessible colors
const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
    alignItems: 'center', // Center horizontally
    justifyContent: 'flex-start', // Start from the top
  },
  content: {
    width: '100%',
    maxWidth: 800, // Increased from 500 to 800
    padding: 16,
    alignSelf: 'center', // Center self
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 20,
    textAlign: 'center'
  },
  card: {
    backgroundColor: Colors.paper,
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
    color: Colors.primary,
    marginBottom: 10
  },
  form: {
    width: '100%',
    maxWidth: 700, // Increased from 400 to 700
    alignSelf: 'center', // Center the form
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
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grey[300],
    backgroundColor: Colors.paper,
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    color: Colors.text,
  },
  inputLabel: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 8
  },
  inputContainer: {
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  picker: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.grey[300],
    borderRadius: 6,
    backgroundColor: Colors.paper,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  pickerItem: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  premiumContainer: {
    backgroundColor: Colors.grey[100],
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  premiumLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  premiumAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.status.success,
  },
  button: {
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.grey[300],
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  errorText: {
    fontSize: 14,
    color: Colors.status.error,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: Colors.hint,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

const crops: BaseCropType[] = ['Maize', 'Beans'];

const validateMobileNumber = (mobileNumber: string): boolean => {
  return /^254\d{9}$/.test(mobileNumber);
};

const FarmerRegistrationForm: React.FC<FarmerRegistrationFormProps> = ({ navigation, onSubmit, initialData }) => {
  const { t } = useTranslation();

  // Refs for accessibility focus management
  const nameInputRef = useRef<TextInput>(null);
  const nationalIdInputRef = useRef<TextInput>(null);
  const mobileNumberInputRef = useRef<TextInput>(null);
  const acresInputRef = useRef<TextInput>(null);
  const payButtonRef = useRef<any>(null);
  
  // State to track if screen reader is enabled
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  
  // Check if screen reader is enabled
  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(enabled);
    };
    
    checkScreenReader();
    
    // Listen for screen reader changes
    const listener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );
    
    return () => {
      listener.remove();
    };
  }, []);
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

  // Initialize UAI cache on component mount
  useEffect(() => {
    initializeUAICache();
  }, []);

  // Get UAI options based on selected county and crop - using optimized utility
  const uaiOptions = useMemo(() => {
    // Early return if county or crop is not set yet
    if (!formData.county || !formData.crop) return [];
    
    // Use the optimized utility function for faster lookups
    const filteredUAIs = getUAIByCountyAndCrop(formData.county, formData.crop);
    
    // If no matching UAIs found, return an empty array
    if (filteredUAIs.length === 0) {
      return [];
    }
    
    // Map UAIs to options format - optimize by limiting decimal places
    return filteredUAIs.map(uai => ({
      id: uai.id,
      name: `${uai.id} (${uai.value.toFixed(1)})`, // Reduce to 1 decimal place
      value: uai.value,
      premiumPerAcre: uai.premiumPerAcre
    }));
  }, [formData.county, formData.crop]);

  const handleInputChange = useCallback((field: keyof FarmerDetails, value: any) => {
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
    // Premium calculation is now handled by the useMemo hook
  }, [errors]);

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

  // Optimized premium calculation using the utility function
  const calculatedPremium = useMemo(() => {
    // Use the optimized utility function for premium calculation
    return calculatePremium(formData.uai, formData.acres);
  }, [formData.acres, formData.uai]);
  
  // Update premium when calculated value changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      premium: calculatedPremium
    }));
  }, [calculatedPremium]);
  
  // Optimized UAI update when county or crop changes
  useEffect(() => {
    // Debounce the UAI selection to prevent rapid state updates
    const timer = setTimeout(() => {
      // If there are UAI options available, select the first one by default
      if (uaiOptions.length > 0 && (!formData.uai || !uaiOptions.some(u => u.id === formData.uai))) {
        setFormData(prev => ({
          ...prev,
          uai: uaiOptions[0].id
        }));
      }
    }, 100); // Small delay to batch updates
    
    return () => clearTimeout(timer);
  }, [uaiOptions, formData.uai]);

  const handlePayment = async () => {
    console.log('Starting payment process...');
    console.log('Form data:', formData);

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    if (!isOnline) {
      Alert.alert(t('common.error'), t('farmerRegistration.alerts.offlinePayment'));
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
      
      // Send all farmer details along with payment information
      // This ensures new farmers are saved to the database even if they don't exist yet
      const paymentResult = await ApiService.post('/mpesa/stk-push', {
        // Payment details
        phoneNumber: formData.mobileNumber,
        amount: formData.premium,
        
        // Farmer details - these will be used to create a new farmer if the National ID doesn't exist
        nationalId: formData.nationalId,
        name: formData.name,
        gender: formData.gender,
        county: formData.county,
        ward: formData.ward,
        crop: formData.crop,
        acres: formData.acres,
        uai: formData.uai
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
        Alert.alert(t('common.success'), t('farmerRegistration.alerts.paymentSuccess'), [
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
              Alert.alert(t('common.success'), t('farmerRegistration.alerts.registrationComplete'));
            }
          }
        ]);
      } else {
        setPaymentStatus('error');
        
        // Special handling for test mode
        if (process.env.NODE_ENV !== 'production') {
          Alert.alert(t('common.info', 'Information'), t('farmerRegistration.alerts.testModeNotice'), [
            { text: 'OK', onPress: () => {} }
          ]);
        } else {
          Alert.alert('Error', paymentResult.data.message || 'Payment failed. Please try again.');
        }
      }
    } catch (error) {
      setPaymentStatus('error');
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred during payment');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = (requestId: string) => {
    // In a real implementation, you would poll the server to check the payment status
    // For this example, we'll just show a success message after a delay
    setTimeout(() => {
      Alert.alert(t('common.confirm'), t('farmerRegistration.alerts.paymentInstructions'), [
        {
          text: 'OK',
          onPress: () => {}
        }
      ]);
    }, 2000);
  };

  // Premium calculation is now handled by the useMemo hook

  // Announce errors to screen readers
  useEffect(() => {
    if (error && isScreenReaderEnabled) {
      AccessibilityUtils.announce(`Error: ${error}`);
    }
  }, [error, isScreenReaderEnabled]);
  
  // Announce validation errors to screen readers
  useEffect(() => {
    if (Object.keys(errors).length > 0 && isScreenReaderEnabled) {
      const errorMessages = Object.values(errors).join('. ');
      AccessibilityUtils.announce(`Validation errors: ${errorMessages}`);
    }
  }, [errors, isScreenReaderEnabled]);

  // Handle keyboard navigation
  const handleKeyboardNavigation = (event: React.KeyboardEvent, currentRef: React.RefObject<any>, nextRef: React.RefObject<any>) => {
    if (event.key === 'Tab') {
      if (!event.shiftKey && nextRef.current) {
        event.preventDefault();
        nextRef.current.focus();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        accessible={true}
        accessibilityLabel="Farmer registration form"
        showsVerticalScrollIndicator={false} // Hide scrollbar but keep scrolling functionality
      >
        {/* Add SyncStatusBar at the top of the form */}
        <SyncStatusBar onPress={() => navigation?.navigate('SyncManagement')} />
        
        <Text 
          style={styles.title}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Farmer Registration Form"
        >
          {t('farmerRegistration.title')}
        </Text>

        {error ? (
          <Text 
            style={styles.errorText}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel={`Error: ${error}`}
          >
            {error}
          </Text>
        ) : null}

        <View style={styles.card}>
          <Text 
            style={styles.label}
            accessible={true}
            accessibilityRole="text"
            nativeID="name-label"
          >
            {t('farmerRegistration.fields.name.label')}
          </Text>
          <TextInput
            ref={nameInputRef}
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder={t('farmerRegistration.fields.name.placeholder')}
            accessible={true}
            accessibilityLabel="Full Name"
            accessibilityHint="Enter your full name"
            accessibilityLabelledBy="name-label"
            returnKeyType="next"
            onSubmitEditing={() => nationalIdInputRef.current?.focus()}
            blurOnSubmit={false}
          />
          {errors.name && (
            <Text 
              style={styles.errorText}
              accessible={true}
              accessibilityRole="alert"
            >
              {t('farmerRegistration.fields.name.error')}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t('farmerRegistration.fields.gender.label')}</Text>
          <Picker
            selectedValue={formData.gender}
            onValueChange={(value) => handleInputChange('gender', value)}
          >
            <Picker.Item label={t('farmerRegistration.fields.gender.male')} value="Male" />
            <Picker.Item label={t('farmerRegistration.fields.gender.female')} value="Female" />
          </Picker>
        </View>

        <View style={styles.card}>
          <Text 
            style={styles.label}
            accessible={true}
            accessibilityRole="text"
            nativeID="national-id-label"
          >
            {t('farmerRegistration.fields.nationalId.label')}
          </Text>
          <TextInput
            ref={nationalIdInputRef}
            style={styles.input}
            value={formData.nationalId}
            onChangeText={(text) => handleInputChange('nationalId', text)}
            keyboardType="numeric"
            placeholder={t('farmerRegistration.fields.nationalId.placeholder')}
            maxLength={8}
            accessible={true}
            accessibilityLabel="National ID"
            accessibilityHint="Enter your 8-digit national ID number"
            accessibilityLabelledBy="national-id-label"
            returnKeyType="next"
            onSubmitEditing={() => mobileNumberInputRef.current?.focus()}
            blurOnSubmit={false}
          />
          {errors.nationalId && (
            <Text 
              style={styles.errorText}
              accessible={true}
              accessibilityRole="alert"
            >
              {t('farmerRegistration.fields.nationalId.error')}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text 
            style={styles.label}
            accessible={true}
            accessibilityRole="text"
            nativeID="mobile-number-label"
          >
            {t('farmerRegistration.fields.mobileNumber.label')}
          </Text>
          <TextInput
            ref={mobileNumberInputRef}
            style={styles.input}
            value={formData.mobileNumber}
            onChangeText={(text) => handleInputChange('mobileNumber', text)}
            keyboardType="phone-pad"
            placeholder={t('farmerRegistration.fields.mobileNumber.placeholder')}
            maxLength={12}
            accessible={true}
            accessibilityLabel="Mobile Number"
            accessibilityHint="Enter your mobile number starting with 254"
            accessibilityLabelledBy="mobile-number-label"
            returnKeyType="next"
          />
          <Text 
            style={styles.hint}
            accessible={true}
            accessibilityLabel={t('farmerRegistration.fields.mobileNumber.hint')}
          >
            {t('farmerRegistration.fields.mobileNumber.hint')}
          </Text>
          {errors.mobileNumber && (
            <Text 
              style={styles.errorText}
              accessible={true}
              accessibilityRole="alert"
            >
              {t('farmerRegistration.fields.mobileNumber.error')}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>County</Text>
          <Picker
            selectedValue={formData.county}
            onValueChange={(value) => {
              const county = mockCounties.find(c => c.id === value);
              handleInputChange('county', value);
              if (county && county.wards.length > 0) {
                handleInputChange('ward', county.wards[0].id);
              }
            }}
          >
            {mockCounties.map(county => (
              <Picker.Item key={county.id} label={county.name} value={county.id} />
            ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Ward</Text>
          <Picker
            selectedValue={formData.ward}
            onValueChange={(value) => handleInputChange('ward', value)}
          >
            {mockCounties
              .find(c => c.id === formData.county)?.wards
              .map(ward => (
                <Picker.Item key={ward.id} label={ward.name} value={ward.id} />
              ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Crop Type</Text>
          <Picker
            selectedValue={formData.crop}
            onValueChange={(value) => handleInputChange('crop', value)}
          >
            {crops.map(crop => (
              <Picker.Item key={crop} label={crop} value={crop} />
            ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>UAI (Unit Area of Insurance)</Text>
          <Picker
            selectedValue={formData.uai}
            onValueChange={(value) => handleInputChange('uai', value)}
          >
            {uaiOptions.map(option => (
              <Picker.Item key={option.id} label={option.name} value={option.id} />
            ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Text 
            style={styles.label}
            accessible={true}
            accessibilityRole="text"
            nativeID="acres-label"
          >
            Acres
          </Text>
          <TextInput
            ref={acresInputRef}
            style={styles.input}
            value={formData.acres.toString() === '0' ? '' : formData.acres.toString()}
            onChangeText={(text) => {
              const acres = text === '' ? 0 : parseFloat(text);
              handleInputChange('acres', acres);
            }}
            keyboardType="numeric"
            placeholder="Enter number of acres"
            accessible={true}
            accessibilityLabel="Acres"
            accessibilityHint="Enter the number of acres of land"
            accessibilityLabelledBy="acres-label"
          />
          {errors.acres && (
            <Text 
              style={styles.errorText}
              accessible={true}
              accessibilityRole="alert"
            >
              {errors.acres}
            </Text>
          )}
        </View>

        <View 
          style={styles.premiumContainer}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Premium Amount: ${formData.premium.toLocaleString()} Kenyan Shillings`}
        >
          <Text style={styles.premiumLabel}>Premium Amount:</Text>
          <Text style={styles.premiumAmount}>KES {formData.premium.toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          ref={payButtonRef}
          style={[styles.button, (!isFormValid || loading) && styles.buttonDisabled]}
          onPress={handlePayment}
          disabled={!isFormValid || loading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={loading ? t('farmerRegistration.buttons.processing') : t('farmerRegistration.buttons.pay')}
          accessibilityHint="Tap to make payment using M-Pesa"
          accessibilityState={{ disabled: !isFormValid || loading }}
        >
          <Text style={styles.buttonText}>
            {loading ? t('farmerRegistration.buttons.processing') : t('farmerRegistration.buttons.pay')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FarmerRegistrationForm;
