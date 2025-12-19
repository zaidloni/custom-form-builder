import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { formsApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate, generateFieldKey } from '@/lib/utils'
import type { Submission, FormField } from '@/types/form'
import {
  ArrowLeft,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
} from 'lucide-react'

export default function Submissions() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const { userEmail } = useAuth()
  const { addToast } = useToast()

  const [page, setPage] = useState(1)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  // Fetch form details to get field definitions
  const { data: formData } = useQuery({
    queryKey: ['form-details', formId],
    queryFn: async () => {
      const forms = await formsApi.listForms()
      const form = forms.forms.find((f) => f.formId === formId)
      if (!form) throw new Error('Form not found')
      
      const fullForm = await formsApi.getFormBySlug(form.slug)
      return { ...form, fields: fullForm.form.fields }
    },
    enabled: !!formId && !!userEmail,
  })

  // Fetch submissions
  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ['submissions', formId, page, fromDate, toDate],
    queryFn: () =>
      formsApi.getSubmissions(formId!, {
        page,
        limit: 20,
        from: fromDate || undefined,
        to: toDate || undefined,
      }),
    enabled: !!formId && !!userEmail,
  })

  // Filter submissions by search query (client-side)
  const filteredSubmissions = submissionsData?.submissions.filter((submission) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return Object.values(submission.data).some((value) =>
      String(value).toLowerCase().includes(searchLower)
    )
  }) || []

  const handleExport = async () => {
    try {
      const blob = await formsApi.exportSubmissions(formId!, {
        from: fromDate || undefined,
        to: toDate || undefined,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formData?.name || 'submissions'}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addToast('Export downloaded successfully', 'success')
    } catch {
      addToast('Failed to export submissions', 'error')
    }
  }

  const getFieldLabel = (fieldKey: string, fields: FormField[] | undefined): string => {
    if (!fields) return fieldKey
    const field = fields.find((f) => generateFieldKey(f.label) === fieldKey)
    return field?.label || fieldKey
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-slide-down">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-bold">{formData?.name || 'Submissions'}</h1>
            <p className="text-sm text-muted-foreground">
              {submissionsData?.total || 0} total submissions
            </p>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 animate-slide-up stagger-1">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Label htmlFor="from" className="sr-only">From</Label>
            <Input
              id="from"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setPage(1)
              }}
              className="w-40"
              placeholder="From"
            />
            <span className="text-muted-foreground">to</span>
            <Label htmlFor="to" className="sr-only">To</Label>
            <Input
              id="to"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setPage(1)
              }}
              className="w-40"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden animate-slide-up stagger-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">
                  Submitted At
                </th>
                <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">
                  Version
                </th>
                {formData?.fields.slice(0, 4).map((field) => (
                  <th
                    key={generateFieldKey(field.label)}
                    className="text-left text-sm font-medium text-muted-foreground px-4 py-3 max-w-[200px] truncate"
                  >
                    {field.label}
                  </th>
                ))}
                <th className="text-right text-sm font-medium text-muted-foreground px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={(formData?.fields.length || 0) + 3}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {searchQuery
                      ? 'No submissions match your search'
                      : 'No submissions yet'}
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => {
                  console.log('[FE Submissions] submission.data:', submission.data)
                  console.log('[FE Submissions] formData.fields:', formData?.fields.map(f => ({ label: f.label, key: generateFieldKey(f.label) })))
                  return (
                  <tr
                    key={submission.submissionId}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">
                      {formatDate(submission.submittedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        v{submission.formVersion}
                      </Badge>
                    </td>
                    {formData?.fields.slice(0, 4).map((field) => {
                      const fieldKey = generateFieldKey(field.label)
                      const value = submission.data[fieldKey]
                      return (
                        <td
                          key={fieldKey}
                          className="px-4 py-3 text-sm max-w-[200px] truncate"
                        >
                          {value !== undefined && value !== null
                            ? String(value)
                            : '-'}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                )})
              
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {submissionsData && submissionsData.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Page {page} of {submissionsData.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= submissionsData.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Submitted: {formatDate(selectedSubmission.submittedAt)}</span>
                <Badge variant="secondary">v{selectedSubmission.formVersion}</Badge>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                {Object.entries(selectedSubmission.data).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-4">
                    <span className="font-medium text-sm">
                      {getFieldLabel(key, formData?.fields)}
                    </span>
                    <span className="col-span-2 text-sm break-all">
                      {typeof value === 'boolean'
                        ? value ? 'Yes' : 'No'
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    View raw JSON
                  </summary>
                  <pre className="mt-2 p-4 bg-muted/50 rounded-lg overflow-x-auto font-mono text-xs">
                    {JSON.stringify(selectedSubmission.data, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

