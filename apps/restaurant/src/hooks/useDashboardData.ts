import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MenuItem, Order, OrderStatus } from '@resto/types';
import { menuApi, orderApi, reportApi } from '@/api';
import { useRestaurant } from '@/context/RestaurantContext';

const LIVE_ORDERS_SIZE = 100;

export const OPEN_STATUSES: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY'];

export function useLiveOrders() {
  const { activeBranchId } = useRestaurant();

  return useQuery({
    queryKey: ['orders', 'live', { branchId: activeBranchId }],
    enabled: activeBranchId !== null,
    queryFn: () =>
      orderApi.list({
        branchId: activeBranchId ?? undefined,
        page: 0,
        size: LIVE_ORDERS_SIZE,
      }),
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

export function useSalesSummary(days: number) {
  const { activeBranchId } = useRestaurant();

  return useQuery({
    queryKey: ['sales-report', { days, branchId: activeBranchId }],
    enabled: activeBranchId !== null,
    queryFn: () => reportApi.sales(days, activeBranchId),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMenuCatalog() {
  return useQuery({
    queryKey: ['menu-catalog'],
    queryFn: () => menuApi.items(),
    staleTime: 5 * 60_000,
  });
}

export function useAdvanceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ order, next }: { order: Order; next: OrderStatus }) =>
      orderApi.updateStatus(order.id, next),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['order-counts'] });
      void queryClient.invalidateQueries({ queryKey: ['sales-report'] });
      void queryClient.invalidateQueries({ queryKey: ['order-detail'] });
      void queryClient.invalidateQueries({ queryKey: ['order-timeline'] });
    },
  });
}

export interface StatusBuckets {
  new: number;
  preparing: number;
  ready: number;
  completed: number;
}

export function bucketStatuses(orders: Order[]): StatusBuckets {
  const buckets: StatusBuckets = { new: 0, preparing: 0, ready: 0, completed: 0 };
  for (const order of orders) {
    if (order.status === 'PLACED' || order.status === 'CONFIRMED') {
      buckets.new += 1;
    } else if (order.status === 'PREPARING') {
      buckets.preparing += 1;
    } else if (order.status === 'READY') {
      buckets.ready += 1;
    } else if (order.status === 'SERVED' || order.status === 'COMPLETED') {
      buckets.completed += 1;
    }
  }
  return buckets;
}

export function openOrdersCount(orders: Order[]): number {
  return orders.filter((order) => OPEN_STATUSES.includes(order.status)).length;
}

export interface HourlyBucket {
  hour: number;
  label: string;
  revenue: number;
  orders: number;
}

export function buildHourlyBuckets(orders: Order[], today = new Date()): HourlyBucket[] {
  const buckets: HourlyBucket[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: String(hour),
    revenue: 0,
    orders: 0,
  }));
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  for (const order of orders) {
    const created = new Date(order.placedAt ?? order.createdAt);
    if (Number.isNaN(created.getTime()) || created < todayStart || created >= todayEnd) {
      continue;
    }
    const bucket = buckets[created.getHours()];
    if (!bucket) {
      continue;
    }
    bucket.revenue += Number(order.grandTotal ?? 0);
    bucket.orders += 1;
  }
  return buckets;
}

export function thumbnailFor(topItemName: string, menu: MenuItem[] | undefined): string | null {
  const match = menu?.find((item) => item.name.toLowerCase() === topItemName.toLowerCase());
  return match?.imageUrl ?? null;
}
