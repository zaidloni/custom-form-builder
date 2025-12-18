import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formBuilderSchema, type FormBuilderInput } from '../forms/formBuilderSchema';
import { createForm, editForm, listForms } from '../api/forms';
import { getFormBySlug } from '../api/public';
import { FormMetadata } from '../components/FormMetadata';
import { FieldList } from '../components/FieldList';
import type { FormField } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export default function FormBuilder() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!formId;

  // Fetch form list to get slug
  const { data: formsData, isLoading: isLoadingForms } = useQuery({
    queryKey: ['forms'],
    queryFn: listForms,
    enabled: isEditMode,
  });

  const formMetadata = isEditMode
    ? formsData?.forms.find((f) => f.formId === formId)
    : undefined;

  // Fetch full form data using slug (public endpoint includes fields)
  const { data: fullFormData, isLoading: isLoadingFullForm } = useQuery({
    queryKey: ['form', formMetadata?.slug],
    queryFn: () => getFormBySlug(formMetadata!.slug),
    enabled: isEditMode && !!formMetadata?.slug,
  });

  const existingForm = fullFormData?.form;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormBuilderInput>({
    resolver: zodResolver(formBuilderSchema),
    defaultValues: {
      name: '',
      description: '',
      fields: [],
    },
  });

  // Update form when existing form data loads (only once)
  const [hasInitialized, setHasInitialized] = useState(false);
  useEffect(() => {
    if (existingForm && isEditMode && !hasInitialized) {
      reset({
        name: existingForm.name,
        description: existingForm.description,
        fields: existingForm.fields as FormField[],
      });
      setHasInitialized(true);
    }
  }, [existingForm, isEditMode, reset, hasInitialized]);

  const name = watch('name');
  const description = watch('description');
  const fields = watch('fields') || [];

  // Wait for form data to load in edit mode
  if (isEditMode && (isLoadingForms || isLoadingFullForm)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If form not found in edit mode
  if (isEditMode && !isLoadingForms && !isLoadingFullForm && (!formMetadata || !existingForm)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message="Form not found" />
      </div>
    );
  }

  const createMutation = useMutation({
    mutationFn: createForm,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      navigate(`/forms/${data.formId}/edit`);
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ formId, data }: { formId: string; data: FormBuilderInput }) =>
      editForm(formId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      alert('Form updated successfully!');
    },
  });

  const onSubmit = async (data: FormBuilderInput) => {
    try {
      // Remove frontend-only properties before sending to backend
      const fieldsToSend = data.fields.map(({ column, section, ...field }) => field);

      if (isEditMode && formId) {
        await editMutation.mutateAsync({
          formId,
          data: { ...data, fields: fieldsToSend },
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
          fields: fieldsToSend,
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Form' : 'Create New Form'}
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormMetadata
            name={name}
            description={description}
            slug={formMetadata?.slug || existingForm?.slug}
            formUrl={formMetadata?.formUrl}
            version={formMetadata?.version || existingForm?.version}
            onNameChange={(value) => setValue('name', value)}
            onDescriptionChange={(value) => setValue('description', value)}
          />

          {errors.name && (
            <ErrorMessage message={errors.name.message || 'Name is required'} />
          )}
          {errors.description && (
            <ErrorMessage message={errors.description.message || 'Description is required'} />
          )}

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <FieldList
              fields={fields}
              onChange={(newFields) => setValue('fields', newFields)}
            />
            {errors.fields && (
              <ErrorMessage message={errors.fields.message || 'Fields validation error'} />
            )}
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/forms')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || editMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || createMutation.isPending || editMutation.isPending
                ? 'Saving...'
                : isEditMode
                ? 'Update Form'
                : 'Create Form'}
            </button>
          </div>

          {createMutation.isError && (
            <ErrorMessage
              message={
                (createMutation.error as any)?.message || 'Failed to create form'
              }
            />
          )}
          {editMutation.isError && (
            <ErrorMessage
              message={
                (editMutation.error as any)?.message || 'Failed to update form'
              }
            />
          )}
        </form>
      </div>
    </div>
  );
}

