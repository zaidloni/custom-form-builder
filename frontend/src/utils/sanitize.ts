/**
 * Sanitize user-rendered content to prevent XSS attacks
 * For production, consider using DOMPurify library
 * This is a basic implementation
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitize text content (basic XSS prevention)
 * In production, use DOMPurify for more robust sanitization
 */
export function sanitizeText(text: string): string {
  return escapeHtml(text);
}

/**
 * Sanitize object values recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

