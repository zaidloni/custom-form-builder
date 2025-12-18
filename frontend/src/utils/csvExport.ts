import type { FormField } from '../types';
import { generateFieldKey } from './fieldKey';

interface Submission {
  submittedAt: string;
  data: Record<string, any>;
}

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Generate CSV content from submissions
 * Matches backend CSV format from backend/custom-form-builder/src/utils/csvExporter.ts
 */
export function generateCSV(
  fields: FormField[],
  submissions: Submission[]
): string {
  // Build header row: Submitted At + all field labels
  const headers = ['Submitted At', ...fields.map((f) => f.label)];
  const headerRow = headers.map(escapeCSV).join(',');

  // Build data rows
  const dataRows = submissions.map((submission) => {
    const row: string[] = [];

    // Add submitted at
    row.push(escapeCSV(new Date(submission.submittedAt).toISOString()));

    // Add field values using label-derived keys
    for (const field of fields) {
      const fieldKey = generateFieldKey(field.label);
      const value = submission.data[fieldKey];
      row.push(escapeCSV(value));
    }

    return row.join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

