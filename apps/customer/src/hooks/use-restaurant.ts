import { useQuery } from '@tanstack/react-query';
import { service } from '@/services';

export function useRestaurant(slug: string | undefined) {
  return useQuery({
    queryKey: ['restaurant', slug ?? ''],
    queryFn: () => service.getRestaurant(slug as string),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
  });
}

export function useMenu(slug: string | undefined) {
  return useQuery({
    queryKey: ['menu', slug ?? ''],
    queryFn: () => service.getMenu(slug as string),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
  });
}
