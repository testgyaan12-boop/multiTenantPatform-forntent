import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog, ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi, type CouponView } from '@/api';
import { useToast } from '@/components/toast';

interface CouponForm {
  code: string;
  description: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  startsAt: string;
  endsAt: string;
  maxRedemptions: string;
}

const emptyForm: CouponForm = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: 10,
  startsAt: '',
  endsAt: '',
  maxRedemptions: '',
};

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');
const toInstant = (date: string) => (date ? `${date}T00:00:00Z` : null);

export function CouponsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<{ mode: 'create' } | { mode: 'edit'; coupon: CouponView } | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CouponView | null>(null);

  const coupons = useQuery({ queryKey: ['sa-coupons'], queryFn: () => platformApi.coupons() });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        code: form.code.trim(),
        description: form.description || null,
        discountType: form.discountType,
        discountValue: form.discountValue,
        startsAt: toInstant(form.startsAt),
        endsAt: toInstant(form.endsAt),
        maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
        tenantId: null,
      };
      return dialog?.mode === 'edit'
        ? platformApi.updateCoupon(dialog.coupon.id, payload)
        : platformApi.createCoupon(payload);
    },
    onSuccess: () => {
      toast(dialog?.mode === 'edit' ? 'Coupon updated' : 'Coupon created');
      setDialog(null);
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ['sa-coupons'] });
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => platformApi.deleteCoupon(id),
    onSuccess: () => {
      toast('Coupon deleted');
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['sa-coupons'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  return (
    <>
      <PageHeader
        title="Coupons & Promotions"
        subtitle="Platform-wide coupons stored in the coupons table (V7)."
        actions={
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => {
              setForm(emptyForm);
              setFormError(null);
              setDialog({ mode: 'create' });
            }}
          >
            Create coupon
          </Button>
        }
      />

      {coupons.isPending ? <LoadingState /> : null}
      {coupons.isError ? <ErrorState message={coupons.error.message} onRetry={() => void coupons.refetch()} /> : null}

      {coupons.data ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Window</TableCell>
              <TableCell>Redemptions</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.data.map((coupon) => (
              <TableRow key={coupon.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                    {coupon.code}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{coupon.description}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={
                      coupon.discountType === 'PERCENT'
                        ? `${coupon.discountValue}% off`
                        : `${coupon.discountValue} off`
                    }
                  />
                </TableCell>
                <TableCell>
                  {coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString() : '—'} →{' '}
                  {coupon.endsAt ? new Date(coupon.endsAt).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell>
                  {coupon.redeemedCount}
                  {coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ''}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      startIcon={<Pencil size={14} />}
                      onClick={() => {
                        setForm({
                          code: coupon.code,
                          description: coupon.description ?? '',
                          discountType: coupon.discountType as 'PERCENT' | 'FIXED',
                          discountValue: coupon.discountValue,
                          startsAt: toDateInput(coupon.startsAt),
                          endsAt: toDateInput(coupon.endsAt),
                          maxRedemptions: coupon.maxRedemptions != null ? String(coupon.maxRedemptions) : '',
                        });
                        setFormError(null);
                        setDialog({ mode: 'edit', coupon });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Trash2 size={14} />}
                      onClick={() => setDeleteTarget(coupon)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {coupons.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No coupons yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      ) : null}

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{dialog?.mode === 'edit' ? 'Edit coupon' : 'Create coupon'}</DialogTitle>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.code.trim()) {
              setFormError('Code is required.');
              return;
            }
            save.mutate();
          }}
        >
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Code"
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
                  required
                  fullWidth
                />
                <TextField
                  select
                  label="Type"
                  value={form.discountType}
                  onChange={(event) =>
                    setForm({ ...form, discountType: event.target.value as 'PERCENT' | 'FIXED' })
                  }
                  fullWidth
                >
                  <MenuItem value="PERCENT">Percent (%)</MenuItem>
                  <MenuItem value="FIXED">Fixed amount</MenuItem>
                </TextField>
              </Stack>
              <TextField
                label="Description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Value"
                  type="number"
                  value={form.discountValue}
                  onChange={(event) => setForm({ ...form, discountValue: Number(event.target.value) })}
                  fullWidth
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <TextField
                  label="Max redemptions"
                  value={form.maxRedemptions}
                  onChange={(event) => setForm({ ...form, maxRedemptions: event.target.value })}
                  fullWidth
                  inputProps={{ min: 1 }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Starts"
                  type="date"
                  value={form.startsAt}
                  onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Ends"
                  type="date"
                  value={form.endsAt}
                  onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              {formError ? (
                <Typography color="error" variant="body2">
                  {formError}
                </Typography>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={save.isPending}>
              Save coupon
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete coupon?"
        description={`"${deleteTarget?.code}" will be soft-deleted and stop being offered.`}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget.id);
        }}
      />
    </>
  );
}
