import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Branch, RestaurantProfile } from '@resto/types';
import { branchApi, fetchRestaurantProfile } from '@/api';

interface RestaurantContextValue {
  profile: RestaurantProfile | null;
  branches: Branch[];
  activeBranch: Branch | null;
  activeBranchId: number | null;
  setActiveBranchId: (id: number) => void;
  isLoading: boolean;
}

const ACTIVE_BRANCH_KEY = 'resto.active-branch';

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

function readStoredBranchId(): number | null {
  const raw = localStorage.getItem(ACTIVE_BRANCH_KEY);
  const parsed = raw === null ? Number.NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [storedBranchId, setStoredBranchId] = useState<number | null>(readStoredBranchId);

  const profile = useQuery({
    queryKey: ['restaurant-profile'],
    queryFn: fetchRestaurantProfile,
    staleTime: 5 * 60_000,
  });

  const branches = useQuery({
    queryKey: ['branches'],
    queryFn: branchApi.list,
    staleTime: 60_000,
  });

  const activeBranch =
    branches.data?.find((branch) => branch.id === storedBranchId) ??
    branches.data?.find((branch) => branch.isDefault) ??
    branches.data?.[0] ??
    null;

  const setActiveBranchId = useCallback((id: number) => {
    localStorage.setItem(ACTIVE_BRANCH_KEY, String(id));
    setStoredBranchId(id);
  }, []);

  const value = useMemo<RestaurantContextValue>(
    () => ({
      profile: profile.data ?? null,
      branches: branches.data ?? [],
      activeBranch,
      activeBranchId: activeBranch?.id ?? null,
      setActiveBranchId,
      isLoading: profile.isPending || branches.isPending,
    }),
    [profile.data, profile.isPending, branches.data, branches.isPending, activeBranch, setActiveBranchId],
  );

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurant(): RestaurantContextValue {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used inside RestaurantProvider');
  }
  return context;
}
