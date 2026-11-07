import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { MessageSquare, Phone, Search, X } from 'lucide-react';
import { inquiryApi } from '@/api';
import { useRestaurant } from '@/context/RestaurantContext';
import { INQUIRY_STATUSES, type Inquiry, type InquiryStatus } from '@resto/types';

const STATUS_COLORS: Record<InquiryStatus, 'primary' | 'info' | 'success' | 'default' | 'error'> = {
  NEW: 'primary',
  CONTACTED: 'info',
  QUALIFIED: 'success',
  CLOSED: 'default',
  LOST: 'error',
};

const BOOKING_COLORS: Record<string, 'success' | 'warning' | 'default'> = {
  PAID: 'success',
  PENDING: 'warning',
};

function formatAmount(amount: number, _currency?: string): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

export function InquiriesPage() {
  const { profile } = useRestaurant();
  const currency = profile?.currency ?? 'INR';
  const queryClient = useQueryClient();

  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [editStatus, setEditStatus] = useState<string>('NEW');
  const [editNotes, setEditNotes] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['inquiries', status, search, page],
    queryFn: () =>
      inquiryApi.list({ status: status || undefined, search: search || undefined, page, size: 20 }),
  });

  const save = useMutation({
    mutationFn: (input: { id: number; status: string; notes: string }) =>
      inquiryApi.update(input.id, { status: input.status, notes: input.notes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      setSelected(null);
      setSaveError(null);
    },
    onError: (error: Error) => setSaveError(error.message || 'Failed to update the enquiry.'),
  });

  const rows = useMemo(() => list.data?.content ?? [], [list.data]);
  const meta = list.data?.page;

  const openDetail = (inquiry: Inquiry) => {
    setSelected(inquiry);
    setEditStatus(inquiry.status);
    setEditNotes(inquiry.notes ?? '');
    setSaveError(null);
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  };

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Enquiries
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.25 }}>
          Customer enquiries and bookings from your public store.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: '14px', p: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ sm: 'center' }}
          component="form"
          onSubmit={submitSearch}
        >
          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {INQUIRY_STATUSES.map((value) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Search name or phone"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <Search size={15} style={{ marginRight: 8, color: '#98A2B3' }} />
              ),
            }}
          />
          <Button type="submit" variant="outlined" disabled={list.isFetching}>
            Search
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: '14px', overflow: 'hidden' }}>
        {list.isLoading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress size={26} />
          </Box>
        ) : list.isError ? (
          <Alert
            severity="error"
            sx={{ m: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => list.refetch()}>
                Retry
              </Button>
            }
          >
            Could not load enquiries.
          </Alert>
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
            <MessageSquare size={26} style={{ color: '#98A2B3' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, mt: 1 }}>
              No enquiries yet
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              {search || status ? 'No results match your filters.' : 'Enquiries from your store will appear here.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Booking</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Received</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((inquiry) => (
                  <TableRow key={inquiry.id} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{inquiry.name}</Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{inquiry.phone}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {inquiry.itemName ?? <span style={{ color: '#98A2B3' }}>General</span>}
                    </TableCell>
                    <TableCell>
                      {inquiry.bookingPaymentStatus && inquiry.bookingPaymentStatus !== 'NONE' ? (
                        <Chip
                          size="small"
                          color={BOOKING_COLORS[inquiry.bookingPaymentStatus] ?? 'default'}
                          label={`${formatAmount(inquiry.bookingAmount ?? 0, currency)} · ${inquiry.bookingPaymentStatus}`}
                          sx={{ fontSize: 11, fontWeight: 600 }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={STATUS_COLORS[inquiry.status] ?? 'default'}
                        label={inquiry.status}
                        sx={{ fontSize: 11, fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {new Date(inquiry.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openDetail(inquiry)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {meta && meta.totalPages > 1 ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 1.5 }}>
            <Pagination
              count={meta.totalPages}
              page={page + 1}
              onChange={(_, value) => setPage(value - 1)}
              size="small"
            />
          </Box>
        ) : null}
      </Paper>

      <Dialog open={selected !== null} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Enquiry #{selected?.id}
          <IconButton size="small" onClick={() => setSelected(null)} aria-label="Close">
            <X size={17} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2 }}>
          {saveError ? <Alert severity="error">{saveError}</Alert> : null}
          {selected ? (
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{selected.name}</Typography>
                <Stack direction="row" spacing={1.5} sx={{ fontSize: 12.5, color: 'text.secondary', alignItems: 'center', mt: 0.25 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} /> {selected.phone}
                  </span>
                  {selected.email ? <span>{selected.email}</span> : null}
                </Stack>
              </Box>
              {selected.itemName ? (
                <Typography sx={{ fontSize: 13 }}>
                  Product: <b>{selected.itemName}</b>
                </Typography>
              ) : null}
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'grey.50' }}>
                <Typography sx={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>
                  {selected.message || 'No message provided.'}
                </Typography>
              </Paper>
              {selected.bookingPaymentStatus && selected.bookingPaymentStatus !== 'NONE' ? (
                <Alert
                  severity={selected.bookingPaymentStatus === 'PAID' ? 'success' : 'warning'}
                  variant="outlined"
                  sx={{ borderRadius: '10px' }}
                >
                  Booking payment {formatAmount(selected.bookingAmount ?? 0, currency)} —{' '}
                  {selected.bookingPaymentStatus}
                  {selected.orderId ? ` (order #${selected.orderId})` : ''}
                </Alert>
              ) : null}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5 }}>
                <TextField
                  select
                  label="Status"
                  value={editStatus}
                  onChange={(event) => setEditStatus(event.target.value)}
                  size="small"
                  fullWidth
                >
                  {INQUIRY_STATUSES.map((value) => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Internal notes"
                  value={editNotes}
                  onChange={(event) => setEditNotes(event.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  inputProps={{ maxLength: 1000 }}
                />
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={save.isPending || selected === null}
            onClick={() =>
              selected &&
              save.mutate({ id: selected.id, status: editStatus, notes: editNotes })
            }
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
