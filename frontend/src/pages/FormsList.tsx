import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listForms } from '../api/forms';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { format } from 'date-fns';

export default function FormsList() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['forms'],
    queryFn: listForms,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message="Failed to load forms" />
      </div>
    );
  }

  const forms = data?.forms || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Forms</h1>
          <button
            onClick={() => navigate('/forms/new')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create New Form
          </button>
        </div>

        {forms.length === 0 ? (
          <EmptyState
            title="No forms yet"
            message="Get started by creating your first form"
            actionLabel="Create Form"
            onAction={() => navigate('/forms/new')}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <div
                key={`${form.formId}-${form.version}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/forms/${form.formId}/edit`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {form.name}
                  </h2>
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    v{form.version}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {form.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Updated {format(new Date(form.updatedAt), 'MMM d, yyyy')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/forms/${form.formId}/submissions`);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Submissions
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

