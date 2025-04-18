// Jest setup file

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([]))
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true }))
}));

// Mock Expo Device
jest.mock('expo-device', () => ({
  getDeviceTypeAsync: jest.fn(() => Promise.resolve(1)),
  getDeviceNameAsync: jest.fn(() => Promise.resolve('Test Device')),
  DeviceType: {
    1: 'PHONE'
  },
  osVersion: '1.0.0'
}));

// Mock Expo Application
jest.mock('expo-application', () => ({
  getApplicationName: jest.fn(() => Promise.resolve('Fieldscore')),
  nativeBuildVersion: '1.0.0',
  applicationId: 'com.fieldscore.app'
}));

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve())
}));

// Mock Expo Crypto
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(() => Promise.resolve(new Uint8Array([1, 2, 3, 4]))),
  digestStringAsync: jest.fn(() => Promise.resolve('mockedHash')),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256'
  }
}));

// Mock i18next
jest.mock('i18next', () => ({
  use: () => ({
    use: () => ({
      init: () => Promise.resolve()
    })
  }),
  t: (key) => key,
  changeLanguage: jest.fn(() => Promise.resolve())
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(() => Promise.resolve())
    }
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {}
  }
}));

// Global mocks
global.ErrorUtils = {
  setGlobalHandler: jest.fn(),
  getGlobalHandler: jest.fn(() => jest.fn())
};

// Silence console errors and warnings in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  if (args[0]?.includes && args[0].includes('Warning:')) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  if (args[0]?.includes && args[0].includes('Warning:')) {
    return;
  }
  originalConsoleWarn(...args);
};

// Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
});
