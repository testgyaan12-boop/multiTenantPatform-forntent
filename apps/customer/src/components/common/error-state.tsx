import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { errorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, title = 'Something went wrong', onRetry }: ErrorStateProps) {
  const message = error ? errorMessage(error) : title;
  const offline = typeof error === 'object' && error !== null && 'code' in error && error.code === 'offline';
  const Icon = offline ? WifiOff : AlertTriangle;

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
