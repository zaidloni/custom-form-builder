import type { FieldType } from '../types';

interface FieldTypeSelectorProps {
  value: FieldType;
  onChange: (value: FieldType) => void;
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'single-line-text', label: 'Single Line Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
];

export function FieldTypeSelector({ value, onChange }: FieldTypeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FieldType)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      {fieldTypes.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
}

