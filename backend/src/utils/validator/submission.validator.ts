import { isValidEmail } from './isValidEmail.validator';

interface FormField {
  label: string;
  fieldType: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    emailPolicy?: 'any' | 'allowed-domains';
    allowedDomains?: string[];
    regex?: string;
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Generate a field key from the label (used for storing submission data)
 */
export function generateFieldKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Validate submission data against form field definitions
 */
export function validateSubmission(
  fields: FormField[],
  data: Record<string, any>
): ValidationResult {
  const errors: string[] = [];

  for (const field of fields) {
    const fieldKey = generateFieldKey(field.label);
    const value = data[fieldKey];

    // Check required fields
    if (field.required) {
      if (value === undefined || value === null || value === '') {
        errors.push(`${field.label} is required`);
        continue;
      }
    }

    // Skip validation if field is empty and not required
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const validation = field.validation || {};

    switch (field.fieldType) {
      case 'single-line-text':
      case 'textarea':
        if (typeof value !== 'string') {
          errors.push(`${field.label} must be a string`);
          break;
        }
        if (validation.minLength !== undefined && value.length < validation.minLength) {
          errors.push(`${field.label} must be at least ${validation.minLength} characters`);
        }
        if (validation.maxLength !== undefined && value.length > validation.maxLength) {
          errors.push(`${field.label} must be at most ${validation.maxLength} characters`);
        }
        if (validation.regex) {
          try {
            const regex = new RegExp(validation.regex);
            if (!regex.test(value)) {
              errors.push(`${field.label} does not match the required pattern`);
            }
          } catch {
            // Invalid regex, skip validation
          }
        }
        break;

      case 'number':
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(numValue)) {
          errors.push(`${field.label} must be a valid number`);
          break;
        }
        if (validation.min !== undefined && numValue < validation.min) {
          errors.push(`${field.label} must be at least ${validation.min}`);
        }
        if (validation.max !== undefined && numValue > validation.max) {
          errors.push(`${field.label} must be at most ${validation.max}`);
        }
        break;

      case 'email':
        if (typeof value !== 'string') {
          errors.push(`${field.label} must be a string`);
          break;
        }
        const emailResult = isValidEmail(value);
        if (!emailResult.success) {
          errors.push(`${field.label} must be a valid email address`);
          break;
        }
        if (validation.emailPolicy === 'allowed-domains' && validation.allowedDomains) {
          const domain = value.split('@')[1]?.toLowerCase();
          const allowedDomains = validation.allowedDomains.map(d => d.toLowerCase());
          if (!allowedDomains.includes(domain)) {
            errors.push(`${field.label} must be from one of the allowed domains: ${validation.allowedDomains.join(', ')}`);
          }
        }
        break;

      case 'dropdown':
        if (typeof value !== 'string') {
          errors.push(`${field.label} must be a string`);
        }
        break;

      case 'checkbox':
        if (typeof value !== 'boolean') {
          errors.push(`${field.label} must be a boolean`);
        }
        break;

      case 'date':
        if (typeof value !== 'string') {
          errors.push(`${field.label} must be a string`);
          break;
        }
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          errors.push(`${field.label} must be a valid date`);
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

