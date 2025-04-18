import { 
  validate, 
  validateObject, 
  isValid, 
  sanitizeString, 
  sanitizeObject,
  ValidationRules 
} from '../validation';

// Add Jest type definitions
import '@types/jest';

describe('Validation Utility', () => {
  describe('validate', () => {
    it('should return valid for empty rules', () => {
      const result = validate('test', []);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate required rule correctly', () => {
      const requiredRule = ValidationRules.required();
      
      // Valid case
      let result = validate('test', [requiredRule]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // Invalid case
      result = validate('', [requiredRule]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('This field is required');
    });

    it('should validate minLength rule correctly', () => {
      const minLengthRule = ValidationRules.minLength(3);
      
      // Valid case
      let result = validate('test', [minLengthRule]);
      expect(result.isValid).toBe(true);
      
      // Invalid case
      result = validate('te', [minLengthRule]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toBe('Must be at least 3 characters');
    });

    it('should validate maxLength rule correctly', () => {
      const maxLengthRule = ValidationRules.maxLength(4);
      
      // Valid case
      let result = validate('test', [maxLengthRule]);
      expect(result.isValid).toBe(true);
      
      // Invalid case
      result = validate('testing', [maxLengthRule]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toBe('Must be at most 4 characters');
    });

    it('should validate pattern rule correctly', () => {
      const patternRule = ValidationRules.pattern(/^[a-z]+$/);
      
      // Valid case
      let result = validate('test', [patternRule]);
      expect(result.isValid).toBe(true);
      
      // Invalid case
      result = validate('Test123', [patternRule]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toBe('Invalid format');
    });

    it('should validate isNumber rule correctly', () => {
      const isNumberRule = ValidationRules.isNumber();
      
      // Valid cases
      expect(validate('123', [isNumberRule]).isValid).toBe(true);
      expect(validate('123.45', [isNumberRule]).isValid).toBe(true);
      expect(validate('-123', [isNumberRule]).isValid).toBe(true);
      
      // Invalid case
      expect(validate('abc', [isNumberRule]).isValid).toBe(false);
    });

    it('should validate isEmail rule correctly', () => {
      const isEmailRule = ValidationRules.isEmail();
      
      // Valid cases
      expect(validate('test@example.com', [isEmailRule]).isValid).toBe(true);
      expect(validate('test.name@example.co.ke', [isEmailRule]).isValid).toBe(true);
      
      // Invalid cases
      expect(validate('test@', [isEmailRule]).isValid).toBe(false);
      expect(validate('test@example', [isEmailRule]).isValid).toBe(false);
      expect(validate('test.example.com', [isEmailRule]).isValid).toBe(false);
    });

    it('should validate isKenyanPhone rule correctly', () => {
      const isKenyanPhoneRule = ValidationRules.isKenyanPhone();
      
      // Valid case
      expect(validate('254712345678', [isKenyanPhoneRule]).isValid).toBe(true);
      
      // Invalid cases
      expect(validate('0712345678', [isKenyanPhoneRule]).isValid).toBe(false);
      expect(validate('254712345', [isKenyanPhoneRule]).isValid).toBe(false);
      expect(validate('25471234567890', [isKenyanPhoneRule]).isValid).toBe(false);
    });

    it('should validate isKenyanNationalId rule correctly', () => {
      const isKenyanNationalIdRule = ValidationRules.isKenyanNationalId();
      
      // Valid case
      expect(validate('12345678', [isKenyanNationalIdRule]).isValid).toBe(true);
      
      // Invalid cases
      expect(validate('1234567', [isKenyanNationalIdRule]).isValid).toBe(false);
      expect(validate('123456789', [isKenyanNationalIdRule]).isValid).toBe(false);
      expect(validate('abcdefgh', [isKenyanNationalIdRule]).isValid).toBe(false);
    });

    it('should validate custom rule correctly', () => {
      const customRule = ValidationRules.custom(
        value => value === 'valid',
        'Value must be "valid"'
      );
      
      // Valid case
      expect(validate('valid', [customRule]).isValid).toBe(true);
      
      // Invalid case
      const result = validate('invalid', [customRule]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toBe('Value must be "valid"');
    });

    it('should validate multiple rules correctly', () => {
      const rules = [
        ValidationRules.required(),
        ValidationRules.minLength(3),
        ValidationRules.maxLength(10),
        ValidationRules.pattern(/^[a-z]+$/)
      ];
      
      // Valid case
      expect(validate('valid', rules).isValid).toBe(true);
      
      // Invalid cases
      expect(validate('', rules).isValid).toBe(false); // Required
      expect(validate('ab', rules).isValid).toBe(false); // Min length
      expect(validate('abcdefghijk', rules).isValid).toBe(false); // Max length
      expect(validate('Valid123', rules).isValid).toBe(false); // Pattern
    });
  });

  describe('validateObject', () => {
    it('should validate object against schema correctly', () => {
      const schema = {
        name: [ValidationRules.required(), ValidationRules.minLength(3)],
        email: [ValidationRules.isEmail()],
        age: [ValidationRules.isNumber(), ValidationRules.min(18)]
      };
      
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: '25'
      };
      
      const invalidData = {
        name: 'Jo',
        email: 'invalid-email',
        age: '17'
      };
      
      // Valid case
      const validResult = validateObject(validData, schema);
      expect(Object.keys(validResult)).toHaveLength(0);
      
      // Invalid case
      const invalidResult = validateObject(invalidData, schema);
      expect(Object.keys(invalidResult)).toHaveLength(3);
      expect(invalidResult.name).toBeDefined();
      expect(invalidResult.email).toBeDefined();
      expect(invalidResult.age).toBeDefined();
    });

    it('should ignore fields not in schema', () => {
      const schema = {
        name: [ValidationRules.required()]
      };
      
      const data = {
        name: 'John',
        extraField: 'value'
      };
      
      const result = validateObject(data, schema);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('isValid', () => {
    it('should return true for empty errors object', () => {
      expect(isValid({})).toBe(true);
    });

    it('should return false for non-empty errors object', () => {
      expect(isValid({ field: ['Error'] })).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      expect(sanitizeString(input)).toBe(expected);
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString(null as any)).toBe(null);
      expect(sanitizeString(undefined as any)).toBe(undefined);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize strings in object', () => {
      const input = {
        name: '<b>John</b>',
        age: 30,
        nested: {
          html: '<div>Content</div>'
        }
      };
      
      const result = sanitizeObject(input);
      
      expect(result.name).toBe('&lt;b&gt;John&lt;/b&gt;');
      expect(result.age).toBe(30);
      expect(result.nested.html).toBe('&lt;div&gt;Content&lt;/div&gt;');
    });

    it('should handle null and undefined values', () => {
      const input = {
        name: null,
        description: undefined,
        valid: true
      };
      
      const result = sanitizeObject(input);
      
      expect(result.name).toBe(null);
      expect(result.description).toBe(undefined);
      expect(result.valid).toBe(true);
    });
  });
});
