import { useState } from 'react';
import type { FormField } from '../types';
import { FieldTypeSelector } from './FieldTypeSelector';
import { ValidationEditor } from './ValidationEditor';

interface FieldEditorProps {
  field: FormField;
  onChange: (field: FormField) => void;
  onDelete: () => void;
}

export function FieldEditor({ field, onChange, onDelete }: FieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateField = (updates: Partial<FormField>) => {
    onChange({ ...field, ...updates });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 text-left font-medium text-gray-900"
        >
          {field.label || 'Untitled Field'}
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
        >
          Delete
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => updateField({ label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Field label"
              maxLength={255}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type <span className="text-red-500">*</span>
            </label>
            <FieldTypeSelector
              value={field.fieldType}
              onChange={(value) => {
                // Reset validation when type changes
                updateField({ fieldType: value, validation: undefined });
              }}
            />
          </div>

          {field.fieldType === 'dropdown' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options (one per line)
              </label>
              <textarea
                value={field.options?.join('\n') || ''}
                onChange={(e) => {
                  const options = e.target.value
                    .split('\n')
                    .map((o) => o.trim())
                    .filter((o) => o.length > 0);
                  updateField({ options: options.length > 0 ? options : undefined });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter one option per line. These are frontend-only and may not be supported by the backend.
              </p>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id={`required-${field.label}`}
              checked={field.required}
              onChange={(e) => updateField({ required: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`required-${field.label}`} className="ml-2 text-sm text-gray-700">
              Required field
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => updateField({ placeholder: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Optional placeholder text"
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text
            </label>
            <input
              type="text"
              value={field.helpText || ''}
              onChange={(e) => updateField({ helpText: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Optional help text"
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Column Layout
            </label>
            <select
              value={field.column || 1}
              onChange={(e) => updateField({ column: Number(e.target.value) as 1 | 2 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={1}>1 Column (Full Width)</option>
              <option value={2}>2 Columns (Half Width)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Frontend-only feature. Not sent to backend.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section Group
            </label>
            <input
              type="text"
              value={field.section || ''}
              onChange={(e) => updateField({ section: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Optional section name"
            />
            <p className="text-xs text-gray-500 mt-1">
              Frontend-only feature. Not sent to backend.
            </p>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validation Rules
            </label>
            <ValidationEditor
              field={field}
              onChange={(validation) => updateField({ validation })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

