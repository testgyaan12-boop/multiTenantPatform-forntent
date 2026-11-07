import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Button, Chip, CircularProgress, Snackbar, Typography } from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Plus, Printer, RefreshCw } from 'lucide-react';
import { ConfirmDialog, EmptyState, ErrorState, PageHeader } from '@resto/ui';
import type { DiningTable, DiningTableRequest } from '@resto/types';
import { tableApi } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLiveOrders } from '@/hooks/useDashboardData';
import { TableDetailsDrawer } from '@/components/tables/TableDetailsDrawer';
import { TableFormDrawer } from '@/components/tables/TableFormDrawer';
import { TableGrid } from '@/components/tables/TableGrid';
import { TableListView } from '@/components/tables/TableListView';
import { TableSummaryCards } from '@/components/tables/TableSummaryCards';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { QrDrawer } from '@/components/tables/QrDrawer';
import { QrPrintSheet } from '@/components/tables/QrPrintSheet';
import {
  activeOrdersByTable,
  defaultTableFilters,
  deriveStatus,
  downloadCanvasPng,
  filterTables,
  publicUrl,
  qrFilename,
  summarizeTables,
  type DerivedStatus,
  type TableFilters,
} from '@/components/tables/tablesUtils';

interface SnackState {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
}

interface ExportJob {
  url: string;
  filename: string;
}

const VIEW_STORAGE_KEY = 'resto.tables-view';

export function TablesPage() {
  const { activeBranch, activeBranchId, profile } = useRestaurant();
  const { user } = useAuth();
  const canManage = user?.permissions?.includes('table.manage') ?? false;
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<TableFilters>(defaultTableFilters);
  const [view, setViewState] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid';
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === 'list' ? 'list' : 'grid';
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [detail, setDetail] = useState<{ open: boolean; table: DiningTable | null }>({
    open: false,
    table: null,
  });
  const [form, setForm] = useState<{ open: boolean; editing: DiningTable | null }>({
    open: false,
    editing: null,
  });
  const [qrTarget, setQrTarget] = useState<DiningTable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiningTable | null>(null);
  const [printTargets, setPrintTargets] = useState<DiningTable[]>([]);
  const [exportQueue, setExportQueue] = useState<ExportJob[]>([]);
  const [snack, setSnack] = useState<SnackState>({ open: false, severity: 'success', message: '' });
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const exportHandledRef = useRef<ExportJob | null>(null);

  const notify = (severity: 'success' | 'error', message: string) =>
    setSnack({ open: true, severity, message });

  const tables = useQuery({
    queryKey: ['tables', activeBranchId],
    enabled: activeBranchId !== null,
    queryFn: () => tableApi.list(activeBranchId as number),
  });
  const liveOrders = useLiveOrders();

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['tables'] });

  useEffect(() => {
    setSelected(new Set());
    setDetail({ open: false, table: null });
    setQrTarget(null);
    setPage(0);
  }, [activeBranchId]);

  const rawTables = tables.data ?? [];
  const isLoading = tables.isPending;
  const isError = tables.isError;

  const orderByTable = useMemo(
    () => activeOrdersByTable(liveOrders.data?.content ?? []),
    [liveOrders.data],
  );

  const statusByTable = useMemo(() => {
    const map = new Map<number, DerivedStatus>();
    for (const table of rawTables) {
      map.set(table.id, deriveStatus(table, orderByTable.get(table.id)));
    }
    return map;
  }, [rawTables, orderByTable]);

  const filtered = useMemo(
    () => filterTables(rawTables, statusByTable, filters),
    [rawTables, statusByTable, filters],
  );
  const summary = useMemo(
    () => summarizeTables(rawTables, statusByTable),
    [rawTables, statusByTable],
  );
  const filterCount = [
    filters.search.trim() !== '',
    filters.status !== '',
    filters.sort !== 'number-asc',
  ].filter(Boolean).length;

  const currentDetail = useMemo(
    () =>
      detail.table ? (rawTables.find((table) => table.id === detail.table?.id) ?? detail.table) : null,
    [detail.table, rawTables],
  );
  const currentQrTarget = useMemo(
    () => (qrTarget ? (rawTables.find((table) => table.id === qrTarget.id) ?? qrTarget) : null),
    [qrTarget, rawTables],
  );
  const currentDeleteTarget = useMemo(
    () =>
      deleteTarget
        ? (rawTables.find((table) => table.id === deleteTarget.id) ?? deleteTarget)
        : null,
    [deleteTarget, rawTables],
  );

  const selectedTables = useMemo(
    () => rawTables.filter((table) => selected.has(table.id)),
    [rawTables, selected],
  );

  const save = useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: DiningTableRequest }) =>
      id === undefined
        ? tableApi.create(activeBranchId as number, payload)
        : tableApi.update(id, payload),
    onSuccess: (_data, variables) => {
      setForm({ open: false, editing: null });
      invalidate();
      notify('success', variables.id === undefined ? 'Table added.' : 'Table updated.');
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => tableApi.remove(id),
    onSuccess: (_data, id) => {
      setDeleteTarget(null);
      setDetail((previous) => (previous.table?.id === id ? { open: false, table: null } : previous));
      setSelected((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
      invalidate();
      notify('success', 'Table deleted. Its QR code no longer works.');
    },
    onError: (error: Error) => notify('error', error.message || 'Failed to delete the table.'),
  });

  const rotate = useMutation({
    mutationFn: (id: number) => tableApi.rotateQr(id),
    onSuccess: (table) => {
      setQrTarget(table);
      invalidate();
    },
  });

  const handleSave = async (payload: DiningTableRequest) => {
    try {
      await save.mutateAsync({ id: form.editing?.id, payload });
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to save the table.');
    }
  };

  const handleRegenerate = async () => {
    if (!currentQrTarget) return;
    await rotate.mutateAsync(currentQrTarget.id);
  };

  const queueDownloads = (list: DiningTable[]) => {
    if (list.length === 0) return;
    exportHandledRef.current = null;
    setExportQueue(list.map((table) => ({ url: publicUrl(table), filename: qrFilename(table) })));
    notify('success', `Preparing ${list.length} QR download${list.length === 1 ? '' : 's'}…`);
  };

  const currentExport = exportQueue[0] ?? null;

  useEffect(() => {
    if (!currentExport) return;
    if (exportHandledRef.current === currentExport) return;
    const canvas = exportCanvasRef.current;
    if (!canvas) return;
    exportHandledRef.current = currentExport;
    downloadCanvasPng(canvas, currentExport.filename);
    setExportQueue((queue) => queue.slice(1));
  }, [currentExport]);

  const setView = (next: 'grid' | 'list') => {
    setViewState(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // storage unavailable — view preference stays session-only
    }
  };

  const patchFilters = (patch: Partial<TableFilters>) => {
    setFilters((previous) => ({ ...previous, ...patch }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters(defaultTableFilters);
    setPage(0);
  };

  const toggleSelect = (id: number) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: number[], checked: boolean) => {
    setSelected((previous) => {
      const next = new Set(previous);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const openDetails = (table: DiningTable) => setDetail({ open: true, table });
  const openQr = (table: DiningTable) => {
    setDetail((previous) => ({ open: false, table: previous.table }));
    setQrTarget(table);
  };

  const activeOrderForDelete = currentDeleteTarget
    ? orderByTable.get(currentDeleteTarget.id)
    : undefined;

  const handlePrintDone = useCallback(() => setPrintTargets([]), []);

  const showEmpty = !isLoading && !isError && rawTables.length === 0;
  const showNoMatch = !isLoading && !isError && rawTables.length > 0 && filtered.length === 0;
  const liveSyncing = liveOrders.isRefetching && !liveOrders.isPending;
  const canInteract = activeBranchId !== null;

  return (
    <Box sx={{ display: 'grid', gap: 2, minWidth: 0 }}>
      <PageHeader
        title="Tables & QR"
        subtitle={
          activeBranch ? `${activeBranch.name} · ${activeBranch.code}` : 'Select a branch to manage tables'
        }
        actions={
          canInteract ? (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Download size={16} />}
                disabled={selectedTables.length === 0}
                onClick={() => queueDownloads(selectedTables)}
              >
                Download QR codes{selectedTables.length > 0 ? ` (${selectedTables.length})` : ''}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Printer size={16} />}
                disabled={selectedTables.length === 0}
                onClick={() => setPrintTargets(selectedTables)}
              >
                Print QR codes
              </Button>
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                disabled={!canManage}
                onClick={() => setForm({ open: true, editing: null })}
              >
                Add Table
              </Button>
            </Box>
          ) : null
        }
      />

      <TableSummaryCards summary={summary} isLoading={isLoading} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          icon={
            liveSyncing ? (
              <CircularProgress size={13} sx={{ color: 'inherit' }} />
            ) : (
              <RefreshCw size={13} />
            )
          }
          label={liveSyncing ? 'Syncing live orders…' : 'Live order sync every 15s'}
          sx={{
            height: 24,
            fontSize: 11.5,
            fontWeight: 600,
            bgcolor: '#E7F8F0',
            color: '#16A36A',
            border: 'none',
            '& .MuiChip-icon': { color: '#16A36A' },
          }}
        />
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
          Table status follows active dine-in orders — tables free up automatically when an order
          is completed or cancelled.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 1.75,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '16px',
          bgcolor: '#ffffff',
          p: { xs: 1.5, sm: 2 },
          boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
          minWidth: 0,
        }}
      >
        <TableToolbar
          filters={filters}
          onPatch={patchFilters}
          onClear={clearFilters}
          view={view}
          onViewChange={setView}
          matchCount={filtered.length}
        />

        {showEmpty ? (
          <EmptyState
            title="No tables in this branch yet."
            description="Add your first table to generate a QR code guests can scan to order."
            action={
              canManage ? (
                <Button
                  variant="contained"
                  startIcon={<Plus size={16} />}
                  onClick={() => setForm({ open: true, editing: null })}
                >
                  Add your first table
                </Button>
              ) : null
            }
          />
        ) : null}

        {showNoMatch ? (
          <Box sx={{ display: 'grid', gap: 1.5, justifyItems: 'center', py: 5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>No tables match your filters</Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', maxWidth: 380 }}>
              Try a different search term or status filter.
            </Typography>
            <Button variant="outlined" onClick={clearFilters} disabled={filterCount === 0}>
              Clear filters
            </Button>
          </Box>
        ) : null}

        {!isLoading && isError ? (
          <ErrorState
            message={tables.error?.message ?? 'Failed to load tables.'}
            onRetry={() => void tables.refetch()}
          />
        ) : null}

        {!isError && filtered.length > 0 && activeBranchId !== null ? (
          view === 'grid' ? (
            <TableGrid
              tables={filtered}
              orderByTable={orderByTable}
              statusByTable={statusByTable}
              selected={selected}
              onToggleSelect={toggleSelect}
              onOpen={openDetails}
              isLoading={isLoading}
            />
          ) : (
            <TableListView
              tables={filtered}
              totalCount={filtered.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(size) => {
                setRowsPerPage(size);
                setPage(0);
              }}
              orderByTable={orderByTable}
              statusByTable={statusByTable}
              selected={selected}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onOpen={openDetails}
              onEdit={(table) => setForm({ open: true, editing: table })}
              onQr={openQr}
              onDelete={(table) => setDeleteTarget(table)}
              canManage={canManage}
              isLoading={isLoading}
            />
          )
        ) : null}
      </Box>

      <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
        QR codes link to {activeBranch ? `${activeBranch.name}’s` : 'the'} guest menu. Regenerating a
        QR code invalidates the previous one immediately.
      </Typography>

      {currentDetail ? (
        <TableDetailsDrawer
          open={detail.open}
          table={currentDetail}
          status={statusByTable.get(currentDetail.id) ?? 'UNKNOWN'}
          order={orderByTable.get(currentDetail.id)}
          branchName={activeBranch?.name ?? ''}
          currency={profile?.currency ?? 'INR'}
          canManage={canManage}
          onClose={() => setDetail((previous) => ({ ...previous, open: false }))}
          onEdit={() => {
            setForm({ open: true, editing: currentDetail });
            setDetail((previous) => ({ ...previous, open: false }));
          }}
          onOpenQr={() => openQr(currentDetail)}
          onDelete={() => {
            setDeleteTarget(currentDetail);
            setDetail((previous) => ({ ...previous, open: false }));
          }}
        />
      ) : null}

      <TableFormDrawer
        open={form.open}
        editing={form.editing}
        existing={rawTables}
        branchName={activeBranch?.name ?? ''}
        editingStatus={
          form.editing ? (statusByTable.get(form.editing.id) ?? null) : null
        }
        onClose={() => setForm({ open: false, editing: null })}
        onSubmit={handleSave}
      />

      <QrDrawer
        open={currentQrTarget !== null}
        table={currentQrTarget}
        restaurantName={profile?.name ?? 'Restaurant'}
        branchName={activeBranch?.name ?? ''}
        isRegenerating={rotate.isPending}
        onClose={() => setQrTarget(null)}
        onRegenerate={handleRegenerate}
        onDownload={() => {
          if (currentQrTarget) queueDownloads([currentQrTarget]);
        }}
        onPrint={() => {
          if (currentQrTarget) {
            setPrintTargets([currentQrTarget]);
          }
        }}
        notify={notify}
      />

      <ConfirmDialog
        open={currentDeleteTarget !== null}
        title="Delete table?"
        description={
          activeOrderForDelete
            ? `Table ${currentDeleteTarget?.tableNumber ?? ''} has an active order (${activeOrderForDelete.orderNumber}). Deleting it now removes the table from the floor while that order keeps running. Continue?`
            : `Table ${currentDeleteTarget?.tableNumber ?? ''} and its QR code will stop working. This cannot be undone.`
        }
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (currentDeleteTarget) remove.mutate(currentDeleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <QrPrintSheet
        tables={printTargets}
        restaurantName={profile?.name ?? 'Restaurant'}
        branchName={activeBranch?.name ?? ''}
        onDone={handlePrintDone}
      />

      {currentExport ? (
        <Box
          aria-hidden
          sx={{ position: 'fixed', left: -10000, top: 0, zIndex: -1, pointerEvents: 'none' }}
        >
          <QRCodeCanvas ref={exportCanvasRef} value={currentExport.url} size={512} marginSize={4} />
        </Box>
      ) : null}

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
    </Box>
  );
}
