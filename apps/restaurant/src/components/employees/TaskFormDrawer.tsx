import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { X } from 'lucide-react';
import type { DiningTable, Employee, StaffTask } from '@resto/types';
import { PRIORITY_META, TASK_TYPE_OPTIONS } from './employeeUtils';

interface TaskFormDrawerProps {
  open: boolean;
  editing: StaffTask | null;
  employees: Employee[];
  tables: DiningTable[];
  branchId: number | null;
  defaultEmployeeId?: number | null;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description?: string;
    taskType: string;
    priority: string;
    assignedToEmployeeId: number;
    branchId: number;
    tableId?: number | null;
    orderId?: number | null;
    dueAt?: string | null;
    instructions?: string;
  }) => Promise<void>;
}

interface FormState {
  title: string;
  description: string;
  taskType: string;
  priority: string;
  assignedToEmployeeId: string;
  tableId: string;
  orderId: string;
  dueAtLocal: string;
  instructions: string;
}

const initialForm = (defaultEmployeeId?: number | null): FormState => ({
  title: '',
  description: '',
  taskType: 'CUSTOM_TASK',
  priority: 'NORMAL',
  assignedToEmployeeId: defaultEmployeeId ? String(defaultEmployeeId) : '',
  tableId: '',
  orderId: '',
  dueAtLocal: '',
  instructions: '',
});

export function TaskFormDrawer({
  open,
  editing,
  employees,
  tables,
  branchId,
  defaultEmployeeId,
  onClose,
  onSubmit,
}: TaskFormDrawerProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(defaultEmployeeId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        const dueAt = editing.dueAt ? new Date(editing.dueAt) : null;
        const local =
          dueAt && !Number.isNaN(dueAt.getTime())
            ? `${dueAt.getFullYear()}-${String(dueAt.getMonth() + 1).padStart(2, '0')}-${String(dueAt.getDate()).padStart(2, '0')}T${String(dueAt.getHours()).padStart(2, '0')}:${String(dueAt.getMinutes()).padStart(2, '0')}`
            : '';
        setForm({
          title: editing.title,
          description: editing.description ?? '',
          taskType: editing.taskType,
          priority: editing.priority,
          assignedToEmployeeId: editing.assignedToEmployeeId ? String(editing.assignedToEmployeeId) : '',
          tableId: editing.tableId ? String(editing.tableId) : '',
          orderId: editing.orderId ? String(editing.orderId) : '',
          dueAtLocal: local,
          instructions: editing.instructions ?? '',
        });
      } else {
        setForm(initialForm(defaultEmployeeId));
      }
      setErrors({});
      setApiError(null);
      setSaving(false);
    }
  }, [open, editing, defaultEmployeeId]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee.id) === form.assignedToEmployeeId),
    [employees, form.assignedToEmployeeId],
  );
  const concurrentWarning = editing ? 0 : 0;

  const set = (key: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || !branchId) return;
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = 'Task title is required';
    if (!form.assignedToEmployeeId) nextErrors.assignedToEmployeeId = 'Select an employee';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const dueAt = form.dueAtLocal ? new Date(form.dueAtLocal).toISOString() : null;
    setSaving(true);
    setApiError(null);
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        taskType: form.taskType,
        priority: form.priority,
        assignedToEmployeeId: Number(form.assignedToEmployeeId),
        branchId,
        tableId: form.tableId ? Number(form.tableId) : null,
        orderId: form.orderId ? Number(form.orderId) : undefined,
        dueAt,
        instructions: form.instructions.trim() || undefined,
      });
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Failed to save the task.');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={saving ? undefined : onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100vw', sm: 480 },
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
              {editing ? 'Edit task' : 'Assign task'}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              Allocate work to one employee — link it to a table or order when relevant.
            </Typography>
          </Box>
          <IconButton size="small" aria-label="Close" onClick={onClose} disabled={saving}>
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
            label="Task title"
            value={form.title}
            onChange={(event) => set('title', event.target.value)}
            error={Boolean(errors.title)}
            helperText={errors.title}
            fullWidth
            autoFocus
          />

          <TextField
            label="Description"
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
            multiline
            minRows={2}
            fullWidth
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              select
              label="Task type"
              value={form.taskType}
              onChange={(event) => set('taskType', event.target.value)}
              fullWidth
            >
              {TASK_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Priority"
              value={form.priority}
              onChange={(event) => set('priority', event.target.value)}
              fullWidth
            >
              {Object.entries(PRIORITY_META).map(([code, meta]) => (
                <MenuItem key={code} value={code}>
                  {meta.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            select
            label="Assigned employee"
            value={form.assignedToEmployeeId}
            onChange={(event) => set('assignedToEmployeeId', event.target.value)}
            error={Boolean(errors.assignedToEmployeeId)}
            helperText={
              errors.assignedToEmployeeId ??
              (selectedEmployee
                ? `${selectedEmployee.fullName} · ${selectedEmployee.branchName ?? ''}`
                : 'Employees from this branch only')
            }
            fullWidth
          >
            {employees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id} disabled={employee.status !== 'ACTIVE'}>
                {employee.fullName} — {employee.roles?.[0]?.replace(/_/g, ' ') ?? 'Staff'}
              </MenuItem>
            ))}
          </TextField>

          <Divider />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              select
              label="Table"
              value={form.tableId}
              onChange={(event) => set('tableId', event.target.value)}
              helperText="Optional"
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {tables.map((table) => (
                <MenuItem key={table.id} value={table.id}>
                  Table {table.tableNumber}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Related order ID"
              value={form.orderId}
              onChange={(event) => set('orderId', event.target.value)}
              helperText="Optional"
              fullWidth
              inputProps={{ inputMode: 'numeric' }}
            />
          </Box>

          <TextField
            label="Due time"
            type="datetime-local"
            value={form.dueAtLocal}
            onChange={(event) => set('dueAtLocal', event.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Instructions"
            value={form.instructions}
            onChange={(event) => set('instructions', event.target.value)}
            multiline
            minRows={2}
            helperText="Optional step-by-step notes for the employee"
            fullWidth
          />

          {concurrentWarning > 0 ? (
            <Alert severity="warning" variant="outlined" sx={{ borderRadius: '10px' }}>
              This employee already has {concurrentWarning} active tasks.
            </Alert>
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
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Assign task'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
