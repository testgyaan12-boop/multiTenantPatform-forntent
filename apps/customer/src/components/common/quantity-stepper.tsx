import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
  label?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  compact = false,
  label = 'quantity',
}: QuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-card',
        compact ? 'h-9' : 'h-11',
      )}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={cn(
          'flex items-center justify-center rounded-l-full text-foreground transition-colors hover:bg-background disabled:opacity-35',
          compact ? 'h-9 w-9' : 'h-11 w-11',
        )}
      >
        <Minus className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
      </button>
      <span
        aria-live="polite"
        className={cn(
          'min-w-8 text-center font-semibold tabular-nums',
          compact ? 'text-sm' : 'text-base',
        )}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={cn(
          'flex items-center justify-center rounded-r-full text-foreground transition-colors hover:bg-background disabled:opacity-35',
          compact ? 'h-9 w-9' : 'h-11 w-11',
        )}
      >
        <Plus className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
      </button>
    </div>
  );
}
