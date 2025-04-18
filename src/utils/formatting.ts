import { format, formatDistance, formatRelative, isToday, isYesterday } from 'date-fns';
import { enUS, sw } from 'date-fns/locale';
import i18next from 'i18next';

/**
 * Utility functions for formatting dates, times, and currencies
 */
export const FormattingUtils = {
  /**
   * Format a date according to the current locale
   * @param date The date to format
   * @param formatString The format string to use (default: 'PPP')
   * @returns Formatted date string
   */
  formatDate: (date: Date | number, formatString: string = 'PPP'): string => {
    const locale = i18next.language === 'sw' ? sw : enUS;
    
    // Check if the date is today or yesterday
    if (isToday(date)) {
      return i18next.t('dateTime.today');
    } else if (isYesterday(date)) {
      return i18next.t('dateTime.yesterday');
    }
    
    return format(date, formatString, { locale });
  },

  /**
   * Format a date relative to the current time (e.g., "5 minutes ago")
   * @param date The date to format
   * @returns Formatted relative date string
   */
  formatRelativeTime: (date: Date | number): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - (date instanceof Date ? date.getTime() : date)) / 1000);
    
    if (diffInSeconds < 60) {
      return i18next.t('dateTime.justNow');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return i18next.t('dateTime.minutesAgo', { count: minutes });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return i18next.t('dateTime.hoursAgo', { count: hours });
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return i18next.t('dateTime.daysAgo', { count: days });
    }
    
    // Fall back to standard date formatting for older dates
    return FormattingUtils.formatDate(date);
  },

  /**
   * Format a currency amount according to the current locale
   * @param amount The amount to format
   * @param currency The currency code (default: 'KES')
   * @returns Formatted currency string
   */
  formatCurrency: (amount: number, currency: string = 'KES'): string => {
    if (currency === 'KES') {
      return i18next.t('currency.kes', { amount: amount.toLocaleString() });
    }
    
    // For other currencies, use the browser's built-in formatter
    return new Intl.NumberFormat(i18next.language, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  /**
   * Format a number according to the current locale
   * @param number The number to format
   * @param minimumFractionDigits Minimum number of decimal places
   * @param maximumFractionDigits Maximum number of decimal places
   * @returns Formatted number string
   */
  formatNumber: (
    number: number,
    minimumFractionDigits: number = 0,
    maximumFractionDigits: number = 2
  ): string => {
    return new Intl.NumberFormat(i18next.language, {
      minimumFractionDigits,
      maximumFractionDigits
    }).format(number);
  },

  /**
   * Format a phone number according to the current locale
   * @param phoneNumber The phone number to format
   * @returns Formatted phone number string
   */
  formatPhoneNumber: (phoneNumber: string): string => {
    // Format Kenyan phone numbers (254XXXXXXXXX)
    if (phoneNumber.startsWith('254') && phoneNumber.length === 12) {
      return `+${phoneNumber.substring(0, 3)} ${phoneNumber.substring(3, 6)} ${phoneNumber.substring(6, 9)} ${phoneNumber.substring(9)}`;
    }
    
    // Return unformatted for other formats
    return phoneNumber;
  }
};
