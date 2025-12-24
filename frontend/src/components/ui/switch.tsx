import * as React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="checkbox"
            id={inputId}
            className="sr-only peer"
            ref={ref}
            {...props}
          />

          <label
            htmlFor={inputId}
            className={cn(
              'inline-block h-6 w-11 rounded-full cursor-pointer transition-colors',
              // light / dark explicit fallbacks plus project tokens
              'bg-gray-200 dark:bg-gray-600 peer-checked:bg-indigo-600',
              className
            )}>
            <span
              className={cn(
                'absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-white dark:bg-gray-100 shadow transform transition-transform',
                'peer-checked:translate-x-5'
              )}
            />
          </label>
        </div>
        {label && (
          <label htmlFor={inputId} className="text-sm cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
