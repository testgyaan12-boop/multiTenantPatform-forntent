import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemImageProps {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

export function ItemImage({ src, alt, className, eager = false }: ItemImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex items-center justify-center bg-primary-soft text-primary/70',
          className,
        )}
      >
        <UtensilsCrossed className="h-7 w-7" aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
