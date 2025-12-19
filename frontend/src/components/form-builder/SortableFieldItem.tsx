import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { FormField } from '@/types/form'
import { GripVertical, Trash2 } from 'lucide-react'

interface SortableFieldItemProps {
  field: FormField
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

export function SortableFieldItem({
  field,
  isSelected,
  onSelect,
  onDelete,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const fieldTypeLabels: Record<string, string> = {
    'single-line-text': 'Text',
    textarea: 'Textarea',
    email: 'Email',
    number: 'Number',
    dropdown: 'Dropdown',
    checkbox: 'Checkbox',
    date: 'Date',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg border bg-card p-4 transition-all',
        isDragging && 'opacity-50 shadow-lg',
        isSelected && 'border-primary ring-2 ring-primary/20'
      )}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Field info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{field.label}</span>
          {field.required && (
            <span className="text-destructive text-sm">*</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {fieldTypeLabels[field.fieldType] || field.fieldType}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            {field.position}
          </span>
        </div>
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  )
}

