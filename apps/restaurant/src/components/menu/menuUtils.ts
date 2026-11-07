import type { MenuCategory, MenuItem, MenuItemRequest } from '@resto/types';

export type AvailabilityFilter = '' | 'AVAILABLE' | 'UNAVAILABLE';
export type FeaturedFilter = '' | 'FEATURED' | 'STANDARD';
export type SortKey = 'menu' | 'name-asc' | 'price-asc' | 'price-desc' | 'updated-desc';
export type MenuView = 'grid' | 'table';

export interface MenuFilterState {
  category: number | 'ALL';
  search: string;
  availability: AvailabilityFilter;
  featured: FeaturedFilter;
  sort: SortKey;
}

export const defaultFilters: MenuFilterState = {
  category: 'ALL',
  search: '',
  availability: '',
  featured: '',
  sort: 'menu',
};

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'menu', label: 'Menu order' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'updated-desc', label: 'Recently updated' },
];

export function timeAgo(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function exactTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function filterAndSort(items: MenuItem[], filters: MenuFilterState): MenuItem[] {
  const term = filters.search.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (filters.category !== 'ALL' && item.categoryId !== filters.category) return false;
    if (filters.availability === 'AVAILABLE' && !item.isAvailable) return false;
    if (filters.availability === 'UNAVAILABLE' && item.isAvailable) return false;
    if (filters.featured === 'FEATURED' && !item.isFeatured) return false;
    if (filters.featured === 'STANDARD' && item.isFeatured) return false;
    if (term) {
      const inName = item.name.toLowerCase().includes(term);
      const inSku = item.sku.toLowerCase().includes(term);
      if (!inName && !inSku) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (filters.sort) {
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'updated-desc':
      sorted.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
      break;
    default:
      sorted.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }
  return sorted;
}

export function activeFilterCount(filters: MenuFilterState): number {
  return [
    filters.category !== 'ALL',
    filters.search.trim() !== '',
    filters.availability !== '',
    filters.featured !== '',
    filters.sort !== 'menu',
  ].filter(Boolean).length;
}

export function countByCategory(items: MenuItem[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const item of items) {
    counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
  }
  return counts;
}

export interface MenuSummary {
  total: number;
  available: number;
  unavailable: number;
  categories: number;
}

export function summarizeMenu(items: MenuItem[], categories: MenuCategory[]): MenuSummary {
  let available = 0;
  for (const item of items) {
    if (item.isAvailable) available += 1;
  }
  return {
    total: items.length,
    available,
    unavailable: items.length - available,
    categories: categories.length,
  };
}

export function uniqueCopySku(items: MenuItem[], baseSku: string): string {
  const taken = new Set(items.map((item) => item.sku));
  const base = `${baseSku}-COPY`.slice(0, 60);
  if (!taken.has(base)) return base;
  for (let index = 2; index < 100; index += 1) {
    const suffix = `-COPY${index}`;
    const candidate = `${baseSku.slice(0, 60 - suffix.length)}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`.slice(0, 60);
}

export function toItemRequest(item: MenuItem): MenuItemRequest {
  return {
    categoryId: item.categoryId,
    sku: item.sku,
    name: item.name,
    description: item.description ?? '',
    price: item.price,
    cost: item.cost ?? undefined,
    imageUrl: item.imageUrl ?? '',
    isAvailable: item.isAvailable,
    isFeatured: item.isFeatured,
    prepTimeMinutes: item.prepTimeMinutes ?? undefined,
    calories: item.calories ?? undefined,
    sortOrder: item.sortOrder,
  };
}

export function emptyItemRequest(categoryId: number): MenuItemRequest {
  return {
    categoryId,
    sku: '',
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    isAvailable: true,
    isFeatured: false,
  };
}
