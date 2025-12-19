import crypto from 'crypto';

/**
 * Generates a SHA-256 hash of a URL for fast indexed lookups
 * @param url - The full URL to hash
 * @returns 64-character hexadecimal hash string
 */
export function generateUrlHash(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex');
}

