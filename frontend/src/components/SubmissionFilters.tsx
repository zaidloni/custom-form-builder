import { useState } from 'react';
import type { FormField } from '../types';

interface SubmissionFiltersProps {
  fields: FormField[];
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
  fieldFilters: Record<string, string>;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onFieldFilterChange: (fieldKey: string, value: string) => void;
  onClearFilters: () => void;
}

export function SubmissionFilters({
  fields,
  dateFrom,
  dateTo,
  searchQuery,
  fieldFilters,
  onDateFromChange,
  onDateToChange,
  onSearchChange,
  onFieldFilterChange,
  onClearFilters,
}: SubmissionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const dropdownFields = fields.filter((f) => f.fieldType === 'dropdown' && f.options && f.options.length > 0);
  const hasActiveFilters = dateFrom || dateTo || searchQuery || Object.values(fieldFilters).some((v) => v);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search across all fields..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {dropdownFields.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field Filters
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dropdownFields.map((field) => {
                  const fieldKey = field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                  return (
                    <div key={field.label}>
                      <label className="block text-xs text-gray-600 mb-1">
                        {field.label}
                      </label>
                      <select
                        value={fieldFilters[fieldKey] || ''}
                        onChange={(e) => onFieldFilterChange(fieldKey, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">All</option>
                        {field.options?.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

