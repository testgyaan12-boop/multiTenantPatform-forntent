import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { Download, QrCode, RefreshCw } from 'lucide-react';
import { ConfirmDialog, PageHeader } from '@resto/ui';
import type { Order } from '@resto/types';
import { orderApi } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { useAdvanceOrder, useSalesSummary } from '@/hooks/useDashboardData';
import { useHeaderFilters } from '@/layout/HeaderFilters';
import { OrderDetailsDrawer } from '@/components/orders/OrderDetailsDrawer';
import { OrderFilterBar } from '@/components/orders/OrderFilterBar';
import { OrderKpiCards } from '@/components/orders/OrderKpiCards';
import { OrderStatusTabs } from '@/components/orders/OrderStatusTabs';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { buildOrdersCsv, downloadCsv, nextStatus as nextStatusMap } from '@/components/orders/orderUtils';

interface SnackState {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
}

const CSV_MAX_PAGES = 20;
const CSV_PAGE_SIZE = 100;
const NEW_ORDER_HIGHLIGHT_MS = 8_000;

export function OrdersPage() {
  const { activeBranch, activeBranchId } = useRestaurant();
  const { user } = useAuth();
  const canManage = user?.permissions?.includes('order.manage') ?? false;
  const { days, setDays } = useHeaderFilters();
  const queryClient = useQueryClient();
  const advance = useAdvanceOrder();

  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [exporting, setExporting] = useState(false);
  const [snack, setSnack] = useState<SnackState>({ open: false, severity: 'success', message: '' });

  const seenSeededRef = useRef(false);
  const maxSeenIdRef = useRef(0);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orders = useQuery({
    queryKey: [
      'orders',
      'paged',
      { branchId: activeBranchId, status, paymentStatus, source, search, days, page, size },
    ],
    enabled: activeBranchId !== null,
    queryFn: () =>
      orderApi.list({
        branchId: activeBranchId ?? undefined,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        source: source || undefined,
        search: search || undefined,
        days,
        page,
        size,
      }),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  const counts = useQuery({
    queryKey: ['order-counts', { branchId: activeBranchId, days }],
    enabled: activeBranchId !== null,
    queryFn: () => orderApi.counts(activeBranchId, days),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  const summary = useSalesSummary(days);

  const selectedOrder = useQuery({
    queryKey: ['order-detail', selectedOrderId],
    enabled: selectedOrderId !== null,
    queryFn: () => orderApi.get(selectedOrderId as number),
    staleTime: 5_000,
  });

  const timeline = useQuery({
    queryKey: ['order-timeline', selectedOrderId],
    enabled: selectedOrderId !== null,
    queryFn: () => orderApi.timeline(selectedOrderId as number),
    staleTime: 5_000,
  });

  const cancelOrder = useMutation({
    mutationFn: (order: Order) => orderApi.updateStatus(order.id, 'CANCELLED'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['order-counts'] });
      void queryClient.invalidateQueries({ queryKey: ['sales-report'] });
      void queryClient.invalidateQueries({ queryKey: ['order-detail'] });
      void queryClient.invalidateQueries({ queryKey: ['order-timeline'] });
      setSnack({ open: true, severity: 'success', message: 'Order cancelled.' });
      setCancelTarget(null);
      setSelectedOrderId(null);
    },
    onError: (error: Error) => {
      setSnack({ open: true, severity: 'error', message: error.message || 'Failed to cancel order.' });
      setCancelTarget(null);
    },
  });

  useEffect(() => {
    const content = orders.data?.content;
    if (!content || content.length === 0) return;

    const ids = content.map((order) => order.id);
    const highest = Math.max(...ids);

    if (!seenSeededRef.current) {
      seenSeededRef.current = true;
      maxSeenIdRef.current = Math.max(maxSeenIdRef.current, highest);
      return;
    }

    const fresh = ids.filter((id) => id > maxSeenIdRef.current);
    if (fresh.length === 0) return;

    maxSeenIdRef.current = Math.max(maxSeenIdRef.current, highest);
    setNewOrderIds((previous) => {
      const nextSet = new Set(previous);
      for (const id of fresh) nextSet.add(id);
      return nextSet;
    });
    setSnack({
      open: true,
      severity: 'success',
      message:
        fresh.length === 1
          ? 'New order received — refreshes automatically.'
          : `${fresh.length} new orders received.`,
    });

    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setNewOrderIds(new Set()), NEW_ORDER_HIGHLIGHT_MS);
  }, [orders.data]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const activeFilterCount = [
    status !== '',
    search.trim() !== '',
    paymentStatus !== '',
    source !== '',
    days !== 1,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatus('');
    setSearch('');
    setPaymentStatus('');
    setSource('');
    setDays(1);
    setPage(0);
  };

  const handleRefresh = () => {
    void orders.refetch();
    void counts.refetch();
  };

  const lastUpdatedLabel = orders.dataUpdatedAt
    ? new Date(orders.dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const collected: Order[] = [];
      for (let currentPage = 0; currentPage < CSV_MAX_PAGES; currentPage += 1) {
        const data = await orderApi.list({
          branchId: activeBranchId ?? undefined,
          status: status || undefined,
          paymentStatus: paymentStatus || undefined,
          source: source || undefined,
          search: search || undefined,
          days,
          page: currentPage,
          size: CSV_PAGE_SIZE,
        });
        collected.push(...data.content);
        if (data.content.length === 0 || collected.length >= data.page.totalElements) break;
      }
      const today = new Date().toISOString().slice(0, 10);
      downloadCsv(`orders-${today}.csv`, buildOrdersCsv(collected));
      setSnack({ open: true, severity: 'success', message: `Exported ${collected.length} orders to CSV.` });
    } catch {
      setSnack({ open: true, severity: 'error', message: 'Failed to export orders.' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        '@keyframes orderRowFlash': {
          '0%': { boxShadow: 'inset 4px 0 0 #F4511E', bgcolor: 'rgba(244,81,30,0.16)' },
          '100%': { boxShadow: 'inset 0 0 0 transparent', bgcolor: 'rgba(244,81,30,0.07)' },
        },
        '.order-row-new': { animation: 'orderRowFlash 2s ease-in-out' },
      }}
    >
      <PageHeader
        title="Orders"
        subtitle="Live queue for every channel — auto-refreshes every 15 seconds."
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Tooltip title="Refresh now">
              <span>
                <IconButton
                  aria-label="Refresh orders"
                  onClick={handleRefresh}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <RefreshCw size={16} />
                </IconButton>
              </span>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Download size={15} />}
              onClick={() => void exportCsv()}
              disabled={exporting}
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/tables"
              startIcon={<QrCode size={15} />}
            >
              Tables &amp; QR
            </Button>
          </Box>
        }
      />

      <OrderKpiCards
        counts={counts.data}
        summary={summary.data}
        isLoading={counts.isPending || summary.isPending}
        days={days}
      />

      <OrderStatusTabs value={status} onChange={(next) => { setStatus(next); setPage(0); }} counts={counts.data} />

      <Card sx={{ p: 2, display: 'grid', gap: 1.75 }}>
        <OrderFilterBar
          search={search}
          onSearchChange={(value) => { setSearch(value); setPage(0); }}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={(value) => { setPaymentStatus(value); setPage(0); }}
          source={source}
          onSourceChange={(value) => { setSource(value); setPage(0); }}
          days={days}
          onDaysChange={(value) => { setDays(value); setPage(0); }}
          activeFilterCount={activeFilterCount}
          onClear={clearFilters}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>
              {orders.data ? orders.data.page.totalElements : 0} order
              {orders.data?.page.totalElements === 1 ? '' : 's'}
            </Typography>
            <Chip
              size="small"
              label={`Updated ${lastUpdatedLabel}`}
              sx={{
                height: 24,
                fontSize: 11.5,
                fontWeight: 600,
                bgcolor: '#F1F5F9',
                color: '#475467',
                border: 'none',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#16A36A',
                animation: 'pulseDot 2s ease-in-out infinite',
                '@keyframes pulseDot': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.35 },
                },
              }}
            />
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
              Auto-refresh · 15s
            </Typography>
          </Box>
        </Box>

        <OrdersTable
          orders={orders.data?.content ?? []}
          isLoading={orders.isPending}
          isError={orders.isError}
          errorMessage={orders.error instanceof Error ? orders.error.message : undefined}
          onRetry={() => void orders.refetch()}
          totalCount={orders.data?.page.totalElements ?? 0}
          page={page}
          rowsPerPage={size}
          onPageChange={setPage}
          onRowsPerPageChange={(nextSize) => { setSize(nextSize); setPage(0); }}
          onSelectOrder={(order) => setSelectedOrderId(order.id)}
          onAdvance={(order) => {
            const next = nextStatusMap[order.status] ?? null;
            if (!next) return;
            advance.mutate(
              { order, next },
              {
                onSuccess: () => {
                  setSnack({
                    open: true,
                    severity: 'success',
                    message: `Order ${order.orderNumber} moved to ${next.toLowerCase()}.`,
                  });
                },
                onError: (error: Error) => {
                  setSnack({
                    open: true,
                    severity: 'error',
                    message: error.message || 'Failed to update order status.',
                  });
                },
              },
            );
          }}
          onCancelOrder={(order) => setCancelTarget(order)}
          newOrderIds={newOrderIds}
          isAdvancing={advance.isPending}
          canManage={canManage}
        />
      </Card>

      <OrderDetailsDrawer
        order={selectedOrder.data ?? null}
        timeline={timeline.data}
        isLoading={selectedOrder.isPending || timeline.isPending}
        isAdvancing={advance.isPending}
        canManage={canManage}
        onClose={() => setSelectedOrderId(null)}
        onAdvance={(order) => {
          const next = nextStatusMap[order.status] ?? null;
          if (!next) return;
          advance.mutate(
            { order, next },
            {
              onSuccess: () => {
                setSnack({
                  open: true,
                  severity: 'success',
                  message: `Order ${order.orderNumber} moved to ${next.toLowerCase()}.`,
                });
              },
              onError: (error: Error) => {
                setSnack({
                  open: true,
                  severity: 'error',
                  message: error.message || 'Failed to update order status.',
                });
              },
            },
          );
        }}
        onCancel={(order) => setCancelTarget(order)}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel this order?"
        description={`${cancelTarget?.orderNumber ?? 'This order'} will be cancelled. This cannot be undone.`}
        confirmLabel="Cancel order"
        destructive
        loading={cancelOrder.isPending}
        onConfirm={() => {
          if (cancelTarget) cancelOrder.mutate(cancelTarget);
        }}
        onCancel={() => setCancelTarget(null)}
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

      <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
        {activeBranch ? `Scoped to ${activeBranch.name}` : 'Select a branch to load orders'} ·
        orders are filtered by the date range selected above.
      </Typography>
    </Box>
  );
}
