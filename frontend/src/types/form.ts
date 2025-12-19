export type FieldType =
  | 'single-line-text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'dropdown'
  | 'checkbox'
  | 'date'

export interface FieldValidation {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  emailPolicy?: 'any' | 'allowed-domains'
  allowedDomains?: string[]
  regex?: string
}

export interface FormField {
  id: string // client-side only, for DnD
  label: string
  fieldType: FieldType
  required: boolean
  placeholder?: string
  helpText?: string
  position: string // Grid position: A1-Z4
  validation?: FieldValidation
  options?: string[] // For dropdown
}

export interface FormDefinition {
  formId: string
  slug: string
  name: string
  description: string
  fields: FormField[]
  version: number
  formUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface FormListItem {
  formId: string
  slug: string
  name: string
  description: string
  version: number
  formUrl: string
  createdAt: string
  updatedAt: string
}

export interface Submission {
  submissionId: string
  formVersion: number
  data: Record<string, unknown>
  submittedAt: string
}

export interface SubmissionsResponse {
  status: boolean
  submissions: Submission[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateFormResponse {
  status: boolean
  formId: string
  version: number
  url: string
}

export interface GenerateFormResponse {
  status: boolean
  formId: string
  version: number
  url: string
  name: string
}

export interface ListFormsResponse {
  status: boolean
  forms: FormListItem[]
}

export interface RenderFormResponse {
  status: boolean
  form: {
    formId: string
    slug: string
    name: string
    description: string
    fields: FormField[]
    version: number
  }
}

export interface SubmitFormResponse {
  status: boolean
  submissionId: string
  message: string
}

// Field type metadata for the builder palette
export const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: 'single-line-text', label: 'Text', icon: 'Type' },
  { type: 'textarea', label: 'Textarea', icon: 'AlignLeft' },
  { type: 'email', label: 'Email', icon: 'Mail' },
  { type: 'number', label: 'Number', icon: 'Hash' },
  { type: 'dropdown', label: 'Dropdown', icon: 'ChevronDown' },
  { type: 'checkbox', label: 'Checkbox', icon: 'CheckSquare' },
  { type: 'date', label: 'Date', icon: 'Calendar' },
]

// Default validation by field type
export function getDefaultValidation(fieldType: FieldType): FieldValidation {
  switch (fieldType) {
    case 'single-line-text':
    case 'textarea':
      return { minLength: 0, maxLength: 500 }
    case 'number':
      return { min: 0, max: 1000000 }
    case 'email':
      return { emailPolicy: 'any' }
    default:
      return {}
  }
}

