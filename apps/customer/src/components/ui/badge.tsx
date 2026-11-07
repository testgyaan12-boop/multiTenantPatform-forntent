import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary-soft text-primary',
        accent: 'bg-accent-soft text-accent-dark',
        outline: 'border border-border bg-card text-muted',
        success: 'bg-success-soft text-success',
        destructive: 'bg-destructive-soft text-destructive',
        vegetarian: 'bg-success-soft text-success',
        nonveg: 'bg-[#fdecea] text-[#a03a2b]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
