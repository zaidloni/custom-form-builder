import { apiRequest } from './client';
import type { ListSubmissionsResponse } from '../types';

export interface ListSubmissionsParams {
  formId: string;
  from?: string; // ISO date string
  to?: string; // ISO date string
  export?: boolean;
}

/**
 * List submissions for a form
 * If export=true, returns CSV content as text
 */
export async function listSubmissions(
  params: ListSubmissionsParams
): Promise<ListSubmissionsResponse | string> {
  const queryParams = new URLSearchParams();
  if (params.from) queryParams.set('from', params.from);
  if (params.to) queryParams.set('to', params.to);
  if (params.export) queryParams.set('export', 'true');

  const endpoint = `/api/v1/forms/${params.formId}/submissions?${queryParams.toString()}`;
  
  if (params.export) {
    // For CSV export, return as text
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'x-user-email': import.meta.env.VITE_USER_EMAIL || localStorage.getItem('user-email') || 'user@example.com',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to export: ${response.statusText}`);
    }

    return response.text();
  }

  return apiRequest<ListSubmissionsResponse>(endpoint);
}

