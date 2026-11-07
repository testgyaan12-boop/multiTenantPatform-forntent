import * as React from 'react';
import { cn } from '@/lib/utils';

export const Separator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { vertical?: boolean }>(
  ({ className, vertical = false, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      className={cn(vertical ? 'h-full w-px' : 'h-px w-full', 'bg-border', className)}
      {...props}
    />
  ),
);
Separator.displayName = 'Separator';
