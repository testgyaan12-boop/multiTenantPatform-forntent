import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sheet({
  open,
  onOpenChange,
  children,
  side = 'bottom',
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'bottom' | 'right';
  label: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          aria-label={label}
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden bg-card shadow-2xl focus:outline-none',
            side === 'bottom' &&
              'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl border-t border-border safe-bottom',
            side === 'right' &&
              'inset-y-0 right-0 w-full max-w-md border-l border-border sm:rounded-none',
          )}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-border sm:hidden" />
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:bg-background focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
