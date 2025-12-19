import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { generateFieldKey } from '@/lib/utils'
import type { FormField } from '@/types/form'
import { Plus, X } from 'lucide-react'

interface FieldEditorProps {
  field: FormField
  onUpdate: (field: FormField) => void
  existingLabels: string[]
}

export function FieldEditor({ field, onUpdate, existingLabels }: FieldEditorProps) {
  const [newOption, setNewOption] = useState('')

  const handleChange = <K extends keyof FormField>(key: K, value: FormField[K]) => {
    onUpdate({ ...field, [key]: value })
  }

  const handleValidationChange = (key: string, value: unknown) => {
    onUpdate({
      ...field,
      validation: { ...field.validation, [key]: value },
    })
  }

  const handleAddOption = () => {
    if (!newOption.trim()) return
    const options = field.options || []
    if (!options.includes(newOption.trim())) {
      handleChange('options', [...options, newOption.trim()])
    }
    setNewOption('')
  }

  const handleRemoveOption = (option: string) => {
    handleChange('options', (field.options || []).filter((o) => o !== option))
  }

  const labelError = existingLabels.some(
    (l) => generateFieldKey(l) === generateFieldKey(field.label)
  )

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Field Properties</h3>

      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={field.label}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="Field label"
        />
        {labelError && (
          <p className="text-xs text-destructive">
            Another field has a similar label
          </p>
        )}
        <p className="text-xs text-muted-foreground font-mono">
          Key: {generateFieldKey(field.label)}
        </p>
      </div>

      {/* Required */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="required"
          checked={field.required}
          onChange={(e) => handleChange('required', e.target.checked)}
          className="w-4 h-4 rounded border-input"
        />
        <Label htmlFor="required" className="cursor-pointer">
          Required field
        </Label>
      </div>

      {/* Placeholder */}
      {['single-line-text', 'textarea', 'email', 'number'].includes(field.fieldType) && (
        <div className="space-y-2">
          <Label htmlFor="placeholder">Placeholder</Label>
          <Input
            id="placeholder"
            value={field.placeholder || ''}
            onChange={(e) => handleChange('placeholder', e.target.value)}
            placeholder="Enter placeholder text..."
          />
        </div>
      )}

      {/* Help text */}
      <div className="space-y-2">
        <Label htmlFor="helpText">Help Text</Label>
        <Textarea
          id="helpText"
          value={field.helpText || ''}
          onChange={(e) => handleChange('helpText', e.target.value)}
          placeholder="Optional help text..."
          rows={2}
        />
      </div>

      {/* Position */}
      <div className="space-y-2">
        <Label>Position</Label>
        <div className="flex gap-2">
          <Select
            value={field.position.charAt(0)}
            onChange={(e) => {
              const col = field.position.charAt(1)
              handleChange('position', `${e.target.value}${col}`)
            }}
            options={Array.from({ length: 26 }, (_, i) => ({
              value: String.fromCharCode(65 + i),
              label: `Row ${String.fromCharCode(65 + i)}`,
            }))}
            className="flex-1"
          />
          <Select
            value={field.position.charAt(1)}
            onChange={(e) => {
              const row = field.position.charAt(0)
              handleChange('position', `${row}${e.target.value}`)
            }}
            options={[
              { value: '1', label: 'Col 1' },
              { value: '2', label: 'Col 2' },
              { value: '3', label: 'Col 3' },
              { value: '4', label: 'Col 4' },
            ]}
            className="flex-1"
          />
        </div>
      </div>

      {/* Field-specific validation */}
      {['single-line-text', 'textarea'].includes(field.fieldType) && (
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm">Validation</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="minLength">Min Length</Label>
              <Input
                id="minLength"
                type="number"
                min={0}
                value={field.validation?.minLength ?? 0}
                onChange={(e) => handleValidationChange('minLength', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLength">Max Length</Label>
              <Input
                id="maxLength"
                type="number"
                min={1}
                value={field.validation?.maxLength ?? 500}
                onChange={(e) => handleValidationChange('maxLength', parseInt(e.target.value) || 500)}
              />
            </div>
          </div>
        </div>
      )}

      {field.fieldType === 'number' && (
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm">Validation</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="min">Min Value</Label>
              <Input
                id="min"
                type="number"
                value={field.validation?.min ?? 0}
                onChange={(e) => handleValidationChange('min', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Max Value</Label>
              <Input
                id="max"
                type="number"
                value={field.validation?.max ?? 1000000}
                onChange={(e) => handleValidationChange('max', parseFloat(e.target.value) || 1000000)}
              />
            </div>
          </div>
        </div>
      )}

      {field.fieldType === 'email' && (
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm">Validation</h4>
          <div className="space-y-2">
            <Label htmlFor="emailPolicy">Email Policy</Label>
            <Select
              id="emailPolicy"
              value={field.validation?.emailPolicy || 'any'}
              onChange={(e) => handleValidationChange('emailPolicy', e.target.value)}
              options={[
                { value: 'any', label: 'Any email domain' },
                { value: 'allowed-domains', label: 'Specific domains only' },
              ]}
            />
          </div>
          {field.validation?.emailPolicy === 'allowed-domains' && (
            <div className="space-y-2">
              <Label>Allowed Domains</Label>
              <Input
                placeholder="e.g., gmail.com, company.com"
                value={(field.validation?.allowedDomains || []).join(', ')}
                onChange={(e) =>
                  handleValidationChange(
                    'allowedDomains',
                    e.target.value.split(',').map((d) => d.trim()).filter(Boolean)
                  )
                }
              />
            </div>
          )}
        </div>
      )}

      {field.fieldType === 'dropdown' && (
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm">Dropdown Options</h4>
          <div className="space-y-2">
            {(field.options || []).map((option) => (
              <div key={option} className="flex items-center gap-2">
                <span className="flex-1 text-sm truncate bg-muted/50 px-3 py-2 rounded-md">
                  {option}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => handleRemoveOption(option)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New option..."
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddOption()
                }
              }}
            />
            <Button variant="outline" size="icon" onClick={handleAddOption}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

