import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Chip,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { ConfirmDialog, ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi } from '@/api';
import { formatInr } from '@/format';
import { useToast } from '@/components/toast';

const statusColor: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  PAID: 'success',
  OPEN: 'warning',
  VOID: 'default',
  REFUNDED: 'error',
};

export function InvoicesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [target, setTarget] = useState<{ id: number; action: 'mark-paid' | 'void'; label: string } | null>(null);

  const invoices = useQuery({
    queryKey: ['sa-invoices', { page, size, search, status }],
    queryFn: () => platformApi.invoices({ page, size, search: search || undefined, status: status || undefined }),
  });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'mark-paid' | 'void' }) =>
      action === 'mark-paid' ? platformApi.markInvoicePaid(id) : platformApi.voidInvoice(id),
    onSuccess: (_data, vars) => {
      toast(vars.action === 'mark-paid' ? 'Invoice marked as paid' : 'Invoice voided');
      setTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['sa-invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-stats'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  return (
    <>
      <PageHeader title="Invoices & Payments" subtitle="Subscription invoices across all tenants. Mark sandbox payments as paid to record revenue." />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Search number or tenant"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 260 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(0);
          }}
          sx={{ width: 170 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="OPEN">Open</MenuItem>
          <MenuItem value="PAID">Paid</MenuItem>
          <MenuItem value="VOID">Void</MenuItem>
        </TextField>
      </Stack>

      {invoices.isPending ? <LoadingState /> : null}
      {invoices.isError ? <ErrorState message={invoices.error.message} onRetry={() => void invoices.refetch()} /> : null}

      {invoices.data ? (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.data.content.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      {invoice.invoiceNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{invoice.tenantName}</TableCell>
                  <TableCell>
                    {formatInr(invoice.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={invoice.status} color={statusColor[invoice.status] ?? 'default'} />
                  </TableCell>
                  <TableCell>{invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '—'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {invoice.status !== 'PAID' && invoice.status !== 'VOID' ? (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => setTarget({ id: invoice.id, action: 'mark-paid', label: invoice.invoiceNumber })}
                        >
                          Mark paid
                        </Button>
                      ) : null}
                      {invoice.status === 'OPEN' ? (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setTarget({ id: invoice.id, action: 'void', label: invoice.invoiceNumber })}
                        >
                          Void
                        </Button>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.data.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No invoices found. Assigning a plan to a tenant generates the first invoice.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={invoices.data.page.totalElements}
            page={page}
            rowsPerPage={size}
            onPageChange={(_, next) => setPage(next)}
            onRowsPerPageChange={(event) => {
              setSize(Number(event.target.value));
              setPage(0);
            }}
          />
        </>
      ) : null}

      <ConfirmDialog
        open={target !== null}
        title={target?.action === 'mark-paid' ? 'Mark invoice as paid?' : 'Void invoice?'}
        description={
          target?.action === 'mark-paid'
            ? `Record a sandbox payment for "${target?.label}"? This counts towards revenue.`
            : `"${target?.label}" will be voided and excluded from outstanding balances.`
        }
        confirmLabel={target?.action === 'mark-paid' ? 'Mark paid' : 'Void'}
        destructive={target?.action === 'void'}
        loading={act.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (target) act.mutate({ id: target.id, action: target.action });
        }}
      />
    </>
  );
}
