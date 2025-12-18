import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import type { Submission, FormField } from '../types';
import { SubmissionDetail } from './SubmissionDetail';
import { format } from 'date-fns';
import { generateFieldKey } from '../utils/fieldKey';

interface SubmissionsTableProps {
  submissions: Submission[];
  fields: FormField[];
  searchQuery: string;
  fieldFilters: Record<string, string>;
}

export function SubmissionsTable({
  submissions,
  fields,
  searchQuery,
  fieldFilters,
}: SubmissionsTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Build columns dynamically
  const columns = useMemo<ColumnDef<Submission>[]>(() => {
    const cols: ColumnDef<Submission>[] = [
      {
        accessorKey: 'submittedAt',
        header: 'Submitted At',
        cell: ({ getValue }) => {
          const date = getValue() as string;
          return format(new Date(date), 'MMM d, yyyy HH:mm');
        },
      },
      ...fields.map((field) => ({
        accessorKey: `data.${generateFieldKey(field.label)}`,
        header: field.label,
        cell: ({ row }) => {
          const fieldKey = generateFieldKey(field.label);
          const value = row.original.data[fieldKey];
          if (value === null || value === undefined || value === '') {
            return <span className="text-gray-400">—</span>;
          }
          if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
          }
          return String(value);
        },
      })),
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={() => setSelectedSubmission(row.original)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View Details
          </button>
        ),
      },
    ];
    return cols;
  }, [fields]);

  // Filter submissions based on search and field filters
  const filteredData = useMemo(() => {
    let filtered = [...submissions];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((submission) => {
        // Search in submittedAt
        if (format(new Date(submission.submittedAt), 'MMM d, yyyy HH:mm').toLowerCase().includes(query)) {
          return true;
        }
        // Search in all field values
        return Object.values(submission.data).some((value) =>
          String(value).toLowerCase().includes(query)
        );
      });
    }

    // Apply field filters
    Object.entries(fieldFilters).forEach(([fieldKey, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter((submission) => {
          const value = submission.data[fieldKey];
          return String(value) === filterValue;
        });
      }
    });

    return filtered;
  }, [submissions, searchQuery, fieldFilters]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No submissions found
          </div>
        )}

        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredData.length
            )}{' '}
            of {filteredData.length} submissions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedSubmission && (
        <SubmissionDetail
          data={selectedSubmission.data}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </>
  );
}

