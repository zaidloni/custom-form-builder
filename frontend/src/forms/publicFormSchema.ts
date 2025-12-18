import { z } from 'zod';
import type { FormField } from '../types';
import { generateFieldKey } from '../utils/fieldKey';

/**
 * Generate a dynamic Zod schema from form field definitions
 * Matches backend validation rules from backend/custom-form-builder/src/utils/validator/submission.validator.ts
 */
export function generatePublicFormSchema(fields: FormField[]) {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    const fieldKey = generateFieldKey(field.label);
    let fieldSchema: z.ZodTypeAny;

    switch (field.fieldType) {
      case 'single-line-text':
      case 'textarea':
        fieldSchema = z.string();
        if (field.validation?.minLength !== undefined) {
          fieldSchema = fieldSchema.min(
            field.validation.minLength,
            `${field.label} must be at least ${field.validation.minLength} characters`
          );
        }
        if (field.validation?.maxLength !== undefined) {
          fieldSchema = fieldSchema.max(
            field.validation.maxLength,
            `${field.label} must be at most ${field.validation.maxLength} characters`
          );
        }
        if (field.validation?.regex) {
          try {
            const regex = new RegExp(field.validation.regex);
            fieldSchema = fieldSchema.regex(
              regex,
              `${field.label} does not match the required pattern`
            );
          } catch {
            // Invalid regex, skip validation
          }
        }
        break;

      case 'number':
        fieldSchema = z.number({
          required_error: `${field.label} must be a valid number`,
        });
        if (field.validation?.min !== undefined) {
          fieldSchema = fieldSchema.min(
            field.validation.min,
            `${field.label} must be at least ${field.validation.min}`
          );
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = fieldSchema.max(
            field.validation.max,
            `${field.label} must be at most ${field.validation.max}`
          );
        }
        break;

      case 'email':
        fieldSchema = z.string().email(`${field.label} must be a valid email address`);
        if (field.validation?.emailPolicy === 'allowed-domains' && field.validation.allowedDomains) {
          const domains = field.validation.allowedDomains.map((d) => d.toLowerCase());
          fieldSchema = fieldSchema.refine(
            (email) => {
              const domain = email.split('@')[1]?.toLowerCase();
              return domain && domains.includes(domain);
            },
            {
              message: `${field.label} must be from one of the allowed domains: ${field.validation.allowedDomains.join(', ')}`,
            }
          );
        }
        break;

      case 'dropdown':
        fieldSchema = z.string();
        break;

      case 'checkbox':
        fieldSchema = z.boolean();
        break;

      case 'date':
        fieldSchema = z.string().refine(
          (date) => !isNaN(new Date(date).getTime()),
          {
            message: `${field.label} must be a valid date`,
          }
        );
        break;

      default:
        fieldSchema = z.string();
    }

    if (field.required) {
      fieldSchema = fieldSchema.min(1, `${field.label} is required`);
    } else {
      fieldSchema = fieldSchema.optional();
    }

    schemaObject[fieldKey] = fieldSchema;
  }

  return z.object(schemaObject);
}

