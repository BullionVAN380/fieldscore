import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import FarmerRegistrationForm from './src/components/FarmerRegistrationForm';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="FarmerRegistration"
              component={FarmerRegistrationForm}
              options={{
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
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
