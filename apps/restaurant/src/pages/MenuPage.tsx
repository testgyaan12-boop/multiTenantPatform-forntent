import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Card, Skeleton, Snackbar, Alert, Typography } from '@mui/material';
import { Plus } from 'lucide-react';
import { ConfirmDialog, EmptyState, ErrorState, PageHeader } from '@resto/ui';
import type {
  MenuCategoryRequest,
  MenuItem as MenuItemModel,
  MenuItemRequest,
} from '@resto/types';
import { menuApi } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { CategoryDrawer } from '@/components/menu/CategoryDrawer';
import { MenuCategoryBar } from '@/components/menu/MenuCategoryBar';
import { MenuGridView } from '@/components/menu/MenuGridView';
import { MenuItemDrawer } from '@/components/menu/MenuItemDrawer';
import { MenuSummaryCards } from '@/components/menu/MenuSummaryCards';
import { MenuTableView } from '@/components/menu/MenuTableView';
import { MenuToolbar } from '@/components/menu/MenuToolbar';
import {
  activeFilterCount,
  countByCategory,
  defaultFilters,
  filterAndSort,
  summarizeMenu,
  uniqueCopySku,
  type MenuFilterState,
  type MenuView,
} from '@/components/menu/menuUtils';

interface SnackState {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
}

const VIEW_STORAGE_KEY = 'resto.menu-view';

export function MenuPage() {
  const { profile } = useRestaurant();
  const { user } = useAuth();
  const canManage = user?.permissions?.includes('menu.manage') ?? false;
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<MenuFilterState>(defaultFilters);
  const [view, setViewState] = useState<MenuView>(() =>
    typeof window !== 'undefined' && window.localStorage.getItem(VIEW_STORAGE_KEY) === 'table'
      ? 'table'
      : 'grid',
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [itemDrawer, setItemDrawer] = useState<{ open: boolean; editing: MenuItemModel | null }>({
    open: false,
    editing: null,
  });
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MenuItemModel | null>(null);
  const [snack, setSnack] = useState<SnackState>({ open: false, severity: 'success', message: '' });

  const currency = profile?.currency ?? 'INR';

  const items = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => menuApi.items(),
    staleTime: 30_000,
  });

  const categories = useQuery({
    queryKey: ['menu-categories'],
    queryFn: menuApi.categories,
    staleTime: 60_000,
  });

  const notify = (severity: 'success' | 'error', message: string) =>
    setSnack({ open: true, severity, message });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    void queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
  };

  const patchFilters = (patch: Partial<MenuFilterState>) => {
    setFilters((previous) => ({ ...previous, ...patch }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(0);
  };

  const setView = (next: MenuView) => {
    setViewState(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // storage unavailable — view preference stays session-only
    }
  };

  const rawItems = items.data ?? [];
  const categoryList = categories.data ?? [];
  const filtered = useMemo(() => filterAndSort(rawItems, filters), [rawItems, filters]);
  const categoryCounts = useMemo(() => countByCategory(rawItems), [rawItems]);
  const summary = useMemo(() => summarizeMenu(rawItems, categoryList), [rawItems, categoryList]);
  const filterCount = activeFilterCount(filters);

  const saveItem = useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: MenuItemRequest }) =>
      id === undefined ? menuApi.createItem(payload) : menuApi.updateItem(id, payload),
    onSuccess: () => invalidate(),
  });

  const deleteItem = useMutation({
    mutationFn: (id: number) => menuApi.removeItem(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      notify('success', 'Item deleted from your menu.');
    },
    onError: (error: Error) => notify('error', error.message || 'Failed to delete the item.'),
  });

  const toggleAvailability = useMutation({
    mutationFn: (item: MenuItemModel) =>
      menuApi.updateItem(item.id, {
        categoryId: item.categoryId,
        sku: item.sku,
        name: item.name,
        description: item.description ?? '',
        price: item.price,
        cost: item.cost ?? undefined,
        imageUrl: item.imageUrl ?? '',
        isAvailable: !item.isAvailable,
        isFeatured: item.isFeatured,
        prepTimeMinutes: item.prepTimeMinutes ?? undefined,
        calories: item.calories ?? undefined,
        sortOrder: item.sortOrder,
      }),
    onSuccess: (_data, item) => {
      invalidate();
      notify(
        'success',
        `“${item.name}” is now ${item.isAvailable ? 'unavailable' : 'available'}.`,
      );
    },
    onError: (error: Error) => notify('error', error.message || 'Failed to update availability.'),
  });

  const duplicateItem = useMutation({
    mutationFn: (item: MenuItemModel) =>
      menuApi.createItem({
        categoryId: item.categoryId,
        sku: uniqueCopySku(rawItems, item.sku),
        name: `${item.name} (Copy)`,
        description: item.description ?? '',
        price: item.price,
        cost: item.cost ?? undefined,
        imageUrl: item.imageUrl ?? '',
        isAvailable: item.isAvailable,
        isFeatured: false,
        prepTimeMinutes: item.prepTimeMinutes ?? undefined,
        calories: item.calories ?? undefined,
      }),
    onSuccess: (_data, item) => {
      invalidate();
      notify('success', `“${item.name}” duplicated.`);
    },
    onError: (error: Error) => notify('error', error.message || 'Failed to duplicate the item.'),
  });

  const createCategory = useMutation({
    mutationFn: (payload: MenuCategoryRequest) => menuApi.createCategory(payload),
    onSuccess: () => invalidate(),
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MenuCategoryRequest }) =>
      menuApi.updateCategory(id, payload),
    onSuccess: () => invalidate(),
  });

  const removeCategory = useMutation({
    mutationFn: (id: number) => menuApi.removeCategory(id),
    onSuccess: () => invalidate(),
  });

  const openAddItem = () => {
    if (categoryList.length === 0) {
      setCategoryDrawerOpen(true);
      return;
    }
    setItemDrawer({ open: true, editing: null });
  };

  const handleSaveItem = async (payload: MenuItemRequest) => {
    const editing = itemDrawer.editing;
    await saveItem.mutateAsync(editing ? { id: editing.id, payload } : { payload });
    setItemDrawer({ open: false, editing: null });
    notify('success', editing ? 'Menu item updated.' : 'Menu item added.');
  };

  const handleCreateCategory = async (payload: MenuCategoryRequest) => {
    await createCategory.mutateAsync(payload);
    notify('success', 'Category created.');
  };

  const handleUpdateCategory = async (id: number, payload: MenuCategoryRequest) => {
    await updateCategory.mutateAsync({ id, payload });
    notify('success', 'Category updated.');
  };

  const handleDeleteCategory = async (id: number) => {
    await removeCategory.mutateAsync(id);
    notify('success', 'Category deleted.');
  };

  const isLoading = items.isPending || categories.isPending;
  const isError = items.isError || categories.isError;
  const errorMessage =
    items.error instanceof Error
      ? items.error.message
      : categories.error instanceof Error
        ? categories.error.message
        : undefined;

  const showEmptyState = !isLoading && !isError && rawItems.length === 0;
  const showNoMatch = !isLoading && !isError && rawItems.length > 0 && filtered.length === 0;

  return (
    <>
      <Box sx={{ display: 'grid', gap: 2, minWidth: 0 }}>
        <PageHeader
          title="Menu Management"
          subtitle="Manage dishes, categories, prices and availability across your restaurant."
          actions={
            canManage ? (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Plus size={16} />}
                  onClick={() => setCategoryDrawerOpen(true)}
                >
                  Add Category
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Plus size={16} />}
                  onClick={openAddItem}
                >
                  Add Menu Item
                </Button>
              </Box>
            ) : null
          }
        />

        <MenuSummaryCards
          summary={summary}
          items={items.data}
          categories={categories.data}
          isLoading={isLoading}
        />

        <Card sx={{ p: 1.5, minWidth: 0 }}>
          <MenuCategoryBar
            categories={categoryList}
            counts={categoryCounts}
            totalItems={rawItems.length}
            selected={filters.category}
            onSelect={(value) => patchFilters({ category: value })}
            onAddCategory={() => setCategoryDrawerOpen(true)}
            canManage={canManage}
          />
        </Card>

        <Card sx={{ p: 2, display: 'grid', gap: 1.75, minWidth: 0 }}>
          <MenuToolbar
            search={filters.search}
            onSearchChange={(value) => patchFilters({ search: value })}
            availability={filters.availability}
            onAvailabilityChange={(value) => patchFilters({ availability: value })}
            featured={filters.featured}
            onFeaturedChange={(value) => patchFilters({ featured: value })}
            sort={filters.sort}
            onSortChange={(value) => patchFilters({ sort: value })}
            view={view}
            onViewChange={setView}
            matchCount={filtered.length}
            activeFilterCount={filterCount}
            onClear={clearFilters}
          />

          {isLoading ? (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                  xl: 'repeat(4, minmax(0, 1fr))',
                },
              }}
            >
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} variant="rounded" height={260} sx={{ borderRadius: '14px' }} />
              ))}
            </Box>
          ) : null}

          {isError ? (
            <ErrorState message={errorMessage ?? 'Failed to load your menu.'} onRetry={() => {
              void items.refetch();
              void categories.refetch();
            }} />
          ) : null}

          {showEmptyState ? (
            <EmptyState
              title="Your menu is ready to be created."
              description="Add your first dish to start building your restaurant menu."
              action={
                canManage ? (
                  <Button variant="contained" startIcon={<Plus size={16} />} onClick={openAddItem}>
                    Add your first item
                  </Button>
                ) : null
              }
            />
          ) : null}

          {showNoMatch ? (
            <Box sx={{ display: 'grid', gap: 1.5, justifyItems: 'center', py: 5, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700 }}>No items match your filters</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', maxWidth: 380 }}>
                Try a different search term, category or availability option.
              </Typography>
              <Button variant="outlined" onClick={clearFilters} disabled={filterCount === 0}>
                Clear filters
              </Button>
            </Box>
          ) : null}

          {!isLoading && !isError && filtered.length > 0 ? (
            view === 'grid' ? (
              <MenuGridView
                items={filtered}
                categories={categoryList}
                currency={currency}
                canManage={canManage}
                onEdit={(item) => setItemDrawer({ open: true, editing: item })}
                onToggleAvailability={(item) => toggleAvailability.mutate(item)}
                onDuplicate={(item) => duplicateItem.mutate(item)}
                onDelete={(item) => setDeleteTarget(item)}
              />
            ) : (
              <MenuTableView
                items={filtered}
                totalCount={filtered.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={(size) => {
                  setRowsPerPage(size);
                  setPage(0);
                }}
                sort={filters.sort}
                onSortChange={(value) => patchFilters({ sort: value })}
                categories={categoryList}
                currency={currency}
                canManage={canManage}
                onEdit={(item) => setItemDrawer({ open: true, editing: item })}
                onToggleAvailability={(item) => toggleAvailability.mutate(item)}
                onDelete={(item) => setDeleteTarget(item)}
                isLoading={false}
                isError={false}
                onRetry={() => void items.refetch()}
              />
            )
          ) : null}
        </Card>

        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
          Your menu is managed at restaurant level and applies to all branches.
          {canManage ? ' Changes go live for guests as soon as you save them.' : ''}
        </Typography>
      </Box>

      <MenuItemDrawer
        open={itemDrawer.open}
        editing={itemDrawer.editing}
        categories={categoryList}
        currency={currency}
        onClose={() => setItemDrawer({ open: false, editing: null })}
        onSubmit={handleSaveItem}
      />

      <CategoryDrawer
        open={categoryDrawerOpen}
        onClose={() => setCategoryDrawerOpen(false)}
        categories={categoryList}
        counts={categoryCounts}
        canManage={canManage}
        onCreate={handleCreateCategory}
        onUpdate={handleUpdateCategory}
        onDelete={handleDeleteCategory}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete menu item?"
        description={`"${deleteTarget?.name ?? ''}" will be removed from the menu. This cannot be undone.`}
        confirmLabel="Delete item"
        destructive
        loading={deleteItem.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteItem.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((previous) => ({ ...previous, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((previous) => ({ ...previous, open: false }))}
          sx={{ minWidth: 260 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
