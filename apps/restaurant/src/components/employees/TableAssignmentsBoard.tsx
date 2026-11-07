import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link2, RefreshCw, UserRound, X } from 'lucide-react';
import type { DiningTable, Employee, TableAssignment } from '@resto/types';
import { initials, roleMeta } from './employeeUtils';

interface TableAssignmentsBoardProps {
  tables: DiningTable[];
  assignments: TableAssignment[];
  employees: Employee[];
  loading: boolean;
  canManage: boolean;
  onAssign: (tableId: number, employeeId: number) => Promise<void>;
  onRelease: (tableId: number) => Promise<void>;
  onRefresh: () => void;
}

export function TableAssignmentsBoard({
  tables,
  assignments,
  employees,
  loading,
  canManage,
  onAssign,
  onRelease,
  onRefresh,
}: TableAssignmentsBoardProps) {
  const [assigningTable, setAssigningTable] = useState<DiningTable | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [releasingTable, setReleasingTable] = useState<DiningTable | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignmentByTableId = useMemo(() => {
    const map = new Map<number, TableAssignment>();
    for (const assignment of assignments) map.set(assignment.tableId, assignment);
    return map;
  }, [assignments]);

  const activeEmployees = employees.filter((employee) => employee.status === 'ACTIVE');

  const openAssign = (table: DiningTable) => {
    const current = assignmentByTableId.get(table.id);
    setSelectedEmployeeId(current ? String(current.employeeId) : '');
    setAssigningTable(table);
    setError(null);
  };

  const submitAssign = async () => {
    if (!assigningTable || !selectedEmployeeId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onAssign(assigningTable.id, Number(selectedEmployeeId));
      setAssigningTable(null);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Failed to update the assignment.');
    } finally {
      setBusy(false);
    }
  };

  const submitRelease = async () => {
    if (!releasingTable || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onRelease(releasingTable.id);
      setReleasingTable(null);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Failed to release the table.');
    } finally {
      setBusy(false);
    }
  };

  const assignedCount = assignments.length;
  const openTables = tables.filter((table) => !assignmentByTableId.has(table.id)).length;

  return (
    <Box sx={{ display: 'grid', gap: 1.75 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
        <Chip size="small" label={`${assignedCount} assigned`} sx={{ height: 24, fontSize: 12, fontWeight: 700, bgcolor: '#E7F0FF', color: '#3B82F6', border: 'none' }} />
        <Chip size="small" label={`${openTables} unassigned`} sx={{ height: 24, fontSize: 12, fontWeight: 700, bgcolor: '#F1F3F7', color: 'text.secondary', border: 'none' }} />
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: { xs: 'none', md: 'block' } }}>
          One waiter/staff member per table — reassignment moves the ownership immediately.
        </Typography>
        <Tooltip title="Refresh">
          <IconButton size="small" aria-label="Refresh assignments" onClick={onRefresh} sx={{ ml: 'auto' }}>
            <RefreshCw size={16} />
          </IconButton>
        </Tooltip>
      </Box>

      {error ? (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
          <CircularProgress size={26} />
        </Box>
      ) : tables.length === 0 ? (
        <Box sx={{ display: 'grid', gap: 1.5, justifyItems: 'center', py: 6, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700 }}>No tables yet</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', maxWidth: 380 }}>
            Create dining tables first, then assign staff ownership here.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(3, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
              xl: 'repeat(5, minmax(0, 1fr))',
            },
          }}
        >
          {tables.map((table) => {
            const assignment = assignmentByTableId.get(table.id);
            const employee = assignment
              ? activeEmployees.find((item) => item.id === assignment.employeeId)
              : undefined;
            const meta = employee ? roleMeta(employee.roles?.[0]) : null;
            return (
              <Box
                key={table.id}
                sx={{
                  border: '1px solid',
                  borderColor: assignment ? `${meta?.color ?? '#3B82F6'}55` : 'divider',
                  borderRadius: '14px',
                  p: 1.5,
                  display: 'grid',
                  gap: 1,
                  bgcolor: assignment ? `${meta?.bg ?? '#F8F9FB'}` : '#ffffff',
                  boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                    <Link2 size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                    Table {table.tableNumber}
                  </Typography>
                  <Chip
                    size="small"
                    label={table.status?.toLowerCase() ?? 'available'}
                    sx={{
                      height: 20,
                      fontSize: 10.5,
                      fontWeight: 700,
                      border: 'none',
                      bgcolor: table.status === 'OCCUPIED' ? '#FEECEB' : '#F1F3F7',
                      color: table.status === 'OCCUPIED' ? '#DC2626' : 'text.secondary',
                    }}
                  />
                </Box>

                {assignment && employee && meta ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: meta.bg,
                          color: meta.color,
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 800,
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        {initials(employee.fullName)}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
                          {employee.fullName}
                        </Typography>
                        <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary' }}>
                          {meta.label}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={!canManage || busy}
                        onClick={() => openAssign(table)}
                        sx={{ fontSize: 11.5, flex: 1, py: 0.35 }}
                      >
                        Reassign
                      </Button>
                      <Button
                        size="small"
                        color="inherit"
                        disabled={!canManage || busy}
                        onClick={() => {
                          setReleasingTable(table);
                          setError(null);
                        }}
                        sx={{ fontSize: 11.5, color: '#DC2626', py: 0.35 }}
                      >
                        Release
                      </Button>
                    </Box>
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <UserRound size={13} /> Unassigned
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!canManage || busy || activeEmployees.length === 0}
                      onClick={() => openAssign(table)}
                      sx={{ fontSize: 12, py: 0.5 }}
                    >
                      Assign staff
                    </Button>
                  </>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      <Dialog open={assigningTable != null} onClose={busy ? undefined : () => setAssigningTable(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>
          {assignmentByTableId.get(assigningTable?.id ?? -1) ? 'Reassign' : 'Assign'} Table {assigningTable?.tableNumber}
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.5, pt: '12px !important' }}>
          <TextField
            select
            label="Employee"
            value={selectedEmployeeId}
            onChange={(event) => setSelectedEmployeeId(event.target.value)}
            fullWidth
            autoFocus
            disabled={busy}
          >
            <MenuItem value="">Select an employee…</MenuItem>
            {activeEmployees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.fullName} — {roleMeta(employee.roles?.[0]).label}
              </MenuItem>
            ))}
          </TextField>
          <DialogContentText sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            If another employee already owns this table, the assignment is moved and an audit record is written.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setAssigningTable(null)} disabled={busy} sx={{ fontSize: 13 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitAssign()}
            disabled={busy || !selectedEmployeeId}
            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ fontSize: 13 }}
          >
            {busy ? 'Saving…' : 'Save assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={releasingTable != null} onClose={busy ? undefined : () => setReleasingTable(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>Release Table {releasingTable?.tableNumber}?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            The current staff ownership is removed. The table stays active and can be reassigned at any time.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setReleasingTable(null)} disabled={busy} sx={{ fontSize: 13 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void submitRelease()}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <X size={14} />}
            sx={{ fontSize: 13 }}
          >
            {busy ? 'Releasing…' : 'Release table'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
