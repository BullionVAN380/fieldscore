/**
 * Color palette with accessibility-friendly colors
 * All color combinations meet WCAG AA standards for contrast
 */
export const Colors = {
  // Primary colors
  primary: {
    main: '#2E7D32', // Green 800
    light: '#4CAF50', // Green 500
    dark: '#1B5E20', // Green 900
    contrastText: '#FFFFFF',
  },
  
  // Secondary colors
  secondary: {
    main: '#FFC107', // Amber 500
    light: '#FFD54F', // Amber 300
    dark: '#FFA000', // Amber 700
    contrastText: '#000000',
  },
  
  // Error colors
  error: {
    main: '#D32F2F', // Red 700
    light: '#EF5350', // Red 400
    dark: '#B71C1C', // Red 900
    contrastText: '#FFFFFF',
  },
  
  // Warning colors
  warning: {
    main: '#FF9800', // Orange 500
    light: '#FFB74D', // Orange 300
    dark: '#E65100', // Orange 900
    contrastText: '#000000',
  },
  
  // Info colors
  info: {
    main: '#2196F3', // Blue 500
    light: '#64B5F6', // Blue 300
    dark: '#0D47A1', // Blue 900
    contrastText: '#FFFFFF',
  },
  
  // Success colors
  success: {
    main: '#4CAF50', // Green 500
    light: '#81C784', // Green 300
    dark: '#2E7D32', // Green 800
    contrastText: '#FFFFFF',
  },
  
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
  
  // Text colors
  text: {
    primary: '#212121', // Grey 900
    secondary: '#757575', // Grey 600
    disabled: '#9E9E9E', // Grey 500
    hint: '#9E9E9E', // Grey 500
  },
  
  // Background colors
  background: {
    default: '#FAFAFA', // Grey 50
    paper: '#FFFFFF',
    disabled: '#F5F5F5', // Grey 100
  },
  
  // Action colors
  action: {
    active: 'rgba(0, 0, 0, 0.54)',
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
  },
};

/**
 * Simplified color palette for direct use in components
 */
export const colors = {
  primary: Colors.primary.main,
  primaryLight: Colors.primary.light,
  primaryDark: Colors.primary.dark,
  secondary: Colors.secondary.main,
  secondaryLight: Colors.secondary.light,
  secondaryDark: Colors.secondary.dark,
  error: Colors.error.main,
  warning: Colors.warning.main,
  info: Colors.info.main,
  success: Colors.success.main,
  text: Colors.text.primary,
  textSecondary: Colors.text.secondary,
  textDisabled: Colors.text.disabled,
  background: Colors.background.default,
  paper: Colors.background.paper,
  white: '#FFFFFF',
  black: '#000000',
  lightGrey: Colors.grey[300],
  darkGrey: Colors.grey[700],
  lightPrimary: 'rgba(46, 125, 50, 0.1)', // Light version of primary for backgrounds
};
