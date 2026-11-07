import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { Branch, BranchRequest } from '@resto/types';
import { employeeApi } from '@/api';

interface BranchFormDialogProps {
  open: boolean;
  editing: Branch | null;
  restaurantId: number;
  defaultTimezone: string;
  profileCurrency?: string;
  onClose: () => void;
  onSubmit: (payload: BranchRequest) => Promise<unknown>;
}

interface FormState {
  code: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  timezone: string;
  openingHours: string;
  isDefault: boolean;
  managerId: string;
  currency: string;
}

const emptyForm = (timezone: string): FormState => ({
  code: '',
  name: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: '',
  email: '',
  timezone,
  openingHours: '',
  isDefault: false,
  managerId: '',
  currency: '',
});

export function BranchFormDialog({
  open,
  editing,
  restaurantId,
  defaultTimezone,
  profileCurrency,
  onClose,
  onSubmit,
}: BranchFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultTimezone));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const employeesQuery = useQuery({
    queryKey: ['branch-form-employees'],
    queryFn: () => employeeApi.list({ page: 0, size: 100 }),
    staleTime: 60_000,
    enabled: open,
  });
  const employees = (employeesQuery.data?.content ?? []).filter(
    (employee) => (employee.status ?? 'ACTIVE') === 'ACTIVE',
  );

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          code: editing.code,
          name: editing.name,
          addressLine1: editing.addressLine1,
          addressLine2: editing.addressLine2 ?? '',
          city: editing.city,
          state: editing.state ?? '',
          postalCode: editing.postalCode ?? '',
          country: editing.country ?? 'US',
          phone: editing.phone ?? '',
          email: editing.email ?? '',
          timezone: editing.timezone ?? defaultTimezone,
          openingHours: editing.openingHours ?? '',
          isDefault: editing.isDefault,
          managerId: editing.managerId != null ? String(editing.managerId) : '',
          currency: editing.currency ?? '',
        });
      } else {
        setForm(emptyForm(defaultTimezone));
      }
      setErrors({});
      setApiError(null);
      setSaving(false);
    }
  }, [open, editing, defaultTimezone]);

  const set = (key: keyof FormState, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.code.trim()) next.code = 'Branch code is required';
    else if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) next.code = 'Use letters, numbers, - or _ only';
    if (!form.name.trim()) next.name = 'Branch name is required';
    if (!form.addressLine1.trim()) next.addressLine1 = 'Address is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email';
    if (form.country.trim().length !== 2) next.country = 'Use a 2-letter country code';
    if (form.currency.trim() && form.currency.trim().length !== 3) next.currency = 'Use a 3-letter code or leave blank';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    const payload: BranchRequest = {
      restaurantId,
      code: form.code.trim(),
      name: form.name.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      country: form.country.trim().toUpperCase(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      timezone: form.timezone.trim() || undefined,
      openingHours: form.openingHours.trim() || undefined,
      isDefault: form.isDefault,
      managerId: form.managerId ? Number(form.managerId) : null,
      currency: form.currency.trim() ? form.currency.trim().toUpperCase() : null,
    };
    try {
      await onSubmit(payload);
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Failed to save the branch.');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontSize: 17, fontWeight: 700 }}>
        {editing ? `Edit ${editing.name}` : 'Add branch'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2}>
            {apiError ? (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
                {apiError}
              </Alert>
            ) : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Branch code"
                value={form.code}
                onChange={(event) => set('code', event.target.value)}
                error={Boolean(errors.code)}
                helperText={errors.code ?? 'Unique, e.g. DT-01'}
                disabled={editing != null}
                fullWidth
                required
              />
              <TextField
                label="Branch name"
                value={form.name}
                onChange={(event) => set('name', event.target.value)}
                error={Boolean(errors.name)}
                fullWidth
                required
              />
            </Stack>

            <TextField
              label="Address line 1"
              value={form.addressLine1}
              onChange={(event) => set('addressLine1', event.target.value)}
              error={Boolean(errors.addressLine1)}
              fullWidth
              required
            />
            <TextField
              label="Address line 2"
              value={form.addressLine2}
              onChange={(event) => set('addressLine2', event.target.value)}
              helperText="Optional"
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="City"
                value={form.city}
                onChange={(event) => set('city', event.target.value)}
                error={Boolean(errors.city)}
                fullWidth
                required
              />
              <TextField
                label="State"
                value={form.state}
                onChange={(event) => set('state', event.target.value)}
                fullWidth
              />
              <TextField
                label="Postal code"
                value={form.postalCode}
                onChange={(event) => set('postalCode', event.target.value)}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Country"
                value={form.country}
                onChange={(event) => set('country', event.target.value.toUpperCase())}
                error={Boolean(errors.country)}
                inputProps={{ maxLength: 2 }}
                fullWidth
              />
              <TextField
                label="Contact phone"
                value={form.phone}
                onChange={(event) => set('phone', event.target.value)}
                fullWidth
              />
              <TextField
                label="Contact email"
                type="email"
                value={form.email}
                onChange={(event) => set('email', event.target.value)}
                error={Boolean(errors.email)}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Timezone"
                value={form.timezone}
                onChange={(event) => set('timezone', event.target.value)}
                helperText="IANA name, e.g. Asia/Kolkata"
                fullWidth
              />
              <TextField
                label="Operating hours"
                value={form.openingHours}
                onChange={(event) => set('openingHours', event.target.value)}
                helperText="e.g. Mon-Fri 09:00-22:00 | Sat-Sun 10:00-23:00"
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="branch-manager-label">Branch manager</InputLabel>
                <Select
                  labelId="branch-manager-label"
                  label="Branch manager"
                  value={form.managerId}
                  onChange={(event) => set('managerId', event.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>No manager assigned</em>
                  </MenuItem>
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={String(employee.id)}>
                      {employee.fullName || employee.employeeCode || `Employee #${employee.id}`}
                      {employee.jobTitle ? ` — ${employee.jobTitle}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Currency override"
                value={form.currency}
                onChange={(event) => set('currency', event.target.value.toUpperCase())}
                error={Boolean(errors.currency)}
                helperText={
                  errors.currency ??
                  `3-letter code (e.g. EUR). Blank inherits restaurant ${profileCurrency || 'currency'}.`
                }
                inputProps={{ maxLength: 3 }}
                fullWidth
              />
            </Stack>

            {form.isDefault || editing?.isDefault ? (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: '10px', fontSize: 12.5 }}>
                This is the default branch. It always stays active and cannot be deleted.
              </Alert>
            ) : (
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                The first branch you create becomes the default location.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : undefined}
            sx={{ px: 3 }}
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create branch'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
