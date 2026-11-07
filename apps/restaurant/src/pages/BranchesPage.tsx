import { useMemo, useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Snackbar, Typography } from '@mui/material';
import { PageHeader } from '@resto/ui';
import type { Branch, BranchRequest, SalesSummary } from '@resto/types';
import { branchApi, orderApi, reportApi, updateRestaurantProfile } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { ConfirmDialog } from '@resto/ui';
import { BranchFormDialog } from '@/components/branches/BranchFormDialog';
import { BranchKpiCards } from '@/components/branches/BranchKpiCards';
import { BranchTableView, type BranchMetrics } from '@/components/branches/BranchTableView';
import { ManagementActionCards } from '@/components/branches/ManagementActionCards';
import { RestaurantProfileCard } from '@/components/branches/RestaurantProfileCard';
import { RestaurantProfileDialog } from '@/components/branches/RestaurantProfileDialog';
import { defaultBranchFilters, downloadBranchesCsv, type BranchFilters } from '@/components/branches/branchUtils';

const OPEN_STATUSES = new Set(['PLACED', 'CONFIRMED', 'PREPARING', 'READY']);

type SnackState = { open: boolean; severity: 'success' | 'error' | 'info'; message: string };

export function BranchesPage() {
  const { profile, branches, isLoading } = useRestaurant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canManageBranches = user?.permissions?.includes('branch.manage') ?? false;

  const [filters, setFilters] = useState<BranchFilters>(defaultBranchFilters);
  const [formDialog, setFormDialog] = useState<{ open: boolean; editing: Branch | null }>({
    open: false,
    editing: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [snack, setSnack] = useState<SnackState>({ open: false, severity: 'success', message: '' });

  const notify = (severity: SnackState['severity'], message: string) =>
    setSnack({ open: true, severity, message });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['branches'] });
    void queryClient.invalidateQueries({ queryKey: ['restaurant-profile'] });
    void queryClient.invalidateQueries({ queryKey: ['branch-metrics'] });
    void queryClient.invalidateQueries({ queryKey: ['sales-report'] });
    void queryClient.invalidateQueries({ queryKey: ['customers-report'] });
    void queryClient.invalidateQueries({ queryKey: ['order-counts'] });
  };

  // Restaurant-level totals: last 30 days vs the 30 days before that.
  const salesQueries = useQueries({
    queries: [
      {
        queryKey: ['sales-report', { days: 30, branchId: null, scope: 'restaurant' }],
        queryFn: () => reportApi.sales(30),
        staleTime: 60_000,
      },
      {
        queryKey: ['sales-report', { days: 60, branchId: null, scope: 'restaurant' }],
        queryFn: () => reportApi.sales(60),
        staleTime: 60_000,
      },
      {
        queryKey: ['customers-report', { days: 30, branchId: null }],
        queryFn: () => reportApi.customers(30),
        staleTime: 60_000,
      },
    ],
  });
  const sales30 = salesQueries[0].data;
  const sales60 = salesQueries[1].data;
  const customersSummary = salesQueries[2].data;
  const salesPrevious: SalesSummary | undefined =
    sales30 && sales60
      ? {
          orderCount: Math.max(sales60.orderCount - sales30.orderCount, 0),
          grossRevenue: Number(sales60.grossRevenue) - Number(sales30.grossRevenue),
          averageTicket: 0,
          topItems: [],
        }
      : undefined;

  // Per-branch metrics (active orders + 30d revenue) from real endpoints.
  const branchMetricQueries = useQueries({
    queries: branches.map((branch) => ({
      queryKey: ['branch-metrics', branch.id] as const,
      queryFn: async (): Promise<BranchMetrics> => {
        const [counts, revenue] = await Promise.all([
          orderApi.counts(branch.id, 30),
          reportApi.sales(30, branch.id),
        ]);
        const activeOrders = Object.entries(counts.byStatus ?? {})
          .filter(([status]) => OPEN_STATUSES.has(status))
          .reduce((sum, [, count]) => sum + count, 0);
        return { activeOrders, revenue30d: revenue };
      },
      staleTime: 60_000,
    })),
  });

  const metricsByBranchId = useMemo(() => {
    const map: Record<number, BranchMetrics | undefined> = {};
    branchMetricQueries.forEach((result, index) => {
      const branch = branches[index];
      if (branch) map[branch.id] = result.data;
    });
    return map;
  }, [branchMetricQueries, branches]);

  const activeBranchCount = branches.filter((branch) => (branch.status ?? 'ACTIVE') === 'ACTIVE').length;
  const currency = profile?.currency ?? 'INR';

  const saveBranch = useMutation({
    mutationFn: (payload: BranchRequest) =>
      formDialog.editing ? branchApi.update(formDialog.editing.id, payload) : branchApi.create(payload),
    onSuccess: (branch) => {
      setFormDialog({ open: false, editing: null });
      invalidate();
      notify('success', formDialog.editing ? `${branch.name} updated.` : `${branch.name} created.`);
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to save the branch.'),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'PAUSED' }) => branchApi.updateStatus(id, status),
    onSuccess: (branch) => {
      invalidate();
      notify(
        'success',
        (branch.status ?? 'ACTIVE') === 'ACTIVE'
          ? `${branch.name} reactivated.`
          : `${branch.name} paused. Guests can no longer start new orders there.`,
      );
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to update branch status.'),
  });

  const removeBranch = useMutation({
    mutationFn: (id: number) => branchApi.remove(id),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidate();
      notify('success', 'Branch deleted. Historical orders are preserved.');
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to delete the branch.'),
  });

  const saveProfile = useMutation({
    mutationFn: (payload: Parameters<typeof updateRestaurantProfile>[0]) => updateRestaurantProfile(payload),
    onSuccess: () => {
      setProfileDialogOpen(false);
      invalidate();
      notify('success', 'Restaurant profile saved.');
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to save the profile.'),
  });

  const openAdd = () => {
    setFormDialog({ open: true, editing: null });
  };

  const openEdit = (branch: Branch) => {
    setFormDialog({ open: true, editing: branch });
  };

  const handleToggleStatus = (branch: Branch) => {
    const current = branch.status ?? 'ACTIVE';
    toggleStatus.mutate({
      id: branch.id,
      status: current === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
    });
  };

  return (
    <>
      <PageHeader
        title="Restaurant & Branch Management"
        subtitle="Manage your restaurant, branches and business overview."
      />

      <Box sx={{ display: 'grid', gap: 2.5 }}>
        <BranchKpiCards
          totalBranches={branches.length}
          activeBranches={activeBranchCount}
          salesCurrent={sales30}
          salesPrevious={salesPrevious}
          customers={customersSummary}
          isLoading={isLoading || salesQueries[0].isPending}
          currency={currency}
        />

        {salesQueries[0].isError ? (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
            Failed to load business metrics.{' '}
            <button
              type="button"
              onClick={() => void salesQueries[0].refetch()}
              style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
            >
              Retry
            </button>
          </Alert>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2.2fr) minmax(280px, 1fr)' },
            alignItems: 'stretch',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <BranchTableView
              branches={branches}
              metricsByBranchId={metricsByBranchId}
              filters={filters}
              onFiltersChange={setFilters}
              profile={profile}
              canManage={canManageBranches}
              isLoading={isLoading}
              onAdd={openAdd}
              onView={(branch) => {
                // "View" focuses this branch across the app.
                localStorage.setItem('resto.active-branch', String(branch.id));
                navigate('/');
              }}
              onEdit={openEdit}
              onToggleStatus={handleToggleStatus}
              onDelete={setDeleteTarget}
              onExport={() => {
                downloadBranchesCsv(`branches-${new Date().toISOString().slice(0, 10)}.csv`, branches);
                notify('success', `Exported ${branches.length} branch${branches.length === 1 ? '' : 'es'}.`);
              }}
            />
          </Box>

          <RestaurantProfileCard
            profile={profile}
            ownerName={user ? `${user.firstName} ${user.lastName}` : '—'}
            ownerEmail={user?.email ?? '—'}
            isLoading={isLoading}
            onEdit={() => setProfileDialogOpen(true)}
          />
        </Box>

        <ManagementActionCards
          onAnalytics={() => navigate('/reports')}
          onManageBranches={() => {
            const table = document.getElementById('branch-management-anchor');
            table?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onEditProfile={() => setProfileDialogOpen(true)}
        />

        <Box id="branch-management-anchor" />
      </Box>

      <BranchFormDialog
        open={formDialog.open}
        editing={formDialog.editing}
        restaurantId={profile?.id ?? 0}
        defaultTimezone={profile?.timezone ?? 'UTC'}
        profileCurrency={profile?.currency}
        onClose={() => setFormDialog({ open: false, editing: null })}
        onSubmit={async (payload) => {
          await saveBranch.mutateAsync(payload);
        }}
      />

      <RestaurantProfileDialog
        open={profileDialogOpen}
        profile={profile}
        onClose={() => setProfileDialogOpen(false)}
        onSubmit={async (payload) => {
          await saveProfile.mutateAsync(payload);
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete branch?"
        description={`"${deleteTarget?.name ?? ''}" will be removed from the list. Historical orders and financial records are kept.`}
        confirmLabel="Delete"
        destructive
        loading={removeBranch.isPending}
        onConfirm={() => {
          if (deleteTarget) removeBranch.mutate(deleteTarget.id);
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

      {!canManageBranches ? (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1 }}>
          You can view branches, but only managers can edit or pause them.
        </Typography>
      ) : null}
    </>
  );
}
