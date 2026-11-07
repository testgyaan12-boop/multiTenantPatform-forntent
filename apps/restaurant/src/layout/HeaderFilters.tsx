import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface HeaderFiltersValue {
  days: number;
  setDays: (days: number) => void;
}

const HeaderFiltersContext = createContext<HeaderFiltersValue | null>(null);

export function HeaderFiltersProvider({ children }: { children: ReactNode }) {
  const [days, setDays] = useState(1);
  const value = useMemo(() => ({ days, setDays }), [days]);
  return <HeaderFiltersContext.Provider value={value}>{children}</HeaderFiltersContext.Provider>;
}

export function useHeaderFilters(): HeaderFiltersValue {
  const context = useContext(HeaderFiltersContext);
  if (!context) {
    throw new Error('useHeaderFilters must be used inside HeaderFiltersProvider');
  }
  return context;
}
