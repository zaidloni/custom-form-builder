import * as React from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
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
              'h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary cursor-pointer',
              className
            )}
            onClick={() => {
              const input = document.getElementById(inputId) as HTMLInputElement
              input?.click()
            }}
          >
            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform peer-checked:translate-x-5" />
          </div>
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
Switch.displayName = 'Switch'

export { Switch }

