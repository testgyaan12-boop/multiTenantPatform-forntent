import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { Info, X } from 'lucide-react';
import type { DiningTable, DiningTableRequest } from '@resto/types';
import { statusMeta, type DerivedStatus } from './tablesUtils';

interface TableFormDrawerProps {
  open: boolean;
  editing: DiningTable | null;
  existing: DiningTable[];
  branchName: string;
  editingStatus: DerivedStatus | null;
  onClose: () => void;
  onSubmit: (payload: DiningTableRequest) => Promise<void>;
}

interface FormState {
  tableNumber: string;
  name: string;
  capacity: number | '';
}

function initialForm(editing: DiningTable | null): FormState {
  if (editing) {
    return {
      tableNumber: editing.tableNumber,
      name: editing.name ?? '',
      capacity: editing.capacity,
    };
  }
  return { tableNumber: '', name: '', capacity: 2 };
}

export function TableFormDrawer({
  open,
  editing,
  existing,
  branchName,
  editingStatus,
  onClose,
  onSubmit,
}: TableFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(editing));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialForm(editing));
      setErrors({});
      setApiError(null);
      setSaving(false);
    }
  }, [open, editing]);

  const set = (key: keyof FormState, value: FormState[keyof FormState]) => {
    setForm((previous) => ({ ...previous, [key]: value }) as FormState);
    setErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setApiError(null);

    const nextErrors: Record<string, string> = {};
    const number = form.tableNumber.trim();
    if (!number) {
      nextErrors.tableNumber = 'Table number is required';
    } else if (number.length > 20) {
      nextErrors.tableNumber = 'Must be at most 20 characters';
    } else if (
      existing.some(
        (table) =>
          table.id !== editing?.id && table.tableNumber.toLowerCase() === number.toLowerCase(),
      )
    ) {
      nextErrors.tableNumber = 'Table number is already in use in this branch';
    }

    const capacity = Number(form.capacity);
    if (form.capacity === '' || !Number.isInteger(capacity) || capacity < 1) {
      nextErrors.capacity = 'Capacity must be a whole number of at least 1';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: DiningTableRequest = {
      tableNumber: number,
      name: form.name.trim() || undefined,
      capacity,
    };

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Failed to save the table.');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  const statusInfo = editing && editingStatus ? statusMeta[editingStatus] : null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={saving ? undefined : onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100vw', sm: 440 },
            borderLeft: { sm: '1px solid' },
            borderLeftColor: { sm: 'divider' },
            backgroundImage: 'none',
          },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>
              {editing ? `Edit table ${editing.tableNumber}` : 'Add table'}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{branchName}</Typography>
          </Box>
          <IconButton size="small" aria-label="Close form" onClick={onClose} disabled={saving}>
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5, display: 'grid', gap: 2 }}>
          {apiError ? (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
              {apiError}
            </Alert>
          ) : null}

          <TextField
            label="Table number"
            value={form.tableNumber}
            onChange={(event) => set('tableNumber', event.target.value)}
            error={Boolean(errors.tableNumber)}
            helperText={errors.tableNumber ?? 'Shown to guests and staff (max 20 characters)'}
            required
            fullWidth
            autoFocus
            inputProps={{ maxLength: 20 }}
          />

          <TextField
            label="Table name"
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name ?? 'Optional label, e.g. “Window seat”'}
            fullWidth
            inputProps={{ maxLength: 80 }}
          />

          <TextField
            label="Seating capacity"
            type="number"
            value={form.capacity}
            onChange={(event) =>
              set('capacity', event.target.value === '' ? '' : Number(event.target.value))
            }
            error={Boolean(errors.capacity)}
            helperText={errors.capacity}
            required
            fullWidth
            inputProps={{ min: 1, step: 1 }}
          />

          {editing ? (
            <>
              <Divider />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.25,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  px: 1.5,
                  py: 1.25,
                  bgcolor: '#F8F9FB',
                }}
              >
                <Info size={17} color="#718096" style={{ marginTop: 2, flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                    Status: {statusInfo?.label ?? 'Unknown'}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
                    Table status follows active orders and is managed by the system — it cannot be
                    set manually here.
                  </Typography>
                </Box>
              </Box>
            </>
          ) : null}
        </Box>

        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            justifyContent: 'flex-end',
            bgcolor: '#ffffff',
          }}
        >
          <Button color="inherit" onClick={onClose} disabled={saving} sx={{ px: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : undefined}
            sx={{ px: 3, py: 0.9 }}
          >
            {saving ? 'Saving…' : 'Save Table'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
