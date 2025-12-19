import axios from 'axios'
import type {
  ListFormsResponse,
  RenderFormResponse,
  CreateFormResponse,
  GenerateFormResponse,
  SubmitFormResponse,
  SubmissionsResponse,
  FormField,
} from '@/types/form'

const BACKEND_URL = 'http://localhost:3000'

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Separate instance for public endpoints (no proxy)
const publicApi = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth header interceptor
api.interceptors.request.use((config) => {
  const userEmail = localStorage.getItem('formforge_user_email')
  if (userEmail) {
    config.headers['x-user-email'] = userEmail
  }
  return config
})

// Response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.response?.data?.error || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

export const formsApi = {
  // List all forms for the current user
  listForms: async (): Promise<ListFormsResponse> => {
    const response = await api.get<ListFormsResponse>('/api/v1/forms')
    return response.data
  },

  // Get a form by slug (public endpoint - direct to backend)
  getFormBySlug: async (slug: string): Promise<RenderFormResponse> => {
    const response = await publicApi.get<RenderFormResponse>(`/forms/${slug}`)
    return response.data
  },

  // Create a new form
  createForm: async (data: {
    name: string
    description: string
    fields: Omit<FormField, 'id'>[]
  }): Promise<CreateFormResponse> => {
    const response = await api.post<CreateFormResponse>('/api/v1/forms', data)
    return response.data
  },

  // Update an existing form
  updateForm: async (
    formId: string,
    data: {
      name: string
      description: string
      fields: Omit<FormField, 'id'>[]
    }
  ): Promise<CreateFormResponse> => {
    const response = await api.put<CreateFormResponse>(`/api/v1/forms/${formId}`, data)
    return response.data
  },

  // Submit a form (public endpoint - direct to backend)
  submitForm: async (slug: string, data: Record<string, unknown>): Promise<SubmitFormResponse> => {
    const response = await publicApi.post<SubmitFormResponse>(`/forms/${slug}/submit`, data)
    return response.data
  },

  // Get submissions for a form
  getSubmissions: async (
    formId: string,
    params: {
      page?: number
      limit?: number
      from?: string
      to?: string
    }
  ): Promise<SubmissionsResponse> => {
    const response = await api.get<SubmissionsResponse>(
      `/api/v1/forms/${formId}/submissions`,
      { params }
    )
    return response.data
  },

  // Export submissions as CSV
  exportSubmissions: async (
    formId: string,
    params: {
      from?: string
      to?: string
    }
  ): Promise<Blob> => {
    const response = await api.get(`/api/v1/forms/${formId}/submissions`, {
      params: { ...params, export: true },
      responseType: 'blob',
    })
    return response.data
  },

  // Generate a form using AI
  generateForm: async (prompt: string): Promise<GenerateFormResponse> => {
    const response = await api.post<GenerateFormResponse>('/api/v1/forms/generate', { prompt })
    return response.data
  },
}

