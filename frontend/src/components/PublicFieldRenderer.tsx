import { useFormContext } from 'react-hook-form';
import type { FormField } from '../types';
import { generateFieldKey } from '../utils/fieldKey';

interface PublicFieldRendererProps {
  field: FormField;
}

export function PublicFieldRenderer({ field }: PublicFieldRendererProps) {
  const { register, formState: { errors } } = useFormContext();
  const fieldKey = generateFieldKey(field.label);
  const error = errors[fieldKey];

  const baseInputClasses =
    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
  const errorClasses = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300';

  switch (field.fieldType) {
    case 'single-line-text':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            {...register(fieldKey)}
            placeholder={field.placeholder}
            className={`${baseInputClasses} ${errorClasses}`}
          />
          {field.helpText && (
            <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600">{error.message as string}</p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            {...register(fieldKey)}
            placeholder={field.placeholder}
            rows={4}
            className={`${baseInputClasses} ${errorClasses}`}
          />
          {field.helpText && (
            <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600">{error.message as string}</p>
          )}
        </div>
      );

    case 'number':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            {...register(fieldKey, { valueAsNumber: true })}
            placeholder={field.placeholder}
            className={`${baseInputClasses} ${errorClasses}`}
          />
          {field.helpText && (
            <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600">{error.message as string}</p>
          )}
        </div>
      );

    case 'email':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="email"
            {...register(fieldKey)}
            placeholder={field.placeholder}
            className={`${baseInputClasses} ${errorClasses}`}
          />
          {field.helpText && (
            <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600">{error.message as string}</p>
          )}
        </div>
      );

    case 'dropdown':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            {...register(fieldKey)}
            className={`${baseInputClasses} ${errorClasses}`}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
          {field.helpText && (
            <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600">{error.message as string}</p>
          )}
        </div>
      );

    case 'checkbox':
      return (
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register(fieldKey)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
          {field.helpText && (
            <p className="mt-1 text-sm text-gray-500 ml-6">{field.helpText}</p>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600 ml-6">{error.message as string}</p>
          )}
        </div>
      );

    case 'date':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="date"
            {...register(fieldKey)}
            className={`${baseInputClasses} ${errorClasses}`}
          />
          {field.helpText && (
            <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600">{error.message as string}</p>
          )}
        </div>
      );

    default:
      return null;
  }
}

