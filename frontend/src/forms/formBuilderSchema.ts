import { z } from 'zod';
import type { FormField } from '../types';

// Field validation schema
const fieldValidationSchema = z
  .object({
    minLength: z.number().min(0).optional(),
    maxLength: z.number().min(1).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    emailPolicy: z.enum(['any', 'allowed-domains']).optional(),
    allowedDomains: z.array(z.string().min(1)).optional(),
    regex: z.string().optional(),
  })
  .optional();

const fieldSchema: z.ZodType<FormField> = z.object({
  label: z.string().min(1, 'Label is required').max(255),
  fieldType: z.enum([
    'single-line-text',
    'textarea',
    'number',
    'email',
    'dropdown',
    'checkbox',
    'date',
  ]),
  required: z.boolean(),
  placeholder: z.string().max(255).optional(),
  helpText: z.string().max(255).optional(),
  validation: fieldValidationSchema,
  column: z.union([z.literal(1), z.literal(2)]).optional(),
  section: z.string().optional(),
  options: z.array(z.string()).optional(),
});

// Form builder schema
export const formBuilderSchema = z.object({
  name: z.string().min(1, 'Form name is required').max(255),
  description: z.string().min(1, 'Description is required').max(255),
  fields: z
    .array(fieldSchema)
    .min(1, 'At least one field is required'),
});

export type FormBuilderInput = z.infer<typeof formBuilderSchema>;

