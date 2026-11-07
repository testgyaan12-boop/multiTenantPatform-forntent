import { Ban, Check, ChefHat, ClipboardCheck, PackageCheck, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FLOW = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'] as const;

const STEP_META: Record<(typeof FLOW)[number], { label: string; icon: typeof Check }> = {
  PLACED: { label: 'Order placed', icon: ClipboardCheck },
  CONFIRMED: { label: 'Confirmed by the kitchen', icon: ThumbsUp },
  PREPARING: { label: 'Being prepared', icon: ChefHat },
  READY: { label: 'Ready', icon: PackageCheck },
  COMPLETED: { label: 'Completed', icon: Check },
};

function stepIndex(status: OrderStatus): number {
  if (status === 'SERVED') return FLOW.indexOf('COMPLETED') - 1;
  const index = FLOW.indexOf(status as (typeof FLOW)[number]);
  return index === -1 ? 0 : index;
}

export function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') {
    return (
      <Alert variant="destructive">
        <Ban className="h-4 w-4" aria-hidden />
        <AlertTitle>This order was cancelled</AlertTitle>
        <AlertDescription>
          The restaurant cancelled this order. If you already paid, the refund is on its way.
        </AlertDescription>
      </Alert>
    );
  }

  const current = stepIndex(status);

  return (
    <ol className="space-y-0">
      {FLOW.map((step, index) => {
        const meta = STEP_META[step];
        const done = index <= current;
        const isCurrent = index === current;
        const isLast = index === FLOW.length - 1;
        return (
          <li key={step} className="relative flex gap-3">
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[15px] top-8 h-[calc(100%-16px)] w-px',
                  index < current ? 'bg-primary' : 'bg-border',
                )}
              />
            ) : null}
            <span
              aria-hidden
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                done
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-card text-muted',
                isCurrent && 'ring-4 ring-primary-soft',
              )}
            >
              <meta.icon className="h-4 w-4" />
            </span>
            <div className="pb-6 pt-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  done ? 'text-foreground' : 'text-muted',
                )}
              >
                {meta.label}
              </p>
              {isCurrent ? <p className="text-xs text-primary">Happening now</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
