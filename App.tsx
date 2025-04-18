import React, { lazy, Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import FarmerRegistrationForm from './src/components/FarmerRegistrationForm';
import SyncStatusBar from './src/components/SyncStatusBar';
import { useTranslation } from 'react-i18next';
import SimpleLanguageButton from './src/components/SimpleLanguageButton';

// Import i18n configuration
import './src/i18n/i18n';

// Lazy load screens that aren't needed immediately
const SyncManagementScreen = lazy(() => import('./src/screens/SyncManagementScreen'));

// Define the navigation types
type RootStackParamList = {
  FarmerRegistration: undefined;
  SyncManagement: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Loading component for suspense fallback
const LoadingScreen = () => {
  const { t } = useTranslation();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <ActivityIndicator size="large" color="#2E7D32" />
      <Text style={{ marginTop: 20, color: '#2E7D32', fontSize: 16 }}>{t('common.loading')}</Text>
    </View>
  );
};

// Stack navigator is defined above with proper typing

export default function App() {
  const { t } = useTranslation();
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="FarmerRegistration"
              component={FarmerRegistrationForm}
              options={({ navigation }) => ({
                title: 'Fieldscore Insurance',
                headerStyle: {
                  backgroundColor: '#2E7D32'
                },
                headerTitleStyle: {
                  color: '#FFFFFF',
                  fontSize: 20,
                  fontWeight: '600'
                },
                headerTintColor: '#FFFFFF',
                headerRight: () => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('SyncManagement')}
                      style={{ padding: 8, marginRight: 8 }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '500' }}>{t('navigation.syncManagement')}</Text>
                    </TouchableOpacity>
                    <SimpleLanguageButton />
                  </View>
                ),
              })}
            />
            <Stack.Screen
              name="SyncManagement"
              options={({ navigation }) => ({
                title: t('navigation.syncManagement'),
                headerRight: () => (
                  <SimpleLanguageButton />
                ),
                headerStyle: {
                  backgroundColor: '#2E7D32'
                },
                headerTitleStyle: {
                  color: '#FFFFFF',
                  fontSize: 20,
                  fontWeight: '600'
                },
                headerTintColor: '#FFFFFF',
              })}
            >
              {props => (
                <Suspense fallback={<LoadingScreen />}>
                  <SyncManagementScreen {...props} />
                </Suspense>
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
