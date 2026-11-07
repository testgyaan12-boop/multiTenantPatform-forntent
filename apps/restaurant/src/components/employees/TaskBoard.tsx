import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { AlertTriangle, ClipboardList, Link2, Pencil, RotateCcw } from 'lucide-react';
import type { AssignableRole, Employee, StaffTask } from '@resto/types';
import {
  KANBAN_COLUMNS,
  NEXT_STATUS_ACTIONS,
  PRIORITY_META,
  TASK_STATUS_META,
  TASK_TYPE_OPTIONS,
} from './employeeUtils';

interface TaskBoardProps {
  tasks: StaffTask[];
  employees: Employee[];
  roles: AssignableRole[];
  canManage: boolean;
  onEdit: (task: StaffTask) => void;
  onStatusChange: (task: StaffTask, status: string) => void;
  onAssign: () => void;
}

interface BoardFilters {
  employeeId: string;
  role: string;
  taskType: string;
  priority: string;
}

const defaultFilters: BoardFilters = { employeeId: '', role: '', taskType: '', priority: '' };

export function TaskBoard({ tasks, employees, roles, canManage, onEdit, onStatusChange, onAssign }: TaskBoardProps) {
  const [filters, setFilters] = useState<BoardFilters>(defaultFilters);

  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        if (filters.employeeId && String(task.assignedToEmployeeId) !== filters.employeeId) return false;
        if (filters.taskType && task.taskType !== filters.taskType) return false;
        if (filters.priority && task.priority !== filters.priority) return false;
        if (filters.role) {
          const employee = employees.find((item) => item.id === task.assignedToEmployeeId);
          if (!employee || !(employee.roles ?? []).includes(filters.role)) return false;
        }
        return true;
      }),
    [tasks, filters, employees],
  );

  const patch = (patch: Partial<BoardFilters>) => setFilters((previous) => ({ ...previous, ...patch }));
  const activeCount = Object.values(filters).filter(Boolean).length;
  const overdueCount = filtered.filter((task) => task.overdue).length;

  return (
    <Box sx={{ display: 'grid', gap: 1.75 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
        <TextField
          select
          size="small"
          label="Employee"
          value={filters.employeeId}
          onChange={(event) => patch({ employeeId: event.target.value })}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All employees</MenuItem>
          {employees.map((employee) => (
            <MenuItem key={employee.id} value={employee.id}>
              {employee.fullName}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Role"
          value={filters.role}
          onChange={(event) => patch({ role: event.target.value })}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All roles</MenuItem>
          {roles.map((role) => (
            <MenuItem key={role.code} value={role.code}>
              {role.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Task type"
          value={filters.taskType}
          onChange={(event) => patch({ taskType: event.target.value })}
          sx={{ minWidth: 175 }}
        >
          <MenuItem value="">All types</MenuItem>
          {TASK_TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Priority"
          value={filters.priority}
          onChange={(event) => patch({ priority: event.target.value })}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          {Object.entries(PRIORITY_META).map(([code, meta]) => (
            <MenuItem key={code} value={code}>
              {meta.label}
            </MenuItem>
          ))}
        </TextField>
        <Button
          size="small"
          color="inherit"
          startIcon={<RotateCcw size={14} />}
          disabled={activeCount === 0}
          onClick={() => setFilters(defaultFilters)}
          sx={{ color: activeCount === 0 ? 'text.disabled' : 'text.secondary', fontSize: 13 }}
        >
          Clear filters
        </Button>
        {canManage ? (
          <Button variant="contained" startIcon={<ClipboardList size={15} />} onClick={onAssign} sx={{ ml: { sm: 'auto' } }}>
            + Assign Task
          </Button>
        ) : null}
      </Box>

      {overdueCount > 0 ? (
        <Alert severity="warning" variant="outlined" sx={{ borderRadius: '10px', fontSize: 12.5 }}>
          {overdueCount} overdue task{overdueCount === 1 ? '' : 's'} — due time has passed.
        </Alert>
      ) : null}

      {filtered.length === 0 ? (
        <Box sx={{ display: 'grid', gap: 1.5, justifyItems: 'center', py: 6, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700 }}>No tasks match the current filters</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', maxWidth: 380 }}>
            Assign a task to an employee to get the board started.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.75,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              md: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            },
            alignItems: 'start',
          }}
        >
          {KANBAN_COLUMNS.map((column) => {
            const columnTasks = filtered.filter((task) => column.statuses.includes(task.status));
            return (
              <Box key={column.key} sx={{ display: 'grid', gap: 1.25, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{column.title}</Typography>
                  <Chip
                    size="small"
                    label={columnTasks.length}
                    sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#F1F3F7', color: 'text.secondary', border: 'none' }}
                  />
                </Box>
                {columnTasks.length === 0 ? (
                  <Card sx={{ p: 2, borderRadius: '12px', borderStyle: 'dashed', boxShadow: 'none' }}>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center' }}>Empty</Typography>
                  </Card>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} canManage={canManage} onEdit={onEdit} onStatusChange={onStatusChange} />
                  ))
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

function TaskCard({
  task,
  canManage,
  onEdit,
  onStatusChange,
}: {
  task: StaffTask;
  canManage: boolean;
  onEdit: (task: StaffTask) => void;
  onStatusChange: (task: StaffTask, status: string) => void;
}) {
  const priority = PRIORITY_META[task.priority] ?? { label: task.priority, color: '#2563EB', bg: '#EEF4FF' };
  const statusMeta = TASK_STATUS_META[task.status] ?? { label: task.status, color: '#718096', bg: '#F1F3F7' };
  const actions = NEXT_STATUS_ACTIONS[task.status] ?? [];
  return (
    <Card
      sx={{
        p: 1.5,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: task.overdue ? '#DC262666' : 'divider',
        boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
        display: 'grid',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>{task.title}</Typography>
        <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
          {canManage ? (
            <Tooltip title="Edit task">
              <IconButton size="small" aria-label={`Edit ${task.title}`} onClick={() => onEdit(task)}>
                <Pencil size={14} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Chip size="small" label={statusMeta.label} sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: statusMeta.bg, color: statusMeta.color, border: 'none' }} />
        <Chip size="small" label={priority.label} sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: priority.bg, color: priority.color, border: 'none' }} />
        {task.overdue ? (
          <Chip size="small" icon={<AlertTriangle size={11} />} label="Overdue" sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: '#FEECEB', color: '#DC2626', border: 'none', '& .MuiChip-icon': { color: '#DC2626' } }} />
        ) : null}
      </Box>

      <Box sx={{ display: 'grid', gap: 0.25 }}>
        <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary' }}>
          {task.assignedToName ?? 'Unassigned'}
          {task.assignedToRole ? ` · ${task.assignedToRole}` : ''}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
          {task.tableNumber ? (
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Link2 size={12} /> Table {task.tableNumber}
            </Typography>
          ) : null}
          {task.orderNumber ? (
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Link2 size={12} /> {task.orderNumber}
            </Typography>
          ) : null}
          {task.dueAt ? (
            <Typography sx={{ fontSize: 11.5, color: task.overdue ? '#DC2626' : 'text.secondary', fontWeight: task.overdue ? 700 : 400 }}>
              Due {new Date(task.dueAt).toLocaleString()}
            </Typography>
          ) : null}
        </Box>
      </Box>

      {task.statusNote ? (
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontStyle: 'italic' }}>“{task.statusNote}”</Typography>
      ) : null}

      {actions.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {actions.map((action) => (
            <Button
              key={action.status}
              size="small"
              variant="outlined"
              disabled={!canManage}
              onClick={() => onStatusChange(task, action.status)}
              sx={{
                fontSize: 11.5,
                fontWeight: 600,
                py: 0.35,
                px: 1,
                color: action.status === 'COMPLETED' ? '#16A36A' : action.status === 'CANCELLED' ? '#DC2626' : undefined,
                borderColor: action.status === 'COMPLETED' ? '#16A36A55' : action.status === 'CANCELLED' ? '#DC262655' : undefined,
              }}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      ) : null}
    </Card>
  );
}
