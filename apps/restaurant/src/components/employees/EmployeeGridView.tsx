import { Box, Card, Chip, IconButton, Menu, MenuItem, Skeleton, Tooltip, Typography } from '@mui/material';
import { MoreHorizontal, Pencil, Play, ClipboardList, Eye, Power } from 'lucide-react';
import { useState } from 'react';
import type { Employee, StaffTask } from '@resto/types';
import { initials, roleMeta } from './employeeUtils';

interface EmployeeGridViewProps {
  employees: Employee[];
  tasksByEmployee: Map<number, StaffTask[]>;
  canManage: boolean;
  isLoading: boolean;
  onOpen: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onAssignTask: (employee: Employee) => void;
  onToggleDuty: (employee: Employee) => void;
  onToggleStatus: (employee: Employee) => void;
}

export function EmployeeGridView({
  employees,
  tasksByEmployee,
  canManage,
  isLoading,
  onOpen,
  onEdit,
  onAssignTask,
  onToggleDuty,
  onToggleStatus,
}: EmployeeGridViewProps) {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
        }}
      >
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={210} sx={{ borderRadius: '14px' }} />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
      }}
    >
      {employees.map((employee) => {
        const meta = roleMeta(employee.roles?.[0]);
        const tasks = tasksByEmployee.get(employee.id) ?? [];
        const done = tasks.filter((task) => task.status === 'COMPLETED').length;
        const open = tasks.filter((task) => task.status !== 'COMPLETED' && task.status !== 'CANCELLED').length;
        return (
          <Card
            key={employee.id}
            sx={{
              p: 2,
              borderRadius: '14px',
              border: '1px solid',
              borderColor: employee.onDuty ? '#16A36A55' : 'divider',
              boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
              display: 'grid',
              gap: 1.25,
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: meta.bg,
                  color: meta.color,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {initials(employee.fullName)}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  {employee.fullName}
                </Typography>
                <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary' }}>
                  {employee.employeeCode} · {employee.branchName ?? '—'}
                </Typography>
              </Box>
              <EmployeeMenu
                employee={employee}
                canManage={canManage}
                onOpen={onOpen}
                onEdit={onEdit}
                onAssignTask={onAssignTask}
                onToggleDuty={onToggleDuty}
                onToggleStatus={onToggleStatus}
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              <Chip
                size="small"
                label={meta.label}
                sx={{ height: 24, fontSize: 11, fontWeight: 700, bgcolor: meta.bg, color: meta.color, border: 'none' }}
              />
              <Chip
                size="small"
                label={employee.onDuty ? 'On duty' : 'Off duty'}
                sx={{
                  height: 24,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: employee.onDuty ? '#E7F8F0' : '#F1F3F7',
                  color: employee.onDuty ? '#16A36A' : '#718096',
                  border: 'none',
                }}
              />
              {employee.status === 'INACTIVE' ? (
                <Chip size="small" label="Inactive" sx={{ height: 24, fontSize: 11, fontWeight: 700, bgcolor: '#FEECEB', color: '#DC2626', border: 'none' }} />
              ) : null}
            </Box>

            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary' }}>
                {employee.email}
              </Typography>
              <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary' }}>
                {employee.shiftName ? `Shift: ${employee.shiftName}` : 'No shift assigned'}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                pt: 1,
                borderTop: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                  {done}/{done + open}
                  <Box component="span" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: 12 }}>
                    {' '}tasks today
                  </Box>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="View profile & performance">
                  <IconButton size="small" aria-label={`View ${employee.fullName}`} onClick={() => onOpen(employee)}>
                    <Eye size={15} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Assign task">
                  <span>
                    <IconButton
                      size="small"
                      aria-label={`Assign task to ${employee.fullName}`}
                      disabled={!canManage}
                      onClick={() => onAssignTask(employee)}
                    >
                      <ClipboardList size={15} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Card>
        );
      })}
    </Box>
  );
}

interface EmployeeMenuProps {
  employee: Employee;
  canManage: boolean;
  onOpen: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onAssignTask: (employee: Employee) => void;
  onToggleDuty: (employee: Employee) => void;
  onToggleStatus: (employee: Employee) => void;
}

function EmployeeMenu({ employee, canManage, onOpen, onEdit, onAssignTask, onToggleDuty, onToggleStatus }: EmployeeMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <IconButton size="small" aria-label={`Actions for ${employee.fullName}`} onClick={(event) => setAnchor(event.currentTarget)}>
        <MoreHorizontal size={16} />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onOpen(employee);
          }}
        >
          <Eye size={15} style={{ marginRight: 8 }} /> View profile
        </MenuItem>
        <MenuItem
          disabled={!canManage}
          onClick={() => {
            setAnchor(null);
            onEdit(employee);
          }}
        >
          <Pencil size={15} style={{ marginRight: 8 }} /> Edit
        </MenuItem>
        <MenuItem
          disabled={!canManage}
          onClick={() => {
            setAnchor(null);
            onAssignTask(employee);
          }}
        >
          <ClipboardList size={15} style={{ marginRight: 8 }} /> Assign task
        </MenuItem>
        <MenuItem
          disabled={!canManage}
          onClick={() => {
            setAnchor(null);
            onToggleDuty(employee);
          }}
        >
          <Play size={15} style={{ marginRight: 8 }} /> {employee.onDuty ? 'Clock off' : 'Clock on'}
        </MenuItem>
        <MenuItem
          disabled={!canManage}
          onClick={() => {
            setAnchor(null);
            onToggleStatus(employee);
          }}
        >
          <Power size={15} style={{ marginRight: 8 }} /> {employee.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        </MenuItem>
      </Menu>
    </>
  );
}
