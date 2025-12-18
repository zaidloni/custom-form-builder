import { publicApiRequest } from './client';
import type {
  RenderFormResponse,
  SubmitFormRequest,
  SubmitFormResponse,
} from '../types';

/**
 * Get form by slug (public endpoint, no auth)
 */
export async function getFormBySlug(slug: string): Promise<RenderFormResponse> {
  return publicApiRequest<RenderFormResponse>(`/forms/${slug}`);
}

/**
 * Submit form data (public endpoint, no auth)
 */
export async function submitForm(
  slug: string,
  data: SubmitFormRequest
): Promise<SubmitFormResponse> {
  return publicApiRequest<SubmitFormResponse>(`/forms/${slug}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

