import { Button } from '@/components/ui/button'
import { FIELD_TYPES, type FieldType } from '@/types/form'
import {
  Type,
  AlignLeft,
  Mail,
  Hash,
  ChevronDown,
  CheckSquare,
  Calendar,
} from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  Type: <Type className="w-4 h-4" />,
  AlignLeft: <AlignLeft className="w-4 h-4" />,
  Mail: <Mail className="w-4 h-4" />,
  Hash: <Hash className="w-4 h-4" />,
  ChevronDown: <ChevronDown className="w-4 h-4" />,
  CheckSquare: <CheckSquare className="w-4 h-4" />,
  Calendar: <Calendar className="w-4 h-4" />,
}

interface FieldPaletteProps {
  onAddField: (fieldType: FieldType) => void
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <div className="space-y-2">
      {FIELD_TYPES.map((fieldType) => (
        <Button
          key={fieldType.type}
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3"
          onClick={() => onAddField(fieldType.type)}
        >
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            {iconMap[fieldType.icon]}
          </div>
          <span className="font-medium">{fieldType.label}</span>
        </Button>
      ))}
    </div>
  )
}

