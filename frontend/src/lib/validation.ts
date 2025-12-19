import type { FormField } from '@/types/form'
import { generateFieldKey } from './utils'

interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateSubmission(
  fields: FormField[],
  data: Record<string, unknown>
): ValidationResult {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    const fieldKey = generateFieldKey(field.label)
    const value = data[fieldKey]

    // Check required fields
    if (field.required) {
      if (value === undefined || value === null || value === '') {
        errors[fieldKey] = `${field.label} is required`
        continue
      }
    }

    // Skip validation if field is empty and not required
    if (value === undefined || value === null || value === '') {
      continue
    }

    const validation = field.validation || {}

    switch (field.fieldType) {
      case 'single-line-text':
      case 'textarea':
        if (typeof value !== 'string') {
          errors[fieldKey] = `${field.label} must be text`
          break
        }
        if (validation.minLength !== undefined && value.length < validation.minLength) {
          errors[fieldKey] = `${field.label} must be at least ${validation.minLength} characters`
        }
        if (validation.maxLength !== undefined && value.length > validation.maxLength) {
          errors[fieldKey] = `${field.label} must be at most ${validation.maxLength} characters`
        }
        if (validation.regex) {
          try {
            const regex = new RegExp(validation.regex)
            if (!regex.test(value)) {
              errors[fieldKey] = `${field.label} does not match the required pattern`
            }
          } catch {
            // Invalid regex, skip validation
          }
        }
        break

      case 'number': {
        const numValue = typeof value === 'number' ? value : parseFloat(String(value))
        if (isNaN(numValue)) {
          errors[fieldKey] = `${field.label} must be a valid number`
          break
        }
        if (validation.min !== undefined && numValue < validation.min) {
          errors[fieldKey] = `${field.label} must be at least ${validation.min}`
        }
        if (validation.max !== undefined && numValue > validation.max) {
          errors[fieldKey] = `${field.label} must be at most ${validation.max}`
        }
        break
      }

      case 'email':
        if (typeof value !== 'string') {
          errors[fieldKey] = `${field.label} must be text`
          break
        }
        if (!isValidEmail(value)) {
          errors[fieldKey] = `${field.label} must be a valid email address`
          break
        }
        if (validation.emailPolicy === 'allowed-domains' && validation.allowedDomains) {
          const domain = value.split('@')[1]?.toLowerCase()
          const allowedDomains = validation.allowedDomains.map((d) => d.toLowerCase())
          if (!allowedDomains.includes(domain)) {
            errors[fieldKey] = `${field.label} must be from: ${validation.allowedDomains.join(', ')}`
          }
        }
        break

      case 'dropdown':
        if (typeof value !== 'string') {
          errors[fieldKey] = `${field.label} must be selected`
        }
        break

      case 'checkbox':
        if (typeof value !== 'boolean') {
          errors[fieldKey] = `${field.label} is invalid`
        }
        break

      case 'date':
        if (typeof value !== 'string') {
          errors[fieldKey] = `${field.label} must be a date`
          break
        }
        const dateValue = new Date(value)
        if (isNaN(dateValue.getTime())) {
          errors[fieldKey] = `${field.label} must be a valid date`
        }
        break
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

