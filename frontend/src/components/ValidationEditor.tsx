import type { FormField, FieldValidation } from '../types';

interface ValidationEditorProps {
  field: FormField;
  onChange: (validation: FieldValidation | undefined) => void;
}

export function ValidationEditor({ field, onChange }: ValidationEditorProps) {
  const validation = field.validation || {};

  const handleChange = (key: keyof FieldValidation, value: any) => {
    const newValidation = { ...validation, [key]: value };
    // Remove undefined values
    Object.keys(newValidation).forEach((k) => {
      if (newValidation[k as keyof FieldValidation] === undefined || newValidation[k as keyof FieldValidation] === '') {
        delete newValidation[k as keyof FieldValidation];
      }
    });
    onChange(Object.keys(newValidation).length > 0 ? newValidation : undefined);
  };

  if (field.fieldType === 'single-line-text' || field.fieldType === 'textarea') {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Length
          </label>
          <input
            type="number"
            min="0"
            value={validation.minLength || ''}
            onChange={(e) => handleChange('minLength', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Length
          </label>
          <input
            type="number"
            min="1"
            value={validation.maxLength || ''}
            onChange={(e) => handleChange('maxLength', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Regex Pattern
          </label>
          <input
            type="text"
            value={validation.regex || ''}
            onChange={(e) => handleChange('regex', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Optional regex pattern"
          />
        </div>
      </div>
    );
  }

  if (field.fieldType === 'number') {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Value
          </label>
          <input
            type="number"
            value={validation.min !== undefined ? validation.min : ''}
            onChange={(e) => handleChange('min', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Value
          </label>
          <input
            type="number"
            value={validation.max !== undefined ? validation.max : ''}
            onChange={(e) => handleChange('max', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Optional"
          />
        </div>
      </div>
    );
  }

  if (field.fieldType === 'email') {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Policy
          </label>
          <select
            value={validation.emailPolicy || 'any'}
            onChange={(e) => {
              const policy = e.target.value as 'any' | 'allowed-domains';
              if (policy === 'any') {
                handleChange('emailPolicy', 'any');
                handleChange('allowedDomains', undefined);
              } else {
                handleChange('emailPolicy', 'allowed-domains');
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="any">Any Email</option>
            <option value="allowed-domains">Allowed Domains Only</option>
          </select>
        </div>
        {validation.emailPolicy === 'allowed-domains' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allowed Domains (comma-separated)
            </label>
            <input
              type="text"
              value={validation.allowedDomains?.join(', ') || ''}
              onChange={(e) => {
                const domains = e.target.value
                  .split(',')
                  .map((d) => d.trim())
                  .filter((d) => d.length > 0);
                handleChange('allowedDomains', domains.length > 0 ? domains : undefined);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="example.com, company.com"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <p className="text-sm text-gray-500">No validation options available for this field type.</p>
  );
}

