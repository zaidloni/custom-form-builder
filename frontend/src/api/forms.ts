import { apiRequest } from './client';
import type {
  CreateFormRequest,
  CreateFormResponse,
  EditFormRequest,
  EditFormResponse,
  ListFormsResponse,
} from '../types';

/**
 * Create a new form
 */
export async function createForm(data: CreateFormRequest): Promise<CreateFormResponse> {
  return apiRequest<CreateFormResponse>('/api/v1/forms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Edit an existing form (creates new version)
 */
export async function editForm(
  formId: string,
  data: EditFormRequest
): Promise<EditFormResponse> {
  return apiRequest<EditFormResponse>(`/api/v1/forms/${formId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * List all forms for the current user
 */
export async function listForms(): Promise<ListFormsResponse> {
  return apiRequest<ListFormsResponse>('/api/v1/forms');
}

