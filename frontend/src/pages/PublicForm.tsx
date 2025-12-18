import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getFormBySlug, submitForm } from '../api/public';
import { generatePublicFormSchema } from '../forms/publicFormSchema';
import { PublicFieldRenderer } from '../components/PublicFieldRenderer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { generateFieldKey } from '../utils/fieldKey';

export default function PublicForm() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['form', slug],
    queryFn: () => getFormBySlug(slug!),
    enabled: !!slug,
  });

  const form = data?.form;

  const schema = form ? generatePublicFormSchema(form.fields) : undefined;

  const methods = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    mode: 'onBlur',
  });

  const submitMutation = useMutation({
    mutationFn: (data: Record<string, any>) => submitForm(slug!, data),
    onSuccess: () => {
      // Prevent duplicate submissions in same session
      sessionStorage.setItem(`form-submitted-${slug}`, 'true');
      methods.reset();
    },
  });

  // Check if already submitted in this session
  const alreadySubmitted = slug
    ? sessionStorage.getItem(`form-submitted-${slug}`) === 'true'
    : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message="Form not found or failed to load" />
      </div>
    );
  }

  const onSubmit = async (data: Record<string, any>) => {
    try {
      // Convert form data to use field keys
      const submissionData: Record<string, any> = {};
      for (const field of form.fields) {
        const fieldKey = generateFieldKey(field.label);
        if (data[fieldKey] !== undefined) {
          submissionData[fieldKey] = data[fieldKey];
        }
      }

      await submitMutation.mutateAsync(submissionData);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  if (submitMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">
            Your form has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.name}</h1>
          {form.description && (
            <p className="text-gray-600 mb-8">{form.description}</p>
          )}

          {alreadySubmitted ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <p className="text-yellow-800">
                You have already submitted this form in this session.
              </p>
            </div>
          ) : (
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
                {form.fields.map((field, index) => (
                  <PublicFieldRenderer key={index} field={field} />
                ))}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {submitMutation.isPending ? 'Submitting...' : 'Submit'}
                  </button>
                </div>

                {submitMutation.isError && (
                  <ErrorMessage
                    message={
                      (submitMutation.error as any)?.message ||
                      'Failed to submit form. Please try again.'
                    }
                  />
                )}
              </form>
            </FormProvider>
          )}
        </div>
      </div>
    </div>
  );
}

