import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { formsApi } from '@/api/client'
import { validateSubmission } from '@/lib/validation'
import { generateFieldKey } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { DynamicField } from '@/components/form-renderer/DynamicField'
import type { FormField } from '@/types/form'
import { CheckCircle, AlertCircle, Layers } from 'lucide-react'

export default function PublicForm() {
  const { slug } = useParams<{ slug: string }>()
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-form', slug],
    queryFn: () => formsApi.getFormBySlug(slug!),
    enabled: !!slug,
  })

  const submitMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      formsApi.submitForm(slug!, data),
    onSuccess: () => {
      setSubmitted(true)
    },
  })

  const handleFieldChange = (field: FormField, value: unknown) => {
    const fieldKey = generateFieldKey(field.label)
    setFormData((prev) => ({ ...prev, [fieldKey]: value }))
    // Clear error when user starts typing
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldKey]
        return newErrors
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!data?.form.fields) return

    console.log('[FE] Form fields:', data.form.fields.map(f => ({ label: f.label, key: generateFieldKey(f.label) })))
    console.log('[FE] Form data being submitted:', formData)

    const validation = validateSubmission(data.form.fields, formData)
    
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    submitMutation.mutate(formData)
  }

  // Group fields by row for grid layout
  const groupFieldsByRow = (fields: FormField[]) => {
    const rows: Record<string, FormField[]> = {}
    
    fields.forEach((field) => {
      const row = field.position.charAt(0)
      if (!rows[row]) {
        rows[row] = []
      }
      rows[row].push(field)
    })

    // Sort fields within each row by column
    Object.keys(rows).forEach((row) => {
      rows[row].sort((a, b) => {
        const colA = parseInt(a.position.charAt(1))
        const colB = parseInt(b.position.charAt(1))
        return colA - colB
      })
    })

    return Object.entries(rows).sort(([a], [b]) => a.localeCompare(b))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Form Not Found</h1>
          <p className="text-muted-foreground">
            This form may have been removed or the URL is incorrect.
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Thank You!</h1>
          <p className="text-muted-foreground text-lg">
            Your response has been submitted successfully.
          </p>
        </div>
      </div>
    )
  }

  const { form } = data
  const groupedFields = groupFieldsByRow(form.fields)

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Layers className="w-4 h-4" />
            FormForge
          </div>
          <h1 className="text-3xl font-bold mb-2">{form.name}</h1>
          {form.description && (
            <p className="text-muted-foreground text-lg">{form.description}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
          <div className="bg-card rounded-xl border p-6 space-y-6">
            {groupedFields.map(([_row, rowFields]) => (
              <div
                key={_row}
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${rowFields.length}, 1fr)`,
                }}
              >
                {rowFields.map((field) => {
                  const fieldKey = generateFieldKey(field.label)
                  return (
                    <DynamicField
                      key={fieldKey}
                      field={field}
                      value={formData[fieldKey]}
                      onChange={(value) => handleFieldChange(field, value)}
                      error={errors[fieldKey]}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {submitMutation.error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">
                Failed to submit form. Please try again.
              </p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

