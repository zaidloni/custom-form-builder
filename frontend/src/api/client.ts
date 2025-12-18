import type { ApiError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Get user email from environment variable or localStorage
 * This is a temporary solution until proper authentication is implemented
 */
function getUserEmail(): string {
  const envEmail = import.meta.env.VITE_USER_EMAIL;
  if (envEmail) return envEmail;
  
  const storedEmail = localStorage.getItem('user-email');
  if (storedEmail) return storedEmail;
  
  // Default fallback for development
  return 'user@example.com';
}

/**
 * Create headers for authenticated requests
 */
function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-user-email': getUserEmail(),
  };
}

/**
 * Create headers for public requests (no auth)
 */
function getPublicHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Handle API errors
 */
async function handleError(response: Response): Promise<never> {
  let error: ApiError;
  try {
    error = await response.json();
  } catch {
    error = {
      statusCode: response.status,
      error: 'Unknown Error',
      message: `Request failed with status ${response.status}`,
    };
  }
  throw error;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}

/**
 * Make a public API request (no authentication)
 */
export async function publicApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getPublicHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}

