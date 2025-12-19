/**
 * Position Validator
 * Validates form field positions follow grid-based layout rules:
 * - Format: Single uppercase letter (A-Z) + single digit (1-4), e.g., A1, B3
 * - All positions must be unique
 * - Row-based contiguity: Each row must start at column 1 and be contiguous
 */

interface PositionValidationResult {
    valid: boolean;
    errors: string[];
}

interface FieldWithPosition {
    position: string;
    label?: string;
}

const POSITION_PATTERN = /^[A-Z][1-4]$/;

/**
 * Validates that all field positions in a form follow the grid layout rules
 * @param fields - Array of form fields with position property
 * @returns Validation result with errors if any
 */
export function validateFieldPositions(fields: FieldWithPosition[]): PositionValidationResult {
    const errors: string[] = [];
    const positions = new Set<string>();

    // Extract and validate individual positions
    for (const field of fields) {
        const position = field.position;

        // Format validation (should already be validated by JSON schema, but double-check)
        if (!POSITION_PATTERN.test(position)) {
            errors.push(
                `Invalid position format "${position}" for field "${field.label || 'unknown'}". ` +
                `Expected format: A-Z followed by 1-4 (e.g., A1, B3)`
            );
            continue;
        }

        // Uniqueness check
        if (positions.has(position)) {
            errors.push(`Duplicate position "${position}" found. Each field must have a unique position.`);
        }
        positions.add(position);
    }

    // If we have format/uniqueness errors, return early
    if (errors.length > 0) {
        return { valid: false, errors };
    }

    // Row-based contiguity validation
    const rowGroups = groupPositionsByRow(Array.from(positions));
    const contiguityErrors = validateRowContiguity(rowGroups);
    errors.push(...contiguityErrors);

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Groups positions by their row letter
 * @param positions - Array of position strings (e.g., ['A1', 'A2', 'B1'])
 * @returns Map of row letter to array of column numbers
 */
function groupPositionsByRow(positions: string[]): Map<string, number[]> {
    const rowGroups = new Map<string, number[]>();

    for (const position of positions) {
        const row = position.charAt(0);
        const col = parseInt(position.charAt(1), 10);

        if (!rowGroups.has(row)) {
            rowGroups.set(row, []);
        }
        rowGroups.get(row)!.push(col);
    }

    // Sort columns within each row
    for (const [row, cols] of rowGroups) {
        rowGroups.set(row, cols.sort((a, b) => a - b));
    }

    return rowGroups;
}

/**
 * Validates that each row follows contiguity rules:
 * - Must start at column 1
 * - No gaps between columns
 * - Rows must be contiguous (can't have B without A, can't have C without A and B)
 * @param rowGroups - Map of row letter to sorted array of column numbers
 * @returns Array of error messages
 */
function validateRowContiguity(rowGroups: Map<string, number[]>): string[] {
    const errors: string[] = [];

    // Get all row letters and sort them
    const rows = Array.from(rowGroups.keys()).sort();

    // Validate row-level contiguity (rows must start from A and be contiguous)
    if (rows.length > 0) {
        // First row must be 'A'
        if (rows[0] !== 'A') {
            errors.push(
                `Rows must start from A. Found first row: ${rows[0]}. ` +
                `Add row A or adjust field positions.`
            );
        }

        // Check for gaps between rows
        for (let i = 1; i < rows.length; i++) {
            const expectedRow = String.fromCharCode(rows[i - 1].charCodeAt(0) + 1);
            if (rows[i] !== expectedRow) {
                errors.push(
                    `Gap in rows: missing row ${expectedRow}. ` +
                    `Rows must be contiguous (found row ${rows[i - 1]} and row ${rows[i]}).`
                );
            }
        }
    }

    // Validate column contiguity within each row
    for (const [row, cols] of rowGroups) {
        // Check if row starts at column 1
        if (cols[0] !== 1) {
            errors.push(
                `Row ${row} must start at column 1. Found: ${row}${cols[0]}. ` +
                `Add ${row}1 or adjust field positions.`
            );
            continue;
        }

        // Check for contiguity (no gaps)
        for (let i = 1; i < cols.length; i++) {
            if (cols[i] !== cols[i - 1] + 1) {
                const missingCol = cols[i - 1] + 1;
                errors.push(
                    `Gap in row ${row}: missing position ${row}${missingCol}. ` +
                    `Columns must be contiguous (found ${row}${cols[i - 1]} and ${row}${cols[i]}).`
                );
            }
        }
    }

    return errors;
}

/**
 * Extracts position from a field, with fallback for type safety
 */
export function getFieldPosition(field: any): string {
    return typeof field?.position === 'string' ? field.position : '';
}

