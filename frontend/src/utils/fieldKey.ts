/**
 * Generate a field key from the label (used for storing submission data)
 * Matches backend logic from backend/custom-form-builder/src/utils/validator/submission.validator.ts
 */
export function generateFieldKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

