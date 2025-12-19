import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || React.useId()
    
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="checkbox"
            id={inputId}
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded border border-input bg-transparent transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-checked:bg-primary peer-checked:border-primary cursor-pointer flex items-center justify-center',
              className
            )}
            onClick={() => {
              const input = document.getElementById(inputId) as HTMLInputElement
              input?.click()
            }}
          >
            <Check className="h-3.5 w-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity hidden peer-checked:block" />
          </div>
          <label
            htmlFor={inputId}
            className="absolute inset-0 cursor-pointer"
          />
        </div>
        {label && (
          <label htmlFor={inputId} className="text-sm cursor-pointer">
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }

