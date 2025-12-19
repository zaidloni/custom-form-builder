import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { FormField } from '@/types/form'

interface DynamicFieldProps {
  field: FormField
  value: unknown
  onChange: (value: unknown) => void
  error?: string
}

export function DynamicField({ field, value, onChange, error }: DynamicFieldProps) {
  const renderInput = () => {
    switch (field.fieldType) {
      case 'single-line-text':
        return (
          <Input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(error && 'border-destructive focus-visible:ring-destructive')}
          />
        )

      case 'textarea':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(error && 'border-destructive focus-visible:ring-destructive')}
          />
        )

      case 'email':
        return (
          <Input
            type="email"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'email@example.com'}
            className={cn(error && 'border-destructive focus-visible:ring-destructive')}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={cn(error && 'border-destructive focus-visible:ring-destructive')}
          />
        )

      case 'dropdown':
        return (
          <Select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            options={(field.options || []).map((opt) => ({ value: opt, label: opt }))}
            placeholder="Select an option..."
            className={cn(error && 'border-destructive focus-visible:ring-destructive')}
          />
        )

      case 'checkbox':
        return (
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={(e) => onChange(e.target.checked)}
              className={cn(
                'w-5 h-5 rounded border-input cursor-pointer',
                error && 'border-destructive'
              )}
              id={`checkbox-${field.label}`}
            />
            <label
              htmlFor={`checkbox-${field.label}`}
              className="text-sm cursor-pointer"
            >
              {field.placeholder || 'Check this box'}
            </label>
          </div>
        )

      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(error && 'border-destructive focus-visible:ring-destructive')}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      {field.fieldType !== 'checkbox' && (
        <Label className="flex items-center gap-1">
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {renderInput()}
      {field.helpText && !error && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && (
        <p className="text-sm text-destructive animate-fade-in">{error}</p>
      )}
    </div>
  )
}

