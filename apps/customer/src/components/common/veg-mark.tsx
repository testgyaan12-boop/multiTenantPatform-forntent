import { cn } from '@/lib/utils';

export function VegMark({ vegetarian }: { vegetarian: boolean }) {
  const color = vegetarian ? 'border-success' : 'border-destructive';
  const dot = vegetarian ? 'bg-success' : 'bg-destructive';
  return (
    <span
      role="img"
      aria-label={vegetarian ? 'Vegetarian' : 'Non-vegetarian'}
      title={vegetarian ? 'Vegetarian' : 'Non-vegetarian'}
      className={cn(
        'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] bg-white',
        color,
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', dot)} />
    </span>
  );
}
