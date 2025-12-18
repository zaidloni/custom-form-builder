import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FormField } from '../types';
import { FieldEditor } from './FieldEditor';

interface FieldListProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

function SortableFieldItem({
  field,
  index,
  onChange,
  onDelete,
}: {
  field: FormField;
  index: number;
  onChange: (field: FormField) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.label || `field-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          className="mt-4 p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </button>
        <div className="flex-1">
          <FieldEditor field={field} onChange={onChange} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

export function FieldList({ fields, onChange }: FieldListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(
        (f) => f.label === active.id || `field-${fields.indexOf(f)}` === active.id
      );
      const newIndex = fields.findIndex(
        (f) => f.label === over.id || `field-${fields.indexOf(f)}` === over.id
      );

      onChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const handleFieldChange = (index: number, updatedField: FormField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    onChange(newFields);
  };

  const handleFieldDelete = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  const handleAddField = () => {
    const newField: FormField = {
      label: '',
      fieldType: 'single-line-text',
      required: false,
    };
    onChange([...fields, newField]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Fields</h2>
        <button
          onClick={handleAddField}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">No fields yet. Click "Add Field" to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f, i) => f.label || `field-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {fields.map((field, index) => (
                <SortableFieldItem
                  key={field.label || `field-${index}`}
                  field={field}
                  index={index}
                  onChange={(updatedField) => handleFieldChange(index, updatedField)}
                  onDelete={() => handleFieldDelete(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

