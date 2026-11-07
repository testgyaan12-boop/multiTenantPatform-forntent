import { useQuery } from '@tanstack/react-query';
import { service } from '@/services';

export function useStore(slug: string | undefined) {
  return useQuery({
    queryKey: ['store', slug ?? ''],
    queryFn: () => service.getStore(slug as string),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
  });
}

export function useStoreProducts(slug: string | undefined) {
  return useQuery({
    queryKey: ['store-products', slug ?? ''],
    queryFn: () => service.getStoreProducts(slug as string),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

export function useStoreItem(slug: string | undefined, itemId: number | undefined) {
  return useQuery({
    queryKey: ['store-item', slug ?? '', itemId ?? 0],
    queryFn: () => service.getStoreItem(slug as string, itemId as number),
    enabled: Boolean(slug) && itemId != null,
    staleTime: 60_000,
  });
}
