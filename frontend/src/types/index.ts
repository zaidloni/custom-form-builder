// Type definitions based on backend models and schemas

export type FieldType =
  | 'single-line-text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'dropdown'
  | 'checkbox'
  | 'date';

export interface FieldValidation {
  // Text/Textarea validation
  minLength?: number;
  maxLength?: number;
  regex?: string;
  
  // Number validation
  min?: number;
  max?: number;
  
  // Email validation
  emailPolicy?: 'any' | 'allowed-domains';
  allowedDomains?: string[];
}

export interface FormField {
  label: string;
  fieldType: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: FieldValidation;
  
  // Frontend-only metadata (not sent to backend)
  // These are stored in the field object but backend ignores extra properties
  column?: 1 | 2;
  section?: string;
  
  // Dropdown options (assumed - not explicitly in backend schema)
  // If backend doesn't support this, dropdown fields won't have options
  options?: string[];
}

export interface FormDefinition {
  formId: string;
  slug: string;
  formUrl: string;
  name: string;
  description: string;
  fields: FormField[];
  createdBy: string;
  updatedBy: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Submission {
  submissionId: string;
  formId: string;
  formVersion: number;
  slug: string;
  data: Record<string, any>;
  submittedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Request/Response Types

export interface CreateFormRequest {
  name: string;
  description: string;
  fields: FormField[];
}

export interface CreateFormResponse {
  status: true;
  formId: string;
  version: number;
  url: string;
}

export interface EditFormRequest {
  name: string;
  description: string;
  fields: FormField[];
}

export interface EditFormResponse {
  status: true;
  formId: string;
  version: number;
  url: string;
}

export interface ListFormsResponse {
  status: true;
  forms: Array<{
    formId: string;
    slug: string;
    name: string;
    description: string;
    version: number;
    formUrl: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface RenderFormResponse {
  status: true;
  form: {
    formId: string;
    slug: string;
    name: string;
    description: string;
    fields: FormField[];
    version: number;
  };
}

export interface SubmitFormRequest {
  [key: string]: any; // Dynamic keys based on field labels
}

export interface SubmitFormResponse {
  status: true;
  submissionId: string;
  message: string;
}

export interface ListSubmissionsResponse {
  status: true;
  submissions: Array<{
    submissionId: string;
    formVersion: number;
    data: Record<string, any>;
    submittedAt: string;
  }>;
  total: number;
}

export interface ApiError {
  statusCode?: number;
  error?: string;
  message?: string;
  status?: false;
}

