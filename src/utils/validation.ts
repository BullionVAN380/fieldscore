/**
 * Validation Utility
 * 
 * Provides input validation and sanitization functions to ensure data integrity
 * and prevent security vulnerabilities like XSS and injection attacks.
 */

import { ErrorReporting, ErrorSeverity } from '../services/errorReporting';

/**
 * Input validation rules
 */
export interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  // String validation
  required: (message = 'This field is required'): ValidationRule => ({
    test: (value) => value !== undefined && value !== null && value !== '',
    message
  }),
  
  minLength: (min: number, message = `Must be at least ${min} characters`): ValidationRule => ({
    test: (value) => !value || value.length >= min,
    message
  }),
  
  maxLength: (max: number, message = `Must be at most ${max} characters`): ValidationRule => ({
    test: (value) => !value || value.length <= max,
    message
  }),
  
  pattern: (pattern: RegExp, message = 'Invalid format'): ValidationRule => ({
    test: (value) => !value || pattern.test(value),
    message
  }),
  
  // Number validation
  isNumber: (message = 'Must be a number'): ValidationRule => ({
    test: (value) => !value || !isNaN(Number(value)),
    message
  }),
  
  min: (min: number, message = `Must be at least ${min}`): ValidationRule => ({
    test: (value) => !value || isNaN(Number(value)) || Number(value) >= min,
    message
  }),
  
  max: (max: number, message = `Must be at most ${max}`): ValidationRule => ({
    test: (value) => !value || isNaN(Number(value)) || Number(value) <= max,
    message
  }),
  
  // Phone number validation (Kenya)
  isKenyanPhone: (message = 'Must be a valid Kenyan phone number'): ValidationRule => ({
    test: (value) => !value || /^254[0-9]{9}$/.test(value),
    message
  }),
  
  // National ID validation (Kenya)
  isKenyanNationalId: (message = 'Must be a valid Kenyan National ID'): ValidationRule => ({
    test: (value) => !value || /^[0-9]{8}$/.test(value),
    message
  }),
  
  // Email validation
  isEmail: (message = 'Must be a valid email address'): ValidationRule => ({
    test: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),
  
  // Custom validation
  custom: (testFn: (value: any) => boolean, message = 'Invalid value'): ValidationRule => ({
    test: testFn,
    message
  })
};

/**
 * Validate a value against a set of rules
 * @param value Value to validate
 * @param rules Validation rules
 * @returns Validation result
 */
export const validate = (value: any, rules: ValidationRule[]): ValidationResult => {
  const errors: string[] = [];
  
  for (const rule of rules) {
    if (!rule.test(value)) {
      errors.push(rule.message);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate an object against a schema of rules
 * @param data Object to validate
 * @param schema Validation schema
 * @returns Validation result with field-specific errors
 */
export const validateObject = (
  data: Record<string, any>,
  schema: Record<string, ValidationRule[]>
): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const result = validate(data[field], rules);
    
    if (!result.isValid) {
      errors[field] = result.errors;
    }
  }
  
  return errors;
};

/**
 * Check if validation errors object is empty
 * @param errors Validation errors object
 * @returns True if there are no errors
 */
export const isValid = (errors: Record<string, string[]>): boolean => {
  return Object.keys(errors).length === 0;
};

/**
 * Sanitize a string to prevent XSS attacks
 * @param value String to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (value: string): string => {
  if (!value) return value;
  
  try {
    // Replace potentially dangerous characters
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  } catch (error) {
    ErrorReporting.logError(
      ErrorSeverity.WARNING,
      'Failed to sanitize string',
      error instanceof Error ? error : undefined,
      { value }
    );
    return '';
  }
};

/**
 * Sanitize an object by sanitizing all string values
 * @param data Object to sanitize
 * @returns Sanitized object
 */
export const sanitizeObject = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate and sanitize an object
 * @param data Object to validate and sanitize
 * @param schema Validation schema
 * @returns Validation result and sanitized data
 */
export const validateAndSanitize = (
  data: Record<string, any>,
  schema: Record<string, ValidationRule[]>
): { errors: Record<string, string[]>; sanitizedData: Record<string, any> } => {
  const sanitizedData = sanitizeObject(data);
  const errors = validateObject(sanitizedData, schema);
  
  return {
    errors,
    sanitizedData
  };
};

/**
 * Farmer registration validation schema
 */
export const farmerRegistrationSchema = {
  name: [
    ValidationRules.required('Name is required'),
    ValidationRules.minLength(3, 'Name must be at least 3 characters'),
    ValidationRules.maxLength(100, 'Name must be at most 100 characters')
  ],
  nationalId: [
    ValidationRules.required('National ID is required'),
    ValidationRules.isKenyanNationalId('National ID must be 8 digits')
  ],
  mobileNumber: [
    ValidationRules.required('Mobile number is required'),
    ValidationRules.isKenyanPhone('Mobile number must start with 254 followed by 9 digits')
  ],
  gender: [
    ValidationRules.required('Gender is required')
  ],
  county: [
    ValidationRules.required('County is required')
  ],
  ward: [
    ValidationRules.required('Ward is required')
  ],
  crop: [
    ValidationRules.required('Crop type is required')
  ],
  acres: [
    ValidationRules.required('Acres is required'),
    ValidationRules.isNumber('Acres must be a number'),
    ValidationRules.min(0.1, 'Acres must be greater than 0')
  ],
  uai: [
    ValidationRules.required('UAI is required')
  ]
};

export default {
  validate,
  validateObject,
  isValid,
  sanitizeString,
  sanitizeObject,
  validateAndSanitize,
  ValidationRules,
  farmerRegistrationSchema
};
