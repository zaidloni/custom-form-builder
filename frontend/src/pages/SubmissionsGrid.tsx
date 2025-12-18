import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listForms } from '../api/forms';
import { listSubmissions } from '../api/submissions';
import { SubmissionsTable } from '../components/SubmissionsTable';
import { SubmissionFilters } from '../components/SubmissionFilters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { generateCSV, downloadCSV } from '../utils/csvExport';
import type { FormField } from '../types';

export default function SubmissionsGrid() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});

  // Fetch form to get field definitions
  const { data: formsData } = useQuery({
    queryKey: ['forms'],
    queryFn: listForms,
  });

  const form = formsData?.forms.find((f) => f.formId === formId);
  const fields = (form?.fields || []) as FormField[];

  // Fetch submissions
  const { data: submissionsData, isLoading, error } = useQuery({
    queryKey: ['submissions', formId, dateFrom, dateTo],
    queryFn: () =>
      listSubmissions({
        formId: formId!,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        export: false,
      }),
    enabled: !!formId,
    select: (data) => {
      // Type guard: if it's a string, it's CSV (shouldn't happen with export=false)
      if (typeof data === 'string') {
        return { submissions: [], total: 0 };
      }
      return data;
    },
  });

  const submissions = (submissionsData as any)?.submissions || [];

  // Filter submissions client-side for search and field filters
  const filteredSubmissions = submissions.filter((submission: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        submission.submittedAt?.toLowerCase().includes(query) ||
        Object.values(submission.data).some((value: any) =>
          String(value).toLowerCase().includes(query)
        );
      if (!matchesSearch) return false;
    }

    // Field filters
    for (const [fieldKey, filterValue] of Object.entries(fieldFilters)) {
      if (filterValue && submission.data[fieldKey] !== filterValue) {
        return false;
      }
    }

    return true;
  });

  const handleExportCSV = () => {
    if (!form || filteredSubmissions.length === 0) return;

    const csvContent = generateCSV(fields, filteredSubmissions);
    const filename = `${form.name}-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setFieldFilters({});
  };

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
        <ErrorMessage message="Failed to load submissions or form not found" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/forms')}
              className="text-sm text-gray-600 hover:text-gray-800 mb-2"
            >
              ← Back to Forms
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{form.name} - Submissions</h1>
            <p className="text-gray-600 mt-1">{submissions.length} total submissions</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={filteredSubmissions.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV ({filteredSubmissions.length} rows)
          </button>
        </div>

        <SubmissionFilters
          fields={fields}
          dateFrom={dateFrom}
          dateTo={dateTo}
          searchQuery={searchQuery}
          fieldFilters={fieldFilters}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onSearchChange={setSearchQuery}
          onFieldFilterChange={(fieldKey, value) =>
            setFieldFilters({ ...fieldFilters, [fieldKey]: value })
          }
          onClearFilters={handleClearFilters}
        />

        <SubmissionsTable
          submissions={filteredSubmissions}
          fields={fields}
          searchQuery={searchQuery}
          fieldFilters={fieldFilters}
        />
      </div>
    </div>
  );
}

