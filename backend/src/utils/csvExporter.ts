import { generateFieldKey } from './validator/submission.validator';

interface FormField {
  label: string;
  fieldType: string;
}

interface Submission {
  submittedAt: Date;
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
 * Generate CSV content from submissions with labeled columns
 */
export function generateCSV(
  fields: FormField[],
  submissions: Submission[]
): string {
  // Build header row: Submitted At + all field labels
  const headers = ['Submitted At', ...fields.map(f => f.label)];
  const headerRow = headers.map(escapeCSV).join(',');

  // Build data rows
  const dataRows = submissions.map(submission => {
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

