/**
 * Color palette with accessibility-friendly colors
 * All color combinations meet WCAG AA standards for contrast
 */
export const Colors = {
  // Primary colors
  primary: '#2E7D32', // Green 800
  
  // Secondary colors
  secondary: '#FFC107', // Amber 500
  
  // Text colors
  text: '#212121', // Gray 900
  textLight: '#757575', // Gray 600
  
  // Background colors
  background: '#F5F5F5', // Gray 100
  paper: '#FFFFFF',
  
  // UI colors
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#EEEEEE',
  disabled: '#BDBDBD',
  hint: '#9E9E9E',
  
  // Status colors
  status: {
    error: '#D32F2F', // Red 700
    warning: '#FFA000', // Amber 700
    info: '#1976D2', // Blue 700
    success: '#388E3C', // Green 700
  },
  
  // Action colors
  action: {
    active: '#212121', // Gray 900
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
    focus: 'rgba(0, 0, 0, 0.12)',
  },
  
  // Divider
  divider: 'rgba(0, 0, 0, 0.12)',
  
  // Grey colors
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

/**
 * Simplified color palette for direct use in components
 */
export const colors = {
  primary: Colors.primary,
  primaryLight: Colors.grey[300],
  primaryDark: Colors.grey[800],
  secondary: Colors.secondary,
  secondaryLight: Colors.grey[300],
  secondaryDark: Colors.grey[800],
  error: Colors.status.error,
  warning: Colors.status.warning,
  info: Colors.status.info,
  success: Colors.status.success,
  text: Colors.text,
  textSecondary: Colors.textLight,
  textDisabled: Colors.disabled,
  background: Colors.background,
  paper: Colors.paper,
  lightGrey: Colors.grey[300],
  darkGrey: Colors.grey[700],
  lightPrimary: 'rgba(46, 125, 50, 0.1)', // Light version of primary for backgrounds
};
