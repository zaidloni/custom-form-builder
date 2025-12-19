import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nanoid } from 'nanoid'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import { useAuth } from '@/contexts/AuthContext'
import { formsApi } from '@/api/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { FieldPalette } from '@/components/form-builder/FieldPalette'
import { SortableFieldItem } from '@/components/form-builder/SortableFieldItem'
import { FieldEditor } from '@/components/form-builder/FieldEditor'
import { generateFieldKey } from '@/lib/utils'
import type { FormField, FieldType } from '@/types/form'
import { getDefaultValidation } from '@/types/form'
import { Save, ArrowLeft, Eye } from 'lucide-react'

export default function FormBuilder() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const { userEmail } = useAuth()
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const isEditing = !!formId

  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch existing form if editing
  const { isLoading: isLoadingForm } = useQuery({
    queryKey: ['form', formId],
    queryFn: async () => {
      const forms = await formsApi.listForms()
      const form = forms.forms.find((f) => f.formId === formId)
      if (!form) throw new Error('Form not found')
      
      // Get full form with fields
      const fullForm = await formsApi.getFormBySlug(form.slug)
      return fullForm.form
    },
    enabled: isEditing && !!userEmail,
    staleTime: 0,
  })

  // Set form data when fetched
  useEffect(() => {
    if (isEditing) {
      formsApi.listForms().then((data) => {
        const form = data.forms.find((f) => f.formId === formId)
        if (form) {
          setFormName(form.name)
          setFormDescription(form.description)
          formsApi.getFormBySlug(form.slug).then((fullForm) => {
            setFields(
              fullForm.form.fields.map((f) => ({
                ...f,
                id: nanoid(),
              }))
            )
          })
        }
      })
    }
  }, [formId, isEditing])

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; fields: Omit<FormField, 'id'>[] }) =>
      formsApi.createForm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      addToast('Form created successfully!', 'success')
      navigate('/dashboard')
    },
    onError: (error: Error) => {
      addToast(error.message || 'Failed to create form', 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { formId: string; name: string; description: string; fields: Omit<FormField, 'id'>[] }) =>
      formsApi.updateForm(data.formId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      addToast('Form updated successfully!', 'success')
      navigate('/dashboard')
    },
    onError: (error: Error) => {
      addToast(error.message || 'Failed to update form', 'error')
    },
  })

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  const handleAddField = (fieldType: FieldType) => {
    const newField: FormField = {
      id: nanoid(),
      label: `New ${fieldType.replace(/-/g, ' ')} field`,
      fieldType,
      required: false,
      position: getNextPosition(),
      validation: getDefaultValidation(fieldType),
      options: fieldType === 'dropdown' ? ['Option 1', 'Option 2'] : undefined,
    }
    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
  }

  const getNextPosition = (): string => {
    if (fields.length === 0) return 'A1'
    
    // Get all used positions
    const positions = fields.map((f) => f.position)
    
    // Find the next available position
    const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    for (const row of rows) {
      for (let col = 1; col <= 4; col++) {
        const pos = `${row}${col}`
        if (!positions.includes(pos)) {
          // Check if this position maintains contiguity
          if (col === 1 || positions.includes(`${row}${col - 1}`)) {
            return pos
          }
        }
      }
    }
    return 'A1'
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Reassign positions to maintain contiguity
        return reassignPositions(newItems)
      })
    }
  }

  const reassignPositions = (items: FormField[]): FormField[] => {
    return items.map((item, index) => ({
      ...item,
      position: indexToPosition(index),
    }))
  }

  const indexToPosition = (index: number): string => {
    const row = Math.floor(index / 4)
    const col = (index % 4) + 1
    const rowLetter = String.fromCharCode(65 + row)
    return `${rowLetter}${col}`
  }

  const handleUpdateField = (updatedField: FormField) => {
    setFields(fields.map((f) => (f.id === updatedField.id ? updatedField : f)))
  }

  const handleDeleteField = (fieldId: string) => {
    setFields(reassignPositions(fields.filter((f) => f.id !== fieldId)))
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
  }

  const handleSave = () => {
    if (!formName.trim()) {
      addToast('Form name is required', 'error')
      return
    }

    if (fields.length === 0) {
      addToast('Add at least one field', 'error')
      return
    }

    // Validate all fields have labels
    const invalidField = fields.find((f) => !f.label.trim())
    if (invalidField) {
      addToast('All fields must have a label', 'error')
      setSelectedFieldId(invalidField.id)
      return
    }

    // Check for duplicate labels
    const labels = fields.map((f) => generateFieldKey(f.label))
    const duplicates = labels.filter((l, i) => labels.indexOf(l) !== i)
    if (duplicates.length > 0) {
      addToast('Field labels must be unique', 'error')
      return
    }

    const formData = {
      name: formName,
      description: formDescription || 'No description',
      fields: fields.map(({ id, ...field }) => field),
    }

    if (isEditing && formId) {
      updateMutation.mutate({ formId, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (isEditing && isLoadingForm) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-card/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Form name"
              className="w-64 font-medium"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {formId && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/forms/${formId}`} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </a>
            </Button>
          )}
          <Button onClick={handleSave} disabled={isPending} className="gap-2">
            {isPending ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
            {isEditing ? 'Update' : 'Create'} Form
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Field Palette */}
        <div className="w-64 border-r bg-card/30 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Add Fields</h3>
          <FieldPalette onAddField={handleAddField} />
        </div>

        {/* Form Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {/* Form metadata */}
            <div className="mb-6 space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Add a description for your form..."
                  className="mt-1.5"
                  rows={2}
                />
              </div>
            </div>

            {/* Fields list */}
            <div className="space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {fields.map((field) => (
                    <SortableFieldItem
                      key={field.id}
                      field={field}
                      isSelected={field.id === selectedFieldId}
                      onSelect={() => setSelectedFieldId(field.id)}
                      onDelete={() => handleDeleteField(field.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {fields.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
                  <p className="text-lg font-medium mb-2">No fields yet</p>
                  <p className="text-sm">Click on a field type from the left panel to add it</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Field Editor */}
        <div className="w-80 border-l bg-card/30 p-4 overflow-y-auto">
          {selectedField ? (
            <FieldEditor
              field={selectedField}
              onUpdate={handleUpdateField}
              existingLabels={fields.filter((f) => f.id !== selectedField.id).map((f) => f.label)}
            />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>Select a field to edit its properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

