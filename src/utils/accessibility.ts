import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Utility functions for accessibility features
 */
export const AccessibilityUtils = {
  /**
   * Announce a message to screen readers
   * @param message The message to announce
   */
  announce: (message: string): void => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    } else if (Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      // Web platform
      if (typeof document !== 'undefined') {
        const element = document.createElement('div');
        element.setAttribute('aria-live', 'assertive');
        element.setAttribute('role', 'alert');
        element.setAttribute('aria-atomic', 'true');
        element.textContent = message;
        
        document.body.appendChild(element);
        
        // Remove the element after the announcement
        setTimeout(() => {
          if (document.body.contains(element)) {
            document.body.removeChild(element);
          }
        }, 1000);
      }
    }
  },

  /**
   * Check if a screen reader is currently active
   * @returns Promise that resolves to a boolean indicating if a screen reader is enabled
   */
  isScreenReaderEnabled: async (): Promise<boolean> => {
    return await AccessibilityInfo.isScreenReaderEnabled();
  },

  /**
   * Add a listener for screen reader status changes
   * @param onChange Callback function that receives the new screen reader status
   * @returns Function to remove the listener
   */
  addScreenReaderChangedListener: (
    onChange: (isEnabled: boolean) => void
  ): (() => void) => {
    const listener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      onChange
    );
    
    return () => listener.remove();
  },

  /**
   * Check if a color combination has sufficient contrast
   * @param foreground Foreground color in hex format (e.g., "#FFFFFF")
   * @param background Background color in hex format (e.g., "#000000")
   * @returns Boolean indicating if the contrast ratio meets WCAG AA standards (4.5:1)
   */
  hasAdequateContrast: (foreground: string, background: string): boolean => {
    // Convert hex to RGB
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 };
    };

    // Calculate relative luminance
    const calculateLuminance = (color: { r: number; g: number; b: number }): number => {
      const { r, g, b } = color;
      const rs = r / 255;
      const gs = g / 255;
      const bs = b / 255;
      
      const r1 = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
      const g1 = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
      const b1 = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
      
      return 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
    };

    // Calculate contrast ratio
    const calculateContrastRatio = (l1: number, l2: number): number => {
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);
    
    const fgLuminance = calculateLuminance(fgRgb);
    const bgLuminance = calculateLuminance(bgRgb);
    
    const contrastRatio = calculateContrastRatio(fgLuminance, bgLuminance);
    
    // WCAG AA requires a contrast ratio of at least 4.5:1 for normal text
    return contrastRatio >= 4.5;
  },

  /**
   * Generate semantic role and accessibility props for React Native components
   * @param label Accessibility label
   * @param hint Additional hint for screen readers
   * @param role ARIA role for the element
   * @param isDisabled Whether the element is disabled
   * @returns Object with accessibility props
   */
  createAccessibilityProps: (
    label: string,
    hint?: string,
    role?: 'button' | 'link' | 'header' | 'image' | 'text' | 'search' | 'summary' | 'adjustable',
    isDisabled?: boolean
  ) => {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: role,
      accessibilityState: isDisabled ? { disabled: true } : undefined,
    };
  }
};

/**
 * Interface for accessibility state properties
 */
interface AccessibilityState {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean;
  busy?: boolean;
  expanded?: boolean;
}

/**
 * Interface for accessibility props parameters
 */
interface AccessibilityPropsParams {
  label: string;
  hint?: string;
  role?: 'button' | 'link' | 'header' | 'image' | 'text' | 'search' | 'summary' | 'adjustable' | 'checkbox' | 'radio' | 'tab' | 'menu' | 'menuitem' | 'scrollbar' | 'radiogroup';
  state?: AccessibilityState;
}

/**
 * Generate accessibility props for React Native components
 * @param params Object containing accessibility parameters
 * @returns Object with accessibility props
 */
export const getAccessibilityProps = (params: AccessibilityPropsParams) => {
  return {
    accessible: true,
    accessibilityLabel: params.label,
    accessibilityHint: params.hint,
    accessibilityRole: params.role,
    accessibilityState: params.state,
  };
};
