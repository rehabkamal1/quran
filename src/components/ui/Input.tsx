import React from 'react';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon: Icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {Icon && (
          <div className="absolute right-4 text-text-muted dark:text-text-darkMuted pointer-events-none">
            <Icon size={20} />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "flex h-14 w-full rounded-2xl border border-black/10 bg-white dark:bg-card-dark dark:border-white/10 px-4 py-2 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 text-text-main dark:text-text-darkMain placeholder:text-text-muted dark:placeholder:text-text-darkMuted",
            Icon ? "pr-12" : "pr-4",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
